export type TaskType = 'general' | 'rag' | 'agent' | 'sandbox';

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface TaskAttachment {
  filename: string;
  filePath: string;
  fileSize: number;
  charCount?: number;
  ocrApplied?: boolean;
  extractedPreview?: string;
  type?: 'document' | 'image' | 'code';
}

export interface ToolCall {
  name: string;
  params: Record<string, any>;
  result?: any;
  status?: 'pending' | 'running' | 'success' | 'failed';
  error?: string;
}

export interface TaskMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  reasoning?: string;
  toolCalls?: ToolCall[];
  status?: TaskStatus;
  taskType?: TaskType;
  timestamp: string;
  attachment?: TaskAttachment;
  durationMs?: number;
  tokensPerSec?: number;
  taskId?: string;
}

export interface TaskRequest {
  prompt: string;
  task_type: TaskType;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  sandbox?: boolean;
  attachment_path?: string;
}

export interface TaskResponse {
  task_id: string;
  status: TaskStatus;
  created_at: string;
  result?: {
    output: string;
    reasoning?: string;
    tool_calls?: ToolCall[];
    sandbox_logs?: string;
  };
}
