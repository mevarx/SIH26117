import { useState } from 'react';
import {
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Database,
  Upload,
  Trash2,
  FileText,
} from 'lucide-react';
import { Tooltip } from '../ui/Tooltip';
import { IngestedDoc } from '../../types/knowledge';

export interface SessionItem {
  id: string;
  title: string;
  timestamp: string;
  mode: string;
}

interface LeftSidebarProps {
  sessions: SessionItem[];
  currentSessionId: string;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  onClearAllSessions: () => void;
}

export function LeftSidebar({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onClearAllSessions,
}: LeftSidebarProps) {
  // Persist sidebar state in localStorage per PRD Section 4.2
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    const saved = localStorage.getItem('sovereign_sidebar_expanded');
    return saved !== null ? saved === 'true' : true;
  });

  const [documents, setDocuments] = useState<IngestedDoc[]>([
    {
      filename: 'defense_specs_v4.pdf',
      source_name: 'defense_specs_v4.pdf',
      file_path: '/data/docs/defense_specs_v4.pdf',
      file_size: 2450000,
      chunk_count: 84,
      created_at: 'Today',
      ocr_applied: true,
    },
    {
      filename: 'airgap_policy_standard.docx',
      source_name: 'airgap_policy_standard.docx',
      file_path: '/data/docs/airgap_policy_standard.docx',
      file_size: 420000,
      chunk_count: 19,
      created_at: 'Yesterday',
      ocr_applied: false,
    },
  ]);

  const toggleSidebar = () => {
    setIsExpanded((prev) => {
      const next = !prev;
      localStorage.setItem('sovereign_sidebar_expanded', String(next));
      return next;
    });
  };

  const handleUploadDoc = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const newDoc: IngestedDoc = {
      filename: file.name,
      source_name: file.name,
      file_path: `/data/docs/${file.name}`,
      file_size: file.size,
      chunk_count: Math.ceil(file.size / 15000),
      created_at: 'Just now',
      ocr_applied: file.name.endsWith('.pdf'),
    };
    setDocuments((prev) => [newDoc, ...prev]);
  };

  const handleDeleteDoc = (filename: string) => {
    setDocuments((prev) => prev.filter((d) => d.filename !== filename));
  };

  return (
    <aside
      style={{ width: isExpanded ? '240px' : '56px' }}
      className="h-full border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] flex flex-col transition-all duration-200 ease-out shrink-0 select-none z-10"
    >
      {/* Top Sidebar Header & Collapse Toggle */}
      <div className="h-10 px-3 flex items-center justify-between border-b border-[var(--border-subtle)] shrink-0">
        {isExpanded ? (
          <>
            <span className="text-xs font-semibold text-[var(--text-muted)]">Navigation</span>
            <button
              onClick={toggleSidebar}
              title="Collapse to Rail (56px)"
              className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--border-subtle)] transition-colors cursor-pointer"
            >
              <PanelLeftClose size={14} />
            </button>
          </>
        ) : (
          <Tooltip content="Expand Sidebar (240px)" side="right">
            <button
              onClick={toggleSidebar}
              className="w-full flex items-center justify-center p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--border-subtle)] transition-colors cursor-pointer"
            >
              <PanelLeftOpen size={15} />
            </button>
          </Tooltip>
        )}
      </div>

      {/* New Session Action */}
      <div className="p-2 border-b border-[var(--border-subtle)] shrink-0">
        {isExpanded ? (
          <button
            onClick={onNewSession}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] bg-[var(--bg-surface-quiet)] border border-[var(--border-subtle)] text-xs font-medium text-[var(--text-primary)] hover:border-[var(--border-medium)] transition-colors cursor-pointer"
          >
            <Plus size={14} className="text-[var(--text-muted)]" />
            <span>New Session</span>
          </button>
        ) : (
          <Tooltip content="New Session" side="right">
            <button
              onClick={onNewSession}
              className="w-full flex items-center justify-center h-8 rounded-[var(--radius-md)] bg-[var(--bg-surface-quiet)] border border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--border-medium)] transition-colors cursor-pointer"
            >
              <Plus size={14} />
            </button>
          </Tooltip>
        )}
      </div>

      {/* Middle Section: Session History */}
      <div className="flex-1 overflow-y-auto px-2 py-3 flex flex-col gap-1">
        {isExpanded && (
          <div className="flex items-center justify-between px-2 mb-1">
            <span className="text-[11px] font-medium text-[var(--text-muted)]">
              Session History
            </span>
            {sessions.length > 0 && (
              <button
                type="button"
                onClick={onClearAllSessions}
                title="Clear all session history"
                className="text-[10px] text-[var(--text-muted)] hover:text-[var(--status-error)] transition-colors cursor-pointer px-1 py-0.5 rounded hover:bg-[var(--border-subtle)]"
              >
                Clear all
              </button>
            )}
          </div>
        )}

        {sessions.length === 0 ? (
          isExpanded && (
            <p className="text-xs text-[var(--text-muted)] px-2 py-3 italic">
              No sessions yet — start one below.
            </p>
          )
        ) : (
          sessions.map((sess) => {
            const isSelected = sess.id === currentSessionId;
            if (!isExpanded) {
              return (
                <div key={sess.id} className="relative group w-full">
                  <Tooltip content={`${sess.title} (${sess.timestamp})`} side="right">
                    <button
                      onClick={() => onSelectSession(sess.id)}
                      className={`w-full flex items-center justify-center h-8 rounded-[var(--radius-sm)] transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[var(--border-subtle)] text-[var(--text-primary)]'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--border-subtle)]'
                      }`}
                    >
                      <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
                    </button>
                  </Tooltip>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(sess.id);
                    }}
                    title="Delete session"
                    className="absolute right-0 top-0 h-4 w-4 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--status-error)] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
                  >
                    <Trash2 size={9} />
                  </button>
                </div>
              );
            }

            return (
              <div
                key={sess.id}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[var(--radius-sm)] transition-colors group cursor-pointer ${
                  isSelected
                    ? 'bg-[var(--border-subtle)] text-[var(--text-primary)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--border-subtle)]'
                }`}
                onClick={() => onSelectSession(sess.id)}
              >
                <div className="flex flex-col flex-1 min-w-0 pr-2">
                  <span className="text-xs font-medium truncate">{sess.title}</span>
                  <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] mt-0.5">
                    <span className="capitalize">{sess.mode}</span>
                    <span>{sess.timestamp}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(sess.id);
                  }}
                  title="Delete session"
                  className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--status-error)] hover:bg-[var(--bg-surface)] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shrink-0"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Section: Knowledge Base (RAG) Manager */}
      <div className="border-t border-[var(--border-subtle)] p-2 shrink-0">
        {isExpanded ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-medium text-[var(--text-muted)] flex items-center gap-1.5">
                <Database size={12} />
                <span>Knowledge Base</span>
              </span>

              <label
                title="Ingest local document (.pdf, .docx, .txt)"
                className="cursor-pointer p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <Upload size={12} />
                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  className="hidden"
                  onChange={handleUploadDoc}
                />
              </label>
            </div>

            <div className="flex flex-col gap-1 max-h-36 overflow-y-auto pr-1">
              {documents.map((doc) => (
                <div
                  key={doc.filename}
                  className="flex items-center justify-between px-2 py-1 rounded bg-[var(--bg-surface-quiet)] text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] group transition-colors"
                >
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    <FileText size={11} className="shrink-0" />
                    <span className="truncate text-[11px]" title={doc.filename}>
                      {doc.filename}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px]">{doc.chunk_count}c</span>
                    <button
                      onClick={() => handleDeleteDoc(doc.filename)}
                      className="text-[var(--text-muted)] hover:text-[var(--status-error)] cursor-pointer"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <Tooltip content="Knowledge Base Manager" side="right">
            <div className="w-full flex items-center justify-center h-8 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer">
              <Database size={15} />
            </div>
          </Tooltip>
        )}
      </div>
    </aside>
  );
}
