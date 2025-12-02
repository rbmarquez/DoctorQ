-- Migration: Criar tabela para biblioteca de prompts
-- Data: 21/10/2025
-- Descrição: Permite que usuários salvem e reutilizem prompts customizados

-- Criar tabela de prompts
CREATE TABLE IF NOT EXISTS tb_prompt_biblioteca (
    id_prompt UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nm_titulo VARCHAR(200) NOT NULL,
    ds_prompt TEXT NOT NULL,
    ds_categoria VARCHAR(50),
    ds_tags TEXT[], -- Array de tags para busca
    id_empresa UUID REFERENCES tb_empresas(id_empresa) ON DELETE CASCADE,
    id_usuario_criador UUID,
    nr_vezes_usado INTEGER DEFAULT 0,
    st_publico BOOLEAN DEFAULT FALSE, -- Se true, visível para toda empresa
    dt_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dt_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_categoria CHECK (ds_categoria IN (
        'atendimento',
        'analise',
        'criacao',
        'codigo',
        'pesquisa',
        'educacao',
        'outro'
    ))
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_prompt_biblioteca_empresa
    ON tb_prompt_biblioteca(id_empresa);

CREATE INDEX IF NOT EXISTS idx_prompt_biblioteca_categoria
    ON tb_prompt_biblioteca(ds_categoria);

CREATE INDEX IF NOT EXISTS idx_prompt_biblioteca_tags
    ON tb_prompt_biblioteca USING GIN(ds_tags);

CREATE INDEX IF NOT EXISTS idx_prompt_biblioteca_criacao
    ON tb_prompt_biblioteca(dt_criacao DESC);

-- Trigger para atualizar dt_atualizacao automaticamente
CREATE OR REPLACE FUNCTION update_prompt_biblioteca_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.dt_atualizacao = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_prompt_biblioteca_timestamp
    BEFORE UPDATE ON tb_prompt_biblioteca
    FOR EACH ROW
    EXECUTE FUNCTION update_prompt_biblioteca_timestamp();

-- Inserir prompts de exemplo
INSERT INTO tb_prompt_biblioteca
    (nm_titulo, ds_prompt, ds_categoria, ds_tags, st_publico)
VALUES
    (
        'Atendimento ao Cliente - E-commerce',
        'Você é um assistente de atendimento ao cliente para uma loja online. Seja cordial, empático e resolva problemas de forma eficiente. Sempre pergunte o número do pedido antes de qualquer ação. Ofereça soluções claras e, se necessário, escale para um atendente humano.',
        'atendimento',
        ARRAY['ecommerce', 'vendas', 'suporte', 'cliente'],
        true
    ),
    (
        'Analista de Dados - SQL',
        'Você é um analista de dados especializado em SQL. Ajude o usuário a criar queries otimizadas, explique conceitos de banco de dados e sugira melhores práticas. Sempre valide a lógica antes de executar comandos destrutivos.',
        'analise',
        ARRAY['sql', 'dados', 'analytics', 'database'],
        true
    ),
    (
        'Copywriter Criativo',
        'Você é um redator publicitário criativo e persuasivo. Crie textos envolventes para anúncios, posts de redes sociais, emails marketing e landing pages. Adapte o tom de voz ao público-alvo e objetivo da campanha.',
        'criacao',
        ARRAY['marketing', 'copywriting', 'conteudo', 'redacao'],
        true
    ),
    (
        'Code Reviewer - Python',
        'Você é um revisor de código Python experiente. Analise o código fornecido quanto a: performance, segurança, legibilidade, boas práticas PEP8 e padrões de design. Sugira melhorias específicas e explique o porquê.',
        'codigo',
        ARRAY['python', 'code-review', 'qualidade', 'desenvolvimento'],
        true
    ),
    (
        'Pesquisador Científico',
        'Você é um assistente de pesquisa científica. Ajude a encontrar papers relevantes, sintetize informações complexas, sugira metodologias de pesquisa e identifique gaps na literatura. Sempre cite fontes quando possível.',
        'pesquisa',
        ARRAY['ciencia', 'pesquisa', 'academico', 'papers'],
        true
    );

-- Comentários da tabela
COMMENT ON TABLE tb_prompt_biblioteca IS 'Biblioteca de prompts reutilizáveis para criação de agentes';
COMMENT ON COLUMN tb_prompt_biblioteca.nr_vezes_usado IS 'Contador de quantas vezes o prompt foi utilizado';
COMMENT ON COLUMN tb_prompt_biblioteca.st_publico IS 'Se true, prompt visível para todos usuários da empresa';
