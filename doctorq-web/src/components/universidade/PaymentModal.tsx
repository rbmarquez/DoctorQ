"use client";

import React, { useState, useEffect } from "react";
import { X, CreditCard, QrCode, Loader2 } from "lucide-react";

declare global {
  interface Window {
    MercadoPago: any;
  }
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  plano: {
    id: string;
    nome: string;
    preco: number;
    tipo_plano: string; // 'mensal', 'trimestral', 'anual'
  };
  idUsuario: string;
  email: string;
  nome?: string;
  cpf?: string;
}

type PaymentMethod = "pix" | "card";

export default function PaymentModal({
  isOpen,
  onClose,
  plano,
  idUsuario,
  email,
  nome = "",
  cpf = "",
}: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // PIX state
  const [pixData, setPixData] = useState<{
    qr_code?: string;
    qr_code_base64?: string;
    ticket_url?: string;
  } | null>(null);

  // Card state
  const [cardData, setCardData] = useState({
    cardNumber: "",
    cardholderName: "",
    expirationDate: "",
    securityCode: "",
    parcelas: 1,
  });

  const [mp, setMp] = useState<any>(null);

  // Initialize MercadoPago SDK
  useEffect(() => {
    if (isOpen && paymentMethod === "card" && !mp) {
      const script = document.createElement("script");
      script.src = "https://sdk.mercadopago.com/js/v2";
      script.async = true;
      script.onload = () => {
        // Use a public key here - should come from env
        const mercadopago = new window.MercadoPago(
          process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY || "APP_USR-seu-public-key-aqui"
        );
        setMp(mercadopago);
      };
      document.body.appendChild(script);
    }
  }, [isOpen, paymentMethod, mp]);

  const handlePixPayment = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:8081/pagamentos/assinatura/pix/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id_usuario: idUsuario,
          tipo_plano: plano.tipo_plano,
          email,
          nome,
          cpf,
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao criar pagamento PIX");
      }

      const result = await response.json();
      setPixData(result.data);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Erro ao processar pagamento");
    } finally {
      setLoading(false);
    }
  };

  const handleCardPayment = async () => {
    if (!mp) {
      setError("SDK do MercadoPago não carregado");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create card token
      const cardToken = await mp.createCardToken({
        cardNumber: cardData.cardNumber.replace(/\s/g, ""),
        cardholderName: cardData.cardholderName,
        cardExpirationMonth: cardData.expirationDate.split("/")[0],
        cardExpirationYear: "20" + cardData.expirationDate.split("/")[1],
        securityCode: cardData.securityCode,
        identificationType: "CPF",
        identificationNumber: cpf || "",
      });

      if (cardToken.error) {
        throw new Error(cardToken.error.message || "Erro ao tokenizar cartão");
      }

      // Send payment request to backend
      const response = await fetch("http://localhost:8081/pagamentos/assinatura/card/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id_usuario: idUsuario,
          tipo_plano: plano.tipo_plano,
          email,
          token: cardToken.id,
          parcelas: cardData.parcelas,
          nome: cardData.cardholderName || nome,
          cpf,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Erro ao processar pagamento");
      }

      const result = await response.json();

      if (result.data.status === "approved") {
        setSuccess(true);
        setTimeout(() => {
          window.location.reload(); // Reload to show active subscription
        }, 2000);
      } else if (result.data.status === "pending") {
        setError("Pagamento em análise. Aguarde a aprovação.");
      } else {
        setError(
          `Pagamento não aprovado: ${result.data.status_detail || "Verifique os dados do cartão"}`
        );
      }
    } catch (err: any) {
      setError(err.message || "Erro ao processar pagamento");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentMethod === "pix") {
      handlePixPayment();
    } else {
      handleCardPayment();
    }
  };

  const formatCardNumber = (value: string) => {
    return value
      .replace(/\s/g, "")
      .replace(/(\d{4})/g, "$1 ")
      .trim()
      .slice(0, 19);
  };

  const formatExpirationDate = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "$1/$2")
      .slice(0, 5);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Finalizar Assinatura</h2>
            <p className="text-gray-600 mt-1">
              Plano {plano.nome} - R$ {plano.preco.toFixed(2)}/mês
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Payment Method Tabs */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setPaymentMethod("card")}
              className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                paymentMethod === "card"
                  ? "border-purple-600 bg-purple-50 text-purple-700"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <CreditCard size={20} />
                <span className="font-medium">Cartão de Crédito</span>
              </div>
            </button>

            <button
              onClick={() => setPaymentMethod("pix")}
              className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                paymentMethod === "pix"
                  ? "border-purple-600 bg-purple-50 text-purple-700"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <QrCode size={20} />
                <span className="font-medium">PIX</span>
              </div>
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && paymentMethod === "card" && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
              ✓ Pagamento aprovado! Redirecionando...
            </div>
          )}

          {/* PIX Form */}
          {paymentMethod === "pix" && !pixData && (
            <div className="text-center py-8">
              <QrCode size={64} className="mx-auto mb-4 text-purple-600" />
              <h3 className="text-lg font-semibold mb-2">Pagamento via PIX</h3>
              <p className="text-gray-600 mb-6">
                Clique no botão abaixo para gerar o QR Code do PIX
              </p>
              <button
                onClick={handlePixPayment}
                disabled={loading}
                className="bg-purple-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="inline animate-spin mr-2" size={20} />
                    Gerando QR Code...
                  </>
                ) : (
                  "Gerar QR Code PIX"
                )}
              </button>
            </div>
          )}

          {/* PIX QR Code Display */}
          {paymentMethod === "pix" && pixData && (
            <div className="text-center py-8">
              <h3 className="text-lg font-semibold mb-4">Escaneie o QR Code para pagar</h3>
              {pixData.qr_code_base64 && (
                <img
                  src={`data:image/png;base64,${pixData.qr_code_base64}`}
                  alt="QR Code PIX"
                  className="mx-auto mb-4 max-w-xs"
                />
              )}
              {pixData.qr_code && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">Ou copie o código PIX:</p>
                  <div className="bg-gray-100 p-3 rounded-lg break-all text-sm font-mono">
                    {pixData.qr_code}
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(pixData.qr_code!);
                      alert("Código PIX copiado!");
                    }}
                    className="mt-3 text-purple-600 hover:text-purple-700 font-medium"
                  >
                    Copiar código PIX
                  </button>
                </div>
              )}
              <p className="mt-6 text-sm text-gray-600">
                Após o pagamento, sua assinatura será ativada automaticamente.
              </p>
            </div>
          )}

          {/* Card Form */}
          {paymentMethod === "card" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número do Cartão
                </label>
                <input
                  type="text"
                  value={cardData.cardNumber}
                  onChange={(e) =>
                    setCardData({ ...cardData, cardNumber: formatCardNumber(e.target.value) })
                  }
                  placeholder="0000 0000 0000 0000"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome no Cartão
                </label>
                <input
                  type="text"
                  value={cardData.cardholderName}
                  onChange={(e) =>
                    setCardData({ ...cardData, cardholderName: e.target.value.toUpperCase() })
                  }
                  placeholder="NOME COMPLETO"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Validade
                  </label>
                  <input
                    type="text"
                    value={cardData.expirationDate}
                    onChange={(e) =>
                      setCardData({
                        ...cardData,
                        expirationDate: formatExpirationDate(e.target.value),
                      })
                    }
                    placeholder="MM/AA"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">CVV</label>
                  <input
                    type="text"
                    value={cardData.securityCode}
                    onChange={(e) =>
                      setCardData({
                        ...cardData,
                        securityCode: e.target.value.replace(/\D/g, "").slice(0, 4),
                      })
                    }
                    placeholder="123"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Parcelas
                </label>
                <select
                  value={cardData.parcelas}
                  onChange={(e) =>
                    setCardData({ ...cardData, parcelas: parseInt(e.target.value) })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                >
                  {[1, 2, 3, 6, 12].map((n) => (
                    <option key={n} value={n}>
                      {n}x de R$ {(plano.preco / n).toFixed(2)}{" "}
                      {n === 1 ? "sem juros" : "sem juros"}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={loading || success}
                className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="inline animate-spin mr-2" size={20} />
                    Processando...
                  </>
                ) : (
                  `Pagar R$ ${plano.preco.toFixed(2)}`
                )}
              </button>

              <p className="text-xs text-gray-500 text-center">
                Pagamento seguro processado pelo MercadoPago
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
