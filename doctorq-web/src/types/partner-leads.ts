export interface PartnerLead {
  id: string;
  type: "clinica" | "profissional" | "fabricante" | "fornecedor" | string;
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  location?: string;
  website?: string;
  services?: string[];
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type PartnerLeadPayload = Omit<PartnerLead, "id" | "createdAt" | "updatedAt"> & {
  id?: string;
};
