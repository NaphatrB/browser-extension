import { computed } from 'vue';

import useActiveTab from '@/composables/useActiveTab';
import useStore from '@/composables/useStore';
import { checkDomain } from '@/helpers/domain';
import { getTLD, TLD_TO_COUNTRY_CODE } from '@/helpers/socksProxy/getTLDCountryProxy';
import type { BlocklistRoute } from '@/helpers/blocklist/blocklist.types';

const { tldRoutingEnabled, flatProxiesList, blocklistRoutes } = useStore();
const { activeTabHost } = useActiveTab();

const tldRouteInfo = computed(() => {
  if (!tldRoutingEnabled.value || !activeTabHost.value) return null;
  const tld = getTLD(activeTabHost.value);
  if (tld.length !== 2) return null;
  const countryCode = TLD_TO_COUNTRY_CODE[tld] ?? tld;
  const match = flatProxiesList.value.find(
    (p) => p.location.countryCode?.toLowerCase() === countryCode,
  );
  if (!match) return null;
  return { tld, country: match.location.country, countryCode };
});

const blocklistRouteInfo = computed((): BlocklistRoute | null => {
  if (!activeTabHost.value) return null;
  const { domain } = checkDomain(activeTabHost.value);
  return (
    blocklistRoutes.value.find(
      (r) =>
        r.enabled &&
        r.proxyDetails &&
        (r.domains.includes(activeTabHost.value) || r.domains.includes(domain)),
    ) ?? null
  );
});

const useRoutingStatus = () => ({
  tldRouteInfo,
  blocklistRouteInfo,
});

export default useRoutingStatus;
