import { useState, useEffect } from 'react';
import { TopBar } from './TopBar';
import { LeftSidebar, SessionItem } from './LeftSidebar';
import { InspectorDrawer } from './InspectorDrawer';
import { ChatFeed } from '../chat/ChatFeed';
import { ChatBar } from '../chat/ChatBar';
import { DragDropOverlay } from '../chat/DragDropOverlay';
import { SettingsModal } from '../modals/SettingsModal';
import { SystemInfoModal } from '../modals/SystemInfoModal';
import { useTaskStream } from '../../hooks/useTaskStream';
import { useDragDrop } from '../../hooks/useDragDrop';
import { TaskType, TaskAttachment } from '../../types/task';

const DEFAULT_SESSIONS: SessionItem[] = [
  { id: 'sess-1', title: 'Zero-Egress Security Review', timestamp: '10m ago', mode: 'agent' },
  { id: 'sess-2', title: 'Defense Procurement RAG', timestamp: '1h ago', mode: 'rag' },
  { id: 'sess-3', title: 'Container Sandbox Jail Test', timestamp: 'Yesterday', mode: 'sandbox' },
];

interface ConsoleShellProps {
  onReturnToHero?: () => void;
}

export function ConsoleShell({ onReturnToHero }: ConsoleShellProps) {
  const [sessionName, setSessionName] = useState('Zero-Egress Session');
  const [currentSessionId, setCurrentSessionId] = useState('sess-1');
  const [currentMode, setCurrentMode] = useState<TaskType>('general');
  const [temperature, setTemperature] = useState(0.7);
  const [sandboxEnforced, setSandboxEnforced] = useState(false);
  const [userRole, setUserRole] = useState<'user' | 'auditor' | 'admin'>('user');

  // Inspector Drawer state
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSystemInfoOpen, setIsSystemInfoOpen] = useState(false);

  // External prompt state for prompt chips
  const [externalPrompt, setExternalPrompt] = useState<string | undefined>(undefined);

  // Custom task streaming hook
  const {
    messages,
    isStreaming,
    submitTask,
    cancelTask,
    clearMessages,
  } = useTaskStream();

  // Drag and drop hook
  const handleDropFiles = (files: FileList) => {
    const file = files[0];
    if (!file) return;

    // Route dropped file to active prompt context
    const type: 'document' | 'image' | 'code' =
      file.name.match(/\.(png|jpe?g|webp)$/i)
        ? 'image'
        : file.name.match(/\.(py|ts|tsx|js|json|sh)$/i)
        ? 'code'
        : 'document';

    const attachment: TaskAttachment = {
      filename: file.name,
      filePath: `/data/uploads/${file.name}`,
      fileSize: file.size,
      ocrApplied: type === 'image' || file.name.endsWith('.pdf'),
      type,
    };

    submitTask(`Analyze and inspect uploaded ${type}: ${file.name}`, currentMode, {
      attachment,
      sandbox: sandboxEnforced,
      temperature,
    });
  };

  const { isDraggingOver } = useDragDrop(handleDropFiles);

  const [sessions, setSessions] = useState<SessionItem[]>(() => {
    const saved = localStorage.getItem('sovereign_sessions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback to defaults
      }
    }
    return DEFAULT_SESSIONS;
  });

  // Sync sessions to localStorage
  useEffect(() => {
    localStorage.setItem('sovereign_sessions', JSON.stringify(sessions));
  }, [sessions]);

  // Keep session name in sync with selected session
  const handleSelectSession = (id: string) => {
    setCurrentSessionId(id);
    const matched = sessions.find((s) => s.id === id);
    if (matched) {
      setSessionName(matched.title);
      setCurrentMode(matched.mode as TaskType);
    }
  };

  const handleNewSession = () => {
    clearMessages();
    const newId = `sess-${Date.now()}`;
    const newTitle = 'New Investigation';
    setSessionName(newTitle);
    setCurrentSessionId(newId);
    setSessions((prev) => [
      { id: newId, title: newTitle, timestamp: 'Just now', mode: currentMode },
      ...prev,
    ]);
  };

  const handleDeleteSession = (idToDelete: string) => {
    setSessions((prev) => {
      const remaining = prev.filter((s) => s.id !== idToDelete);
      if (currentSessionId === idToDelete) {
        if (remaining.length > 0) {
          setCurrentSessionId(remaining[0].id);
          setSessionName(remaining[0].title);
        } else {
          const freshId = `sess-${Date.now()}`;
          const freshTitle = 'New Investigation';
          setCurrentSessionId(freshId);
          setSessionName(freshTitle);
          clearMessages();
          return [{ id: freshId, title: freshTitle, timestamp: 'Just now', mode: currentMode }];
        }
        clearMessages();
      }
      return remaining;
    });
  };

  const handleClearAllSessions = () => {
    const freshId = `sess-${Date.now()}`;
    const freshTitle = 'New Investigation';
    setCurrentSessionId(freshId);
    setSessionName(freshTitle);
    clearMessages();
    setSessions([{ id: freshId, title: freshTitle, timestamp: 'Just now', mode: currentMode }]);
  };

  const handleRenameSession = (newName: string) => {
    setSessionName(newName);
    setSessions((prev) =>
      prev.map((s) => (s.id === currentSessionId ? { ...s, title: newName } : s))
    );
  };

  const handleSelectMode = (mode: TaskType) => {
    setCurrentMode(mode);
    setSessions((prev) =>
      prev.map((s) => (s.id === currentSessionId ? { ...s, mode } : s))
    );
    if (mode === 'sandbox') {
      setSandboxEnforced(true);
    }
  };

  const handleSubmitPrompt = (prompt: string, attachment?: TaskAttachment) => {
    // If it's a new session, rename it from prompt preview if it still has default name
    if (sessionName === 'New Investigation' || sessionName === 'Zero-Egress Session') {
      const autoTitle = prompt.slice(0, 32).trim() + (prompt.length > 32 ? '...' : '');
      if (autoTitle) {
        handleRenameSession(autoTitle);
      }
    }

    submitTask(prompt, currentMode, {
      attachment,
      sandbox: sandboxEnforced,
      temperature,
    });
  };

  const handleRunCodeInSandbox = (code: string) => {
    setCurrentMode('sandbox');
    setSandboxEnforced(true);
    setIsInspectorOpen(true);
    submitTask(`Execute following code in sandbox:\n\`\`\`python\n${code}\n\`\`\``, 'sandbox', {
      sandbox: true,
      temperature: 0.1,
    });
  };

  return (
    <div className="relative h-screen w-screen flex flex-col overflow-hidden bg-[var(--bg-base)] text-[var(--text-primary)]">
      {/* Full-console Drag & Drop Overlay */}
      <DragDropOverlay isVisible={isDraggingOver} />

      {/* Top Bar per PRD Section 4.1 */}
      <TopBar
        sessionName={sessionName}
        onRenameSession={handleRenameSession}
        onNewSession={handleNewSession}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onReturnToHero={onReturnToHero}
      />

      {/* Center Console Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar per PRD Section 4.2 */}
        <LeftSidebar
          sessions={sessions}
          currentSessionId={currentSessionId}
          onSelectSession={handleSelectSession}
          onNewSession={handleNewSession}
          onDeleteSession={handleDeleteSession}
          onClearAllSessions={handleClearAllSessions}
        />

        {/* Center Chat Feed & Composer */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          <ChatFeed
            messages={messages}
            onSelectPromptChip={(prompt) => setExternalPrompt(prompt)}
            onOpenSandbox={() => {
              setCurrentMode('sandbox');
              setIsInspectorOpen(true);
            }}
            onRunCode={handleRunCodeInSandbox}
          />

          <ChatBar
            currentMode={currentMode}
            onSelectMode={handleSelectMode}
            onSubmitPrompt={handleSubmitPrompt}
            onCancelStream={cancelTask}
            isStreaming={isStreaming}
            externalPrompt={externalPrompt}
            onClearExternalPrompt={() => setExternalPrompt(undefined)}
            temperature={temperature}
            onChangeTemperature={setTemperature}
            sandboxEnforced={sandboxEnforced}
            onToggleSandboxEnforced={setSandboxEnforced}
          />
        </div>

        {/* Right Inspector Drawer per PRD Section 4.3 */}
        <InspectorDrawer
          isOpen={isInspectorOpen}
          onToggle={() => setIsInspectorOpen((prev) => !prev)}
          activeChatMode={currentMode}
        />
      </div>

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        temperature={temperature}
        onChangeTemperature={setTemperature}
        role={userRole}
        onChangeRole={setUserRole}
      />

      <SystemInfoModal
        isOpen={isSystemInfoOpen}
        onClose={() => setIsSystemInfoOpen(false)}
      />
    </div>
  );
}
