"use client";

import { ReviewStats as ReviewStatsType } from "@/types/review";
import { Star, ThumbsUp } from "lucide-react";

interface ReviewStatsProps {
  stats: ReviewStatsType;
}

export function ReviewStats({ stats }: ReviewStatsProps) {
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 ${
              star <= Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  const getPercentage = (count: number) => {
    return stats.total > 0 ? (count / stats.total) * 100 : 0;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {/* Cabeçalho */}
      <h3 className="text-2xl font-bold text-gray-900 mb-6">Avaliações dos Pacientes</h3>

      {/* Média Geral */}
      <div className="flex items-center justify-between mb-8 p-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl">
        <div>
          <div className="text-5xl font-bold text-gray-900 mb-2">{stats.media_geral.toFixed(1)}</div>
          {renderStars(stats.media_geral)}
          <div className="text-sm text-gray-600 mt-2">
            Baseado em <span className="font-semibold">{stats.total}</span>{" "}
            {stats.total === 1 ? "avaliação" : "avaliações"}
          </div>
        </div>

        {/* Percentual de Recomendação */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-500 mb-2">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">{stats.percentual_recomenda}%</div>
              <ThumbsUp className="h-5 w-5 text-white mx-auto" />
            </div>
          </div>
          <div className="text-xs text-gray-600 font-medium">Recomendam</div>
        </div>
      </div>

      {/* Distribuição de Estrelas */}
      <div className="mb-8">
        <h4 className="text-sm font-semibold text-gray-900 mb-4">Distribuição de Avaliações</h4>
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = stats.distribuicao[stars] || 0;
            const percentage = getPercentage(count);

            return (
              <div key={stars} className="flex items-center space-x-3">
                <div className="flex items-center space-x-1 w-16">
                  <span className="text-sm font-medium text-gray-700">{stars}</span>
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                </div>
                <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="text-sm text-gray-600 w-16 text-right">
                  {count} {count === 1 ? "voto" : "votos"}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Métricas Detalhadas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-xs text-gray-600 mb-2">Atendimento</div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {stats.media_atendimento.toFixed(1)}
          </div>
          {renderStars(stats.media_atendimento)}
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-xs text-gray-600 mb-2">Estrutura</div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {stats.media_estrutura.toFixed(1)}
          </div>
          {renderStars(stats.media_estrutura)}
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-xs text-gray-600 mb-2">Resultado</div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {stats.media_resultado.toFixed(1)}
          </div>
          {renderStars(stats.media_resultado)}
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-xs text-gray-600 mb-2">Custo-Benefício</div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {stats.media_custo_beneficio.toFixed(1)}
          </div>
          {renderStars(stats.media_custo_beneficio)}
        </div>
      </div>
    </div>
  );
}
