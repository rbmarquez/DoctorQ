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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useClinicas, deletarClinica, revalidarClinicas } from "@/lib/api/hooks/useClinicas";
import { ClinicaForm } from "@/components/forms/ClinicaForm";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  MapPin,
  Phone,
  Mail,
  Star,
  Building2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface ClinicasGestaoProps {
  empresaId: string;
}

export function ClinicasGestao({ empresaId }: ClinicasGestaoProps) {
  const [busca, setBusca] = useState("");
  const [page, setPage] = useState(1);
  const [editingClinicaId, setEditingClinicaId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { clinicas, meta, isLoading, isError } = useClinicas({
    id_empresa: empresaId,
    busca: busca || undefined,
    page,
    size: 10,
  });

  const handleDelete = async (clinicaId: string, nome: string) => {
    if (!confirm(`Tem certeza que deseja excluir a clínica "${nome}"?`)) {
      return;
    }

    try {
      await deletarClinica(clinicaId);
      toast.success("Clínica excluída com sucesso!");
      revalidarClinicas();
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir clínica");
    }
  };

  const handleEdit = (clinicaId: string) => {
    setEditingClinicaId(clinicaId);
    setIsDialogOpen(true);
  };

  const handleCreateNew = () => {
    setEditingClinicaId(null);
    setIsDialogOpen(true);
  };

  const handleSuccess = () => {
    setIsDialogOpen(false);
    setEditingClinicaId(null);
    revalidarClinicas();
    toast.success(
      editingClinicaId
        ? "Clínica atualizada com sucesso!"
        : "Clínica criada com sucesso!"
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando clínicas...</p>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Building2 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900">
            Erro ao carregar clínicas
          </h3>
          <p className="text-gray-600 mt-2">
            Ocorreu um erro ao carregar a lista de clínicas.
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
              <Building2 className="h-5 w-5" />
              Gestão de Clínicas
            </CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleCreateNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Clínica
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingClinicaId ? "Editar Clínica" : "Nova Clínica"}
                  </DialogTitle>
                </DialogHeader>
                <ClinicaForm
                  clinicaId={editingClinicaId}
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
              placeholder="Buscar por nome, cidade ou especialidade..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Listagem de clínicas */}
      {clinicas.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900">
              Nenhuma clínica cadastrada
            </h3>
            <p className="text-gray-600 mt-2">
              {busca
                ? "Nenhuma clínica encontrada com os filtros aplicados."
                : "Comece criando a primeira clínica da empresa."}
            </p>
            {!busca && (
              <Button className="mt-4" onClick={handleCreateNew}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Clínica
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Clínica</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Profissionais</TableHead>
                <TableHead>Avaliação</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clinicas.map((clinica) => (
                <TableRow key={clinica.id_clinica}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{clinica.nm_clinica}</p>
                      {clinica.ds_especialidades &&
                        clinica.ds_especialidades.length > 0 && (
                          <p className="text-sm text-muted-foreground">
                            {clinica.ds_especialidades.slice(0, 2).join(", ")}
                            {clinica.ds_especialidades.length > 2 &&
                              ` +${clinica.ds_especialidades.length - 2}`}
                          </p>
                        )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {clinica.ds_cidade && clinica.ds_estado ? (
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span>
                          {clinica.ds_cidade}, {clinica.ds_estado}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Não informado
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {clinica.ds_telefone && (
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span>{clinica.ds_telefone}</span>
                        </div>
                      )}
                      {clinica.ds_email && (
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <span>{clinica.ds_email}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium">
                      {clinica.total_profissionais || 0}
                    </span>
                  </TableCell>
                  <TableCell>
                    {clinica.vl_avaliacao_media ? (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">
                          {clinica.vl_avaliacao_media.toFixed(1)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({clinica.nr_total_avaliacoes || 0})
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Sem avaliações
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={clinica.st_ativa ? "success" : "secondary"}
                    >
                      {clinica.st_ativa ? "Ativa" : "Inativa"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(clinica.id_clinica)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          handleDelete(clinica.id_clinica, clinica.nm_clinica)
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
                Mostrando {clinicas.length} de {meta.totalItems} clínicas
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
                  onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
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
