"use client";

import { useState } from "react";
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { apiClient } from "@/lib/api/client";
import useSWR from "swr";
import {
  Key,
  Package,
  User,
  CheckCircle2,
  XCircle,
  Search,
  Plus,
  UserPlus,
  Ban,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// ============================================================================
// TIPOS
// ============================================================================
interface License {
  id_license: string;
  license_key: string;
  status: string;
  assigned_to: string | null;
  assigned_email: string | null;
  created_at: string;
  activated_at: string | null;
  revoked_at: string | null;
  metadata: any;
  package_item: {
    id: string;
    quantity: number;
  };
  package: {
    id: string;
    code: string;
    name: string;
    status: string;
  };
  service: {
    code: string;
    name: string;
  };
}

interface LicensesResponse {
  items: License[];
  meta: {
    totalItems: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}

interface LicenseStats {
  total: number;
  by_status: {
    available: number;
    assigned: number;
    suspended: number;
    revoked: number;
  };
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
export default function LicencasPage() {
  // ============================================================================
  // ESTADOS
  // ============================================================================
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<string>("");
  const [page, setPage] = useState(1);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);

  // Estados dos formulários
  const [assignedTo, setAssignedTo] = useState("");
  const [assignedEmail, setAssignedEmail] = useState("");
  const [revokeReason, setRevokeReason] = useState("");

  // ============================================================================
  // DATA FETCHING
  // ============================================================================
  const { data, error, isLoading, mutate: revalidate } = useSWR<LicensesResponse>(
    ["/partner-licenses", page, statusFiltro, busca],
    () =>
      apiClient.get("/partner-licenses/", {
        params: {
          page,
          size: 10,
          ...(statusFiltro && { status: statusFiltro }),
          ...(busca && { search: busca }),
        },
      }),
    {
      revalidateOnFocus: false,
      refreshInterval: 30000, // 30 segundos
    }
  );

  const { data: stats } = useSWR<LicenseStats>(
    "/partner-licenses/stats",
    () => apiClient.get("/partner-licenses/stats"),
    {
      revalidateOnFocus: false,
      refreshInterval: 60000, // 1 minuto
    }
  );

  const licenses = data?.items || [];
  const meta = data?.meta;

  // ============================================================================
  // STATS CALCULADOS
  // ============================================================================
  const statsCards = [
    {
      label: "Total de Licenças",
      value: stats?.total || 0,
      icon: Key,
      color: "from-blue-500 to-indigo-600",
    },
    {
      label: "Disponíveis",
      value: stats?.by_status?.available || 0,
      icon: CheckCircle2,
      color: "from-green-500 to-emerald-600",
    },
    {
      label: "Atribuídas",
      value: stats?.by_status?.assigned || 0,
      icon: User,
      color: "from-purple-500 to-blue-600",
    },
    {
      label: "Revogadas",
      value: stats?.by_status?.revoked || 0,
      icon: XCircle,
      color: "from-red-500 to-orange-600",
    },
  ];

  // ============================================================================
  // HELPERS
  // ============================================================================
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      available: { label: "Disponível", className: "bg-green-100 text-green-800" },
      assigned: { label: "Atribuída", className: "bg-purple-100 text-purple-800" },
      suspended: { label: "Suspensa", className: "bg-yellow-100 text-yellow-800" },
      revoked: { label: "Revogada", className: "bg-red-100 text-red-800" },
    };

    const config = statusMap[status] || { label: status, className: "bg-gray-100 text-gray-800" };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getStatusIcon = (status: string) => {
    if (status === "available") return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    if (status === "assigned") return <User className="h-5 w-5 text-purple-600" />;
    if (status === "revoked") return <XCircle className="h-5 w-5 text-red-600" />;
    return <Key className="h-5 w-5 text-gray-600" />;
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================
  const handleAssign = async () => {
    if (!selectedLicense || !assignedTo || !assignedEmail) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setIsUpdating(selectedLicense.id_license);
    try {
      await apiClient.post(`/partner-licenses/${selectedLicense.id_license}/assign`, {
        assigned_to: assignedTo,
        assigned_email: assignedEmail,
      });

      toast.success("Licença atribuída com sucesso!");
      setAssignDialogOpen(false);
      setAssignedTo("");
      setAssignedEmail("");
      setSelectedLicense(null);
      await revalidate();
    } catch (error: any) {
      toast.error(error?.message || "Erro ao atribuir licença");
    } finally {
      setIsUpdating(null);
    }
  };

  const handleRevoke = async () => {
    if (!selectedLicense) return;

    setIsUpdating(selectedLicense.id_license);
    try {
      await apiClient.post(`/partner-licenses/${selectedLicense.id_license}/revoke`, {
        reason: revokeReason,
      });

      toast.success("Licença revogada com sucesso!");
      setRevokeDialogOpen(false);
      setRevokeReason("");
      setSelectedLicense(null);
      await revalidate();
    } catch (error: any) {
      toast.error(error?.message || "Erro ao revogar licença");
    } finally {
      setIsUpdating(null);
    }
  };

  const openAssignDialog = (license: License) => {
    setSelectedLicense(license);
    setAssignDialogOpen(true);
  };

  const openRevokeDialog = (license: License) => {
    setSelectedLicense(license);
    setRevokeDialogOpen(true);
  };

  // ============================================================================
  // RENDER
  // ============================================================================
  const renderLicenses = (filtroStatus?: string) => {
    let licensesFiltradas = licenses;

    // Filtrar por status local (além do filtro do servidor)
    if (filtroStatus) {
      licensesFiltradas = licensesFiltradas.filter((l) => l.status === filtroStatus);
    }

    if (licensesFiltradas.length === 0) {
      return (
        <div className="text-center py-12">
          <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Nenhuma licença encontrada</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {licensesFiltradas.map((license) => (
          <Card key={license.id_license} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3 flex-1">
                  {getStatusIcon(license.status)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-lg text-gray-900 font-mono">
                        {license.license_key}
                      </h3>
                      {getStatusBadge(license.status)}
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        <span>
                          <strong>Pacote:</strong> {license.package?.name} ({license.package?.code})
                        </span>
                      </div>
                      <div>
                        <strong>Serviço:</strong> {license.service?.name}
                      </div>
                      {license.assigned_to && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>
                            <strong>Atribuída para:</strong> {license.assigned_to} ({license.assigned_email})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 mb-4">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Criada em</p>
                    <p className="font-bold text-gray-900">
                      {new Date(license.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  {license.activated_at && (
                    <div>
                      <p className="text-gray-600">Ativada em</p>
                      <p className="font-bold text-gray-900">
                        {new Date(license.activated_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  )}
                  {license.revoked_at && (
                    <div>
                      <p className="text-gray-600">Revogada em</p>
                      <p className="font-bold text-gray-900">
                        {new Date(license.revoked_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 border-t pt-4">
                {license.status === "available" && (
                  <Button
                    variant="outline"
                    onClick={() => openAssignDialog(license)}
                    disabled={isUpdating === license.id_license}
                    className="flex-1"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    {isUpdating === license.id_license ? "Atribuindo..." : "Atribuir"}
                  </Button>
                )}
                {license.status === "assigned" && (
                  <Button
                    variant="outline"
                    onClick={() => openRevokeDialog(license)}
                    disabled={isUpdating === license.id_license}
                    className="text-red-600 border-red-600 hover:bg-red-50"
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    {isUpdating === license.id_license ? "Revogando..." : "Revogar"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <AuthenticatedLayout>
      <div className="p-6 space-y-6">
        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-2">
            <Key className="h-8 w-8 text-blue-500" />
            Licenças
          </h1>
          <p className="text-gray-600 mt-1">
            Gerencie as licenças do programa de parceiros
          </p>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {statsCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label}>
                <CardContent className="p-6">
                  <div
                    className={`p-3 rounded-lg bg-gradient-to-r ${stat.color} w-fit mb-4`}
                  >
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* FILTROS */}
        <Card>
          <CardContent className="p-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por chave, nome ou email..."
                  value={busca}
                  onChange={(e) => {
                    setBusca(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                />
              </div>
              <Button
                onClick={() => revalidate()}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Atualizar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* TABS COM LICENÇAS */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Carregando licenças...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600">Erro ao carregar licenças</p>
          </div>
        ) : (
          <Tabs
            value={statusFiltro || "todas"}
            onValueChange={(value) => {
              setStatusFiltro(value === "todas" ? "" : value);
              setPage(1);
            }}
            className="w-full"
          >
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="todas">Todas</TabsTrigger>
              <TabsTrigger value="available">Disponíveis</TabsTrigger>
              <TabsTrigger value="assigned">Atribuídas</TabsTrigger>
              <TabsTrigger value="suspended">Suspensas</TabsTrigger>
              <TabsTrigger value="revoked">Revogadas</TabsTrigger>
            </TabsList>

            <TabsContent value="todas" className="mt-6">
              {renderLicenses()}
            </TabsContent>
            <TabsContent value="available" className="mt-6">
              {renderLicenses("available")}
            </TabsContent>
            <TabsContent value="assigned" className="mt-6">
              {renderLicenses("assigned")}
            </TabsContent>
            <TabsContent value="suspended" className="mt-6">
              {renderLicenses("suspended")}
            </TabsContent>
            <TabsContent value="revoked" className="mt-6">
              {renderLicenses("revoked")}
            </TabsContent>
          </Tabs>
        )}

        {/* PAGINAÇÃO */}
        {meta && meta.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <Button variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>
              Anterior
            </Button>
            <div className="flex items-center gap-2 px-4">
              <span className="text-sm text-gray-600">
                Página {page} de {meta.totalPages}
              </span>
            </div>
            <Button
              variant="outline"
              disabled={page === meta.totalPages}
              onClick={() => setPage(page + 1)}
            >
              Próxima
            </Button>
          </div>
        )}
      </div>

      {/* DIALOG ATRIBUIR */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atribuir Licença</DialogTitle>
            <DialogDescription>
              Preencha os dados do destinatário da licença
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="assigned_to">Nome do Destinatário *</Label>
              <Input
                id="assigned_to"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                placeholder="Nome completo"
              />
            </div>
            <div>
              <Label htmlFor="assigned_email">Email do Destinatário *</Label>
              <Input
                id="assigned_email"
                type="email"
                value={assignedEmail}
                onChange={(e) => setAssignedEmail(e.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>
            {selectedLicense && (
              <div className="bg-gray-50 p-4 rounded-lg text-sm">
                <p><strong>Licença:</strong> {selectedLicense.license_key}</p>
                <p><strong>Serviço:</strong> {selectedLicense.service?.name}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAssign} disabled={!assignedTo || !assignedEmail}>
              Atribuir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG REVOGAR */}
      <Dialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revogar Licença</DialogTitle>
            <DialogDescription>
              Confirme a revogação da licença e informe o motivo
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedLicense && (
              <div className="bg-gray-50 p-4 rounded-lg text-sm">
                <p><strong>Licença:</strong> {selectedLicense.license_key}</p>
                <p><strong>Atribuída para:</strong> {selectedLicense.assigned_to}</p>
                <p><strong>Email:</strong> {selectedLicense.assigned_email}</p>
              </div>
            )}
            <div>
              <Label htmlFor="revoke_reason">Motivo da Revogação (opcional)</Label>
              <Input
                id="revoke_reason"
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                placeholder="Ex: Cancelamento do contrato"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevokeDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleRevoke} variant="destructive">
              Revogar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthenticatedLayout>
  );
}
