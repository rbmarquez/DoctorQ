"use client";

import { useState, useEffect } from "react";
import {
  Bot,
  Sparkles,
  ArrowRight,
  Check,
  Loader2,
  MessageSquare,
  X,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { apiClient } from "@/lib/api/client";
import { usePublicPartnerLeadQuestions } from "@/lib/api/hooks/usePartnerLeadQuestions";
import { cn } from "@/lib/utils";
import type { PartnerLeadQuestion } from "@/types/partner";

type CardState = "collapsed" | "form" | "submitting" | "success";

interface LeadFormData {
  name: string;
  email: string;
  phone: string;
}

export function AIAssistantSideCard({
  onAuthRequired,
}: {
  onAuthRequired: () => void;
}) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [cardState, setCardState] = useState<CardState>("collapsed");

  // Dados básicos do lead (fixos)
  const [formData, setFormData] = useState<LeadFormData>({
    name: "",
    email: "",
    phone: "",
  });

  // Respostas das perguntas dinâmicas
  const [questionResponses, setQuestionResponses] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Buscar perguntas dinâmicas para pacientes
  const { questions, isLoading: loadingQuestions } = usePublicPartnerLeadQuestions("paciente");

  useEffect(() => {
    if (session?.user) {
      setFormData((prev) => ({
        ...prev,
        name: session.user.name || "",
        email: session.user.email || "",
      }));
    }
  }, [session]);

  const handleGetStarted = () => {
    if (status === "unauthenticated") {
      onAuthRequired();
    } else if (status === "authenticated") {
      setCardState("form");
    }
  };

  const handleQuestionChange = (questionId: string, value: any) => {
    setQuestionResponses((prev) => ({
      ...prev,
      [questionId]: value,
    }));
    // Limpar erro se houver
    if (errors[questionId]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[questionId];
        return newErrors;
      });
    }
  };

  const handleCheckboxChange = (questionId: string, option: string, checked: boolean) => {
    const current = questionResponses[questionId] || [];
    const updated = checked
      ? [...current, option]
      : current.filter((item: string) => item !== option);

    setQuestionResponses((prev) => ({
      ...prev,
      [questionId]: updated,
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validar campos fixos
    if (!formData.name.trim()) newErrors.name = "Nome obrigatório";
    if (!formData.email.trim()) {
      newErrors.email = "Email obrigatório";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email inválido";
    }
    if (!formData.phone.trim()) newErrors.phone = "Telefone obrigatório";

    // Validar perguntas dinâmicas obrigatórias
    questions.forEach((question) => {
      if (question.st_required && question.st_active) {
        const response = questionResponses[question.id_question];
        if (!response || (Array.isArray(response) && response.length === 0) || response === "") {
          newErrors[question.id_question] = "Campo obrigatório";
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setCardState("submitting");

    try {
      // Montar objeto de metadados com as respostas
      const metadata: Record<string, any> = {};
      questions.forEach((question) => {
        const response = questionResponses[question.id_question];
        if (response !== undefined && response !== null && response !== "") {
          metadata[question.nm_question] = response;
        }
      });

      await apiClient.post("/partner/leads/", {
        tp_partner: "paciente",
        nm_contato: formData.name,
        nm_email: formData.email,
        nm_telefone: formData.phone,
        nm_empresa: formData.name, // Para pacientes, usar o nome como empresa
        ds_metadata: metadata,
      });

      setCardState("success");
      setTimeout(() => {
        router.push("/paciente/busca-inteligente");
      }, 2000);
    } catch (error) {
      console.error("Erro ao enviar lead:", error);
      setCardState("form");
      alert("Erro ao enviar. Tente novamente.");
    }
  };

  const renderQuestionInput = (question: PartnerLeadQuestion) => {
    const value = questionResponses[question.id_question] || "";
    const error = errors[question.id_question];

    switch (question.tp_input) {
      case "text":
      case "email":
      case "tel":
        return (
          <div key={question.id_question}>
            <Label className="block text-xs font-medium text-gray-700 mb-1">
              {question.nm_question}
              {question.st_required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              type={question.tp_input}
              value={value}
              onChange={(e) => handleQuestionChange(question.id_question, e.target.value)}
              placeholder={question.ds_placeholder || ""}
              className={cn("h-9 text-sm", error && "border-red-300")}
            />
            {question.ds_help_text && (
              <p className="text-xs text-gray-500 mt-0.5">{question.ds_help_text}</p>
            )}
            {error && <p className="text-xs text-red-600 mt-0.5">{error}</p>}
          </div>
        );

      case "number":
        return (
          <div key={question.id_question}>
            <Label className="block text-xs font-medium text-gray-700 mb-1">
              {question.nm_question}
              {question.st_required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              type="number"
              value={value}
              onChange={(e) => handleQuestionChange(question.id_question, e.target.value)}
              placeholder={question.ds_placeholder || ""}
              className={cn("h-9 text-sm", error && "border-red-300")}
            />
            {question.ds_help_text && (
              <p className="text-xs text-gray-500 mt-0.5">{question.ds_help_text}</p>
            )}
            {error && <p className="text-xs text-red-600 mt-0.5">{error}</p>}
          </div>
        );

      case "textarea":
        return (
          <div key={question.id_question}>
            <Label className="block text-xs font-medium text-gray-700 mb-1">
              {question.nm_question}
              {question.st_required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <textarea
              value={value}
              onChange={(e) => handleQuestionChange(question.id_question, e.target.value)}
              placeholder={question.ds_placeholder || ""}
              rows={2}
              className={cn(
                "w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none",
                error && "border-red-300"
              )}
            />
            {question.ds_help_text && (
              <p className="text-xs text-gray-500 mt-0.5">{question.ds_help_text}</p>
            )}
            {error && <p className="text-xs text-red-600 mt-0.5">{error}</p>}
          </div>
        );

      case "select":
        const options = question.ds_options?.options || [];
        return (
          <div key={question.id_question}>
            <Label className="block text-xs font-medium text-gray-700 mb-1">
              {question.nm_question}
              {question.st_required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select
              value={value}
              onValueChange={(val) => handleQuestionChange(question.id_question, val)}
            >
              <SelectTrigger className={cn("h-9 text-sm", error && "border-red-300")}>
                <SelectValue placeholder={question.ds_placeholder || "Selecione..."} />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {question.ds_help_text && (
              <p className="text-xs text-gray-500 mt-0.5">{question.ds_help_text}</p>
            )}
            {error && <p className="text-xs text-red-600 mt-0.5">{error}</p>}
          </div>
        );

      case "radio":
        const radioOptions = question.ds_options?.options || [];
        return (
          <div key={question.id_question}>
            <Label className="block text-xs font-medium text-gray-700 mb-1">
              {question.nm_question}
              {question.st_required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <RadioGroup
              value={value}
              onValueChange={(val) => handleQuestionChange(question.id_question, val)}
              className={cn("space-y-1.5", error && "border border-red-300 rounded-lg p-2")}
            >
              {radioOptions.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`${question.id_question}-${option}`} />
                  <Label
                    htmlFor={`${question.id_question}-${option}`}
                    className="text-xs font-normal cursor-pointer"
                  >
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            {question.ds_help_text && (
              <p className="text-xs text-gray-500 mt-0.5">{question.ds_help_text}</p>
            )}
            {error && <p className="text-xs text-red-600 mt-0.5">{error}</p>}
          </div>
        );

      case "checkbox":
        const checkboxOptions = question.ds_options?.options || [];
        const selectedValues = questionResponses[question.id_question] || [];
        return (
          <div key={question.id_question}>
            <Label className="block text-xs font-medium text-gray-700 mb-1">
              {question.nm_question}
              {question.st_required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className={cn("space-y-1.5", error && "border border-red-300 rounded-lg p-2")}>
              {checkboxOptions.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${question.id_question}-${option}`}
                    checked={selectedValues.includes(option)}
                    onCheckedChange={(checked) =>
                      handleCheckboxChange(question.id_question, option, checked as boolean)
                    }
                  />
                  <Label
                    htmlFor={`${question.id_question}-${option}`}
                    className="text-xs font-normal cursor-pointer"
                  >
                    {option}
                  </Label>
                </div>
              ))}
            </div>
            {question.ds_help_text && (
              <p className="text-xs text-gray-500 mt-0.5">{question.ds_help_text}</p>
            )}
            {error && <p className="text-xs text-red-600 mt-0.5">{error}</p>}
          </div>
        );

      default:
        return null;
    }
  };

  if (cardState === "collapsed") {
    return (
      <div className="bg-gradient-to-br from-white via-purple-50/30 to-blue-50/30 rounded-2xl p-5 border-2 border-purple-200 shadow-lg shadow-purple-200/50 sticky top-24 transition-all hover:shadow-xl hover:shadow-purple-300/50 hover:border-purple-300">
        {/* Badge "NOVO" animado */}
        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md animate-bounce">
          NOVO
        </div>

        {/* Header com gradiente e brilho */}
        <div className="relative mb-4">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 rounded-xl blur opacity-20 animate-pulse" />
          <div className="relative flex items-center gap-3 bg-white rounded-xl p-3 border border-purple-100">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 shadow-lg shadow-purple-300/50">
              <Bot className="h-6 w-6 text-white animate-pulse" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Busca Inteligente
              </h3>
              <p className="text-xs text-purple-600 flex items-center gap-1 font-medium">
                <Sparkles className="h-3 w-3 animate-pulse" />
                Powered by IA
              </p>
            </div>
            <Zap className="h-5 w-5 text-yellow-500 animate-pulse" />
          </div>
        </div>

        {/* Benefícios com ícones */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-xs text-gray-700">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100">
              <Check className="h-3 w-3 text-green-600" />
            </div>
            <span className="font-medium">Recomendações personalizadas</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-700">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100">
              <Check className="h-3 w-3 text-blue-600" />
            </div>
            <span className="font-medium">Profissionais verificados</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-700">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-100">
              <Check className="h-3 w-3 text-purple-600" />
            </div>
            <span className="font-medium">100% Grátis</span>
          </div>
        </div>

        {/* CTA com animação de pulso */}
        <Button
          onClick={handleGetStarted}
          disabled={status === "loading"}
          className="w-full h-11 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white font-semibold shadow-lg shadow-purple-300/50 hover:shadow-xl hover:shadow-purple-400/50 transition-all hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group"
        >
          {/* Efeito de brilho animado */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />

          {status === "loading" ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Começar Agora
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </Button>

        {/* Footer com destaque */}
        <p className="mt-3 text-center text-xs text-gray-500">
          {status === "authenticated" ? (
            <span className="text-purple-600 font-medium">
              ✨ Continue para busca personalizada
            </span>
          ) : (
            "Faça login para começar"
          )}
        </p>
      </div>
    );
  }

  if (cardState === "form") {
    return (
      <div className="bg-white rounded-2xl p-5 border-2 border-purple-200 shadow-lg sticky top-24 max-h-[85vh] overflow-y-auto">
        {/* Header com botão fechar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-md">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900">Conte-nos mais</h4>
              <p className="text-xs text-purple-600">Rápido e fácil</p>
            </div>
          </div>
          <button
            onClick={() => setCardState("collapsed")}
            className="rounded-full p-1.5 hover:bg-gray-100 transition"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        {loadingQuestions ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
            <span className="ml-2 text-xs text-gray-600">Carregando...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Campos fixos */}
            <div>
              <Label className="block text-xs font-medium text-gray-700 mb-1">
                Nome <span className="text-red-500">*</span>
              </Label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Seu nome"
                className={cn("h-9 text-sm", errors.name && "border-red-300")}
              />
              {errors.name && (
                <p className="text-xs text-red-600 mt-0.5">{errors.name}</p>
              )}
            </div>

            <div>
              <Label className="block text-xs font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="seu@email.com"
                className={cn("h-9 text-sm", errors.email && "border-red-300")}
              />
              {errors.email && (
                <p className="text-xs text-red-600 mt-0.5">{errors.email}</p>
              )}
            </div>

            <div>
              <Label className="block text-xs font-medium text-gray-700 mb-1">
                Telefone <span className="text-red-500">*</span>
              </Label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phone: e.target.value }))
                }
                placeholder="(11) 99999-9999"
                className={cn("h-9 text-sm", errors.phone && "border-red-300")}
              />
              {errors.phone && (
                <p className="text-xs text-red-600 mt-0.5">{errors.phone}</p>
              )}
            </div>

            {/* Divisor */}
            {questions.length > 0 && (
              <div className="border-t border-gray-200 pt-2 mt-3">
                <p className="text-xs font-medium text-gray-700 mb-2">
                  Para personalizar sua busca:
                </p>
              </div>
            )}

            {/* Perguntas dinâmicas */}
            {questions.map((question) => renderQuestionInput(question))}

            <Button
              type="submit"
              className="w-full h-10 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-cyan-700 text-white text-sm font-semibold shadow-md mt-4"
            >
              Continuar
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        )}
      </div>
    );
  }

  if (cardState === "submitting") {
    return (
      <div className="bg-white rounded-2xl p-6 border-2 border-purple-200 shadow-lg sticky top-24">
        <div className="text-center">
          <div className="relative mx-auto mb-4">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-lg opacity-50 animate-pulse" />
            <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mx-auto shadow-lg">
              <Loader2 className="h-7 w-7 text-white animate-spin" />
            </div>
          </div>
          <h4 className="text-sm font-bold text-gray-900 mb-1">Processando...</h4>
          <p className="text-xs text-gray-600">Aguarde um momento</p>
        </div>
      </div>
    );
  }

  if (cardState === "success") {
    return (
      <div className="bg-white rounded-2xl p-6 border-2 border-green-200 shadow-lg sticky top-24">
        <div className="text-center">
          <div className="relative mx-auto mb-4">
            <div className="absolute inset-0 bg-green-400 rounded-full blur-lg opacity-50 animate-pulse" />
            <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-600 mx-auto shadow-lg animate-scale-in">
              <Check className="h-7 w-7 text-white" />
            </div>
          </div>
          <h4 className="text-base font-bold text-gray-900 mb-1">Perfeito! ✨</h4>
          <p className="text-xs text-gray-600 mb-3">Redirecionando para busca inteligente...</p>
          <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 animate-progress" />
          </div>
        </div>
      </div>
    );
  }

  return null;
}
