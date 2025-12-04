# 📋 Planejamento Completo - Backend DoctorQ

> **Objetivo**: Migrar de dados mock para backend completo com PostgreSQL, criar todas as tabelas necessárias e implementar APIs RESTful.

---

## 📊 1. ANÁLISE DAS FUNCIONALIDADES EXISTENTES

### 1.1 Áreas do Sistema
- **Paciente/Cliente**: 15 páginas
- **Profissional**: 13 páginas
- **Fornecedor**: 15 páginas
- **Administrador**: 22 páginas
- **Público**: Marketplace, busca, procedimentos

### 1.2 Dados Mock Identificados
Cada área utiliza dados simulados que precisam ser migrados para o banco:
- Usuários (clientes, profissionais, fornecedores, admins)
- Procedimentos e serviços
- Produtos e catálogo
- Agendamentos
- Avaliações e reviews
- Mensagens e conversas
- Pedidos e transações
- Financeiro (pagamentos, faturas, repasses)
- Categorias
- Notificações
- Logs do sistema

---

## 🗄️ 2. ESTRUTURA DO BANCO DE DADOS

### 2.1 Modelo Entidade-Relacionamento

```
┌─────────────────────────────────────────────────────────────────┐
│                     USUÁRIOS E AUTENTICAÇÃO                     │
└─────────────────────────────────────────────────────────────────┘

tb_users (já existe parcialmente)
├── id_user (UUID, PK)
├── nm_completo (VARCHAR)
├── nm_email (VARCHAR, UNIQUE)
├── nm_senha_hash (VARCHAR)
├── ds_foto_url (TEXT)
├── nr_telefone (VARCHAR)
├── ds_endereco (TEXT)
├── ds_cidade (VARCHAR)
├── ds_estado (VARCHAR)
├── nr_cep (VARCHAR)
├── nm_tipo_usuario (ENUM: 'cliente', 'profissional', 'fornecedor', 'admin')
├── st_ativo (BOOLEAN)
├── dt_criacao (TIMESTAMP)
├── dt_atualizacao (TIMESTAMP)
└── dt_ultimo_login (TIMESTAMP)

tb_oauth_providers (para login social)
├── id_oauth (UUID, PK)
├── id_user (UUID, FK -> tb_users)
├── nm_provider (VARCHAR: 'google', 'facebook', 'apple')
├── ds_provider_id (VARCHAR)
├── ds_access_token (TEXT)
├── ds_refresh_token (TEXT)
├── dt_token_expira (TIMESTAMP)
└── dt_criacao (TIMESTAMP)

tb_sessions
├── id_session (UUID, PK)
├── id_user (UUID, FK -> tb_users)
├── ds_token (VARCHAR, UNIQUE)
├── ds_ip (VARCHAR)
├── ds_user_agent (TEXT)
├── dt_expira (TIMESTAMP)
└── dt_criacao (TIMESTAMP)

┌─────────────────────────────────────────────────────────────────┐
│                    PERFIS ESPECÍFICOS                           │
└─────────────────────────────────────────────────────────────────┘

tb_profissionais
├── id_profissional (UUID, PK)
├── id_user (UUID, FK -> tb_users)
├── ds_especialidade (VARCHAR)
├── nr_registro_profissional (VARCHAR)
├── ds_biografia (TEXT)
├── nr_anos_experiencia (INTEGER)
├── vl_valor_hora (DECIMAL)
├── ds_formacao (TEXT)
├── nr_avaliacao_media (DECIMAL)
├── nr_total_avaliacoes (INTEGER)
├── nr_total_atendimentos (INTEGER)
├── st_verificado (BOOLEAN)
└── dt_criacao (TIMESTAMP)

tb_fornecedores
├── id_fornecedor (UUID, PK)
├── id_user (UUID, FK -> tb_users)
├── nm_empresa (VARCHAR)
├── nr_cnpj (VARCHAR, UNIQUE)
├── ds_razao_social (VARCHAR)
├── ds_descricao (TEXT)
├── ds_site (VARCHAR)
├── nr_avaliacao_media (DECIMAL)
├── nr_total_vendas (INTEGER)
├── st_verificado (BOOLEAN)
└── dt_criacao (TIMESTAMP)

┌─────────────────────────────────────────────────────────────────┐
│                    PROCEDIMENTOS E PRODUTOS                     │
└─────────────────────────────────────────────────────────────────┘

tb_categorias_procedimentos
├── id_categoria (UUID, PK)
├── nm_categoria (VARCHAR)
├── ds_descricao (TEXT)
├── ds_icone (VARCHAR)
├── nr_ordem (INTEGER)
└── st_ativo (BOOLEAN)

tb_procedimentos
├── id_procedimento (UUID, PK)
├── id_categoria (UUID, FK -> tb_categorias_procedimentos)
├── nm_procedimento (VARCHAR)
├── ds_descricao (TEXT)
├── ds_detalhes (TEXT)
├── vl_preco_base (DECIMAL)
├── nr_duracao_minutos (INTEGER)
├── ds_imagem_url (TEXT)
├── ds_preparacao (TEXT)
├── ds_recuperacao (TEXT)
├── nr_views (INTEGER)
├── st_ativo (BOOLEAN)
├── dt_criacao (TIMESTAMP)
└── dt_atualizacao (TIMESTAMP)

tb_procedimentos_profissionais (N:N)
├── id (UUID, PK)
├── id_procedimento (UUID, FK -> tb_procedimentos)
├── id_profissional (UUID, FK -> tb_profissionais)
├── vl_preco (DECIMAL)
├── nr_duracao_minutos (INTEGER)
├── st_disponivel (BOOLEAN)
└── dt_criacao (TIMESTAMP)

tb_categorias_produtos
├── id_categoria (UUID, PK)
├── nm_categoria (VARCHAR)
├── ds_descricao (TEXT)
├── ds_icone (VARCHAR)
├── nr_ordem (INTEGER)
└── st_ativo (BOOLEAN)

tb_produtos
├── id_produto (UUID, PK)
├── id_categoria (UUID, FK -> tb_categorias_produtos)
├── id_fornecedor (UUID, FK -> tb_fornecedores)
├── nm_produto (VARCHAR)
├── ds_descricao (TEXT)
├── ds_ingredientes (TEXT)
├── ds_modo_uso (TEXT)
├── vl_preco (DECIMAL)
├── nr_estoque (INTEGER)
├── nr_estoque_minimo (INTEGER)
├── ds_sku (VARCHAR, UNIQUE)
├── ds_imagem_url (TEXT)
├── nr_avaliacao_media (DECIMAL)
├── nr_total_vendas (INTEGER)
├── st_ativo (BOOLEAN)
├── dt_criacao (TIMESTAMP)
└── dt_atualizacao (TIMESTAMP)

┌─────────────────────────────────────────────────────────────────┐
│                      AGENDAMENTOS                               │
└─────────────────────────────────────────────────────────────────┘

tb_agendamentos
├── id_agendamento (UUID, PK)
├── id_cliente (UUID, FK -> tb_users)
├── id_profissional (UUID, FK -> tb_profissionais)
├── id_procedimento (UUID, FK -> tb_procedimentos)
├── dt_agendamento (TIMESTAMP)
├── nr_duracao_minutos (INTEGER)
├── vl_valor (DECIMAL)
├── ds_observacoes (TEXT)
├── ds_status (ENUM: 'pendente', 'confirmado', 'em_andamento', 'concluido', 'cancelado')
├── ds_local (VARCHAR)
├── ds_endereco (TEXT)
├── dt_criacao (TIMESTAMP)
├── dt_atualizacao (TIMESTAMP)
└── dt_cancelamento (TIMESTAMP)

tb_horarios_disponiveis
├── id_horario (UUID, PK)
├── id_profissional (UUID, FK -> tb_profissionais)
├── nr_dia_semana (INTEGER: 0-6)
├── hr_inicio (TIME)
├── hr_fim (TIME)
├── st_ativo (BOOLEAN)
└── dt_criacao (TIMESTAMP)

tb_bloqueios_agenda
├── id_bloqueio (UUID, PK)
├── id_profissional (UUID, FK -> tb_profissionais)
├── dt_inicio (TIMESTAMP)
├── dt_fim (TIMESTAMP)
├── ds_motivo (VARCHAR)
└── dt_criacao (TIMESTAMP)

┌─────────────────────────────────────────────────────────────────┐
│                      PEDIDOS E VENDAS                           │
└─────────────────────────────────────────────────────────────────┘

tb_pedidos
├── id_pedido (UUID, PK)
├── nr_pedido (VARCHAR, UNIQUE) -- PED-001
├── id_cliente (UUID, FK -> tb_users)
├── id_fornecedor (UUID, FK -> tb_fornecedores)
├── vl_subtotal (DECIMAL)
├── vl_frete (DECIMAL)
├── vl_desconto (DECIMAL)
├── vl_total (DECIMAL)
├── ds_status (ENUM: 'pendente', 'pago', 'processando', 'enviado', 'entregue', 'cancelado')
├── ds_codigo_rastreio (VARCHAR)
├── dt_pagamento (TIMESTAMP)
├── dt_envio (TIMESTAMP)
├── dt_entrega (TIMESTAMP)
├── dt_criacao (TIMESTAMP)
└── dt_atualizacao (TIMESTAMP)

tb_itens_pedido
├── id_item (UUID, PK)
├── id_pedido (UUID, FK -> tb_pedidos)
├── id_produto (UUID, FK -> tb_produtos)
├── qt_quantidade (INTEGER)
├── vl_unitario (DECIMAL)
├── vl_total (DECIMAL)
└── dt_criacao (TIMESTAMP)

tb_carrinho
├── id_item (UUID, PK)
├── id_user (UUID, FK -> tb_users)
├── id_produto (UUID, FK -> tb_produtos) [NULL para procedimentos]
├── id_procedimento (UUID, FK -> tb_procedimentos) [NULL para produtos]
├── qt_quantidade (INTEGER)
├── dt_adicionado (TIMESTAMP)
└── dt_atualizacao (TIMESTAMP)

┌─────────────────────────────────────────────────────────────────┐
│                      FINANCEIRO                                 │
└─────────────────────────────────────────────────────────────────┘

tb_transacoes
├── id_transacao (UUID, PK)
├── nr_transacao (VARCHAR, UNIQUE) -- TRX-001
├── id_user (UUID, FK -> tb_users)
├── ds_tipo (ENUM: 'entrada', 'saida', 'estorno')
├── ds_categoria (ENUM: 'agendamento', 'produto', 'repasse', 'taxa_plataforma')
├── vl_valor (DECIMAL)
├── ds_descricao (TEXT)
├── ds_status (ENUM: 'pendente', 'processando', 'concluido', 'cancelado', 'estornado')
├── ds_metodo_pagamento (ENUM: 'credito', 'debito', 'pix', 'boleto')
├── id_referencia (UUID) -- ID do pedido ou agendamento
├── dt_criacao (TIMESTAMP)
├── dt_processamento (TIMESTAMP)
└── dt_conclusao (TIMESTAMP)

tb_faturas
├── id_fatura (UUID, PK)
├── nr_fatura (VARCHAR, UNIQUE) -- FAT-001
├── id_user (UUID, FK -> tb_users)
├── vl_total (DECIMAL)
├── dt_vencimento (DATE)
├── dt_pagamento (TIMESTAMP)
├── ds_status (ENUM: 'pendente', 'pago', 'vencido', 'cancelado')
├── ds_url_boleto (TEXT)
└── dt_criacao (TIMESTAMP)

tb_repasses
├── id_repasse (UUID, PK)
├── id_profissional (UUID, FK -> tb_profissionais) [NULL para fornecedor]
├── id_fornecedor (UUID, FK -> tb_fornecedores) [NULL para profissional]
├── vl_bruto (DECIMAL)
├── vl_taxa_plataforma (DECIMAL)
├── vl_liquido (DECIMAL)
├── ds_status (ENUM: 'pendente', 'processando', 'concluido')
├── dt_previsao (DATE)
├── dt_processamento (TIMESTAMP)
└── dt_criacao (TIMESTAMP)

┌─────────────────────────────────────────────────────────────────┐
│                      AVALIAÇÕES                                 │
└─────────────────────────────────────────────────────────────────┘

tb_avaliacoes
├── id_avaliacao (UUID, PK)
├── id_user (UUID, FK -> tb_users) -- quem avaliou
├── id_profissional (UUID, FK -> tb_profissionais) [NULL se for produto]
├── id_produto (UUID, FK -> tb_produtos) [NULL se for profissional]
├── id_agendamento (UUID, FK -> tb_agendamentos) [NULL se for produto]
├── id_pedido (UUID, FK -> tb_pedidos) [NULL se for profissional]
├── nr_nota (INTEGER: 1-5)
├── ds_comentario (TEXT)
├── ds_pontos_positivos (TEXT)
├── ds_pontos_negativos (TEXT)
├── st_aprovado (BOOLEAN)
├── st_reportado (BOOLEAN)
├── dt_criacao (TIMESTAMP)
└── dt_moderacao (TIMESTAMP)

┌─────────────────────────────────────────────────────────────────┐
│                      MENSAGENS                                  │
└─────────────────────────────────────────────────────────────────┘

tb_conversas
├── id_conversa (UUID, PK)
├── id_user_1 (UUID, FK -> tb_users)
├── id_user_2 (UUID, FK -> tb_users)
├── ds_assunto (VARCHAR)
├── dt_ultima_mensagem (TIMESTAMP)
├── st_arquivada (BOOLEAN)
├── st_reportada (BOOLEAN)
└── dt_criacao (TIMESTAMP)

tb_mensagens
├── id_mensagem (UUID, PK)
├── id_conversa (UUID, FK -> tb_conversas)
├── id_remetente (UUID, FK -> tb_users)
├── ds_mensagem (TEXT)
├── ds_anexo_url (TEXT)
├── st_lida (BOOLEAN)
├── dt_leitura (TIMESTAMP)
└── dt_criacao (TIMESTAMP)

┌─────────────────────────────────────────────────────────────────┐
│                      FAVORITOS E GALERIA                        │
└─────────────────────────────────────────────────────────────────┘

tb_favoritos
├── id_favorito (UUID, PK)
├── id_user (UUID, FK -> tb_users)
├── id_procedimento (UUID, FK -> tb_procedimentos) [NULL se for produto]
├── id_produto (UUID, FK -> tb_produtos) [NULL se for procedimento]
├── id_profissional (UUID, FK -> tb_profissionais)
└── dt_criacao (TIMESTAMP)

tb_fotos_antes_depois
├── id_foto (UUID, PK)
├── id_profissional (UUID, FK -> tb_profissionais)
├── id_cliente (UUID, FK -> tb_users)
├── id_procedimento (UUID, FK -> tb_procedimentos)
├── ds_url_antes (TEXT)
├── ds_url_depois (TEXT)
├── ds_descricao (TEXT)
├── st_publica (BOOLEAN)
├── st_aprovada (BOOLEAN)
└── dt_criacao (TIMESTAMP)

tb_galeria_profissional
├── id_galeria (UUID, PK)
├── id_profissional (UUID, FK -> tb_profissionais)
├── ds_url_imagem (TEXT)
├── ds_titulo (VARCHAR)
├── ds_descricao (TEXT)
├── nr_ordem (INTEGER)
└── dt_criacao (TIMESTAMP)

┌─────────────────────────────────────────────────────────────────┐
│                      NOTIFICAÇÕES E SISTEMA                     │
└─────────────────────────────────────────────────────────────────┘

tb_notificacoes
├── id_notificacao (UUID, PK)
├── id_user (UUID, FK -> tb_users)
├── ds_titulo (VARCHAR)
├── ds_mensagem (TEXT)
├── ds_tipo (ENUM: 'info', 'sucesso', 'alerta', 'erro')
├── ds_categoria (VARCHAR)
├── ds_link (TEXT)
├── st_lida (BOOLEAN)
├── dt_leitura (TIMESTAMP)
└── dt_criacao (TIMESTAMP)

tb_notificacoes_push (para broadcast)
├── id_push (UUID, PK)
├── ds_titulo (VARCHAR)
├── ds_mensagem (TEXT)
├── ds_destinatarios (ENUM: 'todos', 'clientes', 'profissionais', 'fornecedores')
├── dt_envio_agendado (TIMESTAMP)
├── ds_status (ENUM: 'rascunho', 'agendado', 'enviado')
├── nr_total_destinatarios (INTEGER)
├── nr_visualizacoes (INTEGER)
└── dt_criacao (TIMESTAMP)

tb_cupons
├── id_cupom (UUID, PK)
├── ds_codigo (VARCHAR, UNIQUE)
├── ds_descricao (VARCHAR)
├── nr_percentual_desconto (DECIMAL) [NULL se for valor fixo]
├── vl_desconto_fixo (DECIMAL) [NULL se for percentual]
├── vl_minimo_compra (DECIMAL)
├── nr_usos_maximos (INTEGER)
├── nr_usos_atuais (INTEGER)
├── dt_inicio (DATE)
├── dt_fim (DATE)
├── st_ativo (BOOLEAN)
└── dt_criacao (TIMESTAMP)

tb_logs_sistema
├── id_log (UUID, PK)
├── ds_tipo (ENUM: 'info', 'warning', 'error', 'critical')
├── ds_categoria (VARCHAR)
├── ds_mensagem (TEXT)
├── ds_detalhes (JSONB)
├── id_user (UUID, FK -> tb_users) [NULL se for sistema]
├── ds_ip (VARCHAR)
├── ds_user_agent (TEXT)
└── dt_criacao (TIMESTAMP)

tb_configuracoes (já existe)
├── id_configuracao (UUID, PK)
├── nm_chave (VARCHAR, UNIQUE)
├── ds_valor (TEXT)
├── ds_tipo (VARCHAR)
├── ds_categoria (VARCHAR)
├── ds_descricao (TEXT)
├── st_criptografado (BOOLEAN)
└── st_ativo (BOOLEAN)

┌─────────────────────────────────────────────────────────────────┐
│                      PRONTUÁRIOS (PROFISSIONAL)                 │
└─────────────────────────────────────────────────────────────────┘

tb_prontuarios
├── id_prontuario (UUID, PK)
├── id_cliente (UUID, FK -> tb_users)
├── id_profissional (UUID, FK -> tb_profissionais)
└── dt_criacao (TIMESTAMP)

tb_anamneses
├── id_anamnese (UUID, PK)
├── id_prontuario (UUID, FK -> tb_prontuarios)
├── ds_queixa_principal (TEXT)
├── ds_historico_doencas (TEXT)
├── ds_medicamentos_uso (TEXT)
├── ds_alergias (TEXT)
├── ds_cirurgias_previas (TEXT)
├── ds_habitos (TEXT)
├── ds_objetivos (TEXT)
└── dt_criacao (TIMESTAMP)

tb_evolucoes_prontuario
├── id_evolucao (UUID, PK)
├── id_prontuario (UUID, FK -> tb_prontuarios)
├── id_agendamento (UUID, FK -> tb_agendamentos)
├── ds_evolucao (TEXT)
├── ds_conduta (TEXT)
├── ds_observacoes (TEXT)
└── dt_criacao (TIMESTAMP)

┌─────────────────────────────────────────────────────────────────┐
│                      CERTIFICADOS                               │
└─────────────────────────────────────────────────────────────────┘

tb_certificados
├── id_certificado (UUID, PK)
├── id_profissional (UUID, FK -> tb_profissionais)
├── nm_certificado (VARCHAR)
├── ds_instituicao (VARCHAR)
├── nr_ano_conclusao (INTEGER)
├── ds_url_arquivo (TEXT)
├── st_verificado (BOOLEAN)
└── dt_criacao (TIMESTAMP)
```

---

## 📝 3. MIGRATIONS

### 3.1 Ordem de Criação das Migrations

```bash
001_create_users_and_auth.sql          # Usuários base + OAuth + Sessions
002_create_profiles.sql                # Profissionais e Fornecedores
003_create_categories.sql              # Categorias de procedimentos e produtos
004_create_procedures_products.sql     # Procedimentos e Produtos
005_create_appointments.sql            # Agendamentos e horários
006_create_orders.sql                  # Pedidos e carrinho
007_create_financial.sql               # Transações, faturas, repasses
008_create_reviews.sql                 # Avaliações
009_create_messages.sql                # Conversas e mensagens
010_create_favorites_gallery.sql       # Favoritos e galeria
011_create_notifications.sql           # Notificações e cupons
012_create_medical_records.sql         # Prontuários e anamneses
013_create_certificates.sql            # Certificados
014_create_system.sql                  # Logs e configurações
015_create_indexes.sql                 # Índices para performance
016_create_functions_triggers.sql      # Functions e Triggers
```

### 3.2 Exemplo de Migration

```sql
-- 001_create_users_and_auth.sql
-- Criação das tabelas de usuários e autenticação

-- Tipos enumerados
CREATE TYPE tipo_usuario AS ENUM ('cliente', 'profissional', 'fornecedor', 'admin');
CREATE TYPE oauth_provider AS ENUM ('google', 'facebook', 'apple', 'microsoft');

-- Tabela principal de usuários
CREATE TABLE tb_users (
    id_user UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nm_completo VARCHAR(255) NOT NULL,
    nm_email VARCHAR(255) UNIQUE NOT NULL,
    nm_senha_hash VARCHAR(255), -- NULL para OAuth
    ds_foto_url TEXT,
    nr_telefone VARCHAR(20),
    ds_endereco TEXT,
    ds_cidade VARCHAR(100),
    ds_estado VARCHAR(2),
    nr_cep VARCHAR(10),
    nm_tipo_usuario tipo_usuario NOT NULL DEFAULT 'cliente',
    st_ativo BOOLEAN DEFAULT true,
    nr_total_logins INTEGER DEFAULT 0,
    dt_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dt_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dt_ultimo_login TIMESTAMP
);

-- OAuth providers
CREATE TABLE tb_oauth_providers (
    id_oauth UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_user UUID NOT NULL REFERENCES tb_users(id_user) ON DELETE CASCADE,
    nm_provider oauth_provider NOT NULL,
    ds_provider_id VARCHAR(255) NOT NULL,
    ds_access_token TEXT,
    ds_refresh_token TEXT,
    dt_token_expira TIMESTAMP,
    dt_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(nm_provider, ds_provider_id)
);

-- Sessions
CREATE TABLE tb_sessions (
    id_session UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_user UUID NOT NULL REFERENCES tb_users(id_user) ON DELETE CASCADE,
    ds_token VARCHAR(500) UNIQUE NOT NULL,
    ds_ip VARCHAR(45),
    ds_user_agent TEXT,
    dt_expira TIMESTAMP NOT NULL,
    dt_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_users_email ON tb_users(nm_email);
CREATE INDEX idx_users_tipo ON tb_users(nm_tipo_usuario);
CREATE INDEX idx_sessions_token ON tb_sessions(ds_token);
CREATE INDEX idx_sessions_user ON tb_sessions(id_user);

-- Comentários
COMMENT ON TABLE tb_users IS 'Tabela principal de usuários do sistema';
COMMENT ON COLUMN tb_users.nm_senha_hash IS 'Hash bcrypt da senha, NULL para login OAuth';
```

---

## 🌱 4. SEEDS - POPULAÇÃO DE DADOS

### 4.1 Ordem de População

```bash
001_seed_users.sql                  # Usuários de exemplo
002_seed_professionals.sql          # Profissionais
003_seed_suppliers.sql              # Fornecedores
004_seed_categories.sql             # Categorias
005_seed_procedures.sql             # Procedimentos
006_seed_products.sql               # Produtos
007_seed_appointments.sql           # Agendamentos
008_seed_orders.sql                 # Pedidos
009_seed_reviews.sql                # Avaliações
010_seed_configurations.sql         # Configurações do sistema
```

### 4.2 Exemplo de Seed

```sql
-- 001_seed_users.sql
-- População de usuários de exemplo

-- Admin
INSERT INTO tb_users (
    nm_completo,
    nm_email,
    nm_senha_hash,
    nm_tipo_usuario,
    ds_foto_url
) VALUES (
    'Administrador Sistema',
    'admin@doctorq.com',
    '$2b$10$YourHashedPasswordHere', -- senha: admin123
    'admin',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=admin'
);

-- Clientes
INSERT INTO tb_users (nm_completo, nm_email, nm_senha_hash, nm_tipo_usuario, nr_telefone, ds_cidade, ds_estado) VALUES
    ('Maria Silva', 'maria.silva@email.com', '$2b$10$hash1', 'cliente', '(11) 98765-4321', 'São Paulo', 'SP'),
    ('João Santos', 'joao.santos@email.com', '$2b$10$hash2', 'cliente', '(21) 98765-4322', 'Rio de Janeiro', 'RJ'),
    ('Ana Costa', 'ana.costa@email.com', '$2b$10$hash3', 'cliente', '(31) 98765-4323', 'Belo Horizonte', 'MG');

-- Profissionais (serão linkados na próxima seed)
INSERT INTO tb_users (nm_completo, nm_email, nm_senha_hash, nm_tipo_usuario, nr_telefone) VALUES
    ('Dra. Ana Paula Rodrigues', 'ana.rodrigues@doctorq.com', '$2b$10$hash4', 'profissional', '(11) 99876-5432'),
    ('Dr. Carlos Mendes', 'carlos.mendes@doctorq.com', '$2b$10$hash5', 'profissional', '(11) 99876-5433'),
    ('Dra. Juliana Oliveira', 'juliana.oliveira@doctorq.com', '$2b$10$hash6', 'profissional', '(21) 99876-5434');

-- Fornecedores (serão linkados na próxima seed)
INSERT INTO tb_users (nm_completo, nm_email, nm_senha_hash, nm_tipo_usuario, nr_telefone) VALUES
    ('Beauty Supply Ltda', 'contato@beautysupply.com', '$2b$10$hash7', 'fornecedor', '(11) 3000-0001'),
    ('Cosméticos Premium', 'vendas@cosmeticospremium.com', '$2b$10$hash8', 'fornecedor', '(11) 3000-0002');
```

---

## 🔌 5. APIs A IMPLEMENTAR

### 5.1 Estrutura de Pastas Backend

```
estetiQ-api/
├── src/
│   ├── main.py
│   ├── config/
│   │   ├── database.py
│   │   ├── settings.py
│   │   └── redis.py
│   ├── models/
│   │   ├── user.py
│   │   ├── professional.py
│   │   ├── supplier.py
│   │   ├── procedure.py
│   │   ├── product.py
│   │   ├── appointment.py
│   │   ├── order.py
│   │   ├── review.py
│   │   └── ... (outros modelos)
│   ├── schemas/
│   │   ├── user_schema.py
│   │   ├── professional_schema.py
│   │   └── ... (Pydantic schemas)
│   ├── routes/
│   │   ├── auth.py
│   │   ├── users.py
│   │   ├── professionals.py
│   │   ├── procedures.py
│   │   ├── products.py
│   │   ├── appointments.py
│   │   ├── orders.py
│   │   ├── reviews.py
│   │   ├── messages.py
│   │   ├── financial.py
│   │   └── ... (outras rotas)
│   ├── services/
│   │   ├── auth_service.py
│   │   ├── user_service.py
│   │   ├── email_service.py
│   │   ├── payment_service.py
│   │   └── ... (lógica de negócio)
│   ├── middleware/
│   │   ├── auth.py
│   │   └── error_handler.py
│   └── utils/
│       ├── security.py
│       ├── validators.py
│       └── helpers.py
└── database/
    ├── migrations/
    │   ├── 001_create_users_and_auth.sql
    │   ├── 002_create_profiles.sql
    │   └── ...
    └── seeds/
        ├── 001_seed_users.sql
        ├── 002_seed_professionals.sql
        └── ...
```

### 5.2 APIs por Módulo

#### 5.2.1 Autenticação (`/auth`)
```
POST   /auth/register          - Cadastro de usuário
POST   /auth/login             - Login com email/senha
POST   /auth/oauth/google      - Login com Google
POST   /auth/oauth/facebook    - Login com Facebook
POST   /auth/refresh           - Renovar token
POST   /auth/logout            - Logout
POST   /auth/forgot-password   - Solicitar reset de senha
POST   /auth/reset-password    - Resetar senha
GET    /auth/me                - Dados do usuário logado
```

#### 5.2.2 Usuários (`/users`)
```
GET    /users                  - Listar usuários (admin)
GET    /users/:id              - Obter usuário
PUT    /users/:id              - Atualizar usuário
DELETE /users/:id              - Deletar usuário
PUT    /users/:id/photo        - Upload foto perfil
GET    /users/:id/stats        - Estatísticas do usuário
```

#### 5.2.3 Profissionais (`/professionals`)
```
GET    /professionals          - Listar profissionais (com filtros)
GET    /professionals/:id      - Obter profissional
PUT    /professionals/:id      - Atualizar profissional
GET    /professionals/:id/reviews        - Avaliações
GET    /professionals/:id/schedule       - Agenda
POST   /professionals/:id/schedule       - Criar horário
GET    /professionals/:id/appointments   - Agendamentos
GET    /professionals/:id/patients       - Pacientes
GET    /professionals/:id/financial      - Dados financeiros
GET    /professionals/:id/gallery        - Galeria de fotos
POST   /professionals/:id/gallery        - Upload foto galeria
```

#### 5.2.4 Procedimentos (`/procedures`)
```
GET    /procedures             - Listar procedimentos (público)
GET    /procedures/:id         - Detalhes do procedimento
POST   /procedures             - Criar procedimento (admin)
PUT    /procedures/:id         - Atualizar procedimento
DELETE /procedures/:id         - Deletar procedimento
GET    /procedures/categories  - Listar categorias
GET    /procedures/search      - Busca inteligente
GET    /procedures/:id/professionals  - Profissionais que fazem
```

#### 5.2.5 Produtos (`/products`)
```
GET    /products               - Listar produtos (marketplace)
GET    /products/:id           - Detalhes do produto
POST   /products               - Criar produto (fornecedor)
PUT    /products/:id           - Atualizar produto
DELETE /products/:id           - Deletar produto
GET    /products/categories    - Categorias de produtos
GET    /products/search        - Buscar produtos
```

#### 5.2.6 Agendamentos (`/appointments`)
```
GET    /appointments           - Listar agendamentos
POST   /appointments           - Criar agendamento
GET    /appointments/:id       - Detalhes do agendamento
PUT    /appointments/:id       - Atualizar agendamento
DELETE /appointments/:id       - Cancelar agendamento
PUT    /appointments/:id/confirm    - Confirmar agendamento
PUT    /appointments/:id/complete   - Concluir agendamento
```

#### 5.2.7 Pedidos (`/orders`)
```
GET    /orders                 - Listar pedidos
POST   /orders                 - Criar pedido
GET    /orders/:id             - Detalhes do pedido
PUT    /orders/:id/status      - Atualizar status
GET    /orders/:id/tracking    - Rastreamento
```

#### 5.2.8 Carrinho (`/cart`)
```
GET    /cart                   - Obter carrinho
POST   /cart/items             - Adicionar item
PUT    /cart/items/:id         - Atualizar quantidade
DELETE /cart/items/:id         - Remover item
DELETE /cart                   - Limpar carrinho
POST   /cart/checkout          - Finalizar compra
```

#### 5.2.9 Avaliações (`/reviews`)
```
GET    /reviews                - Listar avaliações
POST   /reviews                - Criar avaliação
GET    /reviews/:id            - Detalhes da avaliação
PUT    /reviews/:id/moderate   - Moderar avaliação (admin)
DELETE /reviews/:id            - Deletar avaliação
```

#### 5.2.10 Mensagens (`/messages`)
```
GET    /conversations          - Listar conversas
POST   /conversations          - Criar conversa
GET    /conversations/:id      - Detalhes da conversa
GET    /conversations/:id/messages  - Mensagens da conversa
POST   /conversations/:id/messages  - Enviar mensagem
PUT    /messages/:id/read      - Marcar como lida
```

#### 5.2.11 Financeiro (`/financial`)
```
GET    /financial/transactions      - Listar transações
GET    /financial/invoices          - Listar faturas
GET    /financial/transfers         - Listar repasses
GET    /financial/dashboard         - Dashboard financeiro
POST   /financial/payout            - Solicitar saque
```

#### 5.2.12 Notificações (`/notifications`)
```
GET    /notifications               - Listar notificações
PUT    /notifications/:id/read      - Marcar como lida
PUT    /notifications/read-all      - Marcar todas como lidas
DELETE /notifications/:id           - Deletar notificação
POST   /notifications/push          - Enviar notificação push (admin)
```

#### 5.2.13 Admin (`/admin`)
```
GET    /admin/stats                 - Estatísticas gerais
GET    /admin/logs                  - Logs do sistema
GET    /admin/users                 - Gestão de usuários
GET    /admin/reports               - Relatórios
POST   /admin/backup                - Gerar backup
GET    /admin/configurations        - Configurações
PUT    /admin/configurations/:key   - Atualizar configuração
```

---

## 🔐 6. SEGURANÇA E AUTENTICAÇÃO

### 6.1 JWT Strategy
```python
# Estrutura do Token JWT
{
    "sub": "user_id",
    "email": "user@email.com",
    "type": "cliente|profissional|fornecedor|admin",
    "exp": timestamp,
    "iat": timestamp
}
```

### 6.2 Middlewares
- **AuthMiddleware**: Validar JWT em rotas protegidas
- **RoleMiddleware**: Verificar permissões por tipo de usuário
- **RateLimitMiddleware**: Limitar requisições por IP/usuário
- **CORSMiddleware**: Configurar origens permitidas

### 6.3 Criptografia
- Senhas: `bcrypt` com salt rounds = 10
- Tokens: JWT com chave secreta rotativa
- Dados sensíveis: AES-256 para configurações

---

## 📦 7. DEPENDÊNCIAS DO BACKEND

### 7.1 Python Requirements
```txt
# Framework
fastapi==0.115.0
uvicorn[standard]==0.30.0
python-multipart==0.0.9

# Database
psycopg2-binary==2.9.9
sqlalchemy==2.0.31
alembic==1.13.2

# Authentication
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.9

# Validation
pydantic==2.8.2
pydantic-settings==2.4.0
email-validator==2.2.0

# Cache
redis==5.0.7
hiredis==2.3.2

# Storage
boto3==1.34.144  # AWS S3

# Email
python-dotenv==1.0.1
jinja2==3.1.4

# Utils
python-slugify==8.0.4
pillow==10.4.0
```

---

## 🚀 8. PLANO DE IMPLEMENTAÇÃO

### Fase 1: Fundação (Semana 1-2)
- [ ] Criar estrutura de pastas do backend
- [ ] Configurar FastAPI + PostgreSQL + Redis
- [ ] Implementar migrations 001-005 (usuários, perfis, categorias)
- [ ] Seeds básicos (usuários, categorias)
- [ ] API de autenticação completa
- [ ] Middleware de auth e permissões

### Fase 2: Core Business (Semana 3-4)
- [ ] Migrations 006-010 (procedimentos, produtos, agendamentos, pedidos)
- [ ] APIs de procedimentos e produtos
- [ ] APIs de agendamentos
- [ ] APIs de pedidos e carrinho
- [ ] Seeds para produtos e procedimentos

### Fase 3: Interações (Semana 5)
- [ ] Migrations 011-013 (avaliações, mensagens, favoritos)
- [ ] APIs de avaliações
- [ ] APIs de mensagens (WebSocket)
- [ ] APIs de favoritos e galeria

### Fase 4: Financeiro (Semana 6)
- [ ] Migration financeiro completa
- [ ] APIs de transações
- [ ] APIs de faturas e repasses
- [ ] Integração com gateway de pagamento

### Fase 5: Admin e Sistema (Semana 7)
- [ ] APIs de administração
- [ ] Sistema de logs
- [ ] Sistema de notificações
- [ ] Dashboard de métricas

### Fase 6: Integração Frontend (Semana 8-9)
- [ ] Remover dados mock do frontend
- [ ] Integrar todas as páginas com APIs
- [ ] Testes de integração
- [ ] Ajustes e correções

### Fase 7: Testes e Otimização (Semana 10)
- [ ] Testes unitários
- [ ] Testes de carga
- [ ] Otimização de queries
- [ ] Caching estratégico
- [ ] Documentação final

---

## 📊 9. MÉTRICAS E MONITORAMENTO

### 9.1 Logs
- Todos os acessos a APIs
- Erros e exceções
- Mudanças em dados críticos
- Tentativas de login

### 9.2 Métricas
- Tempo de resposta das APIs
- Taxa de erro
- Uso de CPU/Memória
- Conexões ao banco
- Cache hit/miss ratio

### 9.3 Alertas
- Erros críticos
- Performance degradada
- Tentativas de invasão
- Falhas no banco de dados

---

## 🔄 10. MIGRAÇÃO DOS DADOS MOCK

### 10.1 Estratégia de Migração

Para cada área do frontend:

1. **Identificar dados mock** no código
2. **Mapear para modelos do banco**
3. **Criar seeds equivalentes**
4. **Atualizar frontend** para consumir API
5. **Testar funcionalidade**
6. **Remover código mock**

### 10.2 Exemplo de Migração

**Antes (Mock)**:
```typescript
// src/app/paciente/agendamentos/page.tsx
const agendamentos = [
  {
    id: "1",
    procedimento: "Harmonização Facial",
    profissional: "Dra. Ana Paula",
    data: "2025-01-25",
    horario: "14:00",
    status: "confirmado"
  }
];
```

**Depois (API)**:
```typescript
// src/app/paciente/agendamentos/page.tsx
const [agendamentos, setAgendamentos] = useState([]);

useEffect(() => {
  fetch(`${API_URL}/appointments?user_id=${userId}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(data => setAgendamentos(data));
}, []);
```

---

## 📝 11. CHECKLIST DE CONCLUSÃO

### Backend
- [ ] Todas as migrations criadas e testadas
- [ ] Seeds completos para todos os módulos
- [ ] Todas as APIs implementadas
- [ ] Autenticação e autorização funcionando
- [ ] Testes unitários com >80% cobertura
- [ ] Documentação Swagger completa
- [ ] Deploy em ambiente de staging

### Frontend
- [ ] Todas as páginas integradas com APIs
- [ ] Dados mock removidos
- [ ] Tratamento de erros implementado
- [ ] Loading states implementados
- [ ] Validação de formulários
- [ ] Testes E2E críticos

### Infraestrutura
- [ ] Banco de dados em produção
- [ ] Redis configurado
- [ ] S3 ou storage configurado
- [ ] CI/CD pipeline
- [ ] Monitoramento ativo
- [ ] Backup automático

---

## 🎯 PRÓXIMOS PASSOS

1. **Revisar e aprovar este planejamento**
2. **Criar repositório backend** (se ainda não existir)
3. **Configurar ambiente de desenvolvimento**
4. **Iniciar Fase 1**: Migrations básicas e autenticação
5. **Documentar decisões técnicas** conforme implementação

---

**Data de Criação**: 2025-01-23
**Versão**: 1.0
**Status**: 🟡 Aguardando Aprovação
