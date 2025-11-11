<template>
  <n-menu
    ref="menu"
    class="side-menu"
    accordion
    :indent="18"
    :collapsed-icon-size="22"
    :collapsed-width="64"
    :collapsed="appStore.collapsed"
    :options="permissionStore.menus"
    :value="activeKey"
    @update:value="handleMenuSelect"
  />
</template>

<script setup>
import { useAppStore, usePermissionStore } from '@/store'
import { isExternal } from '@/utils'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()
const permissionStore = usePermissionStore()

const activeKey = computed(() => route.meta?.parentKey || route.name)

const menu = ref(null)
watch(route, async () => {
  await nextTick()
  menu.value?.showOption()
})

function handleMenuSelect(key, item) {
  if (isExternal(item.originPath)) {
    $dialog.confirm({
      type: 'info',
      title: `请选择打开方式`,
      positiveText: '外链打开',
      negativeText: '在本站内嵌打开',
      confirm() {
        window.open(item.originPath)
      },
      cancel: () => {
        router.push(item.path)
      },
    })
  }
  else {
    if (!item.path)
      return
    router.push(item.path)
  }
}
</script>

<style lang="scss" scoped>
.side-menu {
  /* 确保菜单图标和文字垂直居中对齐 */
  .n-menu-item-content__icon {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .n-menu-item-content {
    display: flex !important;
    align-items: center !important;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 8px;
    margin: 4px 8px;
    position: relative;
    overflow: hidden;
  }

  /* 悬浮效果 */
  .n-menu-item-content:hover {
    background: linear-gradient(
      90deg,
      rgba(var(--primary-color), 0.1) 0%,
      rgba(var(--primary-color), 0.05) 100%
    ) !important;
    transform: translateX(4px);
    box-shadow: 0 4px 12px rgba(var(--primary-color), 0.15);
  }

  .n-menu-item-content:hover .n-menu-item-content__icon {
    transform: scale(1.1) rotate(5deg);
  }

  /* 激活状态的炫酷效果 */
  .n-menu-item-content--selected {
    background: linear-gradient(
      90deg,
      rgba(var(--primary-color), 0.15) 0%,
      rgba(var(--primary-color), 0.08) 100%
    ) !important;
    font-weight: 600;
    position: relative;
  }

  .n-menu-item-content--selected::after {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 4px;
    height: 60%;
    background: linear-gradient(180deg, rgb(var(--primary-color)) 0%, rgba(var(--primary-color), 0.6) 100%);
    border-radius: 0 4px 4px 0;
    box-shadow: 0 0 12px rgba(var(--primary-color), 0.6);
  }

  .n-menu-item-content--selected .n-menu-item-content__icon {
    color: rgb(var(--primary-color));
    filter: drop-shadow(0 0 8px rgba(var(--primary-color), 0.4));
  }

  /* 子菜单样式 */
  .n-menu-item-content--child-active {
    background: rgba(var(--primary-color), 0.05) !important;
  }
}

.side-menu:not(.n-menu--collapsed) {
  .n-menu-item-content {
    &::before {
      display: none;
    }
  }
}

/* 折叠状态下的样式 */
.side-menu.n-menu--collapsed {
  .n-menu-item-content {
    justify-content: center;
    padding-inline: 0 !important;
    margin: 8px 4px;
  }

  .n-menu-item-content__icon {
    margin: 0 !important;
  }

  .n-menu-item-content:hover {
    transform: scale(1.05);
  }
}
</style>
