"use client";

import { useRouter } from "next/navigation";
import { XCircle, ArrowLeft, Home, HelpCircle } from "lucide-react";

export default function PaymentCancelledPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-6">
      <div className="max-w-2xl w-full">
        {/* Card principal */}
        <div className="rounded-3xl border border-orange-100 bg-white p-8 shadow-xl">
          {/* Header com ícone */}
          <div className="text-center mb-8">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-600 shadow-lg">
              <XCircle className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Pagamento Cancelado
            </h1>
            <p className="text-gray-600">
              Você cancelou o processo de pagamento
            </p>
          </div>

          {/* Mensagem informativa */}
          <div className="rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 p-6 mb-8">
            <p className="text-gray-700 text-center mb-4">
              Nenhuma cobrança foi realizada e seus dados estão seguros.
            </p>
            <p className="text-sm text-gray-600 text-center">
              Você pode tentar novamente a qualquer momento ou escolher outro método de pagamento.
            </p>
          </div>

          {/* Motivos comuns */}
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6 mb-6">
            <div className="flex items-start gap-3 mb-3">
              <HelpCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <h3 className="text-sm font-semibold text-blue-900">Por que o pagamento pode ter sido cancelado?</h3>
            </div>
            <ul className="space-y-2 text-sm text-blue-800 ml-8">
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>Você clicou em voltar ou cancelar durante o processo</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>Houve um problema temporário com o método de pagamento</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>O tempo da sessão de pagamento expirou</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>Decidiu revisar as informações antes de concluir</span>
              </li>
            </ul>
          </div>

          {/* Próximos passos */}
          <div className="rounded-2xl border border-purple-100 bg-purple-50 p-6 mb-6">
            <h3 className="text-sm font-semibold text-purple-900 mb-3">O que fazer agora?</h3>
            <ul className="space-y-2 text-sm text-purple-800">
              <li className="flex items-start gap-2">
                <span className="text-purple-600">•</span>
                <span>Tente novamente com o mesmo método de pagamento</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600">•</span>
                <span>Escolha um método de pagamento alternativo (PIX, cartão, etc)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600">•</span>
                <span>Verifique se há promoções ou cupons disponíveis</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600">•</span>
                <span>Entre em contato com o suporte se precisar de ajuda</span>
              </li>
            </ul>
          </div>

          {/* Botões de ação */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => router.back()}
              className="flex-1 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 px-6 py-3 text-white font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Tentar Novamente</span>
            </button>
            <button
              onClick={() => router.push("/")}
              className="flex-1 rounded-xl border border-gray-300 bg-white px-6 py-3 text-gray-700 font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <Home className="h-5 w-5" />
              <span>Página Inicial</span>
            </button>
          </div>
        </div>

        {/* Rodapé */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500 mb-2">
            Precisa de ajuda com seu pagamento?
          </p>
          <a
            href="/suporte"
            className="text-orange-600 hover:underline font-medium text-sm"
          >
            Fale com nosso suporte
          </a>
        </div>
      </div>
    </div>
  );
}
