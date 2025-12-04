"use client";

import { useState } from "react";
import {
  Users,
  Plus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Phone,
  Mail,
  Building2,
  Trash2,
  Eye,
} from "lucide-react";
import { PageHeader } from "@/components/shared/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { usePartnerLeads, partnerLeadsActions } from "@/lib/api/hooks/usePartnerLeads";
import type { PartnerLead, PartnerLeadCreate, PartnerType, PartnerLeadStatus } from "@/types/partner";
import { toast } from "sonner";

const PARTNER_TYPE_LABELS: Record<PartnerType, string> = {
  paciente: "Paciente",
  profissional: "Profissional",
  clinica: "Clínica",
  fornecedor: "Fornecedor",
};

const STATUS_LABELS: Record<PartnerLeadStatus, string> = {
  pending: "Pendente",
  contacted: "Contatado",
  approved: "Aprovado",
  rejected: "Rejeitado",
  converted: "Convertido",
};

const STATUS_COLORS: Record<PartnerLeadStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  contacted: "bg-blue-100 text-blue-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  converted: "bg-purple-100 text-purple-800",
};

export default function PartnerLeadsPage() {
  // Filtros
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PartnerLeadStatus | "all">("all");
  const [partnerTypeFilter, setPartnerTypeFilter] = useState<PartnerType | "all">("all");

  // Modais
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<PartnerLead | null>(null);

  // Formulário de criação
  const [formData, setFormData] = useState<PartnerLeadCreate>({
    tp_partner: "paciente",
    nm_contato: "",
    nm_email: "",
    nm_telefone: "",
    nm_empresa: "",
    nr_cnpj: "",
    ds_endereco: "",
    ds_notes: "",
  });

  // Notas para aprovação/rejeição
  const [actionNotes, setActionNotes] = useState("");

  // Carregar leads
  const { leads, meta, isLoading, mutate } = usePartnerLeads({
    page,
    size: 10,
    search: search || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    partner_type: partnerTypeFilter !== "all" ? partnerTypeFilter : undefined,
  });

  // Handlers
  const handleCreate = async () => {
    try {
      await partnerLeadsActions.create(formData);
      toast.success("Lead criado com sucesso!");
      setCreateModalOpen(false);
      setFormData({
        tp_partner: "paciente",
        nm_contato: "",
        nm_email: "",
        nm_telefone: "",
        nm_empresa: "",
        nr_cnpj: "",
        ds_endereco: "",
        ds_notes: "",
      });
      mutate();
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar lead");
    }
  };

  const handleApprove = async () => {
    if (!selectedLead) return;
    try {
      await partnerLeadsActions.approve(selectedLead.id_partner_lead, actionNotes);
      toast.success("Lead aprovado!");
      setApproveModalOpen(false);
      setSelectedLead(null);
      setActionNotes("");
      mutate();
    } catch (error: any) {
      toast.error(error.message || "Erro ao aprovar lead");
    }
  };

  const handleReject = async () => {
    if (!selectedLead) return;
    try {
      await partnerLeadsActions.reject(selectedLead.id_partner_lead, actionNotes);
      toast.success("Lead rejeitado");
      setRejectModalOpen(false);
      setSelectedLead(null);
      setActionNotes("");
      mutate();
    } catch (error: any) {
      toast.error(error.message || "Erro ao rejeitar lead");
    }
  };

  const handleDelete = async (leadId: string) => {
    if (!confirm("Tem certeza que deseja deletar este lead?")) return;
    try {
      await partnerLeadsActions.delete(leadId);
      toast.success("Lead deletado");
      mutate();
    } catch (error: any) {
      toast.error(error.message || "Erro ao deletar lead");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto p-8 space-y-6">
        {/* Header */}
        <PageHeader
          title="Leads de Parceiros"
          description="Gerencie leads de pacientes, profissionais, clínicas e fornecedores"
        />

        {/* Filtros e Ações */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Busca */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por nome, email ou empresa..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Filtro de Status */}
              <div className="w-full lg:w-48">
                <Select
                  value={statusFilter}
                  onValueChange={(value) => setStatusFilter(value as PartnerLeadStatus | "all")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos status</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="contacted">Contatado</SelectItem>
                    <SelectItem value="approved">Aprovado</SelectItem>
                    <SelectItem value="rejected">Rejeitado</SelectItem>
                    <SelectItem value="converted">Convertido</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro de Tipo */}
              <div className="w-full lg:w-48">
                <Select
                  value={partnerTypeFilter}
                  onValueChange={(value) => setPartnerTypeFilter(value as PartnerType | "all")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos tipos</SelectItem>
                    <SelectItem value="paciente">Paciente</SelectItem>
                    <SelectItem value="profissional">Profissional</SelectItem>
                    <SelectItem value="clinica">Clínica</SelectItem>
                    <SelectItem value="fornecedor">Fornecedor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Botão Criar */}
              <Button
                onClick={() => setCreateModalOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Lead
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Leads */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Leads ({meta?.totalItems || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Carregando...</p>
              </div>
            ) : leads.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">Nenhum lead encontrado</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Contato
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Empresa
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Tipo
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Data
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {leads.map((lead) => (
                      <tr key={lead.id_partner_lead} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <div>
                            <div className="font-medium text-gray-900">{lead.nm_contato}</div>
                            <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                              <Mail className="h-3 w-3" />
                              {lead.nm_email}
                            </div>
                            {lead.nm_telefone && (
                              <div className="text-sm text-gray-500 flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {lead.nm_telefone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">{lead.nm_empresa}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <Badge variant="outline">{PARTNER_TYPE_LABELS[lead.tp_partner]}</Badge>
                        </td>
                        <td className="px-4 py-4">
                          <Badge className={STATUS_COLORS[lead.nm_status]}>
                            {STATUS_LABELS[lead.nm_status]}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">
                          {new Date(lead.dt_criacao).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedLead(lead);
                                setDetailsModalOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {lead.nm_status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  onClick={() => {
                                    setSelectedLead(lead);
                                    setApproveModalOpen(true);
                                  }}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => {
                                    setSelectedLead(lead);
                                    setRejectModalOpen(true);
                                  }}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDelete(lead.id_partner_lead)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Paginação */}
            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-600">
                  Página {page} de {meta.totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Anterior
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                    disabled={page === meta.totalPages}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal: Criar Lead */}
        <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Lead</DialogTitle>
              <DialogDescription>Preencha os dados do novo lead de parceiro</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Tipo de Parceiro */}
              <div>
                <Label>Tipo de Parceiro *</Label>
                <Select
                  value={formData.tp_partner}
                  onValueChange={(value) => setFormData({ ...formData, tp_partner: value as PartnerType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paciente">Paciente</SelectItem>
                    <SelectItem value="profissional">Profissional</SelectItem>
                    <SelectItem value="clinica">Clínica</SelectItem>
                    <SelectItem value="fornecedor">Fornecedor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Nome do Contato */}
              <div>
                <Label>Nome do Contato *</Label>
                <Input
                  value={formData.nm_contato}
                  onChange={(e) => setFormData({ ...formData, nm_contato: e.target.value })}
                  placeholder="Nome completo"
                />
              </div>

              {/* Email */}
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={formData.nm_email}
                  onChange={(e) => setFormData({ ...formData, nm_email: e.target.value })}
                  placeholder="email@exemplo.com"
                />
              </div>

              {/* Telefone */}
              <div>
                <Label>Telefone</Label>
                <Input
                  value={formData.nm_telefone}
                  onChange={(e) => setFormData({ ...formData, nm_telefone: e.target.value })}
                  placeholder="(11) 99999-9999"
                />
              </div>

              {/* Nome da Empresa */}
              <div>
                <Label>Nome da Empresa *</Label>
                <Input
                  value={formData.nm_empresa}
                  onChange={(e) => setFormData({ ...formData, nm_empresa: e.target.value })}
                  placeholder="Nome da empresa/clínica"
                />
              </div>

              {/* CNPJ */}
              <div>
                <Label>CNPJ</Label>
                <Input
                  value={formData.nr_cnpj}
                  onChange={(e) => setFormData({ ...formData, nr_cnpj: e.target.value })}
                  placeholder="00.000.000/0000-00"
                />
              </div>

              {/* Endereço */}
              <div>
                <Label>Endereço</Label>
                <Input
                  value={formData.ds_endereco}
                  onChange={(e) => setFormData({ ...formData, ds_endereco: e.target.value })}
                  placeholder="Endereço completo"
                />
              </div>

              {/* Observações */}
              <div>
                <Label>Observações</Label>
                <Textarea
                  value={formData.ds_notes}
                  onChange={(e) => setFormData({ ...formData, ds_notes: e.target.value })}
                  placeholder="Informações adicionais..."
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleCreate}
                className="bg-gradient-to-r from-blue-600 to-cyan-600"
                disabled={!formData.nm_contato || !formData.nm_email || !formData.nm_empresa}
              >
                Criar Lead
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal: Detalhes do Lead */}
        <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes do Lead</DialogTitle>
            </DialogHeader>

            {selectedLead && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-500">Tipo</Label>
                    <p className="font-medium">{PARTNER_TYPE_LABELS[selectedLead.tp_partner]}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Status</Label>
                    <div>
                      <Badge className={STATUS_COLORS[selectedLead.nm_status]}>
                        {STATUS_LABELS[selectedLead.nm_status]}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-500">Contato</Label>
                    <p className="font-medium">{selectedLead.nm_contato}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Email</Label>
                    <p className="font-medium">{selectedLead.nm_email}</p>
                  </div>
                  {selectedLead.nm_telefone && (
                    <div>
                      <Label className="text-gray-500">Telefone</Label>
                      <p className="font-medium">{selectedLead.nm_telefone}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-gray-500">Empresa</Label>
                    <p className="font-medium">{selectedLead.nm_empresa}</p>
                  </div>
                  {selectedLead.nr_cnpj && (
                    <div>
                      <Label className="text-gray-500">CNPJ</Label>
                      <p className="font-medium">{selectedLead.nr_cnpj}</p>
                    </div>
                  )}
                  {selectedLead.ds_endereco && (
                    <div className="col-span-2">
                      <Label className="text-gray-500">Endereço</Label>
                      <p className="font-medium">{selectedLead.ds_endereco}</p>
                    </div>
                  )}
                  {selectedLead.ds_notes && (
                    <div className="col-span-2">
                      <Label className="text-gray-500">Observações</Label>
                      <p className="font-medium whitespace-pre-wrap">{selectedLead.ds_notes}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-gray-500">Data de Criação</Label>
                    <p className="font-medium">
                      {new Date(selectedLead.dt_criacao).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  {selectedLead.dt_contacted && (
                    <div>
                      <Label className="text-gray-500">Data de Contato</Label>
                      <p className="font-medium">
                        {new Date(selectedLead.dt_contacted).toLocaleString("pt-BR")}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setDetailsModalOpen(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal: Aprovar Lead */}
        <Dialog open={approveModalOpen} onOpenChange={setApproveModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Aprovar Lead</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja aprovar este lead?
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <Label>Observações (opcional)</Label>
              <Textarea
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder="Adicione observações sobre a aprovação..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setApproveModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleApprove}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Aprovar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal: Rejeitar Lead */}
        <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rejeitar Lead</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja rejeitar este lead?
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <Label>Motivo da rejeição (opcional)</Label>
              <Textarea
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder="Explique o motivo da rejeição..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleReject}
                className="bg-red-600 hover:bg-red-700"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Rejeitar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
