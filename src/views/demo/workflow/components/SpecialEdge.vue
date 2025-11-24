<script setup>
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@vue-flow/core'
import { computed } from 'vue'

const props = defineProps({
  id: { type: String, required: true },
  sourceX: { type: Number, required: true },
  sourceY: { type: Number, required: true },
  targetX: { type: Number, required: true },
  targetY: { type: Number, required: true },
  sourcePosition: { type: String, required: true },
  targetPosition: { type: String, required: true },
  selected: { type: Boolean, default: false },
  data: { type: Object, required: true },
})

const path = computed(() => getBezierPath(props))
const edgeClass = computed(() => {
  const s = props.data?.status || 'default'
  return ['special-edge', `edge-${s}`, { selected: props.selected }]
})
</script>

<script>
export default { inheritAttrs: false }
</script>

<template>
  <base-edge :path="path[0]" :class="edgeClass" />

  <edge-label-renderer>
    <div
      v-if="data?.label"
      :style="{
        pointerEvents: 'all',
        position: 'absolute',
        transform: `translate(-50%, -50%) translate(${path[1]}px,${path[2]}px)`,
      }"
      class="edge-label nodrag nopan"
      title="双击可在右侧属性面板编辑标签"
    >
      {{ data?.label || '' }}
    </div>
    <div v-else />
  </edge-label-renderer>
</template>

<style scoped>
.special-edge {
  stroke: #9aa0a6;
  stroke-width: 2;
}
.edge-default {
  stroke: #9aa0a6;
}
.special-edge.selected {
  stroke: #2563eb;
  stroke-width: 2.5;
}
.edge-running {
  stroke: #d97706;
  stroke-dasharray: 6 4;
  animation: dash 1s linear infinite;
}
.edge-error {
  stroke: #ef4444;
}
.edge-success {
  stroke: #10b981;
}
.edge-skipped {
  stroke: #9ca3af;
  stroke-dasharray: 3 5;
}
@keyframes dash {
  to {
    stroke-dashoffset: -20;
  }
}
.edge-label {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 2px 6px;
  font-size: 12px;
  color: #374151;
}
</style>
