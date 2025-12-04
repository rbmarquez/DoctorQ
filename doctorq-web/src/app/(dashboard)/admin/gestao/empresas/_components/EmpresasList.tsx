/**
 * EmpresasList Component - Client Component
 *
 * Gerencia busca, filtros e exibição de empresas.
 * Recebe dados iniciais do Server Component (SSR),
 * mas pode refetch no cliente para interatividade.
 */

'use client';

import { useState } from 'react';
import { Building2, Plus, Search, Mail, Phone, MapPin, MoreVertical, Edit, Trash } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Pagination } from '@/components/shared/navigation/Pagination';
import { EmptyState } from '@/components/shared/feedback/EmptyState';
import { SearchInput } from '@/components/shared/forms/SearchInput';
import type { Empresa } from '@/lib/api/server';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface EmpresasListProps {
  initialEmpresas: Empresa[];
  initialMeta: {
    total: number;
    page: number;
    size: number;
    pages: number;
  };
}

export function EmpresasList({ initialEmpresas, initialMeta }: EmpresasListProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [empresas] = useState(initialEmpresas);
  const [meta] = useState(initialMeta);

  // Filtrar localmente (ou usar router.push para server-side)
  const filtered = empresas.filter((empresa) =>
    empresa.nm_empresa?.toLowerCase().includes(search.toLowerCase()) ||
    empresa.nm_razao_social?.toLowerCase().includes(search.toLowerCase()) ||
    empresa.nr_cnpj?.includes(search)
  );

  const handlePageChange = (newPage: number) => {
    // Navegação server-side mantém SSR
    router.push(`/admin/gestao/empresas?page=${newPage}${search ? `&busca=${search}` : ''}`);
  };

  const handleSearchSubmit = () => {
    // Trigger server-side search
    router.push(`/admin/gestao/empresas?busca=${search}`);
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <Card className="border-0 shadow-lg">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Buscar por nome, razão social ou CNPJ..."
                onSearch={handleSearchSubmit}
              />
            </div>
            <Button
              onClick={handleSearchSubmit}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <Search className="w-4 h-4 mr-2" />
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Exibindo <span className="font-semibold">{filtered.length}</span> de{' '}
          <span className="font-semibold">{meta.total}</span> empresas
        </p>
      </div>

      {/* Empresas Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Nenhuma empresa encontrada"
          description={
            search
              ? 'Tente ajustar os filtros de busca'
              : 'Comece adicionando sua primeira empresa ao sistema'
          }
          action={
            !search
              ? {
                  label: 'Nova Empresa',
                  href: '/admin/gestao/empresas/nova',
                }
              : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((empresa) => (
            <Card
              key={empresa.id_empresa}
              className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50"
            >
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div className="space-y-2 flex-1">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md">
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base font-semibold text-gray-900 truncate">
                        {empresa.nm_empresa}
                      </CardTitle>
                      <p className="text-xs text-gray-600 truncate mt-1">
                        {empresa.nm_razao_social}
                      </p>
                    </div>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/gestao/empresas/${empresa.id_empresa}`}>
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">
                      <Trash className="w-4 h-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="space-y-3">
                {empresa.nr_cnpj && (
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="secondary" className="font-mono text-xs">
                      {empresa.nr_cnpj}
                    </Badge>
                  </div>
                )}

                {empresa.ds_email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{empresa.ds_email}</span>
                  </div>
                )}

                {empresa.nr_telefone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    <span>{empresa.nr_telefone}</span>
                  </div>
                )}

                {empresa.ds_endereco && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{empresa.ds_endereco}</span>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-between">
                  <Badge variant={empresa.fl_ativo ? 'default' : 'secondary'}>
                    {empresa.fl_ativo ? 'Ativa' : 'Inativa'}
                  </Badge>
                  <Link
                    href={`/admin/gestao/empresas/${empresa.id_empresa}`}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Ver detalhes →
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta.pages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={meta.page}
            totalPages={meta.pages}
            totalItems={meta.total}
            pageSize={meta.size}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}
