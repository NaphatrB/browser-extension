export type CustomDnsModeType = 'doh' | 'dot';

export type CustomDnsConfig = {
  enabled: boolean;
  mode: CustomDnsModeType;
  url: string;
};

export const defaultCustomDns: CustomDnsConfig = {
  enabled: false,
  mode: 'doh',
  url: '',
};
