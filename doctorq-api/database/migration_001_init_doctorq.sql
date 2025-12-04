-- =============================================
-- DoctorQ Database Schema - Initial Migration
-- =============================================
-- Descrição: Schema inicial da plataforma DoctorQ
-- Data: 2025-10-23
-- Versão: 1.0
-- =============================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- pgvector é opcional - usado apenas para RAG/busca semântica
-- Se não estiver instalado, as funcionalidades de embedding não estarão disponíveis
-- Para instalar: https://github.com/pgvector/pgvector
-- CREATE EXTENSION IF NOT EXISTS "pgvector";

-- =============================================
-- TABELAS BASE (Herdadas do InovaIA)
-- =============================================

-- Tabela de Empresas (Multi-tenant)
CREATE TABLE IF NOT EXISTS tb_empresas (
    id_empresa UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nm_empresa VARCHAR(255) NOT NULL,
    nr_cnpj VARCHAR(18) UNIQUE NOT NULL,
    ds_email VARCHAR(255),
    nr_telefone VARCHAR(20),
    ds_endereco TEXT,
    nr_cep VARCHAR(10),
    nm_cidade VARCHAR(100),
    nm_estado VARCHAR(2),
    st_ativo BOOLEAN DEFAULT true,
    dt_criacao TIMESTAMP DEFAULT NOW(),
    dt_atualizacao TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_empresas_cnpj ON tb_empresas(nr_cnpj);
CREATE INDEX idx_empresas_ativo ON tb_empresas(st_ativo);

-- Tabela de Perfis (Roles)
CREATE TABLE IF NOT EXISTS tb_perfis (
    id_perfil UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nm_perfil VARCHAR(100) NOT NULL UNIQUE,
    ds_perfil TEXT,
    ds_permissoes JSONB DEFAULT '{}',
    dt_criacao TIMESTAMP DEFAULT NOW()
);

-- Inserir perfis padrão
INSERT INTO tb_perfis (nm_perfil, ds_perfil, ds_permissoes) VALUES
('admin', 'Administrador do Sistema', '{"full_access": true}'),
('gestor_clinica', 'Gestor de Clínica', '{"manage_clinic": true, "view_reports": true}'),
('profissional', 'Profissional de Estética', '{"manage_appointments": true, "view_patients": true}'),
('recepcionista', 'Recepcionista', '{"manage_appointments": true}'),
('paciente', 'Paciente/Cliente', '{"view_own_data": true, "book_appointments": true}')
ON CONFLICT (nm_perfil) DO NOTHING;

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS tb_users (
    id_user UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_empresa UUID REFERENCES tb_empresas(id_empresa) ON DELETE CASCADE,
    id_perfil UUID REFERENCES tb_perfis(id_perfil),
    nm_email VARCHAR(255) UNIQUE NOT NULL,
    nm_completo VARCHAR(255) NOT NULL,
    ds_senha_hash VARCHAR(255),
    nm_papel VARCHAR(50) DEFAULT 'user',
    nr_telefone VARCHAR(20),
    ds_foto_url TEXT,
    st_ativo BOOLEAN DEFAULT true,

    -- OAuth fields
    nm_provider VARCHAR(50), -- 'google', 'microsoft', 'credentials'
    ds_provider_id VARCHAR(255),

    -- Metadata
    nr_total_logins INTEGER DEFAULT 0,
    dt_ultimo_login TIMESTAMP,
    dt_criacao TIMESTAMP DEFAULT NOW(),
    dt_atualizacao TIMESTAMP DEFAULT NOW(),

    CONSTRAINT unique_provider_id UNIQUE(nm_provider, ds_provider_id)
);

CREATE INDEX idx_users_email ON tb_users(nm_email);
CREATE INDEX idx_users_empresa ON tb_users(id_empresa);
CREATE INDEX idx_users_perfil ON tb_users(id_perfil);
CREATE INDEX idx_users_provider ON tb_users(nm_provider, ds_provider_id);

-- Tabela de API Keys
CREATE TABLE IF NOT EXISTS tb_api_keys (
    id_api_key UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_user UUID REFERENCES tb_users(id_user) ON DELETE CASCADE,
    id_empresa UUID REFERENCES tb_empresas(id_empresa) ON DELETE CASCADE,
    nm_api_key VARCHAR(255) UNIQUE NOT NULL,
    nm_descricao TEXT,
    st_ativo BOOLEAN DEFAULT true,
    dt_expiracao TIMESTAMP,
    dt_criacao TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_api_keys_key ON tb_api_keys(nm_api_key);
CREATE INDEX idx_api_keys_user ON tb_api_keys(id_user);

-- =============================================
-- TABELAS ESPECÍFICAS DO DOMÍNIO DE ESTÉTICA
-- =============================================

-- Tabela de Clínicas
CREATE TABLE IF NOT EXISTS tb_clinicas (
    id_clinica UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_empresa UUID REFERENCES tb_empresas(id_empresa) ON DELETE CASCADE,
    nm_clinica VARCHAR(255) NOT NULL,
    ds_clinica TEXT,
    nr_cnpj VARCHAR(18),
    ds_email VARCHAR(255),
    nr_telefone VARCHAR(20),
    nr_whatsapp VARCHAR(20),

    -- Endereço
    ds_endereco VARCHAR(255),
    nr_numero VARCHAR(20),
    ds_complemento VARCHAR(100),
    nm_bairro VARCHAR(100),
    nm_cidade VARCHAR(100),
    nm_estado VARCHAR(2),
    nr_cep VARCHAR(10),
    ds_latitude DECIMAL(10, 8),
    ds_longitude DECIMAL(11, 8),

    -- Informações operacionais
    nm_responsavel VARCHAR(255),
    nr_cnes VARCHAR(20), -- Cadastro Nacional de Estabelecimentos de Saúde
    ds_especialidades TEXT[], -- Array de especialidades oferecidas
    ds_foto_principal TEXT,
    ds_fotos_galeria TEXT[], -- Array de URLs de fotos

    -- Configurações
    ds_horario_funcionamento JSONB, -- JSON com horários por dia da semana
    nr_tempo_medio_consulta INTEGER DEFAULT 60, -- em minutos
    st_aceita_convenio BOOLEAN DEFAULT false,
    ds_convenios TEXT[], -- Array de convênios aceitos

    -- Status e avaliações
    st_ativo BOOLEAN DEFAULT true,
    st_verificada BOOLEAN DEFAULT false,
    nr_avaliacao_media DECIMAL(3, 2) DEFAULT 0.0,
    nr_total_avaliacoes INTEGER DEFAULT 0,

    -- Metadata
    dt_criacao TIMESTAMP DEFAULT NOW(),
    dt_atualizacao TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_clinicas_empresa ON tb_clinicas(id_empresa);
CREATE INDEX idx_clinicas_cidade ON tb_clinicas(nm_cidade);
CREATE INDEX idx_clinicas_ativo ON tb_clinicas(st_ativo);
CREATE INDEX idx_clinicas_avaliacao ON tb_clinicas(nr_avaliacao_media);

-- Tabela de Profissionais
CREATE TABLE IF NOT EXISTS tb_profissionais (
    id_profissional UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_user UUID REFERENCES tb_users(id_user) ON DELETE CASCADE,
    id_clinica UUID REFERENCES tb_clinicas(id_clinica) ON DELETE CASCADE,

    -- Informações profissionais
    nm_profissional VARCHAR(255) NOT NULL,
    ds_biografia TEXT,
    ds_especialidades TEXT[] NOT NULL, -- Array: 'esteticista', 'dermatologista', 'fisioterapeuta', etc.
    nr_registro_profissional VARCHAR(50), -- CRF, CRM, etc.
    ds_formacao TEXT,
    nr_anos_experiencia INTEGER,

    -- Contato
    ds_email VARCHAR(255),
    nr_telefone VARCHAR(20),
    nr_whatsapp VARCHAR(20),
    ds_foto TEXT,

    -- Configurações de agenda
    ds_horarios_atendimento JSONB, -- JSON com disponibilidade por dia
    nr_tempo_consulta INTEGER DEFAULT 60, -- tempo padrão em minutos
    st_aceita_online BOOLEAN DEFAULT true, -- aceita agendamento online
    ds_procedimentos_realizados TEXT[], -- Array de IDs ou nomes de procedimentos

    -- Status e avaliações
    st_ativo BOOLEAN DEFAULT true,
    st_verificado BOOLEAN DEFAULT false,
    nr_avaliacao_media DECIMAL(3, 2) DEFAULT 0.0,
    nr_total_avaliacoes INTEGER DEFAULT 0,
    nr_total_atendimentos INTEGER DEFAULT 0,

    -- Metadata
    dt_criacao TIMESTAMP DEFAULT NOW(),
    dt_atualizacao TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_profissionais_user ON tb_profissionais(id_user);
CREATE INDEX idx_profissionais_clinica ON tb_profissionais(id_clinica);
CREATE INDEX idx_profissionais_ativo ON tb_profissionais(st_ativo);
CREATE INDEX idx_profissionais_especialidades ON tb_profissionais USING GIN(ds_especialidades);

-- Tabela de Pacientes
CREATE TABLE IF NOT EXISTS tb_pacientes (
    id_paciente UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_user UUID REFERENCES tb_users(id_user) ON DELETE CASCADE,
    id_clinica UUID REFERENCES tb_clinicas(id_clinica) ON DELETE CASCADE,

    -- Informações pessoais
    nm_paciente VARCHAR(255) NOT NULL,
    dt_nascimento DATE,
    nr_cpf VARCHAR(14) UNIQUE,
    nr_rg VARCHAR(20),
    nm_genero VARCHAR(20), -- 'masculino', 'feminino', 'outro', 'prefiro_nao_dizer'

    -- Contato
    ds_email VARCHAR(255),
    nr_telefone VARCHAR(20),
    nr_whatsapp VARCHAR(20),

    -- Endereço
    ds_endereco VARCHAR(255),
    nr_numero VARCHAR(20),
    ds_complemento VARCHAR(100),
    nm_bairro VARCHAR(100),
    nm_cidade VARCHAR(100),
    nm_estado VARCHAR(2),
    nr_cep VARCHAR(10),

    -- Informações médicas
    ds_tipo_sanguineo VARCHAR(5),
    ds_alergias TEXT,
    ds_medicamentos_uso TEXT,
    ds_condicoes_medicas TEXT,
    ds_cirurgias_previas TEXT,
    ds_observacoes TEXT,

    -- Convênio
    st_possui_convenio BOOLEAN DEFAULT false,
    nm_convenio VARCHAR(100),
    nr_carteirinha VARCHAR(50),

    -- Foto
    ds_foto TEXT,

    -- Status
    st_ativo BOOLEAN DEFAULT true,

    -- Metadata
    dt_primeira_consulta TIMESTAMP,
    dt_ultima_consulta TIMESTAMP,
    nr_total_consultas INTEGER DEFAULT 0,
    dt_criacao TIMESTAMP DEFAULT NOW(),
    dt_atualizacao TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pacientes_user ON tb_pacientes(id_user);
CREATE INDEX idx_pacientes_clinica ON tb_pacientes(id_clinica);
CREATE INDEX idx_pacientes_cpf ON tb_pacientes(nr_cpf);
CREATE INDEX idx_pacientes_nome ON tb_pacientes(nm_paciente);

-- Tabela de Procedimentos
CREATE TABLE IF NOT EXISTS tb_procedimentos (
    id_procedimento UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_clinica UUID REFERENCES tb_clinicas(id_clinica) ON DELETE CASCADE,

    -- Informações básicas
    nm_procedimento VARCHAR(255) NOT NULL,
    ds_procedimento TEXT,
    ds_categoria VARCHAR(100), -- 'facial', 'corporal', 'capilar', 'depilacao', etc.
    ds_subcategoria VARCHAR(100),

    -- Preço e duração
    vl_preco DECIMAL(10, 2),
    vl_preco_promocional DECIMAL(10, 2),
    nr_duracao_minutos INTEGER NOT NULL, -- duração estimada
    nr_sessoes_recomendadas INTEGER DEFAULT 1,

    -- Descrições detalhadas
    ds_indicacoes TEXT, -- para quem é indicado
    ds_contraindicacoes TEXT, -- contraindicações
    ds_preparacao TEXT, -- preparação necessária
    ds_cuidados_pos TEXT, -- cuidados após o procedimento
    ds_resultados_esperados TEXT,

    -- Media
    ds_foto_principal TEXT,
    ds_fotos TEXT[], -- Array de URLs de fotos antes/depois
    ds_video TEXT, -- URL de vídeo explicativo

    -- Configurações
    st_requer_avaliacao BOOLEAN DEFAULT false, -- requer avaliação prévia
    st_disponivel_online BOOLEAN DEFAULT true, -- disponível para agendamento online
    nr_idade_minima INTEGER,

    -- Status
    st_ativo BOOLEAN DEFAULT true,
    nr_ordem_exibicao INTEGER DEFAULT 0,

    -- Metadata
    dt_criacao TIMESTAMP DEFAULT NOW(),
    dt_atualizacao TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_procedimentos_clinica ON tb_procedimentos(id_clinica);
CREATE INDEX idx_procedimentos_categoria ON tb_procedimentos(ds_categoria);
CREATE INDEX idx_procedimentos_ativo ON tb_procedimentos(st_ativo);

-- Tabela de Agendamentos
CREATE TABLE IF NOT EXISTS tb_agendamentos (
    id_agendamento UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_paciente UUID REFERENCES tb_pacientes(id_paciente) ON DELETE CASCADE,
    id_profissional UUID REFERENCES tb_profissionais(id_profissional) ON DELETE CASCADE,
    id_clinica UUID REFERENCES tb_clinicas(id_clinica) ON DELETE CASCADE,
    id_procedimento UUID REFERENCES tb_procedimentos(id_procedimento) ON DELETE SET NULL,

    -- Informações do agendamento
    dt_agendamento TIMESTAMP NOT NULL,
    nr_duracao_minutos INTEGER NOT NULL,
    ds_status VARCHAR(50) DEFAULT 'agendado', -- 'agendado', 'confirmado', 'em_atendimento', 'concluido', 'cancelado', 'faltou'
    ds_motivo VARCHAR(255), -- motivo da consulta
    ds_observacoes TEXT,

    -- Confirmação
    st_confirmado BOOLEAN DEFAULT false,
    dt_confirmacao TIMESTAMP,
    nm_confirmado_por VARCHAR(255), -- quem confirmou (sistema, paciente, clinica)

    -- Lembrete
    st_lembrete_enviado BOOLEAN DEFAULT false,
    dt_lembrete_enviado TIMESTAMP,

    -- Cancelamento
    ds_motivo_cancelamento TEXT,
    dt_cancelamento TIMESTAMP,
    nm_cancelado_por VARCHAR(255),

    -- Financeiro
    vl_valor DECIMAL(10, 2),
    ds_forma_pagamento VARCHAR(50), -- 'dinheiro', 'cartao_credito', 'cartao_debito', 'pix', 'convenio'
    st_pago BOOLEAN DEFAULT false,
    dt_pagamento TIMESTAMP,

    -- Avaliação
    st_avaliado BOOLEAN DEFAULT false,

    -- Metadata
    dt_criacao TIMESTAMP DEFAULT NOW(),
    dt_atualizacao TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_agendamentos_paciente ON tb_agendamentos(id_paciente);
CREATE INDEX idx_agendamentos_profissional ON tb_agendamentos(id_profissional);
CREATE INDEX idx_agendamentos_clinica ON tb_agendamentos(id_clinica);
CREATE INDEX idx_agendamentos_data ON tb_agendamentos(dt_agendamento);
CREATE INDEX idx_agendamentos_status ON tb_agendamentos(ds_status);

-- Tabela de Prontuários
CREATE TABLE IF NOT EXISTS tb_prontuarios (
    id_prontuario UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_paciente UUID REFERENCES tb_pacientes(id_paciente) ON DELETE CASCADE,
    id_profissional UUID REFERENCES tb_profissionais(id_profissional) ON DELETE CASCADE,
    id_agendamento UUID REFERENCES tb_agendamentos(id_agendamento) ON DELETE CASCADE,
    id_clinica UUID REFERENCES tb_clinicas(id_clinica) ON DELETE CASCADE,

    -- Informações da consulta
    dt_consulta TIMESTAMP NOT NULL,
    ds_tipo VARCHAR(50), -- 'primeira_consulta', 'retorno', 'procedimento', 'avaliacao'

    -- Anamnese
    ds_queixa_principal TEXT,
    ds_historico_doenca_atual TEXT,
    ds_antecedentes_pessoais TEXT,
    ds_antecedentes_familiares TEXT,
    ds_habitos_vida TEXT,

    -- Exame físico
    ds_pressao_arterial VARCHAR(20),
    ds_peso DECIMAL(5, 2),
    ds_altura DECIMAL(5, 2),
    ds_imc DECIMAL(5, 2),
    ds_exame_fisico TEXT,
    ds_avaliacao_estetica TEXT,

    -- Diagnóstico e conduta
    ds_diagnostico TEXT,
    ds_procedimentos_realizados TEXT,
    ds_produtos_utilizados TEXT,
    ds_prescricoes TEXT,
    ds_orientacoes TEXT,
    ds_plano_tratamento TEXT,

    -- Evolução
    ds_evolucao TEXT,
    ds_intercorrencias TEXT,

    -- Fotos e anexos
    ds_fotos_antes TEXT[], -- URLs das fotos antes do procedimento
    ds_fotos_depois TEXT[], -- URLs das fotos depois do procedimento
    ds_arquivos_anexos TEXT[], -- URLs de outros documentos

    -- Próxima consulta
    dt_retorno_sugerido DATE,

    -- Assinatura digital
    ds_assinatura_profissional TEXT,
    dt_assinatura TIMESTAMP,

    -- Metadata
    dt_criacao TIMESTAMP DEFAULT NOW(),
    dt_atualizacao TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_prontuarios_paciente ON tb_prontuarios(id_paciente);
CREATE INDEX idx_prontuarios_profissional ON tb_prontuarios(id_profissional);
CREATE INDEX idx_prontuarios_agendamento ON tb_prontuarios(id_agendamento);
CREATE INDEX idx_prontuarios_data ON tb_prontuarios(dt_consulta);

-- Tabela de Avaliações
CREATE TABLE IF NOT EXISTS tb_avaliacoes (
    id_avaliacao UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_paciente UUID REFERENCES tb_pacientes(id_paciente) ON DELETE CASCADE,
    id_profissional UUID REFERENCES tb_profissionais(id_profissional) ON DELETE CASCADE,
    id_clinica UUID REFERENCES tb_clinicas(id_clinica) ON DELETE CASCADE,
    id_agendamento UUID REFERENCES tb_agendamentos(id_agendamento) ON DELETE CASCADE,

    -- Avaliação
    nr_nota INTEGER CHECK (nr_nota >= 1 AND nr_nota <= 5), -- 1 a 5 estrelas
    ds_comentario TEXT,

    -- Detalhamento (opcional)
    nr_atendimento INTEGER CHECK (nr_atendimento >= 1 AND nr_atendimento <= 5),
    nr_instalacoes INTEGER CHECK (nr_instalacoes >= 1 AND nr_instalacoes <= 5),
    nr_pontualidade INTEGER CHECK (nr_pontualidade >= 1 AND nr_pontualidade <= 5),
    nr_resultado INTEGER CHECK (nr_resultado >= 1 AND nr_resultado <= 5),

    -- Recomendação
    st_recomenda BOOLEAN,

    -- Resposta da clínica
    ds_resposta TEXT,
    dt_resposta TIMESTAMP,

    -- Status
    st_aprovada BOOLEAN DEFAULT false, -- moderação
    st_visivel BOOLEAN DEFAULT true,

    -- Metadata
    dt_criacao TIMESTAMP DEFAULT NOW(),
    dt_atualizacao TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_avaliacoes_paciente ON tb_avaliacoes(id_paciente);
CREATE INDEX idx_avaliacoes_profissional ON tb_avaliacoes(id_profissional);
CREATE INDEX idx_avaliacoes_clinica ON tb_avaliacoes(id_clinica);
CREATE INDEX idx_avaliacoes_aprovada ON tb_avaliacoes(st_aprovada);

-- =============================================
-- TABELAS DE AGENTES DE IA (Herdadas do InovaIA)
-- =============================================

-- Tabela de Agentes
CREATE TABLE IF NOT EXISTS tb_agentes (
    id_agente UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_empresa UUID REFERENCES tb_empresas(id_empresa) ON DELETE CASCADE,
    nm_agente VARCHAR(255) NOT NULL,
    ds_agente TEXT,
    ds_tipo VARCHAR(50) DEFAULT 'assistant', -- 'chatbot', 'assistant', 'analyzer', etc.

    -- Configuração LLM
    nm_modelo VARCHAR(100) DEFAULT 'gpt-4',
    nm_provider VARCHAR(50) DEFAULT 'openai', -- 'openai', 'azure', 'anthropic', 'ollama'
    nr_temperature DECIMAL(3, 2) DEFAULT 0.7,
    nr_max_tokens INTEGER DEFAULT 2000,

    -- Prompts
    ds_system_prompt TEXT,
    ds_prompt_template TEXT,

    -- Configurações
    ds_config JSONB DEFAULT '{}',
    ds_tools TEXT[], -- Array de tools disponíveis

    -- Status
    st_ativo BOOLEAN DEFAULT true,

    -- Metadata
    dt_criacao TIMESTAMP DEFAULT NOW(),
    dt_atualizacao TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_agentes_empresa ON tb_agentes(id_empresa);
CREATE INDEX idx_agentes_tipo ON tb_agentes(ds_tipo);

-- Tabela de Conversas
CREATE TABLE IF NOT EXISTS tb_conversas (
    id_conversa UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_agente UUID REFERENCES tb_agentes(id_agente) ON DELETE CASCADE,
    id_user UUID REFERENCES tb_users(id_user) ON DELETE CASCADE,
    id_paciente UUID REFERENCES tb_pacientes(id_paciente) ON DELETE SET NULL,

    -- Informações da conversa
    nm_titulo VARCHAR(255),
    ds_contexto TEXT,
    ds_metadata JSONB DEFAULT '{}',

    -- Status
    st_ativa BOOLEAN DEFAULT true,

    -- Metadata
    dt_ultima_mensagem TIMESTAMP,
    nr_total_mensagens INTEGER DEFAULT 0,
    dt_criacao TIMESTAMP DEFAULT NOW(),
    dt_atualizacao TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_conversas_agente ON tb_conversas(id_agente);
CREATE INDEX idx_conversas_user ON tb_conversas(id_user);
CREATE INDEX idx_conversas_paciente ON tb_conversas(id_paciente);

-- Tabela de Mensagens
CREATE TABLE IF NOT EXISTS tb_messages (
    id_message UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_conversa UUID REFERENCES tb_conversas(id_conversa) ON DELETE CASCADE,
    id_user UUID REFERENCES tb_users(id_user) ON DELETE CASCADE,

    -- Conteúdo
    ds_role VARCHAR(50) NOT NULL, -- 'user', 'assistant', 'system', 'tool'
    ds_content TEXT NOT NULL,
    ds_metadata JSONB DEFAULT '{}',

    -- Tokens e custo
    nr_tokens_prompt INTEGER,
    nr_tokens_completion INTEGER,
    vl_custo DECIMAL(10, 6),

    -- Metadata
    dt_criacao TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_messages_conversa ON tb_messages(id_conversa);
CREATE INDEX idx_messages_user ON tb_messages(id_user);
CREATE INDEX idx_messages_data ON tb_messages(dt_criacao);

-- =============================================
-- TRIGGERS E FUNCTIONS
-- =============================================

-- Function para atualizar dt_atualizacao
CREATE OR REPLACE FUNCTION update_dt_atualizacao()
RETURNS TRIGGER AS $$
BEGIN
    NEW.dt_atualizacao = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualização automática
CREATE TRIGGER trg_update_empresas BEFORE UPDATE ON tb_empresas
FOR EACH ROW EXECUTE FUNCTION update_dt_atualizacao();

CREATE TRIGGER trg_update_users BEFORE UPDATE ON tb_users
FOR EACH ROW EXECUTE FUNCTION update_dt_atualizacao();

CREATE TRIGGER trg_update_clinicas BEFORE UPDATE ON tb_clinicas
FOR EACH ROW EXECUTE FUNCTION update_dt_atualizacao();

CREATE TRIGGER trg_update_profissionais BEFORE UPDATE ON tb_profissionais
FOR EACH ROW EXECUTE FUNCTION update_dt_atualizacao();

CREATE TRIGGER trg_update_pacientes BEFORE UPDATE ON tb_pacientes
FOR EACH ROW EXECUTE FUNCTION update_dt_atualizacao();

CREATE TRIGGER trg_update_procedimentos BEFORE UPDATE ON tb_procedimentos
FOR EACH ROW EXECUTE FUNCTION update_dt_atualizacao();

CREATE TRIGGER trg_update_agendamentos BEFORE UPDATE ON tb_agendamentos
FOR EACH ROW EXECUTE FUNCTION update_dt_atualizacao();

CREATE TRIGGER trg_update_prontuarios BEFORE UPDATE ON tb_prontuarios
FOR EACH ROW EXECUTE FUNCTION update_dt_atualizacao();

CREATE TRIGGER trg_update_avaliacoes BEFORE UPDATE ON tb_avaliacoes
FOR EACH ROW EXECUTE FUNCTION update_dt_atualizacao();

CREATE TRIGGER trg_update_agentes BEFORE UPDATE ON tb_agentes
FOR EACH ROW EXECUTE FUNCTION update_dt_atualizacao();

CREATE TRIGGER trg_update_conversas BEFORE UPDATE ON tb_conversas
FOR EACH ROW EXECUTE FUNCTION update_dt_atualizacao();

-- =============================================
-- DADOS DE EXEMPLO (Opcional para desenvolvimento)
-- =============================================

-- Empresa exemplo
INSERT INTO tb_empresas (nm_empresa, nr_cnpj, ds_email, nr_telefone) VALUES
('DoctorQ Admin', '00000000000000', 'admin@doctorq.app', '(00) 0000-0000')
ON CONFLICT DO NOTHING;

-- Usuário admin exemplo
INSERT INTO tb_users (nm_email, nm_completo, nm_papel, st_ativo) VALUES
('admin@doctorq.app', 'Administrador DoctorQ', 'admin', true)
ON CONFLICT DO NOTHING;

-- =============================================
-- FIM DO SCHEMA INICIAL
-- =============================================

COMMENT ON TABLE tb_clinicas IS 'Cadastro de clínicas de estética';
COMMENT ON TABLE tb_profissionais IS 'Cadastro de profissionais (esteticistas, dermatologistas, etc.)';
COMMENT ON TABLE tb_pacientes IS 'Cadastro de pacientes/clientes';
COMMENT ON TABLE tb_procedimentos IS 'Catálogo de procedimentos estéticos';
COMMENT ON TABLE tb_agendamentos IS 'Agendamentos de consultas e procedimentos';
COMMENT ON TABLE tb_prontuarios IS 'Prontuários eletrônicos dos pacientes';
COMMENT ON TABLE tb_avaliacoes IS 'Avaliações de pacientes sobre profissionais e clínicas';
