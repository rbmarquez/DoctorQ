"use client";

import { useState } from "react";
import {
  Settings,
  Clock,
  Calendar,
  Coffee,
  AlertCircle,
  Save,
  RotateCcw,
  Bell,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfiguracaoAgenda } from "@/types/agenda";
import { toast } from "sonner";
import Link from "next/link";

export default function ConfiguracoesAgendaPage() {
  const [config, setConfig] = useState<ConfiguracaoAgenda>({
    id_configuracao: "1",
    id_profissional: "prof1",
    hr_inicio_expediente: "08:00",
    hr_fim_expediente: "19:00",
    nr_intervalo_slots_minutos: 30,
    dias_funcionamento: [1, 2, 3, 4, 5], // Seg a Sex
    hr_almoco_inicio: "12:00",
    hr_almoco_fim: "13:00",
    nr_buffer_padrao_minutos: 15,
    bo_permitir_sobreposicao: false,
    bo_bloquear_fins_semana: true,
    nr_antecedencia_minima_horas: 2,
    nr_antecedencia_maxima_dias: 90,
    bo_enviar_confirmacao_sms: true,
    bo_enviar_confirmacao_whatsapp: true,
    nr_horas_antecedencia_confirmacao: 24,
    bo_habilitar_lista_espera: true,
    dt_criacao: new Date().toISOString(),
    dt_atualizacao: new Date().toISOString(),
  });

  const [hasChanges, setHasChanges] = useState(false);

  const diasSemana = [
    { value: 0, label: "Domingo" },
    { value: 1, label: "Segunda-feira" },
    { value: 2, label: "Terça-feira" },
    { value: 3, label: "Quarta-feira" },
    { value: 4, label: "Quinta-feira" },
    { value: 5, label: "Sexta-feira" },
    { value: 6, label: "Sábado" },
  ];

  const handleConfigChange = (field: keyof ConfiguracaoAgenda, value: any) => {
    setConfig({ ...config, [field]: value });
    setHasChanges(true);
  };

  const toggleDiaFuncionamento = (dia: number) => {
    const dias = [...config.dias_funcionamento];
    const index = dias.indexOf(dia);

    if (index > -1) {
      dias.splice(index, 1);
    } else {
      dias.push(dia);
      dias.sort();
    }

    handleConfigChange("dias_funcionamento", dias);
  };

  const handleSave = async () => {
    try {
      // Validações
      if (config.dias_funcionamento.length === 0) {
        toast.error("Selecione pelo menos um dia de funcionamento");
        return;
      }

      if (config.hr_fim_expediente <= config.hr_inicio_expediente) {
        toast.error("O horário de fim deve ser posterior ao de início");
        return;
      }

      if (config.hr_almoco_inicio && config.hr_almoco_fim) {
        if (config.hr_almoco_fim <= config.hr_almoco_inicio) {
          toast.error("O horário de fim do almoço deve ser posterior ao de início");
          return;
        }
      }

      // Simular salvamento
      await new Promise((resolve) => setTimeout(resolve, 500));

      toast.success("Configurações salvas com sucesso!");
      setHasChanges(false);
    } catch (error) {
      toast.error("Erro ao salvar configurações");
    }
  };

  const handleReset = () => {
    // Reset para valores padrão
    setConfig({
      id_configuracao: "1",
      id_profissional: "prof1",
      hr_inicio_expediente: "08:00",
      hr_fim_expediente: "19:00",
      nr_intervalo_slots_minutos: 30,
      dias_funcionamento: [1, 2, 3, 4, 5],
      hr_almoco_inicio: "12:00",
      hr_almoco_fim: "13:00",
      nr_buffer_padrao_minutos: 15,
      bo_permitir_sobreposicao: false,
      bo_bloquear_fins_semana: true,
      nr_antecedencia_minima_horas: 2,
      nr_antecedencia_maxima_dias: 90,
      bo_enviar_confirmacao_sms: true,
      bo_enviar_confirmacao_whatsapp: true,
      nr_horas_antecedencia_confirmacao: 24,
      bo_habilitar_lista_espera: true,
      dt_criacao: new Date().toISOString(),
      dt_atualizacao: new Date().toISOString(),
    });
    setHasChanges(false);
    toast.info("Configurações resetadas para valores padrão");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/profissional/agenda">
                <Button variant="outline" className="border-white text-white hover:bg-white/10">
                  ← Voltar
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold flex items-center space-x-3">
                  <Settings className="h-8 w-8" />
                  <span>Configurações da Agenda</span>
                </h1>
                <p className="text-white/80 mt-1">Personalize o funcionamento da sua agenda</p>
              </div>
            </div>

            {hasChanges && (
              <div className="flex items-center space-x-3">
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="border-white text-white hover:bg-white/10"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Resetar
                </Button>
                <Button
                  onClick={handleSave}
                  className="bg-white text-blue-600 hover:bg-blue-50"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Horários de Funcionamento */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Horários de Funcionamento</h2>
                <p className="text-sm text-gray-600">Defina seu horário de expediente</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Início do Expediente
                  </label>
                  <input
                    type="time"
                    value={config.hr_inicio_expediente}
                    onChange={(e) => handleConfigChange("hr_inicio_expediente", e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Fim do Expediente
                  </label>
                  <input
                    type="time"
                    value={config.hr_fim_expediente}
                    onChange={(e) => handleConfigChange("hr_fim_expediente", e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Intervalo entre Slots (minutos)
                </label>
                <select
                  value={config.nr_intervalo_slots_minutos}
                  onChange={(e) =>
                    handleConfigChange("nr_intervalo_slots_minutos", parseInt(e.target.value))
                  }
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                >
                  <option value={15}>15 minutos</option>
                  <option value={30}>30 minutos</option>
                  <option value={60}>60 minutos</option>
                </select>
              </div>
            </div>
          </div>

          {/* Dias de Funcionamento */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Dias de Funcionamento</h2>
                <p className="text-sm text-gray-600">Selecione os dias que você atende</p>
              </div>
            </div>

            <div className="space-y-3">
              {diasSemana.map((dia) => (
                <label key={dia.value} className="flex items-center space-x-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={config.dias_funcionamento.includes(dia.value)}
                    onChange={() => toggleDiaFuncionamento(dia.value)}
                    className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <span className="text-gray-700 font-medium group-hover:text-purple-600 transition-colors">
                    {dia.label}
                  </span>
                </label>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.bo_bloquear_fins_semana}
                  onChange={(e) =>
                    handleConfigChange("bo_bloquear_fins_semana", e.target.checked)
                  }
                  className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Bloquear automaticamente finais de semana
                </span>
              </label>
            </div>
          </div>

          {/* Horário de Almoço */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Coffee className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Horário de Almoço</h2>
                <p className="text-sm text-gray-600">Bloqueio automático para almoço</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Início do Almoço
                  </label>
                  <input
                    type="time"
                    value={config.hr_almoco_inicio || ""}
                    onChange={(e) => handleConfigChange("hr_almoco_inicio", e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Fim do Almoço
                  </label>
                  <input
                    type="time"
                    value={config.hr_almoco_fim || ""}
                    onChange={(e) => handleConfigChange("hr_almoco_fim", e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <p className="text-sm text-orange-800">
                  <strong>Dica:</strong> O horário de almoço será bloqueado automaticamente todos os
                  dias selecionados acima.
                </p>
              </div>
            </div>
          </div>

          {/* Regras de Buffer */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-green-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Regras de Agendamento</h2>
                <p className="text-sm text-gray-600">Configure buffers e restrições</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Buffer Padrão entre Procedimentos (minutos)
                </label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={config.nr_buffer_padrao_minutos}
                  onChange={(e) =>
                    handleConfigChange("nr_buffer_padrao_minutos", parseInt(e.target.value))
                  }
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none transition-colors"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Tempo de preparação entre um paciente e outro
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Antecedência Mínima para Agendamento (horas)
                </label>
                <input
                  type="number"
                  min="0"
                  max="48"
                  value={config.nr_antecedencia_minima_horas}
                  onChange={(e) =>
                    handleConfigChange("nr_antecedencia_minima_horas", parseInt(e.target.value))
                  }
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Antecedência Máxima para Agendamento (dias)
                </label>
                <input
                  type="number"
                  min="7"
                  max="365"
                  value={config.nr_antecedencia_maxima_dias}
                  onChange={(e) =>
                    handleConfigChange("nr_antecedencia_maxima_dias", parseInt(e.target.value))
                  }
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none transition-colors"
                />
              </div>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.bo_permitir_sobreposicao}
                  onChange={(e) =>
                    handleConfigChange("bo_permitir_sobreposicao", e.target.checked)
                  }
                  className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Permitir sobreposição de horários
                </span>
              </label>
            </div>
          </div>

          {/* Confirmações e Notificações */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Bell className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Confirmações e Notificações</h2>
                <p className="text-sm text-gray-600">Configure lembretes automáticos</p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.bo_enviar_confirmacao_whatsapp}
                  onChange={(e) =>
                    handleConfigChange("bo_enviar_confirmacao_whatsapp", e.target.checked)
                  }
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Enviar confirmações via WhatsApp
                </span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.bo_enviar_confirmacao_sms}
                  onChange={(e) =>
                    handleConfigChange("bo_enviar_confirmacao_sms", e.target.checked)
                  }
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Enviar confirmações via SMS</span>
              </label>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Enviar confirmação com antecedência de (horas)
                </label>
                <select
                  value={config.nr_horas_antecedencia_confirmacao}
                  onChange={(e) =>
                    handleConfigChange("nr_horas_antecedencia_confirmacao", parseInt(e.target.value))
                  }
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                >
                  <option value={24}>24 horas antes</option>
                  <option value={48}>48 horas antes</option>
                  <option value={72}>72 horas antes</option>
                </select>
              </div>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.bo_habilitar_lista_espera}
                  onChange={(e) =>
                    handleConfigChange("bo_habilitar_lista_espera", e.target.checked)
                  }
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Habilitar lista de espera automática
                </span>
              </label>
            </div>
          </div>

          {/* Segurança e Privacidade */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Segurança e Privacidade</h2>
                <p className="text-sm text-gray-600">Informações sobre dados e LGPD</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-sm text-blue-800 mb-2">
                  <strong>✓ LGPD Compliance:</strong> Todos os dados são criptografados
                </p>
                <p className="text-sm text-blue-800 mb-2">
                  <strong>✓ Backup Automático:</strong> Dados salvos diariamente
                </p>
                <p className="text-sm text-blue-800">
                  <strong>✓ Auditoria:</strong> Todas as alterações são registradas
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Botões de Ação Fixos */}
        {hasChanges && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-amber-600">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium">Você tem alterações não salvas</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Button onClick={handleReset} variant="outline">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Descartar
                  </Button>
                  <Button
                    onClick={handleSave}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Configurações
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
