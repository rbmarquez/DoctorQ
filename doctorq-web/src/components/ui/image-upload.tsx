"use client";

import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export interface ImageUploadProps {
  onUploadComplete: (result: any) => void;
  onUploadError?: (error: Error) => void;
  userId: string;
  albumId?: string;
  maxSizeMB?: number;
  acceptedTypes?: string[];
  className?: string;
}

export function ImageUpload({
  onUploadComplete,
  onUploadError,
  userId,
  albumId,
  maxSizeMB = 10,
  acceptedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  className,
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ============================================================================
  // VALIDATION
  // ============================================================================

  const validateFile = (file: File): boolean => {
    // Check file type
    if (!acceptedTypes.includes(file.type)) {
      toast.error(
        `Tipo de arquivo não aceito. Permitidos: ${acceptedTypes.join(", ")}`
      );
      return false;
    }

    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      toast.error(
        `Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB`
      );
      return false;
    }

    return true;
  };

  // ============================================================================
  // FILE SELECTION
  // ============================================================================

  const handleFileSelect = useCallback(
    (file: File) => {
      if (!validateFile(file)) {
        return;
      }

      setSelectedFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    },
    [maxSizeMB, acceptedTypes]
  );

  // ============================================================================
  // DRAG AND DROP
  // ============================================================================

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect]
  );

  // ============================================================================
  // INPUT CHANGE
  // ============================================================================

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect]
  );

  // ============================================================================
  // UPLOAD
  // ============================================================================

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Nenhum arquivo selecionado");
      return;
    }

    setIsUploading(true);
    setProgress(0);

    try {
      // Create FormData
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("id_user", userId);
      if (albumId) {
        formData.append("id_album", albumId);
      }

      // Simulate progress (in production, use XMLHttpRequest with progress events)
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Upload
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const API_KEY = process.env.API_KEY || "";

      const response = await fetch(`${API_URL}/fotos/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
        },
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Erro ao fazer upload");
      }

      const result = await response.json();

      toast.success("Foto enviada com sucesso!");
      onUploadComplete(result);

      // Reset
      setSelectedFile(null);
      setPreview(null);
      setProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error: any) {
      console.error("Erro no upload:", error);
      toast.error(error.message || "Erro ao fazer upload");
      if (onUploadError) {
        onUploadError(error);
      }
      setProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  // ============================================================================
  // CLEAR
  // ============================================================================

  const handleClear = () => {
    setSelectedFile(null);
    setPreview(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className={cn("space-y-4", className)}>
      {/* Drop Zone */}
      {!preview && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all",
            isDragging
              ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
              : "border-gray-300 hover:border-gray-400 dark:border-gray-700 dark:hover:border-gray-600"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedTypes.join(",")}
            onChange={handleInputChange}
            className="hidden"
          />

          <div className="flex flex-col items-center gap-2">
            <Upload className="w-12 h-12 text-gray-400" />
            <div>
              <p className="font-semibold text-gray-700 dark:text-gray-300">
                Arraste uma imagem ou clique para selecionar
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Formatos aceitos: JPG, PNG, WebP (máx. {maxSizeMB}MB)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div className="relative">
          <div className="relative aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-contain"
            />

            {/* Remove button */}
            {!isUploading && (
              <button
                onClick={handleClear}
                className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Uploading overlay */}
            {isUploading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="text-center text-white">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                  <p className="text-sm">Enviando...</p>
                </div>
              </div>
            )}
          </div>

          {/* File info */}
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            <p className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              <span className="font-medium">{selectedFile?.name}</span>
              <span className="text-xs">
                ({(selectedFile?.size || 0 / 1024 / 1024).toFixed(2)} MB)
              </span>
            </p>
          </div>

          {/* Progress bar */}
          {isUploading && (
            <div className="mt-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-gray-500 text-center mt-1">
                {progress}%
              </p>
            </div>
          )}

          {/* Upload button */}
          {!isUploading && (
            <div className="flex gap-2 mt-4">
              <Button
                onClick={handleUpload}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                <Upload className="w-4 h-4 mr-2" />
                Enviar Foto
              </Button>
              <Button variant="outline" onClick={handleClear}>
                Cancelar
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
