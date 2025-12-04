"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import {
  Activity,
  FileText,
  MapPin,
  Package,
  Settings,
  AlertCircle,
  Calendar,
  Image as ImageIcon,
  Save,
  ArrowLeft,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { EvolucaoClinica } from "@/types/prontuario";

export default function NovaEvolucaoPage() {
  const params = useParams();
  const router = useRouter();
  const id_paciente = params.id_paciente as string;

  const [formData, setFormData] = useState<Partial<EvolucaoClinica>>({
    id_paciente: id_paciente,
    id_profissional: "prof1",
    dt_evolucao: new Date().toISOString().split("T")[0],
    hr_evolucao: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    ds_motivo_consulta: "",
    ds_procedimento_realizado: "",
    ds_evolucao_clinica: "",
    ds_observacoes: "",
    ds_avaliacao_fisica: "",
    ds_pele_tipo: "",
    ds_pele_condicao: "",
    ds_area_tratada: "",
    ds_tecnica_utilizada: "",
    ds_produtos_utilizados: [],
    nr_quantidade_aplicada: 0,
    ds_unidade_medida: "ml",
    ds_parametros_equipamento: "",
    bo_reacoes_adversas: false,
    ds_reacoes: "",
    ds_orientacoes_pos_procedimento: "",
    ds_cuidados_especiais: "",
    ds_medicamentos_prescritos: [],
    dt_retorno_previsto: "",
    nr_sessoes_previstas: 1,
    nr_sessao_atual: 1,
    ds_fotos_antes: [],
    ds_fotos_depois: [],
    ds_assinatura_profissional: "",
    nm_crm_cro: "",
  });

  const [produto, setProduto] = useState("");
  const [medicamento, setMedicamento] = useState("");

  const handleInputChange = (field: keyof EvolucaoClinica, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddProduto = () => {
    if (produto.trim()) {
      const produtos = formData.ds_produtos_utilizados || [];
      handleInputChange("ds_produtos_utilizados", [...produtos, produto.trim()]);
      setProduto("");
    }
  };

  const handleRemoveProduto = (index: number) => {
    const produtos = formData.ds_produtos_utilizados || [];
    handleInputChange(
      "ds_produtos_utilizados",
      produtos.filter((_, i) => i !== index)
    );
  };

  const handleAddMedicamento = () => {
    if (medicamento.trim()) {
      const medicamentos = formData.ds_medicamentos_prescritos || [];
      handleInputChange("ds_medicamentos_prescritos", [...medicamentos, medicamento.trim()]);
      setMedicamento("");
    }
  };

  const handleRemoveMedicamento = (index: number) => {
    const medicamentos = formData.ds_medicamentos_prescritos || [];
    handleInputChange(
      "ds_medicamentos_prescritos",
      medicamentos.filter((_, i) => i !== index)
    );
  };

  const handleSubmit = async () => {
    try {
      // Validações
      if (!formData.ds_motivo_consulta || !formData.ds_procedimento_realizado || !formData.ds_evolucao_clinica) {
        toast.error("Por favor, preencha todos os campos obrigatórios");
        return;
      }

      if (!formData.ds_assinatura_profissional || !formData.nm_crm_cro) {
        toast.error("É necessário assinar o documento digitalmente e informar o CRM/CRO");
        return;
      }

      // Mock - substituir por chamada à API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("Evolução clínica registrada com sucesso!");
      router.push(`/profissional/prontuario/${id_paciente}`);
    } catch (error) {
      console.error("Erro ao salvar evolução:", error);
      toast.error("Erro ao salvar evolução clínica");
    }
  };

  const tiposPele = [
    "Tipo I - Muito Clara",
    "Tipo II - Clara",
    "Tipo III - Morena Clara",
    "Tipo IV - Morena Moderada",
    "Tipo V - Morena Escura",
    "Tipo VI - Negra",
  ];

  const condicoesPele = [
    "Normal",
    "Seca",
    "Oleosa",
    "Mista",
    "Sensível",
    "Desidratada",
    "Acneica",
    "Madura",
  ];

  return (
    <AuthenticatedLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 text-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Nova Evolução Clínica</h1>
                <p className="text-white/90">Registro de consulta e procedimento</p>
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

        {/* Form */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 space-y-8">
            {/* Seção 1: Informações da Consulta */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3 pb-4 border-b border-gray-200">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Informações da Consulta</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Data da Consulta <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="date"
                    value={formData.dt_evolucao}
                    onChange={(e) => handleInputChange("dt_evolucao", e.target.value)}
                    className="h-12"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Horário <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="time"
                    value={formData.hr_evolucao}
                    onChange={(e) => handleInputChange("hr_evolucao", e.target.value)}
                    className="h-12"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Motivo da Consulta <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.ds_motivo_consulta}
                  onChange={(e) => handleInputChange("ds_motivo_consulta", e.target.value)}
                  placeholder="Ex: Primeira aplicação de botox, Retorno para avaliação..."
                  className="h-12"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Procedimento Realizado <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.ds_procedimento_realizado}
                  onChange={(e) => handleInputChange("ds_procedimento_realizado", e.target.value)}
                  placeholder="Ex: Aplicação de Toxina Botulínica"
                  className="h-12"
                />
              </div>
            </div>

            {/* Seção 2: Evolução e Avaliação */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3 pb-4 border-b border-gray-200">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Activity className="h-5 w-5 text-purple-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Evolução e Avaliação</h2>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Evolução Clínica <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.ds_evolucao_clinica}
                  onChange={(e) => handleInputChange("ds_evolucao_clinica", e.target.value)}
                  placeholder="Descreva detalhadamente o quadro clínico, exame físico e evolução do tratamento..."
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Avaliação Física
                </label>
                <textarea
                  value={formData.ds_avaliacao_fisica}
                  onChange={(e) => handleInputChange("ds_avaliacao_fisica", e.target.value)}
                  placeholder="Descrição do exame físico realizado..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de Pele</label>
                  <select
                    value={formData.ds_pele_tipo}
                    onChange={(e) => handleInputChange("ds_pele_tipo", e.target.value)}
                    className="w-full h-12 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione</option>
                    {tiposPele.map((tipo) => (
                      <option key={tipo} value={tipo}>
                        {tipo}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Condição da Pele</label>
                  <select
                    value={formData.ds_pele_condicao}
                    onChange={(e) => handleInputChange("ds_pele_condicao", e.target.value)}
                    className="w-full h-12 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione</option>
                    {condicoesPele.map((condicao) => (
                      <option key={condicao} value={condicao}>
                        {condicao}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Observações</label>
                <textarea
                  value={formData.ds_observacoes}
                  onChange={(e) => handleInputChange("ds_observacoes", e.target.value)}
                  placeholder="Informações adicionais relevantes..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Seção 3: Detalhes do Procedimento */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3 pb-4 border-b border-gray-200">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MapPin className="h-5 w-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Detalhes do Procedimento</h2>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Área Tratada <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.ds_area_tratada}
                  onChange={(e) => handleInputChange("ds_area_tratada", e.target.value)}
                  placeholder="Ex: Região frontal, glabela e região periocular"
                  className="h-12"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Técnica Utilizada
                </label>
                <Input
                  value={formData.ds_tecnica_utilizada}
                  onChange={(e) => handleInputChange("ds_tecnica_utilizada", e.target.value)}
                  placeholder="Ex: Técnica de aplicação em pontos específicos"
                  className="h-12"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Produtos Utilizados
                </label>
                <div className="flex space-x-2 mb-3">
                  <Input
                    value={produto}
                    onChange={(e) => setProduto(e.target.value)}
                    placeholder="Nome do produto"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddProduto();
                      }
                    }}
                    className="h-12"
                  />
                  <Button onClick={handleAddProduto} type="button">
                    Adicionar
                  </Button>
                </div>
                {formData.ds_produtos_utilizados && formData.ds_produtos_utilizados.length > 0 && (
                  <div className="space-y-2">
                    {formData.ds_produtos_utilizados.map((prod, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-blue-50 px-4 py-2 rounded-lg"
                      >
                        <span className="text-gray-700">{prod}</span>
                        <button
                          onClick={() => handleRemoveProduto(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Quantidade Aplicada
                  </label>
                  <Input
                    type="number"
                    value={formData.nr_quantidade_aplicada}
                    onChange={(e) => handleInputChange("nr_quantidade_aplicada", parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.1"
                    className="h-12"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Unidade de Medida
                  </label>
                  <select
                    value={formData.ds_unidade_medida}
                    onChange={(e) => handleInputChange("ds_unidade_medida", e.target.value)}
                    className="w-full h-12 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ml">ml (mililitros)</option>
                    <option value="unidades">Unidades</option>
                    <option value="mg">mg (miligramas)</option>
                    <option value="g">g (gramas)</option>
                    <option value="ampola">Ampola</option>
                    <option value="frasco">Frasco</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Parâmetros do Equipamento (se aplicável)
                </label>
                <textarea
                  value={formData.ds_parametros_equipamento}
                  onChange={(e) => handleInputChange("ds_parametros_equipamento", e.target.value)}
                  placeholder="Ex: Potência, frequência, temperatura, tempo de aplicação..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Seção 4: Reações e Intercorrências */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3 pb-4 border-b border-gray-200">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Reações e Intercorrências</h2>
              </div>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.bo_reacoes_adversas}
                  onChange={(e) => handleInputChange("bo_reacoes_adversas", e.target.checked)}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-semibold text-gray-700">
                  Houve reações adversas ou intercorrências?
                </span>
              </label>

              {formData.bo_reacoes_adversas && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Descreva as Reações
                  </label>
                  <textarea
                    value={formData.ds_reacoes}
                    onChange={(e) => handleInputChange("ds_reacoes", e.target.value)}
                    placeholder="Descreva detalhadamente as reações adversas observadas e as condutas tomadas..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>

            {/* Seção 5: Orientações */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3 pb-4 border-b border-gray-200">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FileText className="h-5 w-5 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Orientações e Prescrições</h2>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Orientações Pós-Procedimento <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.ds_orientacoes_pos_procedimento}
                  onChange={(e) => handleInputChange("ds_orientacoes_pos_procedimento", e.target.value)}
                  placeholder="Ex: Evitar deitar nas próximas 4 horas, não massagear a região, evitar exercícios físicos por 24h..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Cuidados Especiais
                </label>
                <textarea
                  value={formData.ds_cuidados_especiais}
                  onChange={(e) => handleInputChange("ds_cuidados_especiais", e.target.value)}
                  placeholder="Cuidados adicionais específicos para este caso..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Medicamentos Prescritos
                </label>
                <div className="flex space-x-2 mb-3">
                  <Input
                    value={medicamento}
                    onChange={(e) => setMedicamento(e.target.value)}
                    placeholder="Nome do medicamento, dosagem e posologia"
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
                {formData.ds_medicamentos_prescritos && formData.ds_medicamentos_prescritos.length > 0 && (
                  <div className="space-y-2">
                    {formData.ds_medicamentos_prescritos.map((med, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-green-50 px-4 py-2 rounded-lg"
                      >
                        <span className="text-gray-700">{med}</span>
                        <button
                          onClick={() => handleRemoveMedicamento(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Seção 6: Retorno e Sessões */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3 pb-4 border-b border-gray-200">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-indigo-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Retorno e Acompanhamento</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Data de Retorno Prevista
                  </label>
                  <Input
                    type="date"
                    value={formData.dt_retorno_previsto}
                    onChange={(e) => handleInputChange("dt_retorno_previsto", e.target.value)}
                    className="h-12"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Sessão Atual
                  </label>
                  <Input
                    type="number"
                    value={formData.nr_sessao_atual}
                    onChange={(e) => handleInputChange("nr_sessao_atual", parseInt(e.target.value) || 1)}
                    min="1"
                    className="h-12"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Total de Sessões Previstas
                  </label>
                  <Input
                    type="number"
                    value={formData.nr_sessoes_previstas}
                    onChange={(e) => handleInputChange("nr_sessoes_previstas", parseInt(e.target.value) || 1)}
                    min="1"
                    className="h-12"
                  />
                </div>
              </div>
            </div>

            {/* Seção 7: Assinatura Digital */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3 pb-4 border-b border-gray-200">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FileText className="h-5 w-5 text-purple-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Assinatura Digital</h2>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nome Completo e Assinatura <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.ds_assinatura_profissional}
                  onChange={(e) => handleInputChange("ds_assinatura_profissional", e.target.value)}
                  placeholder="Ex: Dra. Ana Paula Oliveira"
                  className="h-12"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  CRM / CRO / Registro Profissional <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.nm_crm_cro}
                  onChange={(e) => handleInputChange("nm_crm_cro", e.target.value)}
                  placeholder="Ex: CRM 12345 ou CRO 67890"
                  className="h-12"
                />
              </div>

              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800">
                  <strong>Importante:</strong> Ao salvar, você declara que todas as informações registradas são
                  verdadeiras e fidedignas, de acordo com o código de ética profissional.
                </p>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => router.push(`/profissional/prontuario/${id_paciente}`)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Cancelar
              </Button>

              <Button
                onClick={handleSubmit}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                <Save className="h-4 w-4 mr-2" />
                Salvar Evolução
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
