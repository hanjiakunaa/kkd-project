<template>
  <common-page title="头部搜索">
    <common-top-search
      v-model:model="model"
      :fields="searchFields"
      @search="searchForm"
      @reset="resetForm"
    />
  </common-page>
</template>

<script setup>
import { CommonTopSearch } from '@/components'

const departmentOptions = ref([
  {
    label: '部门1',
    value: '1',
    children: [
      {
        label: '部门1-1',
        value: '1-1',
      },
    ],
  },
  {
    label: '部门2',
    value: '2',
  },
  {
    label: '部门3',
    value: '3',
  },
])
// 搜索字段配置

// name: string // 字段名称
// type: 'input' | 'select' | 'date' | 'daterange' | 'treeSelect' | 'datetimerange' | 'datetime' // 字段类型
// code: string // 字段编码
// options?: any[] // 选项（用于select类型）
// placeholder?: string // 占位符
// style?: Record<string, string> // 样式
// treeSelectExpandAll?: boolean | null // 树形下拉框是否默认全部展开

const searchFields = computed(() => [
  {
    name: '姓名',
    type: 'input',
    code: 'name',
    placeholder: '支持模糊查询',
  },
  {
    name: '编号',
    type: 'input',
    code: 'code',
    placeholder: '支持模糊查询',
  },
  {
    name: '所属部门',
    type: 'treeSelect',
    code: 'dept',
    treeSelectExpandAll: true,
    options: departmentOptions.value,
    placeholder: '请选择所属部门',
  },
  {
    name: '创建时间',
    type: 'datetimerange',
    code: 'createTimeRange',
  },
])

const model = ref({})

function searchForm() {
  console.log(model.value)
}

function resetForm() {
  console.log(model.value)
}
</script>

<style scoped>
</style>
