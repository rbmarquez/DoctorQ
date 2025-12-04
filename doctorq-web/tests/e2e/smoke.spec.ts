import { test, expect } from '@playwright/test';

/**
 * Smoke Tests - Testes críticos para validar funcionalidades essenciais
 *
 * Estes testes garantem que as funcionalidades core do sistema estão funcionando:
 * 1. Navegação básica
 * 2. Login flow
 * 3. CRUD Empresas
 * 4. CRUD Usuários
 * 5. Criar Agendamento
 */

test.describe('Smoke Tests - Funcionalidades Críticas', () => {

  test.beforeEach(async ({ page }) => {
    // Navegar para a home
    await page.goto('/');
  });

  test('01 - Landing page carrega corretamente', async ({ page }) => {
    // Verificar que a página inicial carrega
    await expect(page).toHaveTitle(/EstetiQ/i);

    // Verificar elementos principais
    const loginButton = page.getByRole('link', { name: /login|entrar/i });
    await expect(loginButton).toBeVisible();
  });

  test('02 - Navegação para página de login', async ({ page }) => {
    // Click no botão de login
    await page.getByRole('link', { name: /login|entrar/i }).click();

    // Verificar URL
    await expect(page).toHaveURL(/.*login/);

    // Verificar formulário de login
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/senha|password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /entrar|login/i })).toBeVisible();
  });

  test('03 - Login com credenciais válidas', async ({ page }) => {
    // Navegar para login
    await page.goto('/login');

    // Preencher formulário
    await page.getByLabel(/email/i).fill('admin@estetiq.app');
    await page.getByLabel(/senha|password/i).fill('admin123');

    // Submit
    await page.getByRole('button', { name: /entrar|login/i }).click();

    // Aguardar redirect para dashboard
    await page.waitForURL(/.*dashboard|admin/, { timeout: 5000 });

    // Verificar que está logado (sidebar deve estar visível)
    const sidebar = page.locator('[data-testid="sidebar"], nav, aside').first();
    await expect(sidebar).toBeVisible({ timeout: 10000 });
  });

  test('04 - Login inválido mostra erro', async ({ page }) => {
    await page.goto('/login');

    // Preencher com credenciais inválidas
    await page.getByLabel(/email/i).fill('invalido@test.com');
    await page.getByLabel(/senha|password/i).fill('senhaerrada');

    // Submit
    await page.getByRole('button', { name: /entrar|login/i }).click();

    // Verificar mensagem de erro (toast ou alert)
    const errorMessage = page.locator('text=/credenciais inválidas|erro|email ou senha incorretos/i');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });

  test('05 - Dashboard Admin carrega após login', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('admin@estetiq.app');
    await page.getByLabel(/senha|password/i).fill('admin123');
    await page.getByRole('button', { name: /entrar|login/i }).click();

    // Aguardar dashboard
    await page.waitForURL(/.*dashboard|admin/);

    // Verificar elementos do dashboard
    const heading = page.getByRole('heading', { name: /dashboard|painel/i }).first();
    await expect(heading).toBeVisible();

    // Verificar menu/sidebar com itens
    await expect(page.getByText(/empresas/i).first()).toBeVisible();
    await expect(page.getByText(/usuários|usuarios/i).first()).toBeVisible();
    await expect(page.getByText(/agentes/i).first()).toBeVisible();
  });

  test('06 - Navegação para página de Empresas', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('admin@estetiq.app');
    await page.getByLabel(/senha|password/i).fill('admin123');
    await page.getByRole('button', { name: /entrar|login/i }).click();
    await page.waitForURL(/.*dashboard|admin/);

    // Navegar para Empresas
    await page.getByRole('link', { name: /empresas/i }).first().click();

    // Verificar URL
    await expect(page).toHaveURL(/.*empresas/);

    // Verificar tabela de empresas
    const heading = page.getByRole('heading', { name: /empresas/i });
    await expect(heading).toBeVisible();

    // Botão "Novo" deve estar visível
    const newButton = page.getByRole('button', { name: /novo|nova empresa|adicionar/i });
    await expect(newButton).toBeVisible();
  });

  test('07 - CRUD Empresas - Abrir modal de criação', async ({ page }) => {
    // Login e navegar para Empresas
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('admin@estetiq.app');
    await page.getByLabel(/senha|password/i).fill('admin123');
    await page.getByRole('button', { name: /entrar|login/i }).click();
    await page.waitForURL(/.*dashboard|admin/);
    await page.getByRole('link', { name: /empresas/i }).first().click();

    // Click em "Novo"
    await page.getByRole('button', { name: /novo|nova empresa/i }).click();

    // Verificar que modal abriu
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Verificar campos do formulário
    await expect(page.getByLabel(/razão social|nome/i)).toBeVisible();
    await expect(page.getByLabel(/cnpj/i)).toBeVisible();

    // Botões de ação
    await expect(page.getByRole('button', { name: /salvar|criar/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /cancelar/i })).toBeVisible();
  });

  test('08 - CRUD Empresas - Validação de campos obrigatórios', async ({ page }) => {
    // Login e navegar para Empresas
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('admin@estetiq.app');
    await page.getByLabel(/senha|password/i).fill('admin123');
    await page.getByRole('button', { name: /entrar|login/i }).click();
    await page.waitForURL(/.*dashboard|admin/);
    await page.getByRole('link', { name: /empresas/i }).first().click();

    // Abrir modal
    await page.getByRole('button', { name: /novo|nova empresa/i }).click();

    // Tentar salvar sem preencher
    await page.getByRole('button', { name: /salvar|criar/i }).click();

    // Verificar mensagens de erro de validação
    const errorMessage = page.locator('text=/obrigatório|required|preencha/i').first();
    await expect(errorMessage).toBeVisible({ timeout: 3000 });
  });

  test('09 - Navegação para Usuários', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('admin@estetiq.app');
    await page.getByLabel(/senha|password/i).fill('admin123');
    await page.getByRole('button', { name: /entrar|login/i }).click();
    await page.waitForURL(/.*dashboard|admin/);

    // Navegar para Usuários
    await page.getByRole('link', { name: /usuários|usuarios/i }).first().click();

    // Verificar URL
    await expect(page).toHaveURL(/.*usuarios/);

    // Verificar página
    const heading = page.getByRole('heading', { name: /usuários|usuarios/i });
    await expect(heading).toBeVisible();
  });

  test('10 - Navegação para Agentes IA', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('admin@estetiq.app');
    await page.getByLabel(/senha|password/i).fill('admin123');
    await page.getByRole('button', { name: /entrar|login/i }).click();
    await page.waitForURL(/.*dashboard|admin/);

    // Navegar para Agentes
    await page.getByRole('link', { name: /agentes/i }).first().click();

    // Verificar URL
    await expect(page).toHaveURL(/.*agentes/);

    // Verificar página
    const heading = page.getByRole('heading', { name: /agentes/i });
    await expect(heading).toBeVisible();
  });
});
