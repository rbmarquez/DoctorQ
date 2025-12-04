# 📊 Dados Fake Populados no Banco DoctorQ

## ✅ População Concluída com Sucesso!

Data da população: 2025-10-23

## 📈 Estatísticas Gerais

| Tabela | Quantidade | Descrição |
|--------|-----------|-----------|
| **tb_empresas** | 4 | Empresas cadastradas |
| **tb_users** | 151 | Usuários do sistema |
| **tb_clinicas** | 20 | Clínicas de estética |
| **tb_profissionais** | 40 | Profissionais (esteticistas, dermatologistas, etc.) |
| **tb_pacientes** | 60 | Pacientes/clientes |
| **tb_procedimentos** | 240 | Procedimentos disponíveis |
| **tb_agendamentos** | 400 | Agendamentos realizados |
| **tb_prontuarios** | 51 | Prontuários médicos |
| **tb_avaliacoes** | 63 | Avaliações de pacientes |
| **tb_agentes** | 3 | Agentes de IA |
| **tb_conversas** | 50 | Conversas com agentes |
| **tb_messages** | 446 | Mensagens trocadas |

## 🏥 Detalhamento das Clínicas

- **20 clínicas** distribuídas em diferentes cidades brasileiras
- Avaliação média: **4.0 a 5.0 estrelas**
- Especialidades: Esteticista, Dermatologista, Fisioterapeuta, Cosmetólogo, Biomédico Esteta, Terapeuta Holístico
- Horário de funcionamento configurado (segunda a sábado)

### Exemplos de Clínicas

1. **Clínica Lopes Duarte S.A.** - Sampaio de da Costa/AM - ⭐ 4.7 (125 avaliações)
2. **Clínica Duarte** - Duarte de Minas/TO - ⭐ 4.9 (79 avaliações)
3. **Clínica Camargo S.A.** - Nogueira/RS - ⭐ 4.4 (15 avaliações)

## 👨‍⚕️ Profissionais

- **40 profissionais** cadastrados
- Especialidades variadas (1 a 3 por profissional)
- Anos de experiência: 2 a 20 anos
- Todos vinculados a clínicas específicas
- Avaliação média: **4.0 a 4.6 estrelas**

## 💉 Procedimentos

**240 procedimentos** distribuídos em 4 categorias:

### Facial (diversos procedimentos)
- Limpeza de Pele
- Peeling Químico
- Microagulhamento
- Botox
- Preenchimento Facial
- Harmonização Facial
- Radiofrequência Facial
- Laser CO2
- Microdermoabrasão

### Corporal
- Drenagem Linfática
- Massagem Modeladora
- Criolipólise
- Radiofrequência Corporal
- Endermologia
- Cavitação
- Carboxiterapia
- Lipoenzimática

### Capilar
- Cauterização Capilar
- Botox Capilar
- Hidratação Profunda
- Reconstrução Capilar
- Cronograma Capilar

### Depilação
- Depilação a Laser
- Depilação com Luz Pulsada
- Depilação com Cera

**Preços**: R$ 50,00 a R$ 500,00
**Duração**: 30 a 120 minutos

## 📅 Agendamentos

**400 agendamentos** criados com distribuição realista:

| Status | Quantidade | Percentual |
|--------|-----------|------------|
| **Agendado** | 98 | 24.5% |
| **Confirmado** | 100 | 25.0% |
| **Concluído** | 93 | 23.25% |
| **Cancelado** | 109 | 27.25% |

- Período: Últimos 6 meses até próximos 3 meses
- Formas de pagamento: Dinheiro, Cartão de Crédito, Cartão de Débito, PIX, Convênio
- Todos vinculados a pacientes, profissionais, clínicas e procedimentos

## 📋 Prontuários

**51 prontuários** criados para agendamentos concluídos, contendo:
- Queixa principal
- Diagnóstico
- Procedimentos realizados
- Orientações
- Tipos: Primeira consulta, Retorno, Procedimento

## ⭐ Avaliações

**63 avaliações** de pacientes:

| Nota | Quantidade | Média Atendimento |
|------|-----------|-------------------|
| ⭐⭐⭐⭐⭐ (5) | 34 | 4.6 |
| ⭐⭐⭐⭐ (4) | 29 | 4.7 |

**Critérios avaliados:**
- Atendimento
- Instalações
- Pontualidade
- Resultado

Maioria das avaliações são positivas (4 ou 5 estrelas) ✅

## 🤖 Agentes de IA

**3 agentes** criados para atendimento automatizado:

| Agente | Conversas | Mensagens | Descrição |
|--------|-----------|-----------|-----------|
| **Consultor de Procedimentos** | 20 | 196 | Informa sobre procedimentos disponíveis |
| **Assistente de Agendamento** | 17 | 136 | Ajuda pacientes a agendar consultas |
| **Suporte Técnico** | 13 | 114 | Auxilia com dúvidas técnicas |

## 💬 Conversas e Mensagens

- **50 conversas** ativas
- **446 mensagens** trocadas
- Média de **8-9 mensagens por conversa**
- Alternância realista entre mensagens do usuário e do assistente

## 🔐 Perfis de Usuário

Os **151 usuários** foram distribuídos entre os perfis:

1. **Admin** (5 usuários) - Acesso total ao sistema
2. **Gestor de Clínica** (5 usuários) - Gerenciam suas clínicas
3. **Profissional** (15 usuários) - Profissionais de estética
4. **Recepcionista** (5 usuários) - Gerenciam agendamentos
5. **Paciente** (121 usuários) - Clientes das clínicas

## 📍 Dados Geográficos

Os dados incluem informações realistas de:
- CEPs brasileiros
- Cidades e estados
- Endereços completos
- Coordenadas geográficas (para as clínicas)

## 📞 Contatos

Todos os registros contêm:
- Telefones formatados (formato brasileiro)
- E-mails válidos
- CPFs/CNPJs formatados corretamente
- WhatsApp para contato direto

## 🔄 Como Executar Novamente

Para popular o banco com novos dados fake:

```bash
cd /mnt/repositorios/DoctorQ/estetiQ-api
uv run python scripts/populate_fake_data.py
```

**Nota**: O script adiciona dados ao banco. Se quiser começar do zero, limpe as tabelas antes:

```bash
# Limpar dados (cuidado - isso apaga tudo!)
set -a && source .env && set +a
PGPASSWORD=\"$DATABASE_PASSWORD\" psql -h \"$DATABASE_HOST\" -U \"$DATABASE_USERNAME\" -d \"$DATABASE_NAME\" -c \"
TRUNCATE TABLE
  tb_messages, tb_conversas, tb_avaliacoes, tb_prontuarios,
  tb_agendamentos, tb_procedimentos, tb_pacientes,
  tb_profissionais, tb_clinicas, tb_api_keys, tb_users,
  tb_empresas, tb_agentes
CASCADE;
\"
```

## 🎯 Próximos Passos

Com os dados fake populados, você pode:

1. ✅ Testar o frontend com dados realistas
2. ✅ Desenvolver dashboards e relatórios
3. ✅ Testar funcionalidades de busca e filtros
4. ✅ Validar integrações de API
5. ✅ Demonstrar o sistema para clientes
6. ✅ Treinar a equipe com dados fictícios

---

**Gerado automaticamente por**: `scripts/populate_fake_data.py`
**Biblioteca utilizada**: Faker (pt_BR)
**Data**: 2025-10-23
