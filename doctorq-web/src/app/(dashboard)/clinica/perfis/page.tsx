"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Plus,
  Edit,
  Trash2,
  Users,
  Calendar,
  DollarSign,
  FileText,
  Settings,
  Search,
  CheckCircle2,
  Copy,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePerfis, useCreatePerfil, useUpdatePerfil, useDeletePerfil } from "@/lib/api/hooks/gestao/usePerfis";
import { toast } from "sonner";
import { ProtectedAction } from "@/components/clinica/ProtectedAction";

// Estrutura de permissões específicas para clínica
interface Permission {
  label: string;
  key: string;
  description: string;
  actions: {
    visualizar: string;
    criar: string;
    editar: string;
    excluir: string;
  };
}

const CLINICA_PERMISSIONS: Permission[] = [
  {
    label: "Agendamentos",
    key: "agendamentos",
    description: "Gerenciar agendamentos e consultas",
    actions: {
      visualizar: "Ver agendamentos",
      criar: "Criar novos agendamentos",
      editar: "Modificar agendamentos",
      excluir: "Cancelar agendamentos",
    },
  },
  {
    label: "Pacientes",
    key: "pacientes",
    description: "Gerenciar cadastro de pacientes",
    actions: {
      visualizar: "Ver lista de pacientes",
      criar: "Cadastrar novos pacientes",
      editar: "Editar dados de pacientes",
      excluir: "Remover pacientes",
    },
  },
  {
    label: "Profissionais",
    key: "profissionais",
    description: "Gerenciar profissionais da clínica",
    actions: {
      visualizar: "Ver profissionais",
      criar: "Adicionar profissionais",
      editar: "Editar dados profissionais",
      excluir: "Remover profissionais",
    },
  },
  {
    label: "Procedimentos",
    key: "procedimentos",
    description: "Gerenciar procedimentos e serviços",
    actions: {
      visualizar: "Ver procedimentos",
      criar: "Cadastrar procedimentos",
      editar: "Editar procedimentos",
      excluir: "Remover procedimentos",
    },
  },
  {
    label: "Financeiro",
    key: "financeiro",
    description: "Acesso a faturas e relatórios financeiros",
    actions: {
      visualizar: "Ver relatórios financeiros",
      criar: "Gerar faturas",
      editar: "Editar faturas",
      excluir: "Cancelar faturas",
    },
  },
  {
    label: "Relatórios",
    key: "relatorios",
    description: "Gerar e visualizar relatórios",
    actions: {
      visualizar: "Ver relatórios",
      criar: "Gerar novos relatórios",
      editar: "Personalizar relatórios",
      excluir: "Remover relatórios salvos",
    },
  },
  {
    label: "Configurações",
    key: "configuracoes",
    description: "Configurações da clínica",
    actions: {
      visualizar: "Ver configurações",
      criar: "Adicionar configurações",
      editar: "Modificar configurações",
      excluir: "Remover configurações",
    },
  },
  {
    label: "Equipe",
    key: "equipe",
    description: "Gerenciar usuários e permissões",
    actions: {
      visualizar: "Ver membros da equipe",
      criar: "Adicionar membros",
      editar: "Editar membros",
      excluir: "Remover membros",
    },
  },
];

// Templates de perfis pré-configurados
const PERFIL_TEMPLATES = [
  {
    nm_perfil: "Recepcionista Padrão",
    ds_perfil: "Perfil completo para recepcionistas: agendamentos, pacientes e atendimento",
    icon: Users,
    color: "blue",
    permissions: {
      agendamentos: { visualizar: true, criar: true, editar: true, excluir: false },
      pacientes: { visualizar: true, criar: true, editar: true, excluir: false },
      profissionais: { visualizar: true, criar: false, editar: false, excluir: false },
      procedimentos: { visualizar: true, criar: false, editar: false, excluir: false },
      financeiro: { visualizar: false, criar: false, editar: false, excluir: false },
      relatorios: { visualizar: true, criar: false, editar: false, excluir: false },
      configuracoes: { visualizar: false, criar: false, editar: false, excluir: false },
      equipe: { visualizar: true, criar: false, editar: false, excluir: false },
      perfis: { visualizar: false, criar: false, editar: false, excluir: false },
    },
  },
  {
    nm_perfil: "Financeiro Padrão",
    ds_perfil: "Perfil para gerenciar finanças: faturas, pagamentos e relatórios",
    icon: DollarSign,
    color: "green",
    permissions: {
      agendamentos: { visualizar: true, criar: false, editar: false, excluir: false },
      pacientes: { visualizar: true, criar: false, editar: false, excluir: false },
      profissionais: { visualizar: true, criar: false, editar: false, excluir: false },
      procedimentos: { visualizar: true, criar: false, editar: false, excluir: false },
      financeiro: { visualizar: true, criar: true, editar: true, excluir: true },
      relatorios: { visualizar: true, criar: true, editar: true, excluir: false },
      configuracoes: { visualizar: false, criar: false, editar: false, excluir: false },
      equipe: { visualizar: false, criar: false, editar: false, excluir: false },
      perfis: { visualizar: false, criar: false, editar: false, excluir: false },
    },
  },
  {
    nm_perfil: "Assistente Clínico",
    ds_perfil: "Perfil para auxiliares com acesso de leitura e suporte operacional",
    icon: Shield,
    color: "gray",
    permissions: {
      agendamentos: { visualizar: true, criar: false, editar: false, excluir: false },
      pacientes: { visualizar: true, criar: false, editar: false, excluir: false },
      profissionais: { visualizar: true, criar: false, editar: false, excluir: false },
      procedimentos: { visualizar: true, criar: false, editar: false, excluir: false },
      financeiro: { visualizar: false, criar: false, editar: false, excluir: false },
      relatorios: { visualizar: false, criar: false, editar: false, excluir: false },
      configuracoes: { visualizar: false, criar: false, editar: false, excluir: false },
      equipe: { visualizar: false, criar: false, editar: false, excluir: false },
      perfis: { visualizar: false, criar: false, editar: false, excluir: false },
    },
  },
  {
    nm_perfil: "Gerente de Operações",
    ds_perfil: "Perfil completo exceto configurações de perfis e sistema",
    icon: Settings,
    color: "purple",
    permissions: {
      agendamentos: { visualizar: true, criar: true, editar: true, excluir: true },
      pacientes: { visualizar: true, criar: true, editar: true, excluir: true },
      profissionais: { visualizar: true, criar: true, editar: true, excluir: false },
      procedimentos: { visualizar: true, criar: true, editar: true, excluir: true },
      financeiro: { visualizar: true, criar: true, editar: true, excluir: false },
      relatorios: { visualizar: true, criar: true, editar: true, excluir: false },
      configuracoes: { visualizar: true, criar: false, editar: false, excluir: false },
      equipe: { visualizar: true, criar: true, editar: true, excluir: false },
      perfis: { visualizar: true, criar: false, editar: false, excluir: false },
    },
  },
];

interface PerfilFormData {
  nm_perfil: string;
  ds_perfil: string;
  permissions: Record<string, Record<string, boolean>>;
}

export default function PerfisPage() {
  const { user } = useAuth();
  const empresaId = user?.id_empresa || null;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPerfil, setEditingPerfil] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState<PerfilFormData>({
    nm_perfil: "",
    ds_perfil: "",
    permissions: {},
  });

  // Buscar perfis da empresa
  const { data: perfis = [], isLoading, refetch } = usePerfis({
    ...(empresaId ? { id_empresa: empresaId } : {}),
    size: 100,
  });

  const { mutate: createPerfil, isPending: isCreating } = useCreatePerfil();
  const { mutate: updatePerfil, isPending: isUpdating } = useUpdatePerfil(editingPerfil?.id_perfil || "");
  const { mutate: deletePerfil } = useDeletePerfil("");

  const handleOpenDialog = (perfil?: any) => {
    if (perfil) {
      setEditingPerfil(perfil);
      setFormData({
        nm_perfil: perfil.nm_perfil,
        ds_perfil: perfil.ds_perfil || "",
        permissions: perfil.ds_permissoes || {},
      });
    } else {
      setEditingPerfil(null);
      setFormData({
        nm_perfil: "",
        ds_perfil: "",
        permissions: {},
      });
    }
    setIsDialogOpen(true);
  };

  const handleApplyTemplate = (template: typeof PERFIL_TEMPLATES[0]) => {
    setEditingPerfil(null);
    setFormData({
      nm_perfil: template.nm_perfil,
      ds_perfil: template.ds_perfil,
      permissions: template.permissions,
    });
    setIsDialogOpen(true);
    toast.info(`Template "${template.nm_perfil}" carregado. Você pode customizar antes de salvar.`);
  };

  const handleClonePerfil = (perfil: any) => {
    setEditingPerfil(null); // Não é edição, é criação de novo perfil
    setFormData({
      nm_perfil: `${perfil.nm_perfil} (Cópia)`,
      ds_perfil: perfil.ds_perfil || "",
      permissions: perfil.ds_permissoes || {},
    });
    setIsDialogOpen(true);
    toast.info(`Perfil "${perfil.nm_perfil}" clonado. Você pode customizar antes de salvar.`);
  };

  const handlePermissionChange = (resourceKey: string, actionKey: string, value: boolean) => {
    setFormData((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [resourceKey]: {
          ...(prev.permissions[resourceKey] || {}),
          [actionKey]: value,
        },
      },
    }));
  };

  const handleSelectAll = (resourceKey: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [resourceKey]: {
          visualizar: true,
          criar: true,
          editar: true,
          excluir: true,
        },
      },
    }));
  };

  const handleDeselectAll = (resourceKey: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [resourceKey]: {
          visualizar: false,
          criar: false,
          editar: false,
          excluir: false,
        },
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nm_perfil) {
      toast.error("Nome do perfil é obrigatório");
      return;
    }

    const perfilData = {
      nm_perfil: formData.nm_perfil,
      ds_perfil: formData.ds_perfil,
      id_empresa: empresaId || undefined,
      ds_permissoes: formData.permissions,
      nm_tipo: "custom",
      st_ativo: "S",
    };

    if (editingPerfil) {
      updatePerfil(
        {
          nm_perfil: formData.nm_perfil,
          ds_perfil: formData.ds_perfil,
          ds_permissoes: formData.permissions as any,
        },
        {
          onSuccess: () => {
            toast.success("Perfil atualizado com sucesso!");
            setIsDialogOpen(false);
            refetch();
          },
          onError: (error: any) => {
            toast.error(error.message || "Erro ao atualizar perfil");
          },
        }
      );
    } else {
      createPerfil(perfilData as any, {
        onSuccess: () => {
          toast.success("Perfil criado com sucesso!");
          setIsDialogOpen(false);
          refetch();
        },
        onError: (error: any) => {
          toast.error(error.message || "Erro ao criar perfil");
        },
      });
    }
  };

  const handleDelete = (perfilId: string, perfilName: string) => {
    if (confirm(`Tem certeza que deseja excluir o perfil "${perfilName}"? Esta ação não pode ser desfeita.`)) {
      deletePerfil(undefined, {
        onSuccess: () => {
          toast.success("Perfil excluído com sucesso!");
          refetch();
        },
        onError: (error: any) => {
          toast.error(error.message || "Erro ao excluir perfil");
        },
      });
    }
  };

  const countPermissions = (permissions: Record<string, any>) => {
    let count = 0;
    Object.values(permissions || {}).forEach((resource: any) => {
      if (typeof resource === "object") {
        count += Object.values(resource).filter((v) => v === true).length;
      }
    });
    return count;
  };

  const filteredPerfis = perfis.filter(
    (perfil: any) =>
      perfil.nm_perfil.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (perfil.ds_perfil && perfil.ds_perfil.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando perfis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Perfis e Permissões</h1>
          <p className="text-muted-foreground">
            Crie perfis customizados com permissões específicas para sua clínica
          </p>
        </div>
        <ProtectedAction resource="perfis" action="criar">
          <Button onClick={() => handleOpenDialog()} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Perfil
          </Button>
        </ProtectedAction>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Perfis</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{perfis.length}</div>
            <p className="text-xs text-muted-foreground">Perfis customizados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Perfis Ativos</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {perfis.filter((p: any) => p.st_ativo === "S").length}
            </div>
            <p className="text-xs text-muted-foreground">Em uso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Vinculados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {perfis.reduce((acc: number, p: any) => acc + (p.nr_usuarios_com_perfil || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
      </div>

      {/* Templates de Perfis */}
      <ProtectedAction resource="perfis" action="criar">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle>Templates Prontos</CardTitle>
            </div>
            <CardDescription>
              Use templates pré-configurados para criar perfis rapidamente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {PERFIL_TEMPLATES.map((template) => {
                const Icon = template.icon;
                const colorClasses: Record<string, string> = {
                  blue: "bg-blue-50 hover:bg-blue-100 border-blue-200",
                  green: "bg-green-50 hover:bg-green-100 border-green-200",
                  gray: "bg-gray-50 hover:bg-gray-100 border-gray-200",
                  purple: "bg-purple-50 hover:bg-purple-100 border-purple-200",
                };

                return (
                  <Card
                    key={template.nm_perfil}
                    className={`cursor-pointer transition-all ${colorClasses[template.color] || "bg-gray-50 hover:bg-gray-100 border-gray-200"}`}
                    onClick={() => handleApplyTemplate(template)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <Icon className="h-8 w-8 text-primary" />
                        <Badge variant="outline" className="text-xs">
                          {Object.values(template.permissions).reduce(
                            (acc, resource) =>
                              acc + Object.values(resource).filter((v) => v === true).length,
                            0
                          )} permissões
                        </Badge>
                      </div>
                      <CardTitle className="text-base">{template.nm_perfil}</CardTitle>
                      <CardDescription className="text-xs line-clamp-2">
                        {template.ds_perfil}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <Button variant="ghost" size="sm" className="w-full gap-2">
                        <Plus className="h-3 w-3" />
                        Usar Template
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </ProtectedAction>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Buscar Perfis</CardTitle>
          <CardDescription>Encontre perfis por nome ou descrição</CardDescription>
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

      {/* Perfis Table */}
      <Card>
        <CardHeader>
          <CardTitle>Perfis Cadastrados</CardTitle>
          <CardDescription>
            {filteredPerfis.length} {filteredPerfis.length === 1 ? "perfil encontrado" : "perfis encontrados"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Permissões</TableHead>
                <TableHead>Usuários</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPerfis.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum perfil encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredPerfis.map((perfil: any) => (
                  <TableRow key={perfil.id_perfil}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary" />
                        {perfil.nm_perfil}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{perfil.ds_perfil || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{countPermissions(perfil.ds_permissoes)} permissões</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {perfil.nr_usuarios_com_perfil || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      {perfil.st_ativo === "S" ? (
                        <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                      ) : (
                        <Badge variant="outline">Inativo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <ProtectedAction resource="perfis" action="criar">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleClonePerfil(perfil)}
                            title="Clonar perfil"
                          >
                            <Copy className="h-4 w-4 text-blue-500" />
                          </Button>
                        </ProtectedAction>
                        <ProtectedAction resource="perfis" action="editar">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(perfil)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </ProtectedAction>
                        <ProtectedAction resource="perfis" action="excluir">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(perfil.id_perfil, perfil.nm_perfil)}
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

      {/* Dialog para Criar/Editar */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingPerfil ? "Editar Perfil" : "Novo Perfil"}</DialogTitle>
              <DialogDescription>
                {editingPerfil
                  ? "Modifique as informações e permissões do perfil"
                  : "Crie um novo perfil com permissões customizadas para sua equipe"}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-6 py-4">
              {/* Informações Básicas */}
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="nm_perfil">Nome do Perfil *</Label>
                  <Input
                    id="nm_perfil"
                    placeholder="Ex: Recepcionista, Auxiliar Administrativo"
                    value={formData.nm_perfil}
                    onChange={(e) => setFormData({ ...formData, nm_perfil: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ds_perfil">Descrição</Label>
                  <Textarea
                    id="ds_perfil"
                    placeholder="Descreva as responsabilidades deste perfil..."
                    value={formData.ds_perfil}
                    onChange={(e) => setFormData({ ...formData, ds_perfil: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>

              {/* Permissões */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">Permissões por Recurso</h3>
                  <p className="text-sm text-muted-foreground">
                    Selecione as permissões que este perfil terá em cada área do sistema
                  </p>
                </div>

                {CLINICA_PERMISSIONS.map((permission) => (
                  <Card key={permission.key}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base">{permission.label}</CardTitle>
                          <CardDescription className="text-xs">{permission.description}</CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleSelectAll(permission.key)}
                          >
                            Selecionar Todos
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeselectAll(permission.key)}
                          >
                            Limpar
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(permission.actions).map(([actionKey, actionLabel]) => (
                          <div key={actionKey} className="flex items-center space-x-2">
                            <Checkbox
                              id={`${permission.key}-${actionKey}`}
                              checked={formData.permissions[permission.key]?.[actionKey] || false}
                              onCheckedChange={(checked) =>
                                handlePermissionChange(permission.key, actionKey, checked as boolean)
                              }
                            />
                            <label
                              htmlFor={`${permission.key}-${actionKey}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {actionLabel}
                            </label>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isCreating || isUpdating}>
                {isCreating || isUpdating
                  ? "Salvando..."
                  : editingPerfil
                  ? "Atualizar Perfil"
                  : "Criar Perfil"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
