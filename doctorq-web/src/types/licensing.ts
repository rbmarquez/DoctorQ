// Types for the advanced licensing system

export type LicenseType = 'trial' | 'starter' | 'professional' | 'enterprise' | 'custom';
export type BillingCycle = 'monthly' | 'quarterly' | 'yearly' | 'lifetime';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled';
export type LicenseStatus = 'pending' | 'active' | 'suspended' | 'expired' | 'cancelled';

export interface LicensePlan {
  id: string;
  name: string;
  description: string;
  type: LicenseType;
  features: Feature[];
  limits: ResourceLimits;
  pricing: PricingModel;
  popularBadge?: boolean;
  customBadgeText?: string;
}

export interface Feature {
  id: string;
  name: string;
  description: string;
  included: boolean;
  value?: string | number;
  category: 'core' | 'advanced' | 'premium' | 'addon';
}

export interface ResourceLimits {
  users: number | 'unlimited';
  locations: number | 'unlimited';
  procedures: number | 'unlimited';
  storage: string; // e.g., "10GB", "100GB", "unlimited"
  apiCalls: number | 'unlimited';
  customReports: number | 'unlimited';
  integrations: string[];
  supportLevel: 'basic' | 'priority' | 'dedicated' | 'vip';
}

export interface PricingModel {
  billingCycles: {
    [key in BillingCycle]?: {
      price: number;
      discount?: number;
      setupFee?: number;
      currency: string;
    };
  };
  addons?: Addon[];
}

export interface Addon {
  id: string;
  name: string;
  description: string;
  price: number;
  billingCycle: BillingCycle;
  category: 'users' | 'storage' | 'features' | 'support';
}

export interface License {
  id: string;
  partnerId: string;
  planId: string;
  type: LicenseType;
  status: LicenseStatus;
  licenseKey: string;
  activationCode?: string;

  // Dates
  createdAt: Date;
  activatedAt?: Date;
  expiresAt?: Date;
  lastRenewalAt?: Date;
  nextRenewalAt?: Date;
  cancelledAt?: Date;

  // Billing
  billingCycle: BillingCycle;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  paymentMethod?: PaymentMethod;

  // Usage
  usage: UsageMetrics;
  limits: ResourceLimits;

  // Features & Modules
  enabledFeatures: string[];
  enabledModules: Module[];
  customSettings?: Record<string, any>;

  // Compliance
  complianceStatus: ComplianceStatus;
  apiKeys: APIKey[];
  webhooks: Webhook[];
}

export interface Module {
  id: string;
  name: string;
  enabled: boolean;
  permissions: Permission[];
  configuration?: Record<string, any>;
}

export interface Permission {
  resource: string;
  actions: ('create' | 'read' | 'update' | 'delete')[];
}

export interface UsageMetrics {
  activeUsers: number;
  totalUsers: number;
  storageUsed: string;
  apiCallsThisMonth: number;
  lastActivity: Date;
  dailyUsage: DailyUsage[];
  featureUsage: FeatureUsage[];
}

export interface DailyUsage {
  date: Date;
  users: number;
  apiCalls: number;
  dataProcessed: string;
  events: number;
}

export interface FeatureUsage {
  featureId: string;
  featureName: string;
  usageCount: number;
  lastUsed: Date;
  uniqueUsers: number;
}

export interface PaymentMethod {
  id: string;
  type: 'credit_card' | 'pix' | 'boleto' | 'invoice';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

export interface ComplianceStatus {
  isCompliant: boolean;
  lastAudit: Date;
  issues: ComplianceIssue[];
  certifications: string[];
}

export interface ComplianceIssue {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendedAction: string;
  deadline?: Date;
}

export interface APIKey {
  id: string;
  key: string;
  name: string;
  createdAt: Date;
  lastUsedAt?: Date;
  permissions: string[];
  rateLimits: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
  };
  isActive: boolean;
}

export interface Webhook {
  id: string;
  url: string;
  events: WebhookEvent[];
  secret: string;
  isActive: boolean;
  lastTriggered?: Date;
  failureCount: number;
}

export interface WebhookEvent {
  type: 'license.created' | 'license.activated' | 'license.expired' |
        'license.renewed' | 'license.cancelled' | 'payment.success' |
        'payment.failed' | 'usage.limit_reached';
  enabled: boolean;
}

export interface LicenseAnalytics {
  overview: {
    totalLicenses: number;
    activeLicenses: number;
    revenue: {
      monthly: number;
      yearly: number;
      growth: number;
    };
    churnRate: number;
    averageLTV: number;
  };

  byPlan: {
    planId: string;
    planName: string;
    count: number;
    revenue: number;
    churnRate: number;
  }[];

  byStatus: {
    status: LicenseStatus;
    count: number;
    percentage: number;
  }[];

  trends: {
    period: 'daily' | 'weekly' | 'monthly';
    data: {
      date: Date;
      newLicenses: number;
      renewals: number;
      cancellations: number;
      revenue: number;
    }[];
  };

  predictions: {
    nextMonthRevenue: number;
    churnRisk: License[];
    growthOpportunities: string[];
  };
}

export interface LicenseNotification {
  id: string;
  licenseId: string;
  type: 'expiring_soon' | 'payment_due' | 'usage_alert' |
        'compliance_issue' | 'renewal_success' | 'feature_update';
  severity: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  actionRequired: boolean;
  actionUrl?: string;
  createdAt: Date;
  readAt?: Date;
}