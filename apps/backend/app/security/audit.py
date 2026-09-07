"""
Append-only JSONL audit logger with Ed25519 cryptographic signatures for sovereign compliance.

Records all model prompts, tool executions, and security events to an immutable
JSONL file. Each line is a self-contained JSON object signed with an Ed25519
private key to ensure cryptographic tamper-evidence and non-repudiation.
Uses aiofiles for non-blocking writes.
"""

import base64
import hashlib
import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional
from uuid import uuid4

import aiofiles
from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ed25519

from app.config import settings

logger = logging.getLogger(__name__)


class AuditSigner:
    """Manages Ed25519 keypairs for cryptographic signing and verification of audit logs."""

    def __init__(self, key_dir: Optional[Path] = None):
        self.key_dir = key_dir or Path("data/keys")
        self.private_key_path = self.key_dir / "audit_signer.pem"
        self.public_key_path = self.key_dir / "audit_signer.pub.pem"
        self._private_key: Optional[ed25519.Ed25519PrivateKey] = None
        self._public_key: Optional[ed25519.Ed25519PublicKey] = None
        self._init_keys()

    def _init_keys(self) -> None:
        """Load or generate Ed25519 signing keypair."""
        self.key_dir.mkdir(parents=True, exist_ok=True)

        if self.private_key_path.is_file():
            try:
                pem_data = self.private_key_path.read_bytes()
                self._private_key = serialization.load_pem_private_key(
                    pem_data,
                    password=None,
                )
                self._public_key = self._private_key.public_key()
                logger.info("Loaded existing Ed25519 audit signing key from %s", self.private_key_path)
                return
            except Exception as exc:
                logger.warning("Could not read existing audit private key (%s); generating new key.", exc)

        # Generate new Ed25519 keypair
        self._private_key = ed25519.Ed25519PrivateKey.generate()
        self._public_key = self._private_key.public_key()

        # Persist keys
        priv_pem = self._private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption(),
        )
        pub_pem = self._public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo,
        )

        try:
            self.private_key_path.write_bytes(priv_pem)
            self.public_key_path.write_bytes(pub_pem)
            logger.info("Generated and saved new Ed25519 audit keypair in %s", self.key_dir)
        except Exception as exc:
            logger.error("Failed to save audit keypair to disk: %s", exc)

    @property
    def public_key_hex(self) -> str:
        """Return raw public key as a 64-char hexadecimal string."""
        raw = self._public_key.public_bytes(
            encoding=serialization.Encoding.Raw,
            format=serialization.PublicFormat.Raw,
        )
        return raw.hex()

    def sign_payload(self, payload: Dict[str, Any]) -> str:
        """
        Sign canonical JSON bytes of payload with the Ed25519 private key.
        Returns base64-encoded signature.
        """
        # Ensure signature and public_key are not part of canonical digest
        clean = {k: v for k, v in payload.items() if k not in ("signature", "public_key")}
        canonical_bytes = json.dumps(clean, sort_keys=True, separators=(",", ":")).encode("utf-8")
        sig_bytes = self._private_key.sign(canonical_bytes)
        return base64.b64encode(sig_bytes).decode("utf-8")

    @staticmethod
    def verify_entry(entry: Dict[str, Any]) -> bool:
        """
        Verify the Ed25519 signature of a single audit log entry.
        Returns True if signature is valid and untampered.
        """
        sig_b64 = entry.get("signature")
        pub_hex = entry.get("public_key")
        if not sig_b64 or not pub_hex:
            return False

        try:
            sig_bytes = base64.b64decode(sig_b64)
            pub_bytes = bytes.fromhex(pub_hex)
            public_key = ed25519.Ed25519PublicKey.from_public_bytes(pub_bytes)

            clean = {k: v for k, v in entry.items() if k not in ("signature", "public_key")}
            canonical_bytes = json.dumps(clean, sort_keys=True, separators=(",", ":")).encode("utf-8")

            public_key.verify(sig_bytes, canonical_bytes)
            return True
        except (InvalidSignature, ValueError, Exception):
            return False


# Singleton audit signer
audit_signer = AuditSigner()


class AuditEvent:
    """Single audit log entry with SHA-256 prompt hash and Ed25519 digital signature."""

    __slots__ = (
        "event_id", "timestamp", "event_type", "actor",
        "prompt_hash", "details", "ip_address", "public_key", "signature",
    )

    def __init__(
        self,
        event_type: str,
        actor: str = "system",
        details: Optional[Dict[str, Any]] = None,
        prompt: Optional[str] = None,
        ip_address: Optional[str] = None,
    ):
        self.event_id = str(uuid4())
        self.timestamp = datetime.now(timezone.utc).isoformat()
        self.event_type = event_type
        self.actor = actor
        self.prompt_hash = (
            hashlib.sha256(prompt.encode("utf-8")).hexdigest()
            if prompt
            else None
        )
        self.details = details or {}
        self.ip_address = ip_address

        # Generate Ed25519 cryptographic signature
        self.public_key = audit_signer.public_key_hex
        unsigned_dict = {
            "event_id": self.event_id,
            "timestamp": self.timestamp,
            "event_type": self.event_type,
            "actor": self.actor,
            "prompt_hash": self.prompt_hash,
            "details": self.details,
            "ip_address": self.ip_address,
        }
        self.signature = audit_signer.sign_payload(unsigned_dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "event_id": self.event_id,
            "timestamp": self.timestamp,
            "event_type": self.event_type,
            "actor": self.actor,
            "prompt_hash": self.prompt_hash,
            "details": self.details,
            "ip_address": self.ip_address,
            "public_key": self.public_key,
            "signature": self.signature,
        }

    def to_json_line(self) -> str:
        return json.dumps(self.to_dict(), separators=(",", ":"))


class AuditLogger:
    """
    Append-only JSONL audit logger with Ed25519 digital signatures.

    All writes are append-only. Each log record is cryptographically signed
    at inception, guaranteeing tamper-evidence for sovereign compliance.
    """

    def __init__(self, log_path: Optional[str] = None):
        self.log_path = Path(log_path or settings.audit_log_path)
        self._ensure_directory()

    def _ensure_directory(self) -> None:
        """Create the audit log directory if it doesn't exist."""
        self.log_path.parent.mkdir(parents=True, exist_ok=True)

    async def log_event(
        self,
        event_type: str,
        actor: str = "system",
        details: Optional[Dict[str, Any]] = None,
        prompt: Optional[str] = None,
        ip_address: Optional[str] = None,
    ) -> str:
        """
        Append a cryptographically signed audit event to the JSONL log file.
        Returns the event_id of the recorded event.
        """
        event = AuditEvent(
            event_type=event_type,
            actor=actor,
            details=details,
            prompt=prompt,
            ip_address=ip_address,
        )

        try:
            async with aiofiles.open(self.log_path, mode="a", encoding="utf-8") as f:
                await f.write(event.to_json_line() + "\n")
        except Exception as exc:
            logger.error("Failed to write signed audit event: %s", exc)
            raise

        return event.event_id

    async def log_model_call(
        self,
        prompt: str,
        model: str,
        task_type: str,
        actor: str = "user",
        ip_address: Optional[str] = None,
        extra: Optional[Dict[str, Any]] = None,
    ) -> str:
        """Convenience method to log a model inference call."""
        details = {
            "model": model,
            "task_type": task_type,
            "prompt_length": len(prompt),
            **(extra or {}),
        }
        return await self.log_event(
            event_type="model_call",
            actor=actor,
            details=details,
            prompt=prompt,
            ip_address=ip_address,
        )

    async def log_tool_execution(
        self,
        tool_name: str,
        tool_input: Dict[str, Any],
        actor: str = "agent",
        ip_address: Optional[str] = None,
    ) -> str:
        """Convenience method to log a tool execution by the agent."""
        return await self.log_event(
            event_type="tool_execution",
            actor=actor,
            details={"tool_name": tool_name, "tool_input": tool_input},
            ip_address=ip_address,
        )

    async def log_security_event(
        self,
        event_subtype: str,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
    ) -> str:
        """Log a security-related event (access denied, policy violation, etc.)."""
        return await self.log_event(
            event_type=f"security.{event_subtype}",
            actor="security",
            details=details,
            ip_address=ip_address,
        )

    async def verify_log_file(self) -> Dict[str, Any]:
        """
        Verify the cryptographic integrity of every line in the audit log.
        Returns a verification summary with counts and any tampered event IDs.
        """
        if not self.log_path.is_file():
            return {
                "status": "empty",
                "total_entries": 0,
                "valid_entries": 0,
                "invalid_entries": 0,
                "tampered_ids": [],
            }

        total = 0
        valid = 0
        tampered_ids: List[str] = []

        try:
            async with aiofiles.open(self.log_path, mode="r", encoding="utf-8") as f:
                async for line in f:
                    line = line.strip()
                    if not line:
                        continue
                    total += 1
                    try:
                        entry = json.loads(line)
                        if AuditSigner.verify_entry(entry):
                            valid += 1
                        else:
                            tampered_ids.append(entry.get("event_id", f"line_{total}"))
                    except Exception:
                        tampered_ids.append(f"corrupt_line_{total}")
        except Exception as exc:
            logger.error("Audit log verification error: %s", exc)
            return {
                "status": "error",
                "error": str(exc),
                "total_entries": total,
                "valid_entries": valid,
                "invalid_entries": len(tampered_ids),
                "tampered_ids": tampered_ids,
            }

        return {
            "status": "valid" if len(tampered_ids) == 0 else "tampered",
            "total_entries": total,
            "valid_entries": valid,
            "invalid_entries": len(tampered_ids),
            "tampered_ids": tampered_ids,
        }

    async def query_log(
        self,
        event_type: Optional[str] = None,
        start_time: Optional[str] = None,
        end_time: Optional[str] = None,
        limit: int = 100,
    ) -> List[Dict[str, Any]]:
        """
        Read and filter audit log entries. Includes cryptographic validity indicator.
        """
        results: List[Dict[str, Any]] = []

        if not self.log_path.is_file():
            return results

        try:
            async with aiofiles.open(self.log_path, mode="r", encoding="utf-8") as f:
                async for line in f:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        entry = json.loads(line)
                    except json.JSONDecodeError:
                        continue

                    # Apply filters
                    if event_type and not entry.get("event_type", "").startswith(event_type):
                        continue
                    if start_time and entry.get("timestamp", "") < start_time:
                        continue
                    if end_time and entry.get("timestamp", "") > end_time:
                        continue

                    # Attach quick verification status
                    entry["signature_valid"] = AuditSigner.verify_entry(entry)
                    results.append(entry)

            # Return latest events first up to limit
            results.reverse()
            return results[:limit]
        except Exception as exc:
            logger.error("Failed to read audit log: %s", exc)

        return results


# Singleton audit logger instance
audit_logger = AuditLogger()

