import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';

// ── helpers ──────────────────────────────────────────────────────────────────

const makeProxy = (countryCode: string, country: string, ipv4 = '1.2.3.4') => ({
  online: true,
  hostname: `${countryCode}-001.mullvad.net`,
  ipv4_address: ipv4,
  ipv6_address: '',
  port: 1080,
  location: {
    city: 'Test City',
    code: `${countryCode}-tst`,
    country,
    countryCode,
    longitude: 0,
    latitude: 0,
  },
});

const makeBlocklistRoute = (id: string, url: string, country: string, domains: string[]) => ({
  id,
  url,
  enabled: true,
  proxyInfo: { type: 'socks', host: '1.2.3.4', port: 1080, proxyDNS: true },
  proxyDetails: { server: 'se-sto-001', city: 'Stockholm', country, socksEnabled: true },
  domains,
  lastFetched: Date.now(),
});

// ── mocks ────────────────────────────────────────────────────────────────────

const tldRoutingEnabled = ref(false);
const flatProxiesList = ref<ReturnType<typeof makeProxy>[]>([]);
const blocklistRoutes = ref<ReturnType<typeof makeBlocklistRoute>[]>([]);
const activeTabHost = ref('');

vi.mock('@/composables/useStore', () => ({
  default: () => ({ tldRoutingEnabled, flatProxiesList, blocklistRoutes }),
}));

vi.mock('@/composables/useActiveTab', () => ({
  default: () => ({ activeTabHost }),
}));

// ── import after mocks ────────────────────────────────────────────────────────

const { default: useRoutingStatus } = await import('@/composables/useRoutingStatus');

// ── tests ─────────────────────────────────────────────────────────────────────

describe('useRoutingStatus – tldRouteInfo', () => {
  beforeEach(() => {
    tldRoutingEnabled.value = false;
    flatProxiesList.value = [];
    activeTabHost.value = '';
  });

  it('returns null when TLD routing is disabled', () => {
    tldRoutingEnabled.value = false;
    flatProxiesList.value = [makeProxy('th', 'Thailand')];
    activeTabHost.value = 'apidoc.eppo.go.th';
    const { tldRouteInfo } = useRoutingStatus();
    expect(tldRouteInfo.value).toBeNull();
  });

  it('returns null when no proxy exists for the TLD country', () => {
    tldRoutingEnabled.value = true;
    flatProxiesList.value = [makeProxy('de', 'Germany')];
    activeTabHost.value = 'example.th';
    const { tldRouteInfo } = useRoutingStatus();
    expect(tldRouteInfo.value).toBeNull();
  });

  it('returns null for generic TLDs (.com, .org, .net)', () => {
    tldRoutingEnabled.value = true;
    flatProxiesList.value = [makeProxy('th', 'Thailand')];
    activeTabHost.value = 'example.com';
    const { tldRouteInfo } = useRoutingStatus();
    expect(tldRouteInfo.value).toBeNull();
  });

  it('returns route info for a matching ccTLD', () => {
    tldRoutingEnabled.value = true;
    flatProxiesList.value = [makeProxy('th', 'Thailand')];
    activeTabHost.value = 'apidoc.eppo.go.th';
    const { tldRouteInfo } = useRoutingStatus();
    expect(tldRouteInfo.value).not.toBeNull();
    expect(tldRouteInfo.value?.tld).toBe('th');
    expect(tldRouteInfo.value?.country).toBe('Thailand');
    expect(tldRouteInfo.value?.countryCode).toBe('th');
  });

  it('maps .uk TLD to gb country code', () => {
    tldRoutingEnabled.value = true;
    flatProxiesList.value = [makeProxy('gb', 'United Kingdom')];
    activeTabHost.value = 'bbc.co.uk';
    const { tldRouteInfo } = useRoutingStatus();
    expect(tldRouteInfo.value).not.toBeNull();
    expect(tldRouteInfo.value?.tld).toBe('uk');
    expect(tldRouteInfo.value?.countryCode).toBe('gb');
    expect(tldRouteInfo.value?.country).toBe('United Kingdom');
  });

  it('returns null when activeTabHost is empty', () => {
    tldRoutingEnabled.value = true;
    flatProxiesList.value = [makeProxy('th', 'Thailand')];
    activeTabHost.value = '';
    const { tldRouteInfo } = useRoutingStatus();
    expect(tldRouteInfo.value).toBeNull();
  });

  it('is reactive to tldRoutingEnabled changes', async () => {
    tldRoutingEnabled.value = false;
    flatProxiesList.value = [makeProxy('th', 'Thailand')];
    activeTabHost.value = 'example.th';
    const { tldRouteInfo } = useRoutingStatus();
    expect(tldRouteInfo.value).toBeNull();
    tldRoutingEnabled.value = true;
    expect(tldRouteInfo.value).not.toBeNull();
    expect(tldRouteInfo.value?.country).toBe('Thailand');
  });
});

describe('useRoutingStatus – blocklistRouteInfo', () => {
  beforeEach(() => {
    blocklistRoutes.value = [];
    activeTabHost.value = 'example.com';
  });

  it('returns null when no blocklist routes exist', () => {
    const { blocklistRouteInfo } = useRoutingStatus();
    expect(blocklistRouteInfo.value).toBeNull();
  });

  it('returns null when no route matches current host', () => {
    blocklistRoutes.value = [
      makeBlocklistRoute('r1', 'https://list.example/list.txt', 'Sweden', ['other.com']),
    ];
    activeTabHost.value = 'example.com';
    const { blocklistRouteInfo } = useRoutingStatus();
    expect(blocklistRouteInfo.value).toBeNull();
  });

  it('returns the matching route when host is in domains list', () => {
    const route = makeBlocklistRoute('r1', 'https://list.example/list.txt', 'Sweden', [
      'example.com',
    ]);
    blocklistRoutes.value = [route];
    activeTabHost.value = 'example.com';
    const { blocklistRouteInfo } = useRoutingStatus();
    expect(blocklistRouteInfo.value).not.toBeNull();
    expect(blocklistRouteInfo.value?.id).toBe('r1');
  });

  it('returns the matching route for a subdomain via parent domain match', () => {
    const route = makeBlocklistRoute('r1', 'https://list.example/list.txt', 'Sweden', [
      'example.com',
    ]);
    blocklistRoutes.value = [route];
    activeTabHost.value = 'sub.example.com';
    const { blocklistRouteInfo } = useRoutingStatus();
    expect(blocklistRouteInfo.value).not.toBeNull();
    expect(blocklistRouteInfo.value?.id).toBe('r1');
  });

  it('returns null for a disabled route', () => {
    const route = {
      ...makeBlocklistRoute('r1', 'https://list.example/list.txt', 'Sweden', ['example.com']),
      enabled: false,
    };
    blocklistRoutes.value = [route];
    activeTabHost.value = 'example.com';
    const { blocklistRouteInfo } = useRoutingStatus();
    expect(blocklistRouteInfo.value).toBeNull();
  });

  it('returns null for a route with no proxyDetails', () => {
    const route = {
      ...makeBlocklistRoute('r1', 'https://list.example/list.txt', 'Sweden', ['example.com']),
      proxyDetails: null,
    };
    blocklistRoutes.value = [route];
    activeTabHost.value = 'example.com';
    const { blocklistRouteInfo } = useRoutingStatus();
    expect(blocklistRouteInfo.value).toBeNull();
  });

  it('is reactive to blocklistRoutes changes', () => {
    const { blocklistRouteInfo } = useRoutingStatus();
    expect(blocklistRouteInfo.value).toBeNull();
    blocklistRoutes.value = [
      makeBlocklistRoute('r1', 'https://list.example/list.txt', 'Sweden', ['example.com']),
    ];
    expect(blocklistRouteInfo.value).not.toBeNull();
  });
});
