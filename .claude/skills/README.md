# Skills do Projeto DoctorQ

Este diretório contém Skills especializadas do Claude Code para auxiliar no desenvolvimento e manutenção do projeto DoctorQ.

## ⚡ Otimizações (Atualizado 02/11/2025)

**Nova Política de Documentação:**
- ✅ Atualizar APENAS `CHANGELOG.md` após implementações
- ❌ NÃO criar novos arquivos `.md`
- ✅ Consultar `GUIA_PADROES.md` ANTES de implementar
- ⚡ **Economia de 70% em tokens** com novo workflow

📖 **Leia:** [OTIMIZACOES_TOKEN.md](../OTIMIZACOES_TOKEN.md) para estratégias detalhadas

---

## 📚 Skills Disponíveis

### 1. **doctorq-arch** - Arquitetura e Documentação Técnica
Consulta rápida da arquitetura, stack tecnológico, fluxos de dados e integrações.

**Quando usar**:
- Entender a estrutura do sistema
- Consultar decisões arquiteturais
- Verificar stack de tecnologias
- Planejar novas funcionalidades

**Exemplo de uso**:
```
Como funciona o sistema de autenticação do DoctorQ?
```

---

### 2. **doctorq-doc-update** - Atualização de Documentação
Mantém a documentação sincronizada com o código após implementações.

**Quando usar**:
- Após implementar novas funcionalidades
- Quando modificar rotas ou modelos
- Ao finalizar sprints
- Para mover documentos para DOC_Executadas/

**Exemplo de uso**:
```
Acabei de implementar o módulo de avaliações. Atualiza a documentação?
```

---

### 3. **doctorq-roadmap** - Gestão de Roadmap
Consulta e atualiza o roadmap do produto, gerencia sprints e funcionalidades planejadas.

**Quando usar**:
- Planejar próximos sprints
- Verificar prioridades
- Marcar funcionalidades como concluídas
- Consultar visão de longo prazo

**Exemplo de uso**:
```
Quais são as próximas funcionalidades planejadas para Q1 2026?
```

---

### 4. **doctorq-onboarding** - Guia de Onboarding
Guia completo para novos desenvolvedores configurarem ambiente e começarem a contribuir.

**Quando usar**:
- Integrar novos desenvolvedores
- Configurar ambiente local
- Relembrar processos e padrões
- Ensinar estrutura do projeto

**Exemplo de uso**:
```
Sou novo no projeto DoctorQ. Como começo?
```

---

### 5. **doctorq-api-check** - Auditoria de APIs
Verifica se todas as rotas da API estão documentadas e sincronizadas.

**Quando usar**:
- Antes de releases
- Após adicionar novas rotas
- Para auditoria de endpoints
- Revisar PRs com mudanças em rotas

**Exemplo de uso**:
```
Verifica se todas as rotas da API estão documentadas
```

---

### 6. **doctorq-frontend-routes** - Mapeamento de Rotas Frontend
Mapeia e documenta páginas do Next.js App Router.

**Quando usar**:
- Após adicionar novas páginas
- Para auditoria da estrutura
- Antes de releases
- Revisar PRs com novas páginas

**Exemplo de uso**:
```
Mapeia todas as rotas do frontend e atualiza a documentação
```

---

### 7. **doctorq-db-schema** - Validação de Schema do Banco
Verifica consistência entre migrations, modelos ORM e banco de dados.

**Quando usar**:
- Ao criar/modificar tabelas
- Verificar integridade referencial
- Antes de releases
- Diagnosticar problemas de schema

**Exemplo de uso**:
```
Valida o schema do banco de dados e documenta as tabelas principais
```

---

## 🚀 Como Usar as Skills

### No Claude Code

1. **Via Comando Natural**:
   Simplesmente descreva o que precisa e o Claude identificará a skill apropriada:
   ```
   Como funciona a autenticação? (→ usará doctorq-arch)
   Atualiza a documentação após minha implementação (→ usará doctorq-doc-update)
   ```

2. **Referência Explícita**:
   Você pode mencionar a skill diretamente:
   ```
   Use a skill doctorq-roadmap para mostrar o que vem em Q1 2026
   ```

3. **Múltiplas Skills**:
   Pode combinar skills para tarefas complexas:
   ```
   Verifica as APIs (doctorq-api-check) e atualiza a documentação (doctorq-doc-update)
   ```

### Fluxos de Trabalho Comuns

#### Após Implementar Nova Funcionalidade
```
1. "Verifica se as rotas da API estão documentadas" (doctorq-api-check)
2. "Atualiza a documentação com as mudanças" (doctorq-doc-update)
3. "Marca a funcionalidade como concluída no roadmap" (doctorq-roadmap)
```

#### Preparação para Release
```
1. "Audita todas as rotas da API" (doctorq-api-check)
2. "Mapeia as rotas do frontend" (doctorq-frontend-routes)
3. "Valida o schema do banco" (doctorq-db-schema)
4. "Atualiza documentação completa" (doctorq-doc-update)
```

#### Onboarding de Novo Desenvolvedor
```
1. "Guia de onboarding para novo dev" (doctorq-onboarding)
2. "Explica a arquitetura do sistema" (doctorq-arch)
3. "Mostra o roadmap atual" (doctorq-roadmap)
```

---

## 📁 Estrutura de Documentação

As skills interagem com estes documentos:

```
DoctorQ/
├── DOC_Arquitetura/              # Documentação de arquitetura
│   ├── DOCUMENTACAO_ARQUITETURA_COMPLETA_DOCTORQ.md  # Doc principal
│   ├── MAPEAMENTO_ROTAS_FRONTEND.md                  # Rotas frontend
│   └── README.md                                      # Índice
├── DOC_Executadas/                # Documentos de sprints finalizados
│   └── [arquivos movidos após conclusão]
├── estetiQ-api/                   # Backend
│   ├── src/
│   │   ├── routes/               # Rotas da API
│   │   ├── models/               # Models ORM
│   │   └── services/             # Lógica de negócio
│   └── database/                 # Migrations SQL
└── estetiQ-web/                   # Frontend
    └── src/app/                  # Next.js App Router
```

---

## 🔧 Personalização de Skills

Para modificar ou criar novas skills:

1. **Editar Skill Existente**:
   ```bash
   nano .claude/skills/doctorq-[nome].md
   ```

2. **Criar Nova Skill**:
   ```bash
   touch .claude/skills/doctorq-[nova-skill].md
   ```

   Use este template:
   ```markdown
   # [Nome da Skill]

   ## Descrição
   [Breve descrição da skill]

   ## Quando Usar
   - Caso de uso 1
   - Caso de uso 2

   ## Instruções
   [Instruções detalhadas para o Claude]

   ## Exemplo de Uso
   [Exemplos práticos]

   ## Referências
   [Links para arquivos relevantes]
   ```

3. **Atualizar este README**:
   Adicione a nova skill à lista acima.

---

## 💡 Boas Práticas

1. **Use Skills Proativamente**: Não espere problemas, use skills regularmente para manter tudo sincronizado.

2. **Combine Skills**: Muitas tarefas se beneficiam de usar múltiplas skills em sequência.

3. **Mantenha Documentação Atualizada**: Use `doctorq-doc-update` após cada implementação significativa.

4. **Valide Antes de Releases**: Execute auditoria completa (api-check, frontend-routes, db-schema) antes de cada release.

5. **Onboarding Estruturado**: Sempre use `doctorq-onboarding` para novos membros do time.

---

## 🐛 Troubleshooting

**Skill não está sendo reconhecida?**
- Verifique se o arquivo está em `.claude/skills/`
- Confirme que a extensão é `.md`
- Reinicie o Claude Code se necessário

**Skill não encontra arquivos?**
- Verifique se os caminhos nos arquivos de skill estão corretos
- Confira se você está no diretório correto do projeto

**Documentação desatualizada?**
- Execute `doctorq-doc-update` para sincronizar
- Verifique se migrations foram aplicadas
- Compare código com documentação manualmente

---

## 📞 Suporte

- **Dúvidas sobre Skills**: Consulte este README
- **Problemas Técnicos**: Abra issue no repositório
- **Sugestões de Melhoria**: Proponha via PR ou discussão no time

---

**Última Atualização**: 31 de Outubro de 2025
**Mantido por**: Equipe de Arquitetura DoctorQ
