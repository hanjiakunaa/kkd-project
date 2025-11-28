import axios from 'axios'

// 模拟菜单树数据
const mockMenuTree = [
  {
    id: 1,
    code: 'home',
    name: '首页',
    type: 'MENU',
    path: '/',
    component: '/src/views/home/index.vue',
    icon: 'fc-home',
    order: 0,
    enable: true,
    show: true,
    keepAlive: false,
    layout: '',
    children: [],
  },
  {
    id: 2,
    code: 'base',
    name: '基础功能',
    type: 'MENU',
    path: '/base',
    component: '/src/views/base/index.vue',
    icon: 'fa-th-large',
    order: 1,
    enable: true,
    show: true,
    keepAlive: false,
    layout: '',
    children: [
      {
        id: 21,
        code: 'base-unocss',
        name: 'UnoCSS',
        type: 'MENU',
        path: '/base/unocss',
        component: '/src/views/base/unocss.vue',
        icon: 'fa-palette',
        order: 1,
        enable: true,
        show: true,
        keepAlive: false,
        children: [],
      },
      {
        id: 22,
        code: 'base-unocss-icon',
        name: 'UnoCSS图标',
        type: 'MENU',
        path: '/base/unocss-icon',
        component: '/src/views/base/unocss-icon.vue',
        icon: 'fa-star',
        order: 2,
        enable: true,
        show: true,
        keepAlive: false,
        children: [],
      },
      {
        id: 23,
        code: 'BasePageCache',
        name: '页面缓存',
        type: 'MENU',
        path: '/base/page-cache',
        component: '/src/views/base/page-cache.vue',
        icon: 'bi-clipboard2-data',
        order: 3,
        enable: true,
        show: true,
        keepAlive: true,
        children: [],
      },
      {
        id: 24,
        code: 'base-test-modal',
        name: '测试弹窗',
        type: 'MENU',
        path: '/base/test-modal',
        component: '/src/views/base/test-modal.vue',
        icon: 'fa-external-link-alt',
        order: 4,
        enable: true,
        show: true,
        keepAlive: true,
        children: [],
      },
      {
        id: 25,
        code: 'base-top-search',
        name: '头部搜索',
        type: 'MENU',
        path: '/base/top-search',
        component: '/src/views/base/top-search.vue',
        icon: 'fc-search',
        order: 5,
        enable: true,
        show: true,
        keepAlive: false,
        children: [],
      },
      {
        id: 26,
        code: 'base-dynamic-table',
        name: '动态表格',
        type: 'MENU',
        path: '/base/dynamic-table',
        component: '/src/views/base/dynamic-table.vue',
        icon: 'bi-table',
        order: 6,
        enable: true,
        show: true,
        keepAlive: false,
        children: [],
      },
    ],
  },
  {
    id: 3,
    code: 'pms',
    name: '权限管理',
    type: 'MENU',
    path: '/pms',
    component: '',
    icon: 'fa-shield-alt',
    order: 2,
    enable: true,
    show: true,
    keepAlive: false,
    layout: '',
    children: [
      {
        id: 31,
        code: 'pms-user',
        name: '用户管理',
        type: 'MENU',
        path: '/pms/user',
        component: '/src/views/pms/user/index.vue',
        icon: 'fa-user',
        order: 1,
        enable: true,
        show: true,
        keepAlive: false,
        children: [
          { id: 311, code: 'AddUser', name: '新增用户', type: 'BUTTON', enable: true },
          { id: 312, code: 'EditUser', name: '编辑用户', type: 'BUTTON', enable: true },
          { id: 313, code: 'DeleteUser', name: '删除用户', type: 'BUTTON', enable: true },
        ],
      },
      {
        id: 32,
        code: 'pms-role',
        name: '角色管理',
        type: 'MENU',
        path: '/pms/role',
        component: '/src/views/pms/role/index.vue',
        icon: 'fa-users',
        order: 2,
        enable: true,
        show: true,
        keepAlive: false,
        children: [],
      },
      {
        id: 33,
        code: 'pms-resource',
        name: '资源管理',
        type: 'MENU',
        path: '/pms/resource',
        component: '/src/views/pms/resource/index.vue',
        icon: 'fa-list',
        order: 3,
        enable: true,
        show: true,
        keepAlive: false,
        children: [],
      },
    ],
  },
  {
    id: 4,
    code: 'demo',
    name: '演示页面',
    type: 'MENU',
    path: '/demo',
    component: '',
    icon: 'fa-flask',
    order: 3,
    enable: true,
    show: true,
    keepAlive: false,
    layout: '',
    children: [
      {
        id: 41,
        code: 'demo-upload',
        name: '上传示例',
        type: 'MENU',
        path: '/demo/upload',
        component: '/src/views/demo/upload/index.vue',
        icon: 'pr-cloud-upload',
        order: 1,
        enable: true,
        show: true,
        keepAlive: false,
        children: [],
      },
      {
        id: 42,
        code: 'demo-shard-upload',
        name: '大文件分片上传',
        type: 'MENU',
        path: '/demo/shard-upload',
        component: '/src/views/demo/shard-upload/index.vue',
        icon: 'pr-cloud-upload',
        order: 2,
        enable: true,
        show: true,
        keepAlive: false,
        children: [],
      },
      {
        id: 44,
        code: 'demo-pixel-drawing',
        name: '像素绘图',
        type: 'MENU',
        path: '/demo/pixel-drawing',
        component: '/src/views/demo/pixel-drawing/index.vue',
        icon: 'px-pixelarticons',
        order: 4,
        enable: true,
        show: true,
        keepAlive: false,
        children: [],
      },
      {
        id: 45,
        code: 'demo-muti-file-perview',
        name: '多文件预览',
        type: 'MENU',
        path: '/demo/muti-file-perview',
        component: '/src/views/demo/muti-file-perview/index.vue',
        icon: 'vi-file-type-appsemble',
        order: 5,
        enable: true,
        show: true,
        keepAlive: false,
        children: [],
      },
      {
        id: 46,
        code: 'demo-automatic-annotation',
        name: '标注',
        type: 'MENU',
        path: '/demo/automatic-annotation',
        component: '/src/views/demo/automatic-annotation/index.vue',
        icon: 'bi-postage',
        order: 6,
        enable: true,
        show: true,
        keepAlive: false,
        children: [],
      },
      {
        id: 47,
        code: 'demo-key-memory',
        name: '按键记忆',
        type: 'MENU',
        path: '/demo/key-memory',
        component: '/src/views/demo/key-memory/index.vue',
        icon: 'fa-regular-keyboard',
        order: 7,
        enable: true,
        show: true,
        keepAlive: false,
        children: [],
      },
      {
        id: 48,
        code: 'demo-workflow',
        name: '工作流',
        type: 'MENU',
        path: '/demo/workflow',
        component: '/src/views/demo/workflow/index.vue',
        icon: 'fc-workflow',
        layout: 'empty',
        order: 8,
        enable: true,
        show: true,
        keepAlive: false,
        children: [],
      },
      {
        id: 49,
        code: 'demo-video-bg',
        name: '视频背景',
        type: 'MENU',
        path: '/demo/video-bg',
        component: '/src/views/demo/video-bg/index.vue',
        icon: 'bi-person-video2',
        order: 9,
        enable: true,
        show: true,
        keepAlive: false,
        children: [],
      },
    ],
  },
  {
    id: 5,
    code: 'profile',
    name: '个人资料',
    type: 'MENU',
    path: '/profile',
    component: '/src/views/profile/index.vue',
    icon: 'fa-user',
    order: 99,
    enable: true,
    show: false,
    keepAlive: false,
    layout: '',
    children: [],
  },
]

// 按钮数据存储（按 parentId 分组）
const mockButtons = {
  31: [
    { id: 311, code: 'AddUser', name: '新增用户', type: 'BUTTON', enable: true, parentId: 31 },
    { id: 312, code: 'EditUser', name: '编辑用户', type: 'BUTTON', enable: true, parentId: 31 },
    { id: 313, code: 'DeleteUser', name: '删除用户', type: 'BUTTON', enable: true, parentId: 31 },
    { id: 314, code: 'SuperAdmin', name: '超管专属', type: 'BUTTON', enable: true, parentId: 31 },
  ],
}

// 生成唯一 ID
let nextId = 1000

// 模拟延迟
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms))

// 递归查找并更新菜单
function findAndUpdateMenu(tree, id, updateData) {
  for (const item of tree) {
    if (item.id === id) {
      Object.assign(item, updateData)
      return true
    }
    if (item.children?.length) {
      if (findAndUpdateMenu(item.children, id, updateData)) {
        return true
      }
    }
  }
  return false
}

// 递归查找并删除菜单
function findAndDeleteMenu(tree, id) {
  for (let i = 0; i < tree.length; i++) {
    if (tree[i].id === id) {
      tree.splice(i, 1)
      return true
    }
    if (tree[i].children?.length) {
      if (findAndDeleteMenu(tree[i].children, id)) {
        return true
      }
    }
  }
  return false
}

// 递归查找父菜单
function findParentMenu(tree, parentId) {
  for (const item of tree) {
    if (item.id === parentId) {
      return item
    }
    if (item.children?.length) {
      const found = findParentMenu(item.children, parentId)
      if (found)
        return found
    }
  }
  return null
}

export default {
  // 获取菜单树
  getMenuTree: async () => {
    await delay()
    return { code: 200, data: mockMenuTree }
  },

  // 获取按钮列表
  getButtons: async ({ parentId }) => {
    await delay()
    const buttons = mockButtons[parentId] || []

    return {
      code: 200,
      data: {
        pageData: buttons,
        total: buttons.length,
        pageNo: 1,
        pageSize: 10,
      },
    }
  },

  // 获取组件列表（这个是从静态文件读取的，保持不变）
  getComponents: () => axios.get(`${import.meta.env.VITE_PUBLIC_PATH}components.json`),

  // 添加权限
  addPermission: async (data) => {
    await delay()
    const newId = nextId++
    const newItem = {
      id: newId,
      ...data,
      children: [],
    }

    if (data.type === 'BUTTON') {
      // 添加按钮
      if (!mockButtons[data.parentId]) {
        mockButtons[data.parentId] = []
      }
      mockButtons[data.parentId].push({ ...newItem, parentId: data.parentId })
    }
    else {
      // 添加菜单
      if (data.parentId) {
        const parent = findParentMenu(mockMenuTree, data.parentId)
        if (parent) {
          if (!parent.children)
            parent.children = []
          parent.children.push(newItem)
        }
      }
      else {
        mockMenuTree.push(newItem)
      }
    }

    return { code: 200, message: '添加成功', data: newItem }
  },

  // 保存/更新权限
  savePermission: async (id, data) => {
    await delay()

    // 尝试更新按钮
    for (const parentId in mockButtons) {
      const buttonIndex = mockButtons[parentId].findIndex(b => b.id === id)
      if (buttonIndex !== -1) {
        mockButtons[parentId][buttonIndex] = { ...mockButtons[parentId][buttonIndex], ...data }
        return { code: 200, message: '更新成功' }
      }
    }

    // 尝试更新菜单
    if (findAndUpdateMenu(mockMenuTree, id, data)) {
      return { code: 200, message: '更新成功' }
    }

    return { code: 400, message: '权限不存在' }
  },

  // 删除权限
  deletePermission: async (id) => {
    await delay()

    // 尝试删除按钮
    for (const parentId in mockButtons) {
      const buttonIndex = mockButtons[parentId].findIndex(b => b.id === id)
      if (buttonIndex !== -1) {
        mockButtons[parentId].splice(buttonIndex, 1)
        return { code: 200, message: '删除成功' }
      }
    }

    // 尝试删除菜单
    if (findAndDeleteMenu(mockMenuTree, id)) {
      return { code: 200, message: '删除成功' }
    }

    return { code: 400, message: '权限不存在' }
  },
}
