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

  // 根据全局设置选择动画类型
  const width = window.innerWidth
  const height = window.innerHeight
  let clipPaths

  if (appStore.themeAnimationType === 'circle') {
    // elementUI 风格的圆形扩散剪裁动画
    clipPaths = [
      `circle(0px at ${clientX}px ${clientY}px)`,
      `circle(${Math.hypot(
        Math.max(clientX, window.innerWidth - clientX),
        Math.max(clientY, window.innerHeight - clientY),
      )}px at ${clientX}px ${clientY}px)`,
    ]
  }
  else if (appStore.themeAnimationType === 'explode') {
    // 爆炸式扩散动画 - 从屏幕中心快速爆炸
    const centerX = width / 2
    const centerY = height / 2
    const maxRadius = Math.hypot(centerX, centerY) * 2
    clipPaths = [
      `circle(0px at ${centerX}px ${centerY}px)`,
      `circle(${maxRadius}px at ${centerX}px ${centerY}px)`,
    ]
  }
  else if (appStore.themeAnimationType === 'corners') {
    // 四角聚合 - 从四个角向中心聚合
    clipPaths = [
      `polygon(0 0, 0 0, ${width}px 0, ${width}px 0, ${width}px ${height}px, ${width}px ${height}px, 0 ${height}px, 0 ${height}px)`,
      `polygon(0 0, ${width}px 0, ${width}px 0, ${width}px ${height}px, ${width}px ${height}px, 0 ${height}px, 0 ${height}px, 0 0)`,
    ]
  }
  else if (appStore.themeAnimationType === 'diamond') {
    // 菱形扩散 - 旋转的菱形扩散
    const centerX = width / 2
    const centerY = height / 2
    clipPaths = [
      `polygon(${centerX}px ${centerY}px, ${centerX}px ${centerY}px, ${centerX}px ${centerY}px, ${centerX}px ${centerY}px)`,
      `polygon(${centerX}px 0, ${width}px ${centerY}px, ${centerX}px ${height}px, 0 ${centerY}px)`,
    ]
  }
  else if (appStore.themeAnimationType === 'split') {
    // 分屏滑动 - 从中间向两侧滑动
    const centerX = width / 2
    clipPaths = [
      `polygon(${centerX}px 0, ${centerX}px 0, ${centerX}px ${height}px, ${centerX}px ${height}px)`,
      `polygon(0 0, ${width}px 0, ${width}px ${height}px, 0 ${height}px)`,
    ]
  }
  else {
    // 横切剪裁路径裁剪动画
    const buffer = width * 0.1
    clipPaths = [
      `path('M ${-width} 0 L 0,0 L ${-buffer},${height} L ${-width - buffer * 2},${height}')`,
      `path('M 0 0 L ${width + buffer},0 L ${width},${height} L ${-buffer},${height}')`,
    ]
  }

  await document.startViewTransition(handler).ready

  // 根据不同动画类型设置不同的动画参数
  let animationConfig = {
    duration: 500,
    easing: 'ease-in',
  }

  if (appStore.themeAnimationType === 'explode') {
    // 爆炸效果：更快速、更有冲击力
    animationConfig = {
      duration: 600,
      easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // 弹性缓动
    }
  }
  else if (appStore.themeAnimationType === 'corners') {
    // 四角聚合：平滑聚合
    animationConfig = {
      duration: 800,
      easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', // 回弹效果
    }
  }
  else if (appStore.themeAnimationType === 'diamond') {
    // 菱形扩散：旋转扩散
    animationConfig = {
      duration: 650,
      easing: 'cubic-bezier(0.17, 0.67, 0.83, 0.67)', // 平滑旋转
    }
  }
  else if (appStore.themeAnimationType === 'split') {
    // 分屏滑动：快速分离
    animationConfig = {
      duration: 550,
      easing: 'cubic-bezier(0.76, 0, 0.24, 1)', // 快速缓动
    }
  }
  else if (appStore.themeAnimationType === 'circle') {
    // 圆形扩散：自然扩散
    animationConfig = {
      duration: 500,
      easing: 'ease-out',
    }
  }

  document.documentElement.animate(
    { clipPath: isDark.value ? clipPaths.reverse() : clipPaths },
    {
      ...animationConfig,
      pseudoElement: `::view-transition-${isDark.value ? 'old' : 'new'}(root)`,
      fill: 'both',
    },
  )
}
</script>
