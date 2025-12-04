DROP TABLE IF EXISTS public.tb_agentes;

CREATE TABLE public.tb_agentes (
    id_agente uuid DEFAULT uuid_generate_v4() NOT NULL,
    nm_agente varchar NOT NULL,
    ds_prompt text NOT NULL,
    ds_config JSON,
    dt_criacao timestamp DEFAULT now() NULL,
    dt_atualizacao timestamp DEFAULT now() NULL,
    CONSTRAINT "PK_tb_agentes" PRIMARY KEY (id_agente)
);


-- Trigger para atualizar dt_atualizacao automaticamente
CREATE OR REPLACE FUNCTION update_dt_atualizacao()
RETURNS TRIGGER AS $$
BEGIN
    NEW.dt_atualizacao = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_dt_atualizacao_agentes
    BEFORE UPDATE ON public.tb_agentes
    FOR EACH ROW
    EXECUTE FUNCTION update_dt_atualizacao();

-- ComentÃ¡rios para documentaÃ§Ã£o
COMMENT ON TABLE public.tb_agentes IS 'Tabela para armazenamento de agentes configurÃ¡veis do sistema';
COMMENT ON COLUMN public.tb_agentes.id_agente IS 'Identificador Ãºnico do agente';
COMMENT ON COLUMN public.tb_agentes.nm_agente IS 'Nome do agente (mÃ¡ximo 255 caracteres)';
COMMENT ON COLUMN public.tb_agentes.ds_prompt IS 'Prompt/instruÃ§Ãµes do agente (mÃ¡ximo 50.000 caracteres)';
COMMENT ON COLUMN public.tb_agentes.ds_config IS 'ConfiguraÃ§Ãµes do agente em formato JSON';
COMMENT ON COLUMN public.tb_agentes.dt_criacao IS 'Data de criaÃ§Ã£o do agente';
COMMENT ON COLUMN public.tb_agentes.dt_atualizacao IS 'Data de Ãºltima atualizaÃ§Ã£o do agente';
