/**
 * UsuariosList Component - Client Component
 *
 * Gerencia filtros, busca e exibição de usuários.
 */

'use client';

import { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  Mail,
  Phone,
  Calendar,
  Shield,
  UserCheck,
  UserX,
  Edit,
  Trash,
  MoreVertical,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Pagination } from '@/components/shared/navigation/Pagination';
import { EmptyState } from '@/components/shared/feedback/EmptyState';
import { SearchInput } from '@/components/shared/forms/SearchInput';
import type { Usuario, Perfil } from '@/lib/api/server';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface UsuariosListProps {
  initialUsuarios: Usuario[];
  initialMeta: {
    total: number;
    page: number;
    size: number;
    pages: number;
  };
  perfis: Perfil[];
}

const PAPEL_COLORS: Record<string, string> = {
  admin: 'bg-red-100 text-red-700 border-red-200',
  gestor_clinica: 'bg-purple-100 text-purple-700 border-purple-200',
  profissional: 'bg-blue-100 text-blue-700 border-blue-200',
  recepcionista: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  paciente: 'bg-green-100 text-green-700 border-green-200',
  default: 'bg-gray-100 text-gray-700 border-gray-200',
};

const PAPEL_ICONS: Record<string, typeof Shield> = {
  admin: Shield,
  gestor_clinica: UserCheck,
  profissional: UserCheck,
  recepcionista: Users,
  paciente: Users,
};

export function UsuariosList({ initialUsuarios, initialMeta, perfis }: UsuariosListProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [papelFilter, setPapelFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filtrar localmente (ou usar router.push para server-side)
  const filtered = initialUsuarios.filter((usuario) => {
    const matchSearch =
      !search ||
      usuario.nm_completo?.toLowerCase().includes(search.toLowerCase()) ||
      usuario.nm_email?.toLowerCase().includes(search.toLowerCase());

    const matchPapel = papelFilter === 'all' || usuario.nm_papel === papelFilter;
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'ativo' && usuario.fl_ativo) ||
      (statusFilter === 'inativo' && !usuario.fl_ativo);

    return matchSearch && matchPapel && matchStatus;
  });

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams();
    params.set('page', newPage.toString());
    if (search) params.set('busca', search);
    if (papelFilter !== 'all') params.set('papel', papelFilter);
    if (statusFilter !== 'all') params.set('status', statusFilter);

    router.push(`/admin/gestao/usuarios?${params.toString()}`);
  };

  const handleApplyFilters = () => {
    const params = new URLSearchParams();
    if (search) params.set('busca', search);
    if (papelFilter !== 'all') params.set('papel', papelFilter);
    if (statusFilter !== 'all') params.set('status', statusFilter);

    router.push(`/admin/gestao/usuarios?${params.toString()}`);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getPapelColor = (papel: string) => {
    return PAPEL_COLORS[papel] || PAPEL_COLORS.default;
  };

  const getPapelIcon = (papel: string) => {
    return PAPEL_ICONS[papel] || Shield;
  };

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <Card className="border-0 shadow-lg">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Buscar por nome ou email..."
                onSearch={handleApplyFilters}
              />
            </div>

            {/* Papel Filter */}
            <Select value={papelFilter} onValueChange={setPapelFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por papel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os papéis</SelectItem>
                {perfis.map((perfil) => (
                  <SelectItem key={perfil.id_perfil} value={perfil.nm_perfil}>
                    {perfil.nm_perfil}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="ativo">Ativos</SelectItem>
                <SelectItem value="inativo">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Apply Filters Button */}
          {(search || papelFilter !== 'all' || statusFilter !== 'all') && (
            <div className="mt-4 flex justify-end">
              <Button
                onClick={handleApplyFilters}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <Filter className="w-4 h-4 mr-2" />
                Aplicar Filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Exibindo <span className="font-semibold">{filtered.length}</span> de{' '}
          <span className="font-semibold">{initialMeta.total}</span> usuários
        </p>
      </div>

      {/* Usuarios Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum usuário encontrado"
          description={
            search || papelFilter !== 'all' || statusFilter !== 'all'
              ? 'Tente ajustar os filtros de busca'
              : 'Comece adicionando seu primeiro usuário ao sistema'
          }
          action={
            !search && papelFilter === 'all' && statusFilter === 'all'
              ? {
                  label: 'Novo Usuário',
                  href: '/admin/gestao/usuarios/novo',
                }
              : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((usuario) => {
            const PapelIcon = getPapelIcon(usuario.nm_papel);

            return (
              <Card
                key={usuario.id_user}
                className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50"
              >
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
                  <div className="flex items-start gap-3 flex-1">
                    <Avatar className="h-12 w-12 ring-2 ring-white shadow-md">
                      <AvatarImage src={usuario.ds_foto_url} alt={usuario.nm_completo} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold">
                        {getInitials(usuario.nm_completo)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {usuario.nm_completo}
                      </h3>
                      <p className="text-sm text-gray-600 truncate">{usuario.nm_email}</p>
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
                        <Link href={`/admin/gestao/usuarios/${usuario.id_user}`}>
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        <Trash className="w-4 h-4 mr-2" />
                        Desativar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Papel Badge */}
                  <div className="flex items-center gap-2">
                    <Badge className={`${getPapelColor(usuario.nm_papel)} border`}>
                      <PapelIcon className="w-3 h-3 mr-1" />
                      {usuario.nm_papel}
                    </Badge>
                    <Badge variant={usuario.fl_ativo ? 'default' : 'secondary'}>
                      {usuario.fl_ativo ? (
                        <>
                          <UserCheck className="w-3 h-3 mr-1" />
                          Ativo
                        </>
                      ) : (
                        <>
                          <UserX className="w-3 h-3 mr-1" />
                          Inativo
                        </>
                      )}
                    </Badge>
                  </div>

                  {/* Contact Info */}
                  {usuario.nr_telefone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4 flex-shrink-0" />
                      <span>{usuario.nr_telefone}</span>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="pt-2 grid grid-cols-2 gap-4 border-t border-gray-100">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">
                        {usuario.nr_total_logins || 0}
                      </p>
                      <p className="text-xs text-gray-600">Logins</p>
                    </div>
                    {usuario.dt_ultimo_login && (
                      <div className="text-center">
                        <p className="text-xs text-gray-600">Último acesso</p>
                        <p className="text-xs font-medium text-gray-900">
                          {new Date(usuario.dt_ultimo_login).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action Link */}
                  <Link
                    href={`/admin/gestao/usuarios/${usuario.id_user}`}
                    className="block text-center text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors pt-2"
                  >
                    Ver perfil completo →
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {initialMeta.pages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={initialMeta.page}
            totalPages={initialMeta.pages}
            totalItems={initialMeta.total}
            pageSize={initialMeta.size}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}
