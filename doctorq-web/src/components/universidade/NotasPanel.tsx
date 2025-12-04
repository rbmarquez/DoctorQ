/**
 * Painel de Notas da Aula
 * Permite criar, editar e visualizar notas com timestamps
 */
'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { MessageSquare, Plus, Edit2, Trash2, Clock, Lock, Unlock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const UNIV_API_URL = process.env.NEXT_PUBLIC_UNIV_API_URL || 'http://localhost:8081';

interface Nota {
  id_nota: string;
  id_usuario: string;
  id_aula: string;
  conteudo: string;
  timestamp_video: number | null;
  fg_publica: boolean;
  dt_criacao: string;
  dt_atualizacao: string | null;
}

interface NotasPanelProps {
  aulaId: string;
  currentTimestamp?: number;
  onSeekTo?: (timestamp: number) => void;
}

export function NotasPanel({ aulaId, currentTimestamp, onSeekTo }: NotasPanelProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingNota, setEditingNota] = useState<Nota | null>(null);
  const [novoConteudo, setNovoConteudo] = useState('');
  const [isPublica, setIsPublica] = useState(false);
  const [addTimestamp, setAddTimestamp] = useState(true);

  // Fetch notas da aula
  const { data: notas, isLoading, mutate } = useSWR<Nota[]>(
    `${UNIV_API_URL}/notas/aula/${aulaId}/`,
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) return [];
      return res.json();
    }
  );

  const handleCriarNota = async () => {
    if (!novoConteudo.trim()) return;

    try {
      const res = await fetch(`${UNIV_API_URL}/notas/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_aula: aulaId,
          conteudo: novoConteudo,
          timestamp_video: addTimestamp ? currentTimestamp || null : null,
          fg_publica: isPublica,
        }),
      });

      if (res.ok) {
        setNovoConteudo('');
        setIsPublica(false);
        setIsCreating(false);
        mutate();
      }
    } catch (error) {
      console.error('Erro ao criar nota:', error);
    }
  };

  const handleEditarNota = async () => {
    if (!editingNota || !novoConteudo.trim()) return;

    try {
      const res = await fetch(`${UNIV_API_URL}/notas/${editingNota.id_nota}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conteudo: novoConteudo,
          fg_publica: isPublica,
        }),
      });

      if (res.ok) {
        setNovoConteudo('');
        setEditingNota(null);
        mutate();
      }
    } catch (error) {
      console.error('Erro ao editar nota:', error);
    }
  };

  const handleDeletarNota = async (idNota: string) => {
    if (!confirm('Tem certeza que deseja deletar esta nota?')) return;

    try {
      const res = await fetch(`${UNIV_API_URL}/notas/${idNota}/`, {
        method: 'DELETE',
      });

      if (res.ok) {
        mutate();
      }
    } catch (error) {
      console.error('Erro ao deletar nota:', error);
    }
  };

  const formatTimestamp = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const openEditDialog = (nota: Nota) => {
    setEditingNota(nota);
    setNovoConteudo(nota.conteudo);
    setIsPublica(nota.fg_publica);
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Minhas Notas
            </CardTitle>
            <CardDescription>
              {notas?.length || 0} {notas?.length === 1 ? 'nota' : 'notas'} nesta aula
            </CardDescription>
          </div>
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nova Nota
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Nova Nota</DialogTitle>
                <DialogDescription>
                  Adicione suas anotações sobre esta aula
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Textarea
                  placeholder="Digite sua nota aqui..."
                  value={novoConteudo}
                  onChange={(e) => setNovoConteudo(e.target.value)}
                  rows={6}
                />
                {currentTimestamp !== undefined && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Salvar no momento {formatTimestamp(currentTimestamp)}
                      </span>
                    </div>
                    <Switch checked={addTimestamp} onCheckedChange={setAddTimestamp} />
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isPublica ? (
                      <Unlock className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="text-sm text-muted-foreground">
                      {isPublica ? 'Nota pública (visível para todos)' : 'Nota privada (só você vê)'}
                    </span>
                  </div>
                  <Switch checked={isPublica} onCheckedChange={setIsPublica} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCriarNota}>Salvar Nota</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : notas && notas.length > 0 ? (
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {notas.map((nota) => (
              <Card key={nota.id_nota} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    {nota.timestamp_video !== null && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-primary h-6 px-2"
                        onClick={() => onSeekTo?.(nota.timestamp_video!)}
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        {formatTimestamp(nota.timestamp_video)}
                      </Button>
                    )}
                    {nota.fg_publica ? (
                      <Badge variant="secondary" className="text-xs">
                        <Unlock className="h-3 w-3 mr-1" />
                        Pública
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        <Lock className="h-3 w-3 mr-1" />
                        Privada
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => openEditDialog(nota)}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Editar Nota</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <Textarea
                            placeholder="Digite sua nota aqui..."
                            value={novoConteudo}
                            onChange={(e) => setNovoConteudo(e.target.value)}
                            rows={6}
                          />
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Nota pública</span>
                            <Switch checked={isPublica} onCheckedChange={setIsPublica} />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setEditingNota(null)}>
                            Cancelar
                          </Button>
                          <Button onClick={handleEditarNota}>Salvar</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      onClick={() => handleDeletarNota(nota.id_nota)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm whitespace-pre-wrap">{nota.conteudo}</p>
                <div className="text-xs text-muted-foreground mt-2">
                  {new Date(nota.dt_criacao).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-3">Nenhuma nota ainda</p>
            <p className="text-sm text-muted-foreground">
              Clique em "Nova Nota" para adicionar suas anotações
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
