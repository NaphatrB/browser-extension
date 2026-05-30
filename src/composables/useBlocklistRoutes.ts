import useStore from '@/composables/useStore';
import { parseBlocklist } from '@/helpers/blocklist/parseBlocklist';
import type { BlocklistRoute } from '@/helpers/blocklist/blocklist.types';
import type { ProxyOperationArgs } from '@/helpers/socksProxy/socksProxy.types';
import { ProxyInfoType } from '@/helpers/socksProxy/socksProxy.types';
import { baseConfig } from '@/helpers/socksProxy/constants';

const { blocklistRoutes } = useStore();

const addRoute = async (url: string): Promise<void> => {
  const id = crypto.randomUUID();
  const route: BlocklistRoute = {
    id,
    url,
    enabled: true,
    proxyInfo: null,
    proxyDetails: null,
    domains: [],
    lastFetched: null,
  };
  blocklistRoutes.value = [...blocklistRoutes.value, route];
  await refreshRoute(id);
};

const removeRoute = (id: string): void => {
  blocklistRoutes.value = blocklistRoutes.value.filter((r) => r.id !== id);
};

const toggleRoute = (id: string): void => {
  blocklistRoutes.value = blocklistRoutes.value.map((r) =>
    r.id === id ? { ...r, enabled: !r.enabled } : r,
  );
};

const refreshRoute = async (id: string): Promise<void> => {
  const route = blocklistRoutes.value.find((r) => r.id === id);
  if (!route) return;

  try {
    const response = await fetch(route.url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    const domains = parseBlocklist(text);
    blocklistRoutes.value = blocklistRoutes.value.map((r) =>
      r.id === id ? { ...r, domains, lastFetched: Date.now(), error: undefined } : r,
    );
  } catch (e) {
    blocklistRoutes.value = blocklistRoutes.value.map((r) =>
      r.id === id ? { ...r, error: String(e), lastFetched: Date.now() } : r,
    );
  }
};

const setBlocklistProxy = (
  { country, countryCode, city, hostname, ipv4_address, port }: Partial<ProxyOperationArgs>,
  id: string,
): void => {
  const proxyInfo = {
    type: ProxyInfoType.socks,
    host: ipv4_address!,
    port: port || (baseConfig.port as number),
    proxyDNS: baseConfig.proxyDNS,
  };
  const proxyDetails = {
    socksEnabled: true,
    country,
    countryCode,
    city,
    server: hostname!.replace('socks5-', '').replace('.relays.mullvad.net', ''),
    proxyDNS: baseConfig.proxyDNS,
  };
  blocklistRoutes.value = blocklistRoutes.value.map((r) =>
    r.id === id ? { ...r, proxyInfo, proxyDetails } : r,
  );
};

const useBlocklistRoutes = () => ({
  addRoute,
  blocklistRoutes,
  removeRoute,
  refreshRoute,
  setBlocklistProxy,
  toggleRoute,
});

export default useBlocklistRoutes;
