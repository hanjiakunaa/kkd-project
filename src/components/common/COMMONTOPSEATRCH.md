## 组件概述

CommonTopSearch (SearchForm) 是一个用于配置搜索框的 Vue 3 组件，支持动态搜索框生成和响应式布局。

组件路径 `src/components/common/commonTopSearch.vue`

主要功能：

- 支持动态生成表单项（支持数组或函数形式）
- 支持响应式布局，根据屏幕断点自动调整每行显示的字段数
- 支持字段折叠功能，当字段数量超过一屏时自动显示折叠按钮
- 支持自定义表单组件插槽
- 支持表单验证规则配置
- 支持自定义字段栅格布局（span）

## 组件使用方式

以下是一个简单的示例，展示如何使用 CommonTopSearch 组件。

```vue
<template>
  <common-top-search
    v-model:model="searchParams"
    :fields="searchFields"
    :label-width="80"
    label-placement="left"
    @search="handleSearch"
    @reset="handleReset"
  >
    <template #customField="{ formModel, key }">
      <n-select v-model:value="formModel[key]" :options="options" />
    </template>
  </common-top-search>
</template>

<script setup>
import { CommonTopSearch } from '@/components'

const options = ref([
  {
    label: '选项1',
    value: '1'
  },
  {
    label: '选项2',
    value: '2'
  }
])

const searchParams = ref({
  name: '',
  status: '',
  code: ''
})

// 方式1：使用数组
const searchFields = [
  {
    key: 'name',
    label: '姓名',
    type: 'Input',
    placeholder: '请输入姓名',
    required: true
  },
  {
    key: 'code',
    label: '编号',
    type: 'Input',
    placeholder: '请输入编号',
    span: 12 // 自定义栅格数
  },
  {
    key: 'status',
    label: '状态',
    type: 'Select',
    slot: 'customField', // 使用自定义插槽
  }
]

// 方式2：使用函数（支持响应式）
const searchFields = computed(() => [
  {
    key: 'name',
    label: '姓名',
    type: 'Input',
    placeholder: '请输入姓名'
  },
  {
    key: 'status',
    label: '状态',
    type: 'Select',
    slot: 'customField',
  }
])

function handleSearch() {
  console.log('搜索参数:', searchParams.value)
}

function handleReset() {
  console.log('重置表单')
}
</script>
```

## CommonTopSearch Props

| 属性名         | 类型              | 必填 | 默认值 | 描述                                                |
| -------------- | ----------------- | ---- | ------ | --------------------------------------------------- |
| model          | Object            | 是   | 无     | 搜索参数对象，通过 `v-model:model` 绑定             |
| fields         | Array \| Function | 是   | 无     | 表单字段配置，可以是数组或返回数组的函数            |
| labelWidth     | Number            | 否   | 0      | label 的宽度，不传入时组件内部会自动判断（默认 80） |
| labelPlacement | String            | 否   | 'left' | label 的位置，可选值：'left' \| 'top'               |

**响应式布局说明：**

- 组件会根据屏幕断点自动调整每行显示的字段数
- sm: 每行 1 个字段（span: 24）
- md: 每行 2 个字段（span: 12）
- lg: 每行 3 个字段（span: 8）
- xl/2xl/3xl: 每行 4 个字段（span: 6）

**折叠功能：**

- 当字段数量超过一屏时，会自动显示折叠按钮
- 折叠状态下只显示部分字段，点击箭头可展开/收起

其他属性和 `n-form` 一致。

## fields 字段配置

fields 数组中的每个对象支持以下属性：

| 属性名   | 类型    | 必填 | 默认值 | 描述                                                 |
| -------- | ------- | ---- | ------ | ---------------------------------------------------- |
| key      | String  | 是   | 无     | 表单字段的 key，对应 model 中的属性名                |
| label    | String  | 否   | 无     | 表单字段的 label（标签文本）                         |
| span     | Number  | 否   | 自动   | 字段占用的栅格数（1-24），不传则根据屏幕断点自动计算 |
| required | Boolean | 否   | false  | 是否必填，为 true 时会自动添加必填验证规则           |
| rules    | Array   | 否   | 无     | 自定义验证规则数组，会合并到必填规则中               |
| slot     | String  | 否   | 无     | 自定义插槽名称，用于使用自定义组件                   |
| type     | String  | 否   | 无     | 字段类型，会传递给 `config-form-item` 组件           |
| props    | Object  | 否   | 无     | 组件属性，会传递给 `config-form-item` 组件           |
| options  | Array   | 否   | 无     | 选项数组（用于 Select 等组件）                       |
| ...其他  | Any     | 否   | 无     | 其他属性会传递给 `config-form-item` 组件             |

**注意：** 字段配置会传递给 `config-form-item` 组件，具体支持的字段类型和属性请参考 `config-form-item` 组件的文档。

## 事件

| 事件名 | 参数       | 描述                                 |
| ------ | ---------- | ------------------------------------ |
| search | () => void | 点击搜索按钮时触发，会先进行表单验证 |
| reset  | () => void | 点击重置按钮时触发，会清空验证状态   |

## 插槽

组件支持通过 `slot` 属性使用自定义插槽来渲染字段。插槽名称对应 fields 配置中的 `slot` 属性值。

插槽参数：

- `formModel`: 表单数据对象
- `key`: 当前字段的 key
- `field`: 当前字段的完整配置对象

示例：

```vue
<common-top-search v-model:model="model" :fields="fields">
  <template #customField="{ formModel, key, field }">
    <n-select v-model:value="formModel[key]" :options="options" />
  </template>
</common-top-search>
```

## 响应式布局说明

组件使用 `n-grid` 实现响应式布局，会根据屏幕宽度自动调整：

- **sm** (< 640px): 每行 1 个字段，span = 24
- **md** (≥ 640px): 每行 2 个字段，span = 12
- **lg** (≥ 1024px): 每行 3 个字段，span = 8
- **xl/2xl/3xl** (≥ 1280px): 每行 4 个字段，span = 6

可以通过字段配置中的 `span` 属性自定义单个字段的栅格数。

## 注意事项

1. `fields` 可以是数组或返回数组的函数（computed），使用函数形式可以支持响应式更新
2. 当字段数量超过一屏时，会自动显示折叠按钮，折叠状态下只显示部分字段
3. 搜索按钮会先进行表单验证，只有验证通过后才会触发 `search` 事件
4. 重置按钮会清空表单验证状态，但不会清空表单数据（需要手动处理）
5. 组件内部使用 `config-form-item` 组件来渲染字段，具体支持的字段类型请参考该组件文档
6. 具体使用方式可以参考项目中的实际使用示例：`src/views/base/top-search.vue`
