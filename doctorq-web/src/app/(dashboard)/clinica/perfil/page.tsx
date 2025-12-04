"use client";

import { PageHeader } from "@/components/shared/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClinicaForm } from "@/components/forms/ClinicaForm";
import { Loader2, Building2, Users, Calendar } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function ClinicaPerfilPage() {
  // Pegar usuário logado
  const { user, isLoading: isLoadingAuth } = useAuth();

  // O gestor de clínica tem id_clinica no perfil
  const clinicaId = user?.id_clinica;

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="container mx-auto p-8">
          <PageHeader title="Perfil da Clínica" description="Gerenciamento da clínica" />
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
          <PageHeader title="Perfil da Clínica" description="Gerenciamento da clínica" />
          <Card>
            <CardContent className="p-12 text-center">
              <Building2 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
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

  if (!clinicaId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="container mx-auto p-8">
          <PageHeader title="Perfil da Clínica" description="Gerenciamento da clínica" />
          <Card>
            <CardContent className="p-12 text-center">
              <Building2 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900">
                Clínica não encontrada
              </h3>
              <p className="text-gray-600 mt-2">
                Você não está associado a nenhuma clínica. Entre em contato com o administrador.
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
          title="Perfil da Clínica"
          description="Gerencie as informações da sua clínica"
        />

        <Tabs defaultValue="perfil" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="perfil">
              <Building2 className="h-4 w-4 mr-2" />
              Dados da Clínica
            </TabsTrigger>
            <TabsTrigger value="equipe">
              <Users className="h-4 w-4 mr-2" />
              Equipe
            </TabsTrigger>
            <TabsTrigger value="horarios">
              <Calendar className="h-4 w-4 mr-2" />
              Horários
            </TabsTrigger>
          </TabsList>

          {/* TAB: Perfil da Clínica */}
          <TabsContent value="perfil" className="mt-6">
            <ClinicaForm
              clinicaId={clinicaId}
              onSuccess={() => {
                // Recarregar página ou mostrar mensagem
                window.location.reload();
              }}
            />
          </TabsContent>

          {/* TAB: Equipe */}
          <TabsContent value="equipe" className="mt-6">
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900">
                  Gestão de Equipe
                </h3>
                <p className="text-gray-600 mt-2">
                  Em breve você poderá visualizar e gerenciar a equipe da clínica.
                </p>
                <p className="text-sm text-muted-foreground mt-4">
                  Por enquanto, acesse o menu <strong>Profissionais</strong> na navegação lateral.
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
                  Gestão de Horários
                </h3>
                <p className="text-gray-600 mt-2">
                  Em breve você poderá configurar horários de funcionamento e disponibilidade.
                </p>
                <p className="text-sm text-muted-foreground mt-4">
                  Por enquanto, edite o horário na aba <strong>Dados da Clínica</strong>.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
