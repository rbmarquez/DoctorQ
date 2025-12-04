# 💉 Módulo 05: Procedimentos e Produtos

## Visão Geral

Módulo responsável pelo gerenciamento de procedimentos estéticos oferecidos, produtos para venda, controle de estoque, configuração de preços, cupons de desconto e gestão de fornecedores.

**Status:** ✅ Implementado (maioria dos casos de uso)

---

## 📋 Casos de Uso

| ID | Caso de Uso | Prioridade | Complexidade | Status |
|----|-------------|------------|--------------|--------|
| UC040 | Cadastrar Procedimento | 🔴 Alta | 🟡 Média | ✅ Implementado |
| UC041 | Gerenciar Catálogo de Procedimentos | 🔴 Alta | 🟡 Média | ✅ Implementado |
| UC042 | Cadastrar Produto | 🟡 Média | 🟡 Média | ✅ Implementado |
| UC043 | Gerenciar Estoque | 🟡 Média | 🟡 Média | 🔄 Em Desenvolvimento |
| UC044 | Configurar Preços | 🟡 Média | 🟡 Média | ✅ Implementado |
| UC045 | Aplicar Cupons de Desconto | 🟡 Média | 🟡 Média | ✅ Implementado |
| UC046 | Gerenciar Fornecedores | 🟡 Média | 🟢 Baixa | ✅ Implementado |

**Total:** 7 casos de uso | **Implementados:** 6 (85.7%)

---

## 📚 Documentação Completa

A documentação detalhada de todos os casos de uso deste módulo está disponível em:

👉 **[CASOS_DE_USO_COMPLETOS.md](../CASOS_DE_USO_COMPLETOS.md#05-💉-procedimentos-e-produtos-uc040-uc046)**

### O que você encontrará:

- ✅ Fluxos principais e alternativos detalhados
- ✅ Regras de negócio completas
- ✅ Estrutura de dados (entrada/saída)
- ✅ Modelo de banco de dados
- ✅ Endpoints da API
- ✅ Cenários de teste
- ✅ Exemplos de implementação

---

## 🔑 Destaques Técnicos

### UC040/UC041 - Gestão de Procedimentos
- Catálogo completo com categorias (facial, corporal, capilar, íntimo)
- Duração configurável
- Múltiplas tabelas de preços
- Ativação/desativação de procedimentos

### UC042/UC043 - Gestão de Produtos e Estoque
- SKU único
- Controle de entrada/saída
- Alertas de estoque mínimo
- Integração com marketplace

### UC044 - Configuração de Preços
- Tabelas dinâmicas por:
  - Profissional
  - Horário
  - Pacote
  - Convênio
- Promoções temporárias

### UC045 - Sistema de Cupons
- Tipos: percentual, valor fixo, frete grátis, combo
- Regras: uso único/múltiplo, data validade, valor mínimo
- Validação automática no checkout

### UC046 - Gestão de Fornecedores
- Cadastro completo (CNPJ, contato, catálogo)
- Vínculo com produtos
- Histórico de pedidos

---

## 📊 Principais Endpoints

```http
# Procedimentos
POST   /procedimentos              - Criar procedimento
GET    /procedimentos              - Listar com filtros
PATCH  /procedimentos/{id}         - Atualizar
DELETE /procedimentos/{id}         - Desativar

# Produtos
POST   /produtos                   - Criar produto
GET    /produtos                   - Listar produtos
GET    /produtos/estoque           - Consultar estoque
PATCH  /produtos/{id}/estoque      - Atualizar estoque

# Cupons
POST   /cupons                     - Criar cupom
POST   /cupons/validar             - Validar cupom
GET    /cupons/{codigo}            - Obter cupom

# Fornecedores
POST   /fornecedores               - Criar fornecedor
GET    /fornecedores               - Listar fornecedores
```

---

## 🗄️ Modelo de Dados Principal

### tb_procedimentos
- Informações do procedimento
- Categoria, duração, preço base
- Vínculo com especialidades

### tb_produtos
- Dados do produto (SKU, marca)
- Estoque atual
- Vínculo com fornecedor

### tb_cupons
- Código do cupom
- Tipo e valor do desconto
- Regras de uso e validade

### tb_fornecedores
- Dados do fornecedor (CNPJ, razão social)
- Contato e catálogo

---

## 🎭 Visões que Utilizam

- 🏥 **CLÍNICA** - Gestão completa de procedimentos, produtos e fornecedores
- 📦 **FORNECEDOR** - Gestão de produtos e estoque
- 👤 **PACIENTE** - Visualização de procedimentos e uso de cupons
- ⚙️ **ADMINISTRADOR** - Configurações globais

---

## 📖 Documentação Relacionada

- [📋 Todos os Casos de Uso](../CASOS_DE_USO_COMPLETOS.md)
- [🎭 Índice por Visão](../INDICE_POR_VISAO.md)
- [🏗️ Arquitetura](../../DOCUMENTACAO_ARQUITETURA_COMPLETA_DOCTORQ.md)
- [🗄️ Modelagem de Dados](../../MODELAGEM_DADOS_COMPLETA.md)

---

*Para detalhes completos de implementação, consulte o documento consolidado.*
