'use client';

import { useState } from 'react';
import { useCredenciais, deletarCredencial, toggleCredencialStatus, type Credencial } from '@/lib/api/hooks/useCredenciais';
import { PageHeader } from '@/components/shared/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Search, Plus, Edit, Trash2, Power, PowerOff, Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function CredenciaisPage() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [busca, setBusca] = useState('');
  const [buscaDebounced, setBuscaDebounced] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState<string>('');

  const { credenciais, meta, isLoading, error, mutate } = useCredenciais({
    page,
    size: pageSize,
    search: buscaDebounced,
    tipo: tipoFiltro || undefined,
  });

  const handleSearch = () => {
    setBuscaDebounced(busca);
    setPage(1);
  };

  const handleDelete = async (credencial: Credencial) => {
    if (!confirm(`Deseja realmente deletar a credencial "${credencial.nm_credencial}"?`)) return;
    try {
      await deletarCredencial(credencial.id_credencial);
      toast.success('Credencial deletada com sucesso');
      mutate();
    } catch (error) {
      toast.error('Erro ao deletar credencial');
    }
  };

  const handleToggleStatus = async (credencial: Credencial) => {
    try {
      const novoStatus = credencial.st_ativo === 'S' ? 'N' : 'S';
      await toggleCredencialStatus(credencial.id_credencial, novoStatus);
      toast.success(`Credencial ${novoStatus === 'S' ? 'ativada' : 'desativada'} com sucesso`);
      mutate();
    } catch (error) {
      toast.error('Erro ao alterar status');
    }
  };

  const getTipoColor = (tipo: string) => {
    const colors: Record<string, string> = {
      llm: 'bg-blue-100 text-blue-700',
      database: 'bg-green-100 text-green-700',
      api: 'bg-purple-100 text-purple-700',
      redis: 'bg-red-100 text-red-700',
      oauth: 'bg-indigo-100 text-indigo-700',
    };
    return colors[tipo] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto p-8 space-y-6">
        <PageHeader title="Credenciais" description="Gerencie credenciais criptografadas do sistema" />

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>Credenciais do Sistema</CardTitle>
                <CardDescription>Configure credenciais seguras com criptografia AES-256</CardDescription>
              </div>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Credencial
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <Input
                  placeholder="Buscar credencial..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os tipos</SelectItem>
                  <SelectItem value="llm">LLM</SelectItem>
                  <SelectItem value="database">Database</SelectItem>
                  <SelectItem value="api">API</SelectItem>
                  <SelectItem value="redis">Redis</SelectItem>
                  <SelectItem value="oauth">OAuth</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleSearch} variant="secondary">
                <Search className="mr-2 h-4 w-4" />
                Buscar
              </Button>
            </div>

            {isLoading && <div className="text-center py-12 text-muted-foreground">Carregando credenciais...</div>}
            {error && <div className="text-center py-12 text-red-600">Erro ao carregar credenciais: {error.message}</div>}

            {!isLoading && !error && credenciais.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                {buscaDebounced || tipoFiltro
                  ? 'Nenhuma credencial encontrada com os filtros aplicados'
                  : 'Nenhuma credencial cadastrada. Clique em "Nova Credencial" para começar.'}
              </div>
            )}

            {!isLoading && !error && credenciais.length > 0 && (
              <div className="grid gap-4">
                {credenciais.map((credencial) => (
                  <Card key={credencial.id_credencial} className="border-0 shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
                            <Shield className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <CardTitle className="text-base">{credencial.nm_credencial}</CardTitle>
                              <Badge className={getTipoColor(credencial.ds_tipo)}>{credencial.ds_tipo.toUpperCase()}</Badge>
                              {credencial.ds_provedor && (
                                <Badge variant="outline">{credencial.ds_provedor}</Badge>
                              )}
                              <Badge className={credencial.st_ativo === 'S' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                                {credencial.st_ativo === 'S' ? 'Ativo' : 'Inativo'}
                              </Badge>
                            </div>
                            {credencial.ds_credencial && (
                              <CardDescription className="text-xs mt-1">{credencial.ds_credencial}</CardDescription>
                            )}
                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                              <Lock className="h-3 w-3" />
                              <span>Valores criptografados (AES-256)</span>
                              {credencial.dt_ultimo_uso && (
                                <span className="ml-4">Último uso: {new Date(credencial.dt_ultimo_uso).toLocaleDateString('pt-BR')}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost" onClick={() => handleToggleStatus(credencial)} title={credencial.st_ativo === 'S' ? 'Desativar' : 'Ativar'}>
                            {credencial.st_ativo === 'S' ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(credencial)}>
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}

            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-muted-foreground">Mostrando {credenciais.length} de {meta.totalItems} credenciais</div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Anterior</Button>
                  <span className="text-sm">Página {page} de {meta.totalPages}</span>
                  <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages}>Próxima</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
