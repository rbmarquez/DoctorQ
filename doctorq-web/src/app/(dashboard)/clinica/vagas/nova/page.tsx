"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useForm } from "react-hook-form";
import {
  Briefcase,
  FileText,
  Tag,
  MapPin,
  DollarSign,
  Users,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Save,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { criarVaga } from "@/lib/api/hooks/useVagas";
import type { CriarVagaData } from "@/types/carreiras";
import { toast } from "sonner";
import { SelectWithInput } from "@/components/ui/select-with-input";
import { ESTADOS_BRASIL as ESTADOS_BRASIL_COMPLETO } from "@/types/paciente";

const STEPS = [
  { id: 1, name: "Básico", icon: Briefcase },
  { id: 2, name: "Descrição", icon: FileText },
  { id: 3, name: "Classificação", icon: Tag },
  { id: 4, name: "Localização", icon: MapPin },
  { id: 5, name: "Remuneração", icon: DollarSign },
  { id: 6, name: "Requisitos", icon: Users },
  { id: 7, name: "Revisão", icon: Eye },
];

const AREAS = [
  "Estética Facial",
  "Estética Corporal",
  "Harmonização",
  "Skincare",
  "Depilação",
  "Administrativa",
  "Recepção",
  "Marketing",
  "Gestão",
  "Financeiro",
];

const ESTADOS_BRASIL_OPTIONS = ESTADOS_BRASIL_COMPLETO.map(({ uf, nome }) => ({
  value: uf,
  label: `${uf} - ${nome}`,
}));

const HABILIDADES_SUGERIDAS = [
  "Limpeza de Pele",
  "Peeling Químico",
  "Microagulhamento",
  "Drenagem Linfática",
  "Massagem Modeladora",
  "Aplicação de Botox",
  "Preenchimento Labial",
  "Harmonização Facial",
  "Depilação a Laser",
  "Radiofrequência",
  "Carboxiterapia",
  "Criolipólise",
  "Gestão de Equipe",
  "Atendimento ao Cliente",
  "Marketing Digital",
  "Vendas",
];

const BENEFICIOS_SUGERIDOS = [
  "Vale Refeição",
  "Vale Transporte",
  "Plano de Saúde",
  "Plano Odontológico",
  "Comissão por Vendas",
  "Bonificação por Desempenho",
  "Day Off no Aniversário",
  "Cursos e Capacitações",
  "Descontos em Procedimentos",
  "Seguro de Vida",
];

export default function NovaVagaPage() {
  const router = useRouter();
  const pathname = usePathname();
  const pathSegments = pathname?.split("/").filter(Boolean) ?? [];
  const basePath = `/${pathSegments[0] ?? "clinica"}`;
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<CriarVagaData>>({
    ds_beneficios: [],
    habilidades_requeridas: [],
    habilidades_desejaveis: [],
    certificacoes_necessarias: [],
    nr_vagas: 1,
    nr_anos_experiencia_min: 0,
    fg_aceita_remoto: false,
    fg_salario_a_combinar: false,
    fg_destaque: false,
  });
  const [enviando, setEnviando] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm();

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateFormData = (data: Partial<CriarVagaData>) => {
    setFormData({ ...formData, ...data });
  };

  const toggleArrayItem = (array: string[], item: string) => {
    if (array.includes(item)) {
      return array.filter((i) => i !== item);
    } else {
      return [...array, item];
    }
  };

  const addCustomItem = (field: keyof CriarVagaData, value: string) => {
    if (!value.trim()) return;
    const currentArray = (formData[field] as string[]) || [];
    if (!currentArray.includes(value.trim())) {
      updateFormData({ [field]: [...currentArray, value.trim()] });
    }
  };

  const removeArrayItem = (field: keyof CriarVagaData, item: string) => {
    const currentArray = (formData[field] as string[]) || [];
    updateFormData({ [field]: currentArray.filter((i) => i !== item) });
  };

  const handleFinalSubmit = async () => {
    // Validações finais
    if (!formData.nm_cargo || !formData.ds_resumo || !formData.ds_responsabilidades || !formData.ds_requisitos) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    if (!formData.nm_area || !formData.nm_nivel || !formData.nm_tipo_contrato || !formData.nm_regime_trabalho) {
      toast.error("Por favor, complete a classificação da vaga");
      return;
    }

    if (!formData.nm_cidade || !formData.nm_estado) {
      toast.error("Por favor, preencha a localização");
      return;
    }

    if (!formData.habilidades_requeridas || formData.habilidades_requeridas.length === 0) {
      toast.error("Por favor, adicione pelo menos uma habilidade requerida");
      return;
    }

    setEnviando(true);

    try {
      const vaga = await criarVaga(formData as CriarVagaData);
      toast.success("Vaga criada com sucesso!");
      router.push(`${basePath}/vagas/${vaga.id_vaga}`);
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar vaga");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container px-4 py-6">
          <button
            onClick={() => router.push(`${basePath}/vagas`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Minhas Vagas
          </button>

          <h1 className="text-3xl font-bold text-gray-900">Criar Nova Vaga</h1>
          <p className="text-gray-600 mt-2">
            Preencha as informações para publicar uma nova vaga de emprego
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white border-b">
        <div className="container px-4 py-6">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      currentStep >= step.id
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {currentStep > step.id ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <step.icon className="w-6 h-6" />
                    )}
                  </div>
                  <span
                    className={`text-sm mt-2 ${
                      currentStep >= step.id ? "text-gray-900 font-medium" : "text-gray-500"
                    }`}
                  >
                    {step.name}
                  </span>
                </div>

                {index < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      currentStep > step.id ? "bg-indigo-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="container px-4 py-12">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl p-8 border border-gray-200">
          {/* Step 1: Básico */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Informações Básicas</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cargo / Título da Vaga *
                </label>
                <Input
                  placeholder="Ex: Esteticista Facial Pleno"
                  value={formData.nm_cargo || ""}
                  onChange={(e) => updateFormData({ nm_cargo: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Área *
                </label>
                <Select
                  value={formData.nm_area || ""}
                  onValueChange={(value) => updateFormData({ nm_area: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a área" />
                  </SelectTrigger>
                  <SelectContent>
                    {AREAS.map((area) => (
                      <SelectItem key={area} value={area}>
                        {area}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resumo da Vaga * (50-500 caracteres)
                </label>
                <Textarea
                  placeholder="Descreva brevemente a vaga e o que torna ela atrativa..."
                  value={formData.ds_resumo || ""}
                  onChange={(e) => updateFormData({ ds_resumo: e.target.value })}
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {(formData.ds_resumo || "").length} / 500 caracteres
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Descrição */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Descrição Detalhada</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Responsabilidades *
                </label>
                <Textarea
                  placeholder="Liste as principais responsabilidades do cargo, uma por linha ou em tópicos..."
                  value={formData.ds_responsabilidades || ""}
                  onChange={(e) => updateFormData({ ds_responsabilidades: e.target.value })}
                  rows={8}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Requisitos *
                </label>
                <Textarea
                  placeholder="Liste os requisitos obrigatórios para a vaga..."
                  value={formData.ds_requisitos || ""}
                  onChange={(e) => updateFormData({ ds_requisitos: e.target.value })}
                  rows={8}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Diferenciais (Opcional)
                </label>
                <Textarea
                  placeholder="Liste os requisitos desejáveis mas não obrigatórios..."
                  value={formData.ds_diferenciais || ""}
                  onChange={(e) => updateFormData({ ds_diferenciais: e.target.value })}
                  rows={6}
                />
              </div>
            </div>
          )}

          {/* Step 3: Classificação */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Classificação</h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nível *
                  </label>
                  <Select
                    value={formData.nm_nivel || ""}
                    onValueChange={(value) => updateFormData({ nm_nivel: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o nível" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="estagiario">Estagiário</SelectItem>
                      <SelectItem value="junior">Júnior</SelectItem>
                      <SelectItem value="pleno">Pleno</SelectItem>
                      <SelectItem value="senior">Sênior</SelectItem>
                      <SelectItem value="especialista">Especialista</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Contrato *
                  </label>
                  <Select
                    value={formData.nm_tipo_contrato || ""}
                    onValueChange={(value) => updateFormData({ nm_tipo_contrato: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clt">CLT</SelectItem>
                      <SelectItem value="pj">PJ</SelectItem>
                      <SelectItem value="estagio">Estágio</SelectItem>
                      <SelectItem value="temporario">Temporário</SelectItem>
                      <SelectItem value="freelance">Freelance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Regime de Trabalho *
                  </label>
                  <Select
                    value={formData.nm_regime_trabalho || ""}
                    onValueChange={(value) => updateFormData({ nm_regime_trabalho: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o regime" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="presencial">Presencial</SelectItem>
                      <SelectItem value="remoto">Remoto</SelectItem>
                      <SelectItem value="hibrido">Híbrido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número de Vagas *
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={formData.nr_vagas || 1}
                    onChange={(e) => updateFormData({ nr_vagas: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Localização */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Localização</h2>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cidade *
                  </label>
                  <Input
                    placeholder="Ex: São Paulo"
                    value={formData.nm_cidade || ""}
                    onChange={(e) => updateFormData({ nm_cidade: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado *
                  </label>
                  <SelectWithInput
                    options={ESTADOS_BRASIL_OPTIONS}
                    value={formData.nm_estado || ""}
                    onValueChange={(value) => updateFormData({ nm_estado: value || undefined })}
                    placeholder="Selecione o estado"
                    searchPlaceholder="Buscar estado..."
                    className="w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CEP (Opcional)
                </label>
                <Input
                  placeholder="00000-000"
                  value={formData.ds_cep || ""}
                  onChange={(e) => updateFormData({ ds_cep: e.target.value })}
                  maxLength={9}
                />
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.fg_aceita_remoto || false}
                    onChange={(e) => updateFormData({ fg_aceita_remoto: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <span className="text-sm text-gray-700">Aceita trabalho remoto</span>
                </label>
              </div>
            </div>
          )}

          {/* Step 5: Remuneração */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Remuneração e Benefícios</h2>

              <div>
                <label className="flex items-center gap-2 cursor-pointer mb-4">
                  <input
                    type="checkbox"
                    checked={formData.fg_salario_a_combinar || false}
                    onChange={(e) => updateFormData({ fg_salario_a_combinar: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <span className="text-sm text-gray-700">Salário a combinar</span>
                </label>
              </div>

              {!formData.fg_salario_a_combinar && (
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Salário Mínimo (R$)
                    </label>
                    <Input
                      type="number"
                      min={0}
                      step={100}
                      placeholder="Ex: 3000"
                      value={formData.vl_salario_min || ""}
                      onChange={(e) => updateFormData({ vl_salario_min: parseFloat(e.target.value) || undefined })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Salário Máximo (R$)
                    </label>
                    <Input
                      type="number"
                      min={0}
                      step={100}
                      placeholder="Ex: 4500"
                      value={formData.vl_salario_max || ""}
                      onChange={(e) => updateFormData({ vl_salario_max: parseFloat(e.target.value) || undefined })}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Benefícios
                </label>
                <div className="grid md:grid-cols-2 gap-2 mb-3">
                  {BENEFICIOS_SUGERIDOS.map((beneficio) => (
                    <button
                      key={beneficio}
                      onClick={() =>
                        updateFormData({
                          ds_beneficios: toggleArrayItem(formData.ds_beneficios || [], beneficio),
                        })
                      }
                      className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                        (formData.ds_beneficios || []).includes(beneficio)
                          ? "bg-indigo-50 text-indigo-700 border-indigo-300"
                          : "bg-white text-gray-700 border-gray-200 hover:border-indigo-300"
                      }`}
                    >
                      {beneficio}
                    </button>
                  ))}
                </div>

                {formData.ds_beneficios && formData.ds_beneficios.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {formData.ds_beneficios.map((beneficio) => (
                      <span
                        key={beneficio}
                        className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm rounded-full flex items-center gap-2"
                      >
                        {beneficio}
                        <button
                          onClick={() => removeArrayItem("ds_beneficios", beneficio)}
                          className="hover:text-indigo-900"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 6: Requisitos */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Requisitos e Habilidades</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Anos de Experiência Mínimos
                </label>
                <Input
                  type="number"
                  min={0}
                  max={50}
                  value={formData.nr_anos_experiencia_min || 0}
                  onChange={(e) =>
                    updateFormData({ nr_anos_experiencia_min: parseInt(e.target.value) || 0 })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Habilidades Requeridas * (clique para adicionar)
                </label>
                <div className="grid md:grid-cols-3 gap-2 mb-3">
                  {HABILIDADES_SUGERIDAS.map((habilidade) => (
                    <button
                      key={habilidade}
                      onClick={() =>
                        updateFormData({
                          habilidades_requeridas: toggleArrayItem(
                            formData.habilidades_requeridas || [],
                            habilidade
                          ),
                        })
                      }
                      className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                        (formData.habilidades_requeridas || []).includes(habilidade)
                          ? "bg-indigo-50 text-indigo-700 border-indigo-300"
                          : "bg-white text-gray-700 border-gray-200 hover:border-indigo-300"
                      }`}
                    >
                      {habilidade}
                    </button>
                  ))}
                </div>

                {formData.habilidades_requeridas && formData.habilidades_requeridas.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.habilidades_requeridas.map((habilidade) => (
                      <span
                        key={habilidade}
                        className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm rounded-full flex items-center gap-2"
                      >
                        {habilidade}
                        <button
                          onClick={() => removeArrayItem("habilidades_requeridas", habilidade)}
                          className="hover:text-indigo-900"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.fg_destaque || false}
                    onChange={(e) => updateFormData({ fg_destaque: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <span className="text-sm text-gray-700">Marcar vaga como destaque</span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-6">
                  Vagas em destaque aparecem primeiro nos resultados de busca
                </p>
              </div>
            </div>
          )}

          {/* Step 7: Revisão */}
          {currentStep === 7 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Revisão e Publicação</h2>

              <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Cargo</h3>
                  <p className="text-lg font-semibold text-gray-900">{formData.nm_cargo}</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Área</h3>
                    <p className="text-gray-900">{formData.nm_area}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Nível</h3>
                    <p className="text-gray-900 capitalize">{formData.nm_nivel}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Tipo de Contrato</h3>
                    <p className="text-gray-900 uppercase">{formData.nm_tipo_contrato}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Regime</h3>
                    <p className="text-gray-900 capitalize">{formData.nm_regime_trabalho}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Localização</h3>
                  <p className="text-gray-900">
                    {formData.nm_cidade}, {formData.nm_estado}
                    {formData.fg_aceita_remoto && " • Aceita Remoto"}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Salário</h3>
                  <p className="text-gray-900">
                    {formData.fg_salario_a_combinar
                      ? "A combinar"
                      : `R$ ${formData.vl_salario_min?.toLocaleString()} - R$ ${formData.vl_salario_max?.toLocaleString()}`}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Habilidades Requeridas</h3>
                  <div className="flex flex-wrap gap-2">
                    {formData.habilidades_requeridas?.map((hab) => (
                      <span
                        key={hab}
                        className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full"
                      >
                        {hab}
                      </span>
                    ))}
                  </div>
                </div>

                {formData.ds_beneficios && formData.ds_beneficios.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Benefícios</h3>
                    <div className="flex flex-wrap gap-2">
                      {formData.ds_beneficios.map((ben) => (
                        <span
                          key={ben}
                          className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-full"
                        >
                          {ben}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-900">
                  Ao publicar esta vaga, ela ficará visível para todos os candidatos na plataforma.
                  Você poderá pausar ou fechar a vaga a qualquer momento.
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Anterior
            </Button>

            {currentStep < STEPS.length ? (
              <Button
                onClick={nextStep}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white gap-2"
              >
                Próximo
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleFinalSubmit}
                disabled={enviando}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white gap-2"
              >
                {enviando ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Publicando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Publicar Vaga
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
