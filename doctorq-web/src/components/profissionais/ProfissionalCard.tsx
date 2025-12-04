"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MoreVertical,
  Edit,
  Trash2,
  Calendar,
  Star,
  Award,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import {
  Profissional,
  deletarProfissional,
  revalidarProfissionais,
  getExperienciaLabel,
} from "@/lib/api/hooks/useProfissionais";

interface ProfissionalCardProps {
  profissional: Profissional;
  onEdit: (profissional: Profissional) => void;
  onViewStats?: (profissional: Profissional) => void;
}

export function ProfissionalCard({
  profissional,
  onEdit,
  onViewStats,
}: ProfissionalCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      await deletarProfissional(profissional.id_profissional);
      toast.success("Profissional removido com sucesso!");
      await revalidarProfissionais();
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Erro ao deletar profissional:", error);
      toast.error("Erro ao remover profissional. Tente novamente.");
    } finally {
      setIsDeleting(false);
    }
  };

  const iniciais = profissional.nm_profissional
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex gap-4">
              <Avatar className="h-16 w-16 border-2 border-primary/10">
                <AvatarImage src={profissional.ds_foto_perfil} alt={profissional.nm_profissional} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                  {iniciais}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <CardTitle className="text-xl">{profissional.nm_profissional}</CardTitle>
                <div className="flex flex-wrap gap-1.5">
                  {profissional.ds_especialidades?.slice(0, 2).map((esp) => (
                    <Badge key={esp} variant="secondary" className="text-xs">
                      {esp}
                    </Badge>
                  ))}
                  {profissional.ds_especialidades && profissional.ds_especialidades.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{profissional.ds_especialidades.length - 2}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onViewStats && (
                  <>
                    <DropdownMenuItem onClick={() => onViewStats(profissional)}>
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Ver Estatísticas
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={() => onEdit(profissional)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remover
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Informações Profissionais */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {profissional.nr_registro_profissional && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Award className="h-4 w-4" />
                <span className="truncate">{profissional.nr_registro_profissional}</span>
              </div>
            )}
            {profissional.nr_anos_experiencia && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{getExperienciaLabel(profissional.nr_anos_experiencia)}</span>
              </div>
            )}
          </div>

          {/* Biografia */}
          {profissional.ds_bio && (
            <p className="text-sm text-muted-foreground line-clamp-3">
              {profissional.ds_bio}
            </p>
          )}

          {/* Métricas */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Avaliação</p>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">
                  {profissional.vl_avaliacao_media?.toFixed(1) || "N/A"}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({profissional.nr_total_avaliacoes || 0})
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Status</p>
              <div className="flex items-center gap-1.5">
                {profissional.st_ativo ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-600">Ativo</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Inativo</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Aceita Novos Pacientes */}
          {profissional.st_aceita_novos_pacientes ? (
            <Badge variant="default" className="w-full justify-center">
              Aceitando novos pacientes
            </Badge>
          ) : (
            <Badge variant="secondary" className="w-full justify-center">
              Não aceitando novos pacientes
            </Badge>
          )}
        </CardContent>

        <CardFooter className="pt-4 gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-2"
            onClick={() => onEdit(profissional)}
          >
            <Edit className="h-4 w-4" />
            Editar
          </Button>
          {onViewStats && (
            <Button
              variant="default"
              size="sm"
              className="flex-1 gap-2"
              onClick={() => onViewStats(profissional)}
            >
              <BarChart3 className="h-4 w-4" />
              Estatísticas
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover o profissional{" "}
              <strong>{profissional.nm_profissional}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Removendo..." : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
