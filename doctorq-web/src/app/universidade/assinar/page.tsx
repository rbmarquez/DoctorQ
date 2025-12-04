/**
 * Página de Assinatura - Universidade da Beleza
 * Planos e preços com funcionalidades
 */
'use client';

import { useState } from 'react';
import { ArrowLeft, Check, Sparkles, Zap, Crown, X } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import PaymentModal from '@/components/universidade/PaymentModal';

export default function AssinarPage() {
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  // TODO: Pegar do contexto de autenticação
  const currentUser = {
    id: '65b34c1e-fabf-4d9e-83c4-0ea5e76aeab4', // Exemplo - deve vir da sessão
    email: 'usuario@exemplo.com',
    nome: 'Nome do Usuário',
    cpf: '00000000000',
  };

  // Planos de assinatura
  const planos = [
    {
      id: 'gratuito',
      nome: 'Gratuito',
      tipo_plano: 'gratuito',
      descricao: 'Para conhecer a plataforma',
      icone: Sparkles,
      preco: 0,
      precoAnual: 0,
      badge: '',
      popular: false,
      recursos: [
        'Acesso a 3 cursos básicos',
        '5 ebooks gratuitos',
        'Podcasts semanais',
        'Masterclasses gratuitas',
        'Comunidade no Discord',
        'Certificados básicos',
      ],
      limitacoes: [
        'Sem acesso a cursos avançados',
        'Sem IA Mentora (Dra. Sophie)',
        'Sem eventos pagos',
        'Sem metaverso',
      ],
    },
    {
      id: 'premium',
      nome: 'Premium Mensal',
      tipo_plano: 'mensal',
      descricao: 'Para profissionais em crescimento',
      icone: Zap,
      preco: 47.90,
      precoAnual: 0,
      badge: 'Mais Popular',
      popular: true,
      recursos: [
        'Acesso ilimitado a todos os cursos',
        'Biblioteca completa de ebooks',
        'Todos os podcasts e masterclasses',
        'IA Mentora 24/7 (Dra. Sophie)',
        'Eventos e webinars com desconto',
        'Certificados NFT (blockchain)',
        'Gamificação e rankings',
        'Comunidade exclusiva',
        'Suporte prioritário',
      ],
      limitacoes: [],
    },
    {
      id: 'trimestral',
      nome: 'Premium Trimestral',
      tipo_plano: 'trimestral',
      descricao: 'Economize 3 meses',
      icone: Zap,
      preco: 129.90,
      precoAnual: 0,
      badge: 'Economize',
      popular: false,
      recursos: [
        'Acesso ilimitado a todos os cursos',
        'Biblioteca completa de ebooks',
        'Todos os podcasts e masterclasses',
        'IA Mentora 24/7 (Dra. Sophie)',
        'Eventos e webinars com desconto',
        'Certificados NFT (blockchain)',
        'Gamificação e rankings',
        'Comunidade exclusiva',
        'Suporte prioritário',
      ],
      limitacoes: [],
    },
    {
      id: 'anual',
      nome: 'Premium Anual',
      tipo_plano: 'anual',
      descricao: 'Melhor custo-benefício',
      icone: Crown,
      preco: 479.90,
      precoAnual: 0,
      badge: 'Melhor Valor',
      popular: false,
      recursos: [
        'Tudo do Premium',
        'Até 10 usuários incluídos',
        'Dashboard de gestão de equipe',
        'Relatórios de progresso',
        'Eventos presenciais incluídos',
        'Acesso ao metaverso DoctorQ',
        'Consultoria mensal em grupo',
        'Networking com outras clínicas',
        'Materiais de marketing personalizados',
        'Gerente de sucesso dedicado',
      ],
      limitacoes: [],
    },
  ];

  // Handler para assinar plano
  const handleAssinar = (plano: typeof planos[0]) => {
    if (plano.id === 'gratuito') {
      alert('Plano Gratuito ativado! Crie sua conta para começar.');
      // TODO: Redirecionar para registro
    } else {
      setSelectedPlan(plano);
      setPaymentModalOpen(true);
    }
  };

  // Calcular economia anual
  const calcularEconomia = (precoMensal: number, precoAnual: number) => {
    if (precoMensal === 0) return 0;
    const totalMensal = precoMensal * 12;
    const economia = totalMensal - precoAnual;
    return economia;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="container mx-auto max-w-7xl px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/universidade">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Link>
            </Button>
          </div>

          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Escolha seu Plano</h1>
            <p className="text-xl text-muted-foreground mb-6">
              Invista na sua carreira com a melhor plataforma de educação estética do Brasil
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto max-w-7xl px-4 py-12">
        {/* Planos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {planos.map((plano) => {
            const Icone = plano.icone;

            return (
              <Card
                key={plano.id}
                className={`relative flex flex-col ${
                  plano.popular
                    ? 'border-primary shadow-xl scale-105 z-10'
                    : 'border-border'
                }`}
              >
                {/* Badge */}
                {plano.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge
                      variant="default"
                      className={`${
                        plano.popular
                          ? 'bg-primary'
                          : 'bg-secondary'
                      } text-white px-4 py-1`}
                    >
                      {plano.badge}
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-8 pt-8">
                  <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icone className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">{plano.nome}</CardTitle>
                  <CardDescription>{plano.descricao}</CardDescription>

                  {/* Preço */}
                  <div className="mt-6">
                    {plano.preco === 0 ? (
                      <div className="text-4xl font-bold">Grátis</div>
                    ) : (
                      <>
                        <div className="flex items-baseline justify-center gap-2">
                          <span className="text-2xl text-muted-foreground">R$</span>
                          <span className="text-5xl font-bold">{plano.preco.toFixed(2)}</span>
                          <span className="text-muted-foreground">
                            {plano.tipo_plano === 'mensal' && '/mês'}
                            {plano.tipo_plano === 'trimestral' && '/trimestre'}
                            {plano.tipo_plano === 'anual' && '/ano'}
                          </span>
                        </div>
                        {plano.tipo_plano === 'trimestral' && (
                          <div className="text-sm text-green-600 font-medium mt-2">
                            R$ {(plano.preco / 3).toFixed(2)}/mês
                          </div>
                        )}
                        {plano.tipo_plano === 'anual' && (
                          <div className="text-sm text-green-600 font-medium mt-2">
                            R$ {(plano.preco / 12).toFixed(2)}/mês
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="flex-1">
                  {/* Recursos incluídos */}
                  <div className="space-y-3">
                    {plano.recursos.map((recurso, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{recurso}</span>
                      </div>
                    ))}

                    {/* Limitações */}
                    {plano.limitacoes.length > 0 && (
                      <div className="pt-4 mt-4 border-t">
                        {plano.limitacoes.map((limitacao, index) => (
                          <div key={index} className="flex items-start gap-3 opacity-50">
                            <X className="h-5 w-5 flex-shrink-0 mt-0.5" />
                            <span className="text-sm">{limitacao}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>

                <CardFooter>
                  <Button
                    className="w-full"
                    size="lg"
                    variant={plano.popular ? 'default' : 'outline'}
                    onClick={() => handleAssinar(plano)}
                  >
                    {plano.id === 'gratuito' ? 'Começar Grátis' : 'Assinar Agora'}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* FAQ / Garantias */}
        <div className="mt-20 text-center">
          <h2 className="text-3xl font-bold mb-4">Garantia de 7 dias</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Experimente qualquer plano por 7 dias. Se não ficar satisfeito, devolvemos 100% do seu
            dinheiro, sem perguntas.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">✓ Sem permanência</CardTitle>
                <CardDescription>Cancele quando quiser, sem taxas</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">✓ Acesso imediato</CardTitle>
                <CardDescription>Comece a aprender hoje mesmo</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">✓ Suporte dedicado</CardTitle>
                <CardDescription>Atendimento rápido e humanizado</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>

        {/* Perguntas Frequentes */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center mb-8">Perguntas Frequentes</h2>
          <div className="max-w-3xl mx-auto space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Posso trocar de plano depois?</CardTitle>
                <CardDescription className="text-base mt-2">
                  Sim! Você pode fazer upgrade ou downgrade a qualquer momento. O valor é ajustado
                  proporcionalmente.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Os certificados têm validade?</CardTitle>
                <CardDescription className="text-base mt-2">
                  Todos os certificados são permanentes e verificáveis via blockchain (plano
                  Premium e Enterprise). Certificados básicos são em PDF.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Aceita quais formas de pagamento?</CardTitle>
                <CardDescription className="text-base mt-2">
                  Cartão de crédito, PIX, boleto bancário e PayPal. Planos anuais têm opção de
                  parcelamento em até 12x sem juros.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {selectedPlan && (
        <PaymentModal
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          plano={selectedPlan}
          idUsuario={currentUser.id}
          email={currentUser.email}
          nome={currentUser.nome}
          cpf={currentUser.cpf}
        />
      )}
    </div>
  );
}
