'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { useCampanhas, Campanha, CampanhaCreate, CampanhaUpdate, CampanhaMetricas, TipoCampanha, TipoCanal } from '@/lib/api/hooks/central-atendimento/useCampanhas';
import { useCentralAtendimento, ContatoOmni } from '@/lib/api/hooks/central-atendimento/useCentralAtendimento';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Target,
  Plus,
  MoreHorizontal,
  Play,
  Pause,
  Trash2,
  Edit,
  BarChart3,
  Send,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
  Mail,
  Phone,
  TrendingUp,
  Eye,
  MessageCircle,
  StopCircle,
  Filter,
  UserPlus,
  RefreshCw,
  Percent,
} from 'lucide-react';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';

// Tipos de campanha alinhados com o backend
const CAMPANHA_TIPOS: Record<string, { label: string; description: string }> = {
  prospeccao: { label: 'Prospecção', description: 'Prospecção de novos leads' },
  reengajamento: { label: 'Reengajamento', description: 'Reativar leads inativos' },
  marketing: { label: 'Marketing', description: 'Campanhas promocionais' },
  lembrete: { label: 'Lembrete', description: 'Lembretes de agendamento' },
  followup: { label: 'Follow-up', description: 'Acompanhamento pós-atendimento' },
  pesquisa: { label: 'Pesquisa', description: 'Pesquisa de satisfação' },
};

// Canais disponíveis alinhados com o backend
const CAMPANHA_CANAIS: Record<string, { label: string; icon: React.ElementType }> = {
  whatsapp: { label: 'WhatsApp', icon: MessageSquare },
  instagram: { label: 'Instagram', icon: MessageCircle },
  facebook: { label: 'Facebook', icon: MessageCircle },
  email: { label: 'E-mail', icon: Mail },
  sms: { label: 'SMS', icon: Phone },
  webchat: { label: 'WebChat', icon: MessageSquare },
};

// Status alinhados com o backend
const STATUS_COLORS: Record<string, string> = {
  rascunho: 'bg-gray-500',
  agendada: 'bg-blue-500',
  em_execucao: 'bg-green-500',
  pausada: 'bg-orange-500',
  concluida: 'bg-gray-500',
  cancelada: 'bg-red-500',
};

const STATUS_LABELS: Record<string, string> = {
  rascunho: 'Rascunho',
  agendada: 'Agendada',
  em_execucao: 'Em Execução',
  pausada: 'Pausada',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
};

export default function CampanhasPage() {
  const {
    campanhas,
    isLoading,
    criarCampanha,
    atualizarCampanha,
    excluirCampanha,
    iniciarCampanha,
    pausarCampanha,
    retomarCampanha,
    cancelarCampanha,
    obterMetricas,
    adicionarDestinatarios,
    adicionarDestinatariosPorFiltro,
  } = useCampanhas();

  // Hook para listar contatos
  const { contatos, totalContatos, isLoading: loadingContatos } = useCentralAtendimento();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isMetricasOpen, setIsMetricasOpen] = useState(false);
  const [isDestinatariosOpen, setIsDestinatariosOpen] = useState(false);
  const [selectedCampanha, setSelectedCampanha] = useState<Campanha | null>(null);
  const [metricas, setMetricas] = useState<CampanhaMetricas | null>(null);
  const [loadingMetricas, setLoadingMetricas] = useState(false);
  const [activeTab, setActiveTab] = useState('todas');

  const [formData, setFormData] = useState<CampanhaCreate>({
    nm_campanha: '',
    ds_descricao: '',
    tp_campanha: 'prospeccao',
    tp_canal: 'whatsapp',
    ds_mensagem: '',
  });

  const [editData, setEditData] = useState<CampanhaUpdate>({});

  // Estados para gerenciamento de destinatários
  const [destTab, setDestTab] = useState<'selecionar' | 'filtro'>('selecionar');
  const [selectedContatos, setSelectedContatos] = useState<string[]>([]);
  const [searchContato, setSearchContato] = useState('');
  const [addingDestinatarios, setAddingDestinatarios] = useState(false);

  // Filtros para adicionar destinatários
  const [filtrosDestinatarios, setFiltrosDestinatarios] = useState({
    tags: [] as string[],
    status: [] as string[],
  });

  // Filtrar contatos baseado na busca
  const filteredContatos = contatos.filter((c) => {
    if (!searchContato) return true;
    const termo = searchContato.toLowerCase();
    return (
      c.nm_contato?.toLowerCase().includes(termo) ||
      c.nr_telefone?.includes(termo) ||
      c.nm_email?.toLowerCase().includes(termo)
    );
  });

  const resetForm = () => {
    setFormData({
      nm_campanha: '',
      ds_descricao: '',
      tp_campanha: 'prospeccao',
      tp_canal: 'whatsapp',
      ds_mensagem: '',
    });
  };

  const handleCreate = async () => {
    // Validação
    if (!formData.nm_campanha.trim()) {
      toast.error('O nome da campanha é obrigatório');
      return;
    }
    if (!formData.ds_mensagem.trim()) {
      toast.error('A mensagem da campanha é obrigatória');
      return;
    }

    try {
      await criarCampanha(formData);
      toast.success('Campanha criada com sucesso!');
      setIsCreateOpen(false);
      resetForm();
    } catch (error) {
      toast.error('Erro ao criar campanha');
    }
  };

  const handleStart = async (idCampanha: string) => {
    try {
      await iniciarCampanha(idCampanha);
      toast.success('Campanha iniciada!');
    } catch (error) {
      toast.error('Erro ao iniciar campanha');
    }
  };

  const handlePause = async (idCampanha: string) => {
    try {
      await pausarCampanha(idCampanha);
      toast.success('Campanha pausada!');
    } catch (error) {
      toast.error('Erro ao pausar campanha');
    }
  };

  const handleDelete = async (idCampanha: string) => {
    if (!confirm('Tem certeza que deseja excluir esta campanha?')) return;
    try {
      await excluirCampanha(idCampanha);
      toast.success('Campanha excluída!');
    } catch (error) {
      toast.error('Erro ao excluir campanha');
    }
  };

  const handleRetomar = async (idCampanha: string) => {
    try {
      await retomarCampanha(idCampanha);
      toast.success('Campanha retomada!');
    } catch (error) {
      toast.error('Erro ao retomar campanha');
    }
  };

  const handleCancelar = async (idCampanha: string) => {
    if (!confirm('Tem certeza que deseja cancelar esta campanha? Esta ação não pode ser desfeita.')) return;
    try {
      await cancelarCampanha(idCampanha);
      toast.success('Campanha cancelada!');
    } catch (error) {
      toast.error('Erro ao cancelar campanha');
    }
  };

  const handleOpenMetricas = async (campanha: Campanha) => {
    setSelectedCampanha(campanha);
    setIsMetricasOpen(true);
    setLoadingMetricas(true);
    try {
      const data = await obterMetricas(campanha.id_campanha);
      setMetricas(data);
    } catch (error) {
      toast.error('Erro ao carregar métricas');
    } finally {
      setLoadingMetricas(false);
    }
  };

  const handleOpenEdit = (campanha: Campanha) => {
    setSelectedCampanha(campanha);
    setEditData({
      nm_campanha: campanha.nm_campanha,
      ds_descricao: campanha.ds_descricao || '',
      ds_mensagem: campanha.ds_mensagem || '',
      nr_limite_diario: campanha.nr_limite_diario,
      nr_intervalo_segundos: campanha.nr_intervalo_segundos,
    });
    setIsEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedCampanha) return;
    try {
      await atualizarCampanha(selectedCampanha.id_campanha, editData);
      toast.success('Campanha atualizada!');
      setIsEditOpen(false);
      setSelectedCampanha(null);
    } catch (error) {
      toast.error('Erro ao atualizar campanha');
    }
  };

  const handleOpenDestinatarios = (campanha: Campanha) => {
    setSelectedCampanha(campanha);
    setFiltrosDestinatarios({ tags: [], status: [] });
    setSelectedContatos([]);
    setSearchContato('');
    setDestTab('selecionar');
    setIsDestinatariosOpen(true);
  };

  const handleAdicionarPorFiltro = async () => {
    if (!selectedCampanha) return;
    setAddingDestinatarios(true);
    try {
      const result = await adicionarDestinatariosPorFiltro(
        selectedCampanha.id_campanha,
        filtrosDestinatarios
      );
      toast.success(`${result.adicionados} destinatários adicionados! (${result.duplicados} duplicados ignorados)`);
      setIsDestinatariosOpen(false);
    } catch (error) {
      toast.error('Erro ao adicionar destinatários');
    } finally {
      setAddingDestinatarios(false);
    }
  };

  const handleAdicionarSelecionados = async () => {
    if (!selectedCampanha || selectedContatos.length === 0) return;
    setAddingDestinatarios(true);
    try {
      const result = await adicionarDestinatarios(selectedCampanha.id_campanha, selectedContatos);
      toast.success(`${result.adicionados} destinatários adicionados! (${result.duplicados} duplicados ignorados)`);
      setSelectedContatos([]);
      setIsDestinatariosOpen(false);
    } catch (error) {
      toast.error('Erro ao adicionar destinatários');
    } finally {
      setAddingDestinatarios(false);
    }
  };

  const toggleContatoSelection = (idContato: string) => {
    setSelectedContatos(prev =>
      prev.includes(idContato)
        ? prev.filter(id => id !== idContato)
        : [...prev, idContato]
    );
  };

  const selectAllContatos = () => {
    if (selectedContatos.length === filteredContatos.length) {
      setSelectedContatos([]);
    } else {
      setSelectedContatos(filteredContatos.map(c => c.id_contato));
    }
  };

  const filteredCampanhas = campanhas.filter((c) => {
    if (activeTab === 'todas') return true;
    if (activeTab === 'ativas') return c.st_campanha === 'em_execucao';
    if (activeTab === 'agendadas') return c.st_campanha === 'agendada';
    if (activeTab === 'finalizadas') return c.st_campanha === 'concluida';
    return true;
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  // Métricas
  const totalCampanhas = campanhas.length;
  const campanhasAtivas = campanhas.filter(c => c.st_campanha === 'em_execucao').length;
  const totalEnviados = campanhas.reduce((sum, c) => sum + c.nr_enviados, 0);
  const totalEntregues = campanhas.reduce((sum, c) => sum + c.nr_entregues, 0);
  const taxaEntrega = totalEnviados > 0 ? ((totalEntregues / totalEnviados) * 100).toFixed(1) : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Target className="h-6 w-6" />
            Campanhas
          </h1>
          <p className="text-muted-foreground">
            Gerencie campanhas de comunicação em massa
          </p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Campanha
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Criar Campanha</DialogTitle>
              <DialogDescription>
                Configure uma nova campanha de comunicação.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="nome">Nome da Campanha</Label>
                <Input
                  id="nome"
                  value={formData.nm_campanha}
                  onChange={(e) => setFormData({ ...formData, nm_campanha: e.target.value })}
                  placeholder="Ex: Promoção de Verão"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.ds_descricao || ''}
                  onChange={(e) => setFormData({ ...formData, ds_descricao: e.target.value })}
                  placeholder="Descreva o objetivo da campanha..."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="mensagem">Mensagem *</Label>
                <Textarea
                  id="mensagem"
                  value={formData.ds_mensagem}
                  onChange={(e) => setFormData({ ...formData, ds_mensagem: e.target.value })}
                  placeholder="Digite a mensagem que será enviada..."
                  rows={4}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="tipo">Tipo de Campanha</Label>
                  <Select
                    value={formData.tp_campanha}
                    onValueChange={(value: TipoCampanha) =>
                      setFormData({ ...formData, tp_campanha: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CAMPANHA_TIPOS).map(([value, { label }]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="canal">Canal</Label>
                  <Select
                    value={formData.tp_canal}
                    onValueChange={(value: TipoCanal) =>
                      setFormData({ ...formData, tp_canal: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CAMPANHA_CANAIS).map(([value, { label }]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {CAMPANHA_TIPOS[formData.tp_campanha]?.description}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsCreateOpen(false); resetForm(); }}>
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={!formData.nm_campanha}>
                Criar Campanha
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Campanhas</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCampanhas}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Campanhas Ativas</CardTitle>
            <Play className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{campanhasAtivas}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Mensagens Enviadas</CardTitle>
            <Send className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalEnviados.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Entrega</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{taxaEntrega}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs e Lista */}
      <Card>
        <CardHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="todas">Todas</TabsTrigger>
              <TabsTrigger value="ativas">Ativas</TabsTrigger>
              <TabsTrigger value="agendadas">Agendadas</TabsTrigger>
              <TabsTrigger value="finalizadas">Finalizadas</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {filteredCampanhas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Target className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma campanha encontrada</h3>
              <p className="text-muted-foreground text-center mb-4">
                {activeTab === 'todas'
                  ? 'Crie sua primeira campanha para começar.'
                  : 'Nenhuma campanha nesta categoria.'}
              </p>
              {activeTab === 'todas' && (
                <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Criar Campanha
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCampanhas.map((campanha) => {
                const CanalIcon = CAMPANHA_CANAIS[campanha.tp_canal]?.icon || MessageSquare;
                const progresso = campanha.nr_total_destinatarios > 0
                  ? (campanha.nr_enviados / campanha.nr_total_destinatarios) * 100
                  : 0;

                return (
                  <Card key={campanha.id_campanha} className="overflow-hidden">
                    <div className={`h-1 ${STATUS_COLORS[campanha.st_campanha]}`} />
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="p-2 rounded-lg bg-muted">
                            <CanalIcon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold truncate">{campanha.nm_campanha}</h3>
                              <Badge
                                variant="outline"
                                className={`text-xs text-white ${STATUS_COLORS[campanha.st_campanha]}`}
                              >
                                {STATUS_LABELS[campanha.st_campanha]}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {CAMPANHA_TIPOS[campanha.tp_campanha]?.label}
                              </Badge>
                            </div>
                            {campanha.ds_descricao && (
                              <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                                {campanha.ds_descricao}
                              </p>
                            )}

                            {/* Progresso */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Progresso</span>
                                <span>{campanha.nr_enviados} / {campanha.nr_total_destinatarios}</span>
                              </div>
                              <Progress value={progresso} className="h-2" />
                            </div>

                            {/* Métricas */}
                            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Send className="h-3 w-3" />
                                <span>{campanha.nr_enviados} enviados</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <CheckCircle className="h-3 w-3 text-green-500" />
                                <span>{campanha.nr_entregues} entregues</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Eye className="h-3 w-3 text-blue-500" />
                                <span>{campanha.nr_lidos} lidos</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MessageCircle className="h-3 w-3 text-purple-500" />
                                <span>{campanha.nr_respondidos} respondidos</span>
                              </div>
                              {campanha.nr_erros > 0 && (
                                <div className="flex items-center gap-1">
                                  <XCircle className="h-3 w-3 text-red-500" />
                                  <span>{campanha.nr_erros} erros</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {campanha.st_campanha === 'rascunho' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStart(campanha.id_campanha)}
                              className="gap-1"
                            >
                              <Play className="h-4 w-4" />
                              Iniciar
                            </Button>
                          )}
                          {campanha.st_campanha === 'em_execucao' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePause(campanha.id_campanha)}
                              className="gap-1"
                            >
                              <Pause className="h-4 w-4" />
                              Pausar
                            </Button>
                          )}
                          {campanha.st_campanha === 'pausada' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRetomar(campanha.id_campanha)}
                              className="gap-1"
                            >
                              <Play className="h-4 w-4" />
                              Retomar
                            </Button>
                          )}

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleOpenMetricas(campanha)}>
                                <BarChart3 className="h-4 w-4 mr-2" />
                                Ver Métricas
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOpenDestinatarios(campanha)}>
                                <Users className="h-4 w-4 mr-2" />
                                Gerenciar Destinatários
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleOpenEdit(campanha)}
                                disabled={campanha.st_campanha === 'em_execucao' || campanha.st_campanha === 'concluida'}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              {(campanha.st_campanha === 'em_execucao' || campanha.st_campanha === 'agendada') && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-orange-600"
                                    onClick={() => handleCancelar(campanha.id_campanha)}
                                  >
                                    <StopCircle className="h-4 w-4 mr-2" />
                                    Cancelar Campanha
                                  </DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDelete(campanha.id_campanha)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Métricas */}
      <Dialog open={isMetricasOpen} onOpenChange={setIsMetricasOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Métricas da Campanha
            </DialogTitle>
            <DialogDescription>
              {selectedCampanha?.nm_campanha}
            </DialogDescription>
          </DialogHeader>
          {loadingMetricas ? (
            <div className="space-y-4 py-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : metricas ? (
            <div className="space-y-6 py-4">
              {/* Status e Total */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-sm text-muted-foreground">Total Destinatários</div>
                    <div className="text-2xl font-bold">{metricas.nr_total_destinatarios}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-sm text-muted-foreground">Status</div>
                    <Badge className={`mt-1 ${STATUS_COLORS[metricas.st_campanha || 'rascunho']}`}>
                      {STATUS_LABELS[metricas.st_campanha || 'rascunho']}
                    </Badge>
                  </CardContent>
                </Card>
              </div>

              {/* Métricas de Envio */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <Send className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                  <div className="text-2xl font-bold">{metricas.nr_enviados}</div>
                  <div className="text-xs text-muted-foreground">Enviados</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-500" />
                  <div className="text-2xl font-bold">{metricas.nr_entregues}</div>
                  <div className="text-xs text-muted-foreground">Entregues</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <XCircle className="h-6 w-6 mx-auto mb-2 text-red-500" />
                  <div className="text-2xl font-bold">{metricas.nr_erros}</div>
                  <div className="text-xs text-muted-foreground">Erros</div>
                </div>
              </div>

              {/* Métricas de Engajamento */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <Eye className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                  <div className="text-2xl font-bold">{metricas.nr_lidos}</div>
                  <div className="text-xs text-muted-foreground">Lidos</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <MessageCircle className="h-6 w-6 mx-auto mb-2 text-orange-500" />
                  <div className="text-2xl font-bold">{metricas.nr_respondidos}</div>
                  <div className="text-xs text-muted-foreground">Respondidos</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <TrendingUp className="h-6 w-6 mx-auto mb-2 text-emerald-500" />
                  <div className="text-2xl font-bold">{metricas.nr_convertidos}</div>
                  <div className="text-xs text-muted-foreground">Convertidos</div>
                </div>
              </div>

              {/* Taxas */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-4 text-center">
                    <Percent className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                    <div className="text-xl font-bold text-blue-600">{metricas.pc_taxa_abertura?.toFixed(1) || 0}%</div>
                    <div className="text-xs text-muted-foreground">Taxa Abertura</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <Percent className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                    <div className="text-xl font-bold text-orange-600">{metricas.pc_taxa_resposta?.toFixed(1) || 0}%</div>
                    <div className="text-xs text-muted-foreground">Taxa Resposta</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <Percent className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                    <div className="text-xl font-bold text-emerald-600">{metricas.pc_taxa_conversao?.toFixed(1) || 0}%</div>
                    <div className="text-xs text-muted-foreground">Taxa Conversão</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              Nenhuma métrica disponível
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMetricasOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Edição */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Editar Campanha
            </DialogTitle>
            <DialogDescription>
              Atualize as informações da campanha.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-nome">Nome da Campanha</Label>
              <Input
                id="edit-nome"
                value={editData.nm_campanha || ''}
                onChange={(e) => setEditData({ ...editData, nm_campanha: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-descricao">Descrição</Label>
              <Textarea
                id="edit-descricao"
                value={editData.ds_descricao || ''}
                onChange={(e) => setEditData({ ...editData, ds_descricao: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-mensagem">Mensagem</Label>
              <Textarea
                id="edit-mensagem"
                value={editData.ds_mensagem || ''}
                onChange={(e) => setEditData({ ...editData, ds_mensagem: e.target.value })}
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-limite">Limite Diário</Label>
                <Input
                  id="edit-limite"
                  type="number"
                  value={editData.nr_limite_diario || ''}
                  onChange={(e) => setEditData({ ...editData, nr_limite_diario: parseInt(e.target.value) || undefined })}
                  placeholder="Sem limite"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-intervalo">Intervalo (seg)</Label>
                <Input
                  id="edit-intervalo"
                  type="number"
                  value={editData.nr_intervalo_segundos || ''}
                  onChange={(e) => setEditData({ ...editData, nr_intervalo_segundos: parseInt(e.target.value) || undefined })}
                  placeholder="30"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Gerenciamento de Destinatários */}
      <Dialog open={isDestinatariosOpen} onOpenChange={setIsDestinatariosOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Gerenciar Destinatários
            </DialogTitle>
            <DialogDescription>
              {selectedCampanha?.nm_campanha} - {selectedCampanha?.nr_total_destinatarios || 0} destinatários atuais
            </DialogDescription>
          </DialogHeader>

          <Tabs value={destTab} onValueChange={(v) => setDestTab(v as 'selecionar' | 'filtro')} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="selecionar" className="gap-2">
                <Users className="h-4 w-4" />
                Selecionar Contatos
              </TabsTrigger>
              <TabsTrigger value="filtro" className="gap-2">
                <Filter className="h-4 w-4" />
                Filtrar por Critérios
              </TabsTrigger>
            </TabsList>

            {/* Tab: Selecionar Contatos Manualmente */}
            <TabsContent value="selecionar" className="space-y-4">
              {/* Busca */}
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Buscar contato por nome, telefone ou email..."
                  value={searchContato}
                  onChange={(e) => setSearchContato(e.target.value)}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAllContatos}
                >
                  {selectedContatos.length === filteredContatos.length && filteredContatos.length > 0
                    ? 'Desmarcar Todos'
                    : 'Selecionar Todos'}
                </Button>
              </div>

              {/* Resumo da seleção */}
              <div className="flex items-center justify-between px-2 py-1 bg-muted rounded text-sm">
                <span>
                  {selectedContatos.length} contato(s) selecionado(s) de {filteredContatos.length} disponíveis
                </span>
                {selectedContatos.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => setSelectedContatos([])}>
                    Limpar seleção
                  </Button>
                )}
              </div>

              {/* Lista de contatos */}
              <ScrollArea className="h-[300px] border rounded-lg">
                {loadingContatos ? (
                  <div className="p-4 space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-12" />
                    ))}
                  </div>
                ) : filteredContatos.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    {searchContato
                      ? 'Nenhum contato encontrado com esse termo'
                      : 'Nenhum contato disponível. Cadastre contatos primeiro.'}
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredContatos.map((contato) => (
                      <div
                        key={contato.id_contato}
                        className={`flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer ${
                          selectedContatos.includes(contato.id_contato) ? 'bg-primary/10' : ''
                        }`}
                        onClick={() => toggleContatoSelection(contato.id_contato)}
                      >
                        <Checkbox
                          checked={selectedContatos.includes(contato.id_contato)}
                          onCheckedChange={() => toggleContatoSelection(contato.id_contato)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">
                            {contato.nm_contato || 'Sem nome'}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-3">
                            {contato.nr_telefone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {contato.nr_telefone}
                              </span>
                            )}
                            {contato.nm_email && (
                              <span className="flex items-center gap-1 truncate">
                                <Mail className="h-3 w-3" />
                                {contato.nm_email}
                              </span>
                            )}
                          </div>
                        </div>
                        {contato.tp_status && (
                          <Badge variant="outline" className="text-xs">
                            {contato.tp_status}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Botão de adicionar selecionados */}
              <Button
                onClick={handleAdicionarSelecionados}
                disabled={selectedContatos.length === 0 || addingDestinatarios}
                className="w-full gap-2"
              >
                {addingDestinatarios ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Adicionando...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Adicionar {selectedContatos.length} Contato(s) Selecionado(s)
                  </>
                )}
              </Button>
            </TabsContent>

            {/* Tab: Filtrar por Critérios */}
            <TabsContent value="filtro" className="space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label>Status dos Contatos</Label>
                  <div className="flex flex-wrap gap-2">
                    {['ativo', 'inativo', 'lead', 'cliente'].map((status) => (
                      <Button
                        key={status}
                        variant={filtrosDestinatarios.status.includes(status) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          const newStatus = filtrosDestinatarios.status.includes(status)
                            ? filtrosDestinatarios.status.filter(s => s !== status)
                            : [...filtrosDestinatarios.status, status];
                          setFiltrosDestinatarios({ ...filtrosDestinatarios, status: newStatus });
                        }}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="tags-input">Tags (separadas por vírgula)</Label>
                  <Input
                    id="tags-input"
                    placeholder="vip, promocao, retorno..."
                    onChange={(e) => {
                      const tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
                      setFiltrosDestinatarios({ ...filtrosDestinatarios, tags });
                    }}
                  />
                </div>

                <div className="p-3 bg-muted rounded-lg text-sm">
                  <p className="text-muted-foreground">
                    <strong>Filtros selecionados:</strong><br/>
                    Status: {filtrosDestinatarios.status.length > 0 ? filtrosDestinatarios.status.join(', ') : 'Todos'}<br/>
                    Tags: {filtrosDestinatarios.tags.length > 0 ? filtrosDestinatarios.tags.join(', ') : 'Nenhuma'}
                  </p>
                </div>

                <Button
                  onClick={handleAdicionarPorFiltro}
                  disabled={addingDestinatarios}
                  className="w-full gap-2"
                >
                  {addingDestinatarios ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Adicionando...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Adicionar por Filtro
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDestinatariosOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
