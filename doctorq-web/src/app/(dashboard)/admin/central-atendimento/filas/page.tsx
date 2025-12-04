'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useFilas, FilaAtendimento, FilaCreate } from '@/lib/api/hooks/central-atendimento/useFilas';
import {
  Users,
  Plus,
  MoreHorizontal,
  Settings,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  UserCheck,
  AlertTriangle,
  TrendingUp,
  Edit,
} from 'lucide-react';
import { toast } from 'sonner';

export default function FilasPage() {
  const {
    filas,
    isLoading,
    criarFila,
    atualizarFila,
    excluirFila,
  } = useFilas();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingFila, setEditingFila] = useState<FilaAtendimento | null>(null);
  const [formData, setFormData] = useState<FilaCreate>({
    nm_fila: '',
    ds_fila: '',
    nr_prioridade: 1,
    nr_tempo_max_espera: 300,
    nr_atendimentos_simultaneos: 5,
  });

  const resetForm = () => {
    setFormData({
      nm_fila: '',
      ds_fila: '',
      nr_prioridade: 1,
      nr_tempo_max_espera: 300,
      nr_atendimentos_simultaneos: 5,
    });
    setEditingFila(null);
  };

  const handleCreate = async () => {
    try {
      await criarFila(formData);
      toast.success('Fila criada com sucesso!');
      setIsCreateOpen(false);
      resetForm();
    } catch (error) {
      toast.error('Erro ao criar fila');
    }
  };

  const handleUpdate = async () => {
    if (!editingFila) return;
    try {
      await atualizarFila(editingFila.id_fila, formData);
      toast.success('Fila atualizada com sucesso!');
      setEditingFila(null);
      resetForm();
    } catch (error) {
      toast.error('Erro ao atualizar fila');
    }
  };

  const handleToggleStatus = async (fila: FilaAtendimento) => {
    try {
      await atualizarFila(fila.id_fila, { st_ativa: !fila.st_ativa });
      toast.success(fila.st_ativa ? 'Fila desativada' : 'Fila ativada');
    } catch (error) {
      toast.error('Erro ao alterar status da fila');
    }
  };

  const handleDelete = async (idFila: string) => {
    if (!confirm('Tem certeza que deseja excluir esta fila?')) return;
    try {
      await excluirFila(idFila);
      toast.success('Fila excluída com sucesso!');
    } catch (error) {
      toast.error('Erro ao excluir fila');
    }
  };

  const openEditDialog = (fila: FilaAtendimento) => {
    setEditingFila(fila);
    setFormData({
      nm_fila: fila.nm_fila,
      ds_fila: fila.ds_fila,
      nr_prioridade: fila.nr_prioridade,
      nr_tempo_max_espera: fila.nr_tempo_max_espera,
      nr_atendimentos_simultaneos: fila.nr_atendimentos_simultaneos,
    });
  };

  const formatTime = (seconds?: number) => {
    if (!seconds) return '-';
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min`;
  };

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

  // Métricas resumidas
  const totalFilas = filas.length;
  const filasAtivas = filas.filter(f => f.st_ativa).length;
  const totalSlots = filas.reduce((sum, f) => sum + f.nr_atendimentos_simultaneos, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6" />
            Filas de Atendimento
          </h1>
          <p className="text-muted-foreground">
            Gerencie as filas e prioridades de atendimento
          </p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Fila
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Criar Fila de Atendimento</DialogTitle>
              <DialogDescription>
                Configure uma nova fila para organizar os atendimentos.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="nome">Nome da Fila</Label>
                <Input
                  id="nome"
                  value={formData.nm_fila}
                  onChange={(e) => setFormData({ ...formData, nm_fila: e.target.value })}
                  placeholder="Ex: Atendimento Geral"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.ds_fila || ''}
                  onChange={(e) => setFormData({ ...formData, ds_fila: e.target.value })}
                  placeholder="Descreva o propósito desta fila..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="prioridade">Prioridade</Label>
                  <Input
                    id="prioridade"
                    type="number"
                    min={1}
                    max={10}
                    value={formData.nr_prioridade}
                    onChange={(e) => setFormData({ ...formData, nr_prioridade: parseInt(e.target.value) || 1 })}
                  />
                  <p className="text-xs text-muted-foreground">1 = mais alta</p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="slots">Atend. Simultâneos</Label>
                  <Input
                    id="slots"
                    type="number"
                    min={1}
                    max={50}
                    value={formData.nr_atendimentos_simultaneos}
                    onChange={(e) => setFormData({ ...formData, nr_atendimentos_simultaneos: parseInt(e.target.value) || 5 })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tempoMax">Tempo Máx. Espera (segundos)</Label>
                <Input
                  id="tempoMax"
                  type="number"
                  min={60}
                  max={3600}
                  step={60}
                  value={formData.nr_tempo_max_espera}
                  onChange={(e) => setFormData({ ...formData, nr_tempo_max_espera: parseInt(e.target.value) || 300 })}
                />
                <p className="text-xs text-muted-foreground">
                  {formatTime(formData.nr_tempo_max_espera)} de espera máxima
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsCreateOpen(false); resetForm(); }}>
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={!formData.nm_fila}>
                Criar Fila
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Edição */}
        <Dialog open={!!editingFila} onOpenChange={(open) => !open && resetForm()}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Editar Fila</DialogTitle>
              <DialogDescription>
                Atualize as configurações da fila de atendimento.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-nome">Nome da Fila</Label>
                <Input
                  id="edit-nome"
                  value={formData.nm_fila}
                  onChange={(e) => setFormData({ ...formData, nm_fila: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-descricao">Descrição</Label>
                <Textarea
                  id="edit-descricao"
                  value={formData.ds_fila || ''}
                  onChange={(e) => setFormData({ ...formData, ds_fila: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-prioridade">Prioridade</Label>
                  <Input
                    id="edit-prioridade"
                    type="number"
                    min={1}
                    max={10}
                    value={formData.nr_prioridade}
                    onChange={(e) => setFormData({ ...formData, nr_prioridade: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-slots">Atend. Simultâneos</Label>
                  <Input
                    id="edit-slots"
                    type="number"
                    min={1}
                    max={50}
                    value={formData.nr_atendimentos_simultaneos}
                    onChange={(e) => setFormData({ ...formData, nr_atendimentos_simultaneos: parseInt(e.target.value) || 5 })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-tempoMax">Tempo Máx. Espera (segundos)</Label>
                <Input
                  id="edit-tempoMax"
                  type="number"
                  min={60}
                  max={3600}
                  step={60}
                  value={formData.nr_tempo_max_espera}
                  onChange={(e) => setFormData({ ...formData, nr_tempo_max_espera: parseInt(e.target.value) || 300 })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
              <Button onClick={handleUpdate}>
                Salvar Alterações
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Filas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFilas}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Filas Ativas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{filasAtivas}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Slots</CardTitle>
            <UserCheck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalSlots}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taxa Ocupação</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">0%</div>
            <p className="text-xs text-muted-foreground">Em tempo real</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Filas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Filas Configuradas</CardTitle>
        </CardHeader>
        <CardContent>
          {filas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma fila configurada</h3>
              <p className="text-muted-foreground text-center mb-4">
                Crie sua primeira fila de atendimento para organizar os atendimentos.
              </p>
              <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Criar Fila
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Prioridade</TableHead>
                  <TableHead className="text-center">Slots</TableHead>
                  <TableHead className="text-center">Tempo Máx.</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filas.map((fila) => (
                  <TableRow key={fila.id_fila}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{fila.nm_fila}</p>
                        {fila.ds_fila && (
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {fila.ds_fila}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={fila.st_ativa}
                          onCheckedChange={() => handleToggleStatus(fila)}
                        />
                        <Badge variant={fila.st_ativa ? 'default' : 'secondary'}>
                          {fila.st_ativa ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={fila.nr_prioridade === 1 ? 'destructive' : 'outline'}
                      >
                        P{fila.nr_prioridade}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {fila.nr_atendimentos_simultaneos}
                    </TableCell>
                    <TableCell className="text-center">
                      {formatTime(fila.nr_tempo_max_espera)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => openEditDialog(fila)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Settings className="h-4 w-4 mr-2" />
                            Configurar Horários
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(fila.id_fila)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
