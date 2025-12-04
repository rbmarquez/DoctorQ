"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import {
  FileText,
  User,
  Calendar,
  Clock,
  Phone,
  Mail,
  MapPin,
  AlertCircle,
  TrendingUp,
  FileImage,
  Plus,
  Edit,
  Download,
  Lock,
  Shield,
  Activity,
  ClipboardList,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Prontuario, EvolucaoClinica } from "@/types/prontuario";
import { toast } from "sonner";
import { TreatmentTimeline } from "@/components/prontuario/TreatmentTimeline";

export default function ProntuarioPage() {
  const params = useParams();
  const router = useRouter();
  const id_paciente = params.id_paciente as string;

  const [prontuario, setProntuario] = useState<Prontuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<"resumo" | "anamnese" | "evolucoes" | "timeline" | "documentos">("resumo");

  useEffect(() => {
    fetchProntuario();
  }, [id_paciente]);

  const fetchProntuario = async () => {
    setLoading(true);
    try {
      // Mock data - substituir por chamada real à API
      await new Promise((resolve) => setTimeout(resolve, 500));

      const mockProntuario: Prontuario = {
        id_prontuario: "1",
        id_paciente: id_paciente,
        id_profissional_responsavel: "prof1",
        dt_criacao: "2025-01-15",
        dt_ultima_atualizacao: "2025-10-23",
        st_ativo: true,
        paciente: {
          id_paciente: id_paciente,
          nm_completo: "Maria Silva Santos",
          dt_nascimento: "1985-03-20",
          nr_cpf: "123.456.789-00",
          ds_foto_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=faces",
          nm_email: "maria.silva@email.com",
          nr_telefone: "(11) 98765-4321",
        },
        evolucoes: [
          {
            id_evolucao: "1",
            id_prontuario: "1",
            id_paciente: id_paciente,
            id_profissional: "prof1",
            dt_evolucao: "2025-10-20",
            hr_evolucao: "14:30",
            ds_motivo_consulta: "Retorno para avaliação de botox",
            ds_procedimento_realizado: "Aplicação de Toxina Botulínica",
            ds_evolucao_clinica: "Paciente retorna para reavaliação do tratamento com toxina botulínica realizado há 30 dias. Refere satisfação com os resultados. Linhas de expressão da região frontal e glabelar com atenuação significativa.",
            ds_area_tratada: "Região frontal, glabela e região periocular",
            ds_produtos_utilizados: ["Botox 100U"],
            nr_quantidade_aplicada: 50,
            ds_unidade_medida: "unidades",
            bo_reacoes_adversas: false,
            ds_orientacoes_pos_procedimento: "Evitar deitar nas próximas 4 horas, não massagear a região, evitar atividades físicas intensas por 24h",
            dt_retorno_previsto: "2026-01-20",
            ds_assinatura_profissional: "Dra. Ana Paula Oliveira - CRM 12345",
            nm_crm_cro: "CRM 12345",
          },
          {
            id_evolucao: "2",
            id_prontuario: "1",
            id_paciente: id_paciente,
            id_profissional: "prof1",
            dt_evolucao: "2025-09-15",
            hr_evolucao: "10:00",
            ds_motivo_consulta: "Primeira aplicação de toxina botulínica",
            ds_procedimento_realizado: "Aplicação de Toxina Botulínica - Primeira Sessão",
            ds_evolucao_clinica: "Primeira consulta para tratamento com toxina botulínica. Paciente com linhas de expressão moderadas em região frontal e glabela. Realizada anamnese completa, exame físico e fotos pré-procedimento.",
            ds_area_tratada: "Região frontal e glabela",
            ds_produtos_utilizados: ["Botox 100U"],
            nr_quantidade_aplicada: 40,
            ds_unidade_medida: "unidades",
            bo_reacoes_adversas: false,
            ds_orientacoes_pos_procedimento: "Evitar deitar nas próximas 4 horas, não massagear a região, evitar atividades físicas intensas por 24h. Retornar em 15 dias para avaliação.",
            dt_retorno_previsto: "2025-09-30",
            ds_fotos_antes: ["https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=400"],
            ds_assinatura_profissional: "Dra. Ana Paula Oliveira - CRM 12345",
            nm_crm_cro: "CRM 12345",
          },
        ],
        documentos: [
          {
            id_documento: "1",
            id_prontuario: "1",
            nm_documento: "Termo de Consentimento - Botox",
            ds_tipo_documento: "consentimento",
            ds_url: "/documentos/consentimento_botox.pdf",
            dt_upload: "2025-09-15",
            id_profissional_upload: "prof1",
            nr_tamanho_bytes: 245678,
            ds_mime_type: "application/pdf",
          },
          {
            id_documento: "2",
            id_prontuario: "1",
            nm_documento: "Exames Laboratoriais",
            ds_tipo_documento: "exame",
            ds_url: "/documentos/exames_lab.pdf",
            dt_upload: "2025-09-14",
            id_profissional_upload: "prof1",
            nr_tamanho_bytes: 1234567,
            ds_mime_type: "application/pdf",
          },
        ],
        consentimentos: [],
        nr_total_consultas: 2,
        nr_total_procedimentos: 2,
        dt_primeira_consulta: "2025-09-15",
        dt_ultima_consulta: "2025-10-20",
      };

      setProntuario(mockProntuario);
    } catch (error) {
      console.error("Erro ao buscar prontuário:", error);
      toast.error("Erro ao carregar prontuário");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  };

  const calcularIdade = (dataNascimento: string) => {
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();
    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    return idade;
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Activity className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
            <p className="text-gray-600">Carregando prontuário...</p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  if (!prontuario) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <p className="text-gray-900 font-semibold mb-2">Prontuário não encontrado</p>
            <p className="text-gray-600 mb-6">O prontuário solicitado não existe ou você não tem permissão para visualizá-lo</p>
            <Button onClick={() => router.push("/profissional/dashboard")}>Voltar ao Dashboard</Button>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                {/* Foto do Paciente */}
                {prontuario.paciente.ds_foto_url ? (
                  <div className="w-24 h-24 rounded-xl overflow-hidden border-4 border-white shadow-lg flex-shrink-0">
                    <img
                      src={prontuario.paciente.ds_foto_url}
                      alt={prontuario.paciente.nm_completo}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-xl bg-white/20 flex items-center justify-center border-4 border-white shadow-lg">
                    <User className="h-12 w-12 text-white" />
                  </div>
                )}

                {/* Informações do Paciente */}
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <h1 className="text-3xl font-bold">{prontuario.paciente.nm_completo}</h1>
                    <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-semibold backdrop-blur-sm">
                      {calcularIdade(prontuario.paciente.dt_nascimento)} anos
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-2 text-sm text-white/90">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4" />
                      <span>{prontuario.paciente.nm_email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4" />
                      <span>{prontuario.paciente.nr_telefone}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4" />
                      <span>CPF: {prontuario.paciente.nr_cpf}</span>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center space-x-3 mt-3">
                    <span className="inline-flex items-center px-3 py-1 bg-green-500/90 rounded-full text-xs font-semibold">
                      <Shield className="h-3 w-3 mr-1" />
                      Prontuário Ativo
                    </span>
                    <span className="inline-flex items-center px-3 py-1 bg-blue-500/90 rounded-full text-xs font-semibold">
                      <Lock className="h-3 w-3 mr-1" />
                      LGPD Protegido
                    </span>
                  </div>
                </div>
              </div>

              {/* Ações */}
              <div className="flex items-center space-x-3">
                <Link href={`/profissional/prontuario/${id_paciente}/nova-evolucao`}>
                  <Button className="bg-white text-blue-600 hover:bg-blue-50">
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Evolução
                  </Button>
                </Link>
                <Button variant="outline" className="border-white text-white hover:bg-white/10">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar PDF
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Consultas</p>
                  <p className="text-2xl font-bold text-gray-900">{prontuario.nr_total_consultas}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Activity className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Procedimentos</p>
                  <p className="text-2xl font-bold text-gray-900">{prontuario.nr_total_procedimentos}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Documentos</p>
                  <p className="text-2xl font-bold text-gray-900">{prontuario.documentos.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Última Consulta</p>
                  <p className="text-sm font-bold text-gray-900">
                    {prontuario.dt_ultima_consulta
                      ? new Date(prontuario.dt_ultima_consulta).toLocaleDateString("pt-BR")
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setSelectedTab("resumo")}
                  className={`flex-1 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    selectedTab === "resumo"
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <ClipboardList className="h-4 w-4" />
                    <span>Resumo</span>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedTab("anamnese")}
                  className={`flex-1 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    selectedTab === "anamnese"
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span>Anamnese</span>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedTab("evolucoes")}
                  className={`flex-1 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    selectedTab === "evolucoes"
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Activity className="h-4 w-4" />
                    <span>Evoluções ({prontuario.evolucoes.length})</span>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedTab("timeline")}
                  className={`flex-1 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    selectedTab === "timeline"
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>Timeline</span>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedTab("documentos")}
                  className={`flex-1 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    selectedTab === "documentos"
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <FileImage className="h-4 w-4" />
                    <span>Documentos ({prontuario.documentos.length})</span>
                  </div>
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {selectedTab === "resumo" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Resumo do Paciente</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Nome Completo</p>
                          <p className="text-base text-gray-900">{prontuario.paciente.nm_completo}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Data de Nascimento</p>
                          <p className="text-base text-gray-900">
                            {formatDate(prontuario.paciente.dt_nascimento)} ({calcularIdade(prontuario.paciente.dt_nascimento)} anos)
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">CPF</p>
                          <p className="text-base text-gray-900">{prontuario.paciente.nr_cpf}</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-gray-600">E-mail</p>
                          <p className="text-base text-gray-900">{prontuario.paciente.nm_email}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Telefone</p>
                          <p className="text-base text-gray-900">{prontuario.paciente.nr_telefone}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Prontuário Criado em</p>
                          <p className="text-base text-gray-900">{formatDate(prontuario.dt_criacao)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Última Evolução */}
                  {prontuario.evolucoes.length > 0 && (
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-4">Última Evolução Clínica</h3>
                      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <p className="text-sm text-gray-600">
                              {formatDate(prontuario.evolucoes[0].dt_evolucao)} às {prontuario.evolucoes[0].hr_evolucao}
                            </p>
                            <h4 className="text-lg font-bold text-gray-900 mt-1">
                              {prontuario.evolucoes[0].ds_procedimento_realizado}
                            </h4>
                          </div>
                        </div>
                        <p className="text-gray-700 mb-4">{prontuario.evolucoes[0].ds_evolucao_clinica}</p>
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-600">
                            <strong>Área tratada:</strong> {prontuario.evolucoes[0].ds_area_tratada}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedTab("evolucoes")}
                            className="text-blue-600 border-blue-300 hover:bg-blue-50"
                          >
                            Ver Detalhes
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selectedTab === "anamnese" && (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Anamnese não realizada</h3>
                  <p className="text-gray-600 mb-6">Este paciente ainda não possui uma anamnese cadastrada</p>
                  <Link href={`/profissional/prontuario/${id_paciente}/anamnese/nova`}>
                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Anamnese
                    </Button>
                  </Link>
                </div>
              )}

              {selectedTab === "evolucoes" && (
                <div className="space-y-6">
                  {prontuario.evolucoes.length === 0 ? (
                    <div className="text-center py-12">
                      <Activity className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma evolução registrada</h3>
                      <p className="text-gray-600 mb-6">Ainda não há evoluções clínicas para este paciente</p>
                      <Link href={`/profissional/prontuario/${id_paciente}/nova-evolucao`}>
                        <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                          <Plus className="h-4 w-4 mr-2" />
                          Nova Evolução
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    prontuario.evolucoes.map((evolucao, index) => (
                      <div key={evolucao.id_evolucao} className="bg-white rounded-xl border border-gray-200 p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="flex items-center space-x-3 mb-2">
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                                {prontuario.evolucoes.length - index}
                              </span>
                              <h4 className="text-lg font-bold text-gray-900">{evolucao.ds_procedimento_realizado}</h4>
                            </div>
                            <p className="text-sm text-gray-600">
                              {formatDate(evolucao.dt_evolucao)} às {evolucao.hr_evolucao}
                            </p>
                          </div>
                          <Button size="sm" variant="ghost">
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </Button>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <p className="text-sm font-semibold text-gray-700 mb-1">Motivo da Consulta:</p>
                            <p className="text-gray-600">{evolucao.ds_motivo_consulta}</p>
                          </div>

                          <div>
                            <p className="text-sm font-semibold text-gray-700 mb-1">Evolução Clínica:</p>
                            <p className="text-gray-600">{evolucao.ds_evolucao_clinica}</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-semibold text-gray-700 mb-1">Área Tratada:</p>
                              <p className="text-gray-600">{evolucao.ds_area_tratada}</p>
                            </div>
                            {evolucao.ds_produtos_utilizados && evolucao.ds_produtos_utilizados.length > 0 && (
                              <div>
                                <p className="text-sm font-semibold text-gray-700 mb-1">Produtos Utilizados:</p>
                                <p className="text-gray-600">{evolucao.ds_produtos_utilizados.join(", ")}</p>
                              </div>
                            )}
                          </div>

                          <div>
                            <p className="text-sm font-semibold text-gray-700 mb-1">Orientações Pós-Procedimento:</p>
                            <p className="text-gray-600">{evolucao.ds_orientacoes_pos_procedimento}</p>
                          </div>

                          {evolucao.dt_retorno_previsto && (
                            <div className="flex items-center space-x-2 text-sm">
                              <Calendar className="h-4 w-4 text-blue-600" />
                              <span className="text-gray-700">
                                <strong>Retorno previsto:</strong> {formatDate(evolucao.dt_retorno_previsto)}
                              </span>
                            </div>
                          )}

                          <div className="pt-4 border-t border-gray-100">
                            <p className="text-sm text-gray-600">{evolucao.ds_assinatura_profissional}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {selectedTab === "timeline" && (
                <TreatmentTimeline
                  evolucoes={prontuario.evolucoes}
                  professionalName="Dra. Ana Paula Oliveira"
                />
              )}

              {selectedTab === "documentos" && (
                <div>
                  {prontuario.documentos.length === 0 ? (
                    <div className="text-center py-12">
                      <FileImage className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum documento anexado</h3>
                      <p className="text-gray-600 mb-6">Ainda não há documentos anexados a este prontuário</p>
                      <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Documento
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {prontuario.documentos.map((doc) => (
                        <div
                          key={doc.id_documento}
                          className="bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-300 hover:shadow-md transition-all"
                        >
                          <div className="flex items-start space-x-4">
                            <div className="p-3 bg-blue-100 rounded-lg flex-shrink-0">
                              <FileText className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 truncate">{doc.nm_documento}</h4>
                              <p className="text-sm text-gray-600 mt-1">
                                {doc.ds_tipo_documento} • {(doc.nr_tamanho_bytes / 1024).toFixed(0)} KB
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Enviado em {formatDate(doc.dt_upload)}
                              </p>
                              <div className="mt-3">
                                <Button size="sm" variant="outline" className="text-blue-600 border-blue-300">
                                  <Download className="h-3 w-3 mr-2" />
                                  Baixar
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
