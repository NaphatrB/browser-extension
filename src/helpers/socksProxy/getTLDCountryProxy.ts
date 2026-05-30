import { SocksProxy } from './socksProxies.types';
import { ProxyInfo, ProxyInfoType } from './socksProxy.types';
import { baseConfig } from './constants';

/**
 * Some ccTLDs don't match the ISO 3166-1 alpha-2 country code used by Mullvad relay locations.
 * The most common mismatch is `.uk` → `gb`.
 */
export const TLD_TO_COUNTRY_CODE: Record<string, string> = {
  uk: 'gb',
};

/**
 * Given a TLD (e.g. "th") and the flat list of available SOCKS proxies, returns a randomly
 * selected ProxyInfo for a server in that country, or null if no servers exist for it.
 *
 * Only 2-letter TLDs (ccTLDs) are considered; generic TLDs like "com" or "net" return null.
 */
export const getTLDCountryProxy = (
  tld: string,
  flatProxiesList: SocksProxy[],
): ProxyInfo | null => {
  if (tld.length !== 2) return null;

  const normalizedTld = tld.toLowerCase();
  const countryCode = TLD_TO_COUNTRY_CODE[normalizedTld] ?? normalizedTld;

  const matches = flatProxiesList.filter(
    (p) => p.location.countryCode?.toLowerCase() === countryCode,
  );

  if (!matches.length) return null;

  const proxy = matches[Math.floor(Math.random() * matches.length)];
  return {
    type: ProxyInfoType.socks,
    host: proxy.ipv4_address,
    port: proxy.port || (baseConfig.port as number),
    proxyDNS: baseConfig.proxyDNS,
  };
};

/** Extracts the TLD from a hostname (e.g. "www.example.th" → "th"). */
export const getTLD = (hostname: string): string => {
  const parts = hostname.split('.');
  return parts.length >= 2 ? parts[parts.length - 1].toLowerCase() : '';
};
