#!/usr/bin/env python3
"""
Sovereign AI Workbench — Automated System Setup & Environment Bootstrapper
Smart India Hackathon 2026 (Problem Statement: SIH26117)

Verifies prerequisites, prepares local directories, configures .env from template,
and bootstraps backend and frontend dependencies. Designed to run using Python's
standard library alone with zero external dependencies.
"""

import os
import platform
import shutil
import subprocess
import sys
from pathlib import Path

# ANSI Terminal Color Helpers
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
CYAN = "\033[96m"
BOLD = "\033[1m"
RESET = "\033[0m"


def log_header(title: str):
    print(f"\n{BOLD}{CYAN}=== {title} ==={RESET}")


def log_ok(msg: str):
    print(f"  {GREEN}[OK]{RESET} {msg}")


def log_warn(msg: str):
    print(f"  {YELLOW}[WARN]{RESET} {msg}")


def log_error(msg: str):
    print(f"  {RED}[ERROR]{RESET} {msg}")


def log_info(msg: str):
    print(f"  {CYAN}[INFO]{RESET} {msg}")



def check_python_version() -> bool:
    log_header("Checking Python Environment")
    ver = sys.version_info
    print(f"  Current Python: {ver.major}.{ver.minor}.{ver.micro} ({platform.python_implementation()})")
    if ver.major < 3 or (ver.major == 3 and ver.minor < 10):
        log_error("Python 3.10 or higher is required.")
        return False
    log_ok("Python version meets requirement (>= 3.10).")
    return True


def check_node_npm() -> bool:
    log_header("Checking Node.js & npm (Frontend)")
    node_cmd = shutil.which("node")
    npm_cmd = shutil.which("npm")

    if not node_cmd:
        log_warn("Node.js not found in PATH. Frontend development server requires Node.js v18+.")
        return False

    try:
        node_ver = subprocess.check_output([node_cmd, "-v"], text=True).strip()
        npm_ver = subprocess.check_output([npm_cmd, "-v"], text=True).strip() if npm_cmd else "unknown"
        log_ok(f"Node.js found: {node_ver} (npm: {npm_ver})")
        return True
    except Exception as e:
        log_warn(f"Failed to check Node version: {e}")
        return False


def setup_directories(root_dir: Path):
    log_header("Initializing Local Storage & Working Directories")
    dirs = [
        root_dir / "data",
        root_dir / "uploads",
        root_dir / "logs",
        root_dir / "tmp",
    ]
    for d in dirs:
        d.mkdir(parents=True, exist_ok=True)
        log_ok(f"Ensured directory: {d.relative_to(root_dir)}/")


def setup_env_file(root_dir: Path):
    log_header("Configuring Environment (.env)")
    env_file = root_dir / ".env"
    env_example = root_dir / ".env.example"

    if env_file.exists():
        log_ok(".env file already exists.")
    elif env_example.exists():
        shutil.copyfile(env_example, env_file)
        log_ok("Created .env from .env.example with default Ollama configuration.")
    else:
        log_warn(".env.example not found; skipping .env creation.")


def check_optional_tools():
    log_header("Checking Optional System Tools")

    # 1. Docker
    docker_cmd = shutil.which("docker")
    if docker_cmd:
        try:
            res = subprocess.run([docker_cmd, "--version"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            if res.returncode == 0:
                log_ok(f"Docker available: {res.stdout.strip()} (Enables isolated sandbox)")
            else:
                log_warn("Docker CLI found, but daemon may not be running.")
        except Exception:
            log_warn("Docker CLI check failed.")
    else:
        log_warn("Docker not found. The sandbox module will fallback to host execution if invoked.")

    # 2. Ollama
    ollama_cmd = shutil.which("ollama")
    if ollama_cmd:
        log_ok("Ollama CLI detected. You can run 'ollama run ornith-1.5:9b-q4_k_m'.")
    else:
        log_info("Ollama CLI not detected. (You can still run via remote/local server, MLX, or vLLM).")

    # 3. Tesseract OCR
    tesseract_cmd = shutil.which("tesseract")
    if tesseract_cmd:
        log_ok(f"Tesseract OCR detected: {tesseract_cmd}")
    else:
        log_info("Tesseract OCR not detected in PATH. (PyMuPDF fallback will be used for PDF text extraction).")


def prompt_install_dependencies(root_dir: Path):
    log_header("Dependencies Installation")

    # Backend
    backend_req = root_dir / "apps" / "backend" / "requirements.txt"
    if backend_req.exists():
        print(f"\nInstall backend Python requirements ({backend_req})?")
        choice = input("Run 'pip install -r apps/backend/requirements.txt'? [y/N]: ").strip().lower()
        if choice in ("y", "yes"):
            print(f"Running: {sys.executable} -m pip install -r {backend_req} ...")
            subprocess.run([sys.executable, "-m", "pip", "install", "-r", str(backend_req)])

    # Frontend
    frontend_dir = root_dir / "apps" / "frontend"
    if (frontend_dir / "package.json").exists():
        print(f"\nInstall frontend npm packages in {frontend_dir.name}/?")
        choice = input("Run 'npm install' in apps/frontend? [y/N]: ").strip().lower()
        if choice in ("y", "yes"):
            npm_cmd = shutil.which("npm")
            if npm_cmd:
                print(f"Running: npm install in {frontend_dir} ...")
                subprocess.run([npm_cmd, "install"], cwd=str(frontend_dir), shell=(platform.system() == "Windows"))
            else:
                log_error("npm command not found in PATH.")


def main():
    root_dir = Path(__file__).resolve().parent.parent

    print(f"\n{BOLD}{GREEN}======================================================{RESET}")
    print(f"{BOLD}{GREEN}      Sovereign AI Workbench — Initializer Setup      {RESET}")
    print(f"{BOLD}{GREEN}======================================================{RESET}")
    print(f"Repository Root: {root_dir}")

    if not check_python_version():
        sys.exit(1)

    check_node_npm()
    setup_directories(root_dir)
    setup_env_file(root_dir)
    check_optional_tools()

    if "--non-interactive" not in sys.argv:
        prompt_install_dependencies(root_dir)

    print(f"\n{BOLD}{GREEN}Setup completed successfully!{RESET}")
    print("\nNext steps to launch Sovereign AI Workbench:")
    print(f"  1. Start local model engine: {CYAN}ollama run ornith-1.5:9b-q4_k_m{RESET}")
    print(f"  2. Start backend server:     {CYAN}cd apps/backend && uvicorn app.main:app --reload --port 8000{RESET}")
    print(f"  3. Start frontend UI:        {CYAN}cd apps/frontend && npm run dev{RESET}")
    print(f"  4. Verify system health:     {CYAN}python scripts/health_check.py{RESET}\n")


if __name__ == "__main__":
    main()
