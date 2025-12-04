"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Monitor,
  Loader2,
  Save,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import {
  useTelasConfig,
  useCreateOrUpdateTelaConfig,
  TipoUsuarioTela,
  type TelaConfig,
} from "@/lib/api/hooks/gestao";

/**
 * Interface para definição de telas
 */
interface TelaSistema {
  categoria: string;
  codigo: string;
  nome: string;
  descricao: string;
  tipoEspecifico?: TipoUsuarioTela[]; // Tipos específicos que podem ver esta tela
}

/**
 * Lista de todas as telas disponíveis no sistema
 * Organizadas por categoria para melhor visualização
 */
const TELAS_SISTEMA: TelaSistema[] = [
  // Dashboard e Visão Geral
  { categoria: "Dashboard", codigo: "admin_dashboard", nome: "Dashboard Administrativo", descricao: "Visão geral do sistema" },
  { categoria: "Dashboard", codigo: "clinica_dashboard", nome: "Dashboard da Clínica", descricao: "Visão geral da clínica" },
  { categoria: "Dashboard", codigo: "profissional_dashboard", nome: "Dashboard do Profissional", descricao: "Visão geral do profissional" },
  { categoria: "Dashboard", codigo: "paciente_dashboard", nome: "Dashboard do Paciente", descricao: "Visão geral do paciente" },
  { categoria: "Dashboard", codigo: "fornecedor_dashboard", nome: "Dashboard do Fornecedor", descricao: "Visão geral do fornecedor" },

  // Gestão de Usuários
  { categoria: "Gestão", codigo: "admin_usuarios", nome: "Usuários", descricao: "Gerenciar usuários do sistema" },
  { categoria: "Gestão", codigo: "admin_perfis", nome: "Perfis", descricao: "Gerenciar perfis de acesso" },
  { categoria: "Gestão", codigo: "admin_empresas", nome: "Empresas", descricao: "Gerenciar empresas" },
  { categoria: "Gestão", codigo: "admin_clinicas", nome: "Clínicas", descricao: "Gerenciar clínicas" },

  // Clínica
  { categoria: "Clínica", codigo: "clinica_agendamentos", nome: "Agendamentos", descricao: "Gestão de consultas" },
  { categoria: "Clínica", codigo: "clinica_profissionais", nome: "Profissionais", descricao: "Gestão de profissionais" },
  { categoria: "Clínica", codigo: "clinica_pacientes", nome: "Pacientes", descricao: "Gestão de pacientes" },
  { categoria: "Clínica", codigo: "clinica_procedimentos", nome: "Procedimentos", descricao: "Gestão de procedimentos" },
  { categoria: "Clínica", codigo: "clinica_vagas", nome: "Vagas", descricao: "Gestão de vagas" },
  { categoria: "Clínica", codigo: "clinica_financeiro", nome: "Financeiro", descricao: "Gestão financeira" },
  { categoria: "Clínica", codigo: "clinica_relatorios", nome: "Relatórios", descricao: "Relatórios da clínica" },
  { categoria: "Clínica", codigo: "clinica_atendimento", nome: "Atendimento", descricao: "Central de atendimento" },
  { categoria: "Clínica", codigo: "clinica_configuracoes", nome: "Configurações", descricao: "Configurações da clínica" },

  // Profissional
  { categoria: "Profissional", codigo: "profissional_agenda", nome: "Minha Agenda", descricao: "Agenda do profissional" },
  { categoria: "Profissional", codigo: "profissional_pacientes", nome: "Meus Pacientes", descricao: "Pacientes do profissional" },
  { categoria: "Profissional", codigo: "profissional_procedimentos", nome: "Procedimentos", descricao: "Procedimentos realizados" },
  { categoria: "Profissional", codigo: "profissional_financeiro", nome: "Financeiro", descricao: "Dados financeiros" },
  { categoria: "Profissional", codigo: "profissional_relatorios", nome: "Relatórios", descricao: "Relatórios do profissional" },

  // Paciente
  { categoria: "Paciente", codigo: "paciente_agendamentos", nome: "Minhas Consultas", descricao: "Agendamentos do paciente" },
  { categoria: "Paciente", codigo: "paciente_historico", nome: "Histórico", descricao: "Histórico médico" },
  { categoria: "Paciente", codigo: "paciente_documentos", nome: "Documentos", descricao: "Documentos médicos" },
  { categoria: "Paciente", codigo: "paciente_pagamentos", nome: "Pagamentos", descricao: "Histórico de pagamentos" },

  // Fornecedor
  { categoria: "Fornecedor", codigo: "fornecedor_produtos", nome: "Produtos", descricao: "Gestão de produtos" },
  { categoria: "Fornecedor", codigo: "fornecedor_pedidos", nome: "Pedidos", descricao: "Gestão de pedidos" },
  { categoria: "Fornecedor", codigo: "fornecedor_financeiro", nome: "Financeiro", descricao: "Dados financeiros" },
  { categoria: "Fornecedor", codigo: "fornecedor_relatorios", nome: "Relatórios", descricao: "Relatórios do fornecedor" },

  // Marketplace e Público
  { categoria: "Público", codigo: "publico_busca", nome: "Busca", descricao: "Buscar clínicas e profissionais" },
  { categoria: "Público", codigo: "publico_marketplace", nome: "Marketplace", descricao: "Marketplace de produtos" },
  { categoria: "Público", codigo: "publico_blog", nome: "Blog", descricao: "Blog e conteúdo" },
];

const TIPOS_USUARIO = [
  { value: TipoUsuarioTela.ADMIN, label: "Administrador" },
  { value: TipoUsuarioTela.CLINICA, label: "Clínica" },
  { value: TipoUsuarioTela.PROFISSIONAL, label: "Profissional" },
  { value: TipoUsuarioTela.PACIENTE, label: "Paciente" },
  { value: TipoUsuarioTela.FORNECEDOR, label: "Fornecedor" },
  { value: TipoUsuarioTela.PUBLICO, label: "Público" },
];

/**
 * Componente de Matriz de Visibilidade de Telas
 * Permite configurar quais telas são visíveis para cada tipo de usuário
 */
export function TelasMatriz() {
  const [tipoSelecionado, setTipoSelecionado] = useState<TipoUsuarioTela>(TipoUsuarioTela.CLINICA);
  const [configuracoes, setConfiguracoes] = useState<Record<string, boolean>>({});
  const [mudancas, setMudancas] = useState<Set<string>>(new Set());

  // Ref para rastrear o último tipo processado
  const ultimoTipoProcessado = useRef<TipoUsuarioTela | null>(null);

  // Buscar configurações do backend
  const { data: telasConfig, isLoading: loadingConfig, mutate } = useTelasConfig({
    tp_tipo: tipoSelecionado,
  });

  const { trigger: saveConfig, isMutating: isSaving } = useCreateOrUpdateTelaConfig();

  // Atualizar configurações locais quando os dados do backend forem carregados
  useEffect(() => {
    if (!telasConfig) return;

    // Evitar processamento duplicado para o mesmo tipo
    if (ultimoTipoProcessado.current === tipoSelecionado) return;

    ultimoTipoProcessado.current = tipoSelecionado;

    const configMap: Record<string, boolean> = {};

    // Mapear configurações existentes do backend
    telasConfig.forEach((config: TelaConfig) => {
      configMap[config.cd_tela] = config.fg_visivel;
    });

    // Preencher com padrão true para telas sem configuração
    TELAS_SISTEMA.forEach((tela) => {
      if (!(tela.codigo in configMap)) {
        configMap[tela.codigo] = true;
      }
    });

    setConfiguracoes(configMap);
    setMudancas(new Set());
  }, [telasConfig, tipoSelecionado]);

  // Agrupar telas por categoria (filtrado por tipo de usuário)
  const telasPorCategoria = useMemo(() => {
    const grupos: Record<string, TelaSistema[]> = {};

    // Filtrar telas baseado no tipo selecionado
    const telasFiltradas = TELAS_SISTEMA.filter((tela) => {
      // Se a tela não tem tipo específico, está disponível para todos
      if (!tela.tipoEspecifico || tela.tipoEspecifico.length === 0) {
        return true;
      }
      // Se tem tipo específico, verifica se o tipo atual está na lista
      return tela.tipoEspecifico.includes(tipoSelecionado);
    });

    telasFiltradas.forEach((tela) => {
      if (!grupos[tela.categoria]) {
        grupos[tela.categoria] = [];
      }
      grupos[tela.categoria].push(tela);
    });
    return grupos;
  }, [tipoSelecionado]);

  // Toggle visibilidade de uma tela
  const handleToggle = (codigoTela: string) => {
    setConfiguracoes((prev) => ({
      ...prev,
      [codigoTela]: !prev[codigoTela],
    }));

    setMudancas((prev) => {
      const novas = new Set(prev);
      if (novas.has(codigoTela)) {
        novas.delete(codigoTela);
      } else {
        novas.add(codigoTela);
      }
      return novas;
    });
  };

  // Salvar mudanças
  const handleSalvar = async () => {
    if (mudancas.size === 0) {
      toast.info("Nenhuma alteração para salvar");
      return;
    }

    try {
      // Salvar cada mudança individualmente
      for (const codigoTela of mudancas) {
        await saveConfig({
          cd_tela: codigoTela,
          tp_tipo: tipoSelecionado,
          fg_visivel: configuracoes[codigoTela],
        });
      }

      toast.success(`${mudancas.size} configuração(ões) salva(s) com sucesso`);
      setMudancas(new Set());

      // Resetar o ref para forçar reprocessamento dos dados após mutate
      ultimoTipoProcessado.current = null;
      mutate();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar configurações");
    }
  };

  // Descartar mudanças
  const handleDescartar = () => {
    // Resetar o ref para forçar reprocessamento dos dados
    ultimoTipoProcessado.current = null;
    mutate();
    setMudancas(new Set());
    toast.info("Alterações descartadas");
  };

  // Marcar todas como visíveis (apenas telas visíveis do tipo atual)
  const handleMarcarTodas = () => {
    const novasConfigs = { ...configuracoes };
    const novasMudancas = new Set(mudancas);

    // Filtrar telas do tipo atual
    const telasFiltradas = TELAS_SISTEMA.filter((tela) => {
      if (!tela.tipoEspecifico || tela.tipoEspecifico.length === 0) return true;
      return tela.tipoEspecifico.includes(tipoSelecionado);
    });

    telasFiltradas.forEach((tela) => {
      novasConfigs[tela.codigo] = true;
      if (!configuracoes[tela.codigo]) {
        novasMudancas.add(tela.codigo);
      }
    });

    setConfiguracoes(novasConfigs);
    setMudancas(novasMudancas);
  };

  // Desmarcar todas (apenas telas visíveis do tipo atual)
  const handleDesmarcarTodas = () => {
    const novasConfigs = { ...configuracoes };
    const novasMudancas = new Set(mudancas);

    // Filtrar telas do tipo atual
    const telasFiltradas = TELAS_SISTEMA.filter((tela) => {
      if (!tela.tipoEspecifico || tela.tipoEspecifico.length === 0) return true;
      return tela.tipoEspecifico.includes(tipoSelecionado);
    });

    telasFiltradas.forEach((tela) => {
      novasConfigs[tela.codigo] = false;
      if (configuracoes[tela.codigo]) {
        novasMudancas.add(tela.codigo);
      }
    });

    setConfiguracoes(novasConfigs);
    setMudancas(novasMudancas);
  };

  const temMudancas = mudancas.size > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Monitor className="h-5 w-5 text-blue-600" />
          <h2 className="text-xl font-semibold">Configuração de Telas</h2>
        </div>
        {temMudancas && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
              {mudancas.size} alteração(ões) pendente(s)
            </Badge>
            <Button variant="outline" size="sm" onClick={handleDescartar}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Descartar
            </Button>
            <Button size="sm" onClick={handleSalvar} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar Alterações
            </Button>
          </div>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        Configure quais telas/módulos estão visíveis para cada tipo de usuário. Telas invisíveis não aparecerão no menu de navegação.
      </p>

      {/* Seletor de Tipo de Usuário */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium">Tipo de Usuário:</label>
        <Select value={tipoSelecionado} onValueChange={(v) => setTipoSelecionado(v as TipoUsuarioTela)}>
          <SelectTrigger className="w-[220px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIPOS_USUARIO.map((tipo) => (
              <SelectItem key={tipo.value} value={tipo.value}>
                {tipo.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-2 ml-auto">
          <Button variant="outline" size="sm" onClick={handleMarcarTodas}>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Marcar Todas
          </Button>
          <Button variant="outline" size="sm" onClick={handleDesmarcarTodas}>
            Desmarcar Todas
          </Button>
        </div>
      </div>

      {/* Tabela de Telas */}
      <div className="border rounded-lg">
        {loadingConfig ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[60px]">Visível</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Tela</TableHead>
                <TableHead>Descrição</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(telasPorCategoria).map(([categoria, telas]) => (
                telas.map((tela, idx) => (
                  <TableRow key={tela.codigo} className={mudancas.has(tela.codigo) ? "bg-yellow-50/50" : ""}>
                    <TableCell>
                      <Checkbox
                        checked={configuracoes[tela.codigo] ?? true}
                        onCheckedChange={() => handleToggle(tela.codigo)}
                      />
                    </TableCell>
                    <TableCell className="font-medium text-muted-foreground">
                      {idx === 0 ? categoria : ""}
                    </TableCell>
                    <TableCell className="font-medium">{tela.nome}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{tela.descricao}</TableCell>
                  </TableRow>
                ))
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
