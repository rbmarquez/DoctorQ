'use client';

import { useState } from 'react';
import { useMensagens, useConversas } from '@/lib/api/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Mail, Send, Search, Trash2, Archive } from 'lucide-react';
import { toast } from 'sonner';

export function MensagensInbox({ id_usuario }: { id_usuario: string }) {
  const [filtro, setFiltro] = useState<'recebidas' | 'enviadas' | 'todas'>('recebidas');
  const [busca, setBusca] = useState('');

  const { data: mensagens, isLoading, mutate } = useMensagens({
    id_usuario,
    tipo: filtro,
    fl_arquivada: false,
  });

  const handleMarcarLida = async (id_mensagem: string) => {
    try {
      // Usar API diretamente em vez de hook dentro de callback
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const response = await fetch(`${API_BASE_URL}/mensagens/${id_mensagem}/marcar-lida/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Erro ao marcar como lida');

      mutate();
    } catch (error: any) {
      toast.error('Erro ao marcar mensagem como lida');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  const mensagensFiltradas = mensagens?.filter((msg) =>
    msg.ds_assunto?.toLowerCase().includes(busca.toLowerCase()) ||
    msg.ds_conteudo.toLowerCase().includes(busca.toLowerCase()) ||
    msg.nm_remetente.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Filtros e Busca */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Mensagens</CardTitle>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Send className="w-4 h-4 mr-2" />
              Nova Mensagem
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={filtro === 'recebidas' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFiltro('recebidas')}
            >
              Recebidas
            </Button>
            <Button
              variant={filtro === 'enviadas' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFiltro('enviadas')}
            >
              Enviadas
            </Button>
            <Button
              variant={filtro === 'todas' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFiltro('todas')}
            >
              Todas
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar mensagens..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de Mensagens */}
      <div className="space-y-2">
        {mensagensFiltradas && mensagensFiltradas.length > 0 ? (
          mensagensFiltradas.map((msg) => (
            <Card
              key={msg.id_mensagem}
              className={`hover:shadow-md transition-all cursor-pointer ${
                !msg.fl_lida ? 'bg-blue-50 border-blue-200' : ''
              }`}
              onClick={() => !msg.fl_lida && handleMarcarLida(msg.id_mensagem)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900">
                        {filtro === 'enviadas' ? msg.nm_destinatario : msg.nm_remetente}
                      </span>
                      {!msg.fl_lida && filtro === 'recebidas' && (
                        <Badge variant="default" className="text-xs">Nova</Badge>
                      )}
                    </div>
                    {msg.ds_assunto && (
                      <h4 className="font-medium text-sm text-gray-900 mb-1">{msg.ds_assunto}</h4>
                    )}
                    <p className="text-sm text-gray-600 line-clamp-2">{msg.ds_conteudo}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(msg.dt_criacao).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex gap-1 ml-4">
                    <Button size="sm" variant="ghost">
                      <Archive className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-12 text-center">
              <Mail className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">Nenhuma mensagem encontrada</h3>
              <p className="text-gray-600 mt-2">
                {busca ? 'Nenhum resultado para sua busca.' : 'Sua caixa de entrada está vazia.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
