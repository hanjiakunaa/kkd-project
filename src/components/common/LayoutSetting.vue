<template>
  <div>
    <n-tooltip trigger="hover" placement="left">
      <template #trigger>
        <div id="layout-setting" class="f-c-c rounded-4 bg-primary p-8" @click="modalRef.open()">
          <i class="i-fe:settings cursor-pointer bg-white text-20" />
        </div>
      </template>
      系统设置
    </n-tooltip>

    <me-modal ref="modalRef" title="系统设置" :show-footer="false" width="600px">
      <div class="mb-12">
        <span class="font-bold">布局设置</span>
      </div>
      <n-space justify="space-between">
        <div class="flex-col cursor-pointer justify-center" @click="appStore.setLayout('simple')">
          <div class="flex">
            <n-skeleton :width="20" :height="60" />
            <div class="ml-4">
              <n-skeleton :width="80" :height="60" />
            </div>
          </div>
          <n-button
            class="mt-12"
            size="small"
            :type="appStore.layout === 'simple' ? 'primary' : ''"
            ghost
          >
            简约
          </n-button>
        </div>
        <div class="flex-col cursor-pointer justify-center" @click="appStore.setLayout('normal')">
          <div class="flex">
            <n-skeleton :width="20" :height="60" />
            <div class="ml-4">
              <n-skeleton :width="80" :height="10" />
              <n-skeleton class="mt-4" :width="80" :height="46" />
            </div>
          </div>
          <n-button
            class="mt-12"
            size="small"
            :type="appStore.layout === 'normal' ? 'primary' : ''"
            ghost
          >
            通用
          </n-button>
        </div>

        <div class="flex-col cursor-pointer justify-center" @click="appStore.setLayout('full')">
          <div class="flex">
            <n-skeleton :width="20" :height="60" />
            <div class="ml-4">
              <n-skeleton :width="80" :height="6" />
              <n-skeleton class="mt-4" :width="80" :height="4" />
              <n-skeleton class="mt-4" :width="80" :height="42" />
            </div>
          </div>
          <n-button
            class="mt-12"
            size="small"
            :type="appStore.layout === 'full' ? 'primary' : ''"
            ghost
          >
            全面
          </n-button>
        </div>
        <div class="flex-col cursor-pointer justify-center" @click="appStore.setLayout('empty')">
          <div class="flex">
            <n-skeleton :width="104" :height="60" />
          </div>
          <n-button
            class="mt-12"
            size="small"
            :type="appStore.layout === 'empty' ? 'primary' : ''"
            ghost
          >
            空白
          </n-button>
        </div>
      </n-space>
      <p class="mt-16 opacity-50">
        注: 此设置仅对未设置layout或者设置成跟随系统的页面有效，菜单设置的layout优先级最高
      </p>

      <n-divider />

      <div class="mb-12">
        <span class="font-bold">主题切换动画</span>
      </div>
      <n-space justify="center" :size="16">
        <div class="flex-col cursor-pointer items-center justify-center" @click="appStore.setThemeAnimationType('horizontal')">
          <div class="flex items-center justify-center" style="width: 70px; height: 60px;">
            <i class="i-fe:arrow-right text-28 text-primary" />
          </div>
          <n-button
            class="mt-6"
            size="small"
            :type="appStore.themeAnimationType === 'horizontal' ? 'primary' : ''"
            ghost
          >
            横切
          </n-button>
        </div>
        <div class="flex-col cursor-pointer items-center justify-center" @click="appStore.setThemeAnimationType('circle')">
          <div class="flex items-center justify-center" style="width: 70px; height: 60px;">
            <i class="i-fe:circle text-28 text-primary" />
          </div>
          <n-button
            class="mt-6"
            size="small"
            :type="appStore.themeAnimationType === 'circle' ? 'primary' : ''"
            ghost
          >
            圆形
          </n-button>
        </div>
        <div class="flex-col cursor-pointer items-center justify-center" @click="appStore.setThemeAnimationType('explode')">
          <div class="flex items-center justify-center" style="width: 70px; height: 60px;">
            <i class="i-fe:zap text-28 text-primary" />
          </div>
          <n-button
            class="mt-6"
            size="small"
            :type="appStore.themeAnimationType === 'explode' ? 'primary' : ''"
            ghost
          >
            爆炸
          </n-button>
        </div>
        <div class="flex-col cursor-pointer items-center justify-center" @click="appStore.setThemeAnimationType('corners')">
          <div class="flex items-center justify-center" style="width: 70px; height: 60px;">
            <i class="i-fe:maximize text-28 text-primary" />
          </div>
          <n-button
            class="mt-6"
            size="small"
            :type="appStore.themeAnimationType === 'corners' ? 'primary' : ''"
            ghost
          >
            四角
          </n-button>
        </div>
        <div class="flex-col cursor-pointer items-center justify-center" @click="appStore.setThemeAnimationType('diamond')">
          <div class="flex items-center justify-center" style="width: 70px; height: 60px;">
            <i class="i-fe:octagon text-28 text-primary" />
          </div>
          <n-button
            class="mt-6"
            size="small"
            :type="appStore.themeAnimationType === 'diamond' ? 'primary' : ''"
            ghost
          >
            菱形
          </n-button>
        </div>
        <div class="flex-col cursor-pointer items-center justify-center" @click="appStore.setThemeAnimationType('split')">
          <div class="flex items-center justify-center" style="width: 70px; height: 60px;">
            <i class="i-fe:git-commit text-28 text-primary" />
          </div>
          <n-button
            class="mt-6"
            size="small"
            :type="appStore.themeAnimationType === 'split' ? 'primary' : ''"
            ghost
          >
            分屏
          </n-button>
        </div>
      </n-space>

      <n-divider />

      <div class="mb-12">
        <span class="font-bold">页面缓存设置</span>
      </div>
      <n-space justify="space-between" align="center">
        <div>
          <div class="mb-4">
            自动保存页面数据
          </div>
          <div class="text-12 opacity-50">
            开启后，页面数据会自动保存到 IndexedDB，切换页面后返回数据会保留
          </div>
        </div>
        <n-switch :value="appStore.pageCacheAutoSave" @update:value="handleToggleAutoSave" />
      </n-space>
    </me-modal>
  </div>
</template>

<script setup>
import { NButton } from 'naive-ui'
import { MeModal } from '@/components'
import { useModal } from '@/composables'
import { useAppStore } from '@/store'
import { pageCacheDB } from '@/utils/storage/indexedDB'

const appStore = useAppStore()
const [modalRef] = useModal()

// 处理自动保存开关切换
function handleToggleAutoSave(newValue) {
  // 如果是从关闭切换到开启，直接切换
  if (newValue && !appStore.pageCacheAutoSave) {
    appStore.setPageCacheAutoSave(true)
    return
  }

  // 如果是从开启切换到关闭，弹出确认对话框
  if (!newValue && appStore.pageCacheAutoSave) {
    const dialogInstance = $dialog.warning({
      title: '切换自动缓存设置',
      content: '切换自动缓存设置时，是否需要清空已保存的缓存数据？',
      positiveText: '',
      negativeText: '',
      showIcon: true,
      action: () => {
        return h('div', { style: 'display: flex; justify-content: flex-end; gap: 12px;' }, [
          h(
            NButton,
            {
              type: 'error',
              onClick: async () => {
                try {
                  // 清空所有缓存数据
                  if (pageCacheDB.isSupported()) {
                    await pageCacheDB.clear()
                    $message.success('缓存数据已清空')
                  }
                  // 切换开关状态
                  appStore.setPageCacheAutoSave(false)
                  dialogInstance.destroy()
                }
                catch (error) {
                  console.error('清空缓存失败:', error)
                  $message.error('清空缓存失败')
                }
              },
            },
            { default: () => '确定（清空缓存）' },
          ),
          h(
            NButton,
            {
              type: 'warning',
              onClick: () => {
                // 只切换开关，不清空数据
                appStore.setPageCacheAutoSave(false)
                $message.info('已切换为手动缓存模式')
                dialogInstance.destroy()
              },
            },
            { default: () => '手动清除（仅切换）' },
          ),
          h(
            NButton,
            {
              type: 'default',
              onClick: () => {
                // 取消操作
                dialogInstance.destroy()
              },
            },
            { default: () => '取消' },
          ),
        ])
      },
    })
  }
}
</script>
