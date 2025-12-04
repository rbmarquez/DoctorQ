"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { apiClient } from "@/lib/api";
import type { CheckedState } from "@radix-ui/react-checkbox";
import { ArrowRight, CheckCircle2, Loader2, Building2, Users, Factory, Package, Sparkles } from "lucide-react";

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "DoctorQ";

type ServiceCategory = 'plano_base' | 'oferta' | 'diferencial' | 'addon';

type ServicePlan = {
  id: string;
  code: string;
  title: string;
  description: string;
  price: string;
  features: string[];
  recommended?: boolean;
  category?: ServiceCategory;
};

const fallbackServicePlans: ServicePlan[] = [
  {
    id: "PLATAFORMA",
    code: "PLATAFORMA",
    title: "Acesso à Plataforma",
    description: "Painel completo de gestão de agenda, pacientes e marketplace.",
    price: "R$ 149/mês por unidade",
    features: [
      "Agenda inteligente com confirmações automáticas",
      `Perfil destacado no marketplace ${appName}`,
      "Relatórios financeiros e de performance em tempo real",
    ],
    recommended: true,
    category: "plano_base",
  },
  {
    id: "CENTRAL_ATENDIMENTO",
    code: "CENTRAL_ATENDIMENTO",
    title: "Central de Atendimento 360º",
    description: `Equipe ${appName} atende seus clientes 7 dias por semana.`,
    price: "R$ 199/mês por equipe",
    features: [
      "Atendimento telefônico, chat e e-mail com scripts personalizados",
      "Follow-up automático de orçamentos e ausências",
      "Integração com campanhas de marketing e CRM",
    ],
    category: "diferencial",
  },
  {
    id: "WHATSAPP_INTELIGENTE",
    code: "WHATSAPP_INTELIGENTE",
    title: "WhatsApp Inteligente",
    description: "Fluxos automatizados, catálogo de serviços e integrações.",
    price: "R$ 89/mês por linha",
    features: [
      "Chatbot com pré-venda e avaliação de perfil do cliente",
      "Envio em massa segmentado e campanhas de retorno",
      "Integração com agenda e disparo de lembretes",
    ],
    category: "oferta",
  },
  {
    id: "CHATBOT_ESTETIQ",
    code: "CHATBOT_ESTETIQ",
    title: `Chatbot ${appName}`,
    description: "Assistente virtual com conhecimento sobre seus serviços.",
    price: "R$ 59/mês por canal",
    features: [
      "Treinamento com base no site e materiais da sua operação",
      "Captação e qualificação de leads em tempo real",
      "Handoff para equipe humana dentro da plataforma",
    ],
    category: "oferta",
  },
  {
    id: "ESTETIQ_ACADEMY",
    code: "ESTETIQ_ACADEMY",
    title: "Academy & Treinamentos",
    description: `Capacite sua equipe com trilhas exclusivas ${appName}.`,
    price: "R$ 39/mês por usuário",
    features: [
      "Cursos certificados sobre marketing, vendas e gestão estética",
      "Atualizações mensais com tendências de mercado",
      `Mentorias em grupo com especialistas ${appName}`,
    ],
    category: "oferta",
  },
];

const getDefaultSelection = (plans: ServicePlan[]) => {
  const recommended = plans.filter((plan) => plan.recommended).map((plan) => plan.id);
  if (recommended.length) {
    return recommended;
  }
  return plans.length ? [plans[0].id] : [];
};

type PartnerTypeApi = "clinica" | "profissional" | "fabricante" | "fornecedor";

const partnerTypeMap: Record<string, PartnerTypeApi> = {
  clinicas: "clinica",
  profissionais: "profissional",
  fabricantes: "fabricante",
  fornecedores: "fornecedor",
};

const partnerIconMap = {
  Building2,
  Users,
  Factory,
  Package,
};

export interface PartnerRegistrationType {
  id: string;
  icon: keyof typeof partnerIconMap;
  title: string;
  subtitle: string;
  bullets: string[];
  accent: string;
}

interface PartnerRegistrationFlowProps {
  types: PartnerRegistrationType[];
  defaultTypeId: string;
}

interface PartnerServiceMarketplaceProps {
  partnerTypeTitle: string;
  onBack: () => void;
  servicePlans: ServicePlan[];
  defaultSelected?: string[];
}

const initialFormState = {
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  businessName: "",
  cnpj: "",
  city: "",
  state: "",
  services: "",
  differentiators: "",
  teamSize: "",
  catalogLink: "",
  notes: "",
};

type FormState = typeof initialFormState;

const stepLabels = [
  {
    title: "Contato principal",
    description: `Quem será o responsável pelo relacionamento com a ${appName}?`,
  },
  {
    title: "Escolha seu plano",
    description: "Selecione os planos base para sua operação.",
  },
  {
    title: "Ofertas e diferenciais",
    description: "Adicione serviços exclusivos ao seu pacote.",
  },
  {
    title: "Sobre a operação",
    description: "Conte-nos sobre a estrutura da clínica ou empresa.",
  },
  {
    title: "Revisão e envio",
    description: "Confira os dados antes de enviar.",
  },
];

export function PartnerRegistrationFlow({
  types,
  defaultTypeId,
}: PartnerRegistrationFlowProps) {
  const fallbackTypeId = types[0]?.id ?? "";
  const [selectedTypeId, setSelectedTypeId] = useState(
    types.find((type) => type.id === defaultTypeId)?.id ?? fallbackTypeId,
  );
  const selectedType = useMemo(
    () => types.find((type) => type.id === selectedTypeId),
    [types, selectedTypeId],
  );

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormState>(initialFormState);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [servicePlans, setServicePlans] = useState<ServicePlan[]>(fallbackServicePlans);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [servicesError, setServicesError] = useState<string | null>(null);
  const [selectedServiceCodes, setSelectedServiceCodes] = useState<string[]>(
    getDefaultSelection(fallbackServicePlans),
  );
  const [selectedServicesError, setSelectedServicesError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const totalSteps = stepLabels.length;

  // Filtrar serviços por categoria
  const basePlans = useMemo(
    () => servicePlans.filter((plan) => plan.category === 'plano_base'),
    [servicePlans],
  );

  const specialPlans = useMemo(
    () => servicePlans.filter((plan) => plan.category === 'oferta' || plan.category === 'diferencial'),
    [servicePlans],
  );

  const selectedServiceDetails = useMemo(
    () => servicePlans.filter((plan) => selectedServiceCodes.includes(plan.id)),
    [servicePlans, selectedServiceCodes],
  );

  const valueOrUndefined = (value: string) => {
    const trimmed = value?.trim();
    return trimmed ? trimmed : undefined;
  };

  useEffect(() => {
    let active = true;

    const loadServicePlans = async () => {
      setServicesLoading(true);
      try {
        const rawData = await apiClient.get("/partner-leads/services");
        if (!Array.isArray(rawData)) {
          throw new Error(`Formato inesperado ao listar serviços ${appName}.`);
        }

        const mapped: ServicePlan[] = rawData
          .map((service) => {
            const rawFeatures = Array.isArray(service.features) ? service.features : [];
            const features = rawFeatures.length
              ? rawFeatures
              : ["Entre em contato com nosso time para detalhes deste serviço."];

            let priceLabel: string | undefined = service.price_label;
            const priceValue =
              typeof service.price_value === "number"
                ? service.price_value
                : service.price_value
                ? Number(service.price_value)
                : undefined;

            if (!priceLabel && typeof priceValue === "number" && !Number.isNaN(priceValue)) {
              priceLabel = new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(priceValue);
            }

            const serviceCode = (service.service_code ?? service.cd_service ?? "").toString();
            const fallbackId = service.id_service
              ? String(service.id_service)
              : `SERVICE_${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
            const code = serviceCode && serviceCode.length ? serviceCode : fallbackId;
            const title =
              (service.service_name ?? service.nm_service ?? code) || `Serviço ${appName}`;

            return {
              id: code,
              code,
              title,
              description:
                service.description ??
                service.ds_resumo ??
                `Serviço disponibilizado pela equipe ${appName}.`,
              price: priceLabel ?? "Sob consulta",
              features,
              recommended:
                service.recommended === true ||
                service.recommended_flag === true ||
                service.st_recomendado === true,
              category: service.category || 'plano_base',
            } as ServicePlan;
          })
          .filter((plan) => plan.id);

        const sortedPlans = mapped.sort((a, b) => {
          // Ordenar por categoria primeiro
          const categoryOrder = { plano_base: 0, oferta: 1, diferencial: 2, addon: 3 };
          const categoryCompare = (categoryOrder[a.category || 'plano_base'] || 0) - (categoryOrder[b.category || 'plano_base'] || 0);
          if (categoryCompare !== 0) return categoryCompare;

          // Depois por recomendação
          const recommendationScore = Number(Boolean(b.recommended)) - Number(Boolean(a.recommended));
          if (recommendationScore !== 0) return recommendationScore;

          // Por último, por título
          return a.title.localeCompare(b.title);
        });

        const effectivePlans = sortedPlans.length ? sortedPlans : fallbackServicePlans;

        if (active) {
          setServicePlans(effectivePlans);
          setServicesError(null);
          setSelectedServiceCodes((prev) => {
            const availableIds = new Set(effectivePlans.map((plan) => plan.id));
            const filtered = prev.filter((code) => availableIds.has(code));
            if (filtered.length) {
              return filtered;
            }
            return getDefaultSelection(effectivePlans);
          });
        }
      } catch (error) {
        if (active) {
          console.error(`Falha ao carregar serviços ${appName}`, error);
          setServicesError(
            error instanceof Error
              ? error.message
              : `Não foi possível carregar os serviços ${appName} no momento.`,
          );
          setServicePlans(fallbackServicePlans);
          setSelectedServiceCodes((prev) => {
            if (prev.length) {
              return prev;
            }
            return getDefaultSelection(fallbackServicePlans);
          });
        }
      } finally {
        if (active) {
          setServicesLoading(false);
        }
      }
    };

    void loadServicePlans();

    return () => {
      active = false;
    };
  }, []);

  const resetFlow = (typeId: string) => {
    setSelectedTypeId(typeId);
    setCurrentStep(1);
    setSubmitted(false);
    setErrors({});
    setFormData(initialFormState);
    setSelectedServiceCodes(getDefaultSelection(servicePlans));
    setSelectedServicesError(null);
    setSubmitError(null);
  };

  const handleChange = (field: keyof FormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateStep = () => {
    const nextErrors: Partial<FormState> = {};
    let isValid = true;

    if (currentStep === 1) {
      if (!formData.contactName.trim()) {
        nextErrors.contactName = "Informe o nome do responsável.";
        isValid = false;
      }
      if (!formData.contactEmail.trim()) {
        nextErrors.contactEmail = "Informe o e-mail de contato.";
        isValid = false;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
        nextErrors.contactEmail = "E-mail inválido.";
        isValid = false;
      }
      if (!formData.contactPhone.trim()) {
        nextErrors.contactPhone = "Informe o telefone ou WhatsApp.";
        isValid = false;
      }
    }

    if (currentStep === 2) {
      // Validar que ao menos um plano base foi selecionado
      const selectedBasePlans = selectedServiceCodes.filter(code =>
        basePlans.some(plan => plan.id === code)
      );
      if (selectedBasePlans.length === 0) {
        setSelectedServicesError("Selecione ao menos um plano base para continuar.");
        isValid = false;
      }
    }

    if (currentStep === 4) {
      if (!formData.businessName.trim()) {
        nextErrors.businessName = "Informe o nome da empresa ou marca.";
        isValid = false;
      }
      if (!formData.cnpj.trim()) {
        nextErrors.cnpj = "Informe o CNPJ.";
        isValid = false;
      }
      if (!formData.city.trim()) {
        nextErrors.city = "Informe a cidade.";
        isValid = false;
      }
      if (!formData.state.trim()) {
        nextErrors.state = "Informe o estado.";
        isValid = false;
      }
      if (!formData.services.trim()) {
        nextErrors.services = "Descreva os serviços ou produtos oferecidos.";
        isValid = false;
      }
      if (!formData.differentiators.trim()) {
        nextErrors.differentiators = "Liste diferenciais ou certificações.";
        isValid = false;
      }
      if (!formData.teamSize.trim()) {
        nextErrors.teamSize = "Informe o tamanho da equipe.";
        isValid = false;
      }
    }

    setErrors(nextErrors);
    return isValid;
  };

  const handleNext = () => {
    setSubmitError(null);
    setSelectedServicesError(null);
    if (!validateStep()) return;
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  };

  const handlePrev = () => {
    setSubmitError(null);
    setSelectedServicesError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setSelectedServicesError(null);
    setSubmitError(null);

    const availableIds = new Set(servicePlans.map((plan) => plan.id));
    const normalizedSelection = (selectedServiceCodes.length
      ? selectedServiceCodes
      : getDefaultSelection(servicePlans)
    ).filter((code) => availableIds.has(code));

    if (normalizedSelection.length === 0) {
      setSelectedServicesError(`Selecione ao menos um serviço ${appName} para continuar.`);
      return;
    }

    setSelectedServiceCodes(normalizedSelection);
    setIsSubmitting(true);
    try {
      const payload = {
        partner_type: partnerTypeMap[selectedTypeId] ?? "clinica",
        contact_name: formData.contactName.trim(),
        contact_email: formData.contactEmail.trim(),
        contact_phone: formData.contactPhone.trim(),
        business_name: formData.businessName.trim(),
        cnpj: formData.cnpj.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        services: valueOrUndefined(formData.services),
        differentiators: valueOrUndefined(formData.differentiators),
        team_size: valueOrUndefined(formData.teamSize),
        catalog_link: valueOrUndefined(formData.catalogLink),
        notes: valueOrUndefined(formData.notes),
        selected_services: normalizedSelection.map((code) => ({ service_code: code })),
      };

      await apiClient.post("/partner-leads", payload);
      setSubmitted(true);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Não foi possível enviar o cadastro. Tente novamente em instantes.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleService = (serviceId: string) => {
    setSelectedServiceCodes((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId],
    );
    setSelectedServicesError(null);
  };

  return (
    <div className="space-y-10">
      <div className="grid gap-6 md:grid-cols-2">
        {types.map((type) => {
          const Icon = partnerIconMap[type.icon] ?? Building2;
          const active = type.id === selectedTypeId;
          return (
            <button
              key={type.id}
              onClick={() => resetFlow(type.id)}
              className={cn(
                "flex h-full flex-col overflow-hidden rounded-[28px] border bg-white text-left shadow-[0_22px_60px_-40px_rgba(160,120,90,0.35)] transition-transform",
                active
                  ? "border-transparent ring-2 ring-offset-2 ring-offset-white ring-blue-300"
                  : "border-[#ece4dc] hover:-translate-y-1",
              )}
            >
              <span className={`h-1 w-full bg-gradient-to-r ${type.accent}`} />
              <span className="flex flex-1 flex-col gap-5 px-6 py-6">
                <span className="flex items-center gap-3">
                  <span
                    className={`inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r ${type.accent} text-white`}
                  >
                    <Icon className="h-6 w-6" />
                  </span>
                  <span>
                    <span className="text-xl font-semibold text-[#2f2a26]">{type.title}</span>
                    <p className="text-sm text-[#5b524c]">{type.subtitle}</p>
                  </span>
                </span>
                <ul className="space-y-3 text-sm text-[#5b524c]">
                  {type.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
                <span
                  className={cn(
                    "mt-auto inline-flex items-center gap-2 text-sm font-semibold",
                    active ? "text-blue-600" : "text-slate-500",
                  )}
                >
                  {active ? "Selecionado" : "Selecionar"}
                  <ArrowRight className="h-4 w-4" />
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {selectedType && (
        <div className="space-y-6 rounded-[28px] border border-blue-100 bg-white p-6 shadow-lg shadow-pink-200/30">
          <div className="space-y-3 border-b border-blue-100 pb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-500">
              Cadastro em etapas
            </p>
            <div className="flex flex-wrap gap-3">
              {stepLabels.map((step, index) => {
                const stepNumber = index + 1;
                const active = stepNumber === currentStep;
                const completed = stepNumber < currentStep || submitted;
                return (
                  <div
                    key={step.title}
                    className={cn(
                      "flex flex-col rounded-2xl border px-4 py-3 transition-all sm:min-w-[200px]",
                      active
                        ? "border-blue-400 bg-blue-50"
                        : completed
                        ? "border-green-300 bg-green-50"
                        : "border-slate-200",
                    )}
                  >
                    <span className="text-xs font-semibold text-slate-500">
                      Etapa {stepNumber}
                    </span>
                    <span className="text-sm font-semibold text-slate-900">{step.title}</span>
                    <span className="text-xs text-slate-500">{step.description}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {!submitted ? (
            <>
              <div className="space-y-6">
                {/* ETAPA 1: Contato Principal */}
                {currentStep === 1 && (
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <LabelWithError
                        htmlFor="contactName"
                        label="Nome completo"
                        error={errors.contactName}
                      />
                      <Input
                        id="contactName"
                        value={formData.contactName}
                        onChange={(event) => handleChange("contactName", event.target.value)}
                        placeholder="Responsável pelo contrato"
                      />
                    </div>
                    <div className="space-y-2">
                      <LabelWithError
                        htmlFor="contactEmail"
                        label="E-mail comercial"
                        error={errors.contactEmail}
                      />
                      <Input
                        id="contactEmail"
                        type="email"
                        value={formData.contactEmail}
                        onChange={(event) => handleChange("contactEmail", event.target.value)}
                        placeholder="exemplo@empresa.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <LabelWithError
                        htmlFor="contactPhone"
                        label="Telefone / WhatsApp"
                        error={errors.contactPhone}
                      />
                      <Input
                        id="contactPhone"
                        value={formData.contactPhone}
                        onChange={(event) => handleChange("contactPhone", event.target.value)}
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <LabelWithError htmlFor="notes" label="Observações iniciais (opcional)" />
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(event) => handleChange("notes", event.target.value)}
                        placeholder="Ex.: Parcerias com convênios, metas comerciais, região de atuação..."
                        rows={3}
                      />
                    </div>
                  </div>
                )}

                {/* ETAPA 2: Planos Base */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <Sparkles className="h-5 w-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-slate-900">
                          Escolha os planos essenciais
                        </h3>
                      </div>
                      <p className="text-sm text-slate-600">
                        Selecione os planos base que melhor atendem às necessidades da sua operação.
                        Você pode escolher múltiplos planos.
                      </p>
                    </div>

                    {servicesLoading && (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                      </div>
                    )}

                    {servicesError && (
                      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {servicesError}
                      </div>
                    )}

                    {!servicesLoading && basePlans.length === 0 && (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-600">
                        Nenhum plano base disponível no momento.
                      </div>
                    )}

                    {!servicesLoading && basePlans.length > 0 && (
                      <div className="grid gap-4 sm:grid-cols-2">
                        {basePlans.map((plan) => {
                          const isSelected = selectedServiceCodes.includes(plan.id);
                          return (
                            <button
                              key={plan.id}
                              type="button"
                              onClick={() => toggleService(plan.id)}
                              className={cn(
                                "flex h-full flex-col rounded-3xl border p-5 text-left transition-all",
                                isSelected
                                  ? "border-blue-500 bg-blue-50 shadow-lg shadow-blue-200/50 ring-2 ring-blue-300"
                                  : "border-slate-200 bg-white hover:border-blue-200 hover:shadow-md",
                              )}
                            >
                              <div className="flex items-start justify-between mb-3">
                                <h4 className="text-base font-semibold text-slate-900 flex-1">
                                  {plan.title}
                                </h4>
                                {plan.recommended && (
                                  <span className="ml-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                                    Recomendado
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-slate-600 mb-3">{plan.description}</p>
                              <p className="text-lg font-bold text-blue-600 mb-3">{plan.price}</p>
                              <ul className="space-y-2 text-xs text-slate-600 mb-4">
                                {plan.features.slice(0, 3).map((feature, idx) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                                    <span>{feature}</span>
                                  </li>
                                ))}
                              </ul>
                              <span
                                className={cn(
                                  "mt-auto pt-3 text-sm font-semibold border-t",
                                  isSelected
                                    ? "text-blue-600 border-blue-200"
                                    : "text-slate-500 border-slate-200",
                                )}
                              >
                                {isSelected ? "✓ Selecionado" : "Selecionar plano"}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {selectedServicesError && (
                      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                        {selectedServicesError}
                      </div>
                    )}
                  </div>
                )}

                {/* ETAPA 3: Ofertas e Diferenciais */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div className="rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50 to-blue-50 p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <Sparkles className="h-5 w-5 text-purple-600" />
                        <h3 className="text-lg font-semibold text-slate-900">
                          Serviços adicionais e diferenciais
                        </h3>
                      </div>
                      <p className="text-sm text-slate-600">
                        Potencialize seu pacote com ofertas especiais e diferenciais competitivos.
                        Esta etapa é opcional, mas recomendamos escolher ao menos um diferencial.
                      </p>
                    </div>

                    {servicesLoading && (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                      </div>
                    )}

                    {!servicesLoading && specialPlans.length === 0 && (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center">
                        <p className="text-sm text-slate-600 mb-4">
                          Nenhuma oferta ou diferencial disponível no momento.
                        </p>
                        <Button
                          onClick={handleNext}
                          className="bg-gradient-to-r from-purple-600 via-cyan-500 to-purple-700 text-white"
                        >
                          Pular esta etapa
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    {!servicesLoading && specialPlans.length > 0 && (
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {specialPlans.map((plan) => {
                          const isSelected = selectedServiceCodes.includes(plan.id);
                          const isOferta = plan.category === 'oferta';
                          return (
                            <button
                              key={plan.id}
                              type="button"
                              onClick={() => toggleService(plan.id)}
                              className={cn(
                                "flex h-full flex-col rounded-3xl border p-5 text-left transition-all",
                                isSelected
                                  ? isOferta
                                    ? "border-green-500 bg-green-50 shadow-lg shadow-green-200/50 ring-2 ring-green-300"
                                    : "border-purple-500 bg-purple-50 shadow-lg shadow-purple-200/50 ring-2 ring-purple-300"
                                  : "border-slate-200 bg-white hover:border-purple-200 hover:shadow-md",
                              )}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <span
                                  className={cn(
                                    "rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                                    isOferta
                                      ? "bg-green-100 text-green-700"
                                      : "bg-purple-100 text-purple-700",
                                  )}
                                >
                                  {isOferta ? "Oferta" : "Diferencial"}
                                </span>
                                {plan.recommended && (
                                  <span className="ml-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                                    Top
                                  </span>
                                )}
                              </div>
                              <h4 className="text-base font-semibold text-slate-900 mb-2">
                                {plan.title}
                              </h4>
                              <p className="text-xs text-slate-600 mb-3 line-clamp-2">{plan.description}</p>
                              <p className="text-base font-bold text-purple-600 mb-3">{plan.price}</p>
                              <ul className="space-y-1.5 text-xs text-slate-600 mb-3">
                                {plan.features.slice(0, 2).map((feature, idx) => (
                                  <li key={idx} className="flex items-start gap-1.5">
                                    <span className="text-purple-500 shrink-0">•</span>
                                    <span className="line-clamp-2">{feature}</span>
                                  </li>
                                ))}
                              </ul>
                              <span
                                className={cn(
                                  "mt-auto pt-3 text-xs font-semibold border-t",
                                  isSelected
                                    ? isOferta
                                      ? "text-green-600 border-green-200"
                                      : "text-purple-600 border-purple-200"
                                    : "text-slate-500 border-slate-200",
                                )}
                              >
                                {isSelected ? "✓ Incluído" : "Adicionar"}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* ETAPA 4: Sobre a Operação */}
                {currentStep === 4 && (
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <LabelWithError
                        htmlFor="businessName"
                        label="Razão social / Nome fantasia"
                        error={errors.businessName}
                      />
                      <Input
                        id="businessName"
                        value={formData.businessName}
                        onChange={(event) => handleChange("businessName", event.target.value)}
                        placeholder="Empresa ou marca"
                      />
                    </div>
                    <div className="space-y-2">
                      <LabelWithError htmlFor="cnpj" label="CNPJ" error={errors.cnpj} />
                      <Input
                        id="cnpj"
                        value={formData.cnpj}
                        onChange={(event) => handleChange("cnpj", event.target.value)}
                        placeholder="00.000.000/0000-00"
                      />
                    </div>
                    <div className="space-y-2">
                      <LabelWithError htmlFor="city" label="Cidade" error={errors.city} />
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(event) => handleChange("city", event.target.value)}
                        placeholder="Cidade onde atua"
                      />
                    </div>
                    <div className="space-y-2">
                      <LabelWithError htmlFor="state" label="Estado" error={errors.state} />
                      <Input
                        id="state"
                        value={formData.state}
                        onChange={(event) => handleChange("state", event.target.value)}
                        placeholder="UF"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <LabelWithError
                        htmlFor="services"
                        label="Serviços, produtos ou especialidades"
                        error={errors.services}
                      />
                      <Textarea
                        id="services"
                        value={formData.services}
                        onChange={(event) => handleChange("services", event.target.value)}
                        placeholder="Liste os principais procedimentos, linhas de produtos ou soluções oferecidas."
                        rows={4}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <LabelWithError
                        htmlFor="differentiators"
                        label="Diferenciais e certificações"
                        error={errors.differentiators}
                      />
                      <Textarea
                        id="differentiators"
                        value={formData.differentiators}
                        onChange={(event) =>
                          handleChange("differentiators", event.target.value)
                        }
                        placeholder="Ex.: equipe especializada, equipamentos exclusivos, selo Anvisa, treinamentos periódicos..."
                        rows={4}
                      />
                    </div>
                    <div className="space-y-2">
                      <LabelWithError
                        htmlFor="teamSize"
                        label="Tamanho da equipe"
                        error={errors.teamSize}
                      />
                      <Input
                        id="teamSize"
                        value={formData.teamSize}
                        onChange={(event) => handleChange("teamSize", event.target.value)}
                        placeholder="Quantidade de profissionais envolvidos"
                      />
                    </div>
                    <div className="space-y-2">
                      <LabelWithError
                        htmlFor="catalogLink"
                        label="Link para portfólio ou catálogo (opcional)"
                      />
                      <Input
                        id="catalogLink"
                        value={formData.catalogLink}
                        onChange={(event) => handleChange("catalogLink", event.target.value)}
                        placeholder="https://"
                      />
                    </div>
                  </div>
                )}

                {/* ETAPA 5: Revisão */}
                {currentStep === 5 && (
                  <div className="space-y-6">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                      <p>
                        Você está cadastrando{" "}
                        <span className="font-semibold text-slate-800">
                          {selectedType?.title ?? "Parceiro"}
                        </span>
                        . Revise os dados principais e envie para nosso time.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-base font-semibold text-slate-900">Dados de contato</h4>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <SummaryItem label="Responsável" value={formData.contactName} />
                        <SummaryItem label="E-mail" value={formData.contactEmail} />
                        <SummaryItem label="Telefone" value={formData.contactPhone} />
                      </div>
                    </div>

                    <div className="space-y-4 border-t border-slate-200 pt-4">
                      <h4 className="text-base font-semibold text-slate-900">Dados da empresa</h4>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <SummaryItem label="Empresa" value={formData.businessName} />
                        <SummaryItem label="CNPJ" value={formData.cnpj} />
                        <SummaryItem
                          label="Localização"
                          value={`${formData.city || "-"} - ${formData.state || "-"}`}
                        />
                        <SummaryItem label="Equipe" value={formData.teamSize} />
                        <SummaryItem label="Catálogo" value={formData.catalogLink || "Não informado"} />
                      </div>
                    </div>

                    <div className="space-y-3 border-t border-slate-200 pt-4">
                      <h4 className="text-base font-semibold text-slate-900">
                        Serviços selecionados ({selectedServiceDetails.length})
                      </h4>
                      {selectedServiceDetails.length === 0 ? (
                        <p className="text-sm text-red-600">Nenhum serviço selecionado</p>
                      ) : (
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {selectedServiceDetails.map((service) => {
                            const categoryColors = {
                              plano_base: "border-blue-200 bg-blue-50",
                              oferta: "border-green-200 bg-green-50",
                              diferencial: "border-purple-200 bg-purple-50",
                              addon: "border-orange-200 bg-orange-50",
                            };
                            return (
                              <div
                                key={service.id}
                                className={cn(
                                  "rounded-xl border p-3",
                                  categoryColors[service.category || 'plano_base']
                                )}
                              >
                                <p className="text-sm font-semibold text-slate-900">{service.title}</p>
                                <p className="text-xs text-slate-600 mt-1">{service.price}</p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="border-t border-slate-200 pt-4 space-y-3">
                      <h4 className="text-base font-semibold text-slate-900">Resumo da oferta</h4>
                      <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <p className="text-sm font-medium text-slate-700 mb-1">Serviços oferecidos:</p>
                        <p className="text-sm text-slate-600 whitespace-pre-line">
                          {formData.services || "–"}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <p className="text-sm font-medium text-slate-700 mb-1">Diferenciais:</p>
                        <p className="text-sm text-slate-600 whitespace-pre-line">
                          {formData.differentiators || "–"}
                        </p>
                      </div>
                    </div>

                    {selectedServicesError && (
                      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                        {selectedServicesError}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap justify-between gap-3 pt-4 border-t border-slate-200">
                <Button
                  variant="ghost"
                  onClick={handlePrev}
                  disabled={currentStep === 1}
                  className="text-purple-600 hover:bg-purple-50"
                >
                  Voltar
                </Button>

                <div className="flex gap-2">
                  {currentStep < totalSteps && (
                    <Button
                      onClick={handleNext}
                      className="bg-gradient-to-r from-purple-600 via-cyan-500 to-purple-700 text-white hover:from-purple-700 hover:via-cyan-600 hover:to-purple-800"
                    >
                      Avançar etapa
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                  {currentStep === totalSteps && (
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="bg-green-600 text-white hover:bg-green-700"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          Enviar cadastro
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
              {submitError && (
                <div className="w-full rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {submitError}
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center gap-4 rounded-3xl border border-green-200 bg-green-50/70 p-8 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-green-800">
                  Cadastro enviado com sucesso!
                </h3>
                <p className="text-sm text-green-700">
                  Em até 24 horas nosso time entrará em contato para finalizar o onboarding e liberar o painel
                  do parceiro.
                </p>
              </div>
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                <Button asChild variant="outline">
                  <Link href="/admin/licencas">Ir para controle de licenças</Link>
                </Button>
                <Button
                  variant="ghost"
                  className="text-purple-600 hover:bg-purple-100"
                  onClick={() => resetFlow(selectedTypeId)}
                >
                  Cadastrar outro parceiro
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface LabelWithErrorProps {
  htmlFor: string;
  label: string;
  error?: string;
}

function LabelWithError({ htmlFor, label, error }: LabelWithErrorProps) {
  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={htmlFor} className="text-xs font-semibold text-slate-600 uppercase">
        {label}
      </Label>
      {error && <span className="text-xs font-medium text-red-600">{error}</span>}
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <p className="text-xs font-semibold text-slate-500 uppercase">{label}</p>
      <p className="text-sm font-medium text-slate-900 mt-1 line-clamp-2">{value || "–"}</p>
    </div>
  );
}
