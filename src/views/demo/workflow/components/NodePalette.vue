<template>
  <n-drawer :show="show" :width="320" placement="left" @update:show="emit('update:show', $event)">
    <n-drawer-content title="节点库">
      <div class="node-palette">
        <div v-for="(nodes, category) in nodesByCategory" :key="category" class="category">
          <div class="category-title">
            {{ category }}
          </div>
          <div class="node-list">
            <div
              v-for="nodeType in nodes"
              :key="nodeType.type"
              class="node-item"
              :style="{ borderLeftColor: nodeType.color }"
              @click="handleAddNode(nodeType.type)"
            >
              <h-icon :name="nodeType.icon" class="node-item-icon" :style="{ color: nodeType.color }" />
              <div class="node-item-info">
                <div class="node-item-label">
                  {{ nodeType.label }}
                </div>
                <div class="node-item-desc">
                  {{ nodeType.description }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </n-drawer-content>
  </n-drawer>
</template>

<script setup>
import { getNodesByCategory } from '../config/node-types'

defineProps({
  show: Boolean,
})

const emit = defineEmits(['update:show', 'addNode'])

const nodesByCategory = getNodesByCategory()

function handleAddNode(type) {
  emit('addNode', type)
  emit('update:show', false)
}
</script>

<style scoped>
.node-palette {
  padding: 8px 0;
}

.category {
  margin-bottom: 24px;
}

.category-title {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 12px;
  padding: 0 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.node-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.node-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border-left: 3px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.node-item:hover {
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transform: translateX(4px);
}

.node-item-icon {
  font-size: 20px;
  flex-shrink: 0;
  margin-top: 2px;
}

.node-item-info {
  flex: 1;
  min-width: 0;
}

.node-item-label {
  font-size: 14px;
  font-weight: 500;
  color: #111827;
  margin-bottom: 4px;
}

.node-item-desc {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.4;
}
</style>
