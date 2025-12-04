<template>
  <n-drawer :show="show" :width="720" placement="right" @update:show="$emit('update:show', $event)">
    <n-drawer-content title="工作流模板库">
      <div class="template-gallery">
        <!-- 分类标签 -->
        <n-tabs v-model:value="activeCategory" type="line" animated>
          <n-tab-pane
            v-for="category in categories"
            :key="category.value"
            :name="category.value"
            :tab="category.label"
          >
            <template #tab>
              <n-space align="center" :size="4">
                <h-icon :name="category.icon" :size="16" />
                <span>{{ category.label }}</span>
              </n-space>
            </template>
          </n-tab-pane>
        </n-tabs>

        <!-- 模板卡片列表 -->
        <div class="template-list">
          <n-empty
            v-if="filteredTemplates.length === 0"
            description="暂无模板"
            style="margin-top: 60px"
          />
          <n-card
            v-for="template in filteredTemplates"
            :key="template.id"
            hoverable
            class="template-card"
            @click="previewTemplate(template)"
          >
            <div class="card-header">
              <div class="card-icon">
                <!-- <h-icon :name="template.icon" :size="32" /> -->
              </div>
              <div class="card-info">
                <h3 class="card-title">
                  {{ template.name }}
                </h3>
                <p class="card-description">
                  {{ template.description }}
                </p>
              </div>
            </div>
            <div class="card-footer">
              <n-space :size="8">
                <n-tag :bordered="false" size="small" type="info">
                  {{ template.workflow.nodes.length }} 个节点
                </n-tag>
                <n-tag :bordered="false" size="small" type="success">
                  {{ template.workflow.edges.length }} 个连接
                </n-tag>
              </n-space>
              <n-button size="small" type="primary" @click.stop="loadTemplate(template)">
                使用模板
              </n-button>
            </div>
          </n-card>
        </div>
      </div>

      <!-- 模板预览弹窗 -->
      <n-modal
        v-model:show="previewOpen"
        preset="card"
        :style="{ width: '900px' }"
        :title="previewingTemplate?.name"
        size="huge"
      >
        <div v-if="previewingTemplate" class="template-preview">
          <n-space vertical :size="16">
            <div>
              <n-text strong>
                描述
              </n-text>
              <p>{{ previewingTemplate.description }}</p>
            </div>
            <div>
              <n-text strong>
                工作流结构
              </n-text>
              <div class="workflow-structure">
                <n-tag
                  v-for="node in previewingTemplate.workflow.nodes"
                  :key="node.id"
                  :bordered="false"
                  size="small"
                  style="margin: 4px"
                >
                  {{ node.data.label }}
                </n-tag>
              </div>
            </div>
            <div>
              <n-text strong>
                包含节点类型
              </n-text>
              <n-space :size="8" style="margin-top: 8px">
                <n-tag
                  v-for="type in getNodeTypes(previewingTemplate.workflow.nodes)"
                  :key="type"
                  type="info"
                  :bordered="false"
                  size="small"
                >
                  {{ type }}
                </n-tag>
              </n-space>
            </div>
          </n-space>
        </div>
        <template #footer>
          <n-space justify="end">
            <n-button @click="previewOpen = false">
              取消
            </n-button>
            <n-button type="primary" @click="loadTemplate(previewingTemplate)">
              使用此模板
            </n-button>
          </n-space>
        </template>
      </n-modal>
    </n-drawer-content>
  </n-drawer>
</template>

<script setup>
import { computed, ref } from 'vue'
import { TEMPLATE_CATEGORIES, WORKFLOW_TEMPLATES } from '../templates'

defineProps({
  show: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:show', 'loadTemplate'])

// 当前分类
const activeCategory = ref('all')

// 分类列表
const categories = TEMPLATE_CATEGORIES

// 筛选后的模板
const filteredTemplates = computed(() => {
  if (activeCategory.value === 'all') {
    return WORKFLOW_TEMPLATES
  }
  return WORKFLOW_TEMPLATES.filter(t => t.category === activeCategory.value)
})

// 预览相关
const previewOpen = ref(false)
const previewingTemplate = ref(null)

function previewTemplate(template) {
  previewingTemplate.value = template
  previewOpen.value = true
}

// 加载模板
function loadTemplate(template) {
  if (!template)
    return

  emit('loadTemplate', template)
  emit('update:show', false)
  previewOpen.value = false

  window.$message?.success(`已加载模板：${template.name}`)
}

// 获取节点类型
function getNodeTypes(nodes) {
  const types = new Set()
  nodes.forEach((node) => {
    const typeName = node.type || '未知'
    types.add(typeName)
  })
  return Array.from(types)
}
</script>

<style scoped>
.template-gallery {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.template-list {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
  padding: 4px;
}

.template-card {
  cursor: pointer;
  transition: all 0.3s ease;
}

.template-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.card-header {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.card-icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--n-color-target) 0%, var(--n-color-target-hover) 100%);
  border-radius: 8px;
  color: white;
}

.card-info {
  flex: 1;
  min-width: 0;
}

.card-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--n-text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-description {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--n-text-color-3);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid var(--n-border-color);
}

.template-preview {
  padding: 8px 0;
}

.workflow-structure {
  margin-top: 8px;
  padding: 12px;
  background: var(--n-color-modal);
  border-radius: 4px;
  border: 1px solid var(--n-border-color);
}

/* 响应式 */
@media (max-width: 768px) {
  .template-list {
    grid-template-columns: 1fr;
  }
}
</style>
