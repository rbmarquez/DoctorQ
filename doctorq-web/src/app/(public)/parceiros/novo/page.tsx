"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  CheckCircle2,
  CreditCard,
  Gift,
  FileText,
  Info,
  Loader2,
  Shield,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { usePartnerActivation } from "@/hooks/usePartnerActivation";

type ServiceCategory = "plano_base" | "oferta" | "diferencial" | "addon";
type PartnerType = "clinica" | "profissional" | "fabricante" | "fornecedor" | "universal";

interface PartnerServiceDefinition {
  id_service: string;
  service_code: string;
  service_name: string;
  description?: string | null;
  price_value?: number | null;
  price_label?: string | null;
  features: string[];
  active: boolean;
  recommended: boolean;
  category?: ServiceCategory;
  partner_type?: PartnerType;
  max_licenses?: number | null;
  yearly_discount?: number;
}

interface PlanOption {
  code: string;
  name: string;
  description: string;
  features: string[];
  monthlyPrice: number;
  yearlyPrice: number;
  priceLabel?: string;
  recommended: boolean;
  badgeText?: string;
  yearlyDiscount: number;
}

interface AddOnOption extends PlanOption {
  category: ServiceCategory;
}

type BillingCycleOption = "monthly" | "yearly";

type PartnerFormState = {
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  cnpj: string;
  businessType: "clinic" | "professional" | "spa" | "network";
  employees: string;
  currentSolution: string;
  needs: string;
  acceptTerms: boolean;
};

type Step = "plans" | "addons" | "info" | "payment" | "confirmation";

const DEFAULT_YEARLY_DISCOUNT = 0.17;

const FALLBACK_SERVICES: PartnerServiceDefinition[] = [
  {
    id_service: "PLATAFORMA",
    service_code: "PLATAFORMA",
    service_name: "Acesso à Plataforma",
    description: "Painel completo de gestão de agenda, pacientes e marketplace.",
    price_value: 149,
    price_label: "R$ 149/mês por unidade",
    features: [
      "Agenda inteligente com confirmações automáticas",
      "Perfil destacado no marketplace DoctorQ",
      "Relatórios financeiros e de performance em tempo real",
    ],
    active: true,
    recommended: true,
    category: "plano_base",
    partner_type: "universal",
    yearly_discount: 17,
  },
  {
    id_service: "CENTRAL_ATENDIMENTO",
    service_code: "CENTRAL_ATENDIMENTO",
    service_name: "Central de Atendimento 360º",
    description: "Equipe DoctorQ atende seus clientes 7 dias por semana.",
    price_value: 199,
    price_label: "R$ 199/mês por equipe",
    features: [
      "Atendimento telefônico, chat e e-mail com scripts personalizados",
      "Follow-up automático de orçamentos e ausências",
      "Integração com campanhas de marketing e CRM",
    ],
    active: true,
    recommended: false,
    category: "diferencial",
    partner_type: "universal",
    yearly_discount: 17,
  },
  {
    id_service: "WHATSAPP_INTELIGENTE",
    service_code: "WHATSAPP_INTELIGENTE",
    service_name: "WhatsApp Inteligente",
    description: "Fluxos automatizados, catálogo de serviços e integrações.",
    price_value: 89,
    price_label: "R$ 89/mês por linha",
    features: [
      "Chatbot com pré-venda e avaliação de perfil do cliente",
      "Envio em massa segmentado e campanhas de retorno",
      "Integração com agenda e disparo de lembretes",
    ],
    active: true,
    recommended: false,
    category: "oferta",
    partner_type: "universal",
    yearly_discount: 17,
  },
  {
    id_service: "CHATBOT_ESTETIQ",
    service_code: "CHATBOT_ESTETIQ",
    service_name: "Chatbot DoctorQ",
    description: "Assistente virtual com conhecimento sobre seus serviços.",
    price_value: 59,
    price_label: "R$ 59/mês por canal",
    features: [
      "Treinamento com base no site e materiais da sua operação",
      "Captação e qualificação de leads em tempo real",
      "Handoff para equipe humana dentro da plataforma",
    ],
    active: true,
    recommended: false,
    category: "addon",
    yearly_discount: 17,
    partner_type: "universal",
  },
  {
    id_service: "ESTETIQ_ACADEMY",
    service_code: "ESTETIQ_ACADEMY",
    service_name: "Academy & Treinamentos",
    description: "Capacite sua equipe com trilhas exclusivas DoctorQ.",
    price_value: 39,
    price_label: "R$ 39/mês por usuário",
    features: [
      "Cursos certificados sobre marketing, vendas e gestão em saúde",
      "Atualizações mensais com tendências de mercado",
      "Mentorias em grupo com especialistas DoctorQ",
    ],
    active: true,
    recommended: false,
    category: "addon",
    partner_type: "universal",
    yearly_discount: 17,
  },
];

const categoryLabels: Record<ServiceCategory, string> = {
  plano_base: "Plano Base",
  oferta: "Oferta Especial",
  diferencial: "Diferencial Competitivo",
  addon: "Serviço Adicional",
};

const partnerTypeMap: Record<PartnerFormState["businessType"], "clinica" | "profissional" | "fabricante" | "fornecedor"> = {
  clinic: "clinica",
  professional: "profissional",
  spa: "clinica",
  network: "clinica",
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(value);

const formatCNPJ = (value: string) => {
  const numbers = value.replace(/\D/g, "");
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 5) return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
  if (numbers.length <= 8) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`;
  if (numbers.length <= 12) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`;
  return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`;
};

const formatPhone = (value: string) => {
  const numbers = value.replace(/\D/g, "");
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  if (numbers.length <= 10) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
};

const calculateYearlyPrice = (monthlyPrice: number, yearlyDiscount = DEFAULT_YEARLY_DISCOUNT) => {
  const yearly = monthlyPrice * 12 * (1 - yearlyDiscount);
  return Math.round(yearly * 100) / 100;
};

const sanitizeFeatures = (features: string[] | null | undefined) => {
  if (!Array.isArray(features) || !features.length) {
    return ["Entre em contato com nosso time para detalhes deste serviço."];
  }
  return features.filter(Boolean);
};

const mapServiceToPlan = (service: PartnerServiceDefinition): PlanOption => {
  const monthlyPrice = typeof service.price_value === "number" ? service.price_value : 0;
  const yearlyDiscount = (service.yearly_discount ?? 17) / 100; // Converter de percentual para decimal
  const yearlyPrice = calculateYearlyPrice(monthlyPrice, yearlyDiscount);
  return {
    code: service.service_code,
    name: service.service_name,
    description:
      service.description ??
      "Serviço disponível no ecossistema DoctorQ. Consulte nossa equipe para detalhes.",
    features: sanitizeFeatures(service.features),
    monthlyPrice,
    yearlyPrice,
    priceLabel: service.price_label ?? formatCurrency(monthlyPrice),
    recommended: !!service.recommended,
    badgeText: service.category === "addon" ? categoryLabels[service.category] : undefined,
    yearlyDiscount,
  };
};

export default function NovoParceirosPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activatePartner, isActivating, result } = usePartnerActivation();

  const [services, setServices] = useState<PartnerServiceDefinition[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState<string | null>(null);

  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [billingCycle, setBillingCycle] = useState<BillingCycleOption>("yearly");
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [step, setStep] = useState<Step>("plans");
  const [isLoading, setIsLoading] = useState(false);
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);

  const [formData, setFormData] = useState<PartnerFormState>({
    businessName: "",
    contactName: "",
    email: "",
    phone: "",
    cnpj: "",
    businessType: "clinic",
    employees: "",
    currentSolution: "",
    needs: "",
    acceptTerms: false,
  });

  // Ler parâmetros da URL (email e type)
  useEffect(() => {
    const emailParam = searchParams.get("email");
    const typeParam = searchParams.get("type");

    if (emailParam) {
      setFormData((prev) => ({ ...prev, email: decodeURIComponent(emailParam) }));
    }

    if (typeParam) {
      // Mapear tipo da URL para businessType
      const typeMapping: Record<string, PartnerFormState["businessType"]> = {
        clinicas: "clinic",
        profissionais: "professional",
        fornecedores: "spa",
        fabricantes: "network",
      };
      const mappedType = typeMapping[typeParam] || "clinic";
      setFormData((prev) => ({ ...prev, businessType: mappedType }));

      toast.success(`Tipo de perfil selecionado: ${typeParam === "clinicas" ? "Clínica" : typeParam === "profissionais" ? "Profissional" : "Fornecedor"}`);
    }
  }, [searchParams]);

  useEffect(() => {
    let active = true;
    const loadServices = async () => {
      setServicesLoading(true);
      try {
        const response = await fetch("/api/partner/services");
        if (!response.ok) {
          const detail = await response.json().catch(() => ({}));
          throw new Error(detail?.detail || "Não foi possível carregar os planos no momento.");
        }
        const data = (await response.json()) as PartnerServiceDefinition[];
        if (!active) return;
        const cleaned = Array.isArray(data) && data.length ? data : FALLBACK_SERVICES;
        setServices(cleaned.filter((service) => service.active !== false));
        setServicesError(null);
      } catch (error) {
        console.error("[NovoParceirosPage] Falha ao carregar serviços", error);
        if (!active) return;
        setServices(FALLBACK_SERVICES);
        setServicesError(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar os planos. Exibindo catálogo padrão."
        );
        toast.error("Não foi possível carregar o catálogo atualizado. Exibindo opções padrão.");
      } finally {
        if (active) {
          setServicesLoading(false);
        }
      }
    };

    loadServices();
    return () => {
      active = false;
    };
  }, []);

  const plans = useMemo<PlanOption[]>(() => {
    const currentPartnerType = partnerTypeMap[formData.businessType];

    const basePlans = services
      .filter((service) => {
        // Filtrar apenas planos base
        const isBasePlan = (service.category ?? "plano_base") === "plano_base";
        if (!isBasePlan) return false;

        // Filtrar por partner_type
        const servicePartnerType = service.partner_type ?? "universal";
        const isCompatible = servicePartnerType === "universal" || servicePartnerType === currentPartnerType;

        return isCompatible;
      })
      .map(mapServiceToPlan);

    if (basePlans.length) {
      return basePlans;
    }

    // Fallback também deve respeitar o filtro
    return FALLBACK_SERVICES
      .filter((service) => {
        const isBasePlan = service.category === "plano_base";
        const servicePartnerType = service.partner_type ?? "universal";
        const isCompatible = servicePartnerType === "universal" || servicePartnerType === currentPartnerType;
        return isBasePlan && isCompatible;
      })
      .map(mapServiceToPlan);
  }, [services, formData.businessType]);

  const addOnOptions = useMemo<AddOnOption[]>(() => {
    const currentPartnerType = partnerTypeMap[formData.businessType];

    const extras = services
      .filter((service) => {
        // Filtrar apenas serviços adicionais (não são planos base)
        const isAddon = (service.category ?? "plano_base") !== "plano_base";
        if (!isAddon) return false;

        // Filtrar por partner_type
        const servicePartnerType = service.partner_type ?? "universal";
        const isCompatible = servicePartnerType === "universal" || servicePartnerType === currentPartnerType;

        return isCompatible;
      })
      .map((service) => ({
        ...mapServiceToPlan(service),
        category: service.category ?? "addon",
      }));

    if (extras.length) {
      return extras;
    }

    // Fallback também deve respeitar o filtro
    return FALLBACK_SERVICES
      .filter((service) => {
        const isAddon = service.category !== "plano_base";
        const servicePartnerType = service.partner_type ?? "universal";
        const isCompatible = servicePartnerType === "universal" || servicePartnerType === currentPartnerType;
        return isAddon && isCompatible;
      })
      .map((service) => ({
        ...mapServiceToPlan(service),
        category: service.category ?? "addon",
      }));
  }, [services, formData.businessType]);

  useEffect(() => {
    if (!plans.length) return;
    setSelectedPlan((prev) => (plans.some((plan) => plan.code === prev) ? prev : plans[0].code));
  }, [plans]);

  useEffect(() => {
    setSelectedAddons((prev) => prev.filter((code) => code !== selectedPlan));
  }, [selectedPlan]);

  const selectedPlanDetails = useMemo(
    () => plans.find((plan) => plan.code === selectedPlan),
    [plans, selectedPlan]
  );

  const selectedAddonsDetails = useMemo(
    () => addOnOptions.filter((addon) => selectedAddons.includes(addon.code)),
    [addOnOptions, selectedAddons]
  );

  const selectedServiceCodes = useMemo(() => {
    const codes = new Set<string>();
    if (selectedPlan) codes.add(selectedPlan);
    selectedAddons.forEach((addon) => codes.add(addon));
    return Array.from(codes);
  }, [selectedPlan, selectedAddons]);

  const calculatePlanPrice = (plan: PlanOption | undefined, cycle: BillingCycleOption) => {
    if (!plan) return 0;
    const price = cycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
    return Math.max(price, 0);
  };

  const calculateTotal = () => {
    const base = calculatePlanPrice(selectedPlanDetails, billingCycle);
    const addons = selectedAddonsDetails.reduce(
      (total, addon) => total + calculatePlanPrice(addon, billingCycle),
      0
    );
    return base + addons;
  };

  const handleAddonToggle = (code: string) => {
    setSelectedAddons((prev) =>
      prev.includes(code) ? prev.filter((item) => item !== code) : [...prev, code]
    );
  };

  const handleNext = async () => {
    if (step === "plans") {
      if (!selectedPlan) {
        toast.error("Selecione um plano para continuar.");
        return;
      }
      setStep("addons");
      return;
    }

    if (step === "addons") {
      setStep("info");
      return;
    }

    if (step === "info") {
      const trimmedBusinessName = formData.businessName.trim();
      const trimmedContactName = formData.contactName.trim();
      const trimmedEmail = formData.email.trim();
      const trimmedPhone = formData.phone.trim();
      const numericPhone = trimmedPhone.replace(/\D/g, "");

      if (!trimmedBusinessName || !trimmedEmail || !trimmedContactName) {
        toast.error("Preencha nome da empresa, responsável e e-mail para continuar.");
        return;
      }

      if (trimmedBusinessName.length < 3) {
        toast.error("O nome da empresa deve possuir no mínimo 3 caracteres.");
        return;
      }

      if (trimmedContactName.length < 3) {
        toast.error("O nome do responsável deve possuir no mínimo 3 caracteres.");
        return;
      }

      if (numericPhone.length < 10) {
        toast.error("Informe telefone válido com DDD (mínimo 10 dígitos)");
        return;
      }
      if (!formData.acceptTerms) {
        toast.error("Você precisa aceitar os termos de uso para continuar.");
        return;
      }
      setStep("payment");
      return;
    }

    if (step === "payment") {
      const trimmedBusinessName = formData.businessName.trim();
      const trimmedContactName = formData.contactName.trim();
      const trimmedPhone = formData.phone.trim();
      const numericPhone = trimmedPhone.replace(/\D/g, "");

      if (trimmedBusinessName.length < 3 || trimmedContactName.length < 3) {
        toast.error("Reveja o nome da empresa e do responsável (mínimo de 3 caracteres).");
        return;
      }
      if (numericPhone.length < 10) {
        toast.error("Informe telefone válido com DDD (mínimo 10 dígitos)");
        return;
      }

      const trimmedEmail = formData.email.trim();

      setIsLoading(true);
      try {
        const activationResult = await activatePartner({
          partner_type: partnerTypeMap[formData.businessType] || "clinica",
          contact_name: trimmedContactName,
          contact_email: trimmedEmail,
          contact_phone: trimmedPhone,
          business_name: trimmedBusinessName,
          cnpj: formData.cnpj || undefined,
          selected_services: selectedServiceCodes.length
            ? selectedServiceCodes
            : [selectedPlanDetails?.code ?? "PLATAFORMA"],
          plan_type: selectedPlanDetails?.code ?? "custom",
          billing_cycle: billingCycle === "yearly" ? "yearly" : "monthly",
          needs: formData.needs || undefined,
          accept_terms: formData.acceptTerms,
        });

        if (activationResult) {
          setStep("confirmation");
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handlePrev = () => {
    if (step === "addons") {
      setStep("plans");
    } else if (step === "info") {
      setStep("addons");
    } else if (step === "payment") {
      setStep("info");
    }
  };

  const stepsOrder: Step[] = ["plans", "addons", "info", "payment", "confirmation"];

  const getStepLabel = (current: Step) => {
    switch (current) {
      case "plans":
        return "Escolha o Plano";
      case "addons":
        return "Serviços Adicionais";
      case "info":
        return "Seus Dados";
      case "payment":
        return "Resumo";
      case "confirmation":
        return "Confirmação";
      default:
        return "";
    }
  };

  const renderPriceLabel = (plan: PlanOption) => {
    const price = calculatePlanPrice(plan, billingCycle);
    if (price === 0) {
      return "Gratuito";
    }
    const baseText =
      billingCycle === "monthly"
        ? `${formatCurrency(plan.monthlyPrice)}/mês`
        : `${formatCurrency(plan.yearlyPrice)}/ano`;
    return plan.priceLabel ? `${baseText}` : baseText;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <div className="bg-white/80 backdrop-blur border-b">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-6 px-4 py-4 sm:px-6 lg:px-8">
          {stepsOrder.map((currentStep, index) => {
            const isActive = currentStep === step;
            const stepIndex = stepsOrder.indexOf(step);
            const isCompleted = stepIndex > index || step === "confirmation";
            return (
              <div
                key={currentStep}
                className={`flex items-center gap-2 ${
                  isActive ? "text-blue-600 font-medium" : isCompleted ? "text-green-600" : "text-gray-400"
                }`}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                    isActive
                      ? "border-blue-600 bg-blue-50"
                      : isCompleted
                      ? "border-green-600 bg-green-50"
                      : "border-gray-300 bg-white"
                  }`}
                >
                  {isCompleted && !isActive ? <Check className="h-4 w-4" /> : <span>{index + 1}</span>}
                </div>
                <span className="hidden sm:inline capitalize">{getStepLabel(currentStep)}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {servicesError && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardContent className="flex items-center gap-3 py-4 text-sm text-orange-700">
              <Info className="h-5 w-5" />
              {servicesError}
            </CardContent>
          </Card>
        )}

        {step === "plans" && (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700">
                <Sparkles className="h-4 w-4" />
                Escolha seu ponto de partida na DoctorQ
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Planos pensados para o crescimento da sua clínica
              </h1>
              <p className="text-base text-slate-600 sm:text-lg">
                Combine o plano base ideal com serviços adicionais para construir a solução perfeita para o seu time.
              </p>
              <div className="flex items-center justify-center gap-4 pt-4">
                <span className={billingCycle === "monthly" ? "font-medium" : "text-gray-500"}>Mensal</span>
                <Switch
                  checked={billingCycle === "yearly"}
                  onCheckedChange={(checked) => setBillingCycle(checked ? "yearly" : "monthly")}
                />
                <span className={billingCycle === "yearly" ? "font-medium" : "text-gray-500"}>Anual</span>
                {billingCycle === "yearly" && selectedPlanDetails && (
                  <Badge className="bg-green-100 text-green-800">
                    <Gift className="mr-1 h-3 w-3" />
                    Economize {Math.round(selectedPlanDetails.yearlyDiscount * 100)}%
                  </Badge>
                )}
              </div>
            </div>

            {servicesLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {plans.map((plan) => {
                  const isSelected = selectedPlan === plan.code;
                  return (
                    <Card
                      key={plan.code}
                      className={`relative h-full cursor-pointer rounded-3xl border transition-all duration-300 ${
                        isSelected
                          ? "border-blue-300 shadow-[0_20px_60px_-30px_rgba(236,72,153,0.55)]"
                          : "border-gray-200 hover:shadow-[0_18px_40px_-35px_rgba(30,41,59,0.45)]"
                      }`}
                      onClick={() => setSelectedPlan(plan.code)}
                    >
                      <CardHeader className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="rounded-full border-blue-200 bg-blue-50 text-blue-600">
                            Plano Base
                          </Badge>
                          {plan.recommended && (
                            <Badge className="flex items-center gap-1 rounded-full bg-purple-100 text-purple-700">
                              <BadgeCheck className="h-3 w-3" />
                              Recomendado
                            </Badge>
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-2xl font-semibold text-slate-900">{plan.name}</CardTitle>
                          <CardDescription className="mt-2 text-sm text-slate-600">
                            {plan.description}
                          </CardDescription>
                        </div>
                        <div className="space-y-1">
                          <div className="text-3xl font-semibold text-slate-900">
                            {renderPriceLabel(plan)}
                          </div>
                          {billingCycle === "yearly" && (
                            <p className="text-xs text-slate-500">
                              Cobrança anual com {Math.round(plan.yearlyDiscount * 100)}% OFF versus mensal
                            </p>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-3">
                          {plan.features.slice(0, 4).map((feature) => (
                            <div key={feature} className="flex items-start gap-2 text-sm text-slate-600">
                              <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" />
                              <span>{feature}</span>
                            </div>
                          ))}
                          {plan.features.length > 4 && (
                            <p className="text-xs text-slate-500">
                              +{plan.features.length - 4} benefícios inclusos
                            </p>
                          )}
                        </div>
                        <Button
                          variant={isSelected ? "default" : "outline"}
                          className="w-full"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedPlan(plan.code);
                          }}
                        >
                          {isSelected ? "Selecionado" : "Selecionar"}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {plans.length > 1 && (
              <div className="text-center">
                <Button
                  variant="link"
                  onClick={() => setShowComparison(!showComparison)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  {showComparison ? "Ocultar" : "Ver"} comparação completa
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            )}

            {showComparison && plans.length > 1 && (
              <Card>
                <CardHeader>
                  <CardTitle>Comparação rápida</CardTitle>
                  <CardDescription>
                    Confira os principais benefícios de cada plano base lado a lado.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="py-2">Plano</th>
                          {plans.map((plan) => (
                            <th key={plan.code} className="py-2 text-center">
                              {plan.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        <tr>
                          <td className="py-3 font-medium">Preço Mensal</td>
                          {plans.map((plan) => (
                            <td key={plan.code} className="py-3 text-center">
                              {formatCurrency(plan.monthlyPrice)}
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="py-3 font-medium">Preço Anual</td>
                          {plans.map((plan) => (
                            <td key={plan.code} className="py-3 text-center">
                              {formatCurrency(plan.yearlyPrice)}
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="py-3 font-medium">Benefícios</td>
                          {plans.map((plan) => (
                            <td key={plan.code} className="py-3">
                              <ul className="list-disc space-y-1 pl-5 text-left text-xs text-slate-600">
                                {plan.features.slice(0, 4).map((feature) => (
                                  <li key={feature}>{feature}</li>
                                ))}
                                {plan.features.length > 4 && (
                                  <li className="text-slate-400">
                                    +{plan.features.length - 4} adicionais
                                  </li>
                                )}
                              </ul>
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end gap-3">
              <Button
                className="bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg hover:shadow-xl"
                size="lg"
                onClick={handleNext}
                disabled={!selectedPlan}
              >
                Continuar
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === "addons" && (
          <div className="space-y-8">
            <div className="space-y-3 text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-purple-100 px-4 py-2 text-sm font-medium text-purple-700">
                <Shield className="h-4 w-4" />
                Personalize com serviços adicionais
              </div>
              <h2 className="text-3xl font-bold text-slate-900">Potencialize sua operação</h2>
              <p className="text-base text-slate-600 sm:text-lg">
                Escolha serviços complementares para acelerar resultados. Você pode ajustar estes módulos quando quiser.
              </p>
              <div className="flex items-center justify-center gap-4 pt-4">
                <span className={billingCycle === "monthly" ? "font-medium" : "text-gray-500"}>Mensal</span>
                <Switch
                  checked={billingCycle === "yearly"}
                  onCheckedChange={(checked) => setBillingCycle(checked ? "yearly" : "monthly")}
                />
                <span className={billingCycle === "yearly" ? "font-medium" : "text-gray-500"}>Anual</span>
                {billingCycle === "yearly" && (
                  <Badge className="bg-green-100 text-green-800">
                    <Gift className="mr-1 h-3 w-3" />
                    Economize até 30%
                  </Badge>
                )}
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {addOnOptions.map((addon) => {
                const isSelected = selectedAddons.includes(addon.code);
                return (
                  <Card
                    key={addon.code}
                    className={`relative h-full rounded-3xl border transition-all duration-300 ${
                      isSelected
                        ? "border-purple-300 shadow-[0_20px_60px_-30px_rgba(147,51,234,0.45)]"
                        : "border-gray-200 hover:shadow-[0_18px_40px_-35px_rgba(30,41,59,0.35)]"
                    }`}
                  >
                    <CardHeader className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="rounded-full border-purple-200 bg-purple-50 text-purple-700">
                          {categoryLabels[addon.category]}
                        </Badge>
                        {addon.recommended && (
                          <Badge className="rounded-full bg-green-100 text-green-700">Popular</Badge>
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-xl font-semibold text-slate-900">{addon.name}</CardTitle>
                        <CardDescription className="mt-2 text-sm text-slate-600">
                          {addon.description}
                        </CardDescription>
                      </div>
                      <div className="space-y-1">
                        <div className="text-2xl font-semibold text-slate-900">{renderPriceLabel(addon)}</div>
                        {billingCycle === "yearly" && (
                          <p className="text-xs text-slate-500">
                            Economize {Math.round(addon.yearlyDiscount * 100)}% no plano anual
                          </p>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ul className="space-y-2 text-sm text-slate-600">
                        {addon.features.slice(0, 3).map((feature) => (
                          <li key={feature} className="flex items-start gap-2">
                            <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-purple-500" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="flex items-center justify-between rounded-2xl border border-purple-100 bg-purple-50/60 px-4 py-2">
                        <div className="text-xs text-slate-500">Adicionar ao pacote</div>
                        <Switch
                          checked={isSelected}
                          onCheckedChange={() => handleAddonToggle(addon.code)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div>
                <p className="text-sm font-medium text-slate-700">Serviços Selecionados</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  <Badge className="rounded-full bg-blue-100 text-blue-700">{selectedPlanDetails?.name}</Badge>
                  {selectedAddonsDetails.map((addon) => (
                    <Badge key={addon.code} className="rounded-full bg-purple-100 text-purple-700">
                      {addon.name}
                    </Badge>
                  ))}
                  {!selectedAddonsDetails.length && (
                    <span className="text-xs text-slate-500">Nenhum serviço adicional selecionado</span>
                  )}
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handlePrev}>
                  Voltar
                </Button>
                <Button
                  className="bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg hover:shadow-xl"
                  onClick={handleNext}
                >
                  Avançar
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === "info" && (
          <div className="mx-auto max-w-4xl space-y-8">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
                <Info className="h-4 w-4" />
                Dados do responsável
              </div>
              <h2 className="text-3xl font-bold text-slate-900">Conte-nos sobre sua operação</h2>
              <p className="text-base text-slate-600 sm:text-lg">
                Essas informações nos ajudam a configurar sua conta e direcionar seu onboarding com especialistas.
              </p>
            </div>

            <Card className="rounded-3xl border-slate-200 shadow-lg shadow-slate-900/5">
              <CardHeader>
                <CardTitle>Informações da empresa</CardTitle>
                <CardDescription>Preencha os dados para avançar para o resumo e ativação imediata.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>CNPJ</Label>
                    <Input
                      value={formData.cnpj}
                      onChange={(event) => {
                        const formatted = formatCNPJ(event.target.value);
                        setFormData((prev) => ({ ...prev, cnpj: formatted }));
                      }}
                      placeholder="00.000.000/0000-00"
                      maxLength={18}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nome da empresa ou clínica</Label>
                    <Input
                      value={formData.businessName}
                      onChange={(event) =>
                        setFormData((prev) => ({ ...prev, businessName: event.target.value }))
                      }
                      placeholder="Clínica de Saúde Exemplo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nome do responsável</Label>
                    <Input
                      value={formData.contactName}
                      onChange={(event) =>
                        setFormData((prev) => ({ ...prev, contactName: event.target.value }))
                      }
                      placeholder="Nome completo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>E-mail comercial</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))}
                      placeholder="contato@empresa.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone com DDD</Label>
                    <Input
                      value={formData.phone}
                      onChange={(event) => {
                        const formatted = formatPhone(event.target.value);
                        setFormData((prev) => ({ ...prev, phone: formatted }));
                      }}
                      placeholder="(11) 99999-0000"
                      maxLength={15}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Quais objetivos você quer atingir com a DoctorQ? (opcional)</Label>
                  <Textarea
                    rows={3}
                    value={formData.needs}
                    onChange={(event) => setFormData((prev) => ({ ...prev, needs: event.target.value }))}
                    placeholder="Ex: reduzir no-show, automatizar contato com pacientes, acompanhar indicadores em tempo real..."
                  />
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <Switch
                    checked={formData.acceptTerms}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, acceptTerms: checked }))
                    }
                  />
                  <p className="text-xs text-slate-600">
                    Ao continuar confirmo que li e concordo com os{" "}
                    <button
                      type="button"
                      onClick={() => setShowTermsDialog(true)}
                      className="text-blue-600 underline hover:text-blue-700"
                    >
                      Termos de Uso
                    </button>{" "}
                    e com a{" "}
                    <button
                      type="button"
                      onClick={() => setShowPrivacyDialog(true)}
                      className="text-blue-600 underline hover:text-blue-700"
                    >
                      Política de Privacidade
                    </button>{" "}
                    da DoctorQ.
                  </p>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={handlePrev}>
                    Voltar
                  </Button>
                  <Button
                    className="bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg hover:shadow-xl"
                    onClick={handleNext}
                  >
                    Avançar para resumo
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === "payment" && (
          <div className="space-y-8">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                <Card className="rounded-3xl border-slate-200 shadow-lg shadow-slate-900/5">
                  <CardHeader>
                    <CardTitle>Resumo da assinatura</CardTitle>
                    <CardDescription>
                      Revise os itens selecionados antes de confirmar a ativação imediata.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold text-blue-700">
                            {selectedPlanDetails?.name ?? "Plano DoctorQ"}
                          </p>
                          <p className="text-xs text-blue-600">
                            {billingCycle === "monthly"
                              ? "Cobrança mensal"
                              : `Cobrança anual (${Math.round((selectedPlanDetails?.yearlyDiscount ?? 0.17) * 100)}% OFF)`}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-blue-700">
                          {formatCurrency(calculatePlanPrice(selectedPlanDetails, billingCycle))}
                        </p>
                      </div>

                      {selectedAddonsDetails.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            Serviços adicionais
                          </p>
                          {selectedAddonsDetails.map((addon) => (
                            <div
                              key={addon.code}
                              className="flex items-center justify-between rounded-2xl border border-purple-100 bg-purple-50/60 px-4 py-3"
                            >
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-slate-800">{addon.name}</span>
                                <span className="text-xs text-slate-500">
                                  {billingCycle === "monthly" ? "Mensal" : "Anual"}
                                </span>
                              </div>
                              <span className="text-sm font-semibold text-slate-800">
                                {formatCurrency(calculatePlanPrice(addon, billingCycle))}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                        <span>Total {billingCycle === "monthly" ? "mensal" : "anual"}</span>
                        <span>{formatCurrency(calculateTotal())}</span>
                      </div>
                      {billingCycle === "yearly" && (
                        <p className="mt-1 text-xs text-slate-500">
                          Equivalente a {formatCurrency(calculateTotal() / 12)} por mês
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-3xl border-slate-200 shadow-lg shadow-slate-900/5">
                  <CardHeader>
                    <CardTitle>Dados para emissão</CardTitle>
                    <CardDescription>
                      Fique tranquilo: você receberá o contrato digital e a nota fiscal assim que finalizar.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-slate-600">
                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      <CreditCard className="h-5 w-5 text-blue-500" />
                      Pagamento simplificado via fatura digital (cartão ou pix corporativo).
                    </div>
                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      <Shield className="h-5 w-5 text-purple-500" />
                      SSL 256-bit | PCI Compliant | Time dedicado de onboarding e suporte premium.
                    </div>
                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      <FileText className="h-5 w-5 text-emerald-500" />
                      Contrato e nota fiscal emitidos automaticamente após a confirmação.
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="h-fit rounded-3xl border-slate-200 shadow-xl shadow-slate-900/10">
                <CardHeader>
                  <CardTitle>Contato principal</CardTitle>
                  <CardDescription>
                    Confira se os dados estão corretos. Usaremos essas informações para contato e acesso.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-slate-600">
                  <div>
                    <p className="font-medium text-slate-900">{formData.contactName || "Responsável não informado"}</p>
                    <p>{formData.email || "E-mail não informado"}</p>
                    <p>{formData.phone || "Telefone não informado"}</p>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Empresa</p>
                    <p>{formData.businessName || "Nome não informado"}</p>
                    <p>{formData.cnpj || "CNPJ não informado"}</p>
                  </div>
                  <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-xs text-green-700">
                    <p className="font-semibold">Pronto para ativar!</p>
                    <p>Ao confirmar, seu acesso é liberado imediatamente e um especialista entra em contato.</p>
                  </div>

                  <div className="space-y-3">
                    <Button variant="outline" onClick={handlePrev} className="w-full">
                      Voltar
                    </Button>
                    <Button
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg hover:shadow-xl"
                      size="lg"
                      onClick={handleNext}
                      disabled={isLoading || isActivating}
                    >
                      {isLoading || isActivating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Ativando...
                        </>
                      ) : (
                        <>
                          Ativar agora
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                    <p className="text-center text-xs text-slate-500">
                      Ao confirmar você concorda com a cobrança e com o início imediato dos serviços DoctorQ.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {step === "confirmation" && result && (
          <div className="mx-auto max-w-2xl space-y-6">
            <Card className="rounded-3xl border-green-200 bg-white shadow-xl shadow-green-500/10">
              <CardContent className="py-12">
                <div className="space-y-4 text-center">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                    <CheckCircle2 className="h-10 w-10 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold">Parabéns! Acesso liberado imediatamente 🎉</h2>
                  <p className="mx-auto max-w-md text-slate-600">
                    Seu cadastro foi aprovado e você já tem acesso completo à plataforma DoctorQ! Confira as credenciais abaixo.
                  </p>

                  <Card className="mx-auto max-w-sm border-2 border-blue-200 bg-gradient-to-br from-blue-50 via-white to-cyan-50">
                    <CardHeader>
                      <CardTitle className="text-center text-lg font-semibold">Credenciais de acesso</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-left">
                      <div className="space-y-1">
                        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">E-mail</span>
                        <span className="block rounded border bg-white px-3 py-2 font-mono text-sm">
                          {result.credentials.email}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          Senha temporária
                        </span>
                        <span className="block rounded border bg-white px-3 py-2 font-mono text-sm font-bold text-blue-600">
                          {result.credentials.temporary_password}
                        </span>
                      </div>
                      <p className="pt-2 text-center text-xs text-orange-600">
                        ⚠️ Guarde esta senha! Você precisará alterá-la no primeiro login.
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="mx-auto max-w-sm border-slate-200 bg-slate-50">
                    <CardContent className="space-y-2 py-4 text-left text-sm text-slate-600">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Plano</span>
                        <span className="font-medium text-slate-900">
                          {selectedPlanDetails?.name ?? result.package.package_name}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Serviços</span>
                        <span className="font-medium text-slate-900">
                          {selectedServiceCodes.join(", ")}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Status</span>
                        <Badge className="rounded-full bg-green-100 text-green-800">
                          {result.package.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex justify-center gap-3 pt-4">
                    <Button variant="outline" onClick={() => router.push("/login")}>
                      Ir para login
                    </Button>
                    <Button
                      className="bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg hover:shadow-xl"
                      onClick={() => router.push(result.access_info.dashboard_url)}
                    >
                      Acessar dashboard
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-slate-200">
              <CardHeader>
                <CardTitle>Próximos passos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-600">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">Acesse seu e-mail</p>
                    <p>Enviamos as credenciais de acesso para {formData.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">Configure sua conta</p>
                    <p>Personalize seu perfil, conecte agenda e convide a equipe.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">Agende o onboarding</p>
                    <p>Nosso especialista entrará em contato em até 24h para acelerar seus resultados.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Dialog - Termos de Uso */}
      <Dialog open={showTermsDialog} onOpenChange={setShowTermsDialog}>
        <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Termos de Uso - DoctorQ</DialogTitle>
            <DialogDescription>
              Última atualização: {new Date().toLocaleDateString("pt-BR")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm text-slate-700">
            <section>
              <h3 className="font-bold text-lg mb-2">1. Aceitação dos Termos</h3>
              <p>
                Ao acessar e utilizar a plataforma DoctorQ, você concorda em cumprir e estar vinculado aos presentes
                Termos de Uso. Se você não concorda com qualquer parte destes termos, não deve utilizar nossos serviços.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-lg mb-2">2. Descrição dos Serviços</h3>
              <p>
                A DoctorQ oferece uma plataforma SaaS para gestão de clínicas de saúde, incluindo agendamento online,
                gestão de pacientes, marketplace de produtos, relatórios financeiros e ferramentas de inteligência artificial
                para otimização do atendimento.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-lg mb-2">3. Responsabilidades do Usuário</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Fornecer informações precisas e atualizadas durante o cadastro</li>
                <li>Manter a confidencialidade de suas credenciais de acesso</li>
                <li>Utilizar a plataforma de acordo com as leis aplicáveis</li>
                <li>Não compartilhar seu acesso com terceiros não autorizados</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-lg mb-2">4. Pagamentos e Assinaturas</h3>
              <p>
                Os planos são cobrados de acordo com a periodicidade escolhida (mensal ou anual). O cancelamento pode
                ser realizado a qualquer momento, com efeito ao final do período já pago. Não realizamos reembolsos
                proporcionais em caso de cancelamento antecipado.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-lg mb-2">5. Propriedade Intelectual</h3>
              <p>
                Todo o conteúdo, design, código e funcionalidades da plataforma DoctorQ são de propriedade exclusiva
                da empresa e estão protegidos por leis de direitos autorais e propriedade intelectual.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-lg mb-2">6. Limitação de Responsabilidade</h3>
              <p>
                A DoctorQ não se responsabiliza por danos indiretos, lucros cessantes ou perdas de dados decorrentes
                do uso ou impossibilidade de uso da plataforma. Recomendamos manter backups regulares de suas informações.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-lg mb-2">7. Modificações dos Termos</h3>
              <p>
                Reservamo-nos o direito de modificar estes termos a qualquer momento. Usuários ativos serão notificados
                por e-mail sobre alterações significativas com 30 dias de antecedência.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-lg mb-2">8. Contato</h3>
              <p>
                Para dúvidas sobre estes Termos de Uso, entre em contato através do e-mail: suporte@doctorq.app
              </p>
            </section>
          </div>
          <div className="flex justify-end pt-4">
            <Button onClick={() => setShowTermsDialog(false)}>Fechar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog - Política de Privacidade */}
      <Dialog open={showPrivacyDialog} onOpenChange={setShowPrivacyDialog}>
        <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Política de Privacidade - DoctorQ</DialogTitle>
            <DialogDescription>
              Última atualização: {new Date().toLocaleDateString("pt-BR")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm text-slate-700">
            <section>
              <h3 className="font-bold text-lg mb-2">1. Informações que Coletamos</h3>
              <p>Coletamos as seguintes informações:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li><strong>Dados de cadastro:</strong> Nome, e-mail, telefone, CNPJ, endereço da clínica</li>
                <li><strong>Dados de uso:</strong> Logs de acesso, IP, navegador, páginas visitadas</li>
                <li><strong>Dados de pacientes:</strong> Informações cadastradas pelos profissionais na plataforma</li>
                <li><strong>Dados financeiros:</strong> Histórico de transações e faturas</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-lg mb-2">2. Como Utilizamos suas Informações</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Fornecer, operar e manter nossos serviços</li>
                <li>Processar transações e enviar confirmações</li>
                <li>Melhorar e personalizar sua experiência na plataforma</li>
                <li>Enviar comunicações relacionadas ao serviço (lembretes, atualizações, suporte)</li>
                <li>Analisar o uso da plataforma para melhorias contínuas</li>
                <li>Cumprir obrigações legais e regulatórias</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-lg mb-2">3. Compartilhamento de Dados</h3>
              <p>
                Não vendemos seus dados pessoais. Podemos compartilhar informações apenas com:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Provedores de serviços essenciais (processamento de pagamento, hospedagem)</li>
                <li>Autoridades governamentais quando exigido por lei</li>
                <li>Parceiros de negócios, apenas com seu consentimento expresso</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-lg mb-2">4. Segurança dos Dados</h3>
              <p>
                Implementamos medidas de segurança técnicas e organizacionais para proteger suas informações, incluindo:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Criptografia SSL/TLS para transmissão de dados</li>
                <li>Armazenamento seguro com criptografia AES-256</li>
                <li>Controles de acesso baseados em função</li>
                <li>Auditorias regulares de segurança</li>
                <li>Backups automáticos e seguros</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-lg mb-2">5. Seus Direitos (LGPD)</h3>
              <p>De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem direito a:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Confirmar a existência de tratamento de seus dados</li>
                <li>Acessar seus dados pessoais</li>
                <li>Corrigir dados incompletos, inexatos ou desatualizados</li>
                <li>Solicitar anonimização, bloqueio ou eliminação de dados</li>
                <li>Portabilidade de dados a outro fornecedor</li>
                <li>Revogar consentimento a qualquer momento</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-lg mb-2">6. Cookies e Tecnologias Similares</h3>
              <p>
                Utilizamos cookies para melhorar sua experiência, incluindo cookies essenciais, de desempenho e
                de personalização. Você pode gerenciar suas preferências de cookies nas configurações do navegador.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-lg mb-2">7. Retenção de Dados</h3>
              <p>
                Mantemos seus dados pessoais pelo tempo necessário para cumprir as finalidades descritas nesta política,
                ou conforme exigido por lei. Dados de pacientes são mantidos conforme regulamentação do setor de saúde.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-lg mb-2">8. Contato - Encarregado de Dados (DPO)</h3>
              <p>
                Para exercer seus direitos ou esclarecer dúvidas sobre privacidade, entre em contato com nosso
                Encarregado de Proteção de Dados:
              </p>
              <p className="mt-2">
                <strong>E-mail:</strong> privacidade@doctorq.app<br />
                <strong>Telefone:</strong> (11) 0000-0000
              </p>
            </section>
          </div>
          <div className="flex justify-end pt-4">
            <Button onClick={() => setShowPrivacyDialog(false)}>Fechar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
