<!-- 搜索头部组件 -->
<script setup>
import { NButton, NDatePicker, NIcon, NInput, NSelect, NTreeSelect } from 'naive-ui'

const props = defineProps({
  model: {
    type: Object,
    required: true,
  },
  fields: {
    type: Array,
    required: true,
  },
  gridCols: {
    type: Number,
    default: 3,
  },
  labelWidth: {
    type: Number,
    default: 110,
  },
})

const emit = defineEmits(['update:model', 'search', 'reset'])

const formRef = ref(null)

// 响应式列宽配置
const colSpan = {
  xs: 24, // 超小屏幕：1列
  s: 12, // 小屏幕：2列
  m: 8, // 中等屏幕：3列
  l: 7, // 大屏幕：保持原来的7列
  xl: 7, // 超大屏幕：保持原来的7列
}

// 是否展开搜索条件
const isExpanded = ref(false)

// 是否有多行搜索条件
const hasMultipleRows = computed(() => {
  return props.fields.length > props.gridCols
})

// 单行的高度（像素）
const rowHeight = 70

// 计算展开后的高度（基于行数）
const expandedHeight = computed(() => {
  const rowCount = Math.ceil(props.fields.length / props.gridCols)
  return rowHeight * rowCount
})

// 计算是否显示按钮组在最后一行
const showButtonsInLastRow = computed(() => {
  return isExpanded.value && hasMultipleRows.value
})

// 计算是否显示按钮组在第一行
const showButtonsInFirstRow = computed(() => {
  return !isExpanded.value || !hasMultipleRows.value
})

// 搜索栏高度样式
const formHeightStyle = computed(() => {
  if (!hasMultipleRows.value) {
    return {}
  }

  return {
    maxHeight: isExpanded.value ? `${expandedHeight.value}px` : `${rowHeight}px`,
    overflow: 'hidden',
  }
})

// 切换展开/收起状态
function toggleExpand() {
  isExpanded.value = !isExpanded.value
}

// 更新model值
function updateModel(key, value) {
  emit('update:model', { ...props.model, [key]: value })
}

// 重置表单
function handleReset() {
  formRef.value?.restoreValidation()
  // 创建一个新的对象，只保留分页相关的字段
  const resetModel = { ...props.model }
  // 遍历所有字段，将其他字段设置为 null
  props.fields.forEach((field) => {
    resetModel[field.code] = null
  })
  // 确保分页字段有正确的值
  resetModel.pageNumber = 1
  resetModel.pageSize = 10
  // 更新 model
  emit('update:model', resetModel)
  emit('reset')
}

// 搜索表单
function handleSearch() {
  emit('search')
}

// 渲染表单字段
function renderFormField(field) {
  const commonProps = {
    clearable: true,
    placeholder: field.placeholder || `请输入${field.name}`,
    style: field.style || { maxWidth: '400px', minWidth: '100px', width: '100%' },
  }

  switch (field.type) {
    case 'input':
      return h(NInput, {
        ...commonProps,
        value: props.model[field.code],
        onUpdateValue: val => updateModel(field.code, val),
      })
    case 'select':
      return h(NSelect, {
        ...commonProps,
        value: props.model[field.code],
        options: field.options || [],
        onUpdateValue: val => updateModel(field.code, val),
      })
    case 'treeSelect':
      return h(NTreeSelect, {
        ...commonProps,
        filterable: true,
        labelField: 'label',
        keyField: 'value',
        defaultExpandAll: field.treeSelectExpandAll ?? true,
        checkStrategy: 'child',
        value: props.model[field.code],
        options: field.options || [],
        onUpdateValue: val => updateModel(field.code, val),
      })
    case 'date':
      return h(NDatePicker, {
        ...commonProps,
        value: props.model[field.code],
        type: 'date',
        format: 'yyyy-MM-dd',
        valueFormat: 'yyyy-MM-dd',
        onUpdateValue: val => updateModel(field.code, val),
      })
    case 'datetime':
      return h(NDatePicker, {
        ...commonProps,
        value: props.model[field.code],
        type: 'datetime',
        format: 'yyyy-MM-dd HH:mm:ss',
        valueFormat: 'yyyy-MM-dd HH:mm:ss',
        onUpdateValue: val => updateModel(field.code, val),
      })
    case 'daterange':
      return h(NDatePicker, {
        ...commonProps,
        value: props.model[field.code],
        type: 'daterange',
        onUpdateValue: val => updateModel(field.code, val),
      })
    case 'datetimerange':
      return h(NDatePicker, {
        ...commonProps,
        value: props.model[field.code],
        type: 'datetimerange',
        onUpdateValue: val => updateModel(field.code, val),
      })
    default:
      return null
  }
}

// 计算按钮容器的响应式 span
function getButtonSpan(fieldsLength, gridCols) {
  const remainingCols = fieldsLength < gridCols ? 24 - (7 * fieldsLength) : 7
  return {
    xs: 24, // 超小屏幕：按钮独占一行
    s: 12, // 小屏幕
    m: remainingCols > 0 ? remainingCols : 8, // 中等屏幕
    l: remainingCols > 0 ? remainingCols : 7, // 大屏幕
    xl: remainingCols > 0 ? remainingCols : 7, // 超大屏幕
  }
}

// 计算最后一行按钮容器的响应式 span
function getButtonSpanForLastRow(fieldsLength, gridCols) {
  const remainder = fieldsLength % gridCols
  const remainingCols = remainder === 0 ? 7 : 24 - (7 * remainder)
  return {
    xs: 24, // 超小屏幕：按钮独占一行
    s: 12, // 小屏幕
    m: remainingCols > 0 ? remainingCols : 8, // 中等屏幕
    l: remainingCols > 0 ? remainingCols : 7, // 大屏幕
    xl: remainingCols > 0 ? remainingCols : 7, // 超大屏幕
  }
}

// 按钮组组件
function ButtonGroup() {
  return h('div', { style: { display: 'flex', alignItems: 'center', width: '100%', marginTop: '10px', flexWrap: 'wrap', gap: '8px' } }, [
    h('div', { style: { marginLeft: 'auto', display: 'flex', flexWrap: 'wrap', gap: '8px' } }, [
      h(NButton, {
        type: 'tertiary',
        class: 'reset-btn',
        onClick: handleReset,
      }, { default: () => '重置' }),
      h(NButton, {
        type: 'primary',
        class: 'search-btn',
        onClick: handleSearch,
      }, { default: () => '查询' }),
      hasMultipleRows.value
        ? h(NButton, {
            text: true,
            class: 'expand-button',
            onClick: toggleExpand,
          }, {
            default: () => [
              isExpanded.value ? '收起' : '展开',
              h(NIcon, { class: isExpanded.value ? 'expand-icon expanded' : 'expand-icon' }, {
                default: () => h('svg', { viewBox: '0 0 24 24' }, [
                  h('path', {
                    'd': 'M7 10L12 15L17 10',
                    'fill': 'none',
                    'stroke': 'currentColor',
                    'stroke-width': '2',
                    'stroke-linecap': 'round',
                    'stroke-linejoin': 'round',
                  }),
                ]),
              }),
            ],
          })
        : null,
    ]),
  ])
}
</script>

<template>
  <n-layout-header class="xl-n-layout-header">
    <n-form
      ref="formRef"
      class="xl-n-form"
      :class="{ 'is-expanded': isExpanded }"
      :style="formHeightStyle"
      :model="model"
      label-placement="left"
      :label-width="props.labelWidth"
    >
      <n-grid :cols="24" :x-gap="24" responsive="screen">
        <template v-for="(field, index) in fields" :key="field.code">
          <n-form-item-gi
            v-bind="colSpan"
            :label="`${field.name}:`"
            :path="field.code"
            :style="field.style"
            :class="{ 'hidden-field': !isExpanded && index >= props.gridCols }"
            style="margin-top: 10px"
          >
            <component :is="renderFormField(field)" />
          </n-form-item-gi>

          <!-- 在第一行末尾显示按钮（如果未展开或只有一行） -->
          <template v-if="index === props.gridCols - 1 && showButtonsInFirstRow">
            <n-form-item-gi
              v-bind="getButtonSpan(fields.length, props.gridCols)"
              class="button-container first-row-button-container"
            >
              <component :is="ButtonGroup" />
            </n-form-item-gi>
          </template>

          <!-- 在最后一行末尾显示按钮（如果展开且多行） -->
          <template v-if="index === (props.fields.length - 1) && showButtonsInLastRow">
            <n-form-item-gi
              v-bind="getButtonSpanForLastRow(fields.length, props.gridCols)"
              class="button-container last-row-button-container"
            >
              <component :is="ButtonGroup" />
            </n-form-item-gi>
          </template>
        </template>
        <!-- 当只有一行，显示重置和查询按钮 -->
        <template v-if="fields.length < props.gridCols">
          <n-form-item-gi
            v-bind="getButtonSpan(fields.length, props.gridCols)"
            class="button-container first-row-button-container"
          >
            <component :is="ButtonGroup" />
          </n-form-item-gi>
        </template>
      </n-grid>
    </n-form>
  </n-layout-header>
</template>

<style scoped lang="scss">
.xl-n-layout-header {
  background-color: #fff;
  padding: 0 10px 10px 10px;
  margin-bottom: 12px;
}

.xl-n-form {
  margin-top: 5px;
  margin-left: 10px;
}

// 按钮间距已通过 gap 控制，无需额外样式
.expand-btn {
  cursor: pointer;
}

.expand-button {
  position: relative;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 4px;

  &:hover {
    color: var(--primary-color);
    background-color: rgba(0, 0, 0, 0.04);
  }

  &:active {
    transform: scale(0.96);
  }
}

.expand-icon {
  transition: transform 0.6s cubic-bezier(0.34, 1.86, 0.64, 1);
  display: inline-block;
  margin-left: 4px;
  transform-origin: center;

  &.expanded {
    transform: rotate(180deg);
  }
}

.button-container {
  transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
  animation-fill-mode: both;
  min-width: 0; // 防止按钮被压缩
  display: flex;
  align-items: center;
}

.first-row-button-container {
  animation: none;
  opacity: 0;
  &:not(.v-enter-active) {
    animation: fadeInUp 0.3s ease-out 0.15s forwards;
  }
}

.last-row-button-container {
  animation: none;
  opacity: 0;
  &:not(.v-leave-active) {
    animation: fadeInDown 0.3s ease-out 0.2s forwards;
  }
}

.xl-n-form {
  position: relative;
  transition: all 0.5s cubic-bezier(0.17, 0.89, 0.24, 1.11);
  overflow: hidden;
  transform-origin: top center;
  will-change: max-height, transform, opacity;

  /* 基础样式 */
  box-shadow: 0 0 0 rgba(0, 0, 0, 0); /* 明确指定初始无阴影 */

  &.is-expanded {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    transition:
      all 0.5s cubic-bezier(0.17, 0.89, 0.24, 1.11),
      box-shadow 0.4s ease-in;
  }
}

.hidden-field {
  opacity: 0;
  transform: translateY(-8px);
  transition:
    opacity 0.45s ease-out,
    transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
}

.is-expanded .hidden-field {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;

  @for $i from 1 through 10 {
    &:nth-child(#{$i}) {
      transition-delay: #{0.05 * $i}s;
    }
  }
}

/* 向下淡入动画 - 用于展开时的最后一行按钮 */
@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-15px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 向上淡入动画 - 用于收起时的第一行按钮 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(15px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 向下淡出动画 */
@keyframes fadeOutDown {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(15px);
  }
}

/* 向上淡出动画 */
@keyframes fadeOutUp {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-15px);
  }
}

// 响应式样式
@media (max-width: 768px) {
  .xl-n-form {
    margin-left: 0;
  }

  .button-container {
    margin-top: 10px;

    :deep(.n-form-item-gi__content) {
      display: flex;
      justify-content: flex-end;
    }
  }
}

@media (max-width: 576px) {
  .xl-n-layout-header {
    padding: 0 5px 10px 5px;
  }

  .xl-n-form {
    margin-left: 0;
    margin-top: 0;
  }

  .button-container {
    margin-top: 15px;

    :deep(.n-form-item-gi__content) {
      justify-content: center;
    }
  }
}
</style>
