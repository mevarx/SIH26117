# Sovereign AI Workbench — Security Architecture & Threat Model

**Project:** Sovereign AI Workbench  
**Problem Statement:** SIH26117 (Smart India Hackathon 2026)  
**Security Posture:** Air-Gapped, Zero-Trust, Zero Data Leakage  
**Classification:** Defense & High-Security Enterprise Standard  

---

## 1. Security Philosophy & Threat Model

The Sovereign AI Workbench is architected under the principle of **Zero-Trust Sovereign Execution**. It assumes that the host environment may operate within a strictly isolated, classified, or air-gapped facility where:
- **No outbound Internet connectivity is permitted** (zero cloud telemetry, zero remote tracking).
- **Generated code must be treated as untrusted** and executed in hermetically sealed sandboxes.
- **Audit trails must be cryptographically immutable** and provably tamper-evident.
- **Model reasoning must be protected from resource exhaustion and injection attacks.**

---

## 2. Threat Vector Defense Matrix

| Threat Vector | Potential Impact | Workbench Mitigation & Implementation |
| :--- | :--- | :--- |
| **Data Exfiltration / Phone-Home** | Classified data leaked to external servers via telemetry or third-party APIs. | **Air-gap enforcement & EgressGuard**: Outbound traffic blocked; local binding strictly on `127.0.0.1`. Verification via `scripts/network_check.py`. |
| **Sandbox Breakout / Host Escape** | Malicious generated code exploiting host privileges to access files or compromise system. | **Hardened Docker / Bubblewrap isolation**: `--network=none`, `--memory=256m`, `--memory-swap=256m` (zero swap), `--pids-limit=64`, `--read-only`. Insecure host fallback (`sys.executable -I`) permanently removed. |
| **Path Traversal / Arbitrary File Access** | Path manipulation (`../`, null bytes, symlinks) reading sensitive OS files (`/etc/passwd`, system keys). | **Strict Canonical Realpath Jailing**: `apps/backend/app/tools/file_tool.py` uses `os.path.realpath()`, `os.path.normcase()`, and `os.path.commonpath()` restricted strictly to whitelisted directories (`data/`, `uploads/`, `tmp/`). |
| **Audit Log Tampering / Repudiation** | An adversary or compromised process altering logs to erase traces of unauthorized actions. | **Ed25519 Asymmetric Digital Signatures**: Every record in `data/audit.jsonl` is canonically serialized (`sort_keys=True`) and signed with a private Ed25519 key (`data/keys/audit_signer.pem`). SHA-256 hashes of prompts and outputs ensure byte-level tamper detection. |
| **Decompression Bomb (Zip/Image Bomb)** | Extremely large or nested files crashing backend workers via memory exhaustion. | **Pillow Pixel Bounds**: `Image.MAX_IMAGE_PIXELS = 25_000_000` enforced in `vision/middleware.py`. Images automatically downscaled to 1024px with Lanczos resampling and compressed to JPEG. |
| **Memory Exhaustion (DoS)** | Excessive prompt length or huge arbitrary JSON objects exhausting system RAM. | **Pydantic Validation Ceilings**: Strict Pydantic v2 validators capping prompts to 50,000 characters, file attachments to 20 paths, audio uploads to 50MB, and arbitrary dicts (`context`, `parameters`, `metadata`) to max 50 keys. |
| **Multimodal Payload Exploits** | Corrupted or adversarial image payloads attacking text reasoning weights. | **Decoupled Vision Handoff**: `Ling-3.0-tiny` is text-only. Visual inspection is handled by `Qwen2.5-VL-3B`, which extracts text descriptions before passing to the orchestrator, preventing image-weight poisoning. |

---

## 3. Cryptographic Audit Trail (Ed25519)

### 3.1 Digital Signing Architecture

Audit logging in `apps/backend/app/security/audit.py` operates as an append-only, digitally signed ledger (`data/audit.jsonl`):

```
┌───────────────────────────────────────────────────────────┐
│                      Log Entry Event                      │
│ - Timestamp (UTC ISO-8601)                                │
│ - Event Type (model_call / tool_call / task_execution)    │
│ - SHA-256 Prompt Hash                                     │
│ - Execution Latency & Model Identifier                    │
└─────────────────────────────┬─────────────────────────────┘
                              │
                              ▼
┌───────────────────────────────────────────────────────────┐
│              Canonical JSON Serialization                 │
│              (sort_keys=True, compact UTF-8)              │
└─────────────────────────────┬─────────────────────────────┘
                              │
                              ▼
┌───────────────────────────────────────────────────────────┐
│            Ed25519 Asymmetric Digital Signing             │
│            Key: data/keys/audit_signer.pem                │
└─────────────────────────────┬─────────────────────────────┘
                              │
                              ▼
┌───────────────────────────────────────────────────────────┐
│             Appended Signed Audit Record                  │
│ {"signature": "<hex>", "public_key": "<hex>", ...}        │
└───────────────────────────────────────────────────────────┘
```

### 3.2 Verification and Tamper Detection

To verify the integrity of the audit trail at any time:
```python
from app.security.audit import audit_logger

# Verify all records in data/audit.jsonl
results = audit_logger.verify_log_file()
print(f"Total entries: {results['total_entries']}")
print(f"Valid signatures: {results['valid_entries']}")
print(f"Tampered records: {results['invalid_entries']}")
```
Any modification, deletion, or reordering of bytes invalidates the corresponding Ed25519 signature.

---

## 4. Sandboxed Code Execution Isolation

The Docker code runner (`apps/backend/app/sandbox/docker_runner.py`) provides multi-layered defenses for executing model-generated scripts:

```bash
docker run \
  --rm \
  --network=none \
  --memory=256m \
  --memory-swap=256m \
  --pids-limit=64 \
  --read-only \
  --volume <temp_dir>:/workspace:rw \
  --workdir /workspace \
  python:3.11-slim python script.py
```

### Defense Rules:
1. **`--network=none`**: Disables all virtual ethernet adapters. The container cannot communicate with the local host, other containers, or the network.
2. **`--memory=256m` and `--memory-swap=256m`**: Enforces a strict 256MB memory cap. Setting swap equal to memory completely disables Linux swap paging, preventing memory exhaustion attacks.
3. **`--pids-limit=64`**: Restricts the maximum number of processes/threads to 64, rendering fork bombs harmless.
4. **`--read-only`**: The container root filesystem is immutable. File operations are confined to an ephemeral scratch directory that is wiped upon exit.
5. **Fail-Secure Fallback**: If Docker is unavailable, the system checks for Linux `bwrap` (bubblewrap). If neither is available, execution is rejected with a fatal error rather than unsafely executing on the host.

---

## 5. Path Traversal & Symlink Jail

All filesystem tools in `apps/backend/app/tools/file_tool.py` implement strict canonical path resolution:

```python
# Canonical resolution preventing ../ escapes and symlink redirection
canonical_path = os.path.realpath(requested_path)
common_dir = os.path.commonpath([canonical_path, allowed_root])

if common_dir != allowed_root:
    raise PermissionError("Access denied: path escapes allowed workspace directory")
```

- **Null Byte Injection (`\0`)**: Automatically rejected.
- **Symlink Attacks**: Symlinks pointing outside permitted roots (`data/`, `uploads/`, `tmp/`) are resolved to their target destination and blocked.

---

## 6. Multi-Model Security Boundaries

The Sovereign AI Workbench isolates distinct data types into segregated model pipelines:

1. **Text-Only Orchestrator**: `Ling-3.0-tiny` handles core reasoning and tool calling without multimodal vision weights.
2. **Vision Pre-Processing**: Image attachments are inspected by `Qwen2.5-VL-3B`. Only synthesized textual descriptions are forwarded to the orchestrator, preventing multimodal injection attacks.
3. **Audio Ingestion**: Audio files are validated for size (max 50MB) and format before passing to `Qwen3-ASR-1.7B`. Only validated text transcripts enter the agent graph.

---

## 7. Automated Operational Security Auditing

The repository includes automated security verification scripts in `scripts/`:

```bash
# Verify air-gap network posture, loopback binding, and zero-egress status
python scripts/network_check.py

# Verify system services, models, and Docker container security
python scripts/health_check.py
```
