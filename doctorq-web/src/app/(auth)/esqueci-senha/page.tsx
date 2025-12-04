"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Loader2, Mail, ArrowLeft, CheckCircle2, Sparkles } from "lucide-react";
import Link from "next/link";

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error("Por favor, informe seu email.");
      return;
    }

    // Validação básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Por favor, informe um email válido.");
      return;
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
    const apiKey = process.env.NEXT_PUBLIC_API_KEY;

    if (!baseUrl) {
      toast.error("Serviço indisponível. Verifique a configuração do ambiente (API URL).");
      return;
    }

    if (!apiKey) {
      toast.error("Serviço indisponível. Verifique a configuração do ambiente (API KEY).");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${baseUrl}/users/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        const message =
          payload?.message ||
          payload?.detail ||
          "Não foi possível enviar o email de recuperação.";
        throw new Error(message);
      }

      setEmailSent(true);
      toast.success("Enviamos um email com as instruções para redefinir sua senha.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao enviar email. Tente novamente.";
      console.error("Erro ao enviar email:", error);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Toaster />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 p-4 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-300/10 rounded-full blur-3xl" />
        </div>

        <div className="w-full max-w-md relative z-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 via-cyan-600 to-blue-500 shadow-xl">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent mb-2">
              {process.env.NEXT_PUBLIC_APP_NAME || "DoctorQ"}
            </h1>
            <p className="text-gray-600 font-medium">
              {emailSent ? "Verifique seu email" : "Recuperar senha"}
            </p>
          </div>

          <Card className="border-2 border-blue-200 shadow-2xl backdrop-blur-sm bg-white/95">
            <CardHeader className="text-center space-y-1 pb-4">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                {emailSent ? "Email Enviado!" : "Esqueceu sua senha?"}
              </CardTitle>
              <CardDescription className="text-sm text-gray-600">
                {emailSent
                  ? "Enviamos as instruções para seu email"
                  : "Não se preocupe, vamos te ajudar a recuperar"
                }
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {!emailSent ? (
                <>
                  <div className="text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p>
                      Digite seu email e enviaremos um link para redefinir sua senha.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                        Email
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="seu.email@exemplo.com"
                          className="pl-10 h-11 border-2 border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                          autoComplete="email"
                          required
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-11 bg-gradient-to-r from-blue-500 via-cyan-600 to-blue-500 hover:from-blue-600 hover:via-purple-700 hover:to-blue-600 text-white font-bold shadow-lg transition-all"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Mail className="mr-2 h-4 w-4" />
                          Enviar Link de Recuperação
                        </>
                      )}
                    </Button>
                  </form>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-col items-center justify-center py-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle2 className="w-8 h-8 text-green-600" />
                    </div>
                    <p className="text-center text-gray-700 mb-2">
                      Enviamos um email para:
                    </p>
                    <p className="text-center font-semibold text-blue-600 mb-4">
                      {email}
                    </p>
                    <p className="text-center text-sm text-gray-600">
                      Clique no link que enviamos para redefinir sua senha.
                      O link expira em 1 hora.
                    </p>
                  </div>

                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-2">
                    <p className="text-sm font-semibold text-purple-900">
                      Não recebeu o email?
                    </p>
                    <ul className="text-xs text-purple-700 space-y-1 list-disc list-inside">
                      <li>Verifique sua caixa de spam</li>
                      <li>Confirme se o email está correto</li>
                      <li>Aguarde alguns minutos</li>
                    </ul>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEmailSent(false);
                        setEmail("");
                      }}
                      className="w-full mt-2 border-purple-300 text-purple-700 hover:bg-purple-100"
                    >
                      Tentar outro email
                    </Button>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-gray-200">
                <Link href="/login">
                  <Button
                    variant="ghost"
                    className="w-full text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar para o login
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Help text */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Precisa de ajuda?{" "}
              <Link href="/contato" className="font-semibold text-blue-600 hover:text-purple-600 transition-colors">
                Entre em contato
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
