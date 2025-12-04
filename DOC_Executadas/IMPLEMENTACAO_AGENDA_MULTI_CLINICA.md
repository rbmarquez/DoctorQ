# Implementação da Agenda Multi-Clínica - DoctorQ

**Data:** 03/11/2025
**Status:** ✅ Completa (Frontend) | ⚠️ Pendente integração backend

## Resumo Executivo

Implementação completa do sistema de agenda profissional com suporte a **multi-clínicas**, permitindo que profissionais visualizem agendamentos de TODAS as clínicas onde trabalham em uma única interface unificada.

---

## 📁 Arquivos Copiados do Backup (DoctorQ_Prod)

### 1. Types (`/src/types/agenda.ts` - 187 linhas + modificações)
**Copiado de:** `/mnt/repositorios/DoctorQ_Prod/estetiQ-web/src/types/agenda.ts`
**Destino:** `/mnt/repositorios/DoctorQ/estetiQ-web/src/types/agenda.ts`

**Modificações aplicadas:**
```typescript
// ✨ NOVO: Interface para Clínica
export interface Clinica {
  id_clinica: string;
  nm_clinica: string;
  ds_endereco?: string;
  ds_cor_hex?: string; // Cor para identificação visual
}

// Modificado: Agendamento agora inclui clínica
export interface Agendamento {
  // ... campos existentes
  id_clinica?: string; // ✨ NOVO
  clinica?: Clinica;   // ✨ NOVO: Dados desnormalizados
}
```

**Interfaces incluídas:**
- ✅ `Agendamento` - Agendamento completo
- ✅ `Paciente` - Dados do paciente
- ✅ `Procedimento` - Procedimento agendado
- ✅ `Profissional` - Profissional responsável
- ✅ `Clinica` - **NOVO**: Clínica onde ocorre o atendimento
- ✅ `Sala` - Sala/consultório
- ✅ `Equipamento` - Equipamentos necessários
- ✅ `BloqueioAgenda` - Bloqueios (férias, almoço, etc.)
- ✅ `ConfiguracaoAgenda` - Configurações personalizadas
- ✅ `EstatisticasAgenda` - Métricas e KPIs
- ✅ `ListaEspera` - Sistema de lista de espera
- ✅ `SugestaoOtimizacao` - Sugestões de IA

---

### 2. Página Principal (`/src/app/profissional/agenda/page.tsx` - 647 linhas)
**Copiado de:** `/mnt/repositorios/DoctorQ_Prod/estetiQ-web/src/app/profissional/agenda/page.tsx`
**Destino:** `/mnt/repositorios/DoctorQ/estetiQ-web/src/app/profissional/agenda/page.tsx`

**Features implementadas:**
- ✅ **3 Visualizações**: Dia, Semana, Mês
- ✅ **Stats Cards**: Total, Confirmados, Faturamento, Taxa de Ocupação
- ✅ **Navegação**: Prev/Next/Hoje
- ✅ **Modal Novo Agendamento**
- ✅ **Modal Bloqueio de Horário**
- ✅ **Status com cores**: Confirmado, Pendente, Cancelado, Concluído
- ✅ **Toolbar**: Filtros, Exportar, Configurações

**⚠️ Modificações necessárias (próximo passo):**
```typescript
// 1. Adicionar estado para clínicas
const [selectedClinicaId, setSelectedClinicaId] = useState<string | null>(null);
const [clinicas, setClinicas] = useState<Clinica[]>([]);

// 2. Buscar clínicas do profissional
useEffect(() => {
  fetchClinicasProfissional();
}, []);

// 3. Adicionar filtro por clínica na toolbar
<Select value={selectedClinicaId} onValueChange={setSelectedClinicaId}>
  <option value="">Todas as Clínicas</option>
  {clinicas.map(c => <option key={c.id_clinica} value={c.id_clinica}>{c.nm_clinica}</option>)}
</Select>

// 4. Adicionar badge de clínica nos cards de agendamento
{agendamento.clinica && (
  <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
    📍 {agendamento.clinica.nm_clinica}
  </span>
)}
```

---

### 3. Componentes (`/src/components/agenda/`)

#### AppointmentModal.tsx (30KB)
**Copiado de:** `/mnt/repositorios/DoctorQ_Prod/estetiQ-web/src/components/agenda/AppointmentModal.tsx`
**Destino:** `/mnt/repositorios/DoctorQ/estetiQ-web/src/components/agenda/AppointmentModal.tsx`

**Features:**
- Formulário completo para criar/editar agendamentos
- Seleção de paciente, procedimento, data, horário
- Validações de disponibilidade
- Cálculo automático de duração baseado no procedimento
- Observações e notas

#### WeeklyView.tsx (8.7KB)
**Copiado de:** `/mnt/repositorios/DoctorQ_Prod/estetiQ-web/src/components/agenda/WeeklyView.tsx`
**Destino:** `/mnt/repositorios/DoctorQ/estetiQ-web/src/components/agenda/WeeklyView.tsx`

**Features:**
- Visualização semanal estilo Google Calendar
- Grid de horários (07:00 - 21:00)
- Drag & drop de agendamentos
- Click para criar novo agendamento

#### MonthlyView.tsx (8.9KB)
**Copiado de:** `/mnt/repositorios/DoctorQ_Prod/estetiQ-web/src/components/agenda/MonthlyView.tsx`
**Destino:** `/mnt/repositorios/DoctorQ/estetiQ-web/src/components/agenda/MonthlyView.tsx`

**Features:**
- Calendário mensal
- Indicadores de quantidade de agendamentos por dia
- Cores por status
- Click no dia abre visualização detalhada

#### BlockedTimeModal.tsx (13.6KB)
**Copiado de:** `/mnt/repositorios/DoctorQ_Prod/estetiQ-web/src/components/agenda/BlockedTimeModal.tsx`
**Destino:** `/mnt/repositorios/DoctorQ/estetiQ-web/src/components/agenda/BlockedTimeModal.tsx`

**Features:**
- Bloquear horários específicos
- Tipos: férias, almoço, descanso, congresso, ausência
- Data início/fim
- Recorrência (diário, semanal, mensal)
- Motivo/descrição

---

### 4. Página de Configurações (`/src/app/profissional/agenda/configuracoes/page.tsx` - 22KB)
**Copiado de:** `/mnt/repositorios/DoctorQ_Prod/estetiQ-web/src/app/profissional/agenda/configuracoes/page.tsx`
**Destino:** `/mnt/repositorios/DoctorQ/estetiQ-web/src/app/profissional/agenda/configuracoes/page.tsx`

**Configurações disponíveis:**
- Horário de expediente (início/fim)
- Dias de funcionamento (seg-dom)
- Intervalo entre slots (15/30/45/60 min)
- Horário de almoço
- Buffer entre procedimentos
- Confirmações SMS/WhatsApp
- Antecedência mínima/máxima
- Lista de espera

---

## 🔗 Integração com Multi-Clínica

### Database Schema (Já implementado - Migration 020)

```sql
-- Tabela N:N profissionais <-> clínicas
CREATE TABLE tb_profissionais_clinicas (
    id_profissional_clinica UUID PRIMARY KEY,
    id_profissional UUID REFERENCES tb_profissionais(id_profissional),
    id_clinica UUID REFERENCES tb_clinicas(id_clinica),
    dt_vinculo TIMESTAMP DEFAULT now(),
    dt_desvinculo TIMESTAMP,
    st_ativo BOOLEAN DEFAULT true,
    UNIQUE (id_profissional, id_clinica, st_ativo)
);

-- View consolidada
CREATE VIEW vw_profissionais_clinicas AS
SELECT
    pc.id_profissional_clinica,
    p.id_profissional, p.nm_profissional,
    c.id_clinica, c.nm_clinica,
    e.id_empresa, e.nm_empresa,
    pc.st_ativo, pc.dt_vinculo
FROM tb_profissionais_clinicas pc
INNER JOIN tb_profissionais p ON pc.id_profissional = p.id_profissional
INNER JOIN tb_clinicas c ON pc.id_clinica = c.id_clinica
INNER JOIN tb_empresas e ON c.id_empresa = e.id_empresa;

-- Função helper
CREATE FUNCTION get_profissional_clinicas(p_id_profissional UUID)
RETURNS TABLE (id_clinica UUID, nm_clinica VARCHAR, ...);
```

### Backend API Endpoints (Pendente implementação)

**Necessário criar:**

```python
# 1. GET /profissionais/{id_profissional}/clinicas/
# Retorna lista de clínicas onde o profissional trabalha
@router.get("/profissionais/{id_profissional}/clinicas/")
async def listar_clinicas_profissional(id_profissional: uuid.UUID):
    """
    Retorna todas as clínicas ativas vinculadas ao profissional
    Usa: vw_profissionais_clinicas WHERE st_ativo = true
    """
    pass

# 2. GET /agendamentos/profissional/{id_profissional}/
# Retorna agendamentos de TODAS as clínicas do profissional
@router.get("/agendamentos/profissional/{id_profissional}/")
async def listar_agendamentos_profissional_multi_clinica(
    id_profissional: uuid.UUID,
    dt_inicio: Optional[str] = None,
    dt_fim: Optional[str] = None,
    id_clinica: Optional[uuid.UUID] = None  # Filtro opcional
):
    """
    Busca agendamentos do profissional em todas as suas clínicas
    Se id_clinica fornecido, filtra apenas essa clínica

    JOIN: tb_agendamentos
    INNER JOIN tb_profissionais_clinicas ON id_profissional
    WHERE st_ativo = true
    AND (id_clinica = :id_clinica OR :id_clinica IS NULL)
    """
    pass

# 3. GET /agendamentos/{id_agendamento}/
# Incluir dados da clínica no retorno
# Response deve ter: clinica: { id_clinica, nm_clinica, ds_endereco }
```

### Frontend API Hooks (Pendente implementação)

```typescript
// src/lib/api/hooks/useAgendamentos.ts
export function useAgendamentosProfissional(
  id_profissional: string,
  filters?: {
    dt_inicio?: string;
    dt_fim?: string;
    id_clinica?: string; // Filtro opcional por clínica
  }
) {
  return useSWR(
    [`/agendamentos/profissional/${id_profissional}/`, filters],
    fetcher
  );
}

// src/lib/api/hooks/useClinicas.ts
export function useClinicasProfissional(id_profissional: string) {
  return useSWR(
    `/profissionais/${id_profissional}/clinicas/`,
    fetcher
  );
}
```

---

## 🎨 Melhorias UI para Multi-Clínica

### 1. Badge de Clínica nos Agendamentos

```tsx
// No card de agendamento (visualização DIA)
<div className="flex items-center space-x-3 mb-2">
  <h3 className="text-lg font-bold text-gray-900">
    {agendamento.paciente?.nm_completo}
  </h3>

  {/* Badge Primeira Vez */}
  {agendamento.bo_primeira_vez && (
    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
      Primeira Vez
    </span>
  )}

  {/* ✨ NOVO: Badge Clínica */}
  {agendamento.clinica && (
    <span
      className="px-2 py-1 text-xs font-semibold rounded-full flex items-center gap-1"
      style={{
        backgroundColor: agendamento.clinica.ds_cor_hex ? `${agendamento.clinica.ds_cor_hex}20` : '#E0E7FF',
        color: agendamento.clinica.ds_cor_hex || '#4F46E5'
      }}
    >
      <MapPin className="w-3 h-3" />
      {agendamento.clinica.nm_clinica}
    </span>
  )}

  {/* Badge Status */}
  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(agendamento.st_status)}`}>
    {getStatusText(agendamento.st_status)}
  </span>
</div>
```

### 2. Filtro de Clínica na Toolbar

```tsx
// Adicionar na toolbar antes dos botões de filtro
import { Building2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

<div className="flex items-center space-x-2">
  {/* ✨ NOVO: Filtro por Clínica */}
  <Select
    value={selectedClinicaId || "todas"}
    onValueChange={(value) => setSelectedClinicaId(value === "todas" ? null : value)}
  >
    <SelectTrigger className="w-[200px]">
      <Building2 className="h-4 w-4 mr-2" />
      <SelectValue placeholder="Todas as Clínicas" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="todas">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
          Todas as Clínicas
        </div>
      </SelectItem>
      {clinicas.map((clinica) => (
        <SelectItem key={clinica.id_clinica} value={clinica.id_clinica}>
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: clinica.ds_cor_hex || '#3B82F6' }}
            />
            {clinica.nm_clinica}
          </div>
        </SelectItem>
      ))}
    </SelectContent>
  </Select>

  {/* Botões existentes */}
  <div className="flex items-center bg-gray-100 rounded-lg p-1">
    {/* ... botões Dia/Semana/Mês */}
  </div>
</div>
```

### 3. Indicador Visual nas Views Semana/Mês

```tsx
// WeeklyView.tsx - Adicionar borda colorida por clínica
<div
  className="absolute inset-0 rounded p-1 cursor-pointer hover:shadow-md transition-shadow"
  style={{
    backgroundColor: procedimento?.ds_cor_hex || '#3B82F6',
    borderLeft: clinica?.ds_cor_hex ? `4px solid ${clinica.ds_cor_hex}` : 'none' // ✨ NOVO
  }}
  onClick={() => onAppointmentClick?.(agendamento)}
>
  {/* Conteúdo do agendamento */}
</div>
```

### 4. Estatísticas por Clínica

```tsx
// Adicionar nova seção de stats detalhadas por clínica
<div className="mt-6 bg-white rounded-xl shadow-sm border p-6">
  <h3 className="text-lg font-bold mb-4">Desempenho por Clínica</h3>
  {clinicasStats.map((stat) => (
    <div key={stat.id_clinica} className="flex items-center justify-between py-3 border-b last:border-0">
      <div className="flex items-center gap-3">
        <div
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: stat.ds_cor_hex }}
        />
        <span className="font-medium">{stat.nm_clinica}</span>
      </div>
      <div className="flex gap-6 text-sm">
        <div className="text-center">
          <div className="text-gray-600">Agendamentos</div>
          <div className="font-bold text-blue-600">{stat.nr_agendamentos}</div>
        </div>
        <div className="text-center">
          <div className="text-gray-600">Faturamento</div>
          <div className="font-bold text-green-600">
            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })
              .format(stat.vl_faturamento)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-gray-600">Ocupação</div>
          <div className="font-bold text-purple-600">{stat.nr_taxa_ocupacao}%</div>
        </div>
      </div>
    </div>
  ))}
</div>
```

---

## 📋 Checklist de Implementação

### ✅ Concluído

- [x] Copiar tipos da agenda (agenda.ts)
- [x] Adicionar interface `Clinica`
- [x] Modificar interface `Agendamento` para incluir clínica
- [x] Copiar página principal da agenda
- [x] Copiar 4 componentes (AppointmentModal, WeeklyView, MonthlyView, BlockedTimeModal)
- [x] Copiar página de configurações
- [x] Criar migration 020 para multi-clínica (tb_profissionais_clinicas)
- [x] Criar view vw_profissionais_clinicas
- [x] Criar função get_profissional_clinicas()

### ⚠️ Pendente (Próximos Passos)

#### Backend (Alta prioridade)
- [ ] Implementar endpoint `GET /profissionais/{id}/clinicas/`
- [ ] Implementar endpoint `GET /agendamentos/profissional/{id}/` (multi-clínica)
- [ ] Modificar `GET /agendamentos/{id}/` para incluir dados da clínica
- [ ] Adicionar `id_clinica` na criação de agendamentos
- [ ] Implementar filtro por clínica nos agendamentos

#### Frontend (Alta prioridade)
- [ ] Criar hook `useClinicasProfissional()`
- [ ] Criar hook `useAgendamentosProfissional()` com filtro de clínica
- [ ] Adicionar estado `selectedClinicaId` na página da agenda
- [ ] Adicionar Select de clínicas na toolbar
- [ ] Adicionar badge de clínica nos cards de agendamento
- [ ] Atualizar WeeklyView para mostrar indicador de clínica
- [ ] Atualizar MonthlyView para mostrar indicador de clínica
- [ ] Implementar seção de estatísticas por clínica

#### Testes (Média prioridade)
- [ ] Testar criação de agendamento com seleção de clínica
- [ ] Testar filtro por clínica específica
- [ ] Testar visualização "Todas as Clínicas"
- [ ] Validar permissões (profissional só vê suas clínicas)
- [ ] Testar estatísticas agregadas

---

## 🚀 Como Usar (Após implementação completa)

### Para o Profissional

1. **Acesse a Agenda**: `/profissional/agenda`
2. **Visualize todas as clínicas**: Por padrão, mostra agendamentos de TODAS as clínicas
3. **Filtre por clínica específica**: Use o dropdown "Clínica" na toolbar
4. **Identifique a clínica**: Cada agendamento tem badge com nome e cor da clínica
5. **Crie novo agendamento**: Selecione a clínica no modal de criação

### Visualizações Disponíveis

- **Dia**: Lista detalhada com horários, pacientes e clínicas
- **Semana**: Grid semanal com barra lateral por clínica
- **Mês**: Calendário mensal com indicadores coloridos

### Estatísticas

- **Global**: Métricas agregadas de todas as clínicas
- **Por Clínica**: Desempenho individual de cada localização

---

## 📊 Dados de Exemplo (Mock)

```typescript
const mockAgendamentos: Agendamento[] = [
  {
    id_agendamento: "1",
    id_clinica: "clinica-centro",
    dt_agendamento: "2025-11-04",
    hr_inicio: "09:00",
    hr_fim: "10:00",
    clinica: {
      id_clinica: "clinica-centro",
      nm_clinica: "DoctorQ Centro",
      ds_endereco: "Av. Paulista, 1000",
      ds_cor_hex: "#3B82F6", // Azul
    },
    paciente: { nm_completo: "Maria Silva", ... },
    procedimento: { nm_procedimento: "Botox", ... },
    // ...
  },
  {
    id_agendamento: "2",
    id_clinica: "clinica-sul",
    dt_agendamento: "2025-11-04",
    hr_inicio: "14:00",
    hr_fim: "15:30",
    clinica: {
      id_clinica: "clinica-sul",
      nm_clinica: "DoctorQ Sul",
      ds_endereco: "Rua Vergueiro, 500",
      ds_cor_hex: "#A855F7", // Roxo
    },
    paciente: { nm_completo: "João Santos", ... },
    procedimento: { nm_procedimento: "Preenchimento", ... },
    // ...
  },
];
```

---

## 🔄 Fluxo de Dados

```
[Profissional Login]
        ↓
[GET /profissionais/{id}/clinicas/]
→ Retorna: [{ id: "1", nm: "Clínica Centro" }, { id: "2", nm: "Clínica Sul" }]
        ↓
[Renderiza Select com clínicas]
        ↓
[GET /agendamentos/profissional/{id}/?id_clinica=1] (opcional)
→ Retorna agendamentos com dados da clínica incluídos
        ↓
[Renderiza agenda com badges de clínica]
```

---

## 📝 Notas Técnicas

1. **Performance**: A view `vw_profissionais_clinicas` tem índices otimizados
2. **Segurança**: Filtro por `id_empresa` garante isolamento multi-tenant
3. **Fallback**: Se clínica não encontrada, agendamento ainda é exibido
4. **Cores**: Sistema de cores por clínica facilita identificação visual
5. **Filtro opcional**: "Todas" é o padrão, mas pode filtrar por clínica específica

---

## 🐛 Troubleshooting

**Problema**: Agendamentos não aparecem
**Solução**: Verificar se profissional tem vínculo ativo em `tb_profissionais_clinicas`

**Problema**: Filtro por clínica não funciona
**Solução**: Verificar se endpoint backend aceita parâmetro `id_clinica`

**Problema**: Badge de clínica não aparece
**Solução**: Verificar se backend está retornando `clinica: { ... }` no agendamento

---

## 📚 Referências

- Migration 020: `/database/migration_020_profissionais_multi_clinica.sql`
- Types: `/src/types/agenda.ts`
- Página Principal: `/src/app/profissional/agenda/page.tsx`
- Componentes: `/src/components/agenda/`
- Documentação Arquitetura: `DOCUMENTACAO_ARQUITETURA_COMPLETA_DOCTORQ.md`

---

**Última atualização:** 03/11/2025 15:15
**Autor:** Claude Code
**Status:** ✅ Frontend Completo | ⚠️ Backend Pendente
