# 👤 Módulo 04: Pacientes

## Visão Geral

Módulo responsável pelo cadastro e gestão completa de pacientes, incluindo prontuário eletrônico, anamnese, histórico de procedimentos e gestão de favoritos.

**Conformidade:** LGPD - Dados sensíveis criptografados

---

## UC030 - Cadastrar Paciente

**Prioridade:** 🔴 Alta | **Complexidade:** 🟡 Média | **Status:** ✅ Implementado

**Descrição:** Cadastro completo de paciente na clínica com dados pessoais e médicos.

**Atores:**
- Principal: Recepcionista/Profissional
- Secundário: Paciente (autocadastro)

**Pré-condições:**
- Usuário autenticado com permissão de cadastro
- CPF não cadastrado previamente

**Fluxo Principal:**
1. Usuário acessa "Novo Paciente"
2. Sistema exibe formulário de cadastro
3. Usuário preenche dados obrigatórios:
   - Nome completo
   - CPF
   - Data de nascimento
   - Telefone
   - Email
4. Usuário preenche dados opcionais:
   - Endereço completo
   - Convênio médico
   - Contato de emergência
   - RG
5. Sistema valida CPF único
6. Sistema valida idade mínima (18 anos ou responsável)
7. Sistema cria registro de paciente
8. Sistema vincula à clínica (id_empresa)
9. Sistema cria usuário associado (se não existir)
10. Sistema envia email de boas-vindas
11. Sistema exibe confirmação

**Fluxos Alternativos:**

**FA1: Paciente Menor de Idade**
1. No passo 6, sistema detecta idade < 18 anos
2. Sistema solicita dados do responsável:
   - Nome completo
   - CPF
   - Telefone
   - Grau de parentesco
3. Sistema valida dados do responsável
4. Sistema registra responsável legal
5. Continua no passo 7

**FA2: Autocadastro (Paciente)**
1. Paciente acessa formulário público de cadastro
2. Paciente preenche próprios dados
3. Sistema envia código de verificação (SMS/Email)
4. Paciente confirma código
5. Sistema cria registro com st_verificado = true
6. Continua no passo 10

**Fluxos de Exceção:**

**FE1: CPF Já Cadastrado**
1. No passo 5, sistema detecta CPF duplicado
2. Sistema exibe mensagem: "Paciente já cadastrado"
3. Sistema oferece opções:
   - Visualizar cadastro existente
   - Atualizar dados
   - Cancelar
4. Fim do fluxo

**FE2: Email Inválido**
1. No passo 7, validação de email falha
2. Sistema exibe erro de formato
3. Sistema solicita correção
4. Retorna ao passo 3

**Pós-condições:**
- Paciente cadastrado no banco
- Usuário criado (se autocadastro)
- Email de boas-vindas enviado
- Prontuário eletrônico inicializado

**Regras de Negócio:**

- **RN-300:** CPF deve ser único por clínica
- **RN-301:** Idade mínima 18 anos (ou responsável legal)
- **RN-302:** Telefone obrigatório para comunicações
- **RN-303:** Email único se autocadastro
- **RN-304:** Dados sensíveis devem ser criptografados (LGPD)

**Dados de Entrada:**

```typescript
{
  nm_completo: string;
  nr_cpf: string; // 11 dígitos
  dt_nascimento: string; // ISO 8601
  nr_telefone: string;
  nm_email?: string;
  ds_endereco?: {
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
  };
  nm_convenio?: string;
  nr_carteirinha?: string;
  contato_emergencia?: {
    nm_completo: string;
    nr_telefone: string;
    nm_relacao: string;
  };
  responsavel_legal?: {
    nm_completo: string;
    nr_cpf: string;
    nr_telefone: string;
    nm_parentesco: string;
  };
}
```

**Implementação:**
- Backend: `src/services/paciente_service.py::create_paciente()`
- Frontend: `src/app/admin/pacientes/novo/page.tsx`

---

## UC031 - Gerenciar Prontuário

**Prioridade:** 🔴 Alta | **Complexidade:** 🔴 Alta | **Status:** ✅ Implementado

**Descrição:** Registro digital completo do histórico médico do paciente com conformidade LGPD.

**Atores:**
- Principal: Profissional de Estética
- Secundário: Paciente (visualização)

**Pré-condições:**
- Paciente cadastrado
- Profissional autenticado
- Permissão de acesso ao prontuário

**Fluxo Principal:**
1. Profissional acessa prontuário do paciente
2. Sistema verifica permissão de acesso
3. Sistema carrega dados do prontuário:
   - Dados pessoais
   - Alergias e restrições
   - Medicamentos em uso
   - Histórico de procedimentos
   - Evoluções clínicas
   - Fotos de evolução
   - Exames anexados
4. Profissional pode:
   - Visualizar histórico
   - Adicionar evolução
   - Atualizar alergias/medicamentos
   - Anexar arquivos
   - Assinar digitalmente
5. Sistema registra todas as alterações
6. Sistema atualiza dt_atualizacao
7. Sistema registra log de auditoria
8. Sistema exibe confirmação

**Seções do Prontuário:**

### 1. Identificação
- Dados pessoais completos
- Foto do paciente
- Convênio

### 2. Anamnese
- Questionário inicial
- Histórico médico
- Cirurgias prévias
- Tratamentos anteriores

### 3. Alergias e Restrições
- Medicamentos
- Cosméticos
- Alimentos
- Latex/outros

### 4. Medicamentos em Uso
- Nome do medicamento
- Dosagem
- Frequência
- Data de início

### 5. Histórico de Procedimentos
- Data e tipo
- Profissional responsável
- Produtos utilizados
- Observações

### 6. Evoluções Clínicas
- Data e hora
- Profissional
- Descrição da evolução
- Conduta adotada
- Próximos passos

### 7. Anexos
- Exames laboratoriais
- Laudos médicos
- Termos de consentimento
- Fotos (antes/depois)

**Regras de Negócio:**

- **RN-310:** Prontuário armazenado por 20 anos (CFM)
- **RN-311:** Acesso registrado em log de auditoria (LGPD)
- **RN-312:** Paciente tem direito de acesso aos próprios dados
- **RN-313:** Dados sensíveis criptografados em repouso (AES-256)
- **RN-314:** Assinatura digital obrigatória em evoluções
- **RN-315:** Alterações são versionadas (não deletam histórico)

**Dados do Prontuário (JSONB):**

```typescript
{
  identificacao: {
    foto_url: string;
    nm_convenio: string;
    nr_carteirinha: string;
  };
  anamnese: {
    dt_preenchimento: string;
    historico_medico: string[];
    cirurgias_previas: Array<{
      tipo: string;
      data: string;
      local: string;
    }>;
    tratamentos_anteriores: Array<{
      tipo: string;
      periodo: string;
      resultado: string;
    }>;
  };
  alergias: Array<{
    tipo: 'medicamento' | 'cosmetico' | 'alimento' | 'outro';
    descricao: string;
    gravidade: 'leve' | 'moderada' | 'grave';
    dt_registro: string;
  }>;
  medicamentos: Array<{
    nm_medicamento: string;
    ds_dosagem: string;
    ds_frequencia: string;
    dt_inicio: string;
    dt_fim?: string;
  }>;
  evolucoes: Array<{
    id_evolucao: uuid;
    dt_evolucao: string;
    id_profissional: uuid;
    nm_profissional: string;
    ds_evolucao: string;
    ds_conduta: string;
    ds_proximos_passos: string;
    assinatura_digital: string;
  }>;
  anexos: Array<{
    id_anexo: uuid;
    nm_arquivo: string;
    tp_arquivo: string;
    ds_url: string;
    dt_upload: string;
    id_profissional: uuid;
  }>;
}
```

**Segurança (LGPD):**

- ✅ Criptografia AES-256 em repouso
- ✅ Acesso auditado
- ✅ Consentimento explícito do paciente
- ✅ Direito ao esquecimento
- ✅ Portabilidade de dados
- ✅ Anonimização em analytics

**Implementação:**
- Backend: `src/services/prontuario_service.py`
- Frontend: `src/app/profissional/pacientes/[id]/prontuario/page.tsx`

---

## UC032 - Registrar Anamnese

**Prioridade:** 🟡 Média | **Complexidade:** 🟡 Média | **Status:** 🔄 Em Desenvolvimento

**Descrição:** Questionário pré-atendimento personalizado por tipo de procedimento.

**Fluxo Principal:**
1. Profissional solicita anamnese para procedimento
2. Sistema carrega template de anamnese:
   - Perguntas padrão
   - Perguntas específicas do procedimento
3. Profissional/Paciente preenche questionário
4. Sistema valida respostas obrigatórias
5. Sistema salva anamnese no prontuário
6. Sistema identifica alertas (ex: alergias)
7. Sistema exibe resumo com alertas
8. Profissional assina digitalmente

**Templates de Anamnese:**

### Anamnese Geral (Todas os Procedimentos)
- Histórico de saúde
- Alergias conhecidas
- Medicamentos em uso
- Gestação/Lactação
- Doenças crônicas
- Cirurgias prévias

### Anamnese Específica: Preenchimento Facial
- Uso prévio de preenchedores
- Reações anteriores
- Uso de anticoagulantes
- Histórico de herpes
- Expectativas do tratamento

### Anamnese Específica: Depilação a Laser
- Tipo de pele (Fitzpatrick)
- Bronzeamento recente
- Uso de fotossensibilizantes
- Histórico de queloides
- Métodos depilatórios anteriores

**Regras de Negócio:**

- **RN-320:** Anamnese obrigatória antes do primeiro procedimento
- **RN-321:** Atualização anual obrigatória
- **RN-322:** Perguntas sensíveis requerem consentimento explícito
- **RN-323:** Alertas críticos bloqueiam procedimento

---

## UC033 - Adicionar Fotos de Evolução

**Prioridade:** 🟡 Média | **Complexidade:** 🟡 Média | **Status:** ✅ Implementado

**Descrição:** Documentação visual antes/durante/depois de procedimentos.

**Fluxo Principal:**
1. Profissional acessa prontuário do paciente
2. Profissional seleciona "Adicionar Fotos"
3. Sistema solicita contexto:
   - Momento: Antes / Durante / Depois
   - Procedimento relacionado
   - Ângulo/região fotografada
4. Profissional faz upload das fotos
5. Sistema valida:
   - Formato (JPG, PNG, WebP)
   - Tamanho (max 10MB)
   - Qualidade mínima
6. Sistema processa fotos:
   - Compressão inteligente
   - Geração de thumbnails
   - Extração de EXIF
   - Detecção de faces (blur opcional)
7. Sistema armazena em storage seguro
8. Sistema vincula ao prontuário
9. Sistema atualiza álbum de evolução

**Regras de Negócio:**

- **RN-330:** Fotos requerem consentimento explícito do paciente
- **RN-331:** Opção de blur facial para privacidade
- **RN-332:** Máximo 10MB por foto
- **RN-333:** Fotos armazenadas por prazo legal (20 anos)

---

## UC034 - Consultar Histórico de Procedimentos

**Prioridade:** 🟡 Média | **Complexidade:** 🟢 Baixa | **Status:** ✅ Implementado

**Descrição:** Visualizar todos procedimentos realizados pelo paciente.

**Fluxo Principal:**
1. Usuário acessa "Histórico de Procedimentos"
2. Sistema carrega lista de procedimentos
3. Sistema exibe:
   - Data do procedimento
   - Tipo de procedimento
   - Profissional responsável
   - Clínica
   - Status (realizado, cancelado)
   - Valor pago
4. Usuário pode filtrar por:
   - Período
   - Tipo de procedimento
   - Profissional
   - Clínica
5. Usuário pode:
   - Ver detalhes
   - Exportar PDF
   - Agendar novo procedimento similar

**Dados Exibidos:**

```typescript
{
  id_procedimento_realizado: uuid;
  dt_realizacao: string;
  procedimento: {
    nm_procedimento: string;
    ds_categoria: string;
  };
  profissional: {
    nm_completo: string;
    ds_foto_url: string;
    nm_especialidade: string;
  };
  clinica: {
    nm_fantasia: string;
    ds_endereco: string;
  };
  st_procedimento: 'realizado' | 'cancelado' | 'reagendado';
  nr_valor_pago: number;
  ds_observacoes: string;
  avaliacoes: {
    nota: number;
    comentario: string;
  };
  fotos_evolucao: number; // Quantidade
}
```

---

## UC035 - Gerenciar Favoritos

**Prioridade:** 🟢 Baixa | **Complexidade:** 🟢 Baixa | **Status:** ✅ Implementado

**Descrição:** Salvar clínicas, profissionais e procedimentos favoritos.

**Fluxo Principal:**
1. Paciente acessa página de clínica/profissional/procedimento
2. Paciente clica em ícone de favorito ⭐
3. Sistema adiciona à lista de favoritos
4. Sistema exibe confirmação visual
5. Paciente pode acessar "Meus Favoritos"
6. Sistema exibe todos os favoritos agrupados:
   - Clínicas
   - Profissionais
   - Procedimentos
7. Paciente pode:
   - Remover favorito
   - Agendar procedimento
   - Compartilhar favoritos

**Notificações de Favoritos:**
- Novas promoções em clínicas favoritas
- Novos procedimentos de profissionais favoritos
- Alterações de horário/disponibilidade

---

## UC036 - Buscar Clínicas e Procedimentos

**Prioridade:** 🔴 Alta | **Complexidade:** 🔴 Alta | **Status:** ✅ Implementado

**Descrição:** Sistema de busca inteligente com múltiplos filtros e IA.

**Fluxo Principal:**
1. Paciente acessa página de busca
2. Paciente informa critérios:
   - Texto livre (procedimento, clínica, profissional)
   - Localização (CEP ou geolocalização)
   - Filtros adicionais
3. Sistema processa busca:
   - Full-text search no banco
   - Busca semântica com IA (embeddings)
   - Geo-localização (raio em km)
4. Sistema aplica filtros:
   - Preço (min-max)
   - Avaliação (min estrelas)
   - Especialidade
   - Convênio aceito
   - Disponibilidade (próximos dias)
5. Sistema ordena resultados:
   - Relevância (padrão)
   - Distância
   - Preço (crescente/decrescente)
   - Avaliação (maior primeiro)
   - Mais agendado
6. Sistema exibe resultados paginados
7. Paciente pode:
   - Ver detalhes
   - Favoritar
   - Agendar
   - Compartilhar

**Filtros Disponíveis:**

```typescript
{
  query: string; // Busca textual
  localizacao: {
    lat: number;
    lng: number;
    raio_km: number; // Default: 10km
  };
  ou_cep: string;
  filtros: {
    preco_min?: number;
    preco_max?: number;
    avaliacao_min?: number; // 0-5
    especialidades?: string[]; // IDs
    convenios?: string[]; // IDs
    disponibilidade_proximos_dias?: number; // Default: 30
    aceita_agendamento_online?: boolean;
  };
  ordenacao: 'relevancia' | 'distancia' | 'preco_asc' | 'preco_desc' | 'avaliacao' | 'mais_agendado';
  page: number;
  size: number; // Default: 20
}
```

**Algoritmo de Busca:**

1. **Full-Text Search (PostgreSQL)**
   - Busca em: nm_procedimento, ds_procedimento, nm_clinica, nm_profissional
   - Ranking por relevância (ts_rank)

2. **Busca Semântica (Embeddings)**
   - Query convertida para embedding
   - Busca por similaridade (cosine) em pgvector
   - Top 100 resultados

3. **Geo-Localização**
   - Filtro por distância (ST_DWithin)
   - Cálculo de distância real (ST_Distance)

4. **Scoring Final**
   ```python
   score = (
       0.4 * text_relevance +
       0.3 * semantic_similarity +
       0.2 * rating_score +
       0.1 * distance_score
   )
   ```

**Implementação:**
- Backend: `src/services/search_service.py`
- Frontend: `src/app/busca/page.tsx`

---

## 🗄️ Modelo de Dados

### Tabela: tb_pacientes

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id_paciente | UUID | PK |
| id_user | UUID | FK - Usuário associado (se autocadastro) |
| id_empresa | UUID | FK - Clínica principal |
| nm_completo | VARCHAR(255) | Nome completo |
| nr_cpf | VARCHAR(11) | CPF único |
| dt_nascimento | DATE | Data de nascimento |
| nr_telefone | VARCHAR(20) | Telefone principal |
| nm_email | VARCHAR(255) | Email (opcional) |
| ds_endereco | JSONB | Endereço completo |
| nm_convenio | VARCHAR(100) | Convênio médico |
| nr_carteirinha | VARCHAR(50) | Número da carteirinha |
| ds_contato_emergencia | JSONB | Contato de emergência |
| ds_responsavel_legal | JSONB | Responsável (se menor) |
| ds_prontuario_eletronico | JSONB | Prontuário (ENCRYPTED) |
| dt_ultima_consulta | DATE | Última consulta |
| nr_total_consultas | INTEGER | Total de consultas |
| st_ativo | CHAR(1) | 'S' ou 'N' |
| st_verificado | BOOLEAN | Verificado (autocadastro) |
| dt_criacao | TIMESTAMP | Criado em |
| dt_atualizacao | TIMESTAMP | Atualizado em |

### Tabela: tb_favoritos

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id_favorito | UUID | PK |
| id_paciente | UUID | FK |
| tp_favorito | VARCHAR(20) | 'clinica', 'profissional', 'procedimento' |
| id_referencia | UUID | ID do item favoritado |
| dt_criacao | TIMESTAMP | Quando favoritou |

---

## 📊 Endpoints da API

```http
# Pacientes
POST   /pacientes                  - Criar paciente
GET    /pacientes                  - Listar pacientes
GET    /pacientes/{id}             - Obter paciente
PATCH  /pacientes/{id}             - Atualizar paciente
DELETE /pacientes/{id}             - Desativar paciente

# Prontuário
GET    /pacientes/{id}/prontuario  - Obter prontuário
POST   /pacientes/{id}/evolucoes   - Adicionar evolução
POST   /pacientes/{id}/anexos      - Anexar arquivo
GET    /pacientes/{id}/historico   - Histórico de procedimentos

# Fotos
POST   /pacientes/{id}/fotos       - Upload de fotos
GET    /pacientes/{id}/fotos       - Listar fotos
DELETE /fotos/{id}                 - Remover foto

# Favoritos
POST   /favoritos                  - Adicionar favorito
GET    /favoritos                  - Listar favoritos
DELETE /favoritos/{id}             - Remover favorito

# Busca
GET    /busca                      - Buscar clínicas/procedimentos
GET    /busca/sugestoes            - Auto-complete
```

---

## 🧪 Cenários de Teste

**CT-300: Cadastrar paciente com dados válidos**
- Resultado: HTTP 201 + paciente criado + prontuário inicializado

**CT-301: Cadastrar paciente menor de idade**
- Resultado: HTTP 201 + responsável legal registrado

**CT-302: Cadastrar paciente com CPF duplicado**
- Resultado: HTTP 400 + mensagem de erro

**CT-303: Registrar evolução em prontuário**
- Resultado: Evolução salva + log de auditoria + assinatura digital

**CT-304: Upload de fotos de evolução**
- Resultado: Fotos comprimidas + thumbnails gerados + vinculadas ao prontuário

**CT-305: Busca por procedimento com filtros**
- Resultado: Resultados ordenados por score + paginados

---

*Documentação do Módulo Pacientes - DoctorQ v1.0.0*
