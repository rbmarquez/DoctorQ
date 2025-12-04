# 🤝 Guia de Contribuição - DoctorQ Mobile

Obrigado por considerar contribuir para o DoctorQ Mobile! Este guia ajudará você a começar.

---

## 🚀 Começando

### 1. Fork e Clone

```bash
# Fork no GitHub
# Clone seu fork
git clone https://github.com/seu-usuario/DoctorQ.git
cd DoctorQ/doctorq-mobile

# Adicione upstream
git remote add upstream https://github.com/rbmarquez/DoctorQ.git
```

### 2. Configurar Ambiente

```bash
# Instalar dependências
npm install --legacy-peer-deps

# Copiar .env
cp .env.example .env

# Editar .env com suas configurações
```

### 3. Criar Branch

```bash
# Sempre crie uma branch a partir da main
git checkout -b feature/minha-feature

# Ou para bug fixes
git checkout -b fix/meu-bugfix
```

---

## 📝 Padrões de Código

### TypeScript

```typescript
// ✅ BOM
interface UserProps {
  name: string;
  email: string;
  age?: number;
}

const user: UserProps = {
  name: 'João',
  email: 'joao@example.com',
};

// ❌ EVITAR
const user: any = {
  name: 'João',
  email: 'joao@example.com',
};
```

### Componentes

```typescript
// ✅ BOM - Componente funcional com tipos
interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({ title, onPress, variant = 'primary' }) => {
  return (
    <TouchableOpacity onPress={onPress}>
      <Text>{title}</Text>
    </TouchableOpacity>
  );
};

// ❌ EVITAR - Props sem tipo
export const Button = ({ title, onPress }) => {
  // ...
};
```

### Nomenclatura

```typescript
// ✅ BOM
const getUserProfile = async (userId: string) => { ... };
const isAuthenticated = true;
const MAX_RETRY_ATTEMPTS = 3;

// ❌ EVITAR
const getUser = async (id) => { ... };
const auth = true;
const max = 3;
```

### Imports

```typescript
// ✅ BOM - Use path aliases
import { Button } from '@components/common/Button';
import { useAuth } from '@hooks/useAuth';
import { theme } from '@theme';

// ❌ EVITAR - Imports relativos longos
import { Button } from '../../components/common/Button';
```

---

## 🧪 Testes

### Executar Testes

```bash
# Testes unitários
npm test

# Testes com coverage
npm run test:coverage

# Type checking
npm run type-check

# Lint
npm run lint
```

### Escrever Testes

```typescript
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '@components/common/Button';

describe('Button', () => {
  it('should call onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button title="Click me" onPress={onPress} />);

    fireEvent.press(getByText('Click me'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
```

---

## 🎯 Convenções de Commit

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Features
git commit -m "feat(auth): add OAuth login support"

# Bug fixes
git commit -m "fix(appointments): correct date formatting"

# Documentação
git commit -m "docs(readme): update installation steps"

# Refactoring
git commit -m "refactor(api): simplify error handling"

# Performance
git commit -m "perf(images): optimize image loading"

# Testes
git commit -m "test(auth): add login flow tests"

# Chores
git commit -m "chore(deps): update dependencies"
```

### Tipos de Commit

- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `style`: Formatação (não afeta código)
- `refactor`: Refatoração
- `perf`: Performance
- `test`: Testes
- `chore`: Tarefas de manutenção
- `ci`: CI/CD

### Scopes Comuns

- `auth`: Autenticação
- `appointments`: Agendamentos
- `marketplace`: Marketplace
- `chat`: Chat
- `profile`: Perfil
- `api`: API services
- `ui`: Componentes UI
- `navigation`: Navegação

---

## 🔄 Pull Request

### Antes de Abrir PR

```bash
# Atualizar com upstream
git fetch upstream
git rebase upstream/main

# Verificar código
npm run lint
npm run type-check
npm test

# Build local
npm run build (se aplicável)
```

### Template de PR

```markdown
## 📝 Descrição

Breve descrição das mudanças

## 🎯 Tipo de Mudança

- [ ] Bug fix
- [ ] Nova feature
- [ ] Breaking change
- [ ] Documentação

## ✅ Checklist

- [ ] Código segue padrões do projeto
- [ ] Testes passando
- [ ] Documentação atualizada
- [ ] Sem console.logs
- [ ] Type-check passa

## 📸 Screenshots (se UI)

Antes:
![antes](url)

Depois:
![depois](url)

## 🧪 Como Testar

1. Passo 1
2. Passo 2
3. Resultado esperado
```

---

## 🐛 Reportar Bugs

### Template de Issue

```markdown
## 🐛 Descrição do Bug

Descrição clara do que está acontecendo

## 📱 Ambiente

- OS: iOS 17 / Android 13
- Device: iPhone 14 / Samsung S23
- App version: 1.0.0
- Expo version: 54.0

## 🔄 Reproduzir

1. Vá para '...'
2. Clique em '....'
3. Veja o erro

## ✅ Comportamento Esperado

O que deveria acontecer

## 📸 Screenshots

Se aplicável

## 📋 Logs

```
Colar logs aqui
```
```

---

## 💡 Sugestões de Features

### Template de Feature Request

```markdown
## 💡 Feature

Descrição da feature sugerida

## 🎯 Problema que Resolve

Qual problema essa feature resolve?

## 🚀 Solução Proposta

Como você imagina que funcione?

## 🔄 Alternativas

Outras soluções consideradas?

## 📝 Contexto Adicional

Screenshots, mockups, etc.
```

---

## 📚 Estrutura de Arquivos

### Onde Adicionar Código

```
New Component:      src/components/common/MyComponent.tsx
New Screen:         app/my-screen.tsx
New Hook:           src/hooks/useMyHook.ts
New API Service:    src/api/services/myService.ts
New Type:           src/types/index.ts (ou arquivo separado)
New Util:           src/utils/myUtil.ts
```

### Exemplo de Novo Componente

```typescript
// src/components/common/Badge.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { theme } from '@theme';

interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'error';
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'success' }) => {
  const getColor = () => {
    switch (variant) {
      case 'success':
        return theme.colors.success;
      case 'warning':
        return theme.colors.warning;
      case 'error':
        return theme.colors.error;
    }
  };

  return (
    <View
      style={{
        backgroundColor: getColor() + '20',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
      }}
    >
      <Text style={{ color: getColor(), fontSize: 12 }}>{label}</Text>
    </View>
  );
};
```

---

## 🎨 Estilo e Design

### Use o Design System

```typescript
import { theme } from '@theme';

// ✅ BOM - Use tema
<View style={{ padding: theme.spacing.md, color: theme.colors.primary[500] }} />

// ❌ EVITAR - Valores hardcoded
<View style={{ padding: 16, color: '#0ea5e9' }} />
```

### Use Componentes Existentes

```typescript
import { Button, Input, Card } from '@components/common';

// ✅ BOM - Reutilize componentes
<Button title="Save" onPress={handleSave} variant="primary" />

// ❌ EVITAR - Criar do zero
<TouchableOpacity style={{ backgroundColor: '#0ea5e9' }}>
  <Text>Save</Text>
</TouchableOpacity>
```

---

## 🔍 Code Review

### O que Procurar

- [ ] Código segue padrões
- [ ] Tipos TypeScript corretos
- [ ] Sem console.logs
- [ ] Performance adequada
- [ ] Acessibilidade
- [ ] Error handling
- [ ] Testes adequados
- [ ] Documentação necessária

### Como Revisar

```markdown
# ✅ Aprovação
LGTM! (Looks Good To Me)

# 💬 Sugestão
Sugiro usar useMemo aqui para performance

# ❓ Pergunta
Por que escolheu essa abordagem?

# ⚠️ Importante
Esse código tem um memory leak potencial
```

---

## 🏆 Boas Práticas

### Performance

```typescript
// ✅ BOM - useMemo para cálculos pesados
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// ✅ BOM - useCallback para funções
const handlePress = useCallback(() => {
  doSomething();
}, []);
```

### Segurança

```typescript
// ✅ BOM - Validação de entrada
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// ✅ BOM - Sanitização
const sanitizedInput = input.trim().toLowerCase();
```

### Acessibilidade

```typescript
// ✅ BOM - Acessibilidade
<TouchableOpacity
  accessible={true}
  accessibilityLabel="Salvar alterações"
  accessibilityRole="button"
>
  <Text>Salvar</Text>
</TouchableOpacity>
```

---

## 📞 Ajuda

- **Dúvidas**: Abra uma issue com label `question`
- **Bugs**: Use template de bug report
- **Features**: Use template de feature request
- **Documentação**: [README.md](./README.md)

---

## 🙏 Obrigado!

Toda contribuição é bem-vinda, seja código, documentação, design, ou reportar bugs!

---

**Happy Coding! 🚀**
