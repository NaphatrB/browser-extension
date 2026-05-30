import ipaddr from 'ipaddr.js';

import {
  RequestDetails,
  ProxyDetails,
  ProxyInfoMap,
  ProxyInfo,
  ProxyInfoType,
} from '@/helpers/socksProxy/socksProxy.types';
import { SocksProxy } from '@/helpers/socksProxy/socksProxies.types';
import { checkDomain } from '@/helpers/domain';
import { getRandomSessionProxy } from '@/helpers/socksProxy/getRandomSessionProxy';
import { getActiveTabDetails } from '@/helpers/tabs';
import { getTLD, getTLDCountryProxy } from '@/helpers/socksProxy/getTLDCountryProxy';
import { getBlocklistProxy } from '@/helpers/socksProxy/getBlocklistProxy';
import type { CustomDnsConfig } from '@/helpers/dns/customDns.types';

// TODO decide what how to handle fallback proxy (if proxy is invalid, it will fallback to Firefox proxy if configured)
// https://bugzilla.mozilla.org/show_bug.cgi?id=1750561

export const handleProxyRequest = async (details: browser.proxy._OnRequestDetails) => {
  try {
    const {
      excludedHosts,
      flatProxiesList,
      globalProxy,
      globalProxyDetails,
      hostProxies,
      hostProxiesDetails,
      randomProxyMode,
      tldRoutingEnabled,
      customDns,
    } = await getLocalStorageItems();

    const withDns = (proxy: ProxyInfo): ProxyInfo =>
      customDns.enabled && proxy.type === ProxyInfoType.socks
        ? { ...proxy, proxyDNS: false }
        : proxy;

    const currentHost = getCurrentHost(details);
    const { hasSubdomain, domain, fullHost } = checkDomain(currentHost);
    const currentDomain = hasSubdomain ? fullHost : domain;

    const isDomainExcluded =
      excludedHosts.includes(currentDomain) || (hasSubdomain && excludedHosts.includes(domain));
    const isDomainProxied = Object.hasOwn(hostProxies, currentDomain);
    const isDomainProxydEnabled = Boolean(hostProxiesDetails[currentDomain]?.socksEnabled);
    const isParentDomainProxied = hasSubdomain && Object.hasOwn(hostProxies, domain);
    const isParentProxyEnabled = hasSubdomain && Boolean(hostProxiesDetails[domain]?.socksEnabled);
    const isGlobalProxyEnabled = globalProxyDetails.socksEnabled;

    // 1. Block speculative requests, since we can't identify their origins
    if (details.type === 'speculative') {
      return { cancel: true };
    }

    // 2. Skip proxy for local/reserved IPs
    if (isLocalOrReservedIP(currentHost)) {
      return { type: 'direct' };
    }

    // 3. When the request if a conncheck/DNS check originating from the extension,
    // we want to use the same proxy as the active tab, to get a consistent conncheck result
    if (isExtConnCheck(details)) {
      return getProxyForExtensionConnectionCheck(
        isGlobalProxyEnabled,
        globalProxy,
        randomProxyMode,
        excludedHosts,
        hostProxies,
        hostProxiesDetails,
        tldRoutingEnabled,
        flatProxiesList,
        withDns,
      );
    }

    // 4. Check for random proxy mode
    // For now, overrides all other proxy settings
    if (randomProxyMode) {
      return getRandomSessionProxy(domain);
    }

    // 5. Check domain/subdomain level
    if (isDomainExcluded) {
      return { type: 'direct' };
    }

    if (isDomainProxied && isDomainProxydEnabled) {
      return withDns(hostProxies[currentDomain]);
    }

    // 5b. Fallback to parent domain for subdomains (e.g., www.reddit.com -> reddit.com)
    if (isParentDomainProxied && isParentProxyEnabled) {
      return withDns(hostProxies[domain]);
    }

    // 5.5 Check blocklist-based domain routing
    const blocklistProxy = await getBlocklistProxy(
      currentDomain,
      hasSubdomain ? domain : undefined,
    );
    if (blocklistProxy) return withDns(blocklistProxy);

    // 6. TLD routing: automatically pick a country proxy matching the ccTLD
    if (tldRoutingEnabled) {
      const tld = getTLD(currentDomain);
      const tldProxy = getTLDCountryProxy(tld, flatProxiesList);
      if (tldProxy) return withDns(tldProxy);
    }

    // 7. Check global proxy
    if (isGlobalProxyEnabled) {
      return withDns(globalProxy);
    }

    // 7. Default: no proxy
    return { type: 'direct' };
  } catch (error) {
    console.log(error);
  }
};

async function getLocalStorageItems(): Promise<{
  excludedHosts: string[];
  flatProxiesList: SocksProxy[];
  globalProxy: ProxyInfo;
  globalProxyDetails: ProxyDetails;
  hostProxies: ProxyInfoMap;
  hostProxiesDetails: Record<string, ProxyDetails>;
  randomProxyMode: boolean;
  tldRoutingEnabled: boolean;
  customDns: CustomDnsConfig;
}> {
  const data = await browser.storage.local.get([
    'excludedHosts',
    'flatProxiesList',
    'globalProxy',
    'globalProxyDetails',
    'hostProxies',
    'hostProxiesDetails',
    'randomProxyMode',
    'tldRoutingEnabled',
    'customDns',
  ]);

  return {
    excludedHosts: JSON.parse(data.excludedHosts),
    flatProxiesList: data.flatProxiesList ? JSON.parse(data.flatProxiesList) : [],
    globalProxy: JSON.parse(data.globalProxy),
    globalProxyDetails: JSON.parse(data.globalProxyDetails),
    hostProxies: JSON.parse(data.hostProxies),
    hostProxiesDetails: JSON.parse(data.hostProxiesDetails),
    randomProxyMode: JSON.parse(data.randomProxyMode),
    tldRoutingEnabled: data.tldRoutingEnabled ? JSON.parse(data.tldRoutingEnabled) : false,
    customDns: data.customDns ? JSON.parse(data.customDns) : { enabled: false, url: '' },
  };
}

const getCurrentHost = (details: RequestDetails) => {
  if (details.frameAncestors && details.frameAncestors.length > 0) {
    // when the request initiate from an iframe, it has a parent frame
    // the host is determined from its top parent frame (frameID === 0)
    const frame = details.frameAncestors.find((frame) => frame.frameId === 0);
    if (frame) {
      return new URL(frame.url).hostname;
    }
  } else if (isLocalOrReservedIP(new URL(details.url).hostname)) {
    // This is to handle localhost/reserved IP ranges
    return new URL(details.url).hostname;
  } else if (details.documentUrl) {
    // when the request comes froms a a page(top level frame),
    // then the host is determined from the document URL
    return new URL(details.documentUrl).hostname;
  }
  // When a request is initiated in the browser background,
  // the host is derived from the request URL itself
  return new URL(details.url).hostname;
};

export const isExtConnCheck = (details: RequestDetails): boolean => {
  const isExtensionRequest = Boolean(details.documentUrl?.startsWith('moz-extension://'));
  const isConnCheck =
    details.url === 'https://ipv4.am.i.mullvad.net/json' ||
    details.url === 'https://ipv6.am.i.mullvad.net/json';
  const isDNSCheck =
    checkDomain(details.url).domain === 'mullvad.net' && details.url.endsWith('am.i.mullvad.net/');

  return isExtensionRequest && (isConnCheck || isDNSCheck);
};

export const isLocalOrReservedIP = (hostname: string) => {
  if (hostname.includes('localhost')) return true;
  if (!ipaddr.isValid(hostname)) return false;

  try {
    const addr = ipaddr.parse(hostname);
    const range = addr.range();

    return (
      range === 'private' ||
      range === 'multicast' ||
      range === 'linkLocal' ||
      range === 'loopback' ||
      range === 'uniqueLocal'
    );
  } catch (e: unknown) {
    console.error('Invalid IP address:', e);
    return false;
  }
};

const getProxyForExtensionConnectionCheck = async (
  isGlobalProxyEnabled: boolean,
  globalProxy: ProxyInfo,
  randomProxyMode: boolean,
  excludedHosts: string[],
  hostProxies: ProxyInfoMap,
  hostProxiesDetails: Record<string, ProxyDetails>,
  tldRoutingEnabled: boolean,
  flatProxiesList: SocksProxy[],
  withDns: (proxy: ProxyInfo) => ProxyInfo,
) => {
  const { isAboutPage, host } = await getActiveTabDetails();
  const { domain, hasSubdomain, fullHost } = checkDomain(host);
  const tabDomain = hasSubdomain ? fullHost : domain;

  const isTabDomainExcluded =
    excludedHosts.includes(tabDomain) || (hasSubdomain && excludedHosts.includes(domain));
  const isTabDomainProxied = Object.hasOwn(hostProxies, tabDomain);
  const isTabProxyEnabled = !!hostProxiesDetails[tabDomain]?.socksEnabled;
  const isParentDomainProxied = hasSubdomain && Object.hasOwn(hostProxies, domain);
  const isParentProxyEnabled = hasSubdomain && !!hostProxiesDetails[domain]?.socksEnabled;

  // a) If the current tab is an about page, we only need to check for a global proxy
  if (isAboutPage) {
    return isGlobalProxyEnabled ? globalProxy : { type: 'direct' };
  }

  // b) If random proxy mode is enabled, we need to check for the current tab's proxy
  if (randomProxyMode) {
    return getRandomSessionProxy(tabDomain);
  }

  // c) If current tab domain is excluded, connection is direct
  if (isTabDomainExcluded) {
    return { type: 'direct' };
  }

  // d) If current tab is proxied, we need to check for the current tab's proxy
  if (isTabDomainProxied && isTabProxyEnabled) {
    return withDns(hostProxies[tabDomain]);
  }

  // d-b) Fallback to parent domain for subdomains (e.g., www.reddit.com -> reddit.com)
  if (isParentDomainProxied && isParentProxyEnabled) {
    return withDns(hostProxies[domain]);
  }

  // d-c) Blocklist routing for the active tab domain
  const blocklistProxy = await getBlocklistProxy(tabDomain, hasSubdomain ? domain : undefined);
  if (blocklistProxy) return withDns(blocklistProxy);

  // d-d) TLD routing for the active tab domain
  if (tldRoutingEnabled) {
    const tld = getTLD(tabDomain);
    const tldProxy = getTLDCountryProxy(tld, flatProxiesList);
    if (tldProxy) return withDns(tldProxy);
  }

  // e) If global proxy is enabled
  if (isGlobalProxyEnabled) {
    return withDns(globalProxy);
  }

  return { type: 'direct' };
};
