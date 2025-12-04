"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import {
  User,
  Heart,
  Activity,
  Pill,
  Scissors,
  AlertTriangle,
  Sparkles,
  Coffee,
  Cigarette,
  Wine,
  Dumbbell,
  Moon,
  Utensils,
  Users,
  Target,
  FileSignature,
  Save,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Anamnese } from "@/types/prontuario";

export default function NovaAnamnesePage() {
  const params = useParams();
  const router = useRouter();
  const id_paciente = params.id_paciente as string;

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;

  const [formData, setFormData] = useState<Partial<Anamnese>>({
    id_paciente: id_paciente,
    id_profissional: "prof1", // Mock - substituir por profissional logado
    dt_criacao: new Date().toISOString(),
    nm_completo: "",
    dt_nascimento: "",
    nr_cpf: "",
    nm_genero: "",
    nm_estado_civil: "",
    nm_profissao: "",
    nr_telefone: "",
    nm_email: "",
    ds_endereco: "",
    nm_cidade: "",
    nm_estado: "",
    nr_cep: "",
    ds_queixa_principal: "",
    ds_historico_doenca_atual: "",
    ds_alergias: "",
    ds_medicamentos_uso: [],
    bo_cirurgias_previas: false,
    ds_cirurgias: "",
    bo_doencas_cronicas: false,
    ds_doencas_cronicas: "",
    ds_tratamentos_esteticos_anteriores: "",
    ds_produtos_uso_topico: "",
    ds_habitos_cuidado_pele: "",
    bo_tabagista: false,
    nr_cigarros_dia: 0,
    bo_etilista: false,
    ds_frequencia_alcool: "",
    bo_atividade_fisica: false,
    ds_frequencia_atividade: "",
    nr_horas_sono: 8,
    ds_alimentacao: "",
    ds_historico_familiar: "",
    ds_expectativas_tratamento: "",
    ds_objetivos: "",
    bo_consentimento_tratamento: false,
    bo_consentimento_imagens: false,
  });

  const [medicamentos, setMedicamentos] = useState<string>("");

  const handleInputChange = (field: keyof Anamnese, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddMedicamento = () => {
    if (medicamentos.trim()) {
      const meds = formData.ds_medicamentos_uso || [];
      handleInputChange("ds_medicamentos_uso", [...meds, medicamentos.trim()]);
      setMedicamentos("");
    }
  };

  const handleRemoveMedicamento = (index: number) => {
    const meds = formData.ds_medicamentos_uso || [];
    handleInputChange(
      "ds_medicamentos_uso",
      meds.filter((_, i) => i !== index)
    );
  };

  const handleSubmit = async () => {
    try {
      // Validações básicas
      if (!formData.nm_completo || !formData.dt_nascimento || !formData.nr_cpf) {
        toast.error("Por favor, preencha todos os campos obrigatórios");
        return;
      }

      if (!formData.bo_consentimento_tratamento) {
        toast.error("É necessário aceitar o consentimento de tratamento");
        return;
      }

      // Mock - substituir por chamada à API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("Anamnese salva com sucesso!");
      router.push(`/profissional/prontuario/${id_paciente}`);
    } catch (error) {
      console.error("Erro ao salvar anamnese:", error);
      toast.error("Erro ao salvar anamnese");
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const steps = [
    { number: 1, title: "Dados Pessoais", icon: User },
    { number: 2, title: "Histórico Médico", icon: Heart },
    { number: 3, title: "Histórico Estético", icon: Sparkles },
    { number: 4, title: "Estilo de Vida", icon: Activity },
    { number: 5, title: "Expectativas", icon: Target },
    { number: 6, title: "Consentimento", icon: FileSignature },
  ];

  return (
    <AuthenticatedLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 text-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Nova Anamnese</h1>
                <p className="text-white/90">Questionário inicial do paciente</p>
              </div>
              <Button
                variant="outline"
                className="border-white text-white hover:bg-white/10"
                onClick={() => router.push(`/profissional/prontuario/${id_paciente}`)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between mb-4">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = currentStep === step.number;
                const isCompleted = currentStep > step.number;

                return (
                  <div key={step.number} className="flex-1">
                    <div className="flex items-center">
                      <div
                        className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                          isCompleted
                            ? "bg-green-500 border-green-500 text-white"
                            : isActive
                            ? "bg-blue-600 border-blue-600 text-white"
                            : "bg-white border-gray-300 text-gray-400"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      {index < steps.length - 1 && (
                        <div
                          className={`h-0.5 flex-1 transition-all ${
                            isCompleted ? "bg-green-500" : "bg-gray-300"
                          }`}
                        />
                      )}
                    </div>
                    <p
                      className={`mt-2 text-xs font-medium ${
                        isActive ? "text-blue-600" : "text-gray-500"
                      }`}
                    >
                      {step.title}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
            {/* Step 1: Dados Pessoais */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Dados Pessoais</h2>
                  <p className="text-gray-600">Informações básicas do paciente</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nome Completo <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={formData.nm_completo}
                      onChange={(e) => handleInputChange("nm_completo", e.target.value)}
                      placeholder="Digite o nome completo"
                      className="h-12"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Data de Nascimento <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="date"
                      value={formData.dt_nascimento}
                      onChange={(e) => handleInputChange("dt_nascimento", e.target.value)}
                      className="h-12"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      CPF <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={formData.nr_cpf}
                      onChange={(e) => handleInputChange("nr_cpf", e.target.value)}
                      placeholder="000.000.000-00"
                      className="h-12"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Gênero</label>
                    <select
                      value={formData.nm_genero}
                      onChange={(e) => handleInputChange("nm_genero", e.target.value)}
                      className="w-full h-12 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Selecione</option>
                      <option value="Feminino">Feminino</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Outro">Outro</option>
                      <option value="Prefiro não informar">Prefiro não informar</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Estado Civil</label>
                    <select
                      value={formData.nm_estado_civil}
                      onChange={(e) => handleInputChange("nm_estado_civil", e.target.value)}
                      className="w-full h-12 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Selecione</option>
                      <option value="Solteiro(a)">Solteiro(a)</option>
                      <option value="Casado(a)">Casado(a)</option>
                      <option value="Divorciado(a)">Divorciado(a)</option>
                      <option value="Viúvo(a)">Viúvo(a)</option>
                      <option value="União Estável">União Estável</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Profissão</label>
                    <Input
                      value={formData.nm_profissao}
                      onChange={(e) => handleInputChange("nm_profissao", e.target.value)}
                      placeholder="Digite a profissão"
                      className="h-12"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Telefone</label>
                    <Input
                      value={formData.nr_telefone}
                      onChange={(e) => handleInputChange("nr_telefone", e.target.value)}
                      placeholder="(00) 00000-0000"
                      className="h-12"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">E-mail</label>
                    <Input
                      type="email"
                      value={formData.nm_email}
                      onChange={(e) => handleInputChange("nm_email", e.target.value)}
                      placeholder="email@exemplo.com"
                      className="h-12"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Endereço Completo</label>
                    <Input
                      value={formData.ds_endereco}
                      onChange={(e) => handleInputChange("ds_endereco", e.target.value)}
                      placeholder="Rua, número, complemento"
                      className="h-12"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Cidade</label>
                    <Input
                      value={formData.nm_cidade}
                      onChange={(e) => handleInputChange("nm_cidade", e.target.value)}
                      placeholder="Nome da cidade"
                      className="h-12"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Estado</label>
                    <Input
                      value={formData.nm_estado}
                      onChange={(e) => handleInputChange("nm_estado", e.target.value)}
                      placeholder="UF"
                      maxLength={2}
                      className="h-12"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">CEP</label>
                    <Input
                      value={formData.nr_cep}
                      onChange={(e) => handleInputChange("nr_cep", e.target.value)}
                      placeholder="00000-000"
                      className="h-12"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Histórico Médico */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Histórico Médico</h2>
                  <p className="text-gray-600">Informações sobre saúde e tratamentos anteriores</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Queixa Principal <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.ds_queixa_principal}
                      onChange={(e) => handleInputChange("ds_queixa_principal", e.target.value)}
                      placeholder="Descreva o principal motivo da consulta"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Histórico da Doença Atual
                    </label>
                    <textarea
                      value={formData.ds_historico_doenca_atual}
                      onChange={(e) => handleInputChange("ds_historico_doenca_atual", e.target.value)}
                      placeholder="Quando começou? Como evoluiu?"
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Alergias (medicamentos, alimentos, produtos)
                    </label>
                    <textarea
                      value={formData.ds_alergias}
                      onChange={(e) => handleInputChange("ds_alergias", e.target.value)}
                      placeholder="Liste todas as alergias conhecidas"
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Medicamentos em Uso
                    </label>
                    <div className="flex space-x-2 mb-3">
                      <Input
                        value={medicamentos}
                        onChange={(e) => setMedicamentos(e.target.value)}
                        placeholder="Nome do medicamento e dosagem"
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddMedicamento();
                          }
                        }}
                        className="h-12"
                      />
                      <Button onClick={handleAddMedicamento} type="button">
                        Adicionar
                      </Button>
                    </div>
                    {formData.ds_medicamentos_uso && formData.ds_medicamentos_uso.length > 0 && (
                      <div className="space-y-2">
                        {formData.ds_medicamentos_uso.map((med, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between bg-blue-50 px-4 py-2 rounded-lg"
                          >
                            <span className="text-gray-700">{med}</span>
                            <button
                              onClick={() => handleRemoveMedicamento(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.bo_cirurgias_previas}
                        onChange={(e) => handleInputChange("bo_cirurgias_previas", e.target.checked)}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-semibold text-gray-700">
                        Já realizou alguma cirurgia?
                      </span>
                    </label>
                    {formData.bo_cirurgias_previas && (
                      <textarea
                        value={formData.ds_cirurgias}
                        onChange={(e) => handleInputChange("ds_cirurgias", e.target.value)}
                        placeholder="Descreva quais cirurgias e quando foram realizadas"
                        rows={3}
                        className="w-full mt-3 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    )}
                  </div>

                  <div>
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.bo_doencas_cronicas}
                        onChange={(e) => handleInputChange("bo_doencas_cronicas", e.target.checked)}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-semibold text-gray-700">
                        Possui alguma doença crônica?
                      </span>
                    </label>
                    {formData.bo_doencas_cronicas && (
                      <textarea
                        value={formData.ds_doencas_cronicas}
                        onChange={(e) => handleInputChange("ds_doencas_cronicas", e.target.value)}
                        placeholder="Descreva as doenças crônicas (diabetes, hipertensão, etc.)"
                        rows={3}
                        className="w-full mt-3 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Histórico Estético */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Histórico Estético</h2>
                  <p className="text-gray-600">Tratamentos e cuidados estéticos anteriores</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Tratamentos Estéticos Anteriores
                    </label>
                    <textarea
                      value={formData.ds_tratamentos_esteticos_anteriores}
                      onChange={(e) =>
                        handleInputChange("ds_tratamentos_esteticos_anteriores", e.target.value)
                      }
                      placeholder="Botox, preenchimento, peeling, laser, etc. Descreva quando foi realizado e o resultado"
                      rows={5}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Produtos de Uso Tópico
                    </label>
                    <textarea
                      value={formData.ds_produtos_uso_topico}
                      onChange={(e) => handleInputChange("ds_produtos_uso_topico", e.target.value)}
                      placeholder="Cremes, sérums, ácidos, filtro solar, etc. Marcas e frequência de uso"
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Hábitos de Cuidado com a Pele
                    </label>
                    <textarea
                      value={formData.ds_habitos_cuidado_pele}
                      onChange={(e) => handleInputChange("ds_habitos_cuidado_pele", e.target.value)}
                      placeholder="Rotina diária de skincare, frequência de limpeza, hidratação, etc."
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Estilo de Vida */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Estilo de Vida</h2>
                  <p className="text-gray-600">Hábitos e rotina diária</p>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={formData.bo_tabagista}
                          onChange={(e) => handleInputChange("bo_tabagista", e.target.checked)}
                          className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <Cigarette className="h-5 w-5 text-gray-500" />
                        <span className="text-sm font-semibold text-gray-700">Fumante</span>
                      </label>
                      {formData.bo_tabagista && (
                        <div>
                          <label className="block text-sm text-gray-600 mb-2">Cigarros por dia</label>
                          <Input
                            type="number"
                            value={formData.nr_cigarros_dia}
                            onChange={(e) => handleInputChange("nr_cigarros_dia", parseInt(e.target.value) || 0)}
                            min="0"
                            className="h-12"
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={formData.bo_etilista}
                          onChange={(e) => handleInputChange("bo_etilista", e.target.checked)}
                          className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <Wine className="h-5 w-5 text-gray-500" />
                        <span className="text-sm font-semibold text-gray-700">Consome Álcool</span>
                      </label>
                      {formData.bo_etilista && (
                        <div>
                          <label className="block text-sm text-gray-600 mb-2">Frequência</label>
                          <select
                            value={formData.ds_frequencia_alcool}
                            onChange={(e) => handleInputChange("ds_frequencia_alcool", e.target.value)}
                            className="w-full h-12 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Selecione</option>
                            <option value="Raramente">Raramente</option>
                            <option value="Socialmente">Socialmente</option>
                            <option value="Semanalmente">Semanalmente</option>
                            <option value="Diariamente">Diariamente</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.bo_atividade_fisica}
                        onChange={(e) => handleInputChange("bo_atividade_fisica", e.target.checked)}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <Dumbbell className="h-5 w-5 text-gray-500" />
                      <span className="text-sm font-semibold text-gray-700">Pratica Atividade Física</span>
                    </label>
                    {formData.bo_atividade_fisica && (
                      <div>
                        <label className="block text-sm text-gray-600 mb-2">Frequência e tipo de atividade</label>
                        <Input
                          value={formData.ds_frequencia_atividade}
                          onChange={(e) => handleInputChange("ds_frequencia_atividade", e.target.value)}
                          placeholder="Ex: Academia 3x por semana, corrida, yoga..."
                          className="h-12"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="flex items-center space-x-3 mb-3">
                      <Moon className="h-5 w-5 text-gray-500" />
                      <span className="text-sm font-semibold text-gray-700">Horas de Sono por Noite</span>
                    </label>
                    <Input
                      type="number"
                      value={formData.nr_horas_sono}
                      onChange={(e) => handleInputChange("nr_horas_sono", parseInt(e.target.value) || 8)}
                      min="0"
                      max="24"
                      className="h-12"
                    />
                  </div>

                  <div>
                    <label className="flex items-center space-x-3 mb-3">
                      <Utensils className="h-5 w-5 text-gray-500" />
                      <span className="text-sm font-semibold text-gray-700">Alimentação</span>
                    </label>
                    <textarea
                      value={formData.ds_alimentacao}
                      onChange={(e) => handleInputChange("ds_alimentacao", e.target.value)}
                      placeholder="Descreva seus hábitos alimentares (vegetariano, vegano, onívoro, frequência de refeições, ingestão de água, etc.)"
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="flex items-center space-x-3 mb-3">
                      <Users className="h-5 w-5 text-gray-500" />
                      <span className="text-sm font-semibold text-gray-700">Histórico Familiar</span>
                    </label>
                    <textarea
                      value={formData.ds_historico_familiar}
                      onChange={(e) => handleInputChange("ds_historico_familiar", e.target.value)}
                      placeholder="Doenças na família (diabetes, câncer, problemas cardíacos, etc.)"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Expectativas */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Expectativas e Objetivos</h2>
                  <p className="text-gray-600">O que você espera do tratamento?</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Expectativas do Tratamento <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.ds_expectativas_tratamento}
                      onChange={(e) => handleInputChange("ds_expectativas_tratamento", e.target.value)}
                      placeholder="O que você espera alcançar com o tratamento? Quais são suas expectativas?"
                      rows={5}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Objetivos Específicos <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.ds_objetivos}
                      onChange={(e) => handleInputChange("ds_objetivos", e.target.value)}
                      placeholder="Quais áreas ou características você gostaria de melhorar? Seja específico(a)"
                      rows={5}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 6: Consentimento */}
            {currentStep === 6 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Consentimento e Assinatura</h2>
                  <p className="text-gray-600">Leia atentamente e confirme</p>
                </div>

                <div className="space-y-6">
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                    <h3 className="font-bold text-gray-900 mb-3">Termo de Consentimento para Tratamento</h3>
                    <div className="text-sm text-gray-700 space-y-2 max-h-64 overflow-y-auto">
                      <p>
                        Declaro que fui informado(a) sobre os procedimentos estéticos que serão realizados, seus
                        objetivos, benefícios esperados, possíveis riscos e complicações.
                      </p>
                      <p>
                        Estou ciente de que os resultados podem variar de acordo com as características individuais e
                        que não há garantia de resultados específicos.
                      </p>
                      <p>
                        Autorizo a realização dos procedimentos estéticos conforme recomendação profissional e me
                        comprometo a seguir todas as orientações pré e pós-procedimento.
                      </p>
                      <p>
                        Declaro que todas as informações fornecidas nesta anamnese são verdadeiras e completas,
                        sabendo que qualquer omissão pode comprometer o tratamento e minha segurança.
                      </p>
                    </div>
                  </div>

                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={formData.bo_consentimento_tratamento}
                      onChange={(e) => handleInputChange("bo_consentimento_tratamento", e.target.checked)}
                      className="w-5 h-5 mt-1 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      <strong>Li e concordo com o termo de consentimento para tratamento</strong>{" "}
                      <span className="text-red-500">*</span>
                    </span>
                  </label>

                  <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6">
                    <h3 className="font-bold text-gray-900 mb-3">Autorização de Uso de Imagens</h3>
                    <p className="text-sm text-gray-700">
                      Autorizo o registro fotográfico antes, durante e após os procedimentos para fins de
                      acompanhamento clínico e documentação do prontuário. As imagens serão mantidas em sigilo e
                      protegidas conforme a LGPD.
                    </p>
                  </div>

                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={formData.bo_consentimento_imagens}
                      onChange={(e) => handleInputChange("bo_consentimento_imagens", e.target.checked)}
                      className="w-5 h-5 mt-1 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      <strong>Autorizo o registro fotográfico para fins clínicos</strong>
                    </span>
                  </label>

                  <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800">
                      <strong>Importante:</strong> Ao confirmar, você declara que todas as informações fornecidas são
                      verdadeiras e está ciente dos termos apresentados.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Anterior</span>
              </Button>

              <div className="text-sm text-gray-600">
                Etapa {currentStep} de {totalSteps}
              </div>

              {currentStep < totalSteps ? (
                <Button
                  onClick={nextStep}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <span>Próximo</span>
                  <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  <span>Salvar Anamnese</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
