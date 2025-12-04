import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Clock,
  Heart,
  MapPin,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import { getProcedureById, PROCEDURES_CATALOG } from "../data";

type ProcedurePageProps = {
  params: {
    id: string;
  };
};

export function generateStaticParams() {
  return PROCEDURES_CATALOG.map((procedure) => ({ id: procedure.id }));
}

export function generateMetadata({ params }: ProcedurePageProps): Metadata {
  const procedure = getProcedureById(params.id);

  if (!procedure) {
    return {
      title: "Procedimento não encontrado • DoctorQ",
    };
  }

  return {
    title: `${procedure.nome} • DoctorQ`,
    description: procedure.resumo,
    openGraph: {
      title: procedure.nome,
      description: procedure.resumo,
      images: [
        {
          url: procedure.imagem,
          alt: procedure.nome,
        },
      ],
    },
  };
}

export default function ProcedureDetailPage({ params }: ProcedurePageProps) {
  const procedure = getProcedureById(params.id);

  if (!procedure) {
    notFound();
  }

  const currencyFormatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: procedure.preco.moeda,
    minimumFractionDigits: 2,
  });

  const basePrice = currencyFormatter.format(procedure.preco.valorBase);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-cyan-50 pb-16">
      <header className="sticky top-0 z-40 border-b border-blue-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center space-x-2">
            <span className="bg-gradient-to-r from-blue-500 to-cyan-600 bg-clip-text text-xl font-semibold text-transparent">
              DoctorQ
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/busca">Voltar para a busca</Link>
            </Button>
            <Button
              className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg shadow-pink-200/60 hover:from-blue-600 hover:to-cyan-700"
              asChild
            >
              <Link href={`/agendamento/tipo-visita?procedimentoId=${procedure.id}`}>
                Agendar agora
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto mt-12 w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <Link
          href="/busca"
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-blue-600 transition hover:text-purple-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para resultados
        </Link>

        <div className="grid gap-10 lg:grid-cols-[2fr,1fr]">
          <article className="space-y-10">
            <div className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-xl shadow-pink-100/40">
              <div className="relative h-72 w-full sm:h-96">
                <Image
                  src={procedure.imagem}
                  alt={procedure.nome}
                  fill
                  priority
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
                <div className="absolute bottom-6 left-6 right-6 flex flex-col gap-4 text-white md:flex-row md:items-center md:justify-between">
                  <div>
                    <h1 className="text-3xl font-bold md:text-4xl">{procedure.nome}</h1>
                    <p className="mt-2 max-w-2xl text-base md:text-lg">{procedure.resumo}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="inline-flex items-center rounded-full bg-white/20 px-4 py-2 text-sm font-semibold backdrop-blur">
                      <Star className="mr-2 h-4 w-4 text-yellow-300" fill="currentColor" />
                      {procedure.avaliacao.toFixed(1)} ({procedure.totalAvaliacoes} avaliações)
                    </span>
                    <span className="inline-flex items-center rounded-full bg-white/20 px-4 py-2 text-sm font-semibold backdrop-blur">
                      <MapPin className="mr-2 h-4 w-4" />
                      {procedure.localizacao}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 p-6 md:grid-cols-2">
                <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-6">
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-blue-500" />
                    <h2 className="text-lg font-semibold text-gray-900">
                      Benefícios e diferenciais
                    </h2>
                  </div>
                  <ul className="mt-4 space-y-3 text-sm text-gray-600">
                    {procedure.beneficios.map((beneficio) => (
                      <li key={beneficio} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 text-purple-500" />
                        <span>{beneficio}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border border-purple-100 bg-white p-6">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-purple-500" />
                    <h2 className="text-lg font-semibold text-gray-900">Para quem é indicado</h2>
                  </div>
                  <ul className="mt-4 space-y-3 text-sm text-gray-600">
                    {procedure.indicadoPara.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <Heart className="mt-0.5 h-4 w-4 text-blue-500" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="space-y-6 border-t border-gray-100 px-6 py-8">
                <section>
                  <h2 className="text-xl font-semibold text-gray-900">Como o procedimento funciona</h2>
                  <p className="mt-3 text-base leading-relaxed text-gray-600">
                    {procedure.descricaoCompleta}
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-gray-900">Etapas do protocolo</h3>
                  <ol className="mt-4 space-y-3 text-sm text-gray-600">
                    {procedure.etapas.map((step, index) => (
                      <li key={step} className="flex gap-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-xs font-semibold text-white">
                          {index + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-gray-900">Cuidados pós-procedimento</h3>
                  <ul className="mt-4 grid gap-3 text-sm text-gray-600 sm:grid-cols-2">
                    {procedure.cuidadosPosProcedimento.map((care) => (
                      <li key={care} className="flex items-start gap-2 rounded-xl bg-purple-50/60 p-3">
                        <ShieldCheck className="mt-0.5 h-4 w-4 text-purple-500" />
                        <span>{care}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-gray-900">Materiais utilizados</h3>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {procedure.materiaisUtilizados.map((material) => (
                      <span
                        key={material}
                        className="rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-blue-600"
                      >
                        {material}
                      </span>
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-gray-900">Perguntas frequentes</h3>
                  <div className="mt-4 space-y-4">
                    {procedure.faqs.map((faq) => (
                      <div key={faq.pergunta} className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
                        <p className="text-sm font-semibold text-gray-900">{faq.pergunta}</p>
                        <p className="mt-2 text-sm text-gray-600">{faq.resposta}</p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>

            <section className="rounded-3xl border border-purple-100 bg-white p-6 shadow-xl shadow-purple-100/40">
              <div className="flex items-center gap-3">
                <CalendarClock className="h-5 w-5 text-purple-500" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Profissionais recomendados
                </h2>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                Profissionais certificados pela DoctorQ com experiência no protocolo.
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {procedure.profissionaisRecomendados.map((professional) => (
                  <div
                    key={professional.id}
                    className="flex flex-col rounded-2xl border border-gray-100 bg-gradient-to-br from-white via-purple-50 to-blue-50 p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-base font-semibold text-gray-900">{professional.nome}</p>
                        <p className="text-sm text-purple-600">{professional.especialidade}</p>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-purple-600 shadow-sm">
                        <Star className="h-3.5 w-3.5 text-yellow-400" fill="currentColor" />
                        {professional.avaliacao.toFixed(1)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">{professional.experiencia}</p>
                    <p className="mt-3 text-xs font-medium text-gray-500">
                      {professional.totalAvaliacoes} avaliações verificadas
                    </p>
                    <Button
                      asChild
                      variant="outline"
                      className="mt-4 border-blue-200 text-blue-600 hover:bg-blue-50"
                    >
                      <Link href={`/profissionais/${professional.id}`}>Ver perfil</Link>
                    </Button>
                  </div>
                ))}
              </div>
            </section>
          </article>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-blue-100 bg-white/80 p-6 shadow-xl shadow-pink-100/50 backdrop-blur">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-semibold text-gray-900">Informações rápidas</h3>
              </div>

              <div className="mt-4 space-y-4 text-sm text-gray-600">
                <div className="flex items-center gap-3 rounded-2xl bg-blue-50/80 p-3">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="font-semibold text-gray-900">Duração média</p>
                    <p>{procedure.duracaoMinutos} minutos</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-2xl bg-purple-50/70 p-3">
                  <Heart className="h-4 w-4 text-purple-500" />
                  <div>
                    <p className="font-semibold text-gray-900">Preço base</p>
                    <p>{basePrice}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-dashed border-purple-200 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-purple-500">
                    Planos e pacotes
                  </p>
                  <ul className="mt-2 space-y-2">
                    {procedure.preco.pacotes?.map((pacote) => (
                      <li key={pacote.nome} className="text-sm text-gray-600">
                        <span className="font-semibold text-gray-900">
                          {currencyFormatter.format(pacote.valor)}
                        </span>{" "}
                        — {pacote.nome}
                        <br />
                        <span className="text-xs text-gray-500">{pacote.descricao}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg hover:from-blue-600 hover:to-cyan-700"
                  asChild
                >
                  <Link href={`/agendamento/tipo-visita?procedimentoId=${procedure.id}`}>
                    Reservar com especialista
                  </Link>
                </Button>
              </div>
            </div>

            <div className="rounded-3xl border border-purple-100 bg-white/80 p-6 shadow-lg shadow-purple-100/50 backdrop-blur">
              <h3 className="text-lg font-semibold text-gray-900">Por que agendar com a DoctorQ?</h3>
              <ul className="mt-4 space-y-3 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 text-purple-500" />
                  <span>Profissionais verificados e protocolos padronizados.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Sparkles className="mt-0.5 h-4 w-4 text-blue-500" />
                  <span>Registro fotográfico e evolução no prontuário digital.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Heart className="mt-0.5 h-4 w-4 text-rose-500" />
                  <span>Suporte ao paciente com orientações personalizadas.</span>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
