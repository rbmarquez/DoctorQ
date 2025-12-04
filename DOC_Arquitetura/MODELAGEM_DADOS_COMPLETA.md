# 🗄️ MODELAGEM DE DADOS COMPLETA - DoctorQ

**Data:** 01/11/2025
**Versão:** 1.0
**Status:** Documentação Consolidada
**Total de Tabelas:** 62
**Total de Relacionamentos:** 100+

---

## 📑 ÍNDICE

1. [Visão Geral](#visão-geral)
2. [Domínios do Sistema](#domínios-do-sistema)
3. [Tabelas por Domínio](#tabelas-por-domínio)
4. [Relacionamentos](#relacionamentos)
5. [Índices e Performance](#índices-e-performance)
6. [Padrões de Auditoria](#padrões-de-auditoria)
7. [Enums e Tipos](#enums-e-tipos)
8. [Modelo ER Visual](#modelo-er-visual)

---

## 1. VISÃO GERAL

### 1.1 Estatísticas Gerais

| Categoria | Quantidade |
|-----------|-----------|
| **Total de Tabelas** | 62 |
| **Relacionamentos 1:N** | 85+ |
| **Relacionamentos N:N** | 1 (procedimentos-profissionais) |
| **Enums PostgreSQL** | 2 |
| **Views Criadas** | 5 |
| **Funções PL/pgSQL** | 15+ |
| **Triggers** | 50+ (update_dt_atualizacao) |
| **Índices** | 100+ |

### 1.2 Padrões de Nomenclatura

```sql
-- Tabelas
tb_[nome_plural]

-- Campos
id_[entidade]          -- Primary Key (UUID)
nm_[campo]             -- Nome/Texto
ds_[campo]             -- Descrição/Texto longo
nr_[campo]             -- Número/Integer
vl_[campo]             -- Valor/Numeric
dt_[campo]             -- Data/Timestamp
st_[campo]             -- Status/Boolean
hr_[campo]             -- Hora/Time

-- Convenções
- Snake_case
- Português brasileiro
- Prefixos semânticos
```

---

## 2. DOMÍNIOS DO SISTEMA

O DoctorQ está organizado em **13 domínios principais**:

```
DoctorQ Platform
│
├── 1. Core (Usuários & Auth)
├── 2. Organizacional (Empresas & Clínicas)
├── 3. Profissionais & Pacientes
├── 4. Agendamento & Procedimentos
├── 5. Prontuários & Avaliações
├── 6. Marketplace (Fornecedores & Produtos)
├── 7. Vendas (Carrinho & Pedidos)
├── 8. Mensagens
├── 9. Galeria & Favoritos
├── 10. Notificações & Sistema
├── 11. Billing & Assinaturas
├── 12. IA (Agentes & Conversas)
└── 13. Analytics
```

---

## 3. TABELAS POR DOMÍNIO

### DOMÍNIO 1: CORE - Usuários & Autenticação

#### `tb_users` - Usuários da Plataforma
```sql
CREATE TABLE tb_users (
    id_user UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nm_email VARCHAR(255) UNIQUE NOT NULL,
    nm_completo VARCHAR(255) NOT NULL,
    ds_senha_hash VARCHAR(255),
    nm_tipo_usuario enum_tipo_usuario DEFAULT 'cliente',
    st_ativo BOOLEAN DEFAULT true,
    dt_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dt_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dt_ultimo_login TIMESTAMP,

    -- FKs
    id_empresa UUID REFERENCES tb_empresas(id_empresa),
    id_perfil UUID REFERENCES tb_perfis(id_perfil)
);

CREATE INDEX idx_users_email ON tb_users(nm_email);
CREATE INDEX idx_users_tipo ON tb_users(nm_tipo_usuario);
CREATE INDEX idx_users_empresa ON tb_users(id_empresa);
```

**Campos Principais:**
- `id_user` - Identificador único (UUID v4)
- `nm_email` - Email único (autenticação)
- `nm_completo` - Nome completo do usuário
- `ds_senha_hash` - Hash bcrypt da senha (nullable para OAuth)
- `nm_tipo_usuario` - Enum: cliente, profissional, fornecedor, admin
- `st_ativo` - Status ativo/inativo (soft delete)

#### `tb_oauth_providers` - Provedores OAuth
```sql
CREATE TABLE tb_oauth_providers (
    id_oauth UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_user UUID REFERENCES tb_users(id_user) ON DELETE CASCADE,
    nm_provider VARCHAR(50) NOT NULL, -- google, microsoft, facebook
    ds_provider_id VARCHAR(255) NOT NULL,
    ds_access_token TEXT,
    dt_token_expira TIMESTAMP,
    dt_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_oauth_provider UNIQUE (nm_provider, ds_provider_id)
);
```

#### `tb_sessions` - Sessões de Usuários
```sql
CREATE TABLE tb_sessions (
    id_session UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_user UUID REFERENCES tb_users(id_user) ON DELETE CASCADE,
    ds_token VARCHAR(500) UNIQUE NOT NULL,
    ds_ip VARCHAR(45), -- IPv6 compatible
    dt_expira TIMESTAMP NOT NULL,
    dt_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_token ON tb_sessions(ds_token);
CREATE INDEX idx_sessions_user ON tb_sessions(id_user);
```

#### `tb_perfis` - Perfis & Permissões (RBAC)
```sql
CREATE TABLE tb_perfis (
    id_perfil UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nm_perfil VARCHAR(100) UNIQUE NOT NULL,
    ds_perfil TEXT,
    ds_permissoes JSONB NOT NULL DEFAULT '{}',
    dt_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dt_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Exemplo de `ds_permissoes`:**
```json
{
  "clinicas": {
    "criar": true,
    "editar": true,
    "deletar": false
  },
  "agendamentos": {
    "ver_todos": true,
    "editar": true
  },
  "financeiro": {
    "visualizar": true,
    "editar": false
  }
}
```

#### `tb_api_keys` - Chaves de API
```sql
CREATE TABLE tb_api_keys (
    id_api_key UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_user UUID REFERENCES tb_users(id_user) ON DELETE CASCADE,
    id_empresa UUID REFERENCES tb_empresas(id_empresa),
    nm_api_key VARCHAR(100) UNIQUE NOT NULL,
    st_ativo BOOLEAN DEFAULT true,
    dt_expiracao TIMESTAMP,
    dt_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_api_keys_key ON tb_api_keys(nm_api_key);
```

---

### DOMÍNIO 2: ORGANIZACIONAL - Empresas & Clínicas

#### `tb_empresas` - Empresas (Multi-tenant)
```sql
CREATE TABLE tb_empresas (
    id_empresa UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nm_empresa VARCHAR(255) NOT NULL,
    nr_cnpj VARCHAR(18) UNIQUE,
    ds_email VARCHAR(255),
    nr_telefone VARCHAR(20),
    ds_endereco TEXT,
    st_ativo BOOLEAN DEFAULT true,
    dt_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dt_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_empresas_cnpj ON tb_empresas(nr_cnpj);
CREATE INDEX idx_empresas_ativo ON tb_empresas(st_ativo);
```

#### `tb_clinicas` - Clínicas de Estética
```sql
CREATE TABLE tb_clinicas (
    id_clinica UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_empresa UUID REFERENCES tb_empresas(id_empresa) ON DELETE CASCADE,
    nm_clinica VARCHAR(255) NOT NULL,
    nr_cnpj VARCHAR(18),
    ds_especialidades TEXT[] DEFAULT '{}', -- Array de especialidades
    nr_avaliacao_media NUMERIC(3,2) DEFAULT 0.0,
    st_ativo BOOLEAN DEFAULT true,
    st_verificada BOOLEAN DEFAULT false,
    dt_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dt_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_clinicas_empresa ON tb_clinicas(id_empresa);
CREATE INDEX idx_clinicas_verificada ON tb_clinicas(st_verificada);
CREATE INDEX idx_clinicas_especialidades_gin ON tb_clinicas USING GIN(ds_especialidades);
```

---

### DOMÍNIO 3: PROFISSIONAIS & PACIENTES

#### `tb_profissionais` - Profissionais de Estética
```sql
CREATE TABLE tb_profissionais (
    id_profissional UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_user UUID REFERENCES tb_users(id_user) UNIQUE ON DELETE CASCADE,
    id_clinica UUID REFERENCES tb_clinicas(id_clinica),
    nm_profissional VARCHAR(255) NOT NULL,
    ds_especialidades TEXT[] DEFAULT '{}',
    nr_registro_profissional VARCHAR(50),
    nr_anos_experiencia INTEGER DEFAULT 0,
    vl_valor_hora NUMERIC(10,2),
    nr_avaliacao_media NUMERIC(3,2) DEFAULT 0.0,
    st_verificado BOOLEAN DEFAULT false,
    st_ativo BOOLEAN DEFAULT true,
    dt_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dt_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_profissionais_clinica ON tb_profissionais(id_clinica);
CREATE INDEX idx_profissionais_especialidades_gin ON tb_profissionais USING GIN(ds_especialidades);
CREATE INDEX idx_profissionais_avaliacao ON tb_profissionais(nr_avaliacao_media DESC);
```

#### `tb_pacientes` - Pacientes/Clientes
```sql
CREATE TABLE tb_pacientes (
    id_paciente UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_user UUID REFERENCES tb_users(id_user) UNIQUE ON DELETE CASCADE,
    id_clinica UUID REFERENCES tb_clinicas(id_clinica),
    nm_paciente VARCHAR(255) NOT NULL,
    dt_nascimento DATE,
    nr_cpf VARCHAR(14) UNIQUE,
    ds_alergias TEXT,
    ds_medicamentos_uso TEXT,
    st_ativo BOOLEAN DEFAULT true,
    nr_total_consultas INTEGER DEFAULT 0,
    dt_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dt_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pacientes_cpf ON tb_pacientes(nr_cpf);
CREATE INDEX idx_pacientes_clinica ON tb_pacientes(id_clinica);
```

---

### DOMÍNIO 4: AGENDAMENTO & PROCEDIMENTOS

#### `tb_procedimentos` - Catálogo de Procedimentos
```sql
CREATE TABLE tb_procedimentos (
    id_procedimento UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_clinica UUID REFERENCES tb_clinicas(id_clinica) ON DELETE CASCADE,
    id_categoria UUID REFERENCES tb_categorias_procedimentos(id_categoria),
    nm_procedimento VARCHAR(255) NOT NULL,
    ds_categoria VARCHAR(100),
    vl_preco NUMERIC(10,2),
    nr_duracao_minutos INTEGER DEFAULT 60,
    st_requer_avaliacao BOOLEAN DEFAULT false,
    st_ativo BOOLEAN DEFAULT true,
    dt_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dt_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_procedimentos_clinica ON tb_procedimentos(id_clinica);
CREATE INDEX idx_procedimentos_categoria ON tb_procedimentos(id_categoria);
CREATE INDEX idx_procedimentos_ativo ON tb_procedimentos(st_ativo);
```

#### `tb_categorias_procedimentos` - Categorias
```sql
CREATE TABLE tb_categorias_procedimentos (
    id_categoria UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nm_categoria VARCHAR(100) UNIQUE NOT NULL,
    ds_descricao TEXT,
    nr_ordem INTEGER DEFAULT 0,
    st_ativo BOOLEAN DEFAULT true,
    dt_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `tb_procedimentos_profissionais` - Relação N:N
```sql
CREATE TABLE tb_procedimentos_profissionais (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_procedimento UUID REFERENCES tb_procedimentos(id_procedimento) ON DELETE CASCADE,
    id_profissional UUID REFERENCES tb_profissionais(id_profissional) ON DELETE CASCADE,
    vl_preco NUMERIC(10,2),
    nr_duracao_minutos INTEGER,
    st_disponivel BOOLEAN DEFAULT true,
    dt_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_procedimento_profissional UNIQUE (id_procedimento, id_profissional)
);

CREATE INDEX idx_proc_prof_procedimento ON tb_procedimentos_profissionais(id_procedimento);
CREATE INDEX idx_proc_prof_profissional ON tb_procedimentos_profissionais(id_profissional);
```

#### `tb_agendamentos` - Agendamentos de Consultas
```sql
CREATE TABLE tb_agendamentos (
    id_agendamento UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_cliente UUID REFERENCES tb_pacientes(id_paciente) ON DELETE CASCADE,
    id_profissional UUID REFERENCES tb_profissionais(id_profissional),
    id_procedimento UUID REFERENCES tb_procedimentos(id_procedimento),
    id_clinica UUID REFERENCES tb_clinicas(id_clinica),
    dt_agendamento TIMESTAMP NOT NULL,
    ds_status enum_status_agendamento DEFAULT 'pendente',
    vl_valor NUMERIC(10,2),
    st_confirmado BOOLEAN DEFAULT false,
    st_pago BOOLEAN DEFAULT false,
    dt_cancelamento TIMESTAMP,
    ds_observacao TEXT,
    dt_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dt_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_profissional_horario UNIQUE (id_profissional, dt_agendamento)
);

CREATE INDEX idx_agendamentos_data ON tb_agendamentos(dt_agendamento);
CREATE INDEX idx_agendamentos_status ON tb_agendamentos(ds_status);
CREATE INDEX idx_agendamentos_profissional ON tb_agendamentos(id_profissional);
CREATE INDEX idx_agendamentos_cliente ON tb_agendamentos(id_cliente);
```

#### `tb_horarios_disponiveis` - Horários Disponíveis
```sql
CREATE TABLE tb_horarios_disponiveis (
    id_horario UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_profissional UUID REFERENCES tb_profissionais(id_profissional) ON DELETE CASCADE,
    nr_dia_semana INTEGER CHECK (nr_dia_semana BETWEEN 0 AND 6), -- 0=domingo
    hr_inicio TIME NOT NULL,
    hr_fim TIME NOT NULL,
    st_ativo BOOLEAN DEFAULT true,
    dt_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_horario_profissional UNIQUE (id_profissional, nr_dia_semana, hr_inicio, hr_fim)
);
```

#### `tb_bloqueios_agenda` - Bloqueios de Agenda
```sql
CREATE TABLE tb_bloqueios_agenda (
    id_bloqueio UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_profissional UUID REFERENCES tb_profissionais(id_profissional) ON DELETE CASCADE,
    dt_inicio TIMESTAMP NOT NULL,
    dt_fim TIMESTAMP NOT NULL,
    ds_motivo TEXT,
    dt_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bloqueios_profissional ON tb_bloqueios_agenda(id_profissional);
```

---

### DOMÍNIO 5: PRONTUÁRIOS & AVALIAÇÕES

#### `tb_prontuarios` - Prontuários Eletrônicos (Completo)

**Status:** ✅ Atualizado 06/11/2025 - Estrutura completa com 34 campos

```sql
CREATE TABLE tb_prontuarios (
    -- Identificação
    id_prontuario UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_paciente UUID REFERENCES tb_pacientes(id_paciente) ON DELETE CASCADE,
    id_profissional UUID REFERENCES tb_profissionais(id_profissional) ON DELETE CASCADE,
    id_agendamento UUID REFERENCES tb_agendamentos(id_agendamento) ON DELETE CASCADE,
    id_clinica UUID REFERENCES tb_clinicas(id_clinica) ON DELETE CASCADE,

    -- Dados da Consulta
    dt_consulta TIMESTAMP NOT NULL,
    ds_tipo VARCHAR(50),  -- Primeira consulta, Retorno, Acompanhamento

    -- Anamnese
    ds_queixa_principal TEXT,
    ds_historico_doenca_atual TEXT,
    ds_antecedentes_pessoais TEXT,
    ds_antecedentes_familiares TEXT,
    ds_habitos_vida TEXT,

    -- Dados Vitais
    ds_pressao_arterial VARCHAR(20),
    ds_peso NUMERIC(5,2),
    ds_altura NUMERIC(5,2),
    ds_imc NUMERIC(5,2),

    -- Exame Físico e Avaliação
    ds_exame_fisico TEXT,
    ds_avaliacao_estetica TEXT,
    ds_diagnostico TEXT,

    -- Procedimentos e Tratamento
    ds_procedimentos_realizados TEXT,
    ds_produtos_utilizados TEXT,
    ds_prescricoes TEXT,
    ds_orientacoes TEXT,
    ds_plano_tratamento TEXT,

    -- Evolução
    ds_evolucao TEXT,
    ds_intercorrencias TEXT,

    -- Anexos
    ds_fotos_antes TEXT[] DEFAULT '{}',
    ds_fotos_depois TEXT[] DEFAULT '{}',
    ds_arquivos_anexos TEXT[] DEFAULT '{}',

    -- Retorno
    dt_retorno_sugerido DATE,

    -- Assinatura Digital
    ds_assinatura_profissional TEXT,
    dt_assinatura TIMESTAMP,

    -- Auditoria
    dt_criacao TIMESTAMP DEFAULT now(),
    dt_atualizacao TIMESTAMP DEFAULT now()
);

-- Índices para Performance
CREATE INDEX idx_prontuarios_paciente ON tb_prontuarios(id_paciente);
CREATE INDEX idx_prontuarios_profissional ON tb_prontuarios(id_profissional);
CREATE INDEX idx_prontuarios_agendamento ON tb_prontuarios(id_agendamento);
CREATE INDEX idx_prontuarios_data ON tb_prontuarios(dt_consulta);

-- Trigger para atualização automática
CREATE TRIGGER trg_update_prontuarios
    BEFORE UPDATE ON tb_prontuarios
    FOR EACH ROW
    EXECUTE FUNCTION update_dt_atualizacao();

-- Comentários
COMMENT ON TABLE tb_prontuarios IS 'Prontuários eletrônicos completos com anamnese, exames, procedimentos e evolução';
COMMENT ON COLUMN tb_prontuarios.id_clinica IS 'Clínica onde a consulta foi realizada (importante para consolidação multi-clínica)';
COMMENT ON COLUMN tb_prontuarios.ds_tipo IS 'Tipo de consulta: Primeira consulta, Retorno, Acompanhamento, etc.';
COMMENT ON COLUMN tb_prontuarios.ds_imc IS 'Índice de Massa Corporal calculado (peso/altura²)';
```

#### `tb_avaliacoes` - Avaliações de Profissionais/Clínicas
```sql
CREATE TABLE tb_avaliacoes (
    id_avaliacao UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_paciente UUID REFERENCES tb_pacientes(id_paciente) ON DELETE CASCADE,
    id_profissional UUID REFERENCES tb_profissionais(id_profissional),
    id_clinica UUID REFERENCES tb_clinicas(id_clinica),
    id_agendamento UUID REFERENCES tb_agendamentos(id_agendamento),
    nr_nota INTEGER CHECK (nr_nota >= 1 AND nr_nota <= 5),
    ds_comentario TEXT,
    st_recomenda BOOLEAN,
    st_aprovada BOOLEAN DEFAULT false,
    dt_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dt_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_avaliacoes_profissional ON tb_avaliacoes(id_profissional);
CREATE INDEX idx_avaliacoes_clinica ON tb_avaliacoes(id_clinica);
CREATE INDEX idx_avaliacoes_nota ON tb_avaliacoes(nr_nota);
```

---

### DOMÍNIO 6: MARKETPLACE - Fornecedores & Produtos

#### `tb_fornecedores` - Fornecedores de Produtos
```sql
CREATE TABLE tb_fornecedores (
    id_fornecedor UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_user UUID REFERENCES tb_users(id_user) UNIQUE,
    id_empresa UUID REFERENCES tb_empresas(id_empresa),
    nm_empresa VARCHAR(255) NOT NULL,
    nr_cnpj VARCHAR(18) UNIQUE,
    ds_descricao TEXT,
    nr_avaliacao_media NUMERIC(3,2) DEFAULT 0.0,
    st_ativo BOOLEAN DEFAULT true,
    st_verificado BOOLEAN DEFAULT false,
    vl_total_vendido NUMERIC(12,2) DEFAULT 0.0,
    dt_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dt_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_fornecedores_cnpj ON tb_fornecedores(nr_cnpj);
CREATE INDEX idx_fornecedores_verificado ON tb_fornecedores(st_verificado);
```

#### `tb_categorias_produtos` - Categorias de Produtos
```sql
CREATE TABLE tb_categorias_produtos (
    id_categoria UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_categoria_pai UUID REFERENCES tb_categorias_produtos(id_categoria), -- Self-reference
    nm_categoria VARCHAR(100) UNIQUE NOT NULL,
    ds_slug VARCHAR(100) UNIQUE NOT NULL,
    nr_ordem INTEGER DEFAULT 0,
    st_ativo BOOLEAN DEFAULT true,
    dt_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `tb_produtos` - Catálogo de Produtos
```sql
CREATE TABLE tb_produtos (
    id_produto UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_fornecedor UUID REFERENCES tb_fornecedores(id_fornecedor) ON DELETE CASCADE,
    id_categoria UUID REFERENCES tb_categorias_produtos(id_categoria),
    nm_produto VARCHAR(255) NOT NULL,
    ds_sku VARCHAR(50) UNIQUE,
    vl_preco NUMERIC(10,2) NOT NULL,
    nr_estoque INTEGER DEFAULT 0,
    ds_marca VARCHAR(100),
    st_ativo BOOLEAN DEFAULT true,
    st_destaque BOOLEAN DEFAULT false,
    nr_avaliacao_media NUMERIC(3,2) DEFAULT 0.0,
    dt_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dt_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_produtos_fornecedor ON tb_produtos(id_fornecedor);
CREATE INDEX idx_produtos_categoria ON tb_produtos(id_categoria);
CREATE INDEX idx_produtos_sku ON tb_produtos(ds_sku);
CREATE INDEX idx_produtos_destaque ON tb_produtos(st_destaque);
```

#### `tb_produto_variacoes` - Variações de Produtos
```sql
CREATE TABLE tb_produto_variacoes (
    id_variacao UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_produto UUID REFERENCES tb_produtos(id_produto) ON DELETE CASCADE,
    nm_tipo_variacao VARCHAR(50), -- "cor", "tamanho"
    nm_variacao VARCHAR(100), -- "vermelho", "P"
    vl_preco_adicional NUMERIC(10,2) DEFAULT 0.0,
    nr_estoque INTEGER DEFAULT 0,
    ds_sku VARCHAR(50) UNIQUE,
    dt_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_variacoes_produto ON tb_produto_variacoes(id_produto);
```

#### `tb_avaliacoes_produtos` - Avaliações de Produtos
```sql
CREATE TABLE tb_avaliacoes_produtos (
    id_avaliacao UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_produto UUID REFERENCES tb_produtos(id_produto) ON DELETE CASCADE,
    id_user UUID REFERENCES tb_users(id_user),
    nr_nota INTEGER CHECK (nr_nota >= 1 AND nr_nota <= 5),
    ds_comentario TEXT,
    st_aprovada BOOLEAN DEFAULT false,
    st_compra_verificada BOOLEAN DEFAULT false,
    nr_util INTEGER DEFAULT 0,
    nr_nao_util INTEGER DEFAULT 0,
    dt_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_avaliacoes_produtos_produto ON tb_avaliacoes_produtos(id_produto);
```

---

### DOMÍNIO 7: VENDAS - Carrinho & Pedidos

#### `tb_carrinho` - Carrinho de Compras
```sql
CREATE TABLE tb_carrinho (
    id_item_carrinho UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_user UUID REFERENCES tb_users(id_user) ON DELETE CASCADE,
    id_produto UUID REFERENCES tb_produtos(id_produto),
    id_procedimento UUID REFERENCES tb_procedimentos(id_procedimento),
    id_variacao UUID REFERENCES tb_produto_variacoes(id_variacao),
    qt_quantidade INTEGER DEFAULT 1 CHECK (qt_quantidade > 0),
    vl_unitario NUMERIC(10,2) NOT NULL,
    vl_total NUMERIC(10,2) GENERATED ALWAYS AS (qt_quantidade * vl_unitario) STORED,
    dt_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dt_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_carrinho_user ON tb_carrinho(id_user);
```

#### `tb_cupons` - Cupons de Desconto
```sql
CREATE TABLE tb_cupons (
    id_cupom UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_empresa UUID REFERENCES tb_empresas(id_empresa),
    ds_codigo VARCHAR(50) UNIQUE NOT NULL,
    ds_tipo_desconto VARCHAR(20) CHECK (ds_tipo_desconto IN ('percentual', 'valor_fixo', 'frete_gratis')),
    nr_percentual_desconto NUMERIC(5,2),
    vl_minimo_compra NUMERIC(10,2),
    dt_inicio TIMESTAMP,
    dt_fim TIMESTAMP,
    st_ativo BOOLEAN DEFAULT true,
    nr_usos_atuais INTEGER DEFAULT 0,
    dt_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cupons_codigo ON tb_cupons(ds_codigo);
```

#### `tb_pedidos` - Pedidos de Compra
```sql
CREATE TABLE tb_pedidos (
    id_pedido UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nr_pedido VARCHAR(20) UNIQUE NOT NULL,
    id_user UUID REFERENCES tb_users(id_user) ON DELETE CASCADE,
    id_fornecedor UUID REFERENCES tb_fornecedores(id_fornecedor),
    vl_subtotal NUMERIC(10,2) NOT NULL,
    vl_frete NUMERIC(10,2) DEFAULT 0.0,
    vl_desconto NUMERIC(10,2) DEFAULT 0.0,
    vl_total NUMERIC(10,2) NOT NULL,
    ds_status VARCHAR(50) DEFAULT 'pendente',
    ds_forma_pagamento VARCHAR(50),
    ds_codigo_rastreio VARCHAR(100),
    dt_cancelamento TIMESTAMP,
    dt_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dt_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pedidos_user ON tb_pedidos(id_user);
CREATE INDEX idx_pedidos_status ON tb_pedidos(ds_status);
CREATE INDEX idx_pedidos_numero ON tb_pedidos(nr_pedido);
```

#### `tb_itens_pedido` - Itens do Pedido
```sql
CREATE TABLE tb_itens_pedido (
    id_item UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_pedido UUID REFERENCES tb_pedidos(id_pedido) ON DELETE CASCADE,
    id_produto UUID REFERENCES tb_produtos(id_produto),
    id_variacao UUID REFERENCES tb_produto_variacoes(id_variacao),
    nm_produto VARCHAR(255) NOT NULL,
    qt_quantidade INTEGER CHECK (qt_quantidade > 0),
    vl_unitario NUMERIC(10,2) NOT NULL,
    vl_total NUMERIC(10,2) NOT NULL,
    dt_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_itens_pedido ON tb_itens_pedido(id_pedido);
```

---

### DOMÍNIO 8: MENSAGENS

#### `tb_conversas_usuarios` - Conversas entre Usuários
```sql
CREATE TABLE tb_conversas_usuarios (
    id_conversa UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_empresa UUID REFERENCES tb_empresas(id_empresa),
    ds_tipo VARCHAR(20) DEFAULT 'individual', -- individual, grupo, suporte
    nm_titulo VARCHAR(255),
    dt_ultima_mensagem TIMESTAMP,
    st_arquivada BOOLEAN DEFAULT false,
    st_bloqueada BOOLEAN DEFAULT false,
    dt_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_conversas_empresa ON tb_conversas_usuarios(id_empresa);
```

#### `tb_participantes_conversa` - Participantes de Conversa
```sql
CREATE TABLE tb_participantes_conversa (
    id_participante UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_conversa UUID REFERENCES tb_conversas_usuarios(id_conversa) ON DELETE CASCADE,
    id_user UUID REFERENCES tb_users(id_user) ON DELETE CASCADE,
    ds_papel VARCHAR(20) DEFAULT 'membro', -- admin, membro
    nr_mensagens_nao_lidas INTEGER DEFAULT 0,
    dt_entrada TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dt_saida TIMESTAMP,

    CONSTRAINT uk_user_conversa UNIQUE (id_conversa, id_user)
);

CREATE INDEX idx_participantes_conversa ON tb_participantes_conversa(id_conversa);
CREATE INDEX idx_participantes_user ON tb_participantes_conversa(id_user);
```

#### `tb_mensagens_usuarios` - Mensagens entre Usuários
```sql
CREATE TABLE tb_mensagens_usuarios (
    id_mensagem UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_conversa UUID REFERENCES tb_conversas_usuarios(id_conversa) ON DELETE CASCADE,
    id_remetente UUID REFERENCES tb_users(id_user),
    id_mensagem_pai UUID REFERENCES tb_mensagens_usuarios(id_mensagem), -- Replies
    ds_tipo_mensagem VARCHAR(20) DEFAULT 'texto', -- texto, imagem, video, audio, arquivo
    ds_conteudo TEXT,
    ds_arquivos_url TEXT[] DEFAULT '{}',
    id_agendamento UUID REFERENCES tb_agendamentos(id_agendamento),
    id_produto UUID REFERENCES tb_produtos(id_produto),
    st_lida BOOLEAN DEFAULT false,
    st_deletada BOOLEAN DEFAULT false,
    dt_lida TIMESTAMP,
    dt_deletada TIMESTAMP,
    dt_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dt_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_mensagens_conversa ON tb_mensagens_usuarios(id_conversa);
CREATE INDEX idx_mensagens_criacao ON tb_mensagens_usuarios(dt_criacao DESC);
```

---

## 4. RELACIONAMENTOS

### 4.1 Relacionamentos 1:N (Foreign Keys)

| Tabela Filho | Tabela Pai | Cardinalidade | ON DELETE |
|--------------|------------|---------------|-----------|
| tb_users | tb_empresas | N:1 | SET NULL |
| tb_users | tb_perfis | N:1 | SET NULL |
| tb_oauth_providers | tb_users | N:1 | CASCADE |
| tb_sessions | tb_users | N:1 | CASCADE |
| tb_clinicas | tb_empresas | N:1 | CASCADE |
| tb_profissionais | tb_users | 1:1 | CASCADE |
| tb_profissionais | tb_clinicas | N:1 | SET NULL |
| tb_pacientes | tb_users | 1:1 | CASCADE |
| tb_procedimentos | tb_clinicas | N:1 | CASCADE |
| tb_agendamentos | tb_pacientes | N:1 | CASCADE |
| tb_agendamentos | tb_profissionais | N:1 | SET NULL |
| tb_agendamentos | tb_procedimentos | N:1 | SET NULL |
| tb_prontuarios | tb_pacientes | N:1 | CASCADE |
| tb_produtos | tb_fornecedores | N:1 | CASCADE |
| tb_pedidos | tb_users | N:1 | CASCADE |

### 4.2 Relacionamentos N:N

| Tabela Junção | Entidade 1 | Entidade 2 | Descrição |
|---------------|------------|------------|-----------|
| `tb_procedimentos_profissionais` | tb_procedimentos | tb_profissionais | Profissionais podem realizar múltiplos procedimentos; procedimentos podem ser feitos por múltiplos profissionais |

### 4.3 Self-Relationships

| Tabela | Campo FK | Tipo | Descrição |
|--------|----------|------|-----------|
| `tb_categorias_produtos` | id_categoria_pai | Hierarquia | Categorias podem ter subcategorias |
| `tb_mensagens_usuarios` | id_mensagem_pai | Thread | Mensagens podem ser respostas |

---

## 5. ÍNDICES E PERFORMANCE

### 5.1 Índices B-Tree (Padrão)

```sql
-- Busca por ID (Primary Keys automáticos)
-- Busca por Email
CREATE INDEX idx_users_email ON tb_users(nm_email);

-- Busca por Status
CREATE INDEX idx_agendamentos_status ON tb_agendamentos(ds_status);
CREATE INDEX idx_pedidos_status ON tb_pedidos(ds_status);

-- Busca por Data
CREATE INDEX idx_agendamentos_data ON tb_agendamentos(dt_agendamento);
CREATE INDEX idx_mensagens_criacao ON tb_mensagens_usuarios(dt_criacao DESC);

-- Busca por Foreign Key
CREATE INDEX idx_clinicas_empresa ON tb_clinicas(id_empresa);
CREATE INDEX idx_produtos_fornecedor ON tb_produtos(id_fornecedor);
```

### 5.2 Índices GIN (Full Text & Array)

```sql
-- Array Search
CREATE INDEX idx_profissionais_especialidades_gin
  ON tb_profissionais USING GIN(ds_especialidades);

CREATE INDEX idx_clinicas_especialidades_gin
  ON tb_clinicas USING GIN(ds_especialidades);

CREATE INDEX idx_produtos_tags_gin
  ON tb_produtos USING GIN(ds_tags);

-- JSONB Search
CREATE INDEX idx_analytics_events_data
  ON tb_analytics_events USING GIN(ds_event_data);
```

### 5.3 Índices Compostos

```sql
-- Profissional + Data (para agenda)
CREATE INDEX idx_agendamentos_prof_data
  ON tb_agendamentos(id_profissional, dt_agendamento);

-- Usuário + Tipo de evento + Data (analytics)
CREATE INDEX idx_analytics_user_event_date
  ON tb_analytics_events(id_user, nm_event_type, dt_event DESC);
```

---

## 6. PADRÕES DE AUDITORIA

### 6.1 Campos de Auditoria (Todas as Tabelas)

```sql
dt_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
dt_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

### 6.2 Trigger Automático para dt_atualizacao

```sql
-- Função PL/pgSQL
CREATE OR REPLACE FUNCTION update_dt_atualizacao()
RETURNS TRIGGER AS $$
BEGIN
    NEW.dt_atualizacao = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger aplicado em todas as tabelas
CREATE TRIGGER trigger_update_dt_atualizacao
BEFORE UPDATE ON tb_users
FOR EACH ROW
EXECUTE FUNCTION update_dt_atualizacao();

-- (Repetir para todas as 62 tabelas)
```

### 6.3 Soft Delete Pattern

```sql
-- Campos de Soft Delete
st_ativo BOOLEAN DEFAULT true,
st_deletada BOOLEAN DEFAULT false,
dt_deletada TIMESTAMP
```

### 6.4 Audit Log Completo

```sql
CREATE TABLE tb_atividades (
    id_atividade UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_user UUID REFERENCES tb_users(id_user),
    id_empresa UUID REFERENCES tb_empresas(id_empresa),
    ds_tipo VARCHAR(50), -- CREATE, UPDATE, DELETE, LOGIN
    ds_entidade VARCHAR(50), -- nome da tabela
    id_entidade UUID, -- ID do registro afetado
    ds_acao TEXT,
    ds_dados_antes JSONB,
    ds_dados_depois JSONB,
    ds_ip VARCHAR(45), -- IPv6
    ds_origem VARCHAR(20), -- web, mobile, api
    dt_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_atividades_user ON tb_atividades(id_user);
CREATE INDEX idx_atividades_entidade ON tb_atividades(ds_entidade, id_entidade);
CREATE INDEX idx_atividades_tipo ON tb_atividades(ds_tipo);
```

---

## 7. ENUMS E TIPOS

### 7.1 Enums PostgreSQL

```sql
-- Tipo de Usuário
CREATE TYPE enum_tipo_usuario AS ENUM (
    'cliente',
    'profissional',
    'fornecedor',
    'admin'
);

-- Status de Agendamento
CREATE TYPE enum_status_agendamento AS ENUM (
    'pendente',
    'confirmado',
    'em_andamento',
    'concluido',
    'cancelado'
);
```

### 7.2 Tipos JSONB

#### Exemplo: `ds_permissoes` (tb_perfis)
```json
{
  "clinicas": {
    "criar": true,
    "editar": true,
    "deletar": false,
    "ver_todas": true
  },
  "agendamentos": {
    "criar": true,
    "editar_proprios": true,
    "editar_todos": false,
    "deletar": false
  },
  "financeiro": {
    "visualizar": true,
    "editar": false
  },
  "full_access": false
}
```

#### Exemplo: `ds_features` (tb_plans)
```json
{
  "rag": true,
  "custom_tools": true,
  "api_access": false,
  "whatsapp_integration": true,
  "advanced_analytics": false,
  "white_label": false
}
```

#### Exemplo: `ds_quotas` (tb_plans)
```json
{
  "max_agents": 10,
  "max_messages_per_month": 1000,
  "max_document_stores": 5,
  "max_storage_gb": 50,
  "max_users": 100
}
```

---

## 8. MODELO ER VISUAL

### 8.1 Diagrama Principal - Domínios Core

```
┌─────────────────────────────────────────────────────────────────┐
│                       DOMÍNIO CORE                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐                                               │
│  │ tb_empresas │◄──────────┐                                   │
│  └─────┬───────┘           │                                   │
│        │ 1:N               │ N:1                               │
│        ▼                   │                                   │
│  ┌─────────────┐      ┌────┴──────┐      ┌──────────────┐    │
│  │ tb_clinicas │      │ tb_users  │─────►│ tb_perfis    │    │
│  └─────┬───────┘      └────┬──────┘ N:1  └──────────────┘    │
│        │ 1:N               │                                   │
│        │                   ├─────► tb_oauth_providers (1:N)   │
│        │                   ├─────► tb_sessions (1:N)          │
│        │                   └─────► tb_api_keys (1:N)          │
│        │                                                        │
└────────┼────────────────────────────────────────────────────────┘
         │
         │
┌────────┼────────────────────────────────────────────────────────┐
│        │          DOMÍNIO AGENDAMENTO                           │
├────────┴────────────────────────────────────────────────────────┤
│        │                                                         │
│        ▼ 1:N                                                    │
│  ┌────────────────┐      ┌──────────────────┐                 │
│  │tb_profissionais│◄─────┤tb_procedimentos  │                 │
│  └───┬────────────┘  N:N └──────────────────┘                 │
│      │ 1:1                      │                               │
│      │ (tb_users)               │ N:N via                      │
│      │                          │ tb_procedimentos_profissionais│
│      │ 1:N                      │                               │
│      ▼                          ▼                               │
│  ┌────────────────────────────────────┐                        │
│  │      tb_agendamentos               │                        │
│  │  - id_profissional (FK)            │                        │
│  │  - id_procedimento (FK)            │                        │
│  │  - id_paciente (FK)                │                        │
│  │  - dt_agendamento                  │                        │
│  │  - ds_status (ENUM)                │                        │
│  └────────────────────────────────────┘                        │
│      │ 1:1                                                      │
│      ▼                                                          │
│  ┌────────────────┐                                            │
│  │ tb_prontuarios │                                            │
│  └────────────────┘                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   DOMÍNIO MARKETPLACE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐                                           │
│  │tb_fornecedores  │                                           │
│  └────┬────────────┘                                           │
│       │ 1:N                                                    │
│       ▼                                                         │
│  ┌─────────────────┐                                           │
│  │  tb_produtos    │──────► tb_categorias_produtos (N:1)      │
│  └────┬────────────┘                                           │
│       │ 1:N                                                    │
│       ├────► tb_produto_variacoes                             │
│       └────► tb_avaliacoes_produtos                           │
│                                                                 │
│       │ N:1                                                    │
│       ▼                                                         │
│  ┌─────────────────┐                                           │
│  │  tb_carrinho    │──────► tb_users (N:1)                    │
│  └─────────────────┘                                           │
│       │ conversão                                              │
│       ▼                                                         │
│  ┌─────────────────┐                                           │
│  │  tb_pedidos     │──────► tb_users (N:1)                    │
│  └────┬────────────┘                                           │
│       │ 1:N                                                    │
│       └────► tb_itens_pedido                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     DOMÍNIO MENSAGENS                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────────────────┐                                    │
│  │ tb_conversas_usuarios  │                                    │
│  └────┬───────────────────┘                                    │
│       │ 1:N                                                    │
│       ├────► tb_participantes_conversa (N:N com tb_users)     │
│       │                                                         │
│       │ 1:N                                                    │
│       └────► tb_mensagens_usuarios                             │
│                   │                                             │
│                   ├────► tb_anexos_mensagens (1:N)            │
│                   └────► tb_leitura_mensagens (1:N)           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        DOMÍNIO IA                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐                                               │
│  │ tb_agentes  │──────► tb_empresas (N:1)                     │
│  └─────┬───────┘                                               │
│        │ 1:N                                                   │
│        ▼                                                        │
│  ┌────────────────┐                                            │
│  │ tb_conversas   │──────► tb_users (N:1)                     │
│  └────┬───────────┘                                            │
│       │ 1:N                                                    │
│       ▼                                                         │
│  ┌────────────────┐                                            │
│  │ tb_messages    │                                            │
│  └────────────────┘                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. RESUMO EXECUTIVO

### 9.1 Totais por Domínio

| Domínio | Tabelas | % Total |
|---------|---------|---------|
| Core (Auth) | 5 | 8% |
| Organizacional | 2 | 3% |
| Profissionais & Pacientes | 2 | 3% |
| Agendamento & Procedimentos | 6 | 10% |
| Prontuários & Avaliações | 2 | 3% |
| Marketplace | 5 | 8% |
| Vendas | 6 | 10% |
| Mensagens | 8 | 13% |
| Galeria & Favoritos | 8 | 13% |
| Notificações & Sistema | 9 | 15% |
| Billing | 3 | 5% |
| IA | 3 | 5% |
| Analytics | 2 | 3% |
| **TOTAL** | **62** | **100%** |

### 9.2 Características Técnicas

✅ **Multi-tenant:** Via tb_empresas (tenant isolation)
✅ **Soft Delete:** Implementado com st_ativo, st_deletada
✅ **Auditoria:** dt_criacao, dt_atualizacao em todas as tabelas
✅ **Audit Log:** tb_atividades com JSONB para before/after
✅ **Normalização:** 3NF (Third Normal Form)
✅ **UUIDs:** Todas as PKs usam UUID v4
✅ **Indexes:** 100+ índices para performance
✅ **Constraints:** Unique, Check, Foreign Key com ON DELETE
✅ **JSONB:** Usado para dados flexíveis (config, metadata, permissions)
✅ **Arrays:** TEXT[] para tags, especialidades, fotos
✅ **Enums:** 2 enums PostgreSQL nativos
✅ **Views:** 5 views materializadas para agregações
✅ **Triggers:** 50+ triggers para auto-update
✅ **Full Text Search:** Preparado com GIN indexes

---

## 10. PRÓXIMOS PASSOS

### 10.1 Otimizações Recomendadas

1. **Particionamento de Tabelas**
   - `tb_mensagens_usuarios` por data (partições mensais)
   - `tb_analytics_events` por data (partições semanais)
   - `tb_atividades` por data (partições mensais)

2. **Materialized Views**
   - Dashboard de métricas (atualização diária)
   - Ranking de profissionais (atualização horária)
   - Estatísticas de produtos (atualização diária)

3. **Replica Read**
   - Separar queries de leitura (relatórios) da master
   - Usar read-replicas para analytics pesados

### 10.2 Expansões Futuras

- [ ] Tabela de Webhooks para integrações
- [ ] Tabela de Logs de API (separada de atividades)
- [ ] Tabela de Backups automatizados
- [ ] Tabela de Feature Flags
- [ ] Tabela de AB Tests
- [ ] Tabela de Surveys/Pesquisas expandida

---

**Documentação gerada em:** 01/11/2025
**Revisão:** v1.0
**Próxima atualização:** Após implementação de novas features
