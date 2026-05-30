/**
 * Injected into every test page via page.addInitScript().
 * Provides a complete in-memory mock of the webextension-polyfill browser API
 * so the extension's Vue app initialises without a real extension context.
 */
export function installBrowserMock() {
  // In-memory storage that mirrors browser.storage.local
  const storageData: Record<string, unknown> = {};
  const storageListeners: Array<
    (changes: Record<string, { newValue?: unknown; oldValue?: unknown }>, area: string) => void
  > = [];

  const noop = () => {};
  const resolvedVoid = () => Promise.resolve();
  const noopListener = { addListener: noop, removeListener: noop, hasListener: () => false };

  const storage = {
    local: {
      get(keys?: string | string[] | null): Promise<Record<string, unknown>> {
        if (!keys) return Promise.resolve({ ...storageData });
        const ks = typeof keys === 'string' ? [keys] : keys;
        return Promise.resolve(
          Object.fromEntries(ks.map((k) => [k, storageData[k]])),
        );
      },
      set(items: Record<string, unknown>): Promise<void> {
        const changes: Record<string, { newValue?: unknown; oldValue?: unknown }> = {};
        for (const [k, v] of Object.entries(items)) {
          changes[k] = { oldValue: storageData[k], newValue: v };
          storageData[k] = v;
        }
        storageListeners.forEach((fn) => fn(changes, 'local'));
        return Promise.resolve();
      },
      remove(keys: string | string[]): Promise<void> {
        const ks = typeof keys === 'string' ? [keys] : keys;
        const changes: Record<string, { oldValue?: unknown }> = {};
        ks.forEach((k) => {
          changes[k] = { oldValue: storageData[k] };
          delete storageData[k];
        });
        storageListeners.forEach((fn) => fn(changes, 'local'));
        return Promise.resolve();
      },
    },
    onChanged: {
      addListener: (fn: (typeof storageListeners)[number]) => storageListeners.push(fn),
      removeListener: (fn: (typeof storageListeners)[number]) => {
        const i = storageListeners.indexOf(fn);
        if (i !== -1) storageListeners.splice(i, 1);
      },
      hasListener: () => false,
    },
  };

  // webextension-polyfill checks `globalThis.chrome.runtime.id` first; it throws if missing.
  // We must also provide a chrome stub so the polyfill's guard passes, then it will use
  // window.browser (since browser.runtime.id is set) instead of wrapping chrome.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).chrome = {
    runtime: { id: 'test-mullvad-extension' },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).browser = {
    runtime: {
      getManifest: () => ({
        name: 'Mullvad Browser Extension',
        version: '0.9.10',
        manifest_version: 2,
      }),
      getURL: (p: string) => `http://localhost:7777/${p}`,
      openOptionsPage: resolvedVoid,
      id: 'test-mullvad-extension',
      lastError: undefined,
      onMessage: noopListener,
      onInstalled: noopListener,
      onStartup: noopListener,
      sendMessage: resolvedVoid,
    },
    storage,
    tabs: {
      query: () =>
        Promise.resolve([{ url: 'https://example.com', id: 1, active: true, currentWindow: true }]),
      reload: resolvedVoid,
      onActivated: noopListener,
      onUpdated: noopListener,
      onRemoved: noopListener,
      onCreated: noopListener,
    },
    proxy: {
      settings: {
        get: () =>
          Promise.resolve({
            value: { proxyType: 'none' },
            levelOfControl: 'controllable_by_this_extension',
          }),
        set: resolvedVoid,
        clear: resolvedVoid,
      },
      onRequest: noopListener,
      onError: noopListener,
    },
    management: {
      getAll: () => Promise.resolve([]),
      onInstalled: noopListener,
      onUninstalled: noopListener,
      onEnabled: noopListener,
      onDisabled: noopListener,
    },
    permissions: {
      contains: () => Promise.resolve(false),
      request: () => Promise.resolve(false),
      remove: () => Promise.resolve(false),
      onAdded: noopListener,
      onRemoved: noopListener,
    },
    privacy: {
      network: {
        webRTCIPHandlingPolicy: {
          get: () =>
            Promise.resolve({
              value: 'default',
              levelOfControl: 'controllable_by_this_extension',
            }),
          set: resolvedVoid,
        },
      },
    },
    browserAction: {
      openPopup: resolvedVoid,
      setIcon: resolvedVoid,
      setBadgeText: resolvedVoid,
      setBadgeBackgroundColor: resolvedVoid,
    },
    extension: {
      getViews: () => [],
      getURL: (p: string) => `http://localhost:7777/${p}`,
    },
    windows: {
      getCurrent: () => Promise.resolve({ id: 1 }),
      onFocusChanged: noopListener,
    },
  };
}

// Mock responses for the Mullvad connection-check and DNS-leak APIs

export const NOT_CONNECTED_RESPONSE = {
  ip: '203.0.113.1',
  country: 'Sweden',
  city: 'Stockholm',
  mullvad_exit_ip: false,
  organization: 'Test ISP AB',
};

export const CONNECTED_RESPONSE = {
  ip: '185.213.154.68',
  country: 'Sweden',
  city: 'Stockholm',
  mullvad_exit_ip: true,
  mullvad_exit_ip_hostname: 'se-sto-wg-101.relays.mullvad.net',
  mullvad_server_type: 'wireguard',
  organization: 'Mullvad VPN AB',
};

export const DNS_MULLVAD_RESPONSE = [
  {
    hostname: 'dns-01.mullvad.net',
    ip: '194.242.2.2',
    mullvad_dns: true,
    mullvad_dns_hostname: 'dns-01.mullvad.net',
    country: 'Sweden',
    organization: 'Mullvad VPN AB',
  },
];
