"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { MapPin, Star, Navigation, Plus, Minus, Maximize2, Minimize2 } from "lucide-react";
import { Coordinates, getCoordinatesForLocation, getMapBounds } from "@/utils/location";

const PigeonMap = dynamic(() => import("pigeon-maps").then((mod) => mod.Map), {
  ssr: false,
});

const PigeonMarker = dynamic(() => import("pigeon-maps").then((mod) => mod.Marker), {
  ssr: false,
});

type SearchResultType = "profissional";

type SearchResult = {
  id: string;
  tipo: SearchResultType;
  nome: string;
  descricao?: string;
  localizacao?: string;
  preco?: number;
  avaliacao?: number;
  coordinates: Coordinates;
  foto?: string;
};

type SearchResultsMapProps = {
  results: SearchResult[];
  loading: boolean;
  focusLocation?: string;
};

const provider = (x: number, y: number, z: number) => {
  const subdomain = ["a", "b", "c"][x % 3];
  // Wikimedia Maps - estilo similar ao Google Maps (usado pelo Doctoralia)
  return `https://maps.wikimedia.org/osm-intl/${z}/${x}/${y}.png`;
};

export function SearchResultsMap({ results, loading, focusLocation }: SearchResultsMapProps) {
  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);
  const [hoveredMarkerId, setHoveredMarkerId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(13);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    setActiveMarkerId(null);
  }, [results]);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 1, 18)); // Max zoom 18
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 1, 3)); // Min zoom 3
  };

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  const coordinates = useMemo(() => {
    return results.map((result) => ({
      result,
      coords: result.coordinates,
    }));
  }, [results]);

  const focusCoords = useMemo(() => {
    if (!focusLocation) return null;
    return getCoordinatesForLocation(focusLocation);
  }, [focusLocation]);

  const bounds = useMemo(() => {
    if (coordinates.length === 0) {
      if (focusCoords) {
        const pad = 0.05;
        return {
          min: { lat: focusCoords.lat - pad, lng: focusCoords.lng - pad },
          max: { lat: focusCoords.lat + pad, lng: focusCoords.lng + pad },
        };
      }
      return undefined;
    }
    const points = coordinates.map((item) => item.coords);
    const [min, max] = getMapBounds(points);
    return {
      min,
      max,
    };
  }, [coordinates, focusCoords]);

  const center = useMemo(() => {
    if (coordinates.length === 0) {
      if (focusCoords) {
        return [focusCoords.lat, focusCoords.lng] as [number, number];
      }
      return [-23.55052, -46.633308];
    }
    const { lat, lng } = coordinates[0].coords;
    return [lat, lng];
  }, [coordinates, focusCoords]);

  if (loading && results.length === 0 && !focusCoords) {
    return (
      <div className="flex h-full items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <Navigation className="h-12 w-12 text-blue-500 mx-auto mb-3 animate-pulse" />
          <p className="text-sm font-medium text-gray-600">Carregando mapa...</p>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-gradient-to-br from-purple-50/30 to-blue-50/30 text-center p-6">
        <div>
          <MapPin className="h-16 w-16 text-purple-400 mx-auto mb-4" />
          <h4 className="text-base font-bold text-gray-900 mb-2">Mapa da região</h4>
          <p className="text-sm text-gray-600 max-w-xs mx-auto">
            {focusCoords
              ? "Ainda estamos carregando resultados para esta localização."
              : "Ajuste os filtros ou a localização para visualizar profissionais próximos."}
          </p>
        </div>
      </div>
    );
  }

  const mapBounds = bounds
    ? ([
        [bounds.min.lat, bounds.min.lng],
        [bounds.max.lat, bounds.max.lng],
      ] as [[number, number], [number, number]])
    : undefined;

  return (
    <div className={`h-full w-full relative ${isFullscreen ? 'fixed inset-0 z-[9999] bg-white' : ''}`}>
      <PigeonMap
        defaultCenter={center as [number, number]}
        center={center as [number, number]}
        zoom={zoom}
        onBoundsChanged={({ zoom: newZoom }) => setZoom(newZoom)}
        bounds={mapBounds}
        animate
        mouseEvents
        touchEvents
        attribution={false}
        provider={provider}
        dprs={[1, 2]}
      >
        {coordinates.map(({ result, coords }) => {
          const isActive = activeMarkerId === result.id;
          const isHovered = hoveredMarkerId === result.id;

          return (
            <PigeonMarker
              key={result.id}
              anchor={[coords.lat, coords.lng]}
              width={isActive ? 320 : 50}
              onClick={() => setActiveMarkerId(isActive ? null : result.id)}
            >
              <div
                className="flex flex-col items-center"
                onMouseEnter={() => setHoveredMarkerId(result.id)}
                onMouseLeave={() => setHoveredMarkerId(null)}
              >
                {/* Marcador Estilizado */}
                <div className="relative">
                  {/* Sombra do marcador */}
                  <div className={`absolute inset-0 bg-blue-500/30 rounded-full blur-md transition-all duration-200 ${
                    isActive || isHovered ? 'scale-150' : 'scale-100'
                  }`} />

                  {/* Pin principal */}
                  <div className={`relative flex items-center justify-center transition-all duration-200 ${
                    isActive
                      ? 'w-12 h-12 -translate-y-6'
                      : isHovered
                      ? 'w-10 h-10 -translate-y-5'
                      : 'w-8 h-8 -translate-y-4'
                  }`}>
                    {/* Gradiente de fundo */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 rounded-full shadow-lg" />

                    {/* Borda branca */}
                    <div className="absolute inset-[2px] bg-white rounded-full" />

                    {/* Ícone */}
                    <MapPin className={`relative text-blue-500 ${
                      isActive ? 'h-6 w-6' : isHovered ? 'h-5 w-5' : 'h-4 w-4'
                    }`} />
                  </div>

                  {/* Ponta do pin */}
                  <div className="absolute left-1/2 -translate-x-1/2 top-full">
                    <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[10px] border-l-transparent border-r-transparent border-t-pink-500" />
                  </div>
                </div>

                {/* Card de Informações (quando ativo) */}
                {isActive && (
                  <div className="mt-2 w-[300px] bg-white rounded-xl shadow-2xl border-2 border-purple-100 overflow-hidden animate-in zoom-in duration-200">
                    {/* Cabeçalho com gradiente */}
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-3">
                      <h3 className="text-white font-bold text-sm line-clamp-1">{result.nome}</h3>
                      {result.localizacao && (
                        <p className="text-white/90 text-xs mt-1 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {result.localizacao}
                        </p>
                      )}
                    </div>

                    {/* Conteúdo */}
                    <div className="p-4 space-y-3">
                      {/* Avaliação e Preço */}
                      <div className="flex items-center justify-between">
                        {result.avaliacao && (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-semibold text-gray-900">
                              {result.avaliacao.toFixed(1)}
                            </span>
                          </div>
                        )}
                        {result.preco && (
                          <div className="bg-purple-50 px-3 py-1 rounded-full">
                            <span className="text-sm font-bold text-purple-700">
                              R$ {result.preco.toFixed(0)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Descrição */}
                      {result.descricao && (
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {result.descricao}
                        </p>
                      )}

                      {/* Botão de ação */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Ação de ver detalhes
                        }}
                        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-cyan-700 text-white text-xs font-semibold py-2 px-4 rounded-lg transition-all hover:shadow-lg"
                      >
                        Ver Detalhes
                      </button>
                    </div>
                  </div>
                )}

                {/* Label de hover (quando não está ativo) */}
                {!isActive && isHovered && (
                  <div className="mt-1 bg-gray-900/90 text-white px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap">
                    {result.nome}
                  </div>
                )}
              </div>
            </PigeonMarker>
          );
        })}
      </PigeonMap>

      {/* Controles de Zoom e Fullscreen - canto superior direito */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        {/* Botão Zoom In */}
        <button
          onClick={handleZoomIn}
          className="flex items-center justify-center w-10 h-10 bg-white hover:bg-gray-50 rounded-lg shadow-lg border border-gray-200 transition-all hover:shadow-xl hover:border-purple-300 group"
          title="Aumentar zoom"
        >
          <Plus className="h-5 w-5 text-gray-700 group-hover:text-purple-600" />
        </button>

        {/* Botão Zoom Out */}
        <button
          onClick={handleZoomOut}
          className="flex items-center justify-center w-10 h-10 bg-white hover:bg-gray-50 rounded-lg shadow-lg border border-gray-200 transition-all hover:shadow-xl hover:border-purple-300 group"
          title="Diminuir zoom"
        >
          <Minus className="h-5 w-5 text-gray-700 group-hover:text-purple-600" />
        </button>

        {/* Separador */}
        <div className="h-px bg-gray-200 mx-2" />

        {/* Botão Fullscreen */}
        <button
          onClick={toggleFullscreen}
          className="flex items-center justify-center w-10 h-10 bg-white hover:bg-gray-50 rounded-lg shadow-lg border border-gray-200 transition-all hover:shadow-xl hover:border-purple-300 group"
          title={isFullscreen ? "Sair do modo tela cheia" : "Expandir mapa"}
        >
          {isFullscreen ? (
            <Minimize2 className="h-5 w-5 text-gray-700 group-hover:text-purple-600" />
          ) : (
            <Maximize2 className="h-5 w-5 text-gray-700 group-hover:text-purple-600" />
          )}
        </button>
      </div>

      {/* Legenda */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg border border-purple-100">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full" />
          <span className="text-xs font-medium text-gray-700">
            {results.length} profissional{results.length !== 1 ? 'is' : ''} encontrado{results.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  );
}
