"use client";

import { Shield, Download, Printer } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LandingNav } from "@/components/landing/LandingNav";
import { Footer } from "@/components/landing/Footer";

export default function PoliticaPrivacidadePage() {
  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    alert("Baixando Política de Privacidade em PDF...");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-cyan-50 to-purple-50">
      <LandingNav />
      <main className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-cyan-600 to-purple-600 bg-clip-text text-transparent mb-3 flex items-center justify-center gap-2">
            <Shield className="h-10 w-10 text-purple-500" />
            Política de Privacidade
          </h1>
          <p className="text-gray-600 text-lg mb-4">
            Última atualização: 28 de Outubro de 2025
          </p>
          <div className="flex justify-center gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
            <Button variant="outline" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Baixar PDF
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6 prose prose-sm max-w-none">
            <h2>1. Introdução</h2>
            <p>
              A DoctorQ está comprometida com a proteção da privacidade e dos dados pessoais de seus
              usuários. Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e
              protegemos suas informações pessoais de acordo com a Lei Geral de Proteção de Dados
              (LGPD - Lei nº 13.709/2018).
            </p>

            <Separator className="my-6" />

            <h2>2. Dados Coletados</h2>
            <p>Coletamos os seguintes tipos de dados:</p>
            <h3>2.1. Dados Fornecidos por Você</h3>
            <ul>
              <li>Nome completo</li>
              <li>CPF</li>
              <li>Data de nascimento</li>
              <li>E-mail</li>
              <li>Telefone</li>
              <li>Endereço</li>
              <li>Foto de perfil (opcional)</li>
              <li>Informações de saúde (quando relevante para os serviços)</li>
            </ul>

            <h3>2.2. Dados Coletados Automaticamente</h3>
            <ul>
              <li>Endereço IP</li>
              <li>Tipo de navegador e dispositivo</li>
              <li>Sistema operacional</li>
              <li>Páginas visitadas</li>
              <li>Tempo de navegação</li>
              <li>Localização geográfica (com seu consentimento)</li>
            </ul>

            <h3>2.3. Cookies e Tecnologias Similares</h3>
            <p>
              Utilizamos cookies e tecnologias similares para melhorar sua experiência, analisar o uso
              da plataforma e personalizar conteúdo. Você pode gerenciar suas preferências de cookies
              nas configurações do navegador.
            </p>

            <Separator className="my-6" />

            <h2>3. Finalidade do Uso dos Dados</h2>
            <p>Utilizamos seus dados pessoais para:</p>
            <ul>
              <li>Criar e gerenciar sua conta na plataforma</li>
              <li>Processar agendamentos e pagamentos</li>
              <li>Comunicar sobre seus agendamentos e serviços</li>
              <li>Melhorar nossos serviços e funcionalidades</li>
              <li>Enviar comunicações de marketing (com seu consentimento)</li>
              <li>Cumprir obrigações legais e regulatórias</li>
              <li>Prevenir fraudes e garantir a segurança da plataforma</li>
              <li>Realizar análises estatísticas e de pesquisa</li>
            </ul>

            <Separator className="my-6" />

            <h2>4. Base Legal para Tratamento de Dados</h2>
            <p>Tratamos seus dados pessoais com base em:</p>
            <ul>
              <li><strong>Consentimento:</strong> Para finalidades específicas que requerem sua autorização</li>
              <li><strong>Execução de Contrato:</strong> Para fornecer os serviços solicitados</li>
              <li><strong>Obrigação Legal:</strong> Para cumprir com leis e regulamentos</li>
              <li><strong>Interesse Legítimo:</strong> Para melhorar nossos serviços e prevenir fraudes</li>
            </ul>

            <Separator className="my-6" />

            <h2>5. Compartilhamento de Dados</h2>
            <p>Podemos compartilhar seus dados com:</p>
            <ul>
              <li><strong>Profissionais de Estética:</strong> Quando você agenda serviços</li>
              <li><strong>Fornecedores:</strong> Para processar pagamentos e entregas</li>
              <li><strong>Prestadores de Serviços:</strong> Para análise de dados, hospedagem e suporte técnico</li>
              <li><strong>Autoridades:</strong> Quando exigido por lei ou para proteção legal</li>
            </ul>
            <p>
              Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros para fins de
              marketing sem seu consentimento explícito.
            </p>

            <Separator className="my-6" />

            <h2>6. Armazenamento e Segurança</h2>
            <p>
              Implementamos medidas técnicas e organizacionais para proteger seus dados contra acesso
              não autorizado, perda, destruição ou alteração, incluindo:
            </p>
            <ul>
              <li>Criptografia de dados em trânsito e em repouso</li>
              <li>Controles de acesso rigorosos</li>
              <li>Monitoramento contínuo de segurança</li>
              <li>Backups regulares</li>
              <li>Treinamento de funcionários em proteção de dados</li>
            </ul>
            <p>
              Seus dados são armazenados em servidores seguros localizados no Brasil, em conformidade
              com a LGPD.
            </p>

            <Separator className="my-6" />

            <h2>7. Retenção de Dados</h2>
            <p>
              Mantemos seus dados pessoais pelo tempo necessário para cumprir as finalidades descritas
              nesta política, ou conforme exigido por lei. Após esse período, seus dados serão excluídos
              ou anonimizados de forma segura.
            </p>

            <Separator className="my-6" />

            <h2>8. Seus Direitos (LGPD)</h2>
            <p>De acordo com a LGPD, você tem o direito de:</p>
            <ul>
              <li><strong>Confirmação:</strong> Saber se tratamos seus dados</li>
              <li><strong>Acesso:</strong> Obter cópia dos seus dados</li>
              <li><strong>Correção:</strong> Corrigir dados incompletos ou incorretos</li>
              <li><strong>Anonimização:</strong> Solicitar anonimização de dados desnecessários</li>
              <li><strong>Portabilidade:</strong> Receber seus dados em formato estruturado</li>
              <li><strong>Eliminação:</strong> Solicitar exclusão de dados tratados com consentimento</li>
              <li><strong>Revogação:</strong> Revogar consentimento a qualquer momento</li>
              <li><strong>Oposição:</strong> Se opor ao tratamento em certas circunstâncias</li>
            </ul>
            <p>
              Para exercer seus direitos, acesse Configurações &gt; Privacidade ou entre em contato com
              nosso Encarregado de Dados (DPO) através do e-mail: privacidade@doctorq.com.br
            </p>

            <Separator className="my-6" />

            <h2>9. Menores de Idade</h2>
            <p>
              Nossa plataforma não é direcionada a menores de 18 anos. Não coletamos intencionalmente
              dados de menores sem o consentimento dos pais ou responsáveis legais. Se identificarmos
              que coletamos dados de um menor sem consentimento adequado, tomaremos medidas para
              excluir essas informações.
            </p>

            <Separator className="my-6" />

            <h2>10. Transferência Internacional de Dados</h2>
            <p>
              Seus dados são armazenados e processados principalmente no Brasil. Se for necessário
              transferir dados para fora do país, garantiremos que haja proteções adequadas em vigor,
              conforme exigido pela LGPD.
            </p>

            <Separator className="my-6" />

            <h2>11. Alterações na Política</h2>
            <p>
              Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos sobre
              alterações significativas através da plataforma ou por e-mail. A data da última atualização
              estará sempre visível no topo deste documento.
            </p>

            <Separator className="my-6" />

            <h2>12. Contato</h2>
            <p>Para dúvidas sobre esta Política de Privacidade ou sobre o tratamento de seus dados:</p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="mb-1"><strong>DoctorQ Tecnologia Ltda.</strong></p>
              <p className="mb-1">CNPJ: 12.345.678/0001-90</p>
              <p className="mb-1">Av. Paulista, 1500 - São Paulo, SP</p>
              <p className="mb-1">E-mail: privacidade@doctorq.com.br</p>
              <p className="mb-1">Telefone: (11) 4000-1234</p>
              <p className="mt-3 mb-1"><strong>Encarregado de Dados (DPO):</strong></p>
              <p>E-mail: dpo@doctorq.com.br</p>
            </div>

            <Separator className="my-6" />

            <h2>13. Autoridade Nacional de Proteção de Dados (ANPD)</h2>
            <p>
              Se você não estiver satisfeito com a forma como tratamos seus dados ou com nossa resposta
              às suas solicitações, você tem o direito de apresentar uma reclamação à Autoridade Nacional
              de Proteção de Dados (ANPD).
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="mb-1"><strong>ANPD - Autoridade Nacional de Proteção de Dados</strong></p>
              <p className="mb-1">Website: www.gov.br/anpd</p>
              <p>E-mail: atendimento@anpd.gov.br</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Shield className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-1">Seu Consentimento</p>
                <p className="text-sm text-gray-700">
                  Ao usar nossa plataforma, você concorda com esta Política de Privacidade. Se você não
                  concordar com algum aspecto desta política, por favor, não use nossos serviços.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
