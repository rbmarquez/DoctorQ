'use client';

import { useState } from 'react';
import { useVariaveis, deletarVariavel, toggleVariavelStatus, formatarValor, type Variavel } from '@/lib/api/hooks/useVariaveis';
import { PageHeader } from '@/components/shared/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Search, Plus, Edit, Trash2, Power, PowerOff, Code } from 'lucide-react';
import { toast } from 'sonner';

export default function VariaveisPage() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [busca, setBusca] = useState('');
  const [buscaDebounced, setBuscaDebounced] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState<string>('');

  const { variaveis, meta, isLoading, error, mutate } = useVariaveis({
    page,
    size: pageSize,
    search: buscaDebounced,
    tipo: tipoFiltro || undefined,
  });

  const handleSearch = () => {
    setBuscaDebounced(busca);
    setPage(1);
  };

  const handleDelete = async (variavel: Variavel) => {
    if (!confirm(`Deseja realmente deletar a variável "${variavel.nm_variavel}"?`)) return;
    try {
      await deletarVariavel(variavel.id_variavel);
      toast.success('Variável deletada com sucesso');
      mutate();
    } catch (error) {
      toast.error('Erro ao deletar variável');
    }
  };

  const handleToggleStatus = async (variavel: Variavel) => {
    try {
      const novoStatus = variavel.st_ativo === 'S' ? 'N' : 'S';
      await toggleVariavelStatus(variavel.id_variavel, novoStatus);
      toast.success(`Variável ${novoStatus === 'S' ? 'ativada' : 'desativada'} com sucesso`);
      mutate();
    } catch (error) {
      toast.error('Erro ao alterar status');
    }
  };

  const getTipoColor = (tipo: string) => {
    const colors: Record<string, string> = {
      string: 'bg-blue-100 text-blue-700',
      number: 'bg-green-100 text-green-700',
      boolean: 'bg-purple-100 text-purple-700',
      json: 'bg-orange-100 text-orange-700',
      date: 'bg-blue-100 text-blue-700',
    };
    return colors[tipo] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto p-8 space-y-6">
        <PageHeader title="Variáveis" description="Gerencie variáveis de configuração do sistema" />

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>Variáveis do Sistema</CardTitle>
                <CardDescription>Configure parâmetros dinâmicos da aplicação</CardDescription>
              </div>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Variável
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <Input
                  placeholder="Buscar variável..."
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
                  <SelectItem value="string">String</SelectItem>
                  <SelectItem value="number">Número</SelectItem>
                  <SelectItem value="boolean">Booleano</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="date">Data</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleSearch} variant="secondary">
                <Search className="mr-2 h-4 w-4" />
                Buscar
              </Button>
            </div>

            {isLoading && <div className="text-center py-12 text-muted-foreground">Carregando variáveis...</div>}
            {error && <div className="text-center py-12 text-red-600">Erro ao carregar variáveis: {error.message}</div>}

            {!isLoading && !error && variaveis.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                {buscaDebounced || tipoFiltro
                  ? 'Nenhuma variável encontrada com os filtros aplicados'
                  : 'Nenhuma variável cadastrada. Clique em "Nova Variável" para começar.'}
              </div>
            )}

            {!isLoading && !error && variaveis.length > 0 && (
              <div className="grid gap-4">
                {variaveis.map((variavel) => (
                  <Card key={variavel.id_variavel} className="border-0 shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600">
                            <Settings className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <CardTitle className="text-base">{variavel.nm_variavel}</CardTitle>
                              <Badge className={getTipoColor(variavel.ds_tipo)}>{variavel.ds_tipo.toUpperCase()}</Badge>
                              <Badge className={variavel.st_ativo === 'S' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                                {variavel.st_ativo === 'S' ? 'Ativo' : 'Inativo'}
                              </Badge>
                            </div>
                            {variavel.ds_variavel && (
                              <CardDescription className="text-xs mt-1">{variavel.ds_variavel}</CardDescription>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <Code className="h-3 w-3 text-muted-foreground" />
                              <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono max-w-md truncate">
                                {formatarValor(variavel)}
                              </code>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost" onClick={() => handleToggleStatus(variavel)} title={variavel.st_ativo === 'S' ? 'Desativar' : 'Ativar'}>
                            {variavel.st_ativo === 'S' ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(variavel)}>
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
                <div className="text-sm text-muted-foreground">Mostrando {variaveis.length} de {meta.totalItems} variáveis</div>
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
