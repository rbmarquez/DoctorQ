import { test, expect } from '@playwright/test';

test.describe('InovaIA Studio - Basic Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the Studio
    await page.goto('/new');
  });

  test('should load Studio page successfully', async ({ page }) => {
    // Check if the page title is correct
    await expect(page).toHaveTitle(/InovaIA/i);

    // Check if main heading exists
    await expect(page.getByRole('heading', { name: /InovaIA Studio/i })).toBeVisible();
  });

  test('should display welcome message', async ({ page }) => {
    // Check for welcome/greeting message
    await expect(page.getByText(/Como posso ajudá-lo/i)).toBeVisible();
  });

  test('should have chat input field', async ({ page }) => {
    // Check if chat input is visible
    const chatInput = page.getByPlaceholder(/Digite sua dúvida/i);
    await expect(chatInput).toBeVisible();
  });

  test('should show sidebar toggle button', async ({ page }) => {
    // Check if sidebar toggle button exists
    const toggleButton = page.getByRole('button', { name: /abrir painel|fechar painel/i });
    await expect(toggleButton).toBeVisible();
  });

  test('should toggle sidebar when button is clicked', async ({ page }) => {
    // Find toggle button
    const toggleButton = page.getByRole('button', { name: /abrir painel|fechar painel/i });

    // Get initial state (sidebar might be open or closed)
    const initialState = await toggleButton.getAttribute('title');

    // Click toggle
    await toggleButton.click();

    // Wait for animation
    await page.waitForTimeout(500);

    // Check that state changed
    const newState = await toggleButton.getAttribute('title');
    expect(initialState).not.toBe(newState);
  });
});
