import Link from "next/link";
import { MapPin, DollarSign, Clock, Building2, Star, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Vaga } from "@/types/carreiras";

interface VagaCardProps {
  vaga: Vaga;
  showEmpresa?: boolean;
}

export function VagaCard({ vaga, showEmpresa = true }: VagaCardProps) {
  const salarioTexto = vaga.fg_salario_a_combinar
    ? "A combinar"
    : vaga.vl_salario_min && vaga.vl_salario_max
    ? `R$ ${vaga.vl_salario_min.toLocaleString('pt-BR')} - R$ ${vaga.vl_salario_max.toLocaleString('pt-BR')}`
    : vaga.vl_salario_min
    ? `A partir de R$ ${vaga.vl_salario_min.toLocaleString('pt-BR')}`
    : "Não informado";

  const tipoContratoLabel = {
    clt: "CLT",
    pj: "PJ",
    estagio: "Estágio",
    temporario: "Temporário",
    freelance: "Freelance",
  }[vaga.nm_tipo_contrato];

  const regimeTrabalhoLabel = {
    presencial: "Presencial",
    remoto: "Remoto",
    hibrido: "Híbrido",
  }[vaga.nm_regime_trabalho];

  return (
    <div className="group bg-white rounded-2xl p-6 border border-gray-200 hover:border-indigo-300 hover:shadow-xl transition-all duration-300 cursor-pointer">
      <Link href={`/carreiras/vagas/${vaga.id_vaga}`}>
        <div className="flex items-start gap-4 mb-4">
          {/* Logo */}
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
            {vaga.ds_logo_empresa ? (
              <img
                src={vaga.ds_logo_empresa}
                alt={vaga.nm_empresa}
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <Building2 className="w-7 h-7 text-white" />
            )}
          </div>

          {/* Header */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors line-clamp-1">
              {vaga.nm_cargo}
            </h3>
            {showEmpresa && (
              <p className="text-sm text-gray-600 line-clamp-1">{vaga.nm_empresa}</p>
            )}
          </div>

          {/* Badges */}
          <div className="flex gap-2">
            {vaga.fg_destaque && (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full flex items-center gap-1">
                <Star className="w-3 h-3 fill-yellow-400" />
                Destaque
              </span>
            )}
          </div>
        </div>

        {/* Resumo */}
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{vaga.ds_resumo}</p>

        {/* Informações */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span>
              {vaga.nm_cidade}, {vaga.nm_estado}
              {vaga.fg_aceita_remoto && " • Remoto"}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <DollarSign className="w-4 h-4 text-green-600" />
            <span className="font-semibold text-gray-900">{salarioTexto}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4 text-gray-400" />
            <span>
              {tipoContratoLabel} • {regimeTrabalhoLabel}
            </span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full">
            {vaga.nm_area}
          </span>
          <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded-full capitalize">
            {vaga.nm_nivel}
          </span>
          {vaga.ds_beneficios?.slice(0, 2).map((beneficio, idx) => (
            <span
              key={idx}
              className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
            >
              {beneficio}
            </span>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            {vaga.nr_candidatos !== undefined && vaga.nr_candidatos > 0 && (
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {vaga.nr_candidatos} candidato{vaga.nr_candidatos !== 1 ? "s" : ""}
              </span>
            )}
            <span>
              Publicada há{" "}
              {Math.floor(
                (new Date().getTime() - new Date(vaga.dt_criacao).getTime()) /
                  (1000 * 60 * 60 * 24)
              )}{" "}
              dias
            </span>
          </div>

          <Button
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            Ver Detalhes
          </Button>
        </div>
      </Link>
    </div>
  );
}
