"use client";

import { useState, useEffect } from "react";
import { X, Calendar, Clock, User, FileText, Search, AlertCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Agendamento, Paciente, Procedimento, Profissional } from "@/types/agenda";
import { toast } from "sonner";

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (agendamento: Partial<Agendamento>) => void;
  selectedDate?: Date;
  editingAppointment?: Agendamento | null;
}

export function AppointmentModal({
  isOpen,
  onClose,
  onSave,
  selectedDate,
  editingAppointment,
}: AppointmentModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<Agendamento>>({
    dt_agendamento: selectedDate ? selectedDate.toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    hr_inicio: "09:00",
    hr_fim: "10:00",
    nr_duracao_minutos: 60,
    st_status: "pendente",
    bo_primeira_vez: false,
    bo_confirmado_sms: false,
    bo_confirmado_whatsapp: false,
  });

  // Mock data - substituir por chamadas à API
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [procedimentos, setProcedimentos] = useState<Procedimento[]>([]);
  const [profissionais] = useState<Profissional[]>([
    {
      id_profissional: "prof1",
      nm_completo: "Dra. Ana Paula Oliveira",
      nm_especialidade: "Dermatologia Estética",
      ds_cor_agenda: "#3B82F6",
    },
  ]);

  const [searchPaciente, setSearchPaciente] = useState("");
  const [showPacienteDropdown, setShowPacienteDropdown] = useState(false);
  const [selectedPaciente, setSelectedPaciente] = useState<Paciente | null>(null);
  const [selectedProcedimento, setSelectedProcedimento] = useState<Procedimento | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchPacientes();
      fetchProcedimentos();

      if (editingAppointment) {
        setFormData(editingAppointment);
        setSelectedPaciente(editingAppointment.paciente || null);
        setSelectedProcedimento(editingAppointment.procedimento || null);
      }
    }
  }, [isOpen, editingAppointment]);

  const fetchPacientes = async () => {
    // Mock data
    const mockPacientes: Paciente[] = [
      {
        id_paciente: "pac1",
        nm_completo: "Maria Silva Santos",
        nr_telefone: "(11) 98765-4321",
        nm_email: "maria.silva@email.com",
        ds_foto_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces",
        nr_faltas_historico: 0,
      },
      {
        id_paciente: "pac2",
        nm_completo: "João Pedro Costa",
        nr_telefone: "(11) 97654-3210",
        nm_email: "joao.costa@email.com",
        nr_faltas_historico: 1,
      },
      {
        id_paciente: "pac3",
        nm_completo: "Ana Paula Oliveira",
        nr_telefone: "(11) 96543-2109",
        nm_email: "ana.oliveira@email.com",
        ds_foto_url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=faces",
        nr_faltas_historico: 0,
      },
      {
        id_paciente: "pac4",
        nm_completo: "Beatriz Fernandes",
        nr_telefone: "(11) 95432-1098",
        nm_email: "beatriz.fernandes@email.com",
        nr_faltas_historico: 0,
      },
      {
        id_paciente: "pac5",
        nm_completo: "Carlos Eduardo Silva",
        nr_telefone: "(11) 94321-0987",
        nm_email: "carlos.silva@email.com",
        nr_faltas_historico: 2,
      },
    ];
    setPacientes(mockPacientes);
  };

  const fetchProcedimentos = async () => {
    // Mock data
    const mockProcedimentos: Procedimento[] = [
      {
        id_procedimento: "proc1",
        nm_procedimento: "Aplicação de Toxina Botulínica",
        nr_duracao_minutos: 60,
        vl_preco: 800,
        ds_cor_hex: "#3B82F6",
        nr_buffer_minutos: 15,
      },
      {
        id_procedimento: "proc2",
        nm_procedimento: "Preenchimento Labial",
        nr_duracao_minutos: 60,
        vl_preco: 1200,
        ds_cor_hex: "#A855F7",
        nr_buffer_minutos: 15,
      },
      {
        id_procedimento: "proc3",
        nm_procedimento: "Limpeza de Pele Profunda",
        nr_duracao_minutos: 45,
        vl_preco: 300,
        ds_cor_hex: "#10B981",
        nr_buffer_minutos: 10,
      },
      {
        id_procedimento: "proc4",
        nm_procedimento: "Harmonização Facial Completa",
        nr_duracao_minutos: 90,
        vl_preco: 2500,
        ds_cor_hex: "#EC4899",
        nr_buffer_minutos: 20,
      },
      {
        id_procedimento: "proc5",
        nm_procedimento: "Peeling Químico",
        nr_duracao_minutos: 50,
        vl_preco: 450,
        ds_cor_hex: "#F59E0B",
        nr_buffer_minutos: 10,
      },
      {
        id_procedimento: "proc6",
        nm_procedimento: "Microagulhamento com Drug Delivery",
        nr_duracao_minutos: 60,
        vl_preco: 600,
        ds_cor_hex: "#8B5CF6",
        nr_buffer_minutos: 15,
      },
    ];
    setProcedimentos(mockProcedimentos);
  };

  const filteredPacientes = pacientes.filter((p) =>
    p.nm_completo.toLowerCase().includes(searchPaciente.toLowerCase()) ||
    p.nm_email.toLowerCase().includes(searchPaciente.toLowerCase()) ||
    p.nr_telefone.includes(searchPaciente)
  );

  const handleSelectPaciente = (paciente: Paciente) => {
    setSelectedPaciente(paciente);
    setSearchPaciente(paciente.nm_completo);
    setShowPacienteDropdown(false);
    setFormData({
      ...formData,
      id_paciente: paciente.id_paciente,
      paciente: paciente,
    });
  };

  const handleSelectProcedimento = (procedimento: Procedimento) => {
    setSelectedProcedimento(procedimento);

    // Calcular hora de fim baseado na duração
    const [horaInicio, minutoInicio] = (formData.hr_inicio || "09:00").split(":").map(Number);
    const totalMinutos = horaInicio * 60 + minutoInicio + procedimento.nr_duracao_minutos;
    const horaFim = Math.floor(totalMinutos / 60);
    const minutoFim = totalMinutos % 60;
    const hr_fim = `${String(horaFim).padStart(2, "0")}:${String(minutoFim).padStart(2, "0")}`;

    setFormData({
      ...formData,
      id_procedimento: procedimento.id_procedimento,
      procedimento: procedimento,
      nr_duracao_minutos: procedimento.nr_duracao_minutos,
      hr_fim: hr_fim,
    });
  };

  const handleTimeChange = (field: "hr_inicio" | "hr_fim", value: string) => {
    setFormData({ ...formData, [field]: value });

    if (field === "hr_inicio" && selectedProcedimento) {
      // Recalcular hora de fim
      const [hora, minuto] = value.split(":").map(Number);
      const totalMinutos = hora * 60 + minuto + selectedProcedimento.nr_duracao_minutos;
      const horaFim = Math.floor(totalMinutos / 60);
      const minutoFim = totalMinutos % 60;
      const hr_fim = `${String(horaFim).padStart(2, "0")}:${String(minutoFim).padStart(2, "0")}`;
      setFormData({ ...formData, hr_inicio: value, hr_fim: hr_fim });
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!selectedPaciente) {
          toast.error("Por favor, selecione um paciente");
          return false;
        }
        return true;
      case 2:
        if (!selectedProcedimento) {
          toast.error("Por favor, selecione um procedimento");
          return false;
        }
        return true;
      case 3:
        if (!formData.dt_agendamento || !formData.hr_inicio) {
          toast.error("Por favor, preencha a data e horário");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = () => {
    if (!validateStep(3)) return;

    const agendamento: Partial<Agendamento> = {
      ...formData,
      id_profissional: profissionais[0].id_profissional,
      profissional: profissionais[0],
      dt_criacao: new Date().toISOString(),
      dt_atualizacao: new Date().toISOString(),
      id_usuario_criacao: profissionais[0].id_profissional,
    };

    onSave(agendamento);
    toast.success("Agendamento criado com sucesso!");
    onClose();
    resetForm();
  };

  const resetForm = () => {
    setCurrentStep(1);
    setFormData({
      dt_agendamento: selectedDate ? selectedDate.toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      hr_inicio: "09:00",
      hr_fim: "10:00",
      nr_duracao_minutos: 60,
      st_status: "pendente",
      bo_primeira_vez: false,
      bo_confirmado_sms: false,
      bo_confirmado_whatsapp: false,
    });
    setSelectedPaciente(null);
    setSelectedProcedimento(null);
    setSearchPaciente("");
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  if (!isOpen) return null;

  const steps = [
    { number: 1, title: "Paciente", icon: User },
    { number: 2, title: "Procedimento", icon: FileText },
    { number: 3, title: "Data e Horário", icon: Calendar },
    { number: 4, title: "Confirmação", icon: Check },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                {editingAppointment ? "Editar Agendamento" : "Novo Agendamento"}
              </h2>
              <p className="text-white/80 mt-1">Preencha os dados para criar um novo agendamento</p>
            </div>
            <button onClick={handleClose} className="text-white hover:text-white/80 transition-colors">
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="mt-6 flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                      currentStep >= step.number
                        ? "bg-white text-blue-600"
                        : "bg-white/20 text-white/60"
                    }`}
                  >
                    <step.icon className="h-5 w-5" />
                  </div>
                  <span
                    className={`text-xs mt-2 font-medium ${
                      currentStep >= step.number ? "text-white" : "text-white/60"
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 mx-2 transition-colors ${
                      currentStep > step.number ? "bg-white" : "bg-white/20"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Paciente */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Buscar Paciente <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchPaciente}
                      onChange={(e) => {
                        setSearchPaciente(e.target.value);
                        setShowPacienteDropdown(true);
                      }}
                      onFocus={() => setShowPacienteDropdown(true)}
                      placeholder="Digite o nome, e-mail ou telefone do paciente..."
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Dropdown */}
                  {showPacienteDropdown && filteredPacientes.length > 0 && (
                    <div className="absolute z-10 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl max-h-64 overflow-y-auto">
                      {filteredPacientes.map((paciente) => (
                        <button
                          key={paciente.id_paciente}
                          onClick={() => handleSelectPaciente(paciente)}
                          className="w-full flex items-center space-x-3 p-4 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                        >
                          {paciente.ds_foto_url ? (
                            <img
                              src={paciente.ds_foto_url}
                              alt={paciente.nm_completo}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                              <User className="h-6 w-6 text-white" />
                            </div>
                          )}
                          <div className="flex-1 text-left">
                            <p className="font-semibold text-gray-900">{paciente.nm_completo}</p>
                            <p className="text-sm text-gray-600">{paciente.nm_email}</p>
                            <p className="text-sm text-gray-500">{paciente.nr_telefone}</p>
                          </div>
                          {paciente.nr_faltas_historico && paciente.nr_faltas_historico > 0 && (
                            <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
                              {paciente.nr_faltas_historico} falta(s)
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Selected Patient Display */}
              {selectedPaciente && (
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-blue-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Paciente Selecionado:</h3>
                  <div className="flex items-center space-x-4">
                    {selectedPaciente.ds_foto_url ? (
                      <img
                        src={selectedPaciente.ds_foto_url}
                        alt={selectedPaciente.nm_completo}
                        className="w-16 h-16 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <User className="h-8 w-8 text-white" />
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-gray-900 text-lg">{selectedPaciente.nm_completo}</p>
                      <p className="text-sm text-gray-600">{selectedPaciente.nm_email}</p>
                      <p className="text-sm text-gray-600">{selectedPaciente.nr_telefone}</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.bo_primeira_vez}
                        onChange={(e) => setFormData({ ...formData, bo_primeira_vez: e.target.checked })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Este é o primeiro atendimento deste paciente</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Procedimento */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Selecione o Procedimento <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {procedimentos.map((procedimento) => (
                    <button
                      key={procedimento.id_procedimento}
                      onClick={() => handleSelectProcedimento(procedimento)}
                      className={`text-left p-4 rounded-xl border-2 transition-all hover:shadow-md ${
                        selectedProcedimento?.id_procedimento === procedimento.id_procedimento
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-blue-300"
                      }`}
                      style={{
                        borderLeftWidth: "6px",
                        borderLeftColor: procedimento.ds_cor_hex,
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-bold text-gray-900">{procedimento.nm_procedimento}</h4>
                        {selectedProcedimento?.id_procedimento === procedimento.id_procedimento && (
                          <Check className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p className="flex items-center space-x-2">
                          <Clock className="h-4 w-4" />
                          <span>{procedimento.nr_duracao_minutos} minutos</span>
                        </p>
                        <p className="font-semibold text-gray-900">
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(procedimento.vl_preco)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {selectedProcedimento && (
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border-2 border-purple-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Procedimento Selecionado:</h3>
                  <div
                    className="flex items-center space-x-2 mb-2"
                    style={{ color: selectedProcedimento.ds_cor_hex }}
                  >
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: selectedProcedimento.ds_cor_hex }}
                    />
                    <h4 className="font-bold text-lg text-gray-900">{selectedProcedimento.nm_procedimento}</h4>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Duração</p>
                      <p className="font-semibold text-gray-900">{selectedProcedimento.nr_duracao_minutos} min</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Valor</p>
                      <p className="font-semibold text-gray-900">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(selectedProcedimento.vl_preco)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Buffer</p>
                      <p className="font-semibold text-gray-900">{selectedProcedimento.nr_buffer_minutos} min</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Data e Horário */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Data <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.dt_agendamento}
                    onChange={(e) => setFormData({ ...formData, dt_agendamento: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Horário de Início <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={formData.hr_inicio}
                    onChange={(e) => handleTimeChange("hr_inicio", e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {selectedProcedimento && (
                <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-6 border-2 border-green-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Resumo do Agendamento:</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Horário de término:</span>
                      <span className="font-bold text-gray-900">{formData.hr_fim}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Duração total:</span>
                      <span className="font-bold text-gray-900">{formData.nr_duracao_minutos} minutos</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Buffer após procedimento:</span>
                      <span className="font-bold text-gray-900">{selectedProcedimento.nr_buffer_minutos} minutos</span>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Observações (opcional)
                </label>
                <textarea
                  value={formData.ds_observacoes || ""}
                  onChange={(e) => setFormData({ ...formData, ds_observacoes: e.target.value })}
                  rows={4}
                  placeholder="Adicione observações sobre este agendamento..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors resize-none"
                />
              </div>

              <div className="space-y-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.bo_confirmado_whatsapp}
                    onChange={(e) => setFormData({ ...formData, bo_confirmado_whatsapp: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Enviar confirmação via WhatsApp</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.bo_confirmado_sms}
                    onChange={(e) => setFormData({ ...formData, bo_confirmado_sms: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Enviar confirmação via SMS</span>
                </label>
              </div>
            </div>
          )}

          {/* Step 4: Confirmação */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-8 border-2 border-blue-200">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                    <Check className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Revise os dados do agendamento</h3>
                    <p className="text-sm text-gray-600">Confira todas as informações antes de confirmar</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Paciente */}
                  <div className="bg-white rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>Paciente</span>
                    </h4>
                    <p className="font-bold text-gray-900">{selectedPaciente?.nm_completo}</p>
                    <p className="text-sm text-gray-600">{selectedPaciente?.nr_telefone}</p>
                    {formData.bo_primeira_vez && (
                      <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                        Primeira Consulta
                      </span>
                    )}
                  </div>

                  {/* Procedimento */}
                  <div className="bg-white rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center space-x-2">
                      <FileText className="h-4 w-4" />
                      <span>Procedimento</span>
                    </h4>
                    <p className="font-bold text-gray-900">{selectedProcedimento?.nm_procedimento}</p>
                    <p className="text-sm text-gray-600">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(selectedProcedimento?.vl_preco || 0)}
                    </p>
                  </div>

                  {/* Data e Horário */}
                  <div className="bg-white rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>Data e Horário</span>
                    </h4>
                    <p className="font-bold text-gray-900">
                      {new Date(formData.dt_agendamento + "T00:00:00").toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-sm text-gray-600">
                      {formData.hr_inicio} - {formData.hr_fim} ({formData.nr_duracao_minutos} minutos)
                    </p>
                  </div>

                  {formData.ds_observacoes && (
                    <div className="bg-white rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Observações</h4>
                      <p className="text-sm text-gray-600">{formData.ds_observacoes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-2xl">
          <div className="flex items-center justify-between">
            <Button
              onClick={handleClose}
              variant="outline"
              disabled={false}
            >
              Cancelar
            </Button>

            <div className="flex items-center space-x-3">
              {currentStep > 1 && (
                <Button onClick={handlePrevious} variant="outline">
                  Voltar
                </Button>
              )}
              {currentStep < 4 ? (
                <Button
                  onClick={handleNext}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  Próximo
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Confirmar Agendamento
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
