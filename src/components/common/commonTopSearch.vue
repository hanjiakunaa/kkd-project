<script setup>
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core'
import { computed, ref, useSlots } from 'vue'
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
  await restoreValidation()
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
