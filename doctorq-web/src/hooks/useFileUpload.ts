import {
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE,
  MAX_FILES,
  MAX_TOTAL_SIZE,
  ProcessedFileResponse,
  SelectedFile,
  UploadStatus,
} from "@/types/chat";
import { useCallback, useEffect, useRef, useState } from "react";

interface UseFileUploadProps {
  autoUpload?: boolean; // Novo parâmetro para controlar upload automático
}

export const useFileUpload = (props: UseFileUploadProps = {}) => {
  const { autoUpload = false } = props;
  
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    isUploading: false,
    progress: 0,
    errors: [],
    totalFiles: 0,
    processedFiles: 0,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  // Função para gerar mensagens de erro customizadas
  const generateCustomErrorMessage = (status: number, originalError: string, file: File): string => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const fileSizeMB = Math.round(file.size / (1024 * 1024));
    
    switch (status) {
      case 400:
        if (originalError.includes('tipo') || originalError.includes('extensão')) {
          return `Tipo de arquivo não suportado: ${fileExtension?.toUpperCase()}

💡 Tipos aceitos: PDF, DOCX, XLSX, PPTX, TXT, MD, HTML e IMAGENS (JPG, PNG, GIF, etc.)

🔧 Soluções:
• Converta o arquivo para um formato suportado
• Use ferramentas online para conversão
• Verifique se o arquivo não está corrompido`;
        }
        return `Erro na requisição: ${originalError}

💡 Verifique se o arquivo está correto e tente novamente`;
        
      case 401:
        return `Erro de autenticação

⚠️ Sua sessão expirou ou você não tem permissão

🔧 Soluções:
• Faça login novamente
• Verifique suas credenciais
• Entre em contato com o suporte se o problema persistir`;
        
      case 403:
        return `Acesso negado

⚠️ Você não tem permissão para fazer upload deste arquivo

🔧 Soluções:
• Verifique suas permissões de usuário
• Entre em contato com o administrador
• Tente com um arquivo diferente`;
        
      case 413:
        return `Arquivo muito grande: ${fileSizeMB}MB

📊 Limites de tamanho:
• PDF: até 30MB
• Excel: até 100MB
• Outros: até 50MB

💡 Soluções:
• Comprima o arquivo
• Divida em partes menores
• Use o processamento assíncrono para arquivos grandes`;
        
      case 422:
        // Erro de negócio - manter a mensagem original se já estiver formatada
        if (originalError.includes('💡') || originalError.includes('📊')) {
          return originalError;
        }
        
        if (fileExtension === 'pdf') {
          return `PDF muito grande`;
        }
        
        return `Erro de validação: ${originalError}

💡 Verifique os requisitos do arquivo e tente novamente`;
        
      case 408:
        return `Tempo limite excedido`;
        
      case 500:
        return `Erro interno do servidor

⚠️ Ocorreu um erro inesperado no processamento

💡 Soluções:
• Tente novamente em alguns minutos
• Use um arquivo diferente
• Entre em contato com o suporte se o problema persistir`;
        
      case 503:
        return `Serviço temporariamente indisponível

⚠️ O sistema está sobrecarregado ou em manutenção

💡 Soluções:
• Tente novamente em alguns minutos
• Use o processamento assíncrono
• Aguarde a manutenção terminar`;
        
      default:
        return `Erro ${status}: ${originalError}

💡 Tente novamente ou entre em contato com o suporte`;
    }
  };

  // Validação de arquivo individual
  const validateFile = useCallback((file: File): string | null => {
    // Verificar extensão
    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_FILE_TYPES.includes(fileExtension as any)) {
      return `Tipo de arquivo não permitido: ${fileExtension}. Tipos aceitos: ${ALLOWED_FILE_TYPES.join(
        ", "
      )}`;
    }

    // Verificar tamanho
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = Math.round(file.size / (1024 * 1024));
      const maxSizeMB = Math.round(MAX_FILE_SIZE / (1024 * 1024));
      return `Arquivo muito grande: ${sizeMB}MB. Tamanho máximo: ${maxSizeMB}MB`;
    }

    return null;
  }, []);

  // Validação de múltiplos arquivos
  const validateFiles = useCallback(
    (files: File[]): string[] => {
      const errors: string[] = [];

      // Verificar quantidade
      if (files.length > MAX_FILES) {
        errors.push(
          `Máximo de ${MAX_FILES} arquivos permitidos. Selecionados: ${files.length}`
        );
        return errors;
      }

      // Verificar tamanho total
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      if (totalSize > MAX_TOTAL_SIZE) {
        const totalSizeMB = Math.round(totalSize / (1024 * 1024));
        const maxTotalSizeMB = Math.round(MAX_TOTAL_SIZE / (1024 * 1024));
        errors.push(
          `Tamanho total muito grande: ${totalSizeMB}MB. Máximo: ${maxTotalSizeMB}MB`
        );
      }

      // Validar cada arquivo
      files.forEach((file, index) => {
        const error = validateFile(file);
        if (error) {
          errors.push(`Arquivo ${index + 1} (${file.name}): ${error}`);
        }
      });

      return errors;
    },
    [validateFile]
  );

  // Adicionar arquivos selecionados
  const addFiles = useCallback(
    (newFiles: File[]) => {
      const allFiles = [...selectedFiles.map((sf) => sf.file), ...newFiles];
      const errors = validateFiles(allFiles);

      if (errors.length > 0) {
        setUploadStatus((prev) => ({
          ...prev,
          errors,
        }));
        return false;
      }

      const newSelectedFiles: SelectedFile[] = newFiles.map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        file,
        status: "pending",
        size: file.size,
        type: file.type || "application/octet-stream",
      }));

      setSelectedFiles((prev) => [...prev, ...newSelectedFiles]);
      setUploadStatus((prev) => ({
        ...prev,
        errors: [],
        totalFiles: allFiles.length,
      }));

      return true;
    },
    [selectedFiles, validateFiles]
  );

  // Remover arquivo
  const removeFile = useCallback((fileId: string) => {
    setSelectedFiles((prev) => prev.filter((file) => file.id !== fileId));
    setUploadStatus((prev) => ({
      ...prev,
      totalFiles: prev.totalFiles - 1,
      errors: [],
    }));
  }, []);

  // Limpar todos os arquivos
  const clearFiles = useCallback(() => {
    console.log("🗑️ clearFiles executado - limpando selectedFiles");
    setSelectedFiles([]);
    setUploadStatus({
      isUploading: false,
      progress: 0,
      errors: [],
      totalFiles: 0,
      processedFiles: 0,
    });
    console.log("✅ clearFiles concluído - arquivos limpos");
  }, []);

  // Upload e processamento de arquivos
  const uploadFiles = useCallback(
    async (outputFormat: string = "txt"): Promise<string | null> => {
      // Processar apenas arquivos que estão pendentes
      const filesToUpload = selectedFiles.filter(f => f.status === "pending");
      
      if (filesToUpload.length === 0) {
        return null;
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      setUploadStatus((prev) => ({
        ...prev,
        isUploading: true,
        progress: 0,
        errors: [],
        processedFiles: 0,
        totalFiles: filesToUpload.length,
      }));

      try {
        let combinedContent = "";

        for (let i = 0; i < filesToUpload.length; i++) {
          const selectedFile = filesToUpload[i];

          // Atualizar status do arquivo atual
          setSelectedFiles((prev) =>
            prev.map((f) =>
              f.id === selectedFile.id ? { ...f, status: "uploading" } : f
            )
          );

          const formData = new FormData();
          formData.append("file", selectedFile.file);
          formData.append("output_format", outputFormat);

          try {
            const response = await fetch("/api/upload/simples", {
              method: "POST",
              body: formData,
              signal: abortControllerRef.current.signal,
            });

            if (!response.ok) {
              // Tentar extrair detalhes do erro da resposta
              let errorDetails = `Erro no upload: ${response.status}`;
              
              try {
                const errorData = await response.json();
                if (errorData.detail) {
                  // Se é um erro de negócio (422), extrair informações detalhadas
                  if (response.status === 422 && typeof errorData.detail === 'object') {
                    const detail = errorData.detail;
                    errorDetails = detail.error || detail.message || errorDetails;
                    
                    // Adicionar sugestões se disponíveis
                    if (detail.suggestion) {
                      errorDetails += `\n\n💡 ${detail.suggestion}`;
                    }
                    
                    // Adicionar informações sobre limites se disponíveis
                    if (detail.estimated_pages && detail.max_pages_sync) {
                      errorDetails += `\n\n📊 PDF estimado: ${detail.estimated_pages} páginas (limite: ${detail.max_pages_sync} páginas)`;
                    }
                    
                    // Adicionar endpoint alternativo se disponível
                    if (detail.async_endpoint) {
                      errorDetails += `\n\n🔄 Use o endpoint assíncrono: ${detail.async_endpoint}`;
                    }
                  } else if (typeof errorData.detail === 'string') {
                    errorDetails = errorData.detail;
                  }
                }
              } catch (parseError) {
                // Se não conseguir parsear JSON, usar texto da resposta
                try {
                  const errorText = await response.text();
                  if (errorText) {
                    errorDetails = errorText;
                  }
                } catch (textError) {
                  // Manter mensagem padrão se não conseguir extrair texto
                }
              }

              // Gerar mensagens customizadas baseadas no status HTTP
              const customErrorDetails = generateCustomErrorMessage(response.status, errorDetails, selectedFile.file);
              
              throw new Error(customErrorDetails);
            }

            const result: ProcessedFileResponse = await response.json();

            if (result.success) {
              // Atualizar arquivo como processado
              setSelectedFiles((prev) =>
                prev.map((f) =>
                  f.id === selectedFile.id
                    ? {
                        ...f,
                        status: "processed",
                        processedContent: result.data.content,
                      }
                    : f
                )
              );

              // Adicionar conteúdo ao contexto combinado
              combinedContent += `\n\n--- Arquivo: ${selectedFile.file.name} ---\n`;
              combinedContent += result.data.content;
            } else {
              throw new Error(result.message || "Erro no processamento");
            }
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : "Erro desconhecido";

            // Marcar arquivo com erro
            setSelectedFiles((prev) =>
              prev.map((f) =>
                f.id === selectedFile.id
                  ? { ...f, status: "error", error: errorMessage }
                  : f
              )
            );

            setUploadStatus((prev) => ({
              ...prev,
              errors: [
                ...prev.errors,
                `${selectedFile.file.name}: ${errorMessage}`,
              ],
            }));
          }

          // Atualizar progresso
          const progress = ((i + 1) / filesToUpload.length) * 100;
          setUploadStatus((prev) => ({
            ...prev,
            progress,
            processedFiles: i + 1,
          }));
        }

        setUploadStatus((prev) => ({
          ...prev,
          isUploading: false,
        }));

        // Retornar conteúdo combinado se houver
        return combinedContent.trim() || null;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return null;
        }

        const errorMessage =
          error instanceof Error ? error.message : "Erro desconhecido";
        setUploadStatus((prev) => ({
          ...prev,
          isUploading: false,
          errors: [...prev.errors, errorMessage],
        }));

        return null;
      } finally {
        abortControllerRef.current = null;
      }
    },
    [selectedFiles]
  );

  // Cancelar upload
  const cancelUpload = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  // Verificar se há arquivos processados com sucesso
  const hasProcessedFiles = selectedFiles.some((f) => f.status === "processed");

  // Verificar se todos os arquivos foram processados
  const allFilesProcessed =
    selectedFiles.length > 0 &&
    selectedFiles.every(
      (f) => f.status === "processed" || f.status === "error"
    );

  // Obter contexto de todos os arquivos processados
  const getProcessedContext = useCallback((): string => {
    const processedFiles = selectedFiles.filter(
      (f) => f.status === "processed" && f.processedContent
    );

    if (processedFiles.length === 0) {
      return "";
    }

    let context = "\n\n=== CONTEXTO DOS ARQUIVOS ===\n";
    processedFiles.forEach((file) => {
      context += `\n--- Arquivo: ${file.file.name} ---\n`;
      context += file.processedContent;
      context += "\n";
    });
    context += "\n=== FIM DO CONTEXTO ===\n\n";

    return context;
  }, [selectedFiles]);

  // Função para carregar arquivos do contexto inicial
  const loadFilesFromContext = useCallback((files: any[]) => {
    if (files && files.length > 0) {
      console.log("📂 Carregando arquivos do contexto:", files.length);
      setSelectedFiles(files);
      
      // Restaurar status baseado nos arquivos carregados
      const processedCount = files.filter(f => f.status === "processed").length;
      const totalFiles = files.length;
      const hasErrors = files.some(f => f.status === "error");
      
      setUploadStatus({
        isUploading: false,
        progress: totalFiles > 0 ? 100 : 0,
        errors: hasErrors ? ["Alguns arquivos tiveram erro no processamento anterior"] : [],
        totalFiles: totalFiles,
        processedFiles: processedCount,
      });
    }
  }, []);

  // Auto upload quando habilitado
  useEffect(() => {
    if (!autoUpload) return;

    const pendingFiles = selectedFiles.filter(f => f.status === "pending");

    if (pendingFiles.length > 0 && !uploadStatus.isUploading) {
      const processFiles = async () => {
        try {
          await uploadFiles();
        } catch (error) {
          console.error("Erro ao processar arquivos automaticamente:", error);
        }
      };

      // Pequeno delay para evitar processamento imediato demais
      const timeoutId = setTimeout(processFiles, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [autoUpload, selectedFiles, uploadStatus.isUploading, uploadFiles]);

  return {
    selectedFiles,
    uploadStatus,
    addFiles,
    removeFile,
    clearFiles,
    uploadFiles,
    cancelUpload,
    hasProcessedFiles,
    allFilesProcessed,
    getProcessedContext,
    validateFile,
    validateFiles,
    loadFilesFromContext,
  };
};
