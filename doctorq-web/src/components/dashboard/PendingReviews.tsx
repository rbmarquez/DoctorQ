"use client";

import { Star, Clock, AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PendingReview {
  id: string;
  procedureName: string;
  professionalName: string;
  date: string;
  daysAgo: number;
}

interface PendingReviewsProps {
  reviews?: PendingReview[];
  onReviewClick?: (id: string) => void;
}

export function PendingReviews({ reviews = [], onReviewClick }: PendingReviewsProps) {
  // Usar dados reais passados via props - sem mock data
  const pendingReviews: PendingReview[] = reviews;

  const handleReview = (id: string) => {
    if (onReviewClick) {
      onReviewClick(id);
    } else {
      // Default behavior: scroll to review section or navigate
      console.log("Review appointment:", id);
    }
  };

  if (pendingReviews.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Avaliações Pendentes</h3>
          <Star className="h-5 w-5 text-gray-400" />
        </div>
        <div className="text-center py-8">
          <Star className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 text-sm">Nenhuma avaliação pendente</p>
          <p className="text-gray-500 text-xs mt-1">Você está em dia!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center">
            Avaliações Pendentes
            <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">
              {pendingReviews.length}
            </span>
          </h3>
          <p className="text-sm text-gray-600 mt-1">Ajude outros pacientes compartilhando sua experiência</p>
        </div>
        <AlertCircle className="h-5 w-5 text-yellow-500" />
      </div>

      <div className="space-y-3">
        {pendingReviews.map((review) => (
          <div
            key={review.id}
            className="p-4 rounded-lg border border-yellow-100 bg-yellow-50 hover:bg-yellow-100 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 text-sm mb-1">{review.procedureName}</h4>
                <p className="text-xs text-gray-600 mb-2">{review.professionalName}</p>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <Clock className="h-3 w-3" />
                  <span>Realizado há {review.daysAgo} dias</span>
                </div>
              </div>
            </div>

            {/* Star Rating Preview */}
            <div className="flex items-center space-x-1 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className="h-5 w-5 text-gray-300 hover:text-yellow-400 cursor-pointer transition-colors"
                />
              ))}
            </div>

            <Button
              onClick={() => handleReview(review.id)}
              size="sm"
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white"
            >
              <Star className="mr-2 h-4 w-4" />
              Avaliar Agora
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* Incentive Message */}
      <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-100">
        <p className="text-xs text-purple-900 font-medium">
          💡 <strong>Dica:</strong> Avaliações honestas ajudam outros pacientes a escolherem o melhor profissional!
        </p>
      </div>
    </div>
  );
}
