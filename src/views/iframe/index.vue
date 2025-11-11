<template>
  <app-page full>
    <iframe :src="route.meta.originPath" frameborder="0" class="wh-full" />
  </app-page>
</template>

<script setup>
const route = useRoute()
</script>
