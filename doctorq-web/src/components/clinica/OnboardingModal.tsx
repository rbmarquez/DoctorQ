"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  X,
  ArrowRight,
  Building2,
  Users,
  Calendar,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

interface OnboardingStep {
  step_type: string;
  title: string;
  description?: string;
  order: number;
  required: boolean;
  estimated_minutes?: number;
}

interface OnboardingData {
  flow: {
    id_flow: string;
    nm_flow: string;
    ds_flow: string;
    ds_steps: OnboardingStep[];
  };
  progress: {
    id_progress: string;
    nm_status: string;
    nr_progress_percentage: number;
    nm_current_step?: string;
    ds_completed_steps: string[];
  };
  current_step?: OnboardingStep;
  next_steps: OnboardingStep[];
}

interface OnboardingModalProps {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OnboardingModal({ userId, open, onOpenChange }: OnboardingModalProps) {
  const router = useRouter();
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [clinicName, setClinicName] = useState("");

  // Buscar dados do usuário/empresa
  useEffect(() => {
    if (open && userId) {
      fetchUserData();
      fetchOnboardingData();
    }
  }, [open, userId]);

  const fetchUserData = async () => {
    try {
      // Buscar dados do usuário para pegar nome da empresa/clínica
      const userResponse = await fetch(`/api/users/${userId}`);
      if (userResponse.ok) {
        const userData = await userResponse.json();
        // Tentar buscar nome da empresa
        if (userData.id_empresa) {
          const empresaResponse = await fetch(`/api/empresas/${userData.id_empresa}`);
          if (empresaResponse.ok) {
            const empresaData = await empresaResponse.json();
            const nome = empresaData.nm_razao_social || empresaData.nm_fantasia || "";
            setClinicName(nome);
            setFormData(prev => ({ ...prev, clinica_nome: nome }));
          }
        }
      }
    } catch (error) {
      console.error("Erro ao buscar dados do usuário:", error);
    }
  };

  const fetchOnboardingData = async () => {
    try {
      const response = await fetch(`/api/onboarding/dashboard/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setOnboardingData(data);
      } else {
        // TODO: Remover quando backend estiver funcionando - dados mockados para teste
        console.warn("API falhou, usando dados mockados");
        setOnboardingData({
          flow: {
            id_flow: "mock-flow",
            nm_flow: "Configuração da Clínica",
            ds_flow: "Configure sua clínica em 4 passos simples",
            ds_steps: [
              {
                step_type: "account_setup",
                title: "Informações da Clínica",
                description: "Dados básicos e informações de contato",
                order: 1,
                required: true,
                estimated_minutes: 5
              },
              {
                step_type: "first_agent",
                title: "Horários e Agendamentos",
                description: "Configure o horário de funcionamento e regras",
                order: 2,
                required: true,
                estimated_minutes: 5
              },
              {
                step_type: "first_conversation",
                title: "Notificações e Pagamento",
                description: "Configure notificações e formas de pagamento",
                order: 3,
                required: true,
                estimated_minutes: 5
              },
              {
                step_type: "install_template",
                title: "Privacidade e Aparência",
                description: "Configure privacidade e personalize a interface",
                order: 4,
                required: false,
                estimated_minutes: 3
              }
            ]
          },
          progress: {
            id_progress: "mock-progress",
            nm_status: "in_progress",
            nr_progress_percentage: 0,
            ds_completed_steps: []
          },
          current_step: {
            step_type: "account_setup",
            title: "Informações da Clínica",
            description: "Dados básicos e informações de contato",
            order: 1,
            required: true,
            estimated_minutes: 5
          },
          next_steps: [
            {
              step_type: "first_agent",
              title: "Horários e Agendamentos",
              description: "Configure o horário de funcionamento e regras",
              order: 2,
              required: true,
              estimated_minutes: 5
            }
          ]
        });
      }
    } catch (error) {
      console.error("Erro ao buscar onboarding:", error);
    }
  };

  const handleClose = () => {
    if (dontShowAgain) {
      // Salvar no localStorage para não mostrar mais
      localStorage.setItem(`onboarding_dismissed_${userId}`, "true");
    }
    onOpenChange(false);
  };

  const handleSkip = () => {
    handleClose();
  };

  const handleCompleteStep = async () => {
    if (!onboardingData?.current_step) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/onboarding/complete-step/${onboardingData.flow.id_flow}?user_id=${userId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            step_type: onboardingData.current_step.step_type,
            data: formData,
          }),
        }
      );

      if (response.ok) {
        toast.success("Etapa concluída!");
        await fetchOnboardingData();

        // Se completou todas as etapas, fechar modal
        if (onboardingData.progress.nr_progress_percentage === 100) {
          toast.success("Onboarding concluído! Bem-vindo à DoctorQ!");
          handleClose();
        } else {
          setCurrentStepIndex(currentStepIndex + 1);
          setFormData({});
        }
      } else {
        toast.error("Erro ao completar etapa");
      }
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro ao completar etapa");
    } finally {
      setIsLoading(false);
    }
  };

  if (!onboardingData) return null;

  const { current_step, progress, flow } = onboardingData;
  const progressPercentage = progress.nr_progress_percentage || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {flow.nm_flow}
              </DialogTitle>
              <DialogDescription className="mt-2">
                {flow.ds_flow}
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="rounded-full"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700">Progresso Geral</span>
            <span className="font-bold text-blue-600">{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <p className="text-xs text-gray-500">
            {progress.ds_completed_steps.length} de {flow.ds_steps.length} etapas concluídas
          </p>
        </div>

        {/* Current Step */}
        {current_step && (
          <div className="mt-6 space-y-4">
            <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900">{current_step.title}</h3>
                {current_step.description && (
                  <p className="mt-1 text-sm text-gray-600">{current_step.description}</p>
                )}
                {current_step.estimated_minutes && (
                  <p className="mt-2 text-xs text-gray-500">
                    ⏱️ Tempo estimado: {current_step.estimated_minutes} minutos
                  </p>
                )}
              </div>
            </div>

            {/* Dynamic Form Fields Based on Step Type */}
            <div className="space-y-4">
              {renderStepForm(current_step.step_type, formData, setFormData)}
            </div>
          </div>
        )}

        {/* Completed Message */}
        {progressPercentage === 100 && (
          <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-6 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
            <h3 className="mt-3 font-bold text-gray-900">Parabéns! Onboarding Concluído!</h3>
            <p className="mt-2 text-sm text-gray-600">
              Você está pronto para aproveitar todas as funcionalidades da DoctorQ.
            </p>
          </div>
        )}

        <DialogFooter className="flex-col gap-3 sm:flex-col">
          <div className="flex items-center gap-2">
            <Checkbox
              id="dont-show"
              checked={dontShowAgain}
              onCheckedChange={(checked) => setDontShowAgain(checked as boolean)}
            />
            <label
              htmlFor="dont-show"
              className="text-sm text-gray-600 cursor-pointer select-none"
            >
              Não mostrar novamente
            </label>
          </div>

          <div className="flex w-full gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleSkip}
            >
              Pular por Agora
            </Button>

            {current_step && progressPercentage < 100 && (
              <Button
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                onClick={handleCompleteStep}
                disabled={isLoading}
              >
                {isLoading ? "Salvando..." : "Continuar"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}

            {progressPercentage === 100 && (
              <Button
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                onClick={handleClose}
              >
                Começar a Usar
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Helper function to render form fields based on step type
function renderStepForm(
  stepType: string,
  formData: Record<string, string>,
  setFormData: React.Dispatch<React.SetStateAction<Record<string, string>>>
) {
  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  switch (stepType) {
    case "account_setup":
      return (
        <>
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Informações Básicas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome da Clínica *</Label>
                <Input
                  value={formData.clinica_nome || ""}
                  onChange={(e) => updateField('clinica_nome', e.target.value)}
                  placeholder="Digite o nome da sua clínica"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>CNPJ</Label>
                <Input
                  value={formData.cnpj || ""}
                  onChange={(e) => updateField('cnpj', e.target.value)}
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone *</Label>
                <Input
                  value={formData.telefone || ""}
                  onChange={(e) => updateField('telefone', e.target.value)}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                />
              </div>
              <div className="space-y-2">
                <Label>E-mail *</Label>
                <Input
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="contato@clinica.com.br"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Website</Label>
                <Input
                  value={formData.website || ""}
                  onChange={(e) => updateField('website', e.target.value)}
                  placeholder="https://www.suaclinica.com.br"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold text-sm text-gray-700">Endereço da Clínica</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>CEP *</Label>
                <Input
                  value={formData.cep || ""}
                  onChange={(e) => updateField('cep', e.target.value)}
                  placeholder="00000-000"
                  maxLength={9}
                />
                <p className="text-xs text-gray-500">Preencha o CEP para buscar automaticamente</p>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Logradouro *</Label>
                <Input
                  value={formData.logradouro || ""}
                  onChange={(e) => updateField('logradouro', e.target.value)}
                  placeholder="Rua, Avenida, etc."
                />
              </div>
              <div className="space-y-2">
                <Label>Número *</Label>
                <Input
                  value={formData.numero || ""}
                  onChange={(e) => updateField('numero', e.target.value)}
                  placeholder="123"
                />
              </div>
              <div className="space-y-2">
                <Label>Complemento</Label>
                <Input
                  value={formData.complemento || ""}
                  onChange={(e) => updateField('complemento', e.target.value)}
                  placeholder="Sala, Andar, etc."
                />
              </div>
              <div className="space-y-2">
                <Label>Bairro *</Label>
                <Input
                  value={formData.bairro || ""}
                  onChange={(e) => updateField('bairro', e.target.value)}
                  placeholder="Bairro"
                />
              </div>
              <div className="space-y-2">
                <Label>Cidade *</Label>
                <Input
                  value={formData.cidade || ""}
                  onChange={(e) => updateField('cidade', e.target.value)}
                  placeholder="Cidade"
                />
              </div>
              <div className="space-y-2">
                <Label>Estado *</Label>
                <Input
                  value={formData.estado || ""}
                  onChange={(e) => updateField('estado', e.target.value)}
                  placeholder="UF"
                  maxLength={2}
                />
              </div>
            </div>
          </div>
        </>
      );

    case "team_setup":
      return (
        <>
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Equipe de Profissionais
            </h3>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm text-blue-800">
                💡 <strong>Dica:</strong> Você poderá adicionar profissionais completos (com CRM, especialidade, foto)
                na seção de Configurações após concluir o onboarding.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantos profissionais trabalham na clínica? *</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.num_profissionais || ""}
                  onChange={(e) => updateField('num_profissionais', e.target.value)}
                  placeholder="Ex: 5"
                />
              </div>
              <div className="space-y-2">
                <Label>Quantas salas de atendimento? *</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.num_salas || ""}
                  onChange={(e) => updateField('num_salas', e.target.value)}
                  placeholder="Ex: 3"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Principais especialidades da equipe</Label>
                <Input
                  value={formData.especialidades_equipe || ""}
                  onChange={(e) => updateField('especialidades_equipe', e.target.value)}
                  placeholder="Ex: Dermatologia, Estética Facial, Harmonização, Biomédica"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Principal profissional responsável</Label>
                <Input
                  value={formData.profissional_responsavel || ""}
                  onChange={(e) => updateField('profissional_responsavel', e.target.value)}
                  placeholder="Nome do profissional responsável pela clínica"
                />
              </div>
            </div>
          </div>
        </>
      );

    case "schedule_setup":
      return (
        <>
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Horários de Funcionamento
            </h3>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm text-blue-800">
                💡 <strong>Dica:</strong> Configure os horários gerais agora. Você poderá definir horários específicos
                por profissional e dias da semana nas Configurações.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label>Dias de Funcionamento *</Label>
                <Input
                  value={formData.dias_funcionamento || ""}
                  onChange={(e) => updateField('dias_funcionamento', e.target.value)}
                  placeholder="Ex: Segunda a Sexta, Segunda a Sábado"
                />
              </div>
              <div className="space-y-2">
                <Label>Horário de Funcionamento *</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-600">Abertura</Label>
                    <Input
                      type="time"
                      value={formData.horario_abertura || ""}
                      onChange={(e) => updateField('horario_abertura', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-600">Fechamento</Label>
                    <Input
                      type="time"
                      value={formData.horario_fechamento || ""}
                      onChange={(e) => updateField('horario_fechamento', e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Duração Média dos Atendimentos (minutos) *</Label>
                <Input
                  type="number"
                  min="15"
                  step="15"
                  value={formData.duracao_media_atendimento || ""}
                  onChange={(e) => updateField('duracao_media_atendimento', e.target.value)}
                  placeholder="Ex: 30, 45, 60"
                />
                <p className="text-xs text-gray-500">
                  Tempo médio para agendamentos (pode ser ajustado por procedimento depois)
                </p>
              </div>
              <div className="space-y-2">
                <Label>Intervalo entre Consultas (minutos)</Label>
                <Input
                  type="number"
                  min="0"
                  step="5"
                  value={formData.intervalo_consultas || ""}
                  onChange={(e) => updateField('intervalo_consultas', e.target.value)}
                  placeholder="Ex: 0, 5, 10, 15"
                />
                <p className="text-xs text-gray-500">
                  Tempo de folga entre atendimentos (opcional)
                </p>
              </div>
            </div>
          </div>
        </>
      );

    case "services_setup":
      return (
        <>
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Procedimentos e Serviços
            </h3>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm text-blue-800">
                💡 <strong>Dica:</strong> Liste os principais procedimentos agora. Você poderá cadastrar cada um em detalhes
                (com preços, duração, descrição) na seção de Procedimentos.
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Categorias de Procedimentos *</Label>
                <Input
                  value={formData.categorias_procedimentos || ""}
                  onChange={(e) => updateField('categorias_procedimentos', e.target.value)}
                  placeholder="Ex: Estética Facial, Corporal, Harmonização, Lasers"
                />
                <p className="text-xs text-gray-500">
                  Principais categorias de serviços oferecidos (separe por vírgula)
                </p>
              </div>
              <div className="space-y-2">
                <Label>Principais Procedimentos Oferecidos *</Label>
                <Textarea
                  value={formData.procedimentos || ""}
                  onChange={(e) => updateField('procedimentos', e.target.value)}
                  placeholder="Ex: Botox, Preenchimento Labial, Laser Fracionado, Peeling Químico, Limpeza de Pele Profunda, Microagulhamento, Harmonização Facial, Lipoescultura não cirúrgica, etc."
                  rows={5}
                />
                <p className="text-xs text-gray-500">
                  Liste os principais tratamentos e procedimentos (um por linha ou separados por vírgula)
                </p>
              </div>
              <div className="space-y-2">
                <Label>Faixa de Preço Média dos Procedimentos</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-600">Mínimo (R$)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="50"
                      value={formData.preco_minimo || ""}
                      onChange={(e) => updateField('preco_minimo', e.target.value)}
                      placeholder="Ex: 150"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-600">Máximo (R$)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="50"
                      value={formData.preco_maximo || ""}
                      onChange={(e) => updateField('preco_maximo', e.target.value)}
                      placeholder="Ex: 3000"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Faixa de preço geral dos seus procedimentos (opcional)
                </p>
              </div>
              <div className="space-y-2">
                <Label>Formas de Pagamento Aceitas</Label>
                <Input
                  value={formData.formas_pagamento || ""}
                  onChange={(e) => updateField('formas_pagamento', e.target.value)}
                  placeholder="Ex: Dinheiro, Cartão (débito/crédito), PIX, Parcelamento"
                />
              </div>
            </div>
          </div>
        </>
      );

    default:
      return (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
          <p className="text-sm text-gray-600">
            Clique em &quot;Continuar&quot; para avançar para a próxima etapa.
          </p>
        </div>
      );
  }
}
