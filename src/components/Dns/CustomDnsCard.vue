<script lang="ts" setup>
import { computed } from 'vue';
import { NCard, NInput, NSwitch, NTooltip } from 'naive-ui';

import Button from '@/components/Buttons/Button.vue';
import ExternalLinkIconLabel from '@/components/ExternalLinkIconLabel.vue';
import IconLabel from '@/components/IconLabel.vue';
import useCustomDns from '@/composables/useCustomDns';

const { customDns, setCustomDns, openFirefoxDnsSettings } = useCustomDns();

const label = computed(() =>
  customDns.value.enabled ? 'Custom DNS enabled' : 'Custom DNS disabled',
);

const copyUrl = () => {
  if (customDns.value.url) navigator.clipboard.writeText(customDns.value.url);
};
</script>

<template>
  <n-card id="custom-dns" :bordered="false">
    <div class="flex justify-between">
      <h2 class="text-lg">Custom DNS (DoH)</h2>
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
      <div class="flex gap-2">
        <n-input
          :value="customDns.url"
          placeholder="https://dns.nextdns.io/dns-query"
          @update-value="(v) => setCustomDns({ url: v })"
          size="small"
          class="flex-1"
        />
        <Button size="small" :disabled="!customDns.url" @click="copyUrl"> Copy </Button>
      </div>

      <div class="mt-3">
        <IconLabel
          text="When enabled, DNS queries bypass the SOCKS proxy and use Firefox's own resolver. Enter your DoH URL above, then paste it into Firefox's DNS settings."
          type="info"
        />
      </div>
    </div>

    <Button @click="openFirefoxDnsSettings">
      <ExternalLinkIconLabel text="Open Firefox DNS settings" />
    </Button>
  </n-card>
</template>

<style scoped>
.n-card {
  scroll-margin-top: 15px;
}
</style>
