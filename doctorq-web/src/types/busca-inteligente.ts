// Tipos para o sistema de Busca Inteligente de Procedimentos

export type AreaCorpo = "facial" | "corporal" | "capilar" | "maos_pes" | "intima";
export type TipoObjetivo =
  | "rejuvenescimento"
  | "emagrecimento"
  | "hidratacao"
  | "acne"
  | "manchas"
  | "flacidez"
  | "celulite"
  | "estrias"
  | "cicatrizes"
  | "queda_cabelo"
  | "harmonizacao";

export type NivelInvasividade = "nao_invasivo" | "minimamente_invasivo" | "invasivo" | "cirurgico";

export interface ProcedimentoDetalhado {
  id_procedimento: string;
  nm_procedimento: string;
  ds_descricao: string;
  ds_descricao_curta: string;
  area_corpo: AreaCorpo[];
  objetivos: TipoObjetivo[];
  invasividade: NivelInvasividade;
  nr_duracao_media_minutos: number;
  nr_sessoes_recomendadas: number;
  vl_preco_minimo: number;
  vl_preco_maximo: number;
  vl_preco_medio: number;
  ds_foto_url?: string;
  nr_popularidade: number;
  nr_satisfacao_media: number;
  nr_total_avaliacoes: number;
  bo_destaque: boolean;
}

export interface ResultadoBusca {
  procedimento: ProcedimentoDetalhado;
  nr_score_relevancia: number;
  ds_motivo_recomendacao: string;
}

// Mapeamento de palavras-chave para objetivos (para NLP)
export const KEYWORDS_OBJETIVOS: Record<string, TipoObjetivo[]> = {
  "rugas": ["rejuvenescimento"],
  "linhas de expressão": ["rejuvenescimento"],
  "botox": ["rejuvenescimento"],
  "preenchimento": ["rejuvenescimento", "harmonizacao"],
  "emagrecer": ["emagrecimento"],
  "gordura": ["emagrecimento"],
  "acne": ["acne"],
  "manchas": ["manchas"],
  "celulite": ["celulite"],
  "estrias": ["estrias"],
};

// Mapeamento de palavras-chave para áreas do corpo
export const KEYWORDS_AREAS: Record<string, AreaCorpo[]> = {
  "rosto": ["facial"],
  "face": ["facial"],
  "facial": ["facial"],
  "corpo": ["corporal"],
  "barriga": ["corporal"],
  "cabelo": ["capilar"],
};
