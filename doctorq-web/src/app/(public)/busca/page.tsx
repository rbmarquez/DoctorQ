"use client";

import { useCallback, useEffect, useMemo, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  MapPin,
  Filter,
  Star,
  Clock,
  Heart,
  Loader2,
  CalendarDays,
  Sparkles,
  Compass,
  ChevronDown,
  User,
  LogOut,
  LayoutDashboard,
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { SearchResultsMap } from "@/components/busca/SearchResultsMap";
import { AuthAccessModal } from "@/components/auth/AuthAccessModal";
import { ChatBubbleAssistant } from "@/components/busca/ChatBubbleAssistant";
import { BuscaInteligenteButton } from "@/components/busca/BuscaInteligenteButton";
import { BookingFlowModal } from "@/components/booking/BookingFlowModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiClient, ApiClientError, buildQueryString } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { loadBookingDraft, saveBookingDraft } from "@/lib/booking-storage";
import { BookingDraft, ScheduleConfirmationPayload } from "@/types/agendamento";
import { Coordinates, getCoordinatesForLocation, jitterCoordinates } from "@/utils/location";
import { toast } from "sonner";
import {
  useFavoritos as useFavoritosSWR,
  toggleFavorito,
} from "@/lib/api/hooks/useFavoritos";

type SearchResultType = "profissional";

interface SearchResult {
  id: string;
  tipo: SearchResultType;
  nome: string;
  descricao: string;
  avaliacao?: number;
  totalAvaliacoes?: number;
  especialidade?: string;
  localizacao?: string;
  clinicId?: string;
  clinicName?: string;
  preco?: number;
  duracao?: number;
  imagem?: string;
  disponivel?: boolean;
  agenda?: ScheduleDay[];
  coordinates: Coordinates;
}

interface ScheduleSlot {
  id: string;
  time: string;
  available: boolean;
}

interface ScheduleDay {
  date: string;
  slots: ScheduleSlot[];
}

interface HorarioDisponivel {
  dt_horario: string;
  disponivel: boolean;
  motivo?: string;
}

interface FiltersState {
  minPrice: number;
  maxPrice: number;
  rating: number;
  disponivel: boolean;
  dateFrom: string;
  dateTo: string;
}

const DEFAULT_FILTERS: FiltersState = {
  minPrice: 0,
  maxPrice: 1000,
  rating: 0,
  disponivel: false,
  dateFrom: "",
  dateTo: "",
};

const createDefaultFilters = (): FiltersState => ({ ...DEFAULT_FILTERS });

const DEFAULT_MAP_LOCATION = "São Paulo, SP";

type ProfessionalApiItem = {
  id_profissional: string;
  id_empresa?: string | null;
  nm_profissional: string;
  ds_especialidades?: string[] | null;
  ds_bio?: string | null;
  vl_avaliacao_media?: number | null;
  nr_total_avaliacoes?: number | null;
  nm_empresa?: string | null;
  st_ativo: boolean;
  ds_email?: string | null;
  ds_localizacao?: string | null;
  ds_cidade?: string | null;
  ds_estado?: string | null;
  ds_endereco?: string | null;
  nm_cidade?: string | null;
  sg_estado?: string | null;
};

type ProfessionalDetails = {
  id_profissional: string;
  id_empresa?: string | null;
  nm_profissional: string;
  nm_empresa?: string | null;
  ds_localizacao?: string | null;
  ds_endereco?: string | null;
  ds_cidade?: string | null;
  ds_estado?: string | null;
  nm_cidade?: string | null;
  sg_estado?: string | null;
};

const sanitizeLocationLabel = (value?: string | null): string | null => {
  if (!value) return null;
  const trimmed = value.replace(/\s+/g, " ").trim();
  return trimmed.length > 0 ? trimmed : null;
};

const resolveProfessionalLocationLabel = (
  professional: ProfessionalApiItem,
  searchLocation?: string
): string => {
  const candidates = [
    sanitizeLocationLabel(professional.ds_localizacao),
    sanitizeLocationLabel(
      professional.ds_endereco && professional.ds_cidade
        ? `${professional.ds_endereco}, ${professional.ds_cidade}`
        : null
    ),
    sanitizeLocationLabel(
      professional.ds_cidade && (professional.ds_estado || professional.sg_estado)
        ? `${professional.ds_cidade}, ${professional.ds_estado ?? professional.sg_estado}`
        : null
    ),
    sanitizeLocationLabel(
      professional.nm_cidade && (professional.ds_estado || professional.sg_estado)
        ? `${professional.nm_cidade}, ${professional.ds_estado ?? professional.sg_estado}`
        : null
    ),
    sanitizeLocationLabel(professional.nm_empresa),
    sanitizeLocationLabel(searchLocation),
  ];

  return candidates.find((candidate) => candidate) ?? DEFAULT_MAP_LOCATION;
};

const spreadCoordinatesByLocation = (results: SearchResult[]): SearchResult[] => {
  const bases: Coordinates[] = [];
  const groups = new Map<string, number[]>();

  results.forEach((result, index) => {
    const label = result.localizacao ?? DEFAULT_MAP_LOCATION;
    const base = getCoordinatesForLocation(label);
    bases[index] = base;

    const key = `${base.lat.toFixed(4)}-${base.lng.toFixed(4)}`;
    const indices = groups.get(key);
    if (indices) {
      indices.push(index);
    } else {
      groups.set(key, [index]);
    }
  });

  const positionByIndex = new Map<number, number>();
  groups.forEach((indices) => {
    indices.forEach((resultIndex, position) => {
      positionByIndex.set(resultIndex, position);
    });
  });

  return results.map((result, index) => {
    const base = bases[index] ?? getCoordinatesForLocation(DEFAULT_MAP_LOCATION);
    const position = positionByIndex.get(index) ?? 0;
    return {
      ...result,
      coordinates: jitterCoordinates(base, position),
    };
  });
};

const fetchRealAgenda = async (professionalId: string): Promise<ScheduleDay[]> => {
  try {
    const today = new Date();
    const currentHour = today.getHours();

    // ✅ Se já passou das 17h, começar do próximo dia
    const startOffset = currentHour >= 17 ? 1 : 0;

    const schedulePromises: Promise<ScheduleDay>[] = [];
    let backendAvailable = true;

    // ✅ Buscar 7 dias de agenda (otimizado: 10 prof × 7 dias = 70 requisições vs 300)
    for (let dayOffset = startOffset; dayOffset < startOffset + 7; dayOffset++) {
      const date = new Date(today);
      date.setDate(today.getDate() + dayOffset);
      const dateStr = date.toISOString().split("T")[0]; // Formato YYYY-MM-DD

      // Fazer requisição para o backend para obter horários disponíveis
      // IMPORTANTE: Montar query string manualmente pois apiClient não processa config.params
      const queryString = buildQueryString({
        id_profissional: professionalId,
        data: dateStr,
        duracao_minutos: 60,
      });
      const url = `${endpoints.agendamentos.disponibilidade}${queryString}`;

      const promise = apiClient
        .get<HorarioDisponivel[]>(url)
        .then((horarios) => {

          // Converter HorarioDisponivel[] para ScheduleDay
          const slots = horarios.map((horario) => {
            const horarioDate = new Date(horario.dt_horario);
            const time = horarioDate.toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            });

            return {
              id: horario.dt_horario, // Usa a data/hora completa como ID
              time,
              available: horario.disponivel,
            };
          });

          return {
            date: dateStr, // ✅ Usar formato YYYY-MM-DD ao invés de ISO completo
            slots,
          };
        })
        .catch((error) => {
          // Log detalhado do erro para debug
          if (error instanceof ApiClientError) {
            console.error(`❌ Erro API ao buscar agenda para ${dateStr}:`, {
              status: error.statusCode,
              message: error.message,
              url: `${endpoints.agendamentos.disponibilidade}?id_profissional=${professionalId}&data=${dateStr}&duracao_minutos=60`,
            });

            // Se erro 500+ ou timeout, backend pode estar offline
            if (!error.statusCode || error.statusCode >= 500) {
              backendAvailable = false;
            }
          } else {
            console.error(`❌ Erro desconhecido ao buscar agenda para ${dateStr}:`, error);
            backendAvailable = false;
          }

          // Em caso de erro, retorna dia com slots vazios (será preenchido com mock depois)
          return {
            date: dateStr, // ✅ Usar formato YYYY-MM-DD
            slots: [],
          };
        });

      schedulePromises.push(promise);
    }

    const schedules = await Promise.all(schedulePromises);

    // ✅ Retornar agenda real mesmo que vazia (sem mock)
    return schedules;
  } catch (error) {
    console.error("Erro ao buscar agenda:", error);
    // ✅ Retornar agenda vazia em caso de erro
    return generateEmptyAgenda();
  }
};

/**
 * ✅ OTIMIZAÇÃO: Buscar agendas de múltiplos profissionais de uma vez
 * Reduz de 70 requisições (10 prof × 7 dias) para APENAS 1 requisição
 */
const fetchAgendasBatch = async (
  professionalIds: string[]
): Promise<Map<string, ScheduleDay[]>> => {
  const resultMap = new Map<string, ScheduleDay[]>();

  // Se não há profissionais, retorna mapa vazio
  if (professionalIds.length === 0) {
    return resultMap;
  }

  try {
    const today = new Date();
    const currentHour = today.getHours();

    // ✅ Se já passou das 17h, começar do próximo dia
    const startOffset = currentHour >= 17 ? 1 : 0;
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + startOffset);
    const dataInicio = startDate.toISOString().split("T")[0]; // Formato YYYY-MM-DD

    // ✅ Fazer UMA ÚNICA requisição para todos os profissionais
    const response = await apiClient.post<
      Array<{
        id_profissional: string;
        horarios: HorarioDisponivel[];
      }>
    >(endpoints.agendamentos.disponibilidadeBatch, {
      ids_profissionais: professionalIds,
      data_inicio: dataInicio,
      num_dias: 7,
      duracao_minutos: 60,
    });

    // Processar resposta e organizar por profissional
    for (const profData of response) {
      const scheduleByDate = new Map<string, ScheduleSlot[]>();

      // Agrupar horários por data
      for (const horario of profData.horarios) {
        const horarioDate = new Date(horario.dt_horario);
        const dateStr = horarioDate.toISOString().split("T")[0];
        const time = horarioDate.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });

        const slot: ScheduleSlot = {
          id: horario.dt_horario,
          time,
          available: horario.disponivel,
        };

        if (!scheduleByDate.has(dateStr)) {
          scheduleByDate.set(dateStr, []);
        }
        scheduleByDate.get(dateStr)!.push(slot);
      }

      // Converter para array de ScheduleDay
      const scheduleDays: ScheduleDay[] = [];
      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + dayOffset);
        const dateStr = date.toISOString().split("T")[0];

        scheduleDays.push({
          date: dateStr,
          slots: scheduleByDate.get(dateStr) || [],
        });
      }

      // ✅ Sempre usar dados reais (mesmo que vazios)
      resultMap.set(profData.id_profissional, scheduleDays);
    }

    // Para profissionais que não vieram na resposta, adicionar agenda vazia
    for (const profId of professionalIds) {
      if (!resultMap.has(profId)) {
        resultMap.set(profId, generateEmptyAgenda());
      }
    }

    return resultMap;
  } catch (error) {
    console.error("❌ Erro ao buscar agendas em batch:", error);

    // ✅ Em caso de erro, retornar agenda vazia para todos os profissionais
    for (const profId of professionalIds) {
      resultMap.set(profId, generateEmptyAgenda());
    }

    return resultMap;
  }
};

/**
 * ✅ Retorna agenda vazia (sem mocks)
 * Usado apenas quando não há dados reais disponíveis
 */
const generateEmptyAgenda = (): ScheduleDay[] => {
  return [];
};

const MAX_LOCATION_HISTORY_ITEMS = 5;

interface LocationSuggestion {
  label: string;
  value: string;
  meta: string;
  keywords: string[];
  badge?: string;
}

interface QuickLocationIdea {
  label: string;
  value: string;
  hint: string;
}

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const PRIMARY_LOCATION_SUGGESTIONS: LocationSuggestion[] = [
  {
    label: "São Paulo, SP",
    value: "São Paulo, SP",
    meta: "Mais de 1.200 especialistas com agenda hoje",
    keywords: ["paulista", "moema", "zona sul", "sp", "capital", "sao paulo"],
    badge: "Top 1",
  },
  {
    label: "Rio de Janeiro, RJ",
    value: "Rio de Janeiro, RJ",
    meta: "Consultas presenciais e telemedicina",
    keywords: ["barra da tijuca", "zona sul", "rj", "copacabana", "rio"],
    badge: "Litoral",
  },
  {
    label: "Belo Horizonte, MG",
    value: "Belo Horizonte, MG",
    meta: "Clínicas focadas em harmonização facial",
    keywords: ["savassi", "bh", "mg", "centro-sul"],
  },
  {
    label: "Curitiba, PR",
    value: "Curitiba, PR",
    meta: "Agenda inteligente com confirmação automática",
    keywords: ["batel", "pr", "curitiba", "ecoville"],
  },
  {
    label: "Brasília, DF",
    value: "Brasília, DF",
    meta: "Especialistas em procedimentos corporais",
    keywords: ["asa sul", "df", "brasília", "lago norte"],
  },
  {
    label: "Salvador, BA",
    value: "Salvador, BA",
    meta: "Protocolos para pele madura e clima tropical",
    keywords: ["bahia", "salvador", "barra", "costa azul"],
    badge: "Verão",
  },
  {
    label: "Recife, PE",
    value: "Recife, PE",
    meta: "Centros especializados em tratamentos a laser",
    keywords: ["pernambuco", "boa viagem", "recife", "pe"],
  },
  {
    label: "Porto Alegre, RS",
    value: "Porto Alegre, RS",
    meta: "Consultórios premium na região Moinhos",
    keywords: ["rs", "porto alegre", "moinhos de vento", "poa"],
  },
];

const QUICK_LOCATION_IDEAS: QuickLocationIdea[] = [
  {
    label: "Zona Sul de São Paulo",
    value: "Zona Sul, São Paulo",
    hint: "Próximo às estações Moema, Brooklin e Campo Belo",
  },
  {
    label: "Savassi & Lourdes",
    value: "Savassi, Belo Horizonte",
    hint: "Bairros favoritos para harmonização facial",
  },
  {
    label: "Orla de Recife",
    value: "Boa Viagem, Recife",
    hint: "Clínicas com estrutura completa e estacionamento",
  },
];

const TRENDING_NEIGHBORHOODS = [
  "Moema • SP",
  "Savassi • BH",
  "Batel • Curitiba",
  "Boa Viagem • Recife",
  "Vila Olímpia • SP",
  "Barra • RJ",
];

function formatDateLabel(dateString: string) {
  const date = new Date(dateString);
  return {
    weekday: date.toLocaleDateString("pt-BR", { weekday: "short" }),
    day: date.toLocaleDateString("pt-BR", { day: "2-digit" }),
    month: date.toLocaleDateString("pt-BR", { month: "short" }),
  };
}

function ProfessionalSchedule({
  agenda,
  professionalId,
  professionalName,
  professionalSpecialty,
  professionalLocation,
  clinicId,
  clinicName,
  consultationPrice,
  onConfirmSchedule,
}: {
  agenda: ScheduleDay[];
  professionalId: string;
  professionalName: string;
  professionalSpecialty?: string;
  professionalLocation?: string;
  clinicId?: string;
  clinicName?: string;
  consultationPrice?: number;
  onConfirmSchedule: (payload: ScheduleConfirmationPayload) => void | Promise<void>;
}) {
  const MAX_VISIBLE_SLOTS = 5;
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<ScheduleSlot | null>(null);
  const [showAllSlots, setShowAllSlots] = useState(false);

  useEffect(() => {
    const firstAvailable = agenda[selectedDayIndex]?.slots.find((slot) => slot.available);
    setSelectedSlot(firstAvailable || null);
    setShowAllSlots(false);
  }, [agenda, selectedDayIndex]);

  const handleSelectSlot = (slot: ScheduleSlot) => {
    if (!slot.available) return;
    setSelectedSlot(slot);
  };

  const currentSlots = agenda[selectedDayIndex]?.slots ?? [];
  const hasHiddenSlots = currentSlots.length > MAX_VISIBLE_SLOTS;
  const slotsToRender = showAllSlots ? currentSlots : currentSlots.slice(0, MAX_VISIBLE_SLOTS);

  const handleAgendar = async () => {
    if (!selectedSlot) return;

    const selectedDay = agenda[selectedDayIndex];
    await onConfirmSchedule({
      professionalId,
      professionalName,
      specialty: professionalSpecialty,
      clinicId,
      clinicName: clinicName ?? professionalLocation,
      location: professionalLocation,
      date: selectedDay.date,
      time: selectedSlot.time,
      slotId: selectedSlot.id,
      visitPrice: consultationPrice,
    });
  };

  return (
    <div className="rounded-2xl border border-purple-100 bg-gradient-to-br from-white via-purple-50/60 to-blue-50/80 p-3 shadow-inner">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-purple-700 text-white shadow-lg shadow-purple-200/70">
            <CalendarDays className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-purple-500">
              Agenda digital
            </p>
            <h4 className="text-sm font-semibold text-gray-900">Disponibilidade imediata</h4>
          </div>
        </div>
        <Sparkles className="h-4 w-4 text-purple-400" />
      </div>

      <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
        {agenda.map((day, index) => {
          const { weekday, day: dayNumber, month } = formatDateLabel(day.date);
          const isSelected = index === selectedDayIndex;
          const availableCount = day.slots.filter((slot) => slot.available).length;

          return (
            <button
              key={day.date}
              onClick={() => setSelectedDayIndex(index)}
              className={`flex min-w-[90px] flex-col rounded-xl border px-2 py-1.5 transition-all ${
                isSelected
                  ? "border-purple-500 bg-white shadow-lg shadow-purple-100"
                  : "border-transparent bg-white/60 hover:border-purple-300 hover:bg-white"
              }`}
            >
              <span className="text-[10px] font-semibold uppercase tracking-wide text-purple-400">
                {weekday}
              </span>
              <span className="text-xl font-bold text-gray-900">{dayNumber}</span>
              <span className="text-[10px] uppercase text-gray-400">{month}</span>
              <span className="mt-1 text-[10px] font-medium text-gray-500">
                {availableCount} {availableCount === 1 ? "horário" : "horários"}
              </span>
            </button>
          );
        })}
      </div>

      <div className="space-y-1.5">
        {slotsToRender.map((slot) => {
          const isActive = selectedSlot?.id === slot.id;
          return (
            <button
              key={slot.id}
              onClick={() => handleSelectSlot(slot)}
              className={`group flex w-full items-center justify-between rounded-xl border px-3 py-2 text-sm transition-all ${
                slot.available
                  ? isActive
                    ? "border-purple-500 bg-white text-purple-600 shadow-md shadow-purple-100"
                    : "border-transparent bg-white/70 text-gray-700 hover:border-purple-300 hover:bg-white"
                  : "cursor-not-allowed border-transparent bg-gray-100 text-gray-400"
              }`}
              disabled={!slot.available}
            >
              <span className="font-semibold text-sm">{slot.time}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  slot.available
                    ? isActive
                      ? "bg-purple-100 text-purple-600"
                      : "bg-green-100 text-green-600"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {slot.available ? (isActive ? "Selecionado" : "Disponível") : "Indisponível"}
              </span>
            </button>
          );
        })}

        {hasHiddenSlots && (
          <button
            type="button"
            onClick={() => setShowAllSlots((previous) => !previous)}
            className="mt-0.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition"
          >
            {showAllSlots ? "Mostrar menos horários" : "Mostrar mais horários"}
          </button>
        )}
      </div>

      <Button
        onClick={handleAgendar}
        disabled={!selectedSlot}
        className="mt-2 w-full h-9 text-sm bg-gradient-to-r from-purple-600 via-cyan-500 to-purple-700 text-white shadow-lg shadow-purple-200 transition hover:from-purple-700 hover:via-cyan-600 hover:to-purple-800 disabled:from-gray-200 disabled:via-gray-300 disabled:to-gray-200 disabled:text-gray-500"
      >
        Agendar horário selecionado
      </Button>
    </div>
  );
}

function BuscaPageContent() {
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const userId = session?.user?.id ?? null;
  const isAuthenticated = status === "authenticated" && session?.user;

  // Determinar dashboard baseado no perfil do usuário
  const getDashboardUrl = () => {
    if (!session?.user) return "/admin/dashboard";
    const role = (session.user as any).role || "paciente";
    switch (role) {
      case "admin":
      case "gestor_empresa":
        return "/admin/dashboard";
      case "profissional":
        return "/profissional/dashboard";
      case "paciente":
        return "/paciente/dashboard";
      default:
        return "/admin/dashboard";
    }
  };

  const getUserInitials = () => {
    if (!session?.user?.name) return "U";
    const names = session.user.name.split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return session.user.name[0].toUpperCase();
  };
  const {
    favoritos: favoritosDoUsuario,
    isLoading: favoritosCarregando,
  } = useFavoritosSWR(userId, { tipo: "profissional" });

  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [location, setLocation] = useState(searchParams.get("local") || "");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FiltersState>(createDefaultFilters);
  const [showMap, setShowMap] = useState(true);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingPayload, setBookingPayload] = useState<ScheduleConfirmationPayload | null>(null);
  const [locationHistory, setLocationHistory] = useState<string[]>([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [geoStatus, setGeoStatus] = useState<
    { state: "idle" | "loading" | "success" | "error"; message?: string }
  >({ state: "idle" });
  const [currentPage, setCurrentPage] = useState(1);
  const [allResults, setAllResults] = useState<SearchResult[]>([]);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pendingFavoriteId, setPendingFavoriteId] = useState<string | null>(null);
  const [favoritosStatus, setFavoritosStatus] = useState<
    Record<string, { isFavorito: boolean; favoritoId?: string }>
  >({});
  const [favoritoMutating, setFavoritoMutating] = useState<Record<string, boolean>>({});

  const suggestionContainerRef = useRef<HTMLDivElement | null>(null);
  const blurTimeoutRef = useRef<number | undefined>();
  const locationInputRef = useRef<HTMLInputElement | null>(null);

  const formatCep = (value: string) => {
    const digitsOnly = value.replace(/\D/g, "");
    if (digitsOnly.length <= 5) {
      return digitsOnly;
    }
    return `${digitsOnly.slice(0, 5)}-${digitsOnly.slice(5, 8)}`;
  };

  const registerLocation = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    setLocationHistory((prev) => {
      const next = [trimmed, ...prev.filter((item) => item !== trimmed)].slice(
        0,
        MAX_LOCATION_HISTORY_ITEMS
      );

      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem("qb-location-history", JSON.stringify(next));
        } catch (error) {
          console.warn("Não foi possível salvar histórico de localização:", error);
        }
      }

      return next;
    });
  };

  const clearBlurTimeout = () => {
    if (blurTimeoutRef.current) {
      window.clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = undefined;
    }
  };

  useEffect(() => {
    // Sincroniza o estado quando a URL muda (ex: retorno do botão voltar)
    // O debounce irá disparar a busca automaticamente
    const queryFromParams = searchParams.get("q") || "";
    const locationFromParams = searchParams.get("local") || "";

    setSearchQuery(queryFromParams);
    setLocation(locationFromParams);
  }, [searchParams]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = window.localStorage.getItem("qb-location-history");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setLocationHistory(parsed.slice(0, MAX_LOCATION_HISTORY_ITEMS));
        }
      }
    } catch (error) {
      console.warn("Não foi possível carregar histórico de localização:", error);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        window.clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!showLocationSuggestions) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionContainerRef.current &&
        !suggestionContainerRef.current.contains(event.target as Node)
      ) {
        setShowLocationSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showLocationSuggestions]);

  useEffect(() => {
    if (!userId) {
      setFavoritosStatus((previous) => {
        if (Object.keys(previous).length === 0) {
          return previous;
        }
        return {};
      });
      return;
    }

    const mapped: Record<string, { isFavorito: boolean; favoritoId?: string }> = {};

    (favoritosDoUsuario ?? []).forEach((favorito) => {
      const profissionalId =
        // Estrutura nova
        (favorito as any).id_profissional ??
        // Estrutura antiga (id_referencia)
        (favorito as any).id_referencia ??
        null;

      if (profissionalId) {
        mapped[profissionalId] = {
          isFavorito: true,
          favoritoId: favorito.id_favorito,
        };
      }
    });

    setFavoritosStatus((previous) => {
      const previousEntries = Object.entries(previous);
      const nextEntries = Object.entries(mapped);

      const isSame =
        previousEntries.length === nextEntries.length &&
        previousEntries.every(
          ([key, value]) =>
            mapped[key]?.isFavorito === value.isFavorito &&
            mapped[key]?.favoritoId === value.favoritoId
        );

      if (isSame) {
        return previous;
      }

      return mapped;
    });
  }, [userId, favoritosDoUsuario]);

  // ✅ OTIMIZAÇÃO: Debounce de 800ms para searchQuery E location (evita chamadas a cada tecla)
  useEffect(() => {
    const handler = setTimeout(() => {
      handleSearch();
    }, 800);
    return () => clearTimeout(handler);
  }, [searchQuery, location]);

  const performSearch = async (queryOverride = searchQuery, locationOverride = location) => {
    setLoading(true);

    try {
      const normalizedQuery = queryOverride.trim();
      const normalizedLocation = locationOverride.trim().toLowerCase();

      const professionalsPromise = (async () => {
        const params: Record<string, string | number | boolean> = {
          page: 1,
          size: 100, // ✅ Buscar até 100 profissionais (todos)
        };

        // ✅ Se não há query, NÃO adiciona filtro (busca TODOS)
        if (normalizedQuery) {
          params.busca = normalizedQuery;
        }

        // ✅ Usar apiClient.get() com params no config (não concatenar query string manualmente)
        const response = await apiClient.get<{ items: ProfessionalApiItem[] }>(
          endpoints.profissionais.list,
          { params }
        );

        // Mapear profissionais para SearchResult (sem agenda inicialmente)
        const professionals = response.items.map<SearchResult>((prof) => {
          const locationLabel = resolveProfessionalLocationLabel(prof, normalizedLocation);
          return {
            id: prof.id_profissional,
            tipo: "profissional",
            nome: prof.nm_profissional,
            descricao: prof.ds_bio ?? "Profissional DoctorQ",
            especialidade: prof.ds_especialidades?.join(", "),
            avaliacao: prof.vl_avaliacao_media ?? undefined,
            totalAvaliacoes: prof.nr_total_avaliacoes ?? undefined,
            localizacao: locationLabel,
            clinicId: prof.id_empresa ?? undefined,
            clinicName: prof.nm_empresa ?? undefined,
            disponivel: prof.st_ativo,
            agenda: undefined, // Será carregada por página
            coordinates: getCoordinatesForLocation(locationLabel),
          };
        });

        // ✅ Não carregar agendas ainda - será feito por página
        return professionals;
      })();

      const resultsSettled = await Promise.allSettled([professionalsPromise]);

      let combinedResults: SearchResult[] = [];

      resultsSettled.forEach((result) => {
        if (result.status === "fulfilled") {
          combinedResults = combinedResults.concat(result.value);
        } else {
          console.error("Erro ao carregar profissionais:", result.reason);
        }
      });

      // ✅ Se não há resultados reais, deixar vazio (sem mock)
      // O empty state será exibido na UI

      let filteredResults = combinedResults;

      if (normalizedQuery) {
        const normalizedLower = normalizedQuery.toLowerCase();
        filteredResults = filteredResults.filter((item) => {
          const nomeMatch = item.nome.toLowerCase().includes(normalizedLower);
          const descricaoMatch = item.descricao?.toLowerCase().includes(normalizedLower);
          const especialidadeMatch = item.especialidade?.toLowerCase().includes(normalizedLower);
          return nomeMatch || descricaoMatch || especialidadeMatch;
        });
      }

      if (normalizedLocation) {
        filteredResults = filteredResults.filter((item) =>
          item.localizacao?.toLowerCase().includes(normalizedLocation)
        );
      }

      if (filters.rating > 0) {
        filteredResults = filteredResults.filter((item) => (item.avaliacao || 0) >= filters.rating);
      }

      if (filters.disponivel) {
        filteredResults = filteredResults.filter((item) => item.disponivel);
      }

      filteredResults = filteredResults.filter((item) => {
        const minOk = filters.minPrice ? (item.preco || 0) >= filters.minPrice : true;
        const maxOk =
          filters.maxPrice && filters.maxPrice > 0
            ? (item.preco || 0) <= filters.maxPrice
            : true;
        return minOk && maxOk;
      });

      if (filters.dateFrom && filters.dateTo) {
        const startDate = new Date(filters.dateFrom);
        const endDate = new Date(filters.dateTo);

        if (!Number.isNaN(startDate.getTime()) && !Number.isNaN(endDate.getTime())) {
          filteredResults = filteredResults.filter((item) => {
            if (!item.agenda || item.agenda.length === 0) return false;

            return item.agenda.some((day) => {
              const dayDate = new Date(day.date);
              if (Number.isNaN(dayDate.getTime())) return false;
              if (dayDate < startDate || dayDate > endDate) return false;
              return day.slots.some((slot) => slot.available);
            });
          });
        }
      }

      const spread = spreadCoordinatesByLocation(filteredResults);
      // ✅ Salvar todos os resultados e resetar página
      setAllResults(spread);
      setCurrentPage(1);
      setResults([]); // Será preenchido pelo useEffect de paginação
    } catch (error) {
      console.error("Erro ao buscar:", error);
      setAllResults([]);
      setResults([]);
      setCurrentPage(1);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Carregar agendas da página atual (paginação de 20 profissionais)
  useEffect(() => {
    const loadPageAgendas = async () => {
      if (allResults.length === 0) return;

      const ITEMS_PER_PAGE = 20;
      const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
      const endIdx = startIdx + ITEMS_PER_PAGE;
      const pageResults = allResults.slice(startIdx, endIdx);

      // Se já têm agendas, não recarregar
      if (pageResults.every((r) => r.agenda && r.agenda.length > 0)) {
        setResults(pageResults);
        return;
      }

      try {
        // ✅ Carregar agendas em BATCH apenas dos 20 profissionais da página
        const professionalIds = pageResults.map((prof) => prof.id);
        const agendasMap = await fetchAgendasBatch(professionalIds);

        // Mapear agendas aos profissionais da página
        const pageWithAgendas = pageResults.map((prof) => ({
          ...prof,
          agenda: agendasMap.get(prof.id) || generateEmptyAgenda(),
        }));

        setResults(pageWithAgendas);

        // Atualizar allResults com as agendas carregadas
        const updatedAll = allResults.map((prof) => {
          const withAgenda = pageWithAgendas.find((p) => p.id === prof.id);
          return withAgenda || prof;
        });
        setAllResults(updatedAll);
      } catch (error) {
        console.error("Erro ao carregar agendas da página:", error);
        // Em caso de erro, mostrar sem agendas
        setResults(pageResults);
      }
    };

    loadPageAgendas();
  }, [currentPage, allResults.length]); // Recarregar quando página ou total de resultados mudar

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (location) params.set("local", location);

    if (location.trim()) {
      registerLocation(location);
    }

    window.history.pushState({}, "", `/busca?${params.toString()}`);
    performSearch();
  };

  // ✅ OTIMIZAÇÃO: Carregar agenda sob demanda (lazy loading)
  const handleLocationChange = (value: string) => {
    setGeoStatus({ state: "idle" });
    const isOnlyNumbers = /^[0-9\s-]*$/.test(value);
    if (isOnlyNumbers) {
      const formatted = formatCep(value);
      setLocation(formatted);
    } else {
      setLocation(value);
    }
    setShowLocationSuggestions(true);
    clearBlurTimeout();
  };

  const updateSearchParams = (queryValue: string, locationValue: string) => {
    const params = new URLSearchParams();
    if (queryValue) params.set("q", queryValue);
    if (locationValue) params.set("local", locationValue);
    window.history.pushState({}, "", `/busca?${params.toString()}`);
  };

  const handleSelectLocation = (value: string) => {
    setGeoStatus({ state: "idle" });
    setLocation(value);
    registerLocation(value);
    setShowLocationSuggestions(false);
    clearBlurTimeout();
    locationInputRef.current?.blur();
    updateSearchParams(searchQuery, value);
    performSearch(searchQuery, value);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus({ state: "error", message: "Seu navegador não suporta geolocalização." });
      return;
    }

    setGeoStatus({ state: "loading" });
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = `${position.coords.latitude.toFixed(3)}, ${position.coords.longitude.toFixed(3)}`;
        const value = `Perto de mim @${coords}`;
        setLocation(value);
        registerLocation(value);
        setGeoStatus({ state: "success", message: "Localização aproximada aplicada." });
        setShowLocationSuggestions(false);
        clearBlurTimeout();
        updateSearchParams(searchQuery, value);
        performSearch(searchQuery, value);
      },
      () => {
        setGeoStatus({ state: "error", message: "Não foi possível acessar sua localização." });
      },
      {
        enableHighAccuracy: false,
        timeout: 4000,
      }
    );
  };

  const filteredLocations = useMemo(() => {
    if (!location) {
      return PRIMARY_LOCATION_SUGGESTIONS.slice(0, 6);
    }

    const normalized = normalizeText(location);

    if (normalized.length < 2) {
      return PRIMARY_LOCATION_SUGGESTIONS.slice(0, 6);
    }

    return PRIMARY_LOCATION_SUGGESTIONS.filter((suggestion) => {
      const normalizedLabel = normalizeText(suggestion.label);
      const matchesLabel = normalizedLabel.includes(normalized);
      const matchesKeywords = suggestion.keywords.some((keyword) =>
        normalizeText(keyword).includes(normalized)
      );
      return matchesLabel || matchesKeywords;
    }).slice(0, 6);
  }, [location]);

  const digitsOnlyLocation = location.replace(/\D/g, "");
  const formattedCepCandidate = digitsOnlyLocation ? formatCep(digitsOnlyLocation) : "";
  const showCepSuggestion = digitsOnlyLocation.length === 8;
  const hasHistory = locationHistory.length > 0;
  const isTypingLocation = location.trim().length > 0;

  const hasPriceData = useMemo(() => {
    if (results.length === 0) return true;
    return results.some((result) => typeof result.preco === "number");
  }, [results]);

  const handleToggleFavorito = useCallback(
    async (professionalId: string) => {
      if (!userId) {
        setPendingFavoriteId(professionalId);
        setAuthModalOpen(true);
        return;
      }

      if (favoritoMutating[professionalId]) {
        return;
      }

      const favoritoAtual = favoritosStatus[professionalId];

      setFavoritoMutating((previous) => ({
        ...previous,
        [professionalId]: true,
      }));

      try {
        const resultado = await toggleFavorito({
          userId,
          tipo: "profissional",
          itemId: professionalId,
          favoritoId: favoritoAtual?.favoritoId,
        });

        setFavoritosStatus((previous) => {
          const next = { ...previous };

          if (resultado.adicionado) {
            next[professionalId] = {
              isFavorito: true,
              favoritoId: resultado.favorito?.id_favorito ?? favoritoAtual?.favoritoId,
            };
          } else {
            delete next[professionalId];
          }

          return next;
        });

        toast.success(
          resultado.adicionado
            ? "Profissional adicionado aos seus favoritos."
            : "Profissional removido dos seus favoritos."
        );
      } catch (error: any) {
        console.error("Erro ao alternar favorito:", error);
        toast.error(
          error?.message || "Não foi possível atualizar seus favoritos agora. Tente novamente."
        );
      } finally {
        setFavoritoMutating((previous) => {
          const next = { ...previous };
          delete next[professionalId];
          return next;
        });
      }
    },
    [userId, favoritoMutating, favoritosCarregando, favoritosStatus]
  );

  useEffect(() => {
    if (userId && pendingFavoriteId && !authModalOpen) {
      handleToggleFavorito(pendingFavoriteId);
      setPendingFavoriteId(null);
    }
  }, [userId, pendingFavoriteId, authModalOpen, handleToggleFavorito]);
  const handleScheduleConfirm = async (payload: ScheduleConfirmationPayload) => {
    let enrichedPayload = payload;

    if (!payload.clinicId) {
      try {
        const professional = await apiClient.get<ProfessionalDetails>(
          endpoints.profissionais.get(payload.professionalId)
        );

        if (professional?.id_empresa) {
          enrichedPayload = {
            ...enrichedPayload,
            clinicId: professional.id_empresa,
            clinicName: professional.nm_empresa ?? enrichedPayload.clinicName ?? payload.location,
            location:
              enrichedPayload.location ??
              sanitizeLocationLabel(
                professional.ds_localizacao ??
                  professional.ds_endereco ??
                  (professional.ds_cidade && (professional.ds_estado ?? professional.sg_estado)
                    ? `${professional.ds_cidade}, ${professional.ds_estado ?? professional.sg_estado}`
                    : null) ??
                  (professional.nm_cidade && (professional.ds_estado ?? professional.sg_estado)
                    ? `${professional.nm_cidade}, ${professional.ds_estado ?? professional.sg_estado}`
                    : null)
              ) ??
              enrichedPayload.location ??
              DEFAULT_MAP_LOCATION,
          };
        }
      } catch (error) {
        console.warn("Não foi possível obter dados completos do profissional:", error);
      }
    }

    if (typeof window !== "undefined") {
      const currentDraft = loadBookingDraft();
      const mergedDraft: BookingDraft = {
        ...(currentDraft ?? {}),
        ...enrichedPayload,
      };

      saveBookingDraft(mergedDraft);
    }

    setBookingPayload(enrichedPayload);
    setBookingModalOpen(true);
  };

  const handleBookingSuccess = (draft: BookingDraft) => {
    setResults((previousResults) =>
      previousResults.map((result) => {
        if (result.id !== draft.professionalId || !result.agenda) {
          return result;
        }

        const updatedAgenda = result.agenda.map((day) => {
          if (day.date !== draft.date) {
            return day;
          }

          const updatedSlots = day.slots.map((slot) => {
            if (draft.slotId && slot.id === draft.slotId) {
              return { ...slot, available: false };
            }

            if (slot.time === draft.time) {
              return { ...slot, available: false };
            }

            return slot;
          });

          return { ...day, slots: updatedSlots };
        });

        return { ...result, agenda: updatedAgenda };
      })
    );
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-cyan-50">
        {/* Header de Busca */}
        <div className="bg-white border-b border-blue-100 sticky top-0 z-40 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center space-x-4">
              {/* Logo */}
              <Link href="/" className="flex items-center space-x-2 group flex-shrink-0">
                <div className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-cyan-600 bg-clip-text text-transparent">
                  DoctorQ
                </div>
              </Link>

            {/* Barra de Busca Inline */}
            <div className="flex-1 flex space-x-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Busque por profissionais ou especialidades..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 border-gray-200"
                />
              </div>
              <div className="relative w-64" ref={suggestionContainerRef}>
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <Input
                  ref={locationInputRef}
                  type="text"
                  placeholder="Cidade, bairro ou CEP"
                  value={location}
                  onChange={(e) => handleLocationChange(e.target.value)}
                  onFocus={() => {
                    clearBlurTimeout();
                    setShowLocationSuggestions(true);
                  }}
                  onBlur={() => {
                    blurTimeoutRef.current = window.setTimeout(() => {
                      setShowLocationSuggestions(false);
                    }, 150);
                  }}
                  autoComplete="off"
                  className="h-11 border-gray-200 pl-10"
                />

                {showLocationSuggestions && (
                  <div className="absolute left-0 right-0 top-full z-50 mt-2">
                    <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-2xl shadow-pink-500/10">
                      <div className="px-4 pt-4 pb-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">
                          Sugestões inteligentes
                        </p>
                      </div>

                      <div className="max-h-72 space-y-3 overflow-y-auto px-4 pb-4">
                        {showCepSuggestion && (
                          <button
                            type="button"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => handleSelectLocation(formattedCepCandidate)}
                            className="w-full rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-left transition hover:border-blue-300 hover:bg-blue-50"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-blue-600">
                                Buscar por CEP {formattedCepCandidate}
                              </span>
                              <span className="text-xs font-medium text-blue-500">
                                Resultado preciso
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-gray-500">
                              Mostramos apenas clínicas que atendem nessa região.
                            </p>
                          </button>
                        )}

                        {filteredLocations.length > 0 ? (
                          <div className="space-y-2">
                            {filteredLocations.map((suggestion) => (
                              <button
                                key={suggestion.value}
                                type="button"
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => handleSelectLocation(suggestion.value)}
                                className="w-full rounded-xl border border-transparent px-4 py-3 text-left transition hover:border-blue-200 hover:bg-blue-50/70"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-semibold text-gray-900">
                                    {suggestion.label}
                                  </span>
                                  {suggestion.badge && (
                                    <span className="text-[11px] font-bold uppercase tracking-wide text-blue-500">
                                      {suggestion.badge}
                                    </span>
                                  )}
                                </div>
                                <p className="mt-1 text-xs text-gray-500">{suggestion.meta}</p>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-xl border border-dashed border-blue-200 bg-blue-50/40 px-4 py-6 text-center text-xs text-gray-500">
                            Não encontramos essa localidade. Tente um CEP ou escolha uma das regiões abaixo.
                          </div>
                        )}

                        {!isTypingLocation && (
                          <div className="grid gap-3 md:grid-cols-2">
                            <div className="space-y-2">
                              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Bairros em destaque
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {TRENDING_NEIGHBORHOODS.map((tag) => (
                                  <button
                                    key={tag}
                                    type="button"
                                    onMouseDown={(event) => event.preventDefault()}
                                    onClick={() => handleSelectLocation(tag)}
                                    className="rounded-full border border-blue-100 bg-white px-3 py-1.5 text-xs font-semibold text-blue-600 transition hover:border-blue-300 hover:text-blue-700"
                                  >
                                    {tag}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Descobertas rápidas
                              </p>
                              <div className="grid gap-2">
                                {QUICK_LOCATION_IDEAS.map((idea) => (
                                  <button
                                    key={idea.value}
                                    type="button"
                                    onMouseDown={(event) => event.preventDefault()}
                                    onClick={() => handleSelectLocation(idea.value)}
                                    className="w-full rounded-xl border border-blue-100 bg-white px-4 py-3 text-left transition hover:border-blue-300 hover:bg-blue-50"
                                  >
                                    <div className="text-sm font-semibold text-gray-900">
                                      {idea.label}
                                    </div>
                                    <p className="mt-1 text-xs text-gray-500">{idea.hint}</p>
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 border-t border-blue-100 bg-blue-50/40 px-4 py-3">
                        <button
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={handleUseCurrentLocation}
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 px-4 py-3 text-sm font-semibold text-white transition hover:from-blue-600 hover:to-cyan-700"
                        >
                          <Compass className="h-4 w-4" />
                          Usar minha localização agora (beta)
                        </button>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => handleSelectLocation("Sem preferência")}
                            className="rounded-full border border-transparent bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:border-blue-200 hover:text-blue-600"
                          >
                            Sem preferência
                          </button>
                          <button
                            type="button"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => handleSelectLocation("Atendimento online")}
                            className="rounded-full border border-transparent bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:border-blue-200 hover:text-blue-600"
                          >
                            Atendimento online
                          </button>
                        </div>

                        {geoStatus.state !== "idle" && (
                          <p
                            className={`text-xs ${
                              geoStatus.state === "error"
                                ? "text-red-500"
                                : geoStatus.state === "loading"
                                ? "text-blue-500"
                                : "text-green-600"
                            }`}
                          >
                            {geoStatus.state === "loading"
                              ? "Localizando pontos próximos..."
                              : geoStatus.message}
                          </p>
                        )}
                      </div>

                      {hasHistory && (
                        <div className="border-t border-blue-100 bg-white px-4 py-3">
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Últimas buscas
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {locationHistory.map((item) => (
                              <button
                                key={item}
                                type="button"
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => handleSelectLocation(item)}
                                className="rounded-full border border-blue-100 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:border-blue-300 hover:text-blue-600"
                              >
                                {item}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <Button
                onClick={handleSearch}
                className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white h-11 px-6"
              >
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </Button>
            </div>

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 flex-shrink-0">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={session.user?.image || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white text-sm">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium hidden sm:inline">
                      Olá, {session.user?.name?.split(" ")[0] || "Usuário"}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white border border-gray-200 shadow-lg z-50">
                  <DropdownMenuLabel className="text-gray-900">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none text-gray-900">
                        {session.user?.name}
                      </p>
                      <p className="text-xs leading-none text-gray-500">
                        {session.user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-gray-200" />
                  <DropdownMenuItem asChild className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 cursor-pointer">
                    <Link href={getDashboardUrl()}>
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Meu Painel
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 cursor-pointer">
                    <Link href={`${getDashboardUrl()}/perfil`}>
                      <User className="mr-2 h-4 w-4" />
                      Meu Perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-200" />
                  <DropdownMenuItem asChild className="text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer">
                    <Link href="/api/auth/signout">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sair
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="outline"
                className="flex-shrink-0 border-blue-200 text-blue-600 hover:text-white hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600"
                asChild
              >
                <Link href="/login">Entrar</Link>
              </Button>
            )}
          </div>

          {/* Filtros Avançados Recolhíveis - Integrado na barra de busca */}
          <div className="border-t border-blue-100 bg-gradient-to-r from-blue-50/30 to-purple-50/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
              <button
                onClick={() => setShowMap((prev) => !prev)}
                className="flex items-center gap-2 text-xs font-medium text-gray-700 hover:text-blue-600 transition-colors"
              >
                <Filter className="h-3.5 w-3.5 text-blue-600" />
                <span>Filtros Avançados</span>
                {(filters.rating || filters.disponivel || filters.dateFrom || filters.dateTo) && (
                  <span className="bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                    {[filters.rating, filters.disponivel, filters.dateFrom, filters.dateTo].filter(Boolean).length}
                  </span>
                )}
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform duration-200 ${showMap ? "rotate-180" : ""}`}
                />
              </button>

              {/* Filtros Expandidos */}
              {showMap && (
                <div className="mt-3 pb-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  {/* Avaliação */}
                  <div>
                    <label className="text-[10px] font-semibold text-gray-600 mb-1 block uppercase tracking-wide">Avaliação</label>
                    <div className="flex gap-1">
                      {[5, 4, 3].map((rating) => (
                        <button
                          key={rating}
                          onClick={() => setFilters({ ...filters, rating })}
                          className={`flex-1 flex items-center justify-center gap-0.5 px-1 py-1 rounded text-xs transition-all ${
                            filters.rating === rating
                              ? "bg-blue-500 text-white shadow-sm"
                              : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                          }`}
                        >
                          <Star className={`h-2.5 w-2.5 ${filters.rating === rating ? 'fill-white' : 'fill-yellow-400 text-yellow-400'}`} />
                          <span className="text-[10px] font-medium">{rating}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Preço Min */}
                  <div>
                    <label className="text-[10px] font-semibold text-gray-600 mb-1 block uppercase tracking-wide">Preço Min</label>
                    <Input
                      type="number"
                      placeholder="R$ 0"
                      value={filters.minPrice || ""}
                      onChange={(e) => setFilters({ ...filters, minPrice: Number(e.target.value) })}
                      className="h-7 text-[11px] px-2"
                      disabled={!hasPriceData}
                    />
                  </div>

                  {/* Preço Max */}
                  <div>
                    <label className="text-[10px] font-semibold text-gray-600 mb-1 block uppercase tracking-wide">Preço Max</label>
                    <Input
                      type="number"
                      placeholder="R$ 10k"
                      value={filters.maxPrice || ""}
                      onChange={(e) => setFilters({ ...filters, maxPrice: Number(e.target.value) })}
                      className="h-7 text-[11px] px-2"
                      disabled={!hasPriceData}
                    />
                  </div>

                  {/* Data De */}
                  <div>
                    <label className="text-[10px] font-semibold text-gray-600 mb-1 block uppercase tracking-wide">De</label>
                    <Input
                      type="date"
                      value={filters.dateFrom}
                      onChange={(event) =>
                        setFilters((prev) => ({ ...prev, dateFrom: event.target.value }))
                      }
                      className="h-7 text-[11px] px-2"
                    />
                  </div>

                  {/* Data Até */}
                  <div>
                    <label className="text-[10px] font-semibold text-gray-600 mb-1 block uppercase tracking-wide">Até</label>
                    <Input
                      type="date"
                      value={filters.dateTo}
                      min={filters.dateFrom || undefined}
                      onChange={(event) =>
                        setFilters((prev) => ({ ...prev, dateTo: event.target.value }))
                      }
                      className="h-7 text-[11px] px-2"
                    />
                  </div>

                  {/* Disponível */}
                  <div className="flex items-end">
                    <label className="flex items-center gap-1.5 cursor-pointer h-7 bg-white px-2 rounded border border-gray-200 hover:border-blue-300 transition-colors w-full">
                      <input
                        type="checkbox"
                        checked={filters.disponivel}
                        onChange={(e) => setFilters({ ...filters, disponivel: e.target.checked })}
                        className="w-3 h-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-[11px] text-gray-700 font-medium">Disponível</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Grid: Resultados + Mapa */}
        <div className={`grid grid-cols-1 gap-6 ${showMap ? 'lg:grid-cols-[1fr,450px]' : 'lg:grid-cols-1'}`}>
          {/* Resultados */}
          <main className="space-y-6">
            {/* Busca Inteligente com IA Gisele */}
            <BuscaInteligenteButton className="mb-6" />

            {/* Header dos Resultados */}
            <div className="mb-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {loading ? "Buscando..." : `${allResults.length} resultados encontrados`}
                  </h1>
                  {searchQuery && (
                    <p className="text-gray-600">
                      Mostrando resultados para <span className="font-semibold text-blue-600">&ldquo;{searchQuery}&rdquo;</span>
                      {location && ` em ${location}`}
                    </p>
                  )}
                </div>

                {/* Botão Toggle Mapa - apenas em desktop */}
                <div className="hidden lg:block">
                  <button
                    onClick={() => setShowMap((prev) => !prev)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-purple-200 bg-white hover:bg-purple-50 hover:border-purple-300 transition-all text-sm font-medium text-gray-700 hover:text-purple-600 shadow-sm"
                  >
                    {showMap ? (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600">
                          <path d="M18 6 6 18"></path>
                          <path d="m6 6 12 12"></path>
                        </svg>
                        Ocultar Mapa
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600">
                          <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"></path>
                          <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        Mostrar Mapa
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
                <p className="text-gray-600">Buscando os melhores resultados para você...</p>
              </div>
            )}

            {/* Resultados Grid */}
            {!loading && results.length > 0 && (
              <div className="space-y-6">
                {results.map((result) => {
                  const detailHref = `/profissionais/${result.id}`;
                  const favoritoEstado = favoritosStatus[result.id];
                  const isFavorito = favoritoEstado?.isFavorito ?? false;
                  const isFavoritoBusy = Boolean(
                    favoritoMutating[result.id] || (userId && favoritosCarregando)
                  );

                  return (
                    <div
                      key={result.id}
                      className="group rounded-xl border border-blue-100 bg-white p-6 shadow-sm transition-all hover:border-blue-300 hover:shadow-lg"
                    >
                      <div className="grid gap-6 lg:grid-cols-[120px,minmax(0,1fr)] lg:items-start">
                        {/* Avatar do profissional */}
                        <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 shadow-sm sm:h-28 sm:w-28 lg:h-32 lg:w-full">
                          <span className="text-3xl font-bold text-white md:text-4xl">
                            {result.nome.charAt(0)}
                          </span>
                        </div>

                        {/* Conteúdo - Informações do profissional */}
                        <div className="flex flex-col gap-4">
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div className="space-y-1.5">
                              {/* Nome + Favoritar + Ver detalhes */}
                              <div className="flex items-center gap-2">
                                <h3 className="text-xl font-bold text-gray-900 transition-colors group-hover:text-blue-600">
                                  {result.nome}
                                </h3>
                                <button
                                  type="button"
                                  onClick={() => handleToggleFavorito(result.id)}
                                  disabled={isFavoritoBusy}
                                  title={
                                    isFavorito ? "Remover dos favoritos" : "Adicionar aos favoritos"
                                  }
                                  aria-label={
                                    isFavorito ? "Remover dos favoritos" : "Adicionar aos favoritos"
                                  }
                                  className={`flex h-8 w-8 items-center justify-center rounded-full border transition-all ${
                                    isFavorito
                                      ? "border-blue-500 bg-blue-50 text-blue-600 shadow-sm"
                                      : "border-transparent text-gray-400 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
                                  } disabled:cursor-not-allowed disabled:opacity-60`}
                                >
                                  {isFavoritoBusy ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Heart
                                      className="h-3.5 w-3.5"
                                      fill={isFavorito ? "currentColor" : "none"}
                                    />
                                  )}
                                </button>
                                <Button
                                  asChild
                                  size="sm"
                                  className="ml-auto h-8 bg-gradient-to-r from-blue-500 to-cyan-600 text-white hover:from-blue-600 hover:to-cyan-700"
                                >
                                  <Link href={detailHref}>Ver detalhes</Link>
                                </Button>
                              </div>

                              <span className="inline-flex w-fit items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-blue-600">
                                Profissional
                              </span>
                              {result.especialidade && (
                                <p className="text-sm font-medium text-blue-600">
                                  {result.especialidade}
                                </p>
                              )}
                            </div>

                            {result.preco && (
                              <div className="space-y-1 text-left lg:text-right">
                                <div className="text-2xl font-bold text-blue-600">
                                  R$ {result.preco}
                                </div>
                                <div className="text-xs text-gray-500">por sessão</div>
                              </div>
                            )}
                          </div>

                          {result.descricao && (
                            <p className="text-sm leading-relaxed text-gray-600">
                              {result.descricao}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600">
                            {/* Avaliação */}
                            {result.avaliacao && (
                              <div className="flex items-center space-x-1">
                                <Star className="h-4 w-4 text-yellow-400" fill="currentColor" />
                                <span className="font-semibold text-gray-900">{result.avaliacao}</span>
                                <span className="text-sm text-gray-500">
                                  ({result.totalAvaliacoes})
                                </span>
                              </div>
                            )}

                            {/* Duração */}
                            {result.duracao && (
                              <div className="flex items-center space-x-1 text-gray-600">
                                <Clock className="h-4 w-4" />
                                <span className="text-sm">{result.duracao} min</span>
                              </div>
                            )}

                            {/* Localização */}
                            {result.localizacao && (
                              <div className="flex items-center space-x-1 text-gray-600">
                                <MapPin className="h-4 w-4" />
                                <span className="text-sm">{result.localizacao}</span>
                              </div>
                            )}

                            {/* Disponível */}
                            {result.disponivel && (
                              <div className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                                Disponível
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Agenda - Linha separada, ocupando toda a largura */}
                      {result.agenda && result.agenda.length > 0 && result.agenda.some(day => day.slots.length > 0) ? (
                        <div className="mt-4">
                          <ProfessionalSchedule
                            agenda={result.agenda}
                            professionalId={result.id}
                            professionalName={result.nome}
                            professionalSpecialty={result.especialidade}
                            professionalLocation={result.localizacao}
                            clinicId={result.clinicId}
                            clinicName={result.clinicName}
                            consultationPrice={result.preco}
                            onConfirmSchedule={handleScheduleConfirm}
                          />
                        </div>
                      ) : (
                        <div className="mt-6 rounded-2xl border border-gray-100 bg-gray-50 p-6 text-center">
                          <CalendarDays className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                          <p className="text-sm text-gray-600 font-medium">Agenda não disponível no momento</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Entre em contato para consultar disponibilidade
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Paginação */}
                {allResults.length > 20 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <Button
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      variant="outline"
                      size="sm"
                      className="border-purple-200 hover:border-purple-300"
                    >
                      Anterior
                    </Button>

                    <div className="flex gap-1">
                      {Array.from({ length: Math.ceil(allResults.length / 20) }, (_, i) => i + 1)
                        .slice(
                          Math.max(0, currentPage - 3),
                          Math.min(Math.ceil(allResults.length / 20), currentPage + 2)
                        )
                        .map((page) => (
                          <Button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            className={
                              currentPage === page
                                ? "bg-gradient-to-r from-blue-500 to-cyan-600 text-white"
                                : "border-purple-200 hover:border-purple-300"
                            }
                          >
                            {page}
                          </Button>
                        ))}
                    </div>

                    <Button
                      onClick={() =>
                        setCurrentPage((prev) =>
                          Math.min(Math.ceil(allResults.length / 20), prev + 1)
                        )
                      }
                      disabled={currentPage === Math.ceil(allResults.length / 20)}
                      variant="outline"
                      size="sm"
                      className="border-purple-200 hover:border-purple-300"
                    >
                      Próxima
                    </Button>

                    <span className="ml-4 text-sm text-gray-600">
                      Página {currentPage} de {Math.ceil(allResults.length / 20)} ({allResults.length}{" "}
                      profissionais)
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Empty State */}
            {!loading && results.length === 0 && (
              <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
                  <Search className="h-10 w-10 text-blue-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Nenhum resultado encontrado
                </h3>
                <p className="text-gray-600 mb-6">
                  Tente ajustar sua busca ou filtros para encontrar o que procura
                </p>
                <Button
                  onClick={() => {
                    setSearchQuery("");
                    setLocation("");
                    setFilters(createDefaultFilters());
                  }}
                  variant="outline"
                  className="border-blue-500 text-blue-600 hover:bg-blue-50"
                >
                  Limpar Filtros
                </Button>
              </div>
            )}
          </main>

          {/* Mapa Sticky à Direita */}
          <aside className="hidden lg:block">
            <div className="sticky top-32 h-[calc(100vh-10rem)]">
              <div className="h-full rounded-xl overflow-hidden border-2 border-purple-200 shadow-lg">
                <SearchResultsMap
                  results={results}
                  loading={loading}
                  focusLocation={location}
                />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>

      {/* Chat Bubble Assistant */}
      <ChatBubbleAssistant onAuthRequired={() => setAuthModalOpen(true)} />

      <BookingFlowModal
        open={bookingModalOpen}
        onOpenChange={setBookingModalOpen}
        initialData={bookingPayload}
        onBookingSuccess={handleBookingSuccess}
      />
      <AuthAccessModal
        open={authModalOpen}
        onOpenChange={(open) => {
          setAuthModalOpen(open);
          if (!open && !userId) {
            setPendingFavoriteId(null);
          }
        }}
        onSuccess={() => {
          setAuthModalOpen(false);
        }}
      />
    </>
  );
}

export default function BuscaPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
          <p className="text-gray-600">Carregando busca...</p>
        </div>
      </div>
    }>
      <BuscaPageContent />
    </Suspense>
  );
}
