# Guia de Otimização de Tokens - Claude Code

> **Estratégias para reduzir consumo de tokens e aumentar agilidade**

**Data:** 02/11/2025

---

## 🎯 Objetivo

Reduzir o consumo de tokens em **50-70%** mantendo a qualidade das respostas.

---

## 📊 Análise de Uso Atual

### Principais Consumidores de Tokens:

| Ação | Tokens Estimados | Frequência | Total/Sessão |
|------|------------------|------------|--------------|
| Read arquivo grande (96KB) | ~25.000 | 3-5x | 75.000-125.000 |
| Read skill completa | ~2.000 | 8x | 16.000 |
| Grep com output grande | ~5.000 | 5x | 25.000 |
| Bash com output verboso | ~1.000 | 20x | 20.000 |
| **Total Típico** | | | **~136.000-186.000** |

**Budget disponível:** 200.000 tokens
**Uso atual:** 70-90% do budget em sessões complexas

---

## ✅ Estratégias de Otimização

### 1. **Leitura Seletiva de Arquivos**

#### ❌ Evitar:
```bash
# Ler arquivo completo de 96KB
Read: /mnt/repositorios/DoctorQ/DOC_Arquitetura/DOCUMENTACAO_ARQUITETURA_COMPLETA_DOCTORQ.md
# Custo: ~25.000 tokens
```

#### ✅ Fazer:
```bash
# Ler apenas seção específica com grep
Bash: grep -A 50 "## 3. Funcionalidades" /mnt/repositorios/DoctorQ/DOC_Arquitetura/DOCUMENTACAO_ARQUITETURA_COMPLETA_DOCTORQ.md
# Custo: ~1.500 tokens (redução de 94%)

# Ou usar Read com offset/limit
Read: arquivo.md (offset: 100, limit: 50)
# Custo: ~1.200 tokens
```

### 2. **Cache de Informações Comuns**

**Criar um cache mental das estruturas:**

```markdown
# Ao invés de ler repetidamente, memorizar:

ESTRUTURA DO PROJETO:
- Backend: src/routes/, src/services/, src/models/
- Frontend: src/app/, src/components/, src/hooks/
- DB: database/migration_*.sql

CONVENÇÕES:
- Tabelas: tb_[plural]
- Colunas: id_, nm_, ds_, vl_, dt_, fg_, st_, qt_, pc_, nr_
- Backend: snake_case
- Frontend: camelCase/PascalCase
- APIs: Trailing slash obrigatório
```

### 3. **Grep Focado ao Invés de Read**

```bash
# ❌ Ler arquivo inteiro
Read: src/routes/usuario.py (500 linhas)

# ✅ Grep apenas o que precisa
Grep: "def criar_usuario" src/routes/usuario.py (-A 20)
```

### 4. **Bash Output Limitado**

```bash
# ❌ Output verboso
Bash: find . -name "*.py" | wc -l

# ✅ Output direto
Bash: find . -name "*.py" | wc -l
# Ou com head/tail
Bash: ls -la | head -20
```

### 5. **Skills Condensadas**

**Antes (132 linhas, 4.3KB):**
```markdown
# doctorq-doc-update.md
- Instruções detalhadas
- Exemplos longos
- Templates completos
```

**Depois (65 linhas, 2.1KB):**
```markdown
# doctorq-doc-update.md
- Instruções essenciais
- Template resumido
- Referências quick
```

**Economia:** ~50% de tokens por skill

### 6. **Evitar Re-leitura Desnecessária**

```python
# ❌ Padrão ineficiente
Read: GUIA_PADROES.md (toda vez que implementar)
Read: DOCUMENTACAO_ARQUITETURA... (toda vez)

# ✅ Padrão eficiente
# Ler GUIA_PADROES.md apenas 1x no início da sessão
# Criar cache mental
# Consultar via grep apenas quando necessário
```

### 7. **Documentação Única (CHANGELOG)**

**Economia massiva:**

```markdown
# ❌ Antes (antiga política)
- Criar IMPLEMENTACAO_X.md (~10.000 tokens para Write)
- Atualizar DOCUMENTACAO_ARQUITETURA... (~25.000 tokens para Read+Write)
- Atualizar STATUS_... (~5.000 tokens)
Total: ~40.000 tokens

# ✅ Agora (nova política)
- Atualizar apenas CHANGELOG.md (~2.000 tokens)
Total: ~2.000 tokens

Economia: 95% (38.000 tokens economizados)
```

---

## 🚀 Workflow Otimizado (Exemplo)

### Implementar Nova Feature

**Fluxo Antigo (~180.000 tokens):**
```
1. Read DOCUMENTACAO_ARQUITETURA... (25.000)
2. Read GUIA_PADROES.md (3.000)
3. Read skill doctorq-onboarding.md (2.500)
4. Implementar feature
5. Read todos os arquivos de doc novamente (25.000)
6. Write IMPLEMENTACAO_*.md (10.000)
7. Update DOCUMENTACAO_ARQUITETURA... (30.000)
8. Update outros docs (20.000)
9. Testes e ajustes (múltiplas reads) (60.000)
Total: ~175.000 tokens
```

**Fluxo Novo (~50.000 tokens):**
```
1. Grep seção relevante de GUIA_PADROES.md (500)
2. Implementar feature seguindo padrões em cache
3. Testes (reads focadas) (10.000)
4. Read CHANGELOG.md (apenas topo, 500 tokens)
5. Edit CHANGELOG.md (adicionar entrada, 1.500)
Total: ~50.000 tokens

Economia: 72% (125.000 tokens economizados)
```

---

## 📋 Checklist de Otimização

### Antes de Usar Ferramentas:

- [ ] Preciso REALMENTE ler o arquivo inteiro?
- [ ] Posso usar `grep` ao invés de `Read`?
- [ ] Posso usar `Read` com `offset`/`limit`?
- [ ] Já tenho essa informação em cache mental?
- [ ] Posso usar `head`/`tail` para limitar output?

### Durante Implementação:

- [ ] Estou seguindo padrões em cache (sem re-ler)?
- [ ] Estou usando comandos bash concisos?
- [ ] Estou evitando reads repetidas?

### Após Implementação:

- [ ] Vou atualizar APENAS o CHANGELOG.md?
- [ ] Não vou criar novos arquivos `.md`?
- [ ] Não vou ler docs desnecessários?

---

## 🎓 Exemplos Práticos

### Exemplo 1: Verificar Nomenclatura de Coluna

**❌ Ineficiente (25.000 tokens):**
```bash
Read: /mnt/repositorios/DoctorQ/DOC_Arquitetura/GUIA_PADROES.md
# Ler tudo para achar prefixo de coluna
```

**✅ Eficiente (500 tokens):**
```bash
Bash: grep -A 10 "Prefixos por Tipo" /mnt/repositorios/DoctorQ/DOC_Arquitetura/GUIA_PADROES.md
```

### Exemplo 2: Adicionar Nova Rota

**❌ Ineficiente (50.000 tokens):**
```bash
Read: DOCUMENTACAO_ARQUITETURA_COMPLETA_DOCTORQ.md
Read: GUIA_PADROES.md
# Implementar
Read: ambos novamente
Write: IMPLEMENTACAO_NOVA_ROTA.md
Edit: DOCUMENTACAO_ARQUITETURA...
```

**✅ Eficiente (2.000 tokens):**
```bash
# Usar cache mental:
# - Rotas em src/routes/
# - Sempre trailing slash
# - Dependency injection
# Implementar
Edit: CHANGELOG.md (adicionar entrada)
```

### Exemplo 3: Buscar Padrão de Hook SWR

**❌ Ineficiente:**
```bash
Read: src/hooks/useUsuarios.ts (300 linhas)
Read: src/hooks/useAgentes.ts (250 linhas)
Read: src/hooks/useEmpresas.ts (280 linhas)
# Total: ~20.000 tokens
```

**✅ Eficiente:**
```bash
Bash: head -30 src/hooks/useUsuarios.ts
# Ver apenas imports e início do hook
# Total: ~800 tokens
```

---

## 📈 Resultados Esperados

### Economia Projetada por Sessão:

| Tipo de Sessão | Antes | Depois | Economia |
|----------------|-------|--------|----------|
| Feature simples | 80k | 30k | 62% |
| Feature média | 150k | 50k | 67% |
| Feature complexa | 180k | 70k | 61% |
| Doc update apenas | 40k | 2k | 95% |

### Benefícios:

✅ **Mais features por sessão** (3x mais com mesmo budget)
✅ **Respostas mais rápidas** (menos processamento)
✅ **Menos context overload** (informação focada)
✅ **Melhor qualidade** (menos ruído, mais signal)

---

## 🔧 Ferramentas Recomendadas

### Comandos Bash Otimizados:

```bash
# Leitura focada
grep -A N "pattern" arquivo  # N linhas após match
head -N arquivo              # Primeiras N linhas
tail -N arquivo              # Últimas N linhas
sed -n 'X,Yp' arquivo        # Linhas X a Y

# Busca eficiente
find . -name "*.py" -type f | wc -l
ls -1 | wc -l
du -sh diretorio

# Informação concisa
git diff --stat
git log --oneline -5
ps aux | grep processo | wc -l
```

### Tool Parameters:

```python
# Read com limitações
Read(file_path="...", offset=100, limit=50)

# Grep focado
Grep(pattern="...", path="...", output_mode="content", head_limit=20)

# Bash direto
Bash(command="...", timeout=5000)  # Timeout curto
```

---

## 💡 Dicas Finais

1. **Cache Mental é Seu Amigo**
   - Memorize estruturas comuns
   - Não re-leia o que já sabe

2. **Grep > Read (na maioria dos casos)**
   - Use grep para buscar padrões específicos
   - Read apenas quando precisar do arquivo completo

3. **CHANGELOG.md é Suficiente**
   - Não crie novos docs
   - Uma entrada no CHANGELOG é tudo que precisa

4. **Skills Devem Ser Concisas**
   - Máximo 100 linhas
   - Foco em instruções essenciais
   - Templates resumidos

5. **Outputs Devem Ser Limitados**
   - Use `head`, `tail`, `wc -l`
   - Evite dumps grandes de dados

---

**Última atualização:** 02/11/2025
**Próxima revisão:** Após 10 sessões com nova política
