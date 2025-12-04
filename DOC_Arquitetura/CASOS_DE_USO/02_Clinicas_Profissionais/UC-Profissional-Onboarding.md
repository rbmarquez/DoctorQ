# UC127 - Onboarding de Profissional

## Visão Geral

- **Objetivo:** orientar profissionais recém-cadastrados a configurar perfil, agenda e serviços na DoctorQ
- **Atores Principais:** Profissional de estética, Plataforma DoctorQ
- **Pré-condições:**
  - Usuário autenticado com perfil de profissional
  - Convite aceito ou cadastro aprovado
- **Pós-condições:**
  - Perfil público do profissional publicado
  - Agenda com horários disponíveis configurada
  - Serviços ofertados vinculados a clínicas/unidades

## Fluxo Principal

1. Profissional acessa `/profissional/onboarding`
2. Sistema identifica etapas pendentes e apresenta wizard
3. Etapa “Dados Profissionais”: CRM/CRBM, especialidades, mini bio, upload de foto
4. Etapa “Disponibilidade”: define horários semanais, bloqueios, políticas de atraso
5. Etapa “Vínculos”: associa o profissional a clínicas e salas
6. Etapa “Serviços”: seleciona procedimentos ofertados, duração padrão e valores sugeridos
7. Etapa “Notificações”: configura canais (email, WhatsApp, push) e janela de lembretes
8. Conclusão: sistema confirma, registra evento `step_completed` e redireciona para dashboard

## Fluxos Alternativos

- **FA1 - Importar agenda externa:** profissional conecta Google Calendar; sistema sincroniza antes de avançar
- **FA2 - Pular associação a clínica:** permite seguir como profissional independente (marketplace) e marca etapa como opcional
- **FA3 - Retomar depois:** progressos parciais são salvos e retomados ao voltar

## Regras de Negócio

- CRM/CRBM obrigatório para categorias reguladas
- Disponibilidade mínima: pelo menos um bloco semanal ativo para concluir
- Serviços só podem ser associados se a clínica correspondente estiver ativa
- Enquanto o onboarding não concluir, perfil aparece com status “Configuração pendente”

## Integrações

| Serviço | Finalidade |
|---------|------------|
| `/api/onboarding/dashboard/{userId}` | Obter fluxo e progresso do profissional |
| `/api/onboarding/complete-step/{flowId}` | Registrar conclusão de etapa |
| Google Calendar API | Importar agenda externa (opcional) |

## Dados Manipulados

- `tb_profissionais` (dados gerais)
- `tb_profissional_agenda` (slots de disponibilidade)
- `tb_profissional_clinica` (vínculo com clínicas)
- `tb_profissional_servicos` (serviços ofertados)

## Métricas de Sucesso

- Percentual de profissionais que completam o onboarding em 24h
- Número médio de serviços configurados antes da primeira consulta
- Taxa de sincronização com agenda externa
