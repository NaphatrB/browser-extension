import type { ProxyDetails, ProxyInfo } from '@/helpers/socksProxy/socksProxy.types';

export type BlocklistRoute = {
  id: string;
  url: string;
  enabled: boolean;
  proxyInfo: ProxyInfo | null;
  proxyDetails: ProxyDetails | null;
  domains: string[];
  lastFetched: number | null;
  error?: string;
};
