"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmpresaForm } from "@/components/forms/EmpresaForm";
import { ClinicasGestao } from "@/components/admin/ClinicasGestao";
import { ProfissionaisGestao } from "@/components/admin/ProfissionaisGestao";
import { Loader2, Building2, Hospital, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresas } from "@/lib/api/hooks/useEmpresas";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ConfiguracoesPage() {
  const { user, isLoading: isLoadingAuth } = useAuth();
  const { empresas, isLoading: isLoadingEmpresas } = useEmpresas({ page: 1, size: 100 });

  // Estado para empresa selecionada (inicializa com id_empresa do user se existir)
  const [empresaSelecionada, setEmpresaSelecionada] = useState<string | null>(
    user?.id_empresa || null
  );

  // Atualizar empresa selecionada quando user carregar
  useEffect(() => {
    if (user?.id_empresa && !empresaSelecionada) {
      setEmpresaSelecionada(user.id_empresa);
    }
  }, [user?.id_empresa, empresaSelecionada]);

  if (isLoadingAuth || isLoadingEmpresas) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="container mx-auto p-8">
          <PageHeader
            title="Configurações"
            description="Gerencie os dados da empresa"
          />
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
          <PageHeader
            title="Configurações"
            description="Gerencie os dados da empresa"
          />
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

  // Admin pode selecionar empresa - outros roles usam a empresa associada
  const isAdmin =
    user.role === "admin" ||
    user.role === "administrador" ||
    user.nm_papel === "admin" ||
    user.nm_papel === "administrador";
  const empresaId = isAdmin
    ? empresaSelecionada
    : user.id_empresa;

  // Se não há empresa selecionada, mostrar seletor (apenas para admin)
  if (isAdmin && !empresaId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="container mx-auto p-8">
          <PageHeader
            title="Configurações"
            description="Selecione uma empresa para gerenciar"
          />
          <Card>
            <CardContent className="p-12">
              <div className="max-w-md mx-auto space-y-6">
                <div className="text-center">
                  <Building2 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900">
                    Selecione uma Empresa
                  </h3>
                  <p className="text-gray-600 mt-2">
                    Escolha a empresa que deseja configurar
                  </p>
                </div>

                <Select value={empresaSelecionada || ""} onValueChange={setEmpresaSelecionada}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione uma empresa..." />
                  </SelectTrigger>
                  <SelectContent>
                    {empresas.map((empresa) => (
                      <SelectItem key={empresa.id_empresa} value={empresa.id_empresa}>
                        {empresa.nm_fantasia || empresa.nm_razao_social}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {empresas.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center">
                    Nenhuma empresa cadastrada. Acesse <strong>Empresas</strong> para criar uma.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Se não é admin e não tem empresa, mostrar erro
  if (!isAdmin && !empresaId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="container mx-auto p-8">
          <PageHeader
            title="Configurações"
            description="Gerencie os dados da empresa"
          />
          <Card>
            <CardContent className="p-12 text-center">
              <Building2 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900">
                Empresa não encontrada
              </h3>
              <p className="text-gray-600 mt-2">
                Você não está associado a nenhuma empresa. Entre em contato com o administrador.
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
        <div className="flex items-center justify-between">
          <PageHeader
            title="Configurações"
            description="Gerencie os dados da empresa"
          />

          {/* Seletor de empresa para Admin */}
          {isAdmin && empresas.length > 1 && (
            <div className="w-64">
              <Select value={empresaSelecionada || ""} onValueChange={setEmpresaSelecionada}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar empresa..." />
                </SelectTrigger>
                <SelectContent>
                  {empresas.map((empresa) => (
                    <SelectItem key={empresa.id_empresa} value={empresa.id_empresa}>
                      {empresa.nm_fantasia || empresa.nm_razao_social}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <Tabs defaultValue="empresa" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="empresa">
              <Building2 className="h-4 w-4 mr-2" />
              Empresa
            </TabsTrigger>
            <TabsTrigger value="clinicas">
              <Hospital className="h-4 w-4 mr-2" />
              Clínicas
            </TabsTrigger>
            <TabsTrigger value="profissionais">
              <Users className="h-4 w-4 mr-2" />
              Profissionais
            </TabsTrigger>
          </TabsList>

          {/* TAB: Empresa */}
          <TabsContent value="empresa" className="mt-6">
            {empresaId ? (
              <EmpresaForm
                empresaId={empresaId}
                onSuccess={() => {
                  window.location.reload();
                }}
              />
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Building2 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">Selecione uma empresa acima</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* TAB: Clínicas */}
          <TabsContent value="clinicas" className="mt-6">
            {empresaId ? (
              <ClinicasGestao empresaId={empresaId} />
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Hospital className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">Selecione uma empresa acima</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* TAB: Profissionais */}
          <TabsContent value="profissionais" className="mt-6">
            {empresaId ? (
              <ProfissionaisGestao empresaId={empresaId} />
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">Selecione uma empresa acima</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
