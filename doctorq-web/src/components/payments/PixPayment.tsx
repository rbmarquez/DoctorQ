"use client";

import { useState } from "react";
import { QrCode, Copy, Check, Clock, Smartphone, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface PixPaymentProps {
  qrCode: string; // Código PIX copia e cola
  qrCodeBase64?: string; // Imagem do QR Code em base64
  amount: number;
  paymentId: string;
  ticketUrl?: string; // URL do ticket para visualizar no MercadoPago
}

export function PixPayment({
  qrCode,
  qrCodeBase64,
  amount,
  paymentId,
  ticketUrl,
}: PixPaymentProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyQRCode = async () => {
    try {
      await navigator.clipboard.writeText(qrCode);
      setCopied(true);
      toast.success("Código PIX copiado!");
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      toast.error("Erro ao copiar código");
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="w-full max-w-md rounded-3xl border border-blue-100 bg-white p-6 shadow-lg">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-lg">
          <QrCode className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Pague com PIX</h3>
          <p className="text-sm text-gray-500">Pagamento instantâneo</p>
        </div>
      </div>

      {/* Valor */}
      <div className="mb-6 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">Valor a pagar</span>
          <span className="text-3xl font-bold text-blue-600">{formatCurrency(amount)}</span>
        </div>
        <p className="mt-2 text-xs text-gray-500">ID: {paymentId}</p>
      </div>

      {/* QR Code */}
      <div className="mb-6 flex flex-col items-center gap-4">
        {qrCodeBase64 ? (
          <div className="rounded-2xl border-4 border-blue-100 bg-white p-4 shadow-lg">
            <img
              src={`data:image/png;base64,${qrCodeBase64}`}
              alt="QR Code PIX"
              className="h-64 w-64"
            />
          </div>
        ) : (
          <div className="flex h-64 w-64 items-center justify-center rounded-2xl border-4 border-dashed border-blue-200 bg-blue-50">
            <div className="text-center">
              <QrCode className="mx-auto h-16 w-16 text-blue-400 mb-2" />
              <p className="text-sm text-gray-500">Use o código abaixo</p>
            </div>
          </div>
        )}

        {/* Código PIX */}
        <div className="w-full">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Código PIX (Copia e Cola)
          </label>
          <div className="relative">
            <input
              type="text"
              value={qrCode}
              readOnly
              className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-12 text-xs font-mono focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <button
              onClick={handleCopyQRCode}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-blue-600 p-2 text-white hover:bg-blue-700 transition-colors"
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Instruções */}
      <div className="space-y-3 mb-6">
        <h4 className="text-sm font-semibold text-gray-900">Como pagar:</h4>

        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold text-sm flex-shrink-0">
            1
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Abra o app do seu banco</p>
            <p className="text-xs text-gray-500">Vá na área PIX do seu aplicativo</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold text-sm flex-shrink-0">
            2
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Escaneie o QR Code</p>
            <p className="text-xs text-gray-500">Ou copie e cole o código acima</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold text-sm flex-shrink-0">
            3
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Confirme o pagamento</p>
            <p className="text-xs text-gray-500">O pagamento é aprovado em até 10 segundos</p>
          </div>
        </div>
      </div>

      {/* Alertas */}
      <div className="space-y-3">
        <div className="flex items-start gap-2 rounded-xl bg-yellow-50 p-3">
          <Clock className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-yellow-900">Validade do código</p>
            <p className="text-xs text-yellow-700">
              Este código expira em 30 minutos. Pague o quanto antes!
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2 rounded-xl bg-blue-50 p-3">
          <Smartphone className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-blue-900">Pagamento instantâneo</p>
            <p className="text-xs text-blue-700">
              Após confirmar, você será notificado imediatamente
            </p>
          </div>
        </div>
      </div>

      {/* Link do ticket (opcional) */}
      {ticketUrl && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <a
            href={ticketUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            <span>Ver comprovante no MercadoPago</span>
          </a>
        </div>
      )}
    </div>
  );
}
