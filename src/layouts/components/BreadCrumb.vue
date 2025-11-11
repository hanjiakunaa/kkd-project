<template>
  <n-breadcrumb class="flex items-center gap-8 text-16 leading-none">
    <n-breadcrumb-item v-if="!breadItems?.length" :clickable="false">
      {{ route.meta.title }}
    </n-breadcrumb-item>
    <n-breadcrumb-item
      v-for="(item, index) of breadItems"
      v-else
      :key="item.code"
      :clickable="!!item.path"
      @click="handleItemClick(item)"
    >
      <n-dropdown
        :options="index < breadItems.length - 1 ? getDropOptions(item.children) : []"
        @select="handleDropSelect"
      >
        <div class="flex items-center gap-6 leading-none">
          <h-icon
            v-if="item.icon"
            :name="item.icon"
            scale="1"
            class="flex items-center text-18 leading-none"
          />
          <span>{{ item.name }}</span>
        </div>
      </n-dropdown>
    </n-breadcrumb-item>
  </n-breadcrumb>
</template>

<script setup>
import { OhVueIcon } from 'oh-vue-icons'
import { usePermissionStore } from '@/store'

const router = useRouter()
const route = useRoute()
const permissionStore = usePermissionStore()

const breadItems = ref([])
watch(
  () => route.name,
  (v) => {
    breadItems.value = findMatchs(permissionStore.permissions, v)
  },
  { immediate: true },
)

function findMatchs(tree, code, parents = []) {
  for (const item of tree) {
    if (item.code === code) {
      return [...parents, item]
    }
    if (item.children?.length) {
      const found = findMatchs(item.children, code, [...parents, item])
      if (found) {
        return found
      }
    }
  }
  return null
}

function handleItemClick(item) {
  if (item.path && item.code !== route.name) {
    router.push(item.path)
  }
}

function getDropOptions(list = []) {
  return list
    .filter(item => item.show)
    .map(child => ({
      label: child.name,
      key: child.code,
      icon: child.icon ? () => h(OhVueIcon, { name: child.icon, scale: 1 }) : undefined,
    }))
}

function handleDropSelect(code) {
  if (code && code !== route.name) {
    router.push({ name: code })
  }
}
</script>

<style scoped>
:deep(.n-breadcrumb-item) {
  display: inline-flex;
  align-items: center;
}

:deep(.n-breadcrumb-item__separator) {
  display: inline-flex;
  align-items: center;
  margin: 0 12px;
}
</style>
