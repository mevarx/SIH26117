"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import {
  ImageIcon,
  FileUp,
  ArrowUpIcon,
  Paperclip,
  Code2,
  Shield,
  Lock,
} from "lucide-react";

interface AutoResizeProps {
  minHeight: number;
  maxHeight?: number;
}

function useAutoResizeTextarea({ minHeight, maxHeight }: AutoResizeProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      if (reset) {
        textarea.style.height = `${minHeight}px`;
        return;
      }

      textarea.style.height = `${minHeight}px`;
      const newHeight = Math.max(
        minHeight,
        Math.min(textarea.scrollHeight, maxHeight ?? Infinity)
      );
      textarea.style.height = `${newHeight}px`;
    },
    [minHeight, maxHeight]
  );

  useEffect(() => {
    if (textareaRef.current) textareaRef.current.style.height = `${minHeight}px`;
  }, [minHeight]);

  return { textareaRef, adjustHeight };
}

interface RuixenMoonChatProps {
  onSendMessage?: (message: string) => void;
  onSelectPromptChip?: (prompt: string) => void;
}

export default function RuixenMoonChat({
  onSendMessage,
  onSelectPromptChip,
}: RuixenMoonChatProps) {
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 48,
    maxHeight: 150,
  });

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed) return;
    if (onSendMessage) {
      onSendMessage(trimmed);
    } else if (onSelectPromptChip) {
      onSelectPromptChip(trimmed);
    }
    setMessage("");
    adjustHeight(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleActionClick = (promptText: string) => {
    if (onSelectPromptChip) {
      onSelectPromptChip(promptText);
    } else {
      setMessage(promptText);
      adjustHeight();
      textareaRef.current?.focus();
    }
  };

  return (
    <div
      className="relative w-full h-full min-h-[500px] bg-cover bg-center flex flex-col items-center justify-between px-4 overflow-y-auto"
      style={{
        backgroundImage:
          "url('https://cdn.21st.dev/assets/mirror/c3/c333918af688a4a8a3d004652e6c0ee219457a9d84d380eeb31f513d4b59a09f.png')",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Background dark overlay to ensure readability */}
      <div className="absolute inset-0 bg-black/40 backdrop-brightness-75 pointer-events-none" />

      {/* Centered AI Title */}
      <div className="relative z-10 flex-1 w-full flex flex-col items-center justify-center pt-10 pb-6 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-black/60 border border-white/10 text-xs text-white/80 font-mono mb-4 backdrop-blur-md">
          <Lock size={12} className="text-[var(--accent)]" />
          <span>SOVEREIGN PERIMETER • 0 EGRESS</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-semibold text-white drop-shadow-md tracking-tight">
          Seva AI
        </h1>
        <p className="mt-3 text-sm sm:text-base text-neutral-200 max-w-md drop-shadow">
          Build something amazing — sovereign reasoning, sandboxing, and hybrid retrieval.
        </p>
      </div>

      {/* Input Box Section */}
      <div className="relative z-10 w-full max-w-3xl pb-12 sm:pb-16">
        <div className="relative bg-black/65 backdrop-blur-md rounded-2xl border border-white/15 shadow-2xl transition-all focus-within:border-white/30">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              adjustHeight();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type your request or ask anything..."
            className={cn(
              "w-full px-4 py-3.5 resize-none border-none",
              "bg-transparent text-white text-sm",
              "focus-visible:ring-0 focus-visible:ring-offset-0",
              "placeholder:text-neutral-400 min-h-[48px]"
            )}
            style={{ overflow: "hidden" }}
          />

          {/* Footer Buttons */}
          <div className="flex items-center justify-between px-3 py-2.5 border-t border-white/10">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-neutral-300 hover:text-white hover:bg-white/10 rounded-lg h-8 w-8"
              >
                <Paperclip className="w-4 h-4" />
                <span className="sr-only">Attach File</span>
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    setMessage((prev) => (prev ? `${prev} [Attached: ${f.name}]` : `Analyze file: ${f.name}`));
                  }
                }}
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSend}
                disabled={!message.trim()}
                title={message.trim() ? "Send message" : "Type a message to send"}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 border select-none",
                  message.trim()
                    ? "bg-[var(--accent)] text-black border-[var(--accent)] hover:brightness-110 shadow-lg cursor-pointer active:scale-95"
                    : "bg-[#22242D] text-neutral-400 border-white/20 hover:text-neutral-300 hover:border-white/30 cursor-not-allowed"
                )}
              >
                <span>Send</span>
                <ArrowUpIcon className={cn("w-3.5 h-3.5 stroke-[2.5]", message.trim() ? "text-black" : "text-neutral-400")} />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center justify-center flex-wrap gap-2.5 mt-5">
          <QuickAction
            icon={<Shield className="w-4 h-4 text-emerald-400" />}
            label="Audit Zero-Egress"
            onClick={() => handleActionClick("Verify loopback network firewall policies and audit for any outbound egress leaks.")}
          />
          <QuickAction
            icon={<Code2 className="w-4 h-4 text-[var(--accent)]" />}
            label="Sandboxed Code"
            onClick={() => handleActionClick("Execute a Python script with strict memory bounds and zero network access.")}
          />
          <QuickAction
            icon={<FileUp className="w-4 h-4 text-teal-400" />}
            label="Query Knowledge Base"
            onClick={() => handleActionClick("Query indexed defense procurement files and summarize security protocols.")}
          />
          <QuickAction
            icon={<ImageIcon className="w-4 h-4 text-cyan-400" />}
            label="Multimodal Vision"
            onClick={() => handleActionClick("Analyze document scan with local Vision-Language model (Qwen2.5-VL).")}
          />
          <QuickAction
            icon={<Lock className="w-4 h-4 text-amber-400" />}
            label="Verify Ed25519 Audit"
            onClick={() => handleActionClick("Verify Ed25519 cryptographic signatures on SHA-256 system audit log chain.")}
          />
        </div>
      </div>
    </div>
  );
}

interface QuickActionProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}

function QuickAction({ icon, label, onClick }: QuickActionProps) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      className="flex items-center gap-2 rounded-full border border-white/10 bg-black/50 text-neutral-200 hover:text-white hover:bg-neutral-800/80 backdrop-blur-md px-3.5 py-1.5 h-auto text-xs transition-colors cursor-pointer"
    >
      {icon}
      <span>{label}</span>
    </Button>
  );
}
