import { useRef } from 'react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { TaskMessage } from '../../types/task';
import { MessageItem } from './MessageItem';
import RuixenMoonChat from './RuixenMoonChat';

interface ChatFeedProps {
  messages: TaskMessage[];
  onSubmitPrompt?: (prompt: string) => void;
  onSelectPromptChip: (prompt: string) => void;
  onOpenSandbox?: () => void;
  onRunCode?: (code: string) => void;
}

export function ChatFeed({
  messages,
  onSubmitPrompt,
  onSelectPromptChip,
  onOpenSandbox,
  onRunCode,
}: ChatFeedProps) {
  const virtuosoRef = useRef<VirtuosoHandle>(null);

  if (messages.length === 0) {
    return (
      <RuixenMoonChat
        onSelectPromptChip={onSelectPromptChip}
        onSendMessage={(msg) => (onSubmitPrompt ? onSubmitPrompt(msg) : onSelectPromptChip(msg))}
      />
    );
  }

  return (
    <div className="flex-1 w-full flex flex-col bg-[#06060C] overflow-hidden">
      <Virtuoso
        ref={virtuosoRef}
        data={messages}
        followOutput="auto"
        className="h-full w-full custom-scrollbar"
        itemContent={(_index, message) => (
          <div className="mx-auto w-full max-w-3xl px-4 sm:px-8">
            <MessageItem
              key={message.id}
              message={message}
              onOpenSandbox={onOpenSandbox}
              onRunCode={onRunCode}
            />
          </div>
        )}
      />
    </div>
  );
}

