"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

import OnboardingStep1 from "./_components/OnboardingStep1";
import OnboardingStep2 from "./_components/OnboardingStep2";
import OnboardingStep3 from "./_components/OnboardingStep3";
import OnboardingStep4 from "./_components/OnboardingStep4";
import OnboardingStep5 from "./_components/OnboardingStep5";
import OnboardingStep6 from "./_components/OnboardingStep6";
import { LeadInfoForm } from "@/components/forms/LeadInfoForm";

// Tipos
export interface ClinicaData {
  nm_clinica: string;
  nr_cnpj: string;
  nr_telefone: string;
  ds_email: string;
  nr_cep: string;
  ds_endereco: string;
  nr_numero: string;
  ds_complemento: string;
  ds_bairro: string;
  ds_cidade: string;
  sg_estado: string;
  ds_website: string;
  url_logo: string;
}

export interface Profissional {
  id: string;
  nm_profissional: string;
  nr_registro: string;
  ds_especialidade: string;
  ds_email: string;
  nr_telefone: string;
  url_foto: string;
}

export interface Procedimento {
  id: string;
  nm_procedimento: string;
  ds_categoria: string;
  qt_duracao: number;
  vl_procedimento: number;
  ds_procedimento: string;
}

export interface HorarioAtendimento {
  dia_semana: string;
  fg_ativo: boolean;
  hr_abertura: string;
  hr_fechamento: string;
  hr_inicio_intervalo: string;
  hr_fim_intervalo: string;
}

export interface Integracoes {
  fg_google_calendar: boolean;
  fg_whatsapp: boolean;
  nr_whatsapp: string;
  fg_pagamento: boolean;
  ds_api_key_pagamento: string;
  fg_notificacao_email: boolean;
  fg_notificacao_sms: boolean;
}

export interface OnboardingData {
  clinica: ClinicaData;
  profissionais: Profissional[];
  procedimentos: Procedimento[];
  horarios: HorarioAtendimento[];
  integracoes: Integracoes;
}

const STEPS = [
  { number: 0, title: "Dados da Clínica", description: "Informações básicas" },
  { number: 1, title: "Qualificação", description: "Conte-nos sobre você" },
  { number: 2, title: "Profissionais", description: "Equipe médica" },
  { number: 3, title: "Serviços", description: "Procedimentos oferecidos" },
  { number: 4, title: "Horários", description: "Horário de atendimento" },
  { number: 5, title: "Integrações", description: "Conexões externas" },
  { number: 6, title: "Revisão", description: "Confirmar dados" },
];

const INITIAL_DATA: OnboardingData = {
  clinica: {
    nm_clinica: "",
    nr_cnpj: "",
    nr_telefone: "",
    ds_email: "",
    nr_cep: "",
    ds_endereco: "",
    nr_numero: "",
    ds_complemento: "",
    ds_bairro: "",
    ds_cidade: "",
    sg_estado: "",
    ds_website: "",
    url_logo: "",
  },
  profissionais: [],
  procedimentos: [],
  horarios: [
    { dia_semana: "Segunda-feira", fg_ativo: true, hr_abertura: "08:00", hr_fechamento: "18:00", hr_inicio_intervalo: "12:00", hr_fim_intervalo: "13:00" },
    { dia_semana: "Terça-feira", fg_ativo: true, hr_abertura: "08:00", hr_fechamento: "18:00", hr_inicio_intervalo: "12:00", hr_fim_intervalo: "13:00" },
    { dia_semana: "Quarta-feira", fg_ativo: true, hr_abertura: "08:00", hr_fechamento: "18:00", hr_inicio_intervalo: "12:00", hr_fim_intervalo: "13:00" },
    { dia_semana: "Quinta-feira", fg_ativo: true, hr_abertura: "08:00", hr_fechamento: "18:00", hr_inicio_intervalo: "12:00", hr_fim_intervalo: "13:00" },
    { dia_semana: "Sexta-feira", fg_ativo: true, hr_abertura: "08:00", hr_fechamento: "18:00", hr_inicio_intervalo: "12:00", hr_fim_intervalo: "13:00" },
    { dia_semana: "Sábado", fg_ativo: false, hr_abertura: "08:00", hr_fechamento: "12:00", hr_inicio_intervalo: "", hr_fim_intervalo: "" },
    { dia_semana: "Domingo", fg_ativo: false, hr_abertura: "08:00", hr_fechamento: "12:00", hr_inicio_intervalo: "", hr_fim_intervalo: "" },
  ],
  integracoes: {
    fg_google_calendar: false,
    fg_whatsapp: false,
    nr_whatsapp: "",
    fg_pagamento: false,
    ds_api_key_pagamento: "",
    fg_notificacao_email: true,
    fg_notificacao_sms: false,
  },
};

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoadingPartnerData, setIsLoadingPartnerData] = useState(true);
  const [formData, setFormData] = useState<OnboardingData>(() => {
    // Tentar carregar do localStorage
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("doctorq_onboarding_draft");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return INITIAL_DATA;
        }
      }
    }
    return INITIAL_DATA;
  });

  const progress = (currentStep / STEPS.length) * 100;

  // Debug: Log session changes
  useEffect(() => {
    console.log("[ONBOARDING] Session status:", status);
    console.log("[ONBOARDING] Session data:", session);
    console.log("[ONBOARDING] User email:", session?.user?.email);
  }, [session, status]);

  // Buscar dados do partner lead para pré-preencher
  useEffect(() => {
    const loadPartnerData = async () => {
      console.log("[ONBOARDING] Iniciando loadPartnerData");
      console.log("[ONBOARDING] Status:", status);
      console.log("[ONBOARDING] Session:", session);

      // Aguardar autenticação completar
      if (status === "loading") {
        console.log("[ONBOARDING] Aguardando autenticação...");
        return;
      }

      if (!session?.user?.email) {
        console.log("[ONBOARDING] Sem email na sessão, abortando");
        setIsLoadingPartnerData(false);
        return;
      }

      console.log("[ONBOARDING] Email encontrado:", session.user.email);

      try {
        const url = `/api/partner-leads?search=${encodeURIComponent(session.user.email)}`;
        console.log("[ONBOARDING] Buscando:", url);

        const response = await fetch(url);
        console.log("[ONBOARDING] Response status:", response.status);

        if (!response.ok) {
          console.warn("[ONBOARDING] Response não OK, status:", response.status);
          const errorText = await response.text();
          console.warn("[ONBOARDING] Response error:", errorText);
          setIsLoadingPartnerData(false);
          return;
        }

        const data = await response.json();
        console.log("[ONBOARDING] Dados recebidos:", data);

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
          setFormData((prev) => ({
            ...prev,
            clinica: {
              ...prev.clinica,
              nm_clinica: partnerLead.business_name || prev.clinica.nm_clinica,
              nr_cnpj: partnerLead.cnpj || prev.clinica.nr_cnpj,
              nr_telefone: partnerLead.contact_phone || prev.clinica.nr_telefone,
              ds_email: partnerLead.contact_email || prev.clinica.ds_email,
              ds_cidade: partnerLead.city || prev.clinica.ds_cidade,
              sg_estado: partnerLead.state || prev.clinica.sg_estado,
            },
          }));

          console.log("✅ Dados pré-preenchidos com sucesso!");
          toast.success("Dados da parceria carregados com sucesso!");
        } else {
          console.log("[ONBOARDING] Nenhum partner lead encontrado para este email");
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

  const handleSaveDraft = () => {
    localStorage.setItem("doctorq_onboarding_draft", JSON.stringify(formData));
    toast.success("Rascunho salvo com sucesso!");
    console.log("💾 Rascunho salvo:", formData);
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0:
        const { nm_clinica, nr_cnpj, nr_telefone, ds_email, nr_cep, ds_endereco, nr_numero, ds_cidade, sg_estado } = formData.clinica;
        if (!nm_clinica || !nr_cnpj || !nr_telefone || !ds_email || !nr_cep || !ds_endereco || !nr_numero || !ds_cidade || !sg_estado) {
          toast.error("Preencha todos os campos obrigatórios da clínica");
          return false;
        }
        return true;
      case 1:
        // Etapa de qualificação - opcional
        return true;
      case 2:
        if (formData.profissionais.length === 0) {
          toast.error("Adicione pelo menos um profissional");
          return false;
        }
        return true;
      case 3:
        if (formData.procedimentos.length === 0) {
          toast.error("Adicione pelo menos um procedimento");
          return false;
        }
        return true;
      case 4:
        const ativos = formData.horarios.filter((h) => h.fg_ativo);
        if (ativos.length === 0) {
          toast.error("Configure pelo menos um dia de atendimento");
          return false;
        }
        return true;
      case 5:
        // Etapa opcional
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    // Se estiver na etapa de qualificação (step 1), submeter o formulário
    if (currentStep === 1) {
      const form = document.getElementById("lead-qualification-form") as HTMLFormElement;
      if (form) {
        form.requestSubmit();
        return;
      }
    }

    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleFinish = async () => {
    console.log("🚀 Finalizando onboarding:", formData);

    // Simular envio (substituir por API real)
    toast.success("Configuração concluída com sucesso!");

    // Limpar rascunho
    localStorage.removeItem("doctorq_onboarding_draft");

    // Redirecionar para dashboard
    setTimeout(() => {
      router.push("/parceiros/dashboard");
    }, 1500);
  };

  const updateClinica = (data: Partial<ClinicaData>) => {
    setFormData((prev) => ({
      ...prev,
      clinica: { ...prev.clinica, ...data },
    }));
  };

  const updateProfissionais = (profissionais: Profissional[]) => {
    setFormData((prev) => ({ ...prev, profissionais }));
  };

  const updateProcedimentos = (procedimentos: Procedimento[]) => {
    setFormData((prev) => ({ ...prev, procedimentos }));
  };

  const updateHorarios = (horarios: HorarioAtendimento[]) => {
    setFormData((prev) => ({ ...prev, horarios }));
  };

  const updateIntegracoes = (integracoes: Integracoes) => {
    setFormData((prev) => ({ ...prev, integracoes }));
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

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Configuração Inicial da Clínica</h1>
        <p className="text-muted-foreground">
          Complete as etapas abaixo para começar a usar o DoctorQ
        </p>
      </div>

      {/* Stepper */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              {STEPS.map((step) => (
                <div
                  key={step.number}
                  className={`flex flex-col items-center ${
                    step.number === currentStep
                      ? "text-primary"
                      : step.number < currentStep
                      ? "text-green-600"
                      : "text-muted-foreground"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 font-semibold mb-2 ${
                      step.number === currentStep
                        ? "border-primary bg-primary text-primary-foreground"
                        : step.number < currentStep
                        ? "border-green-600 bg-green-600 text-white"
                        : "border-muted-foreground"
                    }`}
                  >
                    {step.number < currentStep ? "✓" : step.number}
                  </div>
                  <div className="text-xs font-medium hidden sm:block">{step.title}</div>
                </div>
              ))}
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="text-center mb-4">
            <h2 className="text-xl font-semibold">{STEPS[currentStep].title}</h2>
            <p className="text-sm text-muted-foreground">{STEPS[currentStep].description}</p>
          </div>
        </CardContent>
      </Card>

      {/* Conteúdo da Etapa */}
      <div className="mb-8">
        {currentStep === 0 && <OnboardingStep1 data={formData.clinica} onUpdate={updateClinica} />}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Qualificação de Parceiro</CardTitle>
              <CardDescription>
                Responda às perguntas abaixo para nos ajudar a entender melhor suas necessidades
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LeadInfoForm
                tpPartner="fornecedor"
                formId="lead-qualification-form"
                onSubmit={(responses) => {
                  // Armazenar respostas e avançar automaticamente
                  const leadData = { leadQuestions: responses };
                  localStorage.setItem("parceiros_onboarding_lead", JSON.stringify(leadData));
                  // Avançar para próxima etapa após salvar
                  setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
                }}
                submitLabel="Próximo"
                showSkipButton={false}
                showButtons={false}
                skipLabel="Pular esta etapa"
                onSkip={() => setCurrentStep((prev) => Math.min(prev + 1, STEPS.length))}
              />
            </CardContent>
          </Card>
        )}
        {currentStep === 2 && <OnboardingStep2 data={formData.profissionais} onUpdate={updateProfissionais} />}
        {currentStep === 3 && <OnboardingStep3 data={formData.procedimentos} onUpdate={updateProcedimentos} />}
        {currentStep === 4 && <OnboardingStep4 data={formData.horarios} onUpdate={updateHorarios} />}
        {currentStep === 5 && <OnboardingStep5 data={formData.integracoes} onUpdate={updateIntegracoes} />}
        {currentStep === 6 && <OnboardingStep6 data={formData} onFinish={handleFinish} />}
      </div>

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

        <Button variant="ghost" onClick={handleSaveDraft}>
          <Save className="w-4 h-4 mr-2" />
          Salvar Rascunho
        </Button>

        {currentStep < STEPS.length ? (
          <Button onClick={handleNext}>
            Próximo
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleFinish} className="bg-green-600 hover:bg-green-700">
            Finalizar Configuração
          </Button>
        )}
      </div>
    </div>
  );
}
