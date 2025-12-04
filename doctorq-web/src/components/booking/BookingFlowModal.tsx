"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Loader2,
  MapPin,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { apiClient, ApiClientError } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { clearBookingDraft, loadBookingDraft, saveBookingDraft } from "@/lib/booking-storage";
import { BookingDraft, ScheduleConfirmationPayload } from "@/types/agendamento";

const ENABLE_MOCK_AUTH = process.env.NEXT_PUBLIC_USE_MOCK_AUTH === "true";
const ENABLE_MOCK_BOOKING = process.env.NEXT_PUBLIC_USE_MOCK_BOOKING === "true";
const USE_REAL_BOOKING = process.env.NEXT_PUBLIC_USE_REAL_AGENDAMENTO === "true";

const formatDateTimeToLocalISOString = (date: Date) => {
  const pad = (value: number) => value.toString().padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};

const steps = [
  { id: 1, title: "Tipo de visita", description: "Escolha como deseja ser atendido(a)" },
  { id: 2, title: "Seus dados", description: "Informe como o especialista pode entrar em contato" },
  { id: 3, title: "Confirmação", description: "Revise os detalhes antes de concluir" },
];

const visitOptions = [
  {
    value: "primeira-consulta",
    title: "Consulta inicial",
    description: "Avaliação completa com foco no seu histórico e objetivos.",
  },
  {
    value: "retorno",
    title: "Retorno",
    description: "Acompanhamento de um tratamento já iniciado.",
  },
  {
    value: "avaliacao-estetica",
    title: "Avaliação estética",
    description: "Discussão de procedimentos e plano personalizado.",
  },
];

type BookingFlowModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: ScheduleConfirmationPayload | null;
  onBookingSuccess?: (details: BookingDraft) => void;
};

type LoginResponse = {
  access_token: string;
  token_type: string;
  user?: {
    id_user: string;
    nm_email: string;
    nm_completo: string;
    nm_papel: string;
  };
};

type RegisterResponse = {
  id_user: string;
  nm_email: string;
  nm_completo: string;
};

function formatAppointment(dateString: string, time: string) {
  const date = new Date(dateString);

  return {
    formattedDate: date.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
    }),
    formattedTime: time,
  };
}

const EMPTY_PATIENT = {
  name: "",
  email: "",
  phone: "",
  notes: "",
  password: "",
};

export function BookingFlowModal({
  open,
  onOpenChange,
  initialData,
  onBookingSuccess,
}: BookingFlowModalProps) {
  const [step, setStep] = useState(1);
  const [stepError, setStepError] = useState<string | null>(null);
  const [booking, setBooking] = useState<BookingDraft | null>(null);
  const [visitType, setVisitType] = useState("");
  const [isFirstConsultation, setIsFirstConsultation] = useState<"sim" | "nao">("sim");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [patient, setPatient] = useState(EMPTY_PATIENT);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isProcessingAuth, setIsProcessingAuth] = useState(false);
  const [isConfirmingBooking, setIsConfirmingBooking] = useState(false);

  useEffect(() => {
    if (!open) {
      setStep(1);
      setStepError(null);
      setBooking(null);
      setVisitType("");
      setIsFirstConsultation("sim");
      setAuthMode("login");
      setPatient(EMPTY_PATIENT);
      setIsConfirmed(false);
      setIsProcessingAuth(false);
      setIsConfirmingBooking(false);
      return;
    }

    const stored = loadBookingDraft();
    const merged = {
      ...(stored ?? {}),
      ...(initialData ?? {}),
    } as BookingDraft;

    if (
      !merged?.professionalId ||
      !merged?.professionalName ||
      !merged?.date ||
      !merged?.time
    ) {
      setBooking(null);
      return;
    }

    saveBookingDraft(merged);
    setBooking(merged);
    setVisitType(merged.visitType ?? "");
    setIsFirstConsultation(merged.isFirstConsultation ? "sim" : "nao");
    setAuthMode(merged.authMode ?? "login");
    setPatient({
      name: merged.patientName ?? "",
      email: merged.patientEmail ?? "",
      phone: merged.patientPhone ?? "",
      notes: merged.patientNotes ?? "",
      password: merged.patientPassword ?? "",
    });
    const hasAuthenticationContext = Boolean(merged.accessToken && merged.patientEmail);
    setStep(hasAuthenticationContext ? 3 : merged.visitType ? 2 : 1);
  }, [open, initialData]);

  const appointmentInfo = useMemo(() => {
    if (!booking) return null;
    return formatAppointment(booking.date, booking.time);
  }, [booking]);

  const handleClose = (nextState: boolean) => {
    onOpenChange(nextState);
  };

  if (!booking) {
    return null;
  }

  const handleStepOneContinue = () => {
    if (!visitType) {
      setStepError("Selecione o tipo de visita para continuar.");
      return;
    }

    const updated: BookingDraft = {
      ...booking,
      visitType,
      isFirstConsultation: isFirstConsultation === "sim",
    };

    setBooking(updated);
    saveBookingDraft(updated);
    setStepError(null);
    setStep(2);
  };

  const mockLoginResponse = (mode: "login" | "register"): LoginResponse => {
    const mockUserName =
      patient.name && patient.name.trim().length > 0
        ? patient.name
        : booking.patientName ?? patient.email.split("@")[0];

    return {
      access_token: `mock-token-${Date.now()}`,
      token_type: "bearer",
      user: {
        id_user: `mock-user-${Math.random().toString(36).slice(2, 10)}`,
        nm_email: patient.email,
        nm_completo: mockUserName,
        nm_papel: "usuario",
      },
    };
  };

  const performLogin = async (email: string, password: string): Promise<LoginResponse> => {
    try {
      return await apiClient.post<LoginResponse>("/users/login-local", {
        nm_email: email,
        senha: password,
      });
    } catch (error) {
      if (
        ENABLE_MOCK_AUTH ||
        (error instanceof ApiClientError && (!error.statusCode || error.statusCode >= 500))
      ) {
        await new Promise((resolve) => setTimeout(resolve, 600));
        return mockLoginResponse("login");
      }
      throw error;
    }
  };

  const performRegister = async (name: string, email: string, password: string) => {
    try {
      return await apiClient.post<RegisterResponse>("/users/register", {
        nm_email: email,
        nm_completo: name,
        senha: password,
        nm_papel: "usuario",
      });
    } catch (error) {
      if (
        ENABLE_MOCK_AUTH ||
        (error instanceof ApiClientError && (!error.statusCode || error.statusCode >= 500))
      ) {
        await new Promise((resolve) => setTimeout(resolve, 600));
        return {
          id_user: `mock-user-${Math.random().toString(36).slice(2, 10)}`,
          nm_email: email,
          nm_completo: name || email,
        };
      }
      throw error;
    }
  };

  const handleStepTwoContinue = async () => {
    if (!booking) return;

    const isLogin = authMode === "login";
    const hasRequiredFields = isLogin
      ? Boolean(patient.email && patient.password)
      : Boolean(patient.name && patient.email && patient.phone && patient.password);

    if (!hasRequiredFields) {
      setStepError(
        isLogin
          ? "Informe o e-mail e a senha da sua conta DoctorQ."
          : "Preencha nome, e-mail, telefone e defina uma senha para continuar."
      );
      return;
    }

    setStepError(null);
    setIsProcessingAuth(true);

    try {
      let userId: string | undefined;

      if (!isLogin) {
        const registerResult = await performRegister(
          patient.name?.trim() || patient.email,
          patient.email,
          patient.password
        );
        userId = registerResult.id_user;
      }

      const loginResponse = await performLogin(patient.email, patient.password);
      userId = loginResponse.user?.id_user ?? userId;

      const userName =
        loginResponse.user?.nm_completo ||
        patient.name?.trim() ||
        booking.patientName ||
        patient.email;

      // ✅ IMPORTANTE: Criar paciente se for novo registro
      if (!isLogin && userId) {
        try {
          await apiClient.post('/pacientes/', {
            id_user: userId,
            nm_paciente: userName,
            ds_email: patient.email,
            ds_telefone: patient.phone || null,
            ds_observacoes: patient.notes || null,
          });
          console.log('✅ Paciente criado com sucesso:', userId);
        } catch (error) {
          // Se paciente já existe (erro 409), ignora
          if (error instanceof ApiClientError && error.statusCode === 409) {
            console.log('ℹ️ Paciente já existe, continuando...');
          } else {
            console.warn('⚠️ Erro ao criar paciente, mas continuando:', error);
          }
        }
      }

      const updated: BookingDraft = {
        ...booking,
        authMode,
        accessToken: loginResponse.access_token,
        tokenType: loginResponse.token_type,
        userId: userId ?? booking.userId,
        patientName: userName,
        patientEmail: loginResponse.user?.nm_email ?? patient.email,
        patientPhone: isLogin ? booking.patientPhone : patient.phone,
        patientNotes: isLogin ? booking.patientNotes : patient.notes,
      };

      const draftToPersist: BookingDraft = {
        ...updated,
        patientPassword: undefined,
      };

      setBooking(updated);
      saveBookingDraft(draftToPersist);
      setPatient((prev) => ({
        ...prev,
        name: userName,
        email: loginResponse.user?.nm_email ?? patient.email,
        password: "",
      }));
      setStep(3);
    } catch (error) {
      if (error instanceof ApiClientError) {
        setStepError(error.message || "Não foi possível validar suas credenciais.");
      } else if (error instanceof Error) {
        setStepError(error.message);
      } else {
        setStepError("Não foi possível validar suas credenciais. Tente novamente.");
      }
    } finally {
      setIsProcessingAuth(false);
    }
  };

  const submitBooking = async (draft: BookingDraft): Promise<BookingDraft> => {
    const baseDate = new Date(draft.date);
    const [hours, minutes] = draft.time.split(":").map((value) => parseInt(value, 10));
    baseDate.setHours(hours ?? 0, minutes ?? 0, 0, 0);
    const formattedDateTime = formatDateTimeToLocalISOString(baseDate);

    const authContext = {
      mode: draft.authMode ?? "register",
      accessToken: draft.accessToken,
      tokenType: draft.tokenType,
      userId: draft.userId,
      email: draft.patientEmail,
      name: draft.patientName,
      phone: draft.patientPhone,
    };

    let resolvedClinicId = draft.clinicId;
    let resolvedClinicName = draft.clinicName ?? draft.location;

    if (!resolvedClinicId) {
      try {
        const professional = await apiClient.get<{
          id_empresa?: string | null;
          nm_empresa?: string | null;
          ds_localizacao?: string | null;
          ds_endereco?: string | null;
          ds_cidade?: string | null;
          ds_estado?: string | null;
          nm_cidade?: string | null;
          sg_estado?: string | null;
        }>(endpoints.profissionais.get(draft.professionalId));

        if (professional?.id_empresa) {
          resolvedClinicId = professional.id_empresa;
          resolvedClinicName =
            professional.nm_empresa ??
            resolvedClinicName ??
            professional.ds_localizacao ??
            professional.ds_endereco ??
            (professional.ds_cidade && (professional.ds_estado ?? professional.sg_estado)
              ? `${professional.ds_cidade}, ${professional.ds_estado ?? professional.sg_estado}`
              : undefined) ??
            (professional.nm_cidade && (professional.ds_estado ?? professional.sg_estado)
              ? `${professional.nm_cidade}, ${professional.ds_estado ?? professional.sg_estado}`
              : undefined) ??
            draft.location ??
            resolvedClinicName ??
            "Clínica DoctorQ";
        }
      } catch (error) {
        console.warn("Não foi possível buscar os dados completos do profissional:", error);
      }
    }

    if (!resolvedClinicId) {
      throw new ApiClientError(
        "Não foi possível identificar a clínica desse profissional. Tente novamente mais tarde."
      );
    }

    const normalizedDraft: BookingDraft = {
      ...draft,
      clinicId: resolvedClinicId,
      clinicName: resolvedClinicName,
    };

    const procedureId =
      normalizedDraft.slotId && normalizedDraft.slotId.length === 36
        ? normalizedDraft.slotId
        : undefined;

    const agendamentoPayload = {
      id_paciente: normalizedDraft.userId ?? "mock-paciente",
      id_profissional: normalizedDraft.professionalId,
      id_clinica: normalizedDraft.clinicId,
      ...(procedureId && { id_procedimento: procedureId }),
      dt_agendamento: formattedDateTime,
      nr_duracao_minutos: 60,
      ds_motivo: normalizedDraft.visitType ?? null,
      ds_observacoes: [normalizedDraft.patientNotes, `auth_mode=${authContext.mode}`]
        .filter(Boolean)
        .join(" | "),
      vl_valor: normalizedDraft.visitPrice ?? null,
      ds_forma_pagamento: null,
    };

    let realBookingSuccessful = false;

    const isValidUserId =
      typeof normalizedDraft.userId === "string" &&
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
        normalizedDraft.userId
      );

    if (USE_REAL_BOOKING && !isValidUserId) {
      console.warn("ID de paciente inválido para agendamento real; utilizando mock.");
    }

    if (USE_REAL_BOOKING && isValidUserId && normalizedDraft.clinicId) {
      try {
        // Usar o endpoint correto do sistema
        await apiClient.post(endpoints.agendamentos.create, agendamentoPayload);
        realBookingSuccessful = true;
        console.log('Agendamento criado no banco de dados com sucesso!', agendamentoPayload);
      } catch (error) {
        console.error('Erro ao criar agendamento no banco:', error);
        if (
          !(ENABLE_MOCK_BOOKING || error instanceof ApiClientError) ||
          (error instanceof ApiClientError && error.statusCode && error.statusCode < 500)
        ) {
          throw error;
        }
      }
    }

    if (ENABLE_MOCK_BOOKING || !realBookingSuccessful) {
      try {
        await fetch("/api/mock/agendamentos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...agendamentoPayload,
            authContext,
          }),
        });
      } catch (error) {
        console.warn("Mock agendamento falhou:", error);
      }
    }

    return normalizedDraft;
  };

  const handleConfirmBooking = async () => {
    if (!booking || isConfirmingBooking) return;
    setStepError(null);
    setIsConfirmingBooking(true);

    try {
      const normalized = await submitBooking(booking);
      setBooking(normalized);
      const bookingForCallback: BookingDraft = {
        ...normalized,
        patientPassword: undefined,
      };
      onBookingSuccess?.(bookingForCallback);
      clearBookingDraft();
      setIsConfirmed(true);
    } catch (error) {
      if (error instanceof ApiClientError) {
        setStepError(error.message || "Não foi possível confirmar o agendamento agora.");
      } else if (error instanceof Error) {
        setStepError(error.message);
      } else {
        setStepError("Não foi possível confirmar o agendamento agora.");
      }
    } finally {
      setIsConfirmingBooking(false);
    }
  };

  const goBack = () => {
    setStep((current) => Math.max(1, current - 1));
    setStepError(null);
  };

  const currentStepDescription =
    step === 2
      ? authMode === "login"
        ? "Conecte-se com sua conta DoctorQ"
        : "Informe como o especialista pode entrar em contato"
      : steps[step - 1]?.description;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl overflow-hidden border-0 p-0 shadow-2xl">
        <DialogHeader className="hidden">
          <DialogTitle>Agendar com {booking.professionalName}</DialogTitle>
          <DialogDescription>Confirme os dados da sua consulta.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-0 bg-gradient-to-br from-white via-purple-50 to-blue-50 md:grid-cols-[1.6fr,1fr]">
          <div className="flex h-full flex-col p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-purple-500">
                  Jornada de agendamento
                </p>
                <h2 className="text-2xl font-semibold text-slate-900">
                  {steps[step - 1]?.title ?? "Agendamento"}
                </h2>
                <p className="text-sm text-slate-500">{currentStepDescription}</p>
              </div>

              <div className="hidden items-center gap-2 md:flex">
                {steps.map((item) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold ${
                        step >= item.id
                          ? "border-purple-500 bg-white text-purple-600 shadow"
                          : "border-purple-200 bg-white/70 text-purple-300"
                      }`}
                    >
                      {item.id}
                    </div>
                    {item.id !== steps.length && (
                      <div className="h-px w-10 rounded bg-purple-200" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Separator className="my-6 hidden md:block" />

            <div className="flex-1 space-y-6 overflow-y-auto pr-1">
              {step === 1 && (
                <div className="space-y-5">
                  <div className="rounded-3xl border border-purple-100 bg-white/80 p-5 shadow-sm">
                    <p className="text-sm font-semibold uppercase tracking-wide text-purple-500">
                      Escolha a modalidade da consulta
                    </p>

                    <RadioGroup
                      value={visitType}
                      onValueChange={(value) => {
                        setVisitType(value);
                        setStepError(null);
                      }}
                      className="mt-4 space-y-4"
                    >
                      {visitOptions.map((option) => (
                        <Label
                          key={option.value}
                          htmlFor={option.value}
                          className={`block cursor-pointer rounded-2xl border p-4 transition-all ${
                            visitType === option.value
                              ? "border-purple-500 bg-purple-50/70 shadow-md shadow-purple-100"
                              : "border-slate-200 bg-white hover:border-purple-200 hover:bg-purple-50/40"
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <RadioGroupItem
                              id={option.value}
                              value={option.value}
                              className="mt-1"
                            />
                            <div>
                              <p className="text-base font-semibold text-slate-900">
                                {option.title}
                              </p>
                              <p className="text-sm text-slate-500">{option.description}</p>
                            </div>
                          </div>
                        </Label>
                      ))}
                    </RadioGroup>
                  </div>

                  <div className="rounded-3xl border border-purple-100 bg-white/90 p-5 shadow-sm">
                    <p className="text-sm font-semibold uppercase tracking-wide text-purple-500">
                      É a sua primeira consulta com este especialista?
                    </p>
                    <div className="mt-3 flex gap-3">
                      {[
                        { value: "sim", label: "Sim, primeira vez" },
                        { value: "nao", label: "Não, já sou paciente" },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setIsFirstConsultation(option.value)}
                          className={`flex-1 rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
                            isFirstConsultation === option.value
                              ? "border-purple-500 bg-purple-500 text-white shadow-md shadow-purple-200"
                              : "border-slate-200 bg-white text-slate-600 hover:border-purple-200 hover:text-purple-600"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5">
                  <div className="rounded-3xl border border-purple-100 bg-white/90 p-5 shadow-sm">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-wide text-purple-500">
                          Identifique-se
                        </p>
                        <p className="text-sm text-slate-600">
                          Informe se já possui conta ou se deseja fazer um novo cadastro.
                        </p>
                      </div>
                      <div className="inline-flex rounded-2xl border border-purple-100 bg-purple-50/70 p-1 shadow-sm">
                        <button
                          type="button"
                          onClick={() => {
                            if (authMode !== "login") {
                              setAuthMode("login");
                              setStepError(null);
                              setPatient((prev) => ({ ...prev, password: "" }));
                            }
                          }}
                          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                            authMode === "login"
                              ? "bg-white text-purple-600 shadow"
                              : "text-purple-400 hover:text-purple-600"
                          }`}
                        >
                          Já tenho conta
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (authMode !== "register") {
                              setAuthMode("register");
                              setStepError(null);
                            }
                          }}
                          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                            authMode === "register"
                              ? "bg-white text-purple-600 shadow"
                              : "text-purple-400 hover:text-purple-600"
                          }`}
                        >
                          Quero me cadastrar
                        </button>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-4">
                      {authMode === "register" && (
                        <div className="space-y-2">
                          <Label htmlFor="patient-name">Nome completo</Label>
                          <Input
                            id="patient-name"
                            placeholder="Como prefere ser chamado(a)"
                            value={patient.name}
                            onChange={(event) =>
                              setPatient((prev) => ({ ...prev, name: event.target.value }))
                            }
                          />
                        </div>
                      )}

                      <div className={`grid gap-4 ${authMode === "register" ? "sm:grid-cols-2" : ""}`}>
                        <div className="space-y-2">
                          <Label htmlFor="patient-email">E-mail</Label>
                          <Input
                            id="patient-email"
                            type="email"
                            placeholder="nome@email.com"
                            value={patient.email}
                            onChange={(event) =>
                              setPatient((prev) => ({ ...prev, email: event.target.value }))
                            }
                          />
                        </div>
                        {authMode === "register" && (
                          <div className="space-y-2">
                            <Label htmlFor="patient-phone">Telefone / WhatsApp</Label>
                            <Input
                              id="patient-phone"
                              placeholder="(11) 99999-0000"
                              value={patient.phone}
                              onChange={(event) =>
                                setPatient((prev) => ({ ...prev, phone: event.target.value }))
                              }
                            />
                          </div>
                        )}
                      </div>

                      {authMode === "register" ? (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="patient-notes">Informações adicionais</Label>
                            <Textarea
                              id="patient-notes"
                              placeholder="Compartilhe objetivos, alergias ou observações importantes."
                              value={patient.notes}
                              onChange={(event) =>
                                setPatient((prev) => ({ ...prev, notes: event.target.value }))
                              }
                              rows={3}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="patient-password">
                              Crie uma senha para acompanhar seu agendamento
                            </Label>
                          <Input
                            id="patient-password"
                            type="password"
                            placeholder="Mínimo 6 caracteres"
                            value={patient.password}
                            onChange={(event) =>
                              setPatient((prev) => ({ ...prev, password: event.target.value }))
                            }
                          />
                          <p className="text-xs text-purple-500">
                            Essa senha permitirá acompanhar evoluções, fotos e lembretes pelo app DoctorQ.
                          </p>
                        </div>
                      </>
                    ) : (
                        <div className="space-y-2">
                          <Label htmlFor="patient-password-login">Senha</Label>
                          <Input
                            id="patient-password-login"
                            type="password"
                            placeholder="Digite sua senha DoctorQ"
                            value={patient.password}
                            onChange={(event) =>
                              setPatient((prev) => ({ ...prev, password: event.target.value }))
                            }
                          />
                          <p className="text-xs text-purple-500">
                            Esqueceu a senha? Você poderá recuperá-la após confirmar o horário.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-purple-100 bg-purple-50/70 p-4 text-sm text-purple-700">
                    <Sparkles className="mr-2 inline h-4 w-4" />
                    {authMode === "register"
                      ? "Seus dados ficam protegidos. Usamos essas informações apenas para confirmar e cuidar da sua experiência."
                      : "Ao conectar sua conta DoctorQ, recuperamos preferências e histórico de consultas automaticamente."}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  {!isConfirmed ? (
                    <>
                      <div className="rounded-3xl border border-purple-100 bg-white/90 p-5 shadow-sm">
                        <p className="text-sm font-semibold uppercase tracking-wide text-purple-500">
                          Revise antes de confirmar
                        </p>
                        <div className="mt-4 space-y-4 text-sm text-slate-600">
                          <div>
                            <p className="text-xs font-semibold uppercase text-purple-500">
                              Tipo de visita
                            </p>
                            <p className="font-medium text-slate-900">
                              {visitOptions.find((option) => option.value === booking.visitType)?.title ??
                                "Não informado"}
                            </p>
                            <p className="text-xs text-slate-500">
                              {booking.isFirstConsultation
                                ? "Primeira consulta com o especialista"
                                : "Você já é paciente deste especialista"}
                            </p>
                          </div>
                          {booking.authMode === "login" ? (
                            <div className="rounded-2xl border border-purple-100 bg-purple-50/60 p-4 text-slate-600">
                              <p className="text-xs font-semibold uppercase text-purple-500">
                                Conta DoctorQ
                              </p>
                              <p className="text-base font-semibold text-slate-900">
                                {booking.patientEmail}
                              </p>
                              <p className="text-xs text-slate-500">
                                Vamos vincular este horário ao seu histórico já existente.
                              </p>
                            </div>
                          ) : (
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div>
                                <p className="text-xs font-semibold uppercase text-purple-500">
                                  Paciente
                                </p>
                                <p className="font-medium text-slate-900">{booking.patientName}</p>
                                <p className="text-xs text-slate-500">{booking.patientEmail}</p>
                                <p className="text-xs text-slate-500">
                                  {booking.patientPhone || "Telefone não informado"}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs font-semibold uppercase text-purple-500">
                                  Observações
                                </p>
                                <p className="text-sm text-slate-600">
                                  {booking.patientNotes || "Sem observações adicionais."}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="rounded-xl border border-green-200 bg-green-50/70 p-4 text-sm text-green-700">
                        <CheckCircle2 className="mr-2 inline h-4 w-4" />
                        Pronto! Ao confirmar, reservaremos o horário e enviaremos um lembrete com
                        todas as instruções.
                      </div>
                    </>
                  ) : (
                    <div className="relative overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-500 via-teal-500 to-sky-500 p-6 text-white shadow-xl">
                      <div className="absolute -top-24 right-0 h-48 w-48 rounded-full bg-white/20 blur-3xl" />
                      <div className="relative z-10 space-y-3">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="h-10 w-10" />
                          <div>
                            <p className="text-sm font-semibold uppercase tracking-wide text-white/80">
                              Agendamento confirmado
                            </p>
                            <h3 className="text-2xl font-semibold">
                              Sua consulta foi reservada com sucesso!
                            </h3>
                          </div>
                        </div>
                        <p className="text-sm text-white/80">
                          {booking.authMode === "login"
                            ? "Você está conectado com sua conta DoctorQ. Atualizamos o painel do paciente com este horário."
                            : "Criamos seu acesso DoctorQ e enviamos um e-mail com as credenciais e detalhes do agendamento."}
                        </p>
                        <div className="rounded-xl bg-white/15 p-4 text-sm">
                          <p className="text-white">
                            {appointmentInfo?.formattedDate} • {appointmentInfo?.formattedTime} • {" "}
                            {booking.professionalName}
                          </p>
                          {booking.specialty && (
                            <p className="text-white/80">Especialidade: {booking.specialty}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {stepError && (
              <p className="mt-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-500">
                {stepError}
              </p>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-purple-400">
                {step < 3 ? (
                  <>
                    <span>
                      Etapa {step} de {steps.length}
                    </span>
                    <span className="hidden sm:inline-flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> Experiência guiada DoctorQ
                    </span>
                  </>
                ) : (
                  <span>{isConfirmed ? "Tudo certo!" : "Revise e conclua seu agendamento"}</span>
                )}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                {step > 1 && !isConfirmed && (
                  <Button
                    variant="ghost"
                    onClick={goBack}
                    className="justify-center"
                    disabled={isProcessingAuth || isConfirmingBooking}
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Voltar
                  </Button>
                )}

                {step === 1 && (
                  <Button
                    onClick={handleStepOneContinue}
                    disabled={isProcessingAuth || isConfirmingBooking}
                    className="bg-gradient-to-r from-purple-600 via-cyan-500 to-purple-700 text-white hover:from-purple-700 hover:via-cyan-600 hover:to-purple-800"
                  >
                    Continuar
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}

                {step === 2 && (
                  <Button
                    onClick={handleStepTwoContinue}
                    disabled={isProcessingAuth}
                    className="bg-gradient-to-r from-purple-600 via-cyan-500 to-purple-700 text-white hover:from-purple-700 hover:via-cyan-600 hover:to-purple-800"
                  >
                    {isProcessingAuth ? (
                      <>
                        Validando...
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      </>
                    ) : (
                      <>
                        {authMode === "login" ? "Conectar e revisar" : "Revisar detalhes"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                )}

                {step === 3 && !isConfirmed && (
                  <Button
                    onClick={handleConfirmBooking}
                    disabled={isConfirmingBooking}
                    className="bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 text-white shadow-lg hover:from-emerald-600 hover:via-teal-600 hover:to-sky-600"
                  >
                    {isConfirmingBooking ? (
                      <>
                        Confirmando...
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      </>
                    ) : (
                      <>
                        Confirmar agendamento
                        <CheckCircle2 className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                )}

                {step === 3 && isConfirmed && (
                  <Button
                    onClick={() => onOpenChange(false)}
                    className="bg-white text-emerald-600 shadow-md hover:bg-white/90"
                  >
                    Voltar para a busca
                  </Button>
                )}
              </div>
            </div>
          </div>

          <aside className="hidden h-full flex-col justify-between border-l border-purple-100/70 bg-white/90 p-6 shadow-inner md:flex">
            <div className="space-y-4">
              <div className="rounded-2xl border border-purple-100 bg-purple-50/70 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-purple-500">
                  Especialista selecionado
                </p>
                <h3 className="mt-2 text-lg font-semibold text-slate-900">
                  {booking.professionalName}
                </h3>
                {booking.specialty && (
                  <p className="text-sm text-slate-600">{booking.specialty}</p>
                )}
              </div>

              <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
                <div className="flex items-center gap-3">
                  <CalendarDays className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-purple-500">
                      Data
                    </p>
                    <p className="font-medium capitalize">
                      {appointmentInfo?.formattedDate ?? "--"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-purple-500">
                      Horário
                    </p>
                    <p className="font-medium">{appointmentInfo?.formattedTime ?? "--"}</p>
                  </div>
                </div>
                {booking.location && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-purple-500">
                        Local
                      </p>
                      <p className="font-medium">{booking.location}</p>
                    </div>
                  </div>
                )}
              </div>

              {booking.visitPrice !== undefined && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                    Valor previsto
                  </p>
                  <p className="text-2xl font-bold text-emerald-700">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(booking.visitPrice)}
                  </p>
                  <p className="mt-1 text-xs text-emerald-700/80">
                    Você decide se prefere pagar agora ou no dia da consulta.
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-purple-100 bg-gradient-to-br from-white via-purple-50 to-blue-50 p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-purple-500">
                Experiência DoctorQ
              </p>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li>• Confirmação instantânea com lembretes inteligentes</li>
                <li>• Registro fotográfico e orientações no prontuário digital</li>
                <li>• Conexão direta com o especialista pelo app</li>
              </ul>
            </div>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
}
