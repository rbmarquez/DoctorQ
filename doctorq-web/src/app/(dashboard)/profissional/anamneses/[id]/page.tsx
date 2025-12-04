"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  FileText,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  User,
  Calendar,
  Loader2,
  Save,
  FileSignature
} from "lucide-react";
import {
  useAnamnese,
  useAnamneseTemplate,
  updateAnamnese,
  assinarAnamneseProfissional,
  desativarAnamnese
} from "@/lib/api/hooks/useAnamneses";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export default function AnamneseDetalhesPage() {
  const params = useParams();
  const router = useRouter();
  const id_anamnese = params.id as string;

  const [observacoes, setObservacoes] = useState<string>("");
  const [nmAssinatura, setNmAssinatura] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [signing, setSigning] = useState(false);

  const { data: anamnese, error, mutate } = useAnamnese(id_anamnese);
  const { data: template } = useAnamneseTemplate(anamnese?.id_template);

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>
            Erro ao carregar anamnese. Verifique se o ID está correto.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!anamnese || !template) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  const perguntas = template.ds_perguntas.sort((a, b) => a.nr_ordem - b.nr_ordem);

  const handleSaveObservacoes = async () => {
    setSaving(true);
    try {
      await updateAnamnese(id_anamnese, { ds_observacoes: observacoes });
      await mutate();
      toast.success("Observações salvas com sucesso!");
      setObservacoes("");
    } catch (error: any) {
      console.error("Erro ao salvar observações:", error);
      toast.error(error.response?.data?.detail || "Erro ao salvar observações");
    } finally {
      setSaving(false);
    }
  };

  const handleAssinar = async () => {
    if (!nmAssinatura.trim()) {
      toast.error("Digite seu nome completo para assinar");
      return;
    }

    setSigning(true);
    try {
      await assinarAnamneseProfissional(id_anamnese, { nm_assinatura: nmAssinatura });
      await mutate();
      toast.success("Anamnese assinada com sucesso!");
      setNmAssinatura("");
    } catch (error: any) {
      console.error("Erro ao assinar anamnese:", error);
      toast.error(error.response?.data?.detail || "Erro ao assinar anamnese");
    } finally {
      setSigning(false);
    }
  };

  const handleDesativar = async () => {
    if (!confirm("Tem certeza que deseja desativar esta anamnese? Esta ação não pode ser desfeita.")) {
      return;
    }

    try {
      await desativarAnamnese(id_anamnese);
      toast.success("Anamnese desativada com sucesso!");
      router.push("/profissional/anamneses");
    } catch (error: any) {
      console.error("Erro ao desativar anamnese:", error);
      toast.error(error.response?.data?.detail || "Erro ao desativar anamnese");
    }
  };

  const getResposta = (id_pergunta: string) => {
    const resposta = anamnese.ds_respostas.find((r: any) => r.id_pergunta === id_pergunta);
    return resposta ? resposta.vl_resposta : null;
  };

  const formatResposta = (valor: any): string => {
    if (valor === null || valor === undefined) return "-";
    if (typeof valor === "boolean") return valor ? "Sim" : "Não";
    if (Array.isArray(valor)) return valor.join(", ");
    return String(valor);
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
            Detalhes da Anamnese
          </h1>
          <p className="text-muted-foreground mt-1">
            Revise as respostas do paciente e adicione observações
          </p>
        </div>

        {anamnese.fg_ativo && (
          <Button variant="destructive" onClick={handleDesativar}>
            Desativar Anamnese
          </Button>
        )}
      </div>

      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Template</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold">{template.nm_template}</p>
            <Badge variant="outline" className="mt-2">{template.tp_template}</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Data de Criação</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {format(new Date(anamnese.dt_criacao), "dd/MM/yyyy HH:mm", { locale: ptBR })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Assinatura Paciente</CardTitle>
          </CardHeader>
          <CardContent>
            {anamnese.dt_assinatura_paciente ? (
              <>
                <p className="font-semibold text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  Assinado
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {anamnese.nm_assinatura_paciente}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(anamnese.dt_assinatura_paciente), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </p>
              </>
            ) : (
              <p className="font-semibold text-orange-600">Pendente</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Assinatura Profissional</CardTitle>
          </CardHeader>
          <CardContent>
            {anamnese.dt_assinatura_profissional ? (
              <>
                <p className="font-semibold text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  Assinado
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {anamnese.nm_assinatura_profissional}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(anamnese.dt_assinatura_profissional), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </p>
              </>
            ) : (
              <p className="font-semibold text-orange-600">Pendente</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alertas Críticos */}
      {anamnese.fg_alertas_criticos && anamnese.ds_alertas && anamnese.ds_alertas.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-5 w-5" />
          <AlertDescription>
            <strong className="text-lg">⚠️ Alertas Críticos Identificados</strong>
            <ul className="list-disc list-inside mt-3 space-y-2">
              {anamnese.ds_alertas.map((alerta: any, idx: number) => (
                <li key={idx} className="text-sm">
                  <strong>{alerta.nm_alerta}:</strong> {alerta.ds_alerta}
                  {alerta.tp_alerta === "critico" && (
                    <Badge variant="destructive" className="ml-2">Crítico</Badge>
                  )}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Respostas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Respostas do Questionário
          </CardTitle>
          <CardDescription>
            Respostas fornecidas pelo paciente ({anamnese.ds_respostas.length} perguntas respondidas)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {perguntas.map((pergunta, idx) => {
            const resposta = getResposta(pergunta.id_pergunta);
            return (
              <div key={pergunta.id_pergunta} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <Label className="text-base font-semibold">
                    {idx + 1}. {pergunta.nm_pergunta}
                  </Label>
                  {pergunta.fg_obrigatoria && (
                    <Badge variant="secondary" className="text-xs">Obrigatória</Badge>
                  )}
                </div>
                {pergunta.ds_ajuda && (
                  <p className="text-sm text-muted-foreground mb-2">{pergunta.ds_ajuda}</p>
                )}
                <div className="mt-2 p-3 bg-muted rounded-md">
                  <p className="font-medium">{formatResposta(resposta)}</p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Observações Existentes */}
      {anamnese.ds_observacoes && (
        <Card>
          <CardHeader>
            <CardTitle>Observações Registradas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-muted rounded-lg">
              <p className="whitespace-pre-wrap">{anamnese.ds_observacoes}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Adicionar Observações */}
      <Card>
        <CardHeader>
          <CardTitle>Adicionar Observações</CardTitle>
          <CardDescription>
            Registre informações complementares sobre a anamnese
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Digite observações adicionais..."
            rows={4}
          />
          <Button onClick={handleSaveObservacoes} disabled={saving || !observacoes.trim()} className="gap-2">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Salvar Observações
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Assinatura Profissional */}
      {!anamnese.dt_assinatura_profissional && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSignature className="h-5 w-5" />
              Assinar Anamnese
            </CardTitle>
            <CardDescription>
              Ao assinar, você confirma que revisou e validou as informações da anamnese
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="assinatura">Nome Completo *</Label>
              <Input
                id="assinatura"
                value={nmAssinatura}
                onChange={(e) => setNmAssinatura(e.target.value)}
                placeholder="Digite seu nome completo..."
              />
            </div>
            <Button
              onClick={handleAssinar}
              disabled={signing || !nmAssinatura.trim()}
              className="gap-2"
              variant="default"
            >
              {signing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Assinando...
                </>
              ) : (
                <>
                  <FileSignature className="h-4 w-4" />
                  Assinar Anamnese
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
