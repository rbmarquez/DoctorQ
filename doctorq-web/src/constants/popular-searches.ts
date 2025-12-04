import type { PopularSearch } from "@/types/popular-searches";

export const DEFAULT_POPULAR_SEARCHES: PopularSearch[] = [
  {
    id: "ps-limpeza-pele",
    term: "Limpeza de pele",
    badge: "Top 1",
    category: "Rosto",
    order: 1,
    isActive: true,
  },
  {
    id: "ps-botox",
    term: "Botox",
    badge: "Trend",
    category: "Rugas",
    order: 2,
    isActive: true,
  },
  {
    id: "ps-preenchimento-labial",
    term: "Preenchimento labial",
    category: "Lábios",
    order: 3,
    isActive: true,
  },
  {
    id: "ps-microagulhamento",
    term: "Microagulhamento",
    category: "Rejuvenescimento",
    order: 4,
    isActive: true,
  },
  {
    id: "ps-peeling",
    term: "Peeling químico",
    category: "Rejuvenescimento",
    order: 5,
    isActive: true,
  },
  {
    id: "ps-harmonizacao-facial",
    term: "Harmonização facial",
    category: "Rosto",
    order: 6,
    isActive: true,
  },
];
