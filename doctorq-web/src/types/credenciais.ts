// Tipos para o sistema de credenciais

export interface Credencial {
  id_credencial: string;
  nome: string;
  nome_credencial: string;
  dados_criptografado: string; // Campo texto criptografado como vem do banco
  dt_criacao: string;
  dt_atualizacao: string;
}

export interface CredencialCreate {
  nome: string;
  nome_credencial: string;
  dados_criptografado: Record<string, any>; // Objeto com os dados específicos do tipo
}

export interface CredencialUpdate {
  id_credencial?: string;
  nome?: string;
  nome_credencial?: string;
  dados_criptografado?: Record<string, any>; // Objeto com os dados específicos do tipo
}

export interface CredencialDecrypted {
  id_credencial: string;
  nome: string;
  nome_credencial: string;
  dados: Record<string, any>;
  dt_criacao: string;
  dt_atualizacao: string;
}

export interface CredencialListResponse {
  credenciais: Credencial[];
  total: number;
  page: number;
  size: number;
  total_pages: number;
}

export interface CredencialResponse {
  data: Credencial[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}

export interface TiposCredenciaisResponse {
  tipos_suportados: string[];
  total: number;
}

export interface CredencialFormData {
  nome: string;
  nome_credencial: string;
  dados_criptografado: Record<string, any>;
}

export interface CredencialFilters {
  search?: string;
  type_filter?: string;
  order_by?: string;
  order_desc?: string;
  page?: number;
  size?: number;
}

// Interfaces para diferentes tipos de credenciais (dados descriptografados)
export interface PostgreSQLCredentials {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  schema?: string;
}

export interface RedisCredentials {
  host: string;
  port: number;
  password?: string;
  database: number;
}

export interface FlowiseCredentials {
  url: string;
  api_key: string;
  chatflow_id?: string;
}

export interface AzureOpenAICredentials {
  endpoint: string;
  api_key: string;
  api_version: string;
  deployment_name: string;
  model_name?: string;
}

export interface AzureOpenAIEmbedCredentials {
  endpoint: string;
  api_key: string;
  api_version: string;
  deployment_name: string;
}

export interface OpenAICredentials {
  api_key: string;
  model_name: string;
  base_url?: string;
}


export interface QdrantCredentials {
  server_url: string;
  api_key?: string;
}

export interface MinIOCredentials {
  endpoint: string;
  access_key: string;
  secret_key: string;
  bucket_name?: string;
}

export interface MicrosoftGraphCredentials {
  tenant_id: string;
  client_id: string;
  client_secret: string;
  graph_url?: string;
  scopes?: string;
  authority?: string;
}

export interface SharePointCredentials {
  tenant_name: string;
  site_url: string;
  site_name?: string;
  folder_path: string;
}

export interface SEICredentials {
  url: string;
  usuario: string;
  senha: string;
}

export interface LangfuseCredentials {
  host: string;
  public_key: string;
  secret_key: string;
  project_id?: string;
}

// Mapeamento de tipos de credenciais para suas interfaces
export type CredentialData = {
  postgresqlApi: PostgreSQLCredentials;
  redisApi: RedisCredentials;
  flowiseApi: FlowiseCredentials;
  azureOpenIaChatApi: AzureOpenAICredentials;
  azureOpenIaEmbbedApi: AzureOpenAIEmbedCredentials;
  langfuseApi: LangfuseCredentials;
  openIaApi: OpenAICredentials;
  qdrantApi: QdrantCredentials;
  minIOApi: MinIOCredentials;
  microsoftGraphApi: MicrosoftGraphCredentials;
  sharepointFolderApi: SharePointCredentials;
  seiApi: SEICredentials;
};

// Tipo para os nomes dos tipos de credenciais
export type CredentialTypeName = keyof CredentialData;
