"use client";

import { CalendarDays, CheckCircle2, UserRound } from "lucide-react";

const stepConfig = [
  { number: 1, title: "Detalhes da Consulta", icon: CalendarDays },
  { number: 2, title: "Dados do Paciente", icon: UserRound },
  { number: 3, title: "Confirmação", icon: CheckCircle2 },
];

interface BookingStepHeaderProps {
  currentStep: number;
}

export function BookingStepHeader({ currentStep }: BookingStepHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-600 via-cyan-500 to-purple-700 px-6 py-8 text-white shadow-xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.6),_transparent_55%)] opacity-30" />
      <div className="relative z-10 flex flex-col gap-4">
        <span className="text-xs font-semibold uppercase tracking-widest text-white/80">
          Passo a passo inteligente
        </span>
        <h2 className="text-3xl font-bold tracking-tight">Agende sua consulta em poucos cliques</h2>
        <p className="max-w-2xl text-sm text-white/80">
          Informe os detalhes da visita para que o especialista possa se preparar e confirmar o horário ideal.
        </p>

        <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center">
          {stepConfig.map((step, index) => {
            const Icon = step.icon;
            const reached = currentStep >= step.number;

            return (
              <div key={step.number} className="flex flex-1 items-center gap-4">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl border-2 transition-all ${
                    reached
                      ? "border-white bg-white text-purple-600 shadow-lg shadow-purple-900/20"
                      : "border-white/40 bg-white/10 text-white/60"
                  }`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <p
                    className={`text-xs font-semibold uppercase tracking-wide ${
                      reached ? "text-white" : "text-white/60"
                    }`}
                  >
                    Etapa {step.number}
                  </p>
                  <p
                    className={`text-sm font-medium ${
                      reached ? "text-white" : "text-white/60"
                    }`}
                  >
                    {step.title}
                  </p>
                </div>
                {index < stepConfig.length - 1 && (
                  <div
                    className={`mx-3 hidden h-0.5 flex-1 rounded-full md:block ${
                      currentStep > step.number ? "bg-white" : "bg-white/30"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
