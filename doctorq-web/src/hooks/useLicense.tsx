"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useSession } from "next-auth/react";
import { LicenseValidator, LicenseValidationResult } from "@/lib/license-validator";
import { toast } from "sonner";
import type { License, LicenseNotification } from "@/types/licensing";

interface LicenseContextData {
  license: License | null;
  validation: LicenseValidationResult | null;
  isValidating: boolean;
  notifications: LicenseNotification[];
  validateLicense: (key: string) => Promise<LicenseValidationResult>;
  refreshLicense: () => Promise<void>;
  hasFeature: (feature: string) => boolean;
  isWithinLimit: (resource: string, current: number) => boolean;
  dismissNotification: (id: string) => void;
  upgradePrompt: () => void;
}

const LicenseContext = createContext<LicenseContextData | undefined>(undefined);

interface LicenseProviderProps {
  children: ReactNode;
}

export function LicenseProvider({ children }: LicenseProviderProps) {
  const { data: session } = useSession();
  const [license, setLicense] = useState<License | null>(null);
  const [validation, setValidation] = useState<LicenseValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [notifications, setNotifications] = useState<LicenseNotification[]>([]);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  // Auto-validate license on session change
  useEffect(() => {
    if (session?.user) {
      checkAndValidateLicense();
    }
  }, [session]);

  // Periodic license check (every hour)
  useEffect(() => {
    const interval = setInterval(() => {
      if (session?.user && lastCheck) {
        const hoursSinceLastCheck =
          (new Date().getTime() - lastCheck.getTime()) / (1000 * 60 * 60);

        if (hoursSinceLastCheck >= 1) {
          checkAndValidateLicense();
        }
      }
    }, 60000); // Check every minute if an hour has passed

    return () => clearInterval(interval);
  }, [session, lastCheck]);

  // Check for renewal notifications
  useEffect(() => {
    if (validation?.remainingDays) {
      const urgency = LicenseValidator.getRenewalUrgency(validation.remainingDays);

      if (urgency) {
        const notification: LicenseNotification = {
          id: `renewal-${Date.now()}`,
          licenseId: license?.id || '',
          type: 'expiring_soon',
          severity: urgency === 'critical' ? 'error' : urgency,
          title: urgency === 'critical'
            ? 'Licença expirando em breve!'
            : 'Renove sua licença',
          message: `Sua licença expira em ${validation.remainingDays} dias. Renove agora para não perder acesso.`,
          actionRequired: urgency === 'critical',
          actionUrl: '/admin/licencas/renovar',
          createdAt: new Date(),
        };

        addNotification(notification);
      }
    }
  }, [validation?.remainingDays]);

  const checkAndValidateLicense = async () => {
    // Get license key from session or local storage
    const licenseKey = session?.user?.licenseKey ||
                      localStorage.getItem('licenseKey') ||
                      'EST-2024-PRO-001'; // Demo key

    if (licenseKey) {
      await validateLicense(licenseKey);
    }
  };

  const validateLicense = async (key: string): Promise<LicenseValidationResult> => {
    setIsValidating(true);

    try {
      const result = await LicenseValidator.validateLicense(key);

      setValidation(result);
      setLastCheck(new Date());

      if (result.isValid && result.license) {
        setLicense(result.license as License);

        // Store in localStorage for persistence
        localStorage.setItem('licenseKey', key);
        localStorage.setItem('licenseValidation', JSON.stringify(result));

        // Show success notification only on manual validation
        if (!lastCheck) {
          toast.success('Licença validada com sucesso!');
        }
      } else {
        setLicense(null);

        // Show error notification
        toast.error(result.message || 'Licença inválida');

        // Add system notification
        const notification: LicenseNotification = {
          id: `invalid-${Date.now()}`,
          licenseId: '',
          type: 'compliance_issue',
          severity: 'error',
          title: 'Problema com a licença',
          message: result.message || 'Sua licença não pôde ser validada',
          actionRequired: true,
          actionUrl: '/parceiros/novo',
          createdAt: new Date(),
        };

        addNotification(notification);
      }

      return result;
    } catch (error) {
      console.error('License validation error:', error);

      const errorResult: LicenseValidationResult = {
        isValid: false,
        status: 'suspended',
        message: 'Erro ao validar licença',
      };

      setValidation(errorResult);
      return errorResult;
    } finally {
      setIsValidating(false);
    }
  };

  const refreshLicense = async () => {
    if (license?.licenseKey || validation?.license?.licenseKey) {
      const key = license?.licenseKey || validation?.license?.licenseKey || '';
      await validateLicense(key);
    } else {
      await checkAndValidateLicense();
    }
  };

  const hasFeature = (feature: string): boolean => {
    if (!validation?.features) return false;
    return LicenseValidator.hasFeature(validation.features, feature);
  };

  const isWithinLimit = (resource: string, current: number): boolean => {
    if (!validation?.limits) return false;

    switch (resource) {
      case 'users':
        return LicenseValidator.isWithinLimits(
          current,
          validation.limits.users
        );
      case 'apiCalls':
        return LicenseValidator.isWithinLimits(
          current,
          validation.limits.apiCalls
        );
      case 'storage':
        // Convert storage string to GB number
        const storageLimit = validation.limits.storage;
        if (storageLimit === 'unlimited') return true;
        const limitGB = parseInt(storageLimit) || 1;
        return current <= limitGB;
      default:
        return false;
    }
  };

  const addNotification = (notification: LicenseNotification) => {
    setNotifications(prev => {
      // Avoid duplicate notifications
      if (prev.some(n => n.type === notification.type && n.severity === notification.severity)) {
        return prev;
      }
      return [...prev, notification];
    });
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const upgradePrompt = () => {
    const notification: LicenseNotification = {
      id: `upgrade-${Date.now()}`,
      licenseId: license?.id || '',
      type: 'feature_update',
      severity: 'info',
      title: 'Upgrade disponível',
      message: 'Desbloqueie mais recursos com um plano superior',
      actionRequired: false,
      actionUrl: '/parceiros/novo',
      createdAt: new Date(),
    };

    addNotification(notification);
    toast.info('Faça upgrade para acessar este recurso', {
      action: {
        label: 'Ver planos',
        onClick: () => window.location.href = '/parceiros/novo',
      },
    });
  };

  return (
    <LicenseContext.Provider
      value={{
        license,
        validation,
        isValidating,
        notifications,
        validateLicense,
        refreshLicense,
        hasFeature,
        isWithinLimit,
        dismissNotification,
        upgradePrompt,
      }}
    >
      {children}
    </LicenseContext.Provider>
  );
}

export function useLicense() {
  const context = useContext(LicenseContext);
  if (!context) {
    throw new Error('useLicense must be used within a LicenseProvider');
  }
  return context;
}