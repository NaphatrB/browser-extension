export type CustomDnsConfig = {
  enabled: boolean;
  url: string;
};

export const defaultCustomDns: CustomDnsConfig = {
  enabled: false,
  url: '',
};
