/**
 * Dialog de formulário para criar/editar procedimento
 */

'use client';

import { useCreateProcedimento, useUpdateProcedimento, type CreateProcedimentoDto, type Procedimento } from '@/lib/api/hooks';
import { FormDialog, FormField } from '@/components/shared/forms';
import { toast } from 'sonner';

interface ProcedimentoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  procedimento?: Procedimento;
  onSuccess?: () => void;
}

export function ProcedimentoFormDialog({ open, onOpenChange, procedimento, onSuccess }: ProcedimentoFormDialogProps) {
  const isEditing = !!procedimento;

  const { trigger: criarProcedimento, isMutating: isCriando } = useCreateProcedimento();
  const { trigger: atualizarProcedimento, isMutating: isAtualizando } = useUpdateProcedimento(procedimento?.id_procedimento || '');

  const isSubmitting = isCriando || isAtualizando;

  const handleSubmit = async (data: CreateProcedimentoDto) => {
    try {
      if (isEditing) {
        await atualizarProcedimento(data);
        toast.success('Procedimento atualizado com sucesso');
      } else {
        await criarProcedimento(data);
        toast.success('Procedimento criado com sucesso');
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar procedimento');
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Editar Procedimento' : 'Novo Procedimento'}
      description={isEditing ? 'Atualize os dados do procedimento' : 'Preencha os dados do novo procedimento'}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitLabel={isEditing ? 'Atualizar' : 'Criar'}
      size="lg"
    >
      <FormField
        name="nm_procedimento"
        label="Nome do Procedimento"
        type="text"
        placeholder="Ex: Limpeza de Pele"
        required
        defaultValue={procedimento?.nm_procedimento}
      />

      <FormField
        name="ds_procedimento"
        label="Descrição"
        type="textarea"
        placeholder="Descreva os detalhes do procedimento..."
        defaultValue={procedimento?.ds_procedimento}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          name="vl_preco"
          label="Preço (R$)"
          type="number"
          placeholder="Ex: 150.00"
          required
          defaultValue={procedimento?.vl_preco?.toString()}
        />

        <FormField
          name="nr_duracao_minutos"
          label="Duração (minutos)"
          type="number"
          placeholder="Ex: 60"
          defaultValue={procedimento?.nr_duracao_minutos?.toString()}
        />
      </div>

      <FormField
        name="nm_categoria"
        label="Categoria"
        type="text"
        placeholder="Ex: Facial, Corporal, Capilar"
        defaultValue={procedimento?.nm_categoria}
      />
    </FormDialog>
  );
}
