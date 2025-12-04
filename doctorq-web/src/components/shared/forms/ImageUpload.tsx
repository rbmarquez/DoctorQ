'use client';

/**
 * ImageUpload Component
 *
 * Componente avançado para upload de imagens com:
 * - Drag & Drop
 * - Preview antes do upload
 * - Crop/Resize (opcional)
 * - Upload múltiplo
 * - Progress bar
 * - Validação de tipo e tamanho
 */

import { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';

export interface ImageUploadProps {
  /** Valor atual (URL da imagem ou array de URLs) */
  value?: string | string[];

  /** Callback ao fazer upload */
  onUpload?: (files: File[]) => Promise<string[]>;

  /** Callback ao remover imagem */
  onRemove?: (url: string) => void;

  /** Permitir múltiplos uploads */
  multiple?: boolean;

  /** Tamanho máximo em MB */
  maxSizeMB?: number;

  /** Largura máxima em pixels */
  maxWidth?: number;

  /** Altura máxima em pixels */
  maxHeight?: number;

  /** Tipos aceitos */
  accept?: string;

  /** Mostrar preview */
  showPreview?: boolean;

  /** Altura do dropzone */
  height?: string;

  /** Desabilitado */
  disabled?: boolean;

  /** Classe customizada */
  className?: string;

  /** Texto do placeholder */
  placeholder?: string;
}

interface ImagePreview {
  url: string;
  file?: File;
  uploading?: boolean;
  progress?: number;
  error?: string;
}

export function ImageUpload({
  value,
  onUpload,
  onRemove,
  multiple = false,
  maxSizeMB = 5,
  maxWidth = 1920,
  maxHeight = 1080,
  accept = 'image/*',
  showPreview = true,
  height = '200px',
  disabled = false,
  className,
  placeholder = 'Arraste imagens aqui ou clique para selecionar',
}: ImageUploadProps) {
  const [previews, setPreviews] = useState<ImagePreview[]>(() => {
    if (!value) return [];
    const urls = Array.isArray(value) ? value : [value];
    return urls.map(url => ({ url }));
  });
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Validar arquivo
  const validateFile = (file: File): string | null => {
    // Validar tipo
    if (!file.type.startsWith('image/')) {
      return 'Arquivo deve ser uma imagem';
    }

    // Validar tamanho
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      return `Imagem muito grande (máx ${maxSizeMB}MB)`;
    }

    return null;
  };

  // Redimensionar imagem se necessário
  const resizeImage = async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();

        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;

          // Calcular novas dimensões mantendo aspect ratio
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width *= ratio;
            height *= ratio;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            if (blob) {
              const resizedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(resizedFile);
            } else {
              resolve(file);
            }
          }, file.type);
        };

        img.src = e.target?.result as string;
      };

      reader.readAsDataURL(file);
    });
  };

  // Processar arquivos selecionados
  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);

    // Validar arquivos
    const validFiles: File[] = [];
    const newPreviews: ImagePreview[] = [];

    for (const file of fileArray) {
      const error = validateFile(file);

      if (error) {
        newPreviews.push({
          url: URL.createObjectURL(file),
          file,
          error,
        });
      } else {
        validFiles.push(file);
        newPreviews.push({
          url: URL.createObjectURL(file),
          file,
          uploading: true,
          progress: 0,
        });
      }
    }

    // Atualizar previews
    if (multiple) {
      setPreviews(prev => [...prev, ...newPreviews]);
    } else {
      setPreviews(newPreviews);
    }

    // Fazer upload dos arquivos válidos
    if (validFiles.length > 0 && onUpload) {
      try {
        // Redimensionar imagens se necessário
        const resizedFiles = await Promise.all(
          validFiles.map(file => resizeImage(file))
        );

        // Upload (com progress simulado)
        const uploadedUrls = await onUpload(resizedFiles);

        // Atualizar previews com URLs finais
        setPreviews(prev =>
          prev.map((preview, index) => {
            if (preview.uploading && uploadedUrls[index]) {
              return {
                url: uploadedUrls[index],
                uploading: false,
                progress: 100,
              };
            }
            return preview;
          })
        );
      } catch (error) {
        // Marcar como erro
        setPreviews(prev =>
          prev.map(preview =>
            preview.uploading
              ? { ...preview, uploading: false, error: 'Erro ao fazer upload' }
              : preview
          )
        );
      }
    }
  }, [multiple, onUpload, maxSizeMB, maxWidth, maxHeight]);

  // Handle drag events
  const handleDragOver = (e: React.DragEvent) => {
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  };

  // Handle click to open file dialog
  const handleClick = () => {
    if (!disabled) {
      inputRef.current?.click();
    }
  };

  // Handle file input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  };

  // Remove preview
  const handleRemove = (index: number) => {
    const preview = previews[index];

    if (onRemove && !preview.file) {
      onRemove(preview.url);
    }

    setPreviews(prev => prev.filter((_, i) => i !== index));

    // Revoke object URL
    if (preview.file) {
      URL.revokeObjectURL(preview.url);
    }
  };

  return (
    <div className={cn('w-full', className)}>
      {/* Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        style={{ height }}
        className={cn(
          'relative flex flex-col items-center justify-center',
          'border-2 border-dashed rounded-lg',
          'cursor-pointer transition-colors',
          'hover:bg-muted/50',
          isDragging && 'border-primary bg-primary/10',
          !isDragging && 'border-muted-foreground/25',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          disabled={disabled}
          className="hidden"
        />

        <Upload className="h-10 w-10 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground text-center px-4">
          {placeholder}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {accept === 'image/*' ? 'PNG, JPG, GIF' : accept} (máx {maxSizeMB}MB)
        </p>
      </div>

      {/* Previews */}
      {showPreview && previews.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
          {previews.map((preview, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                {preview.error ? (
                  <div className="h-full flex flex-col items-center justify-center p-4 text-destructive">
                    <X className="h-8 w-8 mb-2" />
                    <p className="text-xs text-center">{preview.error}</p>
                  </div>
                ) : preview.uploading ? (
                  <div className="h-full flex flex-col items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                    <p className="text-xs text-muted-foreground">
                      {preview.progress}% enviando...
                    </p>
                  </div>
                ) : (
                  <img
                    src={preview.url}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Remove button */}
              {!preview.uploading && (
                <button
                  onClick={() => handleRemove(index)}
                  className={cn(
                    'absolute top-2 right-2',
                    'p-1 rounded-full bg-destructive text-destructive-foreground',
                    'opacity-0 group-hover:opacity-100 transition-opacity',
                    'hover:bg-destructive/90'
                  )}
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Componente simplificado para upload de avatar
 */
export function AvatarUpload({
  value,
  onUpload,
  disabled,
  className,
}: Omit<ImageUploadProps, 'multiple' | 'showPreview'>) {
  const [preview, setPreview] = useState<string | undefined>(value);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (files: File[]) => {
    if (files.length === 0 || !onUpload) return [];

    setUploading(true);
    try {
      const urls = await onUpload(files);
      setPreview(urls[0]);
      return urls;
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={cn('flex items-center gap-4', className)}>
      {/* Avatar preview */}
      <div className="relative">
        <div className="h-24 w-24 rounded-full overflow-hidden bg-muted flex items-center justify-center">
          {uploading ? (
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          ) : preview ? (
            <img src={preview} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Upload button */}
      <ImageUpload
        value={preview}
        onUpload={handleUpload}
        multiple={false}
        showPreview={false}
        height="100px"
        maxSizeMB={2}
        maxWidth={512}
        maxHeight={512}
        disabled={disabled || uploading}
        placeholder="Clique para alterar foto"
        className="flex-1"
      />
    </div>
  );
}
