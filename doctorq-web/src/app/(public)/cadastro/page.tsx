"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { useMemo, useState, Suspense } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import {
  Loader2,
  Brain,
  ChevronRight,
  Mail,
  Lock,
  User,
  Check,
  CalendarDays,
  Clock,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import { signupSchema, type SignupFormData } from "@/lib/schemas";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function CadastroPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next");
  const [oauthLoading, setOauthLoading] = useState(false);
  const [policyDialog, setPolicyDialog] = useState<"terms" | "privacy" | null>(null);

  const {
    control,
    handleSubmit,
    register,
    formState: { errors, isSubmitting, isValid },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      emailConfirmation: "",
      password: "",
      acceptedTerms: false,
    },
    mode: "onChange",
    reValidateMode: "onChange",
    delayError: 300,
  });

  const isBusy = oauthLoading || isSubmitting;

  const onSubmit = async (values: SignupFormData) => {
    try {
      const fullName = `${values.firstName.trim()} ${values.lastName.trim()}`;

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nm_email: values.email,
          nm_completo: fullName.trim(),
          senha: values.password,
          nm_papel: "usuario",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao criar conta");
      }

      toast.success("Conta criada com sucesso! Fazendo login...");

      // Fazer login automático após criar conta
      const signInResult = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (signInResult?.error) {
        // Se falhar o login automático, redirecionar para página de login
        setTimeout(() => {
          router.push(`/login?email=${encodeURIComponent(values.email)}${nextParam ? `&callbackUrl=${encodeURIComponent(nextParam)}` : ""}`);
        }, 1500);
      } else {
        // Login bem-sucedido, redirecionar para nextParam ou dashboard
        setTimeout(() => {
          router.push(nextParam || "/dashboard");
        }, 1500);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao criar conta";
      toast.error(message);
    }
  };

  const buildCallbackUrl = (target?: string | null) => {
    if (!target) return undefined;
    if (target.startsWith("http://") || target.startsWith("https://")) return target;
    if (typeof window === "undefined") return target;
    return `${window.location.origin}${target.startsWith("/") ? target : `/${target}`}`;
  };

  const handleOAuthSignup = async (provider: "google") => {
    try {
      setOauthLoading(true);
      const callbackUrl = buildCallbackUrl(nextParam || "/dashboard");
      await signIn(provider, { callbackUrl, redirect: true });
    } catch (error) {
      toast.error(`Erro ao autenticar com ${provider}`);
    } finally {
      setOauthLoading(false);
    }
  };

  const professionalName = searchParams.get("professionalName");
  const appointmentDate = searchParams.get("date");
  const appointmentTime = searchParams.get("time");
  const appointmentLocation = searchParams.get("location");

  const appointmentLoginHref = useMemo(() => {
    const params = new URLSearchParams();
    if (nextParam) params.set("callbackUrl", nextParam);

    const keys = [
      "professionalId",
      "professionalName",
      "specialty",
      "location",
      "date",
      "time",
      "slotId",
      "visitPrice",
    ];

    keys.forEach((key) => {
      const value = searchParams.get(key);
      if (value) params.set(key, value);
    });

    const query = params.toString();
    return query ? `/login?${query}` : "/login";
  }, [nextParam, searchParams]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-400/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md px-4 py-8">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg">
              <Brain className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Bem-vindo ao {process.env.NEXT_PUBLIC_APP_NAME || "DoctorQ"}
          </h1>
          <p className="text-muted-foreground mt-2">
            Crie sua conta e comece a usar IA hoje
          </p>
        </div>

        {/* Agendamento em andamento */}
        {professionalName && (
          <div className="mb-6 rounded-2xl border border-purple-100 bg-white/80 shadow-lg shadow-purple-200/40 backdrop-blur-sm p-4 text-left">
            <p className="text-xs uppercase font-semibold text-purple-600 tracking-wide">
              Você está quase lá!
            </p>
            <h2 className="mt-1 text-lg font-bold text-slate-900">
              Finalize o cadastro para confirmar sua consulta
            </h2>
            <div className="mt-3 space-y-2 rounded-xl bg-purple-50/80 border border-purple-100 p-3">
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <User className="h-4 w-4 text-purple-500" />
                {professionalName}
              </div>
              {appointmentDate && (
                <div className="flex items-center gap-2 text-sm text-slate-700 capitalize">
                  <CalendarDays className="h-4 w-4 text-purple-500" />
                  {new Date(appointmentDate).toLocaleDateString("pt-BR", {
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                  })}
                </div>
              )}
              {appointmentTime && (
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <Clock className="h-4 w-4 text-purple-500" />
                  {appointmentTime}
                </div>
              )}
              {appointmentLocation && (
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <MapPin className="h-4 w-4 text-purple-500" />
                  {appointmentLocation}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Card */}
        <Card className="border-2 shadow-2xl backdrop-blur-sm bg-white/80 dark:bg-slate-900/80">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-semibold text-center">Criar Conta</CardTitle>
            <CardDescription className="text-center">
              Cadastre-se com Google ou use seu e-mail e senha
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* OAuth Buttons */}
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full h-11 justify-start gap-3 font-medium border-2 hover:bg-slate-50 dark:hover:bg-slate-800"
                onClick={() => handleOAuthSignup("google")}
                type="button"
                disabled={isBusy}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Cadastre-se com Google
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

            {/* Local Signup Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nome</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="firstName"
                      placeholder="Nome"
                      className="pl-9"
                      autoComplete="given-name"
                      aria-invalid={!!errors.firstName}
                      disabled={isBusy}
                      {...register("firstName")}
                    />
                  </div>
                  {errors.firstName && (
                    <p className="text-xs text-red-500">{errors.firstName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Sobrenome</Label>
                  <Input
                    id="lastName"
                    placeholder="Sobrenome"
                    autoComplete="family-name"
                    aria-invalid={!!errors.lastName}
                    disabled={isBusy}
                    {...register("lastName")}
                  />
                  {errors.lastName && (
                    <p className="text-xs text-red-500">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    className="pl-9"
                    autoComplete="email"
                    aria-invalid={!!errors.email}
                    disabled={isBusy}
                    {...register("email")}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="emailConfirmation">Confirmação de email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="emailConfirmation"
                    type="email"
                    placeholder="Confirme seu email"
                    className="pl-9"
                    autoComplete="email"
                    aria-invalid={!!errors.emailConfirmation}
                    disabled={isBusy}
                    {...register("emailConfirmation")}
                  />
                </div>
                {errors.emailConfirmation && (
                  <p className="text-xs text-red-500">
                    {errors.emailConfirmation.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Mínimo 8 caracteres"
                    className="pl-9"
                    autoComplete="new-password"
                    aria-invalid={!!errors.password}
                    disabled={isBusy}
                    {...register("password")}
                  />
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500">{errors.password.message}</p>
                )}
              </div>

              {/* Terms and Conditions */}
              <div className="flex items-start space-x-2">
                <Controller
                  name="acceptedTerms"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="terms"
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(checked === true)}
                      onBlur={field.onBlur}
                      disabled={isBusy}
                      aria-invalid={!!errors.acceptedTerms}
                    />
                  )}
                />
                <label
                  htmlFor="terms"
                  className="text-sm text-muted-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Ao continuar, você reconhece que entende e concorda com{" "}
                  <button
                    type="button"
                    onClick={() => setPolicyDialog("terms")}
                    className="text-blue-600 hover:underline"
                  >
                    Termos de Serviço
                  </button>{" "}
                  e{" "}
                  <button
                    type="button"
                    onClick={() => setPolicyDialog("privacy")}
                    className="text-blue-600 hover:underline"
                  >
                    Política de Privacidade
                  </button>
                  .
                </label>
              </div>
              {errors.acceptedTerms && (
                <p className="text-xs text-red-500">{errors.acceptedTerms.message}</p>
              )}

              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                disabled={!isValid || isBusy}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  <>
                    Criar Conta
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="text-center text-sm text-muted-foreground">
              Já tem uma conta?{" "}
              <Link href={appointmentLoginHref} className="text-blue-600 hover:underline font-medium">
                Faça login
              </Link>
            </div>
          </CardContent>
        </Card>

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

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          © 2025 {process.env.NEXT_PUBLIC_APP_NAME || "DoctorQ"}. Todos os direitos reservados.
        </p>
      </div>

      <Toaster richColors />
    </div>
  );
}

export default function CadastroPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 via-purple-50 to-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
          <p className="text-gray-600">Carregando página de cadastro...</p>
        </div>
      </div>
    }>
      <CadastroPageContent />
    </Suspense>
  );
}
