// types/next-auth.d.ts

import { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      backendData?: any;
      backendUserId?: string;
      role?: string;
      provider?: string;
      accessToken?: string;
      id_empresa?: string;
      id_perfil?: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    id: string;
    backendData?: any;
    role?: string;
    accessToken?: string;
    provider?: string;
    id_empresa?: string;
    id_perfil?: string;
  }

  interface Profile {
    email?: string;
    name?: string;
    picture?: string;
    image?: string;
    avatar_url?: string;
    photo?: string;
    sub?: string;
    given_name?: string;
    family_name?: string;
    preferred_username?: string;
    [key: string]: any;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    accessToken?: string;
    backendData?: any;
    backendUserId?: string;
    role?: string;
    id_empresa?: string;
    id_perfil?: string;
    provider?: string;
    providerAccountId?: string;
  }
}
