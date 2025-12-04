"use client";

import { signIn, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Loader2, Brain, Mail, Lock, AlertCircle, Sparkles, Home } from "lucide-react";
import Link from "next/link";
import { useUserType } from "@/contexts/UserTypeContext";
import { getDashboardRoute } from "@/lib/auth-utils";
import { UserType } from "@/types/auth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function LoginContent() {
  const { data: session, status } = useSession();
  const { user: contextUser, login: contextLogin } = useUserType();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [policyDialog, setPolicyDialog] = useState<"terms" | "privacy" | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const callbackUrl = searchParams.get("callbackUrl");
  const professionalName = searchParams.get("professionalName");
  const appointmentDate = searchParams.get("date");
  const appointmentTime = searchParams.get("time");
  const appointmentLocation = searchParams.get("location");

  // Redirecionar se já estiver autenticado (NextAuth ou UserTypeContext)
  useEffect(() => {
    if (contextUser) {
      // Se tem usuário no contexto, redirecionar para dashboard do tipo dele
      const dashboardRoute = getDashboardRoute(contextUser.ds_tipo_usuario);
      router.replace(callbackUrl || dashboardRoute);
    } else if (status === "authenticated" && session) {
      const role = (session.user?.role || "").toString().toLowerCase() as UserType;
      const dashboardRoute = getDashboardRoute(
        role && ["cliente", "profissional", "fornecedor", "administrador"].includes(role)
          ? role
          : "cliente"
      );
      router.replace(callbackUrl || dashboardRoute);
    }
  }, [status, session, contextUser, callbackUrl, router]);

  // Mostrar erro de autenticação OAuth
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      if (errorParam === "Configuration") {
        setError("Erro de configuração OAuth. Verifique as credenciais.");
      } else if (errorParam === "OAuthSignin" || errorParam === "OAuthCallback") {
        setError("Erro ao autenticar com o provedor OAuth. Tente novamente.");
      } else {
        setError("Erro na autenticação. Tente novamente.");
      }
    }
  }, [searchParams]);

  const handleLocalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Informe email e senha.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Primeiro tenta login com UserTypeContext (mock users)
      try {
        await contextLogin(email, password);
        toast.success("Login realizado com sucesso!");
        // O useEffect irá redirecionar automaticamente após contextUser ser atualizado
        return;
      } catch (contextError) {
        // Se falhar no contexto, tenta NextAuth
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
          callbackUrl: callbackUrl || "/paciente/dashboard",
        });

        if (result?.error) {
          setError("Email ou senha incorretos.");
          setIsSubmitting(false);
          return;
        }

        if (result?.ok) {
          toast.success("Login realizado com sucesso!");
          // O useEffect irá redirecionar automaticamente
        }
      }
    } catch (err) {
      console.error("Erro no login:", err);
      setError("Erro ao fazer login. Tente novamente.");
      setIsSubmitting(false);
    }
  };

  const handleOAuthLogin = async (provider: "google" | "azure-ad" | "apple") => {
    try {
      setIsSubmitting(true);
      const buildCallbackUrl = (target?: string | null) => {
        if (!target) return undefined;
        if (target.startsWith("http://") || target.startsWith("https://")) return target;
        if (typeof window === "undefined") return target;
        return `${window.location.origin}${target.startsWith("/") ? target : `/${target}`}`;
      };
      const target = buildCallbackUrl(callbackUrl || "/paciente/dashboard");
      await signIn(provider, { callbackUrl: target });
    } catch (error) {
      console.error(`Erro ao autenticar com ${provider}:`, error);
      toast.error(`Erro ao autenticar com ${provider}`);
      setIsSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-gray-600 font-medium">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 p-4 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-300/10 rounded-full blur-3xl" />
        </div>

        <div className="w-full max-w-5xl relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Left Side - Branding */}
            <div className="hidden lg:flex flex-col justify-center space-y-6 px-8">
              {/* Link para Home */}
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors group"
              >
                <Home className="w-4 h-4 group-hover:scale-110 transition-transform" />
                Voltar para Home
              </Link>

              <div className="space-y-6">
                {professionalName && (
                  <div className="rounded-2xl border border-purple-200 bg-white/80 backdrop-blur-sm p-4 shadow-lg">
                    <p className="text-xs uppercase font-semibold text-purple-600 tracking-wide">
                      Consulta em andamento
                    </p>
                    <h2 className="mt-2 text-lg font-bold text-slate-900">
                      Faça login para confirmar sua consulta com {professionalName}
                    </h2>
                    <div className="mt-3 space-y-2 rounded-xl bg-purple-50/80 border border-purple-100 p-3">
                      {appointmentDate && (
                        <p className="text-sm text-slate-700 capitalize">
                          <span className="font-semibold text-purple-600">Data: </span>
                          {new Date(appointmentDate).toLocaleDateString("pt-BR", {
                            weekday: "long",
                            day: "2-digit",
                            month: "long",
                          })}
                        </p>
                      )}
                      {appointmentTime && (
                        <p className="text-sm text-slate-700">
                          <span className="font-semibold text-purple-600">Horário: </span>
                          {appointmentTime}
                        </p>
                      )}
                      {appointmentLocation && (
                        <p className="text-sm text-slate-700">
                          <span className="font-semibold text-purple-600">Local: </span>
                          {appointmentLocation}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                <Link href="/" className="flex items-center gap-4 group">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 via-cyan-600 to-blue-500 shadow-xl group-hover:scale-105 transition-transform">
                    <Sparkles className="w-12 h-12 text-white" />
                  </div>
                  <div>
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent group-hover:from-blue-500 group-hover:to-cyan-500 transition-all">
                      {process.env.NEXT_PUBLIC_APP_NAME || "DoctorQ"}
                    </h1>
                    <p className="text-gray-600 font-semibold text-xl mt-1">
                      {process.env.NEXT_PUBLIC_APP_TAGLINE || "Sua beleza, nosso cuidado"}
                    </p>
                  </div>
                </Link>

                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border-2 border-blue-200 shadow-lg">
                  <h3 className="text-xl font-bold text-gray-800 mb-3">✨ Bem-vindo de volta!</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Acesse sua conta para gerenciar agendamentos, procedimentos e muito mais em nossa plataforma completa de gestão estética.
                  </p>
                </div>

                {/* Demo Users - Compact */}
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border-2 border-blue-200">
                  <p className="text-sm font-semibold text-gray-700 mb-2">🎭 Contas de teste:</p>
                  <div className="space-y-1 text-xs">
                    <p className="text-gray-600"><span className="font-mono text-blue-700">cliente@estetiQ.com</span></p>
                    <p className="text-gray-600"><span className="font-mono text-cyan-700">profissional@estetiQ.com</span></p>
                    <p className="text-gray-600"><span className="font-mono text-indigo-700">fornecedor@estetiQ.com</span></p>
                    <p className="text-gray-600"><span className="font-mono text-teal-700">admin@estetiQ.com</span></p>
                    <p className="text-blue-600 italic mt-2">💡 Qualquer senha funciona!</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full">
              {/* Mobile Logo */}
              <div className="lg:hidden text-center mb-6">
                {/* Link Home Mobile */}
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors mb-4"
                >
                  <Home className="w-4 h-4" />
                  Voltar para Home
                </Link>
                <Link href="/" className="block">
                  <div className="flex justify-center mb-3">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 via-cyan-600 to-blue-500 shadow-xl hover:scale-105 transition-transform">
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent hover:from-blue-500 hover:to-cyan-500 transition-all">
                    {process.env.NEXT_PUBLIC_APP_NAME || "DoctorQ"}
                  </h1>
                  <p className="text-gray-600 font-medium text-sm mt-1">
                    {process.env.NEXT_PUBLIC_APP_TAGLINE || "Sua beleza, nosso cuidado"}
                  </p>
                </Link>
              </div>

              {professionalName && (
                <div className="lg:hidden mb-6 text-left rounded-2xl border border-purple-200 bg-white/80 backdrop-blur-sm p-4 shadow-lg">
                  <p className="text-xs uppercase font-semibold text-purple-600 tracking-wide">
                    Consulta em andamento
                  </p>
                  <h2 className="mt-2 text-base font-bold text-slate-900">
                    Faça login para confirmar sua consulta com {professionalName}
                  </h2>
                  <div className="mt-3 space-y-2 rounded-xl bg-purple-50/80 border border-purple-100 p-3">
                    {appointmentDate && (
                      <p className="text-sm text-slate-700 capitalize">
                        <span className="font-semibold text-purple-600">Data: </span>
                        {new Date(appointmentDate).toLocaleDateString("pt-BR", {
                          weekday: "long",
                          day: "2-digit",
                          month: "long",
                        })}
                      </p>
                    )}
                    {appointmentTime && (
                      <p className="text-sm text-slate-700">
                        <span className="font-semibold text-purple-600">Horário: </span>
                        {appointmentTime}
                      </p>
                    )}
                    {appointmentLocation && (
                      <p className="text-sm text-slate-700">
                        <span className="font-semibold text-purple-600">Local: </span>
                        {appointmentLocation}
                      </p>
                    )}
                  </div>
                </div>
              )}

          <Card className="border-2 border-blue-200 shadow-2xl backdrop-blur-sm bg-white/95 max-w-md mx-auto">
            <CardHeader className="text-center space-y-1 pb-4">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Login
              </CardTitle>
              <CardDescription className="text-sm text-gray-600">
                Acesse com Google ou use seu e-mail e senha
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              {/* OAuth Buttons */}
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full h-10 justify-start gap-2 font-semibold text-sm border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-gray-800"
                  onClick={() => handleOAuthLogin("google")}
                  disabled={isSubmitting}
                  type="button"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span className="text-gray-700 font-semibold">Continue com Google</span>
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">ou</span>
                </div>
              </div>

              {/* Local Login Form */}
              <form onSubmit={handleLocalLogin} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu.email@exemplo.com"
                      className="pl-10 h-10 border-2 border-gray-200 focus:border-blue-400 focus:ring-blue-400 text-sm"
                      autoComplete="email"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-semibold text-gray-700">Senha</Label>
                    <Link
                      href="/esqueci-senha"
                      className="text-xs font-semibold text-blue-600 hover:text-cyan-600 transition-colors"
                    >
                      Esqueceu sua senha?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-500" />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-10 h-10 border-2 border-gray-200 focus:border-cyan-400 focus:ring-cyan-400 text-sm"
                      autoComplete="current-password"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2 text-xs text-red-700 bg-red-50 border-2 border-red-200 p-3 rounded-lg">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <p className="font-medium">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-10 bg-gradient-to-r from-blue-500 via-cyan-600 to-blue-500 hover:from-blue-600 hover:via-cyan-700 hover:to-blue-600 text-white font-bold text-sm shadow-lg transition-all"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Entrar
                    </>
                  )}
                </Button>
              </form>

              <div className="text-center text-sm">
                <span className="text-gray-600">Não tem uma conta? </span>
                <Link
                  href="/cadastro"
                  className="font-bold text-blue-600 hover:text-cyan-600 hover:underline transition-colors"
                >
                  Cadastre-se
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Demo Users - Mobile Only */}
          <div className="lg:hidden mt-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border-2 border-blue-200 max-w-md mx-auto">
            <p className="text-sm font-semibold text-gray-700 mb-2">🎭 Contas de teste:</p>
            <div className="space-y-1 text-xs">
              <p className="text-gray-600"><span className="font-mono text-blue-700">cliente@estetiQ.com</span></p>
              <p className="text-gray-600"><span className="font-mono text-cyan-700">profissional@estetiQ.com</span></p>
              <p className="text-gray-600"><span className="font-mono text-indigo-700">fornecedor@estetiQ.com</span></p>
              <p className="text-gray-600"><span className="font-mono text-teal-700">admin@estetiQ.com</span></p>
              <p className="text-blue-600 italic mt-2">💡 Qualquer senha funciona!</p>
            </div>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6 max-w-md mx-auto">
            Ao continuar, você concorda com nossos{" "}
            <button
              type="button"
              onClick={() => setPolicyDialog("terms")}
              className="underline hover:text-blue-600 font-medium transition-colors"
            >
              Termos de Serviço
            </button>{" "}
            e{" "}
            <button
              type="button"
              onClick={() => setPolicyDialog("privacy")}
              className="underline hover:text-cyan-600 font-medium transition-colors"
            >
              Política de Privacidade
            </button>
          </p>

          <Dialog
            open={policyDialog !== null}
            onOpenChange={(open) => {
              if (!open) {
                setPolicyDialog(null);
              }
            }}
          >
            <DialogContent className="max-w-3xl h-[70vh] overflow-hidden">
              <DialogHeader>
                <DialogTitle>
                  {policyDialog === "privacy" ? "Política de Privacidade" : "Termos de Serviço"}
                </DialogTitle>
              </DialogHeader>
              {policyDialog && (
                <iframe
                  title={policyDialog === "privacy" ? "Política de Privacidade" : "Termos de Serviço"}
                  src={policyDialog === "privacy" ? "/legal/privacidade" : "/legal/termos-servico"}
                  className="w-full h-full border-0 rounded-md"
                />
              )}
            </DialogContent>
          </Dialog>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100">
          <div className="text-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto" />
            <p className="text-gray-600 font-medium">Carregando...</p>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
