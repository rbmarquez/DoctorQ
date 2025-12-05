"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, MapPin, Sparkles, ArrowRight, Navigation2, TrendingUp, Lightbulb, Clock, Globe, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AuthAccessModal } from "@/components/auth/AuthAccessModal";
import type { PopularSearch } from "@/types/popular-searches";
import { DEFAULT_POPULAR_SEARCHES } from "@/constants/popular-searches";
import { IMAGES } from "@/constants/images";

const MAX_LOCATION_HISTORY_ITEMS = 5;

interface LocationSuggestion {
  label: string;
  value: string;
  meta: string;
  keywords: string[];
  badge?: string;
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

const TRENDING_NEIGHBORHOODS = [
  "Moema • SP",
  "Savassi • BH",
  "Batel • Curitiba",
  "Boa Viagem • Recife",
  "Vila Olímpia • SP",
  "Barra • RJ",
];

interface QuickLocationIdea {
  label: string;
  value: string;
  hint: string;
}

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

export function ModernHeroSection() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");
  const [locationHistory, setLocationHistory] = useState<string[]>([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [popularSearches, setPopularSearches] = useState<PopularSearch[]>(DEFAULT_POPULAR_SEARCHES);
  const [geoStatus, setGeoStatus] = useState<{
    state: "idle" | "loading" | "success" | "error";
    message?: string;
  }>({ state: "idle" });
  const [isClient, setIsClient] = useState(false);

  // Estados para os novos dialogs
  const [showSearchChoiceDialog, setShowSearchChoiceDialog] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  const suggestionContainerRef = useRef<HTMLDivElement | null>(null);
  const blurTimeoutRef = useRef<number | undefined>(undefined);
  const locationInputRef = useRef<HTMLInputElement | null>(null);

  // Marca quando está no cliente (evita hydration mismatch)
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem("doctorq-location-history");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setLocationHistory(parsed.slice(0, MAX_LOCATION_HISTORY_ITEMS));
        }
      }
    } catch (error) {
      console.warn("Erro ao recuperar histórico:", error);
    }
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
    return () => {
      if (blurTimeoutRef.current) {
        window.clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  const filteredLocations = useMemo(() => {
    if (!location) {
      return PRIMARY_LOCATION_SUGGESTIONS.slice(0, 3);
    }

    const normalized = normalizeText(location);

    if (normalized.length < 2) {
      return PRIMARY_LOCATION_SUGGESTIONS.slice(0, 3);
    }

    return PRIMARY_LOCATION_SUGGESTIONS.filter((suggestion) => {
      const normalizedLabel = normalizeText(suggestion.label);
      const matchesLabel = normalizedLabel.includes(normalized);
      const matchesKeywords = suggestion.keywords.some((keyword) =>
        normalizeText(keyword).includes(normalized)
      );
      return matchesLabel || matchesKeywords;
    }).slice(0, 3);
  }, [location]);

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
          window.localStorage.setItem("doctorq-location-history", JSON.stringify(next));
        } catch (error) {
          console.warn("Erro ao salvar histórico:", error);
        }
      }

      return next;
    });
  };

  const formatCep = (value: string) => {
    const digitsOnly = value.replace(/\D/g, "");
    if (digitsOnly.length <= 5) {
      return digitsOnly;
    }
    return `${digitsOnly.slice(0, 5)}-${digitsOnly.slice(5, 8)}`;
  };

  const clearBlurTimeout = () => {
    if (blurTimeoutRef.current) {
      window.clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = undefined;
    }
  };

  const handleLocationChange = (value: string) => {
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

  const handleSelectLocation = (value: string) => {
    setLocation(value);
    registerLocation(value);
    setShowLocationSuggestions(false);
    clearBlurTimeout();
    locationInputRef.current?.blur();
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus({ state: "error", message: "Seu navegador não suporta geolocalização." });
      return;
    }

    setGeoStatus({ state: "loading", message: "Obtendo localização..." });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = `${position.coords.latitude.toFixed(3)}, ${position.coords.longitude.toFixed(3)}`;
        const value = `Perto de mim @${coords}`;
        setLocation(value);
        registerLocation(value);
        setGeoStatus({ state: "success", message: "Localização obtida!" });
        setShowLocationSuggestions(false);

        setTimeout(() => {
          setGeoStatus({ state: "idle" });
        }, 2000);
      },
      (error) => {
        let message = "Não foi possível obter sua localização.";
        if (error.code === error.PERMISSION_DENIED) {
          message = "Permissão negada. Ative a localização nas configurações.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          message = "Localização indisponível no momento.";
        } else if (error.code === error.TIMEOUT) {
          message = "Tempo esgotado. Tente novamente.";
        }
        setGeoStatus({ state: "error", message });

        setTimeout(() => {
          setGeoStatus({ state: "idle" });
        }, 3000);
      }
    );
  };

  const handleSearch = () => {
    // Verificar se os campos estão vazios
    const hasSearchQuery = searchQuery.trim().length > 0;
    const hasLocation = location.trim().length > 0;

    // Se nenhum campo foi preenchido, mostrar dialog de escolha
    if (!hasSearchQuery && !hasLocation) {
      setShowSearchChoiceDialog(true);
      return;
    }

    // Se pelo menos um campo foi preenchido, ir para busca normal
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (location) params.set("local", location);

    if (location.trim()) {
      registerLocation(location);
    }

    router.push(`/busca?${params.toString()}`);
  };

  // Função para ir para Busca (normal)
  const handleGoToBusca = () => {
    setShowSearchChoiceDialog(false);
    router.push("/busca");
  };

  // Função para ir para Busca Inteligente (verifica autenticação)
  const handleGoToBuscaInteligente = () => {
    setShowSearchChoiceDialog(false);

    // Verificar se está logado
    if (status === "authenticated" && session) {
      // Está logado, redirecionar para busca inteligente
      router.push("/paciente/busca-inteligente");
    } else {
      // Não está logado, mostrar modal de autenticação inline
      setShowAuthDialog(true);
    }
  };

  // Função chamada após autenticação bem-sucedida
  const handleAuthSuccess = () => {
    setShowAuthDialog(false);
    // Redirecionar para busca inteligente
    router.push("/paciente/busca-inteligente");
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background com gradiente animado */}
      <div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-purple-50 to-indigo-50">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(251,207,232,0.4),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(233,213,255,0.4),transparent_50%)]" />
      </div>

      {/* Partículas flutuantes (só no cliente para evitar hydration mismatch) */}
      {isClient && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-rose-400/30 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${10 + Math.random() * 15}s`,
              }}
            />
          ))}
        </div>
      )}

      <div className="container relative z-10 px-4 py-20">
        <div className="max-w-6xl mx-auto">
          {/* Grid layout moderno */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Conteúdo */}
            <div className="space-y-8">
              {/* Badge minimalista */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/60 backdrop-blur-md rounded-full border border-rose-200/50 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                <span className="text-xs font-medium text-gray-700">
                  Mais de 10 mil profissionais
                </span>
              </div>

              {/* Título impactante */}
              <div className="space-y-4">
                <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                  <span className="block text-gray-900">Sua beleza,</span>
                  <span className="block bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    nossa missão
                  </span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
                  Conecte-se com os melhores profissionais de saúde.
                  Encontre, agende e transforme-se.
                </p>
              </div>

              {/* Quick stats */}
              <div className="flex items-center gap-8 text-sm">
                <div>
                  <div className="text-2xl font-bold text-gray-900">1.000+</div>
                  <div className="text-gray-600">Clínicas</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">50K+</div>
                  <div className="text-gray-600">Pacientes</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">98%</div>
                  <div className="text-gray-600">Satisfação</div>
                </div>
              </div>
            </div>

            {/* Right: Busca moderna como card flutuante */}
            <div className="relative">
              {/* Card de busca com glassmorphism */}
              <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-purple-500/10 p-8 border border-white/20">
                <div className="space-y-6">
                  {/* Título do card */}
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      Encontre seu profissional
                    </h2>
                    <p className="text-sm text-gray-600">
                      Busque por procedimentos ou localização
                    </p>
                  </div>

                  {/* Campos de busca modernos */}
                  <div className="space-y-3">
                    {/* Busca principal */}
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <Input
                        type="text"
                        placeholder="Ex: Botox, Harmonização facial..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        className="pl-12 h-14 text-base border-gray-200 focus:border-rose-500 focus:ring-rose-500 rounded-xl"
                      />
                    </div>

                    {/* Localização */}
                    <div className="relative" ref={suggestionContainerRef}>
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
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
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        autoComplete="off"
                        className="pl-12 h-14 text-base border-gray-200 focus:border-rose-500 focus:ring-rose-500 rounded-xl"
                      />

                      {/* Sugestões completas com geolocalização e trending */}
                      {showLocationSuggestions && (
                        <div className="absolute left-0 right-0 mt-2 z-50">
                          <div className="bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden max-h-[28rem] overflow-y-auto">
                            {/* CEP Suggestion (quando detectar 8 dígitos) */}
                            {location.replace(/\D/g, "").length === 8 && (
                              <div className="border-b border-gray-100">
                                <button
                                  type="button"
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => handleSelectLocation(location)}
                                  className="w-full px-4 py-3 text-left hover:bg-rose-50 transition-colors flex items-center gap-3"
                                >
                                  <MapPin className="w-4 h-4 text-rose-600 flex-shrink-0" />
                                  <div className="flex-1">
                                    <div className="font-semibold text-gray-900 text-sm">
                                      Buscar por CEP: {location}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      Encontre profissionais perto deste CEP
                                    </div>
                                  </div>
                                </button>
                              </div>
                            )}

                            {/* Geolocation Button */}
                            <div className="border-b border-gray-100">
                              <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={handleUseCurrentLocation}
                                disabled={geoStatus.state === "loading"}
                                className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors flex items-center gap-3 disabled:opacity-50"
                              >
                                <Navigation2 className={`w-4 h-4 flex-shrink-0 ${
                                  geoStatus.state === "loading" ? "animate-pulse text-blue-600" :
                                  geoStatus.state === "success" ? "text-green-600" :
                                  geoStatus.state === "error" ? "text-red-600" :
                                  "text-blue-600"
                                }`} />
                                <div className="flex-1">
                                  <div className="font-semibold text-gray-900 text-sm">
                                    {geoStatus.state === "loading" ? "Obtendo localização..." :
                                     geoStatus.state === "success" ? "Localização obtida!" :
                                     geoStatus.state === "error" ? "Erro ao obter localização" :
                                     "Usar minha localização atual"}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {geoStatus.message || "Profissionais mais próximos de você"}
                                  </div>
                                </div>
                              </button>
                            </div>

                            {/* Quick Actions */}
                            <div className="border-b border-gray-100 p-3 bg-gray-50">
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => handleSelectLocation("Sem preferência")}
                                  className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                                >
                                  <Globe className="w-3 h-3 inline mr-1" />
                                  Sem preferência
                                </button>
                                <button
                                  type="button"
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => handleSelectLocation("Atendimento online")}
                                  className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                                >
                                  Atendimento online
                                </button>
                              </div>
                            </div>

                            {/* Filtered City Suggestions */}
                            {filteredLocations.length > 0 && (
                              <div className="border-b border-gray-100">
                                <div className="px-4 py-2 bg-gray-50">
                                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Cidades principais
                                  </div>
                                </div>
                                {filteredLocations.map((suggestion) => (
                                  <button
                                    key={suggestion.value}
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => handleSelectLocation(suggestion.value)}
                                    className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b last:border-b-0 border-gray-100"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <div className="font-medium text-gray-900 text-sm">
                                          {suggestion.label}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-0.5">
                                          {suggestion.meta}
                                        </div>
                                      </div>
                                      {suggestion.badge && (
                                        <span className="text-[10px] px-2 py-1 bg-rose-100 text-rose-700 rounded-full font-semibold">
                                          {suggestion.badge}
                                        </span>
                                      )}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Trending Neighborhoods (só mostra quando não está digitando) */}
                            {!location && (
                              <div className="border-b border-gray-100">
                                <div className="px-4 py-2 bg-gray-50 flex items-center gap-2">
                                  <TrendingUp className="w-3 h-3 text-rose-600" />
                                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Bairros em alta
                                  </div>
                                </div>
                                <div className="p-3 flex flex-wrap gap-2">
                                  {TRENDING_NEIGHBORHOODS.map((neighborhood) => (
                                    <button
                                      key={neighborhood}
                                      type="button"
                                      onMouseDown={(e) => e.preventDefault()}
                                      onClick={() => handleSelectLocation(neighborhood.replace(" • ", ", "))}
                                      className="px-3 py-1.5 bg-gray-100 hover:bg-rose-100 text-xs font-medium text-gray-700 hover:text-rose-700 rounded-full transition-colors"
                                    >
                                      {neighborhood}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Quick Location Ideas (só mostra quando não está digitando) */}
                            {!location && (
                              <div className="border-b border-gray-100">
                                <div className="px-4 py-2 bg-gray-50 flex items-center gap-2">
                                  <Lightbulb className="w-3 h-3 text-amber-600" />
                                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Sugestões rápidas
                                  </div>
                                </div>
                                {QUICK_LOCATION_IDEAS.map((idea) => (
                                  <button
                                    key={idea.value}
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => handleSelectLocation(idea.value)}
                                    className="w-full px-4 py-3 text-left hover:bg-amber-50 transition-colors border-b last:border-b-0 border-gray-100"
                                  >
                                    <div className="font-medium text-gray-900 text-sm">
                                      {idea.label}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-0.5">
                                      {idea.hint}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Location History (só mostra se tiver histórico) */}
                            {locationHistory.length > 0 && !location && (
                              <div>
                                <div className="px-4 py-2 bg-gray-50 flex items-center gap-2">
                                  <Clock className="w-3 h-3 text-gray-600" />
                                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Buscas recentes
                                  </div>
                                </div>
                                {locationHistory.map((item, index) => (
                                  <button
                                    key={index}
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => handleSelectLocation(item)}
                                    className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b last:border-b-0 border-gray-100 flex items-center gap-3"
                                  >
                                    <Clock className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                    <span className="text-sm text-gray-700">{item}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Botão de busca destaque */}
                    <Button
                      onClick={handleSearch}
                      className="w-full h-14 text-base bg-gradient-to-r from-rose-500 via-purple-600 to-indigo-600 hover:from-rose-600 hover:via-purple-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all"
                    >
                      <Search className="mr-2 h-5 w-5" />
                      Buscar Profissionais
                    </Button>
                  </div>

                  {/* Principais buscas minimalistas */}
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-2.5 text-center">Popular:</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {popularSearches.slice(0, 4).map((item) => (
                        <button
                          key={item.id || item.term}
                          onClick={() => {
                            setSearchQuery(item.term);
                          }}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-xs font-medium text-gray-700 rounded-full transition-colors"
                        >
                          {item.term}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Elementos decorativos */}
              <div className="absolute -top-6 -right-6 w-32 h-32 bg-gradient-to-br from-rose-400 to-purple-500 rounded-full blur-3xl opacity-20 animate-pulse" />
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full blur-3xl opacity-20 animate-pulse" style={{ animationDelay: "1s" }} />
            </div>
          </div>

          {/* CTA secundário centralizado */}
          <div className="mt-16 flex items-center justify-center">
            <Button
              variant="outline"
              size="lg"
              className="border-2 border-gray-300 hover:border-rose-400 hover:bg-rose-50 text-gray-700 rounded-full px-8"
              asChild
            >
              <Link href="/registro">
                Criar Conta Grátis
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Indicador de scroll */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-gray-300 rounded-full flex justify-center pt-2">
          <div className="w-1 h-2 bg-gray-400 rounded-full" />
        </div>
      </div>

      {/* Dialog de Escolha: Busca Normal vs Busca Inteligente */}
      <Dialog open={showSearchChoiceDialog} onOpenChange={setShowSearchChoiceDialog}>
        <DialogContent className="max-w-xl sm:max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-xl">Campo de busca vazio</DialogTitle>
                <DialogDescription className="text-sm">
                  Você não informou o procedimento ou localização
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3 pt-4">
            <p className="text-sm text-gray-600 mb-4">
              Escolha como deseja continuar sua busca:
            </p>

            {/* Opção: Ir para Busca Normal */}
            <Button
              onClick={handleGoToBusca}
              variant="outline"
              className="w-full h-auto py-4 px-4 sm:px-5 border-2 hover:border-purple-400 hover:bg-purple-50 transition-all group"
            >
              <div className="flex items-start gap-3 sm:gap-4 text-left w-full">
                <div className="h-10 w-10 rounded-lg bg-purple-100 group-hover:bg-purple-200 flex items-center justify-center flex-shrink-0 transition-colors">
                  <Search className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 mb-1">Ir para Busca</div>
                  <div className="text-xs text-gray-600">
                    Navegue pela lista completa de profissionais e use filtros manuais
                  </div>
                </div>
              </div>
            </Button>

            {/* Opção: Ir para Busca Inteligente com IA */}
            <Button
              onClick={handleGoToBuscaInteligente}
              className="w-full h-auto py-4 px-4 sm:px-5 bg-gradient-to-r from-rose-500 via-purple-600 to-indigo-600 hover:from-rose-600 hover:via-purple-700 hover:to-indigo-700 transition-all"
            >
              <div className="flex items-start gap-3 sm:gap-4 text-left w-full">
                <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white mb-1 flex items-center gap-2 flex-wrap">
                    Ir para Busca Inteligente
                    <span className="text-[10px] px-2 py-0.5 bg-white/20 rounded-full">IA</span>
                  </div>
                  <div className="text-xs text-white/90">
                    A IA Gisele irá entender suas necessidades e encontrar os profissionais ideais
                  </div>
                </div>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Autenticação Inline (AuthAccessModal) */}
      <AuthAccessModal
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        initialMode="login"
        onSuccess={handleAuthSuccess}
      />
    </section>
  );
}
