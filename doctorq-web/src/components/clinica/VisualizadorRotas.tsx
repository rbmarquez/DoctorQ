/**
 * Componente para visualizar as rotas/páginas acessíveis por um perfil
 *
 * Mostra uma prévia das páginas que ficarão disponíveis baseado nos grupos
 * de acesso selecionados.
 *
 * @author Claude
 * @date 2025-11-05
 */

'use client';

import { Eye, Layout, Lock, Unlock } from 'lucide-react';
import { cn } from '@/lib/utils';

// Mapeamento de grupos para rotas/páginas
const ROTAS_POR_GRUPO = {
  admin: [
    { path: '/admin/dashboard', label: 'Dashboard Admin', icon: Layout },
    { path: '/admin/empresas', label: 'Empresas', icon: Layout },
    { path: '/admin/usuarios', label: 'Usuários', icon: Layout },
    { path: '/admin/perfis', label: 'Perfis e Permissões', icon: Layout },
    { path: '/admin/agentes', label: 'Agentes IA', icon: Layout },
    { path: '/admin/analytics', label: 'Analytics', icon: Layout },
    { path: '/admin/billing', label: 'Faturamento', icon: Layout },
    { path: '/admin/licencas', label: 'Licenças', icon: Layout },
  ],
  clinica: [
    { path: '/clinica/dashboard', label: 'Dashboard Clínica', icon: Layout },
    { path: '/clinica/agenda', label: 'Agenda', icon: Layout },
    { path: '/clinica/pacientes', label: 'Pacientes', icon: Layout },
    { path: '/clinica/profissionais', label: 'Profissionais', icon: Layout },
    { path: '/clinica/procedimentos', label: 'Procedimentos', icon: Layout },
    { path: '/clinica/financeiro', label: 'Financeiro', icon: Layout },
    { path: '/clinica/equipe', label: 'Equipe', icon: Layout },
    { path: '/clinica/configuracoes', label: 'Configurações', icon: Layout },
  ],
  profissional: [
    { path: '/profissional/dashboard', label: 'Dashboard Profissional', icon: Layout },
    { path: '/profissional/agenda', label: 'Minha Agenda', icon: Layout },
    { path: '/profissional/pacientes', label: 'Meus Pacientes', icon: Layout },
    { path: '/profissional/procedimentos', label: 'Procedimentos', icon: Layout },
    { path: '/profissional/financeiro', label: 'Financeiro', icon: Layout },
    { path: '/profissional/perfil', label: 'Meu Perfil', icon: Layout },
  ],
  paciente: [
    { path: '/paciente/dashboard', label: 'Meu Painel', icon: Layout },
    { path: '/paciente/agendamentos', label: 'Agendamentos', icon: Layout },
    { path: '/paciente/avaliacoes', label: 'Avaliações', icon: Layout },
    { path: '/paciente/financeiro', label: 'Financeiro', icon: Layout },
    { path: '/paciente/fotos', label: 'Fotos (Antes/Depois)', icon: Layout },
    { path: '/paciente/favoritos', label: 'Favoritos', icon: Layout },
    { path: '/paciente/perfil', label: 'Meu Perfil', icon: Layout },
  ],
  fornecedor: [
    { path: '/fornecedor/dashboard', label: 'Dashboard Fornecedor', icon: Layout },
    { path: '/fornecedor/produtos', label: 'Produtos', icon: Layout },
    { path: '/fornecedor/pedidos', label: 'Pedidos', icon: Layout },
    { path: '/fornecedor/financeiro', label: 'Financeiro', icon: Layout },
    { path: '/fornecedor/perfil', label: 'Perfil da Empresa', icon: Layout },
  ],
} as const;

interface VisualizadorRotasProps {
  gruposSelecionados: string[];
  className?: string;
}

export function VisualizadorRotas({
  gruposSelecionados = [],
  className,
}: VisualizadorRotasProps) {
  // Calcular rotas disponíveis baseado nos grupos selecionados
  const rotasDisponiveis = gruposSelecionados.flatMap(
    (grupo) => ROTAS_POR_GRUPO[grupo as keyof typeof ROTAS_POR_GRUPO] || []
  );

  const totalRotas = rotasDisponiveis.length;

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-gray-600" />
          <h4 className="text-sm font-semibold text-gray-700">
            Páginas Acessíveis
          </h4>
        </div>
        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          {totalRotas} página{totalRotas !== 1 ? 's' : ''}
        </span>
      </div>

      {gruposSelecionados.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <Lock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">
            Nenhum grupo selecionado
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Selecione grupos de acesso para ver as páginas disponíveis
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {gruposSelecionados.map((grupo) => {
            const rotas =
              ROTAS_POR_GRUPO[grupo as keyof typeof ROTAS_POR_GRUPO] || [];

            if (rotas.length === 0) return null;

            return (
              <div
                key={grupo}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden"
              >
                {/* Header do grupo */}
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Unlock className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-semibold text-gray-700 capitalize">
                      {grupo}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {rotas.length} página{rotas.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Lista de rotas */}
                <div className="divide-y divide-gray-100">
                  {rotas.map((rota) => {
                    const Icon = rota.icon;
                    return (
                      <div
                        key={rota.path}
                        className="px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                      >
                        <Icon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-700 truncate">
                            {rota.label}
                          </p>
                          <p className="text-xs text-gray-400 font-mono truncate">
                            {rota.path}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {totalRotas > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2 text-xs text-green-800">
          <span className="font-semibold flex-shrink-0">✅ Acesso liberado:</span>
          <span>
            Usuários com este perfil terão acesso a todas as {totalRotas} páginas
            listadas acima.
          </span>
        </div>
      )}
    </div>
  );
}
