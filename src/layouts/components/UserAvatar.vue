<template>
  <n-dropdown :options="options" @select="handleSelect">
    <div id="user-dropdown" class="flex cursor-pointer items-center">
      <n-avatar round :size="36" :src="userStore.avatar" />
      <div v-if="userStore.userInfo" class="ml-12 flex-col flex-shrink-0 items-center">
        <span class="text-14">{{ userStore.nickName ?? userStore.username }}</span>
        <span class="text-12 opacity-50">[{{ userStore.currentRole?.name }}]</span>
      </div>
    </div>
  </n-dropdown>

  <RoleSelect ref="roleSelectRef" />
</template>

<script setup>
// import api from '@/api'
import { OhVueIcon } from 'oh-vue-icons'
import { RoleSelect } from '@/layouts/components'
import { useAuthStore, usePermissionStore, useUserStore } from '@/store'

const router = useRouter()
const userStore = useUserStore()
const authStore = useAuthStore()
const permissionStore = usePermissionStore()

const options = reactive([
  {
    label: '个人资料',
    key: 'profile',
    icon: () => h(OhVueIcon, { name: 'fa-user', scale: 1 }),
    show: computed(() => permissionStore.accessRoutes?.some(item => item.path === '/profile')),
  },
  {
    label: '切换角色',
    key: 'toggleRole',
    icon: () => h(OhVueIcon, { name: 'fa-exchange-alt', scale: 1 }),
    show: computed(() => userStore.roles.length > 1),
  },
  {
    label: '退出登录',
    key: 'logout',
    icon: () => h(OhVueIcon, { name: 'fa-sign-out-alt', scale: 1 }),
  },
])

const roleSelectRef = ref(null)
function handleSelect(key) {
  switch (key) {
    case 'profile':
      router.push('/profile')
      break
    case 'toggleRole':
      roleSelectRef.value?.open({
        onOk() {
          location.reload()
        },
      })
      break
    case 'logout':
      $dialog.confirm({
        title: '提示',
        type: 'info',
        content: '确认退出？',
        async confirm() {
          // 移除接口调用，直接前端退出
          authStore.logout()
          $message.success('已退出登录')
        },
      })
      break
  }
}
</script>
