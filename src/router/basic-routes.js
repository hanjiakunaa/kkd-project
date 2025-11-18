export const basicRoutes = [
  {
    name: 'Login',
    path: '/login',
    component: () => import('@/views/login/index.vue'),
    meta: {
      title: '登录页',
      layout: 'empty',
    },
  },

  {
    name: 'Home',
    path: '/',
    component: () => import('@/views/home/index.vue'),
    meta: {
      title: '首页',
    },
  },

  {
    name: '404',
    path: '/404',
    component: () => import('@/views/error-page/404.vue'),
    meta: {
      title: '页面飞走了',
      layout: 'empty',
    },
  },

  {
    name: '403',
    path: '/403',
    component: () => import('@/views/error-page/403.vue'),
    meta: {
      title: '没有权限',
      layout: 'empty',
    },
  },
  {
    name: 'pdf',
    path: '/demo/muti-file-perview/pdf-preview',
    component: () => import('@/views/demo/muti-file-perview/components/pdf.vue'),
    meta: {
      title: 'PDF预览',
      layout: 'empty',
    },
  },
  {
    name: 'word',
    path: '/demo/muti-file-perview/word-preview',
    component: () => import('@/views/demo/muti-file-perview/components/word.vue'),
    meta: {
      title: 'Word预览',
      layout: 'empty',
    },
  },
  {
    name: 'excel',
    path: '/demo/muti-file-perview/excel-preview',
    component: () => import('@/views/demo/muti-file-perview/components/excel.vue'),
    meta: {
      title: 'Excel预览',
      layout: 'empty',
    },
  },
]
