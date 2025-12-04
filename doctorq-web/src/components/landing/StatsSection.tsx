"use client";

import { Users, Building2, Calendar, Star } from "lucide-react";

const stats = [
  {
    icon: Building2,
    value: "2.500+",
    label: "Clínicas Parceiras",
    color: "from-blue-500 to-rose-500",
  },
  {
    icon: Users,
    value: "10.000+",
    label: "Profissionais",
    color: "from-purple-500 to-blue-500",
  },
  {
    icon: Calendar,
    value: "50.000+",
    label: "Agendamentos/mês",
    color: "from-violet-500 to-purple-500",
  },
  {
    icon: Star,
    value: "4.9/5",
    label: "Avaliação Média",
    color: "from-fuchsia-500 to-blue-500",
  },
];

export function StatsSection() {
  return (
    <section className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10" />

      {/* Círculos decorativos */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full mix-blend-overlay filter blur-3xl opacity-20" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-white rounded-full mix-blend-overlay filter blur-3xl opacity-20" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Números que Impressionam
          </h2>
          <p className="text-lg text-blue-100 max-w-2xl mx-auto">
            Milhares de pessoas já confiam em nós para cuidar da sua beleza
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="group cursor-pointer"
              >
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 text-center">
                  {/* Ícone */}
                  <div className="mb-6 flex justify-center">
                    <div className={`p-4 bg-gradient-to-r ${stat.color} rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                  </div>

                  {/* Valor */}
                  <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                    {stat.value}
                  </div>

                  {/* Label */}
                  <div className="text-blue-100 font-medium">
                    {stat.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Trust badges */}
        <div className="mt-16 flex flex-wrap justify-center items-center gap-8 opacity-80">
          <div className="text-white/80 text-sm font-medium">
            Confiado por
          </div>
          <div className="flex items-center gap-2 bg-white/10 px-6 py-3 rounded-full backdrop-blur-sm">
            <Star className="h-5 w-5 text-yellow-300 fill-yellow-300" />
            <span className="text-white font-medium">Google 4.9/5</span>
          </div>
          <div className="flex items-center gap-2 bg-white/10 px-6 py-3 rounded-full backdrop-blur-sm">
            <Star className="h-5 w-5 text-yellow-300 fill-yellow-300" />
            <span className="text-white font-medium">Reclame Aqui 4.8/5</span>
          </div>
          <div className="text-white/60 text-sm">
            + 25.000 avaliações positivas
          </div>
        </div>
      </div>
    </section>
  );
}
