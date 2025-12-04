"use client";

import { Calendar, Clock, MapPin, User, FileText, Image as ImageIcon, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EvolucaoClinica } from "@/types/prontuario";

interface TreatmentTimelineProps {
  evolucoes: EvolucaoClinica[];
  professionalName?: string;
}

interface TimelineItemProps {
  evolucao: EvolucaoClinica;
  isFirst: boolean;
  isLast: boolean;
  professionalName?: string;
}

function TimelineItem({ evolucao, isFirst, isLast, professionalName }: TimelineItemProps) {
  const [expanded, setExpanded] = useState(isFirst);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  };

  const getStatusColor = () => {
    if (evolucao.bo_reacoes_adversas) {
      return "bg-amber-500";
    }
    return "bg-green-500";
  };

  const getStatusLabel = () => {
    if (evolucao.bo_reacoes_adversas) {
      return "Atenção";
    }
    return "Realizado";
  };

  const hasPhotos = (evolucao.ds_fotos_antes && evolucao.ds_fotos_antes.length > 0) ||
                    (evolucao.ds_fotos_depois && evolucao.ds_fotos_depois.length > 0);

  return (
    <div className="relative">
      {/* Connector Line */}
      {!isLast && (
        <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-gradient-to-b from-blue-300 to-purple-300" />
      )}

      {/* Timeline Node */}
      <div className="flex items-start space-x-4">
        {/* Icon Circle */}
        <div className="relative z-10 flex-shrink-0">
          <div className={`w-12 h-12 rounded-full ${getStatusColor()} flex items-center justify-center shadow-lg`}>
            <Calendar className="h-6 w-6 text-white" />
          </div>
          {isFirst && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 rounded-full border-2 border-white animate-pulse" />
          )}
        </div>

        {/* Content Card */}
        <div className="flex-1 mb-8">
          <div className="bg-white rounded-xl border-2 border-gray-200 shadow-md hover:shadow-lg transition-all overflow-hidden">
            {/* Header */}
            <div
              onClick={() => setExpanded(!expanded)}
              className="px-6 py-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200 cursor-pointer hover:from-blue-100 hover:to-purple-100 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-bold text-gray-900">{evolucao.ds_procedimento_realizado}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor()} text-white`}>
                      {getStatusLabel()}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(evolucao.dt_evolucao)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{evolucao.hr_evolucao}</span>
                    </div>
                    {evolucao.ds_area_tratada && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                        <span className="truncate max-w-xs">{evolucao.ds_area_tratada}</span>
                      </div>
                    )}
                  </div>
                </div>

                <button className="text-gray-400 hover:text-gray-600 transition-colors">
                  {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Expanded Content */}
            {expanded && (
              <div className="px-6 py-4 space-y-4">
                {/* Motivo */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Motivo da Consulta</p>
                  <p className="text-gray-700">{evolucao.ds_motivo_consulta}</p>
                </div>

                {/* Evolução Clínica */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Evolução Clínica</p>
                  <p className="text-gray-700 leading-relaxed">{evolucao.ds_evolucao_clinica}</p>
                </div>

                {/* Produtos Utilizados */}
                {evolucao.ds_produtos_utilizados && evolucao.ds_produtos_utilizados.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Produtos Utilizados</p>
                    <div className="flex flex-wrap gap-2">
                      {evolucao.ds_produtos_utilizados.map((produto, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full font-medium"
                        >
                          {produto}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantidade */}
                {evolucao.nr_quantidade_aplicada && evolucao.nr_quantidade_aplicada > 0 && (
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="text-gray-600">Quantidade aplicada:</span>
                    <span className="font-semibold text-gray-900">
                      {evolucao.nr_quantidade_aplicada} {evolucao.ds_unidade_medida}
                    </span>
                  </div>
                )}

                {/* Orientações */}
                {evolucao.ds_orientacoes_pos_procedimento && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-xs font-semibold text-green-800 uppercase mb-2 flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      Orientações Pós-Procedimento
                    </p>
                    <p className="text-sm text-green-900">{evolucao.ds_orientacoes_pos_procedimento}</p>
                  </div>
                )}

                {/* Reações Adversas */}
                {evolucao.bo_reacoes_adversas && evolucao.ds_reacoes && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-xs font-semibold text-amber-800 uppercase mb-2">Reações Adversas</p>
                    <p className="text-sm text-amber-900">{evolucao.ds_reacoes}</p>
                  </div>
                )}

                {/* Fotos */}
                {hasPhotos && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-3 flex items-center">
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Registros Fotográficos
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      {evolucao.ds_fotos_antes && evolucao.ds_fotos_antes.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-blue-600 mb-2">ANTES</p>
                          <div className="grid grid-cols-2 gap-2">
                            {evolucao.ds_fotos_antes.map((foto, index) => (
                              <div key={index} className="aspect-square rounded-lg overflow-hidden border-2 border-blue-200">
                                <img src={foto} alt={`Antes ${index + 1}`} className="w-full h-full object-cover" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {evolucao.ds_fotos_depois && evolucao.ds_fotos_depois.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-green-600 mb-2">DEPOIS</p>
                          <div className="grid grid-cols-2 gap-2">
                            {evolucao.ds_fotos_depois.map((foto, index) => (
                              <div key={index} className="aspect-square rounded-lg overflow-hidden border-2 border-green-200">
                                <img src={foto} alt={`Depois ${index + 1}`} className="w-full h-full object-cover" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Retorno */}
                {evolucao.dt_retorno_previsto && (
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>Retorno previsto: {formatDate(evolucao.dt_retorno_previsto)}</span>
                    </div>
                    {evolucao.nr_sessao_atual && evolucao.nr_sessoes_previstas && (
                      <div className="text-sm text-gray-600">
                        Sessão {evolucao.nr_sessao_atual} de {evolucao.nr_sessoes_previstas}
                      </div>
                    )}
                  </div>
                )}

                {/* Assinatura */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <User className="h-4 w-4" />
                    <span>{evolucao.ds_assinatura_profissional}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function TreatmentTimeline({ evolucoes, professionalName }: TreatmentTimelineProps) {
  const [showAll, setShowAll] = useState(false);

  const sortedEvolucoes = [...evolucoes].sort(
    (a, b) => new Date(b.dt_evolucao).getTime() - new Date(a.dt_evolucao).getTime()
  );

  const displayedEvolucoes = showAll ? sortedEvolucoes : sortedEvolucoes.slice(0, 5);

  if (evolucoes.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-xl">
        <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum tratamento registrado</h3>
        <p className="text-gray-600">O histórico de tratamentos aparecerá aqui</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Linha do Tempo de Tratamentos</h3>
          <p className="text-sm text-gray-600 mt-1">
            {evolucoes.length} procedimento{evolucoes.length !== 1 ? "s" : ""} realizado{evolucoes.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {displayedEvolucoes.map((evolucao, index) => (
          <TimelineItem
            key={evolucao.id_evolucao}
            evolucao={evolucao}
            isFirst={index === 0}
            isLast={index === displayedEvolucoes.length - 1}
            professionalName={professionalName}
          />
        ))}
      </div>

      {/* Show More Button */}
      {evolucoes.length > 5 && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => setShowAll(!showAll)}
            className="text-blue-600 border-blue-300 hover:bg-blue-50"
          >
            {showAll ? (
              <>
                <ChevronUp className="h-4 w-4 mr-2" />
                Mostrar Menos
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-2" />
                Mostrar Todos ({evolucoes.length - 5} restantes)
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
