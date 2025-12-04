"use client";

import { PageHeader } from "@/components/shared/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfissionalForm } from "@/components/forms/ProfissionalForm";
import { Loader2, User, Building2, Calendar } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function ProfissionalPerfilPage() {
  // Pegar usuário logado
  const { user, isLoading: isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="container mx-auto p-8">
          <PageHeader title="Meu Perfil" description="Perfil profissional" />
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="container mx-auto p-8">
          <PageHeader title="Meu Perfil" description="Perfil profissional" />
          <Card>
            <CardContent className="p-12 text-center">
              <User className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900">
                Erro ao carregar perfil
              </h3>
              <p className="text-gray-600 mt-2">
                Não foi possível carregar seus dados. Faça login novamente.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto p-8 space-y-6">
        <PageHeader
          title="Meu Perfil"
          description="Gerencie suas informações profissionais"
        />

        <Tabs defaultValue="perfil" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="perfil">
              <User className="h-4 w-4 mr-2" />
              Meu Perfil
            </TabsTrigger>
            <TabsTrigger value="clinicas">
              <Building2 className="h-4 w-4 mr-2" />
              Minhas Clínicas
            </TabsTrigger>
            <TabsTrigger value="horarios">
              <Calendar className="h-4 w-4 mr-2" />
              Horários
            </TabsTrigger>
          </TabsList>

          {/* TAB: Perfil */}
          <TabsContent value="perfil" className="mt-6">
            <ProfissionalForm
              profissionalId={user.id} // Sempre passa o id do usuário
              onSuccess={() => {
                // Recarregar página ou mostrar mensagem
                window.location.reload();
              }}
            />
          </TabsContent>

          {/* TAB: Clínicas */}
          <TabsContent value="clinicas" className="mt-6">
            <Card>
              <CardContent className="p-12 text-center">
                <Building2 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900">
                  Minhas Clínicas
                </h3>
                <p className="text-gray-600 mt-2">
                  Em breve você poderá visualizar e gerenciar as clínicas onde atende.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: Horários */}
          <TabsContent value="horarios" className="mt-6">
            <Card>
              <CardContent className="p-12 text-center">
                <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900">
                  Horários de Atendimento
                </h3>
                <p className="text-gray-600 mt-2">
                  Configure seus horários na aba <strong>Meu Perfil</strong>, seção <strong>Horários</strong>.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
