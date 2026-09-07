# Sovereign AI Workbench — Frontend Feature Blueprint & Specification

See the comprehensive frontend blueprint and component architecture in [FRONTEND.md](file:///d:/CODING/SIH%202026/apps/frontend/FRONTEND.md).

### Summary of Modules
1. **Top Navigation Bar**: Air-gap status, model selector, execution mode tabs (`General`, `RAG`, `Agent`, `Sandbox`), session controls, system health flyout, settings.
2. **Interactive Chatbox**: Auto-expanding textarea, file attachment with local OCR (`.pdf`, `.docx`, `.png`), Docker sandbox jail toggle, send & stop/cancel streaming buttons.
3. **Chat Feed & Execution Display**: Collapsible `<think>` reasoning accordion, agent tool execution cards with parameters & results, syntax-highlighted code blocks with "Run in Sandbox" action, and cryptographic SHA-256 task audit footer.
4. **Left Sidebar**: Workbench brand, session/task history, and Knowledge Base (RAG) document manager.
5. **Right Inspector Drawer**: Live Cryptographic Audit Trail (`/api/security/audit`), Docker Sandbox Console (`--network=none`, RAM/PID meters), and Hybrid RAG Search Inspector (`/api/knowledge/query`).
6. **Modals & Flyouts**: Inference hyperparameters, air-gap diagnostics, and document OCR preview.
