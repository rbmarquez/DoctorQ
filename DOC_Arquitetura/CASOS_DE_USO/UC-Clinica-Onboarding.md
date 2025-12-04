# UC124 - Onboarding de Clínica

## Visão Geral

- **Objetivo:** guiar uma nova clínica no setup inicial da plataforma DoctorQ
- **Atores Principais:** Administrador(a) da clínica, Plataforma DoctorQ
- **Pré-condições:**
  - Usuário autenticado com perfil de clínica ou administrador da clínica
  - Fluxo de onboarding disponível e ativo
- **Pós-condições:**
  - Dados essenciais da clínica configurados
  - Ao menos um template de agenda criado
  - Progresso do wizard atualizado no backend

## Fluxo Principal

1. Usuário acessa `/clinica/onboarding`
2. Sistema apresenta wizard com as etapas pendentes
3. Usuário preenche cada etapa obrigatória:
   - Informações da Clínica (logo, CNPJ, endereço, contatos)
   - Configuração de horários e regras de agendamento
   - Cadastro de profissionais da equipe (opcional)
   - Cadastro de serviços/procedimentos (opcional)
   - Configuração de notificações e pagamentos
   - Integrações externas (opcional)
   - Privacidade e personalização visual
4. A cada etapa concluída o sistema chama `POST /onboarding/complete-step/{flowId}`
5. Ao completar todas as etapas obrigatórias o status do onboarding muda para `completed`
6. Usuário é redirecionado para o dashboard da clínica

## Fluxos Alternativos

- **FA1 - Salvar rascunho:** usuário clica em "Salvar rascunho" e o sistema persiste localmente os dados atuais
- **FA2 - Pular etapa opcional:** usuário clica em "Pular por agora"; sistema registra via `POST /onboarding/skip-step`
- **FA3 - Retomar posterior:** ao voltar para o onboarding, sistema carrega os dados salvos e posiciona o usuário na próxima etapa pendente

## Requisitos e Regras de Negócio

- Todos os campos marcados com * são obrigatórios antes de permitir avançar
- CNPJ, telefone e CEP devem obedecer às máscaras brasileiras
- Sistema só considera o onboarding concluído quando todos os steps marcados como `required` forem completados
- Progresso é sincronizado com o backend para permitir retomada em múltiplos dispositivos

## Integrações

| Serviço | Finalidade |
|---------|------------|
| `/api/onboarding/dashboard/{userId}` | Recuperar fluxo e progresso |
| `/api/onboarding/complete-step/{flowId}?user_id={userId}` | Registrar conclusão do step |
| `/api/onboarding/skip-step/{flowId}?user_id={userId}` | Registrar etapa pulada |

## Dados Manipulados

- `OnboardingFlow` (definição das etapas)
- `UserOnboardingProgress` (status, porcentagem, etapas concluídas)
- Dados cadastrais da clínica (`tb_clinicas`, `tb_profissionais`, `tb_procedimentos`)

## Métricas de Sucesso

- Tempo médio para completar o onboarding
- Percentual de clínicas que concluem o wizard no mesmo dia
- Steps mais pulados ou abandonados
