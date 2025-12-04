# UC128 - Onboarding de Fornecedor

## Visão Geral

- **Objetivo:** capacitar fornecedores a ativarem seu catálogo B2B dentro do marketplace DoctorQ
- **Atores Principais:** Gestor(a) de fornecedor, Plataforma DoctorQ Marketplace
- **Pré-condições:**
  - Conta de fornecedor aprovada
  - Documentação mínima (CNPJ, contrato social) validada
- **Pós-condições:**
  - Catálogo inicial publicado
  - Política comercial e logística definidas
  - Painel do fornecedor liberado para operação

## Fluxo Principal

1. Fornecedor acessa `/fornecedor/onboarding`
2. Sistema apresenta wizard com etapas pendentes
3. Etapa “Dados Fiscais”: CNPJ, inscrição estadual, documentos (upload)
4. Etapa “Produtos & Kits”: importação via planilha ou cadastro manual dos itens principais
5. Etapa “Logística”: prazos, transportadoras, regiões atendidas, frete mínimo
6. Etapa “Política Comercial”: condições de pagamento, descontos, política de devolução/garantia
7. Etapa “Integrações de Atendimento”: canais de suporte, CRM externo ou WhatsApp Business
8. Ao finalizar, marketplace envia notificação para time de curadoria e habilita vitrine

## Fluxos Alternativos

- **FA1 - Upload em lote:** fornecedor importa planilha CSV e sistema valida inconsistências
- **FA2 - Suspender publicação:** fornecedor pode salvar rascunho sem publicar enquanto aguarda aprovação
- **FA3 - Uso de catálogo existente:** integração com API do fornecedor para sincronizar estoque/preços

## Regras de Negócio

- Dados fiscais obrigatórios antes de expor produtos
- Pelo menos um método de envio e um prazo de pagamento precisam ser cadastrados
- Produtos só são publicados após validação automática de requisitos (SKU único, preço >= 0, estoque >= 0)
- Sistema gera checklist para auditoria Comercial+Compliance

## Integrações

| Serviço | Finalidade |
|---------|------------|
| `/api/onboarding/dashboard/{userId}` | Recuperar fluxo e progresso do fornecedor |
| `/api/onboarding/complete-step/{flowId}` | Persistir conclusão de etapa |
| `/api/marketplace/produtos/import` | Upload em lote de catálogo |
| Webhooks CRM | Sincronizar leads gerados pelo marketplace |

## Dados Manipulados

- `tb_fornecedores`
- `tb_produtos`, `tb_produto_preco`, `tb_produto_estoque`
- `tb_politica_comercial`, `tb_logistica`

## Métricas de Sucesso

- Tempo médio para publicação do primeiro produto
- Percentual de fornecedores que completam onboarding sem intervenção manual
- Volume de SKUs cadastrados na primeira semana
