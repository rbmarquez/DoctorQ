# DoctorQ API Check Skill

## Descrição
Esta skill verifica se todas as rotas da API estão devidamente documentadas e sincronizadas entre código e documentação.

## Quando Usar
- Antes de releases para garantir documentação completa
- Após adicionar novas rotas
- Para auditoria de APIs
- Ao revisar pull requests que modificam rotas

## Instruções

Você é um assistente especializado em validar a consistência entre código e documentação de APIs do DoctorQ. Sua função é:

### 1. Descobrir Rotas Implementadas

**Varrer código do backend**:
```bash
cd /mnt/repositorios/DoctorQ/estetiQ-api

# Encontrar todos os arquivos de rotas
find src/routes -name "*.py" -type f

# Extrair definições de rotas
grep -r "@router\." src/routes/ | grep -E "(get|post|put|delete|patch)"
```

**Padrões de rota a procurar**:
- `@router.get("/endpoint/")`
- `@router.post("/endpoint/")`
- `@router.put("/endpoint/{id}/")`
- `@router.delete("/endpoint/{id}/")`
- `@router.patch("/endpoint/{id}/")`

### 2. Comparar com Documentação

**Ler Seção 2.4 da Documentação**:
- Arquivo: `/mnt/repositorios/DoctorQ/DOC_Arquitetura/DOCUMENTACAO_ARQUITETURA_COMPLETA_DOCTORQ.md`
- Seção: "2.4. APIs e Integrações"

**Identificar divergências**:
- Rotas no código mas não na documentação
- Rotas na documentação mas não no código
- Descrições incorretas ou desatualizadas
- Métodos HTTP incorretos
- Parâmetros não documentados

### 3. Gerar Relatório de Auditoria

**Template de Relatório**:
```markdown
# Relatório de Auditoria de APIs - DoctorQ

**Data**: [Data atual]
**Versão**: v1.x

## 📊 Estatísticas

- **Rotas Implementadas**: X
- **Rotas Documentadas**: Y
- **Taxa de Cobertura**: Z%

## ✅ Rotas Sincronizadas

| Endpoint | Método | Arquivo | Documentado |
|----------|--------|---------|-------------|
| /empresas/ | GET | routes/empresa.py:45 | ✅ |
| /empresas/ | POST | routes/empresa.py:67 | ✅ |

## ⚠️ Rotas Não Documentadas

| Endpoint | Método | Arquivo | Ação Necessária |
|----------|--------|---------|-----------------|
| /avaliacoes/{id}/resposta/ | POST | routes/avaliacao.py:89 | Adicionar à Seção 2.4 |

## 🚫 Rotas Documentadas Mas Não Implementadas

| Endpoint | Método | Status | Ação Necessária |
|----------|--------|--------|-----------------|
| /relatorios/vendas/ | GET | Planejado | Remover ou implementar |

## 📝 Descrições Desatualizadas

| Endpoint | Problema | Correção Necessária |
|----------|----------|---------------------|
| /agendamentos/ | Parâmetros mudaram | Atualizar lista de query params |

## 🔧 Recomendações

1. Adicionar X rotas não documentadas à Seção 2.4
2. Atualizar descrição de Y rotas
3. Remover Z rotas obsoletas da documentação
4. Considerar adicionar exemplos de request/response

## 📋 Próximos Passos

- [ ] Atualizar DOCUMENTACAO_ARQUITETURA_COMPLETA_DOCTORQ.md
- [ ] Verificar se Swagger está correto
- [ ] Adicionar testes para rotas não testadas
- [ ] Revisar permissões de cada endpoint
```

### 4. Verificar Swagger/OpenAPI

**Acessar documentação auto-gerada**:
```bash
# Iniciar servidor se não estiver rodando
cd /mnt/repositorios/DoctorQ/estetiQ-api
make dev &

# Acessar: http://localhost:8080/docs
```

**Verificar**:
- [ ] Todos os endpoints aparecem no Swagger
- [ ] Descrições estão claras
- [ ] Schemas de request/response estão corretos
- [ ] Parâmetros estão documentados
- [ ] Códigos de status HTTP estão listados
- [ ] Exemplos estão funcionais

### 5. Validar Estrutura de Rotas

**Padrões do DoctorQ**:
- ✅ Todas as rotas devem terminar com `/` (trailing slash)
- ✅ IDs devem ser UUID: `/{id}/` onde id é UUID
- ✅ Rotas devem seguir padrão REST:
  - `GET /recursos/` - Listar
  - `POST /recursos/` - Criar
  - `GET /recursos/{id}/` - Buscar um
  - `PUT /recursos/{id}/` - Atualizar completo
  - `PATCH /recursos/{id}/` - Atualizar parcial
  - `DELETE /recursos/{id}/` - Deletar
- ✅ Rotas aninhadas: `/recursos/{id}/sub-recursos/`
- ✅ Ações: `/recursos/{id}/acao/` (ex: `/agendamentos/{id}/cancelar/`)

**Anti-padrões a evitar**:
- ❌ Rotas sem trailing slash
- ❌ Verbos em URLs (ex: `/get-empresas/`)
- ❌ Parâmetros na URL quando devem ser query params
- ❌ IDs numéricos em vez de UUID

### 6. Verificar Autenticação e Permissões

**Para cada rota, verificar**:
```python
# Exemplo de verificação no código
@router.get("/empresas/")
async def listar_empresas(
    db: AsyncSession = Depends(ORMConfig.get_session),
    current_user: User = Depends(get_current_user),  # ✅ Autenticação
    _: None = Depends(require_role(["admin", "gestor_clinica"]))  # ✅ Autorização
):
    ...
```

**Documentar permissões**:
- Quais roles podem acessar cada endpoint
- Se requer autenticação ou é público
- Se há rate limiting aplicado

### 7. Extrair Informações de Rotas

**Para cada arquivo de rota, extrair**:

```python
# Exemplo de análise
Arquivo: src/routes/empresa.py

Rotas:
1. GET /empresas/
   - Descrição: Lista todas as empresas (paginado)
   - Auth: Sim (JWT)
   - Roles: admin
   - Params: ?page=1&size=10&search=termo
   - Response: List[EmpresaSchema]

2. POST /empresas/
   - Descrição: Cria nova empresa
   - Auth: Sim (JWT)
   - Roles: admin
   - Body: EmpresaCreateSchema
   - Response: EmpresaSchema

3. GET /empresas/{id}/
   - Descrição: Busca empresa por ID
   - Auth: Sim (JWT)
   - Roles: admin, gestor_clinica
   - Path Params: id (UUID)
   - Response: EmpresaSchema
```

### 8. Validar Integrações Externas

**Verificar seção de integrações**:
- WhatsApp Business API
- Stripe/MercadoPago
- Google OAuth
- Microsoft Azure AD
- Google Maps API
- Email SMTP

**Para cada integração, verificar**:
- [ ] Documentação está atualizada
- [ ] Credenciais estão em tb_credenciais (encriptadas)
- [ ] Webhooks estão documentados
- [ ] Fluxo de dados está claro
- [ ] Tratamento de erros está implementado

### 9. Comandos Úteis

**Listar todas as rotas**:
```bash
cd /mnt/repositorios/DoctorQ/estetiQ-api
grep -rh "@router\." src/routes/ | grep -E "get|post|put|delete|patch" | sort | uniq
```

**Contar rotas por arquivo**:
```bash
for file in src/routes/*.py; do
  echo "$file: $(grep -c "@router\." $file)"
done
```

**Verificar rotas sem trailing slash**:
```bash
grep -r "@router\." src/routes/ | grep -v '/")'
```

**Listar rotas públicas (sem autenticação)**:
```bash
grep -A 5 "@router\." src/routes/ | grep -v "Depends(get_current_user)"
```

## Exemplo de Uso

**Usuário**: Verifica se todas as rotas da API estão documentadas

**Ações Esperadas**:
1. Varrer `src/routes/` e extrair todas as rotas
2. Ler Seção 2.4 da documentação
3. Comparar listas
4. Gerar relatório com:
   - Rotas não documentadas
   - Rotas documentadas mas não implementadas
   - Estatísticas de cobertura
5. Sugerir atualizações necessárias na documentação

**Resposta Exemplo**:
```
# Auditoria de APIs - DoctorQ

Encontrei **53 rotas implementadas** em 15 arquivos.

## ✅ Boa Notícia
- 48 rotas (91%) estão documentadas corretamente
- Padrão REST seguido consistentemente
- Todas as rotas usam trailing slash

## ⚠️ Atenção Necessária

**5 rotas não documentadas**:
1. POST /avaliacoes/{id}/resposta/ (avaliacao.py:89)
2. GET /analytics/dashboard/ (analytics.py:45)
3. POST /partner/leads/ (partner.py:67)
4. GET /webhooks/status/ (webhook.py:34)
5. PATCH /produtos/{id}/estoque/ (produto.py:123)

**Recomendação**: Adicionar estas rotas à Seção 2.4 da documentação.

Quer que eu atualize a documentação agora?
```

## Referências
- Código das rotas: `/mnt/repositorios/DoctorQ/estetiQ-api/src/routes/`
- Documentação: `/mnt/repositorios/DoctorQ/DOC_Arquitetura/DOCUMENTACAO_ARQUITETURA_COMPLETA_DOCTORQ.md` (Seção 2.4)
- Swagger: `http://localhost:8080/docs` (quando servidor rodando)
