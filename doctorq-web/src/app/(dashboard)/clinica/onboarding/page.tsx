"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { AccountSetupForm } from "./_components/AccountSetupForm";
import { FirstAgentForm } from "./_components/FirstAgentForm";
import { ProfissionaisForm } from "./_components/ProfissionaisForm";
import { ProcedimentosForm } from "./_components/ProcedimentosForm";
import { FirstConversationForm } from "./_components/FirstConversationForm";
import { IntegracoesForm } from "./_components/IntegracoesForm";
import { InstallTemplateForm } from "./_components/InstallTemplateForm";
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
  ds_skipped_steps?: string[];
  ds_progress_data?: Record<string, any>;
  nm_current_step?: string | null;
}

interface OnboardingData {
  flow: OnboardingFlow;
  progress: OnboardingProgress;
}

const getStepIndexFromProgress = (
  steps: OnboardingStep[],
  progress?: OnboardingProgress | null
) => {
  if (!progress || steps.length === 0) return 0;

  const completed = progress.ds_completed_steps || [];
  const skipped = progress.ds_skipped_steps || [];
  const doneSet = new Set<string>([...completed, ...skipped]);

  if (progress.nm_current_step) {
    const idx = steps.findIndex(
      (step) => step.step_type === progress.nm_current_step
    );
    if (idx !== -1) return idx;
  }

  const nextIndex = steps.findIndex((step) => !doneSet.has(step.step_type));
  if (nextIndex !== -1) return nextIndex;

  return Math.max(steps.length - 1, 0);
};

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: session, status } = useSession();
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const [stepValues, setStepValues] = useState<Record<string, Record<string, any>>>(
    {}
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPartnerData, setIsLoadingPartnerData] = useState(true);

  // Debug: Log session changes
  useEffect(() => {
    console.log("[CLINICA_ONBOARDING] Session status:", status);
    console.log("[CLINICA_ONBOARDING] Session data:", session);
    console.log("[CLINICA_ONBOARDING] User email:", session?.user?.email);
  }, [session, status]);

  // Buscar dados do partner lead para pré-preencher
  useEffect(() => {
    const loadPartnerData = async () => {
      console.log("[CLINICA_ONBOARDING] Iniciando loadPartnerData");
      console.log("[CLINICA_ONBOARDING] Status:", status);
      console.log("[CLINICA_ONBOARDING] Session:", session);

      // Aguardar autenticação completar
      if (status === "loading") {
        console.log("[CLINICA_ONBOARDING] Aguardando autenticação...");
        return;
      }

      if (!session?.user?.email) {
        console.log("[CLINICA_ONBOARDING] Sem email na sessão, abortando");
        setIsLoadingPartnerData(false);
        return;
      }

      console.log("[CLINICA_ONBOARDING] Email encontrado:", session.user.email);

      try {
        const url = `/api/partner-leads?search=${encodeURIComponent(session.user.email)}`;
        console.log("[CLINICA_ONBOARDING] Buscando:", url);

        const response = await fetch(url);
        console.log("[CLINICA_ONBOARDING] Response status:", response.status);

        if (!response.ok) {
          console.warn("[CLINICA_ONBOARDING] Response não OK, status:", response.status);
          const errorText = await response.text();
          console.warn("[CLINICA_ONBOARDING] Response error:", errorText);
          setIsLoadingPartnerData(false);
          return;
        }

        const data = await response.json();
        console.log("[CLINICA_ONBOARDING] Dados recebidos:", data);

        if (data.items && data.items.length > 0) {
          const partnerLead = data.items[0];

          console.log("📋 Dados do partner lead encontrados:", {
            business_name: partnerLead.business_name,
            cnpj: partnerLead.cnpj,
            contact_phone: partnerLead.contact_phone,
            contact_email: partnerLead.contact_email,
            city: partnerLead.city,
            state: partnerLead.state,
          });

          // Pré-preencher dados da clínica com dados do partner lead
          setStepValues((prev) => ({
            ...prev,
            clinic_info: {
              ...(prev.clinic_info || {}),
              nm_clinica: partnerLead.business_name || prev.clinic_info?.nm_clinica || "",
              nr_cnpj: partnerLead.cnpj || prev.clinic_info?.nr_cnpj || "",
              nr_telefone: partnerLead.contact_phone || prev.clinic_info?.nr_telefone || "",
              ds_email: partnerLead.contact_email || prev.clinic_info?.ds_email || "",
              ds_cidade: partnerLead.city || prev.clinic_info?.ds_cidade || "",
              ds_estado: partnerLead.state || prev.clinic_info?.ds_estado || "",
            },
          }));

          console.log("✅ Dados pré-preenchidos com sucesso!");
          toast.success("Dados da parceria carregados com sucesso!");
        } else {
          console.log("[CLINICA_ONBOARDING] Nenhum partner lead encontrado para este email");
        }
      } catch (error) {
        console.error("❌ Erro ao carregar dados do parceiro:", error);
        toast.error("Erro ao carregar dados da parceria");
      } finally {
        setIsLoadingPartnerData(false);
      }
    };

    loadPartnerData();
  }, [status, session]);

  useEffect(() => {
    if (user?.id) {
      // Validar formato do UUID e bloquear mocks
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      if (!uuidRegex.test(user.id)) {
        console.error("[Onboarding] User ID inválido ou mock:", user.id);
        toast.error("Sessão inválida. Limpe cookies e faça login novamente.");
        return;
      }

      console.log("[Onboarding] User ID válido:", user.id);
      fetchOnboardingData();
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const draftKey = `onboarding_draft_${user.id}`;
    try {
      const storedDraft = localStorage.getItem(draftKey);
      if (storedDraft) {
        const parsedDraft = JSON.parse(storedDraft);
        if (parsedDraft && typeof parsedDraft === "object") {
          setStepValues(parsedDraft);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar rascunho do onboarding:", error);
    }
  }, [user?.id]);

  const fetchOnboardingData = async () => {
    try {
      const response = await fetch(`/api/onboarding/dashboard/${user?.id}`);
      if (response.ok) {
        const data = await response.json();

        // Se retornou dados válidos, usar; caso contrário, usar mock de clínica
        if (data && data.flow && data.flow.ds_steps && data.flow.ds_steps.length >= 8) {
          setOnboardingData(data);

          const steps = data.flow.ds_steps;
          const stepIndex = getStepIndexFromProgress(steps, data.progress);
          setCurrentStep(stepIndex);

          const serverStepValues = data.progress?.ds_progress_data ?? {};
          if (serverStepValues && typeof serverStepValues === "object") {
            setStepValues((prev) => {
              const merged = { ...prev };
              Object.entries(serverStepValues).forEach(([key, value]) => {
                merged[key] =
                  value && typeof value === "object" ? (value as Record<string, any>) : {};
              });
              return merged;
            });
          }
        } else {
          // Mock data para onboarding de clínica (8 etapas)
          setOnboardingData({
            flow: {
              id_flow: "65cc5e66-2fce-4ec4-804b-b8e52151132c",
              nm_flow: "Configuração da Clínica",
              ds_flow: "Configure sua clínica em 8 passos simples e comece a usar a plataforma",
              ds_steps: [
                {
                  step_type: "clinic_info",
                  title: "Informações da Clínica",
                  description: "Cadastre os dados básicos da clínica, logo e endereço",
                  order: 0,
                  required: true,
                  estimated_minutes: 5
                },
                {
                  step_type: "lead_qualification",
                  title: "Qualificação",
                  description: "Conte-nos mais sobre sua clínica e objetivos",
                  order: 1,
                  required: false,
                  estimated_minutes: 3
                },
                {
                  step_type: "schedule_setup",
                  title: "Horários e Agendamentos",
                  description: "Configure horários de funcionamento e regras de agendamento",
                  order: 2,
                  required: true,
                  estimated_minutes: 3
                },
                {
                  step_type: "team_setup",
                  title: "Cadastro de Profissionais",
                  description: "Adicione os profissionais que trabalham na clínica",
                  order: 3,
                  required: false,
                  estimated_minutes: 5
                },
                {
                  step_type: "services_setup",
                  title: "Cadastro de Procedimentos",
                  description: "Cadastre os procedimentos e serviços oferecidos",
                  order: 4,
                  required: false,
                  estimated_minutes: 5
                },
                {
                  step_type: "notifications",
                  title: "Notificações e Pagamento",
                  description: "Configure notificações e formas de pagamento",
                  order: 5,
                  required: true,
                  estimated_minutes: 3
                },
                {
                  step_type: "integrations",
                  title: "Integrações",
                  description: "Conecte WhatsApp, Gmail, Google Calendar e gateway de pagamento",
                  order: 6,
                  required: false,
                  estimated_minutes: 5
                },
                {
                  step_type: "privacy",
                  title: "Privacidade e Aparência",
                  description: "Ajuste configurações de privacidade e personalização visual",
                  order: 7,
                  required: true,
                  estimated_minutes: 2
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
      }
    } catch (error) {
      console.error("Erro ao buscar onboarding:", error);

      // Em caso de erro, usar mock data
      setOnboardingData({
        flow: {
          id_flow: "65cc5e66-2fce-4ec4-804b-b8e52151132c",
          nm_flow: "Configuração da Clínica",
          ds_flow: "Configure sua clínica em 8 passos simples e comece a usar a plataforma",
          ds_steps: [
            {
              step_type: "clinic_info",
              title: "Informações da Clínica",
              description: "Cadastre os dados básicos da clínica, logo e endereço",
              order: 0,
              required: true,
              estimated_minutes: 5
            },
            {
              step_type: "lead_qualification",
              title: "Qualificação",
              description: "Conte-nos mais sobre sua clínica e objetivos",
              order: 1,
              required: false,
              estimated_minutes: 3
            },
            {
              step_type: "schedule_setup",
              title: "Horários e Agendamentos",
              description: "Configure horários de funcionamento e regras de agendamento",
              order: 2,
              required: true,
              estimated_minutes: 3
            },
            {
              step_type: "team_setup",
              title: "Cadastro de Profissionais",
              description: "Adicione os profissionais que trabalham na clínica",
              order: 3,
              required: false,
              estimated_minutes: 5
            },
            {
              step_type: "services_setup",
              title: "Cadastro de Procedimentos",
              description: "Cadastre os procedimentos e serviços oferecidos",
              order: 4,
              required: false,
              estimated_minutes: 5
            },
            {
              step_type: "notifications",
              title: "Notificações e Pagamento",
              description: "Configure notificações e formas de pagamento",
              order: 5,
              required: true,
              estimated_minutes: 3
            },
            {
              step_type: "integrations",
              title: "Integrações",
              description: "Conecte WhatsApp, Gmail, Google Calendar e gateway de pagamento",
              order: 6,
              required: false,
              estimated_minutes: 5
            },
            {
              step_type: "privacy",
              title: "Privacidade e Aparência",
              description: "Ajuste configurações de privacidade e personalização visual",
              order: 7,
              required: true,
              estimated_minutes: 2
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
      localStorage.setItem(
        `onboarding_draft_${user.id}`,
        JSON.stringify(stepValues)
      );
      toast.success("Rascunho salvo com sucesso!");
    }
  };

  const handleNext = async (skipFormSubmit: boolean = false) => {
    if (!onboardingData) return;

    // Se estiver na etapa de qualificação (step 1) e não for skip, submeter o formulário
    if (currentStep === 1 && !skipFormSubmit) {
      const form = document.getElementById("lead-qualification-form-clinica") as HTMLFormElement;
      if (form) {
        form.requestSubmit();
        return;
      }
    }

    const currentStepData = onboardingData.flow.ds_steps[currentStep];
    const currentStepType = currentStepData?.step_type;
    if (!currentStepType) return;

    const payload = stepValues[currentStepType] ?? {};

    // Salvar progresso do step atual
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/onboarding/complete-step/${onboardingData.flow.id_flow}?user_id=${user?.id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            step_type: currentStepData.step_type,
            data: payload,
          }),
        }
      );

      const responseData = await response.json().catch(() => null);

      if (response.ok) {
        const updatedProgress = (responseData ?? null) as
          | OnboardingProgress
          | null;
        const serverStepValues = updatedProgress?.ds_progress_data ?? {};

        const mergedValues = { ...stepValues };
        if (serverStepValues && typeof serverStepValues === "object") {
          Object.entries(serverStepValues).forEach(([key, value]) => {
            mergedValues[key] =
              value && typeof value === "object" ? (value as Record<string, any>) : {};
          });
        } else {
          mergedValues[currentStepType] = payload;
        }

        setStepValues(mergedValues);

        if (user?.id) {
          try {
            localStorage.setItem(
              `onboarding_draft_${user.id}`,
              JSON.stringify(mergedValues)
            );
          } catch (error) {
            console.error("Erro ao salvar rascunho atualizado:", error);
          }
        }

        if (updatedProgress) {
          setOnboardingData((prev) =>
            prev
              ? {
                  ...prev,
                  progress: {
                    ...prev.progress,
                    ...updatedProgress,
                  },
                }
              : prev
          );
        }

        const steps = onboardingData.flow.ds_steps;
        const nextIndex = updatedProgress
          ? getStepIndexFromProgress(steps, updatedProgress)
          : Math.min(currentStep + 1, steps.length - 1);
        const isCompleted = updatedProgress
          ? updatedProgress.nm_status?.toLowerCase() === "completed" ||
            !updatedProgress.nm_current_step
          : false;

        toast.success("Etapa salva com sucesso!");

        if (isCompleted) {
          toast.success("Onboarding concluído! Bem-vindo à DoctorQ!");
          localStorage.removeItem(`onboarding_draft_${user?.id}`);
          setTimeout(() => {
            router.push("/clinica/dashboard");
          }, 1500);
        } else if (nextIndex !== currentStep) {
          setCurrentStep(nextIndex);
        }
      } else {
        const errorMessage =
          responseData?.error ||
          responseData?.detail ||
          "Erro ao salvar etapa";
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro ao salvar etapa");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSkip = () => {
    if (user?.id) {
      localStorage.setItem(`onboarding_skipped_${user.id}`, "true");
    }
    router.push("/clinica/dashboard");
  };

  // Mostrar loading enquanto carrega dados do parceiro
  if (isLoadingPartnerData) {
    return (
      <div className="container max-w-5xl mx-auto py-8 px-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Carregando informações da parceria...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
  const currentStepType = currentStepData?.step_type;
  const currentFormData: Record<string, any> = currentStepType
    ? { ...(stepValues[currentStepType] ?? {}) }
    : {};

  const progressPercentage =
    progress?.nr_progress_percentage !== undefined
      ? progress.nr_progress_percentage
      : ((currentStep + 1) / flow.ds_steps.length) * 100;

  const handleFieldChange = (field: string, value: any) => {
    if (!currentStepType) return;
    setStepValues((prev) => ({
      ...prev,
      [currentStepType]: {
        ...(prev[currentStepType] || {}),
        [field]: value,
      },
    }));
  };

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
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
          {/* Step 0: Informações da Clínica */}
          {currentStep === 0 && (
            <AccountSetupForm
              formData={currentFormData}
              onChange={(field, value: string) => handleFieldChange(field, value)}
            />
          )}

          {/* Step 1: Qualificação de Lead */}
          {currentStep === 1 && (
            <LeadInfoForm
              tpPartner="clinica"
              formId="lead-qualification-form-clinica"
              onSubmit={(responses) => {
                handleFieldChange("leadQuestions", responses);
                // Chamar handleNext com skipFormSubmit=true para evitar loop e permitir salvamento no backend
                handleNext(true);
              }}
              submitLabel="Próximo"
              showSkipButton={false}
              showButtons={false}
              skipLabel="Pular esta etapa"
              onSkip={() => handleNext(true)}
            />
          )}

          {/* Step 2: Horários e Agendamentos */}
          {currentStep === 2 && (
            <FirstAgentForm
              formData={currentFormData}
              onChange={(field, value: string | boolean) => handleFieldChange(field, value)}
            />
          )}

          {/* Step 3: Cadastro de Profissionais */}
          {currentStep === 3 && (
            <ProfissionaisForm
              formData={currentFormData}
              onChange={(field, value: any) => handleFieldChange(field, value)}
            />
          )}

          {/* Step 4: Cadastro de Procedimentos */}
          {currentStep === 4 && (
            <ProcedimentosForm
              formData={currentFormData}
              onChange={(field, value: any) => handleFieldChange(field, value)}
            />
          )}

          {/* Step 5: Notificações e Pagamento */}
          {currentStep === 5 && (
            <FirstConversationForm
              formData={currentFormData}
              onChange={(field, value: string | boolean) => handleFieldChange(field, value)}
            />
          )}

          {/* Step 6: Integrações */}
          {currentStep === 6 && (
            <IntegracoesForm
              formData={currentFormData}
              onChange={(field, value: string | boolean) => handleFieldChange(field, value)}
            />
          )}

          {/* Step 7: Privacidade e Aparência */}
          {currentStep === 7 && (
            <InstallTemplateForm
              formData={currentFormData}
              onChange={(field, value: string | boolean) => handleFieldChange(field, value)}
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
            onClick={() => handleNext()}
            disabled={isLoading}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
          >
            {isLoading ? "Salvando..." : "Próximo"}
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={() => handleNext()}
            disabled={isLoading}
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
          >
            {isLoading ? "Salvando..." : "Finalizar Configuração"}
          </Button>
        )}
      </div>
    </div>
  );
}
