# 🧪 Testing Strategy - EstetiQ

Este documento descreve a estratégia de testes implementada no projeto EstetiQ.

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Tipos de Testes](#tipos-de-testes)
3. [Estrutura de Arquivos](#estrutura-de-arquivos)
4. [Como Executar](#como-executar)
5. [Coverage](#coverage)
6. [CI/CD Integration](#cicd-integration)
7. [Padrões e Boas Práticas](#padrões-e-boas-práticas)

---

## 1. Visão Geral

**Objetivo:** Garantir qualidade, prevenir regressões e facilitar refatorações.

**Frameworks:**
- **Playwright** - E2E tests (navegador real)
- **Jest** - Unit tests (components, hooks, utils)
- **Testing Library** - Component testing (user-centric)

**Meta de Coverage:** > 70%

---

## 2. Tipos de Testes

### 2.1. E2E Tests (Playwright)

**Localização:** `tests/e2e/`

**O que testar:**
- ✅ Smoke tests (funcionalidades críticas)
- ✅ User journeys completos
- ✅ Integrações frontend ↔ backend
- ✅ Auth flows (login, OAuth)

**Exemplo:**
```typescript
// tests/e2e/smoke.spec.ts
test('Login com credenciais válidas', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill('admin@estetiq.app');
  await page.getByLabel(/senha/i).fill('admin123');
  await page.getByRole('button', { name: /entrar/i }).click();
  await expect(page).toHaveURL(/.*dashboard/);
});
```

**Arquivos criados:**
- `tests/e2e/smoke.spec.ts` - 10 testes críticos (Login, CRUD, Navegação)

---

### 2.2. Unit Tests (Jest)

**Localização:** `src/**/__tests__/`

**O que testar:**
- ✅ Hooks (useQuery, useMutation, hooks específicos)
- ✅ Componentes genéricos (DataTable, FormDialog)
- ✅ Utilities (formatters, validators)
- ✅ Business logic

**Exemplo:**
```typescript
// src/lib-new/api/hooks/__tests__/factory.test.ts
it('deve retornar dados corretamente', async () => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => mockData,
  });

  const { result } = renderHook(
    () => useQuery({ endpoint: '/test', params: {} }),
    { wrapper }
  );

  await waitFor(() => {
    expect(result.current.isLoading).toBe(false);
  });

  expect(result.current.data).toEqual(mockData.items);
});
```

**Arquivos criados:**
- `src/lib-new/api/hooks/__tests__/factory.test.ts` - Factory hooks (useQuery, useMutation)
- `src/lib-new/api/hooks/gestao/__tests__/useEmpresas.test.ts` - Hook específico de Empresas
- `src/components-new/shared/tables/__tests__/DataTable.test.tsx` - DataTable component

---

### 2.3. Integration Tests

**Localização:** `tests/integration/`

**O que testar:**
- API routes
- Auth providers
- Database operations

**Status:** Planejado (Fase 7.2)

---

## 3. Estrutura de Arquivos

```
estetiQ-web/
├── tests/
│   ├── e2e/
│   │   ├── smoke.spec.ts           # Smoke tests críticos (10 testes)
│   │   ├── empresas.spec.ts        # (Planejado)
│   │   ├── usuarios.spec.ts        # (Planejado)
│   │   └── agendamentos.spec.ts    # (Planejado)
│   ├── integration/                 # (Planejado)
│   └── README.md                    # Este arquivo
│
├── src/
│   ├── lib-new/api/hooks/
│   │   ├── __tests__/
│   │   │   └── factory.test.ts     # ✅ Factory hooks (24 testes)
│   │   └── gestao/
│   │       └── __tests__/
│   │           └── useEmpresas.test.ts  # ✅ Hook de Empresas (18 testes)
│   │
│   └── components-new/shared/tables/
│       └── __tests__/
│           └── DataTable.test.tsx  # ✅ DataTable component (20+ testes)
│
├── jest.config.js                   # Configuração Jest
├── jest.setup.js                    # Setup global
└── playwright.config.ts             # Configuração Playwright
```

---

## 4. Como Executar

### 4.1. Unit Tests (Jest)

```bash
# Todos os testes
yarn test

# Watch mode (desenvolvimento)
yarn test:watch

# Com coverage
yarn test:coverage

# Teste específico
yarn test factory.test.ts

# Update snapshots
yarn test -u
```

### 4.2. E2E Tests (Playwright)

```bash
# Todos os testes E2E
yarn test:e2e

# UI Mode (interativo)
yarn test:e2e:ui

# Headed mode (ver navegador)
yarn test:e2e:headed

# Debug mode
yarn test:e2e:debug

# Teste específico
yarn test:e2e smoke.spec.ts
```

**Importante:** E2E tests requerem:
- Backend rodando em `http://localhost:8080`
- Frontend rodando em `http://localhost:3000`

---

## 5. Coverage

### 5.1. Gerar Report

```bash
# Coverage completo
yarn test:coverage

# Ver no navegador
open coverage/lcov-report/index.html
```

### 5.2. Métricas de Coverage

**Meta:** > 70% global

**Por Categoria:**
- Hooks: > 80%
- Components: > 70%
- Utils: > 90%

**Arquivos Excluídos:**
- `*.d.ts` - Type declarations
- `*.stories.tsx` - Storybook stories
- `__tests__/**` - Test files themselves

**Configuração (`jest.config.js`):**
```javascript
collectCoverageFrom: [
  'src/**/*.{js,jsx,ts,tsx}',
  '!src/**/*.d.ts',
  '!src/**/*.stories.{js,jsx,ts,tsx}',
  '!src/**/__tests__/**',
]
```

---

## 6. CI/CD Integration

### 6.1. GitHub Actions Workflow

**Arquivo:** `.github/workflows/test.yml` (a criar)

```yaml
name: Tests

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: yarn install --frozen-lockfile
      - run: yarn test:coverage
      - uses: codecov/codecov-action@v3

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: yarn install --frozen-lockfile
      - run: npx playwright install --with-deps
      - run: yarn test:e2e
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

### 6.2. Pre-commit Hook

**Arquivo:** `.husky/pre-commit` (a criar)

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run unit tests on changed files
yarn test --bail --findRelatedTests --passWithNoTests

# Run linter
yarn lint
```

### 6.3. Pre-push Hook

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run all tests before push
yarn test --coverage --passWithNoTests
```

---

## 7. Padrões e Boas Práticas

### 7.1. Nomenclatura

**Arquivos:**
- Unit tests: `*.test.ts` ou `*.test.tsx`
- E2E tests: `*.spec.ts`

**Describe blocks:**
```typescript
describe('ComponentName', () => {
  describe('Feature 1', () => {
    it('should do something specific', () => {
      // test
    });
  });
});
```

### 7.2. AAA Pattern

```typescript
it('should do something', () => {
  // Arrange
  const data = setupTestData();
  const mockFn = jest.fn();

  // Act
  const result = doSomething(data);

  // Assert
  expect(result).toBe(expected);
  expect(mockFn).toHaveBeenCalledWith(data);
});
```

### 7.3. Mocking

**Fetch global:**
```typescript
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

beforeEach(() => {
  jest.clearAllMocks();
});
```

**SWR Wrapper:**
```typescript
import { SWRConfig } from 'swr';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
    {children}
  </SWRConfig>
);
```

### 7.4. Async Tests

```typescript
it('should load data asynchronously', async () => {
  mockFetch.mockResolvedValueOnce({ ok: true, json: async () => data });

  const { result } = renderHook(() => useQuery({ ... }), { wrapper });

  // Wait for loading to finish
  await waitFor(() => {
    expect(result.current.isLoading).toBe(false);
  });

  expect(result.current.data).toEqual(expectedData);
});
```

### 7.5. Testing Library Queries

**Prioridade:**
1. `getByRole` - Mais acessível
2. `getByLabelText` - Forms
3. `getByPlaceholderText` - Inputs
4. `getByText` - Content
5. `getByTestId` - Último recurso

**Exemplo:**
```typescript
// ✅ Bom
const button = screen.getByRole('button', { name: /salvar/i });
const input = screen.getByLabelText(/email/i);

// ❌ Evitar
const button = screen.getByTestId('save-button');
```

### 7.6. Snapshot Testing

**Use com moderação:**
```typescript
it('should match snapshot', () => {
  const { container } = render(<Component />);
  expect(container).toMatchSnapshot();
});
```

**Atualizar snapshots:**
```bash
yarn test -u
```

### 7.7. E2E Best Practices

**1. Use Page Objects:**
```typescript
class LoginPage {
  constructor(private page: Page) {}

  async login(email: string, password: string) {
    await this.page.getByLabel(/email/i).fill(email);
    await this.page.getByLabel(/senha/i).fill(password);
    await this.page.getByRole('button', { name: /entrar/i }).click();
  }
}
```

**2. Espere por elementos:**
```typescript
// ✅ Bom
await expect(page.getByText('Success')).toBeVisible();

// ❌ Ruim
await page.waitForTimeout(2000); // Arbitrary wait
```

**3. Use fixtures para dados:**
```typescript
test.use({
  storageState: 'auth/admin.json', // Pre-authenticated state
});
```

---

## 8. Troubleshooting

### 8.1. Tests Flaky

**Problema:** Testes passam/falham aleatoriamente

**Solução:**
- Use `waitFor` e `findBy` queries
- Evite `waitForTimeout`
- Limpe mocks entre testes: `beforeEach(() => jest.clearAllMocks())`

### 8.2. Coverage Baixo

**Problema:** Coverage abaixo de 70%

**Solução:**
- Identifique arquivos não cobertos: `yarn test:coverage`
- Priorize hooks e utils críticos
- Use coverage differential em PRs

### 8.3. E2E Tests Lentos

**Problema:** E2E tests demoram muito

**Solução:**
- Run em paralelo: `workers: 4` no Playwright config
- Use `test.describe.parallel()`
- Cache de autenticação: `storageState`

### 8.4. Module Not Found

**Problema:** Imports não resolvem em tests

**Solução:**
- Verifique `moduleNameMapper` no `jest.config.js`
- Use `@/` alias configurado em `tsconfig.json`

---

## 9. Próximos Passos

### Fase 7 - Completar (Pendente)

- [ ] Adicionar mais E2E tests:
  - CRUD Empresas completo
  - CRUD Usuários
  - Criar agendamento
  - Upload de arquivos
- [ ] Integration tests:
  - API routes
  - Auth flows
- [ ] Setup CI/CD:
  - GitHub Actions
  - Coverage reports
  - Pre-commit hooks

### Fase 8 - Testing Avançado (Futuro)

- [ ] Visual regression testing (Percy/Chromatic)
- [ ] Performance testing (Lighthouse CI)
- [ ] Accessibility testing (axe-core)
- [ ] API contract testing (Pact)

---

## 10. Recursos

**Documentação:**
- [Playwright Docs](https://playwright.dev/)
- [Jest Docs](https://jestjs.io/)
- [Testing Library](https://testing-library.com/react)

**Exemplos:**
- `tests/e2e/smoke.spec.ts` - E2E smoke tests
- `src/lib-new/api/hooks/__tests__/factory.test.ts` - Hook testing
- `src/components-new/shared/tables/__tests__/DataTable.test.tsx` - Component testing

---

**Última atualização:** 2025-10-29
**Autor:** Equipe EstetiQ
**Status:** Fase 7 - Em progresso (Setup completo, testes iniciais criados)
