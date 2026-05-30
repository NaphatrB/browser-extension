import { test, expect } from './fixtures';

// ── Custom DNS Settings ───────────────────────────────────────────────────────

test.describe('Settings – Custom DNS card', () => {
  test.use({ connectionState: 'disconnected' });

  test.beforeEach(async ({ extensionPage }) => {
    await extensionPage.goto('/dist/options/index.html');
    await extensionPage.waitForSelector('#app > *', { timeout: 10_000 });
  });

  test('Custom DNS card is visible in the Settings tab', async ({ extensionPage }) => {
    await expect(extensionPage.locator('text=Custom DNS')).toBeVisible({ timeout: 5_000 });
  });

  test('DoH / DoT mode radio buttons are visible', async ({ extensionPage }) => {
    await expect(
      extensionPage.locator('#custom-dns .n-radio__label', { hasText: 'DoH' }),
    ).toBeVisible({ timeout: 5_000 });
    await expect(
      extensionPage.locator('#custom-dns .n-radio__label', { hasText: 'DoT' }),
    ).toBeVisible();
  });

  test('URL input field is rendered', async ({ extensionPage }) => {
    // The NInput component renders its text field with class n-input__input-el
    const input = extensionPage.locator('#custom-dns .n-input__input-el');
    await expect(input).toBeVisible({ timeout: 5_000 });
  });

  test('"Configure DNS in Firefox" button is rendered', async ({ extensionPage }) => {
    await expect(extensionPage.locator('text=Configure DNS in Firefox')).toBeVisible({
      timeout: 5_000,
    });
  });

  test('toggle updates storage and persists', async ({ extensionPage }) => {
    // Wait for the Custom DNS card to appear
    await extensionPage.waitForSelector('#custom-dns', { timeout: 5_000 });

    // Click the toggle inside the card
    const toggle = extensionPage.locator('#custom-dns .n-switch');
    await toggle.click();

    // Read back storage to confirm persistence
    const stored = await extensionPage.evaluate(async () => {
      const data = await window.browser.storage.local.get('customDns');
      return data.customDns ? JSON.parse(data.customDns as string) : null;
    });
    expect(stored?.enabled).toBe(true);
  });

  test('typing in URL input saves to storage', async ({ extensionPage }) => {
    await extensionPage.waitForSelector('#custom-dns input', { timeout: 5_000 });

    const input = extensionPage.locator('#custom-dns .n-input__input-el');
    await input.fill('https://dns.nextdns.io/dns-query');

    // Give storage a moment to update
    await extensionPage.waitForTimeout(300);

    const stored = await extensionPage.evaluate(async () => {
      const data = await window.browser.storage.local.get('customDns');
      return data.customDns ? JSON.parse(data.customDns as string) : null;
    });
    expect(stored?.url).toBe('https://dns.nextdns.io/dns-query');
  });
});

// ── Popup: TLD routing "in use" ───────────────────────────────────────────────

test.describe('Popup – TLD routing in use', () => {
  test.use({ connectionState: 'disconnected' });

  test('shows TLD routing row when current domain TLD matches a proxy country', async ({
    extensionPage,
  }) => {
    // Seed before navigation: permissions granted, Thai tab, TLD routing on, Thai proxy
    await extensionPage.addInitScript(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const w = window as any;
      w.browser.permissions.contains = () => Promise.resolve(true);
      w.browser.tabs.query = () =>
        Promise.resolve([
          { url: 'https://apidoc.eppo.go.th', id: 1, active: true, currentWindow: true },
        ]);
      w.browser.storage.local.set({
        tldRoutingEnabled: 'true',
        flatProxiesList: JSON.stringify([
          {
            online: true,
            hostname: 'th-bkk-001.mullvad.net',
            ipv4_address: '45.83.220.1',
            ipv6_address: '',
            port: 1080,
            location: {
              city: 'Bangkok',
              code: 'th-bkk',
              country: 'Thailand',
              countryCode: 'th',
              longitude: 100.5,
              latitude: 13.75,
            },
          },
        ]),
      });
    });

    await extensionPage.goto('/dist/popup/index.html');
    await extensionPage.waitForSelector('#app > *', { timeout: 10_000 });

    await expect(extensionPage.locator('text=TLD routing')).toBeVisible({ timeout: 8_000 });
    await expect(extensionPage.locator('text=Thailand')).toBeVisible();
    // "in use" tag should appear (may be duplicate if current domain also shows it)
    await expect(extensionPage.locator('text=in use').first()).toBeVisible();
  });

  test('does NOT show TLD routing row when TLD routing is disabled', async ({ extensionPage }) => {
    await extensionPage.addInitScript(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const w = window as any;
      w.browser.permissions.contains = () => Promise.resolve(true);
      w.browser.tabs.query = () =>
        Promise.resolve([{ url: 'https://example.th', id: 1, active: true, currentWindow: true }]);
      w.browser.storage.local.set({
        tldRoutingEnabled: 'false',
        flatProxiesList: JSON.stringify([
          {
            online: true,
            hostname: 'th-bkk-001.mullvad.net',
            ipv4_address: '45.83.220.1',
            ipv6_address: '',
            port: 1080,
            location: {
              city: 'Bangkok',
              code: 'th-bkk',
              country: 'Thailand',
              countryCode: 'th',
              longitude: 100.5,
              latitude: 13.75,
            },
          },
        ]),
      });
    });

    await extensionPage.goto('/dist/popup/index.html');
    await extensionPage.waitForSelector('#app > *', { timeout: 10_000 });
    // Allow time for the proxy panel to fully render
    await extensionPage.waitForTimeout(1_000);

    await expect(extensionPage.locator('text=TLD routing')).not.toBeVisible();
  });
});

// ── Popup: Blocklist routing "in use" ────────────────────────────────────────

test.describe('Popup – Blocklist routing in use', () => {
  test.use({ connectionState: 'disconnected' });

  test('shows blocklist routing row when current domain is in a blocklist', async ({
    extensionPage,
  }) => {
    // Default active tab is example.com; seed a blocklist route for it
    await extensionPage.addInitScript(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const w = window as any;
      w.browser.permissions.contains = () => Promise.resolve(true);
      w.browser.storage.local.set({
        blocklistRoutes: JSON.stringify([
          {
            id: 'bl-1',
            url: 'https://nsfw-small.oisd.nl/',
            enabled: true,
            proxyInfo: { type: 'socks', host: '185.213.154.68', port: 1080, proxyDNS: true },
            proxyDetails: {
              server: 'se-sto-001.mullvad.net',
              city: 'Stockholm',
              country: 'Sweden',
              socksEnabled: true,
            },
            domains: ['example.com'],
            lastFetched: Date.now(),
          },
        ]),
      });
    });

    await extensionPage.goto('/dist/popup/index.html');
    await extensionPage.waitForSelector('#app > *', { timeout: 10_000 });

    await expect(extensionPage.locator('text=Blocklist routing')).toBeVisible({ timeout: 8_000 });
    await expect(extensionPage.locator('text=nsfw-small.oisd.nl')).toBeVisible();
    await expect(extensionPage.locator('text=through Sweden')).toBeVisible();
    await expect(extensionPage.locator('text=in use').first()).toBeVisible();
  });

  test('does NOT show blocklist routing row when domain is not matched', async ({
    extensionPage,
  }) => {
    await extensionPage.addInitScript(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const w = window as any;
      w.browser.permissions.contains = () => Promise.resolve(true);
      w.browser.storage.local.set({
        blocklistRoutes: JSON.stringify([
          {
            id: 'bl-1',
            url: 'https://nsfw-small.oisd.nl/',
            enabled: true,
            proxyInfo: null,
            proxyDetails: {
              server: 'se-sto-001.mullvad.net',
              city: 'Stockholm',
              country: 'Sweden',
              socksEnabled: true,
            },
            domains: ['blocked-site.com'],
            lastFetched: Date.now(),
          },
        ]),
      });
    });

    await extensionPage.goto('/dist/popup/index.html');
    await extensionPage.waitForSelector('#app > *', { timeout: 10_000 });
    await extensionPage.waitForTimeout(1_000);

    await expect(extensionPage.locator('text=Blocklist routing')).not.toBeVisible();
  });
});
