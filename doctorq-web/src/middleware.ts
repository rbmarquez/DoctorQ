import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/auth';

const publicRoutes = [
  '/',
  '/login',
  '/cadastro',
  '/registro',
  '/sobre',
  '/contato',
  '/busca',
  '/profissionais',
  '/procedimentos',
  '/marketplace',
  '/produtos',
  '/redefinir-senha',
  '/esqueci-senha',
  '/ajuda',
  '/blog',
  '/legal',
  '/carreiras',
  '/carreiras/vagas',
  '/carreiras/cadastro-curriculo',
  '/universidade',
  '/universidade/cursos',
];
const publicRoutePrefixes = ['/api/auth', '/_next'];
const publicStaticFiles = ['/favicon.ico'];
const publicParceirosRoutes = ['/parceiros', '/parceiros/novo', '/parceiros/beneficios', '/parceiros/sucesso'];

const roleRoutes: Record<string, string[]> = {
  '/admin': ['administrador'],
  '/parceiros': ['administrador'],
  '/clinica': ['gestor_clinica', 'recepcionista', 'financeiro', 'secretaria', 'auxiliar', 'administrador'],
  '/profissional': ['profissional', 'administrador'],
  '/paciente': ['paciente', 'administrador'],
  // Usuários genéricos podem acessar dashboard da clínica como fallback
};

const normalizeRole = (role?: string | null): string => {
  const value = role?.toString().trim().toLowerCase() || '';

  if (['admin', 'administrador', 'super_admin', 'superadmin'].includes(value)) {
    return 'administrador';
  }

  if (['gestor_clinica', 'gestor clínica', 'gestor', 'manager', 'clinica'].includes(value)) {
    return 'gestor_clinica';
  }

  if (
    [
      'profissional',
      'profissional_estetica',
      'profissional_estética',
      'medico',
      'médico',
      'esteticista',
    ].includes(value)
  ) {
    return 'profissional';
  }

  if (['fornecedor', 'gestor_fornecedor', 'vendedor', 'marketing', 'parceiro'].includes(value)) {
    return 'fornecedor';
  }

  if (['paciente', 'cliente', 'user', 'usuario', 'usuário', 'cliente/paciente'].includes(value)) {
    return 'paciente';
  }

  return 'paciente';
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Verificar rotas públicas específicas de parceiros PRIMEIRO
  const isParceirosPublicRoute = publicParceirosRoutes.some((route) => pathname === route);

  if (isParceirosPublicRoute) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Verificar outras rotas públicas
  const isPublicRoute =
    publicRoutes.some((route) => {
      if (route === '/') {
        return pathname === '/';
      }
      return pathname === route || pathname.startsWith(`${route}/`);
    }) ||
    publicRoutePrefixes.some((prefix) => pathname.startsWith(prefix)) ||
    publicStaticFiles.includes(pathname);

  if (isPublicRoute) {
    return NextResponse.next();
  }

  const session = await auth();

  if (!session?.user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const userRole = normalizeRole(session.user.role);

  console.log('[MIDDLEWARE]', {
    pathname,
    userRole,
    sessionUserRole: session.user.role,
    sessionUser: session.user,
  });

  // Mapear role para dashboard padrão
  const roleToDashboard: Record<string, string> = {
    'administrador': '/admin/dashboard',
    'gestor_clinica': '/clinica/dashboard',
    'profissional': '/profissional/dashboard',
    'paciente': '/paciente/dashboard',
    'fornecedor': '/fornecedor/dashboard',
    'recepcionista': '/clinica/dashboard',
    'secretaria': '/clinica/dashboard',
    'financeiro': '/clinica/dashboard',
    'auxiliar': '/clinica/dashboard',
  'usuario': '/clinica/dashboard', // Fallback para usuário genérico
  'user': '/clinica/dashboard',    // Alias para usuario (150 users no DB)
    'analista': '/clinica/dashboard', // Fallback para analista
  };

  for (const [route, allowedRoles] of Object.entries(roleRoutes)) {
    if (pathname.startsWith(route)) {
      console.log('[MIDDLEWARE] Verificando rota:', route, 'allowedRoles:', allowedRoles, 'userRole:', userRole);
      if (!allowedRoles.includes(userRole)) {
        // Obter dashboard padrão para o role
        const dashboardUrl = roleToDashboard[userRole] || '/clinica/dashboard';

        // Evitar loop infinito: se já estamos tentando redirecionar para o próprio dashboard, retornar 403
        if (pathname.startsWith(dashboardUrl.replace('/dashboard', ''))) {
          console.log('[MIDDLEWARE] Loop detectado! Bloqueando acesso.');
          return NextResponse.redirect(new URL('/login?error=access_denied', request.url));
        }

        console.log('[MIDDLEWARE] Redirecionando para:', dashboardUrl);
        return NextResponse.redirect(new URL(dashboardUrl, request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|videos/.*|.*\\.png$|.*\\.jpg$|.*\\.svg$|.*\\.mp4$|.*\\.mov$|.*\\.webm$).*)', ],
};
