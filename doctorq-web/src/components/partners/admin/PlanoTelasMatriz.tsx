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
  Package,
} from "lucide-react";
import { toast } from "sonner";

type PartnerType = 'clinica' | 'profissional' | 'fornecedor' | 'universal';

interface PlanoService {
  id_service: string;
  service_code: string;
  service_name: string;
  partner_type: PartnerType;
  active: boolean;
}

interface TelaSistema {
  categoria: string;
  codigo: string;
  nome: string;
  descricao: string;
  tiposPermitidos?: PartnerType[];
}

interface PlanoTelaConfig {
  id_plano_tela: string;
  id_service: string;
  cd_tela: string;
  fg_visivel: boolean;
}

/**
 * Lista de todas as telas disponíveis no sistema
 * Organizadas por categoria com tipos de parceiro permitidos
 *
 * IMPORTANTE: Os códigos devem corresponder às rotas das sidebars:
 * - ProfissionalSidebar: /profissional/* → profissional_*
 * - ClienteSidebar: /paciente/* → paciente_*
 * - FornecedorSidebar: /fornecedor/* → fornecedor_*
 * - ClinicaSidebar: /clinica/* → clinica_*
 * - Marketplace: /marketplace/* → marketplace_*
 */
const TELAS_SISTEMA: TelaSistema[] = [
  // ========== CLÍNICA ==========
  { categoria: "Dashboard (Clínica)", codigo: "clinica_dashboard", nome: "Dashboard", descricao: "Visão geral da clínica", tiposPermitidos: ["clinica", "universal"] },
  { categoria: "Gestão (Clínica)", codigo: "clinica_usuarios", nome: "Usuários", descricao: "Gerenciar usuários", tiposPermitidos: ["clinica", "universal"] },
  { categoria: "Gestão (Clínica)", codigo: "clinica_profissionais", nome: "Profissionais", descricao: "Gestão de profissionais", tiposPermitidos: ["clinica", "universal"] },
  { categoria: "Gestão (Clínica)", codigo: "clinica_pacientes", nome: "Pacientes", descricao: "Gestão de pacientes", tiposPermitidos: ["clinica", "universal"] },
  { categoria: "Gestão (Clínica)", codigo: "clinica_equipe", nome: "Equipe", descricao: "Gestão da equipe", tiposPermitidos: ["clinica", "universal"] },
  { categoria: "Gestão (Clínica)", codigo: "clinica_perfis", nome: "Perfis e Permissões", descricao: "Configurar perfis de acesso", tiposPermitidos: ["clinica", "universal"] },
  { categoria: "Agendamento (Clínica)", codigo: "clinica_agendamentos", nome: "Agendamentos", descricao: "Gestão de consultas", tiposPermitidos: ["clinica", "universal"] },
  { categoria: "Agendamento (Clínica)", codigo: "clinica_disponibilidade", nome: "Disponibilidade", descricao: "Configurar horários", tiposPermitidos: ["clinica", "universal"] },
  { categoria: "Procedimentos (Clínica)", codigo: "clinica_procedimentos", nome: "Procedimentos", descricao: "Catálogo de procedimentos", tiposPermitidos: ["clinica", "universal"] },
  { categoria: "Financeiro (Clínica)", codigo: "clinica_financeiro", nome: "Financeiro", descricao: "Gestão financeira", tiposPermitidos: ["clinica", "universal"] },
  { categoria: "Financeiro (Clínica)", codigo: "clinica_faturamento", nome: "Faturamento", descricao: "Notas fiscais e faturamento", tiposPermitidos: ["clinica", "universal"] },
  { categoria: "Relatórios (Clínica)", codigo: "clinica_relatorios", nome: "Relatórios", descricao: "Relatórios da clínica", tiposPermitidos: ["clinica", "universal"] },
  { categoria: "Relatórios (Clínica)", codigo: "clinica_analytics", nome: "Analytics", descricao: "Métricas avançadas", tiposPermitidos: ["clinica", "universal"] },
  { categoria: "Vagas (Clínica)", codigo: "clinica_vagas", nome: "Vagas", descricao: "Gestão de vagas", tiposPermitidos: ["clinica", "universal"] },
  { categoria: "Atendimento (Clínica)", codigo: "clinica_atendimento", nome: "Atendimento Humano", descricao: "Central de atendimento", tiposPermitidos: ["clinica", "universal"] },
  { categoria: "Atendimento (Clínica)", codigo: "clinica_chat", nome: "Chat/Mensagens", descricao: "Comunicação", tiposPermitidos: ["clinica", "universal"] },
  { categoria: "Configurações (Clínica)", codigo: "clinica_configuracoes", nome: "Configurações", descricao: "Configurações da clínica", tiposPermitidos: ["clinica", "universal"] },
  { categoria: "Marketplace (Clínica)", codigo: "clinica_compras", nome: "Compras", descricao: "Comprar no marketplace", tiposPermitidos: ["clinica", "universal"] },

  // ========== PROFISSIONAL ==========
  { categoria: "Dashboard (Profissional)", codigo: "profissional_dashboard", nome: "Dashboard", descricao: "Visão geral do profissional", tiposPermitidos: ["profissional", "universal"] },
  { categoria: "Agenda (Profissional)", codigo: "profissional_agenda", nome: "Agenda", descricao: "Agenda do profissional", tiposPermitidos: ["profissional", "universal"] },
  { categoria: "Pacientes (Profissional)", codigo: "profissional_pacientes", nome: "Pacientes", descricao: "Gestão de pacientes", tiposPermitidos: ["profissional", "universal"] },
  { categoria: "Procedimentos (Profissional)", codigo: "profissional_procedimentos", nome: "Procedimentos", descricao: "Procedimentos realizados", tiposPermitidos: ["profissional", "universal"] },
  { categoria: "Prontuários (Profissional)", codigo: "profissional_prontuarios", nome: "Prontuários", descricao: "Gestão de prontuários", tiposPermitidos: ["profissional", "universal"] },
  { categoria: "Relatórios (Profissional)", codigo: "profissional_relatorios", nome: "Relatórios", descricao: "Relatórios do profissional", tiposPermitidos: ["profissional", "universal"] },
  { categoria: "Financeiro (Profissional)", codigo: "profissional_financeiro", nome: "Financeiro", descricao: "Dados financeiros", tiposPermitidos: ["profissional", "universal"] },
  { categoria: "Atendimento (Profissional)", codigo: "profissional_atendimento", nome: "Atendimento Humano", descricao: "Central de atendimento", tiposPermitidos: ["profissional", "universal"] },
  { categoria: "Notificações (Profissional)", codigo: "profissional_notificacoes", nome: "Notificações", descricao: "Central de notificações", tiposPermitidos: ["profissional", "universal"] },
  { categoria: "Vagas (Profissional)", codigo: "profissional_vagas", nome: "Buscar Vagas", descricao: "Encontrar oportunidades", tiposPermitidos: ["profissional", "universal"] },
  { categoria: "Configurações (Profissional)", codigo: "profissional_configuracoes", nome: "Configurações", descricao: "Configurações do profissional", tiposPermitidos: ["profissional", "universal"] },
  { categoria: "Perfil (Profissional)", codigo: "profissional_perfil", nome: "Perfil Profissional", descricao: "Dados do perfil", tiposPermitidos: ["profissional", "universal"] },

  // ========== FORNECEDOR ==========
  { categoria: "Dashboard (Fornecedor)", codigo: "fornecedor_dashboard", nome: "Dashboard", descricao: "Visão geral do fornecedor", tiposPermitidos: ["fornecedor", "universal"] },
  { categoria: "Produtos (Fornecedor)", codigo: "fornecedor_produtos", nome: "Catálogo de Produtos", descricao: "Gestão de produtos", tiposPermitidos: ["fornecedor", "universal"] },
  { categoria: "Pedidos (Fornecedor)", codigo: "fornecedor_pedidos", nome: "Pedidos", descricao: "Gestão de pedidos", tiposPermitidos: ["fornecedor", "universal"] },
  { categoria: "Logística (Fornecedor)", codigo: "fornecedor_logistica", nome: "Logística", descricao: "Gestão de entregas", tiposPermitidos: ["fornecedor", "universal"] },
  { categoria: "Financeiro (Fornecedor)", codigo: "fornecedor_financeiro", nome: "Financeiro", descricao: "Dados financeiros", tiposPermitidos: ["fornecedor", "universal"] },
  { categoria: "Relatórios (Fornecedor)", codigo: "fornecedor_relatorios", nome: "Relatórios", descricao: "Relatórios do fornecedor", tiposPermitidos: ["fornecedor", "universal"] },
  { categoria: "Atendimento (Fornecedor)", codigo: "fornecedor_atendimento", nome: "Atendimento Humano", descricao: "Central de atendimento", tiposPermitidos: ["fornecedor", "universal"] },
  { categoria: "Notificações (Fornecedor)", codigo: "fornecedor_notificacoes", nome: "Notificações", descricao: "Central de notificações", tiposPermitidos: ["fornecedor", "universal"] },
  { categoria: "Clientes (Fornecedor)", codigo: "fornecedor_clientes", nome: "Clientes", descricao: "Gestão de clientes", tiposPermitidos: ["fornecedor", "universal"] },
  { categoria: "Estoque (Fornecedor)", codigo: "fornecedor_estoque", nome: "Estoque", descricao: "Controle de estoque", tiposPermitidos: ["fornecedor", "universal"] },
  { categoria: "Configurações (Fornecedor)", codigo: "fornecedor_configuracoes", nome: "Configurações", descricao: "Configurações do fornecedor", tiposPermitidos: ["fornecedor", "universal"] },
  { categoria: "Perfil (Fornecedor)", codigo: "fornecedor_perfil", nome: "Perfil da Empresa", descricao: "Dados do perfil", tiposPermitidos: ["fornecedor", "universal"] },

  // ========== PACIENTE (gerenciado pela clínica) ==========
  { categoria: "Dashboard (Paciente)", codigo: "paciente_dashboard", nome: "Dashboard", descricao: "Visão geral do paciente", tiposPermitidos: ["clinica", "universal"] },
  { categoria: "Busca (Paciente)", codigo: "paciente_busca_inteligente", nome: "Busca Inteligente", descricao: "Buscar procedimentos", tiposPermitidos: ["clinica", "universal"] },
  { categoria: "Procedimentos (Paciente)", codigo: "paciente_procedimentos", nome: "Procedimentos", descricao: "Ver procedimentos", tiposPermitidos: ["clinica", "universal"] },
  { categoria: "Agendamentos (Paciente)", codigo: "paciente_agendamentos", nome: "Meus Agendamentos", descricao: "Agendamentos", tiposPermitidos: ["clinica", "universal"] },
  { categoria: "Avaliações (Paciente)", codigo: "paciente_avaliacoes", nome: "Minhas Avaliações", descricao: "Avaliações", tiposPermitidos: ["clinica", "universal"] },
  { categoria: "Fotos (Paciente)", codigo: "paciente_fotos", nome: "Galeria de Fotos", descricao: "Fotos antes/depois", tiposPermitidos: ["clinica", "universal"] },
  { categoria: "Favoritos (Paciente)", codigo: "paciente_favoritos", nome: "Favoritos", descricao: "Favoritos", tiposPermitidos: ["clinica", "universal"] },
  { categoria: "Pedidos (Paciente)", codigo: "paciente_pedidos", nome: "Meus Pedidos", descricao: "Pedidos do marketplace", tiposPermitidos: ["clinica", "universal"] },
  { categoria: "Financeiro (Paciente)", codigo: "paciente_financeiro", nome: "Financeiro", descricao: "Dados financeiros", tiposPermitidos: ["clinica", "universal"] },
  { categoria: "Atendimento (Paciente)", codigo: "paciente_atendimento", nome: "Atendimento Humano", descricao: "Central de atendimento", tiposPermitidos: ["clinica", "universal"] },
  { categoria: "Pagamentos (Paciente)", codigo: "paciente_pagamentos", nome: "Pagamentos", descricao: "Gestão de pagamentos", tiposPermitidos: ["clinica", "universal"] },
  { categoria: "Notificações (Paciente)", codigo: "paciente_notificacoes", nome: "Notificações", descricao: "Notificações", tiposPermitidos: ["clinica", "universal"] },
  { categoria: "Configurações (Paciente)", codigo: "paciente_configuracoes", nome: "Configurações", descricao: "Configurações", tiposPermitidos: ["clinica", "universal"] },
  { categoria: "Perfil (Paciente)", codigo: "paciente_perfil", nome: "Meu Perfil", descricao: "Dados do perfil", tiposPermitidos: ["clinica", "universal"] },

  // ========== MARKETPLACE (compartilhado) ==========
  { categoria: "Marketplace", codigo: "marketplace_produtos", nome: "Loja DoctorQ", descricao: "Ver produtos no marketplace", tiposPermitidos: ["clinica", "profissional", "fornecedor", "universal"] },
  { categoria: "Marketplace", codigo: "marketplace_carrinho", nome: "Carrinho", descricao: "Carrinho de compras", tiposPermitidos: ["clinica", "profissional", "universal"] },

  // ========== IA e Automação ==========
  { categoria: "IA/Automação", codigo: "clinica_ia_assistente", nome: "Assistente IA", descricao: "Assistente virtual", tiposPermitidos: ["clinica", "profissional", "universal"] },
  { categoria: "IA/Automação", codigo: "clinica_automacoes", nome: "Automações", descricao: "Fluxos automáticos", tiposPermitidos: ["clinica", "universal"] },
  { categoria: "IA/Automação", codigo: "clinica_integracoes", nome: "Integrações", descricao: "Conectar sistemas", tiposPermitidos: ["clinica", "fornecedor", "universal"] },
];

const TIPOS_PARCEIRO = [
  { value: "clinica" as PartnerType, label: "Clínica" },
  { value: "profissional" as PartnerType, label: "Profissional" },
  { value: "fornecedor" as PartnerType, label: "Fornecedor" },
  { value: "universal" as PartnerType, label: "Universal (Todos)" },
];

/**
 * Componente de Matriz de Visibilidade de Telas por Plano
 * Permite configurar quais telas são visíveis para cada plano de parceiro
 */
export function PlanoTelasMatriz() {
  const [tipoSelecionado, setTipoSelecionado] = useState<PartnerType>("clinica");
  const [planoSelecionado, setPlanoSelecionado] = useState<string>("");
  const [planos, setPlanos] = useState<PlanoService[]>([]);
  const [configuracoes, setConfiguracoes] = useState<Record<string, boolean>>({});
  const [mudancas, setMudancas] = useState<Set<string>>(new Set());
  const [loadingPlanos, setLoadingPlanos] = useState(true);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Ref para rastrear o último plano processado
  const ultimoPlanoProcessado = useRef<string | null>(null);

  // Carregar planos do backend
  useEffect(() => {
    const loadPlanos = async () => {
      setLoadingPlanos(true);
      try {
        const response = await fetch("/api/partner/services?includeInactive=false", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Erro ao carregar planos");
        }

        const data: PlanoService[] = await response.json();
        setPlanos(data);
      } catch (error) {
        toast.error("Erro ao carregar planos");
      } finally {
        setLoadingPlanos(false);
      }
    };

    loadPlanos();
  }, []);

  // Filtrar planos pelo tipo selecionado
  const planosFiltrados = useMemo(() => {
    return planos.filter(
      (p) => p.partner_type === tipoSelecionado || p.partner_type === "universal"
    );
  }, [planos, tipoSelecionado]);

  // Carregar configurações do plano selecionado
  useEffect(() => {
    if (!planoSelecionado) {
      setConfiguracoes({});
      return;
    }

    const loadConfig = async () => {
      // Evitar processamento duplicado
      if (ultimoPlanoProcessado.current === planoSelecionado) return;

      setLoadingConfig(true);
      try {
        const response = await fetch(`/api/partner/services/${planoSelecionado}/telas/`, {
          cache: "no-store",
        });

        if (!response.ok) {
          // Se não encontrou, inicializa com todas visíveis
          const configMap: Record<string, boolean> = {};
          TELAS_SISTEMA.forEach((tela) => {
            if (
              !tela.tiposPermitidos ||
              tela.tiposPermitidos.includes(tipoSelecionado) ||
              tela.tiposPermitidos.includes("universal")
            ) {
              configMap[tela.codigo] = true;
            }
          });
          setConfiguracoes(configMap);
          ultimoPlanoProcessado.current = planoSelecionado;
          return;
        }

        const data: PlanoTelaConfig[] = await response.json();
        const configMap: Record<string, boolean> = {};

        // Mapear configurações existentes
        data.forEach((config) => {
          configMap[config.cd_tela] = config.fg_visivel;
        });

        // Preencher com padrão true para telas sem configuração
        TELAS_SISTEMA.forEach((tela) => {
          if (
            !(tela.codigo in configMap) &&
            (!tela.tiposPermitidos ||
              tela.tiposPermitidos.includes(tipoSelecionado) ||
              tela.tiposPermitidos.includes("universal"))
          ) {
            configMap[tela.codigo] = true;
          }
        });

        setConfiguracoes(configMap);
        ultimoPlanoProcessado.current = planoSelecionado;
      } catch (error) {
        toast.error("Erro ao carregar configurações do plano");
      } finally {
        setLoadingConfig(false);
        setMudancas(new Set());
      }
    };

    loadConfig();
  }, [planoSelecionado, tipoSelecionado]);

  // Agrupar telas por categoria (filtrado por tipo de parceiro)
  const telasPorCategoria = useMemo(() => {
    const grupos: Record<string, TelaSistema[]> = {};

    const telasFiltradas = TELAS_SISTEMA.filter((tela) => {
      if (!tela.tiposPermitidos || tela.tiposPermitidos.length === 0) {
        return true;
      }
      return (
        tela.tiposPermitidos.includes(tipoSelecionado) ||
        tela.tiposPermitidos.includes("universal")
      );
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
    if (!planoSelecionado) {
      toast.error("Selecione um plano primeiro");
      return;
    }

    if (mudancas.size === 0) {
      toast.info("Nenhuma alteração para salvar");
      return;
    }

    setIsSaving(true);
    try {
      // Preparar dados para enviar
      const telasConfig = Object.entries(configuracoes).map(([cd_tela, fg_visivel]) => ({
        cd_tela,
        fg_visivel,
      }));

      const response = await fetch(`/api/partner/services/${planoSelecionado}/telas/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telas: telasConfig }),
      });

      if (!response.ok) {
        throw new Error("Erro ao salvar configurações");
      }

      toast.success(`${mudancas.size} configuração(ões) salva(s) com sucesso`);
      setMudancas(new Set());
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar configurações");
    } finally {
      setIsSaving(false);
    }
  };

  // Descartar mudanças
  const handleDescartar = () => {
    ultimoPlanoProcessado.current = null;
    // Força recarregamento
    const temp = planoSelecionado;
    setPlanoSelecionado("");
    setTimeout(() => setPlanoSelecionado(temp), 100);
    setMudancas(new Set());
    toast.info("Alterações descartadas");
  };

  // Marcar todas como visíveis
  const handleMarcarTodas = () => {
    const novasConfigs = { ...configuracoes };
    const novasMudancas = new Set(mudancas);

    Object.keys(telasPorCategoria).forEach((categoria) => {
      telasPorCategoria[categoria].forEach((tela) => {
        if (!novasConfigs[tela.codigo]) {
          novasMudancas.add(tela.codigo);
        }
        novasConfigs[tela.codigo] = true;
      });
    });

    setConfiguracoes(novasConfigs);
    setMudancas(novasMudancas);
  };

  // Desmarcar todas
  const handleDesmarcarTodas = () => {
    const novasConfigs = { ...configuracoes };
    const novasMudancas = new Set(mudancas);

    Object.keys(telasPorCategoria).forEach((categoria) => {
      telasPorCategoria[categoria].forEach((tela) => {
        if (novasConfigs[tela.codigo]) {
          novasMudancas.add(tela.codigo);
        }
        novasConfigs[tela.codigo] = false;
      });
    });

    setConfiguracoes(novasConfigs);
    setMudancas(novasMudancas);
  };

  // Reset plano ao mudar tipo
  useEffect(() => {
    setPlanoSelecionado("");
    setConfiguracoes({});
    setMudancas(new Set());
    ultimoPlanoProcessado.current = null;
  }, [tipoSelecionado]);

  const temMudancas = mudancas.size > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Monitor className="h-5 w-5 text-blue-600" />
          <h2 className="text-xl font-semibold">Configuração de Telas por Plano</h2>
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
        Configure quais telas/módulos estarão disponíveis para cada plano de parceiro.
        Os clientes que assinarem o plano terão acesso apenas às telas marcadas como visíveis.
      </p>

      {/* Seletores */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Tipo de Parceiro:</label>
          <Select value={tipoSelecionado} onValueChange={(v) => setTipoSelecionado(v as PartnerType)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIPOS_PARCEIRO.map((tipo) => (
                <SelectItem key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Plano:</label>
          <Select
            key={`plano-select-${tipoSelecionado}-${planosFiltrados.length}`}
            value={planoSelecionado}
            onValueChange={setPlanoSelecionado}
            disabled={loadingPlanos}
          >
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder={loadingPlanos ? "Carregando..." : "Selecione um plano"} />
            </SelectTrigger>
            <SelectContent>
              {loadingPlanos ? (
                <SelectItem value="_loading" disabled>
                  Carregando planos...
                </SelectItem>
              ) : planosFiltrados.length === 0 ? (
                <SelectItem value="_none" disabled>
                  Nenhum plano encontrado para este tipo
                </SelectItem>
              ) : (
                planosFiltrados.map((plano) => (
                  <SelectItem key={plano.id_service} value={plano.id_service}>
                    {plano.service_name} ({plano.service_code})
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {!loadingPlanos && (
            <span className="text-xs text-muted-foreground">
              {planosFiltrados.length} plano(s)
            </span>
          )}
        </div>

        {planoSelecionado && (
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" size="sm" onClick={handleMarcarTodas}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Marcar Todas
            </Button>
            <Button variant="outline" size="sm" onClick={handleDesmarcarTodas}>
              Desmarcar Todas
            </Button>
          </div>
        )}
      </div>

      {/* Mensagem quando nenhum plano selecionado */}
      {!planoSelecionado && (
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-muted/20">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Selecione um Plano</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Escolha um tipo de parceiro e depois um plano para configurar quais telas estarão disponíveis para os clientes.
          </p>
        </div>
      )}

      {/* Tabela de Telas */}
      {planoSelecionado && (
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
                {Object.entries(telasPorCategoria).map(([categoria, telas]) =>
                  telas.map((tela, idx) => (
                    <TableRow
                      key={tela.codigo}
                      className={mudancas.has(tela.codigo) ? "bg-yellow-50/50" : ""}
                    >
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
                      <TableCell className="text-sm text-muted-foreground">
                        {tela.descricao}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
      )}
    </div>
  );
}
