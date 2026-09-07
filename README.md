# Sovereign AI Workbench (SIH 2026 - Problem Statement SIH26117)

A modular, sovereign, and model-agnostic AI execution platform developed for the **Smart India Hackathon 2026 (SIH26117)**. Designed for defense, government, and high-security enterprise environments, the workbench operates completely air-gapped with zero external telemetry and zero data leakage.

The platform provides autonomous multi-step agents, Reciprocal Rank Fusion Hybrid RAG, multimodal computer vision with automated image compression, isolated Docker sandbox code execution, tamper-evident cryptographic audit trails, and a tactical command center frontend with native Server-Sent Events (SSE) streaming.

---

## Key Platform Capabilities

- **Local & Sovereign Intelligence:** 100% air-gapped execution on local hardware (consumer CPUs, Apple Silicon MacBooks, or dedicated GPU servers).
- **Specialized Multi-Model Architecture:** Dedicated local models optimized for specific roles and modalities:
  - **Orchestrator & Reasoning:** `Ling-3.0-tiny` (Q4_K_M) — Sparse MoE (7.9B total / 1.3B active per token), 131K context window, native function calling, and switchable thinking traces.
  - **Multimodal Vision:** `Qwen2.5-VL-3B-Instruct` (Q4_K_M) — Dedicated 3B vision tower for image QA, diagram analysis, and pre-reasoning attachment description.
  - **Speech Recognition (ASR):** `Qwen3-ASR-1.7B` (Q8_0) — Local speech-to-text and voice memo transcription via OpenAI-compatible `/v1/audio/transcriptions`.
  - **Fast Intent Router:** `Ling-3.0-tiny` (IQ2_M) — High-velocity 2-bit quantization for sub-second intent classification (`general`, `rag`, `agent`, `vision`, `audio`, `sandbox`).
  - **Fallback Core:** `Ornith-1.5-9B` (Q4_K_M) — Configurable fallback for machines without MoE support.
- **Autonomous Agent Graph with Critic Loop:** Multi-step reasoning loop with tool-call bundling, automated Critic verification & self-correction loop, deterministic tool dispatch (`calculator`, `document_tool`, `file_tool`, `sandbox`), and `<think>` reasoning trace extraction.
- **Glass Box Hybrid RAG & Citations:** Semantic vector search (Qdrant) fused with BM25 keyword matching via Reciprocal Rank Fusion (RRF, $k=60$) with explainable Citations inspector visualizing Vector, BM25, and RRF scores.
- **Strictly Isolated Sandbox:** Hardened container execution with `--memory=256m`, `--memory-swap=256m` (zero swap), `--network=none`, `--rm`, `--read-only`, and `--pids-limit=64`. Insecure host execution fallback permanently eliminated; supports Linux `bwrap` or fail-secure rejection.
- **Ed25519 Cryptographic Audit Trail:** Append-only JSONL cryptographic log (`data/audit.jsonl`) signing every entry with Ed25519 asymmetric signatures for non-repudiation, SHA-256 prompt hashing, and log tamper verification.
- **High-Performance Command Center UI:** React 19 + TypeScript frontend with `@microsoft/fetch-event-source` line-buffering, `react-virtuoso` message list virtualization, `requestAnimationFrame` token update batching (eliminating UI jank), and `react-markdown` + `rehype-highlight` syntax-highlighted code blocks and tables.

---

## Multi-Model Roles Overview

| Role | Model | Tag / Format | Parameters | Key Responsibilities |
| :--- | :--- | :--- | :--- | :--- |
| **Orchestrator** | `Ling-3.0-tiny` | `hf.co/bloomer010/Ling-3.0-tiny-GGUF:Q4_K_M` | 7.9B (1.3B active) | Multi-step agent graph, tool dispatch, critic verification, RAG synthesis, general chat (131K ctx) |
| **Vision** | `Qwen2.5-VL-3B` | `hf.co/unsloth/Qwen2.5-VL-3B-Instruct-GGUF:Q4_K_M` | 3B | Image QA, diagram reasoning, document layout analysis, attachment description |
| **ASR** | `Qwen3-ASR-1.7B` | `hf.co/ggml-org/Qwen3-ASR-1.7B-GGUF:Q8_0` | 1.7B | Sovereign speech-to-text, voice memo transcription |
| **Router** | `Ling-3.0-tiny` | `hf.co/bloomer010/Ling-3.0-tiny-GGUF:IQ2_M` | 7.9B (1.3B active) | Fast intent classification and pipeline dispatch |
| **Fallback** | `Ornith-1.5-9B` | `ornith-1.5:9b-q4_k_m` | 8.95B | Optional fallback behind configuration toggle |

---

## Project Architecture

```text
SIH 2026 (DEMO-SIH26117)/
├── apps/
│   ├── backend/
│   │   ├── app/
│   │   │   ├── agent/                 # Autonomous agent orchestration
│   │   │   │   ├── events.py          # Agent streaming event models
│   │   │   │   ├── graph.py           # Multi-step reasoning & tool execution graph
│   │   │   │   ├── router.py          # Intent & pipeline router
│   │   │   │   └── state.py           # Agent memory & step state
│   │   │   ├── api/                   # REST & SSE API layer
│   │   │   │   ├── routes/
│   │   │   │   │   ├── health.py      # Health check endpoint (/api/health)
│   │   │   │   │   ├── knowledge.py   # RAG upload, query & collection stats
│   │   │   │   │   ├── security.py    # Audit trail & egress status
│   │   │   │   │   └── tasks.py       # Task dispatch, polling & SSE stream
│   │   │   │   └── router.py          # Central route registry
│   │   │   ├── config.py              # Dynamic settings & endpoint resolver
│   │   │   ├── main.py                # FastAPI entrypoint, CORS & lifespan
│   │   │   ├── models/                # Model-agnostic client layer
│   │   │   │   ├── base.py            # BaseModelClient, ChatMessage, GenerationRequest
│   │   │   │   ├── local_client.py    # Universal OpenAI-compatible pooling client
│   │   │   │   ├── ollama.py          # Persistent socket-safe Ollama lifecycle client
│   │   │   │   ├── registry.py        # Role-based model registry & client factory
│   │   │   │   └── vision.py          # Pillow-optimized multimodal serializer
│   │   │   ├── rag/                   # Hybrid RAG pipeline
│   │   │   │   ├── embeddings.py      # Batched embedding generator (batch size 32)
│   │   │   │   ├── ingest.py          # Async document chunking & Qdrant ingestion
│   │   │   │   ├── retriever.py       # Hybrid Vector + BM25 Reciprocal Rank Fusion
│   │   │   │   └── vector_store.py    # Qdrant client & collection manager
│   │   │   ├── sandbox/               # Isolated code execution
│   │   │   │   ├── docker_runner.py   # Async subprocess Docker container runner
│   │   │   │   └── limits.py          # Strict resource limits (--memory=256m, --network=none)
│   │   │   ├── schemas/               # Pydantic v2 DTOs with memory safety constraints
│   │   │   │   ├── events.py          # SSE streaming event schemas (Token, Reasoning, Tool)
│   │   │   │   ├── response.py        # Standardized APIResponse envelope
│   │   │   │   └── tasks.py           # TaskRequest, TaskResponse, TaskStatus, TaskType
│   │   │   ├── security/              # Zero-Trust security & auditability
│   │   │   │   ├── audit.py           # Append-only cryptographic JSONL logger
│   │   │   │   ├── network.py         # Outbound egress firewall guard
│   │   │   │   └── policy.py          # Role-based action & tool authorization
│   │   │   ├── tools/                 # Agent tools
│   │   │   │   ├── calculator.py      # Deterministic math tool (ast + Decimal, no eval)
│   │   │   │   ├── document_tool.py   # PDF / DOCX / TXT excerpt search
│   │   │   │   └── file_tool.py       # Sandboxed file reader and writer
│   │   │   └── vision/                # Computer vision & OCR
│   │   │       ├── image.py           # Async image resizing & contrast enhancement
│   │   │       ├── middleware.py      # Multimodal vision middleware (Pillow downscale & base64 injection)
│   │   │       ├── ocr.py             # Tesseract OCR engine with PyMuPDF fallback
│   │   │       └── pdf.py             # Async PyMuPDF renderer and metadata parser
│   │   ├── Dockerfile
│   │   └── requirements.txt           # Pinned backend dependencies
│   └── frontend/                      # React 19 + TypeScript + Vite UI
│       ├── src/
│       │   ├── components/            # UI components (ChatFeed, MessageItem, CitationsTab, etc.)
│       │   ├── hooks/                 # Throttled SSE streaming hooks (useTaskStream via RAF)
│       │   ├── types/                 # TypeScript contracts (Task, Knowledge, Citations)
│       │   ├── App.tsx                # Tactical workbench with native SSE stream reader
│       │   ├── index.css              # Dark sovereign command center design system & syntax highlighting
│       │   └── main.tsx               # Root entrypoint
│       ├── index.html
│       ├── package.json
│       ├── tsconfig.json
│       └── vite.config.ts             # Dev server with backend proxy to :8000
├── configs/
│   └── models.yaml                    # Serving backends, model catalog & hardware specs
├── data/                              # Local persistence (tasks.jsonl, audit.jsonl)
├── docs/                              # Architecture, security, and demo specs
├── .env.example                       # Centralized environment template with MODEL_BACKEND switch
├── brain.md                           # System blueprint and architectural log
├── docker-compose.yml                 # Multi-service container orchestration
└── README.md                          # Project documentation
```

---

## Local Serving Setup: Choose Your Engine

Teammates can run on different hardware without modifying application code. Set `MODEL_BACKEND` in your `.env` file to match your machine:

```env
# Choose: 'ollama' (CPU/GGUF) | 'mlx' (Apple Silicon) | 'vllm' (GPU Server)
MODEL_BACKEND="ollama"
```

---

### Path 1: GGUF / Ollama (Universal CPU & Low-VRAM Laptops)

Recommended for team members running on Windows, Linux, or CPU-only laptops without a dedicated GPU.

#### 1. Launch with Ollama
```bash
# Pull and start the quantized Ornith-1.5-9B GGUF model
ollama run ornith-1.5:9b-q4_k_m
```

#### 2. (Optional) Enable Vision with `mmproj`
To enable multimodal vision in Ollama:
1. Download `Ornith-1.5-9B-Q4_K_M.gguf` and `mmproj-Ornith-1.5-9B-f16.gguf`.
2. Create a `Modelfile`:
   ```dockerfile
   FROM ./Ornith-1.5-9B-Q4_K_M.gguf
   ADAPTER ./mmproj-Ornith-1.5-9B-f16.gguf
   ```
3. Build the model:
   ```bash
   ollama create ornith-1.5:9b-q4_k_m -f Modelfile
   ```

#### 3. Verify Ollama Endpoint
```bash
curl http://localhost:11434/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "ornith-1.5:9b-q4_k_m",
    "messages": [
      {"role": "user", "content": "Hello! Explain what 14 * 16 is."}
    ]
  }'
```

---

### Path 2: MLX (Apple Silicon MacBooks)

Recommended for team members running on Apple Silicon (M1/M2/M3/M4) for unified memory acceleration.

#### Option A: Via LM Studio
1. Open **LM Studio** on macOS.
2. Search and download `ornith-ai/Ornith-1.5-9B-MLX`.
3. Navigate to the **Local Server** tab and click **Start Server** on port `1234`.

#### Option B: Via `mlx-lm` CLI
```bash
pip install mlx-lm
python -m mlx_lm.server --model "ornith-ai/Ornith-1.5-9B-MLX" --port 8080
```

#### Verify MLX Endpoint
```bash
curl http://localhost:1234/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "ornith-ai/Ornith-1.5-9B-MLX",
    "messages": [
      {"role": "user", "content": "Hello! Explain what 14 * 16 is."}
    ]
  }'
```

---

### Path 3: vLLM (Dedicated GPU Server)

For high-throughput serving on an NVIDIA GPU server with concurrency optimizations:
```bash
vllm serve "ornith-ai/Ornith-1.5-9B" \
  --port 8000 \
  --enable-auto-tool-choice \
  --tool-call-parser qwen3_xml \
  --reasoning-parser qwen3 \
  --max-model-len 32768 \
  --gpu-memory-utilization 0.90 \
  --enable-chunked-prefill
```

---

## Quickstart Guide

### 1. Configure Environment
```bash
cp .env.example .env
```
Edit `.env` to select your backend (`MODEL_BACKEND="ollama"`, `"mlx"`, or `"vllm"`).

### 2. Set Up & Run the Backend
```bash
cd apps/backend
python -m venv venv

# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

- **Interactive API Documentation:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Root Status Endpoint:** `GET http://localhost:8000/`
- **Health Check Endpoint:** `GET http://localhost:8000/api/health`

### 3. Set Up & Run the Frontend
In a separate terminal:
```bash
cd apps/frontend
npm install
npm run dev
```

- **Command Center UI:** [http://localhost:5173](http://localhost:5173)

---

## Primary API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Root status, app version, active backend, and active model |
| `GET` | `/api/health` | Service health status check |
| `POST` | `/api/tasks` | Submit task for background execution (`general`, `rag`, `agent`, `vision`, `sandbox`) |
| `GET` | `/api/tasks` | List recent tasks with optional status filter |
| `GET` | `/api/tasks/{task_id}` | Fetch task status, execution duration, and structured output |
| `DELETE` | `/api/tasks/{task_id}` | Cancel pending or running task |
| `GET` | `/api/tasks/{task_id}/stream` | Server-Sent Events (SSE) stream for real-time tokens and reasoning traces |
| `POST` | `/api/knowledge/ingest` | Upload and ingest document (`.pdf`, `.docx`, `.txt`) into Qdrant |
| `POST` | `/api/knowledge/query` | Perform hybrid vector + BM25 search over ingested documents |
| `GET` | `/api/knowledge/status` | Vector collection statistics and points count |
| `GET` | `/api/security/audit` | Query cryptographic append-only audit trail (`data/audit.jsonl`) |
| `GET` | `/api/security/status` | Air-gap verification and outbound network egress compliance status |

---

## Tech Stack Summary

| Layer | Technologies |
| :--- | :--- |
| **Backend Framework** | Python 3.10+, FastAPI, Uvicorn, Pydantic v2, Pydantic-Settings |
| **Model Inference** | HTTP connection pooling, SSE streaming, `<think>` parser, `httpx` |
| **Local Foundation Model** | `ornith-ai/Ornith-1.5-9B` (Ollama GGUF / MLX / vLLM) |
| **Vector Store & Retrieval** | Qdrant, `rank-bm25` (BM25Okapi), Reciprocal Rank Fusion ($k=60$) |
| **Document & Vision** | Pillow (multimodal pipeline & compression), PyMuPDF (`fitz`), `python-docx`, Tesseract OCR |
| **Security & Auditing** | `cryptography` (Ed25519 digital signatures), `aiofiles`, strict `os.path.realpath` directory jailing, egress firewall |
| **Sandbox Execution** | Docker CLI container runner with memory (`--memory=256m --memory-swap=256m`), dropped caps, Linux `bwrap` support, and fail-secure rejection |
| **Frontend UI** | React 19, TypeScript, Vite, `@microsoft/fetch-event-source`, `react-virtuoso`, `react-markdown`, `rehype-highlight`, `remark-gfm`, Lucide Icons |
