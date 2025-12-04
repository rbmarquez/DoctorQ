"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Loader2, Lock, CheckCircle2, AlertCircle, Eye, EyeOff, Sparkles } from "lucide-react";
import Link from "next/link";

function RedefinirSenhaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [passwordChanged, setPasswordChanged] = useState(false);

  const token = searchParams.get("token");

  // Validar token ao carregar
  useEffect(() => {
    if (!token) {
      setIsValidToken(false);
      toast.error("Link inválido ou expirado");
      return;
    }

    // Validar token com backend
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
    const apiKey = process.env.NEXT_PUBLIC_API_KEY;

    if (!baseUrl || !apiKey) {
      setIsValidToken(false);
      toast.error("Configuração inválida do ambiente. Tente novamente mais tarde.");
      return;
    }

    const validateToken = async () => {
      try {
        const response = await fetch(`${baseUrl}/users/validate-reset-token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();
        const isValid = response.ok && data.valid === true;
        setIsValidToken(isValid);

        if (!isValid) {
          toast.error(data.detail || "Token inválido ou expirado");
        }
      } catch (error) {
        console.error("Erro ao validar token:", error);
        setIsValidToken(false);
        toast.error("Erro ao validar token");
      }
    };

    validateToken();
  }, [token]);

  const validatePassword = () => {
    if (!password || !confirmPassword) {
      toast.error("Preencha todos os campos");
      return false;
    }

    if (password.length < 8) {
      toast.error("A senha deve ter no mínimo 8 caracteres");
      return false;
    }

    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return false;
    }

    // Validações adicionais de segurança
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      toast.error("A senha deve conter letras maiúsculas, minúsculas e números");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePassword()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Chamar API de reset-password
      const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
      const apiKey = process.env.NEXT_PUBLIC_API_KEY;

      if (!baseUrl || !apiKey) {
        toast.error("Configuração inválida do ambiente. Tente novamente mais tarde.");
        return;
      }

      const response = await fetch(`${baseUrl}/users/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          token,
          password,
          password_confirmation: confirmPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Erro ao redefinir senha");
      }

      setPasswordChanged(true);
      toast.success("Senha alterada com sucesso!");

      // Redirecionar para login após 3 segundos
      setTimeout(() => {
        router.replace("/login?message=Senha alterada com sucesso. Faça login com sua nova senha.");
      }, 3000);
    } catch (error: any) {
      console.error("Erro ao redefinir senha:", error);
      toast.error(error.message || "Erro ao redefinir senha. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPasswordStrength = () => {
    if (!password) return { strength: 0, label: "", color: "" };

    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    if (strength <= 2) return { strength, label: "Fraca", color: "bg-red-500" };
    if (strength <= 3) return { strength, label: "Média", color: "bg-yellow-500" };
    if (strength <= 4) return { strength, label: "Boa", color: "bg-blue-500" };
    return { strength, label: "Forte", color: "bg-green-500" };
  };

  const passwordStrength = getPasswordStrength();

  // Se token inválido
  if (isValidToken === false) {
    return (
      <>
        <Toaster />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 p-4">
          <Card className="w-full max-w-md border-2 border-red-200 shadow-2xl">
            <CardContent className="pt-6 text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Link Inválido ou Expirado</h2>
              <p className="text-gray-600">
                Este link de recuperação de senha é inválido ou já expirou.
              </p>
              <div className="space-y-2 pt-4">
                <Link href="/esqueci-senha">
                  <Button className="w-full bg-gradient-to-r from-blue-500 to-cyan-600">
                    Solicitar Novo Link
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" className="w-full">
                    Voltar para o Login
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  // Se senha já foi alterada
  if (passwordChanged) {
    return (
      <>
        <Toaster />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 p-4">
          <Card className="w-full max-w-md border-2 border-green-200 shadow-2xl">
            <CardContent className="pt-6 text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Senha Alterada!</h2>
              <p className="text-gray-600">
                Sua senha foi alterada com sucesso. Você será redirecionado para o login.
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Redirecionando...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <Toaster />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 p-4 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
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
            <p className="text-gray-600 font-medium">Redefinir senha</p>
          </div>

          <Card className="border-2 border-blue-200 shadow-2xl backdrop-blur-sm bg-white/95">
            <CardHeader className="text-center space-y-1 pb-4">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Nova Senha
              </CardTitle>
              <CardDescription className="text-sm text-gray-600">
                Crie uma senha forte para proteger sua conta
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Nova Senha */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                    Nova Senha
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-500" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Digite sua nova senha"
                      className="pl-10 pr-10 h-11 border-2 border-gray-200 focus:border-purple-400 focus:ring-purple-400"
                      required
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Password strength indicator */}
                  {password && (
                    <div className="space-y-1">
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full ${
                              i < passwordStrength.strength ? passwordStrength.color : "bg-gray-200"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-gray-600">
                        Força da senha: <span className="font-semibold">{passwordStrength.label}</span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirmar Senha */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700">
                    Confirmar Senha
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-500" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Digite a senha novamente"
                      className="pl-10 pr-10 h-11 border-2 border-gray-200 focus:border-purple-400 focus:ring-purple-400"
                      required
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Requirements */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-xs text-purple-900">
                  <p className="font-semibold mb-2">A senha deve conter:</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>No mínimo 8 caracteres</li>
                    <li>Letras maiúsculas e minúsculas</li>
                    <li>Pelo menos um número</li>
                    <li>Caracteres especiais (recomendado)</li>
                  </ul>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-blue-500 via-cyan-600 to-blue-500 hover:from-blue-600 hover:via-purple-700 hover:to-blue-600 text-white font-bold shadow-lg transition-all"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Alterando senha...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Redefinir Senha
                    </>
                  )}
                </Button>
              </form>

              <div className="pt-4 border-t border-gray-200 text-center">
                <Link href="/login" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                  Voltar para o login
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

export default function RedefinirSenhaPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <RedefinirSenhaContent />
    </Suspense>
  );
}
