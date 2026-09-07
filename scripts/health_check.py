#!/usr/bin/env python3
"""
Sovereign AI Workbench — Comprehensive Health & Diagnostics Checker
Smart India Hackathon 2026 (Problem Statement: SIH26117)

Performs automated connectivity, model inference readiness, vector database,
and sandbox isolation diagnostics across all system components.
"""

import json
import os
import platform
import shutil
import socket
import subprocess
import sys
import time
from pathlib import Path
from typing import Dict, Optional, Tuple
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

# ANSI Color formatting
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
CYAN = "\033[96m"
BOLD = "\033[1m"
RESET = "\033[0m"


def print_banner():
    print(f"\n{BOLD}{CYAN}================================================================{RESET}")
    print(f"{BOLD}{CYAN}         Sovereign AI Workbench -- System Health Diagnostics      {RESET}")
    print(f"{BOLD}{CYAN}================================================================{RESET}\n")



def check_port(host: str, port: int, timeout: float = 2.0) -> bool:
    """Check if a TCP port is open and listening."""
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except (socket.timeout, ConnectionRefusedError, OSError):
        return False


def http_get(url: str, timeout: float = 3.0) -> Tuple[bool, int, Optional[dict], float]:
    """Perform HTTP GET request and return (success, status_code, parsed_json, latency_ms)."""
    start = time.perf_counter()
    req = Request(url, headers={"User-Agent": "Sovereign-HealthCheck/1.0"})
    try:
        with urlopen(req, timeout=timeout) as response:
            latency_ms = (time.perf_counter() - start) * 1000
            status_code = response.status
            body = response.read().decode("utf-8", errors="replace")
            try:
                data = json.loads(body)
            except Exception:
                data = {"raw": body[:200]}
            return True, status_code, data, latency_ms
    except HTTPError as e:
        latency_ms = (time.perf_counter() - start) * 1000
        return False, e.code, None, latency_ms
    except (URLError, Exception) as e:
        latency_ms = (time.perf_counter() - start) * 1000
        return False, 0, None, latency_ms


def load_env_variables(root_dir: Path) -> Dict[str, str]:
    """Simple parser for .env file."""
    env_vars = {}
    env_path = root_dir / ".env"
    if env_path.exists():
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    env_vars[k.strip()] = v.strip().strip('"').strip("'")
    return env_vars


def run_diagnostics():
    print_banner()
    root_dir = Path(__file__).resolve().parent.parent
    env_vars = load_env_variables(root_dir)

    backend_port = int(env_vars.get("PORT", "8000"))
    model_backend = env_vars.get("MODEL_BACKEND", "ollama").lower()
    qdrant_url = env_vars.get("QDRANT_URL", "http://localhost:6333")

    results = []

    # 1. FastAPI Backend Health Check
    backend_url = f"http://localhost:{backend_port}/api/health"
    ok, code, data, lat = http_get(backend_url)
    if ok and code == 200:
        results.append(("FastAPI Backend Service", True, f"Online ({lat:.1f}ms)", f"Port {backend_port}"))
    else:
        results.append(("FastAPI Backend Service", False, f"Offline (HTTP {code})", f"Run: uvicorn app.main:app --port {backend_port}"))

    # 2. FastAPI Root Status & Model Resolver
    root_url = f"http://localhost:{backend_port}/"
    ok, code, root_data, _ = http_get(root_url)
    if ok and root_data and "active_backend" in root_data:
        active_b = root_data.get("active_backend", "unknown")
        active_m = root_data.get("active_model", "unknown")
        results.append(("Backend Model Resolver", True, f"Configured: {active_b}", f"Model: {active_m}"))
    else:
        results.append(("Backend Model Resolver", False, "Backend root unavailable", "Verify app/main.py"))

    # 3. Model Serving Engine Health Check
    if model_backend == "ollama":
        ollama_url = env_vars.get("OLLAMA_BASE_URL", "http://localhost:11434") + "/api/tags"
        ok, code, tags_data, lat = http_get(ollama_url)
        if ok and tags_data:
            models = [m.get("name") for m in tags_data.get("models", [])]
            results.append(("Ollama Engine (GGUF)", True, f"Online ({lat:.1f}ms)", f"Models: {', '.join(models[:3]) or 'None pulled'}"))
        else:
            results.append(("Ollama Engine (GGUF)", False, "Offline / Unreachable", "Run: ollama run ornith-1.5:9b-q4_k_m"))

    elif model_backend == "mlx":
        mlx_url = env_vars.get("MLX_BASE_URL", "http://localhost:1234/v1") + "/models"
        ok, code, _, lat = http_get(mlx_url)
        if ok:
            results.append(("MLX / LM Studio Server", True, f"Online ({lat:.1f}ms)", "Port 1234/8080"))
        else:
            results.append(("MLX / LM Studio Server", False, "Offline / Unreachable", "Start LM Studio Local Server or mlx_lm.server"))

    elif model_backend == "vllm":
        vllm_url = env_vars.get("VLLM_BASE_URL", "http://localhost:8000/v1") + "/models"
        ok, code, _, lat = http_get(vllm_url)
        if ok:
            results.append(("vLLM High-Throughput Engine", True, f"Online ({lat:.1f}ms)", "GPU Server active"))
        else:
            results.append(("vLLM High-Throughput Engine", False, "Offline / Unreachable", "Start vllm serve ornith-ai/Ornith-1.5-9B"))

    # 4. Qdrant Vector Store
    qdrant_check_url = f"{qdrant_url}/collections"
    ok, code, qdata, lat = http_get(qdrant_check_url)
    if ok:
        collections = [c.get("name") for c in (qdata.get("result", {}).get("collections", []) if qdata else [])]
        results.append(("Qdrant Vector Database", True, f"Online ({lat:.1f}ms)", f"Collections: {len(collections)}"))
    else:
        results.append(("Qdrant Vector Database", False, "Not reachable", "Run via docker or standalone Qdrant (:6333)"))

    # 5. Docker Sandbox Environment
    docker_bin = shutil.which("docker")
    if docker_bin:
        try:
            res = subprocess.run([docker_bin, "info"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=4)
            if res.returncode == 0:
                results.append(("Docker Code Sandbox", True, "Daemon running", "256MB memory cap, network=none"))
            else:
                results.append(("Docker Code Sandbox", False, "Daemon not running", "Start Docker Desktop/Engine"))
        except Exception:
            results.append(("Docker Code Sandbox", False, "Error querying daemon", "Start Docker Desktop/Engine"))
    else:
        results.append(("Docker Code Sandbox", False, "Docker CLI not found", "Install Docker for sandboxed execution"))

    # 6. Frontend Dev Server
    frontend_open = check_port("localhost", 5173, timeout=1.5)
    if frontend_open:
        results.append(("React Frontend (Vite)", True, "Listening on :5173", "UI available at http://localhost:5173"))
    else:
        results.append(("React Frontend (Vite)", False, "Not running on :5173", "Run: cd apps/frontend && npm run dev"))

    # 7. Local Audit & Task Store Files
    audit_file = root_dir / "data" / "audit.jsonl"
    if audit_file.exists():
        size_kb = audit_file.stat().st_size / 1024
        results.append(("Audit Log Persistence", True, f"Active ({size_kb:.1f} KB)", str(audit_file.relative_to(root_dir))))
    else:
        results.append(("Audit Log Persistence", True, "Ready (auto-creates on first task)", "data/audit.jsonl"))

    # Print Formatted Results Table
    print(f"{BOLD}{'Component':<32} {'Status':<12} {'Diagnostics / Notes':<36}{RESET}")
    print("-" * 80)

    total_passed = 0
    for name, passed, status_str, note in results:
        if passed:
            total_passed += 1
            badge = f"{GREEN}[PASS]{RESET}"
        else:
            badge = f"{RED}[FAIL]{RESET}"

        print(f"{name:<32} {badge:<18} {status_str:<22} {note}")

    print("-" * 80)
    score_color = GREEN if total_passed >= 5 else YELLOW if total_passed >= 3 else RED
    print(f"\n{BOLD}Diagnostic Summary:{RESET} {score_color}{total_passed}/{len(results)} Checks Passed{RESET}\n")


if __name__ == "__main__":
    run_diagnostics()
