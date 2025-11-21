<script setup>
import { Handle, Position } from '@vue-flow/core'
import { computed } from 'vue'

const props = defineProps({
  position: {
    type: Object,
    required: true,
  },
})

const x = computed(() => `${Math.round(props.position.x)}px`)
const y = computed(() => `${Math.round(props.position.y)}px`)
</script>

<template>
  <div class="vue-flow__node-default">
    <div>{{ data.label }}</div>

    <div>
      {{ x }} {{ y }}
    </div>

    <handle type="source" :position="Position.Bottom" />
  </div>
</template>
