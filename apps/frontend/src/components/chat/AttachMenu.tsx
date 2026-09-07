import React, { useRef } from 'react';
import { Paperclip, FileText, Image as ImageIcon, FileCode } from 'lucide-react';
import { DropdownMenu, DropdownItem } from '../ui/DropdownMenu';
import { TaskAttachment } from '../../types/task';

interface AttachMenuProps {
  onAttachFile: (attachment: TaskAttachment) => void;
  isUploading?: boolean;
}

export function AttachMenu({ onAttachFile, isUploading = false }: AttachMenuProps) {
  const docInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File, type: 'document' | 'image' | 'code') => {
    // Try uploading to backend /api/tasks/upload for instant OCR
    let filePath = `/data/uploads/${file.name}`;
    let ocrApplied = type === 'image' || file.name.endsWith('.pdf');
    let extractedPreview = '';

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/tasks/upload', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          filePath = json.data.file_path || filePath;
          ocrApplied = json.data.ocr_applied ?? ocrApplied;
          extractedPreview = json.data.extracted_text || '';
        }
      }
    } catch {
      // Local fallback
    }

    onAttachFile({
      filename: file.name,
      filePath,
      fileSize: file.size,
      ocrApplied,
      extractedPreview,
      type,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'document' | 'image' | 'code') => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file, type);
    }
    e.target.value = '';
  };

  const items: DropdownItem[] = [
    {
      id: 'doc',
      label: 'Document',
      description: 'PDF, DOCX, TXT',
      icon: FileText,
      onClick: () => docInputRef.current?.click(),
    },
    {
      id: 'image',
      label: 'Image (OCR)',
      description: 'PNG, JPG, WEBP',
      icon: ImageIcon,
      onClick: () => imageInputRef.current?.click(),
    },
    {
      id: 'code',
      label: 'Code file',
      description: 'PY, TS, JSON, SH',
      icon: FileCode,
      onClick: () => codeInputRef.current?.click(),
    },
  ];

  return (
    <>
      <input
        ref={docInputRef}
        type="file"
        accept=".pdf,.docx,.txt"
        className="hidden"
        onChange={(e) => handleFileChange(e, 'document')}
      />
      <input
        ref={imageInputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.webp"
        className="hidden"
        onChange={(e) => handleFileChange(e, 'image')}
      />
      <input
        ref={codeInputRef}
        type="file"
        accept=".py,.ts,.tsx,.js,.json,.sh,.yaml,.md"
        className="hidden"
        onChange={(e) => handleFileChange(e, 'code')}
      />

      <DropdownMenu
        trigger={
          <button
            type="button"
            disabled={isUploading}
            title="Attach file by type"
            className="p-1.5 rounded-[var(--radius-sm)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--border-subtle)] transition-colors cursor-pointer select-none"
          >
            <Paperclip size={15} />
          </button>
        }
        items={items}
        align="start"
        side="top"
      />
    </>
  );
}
