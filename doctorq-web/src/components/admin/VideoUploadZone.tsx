/**
 * Componente de Upload de Vídeo com Drag & Drop
 */
'use client';

import { useCallback, useState } from 'react';
import { Upload, X, Film, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VideoUploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  maxSizeGB?: number;
  acceptedFormats?: string[];
  disabled?: boolean;
}

export function VideoUploadZone({
  onFilesSelected,
  maxSizeGB = 5,
  acceptedFormats = ['.mp4', '.mov', '.avi', '.mkv', '.webm'],
  disabled = false,
}: VideoUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxSizeBytes = maxSizeGB * 1024 * 1024 * 1024;

  const validateFile = (file: File): string | null => {
    // Verificar extensão
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedFormats.includes(fileExt)) {
      return `Formato não suportado. Use: ${acceptedFormats.join(', ')}`;
    }

    // Verificar tamanho
    if (file.size > maxSizeBytes) {
      return `Arquivo muito grande. Máximo: ${maxSizeGB}GB`;
    }

    return null;
  };

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || disabled) return;

      const validFiles: File[] = [];
      const errors: string[] = [];

      Array.from(files).forEach((file) => {
        const error = validateFile(file);
        if (error) {
          errors.push(`${file.name}: ${error}`);
        } else {
          validFiles.push(file);
        }
      });

      if (errors.length > 0) {
        setError(errors.join('\n'));
      } else {
        setError(null);
      }

      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
      }
    },
    [disabled, onFilesSelected, maxSizeBytes, acceptedFormats]
  );

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (!disabled) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  return (
    <div className="w-full">
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8
          transition-all duration-200 ease-in-out
          ${
            isDragging
              ? 'border-primary bg-primary/5 scale-[1.02]'
              : 'border-gray-300 hover:border-primary/50'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && document.getElementById('video-file-input')?.click()}
      >
        <input
          id="video-file-input"
          type="file"
          accept={acceptedFormats.join(',')}
          onChange={handleFileInputChange}
          multiple
          disabled={disabled}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div
            className={`
            p-4 rounded-full
            ${isDragging ? 'bg-primary/10' : 'bg-gray-100'}
            transition-colors
          `}
          >
            {isDragging ? (
              <Upload className="h-8 w-8 text-primary animate-bounce" />
            ) : (
              <Film className="h-8 w-8 text-gray-400" />
            )}
          </div>

          <div className="text-center">
            <p className="text-lg font-medium text-gray-700">
              {isDragging ? 'Solte os arquivos aqui' : 'Arraste vídeos para cá'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              ou{' '}
              <span className="text-primary font-medium hover:underline">
                clique para selecionar
              </span>
            </p>
          </div>

          <div className="text-xs text-gray-500 space-y-1">
            <p>Formatos: {acceptedFormats.join(', ')}</p>
            <p>Tamanho máximo: {maxSizeGB}GB por arquivo</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">Erro ao validar arquivos</p>
            <p className="text-sm text-red-600 mt-1 whitespace-pre-wrap">{error}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
