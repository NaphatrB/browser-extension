import useStore from '@/composables/useStore';
import type { CustomDnsConfig } from '@/helpers/dns/customDns.types';

const { customDns } = useStore();

const setCustomDns = (config: Partial<CustomDnsConfig>) => {
  customDns.value = { ...customDns.value, ...config };
};

const openFirefoxDnsSettings = () => {
  browser.tabs.create({ url: 'about:preferences#privacy' });
};

const useCustomDns = () => ({
  customDns,
  setCustomDns,
  openFirefoxDnsSettings,
});

export default useCustomDns;
