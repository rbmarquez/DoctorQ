"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, Save, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { ProfessionalInfoForm } from "./_components/ProfessionalInfoForm";
import { AvailabilityForm } from "./_components/AvailabilityForm";
import { ServicesForm } from "./_components/ServicesForm";
import { NotificationsForm } from "./_components/NotificationsForm";
import { PublicProfileForm } from "./_components/PublicProfileForm";
import { LeadInfoForm } from "@/components/forms/LeadInfoForm";

interface OnboardingStep {
  step_type: string;
  title: string;
  description?: string;
  order: number;
  required: boolean;
  estimated_minutes?: number;
}

interface OnboardingFlow {
  id_flow: string;
  nm_flow: string;
  ds_flow: string;
  ds_steps: OnboardingStep[];
}

interface OnboardingProgress {
  id_progress: string;
  nm_status: string;
  nr_progress_percentage: number;
  ds_completed_steps: string[];
}

interface OnboardingData {
  flow: OnboardingFlow;
  progress: OnboardingProgress;
}

export default function ProfessionalOnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (user?.id) {
        // Validar formato do UUID e bloquear mocks
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const mockIds = ["00000000-0000-0000-0000-000000000000", "11111111-1111-1111-1111-111111111111", "22222222-2222-2222-2222-222222222222"];

        if (!uuidRegex.test(user.id) || mockIds.includes(user.id)) {
          console.error("[Onboarding] User ID inválido ou mock:", user.id);
          toast.error("Sessão inválida. Limpe cookies e faça login novamente.");
          return;
        }

        console.log("[Onboarding] User ID válido:", user.id);

        // Carregar dados em paralelo
        await Promise.all([
          fetchOnboardingData(),
          fetchProfessionalData()
        ]);
      }
    };

    loadData();
  }, [user?.id]);

  const fetchProfessionalData = async () => {
    try {
      console.log("[Onboarding] Buscando dados do profissional...");
      const response = await fetch("/api/profissionais/me");

      if (response.ok) {
        const data = await response.json();
        console.log("[Onboarding] Dados do profissional carregados:", data);

        // Extrair profissional do formato paginado (items[0]) ou objeto direto
        const professional = data.items ? data.items[0] : data;

        if (!professional) {
          console.warn("[Onboarding] Nenhum profissional encontrado na resposta");
          return;
        }

        console.log("[Onboarding] Profissional extraído:", professional);

        // Pré-preencher formData com os dados existentes do profissional
        const prefilledData = {
          nm_profissional: professional.nm_profissional || "",
          // Especialidade: converter array para string (pegar primeira)
          ds_especialidade: Array.isArray(professional.ds_especialidades) && professional.ds_especialidades.length > 0
            ? professional.ds_especialidades[0]
            : "",
          ds_biografia: professional.ds_biografia || professional.ds_bio || "",
          // Registro: mapear nome correto do campo
          nr_registro: professional.nr_registro_profissional || "",
          nr_anos_experiencia: professional.nr_anos_experiencia || "",
          ds_formacao: professional.ds_formacao || "",
          ds_email: professional.ds_email || "",
          nr_telefone: professional.nr_telefone || "",
          nr_whatsapp: professional.nr_whatsapp || "",
          ds_foto_url: professional.ds_foto || professional.ds_foto_perfil || "",
          // Horários de atendimento
          ds_horarios_atendimento: professional.ds_horarios_atendimento || {},
          nr_tempo_consulta: professional.nr_tempo_consulta || 60,
          // Procedimentos
          ds_procedimentos_realizados: professional.ds_procedimentos_realizados || [],
          // Configurações do perfil
          st_aceita_online: professional.st_aceita_online !== undefined ? professional.st_aceita_online : true,
        };

        console.log("[Onboarding] Pré-preenchendo formData:", prefilledData);
        setFormData(prefilledData);
      } else {
        console.warn("[Onboarding] Profissional não encontrado, iniciando com dados vazios");
      }
    } catch (error) {
      console.error("[Onboarding] Erro ao buscar dados do profissional:", error);
    }
  };

  const fetchOnboardingData = async () => {
    try {
      const response = await fetch(`/api/onboarding/dashboard/${user?.id}`);
      if (response.ok) {
        const data = await response.json();

        // Se retornou dados válidos, usar; caso contrário, usar mock de profissional
        if (data && data.flow && data.flow.ds_steps && data.flow.ds_steps.length >= 6) {
          setOnboardingData(data);
        } else {
          // Mock data para onboarding de profissional (6 etapas)
          setOnboardingData({
            flow: {
              id_flow: "286b3c42-2890-42ca-9342-bdfc9d5b7627",
              nm_flow: "Configuração do Perfil Profissional",
              ds_flow: "Complete seu perfil e comece a atender pacientes",
              ds_steps: [
                {
                  step_type: "lead_qualification",
                  title: "Qualificação",
                  description: "Conte-nos mais sobre você e seus objetivos",
                  order: 0,
                  required: false,
                  estimated_minutes: 3
                },
                {
                  step_type: "professional_info",
                  title: "Informações Profissionais",
                  description: "Dados pessoais, especialidade e biografia",
                  order: 1,
                  required: true,
                  estimated_minutes: 5
                },
                {
                  step_type: "availability",
                  title: "Horários de Atendimento",
                  description: "Configure sua disponibilidade semanal",
                  order: 2,
                  required: true,
                  estimated_minutes: 4
                },
                {
                  step_type: "services_setup",
                  title: "Procedimentos Oferecidos",
                  description: "Selecione os procedimentos que você realiza",
                  order: 3,
                  required: false,
                  estimated_minutes: 3
                },
                {
                  step_type: "notifications",
                  title: "Notificações",
                  description: "Configure como receber notificações",
                  order: 4,
                  required: false,
                  estimated_minutes: 2
                },
                {
                  step_type: "public_profile",
                  title: "Perfil Público",
                  description: "Defina visibilidade e preferências do perfil",
                  order: 5,
                  required: false,
                  estimated_minutes: 3
                }
              ]
            },
            progress: {
              id_progress: "temp-progress",
              nm_status: "in_progress",
              nr_progress_percentage: 0,
              ds_completed_steps: []
            }
          });
        }

        // Determinar step atual baseado no progresso
        const completedSteps = data?.progress?.ds_completed_steps || [];
        const nextStepIndex = completedSteps.length;
        setCurrentStep(nextStepIndex >= 0 && nextStepIndex < 6 ? nextStepIndex : 0);
      }
    } catch (error) {
      console.error("Erro ao buscar onboarding:", error);

      // Em caso de erro, usar mock data
      setOnboardingData({
        flow: {
          id_flow: "286b3c42-2890-42ca-9342-bdfc9d5b7627",
          nm_flow: "Configuração do Perfil Profissional",
          ds_flow: "Complete seu perfil e comece a atender pacientes",
          ds_steps: [
            {
              step_type: "lead_qualification",
              title: "Qualificação",
              description: "Conte-nos mais sobre você e seus objetivos",
              order: 0,
              required: false,
              estimated_minutes: 3
            },
            {
              step_type: "professional_info",
              title: "Informações Profissionais",
              description: "Dados pessoais, especialidade e biografia",
              order: 1,
              required: true,
              estimated_minutes: 5
            },
            {
              step_type: "availability",
              title: "Horários de Atendimento",
              description: "Configure sua disponibilidade semanal",
              order: 2,
              required: true,
              estimated_minutes: 4
            },
            {
              step_type: "services",
              title: "Procedimentos Oferecidos",
              description: "Selecione os procedimentos que você realiza",
              order: 3,
              required: false,
              estimated_minutes: 3
            },
            {
              step_type: "notifications",
              title: "Notificações",
              description: "Configure como receber notificações",
              order: 4,
              required: false,
              estimated_minutes: 2
            },
            {
              step_type: "public_profile",
              title: "Perfil Público",
              description: "Defina visibilidade e preferências do perfil",
              order: 5,
              required: false,
              estimated_minutes: 3
            }
          ]
        },
        progress: {
          id_progress: "temp-progress",
          nm_status: "in_progress",
          nr_progress_percentage: 0,
          ds_completed_steps: []
        }
      });
    }
  };

  const handleSaveDraft = () => {
    if (user?.id) {
      localStorage.setItem(`professional_onboarding_draft_${user.id}`, JSON.stringify(formData));
      toast.success("Rascunho salvo com sucesso!");
    }
  };

  const handleNext = async () => {
    if (!onboardingData) return;

    const currentStepData = onboardingData.flow.ds_steps[currentStep];

    // Salvar progresso do step atual
    setIsLoading(true);
    let saveSuccessful = false;

    try {
      const response = await fetch(
        `/api/onboarding/complete-step/${onboardingData.flow.id_flow}?user_id=${user?.id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            step_type: currentStepData.step_type,
            data: formData,
          }),
        }
      );

      if (response.ok) {
        saveSuccessful = true;
        toast.success("Etapa salva com sucesso!");
      } else {
        // Não bloqueia o avanço, apenas avisa
        console.warn("Erro ao salvar no backend, mas permitindo avanço (modo mock)");
      }
    } catch (error) {
      // Não bloqueia o avanço, apenas loga
      console.warn("Erro ao salvar no backend:", error);
    }

    // Avançar para próximo step (sempre avança, mesmo com erro no save)
    if (currentStep < onboardingData.flow.ds_steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Último step - finalizar
      toast.success("Configuração concluída! Bem-vindo à DoctorQ!");
      localStorage.removeItem(`professional_onboarding_draft_${user?.id}`);
      setTimeout(() => {
        router.push("/profissional/dashboard");
      }, 1500);
    }

    setIsLoading(false);
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSkip = () => {
    if (user?.id) {
      localStorage.setItem(`professional_onboarding_skipped_${user.id}`, "true");
    }
    router.push("/profissional/dashboard");
  };

  if (!onboardingData) {
    return (
      <div className="container max-w-5xl mx-auto py-8 px-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando onboarding...</p>
          </div>
        </div>
      </div>
    );
  }

  const { flow, progress } = onboardingData;
  const currentStepData = flow.ds_steps[currentStep];
  const progressPercentage = ((currentStep + 1) / flow.ds_steps.length) * 100;

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          {flow.nm_flow}
        </h1>
        <p className="text-muted-foreground">{flow.ds_flow}</p>
      </div>

      {/* Stepper */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              {flow.ds_steps.map((step, index) => (
                <div
                  key={step.step_type}
                  className={`flex flex-col items-center ${
                    index === currentStep
                      ? "text-primary"
                      : index < currentStep
                      ? "text-green-600"
                      : "text-muted-foreground"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 font-semibold mb-2 ${
                      index === currentStep
                        ? "border-primary bg-primary text-primary-foreground"
                        : index < currentStep
                        ? "border-green-600 bg-green-600 text-white"
                        : "border-muted-foreground"
                    }`}
                  >
                    {index < currentStep ? "✓" : index + 1}
                  </div>
                  <div className="text-xs font-medium hidden sm:block text-center max-w-24">
                    {step.title}
                  </div>
                </div>
              ))}
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          <div className="text-center mb-4">
            <h2 className="text-xl font-semibold">{currentStepData.title}</h2>
            {currentStepData.description && (
              <p className="text-sm text-muted-foreground mt-1">{currentStepData.description}</p>
            )}
            {currentStepData.estimated_minutes && (
              <p className="text-xs text-muted-foreground mt-2">
                ⏱️ Tempo estimado: {currentStepData.estimated_minutes} minutos
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Conteúdo do Step Atual */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          {/* Step 0: Qualificação de Lead */}
          {currentStep === 0 && (
            <LeadInfoForm
              tpPartner="profissional"
              onSubmit={(responses) => {
                setFormData((prev) => ({ ...prev, leadQuestions: responses }));
              }}
              submitLabel="Próximo"
              showSkipButton={true}
              skipLabel="Pular esta etapa"
              onSkip={handleNext}
            />
          )}

          {/* Step 1: Informações Profissionais */}
          {currentStep === 1 && (
            <ProfessionalInfoForm
              formData={formData}
              onChange={(field, value: string) => setFormData((prev) => ({ ...prev, [field]: value }))}
            />
          )}

          {/* Step 2: Horários de Atendimento */}
          {currentStep === 2 && (
            <AvailabilityForm
              formData={formData}
              onChange={(field, value: string | boolean) => setFormData((prev) => ({ ...prev, [field]: value }))}
            />
          )}

          {/* Step 3: Procedimentos Oferecidos */}
          {currentStep === 3 && (
            <ServicesForm
              formData={formData}
              onChange={(field, value: any) => setFormData((prev) => ({ ...prev, [field]: value }))}
            />
          )}

          {/* Step 4: Notificações */}
          {currentStep === 4 && (
            <NotificationsForm
              formData={formData}
              onChange={(field, value: boolean) => setFormData((prev) => ({ ...prev, [field]: value }))}
            />
          )}

          {/* Step 5: Perfil Público */}
          {currentStep === 5 && (
            <PublicProfileForm
              formData={formData}
              onChange={(field, value: string | boolean) => setFormData((prev) => ({ ...prev, [field]: value }))}
            />
          )}
        </CardContent>
      </Card>

      {/* Navegação */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Anterior
        </Button>

        <div className="flex gap-3">
          <Button variant="ghost" onClick={handleSkip}>
            Pular por Agora
          </Button>
          <Button variant="outline" onClick={handleSaveDraft}>
            <Save className="w-4 h-4 mr-2" />
            Salvar Rascunho
          </Button>
        </div>

        {currentStep < flow.ds_steps.length - 1 ? (
          <Button
            onClick={handleNext}
            disabled={isLoading}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
          >
            {isLoading ? "Salvando..." : "Próximo"}
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            disabled={isLoading}
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
          >
            <UserCheck className="w-4 h-4 mr-2" />
            {isLoading ? "Salvando..." : "Finalizar Configuração"}
          </Button>
        )}
      </div>
    </div>
  );
}
