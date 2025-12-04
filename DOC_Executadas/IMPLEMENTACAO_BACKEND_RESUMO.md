# DoctorQ - Resumo da Implementao do Backend

**Data**: 2025-01-23
**Banco de Dados**: PostgreSQL 16+ (configure via variveis `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_NAME`)
**Total de Tabelas**: 72 tabelas

---

##  Resumo Executivo

Foram criadas **6 migraes** (010-016) e **2 arquivos de seed**, implementando funcionalidades completas de:
-  Marketplace (fornecedores, produtos, categorias)
-  E-commerce (pedidos, carrinho, cupons)
-  Sistema Financeiro (transaes, faturas, repasses)
-  Mensagens entre usurios
-  Favoritos e Galeria de Fotos
-  Notificaes multi-canal
-  Logs e Auditoria do Sistema

---

##  Migraes Criadas

### Migration 010: Marketplace - Fornecedores e Produtos
**Arquivo**: `database/migration_010_marketplace_fornecedores_produtos.sql`

**Novas Tabelas Criadas**:
-  `tb_fornecedores` - Cadastro de fornecedores/vendedores
-  `tb_categorias_produtos` - Categorias hierrquicas de produtos
-  `tb_produto_variacoes` - Variaes de produtos (cores, tamanhos, etc.)
-  `tb_produtos` - EXISTIA COM SCHEMA DIFERENTE (conflito)
-  `tb_avaliacoes_produtos` - EXISTIA COM SCHEMA DIFERENTE (conflito)

**Categorias Padro Inseridas**:
- Cuidados Faciais
- Cuidados Corporais
- Cuidados Capilares
- Maquiagem
- Equipamentos
- Higiene

---

### Migration 011: Pedidos e Carrinho
**Arquivo**: `database/migration_011_pedidos_carrinho.sql`

**Novas Tabelas Criadas**:
-  `tb_cupons` - Cupons de desconto promocionais
-  `tb_itens_pedido` - Itens dos pedidos (produtos comprados)
-  `tb_pedido_historico` - Histrico de mudanas de status
-  `tb_cupons_uso` - Rastreamento de uso de cupons
-  `tb_carrinho` - EXISTIA (conflito parcial de schema)
-  `tb_pedidos` - EXISTIA (conflito parcial de schema)

**Funes Criadas**:
- `gerar_numero_pedido()` - Gera nmeros sequenciais para pedidos (PED-000001)
- `atualizar_uso_cupom()` - Incrementa contador de uso de cupons
- `registrar_historico_pedido()` - Registra mudanas de status automaticamente

---

### Migration 012: Sistema Financeiro
**Arquivo**: `database/migration_012_financeiro.sql`

**Novas Tabelas Criadas**:
-  `tb_contas_bancarias` - Contas de empresas, profissionais e fornecedores
-  `tb_categorias_financeiras` - Categorias de receitas e despesas
-  `tb_transacoes` - Transaes financeiras (receitas/despesas/transferncias)
-  `tb_faturas` - Faturas emitidas para clientes
-  `tb_itens_fatura` - Itens/servios includos nas faturas
-  `tb_repasses` - Repasses para profissionais e fornecedores
-  `tb_itens_repasse` - Detalhamento dos repasses

**Categorias Financeiras Padro**:
- Vendas de Produtos, Procedimentos Estticos, Consultas (receitas)
- Comisses, Impostos, Fornecedores, Salrios, Infraestrutura (despesas)

**Funes Criadas**:
- `gerar_numero_fatura()` - Gera nmeros de faturas (FAT-000001)
- `atualizar_valor_pago_fatura()` - Atualiza status de pagamento automtico

---

### Migration 013: Sistema de Mensagens
**Arquivo**: `database/migration_013_mensagens_usuarios.sql`

**Novas Tabelas Criadas**:
-  `tb_conversas_usuarios` - Conversas individuais e em grupo
-  `tb_participantes_conversa` - Participantes de cada conversa
-  `tb_mensagens_usuarios` - Mensagens trocadas
-  `tb_leitura_mensagens` - Rastreamento de leitura por usurio
-  `tb_anexos_mensagens` - Anexos de arquivos
-  `tb_mensagens_agendadas` - Mensagens programadas para envio futuro
-  `tb_templates_mensagens` - Templates reutilizveis
-  `tb_respostas_rapidas` - Respostas rpidas com atalhos

**Funcionalidades**:
- Mensagens com threading (respostas)
- Suporte a mltiplos tipos: texto, imagem, vdeo, udio, arquivo
- Confirmao de leitura
- Reaes com emojis
- Templates e respostas rpidas

**Funes Criadas**:
- `atualizar_mensagens_nao_lidas()` - Atualiza contador de no lidas
- `marcar_mensagens_lidas()` - Marca mensagens como lidas automaticamente

---

### Migration 014: Favoritos e Galeria
**Arquivo**: `database/migration_014_favoritos_galeria.sql`

**Novas Tabelas Criadas**:
-  `tb_albuns` - lbuns de fotos (pessoais, antes/depois, portfolio)
-  `tb_fotos` - Fotos armazenadas com metadados EXIF
-  `tb_comentarios_fotos` - Comentrios nas fotos
-  `tb_curtidas_fotos` - Sistema de curtidas
-  `tb_compartilhamentos_album` - Compartilhamento entre usurios
-  `tb_listas_desejos` - Listas de desejos compartilhveis
-  `tb_itens_lista_desejos` - Itens das listas
-  `tb_favoritos` - EXISTIA (conflito parcial de schema)

**Funcionalidades**:
- Upload e processamento de fotos
- lbuns de antes/depois para procedimentos
- Sistema de tags para busca
- Compartilhamento pblico com tokens
- Controles de privacidade (privado, clnica, pblico)

**Funes Criadas**:
- `atualizar_total_fotos_album()` - Atualiza contador de fotos
- `atualizar_curtidas_foto()` - Atualiza contador de curtidas

---

### Migration 015: Notificaes e Sistema
**Arquivo**: `database/migration_015_notificacoes_sistema.sql`

**Novas Tabelas Criadas**:
-  `tb_notificacoes` - Notificaes multi-canal (push, email, SMS, WhatsApp)
-  `tb_preferencias_notificacao` - Preferncias por usurio e canal
-  `tb_dispositivos` - Dispositivos para push notifications
-  `tb_lembretes` - Lembretes e alertas programados
-  `tb_atividades` - Log de atividades e auditoria
-  `tb_pesquisas` - Pesquisas de satisfao e NPS
-  `tb_respostas_pesquisas` - Respostas das pesquisas
-  `tb_banners` - Banners e anncios promocionais
-  `tb_cliques_banners` - Rastreamento de cliques

**Funcionalidades**:
- Notificaes multi-canal com rastreamento de envio
- Horrio de silncio configurvel
- Clculo automtico de NPS (Net Promoter Score)
- Sistema de banners com segmentao de pblico
- Auditoria completa de aes do sistema

**Funes Criadas**:
- `calcular_categoria_nps()` - Classifica respostas (detrator/neutro/promotor)
- `atualizar_nps_pesquisa()` - Calcula score NPS automaticamente

---

### Migration 016: Logs e Configuraes
**Arquivo**: `database/migration_016_logs_sistema.sql`

**Novas Tabelas Criadas**:
-  `tb_historico_configuracoes` - Histrico de mudanas em configuraes
-  `tb_logs_erro` - Logs de erros e excees
-  `tb_logs_acesso` - Logs de acesso HTTP/API
-  `tb_logs_integracao` - Logs de integraes externas
-  `tb_sessoes` - Sesses ativas de usurios
-  `tb_jobs` - Tarefas agendadas (cron jobs)
-  `tb_execucoes_jobs` - Histrico de execues
-  `tb_cache` - Cache do sistema
-  `tb_configuracoes` - EXISTIA (conflito parcial de schema)

**Configuraes Padro Inseridas**:
- WhatsApp: api_url, api_key, nmero, envio_ativo
- Email: SMTP host, port, usurio, senha, remetente
- SMS: provedor, api_key, remetente, envio_ativo
- Geral: nome do sistema, timezone, idioma, moeda
- Pagamentos: gateway, api_key, comisso percentual
- Aparncia: cores primria/secundria, logo_url

**Funes Criadas**:
- `registrar_mudanca_configuracao()` - Registra histrico automaticamente
- `limpar_cache_expirado()` - Remove cache expirado
- `limpar_logs_antigos(dias)` - Limpeza de logs por idade

**Views Criadas**:
- `vw_erros_pendentes` - Erros no resolvidos
- `vw_configuracoes_categoria` - Estatsticas por categoria
- `vw_jobs_proximos` - Prximos jobs a executar

---

##  Seeds Criados

### Seed 001: Fornecedores
**Arquivo**: `database/seed_001_fornecedores.sql`
**Status**:  APLICADO COM SUCESSO

**Fornecedores Inseridos** (8 total):
1. **Beleza Premium Distribuidora** (SP) - Cosmticos premium -  4.8 (127 avaliaes)
2. **Esttica Professional Supply** (SP) - Equipamentos profissionais -  4.9 (89 avaliaes)
3. **Bio Natural Cosmticos** (RJ) - Produtos orgnicos e veganos -  4.7 (156 avaliaes)
4. **Derma Science Brasil** (SP) - Dermocosmticos -  4.5 (67 avaliaes)
5. **Spa & Wellness Supply** (SP) - Mobilirio e produtos gerais -  4.6 (203 avaliaes)
6. **MakeUp Pro Studio** (SP) - Maquiagem profissional -  4.9 (341 avaliaes)
7. **Hair Care Professional** (SP) - Tratamentos capilares -  4.7 (112 avaliaes)
8. **Tech Esttica Equipamentos** (SP) - Equipamentos de ltima gerao -  4.8 (54 avaliaes)

---

### Seed 002: Produtos e Categorias
**Arquivo**: `database/seed_002_produtos_categorias.sql`
**Status**:  NO APLICADO (conflito de schema com tb_produtos existente)

**Produtos Planejados** (15 produtos em 6 categorias):
- **Cuidados Faciais** (4): Srum Vitamina C, Mscara Argila Verde, Creme cido Hialurnico, leo Rosa Mosqueta
- **Cuidados Corporais** (3): Gel Redutor, Esfoliante Coffee, Creme Anti-Celulite
- **Cuidados Capilares** (2): Mscara Reconstruo, Ampola Vitamina E
- **Maquiagem** (2): Base Lquida HD, Paleta Sombras Nude
- **Equipamentos** (2): Radiofrequncia, Maca Eltrica
- **Higiene** (1): Sabonete Purificante

**Problema**: A tabela `tb_produtos` existente no possui as colunas `id_fornecedor`, `id_categoria`, `ds_slug`, `ds_sku` necessrias para inserir os produtos do seed.

---

##  Conflitos de Schema Identificados

### Tabelas com Conflitos

#### 1. `tb_produtos`
**Problema**: Schema incompatvel entre migration_010 e tabela existente

**Colunas faltantes na tabela existente**:
- `id_fornecedor` (UUID, FK para tb_fornecedores)
- `id_categoria` (UUID, FK para tb_categorias_produtos)
- `ds_slug` (VARCHAR 255, UNIQUE)
- `ds_sku` (VARCHAR 100, UNIQUE)
- `ds_ean`, `ds_codigo_fornecedor`
- `dt_inicio_promocao`, `dt_fim_promocao`
- `nr_peso_gramas`, `nr_altura_cm`, `nr_largura_cm`, `nr_profundidade_cm`
- `ds_ingredientes`, `ds_modo_uso`, `ds_cuidados`, `ds_contraindicacoes`
- `ds_registro_anvisa`, `st_vegano`, `st_cruelty_free`, `st_organico`
- `ds_video_url`, `ds_meta_title`, `ds_meta_description`, `ds_meta_keywords`

**Dados Existentes**: 6 produtos (no podem ser perdidos)

**Soluo Recomendada**: Criar migration de ALTER TABLE para adicionar colunas faltantes

---

#### 2. `tb_pedidos`
**Problema**: Schema parcialmente incompatvel

**Colunas faltantes**:
- `id_fornecedor` (UUID, FK para tb_fornecedores)
- `dt_criacao`, `ds_codigo_rastreio`
- Campos de nota fiscal

**Dados Existentes**: 0 registros (pode ser alterada sem perda)

---

#### 3. `tb_carrinho`
**Problema**: Schema parcialmente incompatvel

**Colunas faltantes**:
- `id_procedimento` (para permitir adicionar procedimentos ao carrinho)
- Campos de agendamento de procedimentos

**Dados Existentes**: 0 registros (pode ser alterada sem perda)

---

#### 4. `tb_favoritos`
**Problema**: Schema incompatvel

**Colunas faltantes**:
- `ds_tipo_item`, `ds_categoria_favorito`
- FKs para diferentes tipos de itens

**Dados Existentes**: 0 registros (pode ser alterada sem perda)

---

#### 5. `tb_configuracoes`
**Problema**: Schema parcialmente incompatvel

**Colunas faltantes**:
- `id_empresa`, `ds_valor_padrao`
- Campos de validao e segurana

**Dados Existentes**: 20 configuraes (devem ser preservadas)

**Soluo Recomendada**: Criar migration de ALTER TABLE para adicionar colunas faltantes

---

##  Estatsticas do Banco de Dados

### Totais
- **Total de Tabelas**: 72
- **Tabelas Novas Criadas**: ~46 tabelas
- **Tabelas com Conflitos**: 5 tabelas
- **Fornecedores Cadastrados**: 8
- **Produtos Cadastrados**: 6 (antigos, no dos nossos seeds)

### Distribuio de Tabelas por Mdulo

| Mdulo | Tabelas | Status |
|--------|---------|--------|
| Marketplace | 5 |  3 novas +  2 conflitos |
| E-commerce | 6 |  4 novas +  2 conflitos |
| Financeiro | 7 |  Todas criadas |
| Mensagens | 8 |  Todas criadas |
| Galeria/Favoritos | 8 |  7 novas +  1 conflito |
| Notificaes | 9 |  Todas criadas |
| Logs/Config | 9 |  8 novas +  1 conflito |
| Sistema Base | 20 |  Existentes (migration_001) |

---

##  Prximos Passos Recomendados

### 1. Resolver Conflitos de Schema (Alta Prioridade)

Criar **Migration 017: Ajustes de Schema** para:

```sql
-- Adicionar colunas em tb_produtos
ALTER TABLE tb_produtos ADD COLUMN IF NOT EXISTS id_fornecedor UUID REFERENCES tb_fornecedores(id_fornecedor);
ALTER TABLE tb_produtos ADD COLUMN IF NOT EXISTS id_categoria UUID REFERENCES tb_categorias_produtos(id_categoria);
ALTER TABLE tb_produtos ADD COLUMN IF NOT EXISTS ds_slug VARCHAR(255) UNIQUE;
ALTER TABLE tb_produtos ADD COLUMN IF NOT EXISTS ds_sku VARCHAR(100) UNIQUE;
-- ... (adicionar todas as colunas faltantes)

-- Migrar dados antigos
UPDATE tb_produtos SET ds_slug = LOWER(REPLACE(nm_produto, ' ', '-')) WHERE ds_slug IS NULL;
UPDATE tb_produtos SET id_categoria = (SELECT id_categoria FROM tb_categorias_produtos WHERE nm_categoria = tb_produtos.ds_categoria LIMIT 1);
```

### 2. Popular Dados (Mdia Prioridade)

Aps resolver conflitos:
- Reaplicar `seed_002_produtos_categorias.sql`
- Criar `seed_003_procedimentos.sql`
- Criar `seed_004_sample_orders.sql`
- Criar `seed_005_sample_messages.sql`

### 3. Implementar API Endpoints (Alta Prioridade)

**Mdulos por ordem de prioridade**:

1. **Autenticao** (`/auth/*`)
   - POST /auth/register
   - POST /auth/login
   - POST /auth/logout
   - POST /auth/refresh
   - POST /auth/oauth/google
   - POST /auth/oauth/azure

2. **Fornecedores** (`/fornecedores/*`)
   - GET /fornecedores (listar com paginao)
   - GET /fornecedores/:id (detalhes)
   - POST /fornecedores (criar - admin)
   - PUT /fornecedores/:id (atualizar)
   - DELETE /fornecedores/:id (desativar)

3. **Produtos** (`/produtos/*`)
   - GET /produtos (listar, filtrar, buscar)
   - GET /produtos/:id (detalhes)
   - POST /produtos (criar)
   - PUT /produtos/:id (atualizar)
   - DELETE /produtos/:id (desativar)
   - GET /produtos/categorias (listar categorias)

4. **Carrinho** (`/carrinho/*`)
   - GET /carrinho (ver carrinho do usurio)
   - POST /carrinho/itens (adicionar item)
   - PUT /carrinho/itens/:id (atualizar quantidade)
   - DELETE /carrinho/itens/:id (remover)
   - DELETE /carrinho (limpar)

5. **Pedidos** (`/pedidos/*`)
   - POST /pedidos (criar do carrinho)
   - GET /pedidos (listar meus pedidos)
   - GET /pedidos/:id (detalhes)
   - PUT /pedidos/:id/status (atualizar status)
   - GET /pedidos/:id/rastreio (rastreamento)

6. **Transaes Financeiras** (`/transacoes/*`)
   - POST /transacoes (registrar)
   - GET /transacoes (listar)
   - GET /transacoes/resumo (dashboard)
   - GET /faturas (listar)
   - POST /faturas (criar)

7. **Mensagens** (`/mensagens/*`, `/conversas/*`)
   - GET /conversas (listar)
   - POST /conversas (criar)
   - GET /conversas/:id/mensagens (mensagens)
   - POST /conversas/:id/mensagens (enviar)
   - PUT /mensagens/:id/ler (marcar lida)

8. **Notificaes** (`/notificacoes/*`)
   - GET /notificacoes (listar)
   - POST /notificacoes (criar)
   - PUT /notificacoes/:id/ler (marcar lida)
   - GET /notificacoes/preferencias (obter)
   - PUT /notificacoes/preferencias (atualizar)

### 4. Integrao Frontend (Mdia Prioridade)

Atualizar pginas frontend para consumir APIs reais:
- `/fornecedor/produtos` - listar produtos do fornecedor
- `/fornecedor/pedidos` - gerenciar pedidos
- `/paciente/produtos` - marketplace para pacientes
- `/paciente/carrinho` - gerenciar carrinho
- `/paciente/pedidos` - histrico de pedidos
- `/admin/fornecedores` - gesto de fornecedores
- `/admin/transacoes` - painel financeiro

### 5. Testes e Validao (Alta Prioridade)

- Criar testes unitrios para endpoints
- Criar testes de integrao
- Validar regras de negcio
- Testar fluxos completos (carrinho  pedido  pagamento  envio)

---

##  Configuraes Necessrias

### Variveis de Ambiente (.env)

```env
# Database
DATABASE_URL=postgresql://<usuario>:<senha>@<host>:<porta>/<database>

# Redis (se usar cache)
REDIS_URL=redis://localhost:6379

# Autenticao
SECRET_KEY=your-secret-key-here
JWT_SECRET=your-jwt-secret-here
JWT_EXPIRES_IN=7d

# Email (SMTP)
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USER=noreply@doctorq.com
EMAIL_SMTP_PASS=your-password

# WhatsApp Business API
WHATSAPP_API_URL=https://api.whatsapp.com
WHATSAPP_API_KEY=your-api-key
WHATSAPP_NUMERO=5511999999999

# Pagamentos
PAYMENT_GATEWAY=stripe
PAYMENT_API_KEY=sk_test_...

# Storage (S3, Cloudinary, etc.)
STORAGE_PROVIDER=s3
AWS_BUCKET=doctorq-uploads
AWS_REGION=us-east-1

# URLs
URL_FRONTEND=http://localhost:3000
URL_API=http://localhost:8080
```

> Garanta que as credenciais reais sejam gerenciadas por um cofre de segredos (AWS Secrets Manager, Azure Key Vault, HashiCorp Vault, etc.) com rotação periódica. O arquivo `.env` deve permanecer fora do versionamento e ser utilizado somente para desenvolvimento local.

---

##  Notas Tcnicas

### Padres Utilizados

1. **UUID como Chave Primria**: Todas as tabelas usam UUID com `gen_random_uuid()`
2. **Soft Deletes**: Campo `st_ativo` para desativao lgica
3. **Auditoria**: Campos `dt_criacao` e `dt_atualizacao` em todas as tabelas
4. **Triggers**: `update_dt_atualizacao()` atualiza automaticamente data de modificao
5. **JSONB**: Usado para dados flexveis (metadados, configuraes)
6. **Arrays**: Para tags, categorias e listas simples
7. **GIN Indexes**: Para arrays e JSONB para melhor performance
8. **Computed Columns**: Campos calculados como `vl_total` e `vl_liquido`
9. **CHECK Constraints**: Validaes a nvel de banco
10. **Foreign Keys**: Integridade referencial com `ON DELETE CASCADE/SET NULL`

### Funcionalidades Especiais

- **Numerao Automtica**: Pedidos (PED-000001), Faturas (FAT-000001)
- **Clculo Automtico**: NPS, totais, contadores
- **Histrico Automtico**: Mudanas de status, configuraes
- **Multi-canal**: Notificaes via push, email, SMS, WhatsApp
- **Multi-tenant**: Suporte a mltiplas empresas via `id_empresa`
- **Rastreamento**: Logs completos de acesso, erros e integraes

---

##  Checklist de Implementao

### Migrations
- [x] Migration 010 - Marketplace
- [x] Migration 011 - Pedidos e Carrinho
- [x] Migration 012 - Financeiro
- [x] Migration 013 - Mensagens
- [x] Migration 014 - Favoritos e Galeria
- [x] Migration 015 - Notificaes
- [x] Migration 016 - Logs e Configuraes
- [ ] Migration 017 - Ajustes de Schema (pendente)

### Seeds
- [x] Seed 001 - Fornecedores (8 inseridos)
- [ ] Seed 002 - Produtos (bloqueado por schema)
- [ ] Seed 003 - Procedimentos
- [ ] Seed 004 - Pedidos de Exemplo
- [ ] Seed 005 - Mensagens de Exemplo

### API Endpoints
- [ ] Autenticao (0/6)
- [ ] Fornecedores (0/5)
- [ ] Produtos (0/6)
- [ ] Carrinho (0/5)
- [ ] Pedidos (0/5)
- [ ] Transaes (0/6)
- [ ] Mensagens (0/6)
- [ ] Notificaes (0/5)

### Frontend Integration
- [ ] Pginas de Fornecedor (0/10)
- [ ] Pginas de Paciente (0/10)
- [ ] Pginas Admin (0/15)
- [ ] Remover dados mock

### Testes
- [ ] Testes unitrios
- [ ] Testes de integrao
- [ ] Testes E2E

---

##  Referncias

- [Plano Completo](./PLANEJAMENTO_BACKEND.md)
- [Migration 001 Original](./estetiQ-api/database/migration_001_init_doctorq.sql)
- [Migrations 010-016](./estetiQ-api/database/)
- [Seeds](./estetiQ-api/database/)

---

**Documento gerado automaticamente durante implementao do backend**
**ltima atualizao**: 2025-01-23
