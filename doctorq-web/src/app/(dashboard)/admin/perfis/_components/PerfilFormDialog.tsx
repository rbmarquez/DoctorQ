/**
 * Dialog de formulário para criar/editar perfil com seleção de grupos de acesso
 *
 * @updated 2025-11-05 - Adicionado suporte a ds_grupos_acesso e visualização de rotas
 */

'use client';

import { useState } from 'react';
import { useCreatePerfil, useUpdatePerfil, type CreatePerfilDto, type Perfil } from '@/lib/api/hooks';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { GruposAcessoSelector } from '@/components/clinica/GruposAcessoSelector';
import { SeletorRotasGranular } from '@/components/clinica/SeletorRotasGranular';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';

interface PerfilFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  perfil?: Perfil;
  onSuccess?: () => void;
}

export function PerfilFormDialog({ open, onOpenChange, perfil, onSuccess }: PerfilFormDialogProps) {
  const isEditing = !!perfil;

  // Estados do formulário
  const [nmPerfil, setNmPerfil] = useState(perfil?.nm_perfil || '');
  const [dsPerfil, setDsPerfil] = useState(perfil?.ds_perfil || '');
  const [gruposAcesso, setGruposAcesso] = useState<string[]>(
    perfil?.ds_grupos_acesso || []
  );
  const [rotasSelecionadas, setRotasSelecionadas] = useState<string[]>(
    perfil?.ds_rotas_permitidas || []
  );

  const { trigger: criarPerfil, isMutating: isCriando } = useCreatePerfil();
  const { trigger: atualizarPerfil, isMutating: isAtualizando } = useUpdatePerfil(perfil?.id_perfil || '');

  const isSubmitting = isCriando || isAtualizando;

  // Reset form quando o dialog fechar
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setNmPerfil(perfil?.nm_perfil || '');
      setDsPerfil(perfil?.ds_perfil || '');
      setGruposAcesso(perfil?.ds_grupos_acesso || []);
      setRotasSelecionadas(perfil?.ds_rotas_permitidas || []);
    }
    onOpenChange(newOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!nmPerfil.trim()) {
      toast.error('Nome do perfil é obrigatório');
      return;
    }

    if (gruposAcesso.length === 0) {
      toast.error('Selecione pelo menos um grupo de acesso');
      return;
    }

    // Se for perfil de sistema, enviar APENAS ds_rotas_permitidas
    const isSystemProfile = perfil?.nm_tipo === 'system';

    const data: CreatePerfilDto = isSystemProfile
      ? {
          // Perfis de sistema: apenas rotas granulares podem ser editadas
          nm_perfil: perfil?.nm_perfil || nmPerfil.trim(),
          ds_rotas_permitidas: rotasSelecionadas,
        }
      : {
          // Perfis custom: todos os campos
          nm_perfil: nmPerfil.trim(),
          ds_perfil: dsPerfil.trim() || undefined,
          ds_grupos_acesso: gruposAcesso,
          ds_rotas_permitidas: rotasSelecionadas,
          ds_permissoes_detalhadas: perfil?.ds_permissoes_detalhadas || {},
          ds_permissoes: perfil?.ds_permissoes || {},
        };

    try {
      if (isEditing) {
        await atualizarPerfil(data);
        toast.success('Perfil atualizado com sucesso');
      } else {
        await criarPerfil(data);
        toast.success('Perfil criado com sucesso');
      }

      handleOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar perfil');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Perfil' : 'Novo Perfil'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Atualize os dados e grupos de acesso do perfil'
              : 'Preencha os dados e selecione os grupos de acesso do novo perfil'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">
              Informações Básicas
            </h3>

            <div className="space-y-2">
              <Label htmlFor="nm_perfil">
                Nome do Perfil <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nm_perfil"
                placeholder="Ex: Gestor de Clínica"
                value={nmPerfil}
                onChange={(e) => setNmPerfil(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ds_perfil">Descrição</Label>
              <Textarea
                id="ds_perfil"
                placeholder="Descreva as responsabilidades deste perfil..."
                value={dsPerfil}
                onChange={(e) => setDsPerfil(e.target.value)}
                disabled={isSubmitting}
                rows={3}
              />
            </div>
          </div>

          <Separator />

          {/* Seleção de Grupos de Acesso */}
          <div className="space-y-4">
            <GruposAcessoSelector
              value={gruposAcesso}
              onChange={setGruposAcesso}
              disabled={isSubmitting}
            />
          </div>

          <Separator />

          {/* Seleção Granular de Rotas */}
          <div className="space-y-4">
            <SeletorRotasGranular
              gruposSelecionados={gruposAcesso}
              rotasSelecionadas={rotasSelecionadas}
              onChange={setRotasSelecionadas}
              disabled={isSubmitting}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {!isSubmitting && <Save className="mr-2 h-4 w-4" />}
              {isEditing ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
