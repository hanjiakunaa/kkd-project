<script setup>
defineOptions({
  name: 'ConfigFormItemOptions',
})

defineProps({
  componentId: {
    type: Object,
    required: true,
  },
  options: {
    type: Array,
    required: true,
  },
})
</script>

<template>
  <component
    :is="componentId"
    v-for="item in options"
    :key="item.value"
    :label="item.label"
    :value="item.value"
  />
</template>
