"use client";

import { useState } from "react";
import { Search, Sparkles, Star, Heart, Zap, Sun, Droplets, Smile, FlowerIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function ProcedimentosPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const procedures = [
    {
      id: 1,
      name: "Limpeza de Pele",
      description: "Remoção profunda de impurezas e renovação celular",
      icon: Sparkles,
      color: "from-blue-500 to-rose-500",
      duration: "60-90 min",
      price: "R$ 150 - R$ 300",
      popularity: 5
    },
    {
      id: 2,
      name: "Botox",
      description: "Redução de rugas e linhas de expressão",
      icon: Star,
      color: "from-purple-500 to-blue-500",
      duration: "20-30 min",
      price: "R$ 800 - R$ 2.000",
      popularity: 5
    },
    {
      id: 3,
      name: "Preenchimento",
      description: "Harmonização facial e aumento de volume",
      icon: Heart,
      color: "from-rose-500 to-blue-500",
      duration: "30-60 min",
      price: "R$ 1.200 - R$ 3.500",
      popularity: 5
    },
    {
      id: 4,
      name: "Microagulhamento",
      description: "Rejuvenescimento e renovação celular",
      icon: Zap,
      color: "from-violet-500 to-purple-500",
      duration: "45-60 min",
      price: "R$ 300 - R$ 600",
      popularity: 4
    },
    {
      id: 5,
      name: "Peeling",
      description: "Renovação da pele e melhora da textura",
      icon: Sun,
      color: "from-amber-500 to-orange-500",
      duration: "30-45 min",
      price: "R$ 200 - R$ 500",
      popularity: 4
    },
    {
      id: 6,
      name: "Depilação a Laser",
      description: "Remoção permanente de pelos indesejados",
      icon: Droplets,
      color: "from-cyan-500 to-blue-500",
      duration: "20-60 min",
      price: "R$ 100 - R$ 800",
      popularity: 5
    },
    {
      id: 7,
      name: "Harmonização Facial",
      description: "Equilíbrio e proporção facial completa",
      icon: Smile,
      color: "from-fuchsia-500 to-blue-500",
      duration: "60-120 min",
      price: "R$ 2.000 - R$ 8.000",
      popularity: 5
    },
    {
      id: 8,
      name: "Massagem Facial",
      description: "Relaxamento e drenagem linfática",
      icon: FlowerIcon,
      color: "from-emerald-500 to-teal-500",
      duration: "45-60 min",
      price: "R$ 150 - R$ 400",
      popularity: 4
    }
  ];

  const filteredProcedures = procedures.filter((proc) =>
    proc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    proc.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-white mb-4">
              Procedimentos Estéticos
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Encontre o tratamento perfeito para você
            </p>
          </div>

          {/* Search */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar procedimentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-14 text-lg border-2 border-white/20 bg-white/10 backdrop-blur-sm text-white placeholder:text-white/60 focus:border-white/40"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Procedures Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProcedures.map((procedure) => {
            const Icon = procedure.icon;
            return (
              <Link key={procedure.id} href={`/procedimentos/${procedure.id}`}>
                <Card className="border-2 border-blue-200 shadow-xl hover:shadow-2xl transition-all hover:scale-[1.05] cursor-pointer h-full">
                  <CardContent className="p-6 space-y-4">
                    <div className={`inline-flex p-4 rounded-xl bg-gradient-to-r ${procedure.color} text-white shadow-lg`}>
                      <Icon className="h-8 w-8" />
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {procedure.name}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {procedure.description}
                      </p>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Duração:</span>
                        <span className="font-semibold text-gray-700">{procedure.duration}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Preço:</span>
                        <span className="font-semibold text-gray-700">{procedure.price}</span>
                      </div>
                    </div>

                    <div className="flex gap-1">
                      {Array.from({ length: procedure.popularity }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-pink-500 text-blue-500" />
                      ))}
                    </div>

                    <Button className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700">
                      Ver Detalhes
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {filteredProcedures.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">
              Nenhum procedimento encontrado com &quot;{searchTerm}&quot;
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
