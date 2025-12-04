export interface ProductSupplier {
  id: string;
  name: string;
  logoUrl?: string;
  location: string;
  specialization: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  whatsapp?: string;
  leadTime?: string;
  availability?: string;
  highlights: string[];
  rating?: number;
  reviewsCount?: number;
}

export interface ProfessionalProduct {
  id: string;
  name: string;
  category: "Equipamentos" | "Dermocosméticos" | "Consumíveis" | "Tecnologia" | string;
  subCategory?: string;
  summary: string;
  description: string;
  heroImage: string;
  gallery?: string[];
  badge?: string;
  innovationScore?: number;
  roiIndicator?: string;
  keyBenefits: string[];
  useCases: string[];
  protocolIdeas?: string[];
  technicalSpecs: Array<{ label: string; value: string }>;
  regulatoryNotes?: string[];
  trendingTags: string[];
  suppliers: ProductSupplier[];
  resources?: Array<{ label: string; url: string }>;
  createdAt?: string;
  updatedAt?: string;
}

export type ProfessionalProductPayload = Omit<ProfessionalProduct, "id" | "createdAt" | "updatedAt"> & {
  id?: string;
};
