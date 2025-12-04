# DoctorQ Documentation Update Skill

## Descrição
Skill otimizada para atualizar APENAS o CHANGELOG.md após implementações, seguindo a nova política de documentação.

## ⚠️ POLÍTICA ATUALIZADA (02/11/2025)

**NÃO CRIAR NOVOS ARQUIVOS `.md`** - Apenas atualizar o CHANGELOG.md!

## Quando Usar
- ✅ Após implementar qualquer funcionalidade
- ✅ Quando modificar rotas da API
- ✅ Ao adicionar ou modificar modelos de dados
- ✅ Quando alterar fluxos de dados

## Instruções Otimizadas

### 1. Ler GUIA_PADROES.md (Se Necessário)
```bash
# Apenas se precisar verificar padrões
cat /mnt/repositorios/DoctorQ/DOC_Arquitetura/GUIA_PADROES.md | grep -A 10 "convenção desejada"
```

### 2. Atualizar CHANGELOG.md

**ARQUIVO ÚNICO:** `/mnt/repositorios/DoctorQ/DOC_Arquitetura/CHANGELOG.md`

**Template Rápido (Copiar e Colar):**
```markdown
## [DATA] - [TÍTULO DA IMPLEMENTAÇÃO]

### 📝 Resumo
[1-2 parágrafos descrevendo o que foi feito]

### 🎯 Objetivos Alcançados
- [x] Objetivo 1
- [x] Objetivo 2

### 🔧 Mudanças Técnicas

**Backend:**
- `caminho/arquivo.py` - Breve descrição

**Frontend:**
- `caminho/arquivo.tsx` - Breve descrição

**Database:**
- Migration `migration_XXX.sql` - Descrição

### 📊 Impacto
- **Usuários Afetados:** [admin/parceiro/fornecedor/paciente/todos]
- **Breaking Changes:** [Sim/Não]
- **Compatibilidade:** [Retrocompatível/Requer migração]

### 🧪 Testes
- [x] Build passing
- [x] Testes manuais

### 📚 Referências
- Arquivo: [link se relevante]

---
```

### 3. Fluxo Rápido (3 Passos)

```
1. Identificar mudanças (arquivos modificados)
   ↓
2. Abrir CHANGELOG.md e adicionar entrada NO TOPO
   ↓
3. Salvar e commit
```

### 4. ❌ O Que NÃO Fazer

- ❌ Não criar `IMPLEMENTACAO_*.md`
- ❌ Não criar relatórios de sessão
- ❌ Não criar summaries
- ❌ Não atualizar múltiplos documentos

### 5. Exemplo Prático

**Usuário**: "Implementei módulo de avaliações. Atualiza a documentação"

**Ação Correta**:
```bash
# 1. Abrir CHANGELOG.md
Read: /mnt/repositorios/DoctorQ/DOC_Arquitetura/CHANGELOG.md

# 2. Adicionar entrada no topo seguindo template
Edit: CHANGELOG.md
  - Adicionar entrada com data, título, resumo técnico
  - Listar arquivos modificados (routes, services, models)
  - Marcar objetivos alcançados

# 3. Pronto! (NÃO criar outros arquivos)
```

## Otimizações de Token

### Usar Grep ao Invés de Read Completo
```bash
# Ao invés de ler arquivo inteiro:
❌ Read: DOCUMENTACAO_ARQUITETURA_COMPLETA_DOCTORQ.md (96KB)

# Usar grep para seção específica:
✅ Bash: grep -A 20 "## 3. Funcionalidades" DOCUMENTACAO_ARQUITETURA_COMPLETA_DOCTORQ.md
```

### Ler Apenas Seções Relevantes
```bash
# Usar head/tail para limitações
head -100 arquivo.md  # Primeiras 100 linhas
tail -100 arquivo.md  # Últimas 100 linhas
```

### Cache de Informações Comuns
**Não ler repetidamente**:
- GUIA_PADROES.md (consultar apenas quando necessário)
- DOCUMENTACAO_ARQUITETURA_COMPLETA_DOCTORQ.md (não ler todo)

## Checklist Simplificado

- [ ] Abri CHANGELOG.md
- [ ] Adicionei entrada NO TOPO
- [ ] Segui o template
- [ ] Listei arquivos modificados
- [ ] Marquei objetivos alcançados
- [ ] Salvei

**Tempo estimado:** 2-3 minutos

## Referências Rápidas
- **Arquivo principal:** `/mnt/repositorios/DoctorQ/DOC_Arquitetura/CHANGELOG.md`
- **Template:** Dentro do próprio CHANGELOG.md
- **Padrões:** `/mnt/repositorios/DoctorQ/DOC_Arquitetura/GUIA_PADROES.md` (consultar apenas se necessário)
