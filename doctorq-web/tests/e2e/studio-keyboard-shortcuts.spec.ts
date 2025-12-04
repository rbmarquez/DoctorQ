import { test, expect } from '@playwright/test';

test.describe('InovaIA Studio - Keyboard Shortcuts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/new');
    await page.waitForLoadState('networkidle');
  });

  test('Ctrl+B should toggle sidebar', async ({ page }) => {
    // Get toggle button to check initial state
    const toggleButton = page.getByRole('button', { name: /abrir painel|fechar painel/i });
    const initialTitle = await toggleButton.getAttribute('title');

    // Press Ctrl+B
    await page.keyboard.press('Control+b');
    await page.waitForTimeout(500);

    // Check that state changed
    const newTitle = await toggleButton.getAttribute('title');
    expect(initialTitle).not.toBe(newTitle);
  });

  test('Ctrl+/ should show shortcuts help modal', async ({ page }) => {
    // Press Ctrl+/
    await page.keyboard.press('Control+/');
    await page.waitForTimeout(500);

    // Should show help modal with keyboard shortcuts
    const modal = page.getByText(/atalhos de teclado/i);
    await expect(modal).toBeVisible();

    // Should show some shortcut descriptions
    const ctrlB = page.getByText(/Ctrl.*B/i);
    expect(await ctrlB.count()).toBeGreaterThan(0);
  });

  test('Ctrl+1 should open agent tab', async ({ page }) => {
    // Make sure sidebar is open first
    const toggleButton = page.getByRole('button', { name: /fechar painel/i });
    if (!(await toggleButton.isVisible())) {
      await page.keyboard.press('Control+b');
      await page.waitForTimeout(500);
    }

    // Press Ctrl+1
    await page.keyboard.press('Control+1');
    await page.waitForTimeout(300);

    // Agent tab should be active
    const agentTab = page.locator('[data-tour="tab-agent"]').first();
    const isActive = await agentTab.evaluate((el) => {
      return el.classList.contains('border-primary') ||
             el.classList.contains('text-primary');
    });

    expect(isActive).toBeTruthy();
  });

  test('Escape should close shortcuts modal', async ({ page }) => {
    // Open shortcuts modal
    await page.keyboard.press('Control+/');
    await page.waitForTimeout(500);

    // Press Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Modal should be closed
    const modal = page.getByText(/atalhos de teclado/i);
    await expect(modal).not.toBeVisible();
  });
});
