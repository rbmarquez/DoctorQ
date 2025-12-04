/**
 * Dialog de formulário para criar/editar usuário
 * Usa id_perfil para relacionar o usuário ao perfil (RBAC)
 */

'use client';

import { useMemo } from 'react';
import { useCreateUsuario, useUpdateUsuario, usePerfis, type CreateUsuarioDto, type Usuario } from '@/lib/api/hooks';
import { FormDialog, FormField, FormSelect } from '@/components/shared/forms';
import { toast } from 'sonner';

interface UsuarioFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuario?: Usuario;
  onSuccess?: () => void;
}

export function UsuarioFormDialog({ open, onOpenChange, usuario, onSuccess }: UsuarioFormDialogProps) {
  const isEditing = !!usuario;

  const { trigger: criarUsuario, isMutating: isCriando } = useCreateUsuario();
  const { trigger: atualizarUsuario, isMutating: isAtualizando } = useUpdateUsuario(usuario?.id_user || '');

  // Buscar perfis disponíveis para o select
  const { data: perfis, isLoading: isLoadingPerfis } = usePerfis({ ativo: 'S', size: 100 });

  // Converter perfis para opções do select
  const perfilOptions = useMemo(() => {
    if (!perfis || perfis.length === 0) {
      // Fallback enquanto carrega ou se não houver perfis
      return [
        { value: '', label: 'Carregando perfis...' }
      ];
    }
    return perfis.map((p) => ({
      value: p.id_perfil,
      label: p.nm_perfil,
    }));
  }, [perfis]);

  const isSubmitting = isCriando || isAtualizando;

  const handleSubmit = async (data: CreateUsuarioDto) => {
    try {
      if (isEditing) {
        await atualizarUsuario(data);
        toast.success('Usuário atualizado com sucesso');
      } else {
        await criarUsuario(data);
        toast.success('Usuário criado com sucesso');
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar usuário');
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Editar Usuário' : 'Novo Usuário'}
      description={isEditing ? 'Atualize os dados do usuário' : 'Preencha os dados do novo usuário'}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitLabel={isEditing ? 'Atualizar' : 'Criar'}
      size="lg"
    >
      <FormField
        name="nm_completo"
        label="Nome Completo"
        type="text"
        placeholder="Ex: João da Silva"
        required
        defaultValue={usuario?.nm_completo}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          name="nm_email"
          label="Email"
          type="email"
          placeholder="usuario@email.com"
          required
          defaultValue={usuario?.nm_email}
        />

        <FormField
          name="nr_telefone"
          label="Telefone"
          type="tel"
          placeholder="(11) 99999-9999"
          defaultValue={usuario?.nr_telefone}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          name="nr_cpf"
          label="CPF"
          type="text"
          placeholder="000.000.000-00"
          defaultValue={usuario?.nr_cpf}
        />

        <FormField
          name="dt_nascimento"
          label="Data de Nascimento"
          type="date"
          defaultValue={usuario?.dt_nascimento}
        />
      </div>

      <FormSelect
        name="id_perfil"
        label="Perfil"
        options={perfilOptions}
        defaultValue={usuario?.id_perfil || ''}
        required
        disabled={isLoadingPerfis}
      />

      {!isEditing && (
        <FormField
          name="ds_senha"
          label="Senha"
          type="password"
          placeholder="Mínimo 8 caracteres"
          required
        />
      )}

      <FormField
        name="ds_foto_url"
        label="URL da Foto"
        type="url"
        placeholder="https://..."
        defaultValue={usuario?.ds_foto_url}
      />
    </FormDialog>
  );
}
