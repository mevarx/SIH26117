# Sovereign AI Workbench — Frontend Feature Blueprint & Specification

**Project:** Sovereign AI Workbench  
**Hackathon:** Smart India Hackathon 2026 (Problem Statement: SIH26117)  
**Target Environment:** Air-gapped, zero-trust, high-security enterprise/defense AI workbench  
**Tech Stack:** React 19, TypeScript, Vite, Vanilla CSS / Modern Glassmorphic Design System, Lucide Icons  

---

## 1. Top Navigation Bar (Header Elements)

The navigation bar serves as the mission-control header for security, model status, and high-level routing.

| Element | Component Type | Behavior & Purpose | Visual / State Cues |
| :--- | :--- | :--- | :--- |
| **Brand Identity** | Logo + Title | Displays `Sovereign AI Workbench` and SIH-26117 problem badge. | Shield icon with glowing cyan/indigo accent. |
| **Air-Gap Security Badge** | Status Pill / Badge | Real-time indication of network isolation from `/api/security/status`. | Green pulsing dot with `AIR-GAP ACTIVE (0 Egress)` or Amber warning if egress checks fail. |
| **Backend & Model Selector** | Dropdown / Pill | Shows active inference engine (`Ollama`, `Local Client`) and model (e.g. `ornith-1.5:9b`). | Model tag, VRAM footprint tooltip, latency badge. |
| **Execution Mode Tabs** | Segmented Tab Switcher | Switches workbench mode: `General Chat`, `Document RAG`, `Autonomous Agent`, `Docker Sandbox`. | Active tab highlighted with subtle glass glow; updates prompt hints and inspector panel context. |
| **Session Control** | Action Button (`New Chat`) | Clears conversation state, generates a new session ID, resets attachment states. | Plus icon (`+ New Session`), confirmation tooltip. |
| **Security Audit Button** | Drawer Toggle | Toggles the right-side Cryptographic SHA-256 Audit Log inspector. | Shield icon with unread audit count badge. |
| **System Health & Telemetry** | Popover / Modal Trigger | Displays backend health (`/api/health`), Docker socket status, Qdrant vector store connection. | Pulse / Activity heartbeat icon with green/red status. |
| **Settings / Controls** | Modal Trigger | Opens inference configuration: temperature slider (0.0–1.0), max tokens, context window limit, user role (`user`, `auditor`, `admin`). | Sliders / Cog icon. |
| **Panel Collapse Toggles** | Icon Buttons | Collapses or expands Left Sidebar (Sessions & Knowledge) and Right Inspector Drawer. | Left/Right panel toggle icons (`PanelLeftClose`, `PanelRightClose`). |

---

## 2. Interactive Chatbox & Input Controls

The prompt input console supports multimodal interaction, document ingestion, and execution constraints.

| Element | Component Type | Behavior & Details |
| :--- | :--- | :--- |
| **Multi-line Auto-expanding Textarea** | Dynamic Input Field | Auto-resizes up to 200px height. Submits on `Enter`, creates new line on `Shift + Enter`. Placeholder updates dynamically based on the selected execution mode. |
| **Document / File Attachment Button** | Upload Trigger (`Paperclip`) | Triggers native file picker accepting `.pdf`, `.docx`, `.txt`, `.csv`, `.png`, `.jpg`. Uploads immediately to `/api/tasks/upload` for local OCR and parsing. |
| **Document Attachment Preview Chip** | Removable Pill | Displayed above or inside the input box when a file is attached. Shows: filename, file size (KB/MB), character count, and `OCR Applied` badge. Includes a close `(×)` button to detach. |
| **Docker Sandbox Enforcement Toggle** | Quick Switch / Pill | Allows toggling strict container jail (`--network=none`, 256MB RAM, 64 PIDs) directly from the input bar before running Python/Bash code. |
| **Mode Quick Pills** | Radio Chips | Quick-select buttons for `General`, `RAG`, `Agent`, `Sandbox` placed right at the prompt input bar for frictionless switching. |
| **Send / Submit Button** | Action Button (`Send`) | Submits prompt to `POST /api/tasks`. Disables while empty or uploading. |
| **Stop / Cancel Stream Button** | Action Button (`Stop / Square`) | Replaces the Send button during SSE streaming. Sends `DELETE /api/tasks/{task_id}` to immediately abort execution. |
| **Voice / Speech-to-Text Button** *(Optional Future)* | Audio Input Trigger | For air-gapped local Whisper STT transcription. |
| **Quick Prompt Template Chips** | Starter Action Buttons | Displayed when chat is empty: *"Audit loopback network egress"*, *"Query defense procurement PDF"*, *"Run sandboxed data analysis script"*, *"Explain zero-trust air-gap architecture"*. |

---

## 3. Chat Feed & Message Components

The chat display handles rich agent state, streaming text, collapsible reasoning, and tool executions.

| Element | Component Type | Specification |
| :--- | :--- | :--- |
| **User Message Bubble** | Message Card | Distinct glassmorphic styling, timestamp, avatar/role tag. Shows any attached document cards if sent with the prompt. |
| **Assistant Message Bubble** | Streamed Response Card | Renders live markdown, typography, copy buttons, and status indicator (`running`, `completed`, `failed`). |
| **Live SSE Streaming Cursor** | Typewriter Indicator | Animated blinking caret at the tail of streaming tokens. |
| **Reasoning Chain Accordion (`<think>`)** | Collapsible Section | Parses DeepSeek/Qwen `<think>...</think>` tags or backend `ReasoningEvent`. Displays collapsible accordion titled *"Analytical Reasoning (X steps)"* with subtle dimmed background so the user can inspect internal chain-of-thought without cluttering the primary answer. |
| **Agent Tool Execution Cards** | Step/Tool Cards | Displays each tool invoked by the autonomous agent: <br>• **Tool Header:** Name (`calculator`, `docker_runner`, `document_tool`) and status badge (`Running`, `Success`, `Blocked by Policy`).<br>• **Parameters Drawer:** Expandable JSON viewer showing input arguments.<br>• **Execution Result:** Live output preview or error summary. |
| **Code Block with Sandbox Runner** | Code Highlight Card | Syntax-highlighted code with header bar showing language (Python, Bash, JSON), a **Copy Code** button, and an integrated **"Run in Sandbox"** button that dispatches the code directly into the Docker sandbox. |
| **Task Cryptographic Footer** | Metadata Row | Displays task execution time (e.g. `1.24s`), token speed (`34.2 t/s`), and immutable SHA-256 Task ID link that highlights the matching entry in the Audit Log. |

---

## 4. Left Sidebar (Navigation & Knowledge Management)

A collapsible left-hand navigation pane for session history, knowledge bases, and quick status.

| Element | Component Type | Features |
| :--- | :--- | :--- |
| **Workbench Branding** | Header Section | App title, version tag (`v0.1.0`), and quick collapse button. |
| **New Session Button** | Primary Action Button | Starts a fresh session with clean context. |
| **Conversation / Task History** | Scrollable List | Chronological list of past tasks/sessions fetched from `/api/tasks`. Shows prompt snippet, task mode tag (`RAG`, `Sandbox`, `Agent`), timestamp, and status icon. Clicking loads the past session. |
| **Knowledge Base (RAG) Manager** | Accordion / List | Section to manage ingested documents: <br>• **Upload Document Button** (posts to `/api/knowledge/ingest`).<br>• **Document List** showing indexed files, chunk counts, and file formats.<br>• **Delete / Re-index Button** for individual document sources. |
| **Security Status Indicator Widget** | Bottom Panel | Compact card displaying loopback status, zero outbound leaks, and last audit log hash. |

---

## 5. Right Inspector Drawer (Context-Sensitive Panes)

A multi-tab drawer on the right side of the screen providing deep observability into what the local AI is doing.

### Tab A: Cryptographic Audit Trail (`/api/security/audit`)
- **Live Stream View:** Displays append-only SHA-256 event log entries.
- **Entry Details:** Timestamp, Event Type (`task_created`, `tool_executed`, `egress_blocked`, `file_accessed`), Actor Role (`user`, `agent`, `system`), and cryptographic SHA-256 hash.
- **Filter Controls:** Filter by event type, date/time range, or search string.
- **Export Button:** Download audit trail as verifiable `.jsonl` or `.csv`.

### Tab B: Docker Sandbox Console
- **Terminal Display:** Dark-themed terminal screen displaying stdout/stderr from `DockerSandboxRunner`.
- **Resource Gauges:** Visual progress bars for:
  - RAM usage against 256MB ceiling.
  - PID count against 64 max processes.
  - Execution timeout countdown (30s max).
- **Network Isolation Badge:** Permanent indicator of `--network=none`.

### Tab C: Hybrid RAG Search Inspector (`/api/knowledge/query`)
- **Query Tester:** Search box to test semantic + BM25 keyword search directly.
- **Retrieved Chunks List:** Displays retrieved text chunks, source file name, page/line number, and Reciprocal Rank Fusion (RRF) score.
- **Score Breakdown:** Visual dense vector similarity score vs BM25 sparse keyword score.

---

## 6. Modals & Overlay Flyouts

| Modal | Elements & Controls |
| :--- | :--- |
| **Inference & Model Settings** | • **Model Selector:** Choose between registered models (`configs/models.yaml`).<br>• **Temperature Slider:** Continuous slider (0.0 = Deterministic, 1.0 = Creative).<br>• **Top-K & Top-P Sliders:** Fine-tune sampling and context retrieval.<br>• **System Prompt Editor:** Customize instructions for the autonomous agent.<br>• **Role Switcher:** Switch between `user`, `auditor`, and `admin` to test policy permissions. |
| **System Diagnostics & Air-Gap Telemetry** | • **Egress Audit:** Result of network probe (confirming external IPs 1.1.1.1, 8.8.8.8 are strictly blocked).<br>• **Hardware Telemetry:** CPU load, RAM usage, GPU VRAM (if available).<br>• **Service Health:** FastAPI status, Ollama service status, Qdrant vector database connectivity. |
| **Document Ingestion & OCR Preview** | Displays parsed content from uploaded documents before committing to the prompt, showing extracted text and OCR confidence score. |

---

## 7. Recommended Component File Hierarchy

When rebuilding the frontend with a clean, modular structure, use the following layout:

```text
apps/frontend/src/
├── components/
│   ├── chat/
│   │   ├── ChatBox.tsx               # Textarea, upload button, send/stop buttons, mode chips
│   │   ├── ChatFeed.tsx              # Scrollable message history list
│   │   ├── MessageItem.tsx           # Individual message card (user / assistant)
│   │   ├── ReasoningAccordion.tsx    # Collapsible <think> reasoning chain
│   │   ├── ToolExecutionCard.tsx     # Agent tool call status and output card
│   │   └── CodeBlock.tsx             # Syntax-highlighted code block with "Run in Sandbox"
│   ├── layout/
│   │   ├── Navbar.tsx                # Air-gap badge, model badge, mode tabs, actions
│   │   ├── LeftSidebar.tsx           # Session history, knowledge base document list
│   │   └── InspectorDrawer.tsx       # Right drawer (Audit Trail, Docker Terminal, RAG inspector)
│   ├── inspector/
│   │   ├── AuditTrailTab.tsx         # Cryptographic SHA-256 audit log viewer
│   │   ├── SandboxConsoleTab.tsx     # Docker live output and resource meters
│   │   └── RagInspectorTab.tsx       # Hybrid search and chunk viewer
│   ├── modals/
│   │   ├── SettingsModal.tsx         # Model hyperparameters & role policy selector
│   │   ├── SystemInfoModal.tsx       # Diagnostics & air-gap telemetry
│   │   └── DocumentPreviewModal.tsx  # Document text & OCR preview
│   └── ui/                           # Reusable UI primitives (Buttons, Badges, Tabs, Sliders)
├── hooks/
│   ├── useTaskStream.ts              # SSE stream consumer for /api/tasks/{id}/stream
│   ├── useAuditLogs.ts               # Polling & querying /api/security/audit
│   └── useServerHealth.ts            # Periodic health & air-gap status checker
├── types/
│   ├── task.ts                       # TaskRequest, TaskResponse, SSE events (Token, Step, Reasoning)
│   ├── security.ts                   # AuditEntry, SecurityStatus, Policy
│   └── knowledge.ts                  # RetrievedChunk, IngestResult
├── App.tsx                           # Master workbench layout linking navbar, sidebar, chat & inspector
├── index.css                         # Sleek dark-mode glassmorphic design system tokens
└── main.tsx                          # React 19 root mount
```

---

## 8. Backend API Route Mapping Reference

All frontend components communicate with the FastAPI backend through the following verified endpoints:

- **Health:** `GET /api/health`
- **Tasks & Execution:**
  - `POST /api/tasks` (Dispatch general, rag, agent, or sandbox task)
  - `GET /api/tasks` (List recent tasks)
  - `GET /api/tasks/{task_id}` (Fetch task details)
  - `DELETE /api/tasks/{task_id}` (Cancel active task)
  - `GET /api/tasks/{task_id}/stream` (Server-Sent Events: token, reasoning, tool_call, status)
  - `POST /api/tasks/upload` (Upload file for instant local OCR and text extraction)
- **Knowledge & RAG:**
  - `POST /api/knowledge/query` (Hybrid dense + BM25 keyword search)
  - `POST /api/knowledge/ingest` (Ingest PDF, DOCX, TXT into Qdrant collection)
- **Security & Zero-Trust:**
  - `GET /api/security/status` (Air-gap verification & egress guard telemetry)
  - `GET /api/security/audit` (Query immutable SHA-256 JSONL audit trail)
  - `GET /api/security/policies` (Check permissions for role)
