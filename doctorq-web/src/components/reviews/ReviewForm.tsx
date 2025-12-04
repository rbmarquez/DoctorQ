"use client";

import { useState } from "react";
import { ReviewFormData } from "@/types/review";
import { Star, ThumbsUp, ThumbsDown, Upload, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ReviewFormProps {
  professionalId: string;
  procedureId?: string;
  onSubmit: (data: ReviewFormData) => Promise<void>;
  onCancel?: () => void;
}

export function ReviewForm({ professionalId, procedureId, onSubmit, onCancel }: ReviewFormProps) {
  const [formData, setFormData] = useState<ReviewFormData>({
    id_procedimento: procedureId,
    nr_nota_atendimento: 0,
    nr_nota_estrutura: 0,
    nr_nota_resultado: 0,
    nr_nota_custo_beneficio: 0,
    bo_recomenda: true,
    ds_comentario: "",
  });

  const [fotosAntes, setFotosAntes] = useState<File[]>([]);
  const [fotosDepois, setFotosDepois] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const ratingLabels = {
    nr_nota_atendimento: "Atendimento",
    nr_nota_estrutura: "Estrutura da Clínica",
    nr_nota_resultado: "Resultado do Procedimento",
    nr_nota_custo_beneficio: "Custo-Benefício",
  };

  const handleRatingChange = (field: keyof ReviewFormData, value: number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "antes" | "depois"
  ) => {
    const files = Array.from(e.target.files || []);

    // Validação: máximo 4 fotos por tipo
    if (files.length > 4) {
      toast.error("Máximo de 4 fotos por categoria");
      return;
    }

    // Validação: tamanho máximo 5MB por foto
    const maxSize = 5 * 1024 * 1024; // 5MB
    const invalidFiles = files.filter(file => file.size > maxSize);
    if (invalidFiles.length > 0) {
      toast.error("Cada foto deve ter no máximo 5MB");
      return;
    }

    if (type === "antes") {
      setFotosAntes(files);
    } else {
      setFotosDepois(files);
    }
  };

  const removeFile = (index: number, type: "antes" | "depois") => {
    if (type === "antes") {
      setFotosAntes(prev => prev.filter((_, i) => i !== index));
    } else {
      setFotosDepois(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!formData.nr_nota_atendimento || !formData.nr_nota_estrutura ||
        !formData.nr_nota_resultado || !formData.nr_nota_custo_beneficio) {
      toast.error("Por favor, avalie todos os critérios");
      return;
    }

    if (!formData.ds_comentario.trim() || formData.ds_comentario.trim().length < 20) {
      toast.error("O comentário deve ter no mínimo 20 caracteres");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        fotos_antes: fotosAntes.length > 0 ? fotosAntes : undefined,
        fotos_depois: fotosDepois.length > 0 ? fotosDepois : undefined,
      });
      toast.success("Avaliação enviada com sucesso! Aguardando moderação.");
    } catch (error) {
      toast.error("Erro ao enviar avaliação. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStarRating = (field: keyof ReviewFormData, currentValue: number) => {
    return (
      <div className="flex items-center space-x-2">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => handleRatingChange(field, value)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`h-8 w-8 cursor-pointer ${
                value <= currentValue
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300 hover:text-yellow-200"
              }`}
            />
          </button>
        ))}
        <span className="text-sm text-gray-600 ml-2">
          {currentValue > 0 ? `${currentValue}/5` : "Clique para avaliar"}
        </span>
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-2xl font-bold text-gray-900 mb-6">Avaliar Profissional</h3>

      {/* Aviso de Moderação */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start space-x-3">
        <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-900">
          <p className="font-semibold mb-1">Sua avaliação será moderada</p>
          <p>
            Para garantir a qualidade, todas as avaliações passam por análise antes de serem
            publicadas. Este processo pode levar até 48 horas.
          </p>
        </div>
      </div>

      {/* Avaliações por Critério */}
      <div className="space-y-6 mb-8">
        {Object.entries(ratingLabels).map(([field, label]) => (
          <div key={field} className="pb-6 border-b border-gray-200 last:border-0">
            <label className="block text-sm font-semibold text-gray-900 mb-3">{label}</label>
            {renderStarRating(field as keyof ReviewFormData, formData[field as keyof ReviewFormData] as number)}
          </div>
        ))}
      </div>

      {/* Recomenda? */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-900 mb-3">
          Você recomendaria este profissional?
        </label>
        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, bo_recomenda: true }))}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg border-2 transition-all ${
              formData.bo_recomenda
                ? "border-green-500 bg-green-50 text-green-700"
                : "border-gray-300 hover:border-gray-400"
            }`}
          >
            <ThumbsUp className="h-5 w-5" />
            <span className="font-medium">Sim, recomendo</span>
          </button>
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, bo_recomenda: false }))}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg border-2 transition-all ${
              !formData.bo_recomenda
                ? "border-red-500 bg-red-50 text-red-700"
                : "border-gray-300 hover:border-gray-400"
            }`}
          >
            <ThumbsDown className="h-5 w-5" />
            <span className="font-medium">Não recomendo</span>
          </button>
        </div>
      </div>

      {/* Comentário */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Conte sobre sua experiência *
        </label>
        <textarea
          value={formData.ds_comentario}
          onChange={(e) => setFormData(prev => ({ ...prev, ds_comentario: e.target.value }))}
          placeholder="Descreva sua experiência com este profissional. Como foi o atendimento? Ficou satisfeito com o resultado? (Mínimo 20 caracteres)"
          rows={5}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          minLength={20}
          required
        />
        <div className="text-sm text-gray-500 mt-1">
          {formData.ds_comentario.length}/500 caracteres
        </div>
      </div>

      {/* Upload de Fotos */}
      <div className="mb-6 p-6 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
          <Upload className="h-4 w-4 mr-2" />
          Fotos Antes e Depois (Opcional)
        </h4>

        {/* Fotos Antes */}
        <div className="mb-4">
          <label className="block text-sm text-gray-700 mb-2">Fotos &ldquo;Antes&rdquo; (até 4 fotos)</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleFileChange(e, "antes")}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {fotosAntes.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {fotosAntes.map((file, index) => (
                <div key={index} className="relative">
                  <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-xs text-gray-600">{file.name.slice(0, 10)}...</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(index, "antes")}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Fotos Depois */}
        <div>
          <label className="block text-sm text-gray-700 mb-2">Fotos &ldquo;Depois&rdquo; (até 4 fotos)</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleFileChange(e, "depois")}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {fotosDepois.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {fotosDepois.map((file, index) => (
                <div key={index} className="relative">
                  <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-xs text-gray-600">{file.name.slice(0, 10)}...</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(index, "depois")}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-xs text-gray-500 mt-3 italic">
          ⚠️ Ao enviar fotos, você autoriza sua publicação na plataforma. Suas fotos serão
          moderadas antes da publicação. Máximo 5MB por foto.
        </p>
      </div>

      {/* Botões de Ação */}
      <div className="flex items-center justify-end space-x-3">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-cyan-700"
        >
          {isSubmitting ? "Enviando..." : "Enviar Avaliação"}
        </Button>
      </div>
    </form>
  );
}
