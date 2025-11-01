<script setup>
const title = import.meta.env.VITE_TITLE
</script>

<template>
  <footer class="f-c-c text-14 text-gray-500">
    {{ title }} © {{ new Date().getFullYear() }}
  </footer>
</template>
