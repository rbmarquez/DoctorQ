/**
 * Componente para Gerenciar Módulos e Aulas de um Curso
 */
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Edit,
  Trash2,
  GripVertical,
  Video,
  FileText,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Modulo, Aula } from '@/lib/api/hooks/useUniversidade';

interface ModuloManagerProps {
  modulos: Modulo[];
  onAddModulo: (modulo: Omit<Modulo, 'id_modulo' | 'dt_criacao'>) => Promise<void>;
  onUpdateModulo: (id_modulo: string, modulo: Partial<Modulo>) => Promise<void>;
  onDeleteModulo: (id_modulo: string) => Promise<void>;
  onAddAula: (id_modulo: string, aula: Omit<Aula, 'id_aula' | 'dt_criacao'>) => Promise<void>;
  onUpdateAula: (id_aula: string, aula: Partial<Aula>) => Promise<void>;
  onDeleteAula: (id_aula: string) => Promise<void>;
  isLoading?: boolean;
}

export function ModuloManager({
  modulos,
  onAddModulo,
  onUpdateModulo,
  onDeleteModulo,
  onAddAula,
  onUpdateAula,
  onDeleteAula,
  isLoading,
}: ModuloManagerProps) {
  const [showModuloDialog, setShowModuloDialog] = useState(false);
  const [showAulaDialog, setShowAulaDialog] = useState(false);
  const [editingModulo, setEditingModulo] = useState<Modulo | null>(null);
  const [selectedModuloForAula, setSelectedModuloForAula] = useState<string | null>(null);

  const handleAddModulo = () => {
    setEditingModulo(null);
    setShowModuloDialog(true);
  };

  const handleEditModulo = (modulo: Modulo) => {
    setEditingModulo(modulo);
    setShowModuloDialog(true);
  };

  const handleAddAula = (id_modulo: string) => {
    setSelectedModuloForAula(id_modulo);
    setShowAulaDialog(true);
  };

  const getAulaIcon = (tipo: string) => {
    switch (tipo) {
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'pdf':
      case 'texto':
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getVideoStatusBadge = (status?: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge variant="default" className="bg-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completo
          </Badge>
        );
      case 'processing':
        return (
          <Badge variant="default" className="bg-blue-600">
            Processando
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Erro
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            Pendente
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Módulos e Aulas</h2>
          <p className="text-muted-foreground">
            {modulos.length} módulo{modulos.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={handleAddModulo}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Módulo
        </Button>
      </div>

      {/* Lista de Módulos */}
      {modulos.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Nenhum módulo criado</h3>
            <p className="text-muted-foreground mb-4">
              Comece estruturando seu curso em módulos temáticos
            </p>
            <Button onClick={handleAddModulo}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Módulo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" className="space-y-4">
          {modulos
            .sort((a, b) => a.ordem - b.ordem)
            .map((modulo) => (
              <AccordionItem
                key={modulo.id_modulo}
                value={modulo.id_modulo}
                className="border rounded-lg"
              >
                <Card>
                  <AccordionTrigger className="hover:no-underline px-6">
                    <div className="flex items-center justify-between w-full text-left">
                      <div className="flex items-center gap-3">
                        <GripVertical className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">Módulo {modulo.ordem}</span>
                            <span className="text-muted-foreground">—</span>
                            <span>{modulo.titulo}</span>
                          </div>
                          {modulo.aulas && (
                            <p className="text-sm text-muted-foreground">
                              {modulo.aulas.length} aula{modulo.aulas.length !== 1 ? 's' : ''}
                              {modulo.duracao_minutos > 0 && ` • ${modulo.duracao_minutos} min`}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditModulo(modulo)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteModulo(modulo.id_modulo)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent>
                    <CardContent className="space-y-4">
                      {modulo.descricao && (
                        <p className="text-sm text-muted-foreground">{modulo.descricao}</p>
                      )}

                      {/* Lista de Aulas */}
                      <div className="space-y-2">
                        {modulo.aulas && modulo.aulas.length > 0 ? (
                          modulo.aulas
                            .sort((a, b) => a.ordem - b.ordem)
                            .map((aula) => (
                              <div
                                key={aula.id_aula}
                                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  {getAulaIcon(aula.tipo || 'texto')}
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{aula.titulo}</p>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <span>Aula {aula.ordem}</span>
                                      {aula.duracao_minutos > 0 && (
                                        <>
                                          <span>•</span>
                                          <span>{aula.duracao_minutos} min</span>
                                        </>
                                      )}
                                      {aula.tipo === 'video' && aula.video_status && (
                                        <>
                                          <span>•</span>
                                          {getVideoStatusBadge(aula.video_status)}
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button variant="ghost" size="sm">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onDeleteAula(aula.id_aula)}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              </div>
                            ))
                        ) : (
                          <div className="text-center py-6 text-muted-foreground text-sm">
                            Nenhuma aula neste módulo
                          </div>
                        )}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddAula(modulo.id_modulo)}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Aula
                      </Button>
                    </CardContent>
                  </AccordionContent>
                </Card>
              </AccordionItem>
            ))}
        </Accordion>
      )}

      {/* Dialogs (formulários) serão implementados separadamente */}
    </div>
  );
}
