"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Plus, Trash2, UserPlus, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Profissional {
  id: string;
  nm_profissional: string;
  nr_registro: string;
  ds_especialidade: string;
  ds_email: string;
  nr_telefone: string;
  // Indica se já foi salvo no backend
  saved?: boolean;
  // ID real do profissional no backend (após salvar)
  id_profissional?: string;
}

interface ProfissionaisFormProps {
  formData: Record<string, any>;
  onChange: (field: string, value: any) => void;
}

export function ProfissionaisForm({ formData, onChange }: ProfissionaisFormProps) {
  const [profissionais, setProfissionais] = useState<Profissional[]>(
    formData.profissionais || []
  );
  const [salvandoProfissional, setSalvandoProfissional] = useState<string | null>(null);

  const salvarProfissionalComUsuario = async (profissional: Profissional) => {
    // Validar campos obrigatórios
    if (!profissional.nm_profissional || !profissional.ds_especialidade) {
      toast.error("Preencha nome e especialidade do profissional");
      return;
    }

    // Validar email se fornecido
    if (profissional.ds_email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(profissional.ds_email)) {
        toast.error("Email inválido");
        return;
      }
    }

    setSalvandoProfissional(profissional.id);

    try {
      // Durante o onboarding, apenas marcamos como salvo localmente
      // Os profissionais serão criados no backend quando o step for completado
      const updated = profissionais.map((p) =>
        p.id === profissional.id
          ? { ...p, saved: true }
          : p
      );
      setProfissionais(updated);
      onChange("profissionais", updated);

      toast.success("Profissional adicionado! Será criado ao avançar para a próxima etapa.");
    } catch (error: any) {
      console.error("Erro ao salvar profissional:", error);
      toast.error(error.message || "Erro ao salvar profissional");
    } finally {
      setSalvandoProfissional(null);
    }
  };

  const addProfissional = () => {
    const newProfissional: Profissional = {
      id: Date.now().toString(),
      nm_profissional: "",
      nr_registro: "",
      ds_especialidade: "",
      ds_email: "",
      nr_telefone: "",
    };
    const updated = [...profissionais, newProfissional];
    setProfissionais(updated);
    onChange('profissionais', updated);
  };

  const removeProfissional = (id: string) => {
    const updated = profissionais.filter((p) => p.id !== id);
    setProfissionais(updated);
    onChange('profissionais', updated);
  };

  const updateProfissional = (id: string, field: keyof Profissional, value: string) => {
    const updated = profissionais.map((p) =>
      p.id === id ? { ...p, [field]: value } : p
    );
    setProfissionais(updated);
    onChange('profissionais', updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Equipe de Profissionais
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Adicione os profissionais que trabalham na clínica
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addProfissional}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Adicionar Profissional
        </Button>
      </div>

      {profissionais.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <UserPlus className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Nenhum profissional cadastrado
              </h4>
              <p className="text-sm text-gray-500 mb-4">
                Clique em &quot;Adicionar Profissional&quot; para começar
              </p>
              <Button
                type="button"
                onClick={addProfissional}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Adicionar Primeiro Profissional
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {profissionais.map((profissional, index) => (
            <Card key={profissional.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-sm">
                      Profissional #{index + 1}
                    </h4>
                    {profissional.saved && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        Salvo
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!profissional.saved && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => salvarProfissionalComUsuario(profissional)}
                        disabled={salvandoProfissional === profissional.id}
                        className="gap-1"
                      >
                        {salvandoProfissional === profissional.id ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-3 w-3" />
                            Cadastrar
                          </>
                        )}
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeProfissional(profissional.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      disabled={salvandoProfissional === profissional.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome Completo *</Label>
                    <Input
                      value={profissional.nm_profissional}
                      onChange={(e) =>
                        updateProfissional(profissional.id, "nm_profissional", e.target.value)
                      }
                      placeholder="Nome do profissional"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Registro Profissional (CRM, COREN, etc.)</Label>
                    <Input
                      value={profissional.nr_registro}
                      onChange={(e) =>
                        updateProfissional(profissional.id, "nr_registro", e.target.value)
                      }
                      placeholder="Ex: CRM 12345"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Especialidade *</Label>
                    <Select
                      value={profissional.ds_especialidade}
                      onValueChange={(value) =>
                        updateProfissional(profissional.id, "ds_especialidade", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a especialidade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Dermatologia">Dermatologia</SelectItem>
                        <SelectItem value="Estética Facial">Estética Facial</SelectItem>
                        <SelectItem value="Estética Corporal">Estética Corporal</SelectItem>
                        <SelectItem value="Harmonização Facial">Harmonização Facial</SelectItem>
                        <SelectItem value="Biomédica">Biomédica</SelectItem>
                        <SelectItem value="Fisioterapia Dermatofuncional">
                          Fisioterapia Dermatofuncional
                        </SelectItem>
                        <SelectItem value="Nutrição Estética">Nutrição Estética</SelectItem>
                        <SelectItem value="Outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>E-mail</Label>
                    <Input
                      type="email"
                      value={profissional.ds_email}
                      onChange={(e) =>
                        updateProfissional(profissional.id, "ds_email", e.target.value)
                      }
                      placeholder="profissional@email.com"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Telefone</Label>
                    <Input
                      value={profissional.nr_telefone}
                      onChange={(e) =>
                        updateProfissional(profissional.id, "nr_telefone", e.target.value)
                      }
                      placeholder="(00) 00000-0000"
                      maxLength={15}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm text-blue-800">
          <strong>💡 Dica:</strong> Preencha os dados do profissional e clique em &quot;Cadastrar&quot; para criar o acesso dele ao sistema.
          Um email será enviado com as credenciais de acesso (usuário e senha temporária).
        </p>
      </div>
    </div>
  );
}
