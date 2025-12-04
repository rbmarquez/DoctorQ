// Tipos para o Prontuário Eletrônico do Paciente (PEP)

export interface Anamnese {
  id_anamnese: string;
  id_paciente: string;
  id_profissional: string;
  dt_criacao: string;

  // Dados Pessoais
  nm_completo: string;
  dt_nascimento: string;
  nr_cpf: string;
  nm_genero: string;
  nm_estado_civil: string;
  nm_profissao: string;
  nr_telefone: string;
  nm_email: string;

  // Endereço
  ds_endereco: string;
  nm_cidade: string;
  nm_estado: string;
  nr_cep: string;

  // Histórico Médico
  ds_queixa_principal: string;
  ds_historico_doenca_atual: string;
  ds_alergias?: string;
  ds_medicamentos_uso: string[];
  bo_cirurgias_previas: boolean;
  ds_cirurgias?: string;
  bo_doencas_cronicas: boolean;
  ds_doencas_cronicas?: string;

  // Histórico Estético
  ds_tratamentos_esteticos_anteriores?: string;
  ds_produtos_uso_topico?: string;
  ds_habitos_cuidado_pele?: string;

  // Estilo de Vida
  bo_tabagista: boolean;
  nr_cigarros_dia?: number;
  bo_etilista: boolean;
  ds_frequencia_alcool?: string;
  bo_atividade_fisica: boolean;
  ds_frequencia_atividade?: string;
  nr_horas_sono: number;
  ds_alimentacao: string;

  // Histórico Familiar
  ds_historico_familiar?: string;

  // Expectativas
  ds_expectativas_tratamento: string;
  ds_objetivos: string;

  // Assinatura e Consentimento
  bo_consentimento_tratamento: boolean;
  bo_consentimento_imagens: boolean;
  ds_assinatura_digital?: string;
  dt_assinatura?: string;
}

export interface EvolucaoClinica {
  id_evolucao: string;
  id_prontuario: string;
  id_paciente: string;
  id_profissional: string;
  id_agendamento?: string;
  dt_evolucao: string;
  hr_evolucao: string;

  // Consulta
  ds_motivo_consulta: string;
  ds_procedimento_realizado: string;
  ds_evolucao_clinica: string;
  ds_observacoes?: string;

  // Avaliação Física
  ds_avaliacao_fisica?: string;
  ds_pele_tipo?: string;
  ds_pele_condicao?: string;

  // Área Tratada
  ds_area_tratada: string;
  ds_tecnica_utilizada?: string;
  ds_produtos_utilizados?: string[];
  nr_quantidade_aplicada?: number;
  ds_unidade_medida?: string;

  // Parâmetros
  ds_parametros_equipamento?: string;

  // Reações e Intercorrências
  bo_reacoes_adversas: boolean;
  ds_reacoes?: string;

  // Orientações
  ds_orientacoes_pos_procedimento: string;
  ds_cuidados_especiais?: string;
  ds_medicamentos_prescritos?: string[];

  // Retorno
  dt_retorno_previsto?: string;
  nr_sessoes_previstas?: number;
  nr_sessao_atual?: number;

  // Anexos
  ds_fotos_antes?: string[];
  ds_fotos_depois?: string[];
  ds_documentos_anexos?: string[];

  // Assinatura
  ds_assinatura_profissional: string;
  nm_crm_cro?: string;
}

export interface Prontuario {
  id_prontuario: string;
  id_paciente: string;
  id_profissional_responsavel: string;
  dt_criacao: string;
  dt_ultima_atualizacao: string;

  // Status
  st_ativo: boolean;

  // Dados do Paciente
  paciente: {
    id_paciente: string;
    nm_completo: string;
    dt_nascimento: string;
    nr_cpf: string;
    ds_foto_url?: string;
    nm_email: string;
    nr_telefone: string;
  };

  // Anamnese Inicial
  anamnese?: Anamnese;

  // Evoluções Clínicas
  evolucoes: EvolucaoClinica[];

  // Documentos e Anexos
  documentos: Documento[];

  // Consentimentos
  consentimentos: Consentimento[];

  // Estatísticas
  nr_total_consultas: number;
  nr_total_procedimentos: number;
  dt_primeira_consulta: string;
  dt_ultima_consulta?: string;
}

export interface Documento {
  id_documento: string;
  id_prontuario: string;
  nm_documento: string;
  ds_tipo_documento: string;
  ds_url: string;
  dt_upload: string;
  id_profissional_upload: string;
  nr_tamanho_bytes: number;
  ds_mime_type: string;
}

export interface Consentimento {
  id_consentimento: string;
  id_prontuario: string;
  id_paciente: string;
  id_profissional: string;
  ds_tipo_consentimento: string;
  ds_conteudo: string;
  bo_aceito: boolean;
  dt_consentimento: string;
  ds_assinatura_digital: string;
  ds_ip_origem: string;
}

export interface FotoComparacao {
  id_foto: string;
  id_evolucao: string;
  ds_tipo: "antes" | "depois";
  ds_url: string;
  dt_foto: string;
  ds_descricao?: string;
  ds_angulo?: string;
  ds_iluminacao?: string;
}

export interface HistoricoAlteracao {
  id_historico: string;
  id_prontuario: string;
  id_profissional: string;
  dt_alteracao: string;
  ds_acao: string;
  ds_campo_alterado?: string;
  ds_valor_anterior?: string;
  ds_valor_novo?: string;
}
