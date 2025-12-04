"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, ArrowRight, Loader2, Receipt, Home } from "lucide-react";
import { usePayment } from "@/hooks/usePayment";

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { getPaymentStatus, loading } = usePayment();

  const [paymentData, setPaymentData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const paymentId = searchParams.get("payment_id") || searchParams.get("session_id");

    if (paymentId) {
      loadPaymentStatus(paymentId);
    }
  }, [searchParams]);

  const loadPaymentStatus = async (paymentId: string) => {
    const data = await getPaymentStatus(paymentId);
    if (data) {
      setPaymentData(data);
    } else {
      setError("Não foi possível carregar os detalhes do pagamento");
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando detalhes do pagamento...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-rose-50 p-6">
        <div className="max-w-md w-full rounded-3xl border border-red-100 bg-white p-8 shadow-lg text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <Receipt className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Ops!</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="w-full rounded-xl bg-red-600 px-6 py-3 text-white font-semibold hover:bg-red-700 transition-colors"
          >
            Voltar à Página Inicial
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-6">
      <div className="max-w-2xl w-full">
        {/* Card principal */}
        <div className="rounded-3xl border border-green-100 bg-white p-8 shadow-xl">
          {/* Header com ícone */}
          <div className="text-center mb-8">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg animate-bounce">
              <CheckCircle2 className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Pagamento Confirmado!
            </h1>
            <p className="text-gray-600">
              Seu pagamento foi processado com sucesso
            </p>
          </div>

          {/* Detalhes do pagamento */}
          {paymentData && (
            <div className="space-y-4 mb-8">
              <div className="rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-gray-600">Valor pago</span>
                  <span className="text-3xl font-bold text-green-600">
                    {formatCurrency(paymentData.vl_amount)}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">ID do Pagamento</span>
                    <span className="font-mono text-gray-900">{paymentData.id_pagamento}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Método</span>
                    <span className="font-semibold text-gray-900 uppercase">
                      {paymentData.ds_gateway}
                    </span>
                  </div>

                  {paymentData.ds_payer_email && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">E-mail</span>
                      <span className="text-gray-900">{paymentData.ds_payer_email}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Data</span>
                    <span className="text-gray-900">{formatDate(paymentData.dt_criacao)}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Status</span>
                    <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                      {paymentData.ds_status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Descrição */}
              {paymentData.ds_description && (
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Descrição:</span> {paymentData.ds_description}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Próximos passos */}
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6 mb-6">
            <h3 className="text-sm font-semibold text-blue-900 mb-3">Próximos passos</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>Você receberá um e-mail de confirmação em breve</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>Acompanhe o status do seu pedido na área de pagamentos</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>Em caso de dúvidas, entre em contato com o suporte</span>
              </li>
            </ul>
          </div>

          {/* Botões de ação */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="flex-1 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-3 text-white font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <ArrowRight className="h-5 w-5" />
              <span>Ir para Dashboard</span>
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
        <p className="text-center text-sm text-gray-500 mt-6">
          Precisa de ajuda? Entre em contato com nosso{" "}
          <a href="/suporte" className="text-green-600 hover:underline font-medium">
            suporte
          </a>
        </p>
      </div>
    </div>
  );
}
