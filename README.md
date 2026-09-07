# MRPL Sovereign AI Workbench

### Problem Statement: **SIH26117** — Smart India Hackathon 2026

> **A self-hosted AI platform for MRPL refinery operations — all intelligence runs on your own hardware. No data ever leaves the facility.**

[![Sovereignty](https://img.shields.io/badge/Security-100%25%20Air--Gapped-00C853?style=for-the-badge)](docs/PROJECT_GUIDE.md)
[![Inference](https://img.shields.io/badge/Inference-Fully%20Local%20%2F%20On--Prem-0091EA?style=for-the-badge)](configs/models.yaml)
[![Cloud APIs](https://img.shields.io/badge/Cloud%20APIs-Zero%20External%20Calls-D50000?style=for-the-badge)](scripts/network_check.py)
[![Models](https://img.shields.io/badge/Models-Multi--Model%20Squad-6200EA?style=for-the-badge)](configs/models.yaml)

---

## What Is This Project?

```mermaid
graph LR
    PROBLEM["Industrial Plant\nChallenges"]

    PROBLEM --> P1["Hundreds of inspection\nreports to read manually"]
    PROBLEM --> P2["Strict SOP rules\nhard to cross-check"]
    PROBLEM --> P3["Scanned P&ID drawings\nno machine can read"]
    PROBLEM --> P4["Engineering calculations\ntake hours to verify"]
    PROBLEM --> P5["Confidential data\ncannot use cloud AI"]

    SOLUTION["MRPL Sovereign AI\nWorkbench"]

    P1 --> SOLUTION
    P2 --> SOLUTION
    P3 --> SOLUTION
    P4 --> SOLUTION
    P5 --> SOLUTION

    SOLUTION --> R1["AI reads & analyses\ndocuments in seconds"]
    SOLUTION --> R2["Auto-checks findings\nagainst refinery SOPs"]
    SOLUTION --> R3["Vision model reads\nscanned sheets & photos"]
    SOLUTION --> R4["Sandboxed Python runner\nverifies all calculations"]
    SOLUTION --> R5["100% offline — data\nnever leaves the facility"]

    style PROBLEM fill:#da3633,stroke:#f85149,color:#fff
    style SOLUTION fill:#238636,stroke:#2ea043,color:#fff
    style P1 fill:#161b22,stroke:#f85149,color:#ccc
    style P2 fill:#161b22,stroke:#f85149,color:#ccc
    style P3 fill:#161b22,stroke:#f85149,color:#ccc
    style P4 fill:#161b22,stroke:#f85149,color:#ccc
    style P5 fill:#161b22,stroke:#f85149,color:#ccc
    style R1 fill:#0d1117,stroke:#3fb950,color:#ccc
    style R2 fill:#0d1117,stroke:#3fb950,color:#ccc
    style R3 fill:#0d1117,stroke:#3fb950,color:#ccc
    style R4 fill:#0d1117,stroke:#3fb950,color:#ccc
    style R5 fill:#0d1117,stroke:#3fb950,color:#ccc
```

> **The #1 Rule:** Confidential MRPL data must remain inside the organisation's infrastructure at all times.

---

## Capabilities At A Glance

| # | Capability | Input | Output | Powered By |
|---|-----------|-------|--------|-----------|
| 1 | **Scanned Document Intelligence** | Scanned PDF inspection report | Verified sign-off approval note (.docx) | Vision Model + Reasoning Core |
| 2 | **SOP Knowledge Search** | Plain-English question | Cited answer from refinery manuals | RAG (Hybrid Dense + BM25) |
| 3 | **Multimodal Vision Analysis** | Equipment photo / P&ID drawing | Damage, hazard & component description | Qwen2.5-VL |
| 4 | **Sandboxed Code Execution** | Engineering calculation task | Verified Python result in isolated container | Qwen2.5-Coder + Docker |
| 5 | **Voice Note Transcription** | Field audio recording | Transcribed maintenance log | Qwen3-ASR |
| 6 | **Agentic Multi-Step Reasoning** | Complex refinery scenario | Step-by-step findings with critic loop | LangGraph + Ling-3.0 |
| 7 | **Cryptographic Audit Trail** | Any agent action | Ed25519-signed append-only ledger entry | Security Module |

---

## AI Models — All Running Locally

```mermaid
graph TB
    OLLAMA["Ollama Server\nlocalhost:11434\nRuns on YOUR hardware"]

    OLLAMA --> VIS["VISION\nQwen2.5-VL-3B"]
    OLLAMA --> REASON["REASONING\nLing-3.0-tiny / Ornith-9B"]
    OLLAMA --> CODE["CODING\nQwen2.5-Coder"]

    LOCAL["Locally Cached\nDownloaded once, no internet after"]

    LOCAL --> EMBED["EMBEDDINGS\nnomic-embed-text"]
    LOCAL --> SPEECH["SPEECH (ASR)\nQwen3-ASR-1.7B"]

    VIS --> VIS_USE["Reads scanned inspection sheets,\nequipment photos, P&ID diagrams"]
    REASON --> REASON_USE["Evaluates SOP compliance,\nassesses risk, formulates sign-offs"]
    CODE --> CODE_USE["Writes & executes verified\nengineering calculations in Docker"]
    EMBED --> EMBED_USE["Indexes refinery manuals\nfor meaning-based search"]
    SPEECH --> SPEECH_USE["Transcribes field voice notes\nfrom maintenance crews"]

    style OLLAMA fill:#1a1a2e,stroke:#e94560,color:#fff
    style LOCAL fill:#1a1a2e,stroke:#8957e5,color:#fff
    style VIS fill:#1f6feb,stroke:#388bfd,color:#fff
    style REASON fill:#e3b341,stroke:#d29922,color:#000
    style CODE fill:#f78166,stroke:#ea6045,color:#fff
    style EMBED fill:#8957e5,stroke:#a371f7,color:#fff
    style SPEECH fill:#3fb950,stroke:#56d364,color:#000
```

| Role | Model | Task | Runtime |
|------|-------|------|---------|
| Vision | `Qwen2.5-VL-3B` | Scanned page understanding, image analysis | Ollama (localhost) |
| Reasoning | `Ling-3.0-tiny` / `Ornith-9B` | SOP evaluation, risk assessment, sign-offs | Ollama (localhost) |
| Coding | `Qwen2.5-Coder` / `Ling-3.0` | Python generation, engineering calculations | Ollama (localhost) |
| Embeddings | `nomic-embed-text` | Document vectorisation for RAG | Ollama (localhost) |
| Voice (ASR) | `Qwen3-ASR-1.7B` | Field audio transcription | Local (cached) |

---

## System Architecture

```mermaid
graph TB
    USER["Refinery Engineer"]

    subgraph BROWSER["Frontend — localhost:5173"]
        UI["React Command Center Dashboard"]
    end

    subgraph SERVER["Backend — localhost:8000"]
        API["FastAPI Server"]
        ROUTER["Smart Intent Router"]

        subgraph AGENT["LangGraph Agent Loop"]
            PLANNER["Planner"]
            TOOLS["Tool Executor"]
            CRITIC["Critic / Verifier"]
        end

        subgraph STORE["Local Storage"]
            QDRANT["Qdrant Vector DB"]
            FS["File System"]
            AUDIT["Ed25519 Audit Ledger"]
        end
    end

    subgraph AI["AI Runtime — localhost:11434"]
        OLLAMA["Ollama"]
        VISION["Qwen2.5-VL"]
        LING["Ling-3.0"]
        NOMIC["nomic-embed-text"]
    end

    subgraph SEC["Security Layer"]
        GUARD["Egress Guard"]
        SANDBOX["Docker Sandbox\n--network=none"]
        NETCHECK["network_check.py"]
    end

    USER --> UI
    UI -->|HTTP| API
    API --> ROUTER
    ROUTER --> AGENT
    AGENT -->|Inference| OLLAMA
    OLLAMA --> VISION
    OLLAMA --> LING
    AGENT -->|Embed + Search| QDRANT
    QDRANT --> NOMIC
    AGENT -->|Files| FS
    AGENT -->|Sign & Log| AUDIT
    GUARD -->|Monitor| SERVER
    AGENT -->|Isolated Exec| SANDBOX
    NETCHECK -->|Verify zero-egress| SERVER

    style BROWSER fill:#0d1117,stroke:#58a6ff,color:#fff
    style SERVER fill:#161b22,stroke:#f78166,color:#fff
    style AI fill:#1a1a2e,stroke:#e94560,color:#fff
    style SEC fill:#0d1117,stroke:#3fb950,color:#fff
    style AGENT fill:#1a1a2e,stroke:#8957e5,color:#fff
    style STORE fill:#161b22,stroke:#e3b341,color:#fff
```

---

## Flow 1: Scanned Document Intelligence (Hero Demo)

> Upload a scanned inspection report → get a signed-off approval note (.docx)

```mermaid
graph TD
    S1["STEP 1\nUpload PDF Inspection Report"]
    S2["STEP 2\nPage-Type Detection\nDigital text or scanned raster?"]
    S3A["STEP 3A\nPyMuPDF Text Extraction\nfor digital pages"]
    S3B["STEP 3B\nQwen2.5-VL Vision Model\nfor scanned / raster pages"]
    S4["STEP 4\nRAG Knowledge Search\nnomic-embed-text + BM25\nMatch findings to refinery SOPs"]
    S5["STEP 5\nLing-3.0 Reasoning Core\nEvaluate compliance,\nassess risk, draft sign-off"]
    S6["STEP 6\nCritic Verification Loop\nOutput meets quality gate?"]
    S7["STEP 7\nGenerate .docx Approval Note\npython-docx"]
    S8["STEP 8\nEd25519 Signature\nAppend to audit ledger"]
    S9["STEP 9\nDownload Verified Document"]

    S1 --> S2
    S2 -->|"Digital page"| S3A
    S2 -->|"Scanned page"| S3B
    S3A --> S4
    S3B --> S4
    S4 --> S5
    S5 --> S6
    S6 -->|"Fails quality gate"| S5
    S6 -->|"Passes"| S7
    S7 --> S8 --> S9

    style S1 fill:#238636,stroke:#2ea043,color:#fff
    style S2 fill:#1f6feb,stroke:#388bfd,color:#fff
    style S3A fill:#8957e5,stroke:#a371f7,color:#fff
    style S3B fill:#8957e5,stroke:#a371f7,color:#fff
    style S4 fill:#e3b341,stroke:#d29922,color:#000
    style S5 fill:#f78166,stroke:#ea6045,color:#fff
    style S6 fill:#da3633,stroke:#f85149,color:#fff
    style S7 fill:#1f6feb,stroke:#388bfd,color:#fff
    style S8 fill:#3fb950,stroke:#56d364,color:#000
    style S9 fill:#238636,stroke:#2ea043,color:#fff
```

| Step | What Happens | Tool / Model |
|------|-------------|--------------|
| 1 | Engineer uploads scanned PDF | — |
| 2 | System detects each page: digital or scanned raster | PyMuPDF page analysis |
| 3A | Text pages: extract directly | PyMuPDF |
| 3B | Scanned pages: run through local vision model | Qwen2.5-VL-3B (Ollama) |
| 4 | Find matching SOP rules by meaning and keyword | nomic-embed-text + Qdrant BM25 |
| 5 | AI compares findings against SOP, drafts approval note | Ling-3.0 (Ollama) |
| 6 | Critic agent verifies output quality; re-tries if needed | LangGraph critic loop |
| 7 | Professional `.docx` Approval Note generated | python-docx |
| 8 | Output cryptographically signed, logged in ledger | Ed25519 (local key) |
| 9 | Engineer downloads the finished, verified document | — |

---

## Flow 2: SOP Knowledge Search

> Ask a plain-English question → get an answer grounded in your refinery manuals

```mermaid
graph TD
    Q["Engineer asks:\n'What is the safe operating\npressure for Reactor R-201?'"]

    EMBED["Vectorise question\nnomic-embed-text"]
    HYBRID["Hybrid Retrieval\nDense Vector + BM25\non local Qdrant store"]
    CHECK{"Matching\nsources found?"}
    YES["Ling-3.0 Reasoning\nGenerate answer\nciting exact pages"]
    NO["REFUSAL\n'No grounding source found\nin loaded documents'"]
    ANSWER["Answer + Source Citations\n(document name, page number)"]
    SAFE["Prevents dangerous\nhallucinated answers"]

    Q --> EMBED --> HYBRID --> CHECK
    CHECK -->|"Yes"| YES --> ANSWER
    CHECK -->|"No"| NO --> SAFE

    style Q fill:#1f6feb,stroke:#388bfd,color:#fff
    style HYBRID fill:#8957e5,stroke:#a371f7,color:#fff
    style CHECK fill:#e3b341,stroke:#d29922,color:#000
    style YES fill:#238636,stroke:#2ea043,color:#fff
    style NO fill:#da3633,stroke:#f85149,color:#fff
    style ANSWER fill:#238636,stroke:#2ea043,color:#fff
    style SAFE fill:#da3633,stroke:#f85149,color:#fff
```

> **Anti-Hallucination Policy:** If the AI cannot ground its answer in loaded refinery documents, it refuses to guess. This is non-negotiable for safety-critical environments.

---

## Flow 3: Sandboxed Code Execution

> Generate and run verified engineering calculations with zero internet access

```mermaid
graph TD
    TASK["Engineering Task\n'Calculate corrosion rate\nfor vessel V-105'"]
    GEN["Qwen2.5-Coder generates\nPython script"]
    REVIEW["Ling-3.0 Critic\nreviews code for correctness"]
    SANDBOX["Execute in Docker Sandbox\n--network=none\n--memory=512m\nNo internet, no host access"]
    RESULT["Output: Numerical result\n+ full code shown to engineer"]

    TASK --> GEN --> REVIEW --> SANDBOX --> RESULT

    style TASK fill:#1f6feb,stroke:#388bfd,color:#fff
    style GEN fill:#e3b341,stroke:#d29922,color:#000
    style REVIEW fill:#8957e5,stroke:#a371f7,color:#fff
    style SANDBOX fill:#da3633,stroke:#f85149,color:#fff
    style RESULT fill:#238636,stroke:#2ea043,color:#fff
```

| Property | Value |
|----------|-------|
| Network access inside sandbox | Blocked (`--network=none`) |
| Host filesystem access | Blocked (read-only bind mounts only) |
| Memory cap | 512 MB per execution |
| Language | Python 3 |
| Can the code leak data? | Impossible — no socket access |

---

## Security Architecture

```mermaid
graph TB
    subgraph LOCAL["YOUR HARDWARE — Security Boundary"]
        APP["FastAPI Server"]
        OLLAMA["Ollama AI Runtime"]
        QDRANT["Qdrant Vector DB"]
        FS["File System"]
        DOCKER["Docker Sandbox"]
        LEDGER["Ed25519 Audit Ledger"]
    end

    INTERNET["Internet / Cloud"]

    APP -.->|"BLOCKED"| INTERNET
    OLLAMA -.->|"BLOCKED"| INTERNET
    QDRANT -.->|"BLOCKED"| INTERNET
    DOCKER -.->|"BLOCKED"| INTERNET

    APP <-->|"127.0.0.1 only"| OLLAMA
    APP <-->|"local socket"| QDRANT
    APP <-->|"local file"| FS
    APP <-->|"local file"| LEDGER

    GUARD["Egress Guard\nHTTP client interceptor\nBlocks non-localhost calls"]
    NETCHECK["network_check.py\nScans active connections\nFlags external traffic"]

    GUARD --> APP
    NETCHECK -->|"Continuous audit"| LOCAL

    style LOCAL fill:#0d1117,stroke:#3fb950,color:#fff
    style INTERNET fill:#da3633,stroke:#f85149,color:#fff
    style GUARD fill:#238636,stroke:#2ea043,color:#fff
    style NETCHECK fill:#238636,stroke:#2ea043,color:#fff
```

| Security Feature | Status | Implementation |
|-----------------|--------|---------------|
| All AI runs locally | Verified | Ollama on `localhost:11434` |
| No cloud model calls | Verified | No OpenAI / Gemini / Claude imports |
| No external embeddings | Verified | `nomic-embed-text` served by Ollama |
| HTTP egress guard | Implemented | Intercepts and blocks non-localhost calls |
| Code sandbox isolation | Implemented | Docker `--network=none`, `--memory=512m` |
| Cryptographic audit trail | Implemented | Ed25519 keys, append-only ledger |
| Zero-egress verification script | Implemented | `python scripts/network_check.py` |

---

## Complete Data Flow — End to End

```mermaid
sequenceDiagram
    actor Engineer
    participant UI as React Dashboard
    participant API as FastAPI
    participant Router as Intent Router
    participant Agent as LangGraph Agent
    participant Vision as Qwen2.5-VL
    participant Ling as Ling-3.0
    participant Qdrant as Qdrant + RAG
    participant Sandbox as Docker Sandbox
    participant Security as Egress Guard + Ledger

    Engineer->>UI: Upload scanned PDF + submit task
    UI->>API: POST /api/tasks
    API->>Router: Classify intent
    Router->>Agent: Route to Document Agent
    Agent->>Vision: Send scanned page images
    Vision-->>Agent: Extracted text & findings
    Agent->>Qdrant: Hybrid search for matching SOPs
    Qdrant-->>Agent: Relevant SOP paragraphs + citations
    Agent->>Ling: Prompt with findings + SOP context
    Ling-->>Agent: Draft approval note
    Agent->>Agent: Critic loop — verify quality
    Agent->>Sandbox: Execute any calculations
    Sandbox-->>Agent: Verified numerical results
    Agent->>Security: Sign output with Ed25519 key
    Security->>Security: Append to audit ledger
    Security-->>Agent: Signature confirmed
    Agent-->>API: Result + .docx artifact
    API-->>UI: Task complete
    UI-->>Engineer: Show findings + download link
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React + Vite | Command center dashboard |
| Backend | Python FastAPI | REST API server |
| Agent Framework | LangGraph | Multi-step agentic loop with critic |
| Vector Database | Qdrant | Hybrid dense + BM25 document search |
| Vision Model | Qwen2.5-VL-3B (Ollama) | Scanned page & image understanding |
| Reasoning Model | Ling-3.0-tiny / Ornith-9B (Ollama) | SOP evaluation, sign-off generation |
| Coding Model | Qwen2.5-Coder (Ollama) | Engineering calculation scripts |
| Embeddings | nomic-embed-text (Ollama) | Document vectorisation for RAG |
| Speech (ASR) | Qwen3-ASR-1.7B | Offline voice note transcription |
| Document Parser | PyMuPDF | PDF text extraction |
| Document Writer | python-docx | Generate .docx approval notes |
| Code Sandbox | Docker (`--network=none`) | Isolated, safe script execution |
| Audit Security | Ed25519 (local keys) | Cryptographic output signing |

---

## Quickstart: 3 Steps

### Step 1 — Configure

```bash
cp .env.example .env
# Default is pre-configured for local Ollama:
# MODEL_BACKEND="ollama"
```

### Step 2 — Start Backend

```bash
cd apps/backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --port 8000
```

*API docs: [http://localhost:8000/docs](http://localhost:8000/docs)*

### Step 3 — Start Frontend

```bash
cd apps/frontend
npm install
npm run dev
```

*Dashboard: [http://localhost:5173](http://localhost:5173)*

---

## Air-Gap Verification

Run this at any time to confirm zero external data transmission:

```bash
python scripts/network_check.py
```

Expected result: `0 external AI calls` | `0 telemetry packets` | `100% Local Loopback`

---

## Project Layout

```text
SIH26117/
├── apps/
│   ├── backend/
│   │   └── app/
│   │       ├── agent/         # LangGraph state graph, planner, critic
│   │       ├── models/        # Ollama, MLX, vLLM adapters
│   │       ├── rag/           # Qdrant vector store + BM25 hybrid search
│   │       ├── sandbox/       # Hardened Docker runner (--network=none)
│   │       └── security/      # Ed25519 audit logging + egress guard
│   └── frontend/              # React command center
├── configs/
│   └── models.yaml            # Model role catalog and serving backends
├── docs/
│   └── PROJECT_GUIDE.md       # Primary specification (source of truth)
└── scripts/
    ├── health_check.py        # Subsystem connectivity diagnostics
    └── network_check.py       # Air-gap and zero-egress auditor
```

---

<div align="center">
  <sub>Built for <b>Mangalore Refinery and Petrochemicals Limited (MRPL)</b> — Smart India Hackathon 2026 — PS-26117</sub>
</div>
