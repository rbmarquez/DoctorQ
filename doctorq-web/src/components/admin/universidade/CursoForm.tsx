/**
 * Formulário de Criação/Edição de Curso
 */
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import type { Curso } from '@/lib/api/hooks/useUniversidade';

interface CursoFormData {
  titulo: string;
  slug: string;
  descricao: string;
  nivel: 'iniciante' | 'intermediario' | 'avancado' | 'expert';
  categoria: string;
  duracao_horas: number;
  preco: number;
  preco_assinante: number;
  thumbnail_url: string;
  video_intro_url: string;
  instrutor_nome: string;
  certificacao_tipo: 'bronze' | 'prata' | 'ouro' | 'diamante' | '';
  tags: string[];
}

interface CursoFormProps {
  curso?: Curso;
  onSubmit: (data: CursoFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const CATEGORIAS = [
  'Injetáveis',
  'Facial',
  'Corporal',
  'Fios',
  'Peelings',
  'Lasers',
  'Negócios',
  'Gestão',
  'Marketing',
  'Vendas',
];

export function CursoForm({ curso, onSubmit, onCancel, isSubmitting }: CursoFormProps) {
  const [formData, setFormData] = useState<CursoFormData>({
    titulo: '',
    slug: '',
    descricao: '',
    nivel: 'iniciante',
    categoria: '',
    duracao_horas: 0,
    preco: 0,
    preco_assinante: 0,
    thumbnail_url: '',
    video_intro_url: '',
    instrutor_nome: '',
    certificacao_tipo: '',
    tags: [],
  });

  const [newTag, setNewTag] = useState('');

  // Preencher formulário se estiver editando
  useEffect(() => {
    if (curso) {
      setFormData({
        titulo: curso.titulo,
        slug: curso.slug,
        descricao: curso.descricao || '',
        nivel: curso.nivel as any,
        categoria: curso.categoria || '',
        duracao_horas: curso.duracao_horas,
        preco: curso.preco,
        preco_assinante: curso.preco_assinante,
        thumbnail_url: curso.thumbnail_url || '',
        video_intro_url: curso.video_intro_url || '',
        instrutor_nome: curso.instrutor_nome || '',
        certificacao_tipo: (curso.certificacao_tipo || '') as any,
        tags: curso.tags || [],
      });
    }
  }, [curso]);

  // Auto-gerar slug a partir do título
  const handleTituloChange = (titulo: string) => {
    setFormData((prev) => ({
      ...prev,
      titulo,
      slug: titulo
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, ''),
    }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Informações Básicas */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Básicas</CardTitle>
          <CardDescription>Dados principais do curso</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) => handleTituloChange(e.target.value)}
                required
                placeholder="Ex: Botox Avançado - Técnicas Seguras"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug (URL) *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                required
                placeholder="botox-avancado-tecnicas-seguras"
              />
              <p className="text-xs text-muted-foreground">
                URL amigável para SEO (gerada automaticamente do título)
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              rows={4}
              placeholder="Descreva o curso, objetivos de aprendizado e público-alvo..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria *</Label>
              <Select
                value={formData.categoria}
                onValueChange={(value) => setFormData({ ...formData, categoria: value })}
              >
                <SelectTrigger id="categoria">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map((cat) => (
                    <SelectItem key={cat} value={cat.toLowerCase()}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nivel">Nível *</Label>
              <Select
                value={formData.nivel}
                onValueChange={(value: any) => setFormData({ ...formData, nivel: value })}
              >
                <SelectTrigger id="nivel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="iniciante">Iniciante</SelectItem>
                  <SelectItem value="intermediario">Intermediário</SelectItem>
                  <SelectItem value="avancado">Avançado</SelectItem>
                  <SelectItem value="expert">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duracao_horas">Duração (horas)</Label>
              <Input
                id="duracao_horas"
                type="number"
                min="0"
                value={formData.duracao_horas}
                onChange={(e) =>
                  setFormData({ ...formData, duracao_horas: parseInt(e.target.value) || 0 })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instrutor e Certificação */}
      <Card>
        <CardHeader>
          <CardTitle>Instrutor e Certificação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="instrutor_nome">Nome do Instrutor</Label>
              <Input
                id="instrutor_nome"
                value={formData.instrutor_nome}
                onChange={(e) => setFormData({ ...formData, instrutor_nome: e.target.value })}
                placeholder="Ex: Dra. Maria Silva"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="certificacao_tipo">Tipo de Certificação</Label>
              <Select
                value={formData.certificacao_tipo}
                onValueChange={(value: any) => setFormData({ ...formData, certificacao_tipo: value })}
              >
                <SelectTrigger id="certificacao_tipo">
                  <SelectValue placeholder="Sem certificado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sem certificado</SelectItem>
                  <SelectItem value="bronze">🥉 Bronze (20-40h)</SelectItem>
                  <SelectItem value="prata">🥈 Prata (40-80h)</SelectItem>
                  <SelectItem value="ouro">🥇 Ouro (80-120h)</SelectItem>
                  <SelectItem value="diamante">💎 Diamante (120h+)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preços */}
      <Card>
        <CardHeader>
          <CardTitle>Precificação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="preco">Preço Padrão (R$)</Label>
              <Input
                id="preco"
                type="number"
                min="0"
                step="0.01"
                value={formData.preco}
                onChange={(e) => setFormData({ ...formData, preco: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preco_assinante">Preço para Assinantes (R$)</Label>
              <Input
                id="preco_assinante"
                type="number"
                min="0"
                step="0.01"
                value={formData.preco_assinante}
                onChange={(e) =>
                  setFormData({ ...formData, preco_assinante: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mídias */}
      <Card>
        <CardHeader>
          <CardTitle>Imagens e Vídeos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="thumbnail_url">URL da Thumbnail</Label>
              <Input
                id="thumbnail_url"
                type="url"
                value={formData.thumbnail_url}
                onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="video_intro_url">URL do Vídeo de Introdução</Label>
              <Input
                id="video_intro_url"
                type="url"
                value={formData.video_intro_url}
                onChange={(e) => setFormData({ ...formData, video_intro_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tags */}
      <Card>
        <CardHeader>
          <CardTitle>Tags</CardTitle>
          <CardDescription>Palavras-chave para busca e categorização</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Ex: botox, toxina, procedimento"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
            />
            <Button type="button" onClick={handleAddTag} variant="secondary">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ações */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : curso ? 'Atualizar Curso' : 'Criar Curso'}
        </Button>
      </div>
    </form>
  );
}
