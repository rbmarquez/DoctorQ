-- =====================================================
-- Migration 063: Sistema de Notas Fiscais Eletrônicas
-- UC063 - Emitir Nota Fiscal
-- Data: 07/11/2025
-- =====================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABELA: tb_notas_fiscais
-- =====================================================

CREATE TABLE IF NOT EXISTS tb_notas_fiscais (
    id_nota_fiscal UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_empresa UUID NOT NULL REFERENCES tb_empresas(id_empresa) ON DELETE CASCADE,
    id_pedido UUID REFERENCES tb_pedidos(id_pedido) ON DELETE SET NULL,
    id_fatura UUID REFERENCES tb_faturas(id_fatura) ON DELETE SET NULL,

    -- Tipo e número
    tp_nota VARCHAR(10) NOT NULL DEFAULT 'nfse' CHECK (tp_nota IN ('nfse', 'nfe', 'nfce')),
    nr_nota VARCHAR(50),  -- Número da nota (retornado após emissão)
    ds_serie VARCHAR(10),
    nr_rps VARCHAR(50) NOT NULL,  -- RPS - Recibo Provisório de Serviços

    -- Status
    st_nota VARCHAR(20) NOT NULL DEFAULT 'pendente' CHECK (st_nota IN ('pendente', 'processando', 'emitida', 'cancelada', 'erro')),
    ds_status_mensagem TEXT,

    -- Valores
    vl_servicos DECIMAL(10,2) NOT NULL,
    vl_deducoes DECIMAL(10,2) DEFAULT 0,
    vl_pis DECIMAL(10,2) DEFAULT 0,
    vl_cofins DECIMAL(10,2) DEFAULT 0,
    vl_inss DECIMAL(10,2) DEFAULT 0,
    vl_ir DECIMAL(10,2) DEFAULT 0,
    vl_csll DECIMAL(10,2) DEFAULT 0,
    vl_iss DECIMAL(10,2) DEFAULT 0,
    vl_desconto_condicionado DECIMAL(10,2) DEFAULT 0,
    vl_desconto_incondicionado DECIMAL(10,2) DEFAULT 0,
    vl_outras_retencoes DECIMAL(10,2) DEFAULT 0,
    vl_total_tributos DECIMAL(10,2) DEFAULT 0,
    vl_liquido DECIMAL(10,2) NOT NULL,

    -- Alíquota ISS
    pc_aliquota_iss DECIMAL(5,2) DEFAULT 5.00,

    -- Tomador (cliente)
    ds_tomador_cnpj_cpf VARCHAR(14) NOT NULL,
    ds_tomador_razao_social VARCHAR(255) NOT NULL,
    ds_tomador_email VARCHAR(255),
    ds_tomador_endereco JSONB,

    -- Prestador (empresa)
    ds_prestador_cnpj VARCHAR(14) NOT NULL,
    ds_prestador_razao_social VARCHAR(255) NOT NULL,
    ds_prestador_inscricao_municipal VARCHAR(50),
    ds_prestador_endereco JSONB,

    -- Serviço prestado
    ds_discriminacao TEXT NOT NULL,
    ds_codigo_servico VARCHAR(10),
    ds_item_lista_servico VARCHAR(10),
    ds_codigo_tributacao_municipio VARCHAR(20),

    -- Dados da API do serviço de NFe
    ds_provedor_nfe VARCHAR(50),  -- focus_nfe, enotas, nfse_nacional
    ds_ref_externa VARCHAR(100),  -- ID da nota no serviço externo
    ds_chave_acesso VARCHAR(44),  -- Chave de acesso da NFe (44 caracteres)
    ds_codigo_verificacao VARCHAR(20),
    ds_url_nfe TEXT,
    ds_url_pdf TEXT,

    -- XMLs
    ds_xml_rps TEXT,
    ds_xml_nfe TEXT,
    ds_dados_completos JSONB,  -- Resposta completa da API

    -- Cancelamento
    fg_cancelada BOOLEAN DEFAULT FALSE,
    dt_cancelamento TIMESTAMP,
    ds_motivo_cancelamento TEXT,

    -- Auditoria
    dt_emissao TIMESTAMP,  -- Data/hora de emissão (retornada pela prefeitura)
    dt_criacao TIMESTAMP NOT NULL DEFAULT now(),
    dt_atualizacao TIMESTAMP NOT NULL DEFAULT now(),

    -- Constraints
    CONSTRAINT chk_vl_positivos CHECK (vl_servicos >= 0 AND vl_liquido >= 0),
    CONSTRAINT chk_cnpj_cpf_length CHECK (char_length(ds_tomador_cnpj_cpf) IN (11, 14)),
    CONSTRAINT uk_nr_nota UNIQUE (id_empresa, nr_nota, ds_serie)
);

COMMENT ON TABLE tb_notas_fiscais IS 'Notas fiscais eletrônicas emitidas (NFSe, NFe, NFCe)';
COMMENT ON COLUMN tb_notas_fiscais.tp_nota IS 'nfse | nfe | nfce';
COMMENT ON COLUMN tb_notas_fiscais.st_nota IS 'pendente | processando | emitida | cancelada | erro';
COMMENT ON COLUMN tb_notas_fiscais.nr_rps IS 'RPS - Recibo Provisório de Serviços (antes da emissão)';
COMMENT ON COLUMN tb_notas_fiscais.ds_chave_acesso IS 'Chave de acesso de 44 dígitos da NFe';
COMMENT ON COLUMN tb_notas_fiscais.ds_provedor_nfe IS 'Serviço de NFe: focus_nfe | enotas | nfse_nacional';
COMMENT ON COLUMN tb_notas_fiscais.ds_discriminacao IS 'Descrição detalhada dos serviços prestados';
COMMENT ON COLUMN tb_notas_fiscais.pc_aliquota_iss IS 'Alíquota do ISS em % (varia por município)';

-- =====================================================
-- ÍNDICES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_notas_fiscais_empresa ON tb_notas_fiscais(id_empresa);
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_pedido ON tb_notas_fiscais(id_pedido);
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_fatura ON tb_notas_fiscais(id_fatura);
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_status ON tb_notas_fiscais(st_nota);
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_dt_emissao ON tb_notas_fiscais(dt_emissao DESC);
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_dt_criacao ON tb_notas_fiscais(dt_criacao DESC);
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_nr_nota ON tb_notas_fiscais(nr_nota);
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_chave ON tb_notas_fiscais(ds_chave_acesso);
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_tomador_cpf ON tb_notas_fiscais(ds_tomador_cnpj_cpf);
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_cancelada ON tb_notas_fiscais(fg_cancelada);

-- Índice parcial para notas pendentes (processamento)
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_pendentes ON tb_notas_fiscais(id_empresa, dt_criacao)
    WHERE st_nota IN ('pendente', 'erro');

-- Índice parcial para notas emitidas
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_emitidas ON tb_notas_fiscais(id_empresa, dt_emissao DESC)
    WHERE st_nota = 'emitida' AND fg_cancelada = FALSE;

-- Índice GIN para busca em JSON
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_dados_gin ON tb_notas_fiscais USING GIN (ds_dados_completos);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para atualizar dt_atualizacao
CREATE OR REPLACE FUNCTION update_notas_fiscais_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.dt_atualizacao = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_notas_fiscais_timestamp ON tb_notas_fiscais;
CREATE TRIGGER trg_update_notas_fiscais_timestamp
    BEFORE UPDATE ON tb_notas_fiscais
    FOR EACH ROW
    EXECUTE FUNCTION update_notas_fiscais_timestamp();

-- =====================================================
-- FUNÇÕES DE NEGÓCIO
-- =====================================================

-- Função para calcular ISS
CREATE OR REPLACE FUNCTION calcular_iss_nota(
    p_vl_servicos DECIMAL,
    p_vl_deducoes DECIMAL,
    p_vl_desconto DECIMAL,
    p_pc_aliquota DECIMAL
)
RETURNS DECIMAL AS $$
DECLARE
    v_base_calculo DECIMAL;
    v_iss DECIMAL;
BEGIN
    -- Base de cálculo = Valor Serviços - Deduções - Desconto
    v_base_calculo := p_vl_servicos - COALESCE(p_vl_deducoes, 0) - COALESCE(p_vl_desconto, 0);

    -- ISS = Base × Alíquota
    v_iss := v_base_calculo * (COALESCE(p_pc_aliquota, 5.0) / 100);

    RETURN ROUND(v_iss, 2);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calcular_iss_nota IS 'Calcula o valor do ISS baseado na alíquota municipal';

-- Função para validar CNPJ/CPF
CREATE OR REPLACE FUNCTION validar_cnpj_cpf(p_documento VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    v_documento VARCHAR;
    v_length INTEGER;
BEGIN
    -- Remove caracteres não numéricos
    v_documento := regexp_replace(p_documento, '[^0-9]', '', 'g');
    v_length := char_length(v_documento);

    -- Valida tamanho (11 para CPF, 14 para CNPJ)
    IF v_length NOT IN (11, 14) THEN
        RETURN FALSE;
    END IF;

    -- Valida se não são todos dígitos iguais
    IF v_documento ~ '^(\d)\1+$' THEN
        RETURN FALSE;
    END IF;

    -- TODO: Implementar validação completa de dígitos verificadores
    -- Por ora, apenas validação básica

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validar_cnpj_cpf IS 'Valida formato de CPF (11 dígitos) ou CNPJ (14 dígitos)';

-- Função para obter próximo número RPS
CREATE OR REPLACE FUNCTION obter_proximo_rps(p_id_empresa UUID)
RETURNS VARCHAR AS $$
DECLARE
    v_count INTEGER;
    v_rps VARCHAR;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM tb_notas_fiscais
    WHERE id_empresa = p_id_empresa;

    v_rps := LPAD((v_count + 1)::VARCHAR, 6, '0');
    RETURN v_rps;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION obter_proximo_rps IS 'Gera número sequencial de RPS por empresa (ex: 000001)';

-- =====================================================
-- VIEW: Resumo de Notas Fiscais
-- =====================================================

CREATE OR REPLACE VIEW vw_notas_fiscais_resumo AS
SELECT
    id_empresa,
    COUNT(*) AS total_notas,
    COUNT(*) FILTER (WHERE st_nota = 'emitida' AND NOT fg_cancelada) AS total_emitidas,
    COUNT(*) FILTER (WHERE fg_cancelada) AS total_canceladas,
    COUNT(*) FILTER (WHERE st_nota = 'pendente') AS total_pendentes,
    COUNT(*) FILTER (WHERE st_nota = 'erro') AS total_erros,
    SUM(vl_servicos) FILTER (WHERE st_nota = 'emitida' AND NOT fg_cancelada) AS vl_total_servicos,
    SUM(vl_iss) FILTER (WHERE st_nota = 'emitida' AND NOT fg_cancelada) AS vl_total_iss,
    SUM(vl_liquido) FILTER (WHERE st_nota = 'emitida' AND NOT fg_cancelada) AS vl_total_liquido,
    SUM(vl_total_tributos) FILTER (WHERE st_nota = 'emitida' AND NOT fg_cancelada) AS vl_total_tributos,
    MIN(dt_emissao) AS dt_primeira_emissao,
    MAX(dt_emissao) AS dt_ultima_emissao
FROM tb_notas_fiscais
GROUP BY id_empresa;

COMMENT ON VIEW vw_notas_fiscais_resumo IS 'Resumo de notas fiscais por empresa (totais, valores, datas)';

-- =====================================================
-- VIEW: Notas Fiscais por Mês
-- =====================================================

CREATE OR REPLACE VIEW vw_notas_fiscais_mes AS
SELECT
    id_empresa,
    DATE_TRUNC('month', dt_emissao) AS mes,
    COUNT(*) AS total_notas,
    SUM(vl_servicos) AS vl_servicos,
    SUM(vl_iss) AS vl_iss,
    SUM(vl_liquido) AS vl_liquido,
    SUM(vl_total_tributos) AS vl_tributos
FROM tb_notas_fiscais
WHERE st_nota = 'emitida' AND NOT fg_cancelada
GROUP BY id_empresa, DATE_TRUNC('month', dt_emissao)
ORDER BY mes DESC;

COMMENT ON VIEW vw_notas_fiscais_mes IS 'Faturamento mensal por empresa';

-- =====================================================
-- ROW-LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE tb_notas_fiscais ENABLE ROW LEVEL SECURITY;

-- Policy: usuários veem apenas notas da própria empresa
DROP POLICY IF EXISTS notas_fiscais_tenant_isolation ON tb_notas_fiscais;
CREATE POLICY notas_fiscais_tenant_isolation ON tb_notas_fiscais
    USING (id_empresa = current_setting('app.current_empresa_id')::UUID);

-- =====================================================
-- VALIDAÇÃO
-- =====================================================

DO $$
BEGIN
    -- Verificar se tabela foi criada
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tb_notas_fiscais') THEN
        RAISE EXCEPTION 'Tabela tb_notas_fiscais não foi criada';
    END IF;

    -- Verificar se views foram criadas
    IF NOT EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'vw_notas_fiscais_resumo') THEN
        RAISE EXCEPTION 'View vw_notas_fiscais_resumo não foi criada';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'vw_notas_fiscais_mes') THEN
        RAISE EXCEPTION 'View vw_notas_fiscais_mes não foi criada';
    END IF;

    RAISE NOTICE 'Migration 063 aplicada com sucesso!';
    RAISE NOTICE '- 1 tabela criada: tb_notas_fiscais';
    RAISE NOTICE '- 13 índices criados';
    RAISE NOTICE '- 4 funções criadas';
    RAISE NOTICE '- 2 views criadas';
    RAISE NOTICE '- 1 trigger criado';
    RAISE NOTICE '- Row-Level Security habilitado';
END $$;
