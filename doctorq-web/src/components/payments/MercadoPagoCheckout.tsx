"use client";

import { useState } from "react";
import { Wallet, Loader2, ShieldCheck, QrCode } from "lucide-react";
import { usePayment } from "@/hooks/usePayment";
import { PixPayment } from "./PixPayment";

interface MercadoPagoCheckoutProps {
  amount: number; // Valor em reais
  description: string;
  metadata?: Record<string, any>;
  onSuccess?: (paymentData: any) => void;
  onError?: (error: string) => void;
}

export function MercadoPagoCheckout({
  amount,
  description,
  metadata = {},
  onSuccess,
  onError,
}: MercadoPagoCheckoutProps) {
  const { createMercadoPagoPix, loading } = usePayment();
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [name, setName] = useState("");
  const [paymentType, setPaymentType] = useState<"pix" | null>(null);
  const [pixData, setPixData] = useState<any>(null);

  const handlePixPayment = async () => {
    if (!email || !cpf || !name) {
      onError?.("Por favor, preencha todos os campos");
      return;
    }

    const result = await createMercadoPagoPix({
      amount,
      description,
      payer_email: email,
      payer_cpf: cpf,
      payer_name: name,
      metadata,
    });

    if (result && result.success) {
      setPixData(result.data);
      setPaymentType("pix");
      onSuccess?.(result.data);
    } else {
      onError?.("Erro ao gerar pagamento PIX");
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatCPF = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{3})(\d{2})$/);
    if (match) {
      return `${match[1]}.${match[2]}.${match[3]}-${match[4]}`;
    }
    return cleaned;
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (raw.length <= 11) {
      setCpf(raw);
    }
  };

  // Se já tem dados do PIX, mostra componente PIX
  if (paymentType === "pix" && pixData) {
    return (
      <PixPayment
        qrCode={pixData.qr_code}
        qrCodeBase64={pixData.qr_code_base64}
        amount={amount}
        paymentId={pixData.id}
        ticketUrl={pixData.ticket_url}
      />
    );
  }

  return (
    <div className="w-full max-w-md rounded-3xl border border-blue-100 bg-white p-6 shadow-lg">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-lg">
          <Wallet className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Pagamento MercadoPago</h3>
          <p className="text-sm text-gray-500">PIX disponível</p>
        </div>
      </div>

      {/* Resumo do valor */}
      <div className="mb-6 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">Valor total</span>
          <span className="text-2xl font-bold text-blue-600">{formatCurrency(amount)}</span>
        </div>
        {description && (
          <p className="mt-2 text-xs text-gray-500">{description}</p>
        )}
      </div>

      {/* Formulário */}
      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Nome completo
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            placeholder="João da Silva"
            required
          />
        </div>

        <div>
          <label htmlFor="cpf" className="block text-sm font-medium text-gray-700 mb-2">
            CPF
          </label>
          <input
            type="text"
            id="cpf"
            value={formatCPF(cpf)}
            onChange={handleCPFChange}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            placeholder="000.000.000-00"
            maxLength={14}
            required
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            E-mail
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            placeholder="seu@email.com"
            required
          />
        </div>

        {/* Botão PIX */}
        <button
          onClick={handlePixPayment}
          disabled={loading || !email || !cpf || !name}
          className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-3 text-white font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Gerando PIX...</span>
            </>
          ) : (
            <>
              <QrCode className="h-5 w-5" />
              <span>Pagar com PIX {formatCurrency(amount)}</span>
            </>
          )}
        </button>

        {/* Informações de segurança */}
        <div className="flex items-start gap-2 rounded-xl bg-green-50 p-3">
          <ShieldCheck className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-green-900">Pagamento instantâneo</p>
            <p className="text-xs text-green-700">
              PIX é aprovado em até 10 segundos após o pagamento
            </p>
          </div>
        </div>

        {/* Logo MercadoPago */}
        <div className="flex items-center justify-center gap-2 pt-2 opacity-60">
          <span className="text-xs font-medium text-gray-500">Processado por</span>
          <span className="text-sm font-bold text-blue-600">MercadoPago</span>
        </div>
      </div>
    </div>
  );
}
