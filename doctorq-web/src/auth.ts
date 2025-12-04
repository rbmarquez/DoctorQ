import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import AzureAD from "next-auth/providers/azure-ad";
import Apple from "next-auth/providers/apple";
import Credentials from "next-auth/providers/credentials";
import type { Provider } from "next-auth/providers";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// Construir lista de providers dinamicamente baseado nas credenciais disponíveis
const providers: Provider[] = [];

/**
 * Normaliza o papel/perfil retornado pela API para os tipos usados no frontend.
 * Garante que dashboards sejam resolvidos corretamente após o login.
 */
const normalizeRole = (role?: string | null): string => {
  const value = role?.toString().trim().toLowerCase() || "";

  if (["admin", "administrador", "super_admin", "superadmin"].includes(value)) {
    return "administrador";
  }

  if (["gestor_clinica", "gestor clínica", "gestor", "manager", "clinica", "clínica"].includes(value)) {
    return "gestor_clinica";
  }

  if (["profissional", "profissional_estetica", "profissional_estética", "medico", "médico", "esteticista"].includes(value)) {
    return "profissional";
  }

  if (
    [
      "fornecedor",
      "gestor_fornecedor",
      "vendedor",
      "marketing",
      "parceiro_comercial",
      "parceiro",
    ].includes(value)
  ) {
    return "fornecedor";
  }

  if (["paciente", "cliente", "user", "usuario", "usuário"].includes(value)) {
    return "cliente";
  }

  return "cliente";
};

// Adicionar Google OAuth apenas se credenciais estiverem configuradas
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    })
  );
}

// Adicionar Microsoft OAuth apenas se credenciais estiverem configuradas
if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
  providers.push(
    AzureAD({
      clientId: process.env.MICROSOFT_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      tenantId: process.env.MICROSOFT_TENANT_ID || "common",
    } as any)
  );
}

// Adicionar Apple OAuth apenas se credenciais estiverem configuradas
if (process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET) {
  providers.push(
    Apple({
      clientId: process.env.APPLE_CLIENT_ID,
      clientSecret: process.env.APPLE_CLIENT_SECRET,
    })
  );
}

// Credentials provider (login local) - sempre disponível
providers.push(
  Credentials({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      try {
        const res = await fetch(`${API_BASE_URL}/users/login-local`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nm_email: credentials.email,
            senha: credentials.password,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Credenciais inválidas");
        }

        // Buscar permissões do usuário (sistema de dois níveis)
        let userRole = normalizeRole(data.user.nm_papel);
        console.log("[AUTH] Login inicial - nm_papel:", data.user.nm_papel, "id_perfil:", data.user.id_perfil);

        if (data.user.id_perfil && data.user.id_user) {
          try {
            // Buscar permissões completas do usuário usando API Key do sistema
            const API_KEY = process.env.API_DOCTORQ_API_KEY || "vf_tgASHq7vdg3qOpByHvCZyXazbyHI2WbX";
            const permissionsRes = await fetch(`${API_BASE_URL}/permissions/users/${data.user.id_user}/permissions`, {
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_KEY}`
              },
            });
            console.log("[AUTH] Permissions response status:", permissionsRes.status);

            if (permissionsRes.ok) {
              const permissionsData = await permissionsRes.json();
              console.log("[AUTH] Permissões carregadas - grupos_acesso:", permissionsData.grupos_acesso);

              // Determinar role baseado nos grupos de acesso (Nível 1)
              const grupos = permissionsData.grupos_acesso || [];

              if (grupos.includes('admin')) {
                userRole = 'administrador';
              } else if (grupos.includes('clinica')) {
                userRole = 'gestor_clinica';
              } else if (grupos.includes('profissional')) {
                userRole = 'profissional';
              } else if (grupos.includes('fornecedor')) {
                userRole = 'fornecedor';
              } else if (grupos.includes('paciente')) {
                userRole = 'cliente';
              }

              console.log("[AUTH] Role determinado pelos grupos:", userRole);
            } else {
              console.warn("[AUTH] Erro ao buscar permissões - status:", permissionsRes.status);
            }
          } catch (err) {
            console.warn("[AUTH] Erro ao buscar permissões, usando nm_papel:", err);
          }
        }

        console.log("[AUTH] Role final que será usado:", userRole);

        return {
          id: data.user.id_user,
          email: data.user.nm_email,
          name: data.user.nm_completo,
          role: userRole,
          accessToken: data.access_token,
          id_perfil: data.user.id_perfil, // Para buscar permissões
          id_empresa: data.user.id_empresa,
        };
      } catch (error: any) {
        console.error("Erro na autenticação:", error);
        throw new Error(error.message || "Erro ao autenticar");
      }
    },
  })
);

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers,
  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/login",
    newUser: "/dashboard",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Se for OAuth (Google, Microsoft, Apple)
      if (account?.provider !== "credentials") {
        try {
          // Criar ou atualizar usuário no backend
          const response = await fetch(`${API_BASE_URL}/users/oauth-login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              provider: account?.provider,
              provider_id: account?.providerAccountId,
              email: user.email,
              name: user.name,
              image: user.image,
            }),
          });

          if (!response.ok) {
            console.error("Erro ao criar/atualizar usuário OAuth");
            return false;
          }

          const data = await response.json();

          // Adicionar dados do backend ao usuário
          user.id = data.user.id_user;
          user.role = normalizeRole(data.user.nm_papel || data.user.nm_perfil);
          user.accessToken = data.access_token;
        } catch (error) {
          console.error("Erro no callback signIn:", error);
          return false;
        }
      }

      return true;
    },
    async jwt({ token, user, account }) {
      // Primeira vez após login
      if (user) {
        console.log("[JWT] Recebendo user do authorize:", { id: user.id, role: user.role, email: user.email, id_perfil: user.id_perfil });
        token.id = user.id;
        token.role = user.role;
        token.accessToken = user.accessToken;
        token.id_perfil = user.id_perfil;
        token.id_empresa = user.id_empresa;
        console.log("[JWT] Token atualizado com role:", token.role, "id_perfil:", token.id_perfil);
      }

      // OAuth account data
      if (account) {
        token.provider = account.provider;
        token.providerAccountId = account.providerAccountId;
      }

      return token;
    },
    async session({ session, token }) {
      console.log("[SESSION] Token recebido:", { id: token.id, role: token.role, id_perfil: token.id_perfil });
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.accessToken = token.accessToken as string;
        session.user.provider = token.provider as string;
        session.user.id_perfil = token.id_perfil as string;
        session.user.id_empresa = token.id_empresa as string;
        console.log("[SESSION] Session atualizada com role:", session.user.role, "id_perfil:", session.user.id_perfil);
      }

      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
});
