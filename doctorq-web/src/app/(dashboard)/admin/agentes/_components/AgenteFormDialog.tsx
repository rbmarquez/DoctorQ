/**
 * Dialog de formulário para criar/editar agente
 */

'use client';

import { useCreateAgente, useUpdateAgente, type CreateAgenteDto, type Agente } from '@/lib/api/hooks';
import { FormDialog, FormField, FormSelect } from '@/components/shared/forms';
import { toast } from 'sonner';

interface AgenteFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agente?: Agente;
  onSuccess?: () => void;
}

export function AgenteFormDialog({ open, onOpenChange, agente, onSuccess }: AgenteFormDialogProps) {
  const isEditing = !!agente;

  const { trigger: criarAgente, isMutating: isCriando } = useCreateAgente();
  const { trigger: atualizarAgente, isMutating: isAtualizando } = useUpdateAgente(agente?.id_agente || '');

  const isSubmitting = isCriando || isAtualizando;

  const handleSubmit = async (data: CreateAgenteDto) => {
    try {
      if (isEditing) {
        await atualizarAgente(data);
        toast.success('Agente atualizado com sucesso');
      } else {
        await criarAgente(data);
        toast.success('Agente criado com sucesso');
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar agente');
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Editar Agente' : 'Novo Agente'}
      description={isEditing ? 'Atualize os dados do agente' : 'Preencha os dados do novo agente'}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitLabel={isEditing ? 'Atualizar' : 'Criar'}
      size="lg"
    >
      <FormField
        name="nm_agente"
        label="Nome do Agente"
        type="text"
        placeholder="Ex: Assistente de Atendimento"
        required
        defaultValue={agente?.nm_agente}
      />

      <FormField
        name="ds_descricao"
        label="Descrição"
        type="textarea"
        placeholder="Descreva as funcionalidades deste agente..."
        defaultValue={agente?.ds_descricao}
      />

      <FormSelect
        name="ds_tipo"
        label="Tipo de Agente"
        options={[
          { value: 'chatbot', label: 'Chatbot - Conversacional' },
          { value: 'assistant', label: 'Assistant - Auxiliar' },
          { value: 'analyzer', label: 'Analyzer - Análise de Dados' },
          { value: 'workflow', label: 'Workflow - Automação' },
          { value: 'creative', label: 'Creative - Conteúdo Criativo' },
        ]}
        defaultValue={agente?.ds_tipo || 'chatbot'}
        required
      />

      <FormField
        name="ds_prompt_sistema"
        label="Prompt do Sistema"
        type="textarea"
        placeholder="Instruções base para o comportamento do agente..."
        defaultValue={agente?.ds_prompt_sistema}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          name="nr_temperatura"
          label="Temperatura"
          type="number"
          placeholder="0.0 a 2.0"
          defaultValue={agente?.nr_temperatura?.toString() || '0.7'}
        />

        <FormField
          name="nr_max_tokens"
          label="Max Tokens"
          type="number"
          placeholder="Ex: 2000"
          defaultValue={agente?.nr_max_tokens?.toString() || '2000'}
        />
      </div>
    </FormDialog>
  );
}
