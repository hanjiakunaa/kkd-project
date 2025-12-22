<script setup>
import { Handle, Position } from '@vue-flow/core'
import { computed, ref } from 'vue'

const props = defineProps({
  id: { type: String, required: true },
  data: { type: Object, required: true },
  selected: { type: Boolean, default: false },
})

// 节点展开状态
const expanded = ref(false)

const statusClass = computed(() => `status-${(props.data?.status || 'ready')}`)
const typeClass = computed(() => `type-${(props.data?.type || 'default')}`)
const isBranch = computed(() => props.data?.type === 'branch-node')
const isGroup = computed(() => props.data?.type === 'group-node')
</script>

<template>
  <div class="node-card" :class="[typeClass, statusClass, { selected }]">
    <div class="node-header">
      <h-icon :name="data?.icon || 'ri-apps-line'" class="node-icon" />
      <div class="node-title">
        {{ data?.title || '节点' }}
      </div>
      <div class="node-status">
        {{ (data?.status || 'Ready') }}
      </div>
      <div class="node-expander" @click="expanded = !expanded">
        {{ expanded ? '▾' : '▸' }}
      </div>
    </div>
    <div class="node-body">
      <div v-if="data?.description" class="node-desc">
        {{ data.description }}
      </div>
      <div v-if="data?.params" class="node-tags">
        <span v-for="(v, k, i) in data.params" v-show="i < 3" :key="k" class="tag">{{ k }}</span>
      </div>
      <div class="node-actions">
        <n-button size="tiny" type="primary" @click="$emit('run-node', id)">
          试跑
        </n-button>
        <n-button size="tiny" quaternary @click="$emit('view-logs', id)">
          日志
        </n-button>
      </div>
    </div>
    <!-- 句柄：普通节点顶部/底部；工作组左/右 -->
    <handle v-if="!isGroup" id="in" type="target" :position="Position.Top" />
    <handle v-if="!isGroup" id="out" type="source" :position="Position.Bottom" />
    <handle v-if="isGroup" id="in" type="target" :position="Position.Left" />
    <handle v-if="isGroup" id="out" type="source" :position="Position.Right" />
    <!-- 分支节点：右侧双出口（true/false） -->
    <handle v-if="isBranch" id="out-true" type="source" :position="Position.Right" :style="{ top: '25%' }" />
    <handle v-if="isBranch" id="out-false" type="source" :position="Position.Right" :style="{ top: '75%' }" />
  </div>
</template>

<style scoped>
.node-card {
  position: relative;
  min-width: 180px;
  max-width: 240px;
  padding: 10px 10px 14px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  background: linear-gradient(180deg, #ffffff 0%, #f9fafb 100%);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
  transition:
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}
.node-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  border-radius: 10px 0 0 10px;
  background: #eef2ff;
}
.status-running.node-card::before {
  background: #fde68a;
}
.status-done.node-card::before {
  background: #d1fae5;
}
.status-failed.node-card::before {
  background: #fecaca;
}

.node-card.type-group-node {
  min-width: 320px;
  max-width: unset;
  width: 100%;
  height: 100%;
  border: none;
  background: transparent;
  box-shadow: none;
}
.type-group-node .node-header {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 8px 10px;
}
.node-card.selected {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
}
.node-header {
  display: flex;
  align-items: center;
  gap: 8px;
}
.node-expander {
  cursor: pointer;
  font-size: 14px;
  color: #6b7280;
}
.node-icon {
  font-size: 16px;
  color: #6b7280;
}
.node-title {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}
.node-status {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 999px;
  background: #eef2ff;
  color: #4f46e5;
}
.node-body {
  margin-top: 8px;
}
.node-desc {
  font-size: 12px;
  color: #6b7280;
}
.node-tags {
  margin-top: 8px;
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.node-actions {
  display: flex;
  gap: 6px;
  opacity: 0;
  transition: opacity 0.2s ease;
  margin-top: 8px;
}
.node-card:hover .node-actions {
  opacity: 1;
}
.tag {
  font-size: 11px;
  color: #374151;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  padding: 2px 6px;
}
.type-input-node .node-header .node-icon {
  color: #059669;
}
.type-llm-node .node-header .node-icon {
  color: #2563eb;
}
.type-tool-node .node-header .node-icon {
  color: #7c3aed;
}
.type-branch-node .node-header .node-icon {
  color: #d97706;
}
.type-image-gen-node .node-header .node-icon {
  color: #db2777;
}
.type-output-node .node-header .node-icon {
  color: #10b981;
}
.status-ready .node-status {
  background: #eef2ff;
  color: #4f46e5;
}
.status-running .node-status {
  background: #fef3c7;
  color: #d97706;
}
.status-done .node-status {
  background: #d1fae5;
  color: #065f46;
}
.status-failed .node-status {
  background: #fee2e2;
  color: #b91c1c;
}
</style>
