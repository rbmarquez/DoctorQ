export interface PopularSearch {
  id: string;
  term: string;
  description?: string;
  badge?: string;
  category?: string;
  tags?: string[];
  order?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PopularSearchPayload {
  term: string;
  description?: string;
  badge?: string;
  category?: string;
  tags?: string[];
  order?: number;
  isActive?: boolean;
}

export interface PopularSearchListResponse {
  items: PopularSearch[];
  total?: number;
}
