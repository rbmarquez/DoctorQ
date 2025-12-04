"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { Loader2, RefreshCcw, Edit, Trash2, Check, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ServiceCategory = 'plano_base' | 'oferta' | 'diferencial' | 'addon';
type PartnerType = 'clinica' | 'profissional' | 'fornecedor' | 'universal';
type SortField = 'name' | 'price' | 'category' | 'partner_type';
type SortOrder = 'asc' | 'desc';

interface PartnerServiceDefinition {
  id_service: string;
  service_code: string;
  service_name: string;
  description?: string | null;
  price_value?: number | null;
  price_label?: string | null;
  features: string[];
  active: boolean;
  recommended: boolean;
  category?: ServiceCategory;
  partner_type?: PartnerType;
  max_licenses?: number | null;
  yearly_discount?: number;
}

interface FormState {
  service_code: string;
  service_name: string;
  description: string;
  price_value: string;
  price_label: string;
  features: string;
  active: boolean;
  recommended: boolean;
  category: ServiceCategory;
  partner_type: PartnerType;
  max_licenses: string;
  yearly_discount: string;
}

const emptyForm: FormState = {
  service_code: "",
  service_name: "",
  description: "",
  price_value: "",
  price_label: "",
  features: "",
  active: true,
  recommended: false,
  category: "plano_base",
  partner_type: "clinica",
  max_licenses: "",
  yearly_discount: "17",
};

const categoryLabels: Record<ServiceCategory, string> = {
  plano_base: "Plano Base",
  oferta: "Oferta Especial",
  diferencial: "Diferencial Competitivo",
  addon: "Serviço Adicional",
};

const categoryColors: Record<ServiceCategory, string> = {
  plano_base: "bg-blue-100 text-blue-800",
  oferta: "bg-green-100 text-green-800",
  diferencial: "bg-purple-100 text-purple-800",
  addon: "bg-orange-100 text-orange-800",
};

const partnerTypeLabels: Record<PartnerType, string> = {
  clinica: "Clínica",
  profissional: "Profissional",
  fornecedor: "Fornecedor",
  universal: "Universal (Todos)",
};

const partnerTypeColors: Record<PartnerType, string> = {
  clinica: "bg-blue-100 text-blue-800",
  profissional: "bg-green-100 text-green-800",
  fornecedor: "bg-purple-100 text-purple-800",
  universal: "bg-gray-100 text-gray-800",
};

export function PartnerPlansManager() {
  const [services, setServices] = useState<PartnerServiceDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editOpen, setEditOpen] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editing, setEditing] = useState<PartnerServiceDefinition | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm);

  // Filtros e ordenação
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<ServiceCategory | "all">("all");
  const [filterPartnerType, setFilterPartnerType] = useState<PartnerType | "all">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const hasInactive = useMemo(
    () => services.some((service) => !service.active),
    [services]
  );

  // Serviços filtrados e ordenados
  const filteredAndSortedServices = useMemo(() => {
    let filtered = [...services];

    // Aplicar busca
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.service_name.toLowerCase().includes(search) ||
          s.service_code.toLowerCase().includes(search) ||
          s.description?.toLowerCase().includes(search)
      );
    }

    // Aplicar filtro de categoria
    if (filterCategory !== "all") {
      filtered = filtered.filter((s) => s.category === filterCategory);
    }

    // Aplicar filtro de tipo de parceiro
    if (filterPartnerType !== "all") {
      filtered = filtered.filter((s) => s.partner_type === filterPartnerType);
    }

    // Aplicar filtro de status
    if (filterStatus === "active") {
      filtered = filtered.filter((s) => s.active);
    } else if (filterStatus === "inactive") {
      filtered = filtered.filter((s) => !s.active);
    }

    // Aplicar ordenação
    filtered.sort((a, b) => {
      let aValue: string | number = "";
      let bValue: string | number = "";

      switch (sortField) {
        case "name":
          aValue = a.service_name.toLowerCase();
          bValue = b.service_name.toLowerCase();
          break;
        case "price":
          aValue = a.price_value ?? 0;
          bValue = b.price_value ?? 0;
          break;
        case "category":
          aValue = categoryLabels[a.category || "plano_base"];
          bValue = categoryLabels[b.category || "plano_base"];
          break;
        case "partner_type":
          aValue = partnerTypeLabels[a.partner_type || "universal"];
          bValue = partnerTypeLabels[b.partner_type || "universal"];
          break;
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [services, searchTerm, filterCategory, filterPartnerType, filterStatus, sortField, sortOrder]);

  // Estatísticas
  const stats = useMemo(() => {
    return {
      total: services.length,
      active: services.filter((s) => s.active).length,
      inactive: services.filter((s) => !s.active).length,
      clinica: services.filter((s) => s.partner_type === "clinica").length,
      profissional: services.filter((s) => s.partner_type === "profissional").length,
      fornecedor: services.filter((s) => s.partner_type === "fornecedor").length,
      universal: services.filter((s) => s.partner_type === "universal").length,
    };
  }, [services]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilterCategory("all");
    setFilterPartnerType("all");
    setFilterStatus("all");
  };

  const loadServices = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        "/api/partner/services?includeInactive=true",
        { cache: "no-store" }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          error.detail || "Não foi possível carregar os serviços."
        );
      }

      const data: PartnerServiceDefinition[] = await response.json();
      setServices(data);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Falha ao carregar serviços."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const handleCreate = async () => {
    const payload = buildPayload(form);
    if (!payload.service_code || !payload.service_name) {
      toast.error("Informe código e nome do plano.");
      return;
    }

    setCreating(true);
    try {
      const response = await fetch("/api/partner/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || "Erro ao criar plano.");
      }

      toast.success("Plano cadastrado com sucesso!");
      setForm(emptyForm);
      await loadServices();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao criar plano."
      );
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (service: PartnerServiceDefinition) => {
    setEditing(service);
    setEditForm({
      service_code: service.service_code,
      service_name: service.service_name,
      description: service.description || "",
      price_value:
        service.price_value !== null && service.price_value !== undefined
          ? String(service.price_value)
          : "",
      price_label: service.price_label || "",
      features: service.features.join("\n"),
      active: service.active,
      recommended: service.recommended,
      category: service.category || "plano_base",
      partner_type: service.partner_type || "clinica",
      max_licenses:
        service.max_licenses !== null && service.max_licenses !== undefined
          ? String(service.max_licenses)
          : "",
      yearly_discount:
        service.yearly_discount !== null && service.yearly_discount !== undefined
          ? String(service.yearly_discount)
          : "17",
    });
    setEditOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editing) return;
    const payload = buildPayload(editForm, true);
    setEditSubmitting(true);
    try {
      const response = await fetch(
        `/api/partner/services/${editing.id_service}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || "Erro ao atualizar plano.");
      }

      toast.success("Plano atualizado com sucesso!");
      setEditOpen(false);
      setEditing(null);
      await loadServices();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao atualizar plano."
      );
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDelete = async (service: PartnerServiceDefinition) => {
    const confirmMessage = service.active
      ? "Deseja realmente inativar este plano? Ele ficará oculto para novos cadastros."
      : "Deseja realmente manter este plano inativo?";

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const response = await fetch(
        `/api/partner/services/${service.id_service}`,
        { method: "DELETE" }
      );

      if (!response.ok && response.status !== 204) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || "Erro ao inativar plano.");
      }

      toast.success("Plano inativado com sucesso!");
      await loadServices();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao inativar plano."
      );
    }
  };

  const handleToggleActive = async (
    service: PartnerServiceDefinition,
    active: boolean
  ) => {
    try {
      const response = await fetch(
        `/api/partner/services/${service.id_service}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ active }),
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || "Erro ao atualizar status.");
      }

      await loadServices();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao atualizar status."
      );
    }
  };

  const handleToggleRecommended = async (
    service: PartnerServiceDefinition,
    recommended: boolean
  ) => {
    try {
      const response = await fetch(
        `/api/partner/services/${service.id_service}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recommended }),
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || "Erro ao atualizar destaque.");
      }

      await loadServices();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erro ao atualizar destaque."
      );
    }
  };

  return (
    <div className="space-y-8">
      <section>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">
              Cadastrar novo plano
            </CardTitle>
            <CardDescription>
              Defina os serviços disponíveis no funil de parceiros. Ajuste
              código, descrição, preços e benefícios conforme necessário.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="service_code">Código</Label>
                <Input
                  id="service_code"
                  placeholder="EX: PLATAFORMA"
                  value={form.service_code}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      service_code: event.target.value.toUpperCase(),
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="service_name">Nome do plano</Label>
                <Input
                  id="service_name"
                  value={form.service_name}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      service_name: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                  rows={3}
                  placeholder="Resumo comercial do plano."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price_value">Preço mensal</Label>
                <Input
                  id="price_value"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price_value}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      price_value: event.target.value,
                    }))
                  }
                  placeholder="Ex: 197.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price_label">Etiqueta de preço</Label>
                <Input
                  id="price_label"
                  value={form.price_label}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      price_label: event.target.value,
                    }))
                  }
                  placeholder="Ex: R$ 197/mês por unidade"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="features">
                  Benefícios (um por linha)
                </Label>
                <Textarea
                  id="features"
                  value={form.features}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      features: event.target.value,
                    }))
                  }
                  rows={4}
                  placeholder="Adicione cada benefício em uma linha"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoria do Serviço</Label>
                <select
                  id="category"
                  value={form.category}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      category: event.target.value as ServiceCategory,
                    }))
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {(Object.keys(categoryLabels) as ServiceCategory[]).map((cat) => (
                    <option key={cat} value={cat}>
                      {categoryLabels[cat]}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Planos Base aparecem na 1ª etapa, Ofertas e Diferenciais na 3ª etapa
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="partner_type">Tipo de Parceiro</Label>
                <select
                  id="partner_type"
                  value={form.partner_type}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      partner_type: event.target.value as PartnerType,
                    }))
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {(Object.keys(partnerTypeLabels) as PartnerType[]).map((type) => (
                    <option key={type} value={type}>
                      {partnerTypeLabels[type]}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Define para qual tipo de parceiro este plano está disponível
                </p>
              </div>
              {form.category === "plano_base" && (
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="max_licenses">
                    Quantidade Máxima de Usuários/Licenças
                  </Label>
                  <Input
                    id="max_licenses"
                    type="number"
                    min="1"
                    step="1"
                    value={form.max_licenses}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        max_licenses: event.target.value,
                      }))
                    }
                    placeholder="Ex: 5 (deixe vazio para ilimitado)"
                  />
                  <p className="text-xs text-muted-foreground">
                    Define o limite de profissionais/usuários para este plano.
                    Deixe vazio para planos ilimitados (ex: Custom/Enterprise).
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="yearly_discount">
                  Desconto para Plano Anual (%)
                </Label>
                <Input
                  id="yearly_discount"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={form.yearly_discount}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      yearly_discount: event.target.value,
                    }))
                  }
                  placeholder="Ex: 17 (para 17% de desconto)"
                />
                <p className="text-xs text-muted-foreground">
                  Percentual de desconto aplicado no preço anual (padrão: 17%)
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  id="recommended"
                  checked={form.recommended}
                  onCheckedChange={(checked) =>
                    setForm((prev) => ({ ...prev, recommended: checked }))
                  }
                />
                <Label htmlFor="recommended">Destacar como recomendado</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  id="active"
                  checked={form.active}
                  onCheckedChange={(checked) =>
                    setForm((prev) => ({ ...prev, active: checked }))
                  }
                />
                <Label htmlFor="active">Ativar plano imediatamente</Label>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleCreate} disabled={creating}>
                {creating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                Salvar plano
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-xl font-semibold">
                Planos cadastrados
              </CardTitle>
              <CardDescription>
                Gerencie os planos que aparecem na jornada pública de parceiros.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadServices}
              disabled={loading}
              className="gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcw className="h-4 w-4" />
              )}
              Atualizar
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Estatísticas */}
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-lg border bg-card p-4">
                <div className="text-sm font-medium text-muted-foreground">Total</div>
                <div className="mt-1 text-2xl font-bold">{stats.total}</div>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <div className="text-sm font-medium text-muted-foreground">Ativos</div>
                <div className="mt-1 text-2xl font-bold text-green-600">{stats.active}</div>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <div className="text-sm font-medium text-muted-foreground">Inativos</div>
                <div className="mt-1 text-2xl font-bold text-red-600">{stats.inactive}</div>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <div className="text-sm font-medium text-muted-foreground">Filtrados</div>
                <div className="mt-1 text-2xl font-bold text-blue-600">{filteredAndSortedServices.length}</div>
              </div>
            </div>

            {/* Busca e Filtros */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold">Filtros</h3>
                {(searchTerm || filterCategory !== "all" || filterPartnerType !== "all" || filterStatus !== "all") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="ml-auto text-xs"
                  >
                    Limpar filtros
                  </Button>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                {/* Campo de busca */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome ou código..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Filtro de Categoria */}
                <Select value={filterCategory} onValueChange={(value) => setFilterCategory(value as ServiceCategory | "all")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    <SelectItem value="plano_base">Plano Base</SelectItem>
                    <SelectItem value="oferta">Oferta Especial</SelectItem>
                    <SelectItem value="diferencial">Diferencial</SelectItem>
                    <SelectItem value="addon">Adicional</SelectItem>
                  </SelectContent>
                </Select>

                {/* Filtro de Tipo de Parceiro */}
                <Select value={filterPartnerType} onValueChange={(value) => setFilterPartnerType(value as PartnerType | "all")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo de Parceiro" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="clinica">Clínica</SelectItem>
                    <SelectItem value="profissional">Profissional</SelectItem>
                    <SelectItem value="fornecedor">Fornecedor</SelectItem>
                    <SelectItem value="universal">Universal</SelectItem>
                  </SelectContent>
                </Select>

                {/* Filtro de Status */}
                <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as "all" | "active" | "inactive")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="active">Ativos</SelectItem>
                    <SelectItem value="inactive">Inativos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : services.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                Nenhum plano cadastrado até o momento.
              </div>
            ) : filteredAndSortedServices.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                Nenhum plano encontrado com os filtros aplicados.
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1 px-2 font-semibold"
                          onClick={() => handleSort("name")}
                        >
                          Plano
                          {sortField === "name" && (
                            sortOrder === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                          )}
                          {sortField !== "name" && <ArrowUpDown className="h-3 w-3 opacity-50" />}
                        </Button>
                      </TableHead>
                      <TableHead>Código</TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1 px-2 font-semibold"
                          onClick={() => handleSort("category")}
                        >
                          Categoria
                          {sortField === "category" && (
                            sortOrder === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                          )}
                          {sortField !== "category" && <ArrowUpDown className="h-3 w-3 opacity-50" />}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1 px-2 font-semibold"
                          onClick={() => handleSort("partner_type")}
                        >
                          Tipo Parceiro
                          {sortField === "partner_type" && (
                            sortOrder === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                          )}
                          {sortField !== "partner_type" && <ArrowUpDown className="h-3 w-3 opacity-50" />}
                        </Button>
                      </TableHead>
                      <TableHead>Máx. Licenças</TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1 px-2 font-semibold"
                          onClick={() => handleSort("price")}
                        >
                          Preço
                          {sortField === "price" && (
                            sortOrder === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                          )}
                          {sortField !== "price" && <ArrowUpDown className="h-3 w-3 opacity-50" />}
                        </Button>
                      </TableHead>
                      <TableHead>Benefícios</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Recomendado</TableHead>
                      <TableHead className="w-[120px] text-right">
                        Ações
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedServices.map((service) => (
                    <TableRow
                      key={service.id_service}
                      className={cn(
                        !service.active && "opacity-60 hover:opacity-80"
                      )}
                    >
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-semibold">
                            {service.service_name}
                          </div>
                          {service.description && (
                            <div className="text-xs text-muted-foreground">
                              {service.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="rounded bg-muted px-2 py-1 text-xs">
                          {service.service_code}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge className={categoryColors[service.category || "plano_base"]}>
                          {categoryLabels[service.category || "plano_base"]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={partnerTypeColors[service.partner_type || "universal"]}>
                          {partnerTypeLabels[service.partner_type || "universal"]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {service.max_licenses !== null && service.max_licenses !== undefined ? (
                          <span className="font-medium">{service.max_licenses} usuários</span>
                        ) : (
                          <span className="text-muted-foreground">Ilimitado</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">
                            {service.price_label || "-"}
                          </div>
                          {service.price_value !== null &&
                            service.price_value !== undefined && (
                              <div className="text-xs text-muted-foreground">
                                {Intl.NumberFormat("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                }).format(service.price_value)}
                                /mês
                              </div>
                            )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <ul className="list-disc space-y-1 pl-4 text-sm">
                          {service.features.map((feature) => (
                            <li key={feature}>{feature}</li>
                          ))}
                        </ul>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={service.active}
                            onCheckedChange={(checked) =>
                              handleToggleActive(service, checked)
                            }
                          />
                          <span className="text-sm">
                            {service.active ? "Ativo" : "Inativo"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={service.recommended}
                            onCheckedChange={(checked) =>
                              handleToggleRecommended(service, checked)
                            }
                          />
                          {service.recommended && (
                            <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                              Destaque
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openEdit(service)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDelete(service)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            )}
            {hasInactive && (
              <p className="px-6 pb-6 text-xs text-muted-foreground">
                Planos inativados permanecem disponíveis para histórico, mas não
                aparecem nas páginas públicas.
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar plano</DialogTitle>
            <DialogDescription>
              Ajuste dados comerciais, preço e benefícios do plano selecionado.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit_service_code">Código</Label>
                <Input
                  id="edit_service_code"
                  value={editForm.service_code}
                  onChange={(event) =>
                    setEditForm((prev) => ({
                      ...prev,
                      service_code: event.target.value.toUpperCase(),
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_service_name">Nome do plano</Label>
                <Input
                  id="edit_service_name"
                  value={editForm.service_name}
                  onChange={(event) =>
                    setEditForm((prev) => ({
                      ...prev,
                      service_name: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_description">Descrição</Label>
              <Textarea
                id="edit_description"
                rows={3}
                value={editForm.description}
                onChange={(event) =>
                  setEditForm((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit_category">Categoria do Serviço</Label>
                <select
                  id="edit_category"
                  value={editForm.category}
                  onChange={(event) =>
                    setEditForm((prev) => ({
                      ...prev,
                      category: event.target.value as ServiceCategory,
                    }))
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {(Object.keys(categoryLabels) as ServiceCategory[]).map((cat) => (
                    <option key={cat} value={cat}>
                      {categoryLabels[cat]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_partner_type">Tipo de Parceiro</Label>
                <select
                  id="edit_partner_type"
                  value={editForm.partner_type}
                  onChange={(event) =>
                    setEditForm((prev) => ({
                      ...prev,
                      partner_type: event.target.value as PartnerType,
                    }))
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {(Object.keys(partnerTypeLabels) as PartnerType[]).map((type) => (
                    <option key={type} value={type}>
                      {partnerTypeLabels[type]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {editForm.category === "plano_base" && (
              <div className="space-y-2">
                <Label htmlFor="edit_max_licenses">
                  Quantidade Máxima de Usuários/Licenças
                </Label>
                <Input
                  id="edit_max_licenses"
                  type="number"
                  min="1"
                  step="1"
                  value={editForm.max_licenses}
                  onChange={(event) =>
                    setEditForm((prev) => ({
                      ...prev,
                      max_licenses: event.target.value,
                    }))
                  }
                  placeholder="Ex: 5 (deixe vazio para ilimitado)"
                />
                <p className="text-xs text-muted-foreground">
                  Deixe vazio para planos ilimitados (ex: Custom/Enterprise).
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit_yearly_discount">
                Desconto para Plano Anual (%)
              </Label>
              <Input
                id="edit_yearly_discount"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={editForm.yearly_discount}
                onChange={(event) =>
                  setEditForm((prev) => ({
                    ...prev,
                    yearly_discount: event.target.value,
                  }))
                }
                placeholder="Ex: 17 (para 17% de desconto)"
              />
              <p className="text-xs text-muted-foreground">
                Percentual de desconto aplicado no preço anual (padrão: 17%)
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit_price_value">Preço mensal</Label>
                <Input
                  id="edit_price_value"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editForm.price_value}
                  onChange={(event) =>
                    setEditForm((prev) => ({
                      ...prev,
                      price_value: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_price_label">Etiqueta de preço</Label>
                <Input
                  id="edit_price_label"
                  value={editForm.price_label}
                  onChange={(event) =>
                    setEditForm((prev) => ({
                      ...prev,
                      price_label: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_features">Benefícios</Label>
              <Textarea
                id="edit_features"
                rows={4}
                value={editForm.features}
                onChange={(event) =>
                  setEditForm((prev) => ({
                    ...prev,
                    features: event.target.value,
                  }))
                }
              />
            </div>

            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-3">
                <Switch
                  id="edit_active"
                  checked={editForm.active}
                  onCheckedChange={(checked) =>
                    setEditForm((prev) => ({ ...prev, active: checked }))
                  }
                />
                <Label htmlFor="edit_active">Plano ativo</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  id="edit_recommended"
                  checked={editForm.recommended}
                  onCheckedChange={(checked) =>
                    setEditForm((prev) => ({ ...prev, recommended: checked }))
                  }
                />
                <Label htmlFor="edit_recommended">Destacar como recomendado</Label>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setEditOpen(false)}
                disabled={editSubmitting}
              >
                Cancelar
              </Button>
              <Button onClick={handleEditSubmit} disabled={editSubmitting}>
                {editSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                Salvar alterações
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function buildPayload(form: FormState, isUpdate = false) {
  const base = {
    service_code: form.service_code.trim(),
    service_name: form.service_name.trim(),
    description: form.description.trim() || null,
    price_value:
      form.price_value.trim() === ""
        ? null
        : Number.parseFloat(form.price_value),
    price_label: form.price_label.trim() || null,
    features: form.features
      .split("\n")
      .map((feature) => feature.trim())
      .filter(Boolean),
    active: form.active,
    recommended: form.recommended,
    category: form.category,
    partner_type: form.partner_type,
    max_licenses:
      form.max_licenses.trim() === ""
        ? null
        : Number.parseInt(form.max_licenses, 10),
    yearly_discount:
      form.yearly_discount.trim() === ""
        ? 17.00
        : Number.parseFloat(form.yearly_discount),
  };

  if (isUpdate) {
    return base;
  }

  return base;
}
