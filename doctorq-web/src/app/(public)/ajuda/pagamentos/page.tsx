"use client";

import { useState } from "react";
import { CreditCard, ChevronDown, ChevronUp, Search, ArrowLeft, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LandingNav } from "@/components/landing/LandingNav";
import { Footer } from "@/components/landing/Footer";

export default function AjudaPagamentosPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const articles = [
    {
      id: "1",
      title: "Quais formas de pagamento são aceitas?",
      content: `
        <p>Aceitamos diversas formas de pagamento para sua conveniência:</p>
        <p><strong>Cartões de Crédito:</strong></p>
        <ul>
          <li>Visa, Mastercard, American Express, Elo, Hipercard</li>
          <li>Parcelamento em até 12x (consulte condições)</li>
          <li>Pagamento em 1x sem juros</li>
        </ul>
        <p><strong>Cartões de Débito:</strong></p>
        <ul>
          <li>Visa Débito, Mastercard Débito, Elo Débito</li>
          <li>Pagamento à vista</li>
        </ul>
        <p><strong>Outras Opções:</strong></p>
        <ul>
          <li>PIX (aprovação imediata)</li>
          <li>Boleto bancário (aprovação em até 3 dias úteis)</li>
          <li>Pagamento direto no estabelecimento (quando disponível)</li>
        </ul>
      `,
    },
    {
      id: "2",
      title: "É seguro salvar meus dados de pagamento?",
      content: `
        <p><strong>Sim, é totalmente seguro!</strong> Utilizamos as mais avançadas tecnologias de segurança:</p>
        <ul>
          <li><strong>Criptografia SSL/TLS:</strong> Seus dados são criptografados durante a transmissão</li>
          <li><strong>PCI DSS Compliance:</strong> Seguimos os mais rigorosos padrões da indústria de pagamentos</li>
          <li><strong>Tokenização:</strong> Não armazenamos dados completos do cartão, apenas tokens seguros</li>
          <li><strong>3D Secure:</strong> Autenticação adicional para maior segurança</li>
        </ul>
        <p>Seus dados são armazenados em servidores seguros e nunca são compartilhados com terceiros não autorizados.</p>
        <p><strong>Você pode:</strong></p>
        <ul>
          <li>Adicionar múltiplos cartões</li>
          <li>Remover cartões a qualquer momento</li>
          <li>Definir um cartão como padrão</li>
          <li>Ver últimos 4 dígitos de cada cartão salvo</li>
        </ul>
      `,
    },
    {
      id: "3",
      title: "Como funciona o parcelamento?",
      content: `
        <p><strong>Condições de Parcelamento:</strong></p>
        <ul>
          <li>Compras acima de R$ 100: até 3x sem juros</li>
          <li>Compras acima de R$ 300: até 6x sem juros</li>
          <li>Compras acima de R$ 500: até 10x sem juros</li>
          <li>Compras acima de R$ 1.000: até 12x sem juros</li>
        </ul>
        <p><strong>Importante:</strong></p>
        <ul>
          <li>A disponibilidade de parcelamento depende do valor total</li>
          <li>Alguns profissionais podem ter regras específicas</li>
          <li>Parcela mínima: R$ 50,00</li>
          <li>As parcelas são cobradas mensalmente no mesmo dia</li>
        </ul>
        <p>O número de parcelas disponíveis é exibido no momento do pagamento.</p>
      `,
    },
    {
      id: "4",
      title: "Quando serei cobrado?",
      content: `
        <p><strong>Cartão de Crédito:</strong></p>
        <ul>
          <li>A cobrança é processada imediatamente após a confirmação</li>
          <li>Aparecerá na sua fatura do cartão</li>
          <li>Para parcelamento, a primeira parcela é cobrada imediatamente</li>
        </ul>
        <p><strong>Cartão de Débito:</strong></p>
        <ul>
          <li>Débito instantâneo da conta corrente</li>
          <li>Confirmação imediata</li>
        </ul>
        <p><strong>PIX:</strong></p>
        <ul>
          <li>Pagamento em até 30 minutos após gerar o código</li>
          <li>Confirmação automática em segundos</li>
        </ul>
        <p><strong>Boleto:</strong></p>
        <ul>
          <li>Pague até a data de vencimento (geralmente 3 dias)</li>
          <li>Confirmação em até 3 dias úteis após o pagamento</li>
        </ul>
      `,
    },
    {
      id: "5",
      title: "Como solicitar reembolso?",
      content: `
        <p><strong>Passo a passo para solicitar reembolso:</strong></p>
        <ol>
          <li>Acesse "Meus Agendamentos" ou "Meus Pedidos"</li>
          <li>Localize o item que deseja reembolso</li>
          <li>Clique em "Solicitar Reembolso" ou "Cancelar"</li>
          <li>Informe o motivo (opcional mas recomendado)</li>
          <li>Aguarde a análise</li>
        </ol>
        <p><strong>Prazos de Reembolso:</strong></p>
        <ul>
          <li><strong>Análise:</strong> até 2 dias úteis</li>
          <li><strong>Processamento:</strong> até 5 dias úteis após aprovação</li>
          <li><strong>Crédito no cartão:</strong> 1-2 faturas (varia por banco)</li>
          <li><strong>PIX:</strong> 1-3 dias úteis</li>
        </ul>
        <p><strong>Políticas de Reembolso:</strong></p>
        <ul>
          <li>Cancelamento com 24h+: reembolso integral</li>
          <li>Cancelamento 12-24h: reembolso de 50%</li>
          <li>Cancelamento com menos de 12h: sem reembolso</li>
          <li>Produtos: 7 dias (direito de arrependimento)</li>
        </ul>
      `,
    },
    {
      id: "6",
      title: "O que fazer se meu pagamento foi recusado?",
      content: `
        <p><strong>Motivos comuns de recusa:</strong></p>
        <ul>
          <li>Saldo ou limite insuficiente</li>
          <li>Dados do cartão incorretos</li>
          <li>Cartão vencido ou bloqueado</li>
          <li>Problemas com o banco emissor</li>
          <li>Falha na autenticação 3D Secure</li>
        </ul>
        <p><strong>Soluções:</strong></p>
        <ol>
          <li><strong>Verifique os dados:</strong> Certifique-se de que número, validade e CVV estão corretos</li>
          <li><strong>Confira seu limite:</strong> Verifique se há saldo/limite disponível</li>
          <li><strong>Entre em contato com o banco:</strong> Confirme se o cartão está ativo e sem bloqueios</li>
          <li><strong>Tente outro cartão:</strong> Use uma forma de pagamento alternativa</li>
          <li><strong>Use PIX:</strong> Aprovação imediata e sem complicações</li>
        </ol>
        <p>Se o problema persistir, entre em contato com nosso suporte.</p>
      `,
    },
    {
      id: "7",
      title: "Como emitir nota fiscal?",
      content: `
        <p><strong>Nota Fiscal Eletrônica (NF-e):</strong></p>
        <ol>
          <li>Acesse "Meus Pedidos" ou "Meus Agendamentos"</li>
          <li>Localize a compra</li>
          <li>Clique em "Nota Fiscal"</li>
          <li>Baixe o PDF ou receba por e-mail</li>
        </ol>
        <p><strong>Informações importantes:</strong></p>
        <ul>
          <li>A nota é emitida automaticamente após a confirmação do pagamento</li>
          <li>Enviamos cópia por e-mail em até 24h</li>
          <li>Para alterar dados (CPF/CNPJ), entre em contato antes da emissão</li>
          <li>Notas antigas podem ser solicitadas por até 5 anos</li>
        </ul>
        <p><strong>Para empresas (CNPJ):</strong></p>
        <ul>
          <li>Informe o CNPJ no momento da compra</li>
          <li>Adicione observações fiscais se necessário</li>
          <li>A nota será emitida com todos os dados da empresa</li>
        </ul>
      `,
    },
    {
      id: "8",
      title: "Posso pagar diretamente no local?",
      content: `
        <p><strong>Depende do profissional/estabelecimento:</strong></p>
        <p><strong>Pagamento no Local Disponível:</strong></p>
        <ul>
          <li>Alguns profissionais permitem pagamento presencial</li>
          <li>Indicado com um ícone "💰 Aceita pagamento no local"</li>
          <li>Geralmente aceita dinheiro, cartão e PIX</li>
          <li>Pode ser necessário dar entrada antecipadamente</li>
        </ul>
        <p><strong>Vantagens do Pagamento Antecipado:</strong></p>
        <ul>
          <li>Garante seu horário</li>
          <li>Processo mais rápido no dia</li>
          <li>Possibilidade de parcelamento</li>
          <li>Acúmulo de pontos/cashback</li>
          <li>Proteção contra inadimplência</li>
        </ul>
        <p><strong>Como funciona:</strong></p>
        <ol>
          <li>Selecione "Pagamento no Local" no checkout</li>
          <li>Pague diretamente ao profissional no dia da consulta</li>
          <li>Solicite nota fiscal/recibo</li>
        </ol>
      `,
    },
    {
      id: "9",
      title: "Existe taxa de serviço?",
      content: `
        <p><strong>Transparência Total:</strong></p>
        <p>Sim, cobramos uma taxa de serviço para manter a plataforma funcionando e oferecer o melhor serviço:</p>
        <ul>
          <li><strong>Agendamentos:</strong> Taxa de R$ 5,00 a R$ 15,00 (dependendo do valor)</li>
          <li><strong>Produtos:</strong> Já incluído no preço final</li>
          <li><strong>Assinatura Premium:</strong> Sem taxas adicionais</li>
        </ul>
        <p><strong>O valor da taxa é sempre informado ANTES de finalizar:</strong></p>
        <ul>
          <li>Exibido claramente no resumo do pedido</li>
          <li>Nenhuma cobrança oculta</li>
          <li>Valor fixo, não percentual</li>
        </ul>
        <p><strong>Benefícios da taxa:</strong></p>
        <ul>
          <li>Suporte 24/7</li>
          <li>Proteção do pagamento</li>
          <li>Lembretes automáticos</li>
          <li>Sistema seguro e confiável</li>
          <li>Desenvolvimento contínuo</li>
        </ul>
      `,
    },
    {
      id: "10",
      title: "Como visualizar meu histórico de pagamentos?",
      content: `
        <p><strong>Acesso ao Histórico:</strong></p>
        <ol>
          <li>Entre na sua conta</li>
          <li>Acesse "Financeiro" ou "Pagamentos"</li>
          <li>Veja todas as transações realizadas</li>
        </ol>
        <p><strong>Informações Disponíveis:</strong></p>
        <ul>
          <li>Data e hora da transação</li>
          <li>Valor pago</li>
          <li>Forma de pagamento utilizada</li>
          <li>Status (aprovado, pendente, cancelado, reembolsado)</li>
          <li>Comprovante para download</li>
          <li>Nota fiscal quando disponível</li>
        </ul>
        <p><strong>Filtros Disponíveis:</strong></p>
        <ul>
          <li>Por período (data específica, mês, ano)</li>
          <li>Por status</li>
          <li>Por tipo (agendamento, produto, assinatura)</li>
          <li>Por valor</li>
        </ul>
        <p><strong>Exportação:</strong></p>
        <ul>
          <li>Exporte seu histórico em PDF ou Excel</li>
          <li>Útil para controle financeiro pessoal</li>
          <li>Pode ser usado para declaração de imposto de renda</li>
        </ul>
      `,
    },
  ];

  const filteredArticles = articles.filter(
    (article) =>
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-cyan-50 to-purple-50">
      <LandingNav />
      <main className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Link href="/ajuda" className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Voltar para Central de Ajuda
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Ajuda com Pagamentos</h1>
              <p className="text-gray-600">Formas de pagamento, reembolsos e segurança</p>
            </div>
          </div>
        </div>

        {/* Security Badge */}
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Shield className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-1">Pagamentos 100% Seguros</p>
                <p className="text-sm text-gray-700">
                  Utilizamos criptografia de ponta a ponta e seguimos os mais rigorosos padrões de segurança PCI DSS.
                  Seus dados estão protegidos!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Buscar nesta categoria..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div>
          <p className="text-sm text-gray-600 mb-4">
            {filteredArticles.length} {filteredArticles.length === 1 ? "artigo encontrado" : "artigos encontrados"}
          </p>

          <div className="space-y-3">
            {filteredArticles.map((article) => (
              <Card key={article.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <button
                    onClick={() => toggleExpand(article.id)}
                    className="w-full text-left flex items-center justify-between gap-4 group"
                  >
                    <h3 className="font-semibold text-lg group-hover:text-purple-600 transition-colors flex-1">
                      {article.title}
                    </h3>
                    {expandedId === article.id ? (
                      <ChevronUp className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    )}
                  </button>

                  {expandedId === article.id && (
                    <div
                      className="mt-4 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: article.content }}
                    />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA */}
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <CardContent className="pt-6 text-center py-8">
            <h3 className="font-bold text-lg mb-2">Problema com pagamento?</h3>
            <p className="text-gray-600 mb-4">Nossa equipe financeira está pronta para ajudar</p>
            <div className="flex gap-3 justify-center">
              <Button className="bg-gradient-to-r from-purple-600 to-blue-600">Falar com Suporte Financeiro</Button>
              <Button variant="outline" asChild>
                <Link href="/ajuda">Ver Todas as Categorias</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
