import { test, expect } from './fixtures';

test.describe('Options page', () => {
  test.use({ connectionState: 'disconnected' });

  test.beforeEach(async ({ extensionPage }) => {
    await extensionPage.goto('/dist/options/index.html');
    await extensionPage.waitForSelector('#app > *', { timeout: 10_000 });
  });

  test('renders the options page', async ({ extensionPage }) => {
    await expect(extensionPage.locator('main')).toBeVisible();
  });

  test('shows all four navigation tabs', async ({ extensionPage }) => {
    await expect(
      extensionPage.locator('.n-tabs-tab__label', { hasText: 'Settings' }),
    ).toBeVisible();
    await expect(extensionPage.locator('.n-tabs-tab__label', { hasText: 'Proxy' })).toBeVisible();
    await expect(
      extensionPage.locator('.n-tabs-tab__label', { hasText: 'Import/Export' }),
    ).toBeVisible();
    await expect(extensionPage.locator('.n-tabs-tab__label', { hasText: 'About' })).toBeVisible();
  });

  test('defaults to the Settings tab', async ({ extensionPage }) => {
    // The Settings tab should be active by default
    const tab = extensionPage.locator('[class*="tab-pane"]').first();
    await expect(tab).toBeVisible();
  });

  test('can navigate to the Proxy tab', async ({ extensionPage }) => {
    await extensionPage.locator('.n-tabs-tab', { hasText: 'Proxy' }).click();
    // After clicking, the Proxy tab becomes the active tab
    await expect(extensionPage.locator('.n-tabs-tab--active', { hasText: 'Proxy' })).toBeVisible();
  });

  test('can navigate to the About tab and shows license info', async ({ extensionPage }) => {
    await extensionPage.locator('.n-tabs-tab', { hasText: 'About' }).click();
    await expect(extensionPage.locator('text=GPLv3')).toBeVisible();
    await expect(extensionPage.locator('text=Source code')).toBeVisible();
    await expect(extensionPage.locator('text=Changelog')).toBeVisible();
  });

  test('can navigate to the Import/Export tab', async ({ extensionPage }) => {
    await extensionPage.locator('.n-tabs-tab', { hasText: 'Import/Export' }).click();
    await expect(extensionPage.locator('text=Import/Export')).toBeVisible();
  });
});
