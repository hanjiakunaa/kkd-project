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
// key: string - 字段的 key，对应 model 中的属性名
// label: string - 字段的标签文本
// type: string - 字段类型，会传递给 config-form-item 组件
// placeholder?: string - 占位符
// options?: any[] - 选项数组（用于 Select、TreeSelect 等组件）
// props?: object - 组件属性，会传递给 config-form-item 组件
// span?: number - 字段占用的栅格数（1-24），不传则根据屏幕断点自动计算

const searchFields = computed(() => [
  {
    key: 'name',
    label: '姓名',
    type: 'input',
    placeholder: '支持模糊查询',
  },
  {
    key: 'code',
    label: '编号',
    type: 'input',
    placeholder: '支持模糊查询',
  },
  {
    key: 'dept',
    label: '所属部门',
    type: 'treeSelect',
    options: departmentOptions.value,
    placeholder: '请选择所属部门',
    props: {
      expandAll: true,
    },
  },
  {
    key: 'createTimeRange',
    label: '创建时间',
    type: 'datetimerange',
  },

  {
    key: 'status',
    label: '状态',
    type: 'select',
    options: [
      {
        label: '启用',
        value: '1',
      },
    ],
  },
])

const model = ref({})

function searchForm() {
  // 在这里执行搜索逻辑
  // 搜索参数: model.value
  console.warn('搜索参数:', model.value)
}

function resetForm() {
  // 重置表单数据
  model.value = {}
  console.warn('重置表单')
}
</script>

<style scoped>
</style>
