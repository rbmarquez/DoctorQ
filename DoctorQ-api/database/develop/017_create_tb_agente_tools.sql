-- Script para criar tabela tb_agente_tools (idempotente)
-- Relacionamento entre agentes e ferramentas

-- Criar tabela tb_agente_tools (idempotente)
CREATE TABLE IF NOT EXISTS public.tb_agente_tools (
    id_agente_tool uuid DEFAULT uuid_generate_v4() NOT NULL,
    id_agente uuid NOT NULL,
    id_tool uuid NOT NULL,
    dt_criacao timestamp DEFAULT now() NULL,
    dt_atualizacao timestamp DEFAULT now() NULL,
    CONSTRAINT "PK_tb_agente_tools" PRIMARY KEY (id_agente_tool)
);

-- Criar/atualizar função de atualização (idempotente)
CREATE OR REPLACE FUNCTION update_dt_atualizacao()
RETURNS TRIGGER AS $$
BEGIN
    NEW.dt_atualizacao = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Adicionar chaves estrangeiras se não existirem
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'FK_tb_agente_tools_agente'
    ) THEN
        ALTER TABLE public.tb_agente_tools 
        ADD CONSTRAINT "FK_tb_agente_tools_agente" 
        FOREIGN KEY (id_agente) REFERENCES public.tb_agentes(id_agente) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'FK_tb_agente_tools_tool'
    ) THEN
        ALTER TABLE public.tb_agente_tools 
        ADD CONSTRAINT "FK_tb_agente_tools_tool" 
        FOREIGN KEY (id_tool) REFERENCES public.tb_tools(id_tool) ON DELETE CASCADE;
    END IF;
END $$;

-- Criar índices para performance (idempotente)
CREATE INDEX IF NOT EXISTS idx_tb_agente_tools_agente ON public.tb_agente_tools(id_agente);
CREATE INDEX IF NOT EXISTS idx_tb_agente_tools_tool ON public.tb_agente_tools(id_tool);

-- Criar constraint única para evitar duplicatas (idempotente)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'UK_tb_agente_tools_agente_tool'
    ) THEN
        ALTER TABLE public.tb_agente_tools
        ADD CONSTRAINT "UK_tb_agente_tools_agente_tool" 
        UNIQUE (id_agente, id_tool);
    END IF;
END $$;

-- Criar trigger para atualização automática (idempotente)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_dt_atualizacao_agente_tools'
    ) THEN
        CREATE TRIGGER trigger_update_dt_atualizacao_agente_tools
            BEFORE UPDATE ON public.tb_agente_tools
            FOR EACH ROW
            EXECUTE FUNCTION update_dt_atualizacao();
    END IF;
END $$;

-- Adicionar comentários de documentação
COMMENT ON TABLE public.tb_agente_tools IS 'Tabela de relacionamento entre agentes e ferramentas';
COMMENT ON COLUMN public.tb_agente_tools.id_agente_tool IS 'Identificador unico do relacionamento agente-tool';
COMMENT ON COLUMN public.tb_agente_tools.id_agente IS 'Referencia ao agente';
COMMENT ON COLUMN public.tb_agente_tools.id_tool IS 'Referencia a ferramenta';
COMMENT ON COLUMN public.tb_agente_tools.dt_criacao IS 'Data de criacao do relacionamento';
COMMENT ON COLUMN public.tb_agente_tools.dt_atualizacao IS 'Data de ultima atualizacao do relacionamento';