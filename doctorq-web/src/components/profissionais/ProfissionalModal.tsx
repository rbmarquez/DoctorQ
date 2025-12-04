"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Profissional,
  CriarProfissionalData,
  AtualizarProfissionalData,
  criarProfissional,
  atualizarProfissional,
  revalidarProfissionais,
} from "@/lib/api/hooks/useProfissionais";

interface ProfissionalModalProps {
  isOpen: boolean;
  onClose: () => void;
  profissional?: Profissional;
  idEmpresa?: string;
  usuarios?: Array<{ id_user: string; nm_completo: string; nm_email: string }>;
}

interface FormData {
  id_user: string;
  nm_profissional: string;
  ds_especialidades: string;
  ds_bio: string;
  ds_formacao: string;
  nr_registro_profissional: string;
  nr_anos_experiencia: string;
  st_ativo: boolean;
  st_aceita_novos_pacientes: boolean;
  ds_foto_perfil: string;
}

export function ProfissionalModal({
  isOpen,
  onClose,
  profissional,
  idEmpresa,
  usuarios = [],
}: ProfissionalModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [especialidades, setEspecialidades] = useState<string[]>([]);
  const [novaEspecialidade, setNovaEspecialidade] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      st_ativo: true,
      st_aceita_novos_pacientes: true,
    },
  });

  const isEdit = !!profissional;

  // Carregar dados do profissional ao editar
  useEffect(() => {
    if (profissional) {
      setValue("id_user", profissional.id_user);
      setValue("nm_profissional", profissional.nm_profissional);
      setValue("ds_bio", profissional.ds_bio || "");
      setValue("ds_formacao", profissional.ds_formacao || "");
      setValue("nr_registro_profissional", profissional.nr_registro_profissional || "");
      setValue("nr_anos_experiencia", profissional.nr_anos_experiencia?.toString() || "");
      setValue("st_ativo", profissional.st_ativo);
      setValue("st_aceita_novos_pacientes", profissional.st_aceita_novos_pacientes);
      setValue("ds_foto_perfil", profissional.ds_foto_perfil || "");

      if (profissional.ds_especialidades) {
        setEspecialidades(profissional.ds_especialidades);
      }
    } else {
      reset({
        st_ativo: true,
        st_aceita_novos_pacientes: true,
      });
      setEspecialidades([]);
    }
  }, [profissional, setValue, reset]);

  const adicionarEspecialidade = () => {
    if (novaEspecialidade.trim() && !especialidades.includes(novaEspecialidade.trim())) {
      setEspecialidades([...especialidades, novaEspecialidade.trim()]);
      setNovaEspecialidade("");
    }
  };

  const removerEspecialidade = (esp: string) => {
    setEspecialidades(especialidades.filter((e) => e !== esp));
  };

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);

    try {
      if (isEdit && profissional) {
        // Atualizar profissional
        const updateData: AtualizarProfissionalData = {
          nm_profissional: data.nm_profissional,
          ds_especialidades: especialidades,
          ds_bio: data.ds_bio || undefined,
          ds_formacao: data.ds_formacao || undefined,
          nr_registro_profissional: data.nr_registro_profissional || undefined,
          nr_anos_experiencia: data.nr_anos_experiencia ? parseInt(data.nr_anos_experiencia) : undefined,
          st_ativo: data.st_ativo,
          st_aceita_novos_pacientes: data.st_aceita_novos_pacientes,
          ds_foto_perfil: data.ds_foto_perfil || undefined,
        };

        await atualizarProfissional(profissional.id_profissional, updateData);
        toast.success("Profissional atualizado com sucesso!");
      } else {
        // Criar novo profissional
        const createData: CriarProfissionalData = {
          id_user: data.id_user,
          id_empresa: idEmpresa,
          nm_profissional: data.nm_profissional,
          ds_especialidades: especialidades,
          ds_bio: data.ds_bio || undefined,
          ds_formacao: data.ds_formacao || undefined,
          nr_registro_profissional: data.nr_registro_profissional || undefined,
          nr_anos_experiencia: data.nr_anos_experiencia ? parseInt(data.nr_anos_experiencia) : undefined,
          st_aceita_novos_pacientes: data.st_aceita_novos_pacientes,
          ds_foto_perfil: data.ds_foto_perfil || undefined,
        };

        await criarProfissional(createData);
        toast.success("Profissional criado com sucesso!");
      }

      await revalidarProfissionais();
      onClose();
      reset();
      setEspecialidades([]);
    } catch (error) {
      console.error("Erro ao salvar profissional:", error);
      toast.error(
        isEdit
          ? "Erro ao atualizar profissional. Tente novamente."
          : "Erro ao criar profissional. Tente novamente."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar Profissional" : "Novo Profissional"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Atualize as informações do profissional abaixo."
              : "Preencha os dados do novo profissional."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Usuário (apenas na criação) */}
          {!isEdit && (
            <div className="space-y-2">
              <Label htmlFor="id_user">
                Usuário <span className="text-destructive">*</span>
              </Label>
              <Select
                onValueChange={(value) => setValue("id_user", value)}
                defaultValue={watch("id_user")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um usuário" />
                </SelectTrigger>
                <SelectContent>
                  {usuarios.map((usuario) => (
                    <SelectItem key={usuario.id_user} value={usuario.id_user}>
                      {usuario.nm_completo} ({usuario.nm_email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.id_user && (
                <p className="text-sm text-destructive">{errors.id_user.message}</p>
              )}
            </div>
          )}

          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="nm_profissional">
              Nome Profissional <span className="text-destructive">*</span>
            </Label>
            <Input
              id="nm_profissional"
              {...register("nm_profissional", {
                required: "Nome é obrigatório",
                maxLength: { value: 255, message: "Máximo de 255 caracteres" },
              })}
              placeholder="Ex: Dr. João Silva"
              disabled={isLoading}
            />
            {errors.nm_profissional && (
              <p className="text-sm text-destructive">{errors.nm_profissional.message}</p>
            )}
          </div>

          {/* Especialidades */}
          <div className="space-y-2">
            <Label>Especialidades</Label>
            <div className="flex gap-2">
              <Input
                value={novaEspecialidade}
                onChange={(e) => setNovaEspecialidade(e.target.value)}
                placeholder="Ex: Dermatologia"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    adicionarEspecialidade();
                  }
                }}
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="outline"
                onClick={adicionarEspecialidade}
                disabled={isLoading}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {especialidades.map((esp) => (
                <Badge key={esp} variant="secondary" className="gap-1">
                  {esp}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => removerEspecialidade(esp)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          {/* Registro Profissional */}
          <div className="space-y-2">
            <Label htmlFor="nr_registro_profissional">Registro Profissional</Label>
            <Input
              id="nr_registro_profissional"
              {...register("nr_registro_profissional", {
                maxLength: { value: 50, message: "Máximo de 50 caracteres" },
              })}
              placeholder="Ex: CRM 12345/SP"
              disabled={isLoading}
            />
            {errors.nr_registro_profissional && (
              <p className="text-sm text-destructive">
                {errors.nr_registro_profissional.message}
              </p>
            )}
          </div>

          {/* Anos de Experiência */}
          <div className="space-y-2">
            <Label htmlFor="nr_anos_experiencia">Anos de Experiência</Label>
            <Input
              id="nr_anos_experiencia"
              type="number"
              min="0"
              max="100"
              {...register("nr_anos_experiencia", {
                min: { value: 0, message: "Mínimo de 0 anos" },
                max: { value: 100, message: "Máximo de 100 anos" },
              })}
              placeholder="Ex: 5"
              disabled={isLoading}
            />
            {errors.nr_anos_experiencia && (
              <p className="text-sm text-destructive">
                {errors.nr_anos_experiencia.message}
              </p>
            )}
          </div>

          {/* Formação */}
          <div className="space-y-2">
            <Label htmlFor="ds_formacao">Formação</Label>
            <Textarea
              id="ds_formacao"
              {...register("ds_formacao")}
              placeholder="Ex: Graduação em Medicina - USP, Especialização em Dermatologia - UNIFESP"
              rows={3}
              disabled={isLoading}
            />
          </div>

          {/* Biografia */}
          <div className="space-y-2">
            <Label htmlFor="ds_bio">Biografia</Label>
            <Textarea
              id="ds_bio"
              {...register("ds_bio")}
              placeholder="Conte um pouco sobre sua experiência e especialidades..."
              rows={4}
              disabled={isLoading}
            />
          </div>

          {/* URL Foto */}
          <div className="space-y-2">
            <Label htmlFor="ds_foto_perfil">URL da Foto de Perfil</Label>
            <Input
              id="ds_foto_perfil"
              type="url"
              {...register("ds_foto_perfil")}
              placeholder="https://exemplo.com/foto.jpg"
              disabled={isLoading}
            />
          </div>

          {/* Switches */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Status Ativo</Label>
                <p className="text-sm text-muted-foreground">
                  Profissional pode ser visualizado e agendado
                </p>
              </div>
              <Switch
                checked={watch("st_ativo")}
                onCheckedChange={(checked) => setValue("st_ativo", checked)}
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Aceita Novos Pacientes</Label>
                <p className="text-sm text-muted-foreground">
                  Profissional está disponível para novos agendamentos
                </p>
              </div>
              <Switch
                checked={watch("st_aceita_novos_pacientes")}
                onCheckedChange={(checked) =>
                  setValue("st_aceita_novos_pacientes", checked)
                }
                disabled={isLoading}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Atualizar" : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
