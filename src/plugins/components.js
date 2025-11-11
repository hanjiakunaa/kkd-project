import * as CommonComponents from '@/components/common'

/**
 * 注册全局通用组件
 */
export const setupGlobalComponents = {
  install: (app) => {
    // 注册所有 common 组件为全局组件
    Object.keys(CommonComponents).forEach((key) => {
      const component = CommonComponents[key]
      if (component && component.name) {
        app.component(component.name, component)
      }
      // 使用 kebab-case 命名方式也注册一次
      const kebabName = key.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '')
      app.component(kebabName, component)
    })
  },
}
