"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Users, Plus, Trash2, UserCircle, Mail, Phone } from "lucide-react";
import { toast } from "sonner";
import type { Profissional } from "../page";

interface Props {
  data: Profissional[];
  onUpdate: (data: Profissional[]) => void;
}

const ESPECIALIDADES = [
  "Dermatologia",
  "Cirurgia Plástica",
  "Estética",
  "Biomedicina Estética",
  "Fisioterapia Dermato-Funcional",
  "Enfermagem Estética",
  "Cosmetologia",
];

export default function OnboardingStep2({ data, onUpdate }: Props) {
  const [editando, setEditando] = useState<Profissional | null>(null);

  const handleAdd = () => {
    const novoProfissional: Profissional = {
      id: crypto.randomUUID(),
      nm_profissional: "",
      nr_registro: "",
      ds_especialidade: "",
      ds_email: "",
      nr_telefone: "",
      url_foto: "",
    };
    setEditando(novoProfissional);
  };

  const handleSave = () => {
    if (!editando) return;

    if (!editando.nm_profissional || !editando.nr_registro || !editando.ds_especialidade || !editando.ds_email) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const existe = data.find((p) => p.id === editando.id);
    if (existe) {
      onUpdate(data.map((p) => (p.id === editando.id ? editando : p)));
      toast.success("Profissional atualizado!");
    } else {
      onUpdate([...data, editando]);
      toast.success("Profissional adicionado!");
    }
    setEditando(null);
  };

  const handleCancel = () => {
    setEditando(null);
  };

  const handleRemove = (id: string) => {
    onUpdate(data.filter((p) => p.id !== id));
    toast.success("Profissional removido!");
  };

  const handleEdit = (profissional: Profissional) => {
    setEditando({ ...profissional });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Equipe de Profissionais
          </CardTitle>
          <CardDescription>
            Adicione os profissionais que atendem na clínica (mínimo 1)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.length === 0 && !editando && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum profissional adicionado ainda</p>
              <p className="text-sm mt-2">Clique no botão abaixo para começar</p>
            </div>
          )}

          {/* Lista de Profissionais */}
          <div className="space-y-3">
            {data.map((profissional) => (
              <Card key={profissional.id} className="border-2">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <UserCircle className="w-8 h-8 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{profissional.nm_profissional}</h4>
                        <p className="text-sm text-muted-foreground">
                          {profissional.ds_especialidade} - {profissional.nr_registro}
                        </p>
                        <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {profissional.ds_email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {profissional.nr_telefone}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(profissional)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemove(profissional.id)}
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
                  {data.find((p) => p.id === editando.id) ? "Editar" : "Novo"} Profissional
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nm_profissional">
                      Nome Completo <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="nm_profissional"
                      placeholder="Dr. João Silva"
                      value={editando.nm_profissional}
                      onChange={(e) =>
                        setEditando({ ...editando, nm_profissional: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nr_registro">
                      CRM/Registro <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="nr_registro"
                      placeholder="CRM 12345/SP"
                      value={editando.nr_registro}
                      onChange={(e) =>
                        setEditando({ ...editando, nr_registro: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ds_especialidade">
                      Especialidade <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id="ds_especialidade"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={editando.ds_especialidade}
                      onChange={(e) =>
                        setEditando({ ...editando, ds_especialidade: e.target.value })
                      }
                      required
                    >
                      <option value="">Selecione...</option>
                      {ESPECIALIDADES.map((esp) => (
                        <option key={esp} value={esp}>
                          {esp}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ds_email">
                      E-mail <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="ds_email"
                      type="email"
                      placeholder="profissional@email.com"
                      value={editando.ds_email}
                      onChange={(e) =>
                        setEditando({ ...editando, ds_email: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nr_telefone">Telefone</Label>
                    <Input
                      id="nr_telefone"
                      placeholder="(00) 00000-0000"
                      value={editando.nr_telefone}
                      onChange={(e) =>
                        setEditando({ ...editando, nr_telefone: e.target.value })
                      }
                      maxLength={15}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="url_foto">Foto (opcional)</Label>
                    <div className="border-2 border-dashed rounded-lg p-4 text-center text-sm text-muted-foreground">
                      Upload de foto em breve
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={handleCancel}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSave}>Salvar Profissional</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Botão Adicionar */}
          {!editando && (
            <Button onClick={handleAdd} className="w-full" variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Profissional
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
