"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
import { usePacientes, desativarPaciente } from "@/lib/api/hooks/usePacientes";
import { PacienteForm } from "@/components/forms/PacienteForm";
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Users,
  Loader2,
  Calendar,
  Mail,
  Phone,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import type { Paciente } from "@/types/paciente";

export function PacientesTable({ id_empresa }: { id_empresa?: string }) {
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const [page, setPage] = useState(1);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedPaciente, setSelectedPaciente] = useState<Paciente | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  console.log("[PacientesTable] id_empresa recebido:", id_empresa);

  // Backend detecta automaticamente se deve filtrar por clínica ou profissional
  // Não é mais necessário passar id_clinica explicitamente
  const { pacientes, total, isLoading, mutate } = usePacientes({
    busca,
    page,
    size: 20,
  });

  const handleCreate = () => {
    setShowCreateDialog(true);
  };

  const handleEdit = (paciente: Paciente) => {
    setSelectedPaciente(paciente);
    setShowEditDialog(true);
  };

  const handleDelete = (paciente: Paciente) => {
    setSelectedPaciente(paciente);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!selectedPaciente) return;

    setIsDeleting(true);
    try {
      const result = await desativarPaciente(selectedPaciente.id_paciente);

      if (result.success) {
        toast.success("Paciente desativado com sucesso");
        mutate();
      } else {
        toast.error(result.error || "Erro ao desativar paciente");
      }
    } catch (error) {
      toast.error("Erro ao desativar paciente");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setSelectedPaciente(null);
    }
  };

  const calcularIdade = (dataNascimento?: string) => {
    if (!dataNascimento) return "-";

    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mesAtual = hoje.getMonth();
    const mesNascimento = nascimento.getMonth();

    if (
      mesAtual < mesNascimento ||
      (mesAtual === mesNascimento && hoje.getDate() < nascimento.getDate())
    ) {
      idade--;
    }

    return `${idade} anos`;
  };

  return (
    <>
      {/* Header com busca */}
      <Card className="border-0 shadow-sm mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 w-full md:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, CPF, email ou telefone..."
                  value={busca}
                  onChange={(e) => {
                    setBusca(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            <Button
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 w-full md:w-auto"
              onClick={handleCreate}
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Paciente
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : pacientes.length === 0 ? (
            <div className="text-center p-8">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Nenhum paciente encontrado
              </h3>
              <p className="text-muted-foreground mb-4">
                {busca
                  ? "Tente ajustar os filtros de busca"
                  : "Comece cadastrando um novo paciente"}
              </p>
              {!busca && (
                <Button onClick={handleCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  Cadastrar Primeiro Paciente
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Idade</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Consultas</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pacientes.map((paciente) => (
                      <TableRow key={paciente.id_paciente}>
                        <TableCell className="font-medium">
                          {paciente.nm_paciente}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {paciente.nr_cpf}
                        </TableCell>
                        <TableCell>
                          {calcularIdade(paciente.dt_nascimento)}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {paciente.ds_email && (
                              <div className="flex items-center gap-1 text-sm">
                                <Mail className="h-3 w-3" />
                                {paciente.ds_email}
                              </div>
                            )}
                            {paciente.nr_telefone && (
                              <div className="flex items-center gap-1 text-sm">
                                <Phone className="h-3 w-3" />
                                {paciente.nr_telefone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {paciente.nr_total_consultas}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={paciente.st_ativo ? "default" : "secondary"}
                          >
                            {paciente.st_ativo ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => router.push(`/profissional/prontuario/${paciente.id_paciente}`)}
                              >
                                <FileText className="mr-2 h-4 w-4" />
                                Abrir Prontuário
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleEdit(paciente)}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(paciente)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Desativar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Paginação */}
              {total > 20 && (
                <div className="flex items-center justify-between p-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {pacientes.length} de {total} pacientes
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page * 20 >= total}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Criação */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Paciente</DialogTitle>
            <DialogDescription>
              Preencha os dados do novo paciente. Campos com * são obrigatórios.
            </DialogDescription>
          </DialogHeader>
          <PacienteForm
            onSuccess={() => {
              setShowCreateDialog(false);
              mutate();
            }}
            onCancel={() => setShowCreateDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog de Edição */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Paciente</DialogTitle>
            <DialogDescription>
              Atualize as informações do paciente conforme necessário.
            </DialogDescription>
          </DialogHeader>
          {selectedPaciente && (
            <PacienteForm
              paciente={selectedPaciente}
              onSuccess={() => {
                setShowEditDialog(false);
                setSelectedPaciente(null);
                mutate();
              }}
              onCancel={() => {
                setShowEditDialog(false);
                setSelectedPaciente(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Desativação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja desativar o paciente{" "}
              <strong>{selectedPaciente?.nm_paciente}</strong>? Esta ação irá
              marcar o paciente como inativo, mas não removerá seus dados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Desativando...
                </>
              ) : (
                "Desativar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
