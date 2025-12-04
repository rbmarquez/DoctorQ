/**
 * Input Masks Utilities
 *
 * Funções para aplicar máscaras em inputs (CPF, CNPJ, Telefone, CEP, etc)
 */

/**
 * Remove todos os caracteres não numéricos
 */
export function onlyNumbers(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Máscara de CPF: 000.000.000-00
 */
export function cpfMask(value: string): string {
  const numbers = onlyNumbers(value);

  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  if (numbers.length <= 9) {
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
  }

  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
}

/**
 * Máscara de CNPJ: 00.000.000/0000-00
 */
export function cnpjMask(value: string): string {
  const numbers = onlyNumbers(value);

  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 5) return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
  if (numbers.length <= 8) {
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`;
  }
  if (numbers.length <= 12) {
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`;
  }

  return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`;
}

/**
 * Máscara de Telefone: (00) 00000-0000 ou (00) 0000-0000
 */
export function phoneMask(value: string): string {
  const numbers = onlyNumbers(value);

  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;

  // Celular (9 dígitos)
  if (numbers.length <= 11) {
    if (numbers.length === 11) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    }
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  }

  // Fixo (8 dígitos) ou Celular (9 dígitos)
  const hasNineDigits = numbers.length === 11;
  if (hasNineDigits) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  }

  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6, 10)}`;
}

/**
 * Máscara de CEP: 00000-000
 */
export function cepMask(value: string): string {
  const numbers = onlyNumbers(value);

  if (numbers.length <= 5) return numbers;

  return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
}

/**
 * Máscara de Currency (BRL): R$ 1.234,56
 */
export function currencyMask(value: string): string {
  const numbers = onlyNumbers(value);

  if (!numbers) return '';

  // Converte para número decimal
  const decimal = parseInt(numbers, 10) / 100;

  // Formata com Intl.NumberFormat
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(decimal);
}

/**
 * Remove máscara de currency e retorna número
 */
export function parseCurrency(value: string): number {
  const numbers = onlyNumbers(value);
  if (!numbers) return 0;
  return parseInt(numbers, 10) / 100;
}

/**
 * Máscara de Date: 00/00/0000
 */
export function dateMask(value: string): string {
  const numbers = onlyNumbers(value);

  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 4) return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;

  return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
}

/**
 * Máscara de Time: 00:00
 */
export function timeMask(value: string): string {
  const numbers = onlyNumbers(value);

  if (numbers.length <= 2) return numbers;

  return `${numbers.slice(0, 2)}:${numbers.slice(2, 4)}`;
}

/**
 * Máscara de Credit Card: 0000 0000 0000 0000
 */
export function creditCardMask(value: string): string {
  const numbers = onlyNumbers(value);

  if (numbers.length <= 4) return numbers;
  if (numbers.length <= 8) return `${numbers.slice(0, 4)} ${numbers.slice(4)}`;
  if (numbers.length <= 12) {
    return `${numbers.slice(0, 4)} ${numbers.slice(4, 8)} ${numbers.slice(8)}`;
  }

  return `${numbers.slice(0, 4)} ${numbers.slice(4, 8)} ${numbers.slice(8, 12)} ${numbers.slice(12, 16)}`;
}

/**
 * Máscara de RG: 00.000.000-0
 */
export function rgMask(value: string): string {
  const numbers = onlyNumbers(value);

  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 5) return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
  if (numbers.length <= 8) {
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`;
  }

  return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}-${numbers.slice(8, 9)}`;
}

/**
 * Máscara genérica com pattern customizado
 */
export function customMask(value: string, pattern: string): string {
  const numbers = onlyNumbers(value);
  let maskedValue = '';
  let numberIndex = 0;

  for (let i = 0; i < pattern.length && numberIndex < numbers.length; i++) {
    if (pattern[i] === '0') {
      maskedValue += numbers[numberIndex];
      numberIndex++;
    } else {
      maskedValue += pattern[i];
    }
  }

  return maskedValue;
}

/**
 * Validadores
 */

export function isValidCPF(cpf: string): boolean {
  const numbers = onlyNumbers(cpf);

  if (numbers.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(numbers)) return false; // Todos iguais

  // Validação dos dígitos verificadores
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(numbers.charAt(i)) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(numbers.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(numbers.charAt(i)) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(numbers.charAt(10))) return false;

  return true;
}

export function isValidCNPJ(cnpj: string): boolean {
  const numbers = onlyNumbers(cnpj);

  if (numbers.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(numbers)) return false; // Todos iguais

  // Validação dos dígitos verificadores
  let size = numbers.length - 2;
  let nums = numbers.substring(0, size);
  const digits = numbers.substring(size);
  let sum = 0;
  let pos = size - 7;

  for (let i = size; i >= 1; i--) {
    sum += parseInt(nums.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;

  size = size + 1;
  nums = numbers.substring(0, size);
  sum = 0;
  pos = size - 7;

  for (let i = size; i >= 1; i--) {
    sum += parseInt(nums.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;

  return true;
}

export function isValidPhone(phone: string): boolean {
  const numbers = onlyNumbers(phone);
  // Celular: 11 dígitos (XX) 9XXXX-XXXX
  // Fixo: 10 dígitos (XX) XXXX-XXXX
  return numbers.length === 10 || numbers.length === 11;
}

export function isValidCEP(cep: string): boolean {
  const numbers = onlyNumbers(cep);
  return numbers.length === 8;
}

/**
 * Auto-detecta tipo de documento (CPF ou CNPJ) e aplica máscara correspondente
 */
export function documentMask(value: string): string {
  const numbers = onlyNumbers(value);

  if (numbers.length <= 11) {
    return cpfMask(value);
  }

  return cnpjMask(value);
}

export function isValidDocument(doc: string): boolean {
  const numbers = onlyNumbers(doc);

  if (numbers.length === 11) {
    return isValidCPF(doc);
  }

  if (numbers.length === 14) {
    return isValidCNPJ(doc);
  }

  return false;
}
