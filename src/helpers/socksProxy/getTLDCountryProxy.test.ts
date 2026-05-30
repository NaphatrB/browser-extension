import { describe, it, expect } from 'vitest';
import { getTLD, getTLDCountryProxy } from '@/helpers/socksProxy/getTLDCountryProxy';
import { SocksProxy } from '@/helpers/socksProxy/socksProxies.types';
import { ProxyInfoType } from '@/helpers/socksProxy/socksProxy.types';

const makeProxy = (countryCode: string, ipv4 = '1.2.3.4', port = 1080): SocksProxy => ({
  online: true,
  hostname: `socks5-${countryCode}-001.relays.mullvad.net`,
  ipv4_address: ipv4,
  ipv6_address: '',
  port,
  location: {
    city: 'Test City',
    code: `${countryCode}-tst`,
    country: 'Test Country',
    countryCode,
    longitude: 0,
    latitude: 0,
  },
});

describe('getTLD', () => {
  it('extracts TLD from a simple domain', () => {
    expect(getTLD('example.com')).toBe('com');
  });

  it('extracts TLD from a subdomain', () => {
    expect(getTLD('www.example.th')).toBe('th');
  });

  it('returns empty string for a single label', () => {
    expect(getTLD('localhost')).toBe('');
  });

  it('lowercases the result', () => {
    expect(getTLD('example.TH')).toBe('th');
  });
});

describe('getTLDCountryProxy', () => {
  const proxies = [makeProxy('th', '10.0.0.1'), makeProxy('de', '10.0.0.2'), makeProxy('gb', '10.0.0.3')];

  it('returns a proxy for a matching ccTLD', () => {
    const result = getTLDCountryProxy('th', proxies);
    expect(result).not.toBeNull();
    expect(result?.type).toBe(ProxyInfoType.socks);
    expect(result?.host).toBe('10.0.0.1');
  });

  it('maps .uk TLD to gb country code', () => {
    const result = getTLDCountryProxy('uk', proxies);
    expect(result).not.toBeNull();
    expect(result?.host).toBe('10.0.0.3');
  });

  it('returns null when no proxy exists for the country', () => {
    expect(getTLDCountryProxy('jp', proxies)).toBeNull();
  });

  it('returns null for non-ccTLD (length != 2)', () => {
    expect(getTLDCountryProxy('com', proxies)).toBeNull();
    expect(getTLDCountryProxy('net', proxies)).toBeNull();
    expect(getTLDCountryProxy('', proxies)).toBeNull();
  });

  it('returns null when proxy list is empty', () => {
    expect(getTLDCountryProxy('th', [])).toBeNull();
  });

  it('is case-insensitive for the TLD', () => {
    expect(getTLDCountryProxy('TH', proxies)).not.toBeNull();
    expect(getTLDCountryProxy('TH', proxies)?.host).toBe('10.0.0.1');
  });

  it('picks from multiple matching proxies randomly', () => {
    const multiProxies = [
      makeProxy('th', '10.0.1.1'),
      makeProxy('th', '10.0.1.2'),
      makeProxy('th', '10.0.1.3'),
    ];
    const hosts = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const result = getTLDCountryProxy('th', multiProxies);
      if (result) hosts.add(result.host);
    }
    // With 50 tries across 3 servers, very likely to hit more than one
    expect(hosts.size).toBeGreaterThan(1);
  });
});
