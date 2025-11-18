<template>
  <n-config-provider
    class="wh-full"
    :locale="zhCN"
    :date-locale="dateZhCN"
    :theme="appStore.isDark ? darkTheme : undefined"
    :theme-overrides="appStore.naiveThemeOverrides"
  >
    <n-notification-provider>
      <router-view v-if="Layout" v-slot="{ Component, route: curRoute }">
        <component :is="Layout">
          <transition name="fade-slide" mode="out-in" appear>
            <component
              :is="Component"
              v-if="!tabStore.reloading"
              :key="curRoute.fullPath"
            />
          </transition>
        </component>

        <layout-setting
          v-if="layoutSettingVisible && !hideLayoutTools"
          class="fixed right-12 top-1/2 z-999"
        />
        <layout-view-source-code
          v-if="layoutViewSourceCodeVisible && !hideLayoutTools"
          class="fixed right-12 top-1/2.3 z-999"
        />
      </router-view>
    </n-notification-provider>
  </n-config-provider>
</template>

<script setup>
import { darkTheme, dateZhCN, zhCN } from 'naive-ui'
import { LayoutSetting, LayoutViewSourceCode } from '@/components'
import { useAppStore, useTabStore } from '@/store'
import { layoutSettingVisible, layoutViewSourceCodeVisible } from './settings'

const layouts = new Map()
function getLayout(name) {
  // 利用map将加载过的layout缓存起来，防止重新加载layout导致页面闪烁
  if (layouts.get(name))
    return layouts.get(name)
  const layout = markRaw(
    defineAsyncComponent(() => import(`@/layouts/${name}/index.vue`)),
  )
  layouts.set(name, layout)
  return layout
}

const route = useRoute()
const appStore = useAppStore()
if (appStore.layout === 'default')
  appStore.setLayout('')
const Layout = computed(() => {
  if (!route.matched?.length)
    return null
  return getLayout(route.meta?.layout || appStore.layout)
})

const tabStore = useTabStore()

// 判断是否隐藏布局工具
const hideLayoutTools = computed(() => {
  if (!route.name)
    return route.path === '/login'
  return route.name === 'Login'
})

watchEffect(() => {
  appStore.setThemeColor(appStore.primaryColor, appStore.isDark)
})
</script>
