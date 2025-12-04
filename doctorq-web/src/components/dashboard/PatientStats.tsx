"use client";

import { Calendar, Star, Heart, Award } from "lucide-react";

interface PatientStatsProps {
  totalAppointments?: number;
  totalProcedures?: number;
  totalReviews?: number;
  averageRating?: number;
  favoritesCount?: number;
  nextAppointmentDays?: number;
}

export function PatientStats({
  totalAppointments = 0,
  totalProcedures = 0,
  totalReviews = 0,
  averageRating = 0,
  favoritesCount = 0,
  nextAppointmentDays = -1,
}: PatientStatsProps) {
  // Formatar o texto do próximo agendamento
  const getNextAppointmentText = () => {
    if (nextAppointmentDays < 0) return "Nenhum";
    if (nextAppointmentDays === 0) return "Hoje";
    if (nextAppointmentDays === 1) return "Amanhã";
    return `${nextAppointmentDays} dias`;
  };

  const stats = [
    {
      label: "Próximo Agendamento",
      value: getNextAppointmentText(),
      icon: Calendar,
      color: "from-blue-500 to-cyan-600",
      description: nextAppointmentDays < 0 ? "Agende um procedimento" : "Seu próximo procedimento",
    },
    {
      label: "Procedimentos Concluídos",
      value: totalProcedures.toString(),
      icon: Award,
      color: "from-purple-500 to-blue-600",
      description: totalProcedures === 0 ? "Nenhum ainda" : "Realizados na plataforma",
    },
    {
      label: "Favoritos Salvos",
      value: favoritesCount.toString(),
      icon: Heart,
      color: "from-red-500 to-blue-600",
      description: favoritesCount === 0 ? "Salve seus favoritos" : "Procedimentos e profissionais",
    },
    {
      label: "Minhas Avaliações",
      value: totalReviews.toString(),
      icon: Star,
      color: "from-yellow-500 to-orange-600",
      description: totalReviews === 0 ? "Avalie seus procedimentos" : `Média de ${averageRating.toFixed(1)} estrelas`,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all group"
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className={`p-3 rounded-lg bg-gradient-to-r ${stat.color} group-hover:scale-110 transition-transform`}
              >
                <Icon className="h-6 w-6 text-white" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
            <p className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.description}</p>
          </div>
        );
      })}
    </div>
  );
}
