import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { LandingNav } from "@/components/landing/LandingNav";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { DEFAULT_PROFESSIONAL_PRODUCTS } from "@/constants/professional-products";
import type { ProfessionalProduct } from "@/types/professional-products";

type PageProps = {
  params: {
    id: string;
  };
};

const FALLBACK_IMAGE = "/images/placeholders/product-highlight.svg";

function getProductById(id: string): ProfessionalProduct | undefined {
  return DEFAULT_PROFESSIONAL_PRODUCTS.find((product) => product.id === id);
}

function getImageSrc(url?: string) {
  if (!url) return FALLBACK_IMAGE;
  if (url.startsWith("http") || url.startsWith("/")) return url;
  return FALLBACK_IMAGE;
}

export function generateMetadata({ params }: PageProps): Metadata {
  const product = getProductById(params.id);

  if (!product) {
    return {
      title: "Produto não encontrado | DoctorQ",
    };
  }

  return {
    title: `${product.name} | DoctorQ`,
    description: product.summary,
  };
}

export default function ProdutoDetalhePage({ params }: PageProps) {
  const product = getProductById(params.id);

  if (!product) {
    notFound();
  }

  const heroImage = getImageSrc(product.heroImage);
  const galleryImages = product.gallery?.length ? product.gallery : [heroImage];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-cyan-50 to-purple-50">
      <LandingNav />

      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-500">
              {product.category}
            </p>
            <h1 className="mt-2 text-4xl font-bold text-gray-900 md:text-5xl">{product.name}</h1>
            <p className="mt-4 max-w-2xl text-lg text-gray-600">{product.summary}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white">
              <Link href={`/marketplace/produtos?produto=${product.id}`}>Ver no marketplace</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/marketplace/produtos">Ver todos os produtos</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1.6fr,1fr]">
          <div className="space-y-6">
            <div className="relative overflow-hidden rounded-3xl bg-white shadow-lg">
              <Image
                src={heroImage}
                alt={product.name}
                width={1200}
                height={800}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {galleryImages.map((image, index) => (
                <div key={index} className="relative overflow-hidden rounded-2xl bg-white shadow">
                  <Image
                    src={getImageSrc(image)}
                    alt={`${product.name} galeria ${index + 1}`}
                    width={400}
                    height={300}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>

            <section className="space-y-4 rounded-3xl bg-white p-8 shadow-lg">
              <h2 className="text-2xl font-semibold text-gray-900">Descrição</h2>
              <p className="text-gray-700 leading-relaxed">{product.description}</p>
            </section>

            {product.keyBenefits?.length ? (
              <section className="space-y-4 rounded-3xl bg-white p-8 shadow-lg">
                <h2 className="text-2xl font-semibold text-gray-900">Benefícios</h2>
                <ul className="grid gap-3 md:grid-cols-2">
                  {product.keyBenefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-3 text-gray-700">
                      <span className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {product.technicalSpecs?.length ? (
              <section className="space-y-4 rounded-3xl bg-white p-8 shadow-lg">
                <h2 className="text-2xl font-semibold text-gray-900">Especificações Técnicas</h2>
                <dl className="grid gap-4 sm:grid-cols-2">
                  {product.technicalSpecs.map((spec) => (
                    <div key={spec.label} className="rounded-2xl border border-gray-100 p-4">
                      <dt className="text-sm font-semibold text-gray-500">{spec.label}</dt>
                      <dd className="mt-1 text-gray-800">{spec.value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ) : null}
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl bg-white p-8 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900">Resumo</h3>
              <div className="mt-4 space-y-3 text-sm text-gray-700">
                {product.ds_objetivo?.length ? (
                  <p>
                    <span className="font-semibold">Objetivos:</span> {product.ds_objetivo.join(", ")}
                  </p>
                ) : null}
                {typeof product.nr_tempo_procedimento_min === "number" ? (
                  <p>
                    <span className="font-semibold">Tempo médio:</span>{" "}
                    {product.nr_tempo_procedimento_min} min
                  </p>
                ) : null}
                {typeof product.nr_tempo_recuperacao_dias === "number" ? (
                  <p>
                    <span className="font-semibold">Recuperação:</span>{" "}
                    {product.nr_tempo_recuperacao_dias}{" "}
                    {product.nr_tempo_recuperacao_dias === 1 ? "dia" : "dias"}
                  </p>
                ) : null}
                {typeof product.vl_preco_medio_min === "number" ||
                typeof product.vl_preco_medio_max === "number" ? (
                  <p>
                    <span className="font-semibold">Faixa de preço:</span>{" "}
                    {product.vl_preco_medio_min ? `R$ ${product.vl_preco_medio_min}` : "sob consulta"}{" "}
                    {product.vl_preco_medio_max ? `- R$ ${product.vl_preco_medio_max}` : ""}
                  </p>
                ) : null}
              </div>

              <Button asChild className="mt-6 w-full bg-gradient-to-r from-blue-500 to-cyan-600 text-white">
                <Link href={`/marketplace/produtos?produto=${product.id}`}>
                  Ver disponibilidade
                </Link>
              </Button>
            </div>

            {product.suppliers?.length ? (
              <div className="space-y-4 rounded-3xl bg-white p-8 shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900">Fornecedores recomendados</h3>
                <div className="space-y-4">
                  {product.suppliers.map((supplier) => (
                    <div key={supplier.id} className="rounded-2xl border border-gray-100 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="text-base font-semibold text-gray-900">{supplier.name}</h4>
                          <p className="text-sm text-gray-600">{supplier.location}</p>
                        </div>
                        {typeof supplier.rating === "number" ? (
                          <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-600">
                            {supplier.rating.toFixed(1)}
                          </span>
                        ) : null}
                      </div>
                      {supplier.highlights?.length ? (
                        <ul className="mt-3 space-y-2 text-sm text-gray-600">
                          {supplier.highlights.slice(0, 3).map((highlight, index) => (
                            <li key={index} className="flex gap-2">
                              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-400" />
                              <span>{highlight}</span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      {supplier.website ? (
                        <Link
                          href={supplier.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-4 inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-700"
                        >
                          Visitar site →
                        </Link>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {product.resources?.length ? (
              <div className="space-y-4 rounded-3xl bg-white p-8 shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900">Recursos</h3>
                <ul className="space-y-3 text-sm">
                  {product.resources.map((resource) => (
                    <li key={resource.url}>
                      <Link
                        href={resource.url}
                        className="text-blue-600 hover:text-blue-700"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {resource.label} →
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
