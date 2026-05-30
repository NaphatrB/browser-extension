<script lang="ts" setup>
import { computed } from 'vue';
import { NCard, NInput, NRadioButton, NRadioGroup, NSwitch, NTooltip } from 'naive-ui';

import Button from '@/components/Buttons/Button.vue';
import ExternalLinkIconLabel from '@/components/ExternalLinkIconLabel.vue';
import IconLabel from '@/components/IconLabel.vue';
import useCustomDns from '@/composables/useCustomDns';

const { customDns, setCustomDns, openFirefoxDnsSettings } = useCustomDns();

const label = computed(() =>
  customDns.value.enabled ? 'Custom DNS enabled' : 'Custom DNS disabled',
);

const placeholder = computed(() =>
  customDns.value.mode === 'doh' ? 'https://dns.nextdns.io/dns-query' : 'dns.nextdns.io',
);

const description = computed(() =>
  customDns.value.mode === 'doh'
    ? 'Enter a DNS-over-HTTPS (DoH) URL. You must also configure Firefox to use this resolver in its Privacy & Security settings for DNS queries to use it.'
    : 'Enter a DNS-over-TLS (DoT) hostname. You must also configure Firefox to use this resolver in its Privacy & Security settings for DNS queries to use it.',
);
</script>

<template>
  <n-card id="custom-dns" :bordered="false">
    <div class="flex justify-between">
      <h2 class="text-lg">Custom DNS</h2>
      <n-tooltip>
        <template #trigger>
          <n-switch
            :value="customDns.enabled"
            @update-value="(v) => setCustomDns({ enabled: v })"
          />
        </template>
        <span>{{ label }}</span>
      </n-tooltip>
    </div>

    <div class="py-4">
      <div class="mb-3">
        <n-radio-group
          :value="customDns.mode"
          @update-value="(v) => setCustomDns({ mode: v })"
          size="small"
        >
          <n-radio-button value="doh">DoH</n-radio-button>
          <n-radio-button value="dot">DoT</n-radio-button>
        </n-radio-group>
      </div>

      <n-input
        :value="customDns.url"
        :placeholder="placeholder"
        @update-value="(v) => setCustomDns({ url: v })"
        size="small"
      />

      <div class="mt-3">
        <IconLabel :text="description" type="info" />
      </div>
    </div>

    <Button @click="openFirefoxDnsSettings">
      <ExternalLinkIconLabel text="Configure DNS in Firefox" />
    </Button>
  </n-card>
</template>

<style scoped>
.n-card {
  scroll-margin-top: 15px;
}
</style>
