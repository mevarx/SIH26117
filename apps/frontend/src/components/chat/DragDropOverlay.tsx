import { UploadCloud } from 'lucide-react';

interface DragDropOverlayProps {
  isVisible: boolean;
}

export function DragDropOverlay({ isVisible }: DragDropOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none p-6 flex items-center justify-center bg-black/60 backdrop-blur-xs transition-opacity duration-150">
      <div className="w-full h-full rounded-[var(--radius-xl)] border-2 border-dashed border-[var(--accent)] bg-[rgba(var(--accent-rgb),0.04)] flex flex-col items-center justify-center gap-3 animate-in fade-in-50 zoom-in-95">
        <div className="p-4 rounded-full bg-[var(--accent-muted)] text-[var(--accent)] shadow-lg">
          <UploadCloud size={36} strokeWidth={1.75} />
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-base font-semibold text-[var(--text-primary)]">
            Drop to attach
          </span>
          <span className="text-xs text-[var(--text-muted)]">
            Auto-routes documents, images (OCR), and code files into air-gapped context
          </span>
        </div>
      </div>
    </div>
  );
}
