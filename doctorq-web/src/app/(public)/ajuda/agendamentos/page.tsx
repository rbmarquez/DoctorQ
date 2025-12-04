"use client";

import { useState } from "react";
import { Calendar, ChevronDown, ChevronUp, Search, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LandingNav } from "@/components/landing/LandingNav";
import { Footer } from "@/components/landing/Footer";

export default function AjudaAgendamentosPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const articles = [
    {
      id: "1",
      title: "Como agendar uma consulta ou procedimento?",
      content: `
        <p><strong>Passo a passo para agendar:</strong></p>
        <ol>
          <li>Acesse a seção "Profissionais" ou "Serviços"</li>
          <li>Escolha o profissional ou procedimento desejado</li>
          <li>Clique em "Agendar" ou "Ver Horários"</li>
          <li>Selecione a data e horário disponíveis</li>
          <li>Confirme seus dados pessoais</li>
          <li>Escolha a forma de pagamento</li>
          <li>Finalize o agendamento</li>
        </ol>
        <p>Você receberá uma confirmação por e-mail e SMS com todos os detalhes.</p>
      `,
    },
    {
      id: "2",
      title: "Como remarcar um agendamento?",
      content: `
        <p><strong>Para remarcar sua consulta:</strong></p>
        <ol>
          <li>Acesse "Meus Agendamentos"</li>
          <li>Encontre o agendamento que deseja remarcar</li>
          <li>Clique em "Remarcar"</li>
          <li>Escolha uma nova data e horário disponíveis</li>
          <li>Confirme a alteração</li>
        </ol>
        <p><strong>Importante:</strong> Observe o prazo mínimo para remarcação, que varia conforme a política do profissional. Geralmente é necessário remarcar com pelo menos 24 horas de antecedência.</p>
      `,
    },
    {
      id: "3",
      title: "Como cancelar um agendamento?",
      content: `
        <p><strong>Para cancelar:</strong></p>
        <ol>
          <li>Acesse "Meus Agendamentos"</li>
          <li>Localize o agendamento</li>
          <li>Clique em "Cancelar"</li>
          <li>Confirme o cancelamento</li>
        </ol>
        <p><strong>Política de Cancelamento:</strong></p>
        <ul>
          <li>Cancelamento com mais de 24h: reembolso integral</li>
          <li>Cancelamento entre 12-24h: pode haver taxa de 50%</li>
          <li>Cancelamento com menos de 12h: sem reembolso</li>
          <li>Não comparecimento (no-show): sem reembolso + penalidade</li>
        </ul>
        <p>As políticas podem variar por profissional - verifique os termos antes de agendar.</p>
      `,
    },
    {
      id: "4",
      title: "O que fazer se eu não receber a confirmação?",
      content: `
        <p><strong>Se não recebeu a confirmação:</strong></p>
        <ol>
          <li>Verifique sua caixa de spam/lixo eletrônico</li>
          <li>Confirme se o e-mail/telefone cadastrado está correto</li>
          <li>Acesse "Meus Agendamentos" para verificar se o agendamento foi registrado</li>
          <li>Se necessário, entre em contato com o suporte</li>
        </ol>
        <p>Você também pode solicitar o reenvio da confirmação através do próprio agendamento.</p>
      `,
    },
    {
      id: "5",
      title: "Posso levar acompanhante?",
      content: `
        <p>Isso depende do tipo de procedimento e da política do profissional/clínica:</p>
        <ul>
          <li><strong>Consultas simples:</strong> Geralmente permitido</li>
          <li><strong>Procedimentos estéticos:</strong> Pode haver restrições por espaço</li>
          <li><strong>Procedimentos invasivos:</strong> Normalmente não é permitido durante o procedimento</li>
        </ul>
        <p>Recomendamos entrar em contato diretamente com o profissional para confirmar.</p>
      `,
    },
    {
      id: "6",
      title: "Preciso chegar com antecedência?",
      content: `
        <p><strong>Sim, recomendamos chegar com 15 minutos de antecedência</strong> para:</p>
        <ul>
          <li>Fazer o check-in</li>
          <li>Preencher documentação necessária</li>
          <li>Relaxar antes do procedimento</li>
          <li>Evitar atrasos</li>
        </ul>
        <p>Para procedimentos mais complexos ou primeira consulta, chegue com 20-30 minutos de antecedência.</p>
      `,
    },
    {
      id: "7",
      title: "O que acontece se eu me atrasar?",
      content: `
        <p><strong>Em caso de atraso:</strong></p>
        <ul>
          <li><strong>Até 10 minutos:</strong> Geralmente tolerado, mas pode reduzir o tempo de atendimento</li>
          <li><strong>10-15 minutos:</strong> Atendimento pode ser reduzido ou necessitar remarcação</li>
          <li><strong>Mais de 15 minutos:</strong> Profissional pode cancelar e cobrar taxa de no-show</li>
        </ul>
        <p><strong>Dica:</strong> Se souber que vai se atrasar, ligue imediatamente para avisar. Muitos profissionais são flexíveis se avisados com antecedência.</p>
      `,
    },
    {
      id: "8",
      title: "Como funcionam as consultas online?",
      content: `
        <p>Alguns profissionais oferecem teleconsultas:</p>
        <ol>
          <li>Agende normalmente e selecione "Consulta Online"</li>
          <li>No horário marcado, acesse "Meus Agendamentos"</li>
          <li>Clique em "Iniciar Consulta Online"</li>
          <li>Você será redirecionado para a sala virtual</li>
        </ol>
        <p><strong>Requisitos técnicos:</strong></p>
        <ul>
          <li>Conexão de internet estável</li>
          <li>Câmera e microfone funcionando</li>
          <li>Navegador atualizado (Chrome, Firefox, Safari)</li>
          <li>Ambiente privado e iluminado</li>
        </ul>
      `,
    },
    {
      id: "9",
      title: "Posso agendar para outra pessoa?",
      content: `
        <p><strong>Sim, você pode agendar para terceiros:</strong></p>
        <ol>
          <li>No momento do agendamento, marque "Agendar para outra pessoa"</li>
          <li>Informe os dados completos do paciente</li>
          <li>A confirmação será enviada para o e-mail do paciente</li>
        </ol>
        <p><strong>Importante:</strong> O paciente precisará apresentar documento com foto no dia da consulta. Para menores de idade, é obrigatória a presença do responsável legal.</p>
      `,
    },
    {
      id: "10",
      title: "Como visualizar meu histórico de agendamentos?",
      content: `
        <p><strong>Para acessar seu histórico:</strong></p>
        <ol>
          <li>Entre na sua conta</li>
          <li>Acesse "Meus Agendamentos"</li>
          <li>Use os filtros para ver agendamentos passados, futuros ou cancelados</li>
        </ol>
        <p>Você pode exportar seu histórico completo em PDF ou Excel para seus registros.</p>
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
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Ajuda com Agendamentos</h1>
              <p className="text-gray-600">Tudo sobre agendar, remarcar e cancelar consultas</p>
            </div>
          </div>
        </div>

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
            <h3 className="font-bold text-lg mb-2">Ainda tem dúvidas?</h3>
            <p className="text-gray-600 mb-4">Nossa equipe está pronta para ajudar</p>
            <div className="flex gap-3 justify-center">
              <Button className="bg-gradient-to-r from-purple-600 to-blue-600">Falar com Suporte</Button>
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
