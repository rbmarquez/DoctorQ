# UC001 - Matrícula e Acesso a Cursos

**Versão:** 1.0
**Data:** 13/11/2025
**Autor:** Sistema DoctorQ
**Status:** Planejado

---

## 1. Descrição

Este caso de uso descreve o processo de matrícula de um aluno em cursos da Universidade da Beleza, incluindo navegação no catálogo, seleção de cursos, processamento de pagamento e liberação de acesso ao conteúdo.

---

## 2. Atores

### Ator Principal
- **Aluno/Paciente** - Usuário que deseja se matricular em cursos de estética

### Atores Secundários
- **Sistema de Pagamento** - Gateway de pagamento (Stripe/MercadoPago)
- **Sistema de Notificações** - Envia confirmações por email/WhatsApp
- **Mentor IA (Dra. Sophie)** - Recomenda cursos personalizados

---

## 3. Pré-condições

1. Usuário deve estar cadastrado na plataforma DoctorQ
2. Usuário deve ter perfil de "paciente" ou "profissional"
3. Sistema de pagamento deve estar configurado e ativo
4. Cursos devem estar publicados com status "disponível"
5. Para cursos pagos, método de pagamento válido deve estar configurado

---

## 4. Pós-condições

### Sucesso
1. Inscrição registrada em `tb_universidade_inscricoes`
2. Pagamento processado (se aplicável)
3. Acesso ao curso liberado
4. Usuário adicionado ao `tb_universidade_progresso` (progresso 0%)
5. XP inicial creditado (se gamificação ativa)
6. Notificação de confirmação enviada
7. Certificado disponível para emissão após conclusão

### Falha
1. Pagamento recusado - inscrição não criada
2. Curso lotado - usuário adicionado à lista de espera
3. Erro técnico - transação revertida, usuário notificado

---

## 5. Fluxo Principal

### 5.1 Navegação e Descoberta

**Passo 1: Acessar Catálogo de Cursos**
- Usuário acessa `/universidade/cursos` (rota pública)
- Sistema exibe grade de cursos estilo Netflix com:
  - Cards com thumbnail, título, duração, nível
  - Filtros: categoria, nível, formato, preço
  - Barra de busca com autocompletar
  - Seção "Recomendados para Você" (via IA)

**Passo 2: Visualizar Detalhes do Curso**
- Usuário clica em um curso
- Sistema abre `/universidade/cursos/[id]` com:
  - Vídeo de apresentação (trailer)
  - Descrição completa, objetivos, pré-requisitos
  - Grade de aulas (módulos e aulas)
  - Instrutor(es) - biografia e credenciais
  - Avaliações e depoimentos
  - Preço (se aplicável) ou badge "Grátis"
  - Botão "Matricular-se" ou "Começar Teste Grátis"

### 5.2 Processo de Matrícula

**Passo 3: Iniciar Matrícula**
- Usuário clica em "Matricular-se"
- Sistema verifica autenticação:
  - Se não logado → redireciona para `/login?callbackUrl=/universidade/cursos/[id]`
  - Se logado → prossegue para etapa 4

**Passo 4: Escolher Plano (se aplicável)**
- Para cursos com múltiplas opções:
  - Compra única (acesso vitalício)
  - Assinatura mensal (acesso a todos os cursos)
  - Teste grátis 7 dias (convertido em assinatura)
- Sistema exibe modal de seleção de plano
- Usuário seleciona plano desejado

**Passo 5: Processar Pagamento**
- Para cursos gratuitos:
  - Pular para passo 7 (confirmação imediata)
- Para cursos pagos:
  - Sistema abre modal de checkout
  - Usuário insere/confirma dados de pagamento:
    - Cartão de crédito/débito
    - PIX (gera QR Code com expiração 15 min)
    - Boleto (gera PDF para download)
  - Sistema envia requisição para gateway de pagamento
  - Aguarda confirmação (polling ou webhook)

**Passo 6: Confirmar Pagamento**
- Sistema recebe confirmação do gateway
- Cria registro em `tb_universidade_inscricoes`:
  ```json
  {
    "id_inscricao": "uuid",
    "id_curso": "uuid",
    "id_aluno": "uuid",
    "dt_inscricao": "2025-11-13T10:30:00Z",
    "ds_status": "ativa",
    "dt_validade": "2026-11-13T10:30:00Z", // ou null para vitalício
    "vl_pago": 197.00,
    "id_transacao": "uuid"
  }
  ```
- Cria registro inicial de progresso:
  ```json
  {
    "id_progresso": "uuid",
    "id_inscricao": "uuid",
    "id_aluno": "uuid",
    "id_curso": "uuid",
    "pc_conclusao": 0.0,
    "qt_aulas_concluidas": 0,
    "qt_total_aulas": 45,
    "dt_inicio": "2025-11-13T10:30:00Z",
    "dt_ultima_visualizacao": null
  }
  ```

**Passo 7: Liberar Acesso**
- Sistema redireciona para `/universidade/meus-cursos/[id]`
- Exibe mensagem de boas-vindas
- Destaca primeira aula do curso
- Sugere configuração de metas de estudo
- Mentor IA envia mensagem de boas-vindas personalizada

### 5.3 Pós-Matrícula

**Passo 8: Notificações**
- Sistema envia email de confirmação com:
  - Detalhes da compra/matrícula
  - Link direto para começar o curso
  - Informações sobre certificação
  - Contato do suporte
- (Opcional) Envia WhatsApp com link rápido

**Passo 9: Gamificação Inicial**
- Sistema credita XP inicial (+50 XP por matrícula)
- Atualiza `tb_universidade_ranking`:
  - Incrementa `qt_xp_total`
  - Recalcula `qt_nivel` (se atingiu threshold)
- Exibe badge "Primeiro Passo" (conquista desbloqueada)

---

## 6. Fluxos Alternativos

### 6.A - Teste Grátis (Trial)

**Condição:** Curso possui opção de teste grátis de 7 dias

**Fluxo:**
1. Usuário clica em "Começar Teste Grátis"
2. Sistema solicita método de pagamento (não cobra imediatamente)
3. Cria inscrição com `ds_status = "trial"`
4. Define `dt_validade = now() + 7 dias`
5. Libera acesso completo ao curso
6. Após 7 dias:
   - Sistema cobra automaticamente → converte para "ativa"
   - Usuário cancela antes → muda para "cancelada", remove acesso

### 6.B - Curso Lotado (Limite de Vagas)

**Condição:** Curso atingiu `qt_vagas_max`

**Fluxo:**
1. Usuário tenta se matricular
2. Sistema verifica `COUNT(inscricoes) >= qt_vagas_max`
3. Exibe mensagem: "Curso lotado. Deseja entrar na lista de espera?"
4. Se aceitar:
   - Cria registro em `tb_universidade_lista_espera`
   - Notifica quando vaga abrir
5. Se recusar:
   - Sugere cursos similares via IA

### 6.C - Cupom de Desconto

**Condição:** Usuário possui código de cupom

**Fluxo:**
1. No checkout, usuário clica em "Adicionar cupom"
2. Sistema valida código em `tb_cupons`:
   - Verifica `dt_validade >= now()`
   - Verifica `qt_usos_restantes > 0`
   - Verifica se curso está em `id_produtos` ou `id_categorias` aplicáveis
3. Aplica desconto:
   - Tipo "percentual": `vl_final = vl_original * (1 - pc_desconto/100)`
   - Tipo "fixo": `vl_final = vl_original - vl_desconto`
4. Exibe valor atualizado
5. Após pagamento, decrementa `qt_usos_restantes`

### 6.D - Assinatura Premium (All Access)

**Condição:** Usuário opta por assinatura mensal ilimitada

**Fluxo:**
1. Usuário clica em "Assinar Plano Premium"
2. Sistema exibe planos:
   - Mensal: R$ 97/mês
   - Anual: R$ 970/ano (2 meses grátis)
3. Processa pagamento recorrente
4. Cria registro em `tb_assinaturas`:
   ```json
   {
     "id_assinatura": "uuid",
     "id_usuario": "uuid",
     "nm_plano": "premium_anual",
     "vl_mensalidade": 80.83,
     "dt_inicio": "2025-11-13",
     "dt_renovacao": "2026-11-13",
     "fg_ativa": true
   }
   ```
5. Libera acesso a TODOS os cursos da plataforma
6. Sistema cria inscrições automáticas ao acessar cada curso

### 6.E - Presente/Gift Card

**Condição:** Usuário quer presentear outra pessoa

**Fluxo:**
1. Usuário clica em "Presentear este curso"
2. Sistema solicita:
   - Email do destinatário
   - Mensagem personalizada (opcional)
   - Data de envio (agora ou agendar)
3. Processa pagamento
4. Cria voucher único em `tb_vouchers`:
   ```json
   {
     "id_voucher": "uuid",
     "cd_voucher": "GIFT-CURSO-ABC123",
     "id_curso": "uuid",
     "id_comprador": "uuid",
     "email_destinatario": "amigo@email.com",
     "dt_envio": "2025-12-25",
     "fg_resgatado": false
   }
   ```
5. No dia programado:
   - Envia email com código
   - Destinatário acessa `/universidade/resgatar/[codigo]`
   - Sistema cria inscrição vinculada ao destinatário

---

## 7. Fluxos de Exceção

### 7.A - Pagamento Recusado

**Erro:** Gateway retorna falha (cartão sem limite, dados inválidos, etc.)

**Tratamento:**
1. Sistema exibe mensagem de erro específica
2. Oferece opções:
   - Tentar outro método de pagamento
   - Usar PIX ou boleto
   - Entrar em contato com suporte
3. Não cria inscrição até confirmação de pagamento

### 7.B - Curso Removido Durante Compra

**Erro:** Curso foi despublicado enquanto usuário estava no checkout

**Tratamento:**
1. Sistema detecta `ds_status != "publicado"`
2. Cancela transação antes de processar
3. Exibe mensagem: "Desculpe, este curso não está mais disponível"
4. Redireciona para catálogo com sugestões similares

### 7.C - Duplicação de Inscrição

**Erro:** Usuário já está inscrito no curso

**Tratamento:**
1. Sistema verifica `EXISTS(tb_universidade_inscricoes WHERE id_curso AND id_aluno)`
2. Se `ds_status = "ativa"`:
   - Exibe: "Você já está matriculado neste curso"
   - Botão: "Continuar estudando" → redireciona para última aula
3. Se `ds_status = "concluida"`:
   - Oferece: "Refazer curso" (mantém histórico, zera progresso)
4. Se `ds_status = "cancelada"`:
   - Permite reinscrição normal

### 7.D - Webhook de Pagamento Atrasado

**Erro:** Webhook demora mais de 5 minutos para confirmar

**Tratamento:**
1. Sistema cria inscrição com `ds_status = "pendente"`
2. Exibe para usuário: "Processando pagamento... isso pode levar alguns minutos"
3. Polling a cada 30s verifica status em `/api/pagamentos/[id]/status`
4. Após 15 minutos sem confirmação:
   - Cancela inscrição pendente
   - Notifica usuário para verificar email/SMS do banco
   - Suporte pode ativar manualmente após verificação

---

## 8. Regras de Negócio

### RN001 - Limite de Inscrições Simultâneas
- **Regra:** Usuário com plano gratuito pode ter no máximo 3 cursos ativos simultaneamente
- **Validação:** `COUNT(inscricoes WHERE ds_status = 'ativa' AND dt_validade > now()) <= 3`
- **Ação:** Sugerir upgrade para Premium (ilimitado)

### RN002 - Validade de Cursos
- **Regra:** Cursos comprados individualmente têm validade de 1 ano (pode ser vitalício conforme configuração)
- **Validação:** Verificar `dt_validade` antes de liberar acesso
- **Ação:** Se expirado, oferecer renovação com desconto

### RN003 - Reembolso
- **Regra:** Usuário pode solicitar reembolso em até 7 dias após matrícula, desde que tenha assistido menos de 20% do conteúdo
- **Validação:** `(now() - dt_inscricao) <= 7 dias AND pc_conclusao < 20.0`
- **Ação:** Processar estorno, marcar inscrição como "reembolsada"

### RN004 - Certificação Obrigatória
- **Regra:** Para emitir certificado, aluno deve ter:
  - `pc_conclusao >= 80.0%`
  - `qt_avaliacoes_concluidas = qt_avaliacoes_obrigatorias`
  - `dt_conclusao IS NOT NULL`
- **Ação:** Gerar certificado em PDF + NFT (se blockchain ativo)

### RN005 - Acesso Offline
- **Regra:** Apenas alunos Premium podem fazer download de aulas para acesso offline
- **Validação:** Verificar assinatura antes de permitir download
- **Limite:** Máximo 10 aulas baixadas simultaneamente (libera ao marcar como concluída)

### RN006 - Compartilhamento de Conta
- **Regra:** Detectar múltiplos IPs simultâneos (possível compartilhamento)
- **Validação:** Se 3+ sessões ativas de IPs diferentes em 1 hora → alertar
- **Ação:** Enviar email de segurança, solicitar confirmação

### RN007 - Progressão Linear vs Livre
- **Regra:** Instrutor define se curso é linear (deve seguir ordem) ou livre (pode pular aulas)
- **Validação:** Se `fg_progressao_linear = true`, verificar aulas anteriores concluídas
- **Ação:** Bloquear aulas futuras até completar anteriores

---

## 9. Requisitos Não-Funcionais

### RNF001 - Performance
- Tempo de carregamento do catálogo: < 2s (com 1000+ cursos)
- Processamento de pagamento: < 30s (sync) ou < 5min (async)
- Liberação de acesso após pagamento: < 10s

### RNF002 - Segurança
- Dados de pagamento NUNCA armazenados no banco DoctorQ (apenas tokens do gateway)
- Comunicação com gateway via HTTPS/TLS 1.3
- Credenciais de API criptografadas (AES-256) em `tb_credenciais`

### RNF003 - Escalabilidade
- Suportar 10.000 matrículas simultâneas (Black Friday)
- Cache de catálogo em Redis (TTL 5 min)
- CDN para thumbnails e vídeos (Cloudflare/AWS CloudFront)

### RNF004 - Auditoria
- Todas as transações registradas em `tb_transacoes` com idempotência
- Logs de tentativas de pagamento em `tb_logs_integracao`
- Webhooks validados com assinatura HMAC

### RNF005 - Acessibilidade
- Interface WCAG 2.1 AA compliant
- Suporte a leitores de tela (ARIA labels)
- Legendas em todos os vídeos (auto-geradas ou manuais)

---

## 10. Entidades e Relacionamentos

### Tabelas Principais

#### `tb_universidade_cursos`
```sql
CREATE TABLE tb_universidade_cursos (
  id_curso UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_empresa UUID REFERENCES tb_empresas(id_empresa),
  nm_titulo VARCHAR(255) NOT NULL,
  ds_descricao TEXT,
  ds_objetivos TEXT,
  nm_categoria VARCHAR(100), -- "Facial", "Corporal", "Capilar", etc.
  nm_nivel VARCHAR(50), -- "Iniciante", "Intermediário", "Avançado"
  qt_carga_horaria INTEGER, -- minutos
  vl_preco DECIMAL(10,2),
  fg_gratuito BOOLEAN DEFAULT false,
  qt_vagas_max INTEGER, -- NULL = ilimitado
  fg_progressao_linear BOOLEAN DEFAULT false,
  url_thumbnail VARCHAR(500),
  url_video_trailer VARCHAR(500),
  dt_publicacao TIMESTAMP,
  ds_status VARCHAR(50) DEFAULT 'rascunho', -- "rascunho", "publicado", "arquivado"
  fg_ativo BOOLEAN DEFAULT true,
  dt_criacao TIMESTAMP DEFAULT now(),
  dt_atualizacao TIMESTAMP
);

CREATE INDEX idx_curso_categoria ON tb_universidade_cursos(nm_categoria);
CREATE INDEX idx_curso_nivel ON tb_universidade_cursos(nm_nivel);
CREATE INDEX idx_curso_status ON tb_universidade_cursos(ds_status);
```

#### `tb_universidade_inscricoes`
```sql
CREATE TABLE tb_universidade_inscricoes (
  id_inscricao UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_curso UUID REFERENCES tb_universidade_cursos(id_curso),
  id_aluno UUID REFERENCES tb_users(id_usuario),
  id_empresa UUID REFERENCES tb_empresas(id_empresa),
  dt_inscricao TIMESTAMP DEFAULT now(),
  ds_status VARCHAR(50) DEFAULT 'ativa', -- "ativa", "trial", "concluida", "cancelada", "expirada", "reembolsada"
  dt_validade TIMESTAMP, -- NULL = vitalício
  vl_pago DECIMAL(10,2),
  id_transacao UUID REFERENCES tb_transacoes(id_transacao),
  id_cupom UUID REFERENCES tb_cupons(id_cupom),
  fg_certificado_emitido BOOLEAN DEFAULT false,
  dt_conclusao TIMESTAMP,
  fg_ativo BOOLEAN DEFAULT true,
  dt_criacao TIMESTAMP DEFAULT now(),
  dt_atualizacao TIMESTAMP
);

CREATE INDEX idx_inscricao_aluno ON tb_universidade_inscricoes(id_aluno);
CREATE INDEX idx_inscricao_curso ON tb_universidade_inscricoes(id_curso);
CREATE INDEX idx_inscricao_status ON tb_universidade_inscricoes(ds_status);
CREATE UNIQUE INDEX idx_inscricao_ativa_unica ON tb_universidade_inscricoes(id_curso, id_aluno)
  WHERE ds_status = 'ativa';
```

#### `tb_universidade_progresso`
```sql
CREATE TABLE tb_universidade_progresso (
  id_progresso UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_inscricao UUID REFERENCES tb_universidade_inscricoes(id_inscricao),
  id_aluno UUID REFERENCES tb_users(id_usuario),
  id_curso UUID REFERENCES tb_universidade_cursos(id_curso),
  pc_conclusao DECIMAL(5,2) DEFAULT 0.0, -- 0.00 a 100.00
  qt_aulas_concluidas INTEGER DEFAULT 0,
  qt_total_aulas INTEGER,
  qt_avaliacoes_concluidas INTEGER DEFAULT 0,
  dt_inicio TIMESTAMP DEFAULT now(),
  dt_ultima_visualizacao TIMESTAMP,
  dt_conclusao TIMESTAMP,
  fg_ativo BOOLEAN DEFAULT true,
  dt_criacao TIMESTAMP DEFAULT now(),
  dt_atualizacao TIMESTAMP
);

CREATE INDEX idx_progresso_aluno ON tb_universidade_progresso(id_aluno);
CREATE INDEX idx_progresso_curso ON tb_universidade_progresso(id_curso);
```

#### `tb_universidade_lista_espera`
```sql
CREATE TABLE tb_universidade_lista_espera (
  id_lista_espera UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_curso UUID REFERENCES tb_universidade_cursos(id_curso),
  id_usuario UUID REFERENCES tb_users(id_usuario),
  dt_entrada TIMESTAMP DEFAULT now(),
  qt_posicao INTEGER, -- posição na fila
  fg_notificado BOOLEAN DEFAULT false,
  dt_notificacao TIMESTAMP,
  fg_ativo BOOLEAN DEFAULT true,
  dt_criacao TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_lista_espera_curso ON tb_universidade_lista_espera(id_curso);
CREATE INDEX idx_lista_espera_posicao ON tb_universidade_lista_espera(qt_posicao);
```

### Relacionamentos com Tabelas Existentes

- `tb_users` → `tb_universidade_inscricoes` (1:N)
- `tb_empresas` → `tb_universidade_cursos` (1:N) - multi-tenancy
- `tb_transacoes` → `tb_universidade_inscricoes` (1:1) - pagamento
- `tb_cupons` → `tb_universidade_inscricoes` (1:N) - descontos

---

## 11. Endpoints da API

### GET `/universidade/cursos/`
**Descrição:** Lista cursos publicados com filtros e paginação

**Query Params:**
- `page` (default: 1)
- `size` (default: 12)
- `categoria` (opcional)
- `nivel` (opcional)
- `preco_min` / `preco_max` (opcional)
- `gratuito` (boolean, opcional)
- `busca` (texto livre)

**Response:**
```json
{
  "cursos": [
    {
      "id_curso": "uuid",
      "nm_titulo": "Microblading Avançado",
      "ds_descricao": "Aprenda técnicas...",
      "nm_categoria": "Facial",
      "nm_nivel": "Avançado",
      "qt_carga_horaria": 1200,
      "vl_preco": 197.00,
      "fg_gratuito": false,
      "url_thumbnail": "https://cdn.doctorq.app/...",
      "qt_alunos": 1254,
      "vl_avaliacao_media": 4.8,
      "instrutor": {
        "nm_nome": "Dra. Maria Silva",
        "url_foto": "..."
      }
    }
  ],
  "meta": {
    "total": 145,
    "page": 1,
    "size": 12,
    "total_pages": 13
  }
}
```

### GET `/universidade/cursos/{id}/`
**Descrição:** Detalhes completos de um curso

**Response:**
```json
{
  "id_curso": "uuid",
  "nm_titulo": "Microblading Avançado",
  "ds_descricao": "...",
  "ds_objetivos": "...",
  "ds_prerequisitos": "...",
  "nm_categoria": "Facial",
  "nm_nivel": "Avançado",
  "qt_carga_horaria": 1200,
  "vl_preco": 197.00,
  "fg_gratuito": false,
  "url_thumbnail": "...",
  "url_video_trailer": "...",
  "qt_alunos": 1254,
  "vl_avaliacao_media": 4.8,
  "modulos": [
    {
      "id_modulo": "uuid",
      "nm_titulo": "Módulo 1 - Fundamentos",
      "qt_ordem": 1,
      "aulas": [
        {
          "id_aula": "uuid",
          "nm_titulo": "Introdução ao Microblading",
          "qt_duracao": 15,
          "fg_gratuita": true
        }
      ]
    }
  ],
  "instrutores": [...],
  "avaliacoes": [...]
}
```

### POST `/universidade/inscricoes/`
**Descrição:** Cria nova matrícula em curso

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Body:**
```json
{
  "id_curso": "uuid",
  "cd_cupom": "PROMO20" // opcional
}
```

**Response 201:**
```json
{
  "id_inscricao": "uuid",
  "id_curso": "uuid",
  "ds_status": "ativa",
  "vl_pago": 157.60, // com desconto aplicado
  "dt_validade": "2026-11-13T10:30:00Z",
  "url_checkout": "https://..." // se pagamento necessário
}
```

**Response 402 (Payment Required):**
```json
{
  "message": "Pagamento necessário",
  "vl_total": 197.00,
  "vl_desconto": 39.40,
  "vl_final": 157.60,
  "url_checkout": "https://stripe.com/checkout/..."
}
```

### POST `/universidade/inscricoes/{id}/confirmar-pagamento/`
**Descrição:** Confirma pagamento e ativa inscrição (chamado por webhook ou polling)

**Body:**
```json
{
  "id_transacao": "uuid",
  "ds_status_pagamento": "aprovado"
}
```

**Response 200:**
```json
{
  "message": "Pagamento confirmado. Bem-vindo ao curso!",
  "id_inscricao": "uuid",
  "ds_status": "ativa",
  "url_primeira_aula": "/universidade/meus-cursos/[id]/aulas/[id_aula]"
}
```

### GET `/universidade/meus-cursos/`
**Descrição:** Lista cursos do aluno logado

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Query Params:**
- `ds_status` (opcional: "ativa", "concluida", "cancelada")

**Response:**
```json
{
  "cursos": [
    {
      "id_inscricao": "uuid",
      "curso": {
        "id_curso": "uuid",
        "nm_titulo": "...",
        "url_thumbnail": "..."
      },
      "progresso": {
        "pc_conclusao": 35.5,
        "qt_aulas_concluidas": 16,
        "qt_total_aulas": 45,
        "dt_ultima_visualizacao": "2025-11-12T14:20:00Z"
      },
      "dt_validade": "2026-11-13",
      "fg_certificado_emitido": false
    }
  ]
}
```

### POST `/universidade/inscricoes/{id}/cancelar/`
**Descrição:** Cancela inscrição (solicita reembolso se aplicável)

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Body:**
```json
{
  "ds_motivo": "Não atendeu expectativas",
  "fg_solicitar_reembolso": true
}
```

**Response 200:**
```json
{
  "message": "Inscrição cancelada com sucesso",
  "fg_reembolso_processado": true,
  "vl_reembolso": 157.60,
  "dt_previsao_estorno": "2025-11-20"
}
```

### POST `/universidade/vouchers/resgatar/`
**Descrição:** Resgata voucher de presente

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Body:**
```json
{
  "cd_voucher": "GIFT-CURSO-ABC123"
}
```

**Response 200:**
```json
{
  "message": "Voucher resgatado! Você foi matriculado no curso.",
  "curso": {
    "id_curso": "uuid",
    "nm_titulo": "..."
  },
  "id_inscricao": "uuid"
}
```

---

## 12. Telas e Wireframes

### Tela 1: Catálogo de Cursos (`/universidade/cursos`)

**Layout:**
```
+----------------------------------------------------------+
|  [Logo DoctorQ]    Cursos    Meus Cursos    [Avatar]     |
+----------------------------------------------------------+
|                                                            |
|  🎓 Universidade da Beleza                                |
|  Aprenda com os melhores profissionais                    |
|                                                            |
|  [🔍 Buscar cursos...]  [Filtros ▼]                       |
|                                                            |
+----------------------------------------------------------+
|  Recomendados para Você                     [Ver todos >] |
|                                                            |
|  +--------+  +--------+  +--------+  +--------+           |
|  | [IMG]  |  | [IMG]  |  | [IMG]  |  | [IMG]  |           |
|  | Título |  | Título |  | Título |  | Título |           |
|  | ⭐4.8  |  | ⭐4.9  |  | ⭐4.7  |  | ⭐4.6  |           |
|  | R$197  |  | GRÁTIS |  | R$147  |  | R$97   |           |
|  +--------+  +--------+  +--------+  +--------+           |
|                                                            |
+----------------------------------------------------------+
|  Todos os Cursos (145)                                     |
|                                                            |
|  [Grid com 12 cards + paginação]                          |
+----------------------------------------------------------+
```

**Componentes:**
- `PublicNav` (já existe)
- `UniversidadeCourseCard` (criar)
- `UniversidadeFilters` (criar)
- `Footer`

### Tela 2: Detalhes do Curso (`/universidade/cursos/[id]`)

**Layout:**
```
+----------------------------------------------------------+
|  [Navbar]                                                  |
+----------------------------------------------------------+
|  +-----------------------+  +-------------------------+   |
|  |                       |  |  Microblading Avançado  |   |
|  |   [Vídeo Trailer]     |  |                         |   |
|  |                       |  |  ⭐ 4.8 (1.254 alunos)  |   |
|  |   [▶️ Play]           |  |                         |   |
|  |                       |  |  R$ 197,00              |   |
|  +-----------------------+  |                         |   |
|                             |  [Matricular-se] 🎯     |   |
|  Sobre o Curso              |  ou [Teste 7 dias]      |   |
|  Lorem ipsum dolor...       +-------------------------+   |
|                                                            |
|  O que você vai aprender                                   |
|  ✅ Técnica de traçado                                     |
|  ✅ Escolha de pigmentos                                   |
|  ✅ Anatomia facial                                        |
|                                                            |
|  Grade do Curso                                            |
|  📚 Módulo 1 - Fundamentos (5 aulas, 1h20min)             |
|      1. Introdução ao Microblading (15min) 🔓             |
|      2. Materiais e Equipamentos (20min) 🔒               |
|  📚 Módulo 2 - Técnicas Avançadas (8 aulas, 2h40min)      |
|      ...                                                   |
|                                                            |
|  Instrutores                                               |
|  [Foto] Dra. Maria Silva - 15 anos de experiência         |
|                                                            |
|  Avaliações (485)                                          |
|  ⭐⭐⭐⭐⭐ "Curso excelente!" - Ana Paula (há 2 dias)      |
+----------------------------------------------------------+
```

**Componentes:**
- `UniversidadeCourseDetail` (criar)
- `UniversidadeModuleAccordion` (criar)
- `UniversidadeInstructorCard` (criar)
- `UniversidadeReviewList` (criar)

### Tela 3: Checkout (`/universidade/checkout/[id_curso]`)

**Layout:**
```
+----------------------------------------------------------+
|  [Logo]                            Finalizar Matrícula    |
+----------------------------------------------------------+
|                                                            |
|  Resumo da Compra          |  Forma de Pagamento          |
|  +-----------------------+ |  +-------------------------+ |
|  | [IMG] Microblading    | |  | ⚪ Cartão de Crédito    | |
|  | Avançado              | |  | ⚪ PIX                  | |
|  | R$ 197,00             | |  | ⚪ Boleto               | |
|  +-----------------------+ |  +-------------------------+ |
|                            |                               |
|  Tem um cupom?             |  [Campos do cartão]          |
|  [_____________] Aplicar   |  Número: [________________]  |
|                            |  Validade: [__/__]           |
|  Subtotal    R$ 197,00     |  CVV: [___]                  |
|  Desconto    R$  39,40     |                               |
|  ---------------           |  [✅ Confirmar Pagamento]    |
|  Total       R$ 157,60     |                               |
+----------------------------------------------------------+
|  🔒 Pagamento 100% seguro                                 |
+----------------------------------------------------------+
```

**Componentes:**
- `CheckoutSummary` (criar)
- `PaymentMethodSelector` (criar)
- `CreditCardForm` (criar)
- `PixQRCode` (criar)

### Tela 4: Meus Cursos (`/universidade/meus-cursos`)

**Layout:**
```
+----------------------------------------------------------+
|  [Navbar Autenticado]                                      |
+----------------------------------------------------------+
|  Meus Cursos                                               |
|                                                            |
|  [Em Andamento] [Concluídos] [Salvos]                     |
|                                                            |
|  +----------------------------------------------------+   |
|  | [IMG Thumbnail]                                    |   |
|  |                          Microblading Avançado     |   |
|  | Progresso: [████████░░] 35%                        |   |
|  | Última aula: Anatomia Facial                       |   |
|  | Próxima aula: Técnica de Traçado                   |   |
|  |                                                    |   |
|  | [Continuar]  [Ver Certificado]                     |   |
|  +----------------------------------------------------+   |
|                                                            |
|  +----------------------------------------------------+   |
|  | [IMG Thumbnail]                                    |   |
|  | ...                                                |   |
|  +----------------------------------------------------+   |
+----------------------------------------------------------+
```

**Componentes:**
- `MeusCursosList` (criar)
- `CursoProgressCard` (criar)
- `CertificadoButton` (criar)

---

## 13. Critérios de Aceitação

### ✅ Funcionalidades Obrigatórias

1. **Navegação no Catálogo**
   - [ ] Usuário pode visualizar todos os cursos publicados sem login
   - [ ] Filtros funcionam corretamente (categoria, nível, preço)
   - [ ] Busca retorna resultados relevantes (full-text search)
   - [ ] Paginação carrega 12 cursos por página
   - [ ] Cards exibem thumbnail, título, preço, avaliação, nº de alunos

2. **Detalhes do Curso**
   - [ ] Vídeo trailer reproduz sem erros
   - [ ] Grade de aulas exibe corretamente (módulos + aulas)
   - [ ] Primeira aula mostra preview (badge "🔓 Grátis")
   - [ ] Botão "Matricular-se" redireciona para login (se não autenticado) ou checkout

3. **Processo de Matrícula**
   - [ ] Checkout exibe resumo correto da compra
   - [ ] Cupom de desconto aplica corretamente
   - [ ] Pagamento via cartão processa em < 30s
   - [ ] Pagamento via PIX gera QR Code válido
   - [ ] Boleto gera PDF para download

4. **Confirmação e Acesso**
   - [ ] Após pagamento aprovado, inscrição ativa em < 10s
   - [ ] Email de confirmação enviado em < 1min
   - [ ] Primeira aula do curso fica acessível imediatamente
   - [ ] Progresso inicia em 0%

5. **Meus Cursos**
   - [ ] Lista apenas cursos com inscrição ativa ou concluída
   - [ ] Progresso calculado corretamente (aulas concluídas / total)
   - [ ] Botão "Continuar" redireciona para próxima aula não assistida
   - [ ] Certificado disponível apenas se `pc_conclusao >= 80%`

6. **Exceções**
   - [ ] Curso lotado exibe mensagem e opção de lista de espera
   - [ ] Pagamento recusado não cria inscrição
   - [ ] Duplicação de inscrição bloqueia nova compra e redireciona para curso existente

### ✅ Testes de Integração

1. **Webhook de Pagamento**
   - [ ] Stripe/MercadoPago envia webhook e sistema processa corretamente
   - [ ] Validação de assinatura HMAC funciona
   - [ ] Retry de webhook em caso de erro (3 tentativas)

2. **Multi-Tenancy**
   - [ ] Cursos de uma empresa não aparecem no catálogo de outra
   - [ ] Inscrições isoladas por `id_empresa`

3. **Performance**
   - [ ] Catálogo carrega em < 2s com 1000+ cursos (cache ativo)
   - [ ] Checkout processa 100 matrículas simultâneas sem erro

---

## 14. Próximos Passos

Após implementação deste caso de uso:

1. **UC002 - Sistema de Gamificação e XP** - Creditar pontos, níveis, badges
2. **UC003 - Mentor IA e RAG** - Dra. Sophie responde dúvidas contextuais
3. **UC004 - Certificações Blockchain** - Gerar NFTs de certificados

---

## 15. Histórico de Revisões

| Versão | Data       | Autor           | Descrição                |
|--------|------------|-----------------|--------------------------|
| 1.0    | 13/11/2025 | Sistema DoctorQ | Criação inicial do UC001 |

---

**Documento gerado como parte do projeto DoctorQ - Universidade da Beleza**
