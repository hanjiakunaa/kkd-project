import { onMounted, ref, toRaw, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/store'
import { pageCacheDB } from '@/utils/storage/indexedDB'

/**
 * 页面数据缓存 composable
 * 使用 IndexedDB 来持久化页面数据
 *
 * @param {object} initData - 初始数据
 * @param {string} key - 缓存键，默认使用路由名称
 * @param {boolean} autoSave - 是否自动保存，默认从全局设置读取（可覆盖）
 * @returns {object} { cacheData, reset, save, load }
 */
export function usePageCache(initData = {}, key, autoSave) {
  const route = useRoute()
  const appStore = useAppStore()
  const cacheKey = key || route.name || route.path
  const cacheData = ref({ ...initData })
  const isLoaded = ref(false)
  let saveTimer = null

  // 如果用户传入了 autoSave 参数，使用该参数；否则使用全局设置
  const hasCustomAutoSave = autoSave !== undefined

  // 从 IndexedDB 加载数据
  async function load() {
    if (!pageCacheDB.isSupported()) {
      console.warn('[usePageCache] IndexedDB 不支持，使用内存缓存')
      isLoaded.value = true
      return
    }

    try {
      const savedData = await pageCacheDB.get(cacheKey)
      if (savedData) {
        // 合并保存的数据和初始数据，确保新增的字段也能使用
        cacheData.value = { ...initData, ...savedData }
      }
      isLoaded.value = true
    }
    catch (error) {
      console.error('[usePageCache] 加载数据失败:', error)
      isLoaded.value = true
    }
  }

  // 将响应式对象转换为可序列化的普通对象
  function serializeData(data) {
    try {
      // 使用 toRaw 获取原始对象，然后通过 JSON 序列化/反序列化来确保完全可序列化
      const rawData = toRaw(data)
      return JSON.parse(JSON.stringify(rawData))
    }
    catch (error) {
      console.warn('[usePageCache] 序列化数据失败，使用原始数据:', error)
      // 如果序列化失败，尝试直接返回原始对象
      return toRaw(data)
    }
  }

  // 保存数据到 IndexedDB
  async function save() {
    if (!pageCacheDB.isSupported()) {
      return
    }

    try {
      // 序列化数据以确保可以存储到 IndexedDB
      const serializedData = serializeData(cacheData.value)
      await pageCacheDB.set(cacheKey, serializedData)
    }
    catch (error) {
      console.error('[usePageCache] 保存数据失败:', error)
    }
  }

  // 重置数据
  async function reset() {
    cacheData.value = { ...initData }
    if (pageCacheDB.isSupported()) {
      try {
        await pageCacheDB.remove(cacheKey)
      }
      catch (error) {
        console.error('[usePageCache] 清除缓存失败:', error)
      }
    }
  }

  // 组件挂载时加载数据
  onMounted(() => {
    load()
  })

  // 自动保存：监听数据变化并保存（使用防抖，300ms 后保存）
  // 如果用户传入了 autoSave 参数，使用该参数；否则监听全局设置的变更
  watch(
    hasCustomAutoSave
      ? cacheData
      : [cacheData, () => appStore.pageCacheAutoSave],
    () => {
      // 确定是否应该自动保存
      const shouldSave = hasCustomAutoSave ? autoSave : appStore.pageCacheAutoSave

      // 只有在数据加载完成后且自动保存开启时才自动保存
      if (isLoaded.value && shouldSave) {
        // 清除之前的定时器
        if (saveTimer) {
          clearTimeout(saveTimer)
        }
        // 设置新的定时器，300ms 后保存
        saveTimer = setTimeout(() => {
          save()
        }, 300)
      }
    },
    { deep: true },
  )

  return {
    cacheData,
    isLoaded,
    load,
    save,
    reset,
  }
}
