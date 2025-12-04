"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, UserType } from "@/types/auth";
import { toast } from "sonner";

interface UserTypeContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  switchUserType: (type: UserType) => void;
}

const UserTypeContext = createContext<UserTypeContextType | undefined>(undefined);

// Mock users for demonstration
const mockUsers: Record<string, User> = {
  "cliente@estetiQ.com": {
    id_user: "1",
    nm_completo: "Maria Silva",
    nm_email: "cliente@estetiQ.com",
    ds_tipo_usuario: "cliente",
    nr_telefone: "(11) 98765-4321",
    st_ativo: true,
    dt_criacao: "2024-01-15",
    dt_ultimo_acesso: new Date().toISOString(),
  },
  "profissional@estetiQ.com": {
    id_user: "2",
    nm_completo: "Dra. Ana Paula Oliveira",
    nm_email: "profissional@estetiQ.com",
    ds_tipo_usuario: "profissional",
    nr_telefone: "(11) 98888-7777",
    st_ativo: true,
    dt_criacao: "2024-01-10",
    dt_ultimo_acesso: new Date().toISOString(),
  },
  "fornecedor@estetiQ.com": {
    id_user: "3",
    nm_completo: "João Santos - Dermaceuticals",
    nm_email: "fornecedor@estetiQ.com",
    ds_tipo_usuario: "fornecedor",
    nr_telefone: "(11) 3333-4444",
    st_ativo: true,
    dt_criacao: "2024-01-05",
    dt_ultimo_acesso: new Date().toISOString(),
  },
  "admin@estetiQ.com": {
    id_user: "4",
    nm_completo: "Administrador DoctorQ",
    nm_email: "admin@estetiQ.com",
    ds_tipo_usuario: "administrador",
    st_ativo: true,
    dt_criacao: "2024-01-01",
    dt_ultimo_acesso: new Date().toISOString(),
  },
  "foi@fo.com": {
    id_user: "2f96fd09-e66c-4010-a1ac-9ab777e02ef2",
    nm_completo: "Usuário Fornecedor",
    nm_email: "foi@fo.com",
    ds_tipo_usuario: "fornecedor",
    nr_telefone: "",
    st_ativo: true,
    dt_criacao: "2025-11-10",
    dt_ultimo_acesso: new Date().toISOString(),
  },
};

export function UserTypeProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("estetiQ_demo_user");
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
      } catch (error) {
        console.error("Error parsing saved user:", error);
        localStorage.removeItem("estetiQ_demo_user");
      }
    }
    setIsLoading(false);
  }, []);

  // Save user to localStorage whenever it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem("estetiQ_demo_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("estetiQ_demo_user");
    }
  }, [user]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Check if user exists in mock data
      const foundUser = mockUsers[email];

      if (!foundUser) {
        throw new Error("Usuário não encontrado");
      }

      // In a real app, you would validate password here
      // For demo purposes, any password works

      setUser({
        ...foundUser,
        dt_ultimo_acesso: new Date().toISOString(),
      });

      toast.success(`Bem-vindo, ${foundUser.nm_completo}!`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao fazer login");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("estetiQ_demo_user");
    toast.success("Logout realizado com sucesso");
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updates });
    }
  };

  // For demo/testing purposes - allow switching user types
  const switchUserType = (type: UserType) => {
    if (user) {
      setUser({
        ...user,
        ds_tipo_usuario: type,
      });
      toast.success(`Tipo de usuário alterado para: ${type}`);
    }
  };

  const value: UserTypeContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    updateUser,
    switchUserType,
  };

  return <UserTypeContext.Provider value={value}>{children}</UserTypeContext.Provider>;
}

export function useUserType() {
  const context = useContext(UserTypeContext);
  if (context === undefined) {
    throw new Error("useUserType must be used within a UserTypeProvider");
  }
  return context;
}

// Helper hook to check if user has specific type
export function useIsUserType(type: UserType) {
  const { user } = useUserType();
  return user?.ds_tipo_usuario === type;
}
