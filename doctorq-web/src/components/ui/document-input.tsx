"use client";

import { useState, useEffect } from "react";
import { Input } from "./input";
import { Label } from "./label";
import { cn } from "@/lib/utils";
import {
  validateDocument,
  getDocumentErrorMessage,
  formatCPF,
  formatCNPJ,
  removeNonNumeric,
} from "@/lib/utils/document-validation";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";

interface DocumentInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  type?: "cpf" | "cnpj" | "auto"; // auto detecta automaticamente
}

export function DocumentInput({
  value,
  onChange,
  label = "CPF/CNPJ",
  placeholder = "000.000.000-00 ou 00.000.000/0000-00",
  disabled = false,
  required = false,
  className,
  type = "auto",
}: DocumentInputProps) {
  const [focused, setFocused] = useState(false);
  const [touched, setTouched] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [isValid, setIsValid] = useState(false);
  const [detectedType, setDetectedType] = useState<"cpf" | "cnpj" | "unknown">(
    "unknown"
  );

  // Validação e formatação quando o valor muda
  useEffect(() => {
    if (!value) {
      setErrorMessage(undefined);
      setIsValid(false);
      setDetectedType("unknown");
      return;
    }

    const numbers = removeNonNumeric(value);

    // Detecta tipo baseado no comprimento
    if (type === "auto") {
      if (numbers.length <= 11) {
        setDetectedType("cpf");
      } else {
        setDetectedType("cnpj");
      }
    } else {
      setDetectedType(type);
    }

    // Validação completa
    if (touched || numbers.length >= 11) {
      const validation = validateDocument(value);
      setIsValid(validation.valid);
      setErrorMessage(getDocumentErrorMessage(value));
    }
  }, [value, type, touched]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const numbers = removeNonNumeric(inputValue);

    // Limita o tamanho baseado no tipo
    let maxLength = 14; // CNPJ por padrão
    if (type === "cpf") {
      maxLength = 11;
    } else if (type === "auto") {
      maxLength = 14; // Permite CNPJ se auto
    }

    if (numbers.length > maxLength) {
      return; // Não permite digitar mais que o máximo
    }

    // Formata automaticamente
    let formatted = inputValue;
    if (type === "cpf" || (type === "auto" && numbers.length <= 11)) {
      formatted = formatCPF(numbers);
    } else if (type === "cnpj" || (type === "auto" && numbers.length > 11)) {
      formatted = formatCNPJ(numbers);
    }

    onChange(formatted);
  };

  const handleBlur = () => {
    setFocused(false);
    setTouched(true);
  };

  const handleFocus = () => {
    setFocused(true);
  };

  // Define ícone de status
  const StatusIcon = () => {
    if (!value || !touched) return null;

    if (isValid) {
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    }

    if (errorMessage) {
      return <XCircle className="w-5 h-5 text-red-500" />;
    }

    return <AlertCircle className="w-5 h-5 text-yellow-500" />;
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label htmlFor="document-input">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}

      <div className="relative">
        <Input
          id="document-input"
          type="text"
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={cn(
            "pr-10",
            errorMessage && touched && "border-red-500 focus:ring-red-500",
            isValid && touched && "border-green-500 focus:ring-green-500"
          )}
        />

        {/* Ícone de status */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <StatusIcon />
        </div>
      </div>

      {/* Mensagem de erro */}
      {errorMessage && touched && !focused && (
        <p className="text-sm text-red-500 flex items-center gap-1">
          <XCircle className="w-4 h-4" />
          {errorMessage}
        </p>
      )}

      {/* Mensagem de sucesso */}
      {isValid && touched && !focused && (
        <p className="text-sm text-green-600 flex items-center gap-1">
          <CheckCircle2 className="w-4 h-4" />
          {detectedType === "cpf" ? "CPF válido" : "CNPJ válido"}
        </p>
      )}

      {/* Hint quando focado */}
      {focused && !errorMessage && (
        <p className="text-xs text-gray-500">
          {type === "cpf" && "Digite 11 dígitos do CPF"}
          {type === "cnpj" && "Digite 14 dígitos do CNPJ"}
          {type === "auto" && "CPF (11 dígitos) ou CNPJ (14 dígitos)"}
        </p>
      )}
    </div>
  );
}
