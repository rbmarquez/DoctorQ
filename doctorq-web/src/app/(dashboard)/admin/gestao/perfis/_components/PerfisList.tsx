'use client';

import { Shield, Users, Edit, Trash, MoreVertical } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Pagination } from '@/components/shared/navigation/Pagination';
import { EmptyState } from '@/components/shared/feedback/EmptyState';
import type { Perfil } from '@/lib/api/server';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface PerfisListProps {
  initialPerfis: Perfil[];
  initialMeta: { total: number; page: number; size: number; pages: number };
}

const PAPEL_COLORS: Record<string, string> = {
  admin: 'from-red-500 to-rose-600',
  gestor_clinica: 'from-purple-500 to-blue-600',
  profissional: 'from-blue-500 to-indigo-600',
  recepcionista: 'from-cyan-500 to-blue-600',
  paciente: 'from-green-500 to-emerald-600',
};

export function PerfisList({ initialPerfis, initialMeta }: PerfisListProps) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600">
        Total: <span className="font-semibold">{initialMeta.total}</span> perfis
      </p>

      {initialPerfis.length === 0 ? (
        <EmptyState icon={Shield} title="Nenhum perfil encontrado" description="Crie perfis para organizar permissões" action={{ label: 'Novo Perfil', href: '/admin/gestao/perfis/novo' }} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {initialPerfis.map((perfil) => {
            const gradient = PAPEL_COLORS[perfil.nm_perfil] || PAPEL_COLORS.admin;

            return (
              <Card key={perfil.id_perfil} className="group hover:shadow-xl transition-all border-0 bg-gradient-to-br from-white to-gray-50">
                <div className={`h-2 bg-gradient-to-r ${gradient}`} />
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-start gap-3">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}>
                        <Shield className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-base font-bold text-gray-900">{perfil.nm_perfil}</CardTitle>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{perfil.ds_perfil || 'Sem descrição'}</p>
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/gestao/perfis/${perfil.id_perfil}`}>
                          <Edit className="w-4 h-4 mr-2" />Editar
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        <Trash className="w-4 h-4 mr-2" />Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant={perfil.fl_ativo ? 'default' : 'secondary'}>
                      {perfil.fl_ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>0 usuários</span>
                    </div>
                  </div>
                  {perfil.permissions && perfil.permissions.length > 0 && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-gray-600">{perfil.permissions.length} permissões</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {initialMeta.pages > 1 && (
        <Pagination
          currentPage={initialMeta.page}
          totalPages={initialMeta.pages}
          totalItems={initialMeta.total}
          pageSize={initialMeta.size}
          onPageChange={(p) => router.push(`/admin/gestao/perfis?page=${p}`)}
        />
      )}
    </div>
  );
}
