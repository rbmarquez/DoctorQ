"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Building2,
  MapPin,
  DollarSign,
  Clock,
  Users,
  Star,
  Briefcase,
  CheckCircle,
  AlertCircle,
  Calendar,
  ArrowLeft,
  Share2,
  Bookmark,
  Send,
  Link2,
  Mail,
  BookmarkCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { VagaCard } from "@/components/carreiras/VagaCard";
import { AuthAccessModal } from "@/components/auth/AuthAccessModal";
import { useAuth } from "@/hooks/useAuth";
import { useVaga, useVagasSimilares } from "@/lib/api/hooks/useVagas";
import { useMeuCurriculo } from "@/lib/api/hooks/useCurriculos";
import {
  verificarCandidatura,
  criarCandidatura,
} from "@/lib/api/hooks/useCandidaturas";
import {
  useIsFavoritoVaga,
  toggleFavoritoVaga,
} from "@/lib/api/hooks/useFavoritosVagas";
import type { Vaga } from "@/types/carreiras";
import { toast } from "sonner";

export default function VagaDetalhesPage() {
  const params = useParams();
  const router = useRouter();
  const id_vaga = params.id as string;

  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { vaga, isLoading: loadingVaga } = useVaga(id_vaga);
  const { curriculo, temCurriculo, isLoading: loadingCurriculo } = useMeuCurriculo();
  const { vagas: vagasSimilares } = useVagasSimilares(id_vaga);
  const { isFavorito, mutate: mutateFavorito } = useIsFavoritoVaga(id_vaga);

  const [jaCandidatou, setJaCandidatou] = useState(false);
  const [candidaturaStatus, setCandidaturaStatus] = useState<string | null>(null);
  const [cartaApresentacao, setCartaApresentacao] = useState("");
  const [enviandoCandidatura, setEnviandoCandidatura] = useState(false);
  const [verificando, setVerificando] = useState(true);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [favoritando, setFavoritando] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingFavorite, setPendingFavorite] = useState(false);

  // Verificar se já se candidatou (apenas se estiver autenticado)
  useEffect(() => {
    async function verificar() {
      if (!id_vaga || authLoading) return;

      // Se não estiver autenticado, apenas marca como não verificando
      if (!isAuthenticated) {
        setVerificando(false);
        return;
      }

      try {
        const resultado = await verificarCandidatura(id_vaga);
        if (resultado) {
          setJaCandidatou(resultado.ja_candidatou);
          setCandidaturaStatus(resultado.ds_status || null);
        }
      } catch (error) {
        console.error("Erro ao verificar candidatura:", error);
      } finally {
        setVerificando(false);
      }
    }

    verificar();
  }, [id_vaga, isAuthenticated, authLoading]);

  const handleCandidatar = async () => {
    if (!cartaApresentacao.trim()) {
      toast.error("Por favor, escreva uma carta de apresentação");
      return;
    }

    if (cartaApresentacao.length < 100) {
      toast.error("A carta de apresentação deve ter pelo menos 100 caracteres");
      return;
    }

    setEnviandoCandidatura(true);

    try {
      await criarCandidatura({
        id_vaga,
        ds_carta_apresentacao: cartaApresentacao,
      });

      toast.success("Candidatura enviada com sucesso!");
      setJaCandidatou(true);
      setCandidaturaStatus("enviada");
      setCartaApresentacao("");
    } catch (error: any) {
      toast.error(error.message || "Erro ao enviar candidatura");
    } finally {
      setEnviandoCandidatura(false);
    }
  };

  const handleCompartilhar = async (tipo: "link" | "whatsapp" | "linkedin" | "email") => {
    const url = window.location.href;
    const titulo = `${vaga?.nm_cargo} - ${vaga?.nm_empresa}`;
    const texto = `Confira esta vaga: ${titulo}`;

    switch (tipo) {
      case "link":
        try {
          await navigator.clipboard.writeText(url);
          toast.success("Link copiado para a área de transferência!");
          setShowShareMenu(false);
        } catch (error) {
          toast.error("Erro ao copiar link");
        }
        break;

      case "whatsapp":
        window.open(
          `https://wa.me/?text=${encodeURIComponent(`${texto}\n${url}`)}`,
          "_blank"
        );
        setShowShareMenu(false);
        break;

      case "linkedin":
        window.open(
          `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
          "_blank"
        );
        setShowShareMenu(false);
        break;

      case "email":
        window.location.href = `mailto:?subject=${encodeURIComponent(titulo)}&body=${encodeURIComponent(`${texto}\n\n${url}`)}`;
        setShowShareMenu(false);
        break;
    }
  };

  const handleFavoritar = async () => {
    if (favoritando) return;

    // Verificar se está autenticado
    if (!isAuthenticated) {
      setPendingFavorite(true);
      setShowAuthModal(true);
      toast.info("Faça login para salvar vagas nos favoritos");
      return;
    }

    try {
      setFavoritando(true);

      const resultado = await toggleFavoritoVaga(id_vaga, isFavorito);

      toast.success(resultado.message);

      // Revalidar status
      await mutateFavorito();
    } catch (error: any) {
      console.error("Erro ao favoritar vaga:", error);
      toast.error(error.message || "Erro ao atualizar favoritos");
    } finally {
      setFavoritando(false);
    }
  };

  // Callback após login bem-sucedido
  const handleAuthSuccess = async () => {
    // Marcar que há favorito pendente para o useEffect executar
    setPendingFavorite(true);
  };

  // Effect para executar favorito após autenticação
  useEffect(() => {
    if (pendingFavorite && isAuthenticated && !authLoading) {
      const executarFavoritoPendente = async () => {
        try {
          setPendingFavorite(false);
          setFavoritando(true);

          // Aguardar 800ms para garantir que o token foi sincronizado pelo AuthTokenSync
          await new Promise(resolve => setTimeout(resolve, 800));

          const resultado = await toggleFavoritoVaga(id_vaga, false); // false porque ainda não está favoritado
          toast.success(resultado.message);
          await mutateFavorito();
        } catch (error: any) {
          console.error("Erro ao favoritar vaga após login:", error);
          toast.error(error.message || "Erro ao atualizar favoritos");
        } finally {
          setFavoritando(false);
        }
      };

      executarFavoritoPendente();
    }
  }, [pendingFavorite, isAuthenticated, authLoading, id_vaga]);

  if (loadingVaga || loadingCurriculo || verificando) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando vaga...</p>
        </div>
      </div>
    );
  }

  if (!vaga) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Vaga não encontrada</h2>
          <p className="text-gray-600 mb-6">A vaga que você está procurando não existe ou foi removida.</p>
          <Button onClick={() => router.push("/carreiras/vagas")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Vagas
          </Button>
        </div>
      </div>
    );
  }

  const salarioTexto = vaga.fg_salario_a_combinar
    ? "A combinar"
    : vaga.vl_salario_min && vaga.vl_salario_max
    ? `R$ ${vaga.vl_salario_min.toLocaleString()} - R$ ${vaga.vl_salario_max.toLocaleString()}`
    : vaga.vl_salario_min
    ? `A partir de R$ ${vaga.vl_salario_min.toLocaleString()}`
    : "Não informado";

  const tipoContratoLabel = {
    clt: "CLT",
    pj: "PJ",
    estagio: "Estágio",
    temporario: "Temporário",
    freelance: "Freelance",
  }[vaga.nm_tipo_contrato];

  const regimeTrabalhoLabel = {
    presencial: "Presencial",
    remoto: "Remoto",
    hibrido: "Híbrido",
  }[vaga.nm_regime_trabalho];

  const statusBadge = {
    enviada: { color: "bg-blue-100 text-blue-700", label: "Enviada" },
    em_analise: { color: "bg-yellow-100 text-yellow-700", label: "Em Análise" },
    entrevista_agendada: { color: "bg-purple-100 text-purple-700", label: "Entrevista Agendada" },
    aprovado: { color: "bg-green-100 text-green-700", label: "Aprovado" },
    reprovado: { color: "bg-red-100 text-red-700", label: "Reprovado" },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header com Breadcrumb */}
      <div className="bg-white border-b">
        <div className="container px-4 py-4 mx-auto max-w-7xl">
          <button
            onClick={() => router.push("/carreiras/vagas")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Vagas
          </button>

          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4 flex-1">
              {/* Logo */}
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                {vaga.ds_logo_empresa ? (
                  <img
                    src={vaga.ds_logo_empresa}
                    alt={vaga.nm_empresa}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <Building2 className="w-10 h-10 text-white" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {vaga.fg_destaque && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3 fill-yellow-400" />
                      Destaque
                    </span>
                  )}
                  <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full capitalize">
                    {vaga.nm_nivel}
                  </span>
                </div>

                <h1 className="text-3xl font-bold text-gray-900 mb-2">{vaga.nm_cargo}</h1>
                <p className="text-lg text-gray-700 mb-4">{vaga.nm_empresa}</p>

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {vaga.nm_cidade}, {vaga.nm_estado}
                    {vaga.fg_aceita_remoto && " • Remoto"}
                  </div>

                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    {tipoContratoLabel} • {regimeTrabalhoLabel}
                  </div>

                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span className="font-semibold text-gray-900">{salarioTexto}</span>
                  </div>

                  {vaga.nr_candidatos !== undefined && vaga.nr_candidatos > 0 && (
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      {vaga.nr_candidatos} candidato{vaga.nr_candidatos !== 1 ? "s" : ""}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Botão Compartilhar com Dropdown */}
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  onBlur={() => setTimeout(() => setShowShareMenu(false), 200)}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Compartilhar
                </Button>

                {showShareMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                    <button
                      onClick={() => handleCompartilhar("link")}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Link2 className="w-4 h-4" />
                      Copiar Link
                    </button>
                    <button
                      onClick={() => handleCompartilhar("whatsapp")}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                      </svg>
                      WhatsApp
                    </button>
                    <button
                      onClick={() => handleCompartilhar("linkedin")}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                      LinkedIn
                    </button>
                    <button
                      onClick={() => handleCompartilhar("email")}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Mail className="w-4 h-4" />
                      E-mail
                    </button>
                  </div>
                )}
              </div>

              {/* Botão Favoritar */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleFavoritar}
                disabled={favoritando}
                className={isFavorito ? "text-indigo-600 border-indigo-600" : ""}
              >
                {isFavorito ? (
                  <BookmarkCheck className="w-4 h-4 fill-indigo-600" />
                ) : (
                  <Bookmark className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container px-4 py-12 mx-auto max-w-7xl">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Resumo */}
            <section className="bg-white rounded-2xl p-8 border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Sobre a Vaga</h2>
              <p className="text-gray-700 leading-relaxed">{vaga.ds_resumo}</p>
            </section>

            {/* Responsabilidades */}
            <section className="bg-white rounded-2xl p-8 border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Responsabilidades</h2>
              <div className="prose prose-gray max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed">
                  {vaga.ds_responsabilidades}
                </pre>
              </div>
            </section>

            {/* Requisitos */}
            <section className="bg-white rounded-2xl p-8 border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Requisitos</h2>
              <div className="prose prose-gray max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed">
                  {vaga.ds_requisitos}
                </pre>
              </div>

              {vaga.ds_diferenciais && (
                <>
                  <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3">Diferenciais</h3>
                  <div className="prose prose-gray max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed">
                      {vaga.ds_diferenciais}
                    </pre>
                  </div>
                </>
              )}
            </section>

            {/* Habilidades */}
            {vaga.habilidades_requeridas && vaga.habilidades_requeridas.length > 0 && (
              <section className="bg-white rounded-2xl p-8 border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Habilidades Requeridas</h2>
                <div className="flex flex-wrap gap-2">
                  {vaga.habilidades_requeridas.map((habilidade, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-full"
                    >
                      {habilidade}
                    </span>
                  ))}
                </div>

                {vaga.habilidades_desejaveis && vaga.habilidades_desejaveis.length > 0 && (
                  <>
                    <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3">Habilidades Desejáveis</h3>
                    <div className="flex flex-wrap gap-2">
                      {vaga.habilidades_desejaveis.map((habilidade, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                        >
                          {habilidade}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </section>
            )}

            {/* Benefícios */}
            {vaga.ds_beneficios && vaga.ds_beneficios.length > 0 && (
              <section className="bg-white rounded-2xl p-8 border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Benefícios</h2>
                <div className="grid md:grid-cols-2 gap-3">
                  {vaga.ds_beneficios.map((beneficio, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-gray-700">{beneficio}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Card de Candidatura */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 sticky top-24">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Candidatar-se</h3>

              {jaCandidatou ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                  <h4 className="text-lg font-bold text-gray-900 mb-2">
                    Candidatura Enviada!
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Você já se candidatou para esta vaga.
                  </p>
                  {candidaturaStatus && statusBadge[candidaturaStatus as keyof typeof statusBadge] && (
                    <span
                      className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${
                        statusBadge[candidaturaStatus as keyof typeof statusBadge].color
                      }`}
                    >
                      Status: {statusBadge[candidaturaStatus as keyof typeof statusBadge].label}
                    </span>
                  )}
                  <Button
                    className="mt-4 w-full"
                    variant="outline"
                    onClick={() => router.push("/carreiras/minhas-candidaturas")}
                  >
                    Ver Minhas Candidaturas
                  </Button>
                </div>
              ) : !temCurriculo ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
                  <h4 className="text-lg font-bold text-gray-900 mb-2">
                    Currículo Necessário
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Você precisa cadastrar um currículo antes de se candidatar.
                  </p>
                  <Button
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                    onClick={() => router.push("/carreiras/cadastro-curriculo")}
                  >
                    Criar Currículo
                  </Button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-600 mb-4">
                    Escreva uma carta de apresentação explicando por que você é o candidato ideal para esta vaga.
                  </p>

                  <Textarea
                    placeholder="Prezados, tenho grande interesse nesta vaga porque..."
                    value={cartaApresentacao}
                    onChange={(e) => setCartaApresentacao(e.target.value)}
                    rows={8}
                    className="mb-2"
                  />

                  <p className="text-xs text-gray-500 mb-4">
                    {cartaApresentacao.length} / 5000 caracteres (mínimo 100)
                  </p>

                  <Button
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                    onClick={handleCandidatar}
                    disabled={enviandoCandidatura || cartaApresentacao.length < 100}
                  >
                    {enviandoCandidatura ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Enviar Candidatura
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>

            {/* Info da Vaga */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Informações da Vaga</h3>

              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-600">Número de Vagas:</span>
                  <span className="ml-2 font-semibold text-gray-900">{vaga.nr_vagas}</span>
                </div>

                {vaga.nr_anos_experiencia_min > 0 && (
                  <div>
                    <span className="text-gray-600">Experiência Mínima:</span>
                    <span className="ml-2 font-semibold text-gray-900">
                      {vaga.nr_anos_experiencia_min} ano{vaga.nr_anos_experiencia_min !== 1 ? "s" : ""}
                    </span>
                  </div>
                )}

                <div>
                  <span className="text-gray-600">Área:</span>
                  <span className="ml-2 font-semibold text-gray-900">{vaga.nm_area}</span>
                </div>

                <div>
                  <span className="text-gray-600">Publicada em:</span>
                  <span className="ml-2 font-semibold text-gray-900">
                    {new Date(vaga.dt_criacao).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </div>
            </div>

            {/* Vagas Similares */}
            {vagasSimilares && vagasSimilares.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Vagas Similares</h3>
                <div className="space-y-4">
                  {vagasSimilares.slice(0, 3).map((vagaSimilar) => (
                    <VagaCard key={vagaSimilar.id_vaga} vaga={vagaSimilar} showEmpresa />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Autenticação */}
      <AuthAccessModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        initialMode="login"
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
