/**
 * Constantes para URLs de imagens da aplicação
 */

export const IMAGES = {
  // Landing page
  landing: {
    heroIllustration: '/images/landing/hero-illustration.svg',
    clientCard: '/images/landing/client-card.jpg',
    partnerCard: '/images/landing/partner-card.jpg',
  },

  // Cursos
  cursos: {
    placeholder: '/images/cursos/placeholder-curso.svg',
    harmonizacaoFacial: '/images/cursos/harmonizacao-facial.jpg',
    preenchimento: '/images/cursos/preenchimento.jpg',
    bioestimuladores: '/images/cursos/bioestimuladores.jpg',
  },

  // Profissionais
  profissionais: {
    placeholder: '/images/profissionais/placeholder-profissional.svg',
  },

  // Clínicas
  clinicas: {
    placeholder: '/images/clinicas/placeholder-clinica.svg',
  },

  // Avatars
  avatars: {
    default: '/images/avatars/default-avatar.svg',
    gisele: '/images/avatars/gisele-avatar.svg',
  },

  // Placeholders genéricos
  placeholders: {
    image: '/images/placeholders/image.svg',
    user: '/images/placeholders/user.svg',
    logo: '/images/placeholders/logo.svg',
  },
} as const;

// Função helper para gerar URL da imagem com fallback
export function getImageUrl(
  path: string | undefined | null,
  fallback: string = IMAGES.placeholders.image
): string {
  return path || fallback;
}

// Função para gerar srcSet responsivo
export function generateSrcSet(basePath: string, sizes: number[] = [320, 640, 1024, 1920]): string {
  return sizes.map(size => `${basePath}?w=${size} ${size}w`).join(', ');
}
