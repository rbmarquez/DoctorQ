'use client';

import { useState } from 'react';
import {
  useApiKeys,
  deletarApiKey,
  toggleApiKeyStatus,
  mascararKey,
  type ApiKey,
} from '@/lib/api/hooks/useApiKeys';
import { PageHeader } from '@/components/shared/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Key, Search, Plus, Edit, Trash2, Power, PowerOff, Copy, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export default function APIKeysPage() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [busca, setBusca] = useState('');
  const [buscaDebounced, setBuscaDebounced] = useState('');
  const [ativoFiltro, setAtivoFiltro] = useState<string>('');

  const { apiKeys, meta, isLoading, error, mutate } = useApiKeys({
    page,
    size: pageSize,
    search: buscaDebounced,
    ativo: ativoFiltro as 'S' | 'N' | undefined,
  });

  const handleSearch = () => {
    setBuscaDebounced(busca);
    setPage(1);
  };

  const handleDelete = async (apiKey: ApiKey) => {
    if (!confirm(`Deseja realmente deletar a chave "${apiKey.nm_apikey}"?`)) {
      return;
    }

    try {
      await deletarApiKey(apiKey.id_apikey);
      toast.success('API Key deletada com sucesso');
      mutate();
    } catch (error) {
      toast.error('Erro ao deletar API Key');
      console.error(error);
    }
  };

  const handleToggleStatus = async (apiKey: ApiKey) => {
    try {
      const novoStatus = apiKey.st_ativo === 'S' ? 'N' : 'S';
      await toggleApiKeyStatus(apiKey.id_apikey, novoStatus);
      toast.success(`API Key ${novoStatus === 'S' ? 'ativada' : 'desativada'} com sucesso`);
      mutate();
    } catch (error) {
      toast.error('Erro ao alterar status');
      console.error(error);
    }
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success('Key copiada para área de transferência');
  };

  const isExpired = (apiKey: ApiKey) => {
    if (!apiKey.dt_expiracao) return false;
    return new Date(apiKey.dt_expiracao) < new Date();
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'Sem expiração';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto p-8 space-y-6">
        <PageHeader
          title="API Keys"
          description="Gerencie chaves de autenticação do sistema"
        />

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>Chaves de API</CardTitle>
                <CardDescription>Configure e gerencie acesso programático ao sistema</CardDescription>
              </div>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova API Key
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <Input
                  placeholder="Buscar API key..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Select value={ativoFiltro} onValueChange={setAtivoFiltro}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os status</SelectItem>
                  <SelectItem value="S">Ativas</SelectItem>
                  <SelectItem value="N">Inativas</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleSearch} variant="secondary">
                <Search className="mr-2 h-4 w-4" />
                Buscar
              </Button>
            </div>

            {isLoading && (
              <div className="text-center py-12 text-muted-foreground">
                Carregando API keys...
              </div>
            )}

            {error && (
              <div className="text-center py-12 text-red-600">
                Erro ao carregar API keys: {error.message}
              </div>
            )}

            {!isLoading && !error && apiKeys.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                {buscaDebounced || ativoFiltro
                  ? 'Nenhuma API key encontrada com os filtros aplicados'
                  : 'Nenhuma API key cadastrada. Clique em "Nova API Key" para começar.'}
              </div>
            )}

            {!isLoading && !error && apiKeys.length > 0 && (
              <div className="grid gap-4">
                {apiKeys.map((apiKey) => {
                  const expired = isExpired(apiKey);
                  const active = apiKey.st_ativo === 'S';
                  const valid = active && !expired;

                  return (
                    <Card key={apiKey.id_apikey} className="border-0 shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-yellow-500 to-orange-600">
                              <Key className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <CardTitle className="text-base">{apiKey.nm_apikey}</CardTitle>
                                <Badge
                                  className={
                                    valid
                                      ? 'bg-green-100 text-green-700'
                                      : expired
                                      ? 'bg-red-100 text-red-700'
                                      : 'bg-gray-100 text-gray-700'
                                  }
                                >
                                  {expired ? 'Expirada' : active ? 'Ativa' : 'Inativa'}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                                  {mascararKey(apiKey.cd_key || '', apiKey.cd_key_prefix)}
                                </code>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                  onClick={() => handleCopyKey(apiKey.cd_key_prefix || apiKey.cd_key)}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                              {apiKey.ds_apikey && (
                                <CardDescription className="text-xs mt-1">
                                  {apiKey.ds_apikey}
                                </CardDescription>
                              )}
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Exp: {formatDate(apiKey.dt_expiracao)}
                                </div>
                                {apiKey.nr_total_requisicoes > 0 && (
                                  <div>{apiKey.nr_total_requisicoes} requisições</div>
                                )}
                                {apiKey.dt_ultimo_uso && (
                                  <div>
                                    Último uso: {new Date(apiKey.dt_ultimo_uso).toLocaleDateString('pt-BR')}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleToggleStatus(apiKey)}
                              title={active ? 'Desativar' : 'Ativar'}
                            >
                              {active ? (
                                <PowerOff className="h-4 w-4" />
                              ) : (
                                <Power className="h-4 w-4" />
                              )}
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(apiKey)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  );
                })}
              </div>
            )}

            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-muted-foreground">
                  Mostrando {apiKeys.length} de {meta.totalItems} API keys
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm">
                    Página {page} de {meta.totalPages}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                    disabled={page === meta.totalPages}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
