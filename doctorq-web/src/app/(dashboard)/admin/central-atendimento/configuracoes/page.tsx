'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import useSWR from 'swr';
import {
  Settings,
  Bot,
  Clock,
  MessageSquare,
  Bell,
  Shield,
  Webhook,
  Palette,
  Volume2,
  Save,
  RotateCcw,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';

// Fetcher para SWR
const fetcher = async (url: string) => {
  const token = localStorage.getItem('api_token') || process.env.NEXT_PUBLIC_API_KEY;
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) throw new Error('Erro ao carregar dados');
  return res.json();
};

// Tipos
interface ConfigGeral {
  nm_empresa_chat: string;
  ds_mensagem_boas_vindas: string | null;
  ds_mensagem_ausencia: string | null;
  ds_mensagem_encerramento: string | null;
  nr_tempo_inatividade: number;
  st_encerramento_automatico: boolean;
  st_pesquisa_satisfacao: boolean;
}

interface ConfigBot {
  st_bot_ativo: boolean;
  st_transferencia_automatica: boolean;
  nr_tentativas_antes_transferir: number;
  ds_palavras_transferencia: string[];
  st_resposta_ia: boolean;
  nm_modelo_ia: string;
  nr_temperatura_ia: number;
}

interface ConfigHorario {
  st_respeitar_horario: boolean;
  hr_inicio: string;
  hr_fim: string;
  ds_dias_semana: string[];
  st_atender_feriados: boolean;
}

interface ConfigNotificacoes {
  st_som_mensagem: boolean;
  st_notificacao_desktop: boolean;
  st_email_nova_conversa: boolean;
  st_email_resumo_diario: boolean;
  nm_email_notificacoes: string | null;
}

interface ConfigAvancado {
  ds_webhook_url: string | null;
  st_webhook_ativo: boolean;
  st_rate_limiting: boolean;
  ds_cor_widget: string;
  ds_posicao_widget: string;
}

interface ConfigCompleta {
  id_config: string;
  id_empresa: string;
  geral: ConfigGeral;
  bot: ConfigBot;
  horario: ConfigHorario;
  notificacoes: ConfigNotificacoes;
  avancado: ConfigAvancado;
  dt_criacao: string;
  dt_atualizacao: string;
}

export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState('geral');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Buscar configurações
  const { data: config, isLoading, mutate } = useSWR<ConfigCompleta>(
    '/central-atendimento/configuracoes/',
    fetcher
  );

  // Estados locais para formulário
  const [configGeral, setConfigGeral] = useState<ConfigGeral>({
    nm_empresa_chat: 'Atendimento',
    ds_mensagem_boas_vindas: null,
    ds_mensagem_ausencia: null,
    ds_mensagem_encerramento: null,
    nr_tempo_inatividade: 30,
    st_encerramento_automatico: true,
    st_pesquisa_satisfacao: true,
  });

  const [configBot, setConfigBot] = useState<ConfigBot>({
    st_bot_ativo: true,
    st_transferencia_automatica: true,
    nr_tentativas_antes_transferir: 3,
    ds_palavras_transferencia: ['atendente', 'humano', 'pessoa'],
    st_resposta_ia: true,
    nm_modelo_ia: 'gpt-4',
    nr_temperatura_ia: 0.7,
  });

  const [configHorario, setConfigHorario] = useState<ConfigHorario>({
    st_respeitar_horario: true,
    hr_inicio: '08:00',
    hr_fim: '18:00',
    ds_dias_semana: ['seg', 'ter', 'qua', 'qui', 'sex'],
    st_atender_feriados: false,
  });

  const [configNotificacoes, setConfigNotificacoes] = useState<ConfigNotificacoes>({
    st_som_mensagem: true,
    st_notificacao_desktop: true,
    st_email_nova_conversa: false,
    st_email_resumo_diario: true,
    nm_email_notificacoes: null,
  });

  const [configAvancado, setConfigAvancado] = useState<ConfigAvancado>({
    ds_webhook_url: null,
    st_webhook_ativo: false,
    st_rate_limiting: true,
    ds_cor_widget: '#4F46E5',
    ds_posicao_widget: 'bottom-right',
  });

  // Carregar dados do servidor
  useEffect(() => {
    if (config) {
      setConfigGeral(config.geral);
      setConfigBot(config.bot);
      setConfigHorario(config.horario);
      setConfigNotificacoes(config.notificacoes);
      setConfigAvancado(config.avancado);
      setHasChanges(false);
    }
  }, [config]);

  // Marcar que houve mudanças
  const markChanged = () => setHasChanges(true);

  // Salvar configurações
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('api_token') || process.env.NEXT_PUBLIC_API_KEY;
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/central-atendimento/configuracoes/`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            geral: configGeral,
            bot: configBot,
            horario: configHorario,
            notificacoes: configNotificacoes,
            avancado: configAvancado,
          }),
        }
      );

      if (!response.ok) throw new Error('Erro ao salvar');

      await mutate();
      setHasChanges(false);
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  // Resetar configurações
  const handleReset = async () => {
    if (!confirm('Tem certeza que deseja restaurar as configurações padrão?')) return;

    setIsSaving(true);
    try {
      const token = localStorage.getItem('api_token') || process.env.NEXT_PUBLIC_API_KEY;
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/central-atendimento/configuracoes/resetar`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error('Erro ao resetar');

      await mutate();
      setHasChanges(false);
      toast.success('Configurações restauradas!');
    } catch (error) {
      toast.error('Erro ao restaurar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-12 w-full max-w-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
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
            <Settings className="h-6 w-6" />
            Configurações
          </h1>
          <p className="text-muted-foreground">
            Configure o comportamento da Central de Atendimento
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasChanges && (
            <span className="text-sm text-orange-500 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              Alterações não salvas
            </span>
          )}
          <Button variant="outline" onClick={handleReset} disabled={isSaving} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Restaurar Padrão
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !hasChanges} className="gap-2">
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="geral" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Geral
          </TabsTrigger>
          <TabsTrigger value="bot" className="gap-2">
            <Bot className="h-4 w-4" />
            Bot
          </TabsTrigger>
          <TabsTrigger value="horario" className="gap-2">
            <Clock className="h-4 w-4" />
            Horário
          </TabsTrigger>
          <TabsTrigger value="notificacoes" className="gap-2">
            <Bell className="h-4 w-4" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="avancado" className="gap-2">
            <Shield className="h-4 w-4" />
            Avançado
          </TabsTrigger>
        </TabsList>

        {/* Geral */}
        <TabsContent value="geral" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Identificação</CardTitle>
              <CardDescription>
                Configure como sua empresa aparece no chat
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="nome-empresa">Nome no Chat</Label>
                <Input
                  id="nome-empresa"
                  value={configGeral.nm_empresa_chat}
                  onChange={(e) => {
                    setConfigGeral({ ...configGeral, nm_empresa_chat: e.target.value });
                    markChanged();
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Mensagens Automáticas</CardTitle>
              <CardDescription>
                Configure as mensagens padrão enviadas automaticamente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="boas-vindas">Mensagem de Boas-vindas</Label>
                <Textarea
                  id="boas-vindas"
                  value={configGeral.ds_mensagem_boas_vindas || ''}
                  onChange={(e) => {
                    setConfigGeral({ ...configGeral, ds_mensagem_boas_vindas: e.target.value });
                    markChanged();
                  }}
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ausencia">Mensagem de Ausência</Label>
                <Textarea
                  id="ausencia"
                  value={configGeral.ds_mensagem_ausencia || ''}
                  onChange={(e) => {
                    setConfigGeral({ ...configGeral, ds_mensagem_ausencia: e.target.value });
                    markChanged();
                  }}
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="encerramento">Mensagem de Encerramento</Label>
                <Textarea
                  id="encerramento"
                  value={configGeral.ds_mensagem_encerramento || ''}
                  onChange={(e) => {
                    setConfigGeral({ ...configGeral, ds_mensagem_encerramento: e.target.value });
                    markChanged();
                  }}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Comportamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Encerramento Automático</Label>
                  <p className="text-sm text-muted-foreground">
                    Encerrar conversa após período de inatividade
                  </p>
                </div>
                <Switch
                  checked={configGeral.st_encerramento_automatico}
                  onCheckedChange={(checked) => {
                    setConfigGeral({ ...configGeral, st_encerramento_automatico: checked });
                    markChanged();
                  }}
                />
              </div>
              {configGeral.st_encerramento_automatico && (
                <div className="grid gap-2 ml-6">
                  <Label htmlFor="tempo-inatividade">Tempo de Inatividade (minutos)</Label>
                  <Input
                    id="tempo-inatividade"
                    type="number"
                    min={5}
                    max={120}
                    value={configGeral.nr_tempo_inatividade}
                    onChange={(e) => {
                      setConfigGeral({ ...configGeral, nr_tempo_inatividade: parseInt(e.target.value) || 30 });
                      markChanged();
                    }}
                    className="w-32"
                  />
                </div>
              )}
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Pesquisa de Satisfação</Label>
                  <p className="text-sm text-muted-foreground">
                    Enviar pesquisa ao encerrar conversa
                  </p>
                </div>
                <Switch
                  checked={configGeral.st_pesquisa_satisfacao}
                  onCheckedChange={(checked) => {
                    setConfigGeral({ ...configGeral, st_pesquisa_satisfacao: checked });
                    markChanged();
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bot */}
        <TabsContent value="bot" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Configurações do Bot</CardTitle>
              <CardDescription>
                Configure o comportamento do assistente virtual
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Bot Ativo</Label>
                  <p className="text-sm text-muted-foreground">
                    Habilitar atendimento automático por bot
                  </p>
                </div>
                <Switch
                  checked={configBot.st_bot_ativo}
                  onCheckedChange={(checked) => {
                    setConfigBot({ ...configBot, st_bot_ativo: checked });
                    markChanged();
                  }}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Respostas com IA</Label>
                  <p className="text-sm text-muted-foreground">
                    Usar modelo de linguagem para gerar respostas
                  </p>
                </div>
                <Switch
                  checked={configBot.st_resposta_ia}
                  onCheckedChange={(checked) => {
                    setConfigBot({ ...configBot, st_resposta_ia: checked });
                    markChanged();
                  }}
                />
              </div>
              {configBot.st_resposta_ia && (
                <div className="grid grid-cols-2 gap-4 ml-6">
                  <div className="grid gap-2">
                    <Label>Modelo de IA</Label>
                    <Select
                      value={configBot.nm_modelo_ia}
                      onValueChange={(value) => {
                        setConfigBot({ ...configBot, nm_modelo_ia: value });
                        markChanged();
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-4">GPT-4</SelectItem>
                        <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                        <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                        <SelectItem value="claude-3">Claude 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Temperatura ({configBot.nr_temperatura_ia})</Label>
                    <Input
                      type="range"
                      min={0}
                      max={1}
                      step={0.1}
                      value={configBot.nr_temperatura_ia}
                      onChange={(e) => {
                        setConfigBot({ ...configBot, nr_temperatura_ia: parseFloat(e.target.value) });
                        markChanged();
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      Baixo = mais preciso, Alto = mais criativo
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Transferência para Humano</CardTitle>
              <CardDescription>
                Configure quando transferir para atendente humano
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Transferência Automática</Label>
                  <p className="text-sm text-muted-foreground">
                    Transferir após falhas ou palavras-chave
                  </p>
                </div>
                <Switch
                  checked={configBot.st_transferencia_automatica}
                  onCheckedChange={(checked) => {
                    setConfigBot({ ...configBot, st_transferencia_automatica: checked });
                    markChanged();
                  }}
                />
              </div>
              {configBot.st_transferencia_automatica && (
                <>
                  <div className="grid gap-2 ml-6">
                    <Label>Tentativas antes de transferir</Label>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      value={configBot.nr_tentativas_antes_transferir}
                      onChange={(e) => {
                        setConfigBot({
                          ...configBot,
                          nr_tentativas_antes_transferir: parseInt(e.target.value) || 3,
                        });
                        markChanged();
                      }}
                      className="w-32"
                    />
                  </div>
                  <div className="grid gap-2 ml-6">
                    <Label>Palavras-chave para Transferência</Label>
                    <Input
                      value={configBot.ds_palavras_transferencia.join(', ')}
                      onChange={(e) => {
                        setConfigBot({
                          ...configBot,
                          ds_palavras_transferencia: e.target.value.split(',').map(s => s.trim()).filter(Boolean),
                        });
                        markChanged();
                      }}
                      placeholder="atendente, humano, pessoa (separadas por vírgula)"
                    />
                    <p className="text-xs text-muted-foreground">
                      Palavras que disparam transferência imediata
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Horário */}
        <TabsContent value="horario" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Horário de Funcionamento</CardTitle>
              <CardDescription>
                Configure os horários de atendimento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Respeitar Horário de Funcionamento</Label>
                  <p className="text-sm text-muted-foreground">
                    Enviar mensagem de ausência fora do horário
                  </p>
                </div>
                <Switch
                  checked={configHorario.st_respeitar_horario}
                  onCheckedChange={(checked) => {
                    setConfigHorario({ ...configHorario, st_respeitar_horario: checked });
                    markChanged();
                  }}
                />
              </div>
              {configHorario.st_respeitar_horario && (
                <>
                  <div className="grid grid-cols-2 gap-4 ml-6">
                    <div className="grid gap-2">
                      <Label>Horário de Início</Label>
                      <Input
                        type="time"
                        value={configHorario.hr_inicio}
                        onChange={(e) => {
                          setConfigHorario({ ...configHorario, hr_inicio: e.target.value });
                          markChanged();
                        }}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Horário de Término</Label>
                      <Input
                        type="time"
                        value={configHorario.hr_fim}
                        onChange={(e) => {
                          setConfigHorario({ ...configHorario, hr_fim: e.target.value });
                          markChanged();
                        }}
                      />
                    </div>
                  </div>
                  <div className="ml-6">
                    <Label className="mb-2 block">Dias de Funcionamento</Label>
                    <div className="flex flex-wrap gap-2">
                      {['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'].map((dia) => (
                        <Button
                          key={dia}
                          variant={configHorario.ds_dias_semana.includes(dia) ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            const dias = configHorario.ds_dias_semana.includes(dia)
                              ? configHorario.ds_dias_semana.filter((d) => d !== dia)
                              : [...configHorario.ds_dias_semana, dia];
                            setConfigHorario({ ...configHorario, ds_dias_semana: dias });
                            markChanged();
                          }}
                        >
                          {dia.charAt(0).toUpperCase() + dia.slice(1)}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between ml-6">
                    <div>
                      <Label>Atender em Feriados</Label>
                    </div>
                    <Switch
                      checked={configHorario.st_atender_feriados}
                      onCheckedChange={(checked) => {
                        setConfigHorario({ ...configHorario, st_atender_feriados: checked });
                        markChanged();
                      }}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notificações */}
        <TabsContent value="notificacoes" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notificações</CardTitle>
              <CardDescription>
                Configure como receber alertas de novas mensagens
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  <div>
                    <Label>Som de Nova Mensagem</Label>
                    <p className="text-sm text-muted-foreground">Tocar som ao receber mensagem</p>
                  </div>
                </div>
                <Switch
                  checked={configNotificacoes.st_som_mensagem}
                  onCheckedChange={(checked) => {
                    setConfigNotificacoes({ ...configNotificacoes, st_som_mensagem: checked });
                    markChanged();
                  }}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  <div>
                    <Label>Notificações Desktop</Label>
                    <p className="text-sm text-muted-foreground">Exibir notificações no navegador</p>
                  </div>
                </div>
                <Switch
                  checked={configNotificacoes.st_notificacao_desktop}
                  onCheckedChange={(checked) => {
                    setConfigNotificacoes({ ...configNotificacoes, st_notificacao_desktop: checked });
                    markChanged();
                  }}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>E-mail para Nova Conversa</Label>
                  <p className="text-sm text-muted-foreground">
                    Receber e-mail quando iniciar nova conversa
                  </p>
                </div>
                <Switch
                  checked={configNotificacoes.st_email_nova_conversa}
                  onCheckedChange={(checked) => {
                    setConfigNotificacoes({ ...configNotificacoes, st_email_nova_conversa: checked });
                    markChanged();
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Resumo Diário por E-mail</Label>
                  <p className="text-sm text-muted-foreground">
                    Receber resumo diário de atendimentos
                  </p>
                </div>
                <Switch
                  checked={configNotificacoes.st_email_resumo_diario}
                  onCheckedChange={(checked) => {
                    setConfigNotificacoes({ ...configNotificacoes, st_email_resumo_diario: checked });
                    markChanged();
                  }}
                />
              </div>
              {(configNotificacoes.st_email_nova_conversa ||
                configNotificacoes.st_email_resumo_diario) && (
                <div className="grid gap-2 ml-6">
                  <Label>E-mail para Notificações</Label>
                  <Input
                    type="email"
                    value={configNotificacoes.nm_email_notificacoes || ''}
                    onChange={(e) => {
                      setConfigNotificacoes({
                        ...configNotificacoes,
                        nm_email_notificacoes: e.target.value,
                      });
                      markChanged();
                    }}
                    placeholder="email@empresa.com"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Avançado */}
        <TabsContent value="avancado" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Configurações Avançadas</CardTitle>
              <CardDescription>
                Opções avançadas para desenvolvedores e integrações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="webhooks">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Webhook className="h-4 w-4" />
                      Webhooks
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <div className="grid gap-2">
                      <Label>URL de Webhook</Label>
                      <Input
                        placeholder="https://seu-servidor.com/webhook"
                        value={configAvancado.ds_webhook_url || ''}
                        onChange={(e) => {
                          setConfigAvancado({ ...configAvancado, ds_webhook_url: e.target.value });
                          markChanged();
                        }}
                      />
                      <p className="text-xs text-muted-foreground">
                        Receba eventos em tempo real (nova mensagem, conversa encerrada, etc.)
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Ativar Webhook</Label>
                      <Switch
                        checked={configAvancado.st_webhook_ativo}
                        onCheckedChange={(checked) => {
                          setConfigAvancado({ ...configAvancado, st_webhook_ativo: checked });
                          markChanged();
                        }}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="api">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      API e Segurança
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Rate Limiting</Label>
                        <p className="text-sm text-muted-foreground">
                          Limitar requisições por minuto
                        </p>
                      </div>
                      <Switch
                        checked={configAvancado.st_rate_limiting}
                        onCheckedChange={(checked) => {
                          setConfigAvancado({ ...configAvancado, st_rate_limiting: checked });
                          markChanged();
                        }}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="aparencia">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Palette className="h-4 w-4" />
                      Aparência do Widget
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Cor Principal</Label>
                        <Input
                          type="color"
                          value={configAvancado.ds_cor_widget}
                          onChange={(e) => {
                            setConfigAvancado({ ...configAvancado, ds_cor_widget: e.target.value });
                            markChanged();
                          }}
                          className="h-10"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Posição do Widget</Label>
                        <Select
                          value={configAvancado.ds_posicao_widget}
                          onValueChange={(value) => {
                            setConfigAvancado({ ...configAvancado, ds_posicao_widget: value });
                            markChanged();
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bottom-right">Inferior Direito</SelectItem>
                            <SelectItem value="bottom-left">Inferior Esquerdo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
