import { ref } from 'vue';

const showLocations = ref(false);
const customProxySelect = ref(false);
const customProxyHost = ref('');
const blocklistRouteId = ref('');

const useLocations = () => {
  const toggleLocations = () => {
    showLocations.value = !showLocations.value;
  };

  const proxySelect = (host?: string) => {
    // when host is not provided, it means the user is selecting a proxy for all websites
    blocklistRouteId.value = '';
    customProxyHost.value = host ? host : '';
    customProxySelect.value = !!host;
    toggleLocations();
  };

  const proxySelectForBlocklist = (id: string) => {
    customProxyHost.value = '';
    customProxySelect.value = false;
    blocklistRouteId.value = id;
    toggleLocations();
  };

  return {
    blocklistRouteId,
    customProxyHost,
    customProxySelect,
    proxySelect,
    proxySelectForBlocklist,
    showLocations,
    toggleLocations,
  };
};

export default useLocations;
