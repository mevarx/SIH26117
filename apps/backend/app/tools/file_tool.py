"""
Sandboxed file reader and writer tool.

Validates that all file operations are restricted to allowed directories only.
Prevents path traversal attacks and unauthorized filesystem access.
"""

import logging
import os
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# Base directories allowed for agent file I/O operations
_DEFAULT_ALLOWED_DIRS: List[str] = [
    "data",
    "uploads",
    "tmp",
]


def _get_canonical_allowed_dirs(allowed_dirs: Optional[List[str]] = None) -> List[str]:
    """Resolve and return canonical real paths for all whitelisted directories."""
    dirs = allowed_dirs or _DEFAULT_ALLOWED_DIRS
    canonical_dirs: List[str] = []

    # Include relative to current working directory and relative to repository root
    repo_root = Path(__file__).resolve().parent.parent.parent.parent

    for d in dirs:
        p_cwd = Path.cwd() / d
        p_cwd.mkdir(parents=True, exist_ok=True)
        canonical_dirs.append(os.path.normcase(os.path.realpath(str(p_cwd))))

        p_repo = repo_root / d
        if p_repo.exists() or d in ("data", "uploads", "tmp"):
            p_repo.mkdir(parents=True, exist_ok=True)
            canonical_dirs.append(os.path.normcase(os.path.realpath(str(p_repo))))

    return list(dict.fromkeys(canonical_dirs))


def _resolve_and_validate(
    file_path: str,
    allowed_dirs: Optional[List[str]] = None,
    is_write: bool = False,
) -> Path:
    """
    Resolve the file path using os.path.realpath() to resolve all symlinks,
    and validate that the target and parent directories are strictly jailed
    to whitelisted base directories.

    Raises:
        PermissionError: If path traversal or symlink escape is detected.
        ValueError: If the path contains null bytes or illegal characters.
    """
    if not file_path or not file_path.strip():
        raise ValueError("File path cannot be empty")

    if "\0" in file_path:
        raise ValueError("Null byte detected in file path")

    # Reject obvious traversal sequences before path resolution
    norm_input = file_path.replace("\\", "/")
    parts = norm_input.split("/")
    if ".." in parts:
        raise PermissionError(f"Path traversal sequence '..' detected in path: {file_path}")

    # Canonicalize target path (resolving all symlinks)
    target_abs = os.path.abspath(file_path)
    real_path = os.path.realpath(target_abs)
    norm_real_path = os.path.normcase(real_path)

    canonical_allowed = _get_canonical_allowed_dirs(allowed_dirs)

    # Check if target canonical path is inside any allowed base directory
    inside_jail = False
    for allowed_base in canonical_allowed:
        try:
            common = os.path.commonpath([norm_real_path, allowed_base])
            if common == allowed_base:
                inside_jail = True
                break
        except ValueError:
            # Different drives on Windows (e.g. C: vs D:)
            continue

    if not inside_jail:
        raise PermissionError(
            f"Access denied: Resolved path '{real_path}' is outside whitelisted directories: {canonical_allowed}"
        )

    # For writes, also ensure parent directory does not escape through symlinks
    if is_write:
        parent_real = os.path.realpath(os.path.dirname(target_abs))
        norm_parent = os.path.normcase(parent_real)
        parent_inside_jail = False
        for allowed_base in canonical_allowed:
            try:
                common = os.path.commonpath([norm_parent, allowed_base])
                if common == allowed_base:
                    parent_inside_jail = True
                    break
            except ValueError:
                continue

        if not parent_inside_jail:
            raise PermissionError(
                f"Access denied: Target parent directory '{parent_real}' is outside whitelisted directories"
            )

    return Path(real_path)


async def read_file(
    file_path: str,
    max_size_bytes: int = 1_048_576,  # 1MB
    encoding: str = "utf-8",
) -> str:
    """
    Read a file from within allowed directories.

    Args:
        file_path: Path to the file (must be within allowed directories).
        max_size_bytes: Maximum file size to read (default 1MB).
        encoding: File encoding (default UTF-8).

    Returns:
        File contents as a string.

    Raises:
        PermissionError: If path is outside allowed directories.
        FileNotFoundError: If the file doesn't exist.
        ValueError: If the file exceeds max_size_bytes.
    """
    import asyncio

    resolved = _resolve_and_validate(file_path)

    if not resolved.is_file():
        raise FileNotFoundError(f"File not found: {file_path}")

    size = resolved.stat().st_size
    if size > max_size_bytes:
        raise ValueError(
            f"File too large: {size} bytes exceeds limit of {max_size_bytes} bytes"
        )

    content = await asyncio.to_thread(resolved.read_text, encoding)
    logger.info("Read file: %s (%d bytes)", resolved, len(content))
    return content


async def write_file(
    file_path: str,
    content: str,
    encoding: str = "utf-8",
    max_size_bytes: int = 1_048_576,
) -> bool:
    """
    Write content to a file within allowed directories.

    Args:
        file_path: Target path (must be within allowed directories).
        content: String content to write.
        encoding: File encoding (default UTF-8).
        max_size_bytes: Maximum content size (default 1MB).

    Returns:
        True if the file was written successfully.

    Raises:
        PermissionError: If path is outside allowed directories.
        ValueError: If content exceeds max_size_bytes.
    """
    import asyncio

    if len(content.encode(encoding)) > max_size_bytes:
        raise ValueError(
            f"Content too large: exceeds limit of {max_size_bytes} bytes"
        )

    resolved = _resolve_and_validate(file_path, is_write=True)

    # Ensure parent directory exists
    resolved.parent.mkdir(parents=True, exist_ok=True)

    await asyncio.to_thread(resolved.write_text, content, encoding)
    logger.info("Wrote file: %s (%d bytes)", resolved, len(content))
    return True


# Tool schemas for agent tool calling
READ_FILE_TOOL_SCHEMA: Dict[str, Any] = {
    "type": "function",
    "function": {
        "name": "read_file",
        "description": "Read the contents of a file. File must be within allowed directories (data/, uploads/, tmp/).",
        "parameters": {
            "type": "object",
            "properties": {
                "file_path": {
                    "type": "string",
                    "description": "Path to the file to read.",
                },
            },
            "required": ["file_path"],
        },
    },
}

WRITE_FILE_TOOL_SCHEMA: Dict[str, Any] = {
    "type": "function",
    "function": {
        "name": "write_file",
        "description": "Write content to a file. File must be within allowed directories (data/, uploads/, tmp/).",
        "parameters": {
            "type": "object",
            "properties": {
                "file_path": {
                    "type": "string",
                    "description": "Path to the file to write.",
                },
                "content": {
                    "type": "string",
                    "description": "The text content to write to the file.",
                },
            },
            "required": ["file_path", "content"],
        },
    },
}
