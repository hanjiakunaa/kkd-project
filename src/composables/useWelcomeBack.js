import { useDocumentVisibility, useWindowFocus } from '@vueuse/core'
import { computed, ref, watch } from 'vue'

export function useWelcomeBack() {
  const focused = useWindowFocus()
  const visibility = useDocumentVisibility()
  const leaveTime = ref(0)

  // 只有当既可见又有焦点时，才认为是在活跃状态
  // 并排窗口时：visible 但 !focused -> 视为离开
  // 最小化/切Tab时：hidden 且 !focused -> 视为离开
  const isActive = computed(() => focused.value && visibility.value === 'visible')

  watch(isActive, (val) => {
    if (!val) {
      // 离开状态：记录时间
      leaveTime.value = Date.now()
    }
    else {
      // 回来状态：检查离开时长
      if (leaveTime.value > 0) {
        const timeSinceLeft = Date.now() - leaveTime.value
        // 将阈值调整为 3.5秒 (3500ms)，方便测试
        if (timeSinceLeft > 3500) {
          window.$notificationBottomLeft?.success({
            content: '欢迎回来 👋',
            meta: '很高兴再次见到你',
            duration: 3000,
          })
        }
      }
    }
  })
}
