import { generate, getRgbStr } from '@arco-design/color'
import { useDark } from '@vueuse/core'
import { defineStore } from 'pinia'
import { defaultLayout, defaultPrimaryColor, naiveThemeOverrides } from '@/settings'

export const useAppStore = defineStore('app', {
  state: () => ({
    collapsed: false,
    isDark: useDark(),
    layout: defaultLayout,
    primaryColor: defaultPrimaryColor,
    naiveThemeOverrides,
    themeAnimationType: 'horizontal', // 'horizontal' 横切 or 'circle' 圆形扩散
  }),
  actions: {
    switchCollapsed() {
      this.collapsed = !this.collapsed
    },
    setCollapsed(b) {
      this.collapsed = b
    },
    toggleDark() {
      this.isDark = !this.isDark
    },
    setLayout(v) {
      this.layout = v
    },
    setPrimaryColor(color) {
      this.primaryColor = color
    },
    setThemeAnimationType(type) {
      this.themeAnimationType = type
    },
    setThemeColor(color = this.primaryColor, isDark = this.isDark) {
      const colors = generate(color, {
        list: true,
        dark: isDark,
      })
      document.body.style.setProperty('--primary-color', getRgbStr(colors[5]))
      this.naiveThemeOverrides.common = Object.assign(this.naiveThemeOverrides.common || {}, {
        primaryColor: colors[5],
        primaryColorHover: colors[4],
        primaryColorSuppl: colors[4],
        primaryColorPressed: colors[6],
      })
    },
  },
  persist: {
    pick: ['collapsed', 'layout', 'primaryColor', 'naiveThemeOverrides', 'themeAnimationType'],
    storage: sessionStorage,
  },
})
