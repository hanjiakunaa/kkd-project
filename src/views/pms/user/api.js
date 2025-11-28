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
      { id: 1, code: 'ADMIN', name: '管理员' },
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
      { id: 2, code: 'USER', name: '普通用户' },
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
      { id: 2, code: 'USER', name: '普通用户' },
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
      { id: 3, code: 'EDITOR', name: '编辑员' },
    ],
  },
]

// 模拟角色数据
const mockRoles = [
  { id: 1, code: 'ADMIN', name: '管理员', enable: true },
  { id: 2, code: 'USER', name: '普通用户', enable: true },
  { id: 3, code: 'EDITOR', name: '编辑员', enable: true },
]

// 模拟延迟
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms))

export default {
  // 创建用户
  create: async (data) => {
    await delay()
    const newUser = {
      id: mockUsers.length + 1,
      ...data,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.username}`,
      createTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
      roles: mockRoles.filter(r => data.roleIds?.includes(r.id)),
    }
    mockUsers.push(newUser)
    return { code: 200, message: '创建成功', data: newUser }
  },

  // 读取用户列表
  read: async (params = {}) => {
    await delay()
    let result = [...mockUsers]

    // 筛选
    if (params.username) {
      result = result.filter(u => u.username.includes(params.username))
    }
    if (params.email) {
      result = result.filter(u => u.email?.includes(params.email))
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

  // 更新用户
  update: async (data) => {
    await delay()
    const index = mockUsers.findIndex(u => u.id === data.id)
    if (index !== -1) {
      // 如果更新了角色
      if (data.roleIds) {
        data.roles = mockRoles.filter(r => data.roleIds.includes(r.id))
      }
      mockUsers[index] = { ...mockUsers[index], ...data }
      return { code: 200, message: '更新成功', data: mockUsers[index] }
    }
    return { code: 400, message: '用户不存在' }
  },

  // 删除用户
  delete: async (id) => {
    await delay()
    const index = mockUsers.findIndex(u => u.id === id)
    if (index !== -1) {
      mockUsers.splice(index, 1)
      return { code: 200, message: '删除成功' }
    }
    return { code: 400, message: '用户不存在' }
  },

  // 重置密码
  resetPwd: async (id, data) => {
    await delay()
    console.log('重置密码:', id, data)
    return { code: 200, message: '密码重置成功' }
  },

  // 获取所有角色
  getAllRoles: async () => {
    await delay()
    return { code: 200, data: mockRoles.filter(r => r.enable) }
  },
}
