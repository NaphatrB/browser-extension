<script lang="ts" setup>
import { ref } from 'vue';
import { NCard, NInput, NSwitch, NTooltip, NIcon } from 'naive-ui';

import Button from '@/components/Buttons/Button.vue';
import TitleCategory from '@/components/TitleCategory.vue';
import FeRefreshCw from '@/components/Icons/FeRefreshCw.vue';
import FeTrash from '@/components/Icons/FeTrash.vue';

import useBlocklistRoutes from '@/composables/useBlocklistRoutes';
import useLocations from '@/composables/useLocations';

const { addRoute, blocklistRoutes, removeRoute, refreshRoute, toggleRoute } = useBlocklistRoutes();
const { proxySelectForBlocklist } = useLocations();

const inputUrl = ref('');
const inputError = ref('');
const refreshing = ref<Record<string, boolean>>({});

const handleAdd = async () => {
  const url = inputUrl.value.trim();
  if (!url) {
    inputError.value = 'Please enter a URL';
    return;
  }
  try {
    new URL(url);
  } catch {
    inputError.value = 'Please enter a valid URL';
    return;
  }
  inputError.value = '';
  inputUrl.value = '';
  await addRoute(url);
};

const handleRefresh = async (id: string) => {
  refreshing.value = { ...refreshing.value, [id]: true };
  await refreshRoute(id);
  const next = { ...refreshing.value };
  delete next[id];
  refreshing.value = next;
};

const formatDate = (ts: number | null) => {
  if (!ts) return 'Never';
  return new Date(ts).toLocaleString();
};
</script>

<template>
  <n-card id="blocklist-routing" :bordered="false">
    <TitleCategory title="Blocklist-based routing" />

    <p class="text-sm text-gray-400 mt-1 mb-4">
      Fetch a domain list (plain or Adblock Plus format) and route matching traffic through a chosen
      proxy country.
    </p>

    <div class="flex items-start gap-2 mb-2">
      <n-input
        v-model:value="inputUrl"
        placeholder="https://example.com/domains.txt"
        class="flex-grow"
        :status="inputError ? 'error' : undefined"
        clearable
        @focus="inputError = ''"
        @keyup.enter="handleAdd"
      />
      <Button size="small" @click="handleAdd">Add</Button>
    </div>
    <div v-if="inputError" class="text-red-500 text-sm mb-3">{{ inputError }}</div>

    <div
      v-for="route in blocklistRoutes"
      :key="route.id"
      class="border-t border-[#354f6b] pt-3 mt-3"
    >
      <div class="flex items-center justify-between gap-2 mb-1">
        <span class="text-sm truncate flex-1" :title="route.url">{{ route.url }}</span>
        <div class="flex items-center gap-2 shrink-0">
          <n-tooltip>
            <template #trigger>
              <n-switch :value="route.enabled" @update-value="toggleRoute(route.id)" />
            </template>
            {{ route.enabled ? 'Enabled' : 'Disabled' }}
          </n-tooltip>
          <n-tooltip>
            <template #trigger>
              <n-icon
                size="18"
                class="cursor-pointer text-gray-400 hover:text-white"
                :class="{ 'opacity-40 pointer-events-none': refreshing[route.id] }"
                @click="handleRefresh(route.id)"
              >
                <FeRefreshCw />
              </n-icon>
            </template>
            Refresh list
          </n-tooltip>
          <n-tooltip>
            <template #trigger>
              <n-icon
                size="18"
                class="cursor-pointer text-red-400 hover:text-red-300"
                @click="removeRoute(route.id)"
              >
                <FeTrash />
              </n-icon>
            </template>
            Remove
          </n-tooltip>
        </div>
      </div>

      <div class="text-xs text-gray-400 mb-2">
        <span v-if="route.error" class="text-red-400">Error: {{ route.error }}</span>
        <template v-else>
          {{ route.domains.length.toLocaleString() }} domains · Last fetched:
          {{ formatDate(route.lastFetched) }}
        </template>
      </div>

      <div class="flex items-center gap-2">
        <Button size="small" @click="proxySelectForBlocklist(route.id)">
          {{
            route.proxyDetails?.server
              ? `${route.proxyDetails.city}, ${route.proxyDetails.country}`
              : 'Select proxy location'
          }}
        </Button>
        <span v-if="route.proxyDetails?.server" class="text-xs text-gray-400">
          via {{ route.proxyDetails.server }}
        </span>
      </div>
    </div>

    <div v-if="blocklistRoutes.length === 0" class="text-sm text-gray-500 mt-2">
      No blocklists configured.
    </div>
  </n-card>
</template>
