"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Users,
  UserPlus,
  Search,
  Mail,
  Shield,
  Trash2,
  Edit,
  MoreVertical,
  Lock,
  KeyRound,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUsuarios, useCreateUsuario, useUpdateUsuario, useDeleteUsuario } from "@/lib/api/hooks/gestao/useUsuarios";
import { usePerfis } from "@/lib/api/hooks/gestao/usePerfis";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";
import { ProtectedAction } from "@/components/clinica/ProtectedAction";
import { PerfilCombobox } from "@/components/clinica/PerfilCombobox";

// Ícones para perfis (mapeamento padrão)
const PERFIL_ICONS: Record<string, any> = {
  admin: Shield,
  gestor_clinica: Shield,
  profissional: Users,
  recepcionista: Users,
  paciente: Users,
  usuario: Users,
  analista: Shield,
};

// Cores para badges de perfis (mapeamento padrão)
const PERFIL_COLORS: Record<string, string> = {
  admin: "red",
  gestor_clinica: "blue",
  profissional: "green",
  recepcionista: "yellow",
  paciente: "purple",
  usuario: "gray",
  analista: "cyan",
};

export default function EquipePage() {
  const { user } = useAuth();
  const empresaId = user?.id_empresa || null;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    nm_completo: "",
    nm_email: "",
    nm_papel: "",
    nm_senha: "",
  });
  const [editFormData, setEditFormData] = useState({
    nm_completo: "",
    nm_email: "",
    nm_papel: "",
  });

  // Buscar usuários da empresa/clínica
  const { data: usuarios = [], meta, isLoading, mutate: refetchUsuarios } = useUsuarios({
    page: 1,
    size: 50,
    id_empresa: empresaId || undefined,
  });

  // Buscar perfis disponíveis do banco
  const { data: perfis = [], isLoading: isLoadingPerfis } = usePerfis({
    ...(empresaId ? { id_empresa: empresaId } : {}),
    size: 100, // Carregar até 100 perfis
  });

  const usuariosDaEmpresa = empresaId
    ? usuarios.filter((usuario) => usuario.id_empresa === empresaId)
    : usuarios;

  // Mutation para criar usuário
  const { mutate: createUsuario, isPending: isCreating } = useCreateUsuario();

  // Mutation para atualizar usuário
  const { mutate: updateUsuario, isPending: isUpdating } = useUpdateUsuario(editingUsuario?.id_user || "");

  // Mutation para deletar usuário
  const { mutate: deleteUsuario } = useDeleteUsuario("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nm_completo || !formData.nm_email || !formData.nm_papel || !formData.nm_senha) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (!empresaId) {
      toast.error("Não foi possível identificar a clínica do usuário logado.");
      return;
    }

    createUsuario(
      {
        nm_email: formData.nm_email,
        nm_completo: formData.nm_completo,
        nm_papel: formData.nm_papel,
        senha: formData.nm_senha,  // Backend espera "senha"
        id_empresa: empresaId,
      },
      {
        onSuccess: () => {
          toast.success("Usuário criado com sucesso!");
          setIsDialogOpen(false);
          setFormData({
            nm_completo: "",
            nm_email: "",
            nm_papel: "",
            nm_senha: "",
          });
          refetchUsuarios();
        },
        onError: (error: any) => {
          toast.error(error.message || "Erro ao criar usuário");
        },
      }
    );
  };

  const handleOpenEditDialog = (usuario: any) => {
    setEditingUsuario(usuario);
    setEditFormData({
      nm_completo: usuario.nm_completo,
      nm_email: usuario.nm_email,
      nm_papel: usuario.nm_papel,
    });
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editFormData.nm_completo || !editFormData.nm_email || !editFormData.nm_papel) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    updateUsuario(
      editFormData,
      {
        onSuccess: () => {
          toast.success("Usuário atualizado com sucesso!");
          setIsEditDialogOpen(false);
          setEditingUsuario(null);
          setEditFormData({
            nm_completo: "",
            nm_email: "",
            nm_papel: "",
          });
          refetchUsuarios();
        },
        onError: (error: any) => {
          toast.error(error.message || "Erro ao atualizar usuário");
        },
      }
    );
  };

  const handleToggleAtivo = async (usuario: any) => {
    const novoStatus = usuario.st_ativo === "S" ? "N" : "S";
    const acao = novoStatus === "S" ? "ativar" : "desativar";

    if (confirm(`Deseja ${acao} o usuário ${usuario.nm_completo}?`)) {
      updateUsuario(
        { st_ativo: novoStatus },
        {
          onSuccess: () => {
            toast.success(`Usuário ${novoStatus === "S" ? "ativado" : "desativado"} com sucesso!`);
            refetchUsuarios();
          },
          onError: (error: any) => {
            toast.error(error.message || `Erro ao ${acao} usuário`);
          },
        }
      );
    }
  };

  const handleResetPassword = async (userId: string, userEmail: string, userName: string) => {
    if (confirm(`Deseja enviar um email de redefinição de senha para ${userName} (${userEmail})?`)) {
      toast.promise(
        apiClient.post(`/users/${userId}/reset-password`),
        {
          loading: "Enviando email de redefinição...",
          success: `Email de redefinição enviado para ${userEmail}!`,
          error: (err: any) => err.message || "Erro ao enviar email de redefinição",
        }
      );
    }
  };

  const handleDelete = (userId: string, userName: string) => {
    if (confirm(`Tem certeza que deseja remover ${userName} da equipe?`)) {
      deleteUsuario(undefined, {
        onSuccess: () => {
          toast.success("Usuário removido com sucesso!");
          refetchUsuarios();
        },
        onError: (error: any) => {
          toast.error(error.message || "Erro ao remover usuário");
        },
      });
    }
  };

  const getPerfilBadge = (papel: string) => {
    // Buscar o perfil no banco de dados
    const perfilData = perfis.find((p) => p.nm_perfil === papel);
    const color = PERFIL_COLORS[papel.toLowerCase()] || "gray";

    const colorClasses: Record<string, string> = {
      red: "bg-red-100 text-red-800",
      blue: "bg-blue-100 text-blue-800",
      green: "bg-green-100 text-green-800",
      yellow: "bg-yellow-100 text-yellow-800",
      purple: "bg-purple-100 text-purple-800",
      gray: "bg-gray-100 text-gray-800",
      cyan: "bg-cyan-100 text-cyan-800",
    };

    return (
      <Badge className={colorClasses[color] || "bg-gray-100 text-gray-800"}>
        {perfilData?.nm_perfil || papel}
      </Badge>
    );
  };

  const filteredUsuarios = usuariosDaEmpresa.filter((usuario) =>
    usuario.nm_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    usuario.nm_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    usuario.nm_papel.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando equipe...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Equipe da Clínica</h1>
          <p className="text-muted-foreground">
            Gerencie os usuários e permissões de acesso à clínica
          </p>
        </div>
        <ProtectedAction resource="equipe" action="criar">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="h-4 w-4" />
                Adicionar Membro
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Adicionar Novo Membro</DialogTitle>
                <DialogDescription>
                  Crie um novo usuário para acessar a plataforma da clínica
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="nm_completo">Nome Completo *</Label>
                  <Input
                    id="nm_completo"
                    placeholder="João da Silva"
                    value={formData.nm_completo}
                    onChange={(e) => setFormData({ ...formData, nm_completo: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="nm_email">Email *</Label>
                  <Input
                    id="nm_email"
                    type="email"
                    placeholder="joao@clinica.com"
                    value={formData.nm_email}
                    onChange={(e) => setFormData({ ...formData, nm_email: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="nm_papel">Perfil *</Label>
                  <Select
                    value={formData.nm_papel}
                    onValueChange={(value) => setFormData({ ...formData, nm_papel: value })}
                    disabled={isLoadingPerfis}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={isLoadingPerfis ? "Carregando perfis..." : "Selecione o perfil"} />
                    </SelectTrigger>
                    <SelectContent>
                      {perfis.map((perfil) => {
                        const Icon = PERFIL_ICONS[perfil.nm_perfil.toLowerCase()] || Users;
                        return (
                          <SelectItem key={perfil.id_perfil} value={perfil.nm_perfil}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              <div>
                                <div className="font-medium">{perfil.nm_perfil}</div>
                                {perfil.ds_perfil && (
                                  <div className="text-xs text-muted-foreground">
                                    {perfil.ds_perfil}
                                  </div>
                                )}
                              </div>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Perfis cadastrados em Configurações &gt; Perfis
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="nm_senha">Senha Inicial *</Label>
                  <Input
                    id="nm_senha"
                    type="password"
                    placeholder="Mínimo 8 caracteres"
                    value={formData.nm_senha}
                    onChange={(e) => setFormData({ ...formData, nm_senha: e.target.value })}
                    required
                    minLength={8}
                  />
                  <p className="text-xs text-muted-foreground">
                    O usuário poderá alterar a senha no primeiro acesso
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? "Criando..." : "Criar Usuário"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </ProtectedAction>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Membros</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usuariosDaEmpresa.length}</div>
            <p className="text-xs text-muted-foreground">Usuários ativos</p>
          </CardContent>
        </Card>

        {perfis.slice(0, 3).map((perfil) => {
          const Icon = PERFIL_ICONS[perfil.nm_perfil.toLowerCase()] || Users;
          return (
            <Card key={perfil.id_perfil}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{perfil.nm_perfil}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {usuariosDaEmpresa.filter((u) => u.nm_papel === perfil.nm_perfil).length}
                </div>
                <p className="text-xs text-muted-foreground">Membros</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search Bar */}
      <Card>
        <CardHeader>
          <CardTitle>Buscar Membros</CardTitle>
          <CardDescription>Encontre membros por nome, email ou perfil</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Team Table */}
      <Card>
        <CardHeader>
          <CardTitle>Membros da Equipe</CardTitle>
          <CardDescription>
            {filteredUsuarios.length} {filteredUsuarios.length === 1 ? "membro" : "membros"} encontrado
            {filteredUsuarios.length !== 1 && "s"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Último Acesso</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsuarios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum membro encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsuarios.map((usuario) => (
                  <TableRow key={usuario.id_user}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                          {usuario.nm_completo.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div>{usuario.nm_completo}</div>
                          <div className="text-xs text-muted-foreground">
                            {usuario.nr_total_logins} login{usuario.nr_total_logins !== 1 && "s"}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {usuario.nm_email}
                      </div>
                    </TableCell>
                    <TableCell>{getPerfilBadge(usuario.nm_papel)}</TableCell>
                    <TableCell>
                      <ProtectedAction resource="equipe" action="editar">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={usuario.st_ativo === "S"}
                            onCheckedChange={() => handleToggleAtivo(usuario)}
                          />
                          <span className="text-sm text-muted-foreground">
                            {usuario.st_ativo === "S" ? "Ativo" : "Inativo"}
                          </span>
                        </div>
                      </ProtectedAction>
                    </TableCell>
                    <TableCell>
                      {usuario.dt_ultimo_login
                        ? new Date(usuario.dt_ultimo_login).toLocaleDateString("pt-BR")
                        : "Nunca"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <ProtectedAction resource="equipe" action="editar">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(usuario)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </ProtectedAction>
                        <ProtectedAction resource="equipe" action="excluir">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(usuario.id_user, usuario.nm_completo)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </ProtectedAction>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleEditSubmit}>
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle>Editar Membro da Equipe</DialogTitle>
                  <DialogDescription>
                    Atualize as informações do usuário
                  </DialogDescription>
                </div>
                {editingUsuario && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => handleResetPassword(
                      editingUsuario.id_user,
                      editingUsuario.nm_email,
                      editingUsuario.nm_completo
                    )}
                  >
                    <KeyRound className="h-4 w-4" />
                    Resetar Senha
                  </Button>
                )}
              </div>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit_nm_completo">Nome Completo *</Label>
                <Input
                  id="edit_nm_completo"
                  placeholder="João da Silva"
                  value={editFormData.nm_completo}
                  onChange={(e) => setEditFormData({ ...editFormData, nm_completo: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_nm_email">Email *</Label>
                <Input
                  id="edit_nm_email"
                  type="email"
                  placeholder="joao@clinica.com"
                  value={editFormData.nm_email}
                  onChange={(e) => setEditFormData({ ...editFormData, nm_email: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_nm_papel">Perfil *</Label>
                <Select
                  value={editFormData.nm_papel}
                  onValueChange={(value) => setEditFormData({ ...editFormData, nm_papel: value })}
                  disabled={isLoadingPerfis}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingPerfis ? "Carregando perfis..." : "Selecione o perfil"} />
                  </SelectTrigger>
                  <SelectContent>
                    {perfis.map((perfil) => {
                      const Icon = PERFIL_ICONS[perfil.nm_perfil.toLowerCase()] || Users;
                      return (
                        <SelectItem key={perfil.id_perfil} value={perfil.nm_perfil}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            <span>{perfil.nm_perfil}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? "Atualizando..." : "Atualizar Usuário"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Perfis Info */}
      <Card>
        <CardHeader>
          <CardTitle>Perfis Cadastrados</CardTitle>
          <CardDescription>
            Perfis disponíveis na clínica. Configure em Configurações &gt; Perfis
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingPerfis ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Carregando perfis...</p>
            </div>
          ) : perfis.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum perfil cadastrado. Acesse Configurações &gt; Perfis para criar perfis.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {perfis.map((perfil) => {
                const Icon = PERFIL_ICONS[perfil.nm_perfil.toLowerCase()] || Users;
                const usuariosComPerfil = usuariosDaEmpresa.filter((u) => u.nm_papel === perfil.nm_perfil);
                return (
                  <Card key={perfil.id_perfil}>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5" />
                        <CardTitle className="text-lg">{perfil.nm_perfil}</CardTitle>
                      </div>
                      {perfil.ds_perfil && (
                        <CardDescription>{perfil.ds_perfil}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Membros:</span>
                          <span className="font-semibold">{usuariosComPerfil.length}</span>
                        </div>
                        {perfil.permissions && perfil.permissions.length > 0 && (
                          <div className="mt-2">
                            <span className="text-xs text-muted-foreground">Permissões:</span>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {perfil.permissions.slice(0, 3).map((perm, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {perm}
                                </Badge>
                              ))}
                              {perfil.permissions.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{perfil.permissions.length - 3}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
