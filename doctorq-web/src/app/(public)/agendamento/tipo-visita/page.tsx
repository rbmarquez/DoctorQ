"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, CalendarDays, Clock, MapPin } from "lucide-react";

import { BookingStepHeader } from "@/components/booking/BookingStepHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { loadBookingDraft, saveBookingDraft } from "@/lib/booking-storage";
import { BookingDraft } from "@/types/agendamento";

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

export default function TipoVisitaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [booking, setBooking] = useState<BookingDraft | null>(null);
  const [visitType, setVisitType] = useState("");
  const [isFirstConsultation, setIsFirstConsultation] = useState<"sim" | "nao">("sim");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const queryData: Partial<BookingDraft> = {};

    const professionalId = searchParams.get("professionalId");
    const professionalName = searchParams.get("professionalName");
    const specialty = searchParams.get("specialty") || undefined;
    const location = searchParams.get("location") || undefined;
    const date = searchParams.get("date");
    const time = searchParams.get("time");
    const slotId = searchParams.get("slotId") || undefined;
    const visitPrice = searchParams.get("visitPrice");

    if (professionalId && professionalName) {
      queryData.professionalId = professionalId;
      queryData.professionalName = professionalName;
    }
    if (specialty) queryData.specialty = specialty;
    if (location) queryData.location = location;
    if (date) queryData.date = date;
    if (time) queryData.time = time;
    if (slotId) queryData.slotId = slotId;
    if (visitPrice) queryData.visitPrice = Number(visitPrice);

    const stored = loadBookingDraft();
    const merged = { ...(stored ?? {}), ...queryData } as BookingDraft;

    if (!merged?.professionalId || !merged?.date || !merged?.time) {
      router.replace("/busca");
      return;
    }

    saveBookingDraft(merged);
    setBooking(merged);

    if (merged.visitType) setVisitType(merged.visitType);
    if (merged.isFirstConsultation !== undefined) {
      setIsFirstConsultation(merged.isFirstConsultation ? "sim" : "nao");
    }
  }, [router, searchParams]);

  const appointmentInfo = useMemo(() => {
    if (!booking) return null;
    return formatAppointment(booking.date, booking.time);
  }, [booking]);

  const handleContinue = () => {
    if (!booking) return;

    if (!visitType) {
      setError("Selecione o tipo de visita para continuar.");
      return;
    }

    const updatedBooking: BookingDraft = {
      ...booking,
      visitType,
      isFirstConsultation: isFirstConsultation === "sim",
    };

    saveBookingDraft(updatedBooking);

    const params = new URLSearchParams({
      professionalId: updatedBooking.professionalId,
      professionalName: updatedBooking.professionalName,
      date: updatedBooking.date,
      time: updatedBooking.time,
    });

    if (updatedBooking.specialty) params.set("specialty", updatedBooking.specialty);
    if (updatedBooking.location) params.set("location", updatedBooking.location);
    if (updatedBooking.slotId) params.set("slotId", updatedBooking.slotId);
    if (updatedBooking.visitPrice !== undefined) {
      params.set("visitPrice", String(updatedBooking.visitPrice));
    }

    router.push(`/agendamento/dados-paciente?${params.toString()}`);
  };

  if (!booking || !appointmentInfo) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-500">Preparando sua experiência de agendamento...</p>
      </div>
    );
  }

  const currencyFormatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
        <BookingStepHeader currentStep={1} />

        <div className="flex flex-col gap-6 rounded-3xl border border-purple-100/60 bg-white p-6 shadow-xl shadow-purple-100 sm:p-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Escolha como deseja ser atendido(a)
            </h1>
            <p className="mt-2 text-sm text-slate-600 sm:text-base">
              Informe o tipo de visita e se é sua primeira consulta com o especialista.
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <Card className="border border-purple-100/70 bg-white text-slate-900 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl text-slate-900">
                Selecione a modalidade da sua consulta
              </CardTitle>
              <CardDescription>
                Sua escolha ajuda o especialista a se preparar melhor antes do encontro.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <RadioGroup
                value={visitType}
                onValueChange={(value) => {
                  setVisitType(value);
                  setError(null);
                }}
                className="space-y-4"
              >
                {visitOptions.map((option) => (
                  <Label
                    key={option.value}
                    htmlFor={option.value}
                    className={`block cursor-pointer rounded-2xl border p-4 transition-all ${
                      visitType === option.value
                        ? "border-purple-500 bg-purple-50/70 shadow-md shadow-purple-100"
                        : "border-slate-200 hover:border-purple-200 hover:bg-purple-50/40"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <RadioGroupItem id={option.value} value={option.value} className="mt-1" />
                      <div>
                        <p className="text-base font-semibold text-slate-900">{option.title}</p>
                        <p className="text-sm text-slate-500">{option.description}</p>
                      </div>
                    </div>
                  </Label>
                ))}
              </RadioGroup>

              <Separator />

              <div>
                <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-purple-600">
                  É a sua primeira consulta com este especialista?
                </p>
                <div className="flex gap-3">
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

              {error && (
                <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm font-medium text-red-500">
                  {error}
                </p>
              )}

              <div className="flex justify-end">
                <Button
                  onClick={handleContinue}
                  className="bg-gradient-to-r from-purple-600 via-cyan-500 to-purple-700 text-white hover:from-purple-700 hover:via-cyan-600 hover:to-purple-800"
                  size="lg"
                >
                  Continuar
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-purple-100/80 bg-white text-slate-900 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg text-slate-900">
                Sua consulta com {booking.professionalName}
              </CardTitle>
              <CardDescription>Confira os detalhes antes de avançar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 rounded-xl border border-purple-100 bg-purple-50/60 p-4">
                <div className="flex items-center gap-3 text-slate-700">
                  <CalendarDays className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-purple-600">
                      Data
                    </p>
                    <p className="font-medium capitalize">{appointmentInfo.formattedDate}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-slate-700">
                  <Clock className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-purple-600">
                      Horário
                    </p>
                    <p className="font-medium">{appointmentInfo.formattedTime}</p>
                  </div>
                </div>
                {booking.location && (
                  <div className="flex items-center gap-3 text-slate-700">
                    <MapPin className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-purple-600">
                        Local
                      </p>
                      <p className="font-medium">{booking.location}</p>
                    </div>
                  </div>
                )}
              </div>

              {booking.specialty && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-purple-600">
                    Especialidade
                  </p>
                  <p className="font-medium text-slate-700">{booking.specialty}</p>
                </div>
              )}

              {booking.visitPrice !== undefined && (
                <div className="rounded-xl border border-green-100 bg-green-50/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-green-600">
                    Valor previsto
                  </p>
                  <p className="text-2xl font-bold text-green-700">
                    {currencyFormatter.format(booking.visitPrice)}
                  </p>
                  <p className="mt-1 text-xs text-green-700/80">
                    O pagamento pode ser realizado presencialmente ou via plataforma.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
