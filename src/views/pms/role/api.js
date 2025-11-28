// 模拟角色数据
const mockRoles = [
  {
    id: 1,
    code: 'SUPER_ADMIN',
    name: '超级管理员',
    enable: true,
    permissionIds: [1, 2, 21, 22, 23, 24, 25, 26, 3, 31, 32, 33, 4, 41, 42, 44, 45, 46, 47, 48, 49, 5],
  },
  {
    id: 2,
    code: 'ADMIN',
    name: '管理员',
    enable: true,
    permissionIds: [1, 2, 21, 22, 23, 24, 25, 26, 3, 31, 32, 33, 4, 41, 42, 44, 45, 46, 47, 48, 49, 5],
  },
  {
    id: 3,
    code: 'USER',
    name: '普通用户',
    enable: true,
    permissionIds: [1, 2, 21, 22, 23, 24, 25, 26, 4, 41, 42, 44, 45, 46, 47, 48, 49, 5],
  },
  {
    id: 4,
    code: 'EDITOR',
    name: '编辑员',
    enable: true,
    permissionIds: [1, 4, 41, 42, 44, 45, 46, 47, 48, 49, 5],
  },
  {
    id: 5,
    code: 'VIEWER',
    name: '访客',
    enable: false,
    permissionIds: [1, 5],
  },
]

// 模拟用户数据
const mockUsers = [
  {
    id: 1,
    username: 'admin',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    nickName: '管理员',
    gender: 1,
    email: 'admin@example.com',
    enable: true,
    createTime: '2024-01-01 10:00:00',
    roles: [
      { id: 1, code: 'SUPER_ADMIN', name: '超级管理员' },
      { id: 2, code: 'ADMIN', name: '管理员' },
    ],
  },
  {
    id: 2,
    username: 'user1',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user1',
    nickName: '普通用户1',
    gender: 2,
    email: 'user1@example.com',
    enable: true,
    createTime: '2024-02-15 14:30:00',
    roles: [
      { id: 3, code: 'USER', name: '普通用户' },
    ],
  },
  {
    id: 3,
    username: 'user2',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user2',
    nickName: '普通用户2',
    gender: 1,
    email: 'user2@example.com',
    enable: false,
    createTime: '2024-03-20 09:15:00',
    roles: [
      { id: 3, code: 'USER', name: '普通用户' },
    ],
  },
  {
    id: 4,
    username: 'editor',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=editor',
    nickName: '编辑员',
    gender: 2,
    email: 'editor@example.com',
    enable: true,
    createTime: '2024-04-10 16:45:00',
    roles: [
      { id: 4, code: 'EDITOR', name: '编辑员' },
    ],
  },
]

// 模拟权限树数据
const mockPermissionTree = [
  {
    id: 1,
    code: 'home',
    name: '首页',
    type: 'MENU',
    children: [],
  },
  {
    id: 2,
    code: 'base',
    name: '基础功能',
    type: 'MENU',
    children: [
      { id: 21, code: 'base-unocss', name: 'UnoCSS', type: 'MENU' },
      { id: 22, code: 'base-unocss-icon', name: 'UnoCSS图标', type: 'MENU' },
      { id: 23, code: 'BasePageCache', name: '页面缓存', type: 'MENU' },
      { id: 24, code: 'base-test-modal', name: '测试弹窗', type: 'MENU' },
      { id: 25, code: 'base-top-search', name: '头部搜索', type: 'MENU' },
      { id: 26, code: 'base-dynamic-table', name: '动态表格', type: 'MENU' },
    ],
  },
  {
    id: 3,
    code: 'pms',
    name: '权限管理',
    type: 'MENU',
    children: [
      { id: 31, code: 'pms-user', name: '用户管理', type: 'MENU' },
      { id: 32, code: 'pms-role', name: '角色管理', type: 'MENU' },
      { id: 33, code: 'pms-resource', name: '资源管理', type: 'MENU' },
    ],
  },
  {
    id: 4,
    code: 'demo',
    name: '演示页面',
    type: 'MENU',
    children: [
      { id: 41, code: 'demo-upload', name: '上传示例', type: 'MENU' },
      { id: 42, code: 'demo-shard-upload', name: '大文件分片上传', type: 'MENU' },
      { id: 44, code: 'demo-pixel-drawing', name: '像素绘图', type: 'MENU' },
      { id: 45, code: 'demo-muti-file-perview', name: '多文件预览', type: 'MENU' },
      { id: 46, code: 'demo-automatic-annotation', name: '标注', type: 'MENU' },
      { id: 47, code: 'demo-key-memory', name: '按键记忆', type: 'MENU' },
      { id: 48, code: 'demo-workflow', name: '工作流', type: 'MENU' },
      { id: 49, code: 'demo-video-bg', name: '视频背景', type: 'MENU' },
    ],
  },
  {
    id: 5,
    code: 'profile',
    name: '个人资料',
    type: 'MENU',
    children: [],
  },
]

// 模拟延迟
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms))

export default {
  // 创建角色
  create: async (data) => {
    await delay()
    const newRole = {
      id: mockRoles.length + 1,
      ...data,
    }
    mockRoles.push(newRole)
    return { code: 200, message: '创建成功', data: newRole }
  },

  // 读取角色列表（分页）
  read: async (params = {}) => {
    await delay()
    let result = [...mockRoles]

    // 筛选
    if (params.name) {
      result = result.filter(r => r.name.includes(params.name))
    }
    if (params.enable !== undefined && params.enable !== null && params.enable !== '') {
      result = result.filter(r => r.enable === Boolean(params.enable))
    }

    // 分页
    const pageNo = params.pageNo || 1
    const pageSize = params.pageSize || 10
    const total = result.length
    const start = (pageNo - 1) * pageSize
    const pageData = result.slice(start, start + pageSize)

    return {
      code: 200,
      data: {
        pageData,
        total,
        pageNo,
        pageSize,
      },
    }
  },

  // 更新角色
  update: async (data) => {
    await delay()
    const index = mockRoles.findIndex(r => r.id === data.id)
    if (index !== -1) {
      mockRoles[index] = { ...mockRoles[index], ...data }
      return { code: 200, message: '更新成功', data: mockRoles[index] }
    }
    return { code: 400, message: '角色不存在' }
  },

  // 删除角色
  delete: async (id) => {
    await delay()
    const index = mockRoles.findIndex(r => r.id === id)
    if (index !== -1) {
      mockRoles.splice(index, 1)
      return { code: 200, message: '删除成功' }
    }
    return { code: 400, message: '角色不存在' }
  },

  // 获取所有权限树
  getAllPermissionTree: async () => {
    await delay()
    return { code: 200, data: mockPermissionTree }
  },

  // 获取所有用户
  getAllUsers: async (params = {}) => {
    await delay()
    let result = [...mockUsers]

    // 筛选
    if (params.username) {
      result = result.filter(u => u.username.includes(params.username))
    }
    if (params.gender !== undefined && params.gender !== null && params.gender !== '') {
      result = result.filter(u => u.gender === params.gender)
    }
    if (params.enable !== undefined && params.enable !== null && params.enable !== '') {
      result = result.filter(u => u.enable === Boolean(params.enable))
    }

    // 分页
    const pageNo = params.pageNo || 1
    const pageSize = params.pageSize || 10
    const total = result.length
    const start = (pageNo - 1) * pageSize
    const pageData = result.slice(start, start + pageSize)

    return {
      code: 200,
      data: {
        pageData,
        total,
        pageNo,
        pageSize,
      },
    }
  },

  // 添加用户到角色
  addRoleUsers: async (roleId, data) => {
    await delay()
    const role = mockRoles.find(r => r.id === Number(roleId))
    if (!role) {
      return { code: 400, message: '角色不存在' }
    }

    // 给用户添加角色
    data.userIds.forEach((userId) => {
      const user = mockUsers.find(u => u.id === userId)
      if (user && !user.roles.some(r => r.id === role.id)) {
        user.roles.push({ id: role.id, code: role.code, name: role.name })
      }
    })

    return { code: 200, message: '授权成功' }
  },

  // 从角色移除用户
  removeRoleUsers: async (roleId, data) => {
    await delay()
    const role = mockRoles.find(r => r.id === Number(roleId))
    if (!role) {
      return { code: 400, message: '角色不存在' }
    }

    // 从用户移除角色
    data.userIds.forEach((userId) => {
      const user = mockUsers.find(u => u.id === userId)
      if (user) {
        user.roles = user.roles.filter(r => r.id !== role.id)
      }
    })

    return { code: 200, message: '取消授权成功' }
  },
}
