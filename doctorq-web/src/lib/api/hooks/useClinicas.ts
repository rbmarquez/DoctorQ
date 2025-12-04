import useSWR, { mutate } from "swr";
import { apiClient, endpoints } from "../index";

// ============================================================================
// TYPES
// ============================================================================

export interface Clinica {
  id_clinica: string;
  id_empresa: string;
  nm_clinica: string;
  ds_descricao?: string;
  ds_endereco?: string;
  ds_cidade?: string;
  ds_estado?: string;
  ds_cep?: string;
  ds_telefone?: string;
  ds_email?: string;
  ds_site?: string;
  ds_foto_principal?: string;
  ds_fotos_galeria?: string[];
  nr_latitude?: number;
  nr_longitude?: number;
  ds_horario_funcionamento?: Record<string, string>;
  ds_especialidades?: string[];
  ds_convenios?: string[];
  vl_avaliacao_media?: number;
  nr_total_avaliacoes?: number;
  st_ativa: boolean;
  st_aceita_agendamento_online: boolean;
  ds_redes_sociais?: Record<string, string>;
  dt_criacao: string;
  // Dados relacionados
  nm_empresa?: string;
  total_profissionais?: number;
}

export interface ClinicasResponse {
  items: Clinica[];
  meta: {
    totalItems: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}

export interface ClinicasFiltros {
  id_empresa?: string;
  ds_cidade?: string;
  ds_estado?: string;
  ds_especialidade?: string;
  st_ativa?: boolean;
  busca?: string;
  page?: number;
  size?: number;
}

export interface CriarClinicaData {
  id_empresa: string;
  nm_clinica: string;
  ds_descricao?: string;
  ds_endereco?: string;
  ds_cidade?: string;
  ds_estado?: string;
  ds_cep?: string;
  ds_telefone?: string;
  ds_email?: string;
  ds_site?: string;
  ds_foto_principal?: string;
  ds_fotos_galeria?: string[];
  nr_latitude?: number;
  nr_longitude?: number;
  ds_horario_funcionamento?: Record<string, string>;
  ds_especialidades?: string[];
  ds_convenios?: string[];
  st_aceita_agendamento_online?: boolean;
  ds_redes_sociais?: Record<string, string>;
}

export interface AtualizarClinicaData {
  nm_clinica?: string;
  ds_descricao?: string;
  ds_endereco?: string;
  ds_cidade?: string;
  ds_estado?: string;
  ds_cep?: string;
  ds_telefone?: string;
  ds_email?: string;
  ds_site?: string;
  ds_foto_principal?: string;
  ds_fotos_galeria?: string[];
  nr_latitude?: number;
  nr_longitude?: number;
  ds_horario_funcionamento?: Record<string, string>;
  ds_especialidades?: string[];
  ds_convenios?: string[];
  st_ativa?: boolean;
  st_aceita_agendamento_online?: boolean;
  ds_redes_sociais?: Record<string, string>;
}

export interface ProfissionalClinica {
  id_profissional: string;
  nm_profissional: string;
  ds_especialidades?: string;
  ds_foto_perfil?: string;
  vl_avaliacao_media?: number;
  nr_total_avaliacoes?: number;
  st_ativo: boolean;
  st_aceita_novos_pacientes: boolean;
}

export interface ProfissionaisClinicaResponse {
  items: ProfissionalClinica[];
  meta: {
    totalItems: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}

// ============================================================================
// HOOKS
// ============================================================================

export function useClinicas(filtros: ClinicasFiltros = {}) {
  const { page = 1, size = 20, ...params } = filtros;

  const { data, error, isLoading } = useSWR<ClinicasResponse>(
    [endpoints.clinicas.list, page, size, JSON.stringify(params)],
    () =>
      apiClient.get(endpoints.clinicas.list, {
        params: { page, size, ...params },
      }),
    {
      revalidateOnFocus: false,
      dedupingInterval: 2000,
    }
  );

  return {
    clinicas: data?.items || [],
    meta: data?.meta,
    isLoading,
    isError: !!error,
    error,
  };
}

export function useClinica(clinicaId: string | null) {
  const { data, error, isLoading } = useSWR<Clinica>(
    clinicaId ? endpoints.clinicas.get(clinicaId) : null,
    () => (clinicaId ? apiClient.get(endpoints.clinicas.get(clinicaId)) : null),
    {
      revalidateOnFocus: false,
      dedupingInterval: 2000,
    }
  );

  return {
    clinica: data || null,
    isLoading,
    isError: !!error,
    error,
  };
}

export function useProfissionaisClinica(
  clinicaId: string | null,
  page: number = 1,
  size: number = 20
) {
  const { data, error, isLoading } = useSWR<ProfissionaisClinicaResponse>(
    clinicaId ? [endpoints.clinicas.profissionais(clinicaId), page, size] : null,
    () =>
      clinicaId
        ? apiClient.get(endpoints.clinicas.profissionais(clinicaId), {
            params: { page, size },
          })
        : null,
    {
      revalidateOnFocus: false,
      dedupingInterval: 2000,
    }
  );

  return {
    profissionais: data?.items || [],
    meta: data?.meta,
    isLoading,
    isError: !!error,
    error,
  };
}

// ============================================================================
// MUTATIONS
// ============================================================================

export async function criarClinica(data: CriarClinicaData): Promise<Clinica> {
  return apiClient.post(endpoints.clinicas.create, data);
}

export async function atualizarClinica(
  clinicaId: string,
  data: AtualizarClinicaData
): Promise<Clinica> {
  return apiClient.put(endpoints.clinicas.update(clinicaId), data);
}

export async function deletarClinica(clinicaId: string): Promise<void> {
  return apiClient.delete(endpoints.clinicas.delete(clinicaId));
}

// ============================================================================
// REVALIDATION
// ============================================================================

export function revalidarClinicas() {
  mutate((key) => Array.isArray(key) && key[0] === endpoints.clinicas.list);
}

export function revalidarClinica(clinicaId: string) {
  mutate(endpoints.clinicas.get(clinicaId));
  revalidarClinicas();
}

export function revalidarProfissionaisClinica(clinicaId: string) {
  mutate((key) => Array.isArray(key) && key[0] === endpoints.clinicas.profissionais(clinicaId));
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function formatarHorario(horario?: Record<string, string>): string {
  if (!horario) return "Horário não informado";

  const dias = ["seg", "ter", "qua", "qui", "sex", "sab", "dom"];
  const diaLabels: Record<string, string> = {
    seg: "Segunda",
    ter: "Terça",
    qua: "Quarta",
    qui: "Quinta",
    sex: "Sexta",
    sab: "Sábado",
    dom: "Domingo",
  };

  return dias
    .map((dia) => {
      const horarioDia = horario[dia];
      if (!horarioDia || horarioDia.toLowerCase() === "fechado") {
        return `${diaLabels[dia]}: Fechado`;
      }
      return `${diaLabels[dia]}: ${horarioDia}`;
    })
    .join("\n");
}

export function isClinicaAberta(
  clinica: Clinica,
  dataHora: Date = new Date()
): boolean {
  if (!clinica.st_ativa || !clinica.ds_horario_funcionamento) return false;

  const dias = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];
  const diaAtual = dias[dataHora.getDay()];
  const horarioDia = clinica.ds_horario_funcionamento[diaAtual];

  if (!horarioDia || horarioDia.toLowerCase() === "fechado") return false;

  // Parse horário (ex: "08:00-18:00")
  const [abertura, fechamento] = horarioDia.split("-");
  if (!abertura || !fechamento) return false;

  const [horaAbertura, minAbertura] = abertura.split(":").map(Number);
  const [horaFechamento, minFechamento] = fechamento.split(":").map(Number);

  const horaAtual = dataHora.getHours();
  const minAtual = dataHora.getMinutes();

  const minutoAtual = horaAtual * 60 + minAtual;
  const minutoAbertura = horaAbertura * 60 + minAbertura;
  const minutoFechamento = horaFechamento * 60 + minFechamento;

  return minutoAtual >= minutoAbertura && minutoAtual < minutoFechamento;
}

export function getDistancia(
  lat1?: number,
  lon1?: number,
  lat2?: number,
  lon2?: number
): number | null {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;

  const R = 6371; // Raio da Terra em km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distancia = R * c;

  return Math.round(distancia * 10) / 10; // Arredondar para 1 casa decimal
}

export function formatarDistancia(distanciaKm?: number | null): string {
  if (!distanciaKm) return "";
  if (distanciaKm < 1) return `${Math.round(distanciaKm * 1000)}m`;
  return `${distanciaKm.toFixed(1)}km`;
}

export function hasConvenio(clinica: Clinica, convenio: string): boolean {
  if (!clinica.ds_convenios || clinica.ds_convenios.length === 0) return false;
  return clinica.ds_convenios.some(
    (c) => c.toLowerCase().includes(convenio.toLowerCase())
  );
}

export function getAvaliacaoColor(avaliacao?: number): string {
  if (!avaliacao) return "text-gray-400";
  if (avaliacao >= 4.5) return "text-green-600";
  if (avaliacao >= 3.5) return "text-yellow-600";
  return "text-red-600";
}

// ============================================================================
// HOOKS MULTI-CLÍNICA (PROFISSIONAIS)
// ============================================================================

/**
 * Interface para clínica vinculada ao profissional (multi-clínica)
 */
export interface ClinicaProfissionalVinculo {
  id_clinica: string;
  nm_clinica: string;
  ds_endereco?: string;
  ds_telefone?: string;
  ds_email?: string;
  ds_cor_hex?: string; // Cor personalizada para identificação
  st_ativo: boolean;
  dt_vinculo: string;
}

/**
 * Hook para buscar todas as clínicas ativas vinculadas a um profissional
 *
 * **Suporte Multi-Clínica**: Profissional pode trabalhar em múltiplas clínicas
 *
 * @param id_profissional - UUID do profissional
 * @returns SWR response com lista de clínicas vinculadas
 *
 * @example
 * ```tsx
 * const { clinicas, isLoading } = useClinicasProfissional(profissionalId);
 *
 * return (
 *   <Select>
 *     <option value="">Todas as Clínicas</option>
 *     {clinicas?.map(c => (
 *       <option key={c.id_clinica} value={c.id_clinica}>
 *         {c.nm_clinica}
 *       </option>
 *     ))}
 *   </Select>
 * );
 * ```
 */
export function useClinicasProfissional(id_profissional: string | null) {
  const { data, error, isLoading } = useSWR<ClinicaProfissionalVinculo[]>(
    id_profissional ? `/profissionais/${id_profissional}/clinicas/` : null,
    (url: string) => apiClient.get(url),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // 1 minuto - dados não mudam com frequência
    }
  );

  return {
    clinicas: data || [],
    isLoading,
    isError: !!error,
    error,
  };
}

/**
 * Hook para buscar uma clínica específica vinculada ao profissional
 *
 * @param id_profissional - UUID do profissional
 * @param id_clinica - UUID da clínica
 * @returns Clínica específica ou undefined
 */
export function useClinicaProfissional(
  id_profissional: string | null,
  id_clinica: string | null
) {
  const { clinicas, isLoading, isError, error } = useClinicasProfissional(id_profissional);

  const clinica = clinicas?.find((c) => c.id_clinica === id_clinica);

  return {
    clinica,
    isLoading,
    isError,
    error,
  };
}
