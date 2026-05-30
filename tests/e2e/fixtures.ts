import { test as base, Page } from '@playwright/test';
import {
  installBrowserMock,
  NOT_CONNECTED_RESPONSE,
  CONNECTED_RESPONSE,
  DNS_MULLVAD_RESPONSE,
} from './browser-mock';

export type ConnectionState = 'connected' | 'disconnected';

export type ExtensionFixtures = {
  /** A page pre-loaded with the browser API mock and all Mullvad network routes mocked. */
  extensionPage: Page;
  /** Override connection state before navigating. Default: 'disconnected'. */
  connectionState: ConnectionState;
};

export const test = base.extend<ExtensionFixtures>({
  connectionState: ['disconnected', { option: true }],

  extensionPage: async ({ page, connectionState }, use) => {
    // 1. Inject the browser API mock before any page scripts run
    await page.addInitScript(installBrowserMock);

    // 2. Mock IPv4 connection check
    const ipv4Body = connectionState === 'connected' ? CONNECTED_RESPONSE : NOT_CONNECTED_RESPONSE;
    await page.route('https://ipv4.am.i.mullvad.net/json', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(ipv4Body),
      });
    });

    // 3. Mock IPv6 connection check (always fails – IPv6 is optional)
    await page.route('https://ipv6.am.i.mullvad.net/json', async (route) => {
      await route.abort('failed');
    });

    // 4. Mock DNS leak check (wildcard UUID sub-domain)
    const dnsBody = connectionState === 'connected' ? DNS_MULLVAD_RESPONSE : [];
    await page.route(/https:\/\/[a-f0-9-]+\.dnsleak\.am\.i\.mullvad\.net/, async (route) => {
      if (connectionState === 'connected') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(dnsBody),
        });
      } else {
        // Simulate network failure so the DNS check enters error state
        await route.abort('failed');
      }
    });

    await use(page);
  },
});

export { expect } from '@playwright/test';
