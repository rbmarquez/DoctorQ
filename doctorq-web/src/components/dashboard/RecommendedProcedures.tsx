"use client";

import { Sparkles, Star, Clock, DollarSign, TrendingUp, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Procedure {
  id: string;
  name: string;
  category: string;
  price: number;
  duration: number;
  rating: number;
  imageUrl?: string;
  reason: string; // Why it's recommended
}

interface RecommendedProceduresProps {
  procedures?: Procedure[];
}

export function RecommendedProcedures({ procedures = [] }: RecommendedProceduresProps) {
  // Usar dados reais passados via props - sem mock data
  const recommendedProcedures: Procedure[] = procedures;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <Sparkles className="h-5 w-5 text-blue-600 mr-2" />
            Recomendados para Você
          </h3>
          <p className="text-sm text-gray-600 mt-1">Procedimentos selecionados com base no seu perfil</p>
        </div>
        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
          Ver todos
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {recommendedProcedures.length === 0 ? (
        <div className="text-center py-8">
          <Sparkles className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 text-sm">Nenhum procedimento recomendado no momento</p>
          <p className="text-gray-500 text-xs mt-1">Explore nosso catálogo para descobrir opções</p>
          <Link href="/procedimentos">
            <Button size="sm" className="mt-4 bg-gradient-to-r from-blue-500 to-purple-600">
              Explorar Procedimentos
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recommendedProcedures.map((procedure) => (
          <Link
            key={procedure.id}
            href={`/procedimento/${procedure.id}`}
            className="group block"
          >
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-100 hover:border-blue-300 hover:shadow-lg transition-all overflow-hidden">
              {/* Image */}
              {procedure.imageUrl && (
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={procedure.imageUrl}
                    alt={procedure.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute top-2 right-2 bg-white rounded-full px-2 py-1 flex items-center space-x-1 shadow-md">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs font-semibold text-gray-900">{procedure.rating}</span>
                  </div>
                </div>
              )}

              {/* Content */}
              <div className="p-4">
                <div className="mb-3">
                  <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full mb-2">
                    {procedure.category}
                  </span>
                  <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {procedure.name}
                  </h4>
                </div>

                {/* Reason */}
                <div className="flex items-start space-x-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-gray-600">{procedure.reason}</p>
                </div>

                {/* Info */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-1 text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>{procedure.duration}min</span>
                  </div>
                  <div className="flex items-center space-x-1 text-blue-600 font-bold">
                    <DollarSign className="h-4 w-4" />
                    <span>R$ {procedure.price}</span>
                  </div>
                </div>

                {/* CTA */}
                <Button
                  size="sm"
                  className="w-full mt-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-cyan-700"
                >
                  Ver Detalhes
                </Button>
              </div>
            </div>
          </Link>
          ))}
        </div>
      )}
    </div>
  );
}
