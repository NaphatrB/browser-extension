import type {
  ProxyDetails,
  ProxyDetailsMap,
  ProxyInfo,
  ProxyInfoMap,
} from '@/helpers/socksProxy/socksProxy.types';
import { Tab } from '@/helpers/browserExtension';

import useBrowserStorageLocal from '@/composables/useBrowserStorageLocal';
import { SocksProxy } from '@/helpers/socksProxy/socksProxies.types';
import { HistoryEntriesMap } from '@/composables/useProxyHistory/HistoryEntries.types';
import type { BlocklistRoute } from '@/helpers/blocklist/blocklist.types';
import { defaultCustomDns, type CustomDnsConfig } from '@/helpers/dns/customDns.types';

const useStore = () => {
  const blocklistRoutes = useBrowserStorageLocal<BlocklistRoute[]>('blocklistRoutes', []);
  const excludedHosts = useBrowserStorageLocal<string[]>('excludedHosts', []);
  const flatProxiesList = useBrowserStorageLocal<SocksProxy[]>('flatProxiesList', []);
  const globalProxy = useBrowserStorageLocal<ProxyInfo>('globalProxy', {} as ProxyInfo);
  const globalProxyDetails = useBrowserStorageLocal<ProxyDetails>(
    'globalProxyDetails',
    {} as ProxyDetails,
  );
  const historyEntries = useBrowserStorageLocal<HistoryEntriesMap>('historyEntries', {});
  const hostProxies = useBrowserStorageLocal<ProxyInfoMap>('hostProxies', {});
  const hostProxiesDetails = useBrowserStorageLocal<ProxyDetailsMap>('hostProxiesDetails', {});
  const optionsActiveTab = useBrowserStorageLocal<Tab>('optionsActiveTab', Tab.SETTINGS);
  const proxyAutoReload = useBrowserStorageLocal('proxyAutoReload', false);
  const randomProxyMode = useBrowserStorageLocal('randomProxyMode', false);
  const tldRoutingEnabled = useBrowserStorageLocal('tldRoutingEnabled', false);
  const webRTCStatus = useBrowserStorageLocal('webRTCStatus', true);
  const customDns = useBrowserStorageLocal<CustomDnsConfig>('customDns', defaultCustomDns);

  return {
    blocklistRoutes,
    customDns,
    excludedHosts,
    flatProxiesList,
    globalProxy,
    globalProxyDetails,
    historyEntries,
    hostProxies,
    hostProxiesDetails,
    optionsActiveTab,
    proxyAutoReload,
    randomProxyMode,
    tldRoutingEnabled,
    webRTCStatus,
  };
};

export default useStore;
