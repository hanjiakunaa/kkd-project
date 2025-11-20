<script setup>
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core'
import { computed, nextTick, onMounted, ref, useSlots, watch } from 'vue'
import ConfigFormItem from '@/components/config-form/config-form-item.vue'
import { useNaiveForm } from '@/composables'

defineOptions({
  name: 'SearchForm',
})

const props = defineProps({
  fields: {
    type: [Array, Function],
    required: true,
  },
  labelWidth: {
    type: Number,
    default: 0,
  },
  labelPlacement: {
    type: String,
    default: 'left',
  },
})

const emit = defineEmits(['reset', 'search'])

const [formRef, validate, restoreValidation] = useNaiveForm()
const activeBreakpoint = useBreakpoints(breakpointsTailwind).active()

const model = defineModel('model', { default: () => ({}), type: Object })

// 初始化所有字段，确保 model 中包含所有字段
function initializeFields() {
  const fields = generateFieldArr()
  let hasChanges = false
  
  fields.forEach((field) => {
    // 如果字段不存在，则初始化它
    if (!(field.key in model.value)) {
      const fieldType = field.type?.toLowerCase() || ''
      if (fieldType === 'input' || fieldType === 'inputnumber') {
        model.value[field.key] = ''
      }
      else {
        model.value[field.key] = null
      }
      hasChanges = true
    }
  })
  
  // 如果有变化，触发响应式更新
  if (hasChanges) {
    model.value = { ...model.value }
  }
}

// 监听 fields 变化，自动初始化新字段
watch(() => generateFieldArr(), initializeFields, { immediate: true, deep: true })

// 组件挂载时初始化字段
onMounted(() => {
  initializeFields()
})

const rules = computed(() => {
  return generateFieldArr().reduce(
    (acc, field) => {
      if (field.required) {
        acc[field.key] = [
          {
            required: true,
          },
        ]
      }
      if (field.rules) {
        Object.assign(acc[field.key], field.rules)
      }
      return acc
    },
    {},
  )
})

const isFold = ref(true)
function collapse() {
  isFold.value = !isFold.value
}

const slots = computed(() => {
  return useSlots()
})
function span(breakpoints) {
  switch (breakpoints) {
    case 'sm':
      return 24
    case 'md':
      return 12
    case 'lg':
      return 8
    case 'xl':
    case '2xl':
    case '3xl':
      return 6
    default:
      return 24
  }
}

const finalFields = computed(() => {
  if (isFold.value) {
    return generateFieldArr().slice(0, 24 / span(activeBreakpoint.value) - 1)
  }
  return generateFieldArr()
})

// 根据传入的 fields 生成 fields 数组
function generateFieldArr() {
  const fields = typeof props.fields === 'function' ? props.fields() : props.fields
  return fields
}

function collapseSpan(breakpoints) {
  const currentSpan = span(breakpoints)
  const sumSpan = finalFields.value.reduce((acc, cur) => {
    return cur.span ? acc + cur.span : acc + currentSpan
  }, 0)
  const finalSpan = 24 - (sumSpan % 24)
  return finalSpan
}

function showCollapse(breakpoints) {
  return props.fields.length >= 24 / span(breakpoints)
}
async function reset() {
  // 清除所有字段的值
  const fields = generateFieldArr()

  // 先直接设置每个字段的值为 null，确保响应式更新
  fields.forEach((field) => {
    // 使用 Vue 的响应式 API 确保属性被追踪
    if (!(field.key in model.value)) {
      // 如果属性不存在，需要先创建它
      model.value[field.key] = null
    }
    else {
      // 如果属性存在，直接设置为 null
      model.value[field.key] = null
    }
  })

  // 删除不在字段列表中的属性
  Object.keys(model.value).forEach((key) => {
    if (!fields.some(f => f.key === key)) {
      delete model.value[key]
    }
  })

  // 等待 DOM 更新
  await nextTick()

  // 根据字段类型设置不同的清除值
  // Input 类型使用空字符串，其他类型保持 null
  fields.forEach((field) => {
    const fieldType = field.type?.toLowerCase() || ''
    if (fieldType === 'input' || fieldType === 'inputnumber') {
      model.value[field.key] = ''
    }
  })

  // 再次等待 DOM 更新
  await nextTick()

  // 清除表单验证状态
  await restoreValidation()

  // 通知父组件重置完成
  emit('reset')
}

async function search() {
  await validate()
  emit('search')
}

const computedLabelWidth = computed(() => {
  if (props.labelWidth)
    return props.labelWidth
  return 80
})

// 获取字段的标签宽度，优先使用字段 props 中的 labelWidth
function getFieldLabelWidth(field) {
  if (field?.props?.labelWidth !== undefined) {
    return field.props.labelWidth
  }
  return computedLabelWidth.value
}
</script>

<template>
  <n-form
    ref="formRef"
    :model="model"
    :rules="rules"
    v-bind="$attrs"
    :label-width="computedLabelWidth"
    :label-placement="labelPlacement"
  >
    <n-grid responsive="screen" item-responsive>
      <n-form-item-gi
        v-for="field in finalFields"
        :key="field.key"
        :span="field.span || span(activeBreakpoint)"
        :label="field.label"
        :path="field.key"
        :label-width="getFieldLabelWidth(field)"
      >
        <config-form-item v-model:value="model[field.key]" :field="field" :model="model">
          <template v-for="name of Object.keys(slots)" #[name]="slotProps">
            <slot :name="name" v-bind="slotProps" />
          </template>
        </config-form-item>
      </n-form-item-gi>
      <n-form-item-gi :span="collapseSpan(activeBreakpoint)">
        <n-space class="w-full" justify="end" :wrap="false">
          <n-button @click="reset">
            重置
          </n-button>
          <n-button type="primary" @click="search">
            搜索
          </n-button>
          <div v-if="showCollapse(activeBreakpoint)" class="grid h-full place-items-center">
            <i
              class="text-icon i-fe:chevron-down cursor-pointer p-8 transition-500 !text-4xl hover:opacity-70"
              :class="[isFold ? '' : 'rotate-x-180']"
              @click="collapse"
            />
          </div>
        </n-space>
      </n-form-item-gi>
    </n-grid>
  </n-form>
</template>

<style scoped></style>
