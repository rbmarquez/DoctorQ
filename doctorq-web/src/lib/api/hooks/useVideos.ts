/**
 * Hooks para API de Vídeo (HLS Self-Hosted)
 */
import useSWR from 'swr';
import { useState, useCallback } from 'react';

const VIDEO_API_URL = process.env.NEXT_PUBLIC_VIDEO_API_URL || 'http://localhost:8083';
const API_KEY = process.env.API_DOCTORQ_API_KEY || 'vf_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX';

interface VideoUploadResponse {
  video_id: string;
  filename: string;
  size_bytes: number;
  status: string;
  message: string;
  uploaded_at: string;
}

interface VideoStatus {
  video_id: string;
  status: 'pending' | 'uploaded' | 'processing' | 'completed' | 'failed';
  progress_percent: number;
  message: string;
  metadata?: {
    duration_seconds?: number;
    original_size_bytes?: number;
    qualities_generated?: string[];
    qualities_pending?: string[];
  };
}

interface VideoStreamInfo {
  video_id: string;
  master_playlist_url: string;
  qualities: string[];
  thumbnail_url?: string;
}

/**
 * Hook para fazer upload de vídeo
 */
export function useVideoUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(
    async (file: File, titulo: string, id_aula?: string): Promise<VideoUploadResponse | null> => {
      setIsUploading(true);
      setUploadProgress(0);
      setError(null);

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('titulo', titulo);
        if (id_aula) {
          formData.append('id_aula', id_aula);
        }

        const xhr = new XMLHttpRequest();

        // Promise para aguardar o upload
        const uploadPromise = new Promise<VideoUploadResponse>((resolve, reject) => {
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const progress = Math.round((e.loaded / e.total) * 100);
              setUploadProgress(progress);
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(JSON.parse(xhr.responseText));
            } else {
              reject(new Error(`Upload failed: ${xhr.statusText}`));
            }
          };

          xhr.onerror = () => reject(new Error('Upload failed'));
          xhr.onabort = () => reject(new Error('Upload aborted'));
        });

        xhr.open('POST', `${VIDEO_API_URL}/api/videos/upload`);
        xhr.setRequestHeader('Authorization', `Bearer ${API_KEY}`);
        xhr.send(formData);

        const result = await uploadPromise;
        return result;
      } catch (err: any) {
        setError(err.message || 'Erro ao fazer upload');
        return null;
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    []
  );

  return { upload, isUploading, uploadProgress, error };
}

/**
 * Hook para monitorar status de um vídeo
 */
export function useVideoStatus(video_id: string | null, options?: { refreshInterval?: number }) {
  const { data, error, isLoading, mutate } = useSWR<VideoStatus>(
    video_id ? `${VIDEO_API_URL}/api/videos/${video_id}/status` : null,
    async (url: string) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Erro ao buscar status');
      return res.json();
    },
    {
      refreshInterval: options?.refreshInterval || 5000, // Poll a cada 5 segundos
      revalidateOnFocus: false,
    }
  );

  return {
    status: data,
    isLoading,
    error,
    mutate,
  };
}

/**
 * Hook para obter informações de streaming
 */
export function useVideoStream(video_id: string | null) {
  const { data, error, isLoading } = useSWR<VideoStreamInfo>(
    video_id ? `${VIDEO_API_URL}/api/videos/${video_id}/stream` : null,
    async (url: string) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Erro ao buscar stream');
      return res.json();
    }
  );

  return {
    streamInfo: data,
    isLoading,
    error,
  };
}

/**
 * Hook para verificar health da API de vídeo
 */
export function useVideoApiHealth() {
  const { data, error, isLoading } = useSWR(
    `${VIDEO_API_URL}/health`,
    async (url: string) => {
      try {
        const res = await fetch(url, {
          cache: 'no-store',
          signal: AbortSignal.timeout(5000) // Timeout de 5 segundos
        });
        if (!res.ok) throw new Error('API não está saudável');
        return res.json();
      } catch (err: any) {
        // Não lançar erro, apenas retornar null
        console.warn('API de Vídeos offline:', err.message);
        return null;
      }
    },
    {
      refreshInterval: 30000, // Verifica a cada 30 segundos
      revalidateOnFocus: false,
      shouldRetryOnError: false, // Não retentar em caso de erro
    }
  );

  return {
    health: data,
    isHealthy: data?.status === 'healthy',
    isLoading,
    error,
  };
}

/**
 * Tipos auxiliares para gerenciamento de uploads
 */
export interface VideoUploadItem {
  id: string; // ID local temporário
  file: File;
  titulo: string;
  id_aula?: string;
  video_id?: string; // ID retornado pela API
  status: 'waiting' | 'uploading' | 'processing' | 'completed' | 'failed';
  uploadProgress: number; // 0-100
  processingProgress: number; // 0-100
  error?: string;
}
