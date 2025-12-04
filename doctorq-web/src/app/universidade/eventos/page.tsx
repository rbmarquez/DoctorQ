/**
 * Página de Eventos - Universidade da Beleza
 * Dados reais da API com funcionalidades completas
 */
'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { ArrowLeft, Calendar, Clock, Filter, MapPin, Search, Users, Video } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// API URL
const UNIV_API_URL = process.env.NEXT_PUBLIC_UNIV_API_URL || 'http://localhost:8081';

// Fetcher para SWR
const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Evento {
  id_evento: string;
  titulo: string;
  descricao: string;
  tipo: string;
  dt_inicio: string;
  dt_fim: string;
  duracao_horas: number;
  instrutor_nome: string;
  preco: number;
  preco_assinante: number;
  max_participantes?: number;
  total_inscritos: number;
  stream_url?: string;
  replay_url?: string;
  fg_chat_habilitado: boolean;
  fg_metaverso_habilitado: boolean;
  certificado_horas: number;
  thumbnail_url: string;
  status: string;
  tags: string[];
  dt_criacao: string;
}

export default function EventosPage() {
  const [tipo, setTipo] = useState<string>('');
  const [status, setStatus] = useState<string>('agendado');
  const [search, setSearch] = useState('');

  // Buscar eventos da API
  const { data: eventos = [], error, isLoading } = useSWR<Evento[]>(
    `${UNIV_API_URL}/eventos/?status=${status}`,
    fetcher
  );

  // Handler para inscrição
  const handleInscrever = async (evento: Evento) => {
    // TODO: Integrar com sistema de pagamento e autenticação
    const preco = evento.preco_assinante > 0 ? evento.preco_assinante : evento.preco;

    if (preco === 0) {
      alert(`Inscrição gratuita confirmada para "${evento.titulo}"! Você receberá o link de acesso por e-mail.`);
    } else {
      alert(`Evento: ${evento.titulo}\nValor: R$ ${preco.toFixed(2)}\n\nEm breve você será redirecionado para o pagamento.`);
    }
  };

  // Handler para assistir replay
  const handleAssistirReplay = (evento: Evento) => {
    if (!evento.replay_url) {
      alert('Replay ainda não disponível para este evento.');
      return;
    }
    window.open(evento.replay_url, '_blank');
  };

  // Filtro local
  const eventosFiltrados = eventos.filter((evento) => {
    const matchTipo = !tipo || tipo === 'all' || evento.tipo === tipo;
    const matchSearch =
      !search ||
      evento.titulo.toLowerCase().includes(search.toLowerCase()) ||
      evento.descricao.toLowerCase().includes(search.toLowerCase()) ||
      evento.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()));

    return matchTipo && matchSearch;
  });

  // Formatar data e hora
  const formatarDataHora = (dt: string) => {
    const data = new Date(dt);
    return {
      data: data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }),
      hora: data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  // Verificar se evento é gratuito
  const isGratuito = (evento: Evento) => {
    return evento.preco === 0;
  };

  // Obter cor do badge por tipo
  const getTipoBadgeVariant = (tipo: string): "default" | "secondary" | "outline" => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      'webinar': 'default',
      'workshop': 'secondary',
      'congresso': 'outline',
      'imersao': 'outline',
      'masterclass': 'secondary',
    };
    return variants[tipo] || 'default';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="container mx-auto max-w-7xl px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/universidade">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Link>
            </Button>
          </div>

          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">Eventos & Masterclasses</h1>
              <p className="text-muted-foreground">
                Participe de webinars, workshops e eventos presenciais com os melhores especialistas
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto max-w-7xl px-4 py-8">
        {/* Tabs de Status */}
        <Tabs value={status} onValueChange={setStatus} className="mb-6">
          <TabsList>
            <TabsTrigger value="agendado">Próximos Eventos</TabsTrigger>
            <TabsTrigger value="finalizado">Replays Disponíveis</TabsTrigger>
            <TabsTrigger value="ao_vivo">Ao Vivo Agora</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar eventos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={tipo} onValueChange={setTipo}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="webinar">Webinar</SelectItem>
              <SelectItem value="workshop">Workshop</SelectItem>
              <SelectItem value="congresso">Congresso</SelectItem>
              <SelectItem value="imersao">Imersão</SelectItem>
              <SelectItem value="masterclass">Masterclass</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Estatísticas */}
        {!isLoading && eventos.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-primary">{eventos.length}</div>
                <div className="text-sm text-muted-foreground">
                  {status === 'agendado' ? 'Eventos agendados' : 'Replays disponíveis'}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-primary">
                  {eventos.reduce((sum, e) => sum + e.total_inscritos, 0).toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Inscritos totais</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-primary">
                  {eventos.reduce((sum, e) => sum + e.certificado_horas, 0)}h
                </div>
                <div className="text-sm text-muted-foreground">Total de certificação</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-primary">
                  {eventos.filter(e => e.preco === 0).length}
                </div>
                <div className="text-sm text-muted-foreground">Eventos gratuitos</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando eventos...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-center py-12">
            <p className="text-destructive">Erro ao carregar eventos. Tente novamente.</p>
          </div>
        )}

        {/* Resultados */}
        {!isLoading && eventosFiltrados.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum evento encontrado.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {eventosFiltrados.map((evento) => {
            const { data, hora } = formatarDataHora(evento.dt_inicio);
            const gratuito = isGratuito(evento);

            return (
              <Card key={evento.id_evento} className="group hover:shadow-lg transition-shadow flex flex-col">
                {/* Thumbnail */}
                <div className="relative h-48 bg-gradient-to-br from-blue-600/20 to-purple-600/20 overflow-hidden flex items-center justify-center">
                  {evento.thumbnail_url ? (
                    <img
                      src={evento.thumbnail_url}
                      alt={evento.titulo}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Calendar className="h-16 w-16 text-primary/30" />
                  )}

                  {/* Badges no topo */}
                  <div className="absolute top-2 left-2 flex gap-2">
                    <Badge variant={getTipoBadgeVariant(evento.tipo)}>
                      {evento.tipo.charAt(0).toUpperCase() + evento.tipo.slice(1)}
                    </Badge>
                    {gratuito && (
                      <Badge variant="secondary" className="bg-green-500 text-white">
                        Grátis
                      </Badge>
                    )}
                  </div>

                  {/* Badge certificação */}
                  {evento.certificado_horas > 0 && (
                    <div className="absolute top-2 right-2">
                      <Badge variant="outline" className="bg-white/90">
                        {evento.certificado_horas}h certificado
                      </Badge>
                    </div>
                  )}
                </div>

                <CardHeader className="flex-1">
                  <CardTitle className="text-base line-clamp-2 group-hover:text-primary transition-colors">
                    {evento.titulo}
                  </CardTitle>
                  <CardDescription>
                    {evento.instrutor_nome}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-1">
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-4">
                    {evento.descricao}
                  </p>

                  {/* Informações do evento */}
                  <div className="space-y-2 text-xs text-muted-foreground mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      <span>{data}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      <span>{hora} • {evento.duracao_horas}h</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-3 w-3" />
                      <span>{evento.total_inscritos} inscritos</span>
                      {evento.max_participantes && (
                        <span className="text-xs">• {evento.max_participantes} vagas</span>
                      )}
                    </div>
                    {evento.fg_metaverso_habilitado && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        <span>Disponível no Metaverso</span>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {evento.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-2">
                  {/* Preço */}
                  {!gratuito && (
                    <div className="w-full text-center mb-2">
                      {evento.preco_assinante > 0 ? (
                        <>
                          <div className="text-sm text-muted-foreground line-through">
                            R$ {evento.preco.toFixed(2)}
                          </div>
                          <div className="text-lg font-bold text-primary">
                            R$ {evento.preco_assinante.toFixed(2)}
                            <span className="text-xs text-muted-foreground ml-1">para assinantes</span>
                          </div>
                        </>
                      ) : (
                        <div className="text-lg font-bold text-primary">
                          R$ {evento.preco.toFixed(2)}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Botões de ação */}
                  {status === 'agendado' && (
                    <Button
                      className="w-full"
                      variant="default"
                      onClick={() => handleInscrever(evento)}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Inscrever-se
                    </Button>
                  )}

                  {status === 'finalizado' && evento.replay_url && (
                    <Button
                      className="w-full"
                      variant="default"
                      onClick={() => handleAssistirReplay(evento)}
                    >
                      <Video className="h-4 w-4 mr-2" />
                      Assistir Replay
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
