import { describe, it, expect } from 'vitest';
import { parseBlocklist } from './parseBlocklist';

describe('parseBlocklist', () => {
  it('parses ABP format entries', () => {
    const text = `[Adblock Plus]\n! comment\n||example.com^\n||test.org^`;
    expect(parseBlocklist(text)).toEqual(['example.com', 'test.org']);
  });

  it('parses plain domain list', () => {
    expect(parseBlocklist('example.com\ntest.org')).toEqual(['example.com', 'test.org']);
  });

  it('skips wildcards', () => {
    expect(parseBlocklist('||*.example.com^')).toEqual([]);
  });

  it('skips entries with paths', () => {
    expect(parseBlocklist('||example.com/ads^')).toEqual([]);
  });

  it('skips IPv4 addresses', () => {
    expect(parseBlocklist('1.2.3.4')).toEqual([]);
  });

  it('skips comment lines and headers', () => {
    expect(parseBlocklist('! Title: test\n# comment\n[Adblock Plus]\n||ok.com^')).toEqual([
      'ok.com',
    ]);
  });

  it('deduplicates entries', () => {
    expect(parseBlocklist('||example.com^\n||example.com^')).toEqual(['example.com']);
  });

  it('lowercases all domains', () => {
    expect(parseBlocklist('||EXAMPLE.COM^')).toEqual(['example.com']);
  });

  it('skips single-label entries', () => {
    expect(parseBlocklist('||localhost^')).toEqual([]);
  });

  it('handles empty input', () => {
    expect(parseBlocklist('')).toEqual([]);
  });
});
