"use client";

import { useState, useEffect } from "react";
import { Bot, X, Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

interface LeadFormData {
  name: string;
  email: string;
  phone: string;
}

interface ChatBubbleAssistantProps {
  onAuthRequired: () => void;
}

export function ChatBubbleAssistant({ onAuthRequired }: ChatBubbleAssistantProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [showBubble, setShowBubble] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pendingModalOpen, setPendingModalOpen] = useState(false);

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

  // Mostrar balão após 2 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowBubble(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Auto-fill do formulário com dados da sessão
  useEffect(() => {
    if (session?.user) {
      setFormData((prev) => ({
        ...prev,
        name: session.user.name || "",
        email: session.user.email || "",
      }));
    }
  }, [session]);

  // Debug: Monitorar mudanças no estado do modal
  useEffect(() => {
    console.log("[ChatBubbleAssistant] Modal state changed:", modalOpen);
  }, [modalOpen]);

  // Debug: Monitorar carregamento de perguntas
  useEffect(() => {
    console.log("[ChatBubbleAssistant] Questions loaded:", {
      count: questions.length,
      loading: loadingQuestions,
      questions: questions.map(q => q.nm_question),
    });
  }, [questions, loadingQuestions]);

  // Redirecionar automaticamente após login
  useEffect(() => {
    console.log("[ChatBubbleAssistant] Auth status changed:", {
      status,
      pendingModalOpen,
      hasSession: !!session,
    });

    if (status === "authenticated" && pendingModalOpen) {
      console.log("[ChatBubbleAssistant] Redirecionando após autenticação");
      setPendingModalOpen(false);
      router.push("/paciente/busca-inteligente");
    }
  }, [status, pendingModalOpen, session, router]);

  const handleBubbleClick = () => {
    console.log("[ChatBubbleAssistant] Clique detectado!", {
      status,
      session,
    });

    if (status === "unauthenticated") {
      console.log("[ChatBubbleAssistant] Usuário não autenticado, marcando tentativa pendente");
      setPendingModalOpen(true);
      onAuthRequired();
    } else if (status === "authenticated") {
      console.log("[ChatBubbleAssistant] Usuário autenticado, redirecionando para busca inteligente");
      router.push("/paciente/busca-inteligente");
    } else {
      console.log("[ChatBubbleAssistant] Status de autenticação:", status);
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

    setSubmitting(true);

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

      setModalOpen(false);
      // Redirecionar para busca inteligente
      setTimeout(() => {
        router.push("/paciente/busca-inteligente");
      }, 500);
    } catch (error) {
      console.error("Erro ao enviar lead:", error);
      alert("Erro ao enviar. Tente novamente.");
    } finally {
      setSubmitting(false);
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
            <Label className="block text-sm font-medium text-gray-700 mb-1">
              {question.nm_question}
              {question.st_required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              type={question.tp_input}
              value={value}
              onChange={(e) => handleQuestionChange(question.id_question, e.target.value)}
              placeholder={question.ds_placeholder || ""}
              className={cn(error && "border-red-300")}
            />
            {question.ds_help_text && (
              <p className="text-xs text-gray-500 mt-1">{question.ds_help_text}</p>
            )}
            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
          </div>
        );

      case "number":
        return (
          <div key={question.id_question}>
            <Label className="block text-sm font-medium text-gray-700 mb-1">
              {question.nm_question}
              {question.st_required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              type="number"
              value={value}
              onChange={(e) => handleQuestionChange(question.id_question, e.target.value)}
              placeholder={question.ds_placeholder || ""}
              className={cn(error && "border-red-300")}
            />
            {question.ds_help_text && (
              <p className="text-xs text-gray-500 mt-1">{question.ds_help_text}</p>
            )}
            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
          </div>
        );

      case "textarea":
        return (
          <div key={question.id_question}>
            <Label className="block text-sm font-medium text-gray-700 mb-1">
              {question.nm_question}
              {question.st_required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <textarea
              value={value}
              onChange={(e) => handleQuestionChange(question.id_question, e.target.value)}
              placeholder={question.ds_placeholder || ""}
              rows={3}
              className={cn(
                "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none",
                error && "border-red-300"
              )}
            />
            {question.ds_help_text && (
              <p className="text-xs text-gray-500 mt-1">{question.ds_help_text}</p>
            )}
            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
          </div>
        );

      case "select":
        const options = question.ds_options?.options || [];
        return (
          <div key={question.id_question}>
            <Label className="block text-sm font-medium text-gray-700 mb-1">
              {question.nm_question}
              {question.st_required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select
              value={value}
              onValueChange={(val) => handleQuestionChange(question.id_question, val)}
            >
              <SelectTrigger className={cn(error && "border-red-300")}>
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
              <p className="text-xs text-gray-500 mt-1">{question.ds_help_text}</p>
            )}
            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
          </div>
        );

      case "radio":
        const radioOptions = question.ds_options?.options || [];
        return (
          <div key={question.id_question}>
            <Label className="block text-sm font-medium text-gray-700 mb-2">
              {question.nm_question}
              {question.st_required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <RadioGroup
              value={value}
              onValueChange={(val) => handleQuestionChange(question.id_question, val)}
              className={cn("space-y-2", error && "border border-red-300 rounded-lg p-2")}
            >
              {radioOptions.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`${question.id_question}-${option}`} />
                  <Label
                    htmlFor={`${question.id_question}-${option}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            {question.ds_help_text && (
              <p className="text-xs text-gray-500 mt-1">{question.ds_help_text}</p>
            )}
            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
          </div>
        );

      case "checkbox":
        const checkboxOptions = question.ds_options?.options || [];
        const selectedValues = questionResponses[question.id_question] || [];
        return (
          <div key={question.id_question}>
            <Label className="block text-sm font-medium text-gray-700 mb-2">
              {question.nm_question}
              {question.st_required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className={cn("space-y-2", error && "border border-red-300 rounded-lg p-2")}>
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
                    className="text-sm font-normal cursor-pointer"
                  >
                    {option}
                  </Label>
                </div>
              ))}
            </div>
            {question.ds_help_text && (
              <p className="text-xs text-gray-500 mt-1">{question.ds_help_text}</p>
            )}
            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
          </div>
        );

      default:
        return null;
    }
  };

  if (!showBubble) return null;

  return (
    <>
      {/* Balão de Chat Flutuante */}
      <div className="fixed bottom-8 right-8 z-50 animate-in slide-in-from-bottom-4 fade-in duration-500">
        {/* Mensagem da Gisele */}
        <div
          className="mb-4 max-w-xs cursor-pointer group"
          onClick={handleBubbleClick}
        >
          {/* Balão de texto */}
          <div className="relative bg-white rounded-2xl shadow-2xl border-2 border-purple-200 p-4 transition-all hover:shadow-purple-300/50 hover:scale-105">
            {/* Texto */}
            <p className="text-sm text-gray-800 font-medium mb-2">
              Olá! 👋 Sou a <span className="text-purple-600 font-bold">Gisele</span>, sua assistente virtual.
            </p>
            <p className="text-xs text-gray-600">
              Precisa de ajuda para encontrar o procedimento ou profissional ideal? Clique aqui!
            </p>

            {/* Badge "Clique aqui" */}
            <div className="mt-3 flex items-center gap-2 text-xs text-purple-600 font-semibold">
              <Sparkles className="h-3 w-3 animate-pulse" />
              <span>Clique para começar</span>
              <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
            </div>

            {/* Seta do balão */}
            <div className="absolute -bottom-2 right-8 w-4 h-4 bg-white border-r-2 border-b-2 border-purple-200 transform rotate-45"></div>
          </div>

          {/* Botão fechar */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowBubble(false);
            }}
            className="absolute -top-2 -right-2 bg-gray-100 hover:bg-gray-200 rounded-full p-1 shadow-md transition-colors"
          >
            <X className="h-3 w-3 text-gray-600" />
          </button>
        </div>

        {/* Avatar da Gisele */}
        <div className="flex justify-end">
          <div
            className="relative w-16 h-16 cursor-pointer"
            onClick={handleBubbleClick}
          >
            {/* Círculo com gradiente */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 rounded-full animate-pulse shadow-lg shadow-purple-400/50"></div>
            {/* Ícone */}
            <div className="relative flex items-center justify-center w-full h-full">
              <Bot className="h-8 w-8 text-white" />
            </div>
            {/* Badge online */}
            <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Modal de Formulário de Leads */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-base font-bold text-gray-900">Busca Inteligente</div>
                <div className="text-xs text-purple-600 font-normal">Conte-nos o que procura</div>
              </div>
            </DialogTitle>
          </DialogHeader>

          {loadingQuestions ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
              <span className="ml-2 text-sm text-gray-600">Carregando perguntas...</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {/* Campos fixos do lead */}
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Seu nome completo"
                  className={cn(errors.name && "border-red-300")}
                />
                {errors.name && (
                  <p className="text-xs text-red-600 mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="seu@email.com"
                  className={cn(errors.email && "border-red-300")}
                />
                {errors.email && (
                  <p className="text-xs text-red-600 mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="(11) 99999-9999"
                  className={cn(errors.phone && "border-red-300")}
                />
                {errors.phone && (
                  <p className="text-xs text-red-600 mt-1">{errors.phone}</p>
                )}
              </div>

              {/* Divisor */}
              {questions.length > 0 && (
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-sm font-medium text-gray-700 mb-3">
                    Para personalizar sua busca, responda:
                  </p>
                </div>
              )}

              {/* Perguntas dinâmicas */}
              {questions.map((question) => renderQuestionInput(question))}

              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold shadow-md"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    Começar Busca Inteligente
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
