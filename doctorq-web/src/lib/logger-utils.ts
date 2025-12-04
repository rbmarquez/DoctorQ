/**
 * Utilitarios para mascaramento de dados sensiveis no logger
 */

const maskChar = '*';
const repeatMask = (count: number): string => ''.padEnd(Math.max(count, 0), maskChar);

export function maskEmail(email: string | null | undefined): string {
  if (!email || typeof email !== 'string') {
    return '';
  }

  // Remove espacos e converte para minusculo
  const cleanEmail = email.trim().toLowerCase();

  // Validacao basica de email
  if (!cleanEmail.includes('@') || cleanEmail.length < 5) {
    return '***@***.***';
  }

  const [localPart = '', domain = ''] = cleanEmail.split('@');

  // Mascaramento da parte local
  let maskedLocal: string;
  if (localPart.length <= 2) {
    maskedLocal = repeatMask(localPart.length);
  } else if (localPart.length <= 4) {
    maskedLocal = localPart[0] + repeatMask(localPart.length - 2) + localPart[localPart.length - 1];
  } else {
    maskedLocal =
      localPart.substring(0, 2) + repeatMask(localPart.length - 4) + localPart.substring(localPart.length - 2);
  }

  // Mascaramento do dominio
  let maskedDomain: string;
  if (domain.includes('.')) {
    const domainParts = domain.split('.');
    const mainDomain = domainParts[0] ?? '';
    const extension = domainParts.slice(1).join('.');

    if (mainDomain.length <= 2) {
      maskedDomain = repeatMask(mainDomain.length) + (extension ? '.' + extension : '');
    } else {
      maskedDomain =
        mainDomain[0] + repeatMask(mainDomain.length - 2) + mainDomain[mainDomain.length - 1] + (extension ? '.' + extension : '');
    }
  } else {
    maskedDomain = repeatMask(domain.length);
  }

  return `${maskedLocal}@${maskedDomain}`;
}

export function maskUserAgent(userAgent: string | null | undefined): string {
  if (!userAgent || typeof userAgent !== 'string') {
    return '';
  }

  // Remove informacoes potencialmente sensiveis do user agent
  return userAgent
    .replace(/\b[\w._%+-]+@[\w.-]+\.[A-Z]{2,}\b/gi, '[EMAIL_MASKED]')
    .replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, '[IP_MASKED]')
    .replace(/\b[A-F0-9]{8}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{12}\b/gi, '[UUID_MASKED]');
}

export function maskSensitiveData(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => maskSensitiveData(item));
  }

  const maskedData: any = {};

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();

    // Campos que devem ser mascarados
    if (lowerKey.includes('email') || lowerKey.includes('mail')) {
      maskedData[key] = maskEmail(value as string);
    } else if (lowerKey.includes('password') || lowerKey.includes('pwd') || lowerKey.includes('secret')) {
      maskedData[key] = '[MASKED]';
    } else if (lowerKey.includes('token') || lowerKey.includes('key') || lowerKey.includes('auth')) {
      maskedData[key] = '[MASKED]';
    } else if (lowerKey.includes('user_agent') || lowerKey.includes('useragent')) {
      maskedData[key] = maskUserAgent(value as string);
    } else if (typeof value === 'object' && value !== null) {
      maskedData[key] = maskSensitiveData(value);
    } else {
      maskedData[key] = value;
    }
  }

  return maskedData;
}
