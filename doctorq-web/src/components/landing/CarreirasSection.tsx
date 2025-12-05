"use client";

import Link from "next/link";
import {
  Briefcase,
  MapPin,
  Clock,
  DollarSign,
  TrendingUp,
  Heart,
  Users,
  Building2,
  Upload,
  Search,
  Star,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVagas } from "@/lib/api/hooks/useVagas";

export function CarreirasSection() {
  // Buscar vagas em destaque do banco de dados
  const { vagas, meta, isLoading, isError } = useVagas({
    fg_destaque: true,
    ds_status: "aberta",
    size: 4
  });

  // Função para formatar salário
  const formatarSalario = (min?: number, max?: number) => {
    if (!min && !max) return "A combinar";
    if (min && max) return `R$ ${min.toLocaleString("pt-BR")} - R$ ${max.toLocaleString("pt-BR")}`;
    if (min) return `A partir de R$ ${min.toLocaleString("pt-BR")}`;
    return `Até R$ ${max?.toLocaleString("pt-BR")}`;
  };

  // Função para obter cor do logo baseado no índice
  const getLogoColor = (index: number) => {
    const colors = [
      "bg-gradient-to-br from-rose-400 to-blue-600",
      "bg-gradient-to-br from-purple-400 to-indigo-600",
      "bg-gradient-to-br from-blue-400 to-cyan-600",
      "bg-gradient-to-br from-emerald-400 to-teal-600"
    ];
    return colors[index % colors.length];
  };

  // Função para gerar tags da vaga
  const getTags = (vaga: any) => {
    const tags = [];
    if (vaga.nm_regime_trabalho) {
      const regimeMap: Record<string, string> = {
        presencial: "Presencial",
        remoto: "Remoto",
        hibrido: "Híbrido"
      };
      tags.push(regimeMap[vaga.nm_regime_trabalho] || vaga.nm_regime_trabalho);
    }
    if (vaga.ds_beneficios && vaga.ds_beneficios.length > 0) {
      tags.push("Benefícios");
    }
    if (vaga.nm_nivel) {
      const nivelMap: Record<string, string> = {
        estagiario: "Estágio",
        junior: "Júnior",
        pleno: "Pleno",
        senior: "Sênior",
        especialista: "Especialista"
      };
      tags.push(nivelMap[vaga.nm_nivel] || vaga.nm_nivel);
    }
    return tags.slice(0, 3); // Máximo 3 tags
  };

  const benefits = [
    {
      icon: Heart,
      title: "Ambiente Inspirador",
      description: "Trabalhe em clínicas modernas e acolhedoras"
    },
    {
      icon: TrendingUp,
      title: "Crescimento Profissional",
      description: "Planos de carreira estruturados"
    },
    {
      icon: Users,
      title: "Time Qualificado",
      description: "Aprenda com os melhores profissionais"
    },
    {
      icon: Sparkles,
      title: "Tecnologia de Ponta",
      description: "Equipamentos modernos e inovadores"
    }
  ];

  // Stats dinâmicos (meta.totalItems é o total de vagas ativas)
  const stats = [
    { value: `${meta?.totalItems || 0}+`, label: "Vagas Ativas" },
    { value: "1.2K+", label: "Clínicas Parceiras" }, // TODO: Integrar com API de empresas
    { value: "15K+", label: "Currículos Cadastrados" }, // TODO: Integrar com API de currículos
    { value: "95%", label: "Taxa de Contratação" } // TODO: Integrar com analytics
  ];

  return (
    <section id="carreiras" className="py-24 bg-gradient-to-b from-white via-gray-50 to-white">
      <div className="container px-4 mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full mb-6">
            <Briefcase className="w-5 h-5 text-indigo-600" />
            <span className="text-sm font-semibold text-gray-700">
              Oportunidades de Carreira
            </span>
          </div>

          <h2 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
            Trabalhe no Mercado que{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Mais Cresce
            </span>
          </h2>

          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Conectamos profissionais talentosos com as melhores clínicas de saúde do Brasil.
            Encontre sua próxima oportunidade ou cadastre vagas da sua empresa.
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16 max-w-5xl mx-auto">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center hover:shadow-xl transition-shadow"
            >
              <div className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Two Action Cards */}
        <div className="grid lg:grid-cols-2 gap-8 mb-20 max-w-6xl mx-auto">
          {/* Card 1: Para Candidatos */}
          <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-700 p-1 shadow-2xl hover:shadow-indigo-500/50 transition-all duration-500">
            <div className="relative h-full bg-white rounded-[22px] p-8">
              <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full -translate-y-24 translate-x-24 opacity-50" />

              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl flex items-center justify-center mb-6">
                  <Search className="w-8 h-8 text-white" />
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Buscar Vagas
                </h3>

                <p className="text-gray-600 mb-6">
                  Encontre oportunidades nas melhores clínicas de saúde. Filtros inteligentes
                  por localização, salário e tipo de vaga.
                </p>

                <ul className="space-y-3 mb-8">
                  {[
                    "Vagas exclusivas e atualizadas diariamente",
                    "Candidatura rápida com currículo integrado",
                    "Notificações de vagas compatíveis",
                    "Processo seletivo transparente"
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle2 className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  size="lg"
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white"
                  asChild
                >
                  <Link href="/carreiras/vagas">
                    Explorar Vagas
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Card 2: Para Empresas */}
          <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-500 via-cyan-500 to-purple-600 p-1 shadow-2xl hover:shadow-rose-500/50 transition-all duration-500">
            <div className="relative h-full bg-white rounded-[22px] p-8">
              <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-rose-100 to-purple-100 rounded-full -translate-y-24 translate-x-24 opacity-50" />

              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6">
                  <Upload className="w-8 h-8 text-white" />
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Cadastrar Vagas
                </h3>

                <p className="text-gray-600 mb-6">
                  Encontre os melhores talentos para sua clínica. Gestão completa de vagas
                  e candidatos em uma plataforma integrada.
                </p>

                <ul className="space-y-3 mb-8">
                  {[
                    "Alcance 15.000+ profissionais qualificados",
                    "Triagem automática com IA",
                    "Dashboard de gestão de candidatos",
                    "Integração com seu sistema de RH"
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle2 className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  size="lg"
                  className="w-full bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white"
                  asChild
                >
                  <Link href="/clinica/vagas/nova">
                    Anunciar Vaga
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Jobs */}
        <div className="mb-20">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-3xl font-bold text-gray-900">Vagas em Destaque</h3>
            <Button variant="ghost" className="text-indigo-600 hover:text-indigo-700" asChild>
              <Link href="/carreiras/vagas">
                Ver Todas as Vagas
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              <span className="ml-3 text-gray-600">Carregando vagas...</span>
            </div>
          )}

          {/* Error State */}
          {isError && (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">Erro ao carregar vagas. Tente novamente mais tarde.</p>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Recarregar
              </Button>
            </div>
          )}

          {/* Vagas da API */}
          {!isLoading && !isError && vagas && vagas.length > 0 && (
            <div className="grid md:grid-cols-2 gap-6">
              {vagas.map((vaga, idx) => (
                <div
                  key={vaga.id_vaga}
                  className="group bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-2xl hover:border-indigo-300 transition-all duration-300 cursor-pointer"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`w-14 h-14 ${getLogoColor(idx)} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                      <Building2 className="w-7 h-7 text-white" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg font-bold text-gray-900 mb-1">
                        {vaga.nm_cargo}
                      </h4>
                      <p className="text-sm text-gray-600">{vaga.nm_empresa}</p>
                    </div>

                    <Star className="w-5 h-5 text-gray-300 hover:text-yellow-400 hover:fill-yellow-400 cursor-pointer transition-colors" />
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      {vaga.nm_cidade}, {vaga.nm_estado}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4 text-gray-400" />
                      {vaga.nm_tipo_contrato?.toUpperCase()} - {vaga.nm_regime_trabalho}
                    </div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      {formatarSalario(vaga.vl_salario_min, vaga.vl_salario_max)}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {getTags(vaga).map((tag, tagIdx) => (
                      <span
                        key={tagIdx}
                        className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <Link href={`/carreiras/vagas/${vaga.id_vaga}`}>
                    <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                      Candidatar-se
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !isError && vagas && vagas.length === 0 && (
            <div className="text-center py-12">
              <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Nenhuma vaga em destaque no momento.</p>
              <Button variant="outline" asChild>
                <Link href="/carreiras/vagas">Ver Todas as Vagas</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Benefits Section */}
        <div className="bg-gradient-to-br from-gray-900 to-indigo-900 rounded-3xl p-12 shadow-2xl">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-white mb-4">
              Por Que Trabalhar em Saúde?
            </h3>
            <p className="text-white/80 text-lg max-w-2xl mx-auto">
              O mercado de saúde é um dos que mais cresce no Brasil. Faça parte dessa transformação.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, idx) => (
              <div
                key={idx}
                className="text-center group"
              >
                <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-white/20 group-hover:scale-110 transition-all">
                  <benefit.icon className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-white font-bold text-lg mb-2">
                  {benefit.title}
                </h4>
                <p className="text-white/70 text-sm">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Button
              size="lg"
              className="bg-white text-indigo-600 hover:bg-gray-100 text-lg px-8 py-6 rounded-full shadow-xl"
              asChild
            >
              <Link href="/carreiras/sobre">
                Saiba Mais Sobre Carreiras
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
