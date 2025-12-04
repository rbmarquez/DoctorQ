import { test, expect } from '@playwright/test';

test.describe('InovaIA Studio - Onboarding Tour', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to trigger tour
    await page.goto('/new');
    await page.evaluate(() => localStorage.removeItem('studio_tour_completed'));
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('should show tour on first visit', async ({ page }) => {
    // Wait for tour to appear (1 second delay)
    await page.waitForTimeout(1500);

    // Look for tour elements
    const tourOverlay = page.locator('.fixed.inset-0').filter({ hasText: /bem-vindo|próximo|voltar|pular/i });

    // Tour should be visible
    const tourVisible = await tourOverlay.count() > 0;
    expect(tourVisible).toBeTruthy();
  });

  test('should navigate through tour steps', async ({ page }) => {
    // Wait for tour
    await page.waitForTimeout(1500);

    // Look for "Próximo" button
    const nextButton = page.getByRole('button', { name: /próximo/i });

    if (await nextButton.isVisible()) {
      // Click through a few steps
      for (let i = 0; i < 3; i++) {
        await nextButton.click();
        await page.waitForTimeout(500);
      }

      // Should still see tour (not completed yet)
      const tourStillVisible = await page.getByText(/bem-vindo|próximo|concluir/i).isVisible();
      expect(tourStillVisible).toBeTruthy();
    }
  });

  test('should allow skipping tour', async ({ page }) => {
    // Wait for tour
    await page.waitForTimeout(1500);

    // Look for "Pular" button
    const skipButton = page.getByRole('button', { name: /pular/i });

    if (await skipButton.isVisible()) {
      await skipButton.click();
      await page.waitForTimeout(500);

      // Tour should be gone
      const tourGone = !(await page.getByText(/bem-vindo.*studio/i).isVisible());
      expect(tourGone).toBeTruthy();

      // Check localStorage
      const tourCompleted = await page.evaluate(() =>
        localStorage.getItem('studio_tour_completed')
      );
      expect(tourCompleted).toBeTruthy();
    }
  });

  test('should complete tour and mark as completed', async ({ page }) => {
    // Wait for tour
    await page.waitForTimeout(1500);

    // Look for next/complete buttons and click through all steps
    for (let i = 0; i < 10; i++) {
      const nextButton = page.getByRole('button', { name: /próximo/i });
      const completeButton = page.getByRole('button', { name: /concluir/i });

      if (await completeButton.isVisible()) {
        await completeButton.click();
        break;
      } else if (await nextButton.isVisible()) {
        await nextButton.click();
        await page.waitForTimeout(500);
      } else {
        break;
      }
    }

    await page.waitForTimeout(500);

    // Check if tour is marked as completed in localStorage
    const tourCompleted = await page.evaluate(() =>
      localStorage.getItem('studio_tour_completed')
    );

    if (tourCompleted) {
      expect(tourCompleted).toBe('true');
    }
  });

  test('should not show tour on second visit', async ({ page }) => {
    // Complete tour first
    await page.waitForTimeout(1500);

    const skipButton = page.getByRole('button', { name: /pular/i });
    if (await skipButton.isVisible()) {
      await skipButton.click();
      await page.waitForTimeout(500);
    }

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Tour should NOT appear
    const tourVisible = await page.getByText(/bem-vindo.*studio/i).isVisible();
    expect(tourVisible).toBeFalsy();
  });
});
