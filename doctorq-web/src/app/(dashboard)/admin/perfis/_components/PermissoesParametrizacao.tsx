/**
 * Componente de Parametrização de Permissões
 * Similar ao sistema do Maua - permite configurar permissões por recurso/ação
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Loader2,
  Save,
  Search,
  Plus,
  Shield,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  PlusCircle,
  Calendar,
  Users,
  UserPlus,
  Briefcase,
  DollarSign,
  FileText,
  Settings,
  UsersRound,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { usePerfis, atualizarPerfil, type Perfil } from '@/lib/api/hooks/usePerfis';

// ====================================================================
// TIPOS
// ====================================================================

interface Recurso {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  acoes: Acao[];
}

interface Acao {
  key: string;
  label: string;
  description: string;
}

interface PermissaoGrupo {
  [recurso: string]: {
    [acao: string]: boolean;
  };
}

interface PermissoesDetalhadas {
  [grupo: string]: PermissaoGrupo;
}

// ====================================================================
// CONSTANTES - RECURSOS E AÇÕES DISPONÍVEIS
// ====================================================================

const GRUPOS_ACESSO = [
  { key: 'admin', label: 'Administrador', color: 'bg-purple-100 text-purple-800' },
  { key: 'clinica', label: 'Clínica', color: 'bg-blue-100 text-blue-800' },
  { key: 'profissional', label: 'Profissional', color: 'bg-green-100 text-green-800' },
  { key: 'paciente', label: 'Paciente', color: 'bg-gray-100 text-gray-800' },
  { key: 'fornecedor', label: 'Fornecedor', color: 'bg-orange-100 text-orange-800' },
];

const RECURSOS: Recurso[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    description: 'Painel principal com métricas e resumos',
    icon: <Shield className="h-4 w-4" />,
    acoes: [
      { key: 'visualizar', label: 'Visualizar', description: 'Ver dashboard' },
    ],
  },
  {
    key: 'agendamentos',
    label: 'Agendamentos',
    description: 'Gestão de agendamentos de consultas e procedimentos',
    icon: <Calendar className="h-4 w-4" />,
    acoes: [
      { key: 'visualizar', label: 'Visualizar', description: 'Ver agendamentos' },
      { key: 'criar', label: 'Criar', description: 'Criar novos agendamentos' },
      { key: 'editar', label: 'Editar', description: 'Modificar agendamentos' },
      { key: 'excluir', label: 'Excluir', description: 'Remover agendamentos' },
    ],
  },
  {
    key: 'pacientes',
    label: 'Pacientes',
    description: 'Cadastro e gestão de pacientes',
    icon: <Users className="h-4 w-4" />,
    acoes: [
      { key: 'visualizar', label: 'Visualizar', description: 'Ver dados de pacientes' },
      { key: 'criar', label: 'Criar', description: 'Cadastrar novos pacientes' },
      { key: 'editar', label: 'Editar', description: 'Alterar dados de pacientes' },
      { key: 'excluir', label: 'Excluir', description: 'Remover cadastros' },
    ],
  },
  {
    key: 'profissionais',
    label: 'Profissionais',
    description: 'Cadastro e gestão de profissionais',
    icon: <UserPlus className="h-4 w-4" />,
    acoes: [
      { key: 'visualizar', label: 'Visualizar', description: 'Ver profissionais' },
      { key: 'criar', label: 'Criar', description: 'Adicionar profissionais' },
      { key: 'editar', label: 'Editar', description: 'Alterar dados' },
      { key: 'excluir', label: 'Excluir', description: 'Remover profissionais' },
    ],
  },
  {
    key: 'procedimentos',
    label: 'Procedimentos',
    description: 'Catálogo de procedimentos e serviços',
    icon: <Briefcase className="h-4 w-4" />,
    acoes: [
      { key: 'visualizar', label: 'Visualizar', description: 'Ver procedimentos' },
      { key: 'criar', label: 'Criar', description: 'Adicionar procedimentos' },
      { key: 'editar', label: 'Editar', description: 'Alterar procedimentos' },
      { key: 'excluir', label: 'Excluir', description: 'Remover procedimentos' },
    ],
  },
  {
    key: 'financeiro',
    label: 'Financeiro',
    description: 'Gestão financeira e faturamento',
    icon: <DollarSign className="h-4 w-4" />,
    acoes: [
      { key: 'visualizar', label: 'Visualizar', description: 'Ver dados financeiros' },
      { key: 'criar', label: 'Criar', description: 'Criar lançamentos' },
      { key: 'editar', label: 'Editar', description: 'Alterar lançamentos' },
      { key: 'excluir', label: 'Excluir', description: 'Remover lançamentos' },
    ],
  },
  {
    key: 'relatorios',
    label: 'Relatórios',
    description: 'Relatórios e análises',
    icon: <FileText className="h-4 w-4" />,
    acoes: [
      { key: 'visualizar', label: 'Visualizar', description: 'Ver relatórios' },
      { key: 'exportar', label: 'Exportar', description: 'Exportar relatórios' },
    ],
  },
  {
    key: 'equipe',
    label: 'Equipe',
    description: 'Gestão de usuários e equipe',
    icon: <UsersRound className="h-4 w-4" />,
    acoes: [
      { key: 'visualizar', label: 'Visualizar', description: 'Ver membros da equipe' },
      { key: 'criar', label: 'Criar', description: 'Adicionar membros' },
      { key: 'editar', label: 'Editar', description: 'Alterar dados' },
      { key: 'excluir', label: 'Excluir', description: 'Remover membros' },
    ],
  },
  {
    key: 'perfis',
    label: 'Perfis e Permissões',
    description: 'Gestão de perfis de acesso e permissões',
    icon: <ShieldCheck className="h-4 w-4" />,
    acoes: [
      { key: 'visualizar', label: 'Visualizar', description: 'Ver perfis' },
      { key: 'criar', label: 'Criar', description: 'Criar perfis' },
      { key: 'editar', label: 'Editar', description: 'Alterar perfis' },
      { key: 'excluir', label: 'Excluir', description: 'Remover perfis' },
    ],
  },
  {
    key: 'configuracoes',
    label: 'Configurações',
    description: 'Configurações do sistema',
    icon: <Settings className="h-4 w-4" />,
    acoes: [
      { key: 'visualizar', label: 'Visualizar', description: 'Ver configurações' },
      { key: 'editar', label: 'Editar', description: 'Alterar configurações' },
    ],
  },
];

const ACOES_ICONS: Record<string, React.ReactNode> = {
  visualizar: <Eye className="h-3 w-3" />,
  criar: <PlusCircle className="h-3 w-3" />,
  editar: <Edit className="h-3 w-3" />,
  excluir: <Trash2 className="h-3 w-3" />,
  exportar: <FileText className="h-3 w-3" />,
};

// ====================================================================
// COMPONENTE PRINCIPAL
// ====================================================================

interface PermissoesParametrizacaoProps {
  onPerfilUpdated?: () => void;
}

export function PermissoesParametrizacao({ onPerfilUpdated }: PermissoesParametrizacaoProps) {
  // Estados
  const [perfilSelecionado, setPerfilSelecionado] = useState<Perfil | null>(null);
  const [grupoSelecionado, setGrupoSelecionado] = useState<string>('admin');
  const [permissoes, setPermissoes] = useState<PermissoesDetalhadas>({});
  const [permissoesOriginais, setPermissoesOriginais] = useState<PermissoesDetalhadas>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Hook para buscar perfis
  const { perfis, isLoading, mutate } = usePerfis({ size: 100, ativo: 'S' });

  // Filtrar recursos baseado na busca
  const recursosFiltrados = useMemo(() => {
    if (!searchTerm) return RECURSOS;
    const termo = searchTerm.toLowerCase();
    return RECURSOS.filter(
      (r) =>
        r.label.toLowerCase().includes(termo) ||
        r.description.toLowerCase().includes(termo)
    );
  }, [searchTerm]);

  // Grupos disponíveis para o perfil selecionado
  const gruposDisponiveis = useMemo(() => {
    if (!perfilSelecionado) return [];
    return perfilSelecionado.ds_grupos_acesso || [];
  }, [perfilSelecionado]);

  // Carregar permissões quando selecionar um perfil
  useEffect(() => {
    if (perfilSelecionado) {
      const permissoesAtuais = perfilSelecionado.ds_permissoes_detalhadas || {};
      setPermissoes(JSON.parse(JSON.stringify(permissoesAtuais)));
      setPermissoesOriginais(JSON.parse(JSON.stringify(permissoesAtuais)));

      // Selecionar primeiro grupo disponível
      if (perfilSelecionado.ds_grupos_acesso?.length > 0) {
        setGrupoSelecionado(perfilSelecionado.ds_grupos_acesso[0]);
      }
    } else {
      setPermissoes({});
      setPermissoesOriginais({});
    }
    setHasChanges(false);
  }, [perfilSelecionado]);

  // Detectar mudanças
  useEffect(() => {
    const changed = JSON.stringify(permissoes) !== JSON.stringify(permissoesOriginais);
    setHasChanges(changed);
  }, [permissoes, permissoesOriginais]);

  // Handler para toggle de permissão
  const togglePermissao = (recurso: string, acao: string) => {
    setPermissoes((prev) => {
      const newPermissoes = { ...prev };

      if (!newPermissoes[grupoSelecionado]) {
        newPermissoes[grupoSelecionado] = {};
      }

      if (!newPermissoes[grupoSelecionado][recurso]) {
        newPermissoes[grupoSelecionado][recurso] = {};
      }

      newPermissoes[grupoSelecionado][recurso][acao] =
        !newPermissoes[grupoSelecionado][recurso]?.[acao];

      return newPermissoes;
    });
  };

  // Handler para marcar todas as ações de um recurso
  const toggleTodasAcoesRecurso = (recurso: Recurso, marcar: boolean) => {
    setPermissoes((prev) => {
      const newPermissoes = { ...prev };

      if (!newPermissoes[grupoSelecionado]) {
        newPermissoes[grupoSelecionado] = {};
      }

      newPermissoes[grupoSelecionado][recurso.key] = {};

      recurso.acoes.forEach((acao) => {
        newPermissoes[grupoSelecionado][recurso.key][acao.key] = marcar;
      });

      return newPermissoes;
    });
  };

  // Handler para marcar todos os recursos
  const toggleTodos = (marcar: boolean) => {
    setPermissoes((prev) => {
      const newPermissoes = { ...prev };

      if (!newPermissoes[grupoSelecionado]) {
        newPermissoes[grupoSelecionado] = {};
      }

      RECURSOS.forEach((recurso) => {
        newPermissoes[grupoSelecionado][recurso.key] = {};
        recurso.acoes.forEach((acao) => {
          newPermissoes[grupoSelecionado][recurso.key][acao.key] = marcar;
        });
      });

      return newPermissoes;
    });
  };

  // Verificar se uma permissão está ativa
  const isPermissaoAtiva = (recurso: string, acao: string): boolean => {
    return permissoes[grupoSelecionado]?.[recurso]?.[acao] === true;
  };

  // Verificar se todas as ações de um recurso estão ativas
  const isTodasAcoesAtivas = (recurso: Recurso): boolean => {
    return recurso.acoes.every((acao) => isPermissaoAtiva(recurso.key, acao.key));
  };

  // Verificar se pelo menos uma ação está ativa
  const isAlgumaAcaoAtiva = (recurso: Recurso): boolean => {
    return recurso.acoes.some((acao) => isPermissaoAtiva(recurso.key, acao.key));
  };

  // Contar permissões ativas
  const contarPermissoesAtivas = (): number => {
    let count = 0;
    const grupoPermissoes = permissoes[grupoSelecionado];
    if (!grupoPermissoes) return 0;

    Object.values(grupoPermissoes).forEach((recursoPerms) => {
      Object.values(recursoPerms).forEach((ativo) => {
        if (ativo) count++;
      });
    });

    return count;
  };

  // Salvar permissões
  const handleSalvar = async () => {
    if (!perfilSelecionado) return;

    setIsSaving(true);
    try {
      await atualizarPerfil(perfilSelecionado.id_perfil, {
        ds_permissoes_detalhadas: permissoes,
      });

      toast.success('Permissões atualizadas com sucesso!');
      setPermissoesOriginais(JSON.parse(JSON.stringify(permissoes)));
      setHasChanges(false);
      mutate();
      onPerfilUpdated?.();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar permissões');
    } finally {
      setIsSaving(false);
    }
  };

  // Descartar alterações
  const handleDescartar = () => {
    setPermissoes(JSON.parse(JSON.stringify(permissoesOriginais)));
    setHasChanges(false);
    toast.info('Alterações descartadas');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Parametrização de Permissões</h2>
          <p className="text-sm text-muted-foreground">
            Configure as permissões de cada recurso por perfil
          </p>
        </div>
      </div>

      {/* Seleção de Perfil e Grupo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Selecione o Perfil</CardTitle>
          <CardDescription>
            Escolha um perfil para configurar suas permissões
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Seletor de Perfil */}
            <div className="space-y-2">
              <Label>Perfil</Label>
              <Select
                value={perfilSelecionado?.id_perfil || ''}
                onValueChange={(value) => {
                  const perfil = perfis.find((p) => p.id_perfil === value);
                  setPerfilSelecionado(perfil || null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um perfil" />
                </SelectTrigger>
                <SelectContent>
                  {isLoading ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : (
                    perfis.map((perfil) => (
                      <SelectItem key={perfil.id_perfil} value={perfil.id_perfil}>
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          <span>{perfil.nm_perfil}</span>
                          {perfil.nm_tipo === 'system' && (
                            <Badge variant="secondary" className="text-xs">
                              Sistema
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Seletor de Grupo de Acesso */}
            {perfilSelecionado && gruposDisponiveis.length > 0 && (
              <div className="space-y-2">
                <Label>Grupo de Acesso</Label>
                <Select
                  value={grupoSelecionado}
                  onValueChange={setGrupoSelecionado}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um grupo" />
                  </SelectTrigger>
                  <SelectContent>
                    {gruposDisponiveis.map((grupo: string) => {
                      const grupoInfo = GRUPOS_ACESSO.find((g) => g.key === grupo);
                      return (
                        <SelectItem key={grupo} value={grupo}>
                          <div className="flex items-center gap-2">
                            <Badge className={grupoInfo?.color || 'bg-gray-100'}>
                              {grupoInfo?.label || grupo}
                            </Badge>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Info do perfil selecionado */}
          {perfilSelecionado && (
            <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
              <div className="flex-1">
                <p className="font-medium">{perfilSelecionado.nm_perfil}</p>
                <p className="text-sm text-muted-foreground">
                  {perfilSelecionado.ds_perfil || 'Sem descrição'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {contarPermissoesAtivas()} permissões ativas
                </Badge>
                {hasChanges && (
                  <Badge variant="destructive">
                    Alterações não salvas
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabela de Permissões */}
      {perfilSelecionado && gruposDisponiveis.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Permissões do Grupo</CardTitle>
                <CardDescription>
                  Marque as permissões para o grupo "{GRUPOS_ACESSO.find(g => g.key === grupoSelecionado)?.label}"
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleTodos(true)}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Marcar Todos
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleTodos(false)}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Desmarcar Todos
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Busca */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar recurso..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Tabela */}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">Recurso</TableHead>
                    <TableHead className="text-center w-[80px]">
                      <div className="flex flex-col items-center gap-1">
                        {ACOES_ICONS.visualizar}
                        <span className="text-xs">Ver</span>
                      </div>
                    </TableHead>
                    <TableHead className="text-center w-[80px]">
                      <div className="flex flex-col items-center gap-1">
                        {ACOES_ICONS.criar}
                        <span className="text-xs">Criar</span>
                      </div>
                    </TableHead>
                    <TableHead className="text-center w-[80px]">
                      <div className="flex flex-col items-center gap-1">
                        {ACOES_ICONS.editar}
                        <span className="text-xs">Editar</span>
                      </div>
                    </TableHead>
                    <TableHead className="text-center w-[80px]">
                      <div className="flex flex-col items-center gap-1">
                        {ACOES_ICONS.excluir}
                        <span className="text-xs">Excluir</span>
                      </div>
                    </TableHead>
                    <TableHead className="text-center w-[80px]">
                      <div className="flex flex-col items-center gap-1">
                        {ACOES_ICONS.exportar}
                        <span className="text-xs">Exportar</span>
                      </div>
                    </TableHead>
                    <TableHead className="text-center w-[100px]">Todos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recursosFiltrados.map((recurso) => (
                    <TableRow key={recurso.key}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {recurso.icon}
                          <div>
                            <p className="font-medium">{recurso.label}</p>
                            <p className="text-xs text-muted-foreground">
                              {recurso.description}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Ações padrão */}
                      {['visualizar', 'criar', 'editar', 'excluir', 'exportar'].map((acao) => {
                        const acaoExiste = recurso.acoes.some((a) => a.key === acao);
                        return (
                          <TableCell key={acao} className="text-center">
                            {acaoExiste ? (
                              <Checkbox
                                checked={isPermissaoAtiva(recurso.key, acao)}
                                onCheckedChange={() => togglePermissao(recurso.key, acao)}
                              />
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        );
                      })}

                      {/* Toggle todos */}
                      <TableCell className="text-center">
                        <Checkbox
                          checked={isTodasAcoesAtivas(recurso)}
                          onCheckedChange={(checked) =>
                            toggleTodasAcoesRecurso(recurso, checked as boolean)
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerta se perfil não tem grupos */}
      {perfilSelecionado && gruposDisponiveis.length === 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Este perfil não possui grupos de acesso configurados.
            Edite o perfil e adicione grupos de acesso primeiro.
          </AlertDescription>
        </Alert>
      )}

      {/* Botões de Ação */}
      {perfilSelecionado && hasChanges && (
        <div className="flex items-center justify-end gap-2 sticky bottom-4 bg-background p-4 border rounded-lg shadow-lg">
          <p className="text-sm text-muted-foreground flex-1">
            Você tem alterações não salvas
          </p>
          <Button variant="outline" onClick={handleDescartar} disabled={isSaving}>
            Descartar
          </Button>
          <Button onClick={handleSalvar} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {!isSaving && <Save className="mr-2 h-4 w-4" />}
            Salvar Alterações
          </Button>
        </div>
      )}
    </div>
  );
}
