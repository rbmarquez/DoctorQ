"use client";

import { Cookie, Download, Printer } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CookiesPage() {
  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    alert("Baixando Política de Cookies em PDF...");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 py-12">
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-cyan-600 to-purple-600 bg-clip-text text-transparent mb-3 flex items-center justify-center gap-2">
            <Cookie className="h-10 w-10 text-purple-500" />
            Política de Cookies
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
            <h2>1. O que são Cookies?</h2>
            <p>
              Cookies são pequenos arquivos de texto armazenados no seu dispositivo quando
              você visita nosso site. Eles nos ajudam a melhorar sua experiência, lembrar
              suas preferências e entender como você usa nossos serviços.
            </p>

            <h2>2. Tipos de Cookies que Utilizamos</h2>

            <h3>2.1. Cookies Essenciais</h3>
            <p>
              Necessários para o funcionamento básico da plataforma. Incluem autenticação,
              segurança e preferências essenciais. Estes cookies não podem ser desativados.
            </p>

            <h3>2.2. Cookies de Desempenho</h3>
            <p>
              Coletam informações sobre como os visitantes usam nosso site, como páginas
              mais visitadas e mensagens de erro. Ajudam-nos a melhorar o funcionamento
              do site.
            </p>

            <h3>2.3. Cookies de Funcionalidade</h3>
            <p>
              Permitem que o site lembre de escolhas que você faz (como nome de usuário,
              idioma ou região) e fornecem recursos personalizados.
            </p>

            <h3>2.4. Cookies de Marketing</h3>
            <p>
              Usados para rastrear visitantes em websites com o objetivo de exibir anúncios
              relevantes e envolventes para o usuário individual.
            </p>

            <h2>3. Cookies de Terceiros</h2>
            <p>
              Utilizamos serviços de terceiros que podem definir cookies, incluindo:
            </p>
            <ul>
              <li><strong>Google Analytics:</strong> Para análise de tráfego e comportamento</li>
              <li><strong>Google OAuth:</strong> Para autenticação social</li>
              <li><strong>Microsoft Azure AD:</strong> Para autenticação corporativa</li>
              <li><strong>Stripe/MercadoPago:</strong> Para processamento de pagamentos</li>
            </ul>

            <h2>4. Como Gerenciar Cookies</h2>
            <p>
              Você pode controlar e/ou deletar cookies como desejar. Pode deletar todos
              os cookies que já estão no seu computador e configurar a maioria dos
              navegadores para impedir que sejam colocados.
            </p>

            <h3>Gerenciar por Navegador:</h3>
            <ul>
              <li><strong>Chrome:</strong> Configurações → Privacidade e segurança → Cookies</li>
              <li><strong>Firefox:</strong> Opções → Privacidade e Segurança → Cookies</li>
              <li><strong>Safari:</strong> Preferências → Privacidade → Cookies</li>
              <li><strong>Edge:</strong> Configurações → Cookies e permissões de site</li>
            </ul>

            <h2>5. Cookies Utilizados</h2>
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="text-left">Nome</th>
                  <th className="text-left">Tipo</th>
                  <th className="text-left">Duração</th>
                  <th className="text-left">Finalidade</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>next-auth.session-token</td>
                  <td>Essencial</td>
                  <td>30 dias</td>
                  <td>Autenticação do usuário</td>
                </tr>
                <tr>
                  <td>_ga</td>
                  <td>Analytics</td>
                  <td>2 anos</td>
                  <td>Google Analytics - Identificador único</td>
                </tr>
                <tr>
                  <td>_gid</td>
                  <td>Analytics</td>
                  <td>24 horas</td>
                  <td>Google Analytics - Sessões</td>
                </tr>
                <tr>
                  <td>doctorq_demo_user</td>
                  <td>Funcionalidade</td>
                  <td>7 dias</td>
                  <td>Mock user para testes</td>
                </tr>
              </tbody>
            </table>

            <h2>6. Atualizações desta Política</h2>
            <p>
              Podemos atualizar esta Política de Cookies periodicamente. A data da última
              atualização está sempre indicada no topo desta página.
            </p>

            <h2>7. Contato</h2>
            <p>
              Para questões sobre nossa Política de Cookies, entre em contato:
              <br />
              Email: privacy@doctorq.app
              <br />
              Telefone: (11) 9999-9999
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
