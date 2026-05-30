<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { NCard, NCollapseTransition, NIcon, NSwitch, NTag } from 'naive-ui';

import Button from '@/components/Buttons/Button.vue';
import FeChevronDown from '@/components/Icons/FeChevronDown.vue';
import FeChevronUp from '@/components/Icons/FeChevronUp.vue';
import FeInfo from '@/components/Icons/FeInfo.vue';
import SplitButton from '@/components/Buttons/SplitButton.vue';
import TitleCategory from '@/components/TitleCategory.vue';
import InUseTag from '@/components/Proxy/InUseTag.vue';
import CustomDnsCard from '@/components/Dns/CustomDnsCard.vue';

import useActiveTab from '@/composables/useActiveTab';
import useLocations from '@/composables/useLocations';
import useProxyPermissions from '@/composables/useProxyPermissions';
import useRandomProxy from '@/composables/useRandomProxy';
import useSocksProxy from '@/composables/useSocksProxy';
import useRoutingStatus from '@/composables/useRoutingStatus';

const showDetailsAllWebsites = ref(false);
const showDetailsCurrentDomain = ref(false);
const showDetailsRandom = ref(false);
const showDetailsTld = ref(false);
const showDetailsBlocklist = ref(false);

const { isAboutPage, isExtensionPage } = useActiveTab();
const { proxySelect } = useLocations();
const { isGranted, requestPermissions } = useProxyPermissions();
const { toggleRandomProxyMode, randomProxyMode } = useRandomProxy();
const {
  allowProxy,
  currentHostProxyDetails,
  currentHostProxyEnabled,
  currentHostExcluded,
  currentEffectiveProxyHost,
  globalProxyEnabled,
  globalProxyDetails,
  neverProxyHost,
  removeCustomProxy,
  removeGlobalProxy,
  toggleHostProxy,
  toggleGlobalProxy,
} = useSocksProxy();
import useSocksProxies from '@/composables/useSocksProxies';
import useStore from '@/composables/useStore';

const { flatProxiesList, tldRoutingEnabled, blocklistRoutes } = useStore();
const { getSocksProxies } = useSocksProxies();
const { tldRouteInfo, blocklistRouteInfo } = useRoutingStatus();

const activeBlocklistCount = computed(
  () => blocklistRoutes.value.filter((r) => r.enabled && r.proxyDetails).length,
);

const isCurrentHostProxyOverriden = computed(() => randomProxyMode.value);

const isAllWebsitesProxyOverriden = computed(() =>
  !randomProxyMode.value && !currentHostProxyEnabled.value && !currentHostExcluded.value
    ? false
    : true,
);

watch(isGranted, (newValue) => {
  // If permissions are granted and proxies list is empty
  if (newValue && (!flatProxiesList.value || flatProxiesList.value.length === 0)) {
    getSocksProxies();
  }
});
</script>

<template>
  <div>
    <TitleCategory v-if="!isAboutPage && !isExtensionPage" title="Proxies" class="ml-3 mb-2" />
  </div>
  <n-card v-if="isGranted" :bordered="false" class="mb-2">
    <div v-if="!isAboutPage && !isExtensionPage" class="border-[#354f6b] border-b-1 mb-3 pb-3">
      <div
        class="flex justify-between cursor-pointer"
        @click="showDetailsCurrentDomain = !showDetailsCurrentDomain"
      >
        <div class="flex">
          <TitleCategory :level="3" title="Current domain" />
          <InUseTag
            v-if="!isCurrentHostProxyOverriden && (currentHostProxyEnabled || currentHostExcluded)"
          />
        </div>

        <div class="flex flex-row items-center">
          <n-switch
            v-if="currentHostProxyDetails && !currentHostExcluded"
            :value="currentHostProxyEnabled"
            :disabled="isCurrentHostProxyOverriden"
            @update-value="toggleHostProxy(currentEffectiveProxyHost)"
            @click.stop
            class="mr-2"
          />

          <n-icon size="20" class="cursor-pointer">
            <FeChevronUp v-if="showDetailsCurrentDomain" />
            <FeChevronDown v-else />
          </n-icon>
        </div>
      </div>

      <n-collapse-transition :show="showDetailsCurrentDomain" class="mt-2">
        <div v-if="!currentHostExcluded" class="flex items-center mb-2">
          <n-icon size="20" class="mr-3">
            <FeInfo />
          </n-icon>
          <p>
            Proxy configured for <strong>{{ currentEffectiveProxyHost }}</strong
            >.
          </p>
        </div>

        <div v-if="currentHostExcluded" class="mb-3">
          <p class="mb-4">
            <strong>{{ currentEffectiveProxyHost }}</strong> is set to never be proxied.
          </p>
          <Button size="small" @click="allowProxy(currentEffectiveProxyHost)"
            >Allow proxy for <strong>{{ currentEffectiveProxyHost }}</strong></Button
          >
        </div>
        <div v-if="!currentHostExcluded">
          <div v-if="currentHostProxyDetails" class="flex justify-between">
            <div class="mb-2">
              <h4 class="font-semibold">
                {{ currentHostProxyDetails.city }}, {{ currentHostProxyDetails.country }}
              </h4>
              <div class="flex">
                <h4 class="font-semibold">Server</h4>
                <div class="ml-2">{{ currentHostProxyDetails.server }}</div>
              </div>
            </div>
          </div>

          <div class="flex justify-between">
            <Button size="small" @click="proxySelect(currentEffectiveProxyHost)">
              {{ currentHostProxyDetails ? 'Change location' : 'Select location' }}
            </Button>
            <SplitButton
              v-if="currentHostProxyDetails"
              size="small"
              main-color="error"
              sub-color="white"
              main-text="Reset"
              sub-text="Never proxy"
              @main-click="removeCustomProxy(currentEffectiveProxyHost)"
              @sub-click="neverProxyHost(currentEffectiveProxyHost)"
            />
            <Button
              v-else
              size="small"
              class="flex items-center justify-center"
              @click="neverProxyHost(currentEffectiveProxyHost)"
            >
              Never proxy
            </Button>
          </div>
        </div>
      </n-collapse-transition>
    </div>

    <div class="border-[#354f6b] border-b-1 mb-3 pb-3">
      <div
        class="flex justify-between cursor-pointer"
        @click="showDetailsAllWebsites = !showDetailsAllWebsites"
      >
        <div class="flex flex-row items-center">
          <TitleCategory :level="3" title="All websites" />
          <InUseTag v-if="!isAllWebsitesProxyOverriden && globalProxyEnabled" />
        </div>

        <div class="flex flex-row items-center">
          <n-switch
            v-if="globalProxyDetails.server"
            :value="globalProxyEnabled"
            :disabled="isAllWebsitesProxyOverriden"
            @update-value="toggleGlobalProxy()"
            @click.stop
            class="mr-2"
          />

          <n-icon size="20" class="cursor-pointer">
            <FeChevronUp v-if="showDetailsAllWebsites" />
            <FeChevronDown v-else />
          </n-icon>
        </div>
      </div>

      <n-collapse-transition :show="showDetailsAllWebsites" class="mt-2">
        <div class="flex items-center mb-2">
          <n-icon size="20" class="mr-3">
            <FeInfo />
          </n-icon>
          <p>
            Proxy configured for <strong>all websites</strong>, with the exception of domain
            specific proxies.
          </p>
        </div>

        <div v-if="globalProxyDetails.server" class="mb-3">
          <div class="flex">
            <h4 class="font-semibold">Location</h4>
            <div class="ml-2">{{ globalProxyDetails.city }}, {{ globalProxyDetails.country }}</div>
          </div>

          <div class="flex">
            <h4 class="font-semibold">Server</h4>
            <div class="ml-2">{{ globalProxyDetails.server }}</div>
          </div>
        </div>

        <div class="flex justify-between">
          <Button size="small" @click="proxySelect()" class="mr-2">
            {{ globalProxyDetails.server ? 'Change location' : 'Select location' }}
          </Button>
          <Button
            v-if="globalProxyDetails.server"
            size="small"
            color="error"
            @click="removeGlobalProxy"
          >
            Reset
          </Button>
        </div>
      </n-collapse-transition>
    </div>

    <div class="">
      <div
        class="flex justify-between cursor-pointer"
        @click="showDetailsRandom = !showDetailsRandom"
      >
        <div class="flex flex-row items-center">
          <TitleCategory :level="3" title="Random mode" />
          <InUseTag v-if="randomProxyMode" />
        </div>

        <div class="flex flex-row items-center">
          <n-switch
            :value="randomProxyMode"
            @update-value="toggleRandomProxyMode()"
            @click.stop
            class="mr-2"
          />

          <n-icon size="20" class="cursor-pointer">
            <FeChevronUp v-if="showDetailsRandom" />
            <FeChevronDown v-else />
          </n-icon>
        </div>
      </div>

      <n-collapse-transition :show="showDetailsRandom" class="mt-2">
        <div class="flex items-center mb-2">
          <n-icon size="20" class="mr-3">
            <FeInfo />
          </n-icon>
          <p>
            When enabled, a random proxy is assigned per domain. On browser restart, proxies are
            rotated.
            <br />
            This will override any other proxy.
          </p>
        </div>
      </n-collapse-transition>
    </div>

    <div class="border-[#354f6b] border-t-1 mt-3 pt-3">
      <div class="flex justify-between cursor-pointer" @click="showDetailsTld = !showDetailsTld">
        <div class="flex flex-row items-center">
          <TitleCategory :level="3" title="TLD routing" />
          <InUseTag v-if="tldRouteInfo" />
        </div>

        <div class="flex flex-row items-center">
          <n-switch
            :value="tldRoutingEnabled"
            @update-value="(v) => (tldRoutingEnabled = v)"
            @click.stop
            class="mr-2"
          />
          <n-icon size="20" class="cursor-pointer">
            <FeChevronUp v-if="showDetailsTld" />
            <FeChevronDown v-else />
          </n-icon>
        </div>
      </div>

      <!-- Active status: always visible when routing is active for the current domain -->
      <p v-if="tldRouteInfo" class="text-sm mt-1">
        <span class="font-semibold">.{{ tldRouteInfo.tld }}</span> is routed through
        {{ tldRouteInfo.country }}.
      </p>

      <n-collapse-transition :show="showDetailsTld" class="mt-2">
        <div class="flex items-center mb-2">
          <n-icon size="20" class="mr-3">
            <FeInfo />
          </n-icon>
          <p v-if="tldRoutingEnabled && !tldRouteInfo">
            No TLD routing active for the current domain.
          </p>
          <p v-else-if="!tldRoutingEnabled">
            When enabled, country-code TLD domains (e.g. .th, .de, .se) are automatically routed
            through the matching Mullvad proxy country.
          </p>
        </div>
      </n-collapse-transition>
    </div>

    <div class="border-[#354f6b] border-t-1 mt-3 pt-3">
      <div
        class="flex justify-between cursor-pointer"
        @click="showDetailsBlocklist = !showDetailsBlocklist"
      >
        <div class="flex flex-row items-center">
          <TitleCategory :level="3" title="Blocklist routing" />
          <InUseTag v-if="blocklistRouteInfo" />
        </div>

        <div class="flex flex-row items-center">
          <n-tag v-if="activeBlocklistCount > 0" round size="small" type="info" class="mr-2">
            {{ activeBlocklistCount }}
          </n-tag>
          <n-icon size="20" class="cursor-pointer">
            <FeChevronUp v-if="showDetailsBlocklist" />
            <FeChevronDown v-else />
          </n-icon>
        </div>
      </div>

      <!-- Active status: always visible when current domain matches a blocklist route -->
      <p v-if="blocklistRouteInfo" class="text-sm mt-1">
        Matched <span class="font-semibold">{{ blocklistRouteInfo.url }}</span> — routed through
        {{ blocklistRouteInfo.proxyDetails?.country }}.
      </p>

      <n-collapse-transition :show="showDetailsBlocklist" class="mt-2">
        <div class="flex items-center mb-2">
          <n-icon size="20" class="mr-3">
            <FeInfo />
          </n-icon>
          <p v-if="activeBlocklistCount > 0 && !blocklistRouteInfo">
            No blocklist route matches the current domain.
          </p>
          <p v-else-if="activeBlocklistCount === 0">
            No blocklist routes configured. Add routes in
            <strong>Options → Proxy → Blocklist routing</strong>.
          </p>
        </div>
      </n-collapse-transition>
    </div>
  </n-card>

  <n-card v-else type="line" justify-content="start">
    <TitleCategory :level="2" title="Proxy permissions missing" />

    <div class="flex items-center mb-2">
      <n-icon size="20" class="mr-3">
        <FeInfo />
      </n-icon>
      <p>In order to use proxies, the following permissions are required:</p>
    </div>

    <div class="flex flex-col">
      <ul>
        <li>
          <strong><n-tag round size="small" type="info"> tabs </n-tag></strong> to show proxy
          settings from the active tab
        </li>
        <li>
          <strong><n-tag round size="small" type="info"> proxy </n-tag></strong> to configure and
          use Mullvad proxy servers
        </li>
        <li>
          <strong><n-tag round size="small" type="info"> all_urls </n-tag></strong> to have granular
          proxy settings
        </li>
      </ul>

      <Button size="small" class="mt-3" @click="requestPermissions"> Grant permissions </Button>
    </div>
  </n-card>

  <CustomDnsCard class="mt-2" />
</template>
