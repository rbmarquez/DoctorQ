"use client";

import { useState, useEffect } from "react";
import { Loader2, AlertCircle } from "lucide-react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePublicPartnerLeadQuestions } from "@/lib/api/hooks/usePartnerLeadQuestions";
import { cn } from "@/lib/utils";
import type { PartnerLeadQuestion, PartnerType } from "@/types/partner";

interface LeadInfoFormProps {
  tpPartner: PartnerType;
  onSubmit: (responses: Record<string, any>) => void | Promise<void>;
  onSkip?: () => void;
  submitLabel?: string;
  skipLabel?: string;
  showSkipButton?: boolean;
  showButtons?: boolean;
  formId?: string;
  className?: string;
}

export function LeadInfoForm({
  tpPartner,
  onSubmit,
  onSkip,
  submitLabel = "Continuar",
  skipLabel = "Pular esta etapa",
  showSkipButton = false,
  showButtons = true,
  formId,
  className,
}: LeadInfoFormProps) {
  const [questionResponses, setQuestionResponses] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Buscar perguntas dinâmicas
  const { questions, isLoading, isError } = usePublicPartnerLeadQuestions(tpPartner);

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

    // Validar perguntas obrigatórias
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

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);

    try {
      // Montar objeto de respostas com nomes de perguntas como chaves
      const responses: Record<string, any> = {};
      questions.forEach((question) => {
        const response = questionResponses[question.id_question];
        if (response !== undefined && response !== null && response !== "") {
          responses[question.nm_question] = response;
        }
      });

      await onSubmit(responses);
    } catch (error) {
      console.error("Erro ao submeter formulário:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
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
            <Label className="block text-sm font-medium text-gray-700 mb-1.5">
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
            <Label className="block text-sm font-medium text-gray-700 mb-1.5">
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
            <Label className="block text-sm font-medium text-gray-700 mb-1.5">
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
            <Label className="block text-sm font-medium text-gray-700 mb-1.5">
              {question.nm_question}
              {question.st_required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select
              value={value}
              onValueChange={(val) => handleQuestionChange(question.id_question, val)}
            >
              <SelectTrigger className={cn(error && "border-red-300")}>
                <SelectValue placeholder={question.ds_placeholder || "Selecione uma opção..."} />
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
              className={cn("space-y-2", error && "border border-red-300 rounded-lg p-3")}
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
            <div className={cn("space-y-2", error && "border border-red-300 rounded-lg p-3")}>
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

      case "date":
        return (
          <div key={question.id_question}>
            <Label className="block text-sm font-medium text-gray-700 mb-1.5">
              {question.nm_question}
              {question.st_required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              type="date"
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

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center py-12", className)}>
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        <span className="ml-3 text-gray-600">Carregando perguntas...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Erro ao carregar perguntas. Tente novamente mais tarde.
        </AlertDescription>
      </Alert>
    );
  }

  if (questions.length === 0) {
    return (
      <Alert className={className}>
        <AlertDescription>
          Nenhuma pergunta cadastrada para este tipo de parceiro.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form id={formId} onSubmit={handleSubmitForm} className={cn("space-y-5", className)}>
      {/* Renderizar todas as perguntas */}
      {questions.map((question) => renderQuestionInput(question))}

      {/* Botões de ação */}
      {showButtons && (
        <div className="flex gap-3 pt-4">
          {showSkipButton && onSkip && (
            <Button
              type="button"
              variant="outline"
              onClick={handleSkip}
              disabled={submitting}
              className="flex-1"
            >
              {skipLabel}
            </Button>
          )}
          <Button
            type="submit"
            disabled={submitting}
            className={cn(
              "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold shadow-md",
              !showSkipButton && "w-full"
            )}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              submitLabel
            )}
          </Button>
        </div>
      )}
    </form>
  );
}
