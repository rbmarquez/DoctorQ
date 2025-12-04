export type UserType = "cliente" | "profissional" | "fornecedor" | "administrador" | "gestor_clinica";

export interface User {
  id_user: string;
  nm_completo: string;
  nm_email: string;
  ds_tipo_usuario: UserType;
  ds_foto_url?: string;
  nr_telefone?: string;
  st_ativo: boolean;
  dt_criacao: string;
  dt_ultimo_acesso?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  switchUserType: (type: UserType) => void; // For demo/testing purposes
}
