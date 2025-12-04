# 🎨 Nova Landing Page Premium - EstetiQ

## 📋 Visão Geral

Landing page completamente renovada com design elegante e sofisticado, inspirada nos melhores sites premium (Shopify Plus, Rolex, Wistia) e adaptada para o mercado de estética.

## ✨ Principais Características

### 1. **Hero Section Premium com Vídeo**
- Design inspirado em Rolex e Shopify Plus
- Vídeo explicativo integrado (placeholder para substituir)
- Animações suaves e modernas
- Trust indicators (1.000+ clínicas, 50.000+ pacientes)
- Floating cards com depoimentos
- Scroll indicator animado

**Componente:** `PremiumHeroSection.tsx`

### 2. **Dual Access (Clientes vs Parceiros)**
- Design inspirado no iFood
- Dois cards side-by-side com gradientes distintos:
  - **Rose/Purple** para Clientes/Pacientes
  - **Indigo/Blue** para Parceiros/Clínicas
- Features específicas para cada público
- CTAs diferenciados
- Estatísticas de impacto no rodapé

**Componente:** `DualAccessSection.tsx`

### 3. **Universidade da Beleza**
- Seção completa de educação
- 3 categorias principais:
  - **Cursos Online:** Com certificação SBME
  - **Ebooks:** Conteúdo condensado por especialistas
  - **Podcast:** Episódios com os maiores nomes da estética
- Cards interativos com hover effects
- Estatísticas: 15.000+ alunos, 120+ cursos
- CTA para assinatura mensal (R$ 97/mês)

**Componente:** `UniversidadeSection.tsx`

### 4. **Carreiras (Vagas e Currículos)**
- Portal completo de empregos
- Dois fluxos:
  - **Para Candidatos:** Buscar vagas
  - **Para Empresas:** Cadastrar vagas
- Vagas em destaque com filtros
- Estatísticas: 850+ vagas, 1.2K+ clínicas parceiras
- Benefícios do setor destacados

**Componente:** `CarreirasSection.tsx`

### 5. **Navegação Premium**
- Fixed header com blur effect
- Transição suave ao scroll
- Menu mobile responsivo
- Links de ancoragem para seções
- CTAs destacados (Entrar, Começar Grátis)

**Componente:** `PremiumNav.tsx`

## 🎬 Vídeo Explicativo

### Localização no Código
`PremiumHeroSection.tsx` - Linha 94-110

### Como Substituir o Vídeo
```typescript
// Substitua a URL do YouTube:
<iframe
  src="https://www.youtube.com/embed/SEU_VIDEO_ID?autoplay=1"
  // ... resto do código
/>

// Ou use Vimeo:
<iframe
  src="https://player.vimeo.com/video/SEU_VIDEO_ID?autoplay=1"
  // ... resto do código
/>

// Ou vídeo self-hosted:
<video
  className="absolute inset-0 w-full h-full object-cover"
  src="/videos/estetiq-demo.mp4"
  autoPlay
  controls
  playsInline
/>
```

## 🎨 Design System

### Paleta de Cores
- **Rose/Pink:** `from-rose-500 to-purple-600` (Clientes)
- **Indigo/Blue:** `from-indigo-600 to-purple-700` (Parceiros)
- **Purple:** `from-purple-500 to-pink-600` (Universidade)
- **Background:** Gradientes sutis com radial-gradient

### Animações
Adicionadas ao `globals.css`:
- `animate-float` - Floating cards
- `animate-fade-in-up` - Fade in com movimento
- `animate-fade-in-scale` - Fade in com escala
- `animate-shimmer` - Efeito shimmer/brilho

### Tipografia
- **Headings:** Font-bold, tracking-tight
- **Body:** Leading-relaxed para melhor legibilidade
- **Gradient Text:** `bg-gradient-to-r bg-clip-text text-transparent`

## 📱 Responsividade

Todas as seções são 100% responsivas:
- **Mobile:** Stack vertical, menu hamburguer
- **Tablet:** Grid 2 colunas
- **Desktop:** Grid 3-4 colunas, navegação completa

## 🚀 Como Usar

### Ativar a Nova Landing Page
A nova landing já está ativa no arquivo `src/app/page.tsx`:

```typescript
import { PremiumLandingPage } from "@/components/landing/PremiumLandingPage";

export default function Home() {
  return <PremiumLandingPage />;
}
```

### Voltar para Landing Antiga (se necessário)
```typescript
import { LandingPage } from "@/components/landing/LandingPage";

export default function Home() {
  return <LandingPage />;
}
```

## 📁 Estrutura de Arquivos

```
src/
├── components/
│   └── landing/
│       ├── PremiumLandingPage.tsx       # Container principal
│       ├── PremiumNav.tsx               # Navegação premium
│       ├── PremiumHeroSection.tsx       # Hero com vídeo
│       ├── DualAccessSection.tsx        # Clientes vs Parceiros
│       ├── UniversidadeSection.tsx      # Cursos, Ebooks, Podcast
│       ├── CarreirasSection.tsx         # Vagas e Currículos
│       └── Footer.tsx                   # (existente)
├── app/
│   ├── page.tsx                         # Página principal (atualizada)
│   └── globals.css                      # Animações adicionadas
```

## 🎯 Seções da Página

### Ordem das Seções
1. **Hero Section** - Acima da dobra
2. **Dual Access** - `#para-voce` (ancora)
3. **Universidade** - `#universidade` (ancora)
4. **Carreiras** - `#carreiras` (ancora)
5. **Footer** - Informações e links

### Links de Ancora
```html
#para-voce       → Dual Access Section
#para-parceiros  → Dual Access Section (mesmo componente)
#universidade    → Universidade da Beleza
#carreiras       → Portal de Carreiras
```

## 📊 Métricas Exibidas

### Seção Hero
- 1.000+ Clínicas Parceiras
- 50.000+ Pacientes Atendidos
- 98% Satisfação

### Seção Dual Access
- 1.000+ Clínicas Parceiras
- 50K+ Pacientes Ativos
- 98% Satisfação
- 500K+ Procedimentos Agendados

### Universidade da Beleza
- 15.000+ Alunos
- 120+ Cursos
- 98% Satisfação
- 50K+ Certificados

### Carreiras
- 850+ Vagas Ativas
- 1.2K+ Clínicas Parceiras
- 15K+ Currículos Cadastrados
- 95% Taxa de Contratação

## 🔗 Rotas Necessárias

Certifique-se de criar estas rotas no Next.js:

### Autenticação
- `/login` - Página de login
- `/registro` - Cadastro geral
- `/registro?tipo=paciente` - Cadastro de paciente
- `/registro?tipo=parceiro` - Cadastro de parceiro

### Universidade
- `/universidade/cursos` - Lista de cursos
- `/universidade/cursos/[id]` - Detalhes do curso
- `/universidade/ebooks` - Lista de ebooks
- `/universidade/podcast` - Lista de episódios
- `/universidade/assinar` - Assinatura mensal

### Carreiras
- `/carreiras/vagas` - Lista de vagas
- `/carreiras/vagas/[id]` - Detalhes da vaga
- `/carreiras/anunciar` - Anunciar vaga (empresas)
- `/carreiras/sobre` - Sobre carreiras no setor

## 🎨 Inspirações de Design

### Shopify Plus
- Gradientes sutis
- Espaçamento generoso
- Tipografia bold e confiante

### Rolex
- Elegância minimalista
- Foco em qualidade
- Imagens/vídeos impactantes

### Wistia
- Vídeo como protagonista
- Animações suaves
- CTAs claros e diretos

### iFood
- Dual-path claro (cliente vs parceiro)
- Cards diferenciados por cor
- Estatísticas de confiança

## 🚧 Próximos Passos

1. **Substituir Vídeo Placeholder**
   - Gravar vídeo demonstrativo (2-3 minutos)
   - Upload no YouTube/Vimeo
   - Atualizar URL no `PremiumHeroSection.tsx`

2. **Criar Rotas Backend**
   - Endpoints para cursos, ebooks, podcast
   - Endpoints para vagas e currículos
   - Sistema de assinatura Universidade

3. **Conteúdo Real**
   - Adicionar cursos reais
   - Adicionar ebooks reais
   - Adicionar episódios de podcast reais
   - Adicionar vagas reais

4. **SEO e Performance**
   - Adicionar meta tags
   - Otimizar imagens
   - Lazy loading para componentes pesados

## 📝 Notas Técnicas

- **Next.js 15** com App Router
- **React 19** (client components)
- **Tailwind CSS 3.4** para estilização
- **Lucide React** para ícones
- **Shadcn/UI** para componentes base
- 100% TypeScript
- Sem dependências externas pesadas

## 🎉 Resultado Final

Uma landing page **premium, elegante e moderna** que:
- ✅ Transmite confiança e profissionalismo
- ✅ Diferencia claramente os públicos (B2C e B2B)
- ✅ Destaca educação e conteúdo
- ✅ Abre mercado de recrutamento
- ✅ É 100% responsiva
- ✅ Tem animações suaves
- ✅ Carrega rápido

---

**Versão:** 1.0
**Data:** 12/11/2025
**Autor:** Equipe EstetiQ
