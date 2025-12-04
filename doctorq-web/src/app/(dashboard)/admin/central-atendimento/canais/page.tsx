'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { useCanais, Canal, CanalCreate } from '@/lib/api/hooks/central-atendimento/useCanais';
import {
  Phone,
  MessageSquare,
  Instagram,
  Facebook,
  Mail,
  Globe,
  Plus,
  MoreHorizontal,
  Settings,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';

const CANAL_ICONS: Record<string, React.ElementType> = {
  whatsapp: MessageSquare,
  instagram: Instagram,
  facebook: Facebook,
  telegram: Send,
  email: Mail,
  chat_web: Globe,
  sms: Phone,
};

const CANAL_COLORS: Record<string, string> = {
  whatsapp: 'bg-green-500',
  instagram: 'bg-gradient-to-r from-purple-500 to-blue-500',
  facebook: 'bg-blue-600',
  telegram: 'bg-blue-400',
  email: 'bg-gray-500',
  chat_web: 'bg-indigo-500',
  sms: 'bg-yellow-500',
};

const CANAL_LABELS: Record<string, string> = {
  whatsapp: 'WhatsApp Business',
  instagram: 'Instagram Direct',
  facebook: 'Facebook Messenger',
  telegram: 'Telegram',
  email: 'E-mail',
  chat_web: 'Chat Web',
  sms: 'SMS',
};

export default function CanaisPage() {
  const {
    canais,
    isLoading,
    criarCanal,
    atualizarCanal,
    excluirCanal,
    validarCanal,
  } = useCanais();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isValidating, setIsValidating] = useState<string | null>(null);
  const [formData, setFormData] = useState<CanalCreate>({
    tp_canal: 'whatsapp',
    nm_canal: '',
    ds_canal: '',
  });

  const handleCreate = async () => {
    try {
      await criarCanal(formData);
      toast.success('Canal criado com sucesso!');
      setIsCreateOpen(false);
      setFormData({ tp_canal: 'whatsapp', nm_canal: '', ds_canal: '' });
    } catch (error) {
      toast.error('Erro ao criar canal');
    }
  };

  const handleToggleStatus = async (canal: Canal) => {
    try {
      await atualizarCanal(canal.id_canal, { st_ativo: !canal.st_ativo });
      toast.success(canal.st_ativo ? 'Canal desativado' : 'Canal ativado');
    } catch (error) {
      toast.error('Erro ao alterar status do canal');
    }
  };

  const handleValidate = async (idCanal: string) => {
    setIsValidating(idCanal);
    try {
      const result = await validarCanal(idCanal);
      if (result.success) {
        toast.success(result.message || 'Canal validado com sucesso!');
      } else {
        toast.error(result.message || 'Falha na validação do canal');
      }
    } catch (error) {
      toast.error('Erro ao validar canal');
    } finally {
      setIsValidating(null);
    }
  };

  const handleDelete = async (idCanal: string) => {
    if (!confirm('Tem certeza que deseja excluir este canal?')) return;
    try {
      await excluirCanal(idCanal);
      toast.success('Canal excluído com sucesso!');
    } catch (error) {
      toast.error('Erro ao excluir canal');
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Phone className="h-6 w-6" />
            Canais de Atendimento
          </h1>
          <p className="text-muted-foreground">
            Configure os canais de comunicação com seus clientes
          </p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Canal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Adicionar Canal</DialogTitle>
              <DialogDescription>
                Configure um novo canal de atendimento para sua empresa.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="tipo">Tipo de Canal</Label>
                <Select
                  value={formData.tp_canal}
                  onValueChange={(value: Canal['tp_canal']) =>
                    setFormData({ ...formData, tp_canal: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CANAL_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="nome">Nome do Canal</Label>
                <Input
                  id="nome"
                  value={formData.nm_canal}
                  onChange={(e) =>
                    setFormData({ ...formData, nm_canal: e.target.value })
                  }
                  placeholder="Ex: WhatsApp Principal"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.ds_canal || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, ds_canal: e.target.value })
                  }
                  placeholder="Descreva o propósito deste canal..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={!formData.nm_canal}>
                Criar Canal
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de Canais */}
      {canais.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Phone className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum canal configurado</h3>
            <p className="text-muted-foreground text-center mb-4">
              Adicione seu primeiro canal de atendimento para começar a receber mensagens.
            </p>
            <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Canal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {canais.map((canal) => {
            const Icon = CANAL_ICONS[canal.tp_canal] || Phone;
            const bgColor = CANAL_COLORS[canal.tp_canal] || 'bg-gray-500';

            return (
              <Card key={canal.id_canal} className="relative overflow-hidden">
                <div className={`absolute top-0 left-0 right-0 h-1 ${bgColor}`} />
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${bgColor} text-white`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{canal.nm_canal}</CardTitle>
                      <CardDescription className="text-xs">
                        {CANAL_LABELS[canal.tp_canal]}
                      </CardDescription>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Settings className="h-4 w-4 mr-2" />
                        Configurar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleStatus(canal)}>
                        {canal.st_ativo ? (
                          <>
                            <XCircle className="h-4 w-4 mr-2" />
                            Desativar
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Ativar
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDelete(canal.id_canal)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent className="space-y-3">
                  {canal.ds_canal && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {canal.ds_canal}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={canal.st_ativo ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {canal.st_ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                      {canal.st_validado ? (
                        <Badge variant="outline" className="text-xs text-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Validado
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-orange-600">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Não validado
                        </Badge>
                      )}
                    </div>
                  </div>
                  {!canal.st_validado && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2"
                      onClick={() => handleValidate(canal.id_canal)}
                      disabled={isValidating === canal.id_canal}
                    >
                      {isValidating === canal.id_canal ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Validando...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          Validar Canal
                        </>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Canais Disponíveis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Canais Disponíveis para Integração
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {Object.entries(CANAL_LABELS).map(([type, label]) => {
              const Icon = CANAL_ICONS[type] || Phone;
              const bgColor = CANAL_COLORS[type] || 'bg-gray-500';
              const isConfigured = canais.some((c) => c.tp_canal === type);

              return (
                <div
                  key={type}
                  className={`flex flex-col items-center p-3 rounded-lg border ${
                    isConfigured ? 'bg-muted' : 'hover:bg-muted/50 cursor-pointer'
                  }`}
                  onClick={() => {
                    if (!isConfigured) {
                      setFormData({ ...formData, tp_canal: type as Canal['tp_canal'] });
                      setIsCreateOpen(true);
                    }
                  }}
                >
                  <div className={`p-2 rounded-lg ${bgColor} text-white mb-2`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-xs text-center">{label}</span>
                  {isConfigured && (
                    <Badge variant="secondary" className="text-[10px] mt-1">
                      Configurado
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
