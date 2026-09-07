# Sovereign AI Workbench — Multi-Model Architecture

## 1. Architectural Overview

Sovereign AI Workbench has transitioned from a single monolithic dual-modal model to a decoupled, role-based multi-model pipeline. Each stage in the execution state machine routes to a specialized local model optimized for its specific modality and compute envelope:

| Role | Target Model | Architecture / Format | Parameters | Purpose & Responsibilities |
| :--- | :--- | :--- | :--- | :--- |
| **Orchestrator** | `Ling-3.0-tiny` (`Q4_K_M`) | Sparse MoE (bailingmoe3) | 7.9B (1.3B active/token) | Multi-step reasoning graph, RAG answer synthesis, Critic verification & self-correction loop, long-context Q&A (131K ctx). |
| **Vision** | `Qwen2.5-VL-3B-Instruct` (`Q4_K_M`) | Vision-Language | 3B | Multimodal diagram inspection, document layout understanding, image QA, and pre-reasoning image description synthesis. |
| **ASR (Audio)** | `Qwen3-ASR-1.7B` (`Q8_0`) | Audio-to-Text | 1.7B | Sovereign speech-to-text, voice memo transcription, meeting note extraction via `/v1/audio/transcriptions`. |
| **Router** | `Ling-3.0-tiny` (`IQ2_M`) | Aggressive Quant MoE | 7.9B (1.3B active/token) | Sub-second task intent pre-classification (`general`, `rag`, `agent`, `vision`, `audio`, `sandbox`) before committing full orchestrator call. |
| **Fallback Orchestrator** | `Ornith-1.5-9B` (`Q4_K_M`) | Dense Hybrid Attention | 8.95B | Configurable fallback for machines without MoE support or 262K context requirements. |

---

## 2. Decoupled Pipeline & Data Flow

```
                      ┌────────────────────────────────────────┐
                      │          User Task Request             │
                      └──────────────────┬─────────────────────┘
                                         │
                                         ▼
                      ┌────────────────────────────────────────┐
                      │          Task Intent Router            │
                      │  - Heuristic check (attachments/types) │
                      │  - Ling-3.0-tiny (IQ2_M) Pre-classifier│
                      └──────┬───────────┬────────────┬────────┘
                             │           │            │
            ┌────────────────┘           │            └───────────────┐
            │ [Audio]                    │ [Vision]                   │ [General / Agent / RAG / Sandbox]
            ▼                            ▼                            ▼
┌────────────────────────┐  ┌────────────────────────┐  ┌────────────────────────────────────┐
│      Audio Pipeline    │  │    Vision Pipeline     │  │        Attachment Ingestion        │
│   (Qwen3-ASR-1.7B)     │  │  (Qwen2.5-VL-3B)       │  │ - Audio: Transcribed by Qwen3-ASR  │
│  Extracts transcript   │  │  Direct Image QA /     │  │ - Images: Described by Qwen2.5-VL  │
│  from audio input      │  │  Layout Analysis       │  │ - Documents: OCR via Tesseract     │
└───────────┬────────────┘  └────────────┬───────────┘  └─────────────────┬──────────────────┘
            │                            │                                │
            │ (Query on audio)           │                                ▼
            └────────────────────────────┼──────────────────► ┌───────────────────────────┐
                                         │                    │     Orchestrator Core     │
                                         │                    │    (Ling-3.0-tiny Q4_K_M) │
                                         │                    │  - Agent Multi-Step Graph │
                                         │                    │  - Native Function Calling│
                                         │                    │  - Critic Verification    │
                                         │                    │  - RAG Answer Synthesis   │
                                         │                    └─────────────┬─────────────┘
                                         │                                  │
                                         ▼                                  ▼
                            ┌────────────────────────────────────────────────────────┐
                            │    Real-Time SSE Stream (Token / Reasoning / Status)   │
                            └────────────────────────────────────────────────────────┘
```

---

## 3. Text-Only Orchestration & Vision Decoupling

`Ling-3.0-tiny` is strictly text-based. The previous coupling where the primary reasoning model also handled vision weights has been replaced with clean inter-model handoffs:

1. **Non-Vision Tasks with Image Attachments:** When an image is attached to an Agent, RAG, or General query, `vision_middleware.describe_image_attachment()` calls `Qwen2.5-VL-3B` to produce a detailed textual analysis (transcribed text, diagram layout, chart values).
2. **Text-Only Orchestrator Context Injection:** This textual analysis is prepended to the prompt for `Ling-3.0-tiny`. The orchestrator reasons over visual data without loading multimodal projector weights.
3. **Pure Vision Tasks:** Explicit image QA tasks (`TaskType.VISION`) route directly to `Qwen2.5-VL-3B`.

---

## 4. Audio Processing Architecture

The new `app.audio` module mirrors `app.vision`:
- **`app/audio/asr.py` (`ASRClient`):** Communicates with `Qwen3-ASR-1.7B` over Ollama's `/v1/audio/transcriptions` endpoint (with automatic fallback to base64 `input_audio`). Strips `<asr_text>` tags and extracts clean speech text.
- **`app/audio/middleware.py` (`AudioMiddleware`):** Detects `.wav`, `.mp3`, `.m4a`, `.ogg`, `.flac`, `.aac`, `.webm` attachments, enforces size limits (50MB), and returns transcripts.
- **TaskType.AUDIO:** Direct speech-to-text queries return the transcript; contextual queries ("summarize this call") feed the transcript into `Ling-3.0-tiny` for synthesis.

---

## 5. Intent Routing Hierarchy

Routing follows a 3-tier cascade:
1. **Tier 1 (Explicit & Attachments):** Explicit `task_type` overrides, sandbox toggles, and audio/image/document file extensions route immediately with zero LLM overhead (<1ms).
2. **Tier 2 (Fast Model Pre-Classification):** Ambiguous prompts are routed via `Ling-3.0-tiny (IQ2_M)`, an aggressive 2-bit quantization running at maximum token velocity.
3. **Tier 3 (Deterministic Fallback):** If the router model times out or returns ambiguous output, keyword heuristics (`search kb`, `calculate`, `transcribe`) ensure deterministic dispatch without failure.
