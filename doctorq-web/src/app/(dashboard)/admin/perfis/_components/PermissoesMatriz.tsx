"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  Settings,
  Save,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { usePerfis, useUpdatePerfil, type Perfil } from "@/lib/api/hooks/gestao";

/**
 * Lista de permissões disponíveis no sistema
 * Estrutura: { id, nome, descricao, categoria }
 */
const PERMISSOES_SISTEMA = [
  // Dashboard
  { id: "dashboard_visualizar", nome: "DASHBOARD_VISUALIZAR", descricao: "Visualizar dashboard", categoria: "Dashboard" },

  // Usuários
  { id: "usuarios_visualizar", nome: "USUARIOS_VISUALIZAR", descricao: "Visualizar usuários", categoria: "Usuários" },
  { id: "usuarios_criar", nome: "USUARIOS_CRIAR", descricao: "Criar novos usuários", categoria: "Usuários" },
  { id: "usuarios_editar", nome: "USUARIOS_EDITAR", descricao: "Editar usuários", categoria: "Usuários" },
  { id: "usuarios_excluir", nome: "USUARIOS_EXCLUIR", descricao: "Excluir usuários", categoria: "Usuários" },

  // Perfis
  { id: "perfis_visualizar", nome: "PERFIS_VISUALIZAR", descricao: "Visualizar perfis", categoria: "Perfis" },
  { id: "perfis_criar", nome: "PERFIS_CRIAR", descricao: "Criar novos perfis", categoria: "Perfis" },
  { id: "perfis_editar", nome: "PERFIS_EDITAR", descricao: "Editar perfis", categoria: "Perfis" },
  { id: "perfis_excluir", nome: "PERFIS_EXCLUIR", descricao: "Excluir perfis", categoria: "Perfis" },
  { id: "perfis_parametrizacao", nome: "PERFIS_PARAMETRIZACAO", descricao: "Parametrizar permissões", categoria: "Perfis" },

  // Empresas
  { id: "empresas_visualizar", nome: "EMPRESAS_VISUALIZAR", descricao: "Visualizar empresas", categoria: "Empresas" },
  { id: "empresas_criar", nome: "EMPRESAS_CRIAR", descricao: "Criar novas empresas", categoria: "Empresas" },
  { id: "empresas_editar", nome: "EMPRESAS_EDITAR", descricao: "Editar empresas", categoria: "Empresas" },
  { id: "empresas_excluir", nome: "EMPRESAS_EXCLUIR", descricao: "Excluir empresas", categoria: "Empresas" },

  // Agentes IA
  { id: "agentes_visualizar", nome: "AGENTES_VISUALIZAR", descricao: "Visualizar agentes IA", categoria: "Agentes IA" },
  { id: "agentes_criar", nome: "AGENTES_CRIAR", descricao: "Criar agentes IA", categoria: "Agentes IA" },
  { id: "agentes_editar", nome: "AGENTES_EDITAR", descricao: "Editar agentes IA", categoria: "Agentes IA" },
  { id: "agentes_excluir", nome: "AGENTES_EXCLUIR", descricao: "Excluir agentes IA", categoria: "Agentes IA" },
  { id: "agentes_executar", nome: "AGENTES_EXECUTAR", descricao: "Executar agentes IA", categoria: "Agentes IA" },

  // Conversas
  { id: "conversas_visualizar", nome: "CONVERSAS_VISUALIZAR", descricao: "Visualizar conversas", categoria: "Conversas" },
  { id: "conversas_criar", nome: "CONVERSAS_CRIAR", descricao: "Criar conversas", categoria: "Conversas" },
  { id: "conversas_excluir", nome: "CONVERSAS_EXCLUIR", descricao: "Excluir conversas", categoria: "Conversas" },

  // Clínicas
  { id: "clinicas_visualizar", nome: "CLINICAS_VISUALIZAR", descricao: "Visualizar clínicas", categoria: "Clínicas" },
  { id: "clinicas_criar", nome: "CLINICAS_CRIAR", descricao: "Criar clínicas", categoria: "Clínicas" },
  { id: "clinicas_editar", nome: "CLINICAS_EDITAR", descricao: "Editar clínicas", categoria: "Clínicas" },
  { id: "clinicas_excluir", nome: "CLINICAS_EXCLUIR", descricao: "Excluir clínicas", categoria: "Clínicas" },

  // Agendamentos
  { id: "agendamentos_visualizar", nome: "AGENDAMENTOS_VISUALIZAR", descricao: "Visualizar agendamentos", categoria: "Agendamentos" },
  { id: "agendamentos_criar", nome: "AGENDAMENTOS_CRIAR", descricao: "Criar agendamentos", categoria: "Agendamentos" },
  { id: "agendamentos_editar", nome: "AGENDAMENTOS_EDITAR", descricao: "Editar agendamentos", categoria: "Agendamentos" },
  { id: "agendamentos_excluir", nome: "AGENDAMENTOS_EXCLUIR", descricao: "Excluir agendamentos", categoria: "Agendamentos" },

  // Pacientes
  { id: "pacientes_visualizar", nome: "PACIENTES_VISUALIZAR", descricao: "Visualizar pacientes", categoria: "Pacientes" },
  { id: "pacientes_criar", nome: "PACIENTES_CRIAR", descricao: "Criar pacientes", categoria: "Pacientes" },
  { id: "pacientes_editar", nome: "PACIENTES_EDITAR", descricao: "Editar pacientes", categoria: "Pacientes" },
  { id: "pacientes_excluir", nome: "PACIENTES_EXCLUIR", descricao: "Excluir pacientes", categoria: "Pacientes" },

  // Profissionais
  { id: "profissionais_visualizar", nome: "PROFISSIONAIS_VISUALIZAR", descricao: "Visualizar profissionais", categoria: "Profissionais" },
  { id: "profissionais_criar", nome: "PROFISSIONAIS_CRIAR", descricao: "Criar profissionais", categoria: "Profissionais" },
  { id: "profissionais_editar", nome: "PROFISSIONAIS_EDITAR", descricao: "Editar profissionais", categoria: "Profissionais" },
  { id: "profissionais_excluir", nome: "PROFISSIONAIS_EXCLUIR", descricao: "Excluir profissionais", categoria: "Profissionais" },

  // Financeiro
  { id: "financeiro_visualizar", nome: "FINANCEIRO_VISUALIZAR", descricao: "Visualizar financeiro", categoria: "Financeiro" },
  { id: "financeiro_criar", nome: "FINANCEIRO_CRIAR", descricao: "Criar transações", categoria: "Financeiro" },
  { id: "financeiro_editar", nome: "FINANCEIRO_EDITAR", descricao: "Editar transações", categoria: "Financeiro" },
  { id: "financeiro_excluir", nome: "FINANCEIRO_EXCLUIR", descricao: "Excluir transações", categoria: "Financeiro" },
  { id: "financeiro_exportar", nome: "FINANCEIRO_EXPORTAR", descricao: "Exportar relatórios", categoria: "Financeiro" },

  // Relatórios
  { id: "relatorios_visualizar", nome: "RELATORIOS_VISUALIZAR", descricao: "Visualizar relatórios", categoria: "Relatórios" },
  { id: "relatorios_exportar", nome: "RELATORIOS_EXPORTAR", descricao: "Exportar relatórios", categoria: "Relatórios" },

  // Configurações
  { id: "configuracoes_visualizar", nome: "CONFIGURACOES_VISUALIZAR", descricao: "Visualizar configurações", categoria: "Configurações" },
  { id: "configuracoes_editar", nome: "CONFIGURACOES_EDITAR", descricao: "Editar configurações", categoria: "Configurações" },

  // Marketplace
  { id: "marketplace_visualizar", nome: "MARKETPLACE_VISUALIZAR", descricao: "Visualizar marketplace", categoria: "Marketplace" },
  { id: "marketplace_gerenciar", nome: "MARKETPLACE_GERENCIAR", descricao: "Gerenciar produtos", categoria: "Marketplace" },

  // Central de Atendimento
  { id: "central_atendimento_visualizar", nome: "CENTRAL_ATENDIMENTO_VISUALIZAR", descricao: "Visualizar central", categoria: "Central de Atendimento" },
  { id: "central_atendimento_responder", nome: "CENTRAL_ATENDIMENTO_RESPONDER", descricao: "Responder mensagens", categoria: "Central de Atendimento" },

  // Universidade
  { id: "universidade_visualizar", nome: "UNIVERSIDADE_VISUALIZAR", descricao: "Visualizar universidade", categoria: "Universidade" },
  { id: "universidade_criar", nome: "UNIVERSIDADE_CRIAR", descricao: "Criar conteúdos", categoria: "Universidade" },
  { id: "universidade_editar", nome: "UNIVERSIDADE_EDITAR", descricao: "Editar conteúdos", categoria: "Universidade" },
  { id: "universidade_excluir", nome: "UNIVERSIDADE_EXCLUIR", descricao: "Excluir conteúdos", categoria: "Universidade" },

  // Programa de Parceiros
  { id: "parceiros_visualizar", nome: "PARCEIROS_VISUALIZAR", descricao: "Visualizar parceiros", categoria: "Parceiros" },
  { id: "parceiros_criar", nome: "PARCEIROS_CRIAR", descricao: "Criar leads/planos", categoria: "Parceiros" },
  { id: "parceiros_editar", nome: "PARCEIROS_EDITAR", descricao: "Editar leads/planos", categoria: "Parceiros" },
  { id: "parceiros_excluir", nome: "PARCEIROS_EXCLUIR", descricao: "Excluir leads/planos", categoria: "Parceiros" },

  // Sistema
  { id: "sistema_visualizar", nome: "SISTEMA_VISUALIZAR", descricao: "Visualizar sistema", categoria: "Sistema" },
  { id: "sistema_gerenciar", nome: "SISTEMA_GERENCIAR", descricao: "Gerenciar sistema", categoria: "Sistema" },
];

/**
 * Componente de Matriz de Permissões
 * Layout baseado no PerfilParametrizacaoComponent do Maua
 *
 * Features:
 * - Seletor de perfil
 * - Pesquisa de permissões
 * - Checkbox para cada permissão
 * - Salvar alterações
 */
export function PermissoesMatriz() {
  // Estados
  const [selectedPerfilId, setSelectedPerfilId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [permissoesSelecionadas, setPermissoesSelecionadas] = useState<Set<string>>(new Set());
  const [permissoesOriginais, setPermissoesOriginais] = useState<Set<string>>(new Set());
  const [hasChanges, setHasChanges] = useState(false);

  // Hooks de dados - factory retorna { data (array), meta, isLoading, ... }
  const { data: perfis, isLoading: loadingPerfis } = usePerfis({ size: 100, ativo: "S" });

  const selectedPerfil = (perfis || []).find((p) => p.id_perfil === selectedPerfilId);
  const { trigger: updatePerfil, isMutating: isSaving } = useUpdatePerfil(selectedPerfilId);

  // Carrega permissões do perfil selecionado
  useEffect(() => {
    if (selectedPerfil) {
      const perms = selectedPerfil.ds_permissoes as Record<string, any> || {};
      const permSet = new Set<string>();

      // Extrai permissões do objeto
      Object.entries(perms).forEach(([key, value]) => {
        const normalizedKey = key.toLowerCase();
        if (typeof value === "boolean" && value) {
          permSet.add(normalizedKey);
          return;
        }
        if (typeof value === "object" && value !== null) {
          Object.entries(value).forEach(([action, enabled]) => {
            if (enabled) {
              permSet.add(`${normalizedKey}_${action.toLowerCase()}`);
            }
          });
        }
      });

      setPermissoesSelecionadas(new Set(permSet));
      setPermissoesOriginais(new Set(permSet));
      setHasChanges(false);
    } else {
      setPermissoesSelecionadas(new Set());
      setPermissoesOriginais(new Set());
      setHasChanges(false);
    }
  }, [selectedPerfil]);

  // Detecta mudanças
  useEffect(() => {
    const selecionadasArray = Array.from(permissoesSelecionadas).sort();
    const originaisArray = Array.from(permissoesOriginais).sort();
    const changed = JSON.stringify(selecionadasArray) !== JSON.stringify(originaisArray);
    setHasChanges(changed);
  }, [permissoesSelecionadas, permissoesOriginais]);

  // Filtra permissões pela busca
  const permissoesFiltradas = useMemo(() => {
    if (!search) return PERMISSOES_SISTEMA;
    const searchLower = search.toLowerCase();
    return PERMISSOES_SISTEMA.filter(
      (p) =>
        p.nome.toLowerCase().includes(searchLower) ||
        p.descricao.toLowerCase().includes(searchLower) ||
        p.categoria.toLowerCase().includes(searchLower)
    );
  }, [search]);

  // Toggle permissão individual
  const togglePermissao = (permId: string) => {
    const newSet = new Set(permissoesSelecionadas);
    if (newSet.has(permId)) {
      newSet.delete(permId);
    } else {
      newSet.add(permId);
    }
    setPermissoesSelecionadas(newSet);
  };

  // Toggle todas as permissões
  const toggleTodas = () => {
    if (permissoesSelecionadas.size === PERMISSOES_SISTEMA.length) {
      setPermissoesSelecionadas(new Set());
      return;
    }
    setPermissoesSelecionadas(new Set(PERMISSOES_SISTEMA.map((p) => p.id)));
  };

  // Salvar alterações
  const handleSalvar = async () => {
    if (!selectedPerfilId) return;

    try {
      // Converte permissões para o formato do backend
      const permissoesObj: Record<string, boolean> = {};
      permissoesSelecionadas.forEach((perm) => {
        permissoesObj[perm.toLowerCase()] = true;
      });

      await updatePerfil({
        ds_permissoes: permissoesObj,
      });

      setPermissoesOriginais(new Set(permissoesSelecionadas));
      setHasChanges(false);
      toast.success("Permissões atualizadas com sucesso");
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar permissões");
    }
  };

  const todasSelecionadas = permissoesSelecionadas.size === PERMISSOES_SISTEMA.length;
  const algumaSelecionada = permissoesSelecionadas.size > 0;

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Permissões</h2>
        </div>
      </div>

      {/* Seletor de Perfil */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>
            Perfil <span className="text-red-500">*</span>
          </Label>
          <Select value={selectedPerfilId} onValueChange={setSelectedPerfilId}>
            <SelectTrigger>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Selecione um perfil" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {loadingPerfis ? (
                <div className="p-2 text-center">
                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                </div>
              ) : (perfis || []).length === 0 ? (
                <div className="p-2 text-center text-muted-foreground">
                  Nenhum perfil encontrado
                </div>
              ) : (
                (perfis || []).map((perfil) => (
                  <SelectItem key={perfil.id_perfil} value={perfil.id_perfil}>
                    {perfil.nm_perfil}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Descrição</Label>
          <Input
            value={selectedPerfil?.ds_perfil || ""}
            disabled
            placeholder="Selecione um perfil"
            className="bg-muted"
          />
        </div>
      </div>

      {/* Pesquisa */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Digite o nome de uma permissão..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Loading */}
      {!selectedPerfilId ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Users className="h-12 w-12 mb-4 opacity-50" />
          <p>Selecione um perfil para gerenciar suas permissões</p>
        </div>
      ) : (
        <>
          {/* Tabela de Permissões */}
          <div className="border rounded-lg max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={todasSelecionadas}
                      onCheckedChange={toggleTodas}
                      aria-label="Selecionar todas"
                    />
                  </TableHead>
                  <TableHead>Permissão</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissoesFiltradas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Nenhuma permissão encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  permissoesFiltradas.map((perm) => (
                    <TableRow
                      key={perm.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => togglePermissao(perm.id)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={permissoesSelecionadas.has(perm.id)}
                          onCheckedChange={() => togglePermissao(perm.id)}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm">{perm.nome}</TableCell>
                      <TableCell className="text-muted-foreground">{perm.descricao}</TableCell>
                      <TableCell>
                        <span className="text-xs bg-muted px-2 py-1 rounded">
                          {perm.categoria}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Contador e Botão Salvar */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {permissoesSelecionadas.size} de {PERMISSOES_SISTEMA.length} permissões selecionadas
            </span>

            <Button
              onClick={handleSalvar}
              disabled={!hasChanges || isSaving}
              className={hasChanges ? "bg-green-600 hover:bg-green-700" : ""}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar Alterações
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
