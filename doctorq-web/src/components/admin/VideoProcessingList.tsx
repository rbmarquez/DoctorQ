/**
 * Componente de Lista de Vídeos em Processamento
 */
'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Loader2, Film, Clock, HardDrive, Subtitles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useVideoStatus } from '@/lib/api/hooks/useVideos';
import type { VideoUploadItem } from '@/lib/api/hooks/useVideos';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

interface VideoProcessingListProps {
  videos: VideoUploadItem[];
  onRemove?: (id: string) => void;
  onRetry?: (id: string) => void;
}

function VideoProcessingCard({ video, onRemove, onRetry }: {
  video: VideoUploadItem;
  onRemove?: (id: string) => void;
  onRetry?: (id: string) => void;
}) {
  const router = useRouter();
  const { status: apiStatus } = useVideoStatus(
    video.status === 'processing' ? video.video_id || null : null,
    { refreshInterval: 3000 } // Poll a cada 3 segundos
  );

  // Atualizar progresso baseado no status da API
  const currentProgress = apiStatus?.progress_percent || video.processingProgress;
  const currentStatus = apiStatus?.status || video.status;

  const getStatusIcon = () => {
    switch (currentStatus) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'uploading':
      case 'processing':
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (currentStatus) {
      case 'waiting':
        return 'Aguardando...';
      case 'uploading':
        return `Enviando ${video.uploadProgress}%`;
      case 'processing':
        return `Processando ${currentProgress}%`;
      case 'completed':
        return 'Concluído';
      case 'failed':
        return 'Falhou';
      default:
        return 'Desconhecido';
    }
  };

  const getStatusColor = () => {
    switch (currentStatus) {
      case 'completed':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      case 'processing':
      case 'uploading':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    if (mb < 1024) {
      return `${mb.toFixed(1)} MB`;
    }
    return `${(mb / 1024).toFixed(2)} GB`;
  };

  return (
    <div className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        {/* Thumbnail/Icon */}
        <div className="flex-shrink-0">
          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
            <Film className="h-8 w-8 text-gray-400" />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 truncate">{video.titulo}</h3>
              <p className="text-sm text-gray-500 truncate">{video.file.name}</p>
            </div>
            {getStatusIcon()}
          </div>

          {/* Progress Bar */}
          {(currentStatus === 'uploading' || currentStatus === 'processing') && (
            <div className="mt-3 space-y-1">
              <Progress
                value={currentStatus === 'uploading' ? video.uploadProgress : currentProgress}
                className="h-2"
              />
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className={getStatusColor()}>{getStatusText()}</span>
                <span>
                  {currentStatus === 'uploading'
                    ? `${video.uploadProgress}%`
                    : `${currentProgress}%`
                  }
                </span>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <HardDrive className="h-3 w-3" />
              <span>{formatFileSize(video.file.size)}</span>
            </div>
            {apiStatus?.metadata?.duration_seconds && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>
                  {Math.floor(apiStatus.metadata.duration_seconds / 60)}:
                  {(apiStatus.metadata.duration_seconds % 60).toString().padStart(2, '0')}
                </span>
              </div>
            )}
          </div>

          {/* Status Message */}
          {currentStatus === 'completed' && (
            <div className="mt-2 space-y-2">
              <p className="text-sm text-green-600 font-medium">
                ✓ Vídeo pronto para streaming
              </p>
              {video.video_id && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/admin/universidade/videos/${video.video_id}/subtitles`)}
                  className="w-full sm:w-auto"
                >
                  <Subtitles className="h-4 w-4 mr-2" />
                  Gerenciar Legendas
                </Button>
              )}
            </div>
          )}

          {currentStatus === 'failed' && video.error && (
            <div className="mt-2">
              <p className="text-sm text-red-600">{video.error}</p>
              {onRetry && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRetry(video.id)}
                  className="mt-2"
                >
                  Tentar novamente
                </Button>
              )}
            </div>
          )}

          {/* Video ID */}
          {video.video_id && (
            <p className="mt-2 text-xs text-gray-400 font-mono truncate">
              ID: {video.video_id}
            </p>
          )}
        </div>

        {/* Remove Button */}
        {onRemove && currentStatus !== 'uploading' && currentStatus !== 'processing' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(video.id)}
            className="text-gray-400 hover:text-red-600"
          >
            <XCircle className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

export function VideoProcessingList({ videos, onRemove, onRetry }: VideoProcessingListProps) {
  if (videos.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
        <Film className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 font-medium">Nenhum vídeo em processamento</p>
        <p className="text-sm text-gray-500 mt-1">
          Faça upload de vídeos para começar
        </p>
      </div>
    );
  }

  // Separar por status
  const processing = videos.filter(
    (v) => v.status === 'uploading' || v.status === 'processing' || v.status === 'waiting'
  );
  const completed = videos.filter((v) => v.status === 'completed');
  const failed = videos.filter((v) => v.status === 'failed');

  return (
    <div className="space-y-6">
      {/* Em Processamento */}
      {processing.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Em Processamento ({processing.length})
          </h3>
          <div className="space-y-3">
            {processing.map((video) => (
              <VideoProcessingCard
                key={video.id}
                video={video}
                onRemove={onRemove}
                onRetry={onRetry}
              />
            ))}
          </div>
        </div>
      )}

      {/* Concluídos */}
      {completed.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            Concluídos ({completed.length})
          </h3>
          <div className="space-y-3">
            {completed.map((video) => (
              <VideoProcessingCard
                key={video.id}
                video={video}
                onRemove={onRemove}
                onRetry={onRetry}
              />
            ))}
          </div>
        </div>
      )}

      {/* Falhados */}
      {failed.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-600" />
            Falhados ({failed.length})
          </h3>
          <div className="space-y-3">
            {failed.map((video) => (
              <VideoProcessingCard
                key={video.id}
                video={video}
                onRemove={onRemove}
                onRetry={onRetry}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
