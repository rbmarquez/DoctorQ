"use client";

import { useEffect, useMemo, useState } from "react";
import { signIn } from "next-auth/react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiClient, ApiClientError } from "@/lib/api/client";

type AuthMode = "login" | "register";

interface AuthAccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMode?: AuthMode;
  onSuccess?: () => void;
}

interface RegisterResponse {
  id_user: string;
  nm_email: string;
  nm_completo: string;
}

const INITIAL_FORM = {
  name: "",
  email: "",
  phone: "",
  password: "",
  notes: "",
};

const ENABLE_MOCK_AUTH = process.env.NEXT_PUBLIC_USE_MOCK_AUTH === "true";

export function AuthAccessModal({
  open,
  onOpenChange,
  initialMode = "login",
  onSuccess,
}: AuthAccessModalProps) {
  const [authMode, setAuthMode] = useState<AuthMode>(initialMode);
  const [form, setForm] = useState(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setAuthMode(initialMode);
      setError(null);
    } else {
      setForm(INITIAL_FORM);
      setIsSubmitting(false);
      setError(null);
    }
  }, [open, initialMode]);

  const isLogin = useMemo(() => authMode === "login", [authMode]);

  const handleRegister = async () => {
    try {
      const response = await apiClient.post<RegisterResponse>("/users/register", {
        nm_email: form.email,
        nm_completo: form.name || form.email,
        senha: form.password,
        nm_papel: "usuario",
      });

      if (response?.id_user) {
        try {
          await apiClient.post("/pacientes/", {
            id_user: response.id_user,
            nm_paciente: response.nm_completo,
            ds_email: response.nm_email,
            ds_telefone: form.phone || null,
            ds_observacoes: form.notes || null,
          });
        } catch (pacienteError) {
          if (pacienteError instanceof ApiClientError) {
            // 404: endpoint não disponível; 409: paciente já criado
            if (pacienteError.statusCode === 404) {
              console.info(
                "[AuthAccessModal] Endpoint /pacientes/ não encontrado, prosseguindo sem criar paciente."
              );
            } else if (pacienteError.statusCode === 409) {
              console.info("[AuthAccessModal] Paciente já existente, seguindo fluxo.");
            } else {
              console.warn(
                "[AuthAccessModal] Falha ao criar paciente após cadastro:",
                pacienteError
              );
            }
          } else {
            console.warn("[AuthAccessModal] Erro inesperado ao criar paciente:", pacienteError);
          }
        }
      }
    } catch (registerError: any) {
      if (registerError instanceof ApiClientError) {
        if (registerError.statusCode === 409) {
          throw new Error("Este e-mail já está cadastrado. Tente fazer login.");
        }
        throw new Error(registerError.message || "Não foi possível concluir o cadastro.");
      }

      throw new Error("Erro inesperado ao cadastrar usuário.");
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const hasRequiredFields = isLogin
      ? Boolean(form.email && form.password)
      : Boolean(form.name && form.email && form.password);

    if (!hasRequiredFields) {
      setError(
        isLogin
          ? "Informe e-mail e senha para continuar."
          : "Preencha nome, e-mail e defina uma senha para criar sua conta."
      );
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      if (!isLogin) {
        await handleRegister();
      }

      if (ENABLE_MOCK_AUTH) {
        toast.success(isLogin ? "Login realizado!" : "Cadastro concluído! Bem-vindo(a) ao DoctorQ.");
        onSuccess?.();
        onOpenChange(false);
        return;
      }

      const result = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error("E-mail ou senha inválidos. Tente novamente.");
      }

      toast.success(isLogin ? "Login realizado com sucesso!" : "Cadastro concluído! Você já está logado.");
      onSuccess?.();
      onOpenChange(false);
    } catch (submitError: any) {
      console.error("Erro ao autenticar:", submitError);
      setError(submitError?.message || "Não foi possível completar a autenticação.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-3xl border border-purple-100 bg-gradient-to-br from-white via-purple-50/80 to-blue-50/70 p-0 shadow-2xl">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-slate-900">
            <Sparkles className="h-5 w-5 text-purple-500" />
            {isLogin ? "Entre na sua conta DoctorQ" : "Crie sua conta DoctorQ"}
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-600">
            Acesse para guardar seus favoritos, acompanhar agendamentos e receber recomendações personalizadas.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6">
          <div className="inline-flex rounded-2xl border border-purple-100 bg-purple-50/70 p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setAuthMode("login")}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                isLogin ? "bg-white text-purple-600 shadow" : "text-purple-400 hover:text-purple-600"
              }`}
              disabled={isLogin}
            >
              Já tenho conta
            </button>
            <button
              type="button"
              onClick={() => setAuthMode("register")}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                !isLogin ? "bg-white text-purple-600 shadow" : "text-purple-400 hover:text-purple-600"
              }`}
              disabled={!isLogin}
            >
              Quero me cadastrar
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 pt-4 space-y-5">
          <div className="grid gap-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="auth-name">Nome completo</Label>
                <Input
                  id="auth-name"
                  placeholder="Como você prefere ser chamado(a)?"
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                />
              </div>
            )}

            <div className={`grid gap-4 ${!isLogin ? "sm:grid-cols-2" : ""}`}>
              <div className="space-y-2">
                <Label htmlFor="auth-email">E-mail</Label>
                <Input
                  id="auth-email"
                  type="email"
                  placeholder="voce@email.com"
                  value={form.email}
                  onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                />
              </div>

              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="auth-phone">Telefone / WhatsApp</Label>
                  <Input
                    id="auth-phone"
                    placeholder="(11) 99999-0000"
                    value={form.phone}
                    onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                  />
                </div>
              )}
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="auth-notes">Informações adicionais</Label>
                <Textarea
                  id="auth-notes"
                  placeholder="Compartilhe objetivos, alergias ou observações importantes (opcional)."
                  rows={3}
                  value={form.notes}
                  onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="auth-password">{isLogin ? "Senha" : "Crie uma senha"}</Label>
              <Input
                id="auth-password"
                type="password"
                placeholder={isLogin ? "Digite sua senha DoctorQ" : "Mínimo 6 caracteres"}
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              />
              <p className="text-xs text-purple-500">
                {isLogin
                  ? "Esqueceu a senha? Você poderá recuperá-la depois."
                  : "Com sua conta DoctorQ, você acompanha favoritos, agendamentos e recomendações personalizadas."}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-purple-100 bg-purple-50/70 p-4 text-sm text-purple-700">
            {isLogin
              ? "Ao entrar na sua conta DoctorQ, mantemos seus favoritos e preferências sincronizados em todos os dispositivos."
              : "Cuidamos dos seus dados com carinho. Use o mesmo e-mail para centralizar histórico, fotos e lembretes."}
          </div>

          {error && (
            <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-500">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-purple-600 via-cyan-500 to-purple-700 text-white hover:from-purple-700 hover:via-cyan-600 hover:to-purple-800"
          >
            {isSubmitting ? (
              <>
                Validando...
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              </>
            ) : isLogin ? (
              "Entrar e continuar"
            ) : (
              "Criar conta e continuar"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
