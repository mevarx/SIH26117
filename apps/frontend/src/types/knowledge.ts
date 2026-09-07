export interface RetrievedChunk {
  chunk_id?: string;
  source: string;
  content?: string;
  text?: string;
  vector_score?: number;
  bm25_score?: number;
  score?: number;
  dense_score?: number;
  sparse_score?: number;
  combined_score?: number;
  page?: number;
  chunk_index?: number;
  metadata?: Record<string, any>;
}

export interface IngestedDoc {
  filename: string;
  source_name: string;
  file_path: string;
  file_size: number;
  chunk_count: number;
  created_at: string;
  ocr_applied?: boolean;
}
