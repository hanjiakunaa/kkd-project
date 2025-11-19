<script setup>
import { computed } from 'vue'
import { componentMap, optionsComponentMap } from './component-map.js'
import ConfigFormItemOptions from './config-form-item-options.vue'

defineOptions({ name: 'ConfigFormItem' })

const props = defineProps({
  field: {
    type: Object,
    required: true,
  },
  model: {
    type: Object,
    required: true,
  },
})

const value = defineModel('value')

function getComponent(type) {
  if (!type) {
    throw new Error('Component type is required')
  }
  // 处理特殊类型：datetimerange, daterange, datetime 等
  let normalizedType = type
  if (type.toLowerCase() === 'datetimerange') {
    normalizedType = 'DateTimerange'
  }
  else if (type.toLowerCase() === 'daterange') {
    normalizedType = 'Daterange'
  }
  else if (type.toLowerCase() === 'datetime') {
    normalizedType = 'DateTime'
  }
  else {
    // 将类型转换为首字母大写，以匹配 componentMap 中的键
    normalizedType = type.charAt(0).toUpperCase() + type.slice(1)
  }
  if (!componentMap[normalizedType]) {
    throw new Error(`Component ${type} is not found`)
  }
  return componentMap[normalizedType]
}

function getOptionsComponent(type) {
  // 将类型转换为首字母大写，以匹配 optionsComponentMap 中的键
  const normalizedType = type ? type.charAt(0).toUpperCase() + type.slice(1) : type
  const comp = optionsComponentMap[normalizedType]
  return comp
}

function getComponentProps(componentProps) {
  const resultProps = {}

  // 合并 field 上的直接属性（options, placeholder 等）
  if (props.field.options !== undefined) {
    resultProps.options = props.field.options
  }
  if (props.field.placeholder !== undefined) {
    resultProps.placeholder = props.field.placeholder
  }

  // 合并 field.props 中的属性
  if (componentProps) {
    Object.keys(componentProps).forEach((key) => {
      if (!/^on[A-Z]/.test(key)) {
        resultProps[key] = componentProps[key]
      }
    })
  }

  // 处理 expandAll -> default-expand-all 的转换（TreeSelect 使用）
  if (resultProps.expandAll !== undefined) {
    resultProps['default-expand-all'] = resultProps.expandAll
    delete resultProps.expandAll
  }

  // 为 TreeSelect 和日期相关类型自动添加属性
  const fieldType = props.field?.type || ''

  // 为 TreeSelect 组件自动添加 label-field 和 key-field（如果未指定）
  if (fieldType.toLowerCase() === 'treeselect' || fieldType.toLowerCase() === 'treesel') {
    if (!resultProps['label-field'] && !resultProps.labelField) {
      resultProps['label-field'] = 'label'
    }
    if (!resultProps['key-field'] && !resultProps.keyField) {
      resultProps['key-field'] = 'value'
    }
  }

  // 为日期相关类型自动添加 type 属性
  if (fieldType.toLowerCase() === 'datetimerange' && !resultProps.type) {
    resultProps.type = 'datetimerange'
  }
  else if (fieldType.toLowerCase() === 'daterange' && !resultProps.type) {
    resultProps.type = 'daterange'
  }
  else if (fieldType.toLowerCase() === 'datetime' && !resultProps.type) {
    resultProps.type = 'datetime'
  }

  return resultProps
}

function getDisabled(field) {
  const { disabled } = field
  if (typeof disabled === 'function') {
    return disabled(props.model)
  }

  return disabled
}

/** 表单组件事件 */
function componentEvents(componentProps) {
  if (!componentProps)
    return {}
  return Object.keys(componentProps).reduce((prev, key) => {
    if (/^on[A-Z]/.test(key)) {
      // e.g: onChange => change
      const eventKey = key.replace(/^on([A-Z])/, '$1').toLocaleLowerCase()
      prev[eventKey] = componentProps[key]
    }
    return prev
  }, {})
}

const getValue = computed(() => {
  const { model, field } = props
  return {
    formModel: model,
    key: field.key,
    field,
  }
})
</script>

<template>
  <slot v-if="field.slot" :name="field.slot" v-bind="getValue" />
  <component
    :is="getComponent(field.type)"
    v-else
    v-bind="getComponentProps(field.props)"
    v-model:value="value"
    clearable
    :disabled="getDisabled(field)"
    v-on="componentEvents(field.props)"
  >
    <!-- 部分组件 如 RadioGroup 不能通过传入 Options 来渲染这里特殊处理 -->
    <config-form-item-options
      v-if="getOptionsComponent(field.type) && field.options"
      :options="field.options"
      :component-id="getOptionsComponent(field.type)"
    />
  </component>
</template>
