"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  useProfissionais,
  deletarProfissional,
  revalidarProfissionais,
} from "@/lib/api/hooks/useProfissionais";
import { ProfissionalForm } from "@/components/forms/ProfissionalForm";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Star,
  Users,
  Loader2,
  Award,
  Briefcase,
} from "lucide-react";
import { toast } from "sonner";

interface ProfissionaisGestaoProps {
  empresaId: string;
}

export function ProfissionaisGestao({ empresaId }: ProfissionaisGestaoProps) {
  const [busca, setBusca] = useState("");
  const [page, setPage] = useState(1);
  const [editingProfissionalId, setEditingProfissionalId] = useState<string | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { profissionais, meta, isLoading, isError } = useProfissionais({
    id_empresa: empresaId,
    busca: busca || undefined,
    page,
    size: 10,
  });

  const handleDelete = async (profissionalId: string, nome: string) => {
    if (!confirm(`Tem certeza que deseja excluir o profissional "${nome}"?`)) {
      return;
    }

    try {
      await deletarProfissional(profissionalId);
      toast.success("Profissional excluído com sucesso!");
      revalidarProfissionais();
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir profissional");
    }
  };

  const handleEdit = (profissionalId: string) => {
    setEditingProfissionalId(profissionalId);
    setIsDialogOpen(true);
  };

  const handleCreateNew = () => {
    setEditingProfissionalId(null);
    setIsDialogOpen(true);
  };

  const handleSuccess = () => {
    setIsDialogOpen(false);
    setEditingProfissionalId(null);
    revalidarProfissionais();
    toast.success(
      editingProfissionalId
        ? "Profissional atualizado com sucesso!"
        : "Profissional criado com sucesso!"
    );
  };

  const getIniciais = (nome: string) => {
    const partes = nome.split(" ");
    if (partes.length >= 2) {
      return `${partes[0][0]}${partes[1][0]}`.toUpperCase();
    }
    return nome.substring(0, 2).toUpperCase();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando profissionais...</p>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900">
            Erro ao carregar profissionais
          </h3>
          <p className="text-gray-600 mt-2">
            Ocorreu um erro ao carregar a lista de profissionais.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com busca e botão criar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Gestão de Profissionais
            </CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleCreateNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Profissional
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingProfissionalId
                      ? "Editar Profissional"
                      : "Novo Profissional"}
                  </DialogTitle>
                </DialogHeader>
                <ProfissionalForm
                  profissionalId={editingProfissionalId}
                  empresaId={empresaId}
                  onSuccess={handleSuccess}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, especialidade ou registro..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Listagem de profissionais */}
      {profissionais.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900">
              Nenhum profissional cadastrado
            </h3>
            <p className="text-gray-600 mt-2">
              {busca
                ? "Nenhum profissional encontrado com os filtros aplicados."
                : "Comece adicionando o primeiro profissional da empresa."}
            </p>
            {!busca && (
              <Button className="mt-4" onClick={handleCreateNew}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Primeiro Profissional
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Profissional</TableHead>
                <TableHead>Especialidades</TableHead>
                <TableHead>Experiência</TableHead>
                <TableHead>Registro</TableHead>
                <TableHead>Avaliação</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profissionais.map((profissional) => (
                <TableRow key={profissional.id_profissional}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={profissional.ds_foto_perfil} />
                        <AvatarFallback>
                          {getIniciais(profissional.nm_profissional)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {profissional.nm_profissional}
                        </p>
                        {profissional.ds_email && (
                          <p className="text-sm text-muted-foreground">
                            {profissional.ds_email}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {profissional.ds_especialidades &&
                    profissional.ds_especialidades.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {profissional.ds_especialidades
                          .slice(0, 2)
                          .map((esp, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {esp}
                            </Badge>
                          ))}
                        {profissional.ds_especialidades.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{profissional.ds_especialidades.length - 2}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Não informado
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {profissional.nr_anos_experiencia ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Briefcase className="h-3 w-3 text-muted-foreground" />
                        <span>{profissional.nr_anos_experiencia} anos</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Não informado
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {profissional.nr_registro_profissional ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Award className="h-3 w-3 text-muted-foreground" />
                        <span>{profissional.nr_registro_profissional}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Não informado
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {profissional.vl_avaliacao_media ? (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">
                          {profissional.vl_avaliacao_media.toFixed(1)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({profissional.nr_total_avaliacoes || 0})
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Sem avaliações
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Badge
                        variant={profissional.st_ativo ? "success" : "secondary"}
                      >
                        {profissional.st_ativo ? "Ativo" : "Inativo"}
                      </Badge>
                      {profissional.st_ativo &&
                        profissional.st_aceita_novos_pacientes && (
                          <Badge variant="outline" className="text-xs">
                            Aceita novos pacientes
                          </Badge>
                        )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          handleEdit(profissional.id_profissional)
                        }
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          handleDelete(
                            profissional.id_profissional,
                            profissional.nm_profissional
                          )
                        }
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Paginação */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t">
              <p className="text-sm text-muted-foreground">
                Mostrando {profissionais.length} de {meta.totalItems}{" "}
                profissionais
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Anterior
                </Button>
                <span className="text-sm">
                  Página {page} de {meta.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPage((p) => Math.min(meta.totalPages, p + 1))
                  }
                  disabled={page === meta.totalPages}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
