"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sparkles,
  TrendingUp,
  Users,
  Clock,
  ArrowRight,
  Star,
  ChevronDown,
  Zap,
  Shield,
  BarChart3,
  Headphones,
  Building2,
  UserCircle,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const appName = "DoctorQ";

type PartnerCategory = {
  id: string;
  icon: typeof Building2;
  title: string;
  description: string;
  image: string;
  gradient: string;
};

const partnerCategories: PartnerCategory[] = [
  {
    id: "clinicas",
    icon: Building2,
    title: "Clínicas de Saúde",
    description: "Sistema completo para gestão de agenda, pacientes e procedimentos",
    image: "🏥",
    gradient: "from-blue-500 to-rose-500",
  },
  {
    id: "profissionais",
    icon: UserCircle,
    title: "Profissionais Autônomos",
    description: "Ferramenta perfeita para esteticistas independentes",
    image: "👨‍⚕️",
    gradient: "from-purple-500 to-indigo-500",
  },
  {
    id: "fornecedores",
    icon: Package,
    title: "Fornecedores",
    description: "Conecte-se com milhares de clínicas em todo Brasil",
    image: "📦",
    gradient: "from-green-500 to-emerald-500",
  },
];

const benefits = [
  {
    icon: TrendingUp,
    title: "Aumente seu Faturamento",
    description: "Mais visibilidade = Mais clientes. Apareça para milhares de pacientes.",
  },
  {
    icon: Clock,
    title: "Economize Tempo",
    description: "Automatize agendamentos, lembretes e confirmações.",
  },
  {
    icon: BarChart3,
    title: "Gestão Inteligente",
    description: "Relatórios completos e insights para crescer seu negócio.",
  },
  {
    icon: Headphones,
    title: "Suporte Dedicado",
    description: "Time especializado pronto para te ajudar 7 dias por semana.",
  },
  {
    icon: Shield,
    title: "Segurança Total",
    description: "Seus dados e dos seus clientes 100% protegidos.",
  },
  {
    icon: Zap,
    title: "Integração Rápida",
    description: "Comece a usar em menos de 24 horas após o cadastro.",
  },
];

const steps = [
  {
    number: "01",
    title: "Cadastre-se Grátis",
    description: "Preencha seus dados e escolha o plano ideal para seu negócio",
  },
  {
    number: "02",
    title: "Configure seu Perfil",
    description: "Adicione fotos, serviços e horários disponíveis",
  },
  {
    number: "03",
    title: "Comece a Vender",
    description: "Receba pedidos e gerencie tudo pela plataforma",
  },
];

const testimonials = [
  {
    name: "Dra. Ana Paula Silva",
    role: "Dermatologista - São Paulo",
    image: "👩‍⚕️",
    rating: 5,
    text: "Em 3 meses aumentei minha carteira de clientes em 150%. A plataforma é incrível!",
  },
  {
    name: "Clínica Bella Vita",
    role: "Rede com 5 unidades - Rio de Janeiro",
    image: "🏥",
    rating: 5,
    text: "Centralizamos toda gestão das unidades. Economia de tempo e dinheiro visível!",
  },
  {
    name: "Carlos Eduardo Matos",
    role: "Esteticista Autônomo - Belo Horizonte",
    image: "👨‍⚕️",
    rating: 5,
    text: "Profissionalismo e praticidade. Meus clientes adoram agendar online!",
  },
];

const faqs = [
  {
    question: "Quanto custa para ser parceiro?",
    answer: "Temos planos a partir de R$ 149/mês com todos os recursos essenciais. Sem taxas escondidas!",
  },
  {
    question: "Preciso pagar para me cadastrar?",
    answer: "Não! O cadastro é 100% gratuito. Você só paga após escolher um plano e ativar sua conta.",
  },
  {
    question: "Quanto tempo leva para começar a usar?",
    answer: "Menos de 24 horas! Após aprovação do cadastro, você já pode começar a agendar e vender.",
  },
  {
    question: "Posso cancelar quando quiser?",
    answer: "Sim! Não há fidelidade. Você pode cancelar sua assinatura a qualquer momento.",
  },
  {
    question: "Como recebo os pagamentos?",
    answer: "Os pagamentos são processados automaticamente e depositados na sua conta em até 2 dias úteis.",
  },
];

export default function ParceirosPage() {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [modalStep, setModalStep] = useState<"email" | "type">("email");

  const handleStartRegistration = () => {
    // Etapa 1: Validar email
    if (modalStep === "email") {
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        toast.error("Por favor, informe um e-mail válido");
        return;
      }

      // Se já tem categoria selecionada (clicou em um card), pula para planos
      if (selectedCategory) {
        router.push(`/parceiros/novo?email=${encodeURIComponent(email)}&type=${selectedCategory}`);
        return;
      }

      // Se não tem categoria, vai para etapa de seleção de tipo
      setModalStep("type");
      return;
    }

    // Etapa 2: Validar tipo selecionado
    if (modalStep === "type") {
      if (!selectedCategory) {
        toast.error("Selecione o tipo de perfil para continuar");
        return;
      }

      // Redirecionar para página de cadastro com wizard completo
      router.push(`/parceiros/novo?email=${encodeURIComponent(email)}&type=${selectedCategory}`);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-blue-500" />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                {appName}
              </span>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <a href="#beneficios" className="text-gray-600 hover:text-blue-600 transition-colors">
                Benefícios
              </a>
              <a href="#como-funciona" className="text-gray-600 hover:text-blue-600 transition-colors">
                Como Funciona
              </a>
              <a href="#depoimentos" className="text-gray-600 hover:text-blue-600 transition-colors">
                Depoimentos
              </a>
              <a href="#faq" className="text-gray-600 hover:text-blue-600 transition-colors">
                FAQ
              </a>
              <Button variant="ghost" onClick={() => router.push('/login')}>
                Entrar
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-white py-20 lg:py-32">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-in fade-in slide-in-from-left duration-700">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full text-blue-700 text-sm font-medium">
                <Sparkles className="h-4 w-4" />
                Plataforma #1 para Saúde no Brasil
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Transforme seu
                <span className="block bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent">
                  Negócio de Saúde
                </span>
              </h1>

              <p className="text-xl text-gray-600 leading-relaxed">
                Junte-se a milhares de profissionais que já aumentaram seu faturamento
                com a plataforma mais completa do mercado.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg shadow-pink-500/50 text-lg h-14 px-8"
                  onClick={() => setModalOpen(true)}
                >
                  Cadastrar Agora
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-blue-200 hover:bg-blue-50 text-lg h-14 px-8"
                  onClick={() => {
                    document.getElementById('como-funciona')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Como Funciona
                </Button>
              </div>

              <div className="flex items-center gap-8 pt-4">
                <div>
                  <div className="text-3xl font-bold text-blue-600">+10.000</div>
                  <div className="text-sm text-gray-600">Parceiros ativos</div>
                </div>
                <div className="h-12 w-px bg-gray-300" />
                <div>
                  <div className="text-3xl font-bold text-purple-600">4.9★</div>
                  <div className="text-sm text-gray-600">Avaliação média</div>
                </div>
                <div className="h-12 w-px bg-gray-300" />
                <div>
                  <div className="text-3xl font-bold text-blue-600">+500</div>
                  <div className="text-sm text-gray-600">Cidades</div>
                </div>
              </div>
            </div>

            <div className="relative animate-in fade-in slide-in-from-right duration-700 delay-300">
              <div className="relative z-10 bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
                <div className="aspect-square bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center text-8xl">
                  💆‍♀️
                </div>

                {/* Floating cards */}
                <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-lg p-4 animate-bounce">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    <div>
                      <div className="text-sm font-semibold">+85%</div>
                      <div className="text-xs text-gray-500">Crescimento</div>
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-lg p-4 animate-pulse">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-500" />
                    <div>
                      <div className="text-sm font-semibold">2.5k</div>
                      <div className="text-xs text-gray-500">Novos Clientes/mês</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute top-1/4 -left-8 w-24 h-24 bg-blue-200 rounded-full blur-3xl opacity-60" />
              <div className="absolute bottom-1/4 -right-8 w-32 h-32 bg-purple-200 rounded-full blur-3xl opacity-60" />
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">
              Seja qual for seu perfil,
              <span className="block text-blue-600">temos o plano perfeito!</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Escolha a categoria que melhor representa seu negócio
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {partnerCategories.map((category, index) => {
              const Icon = category.icon;
              return (
                <div
                  key={category.id}
                  className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer border-2 border-transparent hover:border-blue-200"
                  style={{ animationDelay: `${index * 100}ms` }}
                  onClick={() => {
                    setSelectedCategory(category.id);
                    setModalOpen(true);
                  }}
                >
                  <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${category.gradient} rounded-t-2xl`} />

                  <div className="space-y-4">
                    <div className="text-5xl">{category.image}</div>

                    <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${category.gradient} bg-opacity-10`}>
                      <Icon className="h-6 w-6 text-blue-600" />
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        {category.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {category.description}
                      </p>
                    </div>

                    <div className="flex items-center text-blue-600 font-medium text-sm group-hover:gap-2 transition-all">
                      <span>Saiba mais</span>
                      <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="beneficios" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 rounded-full text-purple-700 text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              Por que escolher o {appName}?
            </div>
            <h2 className="text-3xl md:text-4xl font-bold">
              Benefícios que fazem
              <span className="block text-purple-600">a diferença</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={index}
                  className="flex gap-4 p-6 rounded-2xl hover:bg-purple-50 transition-colors duration-300"
                >
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-bold text-lg">{benefit.title}</h3>
                    <p className="text-gray-600">{benefit.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="como-funciona" className="py-20 bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">
              Como funciona?
              <span className="block text-blue-600">É muito simples!</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Em apenas 3 passos você estará pronto para crescer
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-16 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-blue-300 to-purple-300" />
                )}

                <div className="relative z-10 bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-shadow">
                  <div className="absolute -top-6 left-8">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-lg">
                      {step.number}
                    </div>
                  </div>

                  <div className="pt-8 space-y-4">
                    <h3 className="text-xl font-bold">{step.title}</h3>
                    <p className="text-gray-600">{step.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg text-lg h-14 px-8"
              onClick={() => setModalOpen(true)}
            >
              Começar Agora
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="depoimentos" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">
              Quem já usa,
              <span className="block text-blue-600">aprova!</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Veja o que nossos parceiros têm a dizer
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-8 space-y-4 hover:shadow-xl transition-shadow"
              >
                <div className="flex gap-1">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                <p className="text-gray-700 italic">&ldquo;{testimonial.text}&rdquo;</p>

                <div className="flex items-center gap-3 pt-4 border-t">
                  <div className="text-4xl">{testimonial.image}</div>
                  <div>
                    <div className="font-bold">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">
              Perguntas
              <span className="block text-blue-600">Frequentes</span>
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100"
              >
                <button
                  className="w-full px-6 py-5 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                >
                  <span className="font-semibold text-left">{faq.question}</span>
                  <ChevronDown
                    className={cn(
                      "h-5 w-5 text-blue-500 transition-transform flex-shrink-0 ml-4",
                      expandedFaq === index && "transform rotate-180"
                    )}
                  />
                </button>
                {expandedFaq === index && (
                  <div className="px-6 py-4 bg-blue-50 text-gray-700">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <h2 className="text-3xl md:text-5xl font-bold">
            Pronto para começar?
          </h2>
          <p className="text-xl text-blue-100">
            Junte-se a milhares de profissionais que já transformaram seus negócios
          </p>
          <Button
            size="lg"
            className="bg-white text-blue-600 hover:bg-gray-100 shadow-xl text-lg h-14 px-8"
            onClick={() => setModalOpen(true)}
          >
            Cadastrar Agora Grátis
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <p className="text-sm text-blue-100">
            ✓ Sem compromisso • ✓ Ativação em 24h • ✓ Suporte incluso
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-blue-500" />
                <span className="text-xl font-bold text-white">{appName}</span>
              </div>
              <p className="text-sm">
                A plataforma mais completa para gestão de saúde no Brasil.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">Produto</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-blue-500">Funcionalidades</a></li>
                <li><a href="#" className="hover:text-blue-500">Planos</a></li>
                <li><a href="#" className="hover:text-blue-500">Integrações</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">Empresa</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-blue-500">Sobre</a></li>
                <li><a href="#" className="hover:text-blue-500">Blog</a></li>
                <li><a href="#" className="hover:text-blue-500">Carreiras</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">Suporte</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-blue-500">Central de Ajuda</a></li>
                <li><a href="#" className="hover:text-blue-500">Contato</a></li>
                <li><a href="#" className="hover:text-blue-500">WhatsApp</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm">
              © 2025 {appName}. Todos os direitos reservados.
            </p>
            <div className="flex gap-4 text-sm">
              <a href="#" className="hover:text-blue-500">Privacidade</a>
              <a href="#" className="hover:text-blue-500">Termos</a>
              <a href="#" className="hover:text-blue-500">Cookies</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Registration Modal */}
      <Dialog
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) {
            // Reset modal ao fechar (apenas se não foi selecionado por card)
            setModalStep("email");
            // Não reseta email para facilitar correção de erros
            // Não reseta selectedCategory para manter seleção do card
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              {modalStep === "email" ? "Comece Agora!" : "Selecione seu Perfil"}
            </DialogTitle>
            <DialogDescription>
              {modalStep === "email"
                ? "Informe seu e-mail para iniciar o cadastro. É rápido e gratuito!"
                : "Escolha a opção que melhor representa seu negócio"
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {modalStep === "email" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail profissional</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleStartRegistration();
                      }
                    }}
                  />
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                  onClick={handleStartRegistration}
                >
                  Continuar
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                <p className="text-xs text-center text-gray-500">
                  Ao continuar, você concorda com nossos{' '}
                  <a href="/termos" className="text-blue-600 hover:underline">
                    Termos de Uso
                  </a>
                  {' '}e{' '}
                  <a href="/privacidade" className="text-blue-600 hover:underline">
                    Política de Privacidade
                  </a>
                </p>
              </>
            )}

            {modalStep === "type" && (
              <>
                <div className="grid grid-cols-3 gap-4">
                  {/* Clínica */}
                  <div
                    onClick={() => setSelectedCategory("clinicas")}
                    className={cn(
                      "cursor-pointer rounded-2xl border-2 p-6 transition-all hover:shadow-lg",
                      selectedCategory === "clinicas"
                        ? "border-blue-500 bg-blue-50 shadow-md"
                        : "border-gray-200 hover:border-blue-300"
                    )}
                  >
                    <div className="space-y-3 text-center">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-rose-500">
                        <Building2 className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">Clínica</h3>
                        <p className="text-xs text-gray-600 mt-1">
                          Gestão completa de agenda e pacientes
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Profissional */}
                  <div
                    onClick={() => setSelectedCategory("profissionais")}
                    className={cn(
                      "cursor-pointer rounded-2xl border-2 p-6 transition-all hover:shadow-lg",
                      selectedCategory === "profissionais"
                        ? "border-purple-500 bg-purple-50 shadow-md"
                        : "border-gray-200 hover:border-purple-300"
                    )}
                  >
                    <div className="space-y-3 text-center">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-indigo-500">
                        <UserCircle className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">Profissional</h3>
                        <p className="text-xs text-gray-600 mt-1">
                          Ferramenta para autônomos
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Fornecedor */}
                  <div
                    onClick={() => setSelectedCategory("fornecedores")}
                    className={cn(
                      "cursor-pointer rounded-2xl border-2 p-6 transition-all hover:shadow-lg",
                      selectedCategory === "fornecedores"
                        ? "border-green-500 bg-green-50 shadow-md"
                        : "border-gray-200 hover:border-green-300"
                    )}
                  >
                    <div className="space-y-3 text-center">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-green-500 to-emerald-500">
                        <Package className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">Fornecedor</h3>
                        <p className="text-xs text-gray-600 mt-1">
                          Marketplace de produtos
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setModalStep("email")}
                  >
                    Voltar
                  </Button>
                  <Button
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                    onClick={handleStartRegistration}
                    disabled={!selectedCategory}
                  >
                    Continuar
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>

                <p className="text-xs text-center text-gray-500">
                  Você poderá ajustar essa seleção posteriormente
                </p>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
