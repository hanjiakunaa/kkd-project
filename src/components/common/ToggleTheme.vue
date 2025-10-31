<template>
  <i
    id="toggleTheme"
    class="mr-16 cursor-pointer"
    :class="isDark ? 'i-fe:moon' : 'i-fe:sun'"
    @click="toggleDark"
  />
</template>

<script setup>
import { useDark, useToggle } from '@vueuse/core'
import { useAppStore } from '@/store'

const appStore = useAppStore()
const isDark = useDark()
async function toggleDark({ clientX, clientY }) {
  function handler() {
    appStore.toggleDark()
    useToggle(isDark)()
  }

  if (!document.startViewTransition) {
    return handler()
  }

  // 横切剪裁路径裁剪动画
  const width = window.innerWidth
  const height = window.innerHeight
  const buffer = width * 0.1
  const clipPaths = [
    `path('M ${-width} 0 L 0,0 L ${-buffer},${height} L ${-width - buffer * 2},${height}')`,
    `path('M 0 0 L ${width + buffer},0 L ${width},${height} L ${-buffer},${height}')`,
  ]
  // elementUI 风格的圆形扩散剪裁动画
  // const clipPaths = [
  //   `circle(0px at ${clientX}px ${clientY}px)`,
  //   `circle(${Math.hypot(
  //     Math.max(clientX, window.innerWidth - clientX),
  //     Math.max(clientY, window.innerHeight - clientY),
  //   )}px at ${clientX}px ${clientY}px)`,
  // ]

  await document.startViewTransition(handler).ready

  document.documentElement.animate(
    { clipPath: isDark.value ? clipPaths.reverse() : clipPaths },
    {
      duration: 500,
      easing: 'ease-in',
      pseudoElement: `::view-transition-${isDark.value ? 'old' : 'new'}(root)`,
      fill: 'both',
    },
  )
}
</script>
