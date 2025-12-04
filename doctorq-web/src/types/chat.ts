// Tipos para o sistema de chat

export interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
  timestamp: string;
  isStreaming?: boolean;
  attachedFiles?: SelectedFile[]; // Arquivos anexados à mensagem
  tools?: string[]; // Tools utilizadas para gerar a resposta
  sources?: Array<{ // Fontes/documentos utilizados (RAG)
    filename: string;
    chunk_id?: string;
    chunk_index?: string;
  }>;
}

export interface SelectedFile {
  id: string;
  file: File;
  status: "pending" | "uploading" | "processed" | "error";
  processedContent?: string;
  error?: string;
  size: number;
  type: string;
}

export interface UploadStatus {
  isUploading: boolean;
  progress: number;
  errors: string[];
  totalFiles: number;
  processedFiles: number;
}

export interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles: number;
  disabled: boolean;
  acceptedTypes: string[];
  maxFileSize: number; // em bytes
}

export interface FileListProps {
  files: SelectedFile[];
  onRemoveFile: (fileId: string) => void;
  uploadStatus: UploadStatus;
  showProgress?: boolean;
}

export interface ProcessedFileResponse {
  success: boolean;
  message: string;
  processing_info: {
    filename: string;
    format: string;
    limits_applied: {
      MAX_TEXT_LENGTH: number;
      MAX_JSON_SIZE: number;
      MAX_PROCESSING_TIME: number;
    };
    content_truncated: boolean;
  };
  data: {
    content: string;
    metadata?: any;
    format: string;
  };
}

export interface ChatWithFilesRequest {
  message: string;
  conversation_token: string;
  files: File[];
  output_format?: string;
}

// Tipos de arquivo permitidos baseados no DoclingProcessor
export const ALLOWED_FILE_TYPES = [
  ".pdf",
  ".docx",
  ".txt",
  ".md",
  ".html",
  ".htm",
  ".pptx",
  ".xlsx",
  ".doc",
  // Imagens
  ".jpg",
  ".jpeg",
  ".png",
  ".tiff",
  ".tif",
  ".gif",
  ".bmp",
  ".webp",
] as const;

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
  "text/html",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/msword",
  // Imagens
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/tiff",
  "image/gif",
  "image/bmp",
  "image/webp",
] as const;

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const MAX_FILES = 5;
export const MAX_TOTAL_SIZE = 250 * 1024 * 1024; // 250MB total

// Tipos para histórico de conversas
export interface Conversation {
  id_conversation: string;
  id_user: string;
  nm_token: string;
  dt_expira_em?: string;
  st_ativa: "S" | "N";
  dt_criacao: string;
  nm_titulo?: string;
  ds_resumo?: string;
  qt_mensagens: number;
  dt_ultima_atividade: string;
}

export interface ConversationListResponse {
  items: Conversation[];
  meta: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    itemsPerPage: number;
  };
}

export interface ConversationFilters {
  search?: string;
  user_id?: string;
  status?: "S" | "N";
  order_by?: string;
  order_desc?: boolean;
  page?: number;
  size?: number;
}
