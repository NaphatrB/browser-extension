/**
 * Parses an Adblock Plus filter list or plain-text domain list and returns unique domains.
 *
 * Supported:
 *  - ABP format:   ||example.com^
 *  - Plain format: example.com
 *
 * Skips: comment lines (! #), header lines ([...]), wildcards, paths, and raw IPs.
 */
export const parseBlocklist = (text: string): string[] => {
  const seen = new Set<string>();

  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line.startsWith('!') || line.startsWith('#') || line.startsWith('[')) continue;

    let domain: string;

    if (line.startsWith('||') && line.endsWith('^')) {
      domain = line.slice(2, -1);
    } else if (!line.includes(' ') && !line.startsWith('|') && !line.startsWith('/')) {
      domain = line;
    } else {
      continue;
    }

    if (domain.includes('*') || domain.includes('/')) continue;
    if (/^\d+\.\d+\.\d+\.\d+$/.test(domain)) continue;
    if (!domain.includes('.')) continue;

    seen.add(domain.toLowerCase());
  }

  return [...seen];
};
