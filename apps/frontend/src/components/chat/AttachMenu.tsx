import React, { useRef } from 'react';
import { Paperclip, FileText, Image as ImageIcon, FileCode, Mic } from 'lucide-react';
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
  const audioInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File, type: 'document' | 'image' | 'code' | 'audio') => {
    // Try uploading to backend /api/tasks/upload for instant OCR / ASR transcription
    let filePath = `/data/uploads/${file.name}`;
    let ocrApplied = type === 'image' || file.name.endsWith('.pdf');
    let asrApplied = type === 'audio';
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
          asrApplied = json.data.asr_applied ?? asrApplied;
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
      asrApplied,
      extractedPreview,
      type,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'document' | 'image' | 'code' | 'audio') => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file, type);
    }
    e.target.value = '';
  };

  const items: DropdownItem[] = [
    {
      id: 'audio',
      label: 'Audio Note (ASR)',
      description: 'WAV, MP3, M4A, OGG, FLAC',
      icon: Mic,
      onClick: () => audioInputRef.current?.click(),
    },
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
        ref={audioInputRef}
        type="file"
        accept=".wav,.mp3,.m4a,.ogg,.flac,.aac,.webm,.wma,audio/*"
        className="hidden"
        onChange={(e) => handleFileChange(e, 'audio')}
      />
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
