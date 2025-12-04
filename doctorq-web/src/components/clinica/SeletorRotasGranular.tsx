/**
 * Componente para seleção granular de rotas/páginas acessíveis por um perfil
 *
 * Permite marcar/desmarcar cada página individualmente, com organização por grupo.
 *
 * @author Claude
 * @date 2025-11-05
 */

'use client';

import { useState } from 'react';
import { Check, ChevronDown, ChevronRight, Layout, Lock, Search, Unlock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Definição completa de todas as rotas do sistema
const TODAS_ROTAS = {
  admin: [
    { path: '/admin/dashboard', label: 'Dashboard Admin' },
    { path: '/admin/empresas', label: 'Empresas' },
    { path: '/admin/usuarios', label: 'Usuários' },
    { path: '/admin/perfis', label: 'Perfis e Permissões' },
    { path: '/admin/agentes', label: 'Agentes IA' },
    { path: '/admin/conversas', label: 'Conversas' },
    { path: '/admin/analytics', label: 'Analytics' },
    { path: '/admin/billing', label: 'Faturamento' },
    { path: '/admin/licencas', label: 'Licenças' },
    { path: '/admin/marketplace', label: 'Marketplace' },
    { path: '/admin/configuracoes', label: 'Configurações' },
    { path: '/admin/tools', label: 'Ferramentas' },
  ],
  clinica: [
    { path: '/clinica/dashboard', label: 'Dashboard Clínica' },
    { path: '/clinica/agenda', label: 'Agenda' },
    { path: '/clinica/pacientes', label: 'Pacientes' },
    { path: '/clinica/profissionais', label: 'Profissionais' },
    { path: '/clinica/procedimentos', label: 'Procedimentos' },
    { path: '/clinica/financeiro', label: 'Financeiro' },
    { path: '/clinica/equipe', label: 'Equipe' },
    { path: '/clinica/perfis', label: 'Perfis de Acesso' },
    { path: '/clinica/relatorios', label: 'Relatórios' },
    { path: '/clinica/configuracoes', label: 'Configurações' },
  ],
  profissional: [
    { path: '/profissional/dashboard', label: 'Dashboard Profissional' },
    { path: '/profissional/agenda', label: 'Minha Agenda' },
    { path: '/profissional/pacientes', label: 'Meus Pacientes' },
    { path: '/profissional/procedimentos', label: 'Procedimentos' },
    { path: '/profissional/prontuarios', label: 'Prontuários' },
    { path: '/profissional/avaliacoes', label: 'Avaliações' },
    { path: '/profissional/financeiro', label: 'Financeiro' },
    { path: '/profissional/mensagens', label: 'Mensagens' },
    { path: '/profissional/perfil', label: 'Meu Perfil' },
    { path: '/profissional/configuracoes', label: 'Configurações' },
  ],
  paciente: [
    { path: '/paciente/dashboard', label: 'Meu Painel' },
    { path: '/paciente/agendamentos', label: 'Agendamentos' },
    { path: '/paciente/avaliacoes', label: 'Avaliações' },
    { path: '/paciente/financeiro', label: 'Financeiro' },
    { path: '/paciente/fotos', label: 'Fotos (Antes/Depois)' },
    { path: '/paciente/favoritos', label: 'Favoritos' },
    { path: '/paciente/pedidos', label: 'Pedidos' },
    { path: '/paciente/mensagens', label: 'Mensagens' },
    { path: '/paciente/perfil', label: 'Meu Perfil' },
  ],
  fornecedor: [
    { path: '/fornecedor/dashboard', label: 'Dashboard Fornecedor' },
    { path: '/fornecedor/produtos', label: 'Produtos' },
    { path: '/fornecedor/pedidos', label: 'Pedidos' },
    { path: '/fornecedor/financeiro', label: 'Financeiro' },
    { path: '/fornecedor/avaliacoes', label: 'Avaliações' },
    { path: '/fornecedor/perfil', label: 'Perfil da Empresa' },
  ],
} as const;

type GrupoKey = keyof typeof TODAS_ROTAS;

interface SeletorRotasGranularProps {
  gruposSelecionados: string[];
  rotasSelecionadas: string[];
  onChange: (rotas: string[]) => void;
  disabled?: boolean;
  className?: string;
}

export function SeletorRotasGranular({
  gruposSelecionados = [],
  rotasSelecionadas = [],
  onChange,
  disabled = false,
  className,
}: SeletorRotasGranularProps) {
  const [busca, setBusca] = useState('');
  const [gruposExpandidos, setGruposExpandidos] = useState<Set<string>>(
    new Set(gruposSelecionados)
  );

  // Filtrar rotas disponíveis baseado nos grupos selecionados
  const rotasDisponiveis = gruposSelecionados.reduce((acc, grupo) => {
    const rotas = TODAS_ROTAS[grupo as GrupoKey];
    if (rotas) {
      acc[grupo] = rotas;
    }
    return acc;
  }, {} as Record<string, typeof TODAS_ROTAS[GrupoKey]>);

  // Aplicar filtro de busca
  const rotasFiltradas = Object.entries(rotasDisponiveis).reduce(
    (acc, [grupo, rotas]) => {
      const rotasFiltradas = rotas.filter(
        (rota) =>
          rota.label.toLowerCase().includes(busca.toLowerCase()) ||
          rota.path.toLowerCase().includes(busca.toLowerCase())
      );
      if (rotasFiltradas.length > 0) {
        acc[grupo] = rotasFiltradas;
      }
      return acc;
    },
    {} as Record<string, typeof TODAS_ROTAS[GrupoKey]>
  );

  const toggleGrupo = (grupo: string) => {
    const novoSet = new Set(gruposExpandidos);
    if (novoSet.has(grupo)) {
      novoSet.delete(grupo);
    } else {
      novoSet.add(grupo);
    }
    setGruposExpandidos(novoSet);
  };

  const toggleRota = (path: string) => {
    if (disabled) return;

    if (rotasSelecionadas.includes(path)) {
      onChange(rotasSelecionadas.filter((r) => r !== path));
    } else {
      onChange([...rotasSelecionadas, path]);
    }
  };

  const toggleTodasRotasGrupo = (grupo: string) => {
    if (disabled) return;

    const rotas = rotasDisponiveis[grupo];
    if (!rotas) return;

    const pathsGrupo: string[] = rotas.map((r) => r.path);
    const todasSelecionadas = pathsGrupo.every((path) =>
      rotasSelecionadas.includes(path)
    );

    if (todasSelecionadas) {
      // Desmarcar todas do grupo
      onChange(rotasSelecionadas.filter((r) => !pathsGrupo.includes(r)));
    } else {
      // Marcar todas do grupo
      const novasRotas = [...new Set([...rotasSelecionadas, ...pathsGrupo])];
      onChange(novasRotas);
    }
  };

  const selecionarTodas = () => {
    if (disabled) return;
    const todasPaths: string[] = Object.values(rotasDisponiveis)
      .flat()
      .map((r) => r.path);
    onChange(todasPaths);
  };

  const desmarcarTodas = () => {
    if (disabled) return;
    onChange([]);
  };

  const totalRotas = Object.values(rotasDisponiveis)
    .flat()
    .length;
  const totalSelecionadas = rotasSelecionadas.length;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header com busca e ações */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layout className="h-5 w-5 text-gray-600" />
            <h4 className="text-sm font-semibold text-gray-700">
              Controle de Acesso a Páginas
            </h4>
          </div>
          <Badge variant="outline" className="font-mono">
            {totalSelecionadas} / {totalRotas}
          </Badge>
        </div>

        {/* Campo de busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar página..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            disabled={disabled}
            className="pl-9"
          />
        </div>

        {/* Botões de ação rápida */}
        {totalRotas > 0 && (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={selecionarTodas}
              disabled={disabled || totalSelecionadas === totalRotas}
            >
              Selecionar Todas
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={desmarcarTodas}
              disabled={disabled || totalSelecionadas === 0}
            >
              Desmarcar Todas
            </Button>
          </div>
        )}
      </div>

      {/* Lista de rotas por grupo */}
      {gruposSelecionados.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <Lock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">
            Selecione grupos de acesso primeiro
          </p>
        </div>
      ) : Object.keys(rotasFiltradas).length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
          <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">
            Nenhuma página encontrada com &quot;{busca}&quot;
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(rotasFiltradas).map(([grupo, rotas]) => {
            const isExpanded = gruposExpandidos.has(grupo);
            const pathsGrupo = rotas.map((r) => r.path);
            const totalGrupo = pathsGrupo.length;
            const selecionadasGrupo = pathsGrupo.filter((p) =>
              rotasSelecionadas.includes(p)
            ).length;
            const todasSelecionadas = selecionadasGrupo === totalGrupo;

            return (
              <div
                key={grupo}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden"
              >
                {/* Header do grupo */}
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleGrupo(grupo)}
                        disabled={disabled}
                        className="p-1 hover:bg-gray-200 rounded disabled:opacity-50"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                      <Unlock className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-semibold text-gray-700 capitalize">
                        {grupo}
                      </span>
                      <Badge variant="secondary" className="font-mono text-xs">
                        {selecionadasGrupo}/{totalGrupo}
                      </Badge>
                    </div>

                    {/* Checkbox do grupo */}
                    <button
                      type="button"
                      onClick={() => toggleTodasRotasGrupo(grupo)}
                      disabled={disabled}
                      className={cn(
                        'flex items-center gap-2 px-3 py-1.5 rounded-md border transition-colors',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                        todasSelecionadas
                          ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                          : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                      )}
                    >
                      <div
                        className={cn(
                          'w-4 h-4 rounded border-2 flex items-center justify-center',
                          todasSelecionadas
                            ? 'bg-green-600 border-green-600'
                            : 'bg-white border-gray-300'
                        )}
                      >
                        {todasSelecionadas && (
                          <Check className="h-3 w-3 text-white" />
                        )}
                      </div>
                      <span className="text-xs font-medium">
                        {todasSelecionadas ? 'Todas' : 'Nenhuma'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Lista de rotas */}
                {isExpanded && (
                  <div className="divide-y divide-gray-100">
                    {rotas.map((rota) => {
                      const isSelecionada = rotasSelecionadas.includes(rota.path);

                      return (
                        <button
                          key={rota.path}
                          type="button"
                          onClick={() => toggleRota(rota.path)}
                          disabled={disabled}
                          className={cn(
                            'w-full px-4 py-3 flex items-center gap-3 transition-colors text-left',
                            'disabled:opacity-50 disabled:cursor-not-allowed',
                            isSelecionada
                              ? 'bg-green-50 hover:bg-green-100'
                              : 'bg-white hover:bg-gray-50'
                          )}
                        >
                          {/* Checkbox */}
                          <div
                            className={cn(
                              'flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                              isSelecionada
                                ? 'bg-green-600 border-green-600'
                                : 'bg-white border-gray-300'
                            )}
                          >
                            {isSelecionada && (
                              <Check className="h-3 w-3 text-white" />
                            )}
                          </div>

                          {/* Info da rota */}
                          <Layout className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p
                              className={cn(
                                'text-sm font-medium truncate',
                                isSelecionada ? 'text-green-900' : 'text-gray-700'
                              )}
                            >
                              {rota.label}
                            </p>
                            <p
                              className={cn(
                                'text-xs font-mono truncate',
                                isSelecionada ? 'text-green-700' : 'text-gray-400'
                              )}
                            >
                              {rota.path}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Feedback visual */}
      {totalSelecionadas > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2 text-xs text-green-800">
          <span className="font-semibold flex-shrink-0">✅ {totalSelecionadas} página{totalSelecionadas !== 1 ? 's' : ''} selecionada{totalSelecionadas !== 1 ? 's' : ''}:</span>
          <span>
            Usuários com este perfil poderão acessar as páginas marcadas acima.
          </span>
        </div>
      )}
    </div>
  );
}
