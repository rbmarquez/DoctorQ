"use client";

import { useState } from "react";
import { Plus, Search, Filter, Edit, Trash2, ToggleLeft, ToggleRight, Eye } from "lucide-react";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { usePartnerLeadQuestions, partnerLeadQuestionsActions } from "@/lib/api/hooks/usePartnerLeadQuestions";
import type { PartnerLeadQuestion, PartnerLeadQuestionCreate, PartnerType, InputType } from "@/types/partner";
import { toast } from "sonner";

const PARTNER_TYPES: { value: PartnerType; label: string }[] = [
  { value: "paciente", label: "Paciente" },
  { value: "profissional", label: "Profissional" },
  { value: "clinica", label: "Clínica" },
  { value: "fornecedor", label: "Fornecedor" },
];

const INPUT_TYPES: { value: InputType; label: string }[] = [
  { value: "text", label: "Texto" },
  { value: "textarea", label: "Texto longo" },
  { value: "select", label: "Seleção" },
  { value: "radio", label: "Opção única" },
  { value: "checkbox", label: "Múltipla escolha" },
  { value: "number", label: "Número" },
  { value: "email", label: "Email" },
  { value: "tel", label: "Telefone" },
  { value: "date", label: "Data" },
];

export default function PartnerLeadQuestionsPage() {
  // Filters
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [tpPartnerFilter, setTpPartnerFilter] = useState<PartnerType | "all">("all");
  const [stActiveFilter, setStActiveFilter] = useState<"true" | "false" | "all">("all");

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<PartnerLeadQuestion | null>(null);

  // Form state
  const [formData, setFormData] = useState<PartnerLeadQuestionCreate>({
    tp_partner: "paciente",
    nm_question: "",
    tp_input: "text",
    ds_placeholder: "",
    ds_help_text: "",
    nr_order: 0,
    st_required: false,
    st_active: true,
  });
  const [options, setOptions] = useState<string[]>([""]);

  // Fetch questions
  const filters: any = { page, size: 20 };
  if (search) filters.search = search;
  if (tpPartnerFilter && tpPartnerFilter !== "all") filters.tp_partner = tpPartnerFilter;
  if (stActiveFilter && stActiveFilter !== "all") filters.st_active = stActiveFilter === "true";

  const { questions, meta, isLoading, mutate } = usePartnerLeadQuestions(filters);

  // Reset form
  const resetForm = () => {
    setFormData({
      tp_partner: "paciente",
      nm_question: "",
      tp_input: "text",
      ds_placeholder: "",
      ds_help_text: "",
      nr_order: 0,
      st_required: false,
      st_active: true,
    });
    setOptions([""]);
  };

  // Handle create
  const handleCreate = async () => {
    try {
      const needsOptions = ["select", "radio", "checkbox"].includes(formData.tp_input);
      const validOptions = options.filter((opt) => opt.trim() !== "");

      if (needsOptions && validOptions.length === 0) {
        toast.error("Adicione pelo menos uma opção para este tipo de input");
        return;
      }

      const dataToSend: PartnerLeadQuestionCreate = {
        ...formData,
        ds_options: needsOptions ? { options: validOptions } : undefined,
      };

      await partnerLeadQuestionsActions.create(dataToSend);
      toast.success("Pergunta criada com sucesso!");
      setCreateModalOpen(false);
      resetForm();
      mutate();
    } catch (error: any) {
      console.error("Erro ao criar pergunta:", error);
      toast.error(error?.message || "Erro ao criar pergunta");
    }
  };

  // Handle edit
  const handleEdit = async () => {
    if (!selectedQuestion) return;

    try {
      const needsOptions = ["select", "radio", "checkbox"].includes(formData.tp_input);
      const validOptions = options.filter((opt) => opt.trim() !== "");

      if (needsOptions && validOptions.length === 0) {
        toast.error("Adicione pelo menos uma opção para este tipo de input");
        return;
      }

      await partnerLeadQuestionsActions.update(selectedQuestion.id_question, {
        ...formData,
        ds_options: needsOptions ? { options: validOptions } : undefined,
      });

      toast.success("Pergunta atualizada com sucesso!");
      setEditModalOpen(false);
      resetForm();
      mutate();
    } catch (error: any) {
      console.error("Erro ao atualizar pergunta:", error);
      toast.error(error?.message || "Erro ao atualizar pergunta");
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedQuestion) return;

    try {
      await partnerLeadQuestionsActions.delete(selectedQuestion.id_question);
      toast.success("Pergunta deletada com sucesso!");
      setDeleteModalOpen(false);
      setSelectedQuestion(null);
      mutate();
    } catch (error: any) {
      console.error("Erro ao deletar pergunta:", error);
      toast.error(error?.message || "Erro ao deletar pergunta");
    }
  };

  // Handle toggle active
  const handleToggleActive = async (question: PartnerLeadQuestion) => {
    try {
      await partnerLeadQuestionsActions.toggleActive(question.id_question);
      toast.success(
        question.st_active
          ? "Pergunta desativada com sucesso!"
          : "Pergunta ativada com sucesso!"
      );
      mutate();
    } catch (error: any) {
      console.error("Erro ao alternar status:", error);
      toast.error(error?.message || "Erro ao alternar status");
    }
  };

  // Open edit modal
  const openEditModal = (question: PartnerLeadQuestion) => {
    setSelectedQuestion(question);
    setFormData({
      tp_partner: question.tp_partner,
      nm_question: question.nm_question,
      tp_input: question.tp_input,
      ds_placeholder: question.ds_placeholder || "",
      ds_help_text: question.ds_help_text || "",
      nr_order: question.nr_order,
      st_required: question.st_required,
      st_active: question.st_active,
    });
    setOptions(question.ds_options?.options || [""]);
    setEditModalOpen(true);
  };

  // Open view modal
  const openViewModal = (question: PartnerLeadQuestion) => {
    setSelectedQuestion(question);
    setViewModalOpen(true);
  };

  // Open delete modal
  const openDeleteModal = (question: PartnerLeadQuestion) => {
    setSelectedQuestion(question);
    setDeleteModalOpen(true);
  };

  // Add option
  const addOption = () => {
    setOptions([...options, ""]);
  };

  // Remove option
  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  // Update option
  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Perguntas de Leads</h1>
        <p className="text-gray-600 mt-2">
          Gerencie as perguntas para qualificação de leads de parceiros
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {PARTNER_TYPES.map((type) => {
          const count = questions.filter((q) => q.tp_partner === type.value).length;
          return (
            <Card key={type.value}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {type.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{count}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar perguntas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={tpPartnerFilter} onValueChange={(v) => setTpPartnerFilter(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de parceiro" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {PARTNER_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={stActiveFilter} onValueChange={(v) => setStActiveFilter(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="true">Ativas</SelectItem>
                <SelectItem value="false">Inativas</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={() => setCreateModalOpen(true)} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Nova Pergunta
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Questions List */}
      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              Carregando...
            </CardContent>
          </Card>
        ) : questions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              Nenhuma pergunta encontrada
            </CardContent>
          </Card>
        ) : (
          questions.map((question) => (
            <Card key={question.id_question} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={question.st_active ? "default" : "secondary"}>
                        {PARTNER_TYPES.find((t) => t.value === question.tp_partner)?.label}
                      </Badge>
                      <Badge variant="outline">
                        {INPUT_TYPES.find((t) => t.value === question.tp_input)?.label}
                      </Badge>
                      {question.st_required && (
                        <Badge variant="destructive" className="text-xs">
                          Obrigatória
                        </Badge>
                      )}
                      {!question.st_active && (
                        <Badge variant="secondary" className="text-xs">
                          Inativa
                        </Badge>
                      )}
                      <span className="text-xs text-gray-500">Ordem: {question.nr_order}</span>
                    </div>

                    <h3 className="font-semibold text-gray-900 mb-1">
                      {question.nm_question}
                    </h3>

                    {question.ds_placeholder && (
                      <p className="text-sm text-gray-600 mb-1">
                        Placeholder: {question.ds_placeholder}
                      </p>
                    )}

                    {question.ds_help_text && (
                      <p className="text-sm text-gray-500 italic">
                        Ajuda: {question.ds_help_text}
                      </p>
                    )}

                    {question.ds_options && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 mb-1">Opções:</p>
                        <div className="flex flex-wrap gap-1">
                          {question.ds_options.options.slice(0, 3).map((opt, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {opt}
                            </Badge>
                          ))}
                          {question.ds_options.options.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{question.ds_options.options.length - 3} mais
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openViewModal(question)}
                      title="Visualizar"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleActive(question)}
                      title={question.st_active ? "Desativar" : "Ativar"}
                    >
                      {question.st_active ? (
                        <ToggleRight className="h-4 w-4 text-green-600" />
                      ) : (
                        <ToggleLeft className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditModal(question)}
                      title="Editar"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openDeleteModal(question)}
                      title="Deletar"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {meta && meta.pages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-gray-600">
            Mostrando {questions.length} de {meta.total} perguntas
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page === meta.pages}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={createModalOpen || editModalOpen} onOpenChange={(open) => {
        if (!open) {
          setCreateModalOpen(false);
          setEditModalOpen(false);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {createModalOpen ? "Nova Pergunta" : "Editar Pergunta"}
            </DialogTitle>
            <DialogDescription>
              {createModalOpen
                ? "Crie uma nova pergunta para qualificação de leads"
                : "Atualize os dados da pergunta"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tp_partner">Tipo de Parceiro *</Label>
                <Select
                  value={formData.tp_partner}
                  onValueChange={(v) => setFormData({ ...formData, tp_partner: v as PartnerType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PARTNER_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="tp_input">Tipo de Input *</Label>
                <Select
                  value={formData.tp_input}
                  onValueChange={(v) => setFormData({ ...formData, tp_input: v as InputType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INPUT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="nm_question">Pergunta *</Label>
              <Input
                id="nm_question"
                value={formData.nm_question}
                onChange={(e) => setFormData({ ...formData, nm_question: e.target.value })}
                placeholder="Ex: Qual procedimento você procura?"
              />
            </div>

            <div>
              <Label htmlFor="ds_placeholder">Placeholder</Label>
              <Input
                id="ds_placeholder"
                value={formData.ds_placeholder}
                onChange={(e) => setFormData({ ...formData, ds_placeholder: e.target.value })}
                placeholder="Ex: Digite aqui..."
              />
            </div>

            <div>
              <Label htmlFor="ds_help_text">Texto de Ajuda</Label>
              <Textarea
                id="ds_help_text"
                value={formData.ds_help_text}
                onChange={(e) => setFormData({ ...formData, ds_help_text: e.target.value })}
                placeholder="Texto explicativo para ajudar o usuário"
                rows={2}
              />
            </div>

            {["select", "radio", "checkbox"].includes(formData.tp_input) && (
              <div>
                <Label>Opções *</Label>
                <div className="space-y-2 mt-2">
                  {options.map((opt, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={opt}
                        onChange={(e) => updateOption(index, e.target.value)}
                        placeholder={`Opção ${index + 1}`}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeOption(index)}
                        disabled={options.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addOption}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Opção
                  </Button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nr_order">Ordem</Label>
                <Input
                  id="nr_order"
                  type="number"
                  value={formData.nr_order}
                  onChange={(e) => setFormData({ ...formData, nr_order: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="flex items-center space-x-4 pt-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="st_required"
                    checked={formData.st_required}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, st_required: checked as boolean })
                    }
                  />
                  <Label htmlFor="st_required">Obrigatória</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="st_active"
                    checked={formData.st_active}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, st_active: checked as boolean })
                    }
                  />
                  <Label htmlFor="st_active">Ativa</Label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateModalOpen(false);
                setEditModalOpen(false);
                resetForm();
              }}
            >
              Cancelar
            </Button>
            <Button onClick={createModalOpen ? handleCreate : handleEdit}>
              {createModalOpen ? "Criar" : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Pergunta</DialogTitle>
          </DialogHeader>

          {selectedQuestion && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">Tipo de Parceiro</Label>
                  <p className="font-semibold">
                    {PARTNER_TYPES.find((t) => t.value === selectedQuestion.tp_partner)?.label}
                  </p>
                </div>

                <div>
                  <Label className="text-gray-600">Tipo de Input</Label>
                  <p className="font-semibold">
                    {INPUT_TYPES.find((t) => t.value === selectedQuestion.tp_input)?.label}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-gray-600">Pergunta</Label>
                <p className="font-semibold">{selectedQuestion.nm_question}</p>
              </div>

              {selectedQuestion.ds_placeholder && (
                <div>
                  <Label className="text-gray-600">Placeholder</Label>
                  <p>{selectedQuestion.ds_placeholder}</p>
                </div>
              )}

              {selectedQuestion.ds_help_text && (
                <div>
                  <Label className="text-gray-600">Texto de Ajuda</Label>
                  <p className="italic">{selectedQuestion.ds_help_text}</p>
                </div>
              )}

              {selectedQuestion.ds_options && (
                <div>
                  <Label className="text-gray-600">Opções</Label>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    {selectedQuestion.ds_options.options.map((opt, i) => (
                      <li key={i}>{opt}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div>
                  <Label className="text-gray-600">Ordem</Label>
                  <p className="font-semibold">{selectedQuestion.nr_order}</p>
                </div>

                <div>
                  <Label className="text-gray-600">Obrigatória</Label>
                  <p className="font-semibold">{selectedQuestion.st_required ? "Sim" : "Não"}</p>
                </div>

                <div>
                  <Label className="text-gray-600">Status</Label>
                  <Badge variant={selectedQuestion.st_active ? "default" : "secondary"}>
                    {selectedQuestion.st_active ? "Ativa" : "Inativa"}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deletar Pergunta</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja deletar esta pergunta? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>

          {selectedQuestion && (
            <div className="py-4">
              <p className="font-semibold text-gray-900">{selectedQuestion.nm_question}</p>
              <p className="text-sm text-gray-600 mt-1">
                Tipo: {PARTNER_TYPES.find((t) => t.value === selectedQuestion.tp_partner)?.label}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Deletar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
