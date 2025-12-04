/**
 * Schemas Zod para validação do Checkout
 */

import { z } from 'zod';

// ============================================================================
// SCHEMAS DE VALIDAÇÃO
// ============================================================================

/**
 * Schema para dados pessoais
 */
export const dadosPessoaisSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('E-mail inválido'),
  telefone: z.string().regex(/^\(\d{2}\) \d{5}-\d{4}$/, 'Telefone inválido'),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF inválido'),
});

/**
 * Schema para endereço
 */
export const enderecoSchema = z.object({
  cep: z.string().regex(/^\d{5}-\d{3}$/, 'CEP inválido'),
  endereco: z.string().min(3, 'Endereço é obrigatório'),
  numero: z.string().min(1, 'Número é obrigatório'),
  complemento: z.string().optional(),
  bairro: z.string().min(2, 'Bairro é obrigatório'),
  cidade: z.string().min(2, 'Cidade é obrigatória'),
  estado: z.string().length(2, 'Estado deve ter 2 letras').toUpperCase(),
});

/**
 * Schema para cartão de crédito
 */
export const cartaoCreditoSchema = z.object({
  numeroCartao: z.string().regex(/^\d{4} \d{4} \d{4} \d{4}$/, 'Número do cartão inválido'),
  nomeCartao: z.string().min(3, 'Nome no cartão é obrigatório'),
  validadeCartao: z.string().regex(/^\d{2}\/\d{2}$/, 'Validade inválida (MM/AA)'),
  cvvCartao: z.string().regex(/^\d{3,4}$/, 'CVV inválido'),
  parcelasCartao: z.number().min(1).max(12),
});

/**
 * Schema para método de pagamento
 */
export const metodoPagamentoSchema = z.enum(['pix', 'credit-card', 'boleto']);

/**
 * Schema completo do checkout (Step 1 - Entrega)
 */
export const checkoutStep1Schema = dadosPessoaisSchema.merge(enderecoSchema);

/**
 * Schema completo do checkout (Step 2 - Pagamento)
 */
export const checkoutStep2Schema = z.object({
  metodoPagamento: metodoPagamentoSchema,
}).and(
  z.discriminatedUnion('metodoPagamento', [
    z.object({
      metodoPagamento: z.literal('pix'),
    }),
    z.object({
      metodoPagamento: z.literal('credit-card'),
    }).merge(cartaoCreditoSchema),
    z.object({
      metodoPagamento: z.literal('boleto'),
    }),
  ])
);

/**
 * Schema completo do checkout (todos os steps)
 */
export const checkoutCompletoSchema = checkoutStep1Schema.merge(
  z.object({
    metodoPagamento: metodoPagamentoSchema,
    // Campos condicionais do cartão
    numeroCartao: z.string().optional(),
    nomeCartao: z.string().optional(),
    validadeCartao: z.string().optional(),
    cvvCartao: z.string().optional(),
    parcelasCartao: z.number().optional(),
  })
).refine(
  (data) => {
    // Se método for cartão de crédito, validar campos do cartão
    if (data.metodoPagamento === 'credit-card') {
      return (
        data.numeroCartao &&
        /^\d{4} \d{4} \d{4} \d{4}$/.test(data.numeroCartao) &&
        data.nomeCartao &&
        data.nomeCartao.length >= 3 &&
        data.validadeCartao &&
        /^\d{2}\/\d{2}$/.test(data.validadeCartao) &&
        data.cvvCartao &&
        /^\d{3,4}$/.test(data.cvvCartao) &&
        data.parcelasCartao &&
        data.parcelasCartao >= 1 &&
        data.parcelasCartao <= 12
      );
    }
    return true;
  },
  {
    message: 'Dados do cartão de crédito incompletos ou inválidos',
    path: ['numeroCartao'],
  }
);

// ============================================================================
// TIPOS INFERIDOS
// ============================================================================

export type DadosPessoaisData = z.infer<typeof dadosPessoaisSchema>;
export type EnderecoData = z.infer<typeof enderecoSchema>;
export type CartaoCreditoData = z.infer<typeof cartaoCreditoSchema>;
export type MetodoPagamento = z.infer<typeof metodoPagamentoSchema>;
export type CheckoutStep1Data = z.infer<typeof checkoutStep1Schema>;
export type CheckoutStep2Data = z.infer<typeof checkoutStep2Schema>;
export type CheckoutCompletoData = z.infer<typeof checkoutCompletoSchema>;

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Validar CPF (algoritmo oficial)
 */
export function validarCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '');

  if (cleaned.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleaned)) return false; // Todos dígitos iguais

  let sum = 0;
  let remainder;

  // Validar primeiro dígito
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cleaned.substring(i - 1, i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned.substring(9, 10))) return false;

  // Validar segundo dígito
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cleaned.substring(i - 1, i)) * (12 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned.substring(10, 11))) return false;

  return true;
}

/**
 * Validar número de cartão (Luhn algorithm)
 */
export function validarNumeroCartao(numero: string): boolean {
  const cleaned = numero.replace(/\s/g, '');

  if (!/^\d{13,19}$/.test(cleaned)) return false;

  let sum = 0;
  let isEven = false;

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i]);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

/**
 * Mapear forma de pagamento para API
 */
export function mapearFormaPagamento(
  metodoPagamento: MetodoPagamento
): 'pix' | 'credito' | 'debito' | 'boleto' {
  switch (metodoPagamento) {
    case 'credit-card':
      return 'credito';
    case 'pix':
      return 'pix';
    case 'boleto':
      return 'boleto';
    default:
      return 'pix';
  }
}
