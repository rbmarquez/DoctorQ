import { useState, useEffect } from "react";
import type {
  Vaga,
  VagasFiltros,
} from "@/types/carreiras";

interface VagasResponse {
  vagas: Vaga[];
  meta: {
    totalItems: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}

interface UseVagasPublicReturn {
  vagas: Vaga[];
  meta?: VagasResponse["meta"];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook alternativo para buscar vagas públicas sem SWR
 * Usado especificamente para a página pública de carreiras
 */
export function useVagasPublic(filtros: VagasFiltros = {}): UseVagasPublicReturn {
  const [vagas, setVagas] = useState<Vaga[]>([]);
  const [meta, setMeta] = useState<VagasResponse["meta"] | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchVagas = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Construir query string
        const params = new URLSearchParams();
        if (filtros.nm_cargo) params.append("nm_cargo", filtros.nm_cargo);
        if (filtros.nm_area) params.append("nm_area", filtros.nm_area);
        if (filtros.nm_cidade) params.append("nm_cidade", filtros.nm_cidade);
        if (filtros.nm_estado) params.append("nm_estado", filtros.nm_estado);
        if (filtros.nm_nivel) params.append("nm_nivel", filtros.nm_nivel);
        if (filtros.nm_tipo_contrato) params.append("nm_tipo_contrato", filtros.nm_tipo_contrato);
        if (filtros.nm_regime_trabalho) params.append("nm_regime_trabalho", filtros.nm_regime_trabalho);
        if (filtros.vl_salario_min) params.append("vl_salario_min", filtros.vl_salario_min.toString());
        if (filtros.fg_aceita_remoto !== undefined) params.append("fg_aceita_remoto", String(filtros.fg_aceita_remoto));
        if (filtros.ds_status) params.append("ds_status", filtros.ds_status);
        if (filtros.habilidades && filtros.habilidades.length > 0) {
          params.append("habilidades", filtros.habilidades.join(","));
        }
        if (filtros.page) params.append("page", filtros.page.toString());
        if (filtros.size) params.append("size", filtros.size.toString());

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
        const url = `${apiUrl}/vagas/?${params.toString()}`;

        console.log("[useVagasPublic] Fetching:", url);

        const response = await fetch(url, {
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Erro ao buscar vagas: ${response.statusText}`);
        }

        const data = await response.json();

        console.log("[useVagasPublic] Data received:", data);

        // Mapear resposta
        const vagasMapeadas = (data.vagas || []).map((vaga: any) => ({
          ...vaga,
          vl_salario_min: vaga.vl_salario_min ? parseFloat(vaga.vl_salario_min) : undefined,
          vl_salario_max: vaga.vl_salario_max ? parseFloat(vaga.vl_salario_max) : undefined,
        }));

        setVagas(vagasMapeadas);
        setMeta({
          totalItems: data.total || 0,
          itemsPerPage: data.size || 9,
          totalPages: data.total_pages || 0,
          currentPage: data.page || 1,
        });
      } catch (err) {
        console.error("[useVagasPublic] Error:", err);
        setError(err instanceof Error ? err : new Error("Erro desconhecido"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchVagas();
  }, [
    filtros.nm_cargo,
    filtros.nm_area,
    filtros.nm_cidade,
    filtros.nm_estado,
    filtros.nm_nivel,
    filtros.nm_tipo_contrato,
    filtros.nm_regime_trabalho,
    filtros.fg_aceita_remoto,
    filtros.ds_status,
    filtros.page,
    filtros.size,
    filtros.vl_salario_min,
    filtros.habilidades,
  ]);

  return {
    vagas,
    meta,
    isLoading,
    error,
  };
}
