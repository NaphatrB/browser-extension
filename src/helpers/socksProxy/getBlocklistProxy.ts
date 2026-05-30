import type { BlocklistRoute } from '@/helpers/blocklist/blocklist.types';
import type { ProxyInfo } from './socksProxy.types';

// In-memory cache rebuilt from storage — avoids repeated JSON parse on every proxy request
let blocklistMap: Map<string, ProxyInfo> | null = null;

const buildMap = (routes: BlocklistRoute[]): Map<string, ProxyInfo> => {
  const map = new Map<string, ProxyInfo>();
  for (const route of routes) {
    if (route.enabled && route.proxyInfo) {
      for (const domain of route.domains) {
        map.set(domain, route.proxyInfo);
      }
    }
  }
  return map;
};

const ensureMap = async (): Promise<Map<string, ProxyInfo>> => {
  if (blocklistMap !== null) return blocklistMap;
  const data = await browser.storage.local.get('blocklistRoutes');
  const routes: BlocklistRoute[] = data.blocklistRoutes ? JSON.parse(data.blocklistRoutes) : [];
  blocklistMap = buildMap(routes);
  return blocklistMap;
};

if (typeof browser !== 'undefined' && browser.storage?.onChanged) {
  browser.storage.onChanged.addListener((changes) => {
    if (changes.blocklistRoutes) {
      const raw = changes.blocklistRoutes.newValue;
      const routes: BlocklistRoute[] = raw ? JSON.parse(raw) : [];
      blocklistMap = buildMap(routes);
    }
  });
}

/**
 * Returns a ProxyInfo for the given domain (or its parent domain) if it matches any
 * enabled blocklist route, or null if there is no match.
 */
export const getBlocklistProxy = async (
  currentDomain: string,
  parentDomain?: string,
): Promise<ProxyInfo | null> => {
  const map = await ensureMap();
  return map.get(currentDomain) ?? (parentDomain ? (map.get(parentDomain) ?? null) : null);
};
