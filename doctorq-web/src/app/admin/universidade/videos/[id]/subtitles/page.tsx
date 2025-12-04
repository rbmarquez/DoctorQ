/**
 * Página de Gerenciamento de Legendas
 * Permite upload, visualização e remoção de legendas de um vídeo
 */
'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Upload,
  Trash2,
  Download,
  CheckCircle2,
  XCircle,
  Loader2,
  FileText,
  ArrowLeft,
  Globe
} from 'lucide-react';
import { useSubtitles, useSubtitleUpload, useSubtitleDelete } from '@/lib/api/hooks/useSubtitles';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function SubtitlesManagementPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const videoId = resolvedParams.id;
  const router = useRouter();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState('pt-BR');
  const [selectedLanguageLabel, setSelectedLanguageLabel] = useState('Português (Brasil)');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { subtitles, isLoading, mutate } = useSubtitles(videoId);
  const { upload, isUploading, uploadProgress } = useSubtitleUpload();
  const { deleteSubtitle, isDeleting } = useSubtitleDelete();

  // Idiomas suportados
  const languages = [
    { code: 'pt-BR', label: 'Português (Brasil)' },
    { code: 'pt-PT', label: 'Português (Portugal)' },
    { code: 'en-US', label: 'English (US)' },
    { code: 'en-GB', label: 'English (UK)' },
    { code: 'es-ES', label: 'Español (España)' },
    { code: 'es-MX', label: 'Español (México)' },
    { code: 'fr-FR', label: 'Français' },
    { code: 'de-DE', label: 'Deutsch' },
    { code: 'it-IT', label: 'Italiano' },
    { code: 'ja-JP', label: '日本語' },
    { code: 'ko-KR', label: '한국어' },
    { code: 'zh-CN', label: '简体中文' },
    { code: 'zh-TW', label: '繁體中文' },
    { code: 'ar-SA', label: 'العربية' },
    { code: 'ru-RU', label: 'Русский' },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.vtt')) {
        setUploadError('Apenas arquivos .vtt (WebVTT) são aceitos');
        return;
      }
      setSelectedFile(file);
      setUploadError(null);
    }
  };

  const handleLanguageChange = (code: string) => {
    setSelectedLanguage(code);
    const lang = languages.find((l) => l.code === code);
    if (lang) {
      setSelectedLanguageLabel(lang.label);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadError('Selecione um arquivo');
      return;
    }

    try {
      await upload(videoId, selectedLanguage, selectedLanguageLabel, selectedFile);
      setUploadSuccess(true);
      setSelectedFile(null);
      setUploadError(null);
      mutate(); // Revalidate subtitle list

      // Reset success message after 3 seconds
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (err: any) {
      setUploadError(err.message || 'Erro ao fazer upload');
    }
  };

  const handleDelete = async (language: string) => {
    if (!confirm(`Deseja realmente remover a legenda em ${language}?`)) {
      return;
    }

    try {
      await deleteSubtitle(videoId, language);
      mutate(); // Revalidate subtitle list
    } catch (err: any) {
      alert(`Erro ao remover legenda: ${err.message}`);
    }
  };

  const handleDownload = (subtitle: any) => {
    window.open(subtitle.subtitle_url, '_blank');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold">Gerenciar Legendas</h1>
          <p className="text-muted-foreground">
            Upload e gerenciamento de legendas (WebVTT) para o vídeo
          </p>
        </div>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload de Nova Legenda
          </CardTitle>
          <CardDescription>
            Faça upload de arquivos .vtt (WebVTT) para adicionar legendas ao vídeo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Success Message */}
          {uploadSuccess && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Legenda enviada com sucesso!
              </AlertDescription>
            </Alert>
          )}

          {/* Error Message */}
          {uploadError && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{uploadError}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Language Selection */}
            <div className="space-y-2">
              <Label htmlFor="language">
                <Globe className="h-4 w-4 inline mr-2" />
                Idioma
              </Label>
              <Select
                value={selectedLanguage}
                onValueChange={handleLanguageChange}
                disabled={isUploading}
              >
                <SelectTrigger id="language">
                  <SelectValue placeholder="Selecione o idioma" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.label} ({lang.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* File Selection */}
            <div className="space-y-2">
              <Label htmlFor="file">
                <FileText className="h-4 w-4 inline mr-2" />
                Arquivo .vtt
              </Label>
              <Input
                id="file"
                type="file"
                accept=".vtt"
                onChange={handleFileChange}
                disabled={isUploading}
              />
            </div>
          </div>

          {/* Selected File Info */}
          {selectedFile && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm">
                <strong>Arquivo selecionado:</strong> {selectedFile.name}
              </p>
              <p className="text-sm text-muted-foreground">
                Tamanho: {formatFileSize(selectedFile.size)}
              </p>
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Enviando legenda...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          {/* Upload Button */}
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Fazer Upload
              </>
            )}
          </Button>

          {/* Help Text */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>
              <strong>Formato WebVTT:</strong> Arquivo deve começar com "WEBVTT" na primeira linha
            </p>
            <p>
              <strong>Exemplo:</strong> Baixe um template{' '}
              <a
                href="https://www.w3.org/TR/webvtt1/#introduction-caption"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                aqui
              </a>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Subtitles List */}
      <Card>
        <CardHeader>
          <CardTitle>Legendas Disponíveis ({subtitles.length})</CardTitle>
          <CardDescription>
            Gerencie as legendas existentes para este vídeo
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : subtitles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma legenda disponível</p>
              <p className="text-sm">Faça upload da primeira legenda acima</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Idioma</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Arquivo</TableHead>
                  <TableHead>Tamanho</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subtitles.map((subtitle) => (
                  <TableRow key={subtitle.language}>
                    <TableCell className="font-medium">
                      {subtitle.language_label}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {subtitle.language}
                      </code>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {subtitle.filename}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatFileSize(subtitle.size_bytes)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(subtitle.uploaded_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(subtitle)}
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(subtitle.language)}
                          disabled={isDeleting}
                          title="Remover"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">ℹ️ Informações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong>Formato:</strong> Apenas arquivos WebVTT (.vtt) são suportados
          </p>
          <p>
            <strong>Múltiplos idiomas:</strong> Você pode ter várias legendas por vídeo
          </p>
          <p>
            <strong>Player:</strong> As legendas aparecerão automaticamente no botão "CC" do player
          </p>
          <p>
            <strong>Padrão:</strong> Legendas em pt-BR são ativadas automaticamente se disponíveis
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
