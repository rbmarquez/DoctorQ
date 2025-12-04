"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  ArrowLeft,
  Save,
  AlertTriangle,
  User,
  CheckCircle2,
  Loader2
} from "lucide-react";
import {
  useAnamneseTemplates,
  useAnamneseTemplate,
  createAnamnese,
  PerguntaAnamnese,
  RespostaAnamnese
} from "@/lib/api/hooks/useAnamneses";
import { toast } from "sonner";

export default function NovaAnamnesePage() {
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [idPaciente, setIdPaciente] = useState<string>("");
  const [respostas, setRespostas] = useState<Record<string, any>>({});
  const [observacoes, setObservacoes] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const { data: templatesData } = useAnamneseTemplates({ apenas_ativos: true, size: 100 });
  const { data: template } = useAnamneseTemplate(selectedTemplate);

  const templates = templatesData?.items || [];
  const perguntas = template?.ds_perguntas?.sort((a, b) => a.nr_ordem - b.nr_ordem) || [];

  const handleRespostaChange = (id_pergunta: string, value: any) => {
    setRespostas((prev) => ({ ...prev, [id_pergunta]: value }));
  };

  const validateForm = (): boolean => {
    if (!idPaciente) {
      toast.error("Selecione um paciente");
      return false;
    }

    if (!selectedTemplate) {
      toast.error("Selecione um template de anamnese");
      return false;
    }

    // Validar perguntas obrigatórias
    for (const pergunta of perguntas) {
      if (pergunta.fg_obrigatoria) {
        const resposta = respostas[pergunta.id_pergunta];
        if (
          resposta === undefined ||
          resposta === null ||
          resposta === "" ||
          (Array.isArray(resposta) && resposta.length === 0)
        ) {
          toast.error(`A pergunta "${pergunta.nm_pergunta}" é obrigatória`);
          return false;
        }
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSaving(true);
    try {
      const ds_respostas: RespostaAnamnese[] = Object.entries(respostas).map(([id_pergunta, vl_resposta]) => ({
        id_pergunta,
        vl_resposta,
      }));

      const anamnese = await createAnamnese({
        id_paciente: idPaciente,
        id_template: selectedTemplate,
        ds_respostas,
        ds_observacoes: observacoes || undefined,
      });

      toast.success("Anamnese criada com sucesso!");
      router.push(`/profissional/anamneses/${anamnese.id_anamnese}`);
    } catch (error: any) {
      console.error("Erro ao criar anamnese:", error);
      toast.error(error.response?.data?.detail || "Erro ao criar anamnese");
    } finally {
      setSaving(false);
    }
  };

  const renderPergunta = (pergunta: PerguntaAnamnese) => {
    const value = respostas[pergunta.id_pergunta];

    switch (pergunta.tp_resposta) {
      case "text":
        return (
          <Input
            value={value || ""}
            onChange={(e) => handleRespostaChange(pergunta.id_pergunta, e.target.value)}
            placeholder="Digite sua resposta..."
            required={pergunta.fg_obrigatoria}
          />
        );

      case "textarea":
        return (
          <Textarea
            value={value || ""}
            onChange={(e) => handleRespostaChange(pergunta.id_pergunta, e.target.value)}
            placeholder="Digite sua resposta..."
            rows={4}
            required={pergunta.fg_obrigatoria}
          />
        );

      case "number":
        return (
          <Input
            type="number"
            value={value || ""}
            onChange={(e) => handleRespostaChange(pergunta.id_pergunta, parseFloat(e.target.value))}
            placeholder="Digite um número..."
            min={pergunta.vl_minimo}
            max={pergunta.vl_maximo}
            required={pergunta.fg_obrigatoria}
          />
        );

      case "date":
        return (
          <Input
            type="date"
            value={value || ""}
            onChange={(e) => handleRespostaChange(pergunta.id_pergunta, e.target.value)}
            required={pergunta.fg_obrigatoria}
          />
        );

      case "select":
        return (
          <Select value={value || ""} onValueChange={(val) => handleRespostaChange(pergunta.id_pergunta, val)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma opção..." />
            </SelectTrigger>
            <SelectContent>
              {pergunta.ds_opcoes?.map((opcao) => (
                <SelectItem key={opcao} value={opcao}>
                  {opcao}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "radio":
        return (
          <RadioGroup value={value || ""} onValueChange={(val) => handleRespostaChange(pergunta.id_pergunta, val)}>
            {pergunta.ds_opcoes?.map((opcao) => (
              <div key={opcao} className="flex items-center space-x-2">
                <RadioGroupItem value={opcao} id={`${pergunta.id_pergunta}-${opcao}`} />
                <Label htmlFor={`${pergunta.id_pergunta}-${opcao}`}>{opcao}</Label>
              </div>
            ))}
          </RadioGroup>
        );

      case "checkbox":
      case "multiselect":
        return (
          <div className="space-y-2">
            {pergunta.ds_opcoes?.map((opcao) => {
              const checked = Array.isArray(value) ? value.includes(opcao) : false;
              return (
                <div key={opcao} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${pergunta.id_pergunta}-${opcao}`}
                    checked={checked}
                    onCheckedChange={(checked) => {
                      const currentValue = Array.isArray(value) ? value : [];
                      const newValue = checked
                        ? [...currentValue, opcao]
                        : currentValue.filter((v) => v !== opcao);
                      handleRespostaChange(pergunta.id_pergunta, newValue);
                    }}
                  />
                  <Label htmlFor={`${pergunta.id_pergunta}-${opcao}`}>{opcao}</Label>
                </div>
              );
            })}
          </div>
        );

      case "boolean":
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={pergunta.id_pergunta}
              checked={value || false}
              onCheckedChange={(checked) => handleRespostaChange(pergunta.id_pergunta, checked)}
            />
            <Label htmlFor={pergunta.id_pergunta}>Sim, concordo</Label>
          </div>
        );

      default:
        return <p className="text-sm text-muted-foreground">Tipo de resposta não suportado</p>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/profissional/anamneses">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-2 mt-2">
            <FileText className="h-8 w-8" />
            Nova Anamnese
          </h1>
          <p className="text-muted-foreground mt-1">
            Preencha o questionário pré-atendimento para o paciente
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Seleção de Paciente e Template */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informações Iniciais
            </CardTitle>
            <CardDescription>Selecione o paciente e o tipo de anamnese</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="paciente">Paciente *</Label>
              <Input
                id="paciente"
                placeholder="ID do paciente (UUID)..."
                value={idPaciente}
                onChange={(e) => setIdPaciente(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Informe o ID (UUID) do paciente. Em produção, use um seletor com busca.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="template">Template de Anamnese *</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger id="template">
                  <SelectValue placeholder="Selecione um template..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id_template} value={t.id_template}>
                      {t.nm_template} ({t.tp_template})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {template && (
                <p className="text-sm text-muted-foreground">{template.ds_template}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Perguntas */}
        {selectedTemplate && perguntas.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Questionário
              </CardTitle>
              <CardDescription>
                Preencha todas as perguntas. Os campos marcados com * são obrigatórios.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {perguntas.map((pergunta, idx) => (
                <div key={pergunta.id_pergunta} className="space-y-2 p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <Label htmlFor={pergunta.id_pergunta} className="text-base font-medium">
                      {idx + 1}. {pergunta.nm_pergunta}
                      {pergunta.fg_obrigatoria && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    {pergunta.fg_obrigatoria && (
                      <Badge variant="secondary" className="text-xs">Obrigatória</Badge>
                    )}
                  </div>

                  {pergunta.ds_ajuda && (
                    <p className="text-sm text-muted-foreground">{pergunta.ds_ajuda}</p>
                  )}

                  {renderPergunta(pergunta)}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Observações */}
        <Card>
          <CardHeader>
            <CardTitle>Observações Adicionais</CardTitle>
            <CardDescription>Informações complementares (opcional)</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Digite observações adicionais..."
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Link href="/profissional/anamneses">
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" disabled={saving} className="gap-2">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Salvar Anamnese
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
