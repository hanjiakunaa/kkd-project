<template>
  <div>
    <n-tooltip trigger="hover" placement="left">
      <template #trigger>
        <div id="layout-setting" class="f-c-c rounded-4 bg-primary p-8" @click="modalRef.open()">
          <i class="i-fe:settings cursor-pointer bg-white text-20" />
        </div>
      </template>
      布局设置
    </n-tooltip>

    <MeModal ref="modalRef" title="布局设置" :show-footer="false" width="600px">
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
    </MeModal>
  </div>
</template>

<script setup>
import { MeModal } from '@/components'
import { useModal } from '@/composables'
import { useAppStore } from '@/store'

const appStore = useAppStore()
const [modalRef] = useModal()
</script>
