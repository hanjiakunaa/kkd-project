<template>
  <common-page show-footer>
    <div w-350>
      <n-input v-model:value="cacheData.inputVal" />
      <n-input-number v-model:value="cacheData.number" mt-30 />
      <div mt-20 flex gap-10>
        <n-button @click="handleReset">
          重置缓存
        </n-button>
        <n-button @click="handleSave">
          手动保存
        </n-button>
      </div>
      <p mt-20 text-center text-14 color-gray>
        注：数据会自动保存到 IndexedDB，切换页面后返回数据会保留
      </p>
    </div>
  </common-page>
</template>

<script setup>
import { usePageCache } from '@/composables/usePageCache'

defineOptions({ name: 'BasePageCache' })

// 使用页面缓存，初始数据
const { cacheData, reset, save } = usePageCache({
  inputVal: '',
  number: 0,
})

// 重置缓存
function handleReset() {
  reset()
  $message.success('缓存已重置')
}

// 手动保存
function handleSave() {
  save()
  $message.success('数据已保存')
}
</script>
