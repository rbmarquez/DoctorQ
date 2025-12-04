/**
 * Dialog de formulário para criar/editar empresa
 */

'use client';

import { useState } from 'react';
import { useCreateEmpresa, useUpdateEmpresa, type CreateEmpresaDto, type Empresa } from '@/lib/api/hooks';
import { FormDialog, FormField, FormSelect } from '@/components/shared/forms';
import { toast } from 'sonner';

interface EmpresaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empresa?: Empresa;
  onSuccess?: () => void;
}

export function EmpresaFormDialog({ open, onOpenChange, empresa, onSuccess }: EmpresaFormDialogProps) {
  const isEditing = !!empresa;

  const { trigger: criarEmpresa, isMutating: isCriando } = useCreateEmpresa();
  const { trigger: atualizarEmpresa, isMutating: isAtualizando } = useUpdateEmpresa(empresa?.id_empresa || '');

  const isSubmitting = isCriando || isAtualizando;

  const handleSubmit = async (data: CreateEmpresaDto) => {
    try {
      if (isEditing) {
        await atualizarEmpresa(data);
        toast.success('Empresa atualizada com sucesso');
      } else {
        await criarEmpresa(data);
        toast.success('Empresa criada com sucesso');
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar empresa');
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Editar Empresa' : 'Nova Empresa'}
      description={isEditing ? 'Atualize os dados da empresa' : 'Preencha os dados da nova empresa'}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitLabel={isEditing ? 'Atualizar' : 'Criar'}
      size="lg"
    >
      <FormField
        name="nm_razao_social"
        label="Razão Social"
        type="text"
        placeholder="Ex: Clínica de Estética LTDA"
        required
        defaultValue={empresa?.nm_razao_social}
      />

      <FormField
        name="nm_fantasia"
        label="Nome Fantasia"
        type="text"
        placeholder="Ex: Clínica Beleza Natural"
        defaultValue={empresa?.nm_fantasia}
      />

      <FormField
        name="nr_cnpj"
        label="CNPJ"
        type="text"
        placeholder="00.000.000/0000-00"
        required
        defaultValue={empresa?.nr_cnpj}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          name="nm_email"
          label="Email"
          type="email"
          placeholder="contato@clinica.com"
          defaultValue={empresa?.nm_email}
        />

        <FormField
          name="nr_telefone"
          label="Telefone"
          type="tel"
          placeholder="(11) 99999-9999"
          defaultValue={empresa?.nr_telefone}
        />
      </div>

      <FormField
        name="ds_endereco"
        label="Endereço"
        type="textarea"
        placeholder="Rua, número, complemento, bairro, cidade - UF"
        defaultValue={empresa?.ds_endereco}
      />

      <FormSelect
        name="nm_plano"
        label="Plano"
        options={[
          { value: 'free', label: 'Free - Gratuito' },
          { value: 'basic', label: 'Basic - R$ 99/mês' },
          { value: 'professional', label: 'Professional - R$ 299/mês' },
          { value: 'enterprise', label: 'Enterprise - Personalizado' },
        ]}
        defaultValue={empresa?.nm_plano || 'free'}
        required
      />
    </FormDialog>
  );
}
