'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Bot, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';

interface NovoAgenteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function NovoAgenteDialog({ open, onOpenChange, onSuccess }: NovoAgenteDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    nm_agente: '',
    ds_prompt: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nm_agente.trim()) {
      toast.error('Nome do agente é obrigatório');
      return;
    }

    if (!formData.ds_prompt.trim()) {
      toast.error('Prompt do agente é obrigatório');
      return;
    }

    setIsLoading(true);

    try {
      await apiClient.post('/agentes/', {
        nm_agente: formData.nm_agente.trim(),
        ds_prompt: formData.ds_prompt.trim(),
        ds_config: JSON.stringify({
          model: 'gpt-4',
          temperature: 0.7,
          max_tokens: 2000,
        }),
        st_principal: false,
      });

      toast.success('Agente criado com sucesso!');
      setFormData({ nm_agente: '', ds_prompt: '' });
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao criar agente:', error);
      toast.error(error?.message || 'Erro ao criar agente');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Novo Agente
          </DialogTitle>
          <DialogDescription>
            Preencha as informações para criar um novo agente de IA
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nm_agente">
              Nome do Agente <span className="text-red-600">*</span>
            </Label>
            <Input
              id="nm_agente"
              placeholder="Ex: Assistente de Atendimento"
              value={formData.nm_agente}
              onChange={(e) => setFormData({ ...formData, nm_agente: e.target.value })}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ds_prompt">
              Prompt do Sistema <span className="text-red-600">*</span>
            </Label>
            <Textarea
              id="ds_prompt"
              placeholder="Você é um assistente especializado em..."
              value={formData.ds_prompt}
              onChange={(e) => setFormData({ ...formData, ds_prompt: e.target.value })}
              required
              disabled={isLoading}
              rows={6}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Defina a personalidade e comportamento do agente
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              <Save className="mr-2 h-4 w-4" />
              {isLoading ? 'Salvando...' : 'Salvar Agente'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
