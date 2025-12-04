"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, MapPin, Sparkles, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { PopularSearch } from "@/types/popular-searches";
import { DEFAULT_POPULAR_SEARCHES } from "@/constants/popular-searches";

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

export function SearchHeroSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");
  const [locationHistory, setLocationHistory] = useState<string[]>([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [geoStatus, setGeoStatus] = useState<{ state: "idle" | "loading" | "success" | "error"; message?: string }>({
    state: "idle",
  });
  const [popularSearches, setPopularSearches] = useState<PopularSearch[]>(DEFAULT_POPULAR_SEARCHES);
  const [popularLoading, setPopularLoading] = useState(true);
  const [popularError, setPopularError] = useState<string | null>(null);
  const suggestionContainerRef = useRef<HTMLDivElement | null>(null);
  const blurTimeoutRef = useRef<number | undefined>(undefined);
  const locationInputRef = useRef<HTMLInputElement | null>(null);

  const appName = process.env.NEXT_PUBLIC_APP_NAME || "DoctorQ";
  const tagline = process.env.NEXT_PUBLIC_APP_TAGLINE || "Sua beleza, nosso cuidado";

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
      console.warn("Não foi possível recuperar histórico de localização:", error);
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
    const abortController = new AbortController();

    async function loadPopularSearches() {
      try {
        setPopularLoading(true);
        setPopularError(null);

        const query = new URLSearchParams({
          only_active: "true",
          limit: "6",
        }).toString();

        const response = await fetch(`/api/popular-searches?${query}`, {
          signal: abortController.signal,
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          throw new Error(
            (errorBody as any)?.error || "Erro ao carregar as principais buscas"
          );
        }

        const data = await response.json();
        const itemsCandidate: PopularSearch[] = Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data)
          ? data
          : [];

        const normalized = itemsCandidate
          .filter((item) => item && typeof item.term === "string")
          .filter((item) => item.isActive !== false)
          .sort((a, b) => {
            const orderA = typeof a.order === "number" ? a.order : Number.MAX_SAFE_INTEGER;
            const orderB = typeof b.order === "number" ? b.order : Number.MAX_SAFE_INTEGER;
            return orderA - orderB;
          });

        const deduped = Array.from(
          normalized.reduce((acc, item) => {
            const key = item.term.trim().toLowerCase();
            if (!acc.has(key)) {
              acc.set(key, {
                ...item,
                term: item.term.trim(),
              });
            }
            return acc;
          }, new Map<string, PopularSearch>())
        )
          .map(([, value]) => value)
          .slice(0, 6);

        if (!abortController.signal.aborted) {
          setPopularSearches(
            deduped.length > 0 ? deduped : DEFAULT_POPULAR_SEARCHES
          );
        }
      } catch (error) {
        if (abortController.signal.aborted) return;
        console.warn("Erro ao carregar as principais buscas:", error);
        setPopularSearches(DEFAULT_POPULAR_SEARCHES);
        setPopularError(null);
      } finally {
        if (!abortController.signal.aborted) {
          setPopularLoading(false);
        }
      }
    }

    loadPopularSearches();

    return () => {
      abortController.abort();
    };
  }, []);

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        window.clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

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
          console.warn("Não foi possível salvar histórico de localização:", error);
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

  const handleSelectLocation = (value: string) => {
    setGeoStatus({ state: "idle" });
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

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (location) params.set("local", location);

    if (location.trim()) {
      registerLocation(location);
    }

    window.location.href = `/busca?${params.toString()}`;
  };

  const digitsOnlyLocation = location.replace(/\D/g, "");
  const formattedCepCandidate = digitsOnlyLocation ? formatCep(digitsOnlyLocation) : "";
  const showCepSuggestion = digitsOnlyLocation.length === 8;
  const hasHistory = locationHistory.length > 0;
  const isTypingLocation = location.trim().length > 0;

  return (
    <section className="relative overflow-hidden bg-white py-16 md:py-20">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-6">
          {/* Título compacto */}
          <div className="space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Encontre o profissional ideal
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Busque por procedimentos, clínicas ou profissionais perto de você
            </p>
          </div>

          {/* Busca */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl shadow-pink-500/20 p-6 border border-blue-100">
              {/* Campos de busca */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.8fr_1.2fr]">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    type="text"
                    placeholder="Busque por procedimentos, profissionais ou clínicas..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="pl-12 h-14 text-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="relative" ref={suggestionContainerRef}>
                  <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
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
                    className="pl-12 h-14 text-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />

                  {showLocationSuggestions && (
                    <div className="absolute left-0 right-0 mt-3 z-50">
                      <div className="bg-white border border-blue-100 rounded-2xl shadow-2xl shadow-pink-500/10 overflow-hidden">
                        <div className="px-4 pt-4 pb-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">
                            Sugestões inteligentes
                          </p>
                        </div>

                        <div className="max-h-72 overflow-y-auto px-4 pb-4 space-y-3">
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
                              <p className="text-sm text-gray-500 mt-1">
                                Saltando etapas: mostramos apenas clínicas que atendem nesse CEP.
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
                                    <span className="text-base font-semibold text-gray-900">
                                      {suggestion.label}
                                    </span>
                                    {suggestion.badge && (
                                      <span className="text-[11px] uppercase tracking-wide text-blue-500 font-bold">
                                        {suggestion.badge}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-500 mt-1">
                                    {suggestion.meta}
                                  </p>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="rounded-xl border border-dashed border-blue-200 bg-blue-50/40 px-4 py-6 text-center text-sm text-gray-500">
                              Não encontramos essa localidade ainda. Tente buscar por um CEP ou escolha uma das regiões sugeridas abaixo.
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
                                <div className="grid gap-2 md:grid-cols-1">
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
                                      <p className="text-xs text-gray-500 mt-1">
                                        {idea.hint}
                                      </p>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="border-t border-blue-100 bg-blue-50/40 px-4 py-3 space-y-2">
                          <button
                            type="button"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={handleUseCurrentLocation}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-3 text-sm font-semibold text-white transition hover:from-blue-600 hover:to-cyan-700"
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
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
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
              </div>

              <Button
                onClick={handleSearch}
                className="w-full mt-4 h-14 text-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-cyan-700 text-white shadow-lg shadow-pink-500/50"
              >
                <Search className="mr-2 h-5 w-5" />
                Buscar
              </Button>
            </div>

            {/* Principais buscas */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-700 font-semibold mb-3">Principais buscas:</p>
              {popularError && (
                <p className="text-xs text-red-500 mb-2">
                  {popularError}
                </p>
              )}
              <div className="flex flex-wrap justify-center gap-2 min-h-[44px]">
                {popularLoading
                  ? Array.from({ length: 6 }).map((_, index) => (
                      <Skeleton
                        key={`popular-search-skeleton-${index}`}
                        className="h-10 w-32 rounded-full bg-blue-100/60"
                      />
                    ))
                  : popularSearches.map((item) => (
                      <button
                        key={item.id || item.term}
                        onClick={() => {
                          setSearchQuery(item.term);
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-sm text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105 cursor-pointer flex items-center gap-2"
                      >
                        <span>{item.term}</span>
                        {item.badge && (
                          <span className="text-[10px] uppercase tracking-wide bg-white/20 text-white px-2 py-0.5 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
