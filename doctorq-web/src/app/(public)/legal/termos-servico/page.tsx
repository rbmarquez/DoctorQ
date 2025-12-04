"use client";

import { FileText, Download, Printer } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function TermosServicoPage() {
  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    alert("Baixando Termos de Serviço em PDF...");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 py-12">
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-cyan-600 to-purple-600 bg-clip-text text-transparent mb-3 flex items-center justify-center gap-2">
            <FileText className="h-10 w-10 text-purple-500" />
            Termos de Serviço
          </h1>
          <p className="text-gray-600 text-lg mb-4">
            Última atualização: 30 de Outubro de 2025
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

        <Card className="border-2 border-blue-200 shadow-xl">
          <CardContent className="pt-6 prose prose-sm max-w-none">
            <h2>1. Aceitação dos Termos</h2>
            <p>
              Ao acessar e usar a plataforma DoctorQ, você concorda com estes Termos de Serviço.
              Se você não concorda com qualquer parte destes termos, não deve usar nossos serviços.
            </p>

            <h2>2. Descrição dos Serviços</h2>
            <p>
              A DoctorQ é uma plataforma SaaS de gestão para clínicas de estética que oferece:
            </p>
            <ul>
              <li>Sistema de agendamento online</li>
              <li>Gestão de pacientes e prontuários eletrônicos</li>
              <li>Marketplace de produtos e equipamentos</li>
              <li>Assistente com inteligência artificial</li>
              <li>Analytics e relatórios</li>
            </ul>

            <h2>3. Cadastro e Conta</h2>
            <p>
              Para usar nossos serviços, você deve criar uma conta fornecendo informações
              verdadeiras, precisas e completas. Você é responsável por manter a
              confidencialidade de sua senha.
            </p>

            <h2>4. Responsabilidades do Usuário</h2>
            <p>Você concorda em:</p>
            <ul>
              <li>Usar os serviços apenas para fins legais</li>
              <li>Não violar direitos de propriedade intelectual</li>
              <li>Não transmitir vírus ou código malicioso</li>
              <li>Respeitar a privacidade de outros usuários</li>
              <li>Manter suas informações de conta atualizadas</li>
            </ul>

            <h2>5. Propriedade Intelectual</h2>
            <p>
              Todo o conteúdo da plataforma DoctorQ, incluindo software, design, textos,
              gráficos e logotipos, é de propriedade exclusiva da DoctorQ e protegido por
              leis de direitos autorais e propriedade intelectual.
            </p>

            <h2>6. Planos e Pagamentos</h2>
            <p>
              A DoctorQ oferece diferentes planos de assinatura. Os preços e funcionalidades
              podem ser alterados mediante aviso prévio de 30 dias. O não pagamento pode
              resultar em suspensão ou cancelamento da conta.
            </p>

            <h2>7. Cancelamento e Reembolso</h2>
            <p>
              Você pode cancelar sua assinatura a qualquer momento. Reembolsos serão
              processados de acordo com nossa política de reembolso, disponível mediante
              solicitação ao suporte.
            </p>

            <h2>8. Limitação de Responsabilidade</h2>
            <p>
              A DoctorQ não se responsabiliza por danos indiretos, incidentais ou
              consequenciais resultantes do uso ou impossibilidade de uso dos serviços.
            </p>

            <h2>9. Modificações dos Termos</h2>
            <p>
              Reservamo-nos o direito de modificar estes termos a qualquer momento.
              Alterações significativas serão comunicadas por email com 30 dias de
              antecedência.
            </p>

            <h2>10. Lei Aplicável</h2>
            <p>
              Estes termos são regidos pelas leis da República Federativa do Brasil.
              Qualquer disputa será resolvida no foro da comarca de São Paulo, SP.
            </p>

            <h2>11. Contato</h2>
            <p>
              Para questões sobre estes Termos de Serviço, entre em contato:
              <br />
              Email: legal@doctorq.app
              <br />
              Telefone: (11) 9999-9999
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
