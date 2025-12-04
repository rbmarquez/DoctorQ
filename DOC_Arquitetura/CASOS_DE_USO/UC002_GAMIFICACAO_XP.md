# UC002 - Sistema de Gamificação e XP

**Versão:** 1.0
**Data:** 13/11/2025
**Autor:** Sistema DoctorQ
**Status:** Planejado

---

## 1. Descrição

Este caso de uso descreve o sistema de gamificação da Universidade da Beleza, inspirado no Duolingo, incluindo ganho de XP (Experience Points), progressão de níveis, conquistas de badges, sistema de streaks, rankings competitivos e recompensas.

---

## 2. Atores

### Ator Principal
- **Aluno** - Usuário que participa do sistema de gamificação ao estudar

### Atores Secundários
- **Sistema de Gamificação** - Motor que calcula XP, níveis e badges
- **Sistema de Notificações** - Envia alertas sobre conquistas e progresso
- **Mentor IA (Dra. Sophie)** - Parabeniza conquistas e motiva continuidade

---

## 3. Pré-condições

1. Usuário deve estar matriculado em pelo menos 1 curso
2. Perfil de gamificação criado em `tb_universidade_ranking`
3. Sistema de badges configurado em `tb_universidade_badges`
4. Regras de XP definidas em `tb_universidade_regras_xp`

---

## 4. Pós-condições

### Sucesso
1. XP creditado na conta do aluno (`tb_universidade_ranking`)
2. Nível atualizado se threshold atingido
3. Badge desbloqueado se critérios atendidos
4. Conquista registrada em `tb_universidade_conquistas`
5. Notificação de celebração enviada
6. Ranking atualizado (se aplicável)
7. Streak incrementado (se diário)

### Falha
1. XP não creditado se ação já recompensada (idempotência)
2. Badge não desbloqueado se critérios incompletos
3. Streak resetado se > 24h de inatividade

---

## 5. Fluxo Principal

### 5.1 Ganho de XP por Ações

**Passo 1: Aluno Executa Ação Recompensável**

Ações que geram XP (baseado em regras):

| Ação | XP Base | Multiplicador | Condições |
|------|---------|---------------|-----------|
| Assistir aula completa | +20 XP | 1x | Primeira vez |
| Completar quiz | +30 XP | 1x-3x | Depende da nota (60%=1x, 80%=2x, 100%=3x) |
| Concluir módulo | +100 XP | 1x | Todas as aulas + quizzes completos |
| Concluir curso | +500 XP | 1x-2x | Normal=1x, com certificação=2x |
| Comentar em aula | +5 XP | 1x | Máximo 3 por dia |
| Responder colega | +10 XP | 1x | Resposta marcada como útil |
| Upload de projeto prático | +50 XP | 1x | Aprovado pelo instrutor |
| Streak diário (login) | +15 XP | 1x-5x | Base=1x, 7 dias=2x, 30 dias=5x |
| Revisão de aula antiga | +10 XP | 1x | Após 30 dias da conclusão |
| Participar de live | +40 XP | 1x | Mínimo 80% de presença |

**Passo 2: Sistema Valida Ação**

```sql
-- Verificar se ação já foi recompensada (idempotência)
SELECT id_conquista FROM tb_universidade_conquistas
WHERE id_aluno = :id_aluno
  AND ds_tipo_acao = 'aula_completa'
  AND id_referencia = :id_aula
  AND dt_criacao > now() - INTERVAL '24 hours';
-- Se EXISTS → não creditar novamente
```

**Passo 3: Calcular XP com Multiplicadores**

```javascript
// Pseudocódigo
const xpBase = regrasXP.get(tipoAcao).xpBase;
let multiplicador = 1;

// Multiplicador por performance (quiz)
if (tipoAcao === 'completar_quiz') {
  if (nota >= 100) multiplicador = 3;
  else if (nota >= 80) multiplicador = 2;
  else if (nota >= 60) multiplicador = 1;
  else return 0; // Nota baixa não gera XP
}

// Multiplicador por streak
if (tipoAcao === 'streak_diario') {
  if (diasConsecutivos >= 30) multiplicador = 5;
  else if (diasConsecutivos >= 7) multiplicador = 2;
}

const xpFinal = xpBase * multiplicador;
```

**Passo 4: Creditar XP na Conta do Aluno**

```sql
-- Atualizar ranking com XP ganho
UPDATE tb_universidade_ranking
SET qt_xp_total = qt_xp_total + :xp_ganho,
    qt_xp_nivel_atual = qt_xp_nivel_atual + :xp_ganho,
    dt_atualizacao = now()
WHERE id_aluno = :id_aluno;

-- Registrar conquista para auditoria
INSERT INTO tb_universidade_conquistas (
  id_aluno, ds_tipo_acao, id_referencia,
  qt_xp_ganho, qt_multiplicador, dt_conquista
) VALUES (
  :id_aluno, :tipo_acao, :id_referencia,
  :xp_ganho, :multiplicador, now()
);
```

**Passo 5: Verificar Progressão de Nível**

```javascript
// Tabela de níveis (progressão exponencial estilo Duolingo)
const niveis = [
  { nivel: 1, xpMin: 0, xpMax: 100 },
  { nivel: 2, xpMin: 100, xpMax: 250 },
  { nivel: 3, xpMin: 250, xpMax: 500 },
  { nivel: 4, xpMin: 500, xpMax: 1000 },
  { nivel: 5, xpMin: 1000, xpMax: 2000 },
  // ... até nível 50
];

// Verificar se subiu de nível
if (xpTotalAtualizado >= nivelAtual.xpMax) {
  novoNivel = calcularNivel(xpTotalAtualizado);

  // Atualizar banco
  UPDATE tb_universidade_ranking
  SET qt_nivel = :novo_nivel,
      qt_xp_nivel_atual = :xp_total - :xp_min_novo_nivel
  WHERE id_aluno = :id_aluno;

  // Registrar evento de level up
  INSERT INTO tb_universidade_eventos (
    id_aluno, ds_tipo, ds_descricao
  ) VALUES (
    :id_aluno, 'level_up',
    'Subiu para nível ' + :novo_nivel
  );

  // Enviar notificação de celebração
  notificar({
    titulo: '🎉 Level Up!',
    mensagem: `Parabéns! Você alcançou o nível ${novoNivel}!`,
    tipo: 'celebracao',
    animacao: 'confetti'
  });
}
```

### 5.2 Desbloqueio de Badges

**Passo 6: Verificar Critérios de Badges**

```javascript
// Badges disponíveis e seus critérios
const badges = [
  {
    id: 'primeiro-passo',
    nome: 'Primeiro Passo',
    descricao: 'Complete sua primeira aula',
    icone: '👣',
    criterio: { tipo: 'aulas_completas', quantidade: 1 }
  },
  {
    id: 'maratonista',
    nome: 'Maratonista',
    descricao: 'Complete 10 aulas em um dia',
    icone: '🏃',
    criterio: { tipo: 'aulas_dia', quantidade: 10 }
  },
  {
    id: 'perfeccionista',
    nome: 'Perfeccionista',
    descricao: 'Acerte 100% em 5 quizzes',
    icone: '💯',
    criterio: { tipo: 'quizzes_perfeitos', quantidade: 5 }
  },
  {
    id: 'fogo',
    nome: 'Em Chamas',
    descricao: 'Mantenha streak de 7 dias',
    icone: '🔥',
    criterio: { tipo: 'streak_dias', quantidade: 7 }
  },
  {
    id: 'lenda',
    nome: 'Lenda',
    descricao: 'Mantenha streak de 30 dias',
    icone: '🏆',
    criterio: { tipo: 'streak_dias', quantidade: 30 }
  },
  {
    id: 'mestre',
    nome: 'Mestre',
    descricao: 'Complete 10 cursos',
    icone: '🎓',
    criterio: { tipo: 'cursos_completos', quantidade: 10 }
  },
  {
    id: 'guru',
    nome: 'Guru',
    descricao: 'Alcance nível 20',
    icone: '🧙',
    criterio: { tipo: 'nivel', quantidade: 20 }
  },
  {
    id: 'mentor',
    nome: 'Mentor da Comunidade',
    descricao: 'Ajude 50 colegas (respostas úteis)',
    icone: '🤝',
    criterio: { tipo: 'respostas_uteis', quantidade: 50 }
  },
  {
    id: '早起鸟',
    nome: 'Madrugador',
    descricao: 'Estude antes das 7h, 10 vezes',
    icone: '🌅',
    criterio: { tipo: 'estudos_madrugada', quantidade: 10 }
  }
];

// Após cada ação, verificar badges pendentes
async function verificarBadges(idAluno, tipoAcao) {
  const estatisticas = await obterEstatisticasAluno(idAluno);

  for (const badge of badges) {
    // Verificar se já possui o badge
    const jaPossui = await badgeJaPossuido(idAluno, badge.id);
    if (jaPossui) continue;

    // Verificar critério
    const criterioAtendido = verificarCriterio(badge.criterio, estatisticas);

    if (criterioAtendido) {
      // Desbloquear badge!
      await desbloquearBadge(idAluno, badge);
    }
  }
}
```

**Passo 7: Desbloquear e Notificar**

```sql
-- Registrar badge desbloqueado
INSERT INTO tb_universidade_badges_alunos (
  id_aluno, id_badge, dt_desbloqueio
) VALUES (
  :id_aluno, :id_badge, now()
);

-- Incrementar contador de badges
UPDATE tb_universidade_ranking
SET qt_badges = qt_badges + 1
WHERE id_aluno = :id_aluno;
```

```javascript
// Enviar notificação animada
notificar({
  titulo: '🏆 Novo Badge Desbloqueado!',
  mensagem: `Você ganhou o badge "${badge.nome}"!`,
  descricao: badge.descricao,
  icone: badge.icone,
  tipo: 'badge',
  animacao: 'badge-flip',
  som: 'achievement.mp3'
});

// Mentor IA parabeniza
mentorIA.enviarMensagem({
  texto: `Parabéns pelo badge "${badge.nome}"! 🎉 Você está arrasando!`,
  sentimento: 'feliz',
  id_aluno: idAluno
});
```

### 5.3 Sistema de Streaks

**Passo 8: Rastrear Streak Diário**

```javascript
// Verificar última atividade
const ultimaAtividade = await obterUltimaAtividade(idAluno);
const agora = new Date();
const diff = (agora - ultimaAtividade) / (1000 * 60 * 60); // horas

if (diff <= 24) {
  // Dentro do prazo - incrementar streak
  UPDATE tb_universidade_ranking
  SET qt_streak_atual = qt_streak_atual + 1,
      dt_ultima_atividade = now()
  WHERE id_aluno = :id_aluno;

  // Atualizar recorde pessoal se necessário
  UPDATE tb_universidade_ranking
  SET qt_streak_max = GREATEST(qt_streak_max, qt_streak_atual)
  WHERE id_aluno = :id_aluno;

  // Creditar XP de streak
  const xpStreak = calcularXpStreak(streakAtual);
  creditarXP(idAluno, xpStreak, 'streak_diario');

} else if (diff > 24 && diff <= 48) {
  // Perdeu o streak - mas tem "Freeze" disponível?
  const freezes = await obterFreezesDisponiveis(idAluno);

  if (freezes > 0) {
    // Usar freeze automático
    UPDATE tb_universidade_ranking
    SET qt_freezes = qt_freezes - 1,
        dt_ultima_atividade = now()
    WHERE id_aluno = :id_aluno;

    notificar({
      titulo: '❄️ Streak Protegido!',
      mensagem: 'Usamos um Freeze para proteger seu streak. Você tem ' + (freezes-1) + ' restantes.',
      tipo: 'info'
    });
  } else {
    // Resetar streak
    resetarStreak(idAluno);
  }

} else {
  // Muito tempo sem atividade - resetar
  resetarStreak(idAluno);
}

function resetarStreak(idAluno) {
  UPDATE tb_universidade_ranking
  SET qt_streak_atual = 0,
      dt_ultima_atividade = now()
  WHERE id_aluno = :id_aluno;

  notificar({
    titulo: '😢 Streak Perdido',
    mensagem: 'Seu streak foi resetado. Comece um novo hoje!',
    tipo: 'alerta',
    acao: { texto: 'Estudar Agora', link: '/universidade/meus-cursos' }
  });
}
```

### 5.4 Ranking Competitivo

**Passo 9: Atualizar Rankings**

```sql
-- Ranking Global (todos os alunos)
CREATE MATERIALIZED VIEW vw_ranking_global AS
SELECT
  id_aluno,
  qt_xp_total,
  qt_nivel,
  qt_badges,
  qt_cursos_concluidos,
  ROW_NUMBER() OVER (ORDER BY qt_xp_total DESC) as qt_posicao_global
FROM tb_universidade_ranking
WHERE fg_ativo = true
ORDER BY qt_xp_total DESC;

-- Refresh a cada 5 minutos (cron job)
REFRESH MATERIALIZED VIEW vw_ranking_global;
```

```sql
-- Ranking por Curso
CREATE VIEW vw_ranking_por_curso AS
SELECT
  c.id_curso,
  r.id_aluno,
  u.nm_nome,
  SUM(con.qt_xp_ganho) as qt_xp_curso,
  ROW_NUMBER() OVER (PARTITION BY c.id_curso ORDER BY SUM(con.qt_xp_ganho) DESC) as qt_posicao
FROM tb_universidade_cursos c
JOIN tb_universidade_inscricoes i ON c.id_curso = i.id_curso
JOIN tb_universidade_conquistas con ON i.id_inscricao = con.id_inscricao
JOIN tb_universidade_ranking r ON con.id_aluno = r.id_aluno
JOIN tb_users u ON r.id_aluno = u.id_usuario
WHERE i.ds_status = 'ativa'
GROUP BY c.id_curso, r.id_aluno, u.nm_nome
ORDER BY c.id_curso, qt_xp_curso DESC;
```

**Passo 10: Exibir Ranking para Usuário**

```javascript
// GET /universidade/ranking/global?page=1&size=50
{
  "ranking": [
    {
      "posicao": 1,
      "aluno": {
        "nm_nome": "Ana Paula Silva",
        "url_foto": "...",
        "id_aluno": "uuid"
      },
      "qt_xp_total": 15420,
      "qt_nivel": 28,
      "qt_badges": 34,
      "qt_cursos_concluidos": 12,
      "fg_eu": false // true se for o usuário logado
    },
    // ...
    {
      "posicao": 47,
      "aluno": { /* usuário logado */ },
      "fg_eu": true,
      "qt_xp_total": 3280,
      "qt_nivel": 14,
      "qt_badges": 18,
      "qt_cursos_concluidos": 4
    }
  ],
  "minha_posicao": {
    "posicao_global": 47,
    "posicao_semanal": 12,
    "xp_ate_proximo": 120 // XP necessário para subir 1 posição
  }
}
```

### 5.5 Recompensas por Progresso

**Passo 11: Desbloquear Benefícios por Nível**

```javascript
// Benefícios por nível
const beneficiosPorNivel = {
  5: {
    tipo: 'desconto',
    descricao: '10% de desconto em cursos',
    cupom: 'NIVEL5'
  },
  10: {
    tipo: 'curso_gratis',
    descricao: '1 curso grátis de sua escolha (até R$ 97)',
    voucher: 'NIVEL10-FREE'
  },
  15: {
    tipo: 'freezes',
    descricao: '+3 Streak Freezes',
    quantidade: 3
  },
  20: {
    tipo: 'acesso_vip',
    descricao: 'Acesso antecipado a novos cursos',
    duracao_dias: 30
  },
  25: {
    tipo: 'mentoria',
    descricao: '1 sessão de mentoria com instrutor expert',
    id_servico: 'mentoria-1h'
  },
  30: {
    tipo: 'certificacao_premium',
    descricao: 'Certificações com blockchain NFT',
    ativacao: true
  }
};

// Ao subir de nível, verificar e conceder benefícios
async function concederBeneficios(idAluno, nivelAlcancado) {
  const beneficio = beneficiosPorNivel[nivelAlcancado];

  if (beneficio) {
    switch (beneficio.tipo) {
      case 'desconto':
        // Criar cupom personalizado
        await criarCupom({
          id_usuario: idAluno,
          cd_cupom: beneficio.cupom,
          pc_desconto: 10,
          dt_validade: addDays(new Date(), 365)
        });
        break;

      case 'curso_gratis':
        // Gerar voucher
        await criarVoucher({
          id_usuario: idAluno,
          cd_voucher: beneficio.voucher,
          vl_max: 97,
          dt_validade: addDays(new Date(), 90)
        });
        break;

      case 'freezes':
        // Adicionar freezes
        UPDATE tb_universidade_ranking
        SET qt_freezes = qt_freezes + :quantidade
        WHERE id_aluno = :id_aluno;
        break;

      case 'acesso_vip':
        // Ativar flag VIP temporária
        UPDATE tb_universidade_ranking
        SET fg_acesso_vip = true,
            dt_vip_expira = now() + INTERVAL ':duracao_dias days'
        WHERE id_aluno = :id_aluno;
        break;

      case 'mentoria':
        // Criar crédito de mentoria
        INSERT INTO tb_creditos_servicos (
          id_usuario, id_servico, qt_saldo
        ) VALUES (:id_aluno, :id_servico, 1);
        break;

      case 'certificacao_premium':
        // Ativar NFT para certificados
        UPDATE tb_universidade_ranking
        SET fg_nft_certificados = true
        WHERE id_aluno = :id_aluno;
        break;
    }

    // Notificar recompensa
    notificar({
      titulo: `🎁 Recompensa Nível ${nivelAlcancado}!`,
      mensagem: beneficio.descricao,
      tipo: 'recompensa',
      animacao: 'gift-box'
    });
  }
}
```

---

## 6. Fluxos Alternativos

### 6.A - Missões Diárias

**Condição:** Sistema gera missões diárias personalizadas

**Fluxo:**
1. Todo dia às 00:00 UTC-3, sistema gera 3 missões aleatórias por aluno:
   ```javascript
   const missoesPossiveis = [
     { id: 'aulas-3', titulo: 'Complete 3 aulas', xp: 60 },
     { id: 'quiz-1', titulo: 'Faça 1 quiz', xp: 30 },
     { id: 'comentar-2', titulo: 'Comente em 2 aulas', xp: 20 },
     { id: 'projeto-upload', titulo: 'Envie 1 projeto prático', xp: 50 },
     { id: 'revisao', titulo: 'Revise 1 aula antiga', xp: 25 }
   ];

   const missoesDoDia = selecionarAleatoriamente(missoesPossiveis, 3);
   ```

2. Exibir missões no dashboard do aluno
3. Ao completar, creditar XP bônus
4. Se completar todas 3 missões → badge "Dia Produtivo" (+50 XP extra)

### 6.B - Eventos Semanais de XP Duplo

**Condição:** Toda sexta-feira das 18h às 23h59

**Fluxo:**
1. Sistema detecta período de evento
2. Todos os ganhos de XP são multiplicados por 2x
3. Banner no topo da plataforma: "🎉 XP em Dobro! Aproveite até 23h59"
4. Notificação push: "Última chance de ganhar XP em dobro!"

### 6.C - Ligas Competitivas (Inspirado Duolingo)

**Condição:** Alunos são divididos em ligas semanais

**Fluxo:**
1. Segunda-feira às 00:00, sistema cria novas ligas:
   - Bronze (iniciantes, nível 1-5)
   - Prata (nível 6-10)
   - Ouro (nível 11-20)
   - Platina (nível 21-30)
   - Diamante (nível 31+)

2. Cada liga tem 50 alunos com XP semelhante
3. Durante a semana, ranking atualiza em tempo real
4. Domingo 23h59: Finaliza liga
   - Top 10 → Promovidos para liga superior
   - Bottom 5 → Rebaixados para liga inferior
   - Demais → Permanecem na mesma liga

5. Recompensas de final de semana:
   - 1º lugar: +500 XP + badge
   - 2º-3º: +300 XP
   - 4º-10º: +100 XP
   - Top 10: Desconto de 20% em cursos por 7 dias

### 6.D - Desafios entre Amigos

**Condição:** Aluno desafia amigo para competição semanal

**Fluxo:**
1. Aluno acessa `/universidade/desafios/criar`
2. Seleciona amigo da lista
3. Define meta: "Quem ganha mais XP esta semana?"
4. Sistema envia convite
5. Se aceito, cria registro em `tb_universidade_desafios`:
   ```sql
   INSERT INTO tb_universidade_desafios (
     id_desafiante, id_desafiado, dt_inicio, dt_fim, ds_status
   ) VALUES (
     :id_aluno1, :id_aluno2, now(), now() + INTERVAL '7 days', 'ativo'
   );
   ```

6. Durante a semana, widget mostra placar ao vivo
7. No fim, sistema envia resultado:
   - Vencedor: +200 XP + badge "Vencedor de Desafio"
   - Perdedor: +50 XP de consolação

---

## 7. Fluxos de Exceção

### 7.A - Detecção de Trapaça

**Erro:** Aluno tenta manipular sistema (assistir vídeo em 10x velocidade, clicar múltiplas vezes, etc.)

**Tratamento:**
1. Sistema detecta padrões anormais:
   - Completar aula de 20min em < 2min
   - Múltiplos cliques em "completar" em < 1s
   - Acertar 10 quizzes seguidos com 100% em < 5min

2. Marcar atividade como suspeita:
   ```sql
   INSERT INTO tb_universidade_fraudes (
     id_aluno, ds_tipo, ds_evidencia, dt_ocorrencia
   ) VALUES (
     :id_aluno, 'velocidade_anormal',
     'Aula 20min concluída em 30s', now()
   );
   ```

3. Ações automáticas:
   - Bloquear XP dessa ação
   - Enviar aviso ao aluno
   - Se reincidente (3+ vezes) → suspender gamificação por 7 dias

### 7.B - Correção de XP Errado

**Erro:** Bug creditou XP duplicado ou incorreto

**Tratamento:**
1. Sistema de auditoria detecta anomalia
2. Rollback automático:
   ```sql
   -- Reverter XP da conquista inválida
   UPDATE tb_universidade_ranking
   SET qt_xp_total = qt_xp_total - :xp_erro,
       qt_xp_nivel_atual = qt_xp_nivel_atual - :xp_erro
   WHERE id_aluno = :id_aluno;

   -- Marcar conquista como inválida
   UPDATE tb_universidade_conquistas
   SET fg_valida = false, ds_motivo_invalidacao = 'bug_duplicacao'
   WHERE id_conquista = :id_conquista;
   ```

3. Se aluno já subiu de nível com XP inválido:
   - Notificar via email sobre correção
   - Manter nível se diferença < 5%
   - Rebaixar se diferença > 5%

---

## 8. Regras de Negócio

### RN001 - XP Não Acumula Retroativamente
- **Regra:** Ações realizadas antes da ativação de gamificação não geram XP
- **Validação:** Verificar `dt_ativacao_gamificacao` do aluno
- **Exceção:** Admin pode conceder XP manual por contribuições especiais

### RN002 - Limite Diário de XP por Tipo
- **Regra:** Para evitar farming, limitar XP por categoria:
  - Comentários: máx 15 XP/dia (3 comentários)
  - Respostas: máx 100 XP/dia (10 respostas úteis)
  - Revisões: máx 50 XP/dia (5 revisões)
- **Validação:** Somar XP do tipo `WHERE dt_criacao >= CURRENT_DATE`

### RN003 - Freezes Limitados
- **Regra:** Máximo 5 freezes simultâneos
- **Ganho:** 1 freeze a cada 7 dias de streak ou nível múltiplo de 5
- **Uso:** Automático ao perder streak

### RN004 - Badge Único por Tipo
- **Regra:** Cada badge só pode ser desbloqueado 1 vez
- **Exceção:** Badges "sazonais" (ex: "Estudante de Verão 2025") podem repetir anualmente

### RN005 - Ranking Justo
- **Regra:** Para entrar em ranking competitivo, aluno deve ter:
  - Pelo menos 1 curso ativo
  - Nível 3+
  - Conta criada há 7+ dias
- **Objetivo:** Evitar contas fake/bot

### RN006 - Decaimento de XP (Opcional)
- **Regra:** Após 90 dias de inatividade, XP começa a decair 1% ao dia
- **Objetivo:** Incentivar estudo contínuo
- **Recuperação:** Ao retornar, XP perdido pode ser recuperado estudando

### RN007 - Transferência de XP Proibida
- **Regra:** XP não pode ser transferido entre contas
- **Exceção:** Cupons e vouchers podem ser presenteados

---

## 9. Requisitos Não-Funcionais

### RNF001 - Performance de Cálculo de XP
- Cálculo de XP deve ocorrer em < 100ms
- Atualização de ranking global: batch job a cada 5 min (não em tempo real)
- Cache de rankings em Redis (TTL 5 min)

### RNF002 - Animações e Feedback Visual
- Notificações de XP ganho: aparecer em < 500ms após ação
- Animação de level up: 3s com confetti e som
- Badge unlock: modal com animação flip 3D

### RNF003 - Persistência e Auditoria
- Toda conquista registrada em `tb_universidade_conquistas` (imutável)
- Logs de mudanças de nível em `tb_universidade_eventos`
- Snapshot diário de rankings para histórico

### RNF004 - Escalabilidade
- Suportar 100.000 alunos ativos
- 1.000 ganhos de XP simultâneos
- Recalculo de rankings sem bloquear operações CRUD

---

## 10. Entidades e Relacionamentos

### Tabelas Principais

#### `tb_universidade_ranking`
```sql
CREATE TABLE tb_universidade_ranking (
  id_ranking UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_aluno UUID REFERENCES tb_users(id_usuario) UNIQUE,
  id_empresa UUID REFERENCES tb_empresas(id_empresa),

  -- XP e Níveis
  qt_xp_total BIGINT DEFAULT 0,
  qt_xp_nivel_atual INTEGER DEFAULT 0, -- XP acumulado no nível atual
  qt_nivel INTEGER DEFAULT 1,

  -- Streaks
  qt_streak_atual INTEGER DEFAULT 0,
  qt_streak_max INTEGER DEFAULT 0,
  qt_freezes INTEGER DEFAULT 2, -- Streak freezes disponíveis
  dt_ultima_atividade TIMESTAMP,

  -- Estatísticas
  qt_badges INTEGER DEFAULT 0,
  qt_cursos_concluidos INTEGER DEFAULT 0,
  qt_aulas_concluidas INTEGER DEFAULT 0,
  qt_quizzes_perfeitos INTEGER DEFAULT 0,

  -- Rankings
  qt_posicao_global INTEGER,
  qt_posicao_liga VARCHAR(50), -- "bronze", "prata", "ouro", etc.

  -- Benefícios
  fg_acesso_vip BOOLEAN DEFAULT false,
  dt_vip_expira TIMESTAMP,
  fg_nft_certificados BOOLEAN DEFAULT false,

  -- Auditoria
  dt_ativacao_gamificacao TIMESTAMP DEFAULT now(),
  fg_ativo BOOLEAN DEFAULT true,
  dt_criacao TIMESTAMP DEFAULT now(),
  dt_atualizacao TIMESTAMP
);

CREATE INDEX idx_ranking_aluno ON tb_universidade_ranking(id_aluno);
CREATE INDEX idx_ranking_xp ON tb_universidade_ranking(qt_xp_total DESC);
CREATE INDEX idx_ranking_nivel ON tb_universidade_ranking(qt_nivel DESC);
CREATE INDEX idx_ranking_liga ON tb_universidade_ranking(qt_posicao_liga);
```

#### `tb_universidade_badges`
```sql
CREATE TABLE tb_universidade_badges (
  id_badge UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cd_badge VARCHAR(50) UNIQUE NOT NULL, -- "primeiro-passo", "maratonista"
  nm_nome VARCHAR(100) NOT NULL,
  ds_descricao TEXT,
  ds_icone VARCHAR(10), -- emoji ou código
  url_imagem VARCHAR(500),

  -- Critérios (JSONB para flexibilidade)
  ds_criterio JSONB NOT NULL,
  /* Exemplo:
  {
    "tipo": "aulas_completas",
    "quantidade": 10,
    "operador": ">=",
    "condicoes_extras": {
      "categoria": "Facial",
      "periodo_dias": 7
    }
  }
  */

  -- Metadata
  nm_categoria VARCHAR(50), -- "Progresso", "Social", "Sazonal"
  qt_raridade INTEGER DEFAULT 1, -- 1=comum, 5=lendário
  fg_sazonal BOOLEAN DEFAULT false, -- Disponível apenas em períodos específicos
  dt_disponivel_inicio DATE,
  dt_disponivel_fim DATE,

  fg_ativo BOOLEAN DEFAULT true,
  dt_criacao TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_badge_categoria ON tb_universidade_badges(nm_categoria);
CREATE INDEX idx_badge_raridade ON tb_universidade_badges(qt_raridade);
```

#### `tb_universidade_badges_alunos`
```sql
CREATE TABLE tb_universidade_badges_alunos (
  id_badge_aluno UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_aluno UUID REFERENCES tb_users(id_usuario),
  id_badge UUID REFERENCES tb_universidade_badges(id_badge),

  dt_desbloqueio TIMESTAMP DEFAULT now(),
  fg_exibir_perfil BOOLEAN DEFAULT true, -- Aluno pode escolher exibir ou não

  UNIQUE(id_aluno, id_badge) -- Cada badge só pode ser ganho 1 vez
);

CREATE INDEX idx_badge_aluno ON tb_universidade_badges_alunos(id_aluno);
CREATE INDEX idx_badge_desbloqueio ON tb_universidade_badges_alunos(dt_desbloqueio DESC);
```

#### `tb_universidade_conquistas`
```sql
CREATE TABLE tb_universidade_conquistas (
  id_conquista UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_aluno UUID REFERENCES tb_users(id_usuario),
  id_inscricao UUID REFERENCES tb_universidade_inscricoes(id_inscricao),

  -- Tipo de ação que gerou XP
  ds_tipo_acao VARCHAR(100) NOT NULL, -- "aula_completa", "quiz_100", "streak_diario"
  id_referencia UUID, -- ID da aula, quiz, curso, etc.

  -- XP concedido
  qt_xp_ganho INTEGER NOT NULL,
  qt_multiplicador DECIMAL(3,2) DEFAULT 1.00,

  -- Metadados
  ds_detalhes JSONB, -- Informações extras (nota do quiz, tempo de estudo, etc.)

  -- Validação
  fg_valida BOOLEAN DEFAULT true,
  ds_motivo_invalidacao TEXT,

  dt_conquista TIMESTAMP DEFAULT now(),

  -- Idempotência: prevenir duplicação
  UNIQUE(id_aluno, ds_tipo_acao, id_referencia, dt_conquista)
);

CREATE INDEX idx_conquista_aluno ON tb_universidade_conquistas(id_aluno);
CREATE INDEX idx_conquista_tipo ON tb_universidade_conquistas(ds_tipo_acao);
CREATE INDEX idx_conquista_data ON tb_universidade_conquistas(dt_conquista DESC);
```

#### `tb_universidade_regras_xp`
```sql
CREATE TABLE tb_universidade_regras_xp (
  id_regra UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cd_regra VARCHAR(100) UNIQUE NOT NULL, -- "aula_completa", "quiz_60"
  nm_nome VARCHAR(200),
  ds_descricao TEXT,

  qt_xp_base INTEGER NOT NULL,
  qt_limite_diario INTEGER, -- NULL = sem limite

  -- Configuração de multiplicadores (JSONB)
  ds_multiplicadores JSONB,
  /* Exemplo:
  {
    "nota": [
      { "min": 60, "max": 79, "mult": 1 },
      { "min": 80, "max": 99, "mult": 2 },
      { "min": 100, "max": 100, "mult": 3 }
    ],
    "streak": [
      { "dias": 7, "mult": 2 },
      { "dias": 30, "mult": 5 }
    ]
  }
  */

  fg_ativa BOOLEAN DEFAULT true,
  dt_criacao TIMESTAMP DEFAULT now(),
  dt_atualizacao TIMESTAMP
);
```

#### `tb_universidade_eventos`
```sql
CREATE TABLE tb_universidade_eventos (
  id_evento UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_aluno UUID REFERENCES tb_users(id_usuario),

  ds_tipo VARCHAR(100) NOT NULL, -- "level_up", "badge_unlock", "streak_reset"
  ds_descricao TEXT,
  ds_metadata JSONB, -- Dados extras do evento

  dt_evento TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_evento_aluno ON tb_universidade_eventos(id_aluno);
CREATE INDEX idx_evento_tipo ON tb_universidade_eventos(ds_tipo);
CREATE INDEX idx_evento_data ON tb_universidade_eventos(dt_evento DESC);
```

#### `tb_universidade_desafios`
```sql
CREATE TABLE tb_universidade_desafios (
  id_desafio UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_desafiante UUID REFERENCES tb_users(id_usuario),
  id_desafiado UUID REFERENCES tb_users(id_usuario),

  dt_inicio TIMESTAMP NOT NULL,
  dt_fim TIMESTAMP NOT NULL,
  ds_status VARCHAR(50) DEFAULT 'pendente', -- "pendente", "ativo", "finalizado", "cancelado"

  -- Resultado
  id_vencedor UUID REFERENCES tb_users(id_usuario),
  qt_xp_desafiante INTEGER DEFAULT 0,
  qt_xp_desafiado INTEGER DEFAULT 0,

  dt_criacao TIMESTAMP DEFAULT now(),
  dt_atualizacao TIMESTAMP
);

CREATE INDEX idx_desafio_desafiante ON tb_universidade_desafios(id_desafiante);
CREATE INDEX idx_desafio_desafiado ON tb_universidade_desafios(id_desafiado);
CREATE INDEX idx_desafio_status ON tb_universidade_desafios(ds_status);
```

---

## 11. Endpoints da API

### GET `/universidade/ranking/global/`
**Descrição:** Ranking global de todos os alunos

**Query Params:**
- `page` (default: 1)
- `size` (default: 50)

**Response:**
```json
{
  "ranking": [
    {
      "posicao": 1,
      "aluno": {
        "id_aluno": "uuid",
        "nm_nome": "Ana Paula Silva",
        "url_foto": "...",
        "badges_destaque": ["🏆", "🔥", "💯"]
      },
      "qt_xp_total": 15420,
      "qt_nivel": 28,
      "qt_badges": 34,
      "qt_streak_atual": 45,
      "qt_cursos_concluidos": 12
    }
  ],
  "minha_posicao": {
    "posicao": 47,
    "qt_xp_total": 3280,
    "xp_ate_proxima_posicao": 120
  }
}
```

### GET `/universidade/gamificacao/meu-perfil/`
**Descrição:** Perfil de gamificação do aluno logado

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Response:**
```json
{
  "ranking": {
    "qt_xp_total": 3280,
    "qt_xp_nivel_atual": 280,
    "qt_xp_proximo_nivel": 500,
    "pc_progresso_nivel": 56.0,
    "qt_nivel": 14,
    "qt_badges": 18,
    "qt_posicao_global": 47
  },
  "streak": {
    "qt_streak_atual": 12,
    "qt_streak_max": 25,
    "qt_freezes": 3,
    "dt_ultima_atividade": "2025-11-12T14:30:00Z"
  },
  "estatisticas": {
    "qt_cursos_concluidos": 4,
    "qt_aulas_concluidas": 127,
    "qt_quizzes_perfeitos": 8,
    "qt_respostas_uteis": 23
  },
  "proximos_badges": [
    {
      "id_badge": "uuid",
      "nm_nome": "Maratonista",
      "ds_progresso": "8/10 aulas em um dia",
      "pc_completo": 80.0
    }
  ]
}
```

### GET `/universidade/gamificacao/badges/`
**Descrição:** Lista todos os badges disponíveis

**Response:**
```json
{
  "badges": [
    {
      "id_badge": "uuid",
      "cd_badge": "primeiro-passo",
      "nm_nome": "Primeiro Passo",
      "ds_descricao": "Complete sua primeira aula",
      "ds_icone": "👣",
      "qt_raridade": 1,
      "fg_desbloqueado": true,
      "dt_desbloqueio": "2025-10-15T10:00:00Z"
    },
    {
      "id_badge": "uuid",
      "cd_badge": "lenda",
      "nm_nome": "Lenda",
      "ds_descricao": "Mantenha streak de 30 dias",
      "ds_icone": "🏆",
      "qt_raridade": 5,
      "fg_desbloqueado": false,
      "dt_desbloqueio": null,
      "ds_progresso": "12/30 dias"
    }
  ],
  "estatisticas": {
    "qt_total": 45,
    "qt_desbloqueados": 18,
    "pc_conclusao": 40.0
  }
}
```

### GET `/universidade/gamificacao/historico-xp/`
**Descrição:** Histórico de ganhos de XP do aluno

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Query Params:**
- `dt_inicio` (opcional, formato ISO)
- `dt_fim` (opcional)
- `page`, `size`

**Response:**
```json
{
  "conquistas": [
    {
      "id_conquista": "uuid",
      "ds_tipo_acao": "quiz_100",
      "qt_xp_ganho": 90,
      "qt_multiplicador": 3.0,
      "ds_detalhes": {
        "nm_quiz": "Anatomia Facial - Módulo 1",
        "qt_nota": 100
      },
      "dt_conquista": "2025-11-12T16:45:00Z"
    }
  ],
  "resumo": {
    "qt_total_conquistas": 156,
    "qt_xp_periodo": 1240,
    "qt_xp_medio_dia": 87
  }
}
```

### POST `/universidade/gamificacao/creditar-xp/`
**Descrição:** Creditar XP por ação do aluno (uso interno)

**Headers:**
```
Authorization: Bearer {API_KEY} // API interna
```

**Body:**
```json
{
  "id_aluno": "uuid",
  "ds_tipo_acao": "aula_completa",
  "id_referencia": "uuid-da-aula",
  "ds_detalhes": {
    "qt_tempo_estudo": 15,
    "fg_primeira_vez": true
  }
}
```

**Response 200:**
```json
{
  "qt_xp_ganho": 20,
  "qt_xp_total": 3300,
  "fg_subiu_nivel": false,
  "fg_novo_badge": false,
  "mensagem": "+20 XP por completar aula!"
}
```

**Response 201 (Level Up):**
```json
{
  "qt_xp_ganho": 20,
  "qt_xp_total": 5000,
  "fg_subiu_nivel": true,
  "qt_nivel_novo": 15,
  "fg_novo_badge": true,
  "badges_novos": [
    {
      "nm_nome": "Guerreiro",
      "ds_icone": "⚔️"
    }
  ],
  "beneficios": [
    {
      "tipo": "freezes",
      "descricao": "+3 Streak Freezes"
    }
  ],
  "mensagem": "🎉 Parabéns! Você alcançou o nível 15!"
}
```

### POST `/universidade/gamificacao/desafios/criar/`
**Descrição:** Criar desafio com amigo

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Body:**
```json
{
  "id_desafiado": "uuid",
  "dt_inicio": "2025-11-13T00:00:00Z",
  "dt_fim": "2025-11-20T23:59:59Z"
}
```

**Response 201:**
```json
{
  "id_desafio": "uuid",
  "desafiante": { "nm_nome": "João Silva" },
  "desafiado": { "nm_nome": "Maria Santos" },
  "dt_inicio": "2025-11-13T00:00:00Z",
  "dt_fim": "2025-11-20T23:59:59Z",
  "ds_status": "pendente",
  "mensagem": "Desafio enviado! Aguardando aceitação."
}
```

### PATCH `/universidade/gamificacao/desafios/{id}/aceitar/`
**Descrição:** Aceitar desafio recebido

**Response 200:**
```json
{
  "id_desafio": "uuid",
  "ds_status": "ativo",
  "mensagem": "Desafio aceito! Que vença o melhor! 🔥"
}
```

### GET `/universidade/gamificacao/missoes-diarias/`
**Descrição:** Missões do dia

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Response:**
```json
{
  "missoes": [
    {
      "id_missao": "uuid",
      "nm_titulo": "Complete 3 aulas",
      "ds_descricao": "Assista 3 aulas completas hoje",
      "qt_xp_recompensa": 60,
      "qt_progresso": 1,
      "qt_meta": 3,
      "pc_completo": 33.3,
      "fg_concluida": false
    },
    {
      "id_missao": "uuid",
      "nm_titulo": "Faça 1 quiz",
      "ds_descricao": "Complete um quiz com nota mínima de 60%",
      "qt_xp_recompensa": 30,
      "qt_progresso": 0,
      "qt_meta": 1,
      "pc_completo": 0.0,
      "fg_concluida": false
    }
  ],
  "qt_total_xp_disponivel": 90,
  "fg_todas_concluidas": false
}
```

---

## 12. Telas e Wireframes

### Tela 1: Dashboard de Gamificação

**Layout:**
```
+----------------------------------------------------------+
|  [Navbar]                                                  |
+----------------------------------------------------------+
|  👤 Meu Perfil                        🏆 Nível 14         |
|                                                            |
|  +------------------+  +---------------------------+      |
|  | [Avatar]         |  | XP: 3.280 / 5.000         |      |
|  | João Silva       |  | [████████░░░] 65.6%       |      |
|  | Nível 14         |  | Faltam 1.720 XP           |      |
|  |                  |  +---------------------------+      |
|  | Posição Global   |                                     |
|  | #47 🥉          |  Streak: 12 dias 🔥                 |
|  +------------------+  ❄️ 3 freezes disponíveis          |
|                                                            |
|  Missões Diárias (2/3 completas)                          |
|  +--------------------------------------------------+     |
|  | ✅ Complete 3 aulas (3/3) +60 XP                 |     |
|  | ✅ Faça 1 quiz (1/1) +30 XP                      |     |
|  | ⬜ Comente em 2 aulas (0/2) +20 XP               |     |
|  +--------------------------------------------------+     |
|                                                            |
|  Próximos Badges (2)                                       |
|  +----------------------+  +----------------------+        |
|  | 🏃 Maratonista      |  | 💯 Perfeccionista   |        |
|  | 8/10 aulas em 1 dia |  | 3/5 quizzes 100%    |        |
|  | [████████░░] 80%    |  | [██████░░░░] 60%    |        |
|  +----------------------+  +----------------------+        |
|                                                            |
|  Meus Badges (18)                    [Ver Todos >]        |
|  👣 🔥 💯 🎓 ⚔️ 🌟 ...                                      |
+----------------------------------------------------------+
```

### Tela 2: Ranking Global

**Layout:**
```
+----------------------------------------------------------+
|  [Navbar]                                                  |
+----------------------------------------------------------+
|  🏆 Ranking Global                                         |
|                                                            |
|  [Global] [Semanal] [Por Curso] [Minha Liga]             |
|                                                            |
|  +--------------------------------------------------+     |
|  | #  | Aluno              | XP     | Nível | Badges |     |
|  |----|--------------------+--------+-------+--------|     |
|  | 🥇 | Ana Paula Silva    | 15.420 | 28    | 34     |     |
|  | 🥈 | Carlos Souza       | 14.890 | 27    | 31     |     |
|  | 🥉 | Mariana Costa      | 13.250 | 26    | 29     |     |
|  | 4  | Pedro Oliveira     | 11.780 | 24    | 27     |     |
|  | ...                                                |     |
|  | 47 | 👤 Você (João)     | 3.280  | 14    | 18     |  ← |
|  | ...                                                |     |
|  +--------------------------------------------------+     |
|                                                            |
|  Sua Liga: Prata                                           |
|  Suba 3 posições para ser promovido à Liga Ouro!          |
+----------------------------------------------------------+
```

### Tela 3: Coleção de Badges

**Layout:**
```
+----------------------------------------------------------+
|  [Navbar]                                                  |
+----------------------------------------------------------+
|  🏅 Meus Badges (18/45)                                    |
|                                                            |
|  [Todos] [Desbloqueados] [Bloqueados] [Raros]            |
|                                                            |
|  Progresso                                                 |
|  +--------------------------------------------------+     |
|  | 👣 Primeiro Passo           ✅ Desbloqueado      |     |
|  | Complete sua primeira aula  15/10/2025           |     |
|  +--------------------------------------------------+     |
|                                                            |
|  +--------------------------------------------------+     |
|  | 🔥 Em Chamas                ✅ Desbloqueado      |     |
|  | Streak de 7 dias            20/10/2025           |     |
|  +--------------------------------------------------+     |
|                                                            |
|  +--------------------------------------------------+     |
|  | 🏆 Lenda                    🔒 Bloqueado         |     |
|  | Streak de 30 dias           Progresso: 12/30     |     |
|  | [████░░░░░░░░░] 40%                              |     |
|  +--------------------------------------------------+     |
|                                                            |
|  Raros (0/8)                                               |
|  +--------------------------------------------------+     |
|  | 🦄 Unicórnio                🔒 Raridade 5        |     |
|  | Complete 50 cursos          Progresso: 4/50      |     |
|  +--------------------------------------------------+     |
+----------------------------------------------------------+
```

### Tela 4: Notificação de Level Up (Modal)

**Layout:**
```
+----------------------------------------------------------+
|                                                            |
|                    [Animação Confetti] 🎉                 |
|                                                            |
|                      LEVEL UP!                             |
|                                                            |
|                   🏆 Nível 15 🏆                           |
|                                                            |
|              Você ganhou novas recompensas:                |
|                                                            |
|              ❄️ +3 Streak Freezes                         |
|              🎁 1 Curso Grátis (até R$ 97)                |
|                                                            |
|            Próximo nível: 5.000 / 8.000 XP                |
|                                                            |
|                   [Continuar Estudando]                    |
|                                                            |
+----------------------------------------------------------+
```

---

## 13. Critérios de Aceitação

### ✅ Funcionalidades Obrigatórias

1. **Ganho de XP**
   - [ ] Todas as ações recompensáveis creditam XP corretamente
   - [ ] Idempotência: ação repetida não gera XP duplicado
   - [ ] Multiplicadores aplicam conforme regras (nota, streak, etc.)
   - [ ] Limite diário respeitado por tipo de ação

2. **Níveis**
   - [ ] Progressão calcula corretamente (tabela de níveis exponencial)
   - [ ] Notificação de level up aparece imediatamente
   - [ ] Benefícios desbloqueados automaticamente por nível

3. **Badges**
   - [ ] Critérios verificam após cada ação relevante
   - [ ] Badge desbloqueado apenas 1 vez por aluno
   - [ ] Notificação animada ao desbloquear

4. **Streaks**
   - [ ] Streak incrementa apenas 1 vez por dia
   - [ ] Freeze usado automaticamente ao perder streak
   - [ ] Streak reseta após > 48h sem atividade (se sem freeze)

5. **Rankings**
   - [ ] Ranking global atualiza a cada 5 min
   - [ ] Posição do aluno logado destacada
   - [ ] Ligas promovem/rebaixam semanalmente

6. **Missões Diárias**
   - [ ] 3 missões geradas às 00:00 diariamente
   - [ ] Progresso rastreado em tempo real
   - [ ] XP creditado ao completar missão

---

## 14. Próximos Casos de Uso

1. **UC003 - Mentor IA e RAG** - Dra. Sophie responde dúvidas, celebra conquistas
2. **UC004 - Certificações Blockchain** - NFTs de certificados verificáveis

---

## 15. Histórico de Revisões

| Versão | Data       | Autor           | Descrição                 |
|--------|------------|-----------------|---------------------------|
| 1.0    | 13/11/2025 | Sistema DoctorQ | Criação inicial do UC002  |

---

**Documento gerado como parte do projeto DoctorQ - Universidade da Beleza**
