/**
 * Página de Admin - Upload e Gerenciamento de Vídeos HLS
 */
'use client';

import { useState, useCallback } from 'react';
import { ArrowLeft, Upload, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { VideoUploadZone } from '@/components/admin/VideoUploadZone';
import { VideoProcessingList } from '@/components/admin/VideoProcessingList';
import { useVideoUpload, useVideoApiHealth } from '@/lib/api/hooks/useVideos';
import type { VideoUploadItem } from '@/lib/api/hooks/useVideos';

export default function VideosAdminPage() {
  const router = useRouter();
  const { upload, isUploading } = useVideoUpload();
  const { isHealthy, health } = useVideoApiHealth();

  const [videos, setVideos] = useState<VideoUploadItem[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // Handler para quando arquivos são selecionados
  const handleFilesSelected = useCallback((files: File[]) => {
    setSelectedFiles((prev) => [...prev, ...files]);
  }, []);

  // Handler para iniciar upload dos arquivos selecionados
  const handleStartUpload = async () => {
    if (selectedFiles.length === 0) return;

    // Criar items temporários
    const newVideos: VideoUploadItem[] = selectedFiles.map((file, index) => ({
      id: `temp-${Date.now()}-${index}`,
      file,
      titulo: file.name.replace(/\.[^/.]+$/, ''), // Remove extensão
      status: 'waiting',
      uploadProgress: 0,
      processingProgress: 0,
    }));

    setVideos((prev) => [...prev, ...newVideos]);
    setSelectedFiles([]);

    // Fazer upload de cada arquivo
    for (const video of newVideos) {
      // Atualizar status para uploading
      setVideos((prev) =>
        prev.map((v) => (v.id === video.id ? { ...v, status: 'uploading' } : v))
      );

      try {
        const result = await upload(video.file, video.titulo);

        if (result) {
          // Upload bem sucedido, agora está em processamento
          setVideos((prev) =>
            prev.map((v) =>
              v.id === video.id
                ? {
                    ...v,
                    video_id: result.video_id,
                    status: 'processing',
                    uploadProgress: 100,
                  }
                : v
            )
          );
        } else {
          // Falha no upload
          setVideos((prev) =>
            prev.map((v) =>
              v.id === video.id
                ? { ...v, status: 'failed', error: 'Erro ao fazer upload' }
                : v
            )
          );
        }
      } catch (error: any) {
        setVideos((prev) =>
          prev.map((v) =>
            v.id === video.id
              ? { ...v, status: 'failed', error: error.message || 'Erro desconhecido' }
              : v
          )
        );
      }
    }
  };

  // Handler para remover vídeo da lista
  const handleRemove = useCallback((id: string) => {
    setVideos((prev) => prev.filter((v) => v.id !== id));
  }, []);

  // Handler para retry
  const handleRetry = useCallback(
    async (id: string) => {
      const video = videos.find((v) => v.id === id);
      if (!video) return;

      setVideos((prev) =>
        prev.map((v) =>
          v.id === id ? { ...v, status: 'uploading', uploadProgress: 0, error: undefined } : v
        )
      );

      try {
        const result = await upload(video.file, video.titulo);

        if (result) {
          setVideos((prev) =>
            prev.map((v) =>
              v.id === id
                ? {
                    ...v,
                    video_id: result.video_id,
                    status: 'processing',
                    uploadProgress: 100,
                  }
                : v
            )
          );
        } else {
          setVideos((prev) =>
            prev.map((v) =>
              v.id === id ? { ...v, status: 'failed', error: 'Erro ao fazer upload' } : v
            )
          );
        }
      } catch (error: any) {
        setVideos((prev) =>
          prev.map((v) =>
            v.id === id ? { ...v, status: 'failed', error: error.message } : v
          )
        );
      }
    },
    [videos, upload]
  );

  // Handler para remover arquivo selecionado antes do upload
  const handleRemoveSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.push('/admin/dashboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              <div className="h-6 w-px bg-gray-300" />
              <div>
                <h1 className="text-2xl font-bold">Gerenciamento de Vídeos</h1>
                <p className="text-sm text-gray-600">Upload e processamento de vídeos HLS</p>
              </div>
            </div>

            {/* API Health Status */}
            <div
              className={`
              flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium
              ${
                isHealthy
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }
            `}
            >
              {isHealthy ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  API Online
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4" />
                  API Offline
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Upload Zone - 2/5 */}
          <div className="lg:col-span-2 space-y-6">
            {/* Info Card */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-3">
                <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-medium mb-1">Sistema de Vídeo Self-Hosted</p>
                  <p className="text-blue-700">
                    Os vídeos serão transcodificados para HLS com múltiplas qualidades (1080p,
                    720p, 480p, 360p) e ficarão disponíveis para streaming adaptativo.
                  </p>
                </div>
              </div>
            </div>

            {/* Upload Zone */}
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-semibold mb-4">Upload de Vídeos</h2>
              <VideoUploadZone onFilesSelected={handleFilesSelected} disabled={!isHealthy} />

              {/* Selected Files */}
              {selectedFiles.length > 0 && (
                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-700">
                      Arquivos Selecionados ({selectedFiles.length})
                    </h3>
                    <Button
                      onClick={() => setSelectedFiles([])}
                      variant="ghost"
                      size="sm"
                      className="text-gray-500"
                    >
                      Limpar Tudo
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                          <p className="text-xs text-gray-500">
                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveSelectedFile(index)}
                          className="text-gray-400 hover:text-red-600"
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={handleStartUpload}
                    disabled={isUploading || !isHealthy}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {isUploading ? 'Fazendo Upload...' : `Iniciar Upload (${selectedFiles.length})`}
                  </Button>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-lg border p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{videos.length}</p>
                <p className="text-xs text-gray-600 mt-1">Total</p>
              </div>
              <div className="bg-white rounded-lg border p-4 text-center">
                <p className="text-2xl font-bold text-green-600">
                  {videos.filter((v) => v.status === 'completed').length}
                </p>
                <p className="text-xs text-gray-600 mt-1">Concluídos</p>
              </div>
              <div className="bg-white rounded-lg border p-4 text-center">
                <p className="text-2xl font-bold text-orange-600">
                  {videos.filter((v) => v.status === 'processing' || v.status === 'uploading').length}
                </p>
                <p className="text-xs text-gray-600 mt-1">Em Progresso</p>
              </div>
            </div>
          </div>

          {/* Video List - 3/5 */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-semibold mb-6">Vídeos em Processamento</h2>
              <VideoProcessingList videos={videos} onRemove={handleRemove} onRetry={handleRetry} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
