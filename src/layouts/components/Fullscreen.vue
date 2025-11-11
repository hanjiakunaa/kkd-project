<template>
  <div
    id="fullscreen"
    class="mr-16 inline-flex cursor-pointer items-center"
    @click="toggle"
  >
    <h-icon
      :name="isFullscreen ? 'fa-compress' : 'fa-expand'"
      scale="1.2"
    />
  </div>
</template>

<script setup>
import { useFullscreen } from '@vueuse/core'

const { isFullscreen, toggle } = useFullscreen()
</script>
