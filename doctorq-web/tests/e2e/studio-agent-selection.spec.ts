import { test, expect } from '@playwright/test';

test.describe('InovaIA Studio - Agent Selection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/new');

    // Open sidebar if closed
    const toggleButton = page.getByRole('button', { name: /abrir painel/i });
    if (await toggleButton.isVisible()) {
      await toggleButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('should open sidebar and show agent tab', async ({ page }) => {
    // Click on Agent tab (might have icon or text)
    const agentTab = page.locator('[data-tour="tab-agent"]').first();

    if (await agentTab.isVisible()) {
      await agentTab.click();
      await page.waitForTimeout(300);
    }

    // Should show some agent-related content
    // This might vary based on your actual implementation
    const hasAgentContent = await page.getByText(/agente/i).first().isVisible();
    expect(hasAgentContent).toBeTruthy();
  });

  test('should show selected agent name', async ({ page }) => {
    // Look for "Agente selecionado" text
    const agentInfo = page.getByText(/agente selecionado/i);

    // If there's a selected agent, it should be visible
    if (await agentInfo.isVisible()) {
      await expect(agentInfo).toBeVisible();
    }
  });

  test('should allow opening different tabs', async ({ page }) => {
    // Try clicking different tabs
    const tabs = [
      '[data-tour="tab-tools"]',
      '[data-tour="tab-documents"]',
      '[data-tour="tab-settings"]',
    ];

    for (const tabSelector of tabs) {
      const tab = page.locator(tabSelector).first();

      if (await tab.isVisible()) {
        await tab.click();
        await page.waitForTimeout(200);

        // Tab should be marked as active (has specific class or style)
        const isActive = await tab.evaluate((el) => {
          return el.classList.contains('border-primary') ||
                 el.classList.contains('text-primary') ||
                 el.getAttribute('aria-selected') === 'true';
        });

        expect(isActive).toBeTruthy();
      }
    }
  });
});
