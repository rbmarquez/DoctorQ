# Guia de Capturas de Tela para o Manual do Usuário

Este documento lista todas as capturas de tela necessárias para completar o Manual do Usuário do DoctorQ.

## Estrutura de Pastas

Crie a seguinte estrutura para armazenar as imagens:

```
DOC_Arquitetura/
└── imagens_manual/
    ├── 01_geral/
    │   ├── logo.png
    │   ├── tela_login.png
    │   ├── tela_cadastro.png
    │   └── tela_recuperar_senha.png
    │
    ├── 02_paciente/
    │   ├── dashboard_paciente.png
    │   ├── busca_profissionais.png
    │   ├── perfil_profissional.png
    │   ├── selecao_data_hora.png
    │   ├── confirmacao_agendamento.png
    │   ├── lista_agendamentos.png
    │   ├── tela_avaliacao.png
    │   ├── marketplace.png
    │   ├── prontuario.png
    │   └── chat_mensagens.png
    │
    ├── 03_profissional/
    │   ├── dashboard_profissional.png
    │   ├── agenda_dia.png
    │   ├── configuracao_horarios.png
    │   ├── tela_atendimento.png
    │   ├── lista_prontuarios.png
    │   ├── financeiro_profissional.png
    │   └── lista_procedimentos.png
    │
    ├── 04_clinica/
    │   ├── dashboard_clinica.png
    │   ├── gestao_equipe.png
    │   ├── agenda_consolidada.png
    │   ├── relatorios.png
    │   └── vagas.png
    │
    ├── 05_fornecedor/
    │   ├── dashboard_fornecedor.png
    │   ├── cadastro_produto.png
    │   ├── gestao_pedidos.png
    │   └── controle_estoque.png
    │
    └── 06_admin/
        ├── dashboard_admin.png
        ├── gestao_usuarios.png
        └── gestao_ia.png
```

---

## Lista de Capturas Necessárias

### 1. Telas Gerais (Autenticação)

| # | Tela | URL | Descrição | Dimensão |
|---|------|-----|-----------|----------|
| 1.1 | Login | `/login` | Tela de login com campos de e-mail/senha e botões OAuth | 1280x720 |
| 1.2 | Cadastro | `/cadastro` | Formulário de cadastro completo | 1280x720 |
| 1.3 | Recuperar Senha | `/esqueci-senha` | Tela para solicitar recuperação | 1280x720 |

### 2. Telas do Paciente

| # | Tela | URL | Descrição | Dimensão |
|---|------|-----|-----------|----------|
| 2.1 | Dashboard | `/paciente/dashboard` | Painel principal com estatísticas e ações rápidas | 1280x900 |
| 2.2 | Busca de Profissionais | `/busca` | Tela de busca com filtros aplicados | 1280x900 |
| 2.3 | Perfil do Profissional | `/profissional/[id]` | Página de perfil completo de um profissional | 1280x1200 |
| 2.4 | Seleção de Data/Hora | `/agendamento/[id]` | Calendário e horários disponíveis | 1280x800 |
| 2.5 | Confirmação de Agendamento | `/agendamento/confirmar` | Resumo do agendamento antes de confirmar | 1280x800 |
| 2.6 | Lista de Agendamentos | `/paciente/agendamentos` | Lista com próximos e histórico | 1280x800 |
| 2.7 | Tela de Avaliação | `/paciente/avaliacoes/nova` | Formulário de avaliação com estrelas | 1280x800 |
| 2.8 | Marketplace | `/marketplace` | Página principal do marketplace | 1280x900 |
| 2.9 | Prontuário | `/paciente/prontuario` | Histórico médico do paciente | 1280x800 |
| 2.10 | Chat/Mensagens | `/paciente/mensagens` | Sistema de mensagens com conversa aberta | 1280x800 |

### 3. Telas do Profissional

| # | Tela | URL | Descrição | Dimensão |
|---|------|-----|-----------|----------|
| 3.1 | Dashboard | `/profissional/dashboard` | Painel com métricas e agenda do dia | 1280x900 |
| 3.2 | Agenda | `/profissional/agenda` | Visualização da agenda diária/semanal | 1280x900 |
| 3.3 | Configuração de Horários | `/profissional/configuracoes` | Tela de configuração de disponibilidade | 1280x800 |
| 3.4 | Tela de Atendimento | `/profissional/atendimento/[id]` | Tela durante um atendimento ativo | 1280x900 |
| 3.5 | Lista de Prontuários | `/profissional/prontuarios` | Lista de pacientes com prontuário | 1280x800 |
| 3.6 | Financeiro | `/profissional/financeiro` | Dashboard financeiro | 1280x900 |
| 3.7 | Procedimentos | `/profissional/procedimentos` | Lista de procedimentos oferecidos | 1280x800 |

### 4. Telas da Clínica

| # | Tela | URL | Descrição | Dimensão |
|---|------|-----|-----------|----------|
| 4.1 | Dashboard | `/clinica/dashboard` | Painel gerencial da clínica | 1280x900 |
| 4.2 | Gestão de Equipe | `/clinica/equipe` | Lista de profissionais e funcionários | 1280x800 |
| 4.3 | Agenda Consolidada | `/clinica/agendamentos` | Agenda de todos os profissionais | 1280x900 |
| 4.4 | Relatórios | `/clinica/relatorios` | Dashboard de relatórios e gráficos | 1280x900 |
| 4.5 | Vagas | `/clinica/vagas` | Gestão de vagas publicadas | 1280x800 |

### 5. Telas do Fornecedor

| # | Tela | URL | Descrição | Dimensão |
|---|------|-----|-----------|----------|
| 5.1 | Dashboard | `/fornecedor/dashboard` | Painel principal do fornecedor | 1280x900 |
| 5.2 | Cadastro de Produto | `/fornecedor/produtos/novo` | Formulário de cadastro de produto | 1280x900 |
| 5.3 | Gestão de Pedidos | `/fornecedor/pedidos` | Lista de pedidos com status | 1280x800 |
| 5.4 | Controle de Estoque | `/fornecedor/estoque` | Tabela de controle de estoque | 1280x800 |

### 6. Telas do Administrador

| # | Tela | URL | Descrição | Dimensão |
|---|------|-----|-----------|----------|
| 6.1 | Dashboard | `/admin/dashboard` | Painel administrativo do sistema | 1280x900 |
| 6.2 | Gestão de Usuários | `/admin/usuarios` | Lista de todos os usuários | 1280x800 |
| 6.3 | Gestão de IA | `/admin/ia/agentes` | Lista de agentes de IA | 1280x800 |

---

## Instruções para Captura

### Preparação

1. **Resolução do Monitor**: Configure para 1920x1080 ou superior
2. **Zoom do Navegador**: Mantenha em 100%
3. **Tema**: Use o tema claro (padrão)
4. **Dados**: Popule o sistema com dados de exemplo realistas

### Dados de Exemplo Sugeridos

```
PACIENTES:
- Maria Silva, 35 anos
- João Santos, 42 anos
- Ana Oliveira, 28 anos

PROFISSIONAIS:
- Dra. Ana Costa - Dermatologista
- Dr. Carlos Silva - Esteticista
- Dra. Fernanda Lima - Biomédica

CLÍNICAS:
- Clínica Beleza Total
- Spa & Estética Premium
- Derma Center

PROCEDIMENTOS:
- Botox (R$ 350)
- Limpeza de Pele (R$ 180)
- Preenchimento Labial (R$ 800)
- Peeling Químico (R$ 250)
```

### Ferramentas Recomendadas

| Ferramenta | Plataforma | Uso |
|------------|------------|-----|
| **Snagit** | Windows/Mac | Captura profissional com anotações |
| **Lightshot** | Windows/Mac | Captura rápida |
| **CleanShot X** | Mac | Captura com limpeza de interface |
| **ShareX** | Windows | Gratuito com muitos recursos |
| **Chrome DevTools** | Todos | Captura de elemento específico |

### Passo a Passo

1. **Acesse a URL** da tela a ser capturada
2. **Aguarde o carregamento** completo da página
3. **Verifique os dados** - devem ser realistas e em português
4. **Capture a tela** na dimensão especificada
5. **Salve o arquivo** no formato PNG
6. **Nomeie conforme** o padrão estabelecido

### Tratamento de Imagens

1. **Formato**: PNG (preferencial) ou JPG de alta qualidade
2. **Compressão**: Use TinyPNG ou similar para reduzir tamanho
3. **Anotações**: Se necessário, adicione setas ou destaques
4. **Dados Sensíveis**: Oculte dados reais de usuários

---

## Checklist de Capturas

### Geral
- [ ] Logo do sistema
- [ ] Tela de login
- [ ] Tela de cadastro
- [ ] Tela de recuperação de senha

### Paciente
- [ ] Dashboard do paciente
- [ ] Busca de profissionais
- [ ] Perfil do profissional
- [ ] Seleção de data/hora
- [ ] Confirmação de agendamento
- [ ] Lista de agendamentos
- [ ] Tela de avaliação
- [ ] Marketplace
- [ ] Prontuário
- [ ] Chat/Mensagens

### Profissional
- [ ] Dashboard do profissional
- [ ] Agenda (dia/semana)
- [ ] Configuração de horários
- [ ] Tela de atendimento
- [ ] Lista de prontuários
- [ ] Dashboard financeiro
- [ ] Lista de procedimentos

### Clínica
- [ ] Dashboard da clínica
- [ ] Gestão de equipe
- [ ] Agenda consolidada
- [ ] Relatórios
- [ ] Gestão de vagas

### Fornecedor
- [ ] Dashboard do fornecedor
- [ ] Cadastro de produto
- [ ] Gestão de pedidos
- [ ] Controle de estoque

### Administrador
- [ ] Dashboard administrativo
- [ ] Gestão de usuários
- [ ] Gestão de IA

---

## Integração com o Manual

Após capturar as imagens, atualize o manual substituindo os placeholders:

```markdown
<!-- SCREENSHOT: Inserir captura da tela de login -->
> **📸 Imagem:** Tela de login
> **Localização:** `/login`
```

Por:

```markdown
![Tela de Login](./imagens_manual/01_geral/tela_login.png)
*Figura 1.1: Tela de login do DoctorQ*
```

---

## Exportação para PDF

Para gerar o manual em PDF com as imagens:

1. Instale o `pandoc` e `wkhtmltopdf`
2. Execute:
   ```bash
   pandoc MANUAL_USUARIO_DOCTORQ.md -o manual_doctorq.pdf \
     --pdf-engine=wkhtmltopdf \
     --toc \
     --toc-depth=3 \
     -V geometry:margin=2cm
   ```

Ou use ferramentas online como:
- **GitBook**
- **Notion** (exportar para PDF)
- **mdBook** (Rust)
- **Docusaurus** (React)

---

*Última atualização: Novembro 2025*
