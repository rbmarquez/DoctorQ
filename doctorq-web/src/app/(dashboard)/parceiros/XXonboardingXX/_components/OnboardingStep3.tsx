"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Briefcase, Plus, Trash2, Clock, DollarSign } from "lucide-react";
import { toast } from "sonner";
import type { Procedimento } from "../page";

interface Props {
  data: Procedimento[];
  onUpdate: (data: Procedimento[]) => void;
}

const CATEGORIAS = [
  "Facial",
  "Corporal",
  "Capilar",
  "Injetáveis",
  "Laser",
  "Lifting",
  "Peeling",
  "Depilação",
  "Harmonização Facial",
  "Outros",
];

export default function OnboardingStep3({ data, onUpdate }: Props) {
  const [editando, setEditando] = useState<Procedimento | null>(null);

  const handleAdd = () => {
    const novoProcedimento: Procedimento = {
      id: crypto.randomUUID(),
      nm_procedimento: "",
      ds_categoria: "",
      qt_duracao: 30,
      vl_procedimento: 0,
      ds_procedimento: "",
    };
    setEditando(novoProcedimento);
  };

  const handleSave = () => {
    if (!editando) return;

    if (!editando.nm_procedimento || !editando.ds_categoria || editando.qt_duracao <= 0 || editando.vl_procedimento <= 0) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const existe = data.find((p) => p.id === editando.id);
    if (existe) {
      onUpdate(data.map((p) => (p.id === editando.id ? editando : p)));
      toast.success("Procedimento atualizado!");
    } else {
      onUpdate([...data, editando]);
      toast.success("Procedimento adicionado!");
    }
    setEditando(null);
  };

  const handleCancel = () => {
    setEditando(null);
  };

  const handleRemove = (id: string) => {
    onUpdate(data.filter((p) => p.id !== id));
    toast.success("Procedimento removido!");
  };

  const handleEdit = (procedimento: Procedimento) => {
    setEditando({ ...procedimento });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Serviços e Procedimentos
          </CardTitle>
          <CardDescription>
            Adicione os procedimentos oferecidos pela clínica (mínimo 1)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.length === 0 && !editando && (
            <div className="text-center py-8 text-muted-foreground">
              <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum procedimento cadastrado ainda</p>
              <p className="text-sm mt-2">Clique no botão abaixo para adicionar</p>
            </div>
          )}

          {/* Lista de Procedimentos */}
          <div className="space-y-3">
            {data.map((procedimento) => (
              <Card key={procedimento.id} className="border-2">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold">{procedimento.nm_procedimento}</h4>
                          <p className="text-sm text-muted-foreground">
                            {procedimento.ds_categoria}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-primary">
                            {formatCurrency(procedimento.vl_procedimento)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {procedimento.qt_duracao} min
                        </span>
                      </div>
                      {procedimento.ds_procedimento && (
                        <p className="text-sm mt-2 text-muted-foreground line-clamp-2">
                          {procedimento.ds_procedimento}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(procedimento)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemove(procedimento.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Formulário de Edição */}
          {editando && (
            <Card className="border-2 border-primary">
              <CardHeader>
                <CardTitle className="text-lg">
                  {data.find((p) => p.id === editando.id) ? "Editar" : "Novo"} Procedimento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="nm_procedimento">
                      Nome do Procedimento <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="nm_procedimento"
                      placeholder="Ex: Limpeza de Pele Profunda"
                      value={editando.nm_procedimento}
                      onChange={(e) =>
                        setEditando({ ...editando, nm_procedimento: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ds_categoria">
                      Categoria <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id="ds_categoria"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={editando.ds_categoria}
                      onChange={(e) =>
                        setEditando({ ...editando, ds_categoria: e.target.value })
                      }
                      required
                    >
                      <option value="">Selecione...</option>
                      {CATEGORIAS.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="qt_duracao" className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Duração (minutos) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="qt_duracao"
                      type="number"
                      min="5"
                      step="5"
                      placeholder="30"
                      value={editando.qt_duracao}
                      onChange={(e) =>
                        setEditando({ ...editando, qt_duracao: parseInt(e.target.value) || 0 })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="vl_procedimento" className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Valor (R$) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="vl_procedimento"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="150.00"
                      value={editando.vl_procedimento}
                      onChange={(e) =>
                        setEditando({ ...editando, vl_procedimento: parseFloat(e.target.value) || 0 })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="ds_procedimento">Descrição (opcional)</Label>
                    <Textarea
                      id="ds_procedimento"
                      placeholder="Descreva o procedimento, benefícios, indicações..."
                      rows={3}
                      value={editando.ds_procedimento}
                      onChange={(e) =>
                        setEditando({ ...editando, ds_procedimento: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={handleCancel}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSave}>Salvar Procedimento</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Botão Adicionar */}
          {!editando && (
            <Button onClick={handleAdd} className="w-full" variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Procedimento
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
