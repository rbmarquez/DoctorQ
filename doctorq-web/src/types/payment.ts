// Advanced payment system types for DoctorQ

export type PaymentProvider = 'stripe' | 'pix' | 'boleto' | 'credit_card' | 'debit_card';
export type PaymentStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled' | 'refunded' | 'partially_refunded';
export type TransactionType = 'payment' | 'refund' | 'chargeback' | 'adjustment';
export type InvoiceStatus = 'draft' | 'open' | 'paid' | 'uncollectible' | 'void';

export interface PaymentIntent {
  id: string;
  provider: PaymentProvider;
  amount: number;
  currency: string;
  status: PaymentStatus;
  description: string;
  metadata: PaymentMetadata;
  customerId?: string;
  paymentMethodId?: string;
  clientSecret?: string;
  createdAt: Date;
  confirmedAt?: Date;
  cancelledAt?: Date;
}

export interface PaymentMetadata {
  licenseId?: string;
  planId?: string;
  partnerId?: string;
  billingCycle?: string;
  referenceId?: string;
  customData?: Record<string, any>;
}

export interface PaymentMethod {
  id: string;
  type: PaymentProvider;
  details: PaymentMethodDetails;
  isDefault: boolean;
  createdAt: Date;
  lastUsedAt?: Date;
}

export interface PaymentMethodDetails {
  // Credit/Debit Card
  brand?: string;
  last4?: string;
  expMonth?: number;
  expYear?: number;

  // PIX
  pixKey?: string;
  pixKeyType?: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
  qrCode?: string;
  qrCodeUrl?: string;

  // Boleto
  boletoNumber?: string;
  boletoUrl?: string;
  dueDate?: Date;

  // Bank Account
  bankName?: string;
  accountNumber?: string;
  routingNumber?: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  currency: string;
  status: PaymentStatus;
  provider: PaymentProvider;
  referenceId: string;
  description: string;
  metadata: PaymentMetadata;

  // Related entities
  paymentIntentId?: string;
  invoiceId?: string;
  customerId?: string;

  // Fees and amounts
  grossAmount: number;
  netAmount: number;
  fee: number;
  tax: number;

  // Timestamps
  createdAt: Date;
  processedAt?: Date;
  settledAt?: Date;
}

export interface Invoice {
  id: string;
  number: string;
  status: InvoiceStatus;
  customerId: string;

  // Amounts
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  currency: string;

  // Items
  items: InvoiceItem[];

  // Payment
  paymentIntentId?: string;
  paymentMethod?: PaymentMethod;
  paidAt?: Date;

  // Dates
  issuedAt: Date;
  dueDate: Date;
  periodStart: Date;
  periodEnd: Date;

  // Additional
  notes?: string;
  footer?: string;
  customData?: Record<string, any>;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  tax: number;
  discount: number;
  metadata?: Record<string, any>;
}

export interface PaymentSession {
  id: string;
  url: string;
  status: 'open' | 'complete' | 'expired';
  paymentIntentId: string;
  successUrl: string;
  cancelUrl: string;
  expiresAt: Date;
  metadata: PaymentMetadata;
}

export interface SubscriptionPayment {
  id: string;
  subscriptionId: string;
  customerId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;

  // Billing period
  periodStart: Date;
  periodEnd: Date;

  // Payment details
  paymentMethodId: string;
  invoiceId: string;
  attemptCount: number;
  nextRetryAt?: Date;

  // Timestamps
  createdAt: Date;
  processedAt?: Date;
  failedAt?: Date;
}

export interface RefundRequest {
  paymentIntentId: string;
  amount?: number; // Partial refund if specified
  reason: RefundReason;
  description?: string;
  metadata?: Record<string, any>;
}

export type RefundReason = 'duplicate' | 'fraudulent' | 'requested_by_customer' | 'product_not_received' | 'product_unacceptable' | 'other';

export interface Refund {
  id: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'cancelled';
  reason: RefundReason;
  description?: string;
  createdAt: Date;
  processedAt?: Date;
}

export interface PaymentWebhook {
  id: string;
  event: WebhookEventType;
  provider: PaymentProvider;
  data: any;
  signature: string;
  processedAt?: Date;
  retryCount: number;
  status: 'pending' | 'processing' | 'processed' | 'failed';
}

export type WebhookEventType =
  | 'payment_intent.succeeded'
  | 'payment_intent.failed'
  | 'payment_intent.cancelled'
  | 'payment_intent.processing'
  | 'charge.refunded'
  | 'charge.dispute.created'
  | 'invoice.paid'
  | 'invoice.payment_failed'
  | 'subscription.created'
  | 'subscription.updated'
  | 'subscription.deleted'
  | 'pix.payment_confirmed'
  | 'boleto.paid';

export interface PaymentAnalytics {
  revenue: {
    total: number;
    recurring: number;
    oneTime: number;
    byPeriod: RevenueByPeriod[];
  };

  transactions: {
    total: number;
    successful: number;
    failed: number;
    pending: number;
    averageValue: number;
  };

  methods: {
    provider: PaymentProvider;
    count: number;
    volume: number;
    percentage: number;
  }[];

  churn: {
    rate: number;
    value: number;
    predictions: ChurnPrediction[];
  };

  forecast: {
    nextMonth: number;
    nextQuarter: number;
    nextYear: number;
    confidence: number;
  };
}

export interface RevenueByPeriod {
  period: string;
  revenue: number;
  transactions: number;
  growth: number;
}

export interface ChurnPrediction {
  customerId: string;
  probability: number;
  riskLevel: 'low' | 'medium' | 'high';
  reasons: string[];
  suggestedActions: string[];
}

export interface PaymentError {
  code: string;
  message: string;
  provider: PaymentProvider;
  details?: Record<string, any>;
  recoverable: boolean;
  suggestedAction?: string;
}