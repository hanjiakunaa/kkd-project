<template>
  <div id="top-tab">
    <n-tabs
      :value="tabStore.activeTab"
      :closable="tabStore.tabs.length > 1"
      type="card"
      @close="(path) => tabStore.removeTab(path)"
    >
      <n-tab
        v-for="item in tabStore.tabs"
        :key="item.path"
        :name="item.path"
        @click="handleItemClick(item.path)"
        @contextmenu.prevent="handleContextMenu($event, item)"
      >
        {{ item.title }}
      </n-tab>
    </n-tabs>

    <ContextMenu
      v-if="contextMenuOption.show"
      v-model:show="contextMenuOption.show"
      :current-path="contextMenuOption.currentPath"
      :x="contextMenuOption.x"
      :y="contextMenuOption.y"
    />
  </div>
</template>

<script setup>
import { useTabStore } from '@/store'
import ContextMenu from './ContextMenu.vue'

const router = useRouter()
const tabStore = useTabStore()

const contextMenuOption = reactive({
  show: false,
  x: 0,
  y: 0,
  currentPath: '',
})

function handleItemClick(path) {
  tabStore.setActiveTab(path)
  router.push(path)
}

function showContextMenu() {
  contextMenuOption.show = true
}
function hideContextMenu() {
  contextMenuOption.show = false
}
function setContextMenu(x, y, currentPath) {
  Object.assign(contextMenuOption, { x, y, currentPath })
}

// 右击菜单
async function handleContextMenu(e, tagItem) {
  const { clientX, clientY } = e
  hideContextMenu()
  setContextMenu(clientX, clientY, tagItem.path)
  await nextTick()
  showContextMenu()
}
</script>

<style scoped>
:deep(.n-tabs) {
  .n-tabs-tab {
    padding-left: 16px;
    height: 36px;
    background: rgba(255, 255, 255, 0.5) !important;
    backdrop-filter: blur(10px);
    border-radius: 8px 8px 0 0 !important;
    margin-right: 6px;
    margin-bottom: -1px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: 1px solid rgba(0, 0, 0, 0.08) !important;
    border-bottom: none !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    position: relative;

    &:hover {
      border: 2px solid rgba(var(--primary-color), 0.6) !important;
      border-bottom: none !important;
      border-top-width: 3px !important;
      background: rgba(var(--primary-color), 0.08) !important;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(var(--primary-color), 0.2);
      z-index: 1;
    }
  }

  .n-tabs-tab--active {
    border: 2px solid rgb(var(--primary-color)) !important;
    border-bottom: none !important;
    border-top-width: 3px !important;
    background: linear-gradient(
      135deg,
      rgba(var(--primary-color), 0.15) 0%,
      rgba(var(--primary-color), 0.08) 100%
    ) !important;
    font-weight: 600;
    box-shadow:
      0 4px 16px rgba(var(--primary-color), 0.25),
      inset 0 1px 0 rgba(255, 255, 255, 0.3),
      0 -2px 8px rgba(var(--primary-color), 0.3);
    transform: translateY(-2px);
    z-index: 2;
  }

  .n-tabs-pad,
  .n-tabs-tab-pad,
  .n-tabs-scroll-padding {
    border: none !important;
  }

  .n-tabs-nav {
    padding-bottom: 0;
  }
}

.dark :deep(.n-tabs) {
  .n-tabs-tab {
    background: rgba(40, 40, 40, 0.6) !important;
    border: 2px solid rgba(255, 255, 255, 0.15) !important;
    border-bottom: none !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);

    &:hover {
      border: 2px solid rgba(var(--primary-color), 0.6) !important;
      border-bottom: none !important;
      border-top-width: 3px !important;
    }
  }

  .n-tabs-tab--active {
    border: 2px solid rgb(var(--primary-color)) !important;
    border-bottom: none !important;
    border-top-width: 3px !important;
    background: linear-gradient(
      135deg,
      rgba(var(--primary-color), 0.2) 0%,
      rgba(var(--primary-color), 0.1) 100%
    ) !important;
    box-shadow:
      0 4px 16px rgba(var(--primary-color), 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.1),
      0 -2px 8px rgba(var(--primary-color), 0.4);
  }
}
</style>
