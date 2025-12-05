"use client";

import { useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Monitor, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PartnerPlansManager } from "@/components/partners/admin/PartnerPlansManager";
import { PlanoTelasMatriz } from "@/components/partners/admin/PlanoTelasMatriz";

/**
 * Página de Gestão de Planos de Parceiros
 *
 * Abas:
 * - planos: CRUD de planos (lista, criar, editar, excluir) - ABA PADRÃO
 * - telas: Configuração de visibilidade de telas por plano
 */
export default function PartnerPlansPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  // Mapeia query param para valor da aba
  const activeTabFromUrl = useMemo(() => {
    switch (tabParam) {
      case "telas":
        return "telas";
      default:
        return "planos"; // Planos é a aba padrão
    }
  }, [tabParam]);

  // Atualiza URL quando muda de aba
  const handleTabChange = (value: string) => {
    if (value === "planos") {
      router.push("/admin/partner/planos"); // Planos é a padrão, não precisa de query param
    } else {
      router.push(`/admin/partner/planos?tab=${value}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto space-y-8 px-6 py-10 lg:px-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <nav className="text-sm text-muted-foreground mb-2">
              <span>Admin</span>
              <span className="mx-2">/</span>
              <span>Partner</span>
              <span className="mx-2">/</span>
              <span className="text-foreground font-medium">Planos</span>
            </nav>
            <h1 className="text-3xl font-bold tracking-tight">Catálogo de Planos</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie os planos e configure as telas disponíveis para cada tipo de parceiro.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/admin/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
        </div>

        {/* Card Principal com Abas */}
        <Card className="shadow-md">
          <CardContent className="p-6">
            <Tabs value={activeTabFromUrl} onValueChange={handleTabChange}>
              {/* Lista de Abas */}
              <TabsList className="mb-6 grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="planos" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Planos
                </TabsTrigger>
                <TabsTrigger value="telas" className="flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  Telas
                </TabsTrigger>
              </TabsList>

              {/* Tab: Planos (CRUD) - PRIMEIRA ABA */}
              <TabsContent value="planos">
                <PartnerPlansManager />
              </TabsContent>

              {/* Tab: Telas (Visibilidade por Plano) */}
              <TabsContent value="telas">
                <PlanoTelasMatriz />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
