<script lang="ts" setup>
import { computed } from 'vue';
import { NCard, NSwitch, NTooltip } from 'naive-ui';

import IconLabel from '@/components/IconLabel.vue';
import useStore from '@/composables/useStore';

const { tldRoutingEnabled } = useStore();

const label = computed(() =>
  tldRoutingEnabled.value ? 'TLD routing enabled' : 'TLD routing disabled',
);
const description = computed(() =>
  tldRoutingEnabled.value
    ? 'Requests to country-code TLD domains (e.g. .th, .de, .se) are automatically routed through a Mullvad proxy in that country, if one is available.'
    : 'When enabled, requests to country-code TLD domains (e.g. .th, .de, .se) are automatically routed through a Mullvad proxy in that country, if one is available. Note: .uk traffic is routed through GB servers.',
);
</script>

<template>
  <n-card id="tld-routing" :bordered="false">
    <div class="flex justify-between">
      <h2 class="text-lg">TLD-based routing</h2>
      <n-tooltip>
        <template #trigger>
          <n-switch v-model:value="tldRoutingEnabled" />
        </template>
        <span>{{ label }}</span>
      </n-tooltip>
    </div>

    <div class="py-4 flex items-center">
      <IconLabel :text="description" type="info" />
    </div>
  </n-card>
</template>
