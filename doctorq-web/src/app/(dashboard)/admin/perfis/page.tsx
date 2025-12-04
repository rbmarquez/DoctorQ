"use client";

import { useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Settings, Monitor } from "lucide-react";
import { PerfilList } from "./_components/PerfilList";
import { PermissoesMatriz } from "./_components/PermissoesMatriz";
import { TelasMatriz } from "./_components/TelasMatriz";

/**
 * Página de Gestão de Perfis e Permissões
 * Layout baseado no projeto Maua (/usuarios?tab=permissoes)
 *
 * Abas (em ordem):
 * - telas: Configuração de visibilidade de telas por tipo de usuário (ABA PADRÃO)
 * - perfil: CRUD de perfis (lista, criar, editar, excluir)
 * - permissoes: Matriz de permissões por perfil (checkboxes)
 */
export default function PerfisPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  // Mapeia query param para valor da aba (useMemo para evitar recriação)
  const activeTabFromUrl = useMemo(() => {
    switch (tabParam) {
      case "perfil":
        return "perfil";
      case "permissoes":
        return "permissoes";
      default:
        return "telas"; // Telas é a aba padrão
    }
  }, [tabParam]);

  // Atualiza URL quando muda de aba
  const handleTabChange = (value: string) => {
    if (value === "telas") {
      router.push("/admin/perfis"); // Telas é a padrão, não precisa de query param
    } else {
      router.push(`/admin/perfis?tab=${value}`);
    }
  };

  return (
    <div className="container mx-auto p-6">
      {/* Breadcrumb */}
      <div className="mb-4">
        <nav className="text-sm text-muted-foreground">
          <span>Admin</span>
          <span className="mx-2">/</span>
          <span className="text-foreground font-medium">Perfis e Permissões</span>
        </nav>
      </div>

      {/* Card Principal com Abas */}
      <Card className="shadow-md">
        <CardContent className="p-6">
          <Tabs value={activeTabFromUrl} onValueChange={handleTabChange}>
            {/* Lista de Abas */}
            <TabsList className="mb-6 grid w-full max-w-2xl grid-cols-3">
              <TabsTrigger value="telas" className="flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                Telas
              </TabsTrigger>
              <TabsTrigger value="perfil" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Perfil
              </TabsTrigger>
              <TabsTrigger value="permissoes" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Permissões
              </TabsTrigger>
            </TabsList>

            {/* Tab: Telas (Visibilidade) - PRIMEIRA ABA */}
            <TabsContent value="telas">
              <TelasMatriz />
            </TabsContent>

            {/* Tab: Perfil (CRUD) */}
            <TabsContent value="perfil">
              <PerfilList />
            </TabsContent>

            {/* Tab: Permissões (Matriz) */}
            <TabsContent value="permissoes">
              <PermissoesMatriz />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
