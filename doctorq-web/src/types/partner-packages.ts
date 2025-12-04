export type PartnerPackageStatus =
  | "draft"
  | "pending"
  | "active"
  | "suspended"
  | "cancelled"
  | "expired";

export type PartnerPackageItemStatus = "pending" | "active" | "suspended";

export type PartnerLicenseStatus = "available" | "assigned" | "suspended" | "revoked";

export interface PartnerLicense {
  idPartnerLicense: string;
  licenseKey: string;
  status: PartnerLicenseStatus;
  assignedTo?: string | null;
  assignedEmail?: string | null;
  activatedAt?: string | null;
  revokedAt?: string | null;
}

export interface PartnerPackageItem {
  idPartnerPackageItem: string;
  serviceId: string;
  serviceCode: string;
  serviceName: string;
  quantity: number;
  unitPriceValue?: number | null;
  unitPriceLabel?: string | null;
  status: PartnerPackageItemStatus;
  licenses: PartnerLicense[];
}

export interface PartnerPackageLeadInfo {
  idPartnerLead: string;
  businessName?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  status?: string | null;
}

export interface PartnerPackage {
  idPartnerPackage: string;
  packageCode: string;
  packageName: string;
  status: PartnerPackageStatus;
  billingCycle: string;
  totalValue?: number | null;
  currency: string;
  contractUrl?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  activatedAt?: string | null;
  expiresAt?: string | null;
  leadId?: string | null;
  lead?: PartnerPackageLeadInfo | null;
  items: PartnerPackageItem[];
}

export interface PartnerPackageListResponse {
  items: PartnerPackage[];
  meta: {
    totalItems: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}
