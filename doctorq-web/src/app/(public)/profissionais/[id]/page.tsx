"use client";

import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  BadgeCheck,
  Calendar,
  Clock,
  Globe,
  Heart,
  Instagram,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Share2,
  Star,
  ThumbsDown,
  ThumbsUp,
  User,
  Award,
  Building2,
  AlertCircle,
  Facebook,
  MessageCircle,
  ChevronDown,
  Send,
  Copy,
  Check,
  Link2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { apiClient, buildQueryString } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { BookingFlowModal } from "@/components/booking/BookingFlowModal";
import { AuthAccessModal } from "@/components/auth/AuthAccessModal";
import { loadBookingDraft, saveBookingDraft } from "@/lib/booking-storage";
import { BookingDraft, ScheduleConfirmationPayload } from "@/types/agendamento";
import type { Avaliacao, AvaliacaoListMeta } from "@/lib/api/hooks/useAvaliacoes";
import { ReviewStats } from "@/components/reviews/ReviewStats";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import { ProfessionalBadge } from "@/components/professional/ProfessionalBadge";
import type {
  ReviewStats as ReviewStatsType,
  ProfessionalBadge as BadgeType,
  ProcedureOffered,
  WorkingHours,
} from "@/types/review";
import {
  useFavoritos as useFavoritosSWR,
  toggleFavorito,
} from "@/lib/api/hooks/useFavoritos";

interface Professional {
  id_profissional: string;
  nm_profissional: string;
  ds_especialidades: string[];
  ds_bio?: string;
  ds_foto_perfil?: string;
  ds_formacao?: string;
  nr_registro_profissional?: string;
  nr_anos_experiencia?: number;
  vl_avaliacao_media?: number;
  nr_total_avaliacoes?: number;
  nr_total_procedimentos?: number;
  st_ativo: boolean;
  id_empresa?: string;
  nm_empresa?: string;
  ds_email?: string;
  ds_telefone?: string;
  ds_site?: string;
  ds_instagram?: string;
  badges?: BadgeType[];
  procedimentos?: ProcedureOffered[];
  horarios_atendimento?: WorkingHours[];
}

interface HorarioDisponivel {
  dt_horario: string;
  disponivel: boolean;
  motivo?: string;
}

interface ProfessionalDetails {
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
}

interface ReviewsApiResponse {
  items?: Avaliacao[];
  avaliacoes?: Avaliacao[];
  meta?: AvaliacaoListMeta;
  total?: number;
  size?: number;
  page?: number;
  total_pages?: number;
}

interface ReviewFormState {
  atendimento: number;
  instalacoes: number;
  pontualidade: number;
  resultado: number;
  recommend: boolean;
  comment: string;
}

type RatingField = "atendimento" | "instalacoes" | "pontualidade" | "resultado";

const RATING_FIELDS: Array<{ key: RatingField; label: string; helper: string }> = [
  {
    key: "atendimento",
    label: "Atendimento",
    helper: "Empatia, clareza nas explicações e acompanhamento durante o atendimento.",
  },
  {
    key: "pontualidade",
    label: "Pontualidade",
    helper: "Cumprimento de horários e organização da equipe.",
  },
  {
    key: "instalacoes",
    label: "Estrutura da clínica",
    helper: "Conforto, higiene e infraestrutura do espaço físico.",
  },
  {
    key: "resultado",
    label: "Resultado do procedimento",
    helper: "Satisfação geral com o resultado obtido.",
  },
];

const INITIAL_REVIEW_FORM: ReviewFormState = {
  atendimento: 0,
  instalacoes: 0,
  pontualidade: 0,
  resultado: 0,
  recommend: true,
  comment: "",
};

export default function ProfissionalDetalhesPage() {
  const params = useParams();
  const router = useRouter();
  const professionalId = params.id as string;
  const { data: session } = useSession();
  const userId = session?.user?.id ?? null;

  const [professional, setProfessional] = useState<Professional | null>(null);
  const [agenda, setAgenda] = useState<HorarioDisponivel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingPayload, setBookingPayload] = useState<ScheduleConfirmationPayload | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pendingReviewProfessionalId, setPendingReviewProfessionalId] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Avaliacao[]>([]);
  const [reviewsMeta, setReviewsMeta] = useState<AvaliacaoListMeta | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewForm, setReviewForm] = useState<ReviewFormState>({ ...INITIAL_REVIEW_FORM });
  const [selectedFilter, setSelectedFilter] = useState<"all" | "positive" | "negative">("all");
  const [reviewStats, setReviewStats] = useState<ReviewStatsType | null>(null);

  // Estados para favoritos
  const {
    favoritos: favoritosDoUsuario,
    isLoading: favoritosCarregando,
  } = useFavoritosSWR(userId, { tipo: "profissional" });
  const [isFavorito, setIsFavorito] = useState(false);
  const [favoritoId, setFavoritoId] = useState<string | null>(null);
  const [favoritoMutating, setFavoritoMutating] = useState(false);
  const [pendingFavoriteAction, setPendingFavoriteAction] = useState(false);

  // Estados para menu de contato
  const [showContactMenu, setShowContactMenu] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Estados para acordeão de horários
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!professionalId) return;

    const fetchProfessional = async () => {
      try {
        setLoading(true);

        // Buscar dados do profissional (usando rota pública)
        const profData = await apiClient.get<Professional>(
          endpoints.profissionais.getPublic(professionalId)
        );
        setProfessional(profData);

        // Buscar agenda dos próximos 7 dias
        const today = new Date();
        const startOffset = today.getHours() >= 17 ? 1 : 0;
        const startDate = new Date(today);
        startDate.setDate(today.getDate() + startOffset);
        const dataInicio = startDate.toISOString().split("T")[0];

        const agendaData = await apiClient.post<
          Array<{
            id_profissional: string;
            horarios: HorarioDisponivel[];
          }>
        >(endpoints.agendamentos.disponibilidadeBatch, {
          ids_profissionais: [professionalId],
          data_inicio: dataInicio,
          num_dias: 7,
          duracao_minutos: 60,
        });

        if (agendaData && agendaData.length > 0) {
          setAgenda(agendaData[0].horarios);
        }

        setError(null);
      } catch (err) {
        console.error("Erro ao carregar profissional:", err);
        setError("Não foi possível carregar os dados do profissional");
      } finally {
        setLoading(false);
      }
    };

    fetchProfessional();
  }, [professionalId]);

  const fetchReviews = useCallback(async () => {
    if (!professionalId) return;

    try {
      setReviewsLoading(true);

      const query = buildQueryString({
        id_profissional: professionalId,
        page: 1,
        size: 10,
        ordenar_por: "recentes",
      });

      const response = await apiClient.get<ReviewsApiResponse>(
        `${endpoints.avaliacoes.list}${query}`
      );

      const lista = response?.items ?? response?.avaliacoes ?? [];
      setReviews(lista);

      const totalItems = response?.meta?.totalItems ?? response?.total ?? lista.length;
      const itemsPerPage =
        response?.meta?.itemsPerPage ?? response?.size ?? (lista.length > 0 ? lista.length : 10);
      const totalPages =
        response?.meta?.totalPages ??
        response?.total_pages ??
        (itemsPerPage > 0 ? Math.ceil(totalItems / itemsPerPage) : 0);
      const currentPage = response?.meta?.currentPage ?? response?.page ?? 1;

      setReviewsMeta({
        totalItems,
        itemsPerPage,
        totalPages,
        currentPage,
      });
      setReviewsError(null);
    } catch (err) {
      console.error("Erro ao carregar avaliações:", err);
      setReviewsError("Não foi possível carregar as avaliações.");
    } finally {
      setReviewsLoading(false);
    }
  }, [professionalId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  useEffect(() => {
    setShowReviewForm(false);
    setReviewForm({ ...INITIAL_REVIEW_FORM });
  }, [professionalId]);

  // Filtrar avaliações por tipo
  const filteredReviews = useMemo(() => {
    return reviews.filter((review) => {
      if (selectedFilter === "positive") return (review.nr_nota ?? review.nr_nota_geral ?? 0) >= 4;
      if (selectedFilter === "negative") return (review.nr_nota ?? review.nr_nota_geral ?? 0) < 4;
      return true;
    });
  }, [reviews, selectedFilter]);

  // Calcular estatísticas de avaliações
  useEffect(() => {
    if (reviews.length === 0) {
      setReviewStats(null);
      return;
    }

    const distribuicao: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let somaAtendimento = 0;
    let somaEstrutura = 0;
    let somaResultado = 0;
    let somaCustoBeneficio = 0;
    let recomendacoes = 0;

    reviews.forEach((review) => {
      const nota = review.nr_nota ?? review.nr_nota_geral ?? 3;
      const notaRounded = Math.round(nota);
      distribuicao[notaRounded] = (distribuicao[notaRounded] || 0) + 1;

      somaAtendimento += review.nr_atendimento ?? nota;
      somaEstrutura += review.nr_instalacoes ?? review.nr_estrutura ?? nota;
      somaResultado += review.nr_resultado ?? nota;
      somaCustoBeneficio += review.nr_custo_beneficio ?? nota;

      if (review.st_recomenda ?? review.bo_recomenda ?? true) {
        recomendacoes++;
      }
    });

    const total = reviews.length;
    const mediaGeral = reviews.reduce((acc, r) => acc + (r.nr_nota ?? r.nr_nota_geral ?? 3), 0) / total;

    setReviewStats({
      total,
      media_geral: mediaGeral,
      media_atendimento: somaAtendimento / total,
      media_estrutura: somaEstrutura / total,
      media_resultado: somaResultado / total,
      media_custo_beneficio: somaCustoBeneficio / total,
      percentual_recomenda: Math.round((recomendacoes / total) * 100),
      distribuicao,
    });
  }, [reviews]);

  // Handler para marcar review como útil
  const handleMarkUseful = useCallback(async (reviewId: string, isUseful: boolean) => {
    // Atualizar contadores localmente primeiro (optimistic update)
    setReviews((prevReviews) =>
      prevReviews.map((review) =>
        review.id_avaliacao === reviewId
          ? {
              ...review,
              nr_util: isUseful ? (review.nr_util || 0) + 1 : review.nr_util,
              nr_nao_util: !isUseful ? (review.nr_nao_util || 0) + 1 : review.nr_nao_util,
            }
          : review
      )
    );

    toast.success(isUseful ? "Marcado como útil!" : "Feedback registrado!");

    // Tentar enviar para o backend em background (silenciosamente)
    const endpoint = isUseful
      ? endpoints.avaliacoes.marcarUtil(reviewId)
      : endpoints.avaliacoes.marcarNaoUtil(reviewId);

    apiClient.post(endpoint, {})
      .then(() => {
        // Sucesso - voto sincronizado com backend
        if (process.env.NODE_ENV === 'development') {
          console.log('Voto sincronizado com sucesso');
        }
      })
      .catch((apiError: any) => {
        // Se for 404, endpoint não existe ainda - usar fallback local (silencioso)
        if (apiError?.response?.status === 404) {
          // Salvar no localStorage como fallback temporário
          const storageKey = `review_vote_${reviewId}_${userId || 'anonymous'}`;
          localStorage.setItem(storageKey, isUseful ? 'useful' : 'not_useful');

          if (process.env.NODE_ENV === 'development') {
            console.info('💡 Voto salvo localmente (endpoint não implementado)');
          }
        } else if (apiError?.response?.status !== 404) {
          // Outros erros (não 404): reverter atualização otimista
          console.warn("Erro ao sincronizar voto:", apiError?.message || 'Erro desconhecido');

          setReviews((prevReviews) =>
            prevReviews.map((review) =>
              review.id_avaliacao === reviewId
                ? {
                    ...review,
                    nr_util: isUseful ? Math.max(0, (review.nr_util || 0) - 1) : review.nr_util,
                    nr_nao_util: !isUseful ? Math.max(0, (review.nr_nao_util || 0) - 1) : review.nr_nao_util,
                  }
                : review
            )
          );

          // Não mostrar toast de erro para não poluir UX
          // toast.error("Erro ao sincronizar seu voto.");
        }
      });
  }, [userId]);

  // Sincronizar favoritos
  useEffect(() => {
    if (!userId || !professionalId) {
      setIsFavorito(false);
      setFavoritoId(null);
      return;
    }

    const favorito = (favoritosDoUsuario ?? []).find(
      (fav: any) =>
        (fav.id_profissional ?? fav.id_referencia) === professionalId
    );

    if (favorito) {
      setIsFavorito(true);
      setFavoritoId(favorito.id_favorito);
    } else {
      setIsFavorito(false);
      setFavoritoId(null);
    }
  }, [userId, professionalId, favoritosDoUsuario]);

  // Executar ação de favorito pendente após login
  useEffect(() => {
    if (userId && pendingFavoriteAction && !authModalOpen) {
      handleToggleFavorito();
      setPendingFavoriteAction(false);
    }
  }, [userId, pendingFavoriteAction, authModalOpen]);

  // Fechar menus ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showContactMenu && !target.closest(".relative")) {
        setShowContactMenu(false);
      }
      if (showShareMenu && !target.closest(".relative")) {
        setShowShareMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showContactMenu, showShareMenu]);

  const handleToggleFavorito = useCallback(async () => {
    if (!userId) {
      setPendingFavoriteAction(true);
      setAuthModalOpen(true);
      return;
    }

    if (favoritoMutating) return;

    setFavoritoMutating(true);

    try {
      const resultado = await toggleFavorito({
        userId,
        tipo: "profissional",
        itemId: professionalId,
        favoritoId,
      });

      if (resultado.adicionado) {
        setIsFavorito(true);
        setFavoritoId(resultado.favorito?.id_favorito ?? null);
        toast.success("Profissional adicionado aos seus favoritos!");
      } else {
        setIsFavorito(false);
        setFavoritoId(null);
        toast.success("Profissional removido dos seus favoritos!");
      }
    } catch (error: any) {
      console.error("Erro ao alternar favorito:", error);
      toast.error(
        error?.message || "Não foi possível atualizar seus favoritos. Tente novamente."
      );
    } finally {
      setFavoritoMutating(false);
    }
  }, [userId, professionalId, favoritoId, favoritoMutating, authModalOpen]);

  const handleShare = useCallback(async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const text = `Confira o perfil de ${professional?.nm_profissional} na DoctorQ!`;

    // Tentar usar Web Share API
    if (navigator.share) {
      try {
        await navigator.share({
          title: professional?.nm_profissional || "Profissional DoctorQ",
          text,
          url,
        });
        toast.success("Compartilhado com sucesso!");
      } catch (error: any) {
        if (error.name !== "AbortError") {
          console.error("Erro ao compartilhar:", error);
        }
      }
    } else {
      // Fallback: mostrar menu de compartilhamento
      setShowShareMenu(true);
    }
  }, [professional]);

  const handleCopyLink = useCallback(async () => {
    try {
      const url = typeof window !== "undefined" ? window.location.href : "";
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      toast.success("Link copiado!");
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      console.error("Erro ao copiar link:", error);
      toast.error("Erro ao copiar link");
    }
  }, []);

  const handleWhatsAppContact = useCallback(() => {
    const phone = professional?.ds_telefone?.replace(/\D/g, "");
    if (!phone) {
      toast.error("Número de WhatsApp não disponível");
      return;
    }
    const message = `Olá! Vi seu perfil na DoctorQ e gostaria de agendar uma consulta.`;
    const url = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
    setShowContactMenu(false);
  }, [professional]);

  const handlePhoneContact = useCallback(() => {
    const phone = professional?.ds_telefone;
    if (!phone) {
      toast.error("Telefone não disponível");
      return;
    }
    window.open(`tel:${phone}`, "_self");
    setShowContactMenu(false);
  }, [professional]);

  const handleEmailContact = useCallback(() => {
    const email = professional?.ds_email;
    if (!email) {
      toast.error("E-mail não disponível");
      return;
    }
    window.open(`mailto:${email}?subject=Contato via DoctorQ`, "_self");
    setShowContactMenu(false);
  }, [professional]);

  const handleInstagramContact = useCallback(() => {
    const instagram = professional?.ds_instagram;
    if (!instagram) {
      toast.error("Instagram não disponível");
      return;
    }
    const username = instagram.replace("@", "").replace("instagram.com/", "");
    window.open(`https://instagram.com/${username}`, "_blank");
    setShowContactMenu(false);
  }, [professional]);

  const handleChatbotContact = useCallback(() => {
    // Implementar navegação para o chatbot
    router.push("/chat");
    setShowContactMenu(false);
  }, [router]);

  const toggleDayExpansion = useCallback((date: string) => {
    setExpandedDays(prev => {
      const newSet = new Set(prev);
      if (newSet.has(date)) {
        newSet.delete(date);
      } else {
        newSet.add(date);
      }
      return newSet;
    });
  }, []);

  const horariosDisponiveis = useMemo(
    () => agenda.filter((horario) => horario.disponivel),
    [agenda]
  );

  useEffect(() => {
    if (horariosDisponiveis.length === 0) {
      setSelectedSlotId(null);
      return;
    }

    setSelectedSlotId((current) => {
      if (!current) {
        return horariosDisponiveis[0].dt_horario;
      }

      const aindaValido = horariosDisponiveis.some(
        (horario) => horario.dt_horario === current && horario.disponivel
      );
      return aindaValido ? current : horariosDisponiveis[0].dt_horario;
    });
  }, [horariosDisponiveis]);

  const agendaPorData = useMemo(() => {
    const agrupado: Record<string, HorarioDisponivel[]> = {};
    agenda.forEach((horario) => {
      const date = new Date(horario.dt_horario).toISOString().split("T")[0];
      if (!agrupado[date]) {
        agrupado[date] = [];
      }
      agrupado[date].push(horario);
    });
    return agrupado;
  }, [agenda]);

  const sortedAgendaEntries = useMemo(() => {
    return Object.entries(agendaPorData).sort(([dataA], [dataB]) => {
      return new Date(dataA).getTime() - new Date(dataB).getTime();
    });
  }, [agendaPorData]);

  const upcomingAgendaEntries = useMemo(() => {
    return sortedAgendaEntries.slice(0, 7);
  }, [sortedAgendaEntries]);

  // Inicializar primeiros 2 dias expandidos
  useEffect(() => {
    if (upcomingAgendaEntries.length > 0 && expandedDays.size === 0) {
      const firstTwoDays = upcomingAgendaEntries.slice(0, 2).map(([date]) => date);
      setExpandedDays(new Set(firstTwoDays));
    }
  }, [upcomingAgendaEntries, expandedDays]);

  const handleWriteReview = useCallback(() => {
    if (!professionalId) return;

    if (!userId) {
      setPendingReviewProfessionalId(professionalId);
      setAuthModalOpen(true);
      return;
    }

    setReviewForm({ ...INITIAL_REVIEW_FORM });
    setShowReviewForm(true);
  }, [userId, professionalId]);

  useEffect(() => {
    if (userId && pendingReviewProfessionalId && !authModalOpen) {
      setReviewForm({ ...INITIAL_REVIEW_FORM });
      setShowReviewForm(true);
      setPendingReviewProfessionalId(null);
    }
  }, [userId, pendingReviewProfessionalId, authModalOpen]);

  useEffect(() => {
    if (!showReviewForm) {
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    const timer = window.setTimeout(() => {
      document.getElementById("review-form")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);

    return () => window.clearTimeout(timer);
  }, [showReviewForm]);

  const handleRatingChange = (field: RatingField, value: number) => {
    setReviewForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleRecommendChange = (value: boolean) => {
    setReviewForm((prev) => ({
      ...prev,
      recommend: value,
    }));
  };

  const handleReviewCommentChange = (value: string) => {
    setReviewForm((prev) => ({
      ...prev,
      comment: value,
    }));
  };

  const handleCancelReview = () => {
    setShowReviewForm(false);
    setReviewForm({ ...INITIAL_REVIEW_FORM });
  };

  const renderRatingStars = (field: RatingField, value: number, size: "sm" | "md" = "md") => {
    const baseClasses = size === "sm" ? "h-5 w-5" : "h-6 w-6";

    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((score) => (
          <button
            key={`${field}-${score}`}
            type="button"
            onClick={() => handleRatingChange(field, score)}
            className="transition-transform hover:scale-110"
            aria-label={`${score} estrela${score > 1 ? "s" : ""}`}
          >
            <Star
              className={`${baseClasses} ${
                score <= value ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const renderStaticStars = (value: number) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((score) => (
        <Star
          key={`static-${score}`}
          className={`h-4 w-4 ${score <= value ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`}
        />
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 via-white to-cyan-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error || !professional) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 via-white to-cyan-50">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
            <User className="h-10 w-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Profissional não encontrado</h1>
          <p className="text-gray-600 mb-6">{error || "Verifique o ID e tente novamente"}</p>
          <button
            onClick={() => router.push("/busca")}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-lg hover:shadow-lg transition-all"
          >
            <ArrowLeft className="h-5 w-5" />
            Voltar para busca
          </button>
        </div>
      </div>
    );
  }

  const specialties =
    professional.ds_especialidades?.filter((item) => item && item.trim().length) ?? [];

  // Usar valores calculados das avaliações reais ao invés de valores cached
  const formattedRating = reviewStats?.media_geral
    ? reviewStats.media_geral.toFixed(1)
    : reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + (r.nr_nota ?? r.nr_nota_geral ?? 0), 0) / reviews.length).toFixed(1)
    : typeof professional.vl_avaliacao_media === "number"
    ? professional.vl_avaliacao_media.toFixed(1)
    : null;

  // Usar contagem real de avaliações, não valores cached
  const totalReviews = reviews.length > 0 ? reviews.length : (reviewsMeta?.totalItems ?? 0);
  const experienceYears = professional.nr_anos_experiencia ?? null;
  const clinicName = professional.nm_empresa ?? null;
  const addressLine = professional.ds_localizacao ?? professional.ds_endereco ?? null;
  const cityStateLine = [
    professional.nm_cidade ?? professional.ds_cidade ?? null,
    professional.ds_estado ?? professional.sg_estado ?? null,
  ]
    .filter(Boolean)
    .join(" - ");
  const locationSummary = [addressLine, cityStateLine].filter(Boolean).join(" • ");
  const hasContactInfo =
    !!professional.ds_telefone ||
    !!professional.ds_email ||
    !!professional.ds_site ||
    !!professional.ds_instagram;
  const hasAvailability = horariosDisponiveis.length > 0;
  const reviewSectionTitle = totalReviews > 0 ? `Avaliações (${totalReviews})` : "Avaliações";

  const handleSelectHorario = (horario: HorarioDisponivel) => {
    if (!horario.disponivel) return;
    setSelectedSlotId(horario.dt_horario);
  };

  const resolveSelectedSlot = () => {
    if (!selectedSlotId) return null;
    return agenda.find((horario) => horario.dt_horario === selectedSlotId) ?? null;
  };

  const handleAgendarConsulta = async () => {
    if (!professional) return;
    const slotSelecionado = resolveSelectedSlot();
    if (!slotSelecionado) return;

    const slotDateTime = new Date(slotSelecionado.dt_horario);
    const date = slotDateTime.toISOString().split("T")[0];
    const time = slotDateTime
      .toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
      .replace(/^24:/, "00:");

    let payload: ScheduleConfirmationPayload = {
      professionalId: professional.id_profissional,
      professionalName: professional.nm_profissional,
      specialty: professional.ds_especialidades?.[0],
      clinicId: professional.id_empresa ?? undefined,
      clinicName: professional.nm_empresa ?? undefined,
      location: professional.nm_empresa ?? undefined,
      date,
      time,
      slotId: slotSelecionado.dt_horario,
    };

    if (!payload.clinicId || !payload.location) {
      try {
        const details = await apiClient.get<ProfessionalDetails>(
          endpoints.profissionais.get(professional.id_profissional)
        );

        if (details) {
          payload = {
            ...payload,
            clinicId: details.id_empresa ?? payload.clinicId,
            clinicName: details.nm_empresa ?? payload.clinicName,
            location:
              payload.location ??
              details.ds_localizacao ??
              details.ds_endereco ??
              (details.ds_cidade && (details.ds_estado ?? details.sg_estado)
                ? `${details.ds_cidade}, ${details.ds_estado ?? details.sg_estado}`
                : undefined) ??
              (details.nm_cidade && (details.ds_estado ?? details.sg_estado)
                ? `${details.nm_cidade}, ${details.ds_estado ?? details.sg_estado}`
                : undefined) ??
              payload.location,
          };
        }
      } catch (err) {
        console.warn("Não foi possível enriquecer o payload do agendamento:", err);
      }
    }

    if (typeof window !== "undefined") {
      const currentDraft = loadBookingDraft();
      const mergedDraft: BookingDraft = {
        ...(currentDraft ?? {}),
        ...payload,
      };
      saveBookingDraft(mergedDraft);
    }

    setBookingPayload(payload);
    setBookingModalOpen(true);
  };

  const handleSubmitReview = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!professionalId) {
      return;
    }

    if (!userId) {
      setPendingReviewProfessionalId(professionalId);
      setAuthModalOpen(true);
      toast.error("Entre na sua conta para deixar uma avaliação.");
      return;
    }

    if (!professional) {
      toast.error("Não foi possível identificar o profissional.");
      return;
    }

    const { atendimento, instalacoes, pontualidade, resultado, recommend, comment } = reviewForm;

    if (!atendimento || !instalacoes || !pontualidade || !resultado) {
      toast.error("Avalie todos os critérios antes de enviar.");
      return;
    }

    const trimmedComment = comment.trim();
    if (trimmedComment.length < 20) {
      toast.error("Conte um pouco mais sobre sua experiência (mínimo de 20 caracteres).");
      return;
    }

    const ratings = [atendimento, instalacoes, pontualidade, resultado];
    const average = ratings.reduce((sum, value) => sum + value, 0) / ratings.length;
    const generalRating = Math.min(5, Math.max(1, Math.round(average)));

    setReviewSubmitting(true);

    try {
      await apiClient.post(endpoints.avaliacoes.create, {
        id_paciente: userId,
        id_profissional: professional.id_profissional,
        id_clinica: professional.id_empresa ?? undefined,
        nr_nota: generalRating,
        nr_atendimento: atendimento,
        nr_instalacoes: instalacoes,
        nr_pontualidade: pontualidade,
        nr_resultado: resultado,
        st_recomenda: recommend,
        ds_comentario: trimmedComment,
      });

      toast.success("Avaliação enviada! Ela ficará visível após a moderação.");

      setReviewForm({ ...INITIAL_REVIEW_FORM });
      setShowReviewForm(false);
      await fetchReviews();
    } catch (err) {
      console.error("Erro ao enviar avaliação:", err);
      toast.error("Não foi possível enviar sua avaliação. Tente novamente.");
    } finally {
      setReviewSubmitting(false);
    }
  };

  const getDayName = (dayNumber: number) => {
    const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    return days[dayNumber];
  };

  const handleScrollToAgenda = () => {
    if (typeof window === "undefined") return;
    const element = document.getElementById("agenda-card");
    element?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleBookingSuccess = (draft: BookingDraft) => {
    setAgenda((prevAgenda) =>
      prevAgenda.map((horario) => {
        const mesmoHorario =
          (draft.slotId && draft.slotId === horario.dt_horario) ||
          (() => {
            if (!draft.date || !draft.time) {
              return false;
            }
            const [hour, minute] = draft.time.split(":").map(Number);
            const target = new Date(horario.dt_horario);
            return (
              target.toISOString().startsWith(draft.date) &&
              target.getHours() === hour &&
              target.getMinutes() === minute
            );
          })();

        if (!mesmoHorario) {
          return horario;
        }

        return {
          ...horario,
          disponivel: false,
        };
      })
    );
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-cyan-50">
        <div className="sticky top-0 z-40 border-b border-blue-100 bg-white/80 backdrop-blur supports-[backdrop-filter]:backdrop-blur">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-blue-600"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para profissionais
            </button>
          </div>
        </div>

        <div className="relative">
          <div className="h-56 w-full bg-gradient-to-r from-blue-500 via-purple-500 to-rose-500 md:h-64" />

          <div className="relative z-10 -mt-24 pb-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="rounded-3xl border border-blue-100/60 bg-white p-6 shadow-xl shadow-pink-100/40 md:p-10">
                <div className="flex flex-col gap-8 md:flex-row md:items-start">
                  <div className="relative mx-auto md:mx-0">
                    <div className="h-32 w-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 p-[3px] shadow-lg md:h-40 md:w-40">
                      <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-white">
                        {professional.ds_foto_perfil ? (
                          <Image
                            src={professional.ds_foto_perfil}
                            alt={professional.nm_profissional}
                            width={160}
                            height={160}
                            className="h-full w-full object-cover"
                            sizes="160px"
                          />
                        ) : (
                          <User className="h-16 w-16 text-blue-300" />
                        )}
                      </div>
                    </div>
                    {professional.st_ativo && (
                      <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-green-500 px-3 py-1 text-xs font-semibold text-white shadow">
                        <BadgeCheck className="h-3 w-3" />
                        Disponível
                      </span>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">
                          {professional.nm_profissional}
                        </h1>
                        {specialties.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {specialties.map((specialty, specialtyIndex) => (
                              <span
                                key={`${specialty}-${specialtyIndex}`}
                                className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600"
                              >
                                {specialty}
                              </span>
                            ))}
                          </div>
                        )}
                        {professional.nr_registro_profissional && (
                          <p className="mt-3 text-sm text-gray-500">
                            {professional.nr_registro_profissional}
                          </p>
                        )}
                        {clinicName && (
                          <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                            <Building2 className="h-4 w-4 text-blue-500" />
                            <span>{clinicName}</span>
                          </div>
                        )}
                        {locationSummary && (
                          <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="h-4 w-4 text-blue-500" />
                            <span>{locationSummary}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-start">
                        <button
                          type="button"
                          onClick={handleToggleFavorito}
                          disabled={favoritoMutating || favoritosCarregando}
                          title={isFavorito ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                          className={`rounded-full border p-3 transition-all ${
                            isFavorito
                              ? "border-blue-500 bg-blue-50 text-blue-600 shadow-sm"
                              : "border-blue-200 bg-white text-blue-500 hover:bg-blue-50"
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {favoritoMutating || favoritosCarregando ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Heart className="h-4 w-4" fill={isFavorito ? "currentColor" : "none"} />
                          )}
                        </button>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={handleShare}
                            className="rounded-full border border-blue-200 bg-white p-3 text-blue-500 transition-colors hover:bg-blue-50"
                          >
                            <Share2 className="h-4 w-4" />
                          </button>
                          {showShareMenu && (
                            <div className="absolute right-0 top-full mt-2 z-50 w-64 rounded-xl border border-blue-100 bg-white shadow-2xl shadow-pink-500/10 p-4">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-semibold text-gray-900">Compartilhar</h4>
                                <button
                                  type="button"
                                  onClick={() => setShowShareMenu(false)}
                                  className="text-gray-400 hover:text-gray-600"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                              <div className="space-y-2">
                                <button
                                  type="button"
                                  onClick={handleCopyLink}
                                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors text-left"
                                >
                                  {linkCopied ? (
                                    <Check className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <Link2 className="h-4 w-4 text-gray-600" />
                                  )}
                                  <span className="text-sm text-gray-700">
                                    {linkCopied ? "Link copiado!" : "Copiar link"}
                                  </span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-4 sm:grid-cols-3">
                      {formattedRating && (
                        <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
                          <div className="rounded-full bg-white p-2 shadow-sm">
                            <Star className="h-5 w-5 fill-yellow-400 text-yellow-500" />
                          </div>
                          <div>
                            <div className="text-lg font-semibold text-gray-900">{formattedRating}</div>
                            <p className="text-xs text-gray-600">
                              {totalReviews > 0 ? `${totalReviews} avaliações` : "Sem avaliações ainda"}
                            </p>
                          </div>
                        </div>
                      )}

                      {experienceYears && (
                        <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-white p-4">
                          <div className="rounded-full bg-blue-50 p-2 text-blue-500">
                            <Award className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="text-lg font-semibold text-gray-900">
                              {experienceYears} anos
                            </div>
                            <p className="text-xs text-gray-600">de experiência</p>
                          </div>
                        </div>
                      )}

                      {professional.st_ativo !== undefined && (
                        <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-white p-4">
                          <div
                            className={`rounded-full p-2 ${
                              professional.st_ativo ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            <BadgeCheck className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="text-lg font-semibold text-gray-900">
                              {professional.st_ativo ? "Atendendo" : "Indisponível"}
                            </div>
                            <p className="text-xs text-gray-600">status do profissional</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {professional.ds_bio && (
                      <p className="mt-6 text-base leading-relaxed text-gray-700">{professional.ds_bio}</p>
                    )}

                    <div className="mt-6 flex flex-wrap gap-3">
                      <button
                        onClick={handleScrollToAgenda}
                        className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 text-sm font-semibold shadow-lg shadow-pink-200 hover:shadow-xl transition-all"
                      >
                        <Calendar className="h-4 w-4" />
                        Ver agenda e agendar
                      </button>

                      <div className="relative">
                        <button
                          onClick={() => setShowContactMenu(!showContactMenu)}
                          className="inline-flex items-center gap-2 rounded-full border-2 border-blue-600 px-6 py-3 text-sm font-semibold text-blue-600 transition-all hover:bg-blue-50"
                        >
                          <Send className="h-4 w-4" />
                          Enviar mensagem
                          <ChevronDown className={`h-4 w-4 transition-transform ${showContactMenu ? "rotate-180" : ""}`} />
                        </button>

                        {showContactMenu && (
                          <div className="absolute left-0 top-full mt-2 z-50 w-72 rounded-2xl border border-blue-100 bg-white shadow-2xl shadow-pink-500/20 p-4 animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-sm font-bold text-gray-900">Escolha como entrar em contato</h4>
                              <button
                                type="button"
                                onClick={() => setShowContactMenu(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>

                            <div className="space-y-2">
                              <button
                                type="button"
                                onClick={handleWhatsAppContact}
                                disabled={!professional?.ds_telefone}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-green-50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed group border border-transparent hover:border-green-200"
                              >
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors">
                                  <MessageCircle className="h-5 w-5" />
                                </div>
                                <div className="flex-1">
                                  <div className="text-sm font-semibold text-gray-900">WhatsApp</div>
                                  <div className="text-xs text-gray-500">Resposta rápida</div>
                                </div>
                              </button>

                              <button
                                type="button"
                                onClick={handleChatbotContact}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-purple-50 transition-all text-left group border border-transparent hover:border-purple-200"
                              >
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                  <MessageSquare className="h-5 w-5" />
                                </div>
                                <div className="flex-1">
                                  <div className="text-sm font-semibold text-gray-900">Chatbot IA</div>
                                  <div className="text-xs text-gray-500">Atendimento 24/7</div>
                                </div>
                              </button>

                              <button
                                type="button"
                                onClick={handleInstagramContact}
                                disabled={!professional?.ds_instagram}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-blue-50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed group border border-transparent hover:border-blue-200"
                              >
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 via-cyan-500 to-orange-500 text-white group-hover:scale-110 transition-transform">
                                  <Instagram className="h-5 w-5" />
                                </div>
                                <div className="flex-1">
                                  <div className="text-sm font-semibold text-gray-900">Instagram</div>
                                  <div className="text-xs text-gray-500">Direct message</div>
                                </div>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  toast.info("Função em desenvolvimento");
                                  setShowContactMenu(false);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-blue-50 transition-all text-left group border border-transparent hover:border-blue-200"
                              >
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                  <Facebook className="h-5 w-5" />
                                </div>
                                <div className="flex-1">
                                  <div className="text-sm font-semibold text-gray-900">Facebook</div>
                                  <div className="text-xs text-gray-500">Messenger</div>
                                </div>
                              </button>

                              <button
                                type="button"
                                onClick={handlePhoneContact}
                                disabled={!professional?.ds_telefone}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed group border border-transparent hover:border-gray-200"
                              >
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 group-hover:bg-gray-600 group-hover:text-white transition-colors">
                                  <Phone className="h-5 w-5" />
                                </div>
                                <div className="flex-1">
                                  <div className="text-sm font-semibold text-gray-900">Telefone</div>
                                  <div className="text-xs text-gray-500">Ligação direta</div>
                                </div>
                              </button>
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-100">
                              <button
                                type="button"
                                onClick={handleEmailContact}
                                disabled={!professional?.ds_email}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-purple-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium text-gray-700"
                              >
                                <Mail className="h-4 w-4" />
                                Enviar e-mail
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                  {specialties.length > 0 && (
                    <div className="rounded-2xl border border-blue-100 bg-white p-6">
                      <h2 className="text-lg font-semibold text-gray-900">Especialidades</h2>
                      <p className="mt-4 text-gray-700">{specialties.join(", ")}</p>
                    </div>
                  )}

                  {professional.ds_formacao && (
                    <div className="rounded-2xl border border-blue-100 bg-white p-6">
                      <h2 className="text-lg font-semibold text-gray-900">Formação</h2>
                      <div className="mt-4 space-y-2 text-gray-700">
                        {professional.ds_formacao
                          .split("\n")
                          .filter((line) => line.trim().length > 0)
                          .map((line, index) => (
                            <p key={`${line}-${index}`}>{line}</p>
                          ))}
                      </div>
                    </div>
                  )}

                  {professional.nr_registro_profissional && (
                    <div className="rounded-2xl border border-blue-100 bg-white p-6">
                      <h2 className="text-lg font-semibold text-gray-900">Registro Profissional</h2>
                      <p className="mt-4 text-gray-700">{professional.nr_registro_profissional}</p>
                    </div>
                  )}

                  {/* Estatísticas de Avaliações */}
                  {reviewStats && <ReviewStats stats={reviewStats} />}

                  {/* Seção de Avaliações */}
                  <div
                    id="avaliacoes"
                    className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm shadow-pink-100/30"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">{reviewSectionTitle}</h2>
                        <p className="mt-1 text-sm text-gray-600">
                          Já foi atendido por este profissional? Compartilhe sua experiência e ajude outros pacientes.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {showReviewForm ? (
                          <button
                            type="button"
                            onClick={handleCancelReview}
                            className="inline-flex items-center gap-2 rounded-full border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-600 transition-all hover:bg-blue-50"
                            disabled={reviewSubmitting}
                          >
                            Cancelar
                          </button>
                        ) : (
                          <button
                            onClick={handleWriteReview}
                            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-lg"
                          >
                            <Star className="h-4 w-4" />
                            Escrever avaliação
                          </button>
                        )}
                      </div>
                    </div>

                    {showReviewForm && (
                      <form id="review-form" onSubmit={handleSubmitReview} className="mt-6 space-y-6">
                        <div className="rounded-2xl border border-blue-100 bg-white/90 p-6 shadow-inner shadow-pink-100/40">
                          <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/70 p-4 text-left">
                            <AlertCircle className="h-5 w-5 text-blue-500" />
                            <div className="text-sm text-blue-900">
                              <p className="font-semibold">Avaliações moderadas</p>
                              <p>
                                Para manter a comunidade segura, todas as avaliações passam por uma verificação rápida
                                antes de aparecerem para outros pacientes.
                              </p>
                            </div>
                          </div>

                          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                            {RATING_FIELDS.map(({ key, label, helper }) => (
                              <div
                                key={key}
                                className="rounded-xl border border-blue-100/80 bg-white p-4 shadow-sm shadow-pink-100/30"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-semibold text-gray-900">{label}</span>
                                  {reviewForm[key] > 0 && (
                                    <span className="text-xs font-medium text-blue-600">{reviewForm[key]} / 5</span>
                                  )}
                                </div>
                                <p className="mt-2 text-xs text-gray-500 leading-relaxed">{helper}</p>
                                <div className="mt-4">{renderRatingStars(key, reviewForm[key], "sm")}</div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-2xl border border-blue-100 bg-white/90 p-6 shadow-inner shadow-pink-100/30">
                          <span className="block text-sm font-semibold text-gray-900">
                            Você recomendaria este profissional?
                          </span>
                          <div className="mt-4 flex flex-wrap gap-3">
                            <button
                              type="button"
                              onClick={() => handleRecommendChange(true)}
                              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                                reviewForm.recommend
                                  ? "border-green-500 bg-green-50 text-green-700"
                                  : "border-gray-200 text-gray-600 hover:border-green-200 hover:text-green-600"
                              }`}
                            >
                              <ThumbsUp className="h-4 w-4" />
                              Sim, recomendo
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRecommendChange(false)}
                              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                                !reviewForm.recommend
                                  ? "border-red-500 bg-red-50 text-red-700"
                                  : "border-gray-200 text-gray-600 hover:border-red-200 hover:text-red-600"
                              }`}
                            >
                              <ThumbsDown className="h-4 w-4" />
                              Não recomendo
                            </button>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-blue-100 bg-white/90 p-6 shadow-inner shadow-pink-100/30">
                          <label className="block text-sm font-semibold text-gray-900" htmlFor="review-comment">
                            Conte sobre sua experiência
                          </label>
                          <textarea
                            id="review-comment"
                            value={reviewForm.comment}
                            onChange={(event) => handleReviewCommentChange(event.target.value)}
                            placeholder="Como foi o atendimento? Você ficou satisfeito com o resultado? Compartilhe detalhes que possam ajudar outros pacientes."
                            rows={5}
                            maxLength={600}
                            className="mt-3 w-full rounded-xl border border-blue-100 px-4 py-3 text-sm text-gray-700 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                          />
                          <div className="mt-2 text-right text-xs text-gray-500">
                            {reviewForm.comment.trim().length} / 600 caracteres
                          </div>
                        </div>

                        <div className="flex flex-col gap-3 border-t border-blue-100 pt-4 sm:flex-row sm:justify-end">
                          <button
                            type="button"
                            onClick={handleCancelReview}
                            className="inline-flex items-center justify-center rounded-full border border-gray-200 px-5 py-2 text-sm font-semibold text-gray-600 transition-all hover:bg-gray-50"
                            disabled={reviewSubmitting}
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            disabled={reviewSubmitting}
                            className={`inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-lg $
                              {reviewSubmitting ? "opacity-80" : ""}
                            `}
                          >
                            {reviewSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                            Enviar avaliação
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Filtros de Avaliações */}
                    {!showReviewForm && reviews.length > 0 && (
                      <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-6">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Avaliações ({filteredReviews.length})
                        </h3>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setSelectedFilter("all")}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              selectedFilter === "all"
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            Todas
                          </button>
                          <button
                            onClick={() => setSelectedFilter("positive")}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              selectedFilter === "positive"
                                ? "bg-green-600 text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            Positivas
                          </button>
                          <button
                            onClick={() => setSelectedFilter("negative")}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              selectedFilter === "negative"
                                ? "bg-red-600 text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            Negativas
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="mt-8 space-y-4">
                      {reviewsLoading ? (
                        <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-sm text-blue-700">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Carregando avaliações...
                        </div>
                      ) : reviewsError ? (
                        <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
                          {reviewsError}
                        </div>
                      ) : filteredReviews.length > 0 ? (
                        filteredReviews.map((review) => {
                          // Mapear campos do backend para o tipo Review esperado pelo componente
                          const reviewForCard = {
                            id_avaliacao: review.id_avaliacao,
                            id_profissional: professionalId,
                            id_paciente: review.id_paciente || "",
                            nr_nota_geral: review.nr_nota || review.nr_nota_geral || 0,
                            nr_nota_atendimento: review.nr_atendimento || 0,
                            nr_nota_estrutura: review.nr_instalacoes || review.nr_estrutura || 0,
                            nr_nota_resultado: review.nr_resultado || 0,
                            nr_nota_custo_beneficio: review.nr_custo_beneficio || 0,
                            bo_recomenda: review.st_recomenda ?? review.bo_recomenda ?? true,
                            ds_comentario: review.ds_comentario || "",
                            ds_resposta_profissional: review.ds_resposta || undefined,
                            nm_paciente: review.nm_paciente || "Paciente DoctorQ",
                            dt_criacao: review.dt_criacao || new Date().toISOString(),
                            nr_util: review.nr_util || 0,
                            nr_nao_util: review.nr_nao_util || 0,
                            bo_verificada: review.st_verificada ?? review.bo_verificada ?? false,
                            st_moderacao: (review.st_moderacao || "aprovada") as "pendente" | "aprovada" | "rejeitada",
                          };

                          return <ReviewCard key={review.id_avaliacao} review={reviewForCard} onMarkUseful={handleMarkUseful} />;
                        })
                      ) : (
                        !showReviewForm && (
                          <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-6 text-center">
                            <MessageSquare className="mx-auto h-10 w-10 text-blue-400" />
                            <p className="mt-3 text-sm font-medium text-gray-900">
                              As avaliações dos pacientes aparecerão aqui.
                            </p>
                            <p className="mt-1 text-sm text-gray-600">
                              Seja o primeiro a contar como foi sua experiência com {professional.nm_profissional}.
                            </p>
                            <button
                              onClick={handleWriteReview}
                              className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-blue-600 shadow-sm transition-all hover:bg-blue-100"
                            >
                              <Star className="h-4 w-4" />
                              Escrever avaliação
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Horários de Atendimento */}
                  {professional.horarios_atendimento && professional.horarios_atendimento.length > 0 && (
                    <div className="rounded-2xl border border-blue-100 bg-white p-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                        <Clock className="h-5 w-5 mr-2 text-blue-600" />
                        Horários de Atendimento
                      </h3>
                      <div className="space-y-2">
                        {professional.horarios_atendimento.map((horario) =>
                          horario.bo_ativo ? (
                            <div key={horario.dia_semana} className="flex items-center justify-between text-sm">
                              <span className="font-medium text-gray-700">{getDayName(horario.dia_semana)}</span>
                              <span className="text-gray-600">
                                {horario.hr_inicio} - {horario.hr_fim}
                              </span>
                            </div>
                          ) : null
                        )}
                      </div>
                    </div>
                  )}

                  {/* Procedimentos Oferecidos */}
                  {professional.procedimentos && professional.procedimentos.length > 0 && (
                    <div className="rounded-2xl border border-blue-100 bg-white p-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">Procedimentos Oferecidos</h3>
                      <div className="space-y-4">
                        {professional.procedimentos.map((proc) => (
                          <div key={proc.id_procedimento} className="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
                            <div className="font-semibold text-gray-900 mb-1">{proc.nm_procedimento}</div>
                            <div className="text-xs text-gray-600 mb-2">{proc.ds_categoria}</div>
                            {proc.vl_preco_min && proc.vl_preco_max && (
                              <div className="text-sm font-medium text-blue-600">
                                R$ {proc.vl_preco_min.toFixed(2)} - R$ {proc.vl_preco_max.toFixed(2)}
                              </div>
                            )}
                            {proc.nr_duracao_minutos && (
                              <div className="text-xs text-gray-500 mt-1">
                                Duração: {proc.nr_duracao_minutos} minutos
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div
                    id="agenda-card"
                    className="rounded-2xl border border-blue-100 bg-white p-6 shadow-lg shadow-pink-100/40"
                  >
                    <div className="flex items-center justify-between">
                      <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900">
                        <Calendar className="h-5 w-5 text-blue-500" />
                        Horários Disponíveis
                      </h2>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          hasAvailability ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {hasAvailability ? "Atualizado" : "Sem vagas"}
                      </span>
                    </div>
                    <div className="mt-4 space-y-3">
                      {hasAvailability ? (
                        upcomingAgendaEntries.map(([date, horarios], index) => {
                          const disponiveisNoDia = horarios.filter((h) => h.disponivel);
                          if (disponiveisNoDia.length === 0) {
                            return null;
                          }
                          const dataObj = new Date(`${date}T00:00:00`);
                          const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "long" }).format(dataObj);
                          const weekdayLabel = weekday.charAt(0).toUpperCase() + weekday.slice(1);
                          const dayLabel = new Intl.DateTimeFormat("pt-BR", {
                            day: "2-digit",
                            month: "short",
                          })
                            .format(dataObj)
                            .replace(".", "");

                          const isExpanded = expandedDays.has(date);
                          const horariosToShow = isExpanded ? disponiveisNoDia : disponiveisNoDia.slice(0, 3);

                          return (
                            <div key={date} className="rounded-xl border border-blue-100 bg-white overflow-hidden transition-all">
                              <button
                                onClick={() => toggleDayExpansion(date)}
                                className="w-full flex items-center justify-between p-4 hover:bg-blue-50/50 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="flex flex-col items-start">
                                    <div className="font-semibold text-gray-900 capitalize text-sm">{weekdayLabel}</div>
                                    <span className="text-xs text-gray-500">{dayLabel}</span>
                                  </div>
                                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                                    {disponiveisNoDia.length} {disponiveisNoDia.length === 1 ? 'horário' : 'horários'}
                                  </span>
                                </div>
                                <ChevronDown
                                  className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
                                    isExpanded ? 'rotate-180' : ''
                                  }`}
                                />
                              </button>

                              {isExpanded && (
                                <div className="px-4 pb-4 pt-2 bg-blue-50/30">
                                  <div className="flex flex-wrap gap-2">
                                    {horariosToShow.map((horario) => {
                                      const horarioObj = new Date(horario.dt_horario);
                                      const hora = horarioObj.toLocaleTimeString("pt-BR", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        hour12: false,
                                      });
                                      const isSelected = selectedSlotId === horario.dt_horario;

                                      return (
                                        <button
                                          key={horario.dt_horario}
                                          onClick={() => handleSelectHorario(horario)}
                                          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                                            isSelected
                                              ? "border-blue-500 bg-white text-blue-600 shadow-md scale-105"
                                              : "border-blue-200 bg-white text-gray-700 hover:border-blue-400 hover:bg-blue-50 hover:scale-105"
                                          }`}
                                        >
                                          <Clock className="h-4 w-4 text-blue-500" />
                                          {hora}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="py-10 text-center">
                          <Calendar className="mx-auto h-12 w-12 text-gray-300" />
                          <p className="mt-3 text-sm text-gray-600">
                            Nenhum horário disponível no momento.
                          </p>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleAgendarConsulta}
                      disabled={!hasAvailability || !selectedSlotId}
                      className={`mt-6 w-full rounded-lg px-6 py-3 text-sm font-semibold transition-all ${
                        hasAvailability && selectedSlotId
                          ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg hover:shadow-xl"
                          : "cursor-not-allowed bg-gray-200 text-gray-500"
                      }`}
                    >
                      {hasAvailability ? "Confirmar agendamento" : "Sem horários disponíveis"}
                    </button>
                  </div>

                  <div className="rounded-2xl border border-blue-100 bg-white p-6">
                    <h2 className="text-lg font-semibold text-gray-900">Contato & Localização</h2>
                    <div className="mt-4 space-y-4 text-sm text-gray-700">
                      {clinicName && (
                        <div className="flex items-start gap-3">
                          <Building2 className="mt-0.5 h-5 w-5 text-blue-500" />
                          <span>{clinicName}</span>
                        </div>
                      )}

                      {addressLine && (
                        <div className="flex items-start gap-3">
                          <MapPin className="mt-0.5 h-5 w-5 text-blue-500" />
                          <span>
                            {addressLine}
                            {cityStateLine && (
                              <>
                                <br />
                                {cityStateLine}
                              </>
                            )}
                          </span>
                        </div>
                      )}

                      {!addressLine && cityStateLine && (
                        <div className="flex items-start gap-3">
                          <MapPin className="mt-0.5 h-5 w-5 text-blue-500" />
                          <span>{cityStateLine}</span>
                        </div>
                      )}

                      {professional.ds_telefone && (
                        <div className="flex items-center gap-3">
                          <Phone className="h-5 w-5 text-blue-500" />
                          <a href={`tel:${professional.ds_telefone}`} className="hover:text-blue-600">
                            {professional.ds_telefone}
                          </a>
                        </div>
                      )}

                      {professional.ds_email && (
                        <div className="flex items-center gap-3">
                          <Mail className="h-5 w-5 text-blue-500" />
                          <a
                            href={`mailto:${professional.ds_email}`}
                            className="break-all hover:text-blue-600"
                          >
                            {professional.ds_email}
                          </a>
                        </div>
                      )}

                      {professional.ds_site && (
                        <div className="flex items-center gap-3">
                          <Globe className="h-5 w-5 text-blue-500" />
                          <a
                            href={professional.ds_site}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-blue-600"
                          >
                            {professional.ds_site.replace(/^https?:\/\//, "")}
                          </a>
                        </div>
                      )}

                      {professional.ds_instagram && (
                        <div className="flex items-center gap-3">
                          <Instagram className="h-5 w-5 text-blue-500" />
                          <a
                            href={`https://instagram.com/${professional.ds_instagram.replace("@", "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-blue-600"
                          >
                            {professional.ds_instagram.startsWith("@")
                              ? professional.ds_instagram
                              : `@${professional.ds_instagram}`}
                          </a>
                        </div>
                      )}

                      {!hasContactInfo && (
                        <p className="text-sm text-gray-500">Informações de contato não disponíveis.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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
            setPendingReviewProfessionalId(null);
          }
        }}
        onSuccess={() => {
          setAuthModalOpen(false);
          setPendingReviewProfessionalId(null);
          setShowReviewForm(true);
        }}
      />
    </>
  );
}
