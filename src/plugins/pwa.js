import { useRegisterSW } from 'virtual:pwa-register/vue'

export function setupPwa() {
  const { needRefresh, offlineReady, updateServiceWorker } = useRegisterSW({ immediate: true })

  watch(needRefresh, (v) => {
    if (v) {
      window.$dialog.confirm({
        type: 'info',
        title: '有新版本可用',
        content: '检测到新内容，是否立即更新？',
        confirm: () => updateServiceWorker(),
      })
    }
  })

  watch(offlineReady, (v) => {
    if (v) {
      window.$notification.success({
        title: '离线就绪',
        content: '当前版本已缓存，可离线访问',
        duration: 3000,
      })
    }
  })
}
