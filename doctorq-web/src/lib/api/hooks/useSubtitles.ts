/**
 * Hook para gerenciamento de legendas (subtitles)
 */
'use client';

import useSWR from 'swr';
import { useState, useCallback } from 'react';

const VIDEO_API_URL = process.env.NEXT_PUBLIC_VIDEO_API_URL || 'http://localhost:8083';
const API_KEY = process.env.NEXT_PUBLIC_VIDEO_API_KEY || 'vf_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX';

const fetcher = (url: string) =>
  fetch(url, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
    },
  }).then((res) => res.json());

interface Subtitle {
  subtitle_id: string;
  video_id: string;
  language: string;
  language_label: string;
  subtitle_url: string;
  filename: string;
  size_bytes: number;
  uploaded_at: string;
}

interface SubtitlesResponse {
  video_id: string;
  subtitles: Subtitle[];
  total: number;
}

export function useSubtitles(video_id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<SubtitlesResponse>(
    video_id ? `${VIDEO_API_URL}/api/subtitles/${video_id}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  return {
    subtitles: data?.subtitles || [],
    total: data?.total || 0,
    isLoading,
    error,
    mutate,
  };
}

export function useSubtitleUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(
    async (
      video_id: string,
      language: string,
      language_label: string,
      file: File
    ) => {
      setIsUploading(true);
      setError(null);
      setUploadProgress(0);

      try {
        const formData = new FormData();
        formData.append('video_id', video_id);
        formData.append('language', language);
        formData.append('language_label', language_label);
        formData.append('file', file);

        const xhr = new XMLHttpRequest();

        const uploadPromise = new Promise<any>((resolve, reject) => {
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

          xhr.onerror = () => {
            reject(new Error('Network error during upload'));
          };
        });

        xhr.open('POST', `${VIDEO_API_URL}/api/subtitles/upload`);
        xhr.setRequestHeader('Authorization', `Bearer ${API_KEY}`);
        xhr.send(formData);

        const result = await uploadPromise;
        setIsUploading(false);
        return result;
      } catch (err: any) {
        const errorMessage = err.message || 'Erro ao fazer upload de legenda';
        setError(errorMessage);
        setIsUploading(false);
        throw new Error(errorMessage);
      }
    },
    []
  );

  return {
    upload,
    isUploading,
    uploadProgress,
    error,
  };
}

export function useSubtitleDelete() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteSubtitle = useCallback(
    async (video_id: string, language: string) => {
      setIsDeleting(true);
      setError(null);

      try {
        const response = await fetch(
          `${VIDEO_API_URL}/api/subtitles/${video_id}/${language}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${API_KEY}`,
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Failed to delete subtitle');
        }

        const result = await response.json();
        setIsDeleting(false);
        return result;
      } catch (err: any) {
        const errorMessage = err.message || 'Erro ao remover legenda';
        setError(errorMessage);
        setIsDeleting(false);
        throw new Error(errorMessage);
      }
    },
    []
  );

  return {
    deleteSubtitle,
    isDeleting,
    error,
  };
}
