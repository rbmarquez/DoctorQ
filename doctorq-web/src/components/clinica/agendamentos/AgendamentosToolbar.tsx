"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, Filter, Plus, Search, X } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface FilterState {
  search?: string;
  status?: string;
  procedimento?: string;
  dataInicio?: string;
  dataFim?: string;
}

interface AgendamentosToolbarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onNovoAgendamento: () => void;
  onExportPDF?: () => void;
  onExportExcel?: () => void;
  procedimentos?: any[];
  totalAgendamentos?: number;
}

const STATUS_OPTIONS = [
  { value: "todos", label: "Todos os Status" },
  { value: "agendado", label: "Agendado" },
  { value: "confirmado", label: "Confirmado" },
  { value: "em_atendimento", label: "Em Atendimento" },
  { value: "concluido", label: "Concluído" },
  { value: "cancelado", label: "Cancelado" },
  { value: "nao_compareceu", label: "Não Compareceu" },
];

export function AgendamentosToolbar({
  filters,
  onFiltersChange,
  onNovoAgendamento,
  onExportPDF,
  onExportExcel,
  procedimentos = [],
  totalAgendamentos = 0,
}: AgendamentosToolbarProps) {
  const handleClearFilters = () => {
    onFiltersChange({});
    toast.info("Filtros limpos");
  };

  const hasActiveFilters = Object.values(filters).some((value) => value && value !== "todos");

  const handleExportPDF = () => {
    if (onExportPDF) {
      onExportPDF();
    } else {
      toast.info("Exportação PDF em desenvolvimento");
    }
  };

  const handleExportExcel = () => {
    if (onExportExcel) {
      onExportExcel();
    } else {
      // Implementação básica de exportação CSV
      const csvContent = "data:text/csv;charset=utf-8,ID,Data,Paciente,Profissional,Status\n";
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `agendamentos_${format(new Date(), "yyyy-MM-dd")}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Exportação Excel iniciada");
    }
  };

  return (
    <div className="space-y-4">
      {/* Barra de ações principais */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button onClick={onNovoAgendamento} className="bg-gradient-to-r from-blue-600 to-indigo-600">
            <Plus className="h-4 w-4 mr-2" />
            Novo Agendamento
          </Button>

          <div className="text-sm text-gray-600">
            <span className="font-semibold">{totalAgendamentos}</span> agendamentos encontrados
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <FileText className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel}>
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <Filter className="h-5 w-5 text-gray-500" />

        {/* Busca */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por paciente ou profissional..."
              value={filters.search || ""}
              onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
              className="pl-10"
            />
          </div>
        </div>

        {/* Status */}
        <Select
          value={filters.status || "todos"}
          onValueChange={(value) => onFiltersChange({ ...filters, status: value === "todos" ? undefined : value })}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Procedimento */}
        {procedimentos.length > 0 && (
          <Select
            value={filters.procedimento || "todos"}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, procedimento: value === "todos" ? undefined : value })
            }
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Procedimento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Procedimentos</SelectItem>
              {procedimentos.map((proc: any) => (
                <SelectItem key={proc.id_procedimento} value={proc.id_procedimento}>
                  {proc.nm_procedimento}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Data Início */}
        <Input
          type="date"
          value={filters.dataInicio || ""}
          onChange={(e) => onFiltersChange({ ...filters, dataInicio: e.target.value })}
          className="w-[150px]"
          placeholder="Data início"
        />

        {/* Data Fim */}
        <Input
          type="date"
          value={filters.dataFim || ""}
          onChange={(e) => onFiltersChange({ ...filters, dataFim: e.target.value })}
          className="w-[150px]"
          placeholder="Data fim"
        />

        {/* Limpar filtros */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={handleClearFilters}>
            <X className="h-4 w-4 mr-2" />
            Limpar
          </Button>
        )}
      </div>
    </div>
  );
}
