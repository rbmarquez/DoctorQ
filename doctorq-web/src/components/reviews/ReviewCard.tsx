"use client";

import { Review } from "@/types/review";
import { Star, ThumbsUp, ThumbsDown, CheckCircle, Calendar, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import Image from "next/image";

interface ReviewCardProps {
  review: Review;
  onMarkUseful?: (reviewId: string, isUseful: boolean) => void;
}

export function ReviewCard({ review, onMarkUseful }: ReviewCardProps) {
  const [hasVoted, setHasVoted] = useState(false);
  const [utilCount, setUtilCount] = useState(review.nr_util || 0);
  const [naoUtilCount, setNaoUtilCount] = useState(review.nr_nao_util || 0);

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const handleVote = (isUseful: boolean) => {
    if (!hasVoted && onMarkUseful) {
      // Atualizar contador local imediatamente
      if (isUseful) {
        setUtilCount(prev => prev + 1);
      } else {
        setNaoUtilCount(prev => prev + 1);
      }

      onMarkUseful(review.id_avaliacao, isUseful);
      setHasVoted(true);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-4">
          {/* Avatar */}
          <div className="relative">
            {review.ds_foto_paciente ? (
              <Image
                src={review.ds_foto_paciente}
                alt={review.nm_paciente}
                width={48}
                height={48}
                className="rounded-full"
              />
            ) : (
              <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                {review.nm_paciente.charAt(0).toUpperCase()}
              </div>
            )}
            {review.bo_verificada && (
              <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5">
                <CheckCircle className="h-4 w-4 text-white" />
              </div>
            )}
          </div>

          {/* Nome e Data */}
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="font-semibold text-gray-900">{review.nm_paciente}</h4>
              {review.bo_verificada && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  <BadgeCheck className="h-3 w-3 mr-1" />
                  Verificado
                </span>
              )}
            </div>
            <div className="flex items-center text-sm text-gray-500 mt-1">
              <Calendar className="h-3.5 w-3.5 mr-1" />
              {formatDate(review.dt_criacao)}
            </div>
          </div>
        </div>

        {/* Nota Geral */}
        <div className="flex flex-col items-end">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-2xl font-bold text-gray-900">{review.nr_nota_geral.toFixed(1)}</span>
            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
          </div>
          <div className="text-xs text-gray-500">Nota geral</div>
        </div>
      </div>

      {/* Notas Detalhadas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <div className="text-xs text-gray-600 mb-1">Atendimento</div>
          {renderStars(review.nr_nota_atendimento)}
        </div>
        <div>
          <div className="text-xs text-gray-600 mb-1">Estrutura</div>
          {renderStars(review.nr_nota_estrutura)}
        </div>
        <div>
          <div className="text-xs text-gray-600 mb-1">Resultado</div>
          {renderStars(review.nr_nota_resultado)}
        </div>
        <div>
          <div className="text-xs text-gray-600 mb-1">Custo-Benefício</div>
          {renderStars(review.nr_nota_custo_beneficio)}
        </div>
      </div>

      {/* Recomendação */}
      {review.bo_recomenda && (
        <div className="mb-4 inline-flex items-center px-3 py-1.5 rounded-full bg-green-50 border border-green-200">
          <ThumbsUp className="h-4 w-4 text-green-600 mr-2" />
          <span className="text-sm font-medium text-green-700">Recomendo este profissional</span>
        </div>
      )}

      {/* Comentário */}
      <p className="text-gray-700 leading-relaxed mb-4">{review.ds_comentario}</p>

      {/* Fotos Antes/Depois */}
      {(review.ds_fotos_antes?.length || review.ds_fotos_depois?.length) && (
        <div className="mb-4">
          <div className="text-sm font-semibold text-gray-900 mb-2">Fotos do Resultado</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {review.ds_fotos_antes?.map((foto, index) => (
              <div key={`antes-${index}`} className="relative">
                <Image
                  src={foto}
                  alt={`Antes ${index + 1}`}
                  width={200}
                  height={200}
                  className="rounded-lg object-cover w-full h-32"
                />
                <span className="absolute top-2 left-2 px-2 py-0.5 bg-gray-900/80 text-white text-xs rounded-full">
                  Antes
                </span>
              </div>
            ))}
            {review.ds_fotos_depois?.map((foto, index) => (
              <div key={`depois-${index}`} className="relative">
                <Image
                  src={foto}
                  alt={`Depois ${index + 1}`}
                  width={200}
                  height={200}
                  className="rounded-lg object-cover w-full h-32"
                />
                <span className="absolute top-2 left-2 px-2 py-0.5 bg-green-600 text-white text-xs rounded-full">
                  Depois
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2 italic">
            ⚠️ Resultados individuais podem variar. Fotos moderadas e autorizadas pelo paciente.
          </p>
        </div>
      )}

      {/* Resposta do Profissional */}
      {review.ds_resposta_profissional && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <div className="h-8 w-8 bg-purple-600 rounded-full flex items-center justify-center">
              <BadgeCheck className="h-5 w-5 text-white" />
            </div>
            <span className="font-semibold text-purple-900">Resposta do Profissional</span>
          </div>
          <p className="text-gray-700 text-sm">{review.ds_resposta_profissional}</p>
        </div>
      )}

      {/* Útil? */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          Esta avaliação foi útil?{" "}
          <span className="font-medium text-gray-900">
            {utilCount} {utilCount === 1 ? "pessoa achou" : "pessoas acharam"} útil
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleVote(true)}
            disabled={hasVoted}
            className={`transition-all ${hasVoted ? "opacity-50 cursor-not-allowed" : "hover:bg-green-50 hover:border-green-300"}`}
          >
            <ThumbsUp className="h-4 w-4 mr-1" />
            Útil
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleVote(false)}
            disabled={hasVoted}
            className={`transition-all ${hasVoted ? "opacity-50 cursor-not-allowed" : "hover:bg-red-50 hover:border-red-300"}`}
          >
            <ThumbsDown className="h-4 w-4 mr-1" />
            Não útil
          </Button>
        </div>
      </div>
    </div>
  );
}
