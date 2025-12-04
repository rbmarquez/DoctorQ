"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import {
  User,
  MapPin,
  Briefcase,
  GraduationCap,
  Award,
  DollarSign,
  Check,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Upload,
  Plus,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { criarCurriculo } from "@/lib/api/hooks/useCurriculos";
import { toast } from "sonner";
import type { CriarCurriculoData, NivelExperiencia, TipoContrato, RegimeTrabalho } from "@/types/carreiras";

const STEPS = [
  { id: 1, title: "Dados Pessoais", icon: User },
  { id: 2, title: "Localização", icon: MapPin },
  { id: 3, title: "Perfil Profissional", icon: Briefcase },
  { id: 4, title: "Habilidades", icon: Award },
  { id: 5, title: "Preferências", icon: DollarSign },
];

const HABILIDADES_SUGERIDAS = [
  "Harmonização Facial",
  "Preenchimento Labial",
  "Botox",
  "Skincare",
  "Depilação a Laser",
  "Tratamentos Corporais",
  "Limpeza de Pele",
  "Peeling",
  "Massagem Modeladora",
  "Drenagem Linfática",
  "Microagulhamento",
  "Carboxiterapia",
  "Criolipólise",
  "Radiofrequência",
  "Atendimento ao Cliente",
  "Gestão de Clínica",
  "Marketing Digital",
  "Vendas",
];

const ESTADOS_BRASIL = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

export default function CadastroCurriculoPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [habilidades, setHabilidades] = useState<string[]>([]);
  const [novaHabilidade, setNovaHabilidade] = useState("");

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<CriarCurriculoData>();

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const addHabilidade = (habilidade: string) => {
    if (habilidade && !habilidades.includes(habilidade)) {
      const newHabilidades = [...habilidades, habilidade];
      setHabilidades(newHabilidades);
      setValue("habilidades", newHabilidades);
      setNovaHabilidade("");
    }
  };

  const removeHabilidade = (habilidade: string) => {
    const newHabilidades = habilidades.filter((h) => h !== habilidade);
    setHabilidades(newHabilidades);
    setValue("habilidades", newHabilidades);
  };

  const onSubmit = async (data: CriarCurriculoData) => {
    setIsSubmitting(true);

    try {
      data.habilidades = habilidades;
      const curriculo = await criarCurriculo(data);

      toast.success("Currículo cadastrado com sucesso!");
      router.push(`/carreiras/meu-curriculo?id=${curriculo.id_curriculo}`);
    } catch (error: any) {
      console.error("Erro ao criar currículo:", error);
      toast.error(error.response?.data?.detail || "Erro ao cadastrar currículo");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12">
      <div className="container px-4 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 rounded-full mb-6">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <span className="text-sm font-semibold text-indigo-700">
              Cadastro de Currículo
            </span>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Comece Sua Jornada na Estética
          </h1>

          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Crie seu perfil profissional e seja encontrado pelas melhores clínicas do Brasil
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                      currentStep >= step.id
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {currentStep > step.id ? (
                      <Check className="w-6 h-6" />
                    ) : (
                      <step.icon className="w-6 h-6" />
                    )}
                  </div>
                  <span className="text-xs mt-2 text-gray-600 font-medium hidden md:block">
                    {step.title}
                  </span>
                </div>

                {index < STEPS.length - 1 && (
                  <div
                    className={`h-1 flex-1 mx-2 transition-all duration-300 ${
                      currentStep > step.id
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600"
                        : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* STEP 1: Dados Pessoais */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-fade-in-up">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Dados Pessoais
                </h2>

                <div>
                  <Label htmlFor="nm_completo">Nome Completo *</Label>
                  <Input
                    id="nm_completo"
                    {...register("nm_completo", { required: true })}
                    placeholder="Ex: Maria Silva"
                    className="mt-2"
                  />
                  {errors.nm_completo && (
                    <p className="text-sm text-red-600 mt-1">Campo obrigatório</p>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="ds_email">E-mail *</Label>
                    <Input
                      id="ds_email"
                      type="email"
                      {...register("ds_email", { required: true })}
                      placeholder="seu@email.com"
                      className="mt-2"
                    />
                    {errors.ds_email && (
                      <p className="text-sm text-red-600 mt-1">Campo obrigatório</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="nr_telefone">Telefone *</Label>
                    <Input
                      id="nr_telefone"
                      {...register("nr_telefone", { required: true })}
                      placeholder="(11) 99999-9999"
                      className="mt-2"
                    />
                    {errors.nr_telefone && (
                      <p className="text-sm text-red-600 mt-1">Campo obrigatório</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Localização */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-fade-in-up">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Onde Você Está?
                </h2>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="nm_cidade">Cidade *</Label>
                    <Input
                      id="nm_cidade"
                      {...register("nm_cidade", { required: true })}
                      placeholder="Ex: São Paulo"
                      className="mt-2"
                    />
                    {errors.nm_cidade && (
                      <p className="text-sm text-red-600 mt-1">Campo obrigatório</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="nm_estado">Estado *</Label>
                    <Select
                      onValueChange={(value) => setValue("nm_estado", value)}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {ESTADOS_BRASIL.map((estado) => (
                          <SelectItem key={estado} value={estado}>
                            {estado}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.nm_estado && (
                      <p className="text-sm text-red-600 mt-1">Campo obrigatório</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Perfil Profissional */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-fade-in-up">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Seu Perfil Profissional
                </h2>

                <div>
                  <Label htmlFor="nm_cargo_desejado">Cargo Desejado *</Label>
                  <Input
                    id="nm_cargo_desejado"
                    {...register("nm_cargo_desejado", { required: true })}
                    placeholder="Ex: Esteticista Facial"
                    className="mt-2"
                  />
                  {errors.nm_cargo_desejado && (
                    <p className="text-sm text-red-600 mt-1">Campo obrigatório</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="ds_resumo_profissional">Resumo Profissional *</Label>
                  <Textarea
                    id="ds_resumo_profissional"
                    {...register("ds_resumo_profissional", { required: true })}
                    placeholder="Conte um pouco sobre sua experiência e objetivos profissionais..."
                    rows={4}
                    className="mt-2"
                  />
                  {errors.ds_resumo_profissional && (
                    <p className="text-sm text-red-600 mt-1">Campo obrigatório</p>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="nm_nivel_experiencia">Nível de Experiência *</Label>
                    <Select
                      onValueChange={(value) => setValue("nm_nivel_experiencia", value as NivelExperiencia)}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="estagiario">Estagiário</SelectItem>
                        <SelectItem value="junior">Júnior</SelectItem>
                        <SelectItem value="pleno">Pleno</SelectItem>
                        <SelectItem value="senior">Sênior</SelectItem>
                        <SelectItem value="especialista">Especialista</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.nm_nivel_experiencia && (
                      <p className="text-sm text-red-600 mt-1">Campo obrigatório</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="nr_anos_experiencia">Anos de Experiência *</Label>
                    <Input
                      id="nr_anos_experiencia"
                      type="number"
                      min="0"
                      {...register("nr_anos_experiencia", { required: true, valueAsNumber: true })}
                      placeholder="Ex: 3"
                      className="mt-2"
                    />
                    {errors.nr_anos_experiencia && (
                      <p className="text-sm text-red-600 mt-1">Campo obrigatório</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Habilidades */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-fade-in-up">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Suas Habilidades
                </h2>

                <div>
                  <Label>Adicionar Habilidade</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={novaHabilidade}
                      onChange={(e) => setNovaHabilidade(e.target.value)}
                      placeholder="Digite uma habilidade..."
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addHabilidade(novaHabilidade);
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={() => addHabilidade(novaHabilidade)}
                      size="icon"
                      className="shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>Sugestões</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {HABILIDADES_SUGERIDAS.filter((h) => !habilidades.includes(h)).slice(0, 12).map((habilidade) => (
                      <button
                        key={habilidade}
                        type="button"
                        onClick={() => addHabilidade(habilidade)}
                        className="px-3 py-1 bg-indigo-50 text-indigo-700 text-sm rounded-full hover:bg-indigo-100 transition-colors"
                      >
                        + {habilidade}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Habilidades Selecionadas ({habilidades.length})</Label>
                  <div className="flex flex-wrap gap-2 mt-2 min-h-[60px] p-4 border border-gray-200 rounded-lg">
                    {habilidades.length === 0 ? (
                      <p className="text-gray-400 text-sm">Nenhuma habilidade adicionada ainda</p>
                    ) : (
                      habilidades.map((habilidade) => (
                        <span
                          key={habilidade}
                          className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-600 text-white text-sm rounded-full"
                        >
                          {habilidade}
                          <button
                            type="button"
                            onClick={() => removeHabilidade(habilidade)}
                            className="hover:bg-indigo-700 rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: Preferências */}
            {currentStep === 5 && (
              <div className="space-y-6 animate-fade-in-up">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Preferências de Trabalho
                </h2>

                <div>
                  <Label>Tipos de Contrato Aceitos *</Label>
                  <div className="grid md:grid-cols-2 gap-4 mt-2">
                    {(["clt", "pj", "estagio", "temporario", "freelance"] as TipoContrato[]).map((tipo) => (
                      <label key={tipo} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          value={tipo}
                          {...register("tipos_contrato_aceitos", { required: true })}
                          className="w-4 h-4 text-indigo-600 rounded"
                        />
                        <span className="text-sm text-gray-700 capitalize">
                          {tipo === "clt" ? "CLT" : tipo === "pj" ? "PJ" : tipo.replace("_", " ")}
                        </span>
                      </label>
                    ))}
                  </div>
                  {errors.tipos_contrato_aceitos && (
                    <p className="text-sm text-red-600 mt-1">Selecione pelo menos uma opção</p>
                  )}
                </div>

                <div>
                  <Label>Regime de Trabalho *</Label>
                  <div className="grid md:grid-cols-3 gap-4 mt-2">
                    {(["presencial", "remoto", "hibrido"] as RegimeTrabalho[]).map((regime) => (
                      <label key={regime} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          value={regime}
                          {...register("regimes_trabalho_aceitos", { required: true })}
                          className="w-4 h-4 text-indigo-600 rounded"
                        />
                        <span className="text-sm text-gray-700 capitalize">
                          {regime}
                        </span>
                      </label>
                    ))}
                  </div>
                  {errors.regimes_trabalho_aceitos && (
                    <p className="text-sm text-red-600 mt-1">Selecione pelo menos uma opção</p>
                  )}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-8 border-t border-gray-200 mt-8">
              <Button
                type="button"
                variant="ghost"
                onClick={handlePrev}
                disabled={currentStep === 1}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>

              <div className="text-sm text-gray-500">
                Etapa {currentStep} de {STEPS.length}
              </div>

              {currentStep < STEPS.length ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 gap-2"
                >
                  Próximo
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 gap-2"
                >
                  {isSubmitting ? "Salvando..." : "Finalizar Cadastro"}
                  <Check className="w-4 h-4" />
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
