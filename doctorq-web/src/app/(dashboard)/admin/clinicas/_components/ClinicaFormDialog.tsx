/**
 * Dialog de formulário para criar/editar clínica
 */

'use client';

import { useCreateClinica, useUpdateClinica, type CreateClinicaDto, type Clinica } from '@/lib/api/hooks';
import { FormDialog, FormField } from '@/components/shared/forms';
import { toast } from 'sonner';

interface ClinicaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clinica?: Clinica;
  onSuccess?: () => void;
}

export function ClinicaFormDialog({ open, onOpenChange, clinica, onSuccess }: ClinicaFormDialogProps) {
  const isEditing = !!clinica;

  const { trigger: criarClinica, isMutating: isCriando } = useCreateClinica();
  const { trigger: atualizarClinica, isMutating: isAtualizando } = useUpdateClinica(clinica?.id_clinica || '');

  const isSubmitting = isCriando || isAtualizando;

  const handleSubmit = async (data: CreateClinicaDto) => {
    try {
      if (isEditing) {
        await atualizarClinica(data);
        toast.success('Clínica atualizada com sucesso');
      } else {
        await criarClinica(data);
        toast.success('Clínica criada com sucesso');
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar clínica');
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Editar Clínica' : 'Nova Clínica'}
      description={isEditing ? 'Atualize os dados da clínica' : 'Preencha os dados da nova clínica'}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitLabel={isEditing ? 'Atualizar' : 'Criar'}
      size="lg"
    >
      <FormField
        name="nm_clinica"
        label="Nome da Clínica"
        type="text"
        placeholder="Ex: Clínica Beleza Natural - Unidade Centro"
        required
        defaultValue={clinica?.nm_clinica}
      />

      <FormField
        name="ds_endereco"
        label="Endereço Completo"
        type="textarea"
        placeholder="Rua, número, complemento, bairro, cidade - UF, CEP"
        defaultValue={clinica?.ds_endereco}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          name="nr_telefone"
          label="Telefone"
          type="tel"
          placeholder="(11) 3333-4444"
          defaultValue={clinica?.nr_telefone}
        />

        <FormField
          name="nm_email"
          label="Email"
          type="email"
          placeholder="contato@clinica.com"
          defaultValue={clinica?.nm_email}
        />
      </div>

      <FormField
        name="ds_horario_funcionamento"
        label="Horário de Funcionamento"
        type="textarea"
        placeholder="Ex: Seg-Sex: 8h-18h, Sáb: 8h-12h"
        defaultValue={clinica?.ds_horario_funcionamento}
      />
    </FormDialog>
  );
}
