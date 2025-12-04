'use client';

/**
 * MaskedInput Component
 *
 * Input com suporte a máscaras customizáveis para diferentes tipos de dados.
 *
 * Tipos suportados:
 * - cpf: 000.000.000-00
 * - cnpj: 00.000.000/0000-00
 * - document: Auto-detecta CPF ou CNPJ
 * - phone: (00) 00000-0000
 * - cep: 00000-000
 * - currency: R$ 1.234,56
 * - date: 00/00/0000
 * - time: 00:00
 * - creditCard: 0000 0000 0000 0000
 * - rg: 00.000.000-0
 * - custom: Pattern personalizado
 */

import { forwardRef, InputHTMLAttributes, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  cpfMask,
  cnpjMask,
  phoneMask,
  cepMask,
  currencyMask,
  dateMask,
  timeMask,
  creditCardMask,
  rgMask,
  documentMask,
  customMask,
  onlyNumbers,
  isValidCPF,
  isValidCNPJ,
  isValidPhone,
  isValidCEP,
  isValidDocument,
} from '@/lib/utils/masks';

export type MaskType =
  | 'cpf'
  | 'cnpj'
  | 'document'
  | 'phone'
  | 'cep'
  | 'currency'
  | 'date'
  | 'time'
  | 'creditCard'
  | 'rg'
  | 'custom';

export interface MaskedInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  /** Tipo de máscara a aplicar */
  maskType: MaskType;

  /** Pattern customizado (apenas para maskType='custom') */
  customPattern?: string;

  /** Valor do input */
  value?: string;

  /** Callback ao mudar valor (retorna valor com máscara e sem máscara) */
  onChange?: (maskedValue: string, rawValue: string) => void;

  /** Validar automaticamente ao perder foco */
  validateOnBlur?: boolean;

  /** Mostrar indicador de validação */
  showValidation?: boolean;

  /** Mensagem de erro customizada */
  errorMessage?: string;

  /** Permitir apenas números (útil para alguns tipos) */
  numbersOnly?: boolean;
}

const MaskedInput = forwardRef<HTMLInputElement, MaskedInputProps>(
  (
    {
      maskType,
      customPattern,
      value = '',
      onChange,
      validateOnBlur = false,
      showValidation = false,
      errorMessage,
      numbersOnly = false,
      className,
      onBlur,
      ...props
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = useState(value);
    const [isValid, setIsValid] = useState<boolean | null>(null);
    const [touched, setTouched] = useState(false);

    // Sincronizar com prop value
    useEffect(() => {
      setInternalValue(value);
    }, [value]);

    // Aplicar máscara baseado no tipo
    const applyMask = (inputValue: string): string => {
      if (numbersOnly) {
        inputValue = onlyNumbers(inputValue);
      }

      switch (maskType) {
        case 'cpf':
          return cpfMask(inputValue);
        case 'cnpj':
          return cnpjMask(inputValue);
        case 'document':
          return documentMask(inputValue);
        case 'phone':
          return phoneMask(inputValue);
        case 'cep':
          return cepMask(inputValue);
        case 'currency':
          return currencyMask(inputValue);
        case 'date':
          return dateMask(inputValue);
        case 'time':
          return timeMask(inputValue);
        case 'creditCard':
          return creditCardMask(inputValue);
        case 'rg':
          return rgMask(inputValue);
        case 'custom':
          return customPattern ? customMask(inputValue, customPattern) : inputValue;
        default:
          return inputValue;
      }
    };

    // Validar valor baseado no tipo
    const validateValue = (inputValue: string): boolean => {
      switch (maskType) {
        case 'cpf':
          return isValidCPF(inputValue);
        case 'cnpj':
          return isValidCNPJ(inputValue);
        case 'document':
          return isValidDocument(inputValue);
        case 'phone':
          return isValidPhone(inputValue);
        case 'cep':
          return isValidCEP(inputValue);
        default:
          return true; // Outros tipos não têm validação específica
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const maskedValue = applyMask(inputValue);
      const rawValue = onlyNumbers(inputValue);

      setInternalValue(maskedValue);

      // Chamar onChange com valor mascarado e raw
      if (onChange) {
        onChange(maskedValue, rawValue);
      }

      // Reset validation ao digitar
      if (isValid !== null) {
        setIsValid(null);
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setTouched(true);

      if (validateOnBlur || showValidation) {
        const valid = validateValue(internalValue);
        setIsValid(valid);
      }

      if (onBlur) {
        onBlur(e);
      }
    };

    // Determinar classes de validação
    const validationClasses = showValidation && touched && isValid !== null
      ? isValid
        ? 'border-green-500 focus:ring-green-500'
        : 'border-red-500 focus:ring-red-500'
      : '';

    return (
      <div className="relative">
        <input
          ref={ref}
          type="text"
          value={internalValue}
          onChange={handleChange}
          onBlur={handleBlur}
          className={cn(
            'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
            'file:border-0 file:bg-transparent file:text-sm file:font-medium',
            'placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            validationClasses,
            className
          )}
          {...props}
        />

        {/* Indicador de validação */}
        {showValidation && touched && isValid !== null && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isValid ? (
              <svg
                className="h-5 w-5 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg
                className="h-5 w-5 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            )}
          </div>
        )}

        {/* Mensagem de erro */}
        {showValidation && touched && isValid === false && errorMessage && (
          <p className="mt-1 text-sm text-red-500">{errorMessage}</p>
        )}
      </div>
    );
  }
);

MaskedInput.displayName = 'MaskedInput';

export { MaskedInput };

/**
 * Componentes especializados para cada tipo
 */

export const CPFInput = forwardRef<HTMLInputElement, Omit<MaskedInputProps, 'maskType'>>(
  (props, ref) => (
    <MaskedInput
      ref={ref}
      maskType="cpf"
      placeholder="000.000.000-00"
      errorMessage="CPF inválido"
      {...props}
    />
  )
);
CPFInput.displayName = 'CPFInput';

export const CNPJInput = forwardRef<HTMLInputElement, Omit<MaskedInputProps, 'maskType'>>(
  (props, ref) => (
    <MaskedInput
      ref={ref}
      maskType="cnpj"
      placeholder="00.000.000/0000-00"
      errorMessage="CNPJ inválido"
      {...props}
    />
  )
);
CNPJInput.displayName = 'CNPJInput';

export const DocumentInput = forwardRef<HTMLInputElement, Omit<MaskedInputProps, 'maskType'>>(
  (props, ref) => (
    <MaskedInput
      ref={ref}
      maskType="document"
      placeholder="CPF ou CNPJ"
      errorMessage="CPF/CNPJ inválido"
      {...props}
    />
  )
);
DocumentInput.displayName = 'DocumentInput';

export const PhoneInput = forwardRef<HTMLInputElement, Omit<MaskedInputProps, 'maskType'>>(
  (props, ref) => (
    <MaskedInput
      ref={ref}
      maskType="phone"
      placeholder="(00) 00000-0000"
      errorMessage="Telefone inválido"
      {...props}
    />
  )
);
PhoneInput.displayName = 'PhoneInput';

export const CEPInput = forwardRef<HTMLInputElement, Omit<MaskedInputProps, 'maskType'>>(
  (props, ref) => (
    <MaskedInput
      ref={ref}
      maskType="cep"
      placeholder="00000-000"
      errorMessage="CEP inválido"
      {...props}
    />
  )
);
CEPInput.displayName = 'CEPInput';

export const CurrencyInput = forwardRef<HTMLInputElement, Omit<MaskedInputProps, 'maskType'>>(
  (props, ref) => (
    <MaskedInput
      ref={ref}
      maskType="currency"
      placeholder="R$ 0,00"
      numbersOnly={true}
      {...props}
    />
  )
);
CurrencyInput.displayName = 'CurrencyInput';

export const DateInput = forwardRef<HTMLInputElement, Omit<MaskedInputProps, 'maskType'>>(
  (props, ref) => (
    <MaskedInput
      ref={ref}
      maskType="date"
      placeholder="00/00/0000"
      numbersOnly={true}
      {...props}
    />
  )
);
DateInput.displayName = 'DateInput';

export const TimeInput = forwardRef<HTMLInputElement, Omit<MaskedInputProps, 'maskType'>>(
  (props, ref) => (
    <MaskedInput
      ref={ref}
      maskType="time"
      placeholder="00:00"
      numbersOnly={true}
      {...props}
    />
  )
);
TimeInput.displayName = 'TimeInput';

export const CreditCardInput = forwardRef<HTMLInputElement, Omit<MaskedInputProps, 'maskType'>>(
  (props, ref) => (
    <MaskedInput
      ref={ref}
      maskType="creditCard"
      placeholder="0000 0000 0000 0000"
      numbersOnly={true}
      {...props}
    />
  )
);
CreditCardInput.displayName = 'CreditCardInput';

export const RGInput = forwardRef<HTMLInputElement, Omit<MaskedInputProps, 'maskType'>>(
  (props, ref) => (
    <MaskedInput
      ref={ref}
      maskType="rg"
      placeholder="00.000.000-0"
      numbersOnly={true}
      {...props}
    />
  )
);
RGInput.displayName = 'RGInput';
