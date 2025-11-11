// 定义扩展名与编辑器语言映射
const LANGUAGE_MAP = {
  vue: 'vue',
  js: 'javascript',
  cjs: 'javascript',
  mjs: 'javascript',
  ts: 'typescript',
  jsx: 'javascript',
  tsx: 'typescript',
  json: 'json',
  css: 'css',
  scss: 'scss',
  sass: 'sass',
  less: 'less',
  html: 'html',
  md: 'markdown',
  markdown: 'markdown',
}

// 通过 Vite 预打包源码，保证在构建产物中也可读取
const RAW_FILE_LOADERS = (() => {
  const modules = import.meta.glob('../views/**/*.{vue,js,ts,jsx,tsx,md,markdown,json,html,css,scss,sass,less}', {
    as: 'raw',
  })

  return Object.fromEntries(
    Object.entries(modules).map(([path, loader]) => {
      const normalized = normalizeGlobPath(path)
      return [normalized, loader]
    }),
  )
})()

function normalizeGlobPath(globPath) {
  const withoutPrefix = globPath.replace(/^\.{2}\//, 'src/')
  const ensured = withoutPrefix.startsWith('src/') ? `/${withoutPrefix}` : `/${withoutPrefix.replace(/^\/+/, '')}`
  return ensured.replace(/\/{2,}/g, '/')
}

// 定义路径规范化函数
function normalizeSrcPath(targetPath) {
  if (!targetPath)
    return null

  let cleaned = targetPath.trim().replace(/\+/g, '/').replace(/\/+$/, '')

  if (cleaned.startsWith('@/'))
    cleaned = cleaned.replace(/^@\//, 'src/')

  if (cleaned.startsWith('src/'))
    cleaned = `/${cleaned}`

  if (!cleaned.startsWith('/src/views'))
    return null

  cleaned = cleaned.replace(/\/{2,}/g, '/')
  return cleaned
}

// 解析扩展名对应语言
function resolveLanguage(extension) {
  if (!extension)
    return 'plaintext'

  return LANGUAGE_MAP[extension] || 'plaintext'
}

// 构造文件元信息
function buildFileMeta(normalizedPath) {
  const segments = normalizedPath.split('/')
  const fullName = segments[segments.length - 1] || ''
  const dotIndex = fullName.lastIndexOf('.')
  const extension = dotIndex === -1 ? '' : fullName.slice(dotIndex + 1).toLowerCase()
  const language = resolveLanguage(extension)

  return {
    normalizedPath,
    fileName: fullName,
    extension,
    language,
  }
}

// 异步读取原始文件内容
async function importRawFile(path) {
  const loader = RAW_FILE_LOADERS[path]

  if (!loader) {
    console.warn(`[getFileRawCode] 未匹配到构建资源: ${path}`)
    return null
  }

  try {
    return await loader()
  }
  catch (error) {
    console.error(`[getFileRawCode] 读取失败: ${path}`, error)
    return null
  }
}

// 对外暴露的文件元信息方法
export function getFileMeta(targetPath) {
  const normalizedPath = normalizeSrcPath(targetPath)

  if (!normalizedPath) {
    console.warn(`[getFileRawCode] 仅支持读取 /src/views 目录下的文件: ${targetPath}`)
    return null
  }

  return buildFileMeta(normalizedPath)
}

// 对外暴露的读取函数
export async function getFileRawCode(targetPath, normalizedPath) {
  const resolvedPath = normalizedPath || normalizeSrcPath(targetPath)

  if (!resolvedPath) {
    console.warn(`[getFileRawCode] 仅支持读取 /src/views 目录下的文件: ${targetPath}`)
    return null
  }

  return importRawFile(resolvedPath)
}
