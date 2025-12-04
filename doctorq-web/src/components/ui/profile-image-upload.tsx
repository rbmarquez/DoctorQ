"use client";

import { useState, useRef } from "react";
import { Upload, X, Camera, Loader2 } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface ProfileImageUploadProps {
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function ProfileImageUpload({
  value,
  onChange,
  disabled = false,
  className,
}: ProfileImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(value || null);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation: max 5MB
    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      alert("Arquivo muito grande. Tamanho máximo: 5MB.");
      return;
    }

    // Validation: images only
    if (!file.type.startsWith("image/")) {
      alert("Apenas imagens são permitidas (JPG, PNG, WebP).");
      return;
    }

    setIsLoading(true);

    // Create base64 preview
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setPreview(base64String);
      onChange(base64String);
      setIsLoading(false);
    };
    reader.onerror = () => {
      alert("Erro ao processar imagem.");
      setIsLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    setPreview(null);
    onChange("");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleClick = () => {
    if (!disabled && inputRef.current) {
      inputRef.current.click();
    }
  };

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileChange}
        disabled={disabled || isLoading}
        className="hidden"
      />

      {/* Image Preview */}
      <div className="relative">
        {preview ? (
          <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
            <img
              src={preview}
              alt="Foto de perfil"
              className="w-full h-full object-cover"
            />

            {/* Loading overlay */}
            {isLoading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            )}

            {/* Remove button */}
            {!disabled && !isLoading && (
              <button
                onClick={handleRemove}
                className="absolute -top-2 -right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-md transition-colors"
                title="Remover foto"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Edit button */}
            {!disabled && !isLoading && (
              <button
                onClick={handleClick}
                className="absolute bottom-0 right-0 p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-md transition-colors"
                title="Alterar foto"
              >
                <Camera className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <div
            onClick={handleClick}
            className={cn(
              "w-32 h-32 rounded-full border-4 border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center gap-2 transition-all",
              !disabled &&
                "cursor-pointer hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
            ) : (
              <>
                <Upload className="w-8 h-8 text-gray-400" />
                <span className="text-xs text-gray-500 text-center px-2">
                  Adicionar foto
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="text-center">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Foto de Perfil
        </p>
        <p className="text-xs text-gray-500 mt-1">
          JPG, PNG ou WebP (máx. 5MB)
        </p>
      </div>
    </div>
  );
}
