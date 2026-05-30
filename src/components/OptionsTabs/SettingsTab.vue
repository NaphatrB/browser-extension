<script setup lang="ts">
import PrivacyRecommendations from '@/components/PrivacyRecommendations/PrivacyRecommendations.vue';
import TitleCategory from '@/components/TitleCategory.vue';
import WebRTCToggle from '@/components/PrivacyRecommendations/WebRTCToggle.vue';
import CustomDnsCard from '@/components/Dns/CustomDnsCard.vue';
</script>

<template>
  <WebRTCToggle class="pt-4" />

  <CustomDnsCard class="pt-4" />

  <TitleCategory title="Privacy Recommendations" class="mb-2 pt-4" />
  <privacy-recommendations />
</template>
