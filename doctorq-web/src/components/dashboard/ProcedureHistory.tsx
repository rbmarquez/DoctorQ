"use client";

import { FileText, Calendar, User, DollarSign, Star, ChevronRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HistoryItem {
  id: string;
  procedureName: string;
  professionalName: string;
  date: string;
  status: "completed" | "reviewed" | "pending_review";
  price: number;
  rating?: number;
}

interface ProcedureHistoryProps {
  history?: HistoryItem[];
  limit?: number;
}

export function ProcedureHistory({ history = [], limit = 5 }: ProcedureHistoryProps) {
  // Usar dados reais passados via props - sem mock data
  const historyData: HistoryItem[] = history;

  const displayedHistory = limit ? historyData.slice(0, limit) : historyData;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusBadge = (status: HistoryItem["status"]) => {
    switch (status) {
      case "completed":
        return (
          <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
            <CheckCircle className="h-3 w-3 mr-1" />
            Concluído
          </span>
        );
      case "reviewed":
        return (
          <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
            <Star className="h-3 w-3 mr-1" />
            Avaliado
          </span>
        );
      case "pending_review":
        return (
          <span className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">
            <Star className="h-3 w-3 mr-1" />
            Avaliar
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <FileText className="h-5 w-5 text-blue-600 mr-2" />
            Histórico de Procedimentos
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {historyData.length} procedimento{historyData.length !== 1 ? "s" : ""} realizado
            {historyData.length !== 1 ? "s" : ""}
          </p>
        </div>
        {historyData.length > limit && (
          <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
            Ver todos
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        )}
      </div>

      {historyData.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 text-sm">Nenhum procedimento realizado ainda</p>
          <p className="text-gray-500 text-xs mt-1">Seu histórico aparecerá aqui após concluir procedimentos</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedHistory.map((item) => (
          <div
            key={item.id}
            className="p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {item.procedureName}
                  </h4>
                  {getStatusBadge(item.status)}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <User className="h-4 w-4" />
                    <span>{item.professionalName}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(item.date)}</span>
                  </div>
                </div>
              </div>

              <div className="text-right ml-4">
                <div className="flex items-center space-x-1 text-blue-600 font-bold mb-2">
                  <DollarSign className="h-4 w-4" />
                  <span>R$ {item.price}</span>
                </div>
                {item.rating && (
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-semibold text-gray-900">{item.rating}.0</span>
                  </div>
                )}
              </div>
            </div>

            {item.status === "pending_review" && (
              <Button
                size="sm"
                variant="outline"
                className="w-full border-yellow-300 text-yellow-700 hover:bg-yellow-50"
              >
                <Star className="mr-2 h-4 w-4" />
                Avaliar Este Procedimento
              </Button>
            )}
          </div>
          ))}
        </div>
      )}

      {/* Summary Footer - só mostra se houver histórico */}
      {historyData.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{historyData.length}</p>
            <p className="text-xs text-gray-600 mt-1">Total</p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">
              {historyData.filter((h) => h.status === "reviewed").length}
            </p>
            <p className="text-xs text-gray-600 mt-1">Avaliados</p>
          </div>
          <div className="p-3 bg-yellow-50 rounded-lg">
            <p className="text-2xl font-bold text-yellow-600">
              {historyData.filter((h) => h.status === "pending_review").length}
            </p>
            <p className="text-xs text-gray-600 mt-1">Pendentes</p>
          </div>
        </div>
        </div>
      )}
    </div>
  );
}
