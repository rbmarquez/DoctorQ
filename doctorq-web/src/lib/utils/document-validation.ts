/**
 * Validação de documentos brasileiros (CPF e CNPJ)
 */

/**
 * Remove caracteres não numéricos de uma string
 */
export function removeNonNumeric(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Formata CPF: 000.000.000-00
 */
export function formatCPF(value: string): string {
  const numbers = removeNonNumeric(value);
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  if (numbers.length <= 9)
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(
    6,
    9
  )}-${numbers.slice(9, 11)}`;
}

/**
 * Formata CNPJ: 00.000.000/0000-00
 */
export function formatCNPJ(value: string): string {
  const numbers = removeNonNumeric(value);
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 5) return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
  if (numbers.length <= 8)
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`;
  if (numbers.length <= 12)
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(
      5,
      8
    )}/${numbers.slice(8)}`;
  return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(
    5,
    8
  )}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`;
}

/**
 * Valida CPF
 * @param cpf - CPF com ou sem formatação
 * @returns true se válido, false caso contrário
 */
export function validateCPF(cpf: string): boolean {
  const numbers = removeNonNumeric(cpf);

  // CPF deve ter 11 dígitos
  if (numbers.length !== 11) {
    return false;
  }

  // Rejeita CPFs conhecidos como inválidos
  const invalidCPFs = [
    "00000000000",
    "11111111111",
    "22222222222",
    "33333333333",
    "44444444444",
    "55555555555",
    "66666666666",
    "77777777777",
    "88888888888",
    "99999999999",
  ];

  if (invalidCPFs.includes(numbers)) {
    return false;
  }

  // Validação do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(numbers.charAt(i)) * (10 - i);
  }
  let remainder = 11 - (sum % 11);
  const digit1 = remainder >= 10 ? 0 : remainder;

  if (digit1 !== parseInt(numbers.charAt(9))) {
    return false;
  }

  // Validação do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(numbers.charAt(i)) * (11 - i);
  }
  remainder = 11 - (sum % 11);
  const digit2 = remainder >= 10 ? 0 : remainder;

  if (digit2 !== parseInt(numbers.charAt(10))) {
    return false;
  }

  return true;
}

/**
 * Valida CNPJ
 * @param cnpj - CNPJ com ou sem formatação
 * @returns true se válido, false caso contrário
 */
export function validateCNPJ(cnpj: string): boolean {
  const numbers = removeNonNumeric(cnpj);

  // CNPJ deve ter 14 dígitos
  if (numbers.length !== 14) {
    return false;
  }

  // Rejeita CNPJs conhecidos como inválidos
  const invalidCNPJs = [
    "00000000000000",
    "11111111111111",
    "22222222222222",
    "33333333333333",
    "44444444444444",
    "55555555555555",
    "66666666666666",
    "77777777777777",
    "88888888888888",
    "99999999999999",
  ];

  if (invalidCNPJs.includes(numbers)) {
    return false;
  }

  // Validação do primeiro dígito verificador
  let length = numbers.length - 2;
  let digits = numbers.substring(0, length);
  const digit = numbers.substring(length);
  let sum = 0;
  let pos = length - 7;

  for (let i = length; i >= 1; i--) {
    sum += parseInt(digits.charAt(length - i)) * pos--;
    if (pos < 2) {
      pos = 9;
    }
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digit.charAt(0))) {
    return false;
  }

  // Validação do segundo dígito verificador
  length = length + 1;
  digits = numbers.substring(0, length);
  sum = 0;
  pos = length - 7;

  for (let i = length; i >= 1; i--) {
    sum += parseInt(digits.charAt(length - i)) * pos--;
    if (pos < 2) {
      pos = 9;
    }
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digit.charAt(1))) {
    return false;
  }

  return true;
}

/**
 * Detecta automaticamente o tipo de documento e valida
 * @param document - CPF ou CNPJ
 * @returns Objeto com tipo detectado e se é válido
 */
export function validateDocument(document: string): {
  type: "cpf" | "cnpj" | "unknown";
  valid: boolean;
  formatted: string;
} {
  const numbers = removeNonNumeric(document);

  if (numbers.length === 11) {
    return {
      type: "cpf",
      valid: validateCPF(numbers),
      formatted: formatCPF(numbers),
    };
  }

  if (numbers.length === 14) {
    return {
      type: "cnpj",
      valid: validateCNPJ(numbers),
      formatted: formatCNPJ(numbers),
    };
  }

  return {
    type: "unknown",
    valid: false,
    formatted: document,
  };
}

/**
 * Retorna mensagem de erro amigável para documento inválido
 */
export function getDocumentErrorMessage(
  document: string
): string | undefined {
  const numbers = removeNonNumeric(document);

  if (numbers.length === 0) {
    return undefined; // Campo vazio não mostra erro
  }

  if (numbers.length < 11) {
    return "CPF incompleto. Digite 11 dígitos.";
  }

  if (numbers.length === 11) {
    if (!validateCPF(numbers)) {
      return "CPF inválido. Verifique os dígitos.";
    }
    return undefined;
  }

  if (numbers.length > 11 && numbers.length < 14) {
    return "CNPJ incompleto. Digite 14 dígitos.";
  }

  if (numbers.length === 14) {
    if (!validateCNPJ(numbers)) {
      return "CNPJ inválido. Verifique os dígitos.";
    }
    return undefined;
  }

  if (numbers.length > 14) {
    return "Documento muito longo. CPF tem 11 dígitos, CNPJ tem 14.";
  }

  return undefined;
}
