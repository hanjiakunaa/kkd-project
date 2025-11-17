import { defineStore } from 'pinia'
import { useRouterStore } from './router'

export const useTabStore = defineStore('tab', {
  state: () => ({
    tabs: [],
    activeTab: '',
    reloading: false,
  }),
  getters: {
    activeIndex() {
      return this.tabs.findIndex(item => item.path === this.activeTab)
    },
  },
  actions: {
    async setActiveTab(path) {
      await nextTick() // tab栏dom更新完再设置激活，让tab栏定位到新增的tab上生效
      this.activeTab = path
    },
    setTabs(tabs) {
      this.tabs = tabs
    },
    addTab(tab = {}) {
      const findIndex = this.tabs.findIndex(item => item.path === tab.path)
      if (findIndex !== -1) {
        this.tabs.splice(findIndex, 1, tab)
      }
      else {
        this.setTabs([...this.tabs, tab])
      }
      this.setActiveTab(tab.path)
    },
    async reloadTab(path, useCache) {
      const findItem = this.tabs.find(item => item.path === path)
      if (!findItem)
        return
      // 清除缓存数据
      if (useCache && findItem.useCache) {
        const { pageCacheDB } = await import('@/utils/storage/indexedDB')
        const routeName = findItem.name
        if (routeName && pageCacheDB.isSupported()) {
          try {
            await pageCacheDB.remove(routeName)
          }
          catch (error) {
            console.error('[TabStore] 清除缓存失败:', error)
          }
        }
      }
      $loadingBar.start()
      this.reloading = true
      await nextTick()
      this.reloading = false
      setTimeout(() => {
        document.documentElement.scrollTo({ left: 0, top: 0 })
        $loadingBar.finish()
      }, 100)
    },
    async removeTab(path) {
      this.setTabs(this.tabs.filter(tab => tab.path !== path))
      if (path === this.activeTab) {
        useRouterStore().router?.push(this.tabs[this.tabs.length - 1].path)
      }
    },
    removeOther(curPath = this.activeTab) {
      this.setTabs(this.tabs.filter(tab => tab.path === curPath))
      if (curPath !== this.activeTab) {
        useRouterStore().router?.push(this.tabs[this.tabs.length - 1].path)
      }
    },
    removeLeft(curPath) {
      const curIndex = this.tabs.findIndex(item => item.path === curPath)
      const filterTabs = this.tabs.filter((item, index) => index >= curIndex)
      this.setTabs(filterTabs)
      if (!filterTabs.find(item => item.path === this.activeTab)) {
        useRouterStore().router?.push(filterTabs[filterTabs.length - 1].path)
      }
    },
    removeRight(curPath) {
      const curIndex = this.tabs.findIndex(item => item.path === curPath)
      const filterTabs = this.tabs.filter((item, index) => index <= curIndex)
      this.setTabs(filterTabs)
      if (!filterTabs.find(item => item.path === this.activeTab.value)) {
        useRouterStore().router?.push(filterTabs[filterTabs.length - 1].path)
      }
    },
    resetTabs() {
      this.$reset()
    },
  },
  persist: {
    pick: ['tabs'],
    storage: sessionStorage,
  },
})
