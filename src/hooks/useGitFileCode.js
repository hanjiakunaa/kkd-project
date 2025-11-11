// 定义扩展名与编辑器语言映射
const LANGUAGE_MAP = { // 记录常见扩展名
  vue: 'vue', // Vue 单文件组件
  js: 'javascript', // JavaScript 文件
  cjs: 'javascript', // CommonJS 文件
  mjs: 'javascript', // ESM JavaScript 文件
  ts: 'typescript', // TypeScript 文件
  jsx: 'javascript', // JSX 文件
  tsx: 'typescript', // TSX 文件
  json: 'json', // JSON 文件
  css: 'css', // CSS 文件
  scss: 'scss', // SCSS 文件
  sass: 'sass', // SASS 文件
  less: 'less', // Less 文件
  html: 'html', // HTML 文件
  md: 'markdown', // Markdown 简写
  markdown: 'markdown', // Markdown 全称
}

// 定义路径规范化函数
function normalizeSrcPath(targetPath) { // 接收目标路径
  let cleaned = targetPath.trim().replace(/\+/g, '/').replace(/\/+$/, '') // 去除首尾空格并统一分隔符

  if (cleaned.startsWith('src/views')) // 如果以 src/ 开头
    cleaned = `/${cleaned}` // 补充前缀斜杠

  if (!cleaned.startsWith('/src/views')) // 如果不在 /src/ 目录下
    return null // 返回 null 表示不支持

  cleaned = cleaned.replace(/\/{2,}/g, '/') // 合并重复斜杠
  return cleaned // 返回规范化后的路径
}

// 解析扩展名对应语言
function resolveLanguage(extension) { // 接收文件扩展名
  if (!extension) // 如果没有扩展名
    return 'plaintext' // 返回纯文本

  return LANGUAGE_MAP[extension] || 'plaintext' // 返回映射结果或纯文本
}

// 构造文件元信息
function buildFileMeta(normalizedPath) { // 接收规范化路径
  const segments = normalizedPath.split('/') // 拆分目录
  const fullName = segments[segments.length - 1] || '' // 取文件名
  const dotIndex = fullName.lastIndexOf('.') // 查找扩展名分隔符
  const extension = dotIndex === -1 ? '' : fullName.slice(dotIndex + 1).toLowerCase() // 提取并统一扩展名
  const language = resolveLanguage(extension) // 计算语言类型

  return { // 返回聚合信息
    normalizedPath, // 规范化路径
    fileName: fullName, // 文件名
    extension, // 扩展名
    language, // 对应语言
  }
}

// 异步读取原始文件内容
async function importRawFile(path) { // 接收规范化后的路径
  if (typeof fetch === 'undefined') { // 检查运行环境是否支持 fetch
    console.error('[getFileRawCode] 当前环境不支持 fetch API') // 输出错误提示
    return null // 返回 null 终止逻辑
  }

  const requestUrl = `${path}?raw` // 构造请求地址

  try {
    const response = await fetch(requestUrl, { cache: 'no-cache' }) // 发起网络请求并禁用缓存

    if (!response.ok) { // 如果响应状态异常
      console.error(`[getFileRawCode] 请求失败: ${requestUrl}`) // 输出错误信息
      return null // 返回 null
    }

    const moduleText = await response.text() // 获取响应文本
    return extractRawFromModule(moduleText) // 提取模块中的原始内容
  }
  catch (error) { // 捕获异常
    console.error(`[getFileRawCode] 读取失败: ${requestUrl}`, error) // 输出错误堆栈
    return null // 返回 null
  }
}

// 从模块文本中提取原始源码
function extractRawFromModule(moduleText) { // 接收模块字符串
  const sourceMapIndex = moduleText.indexOf('\n//# sourceMappingURL=') // 定位 source map 标记
  const trimmedText = sourceMapIndex >= 0 ? moduleText.slice(0, sourceMapIndex).trim() : moduleText.trim() // 去除 source map 片段并修剪
  const prefix = 'export default ' // 定义默认导出前缀

  if (!trimmedText.startsWith(prefix)) // 如果不是默认导出文本
    return trimmedText // 直接返回内容

  let literal = trimmedText.slice(prefix.length).trim() // 切掉前缀并修剪

  if (literal.endsWith(';')) // 如果末尾携带分号
    literal = literal.slice(0, -1).trim() // 去除分号并修剪

  try {
    return JSON.parse(literal) // 使用 JSON.parse 解析字符串字面量
  }
  catch (error) { // 捕获解析异常
    console.error('[getFileRawCode] 原始内容解析失败', error) // 打印错误信息
    return null // 返回 null
  }
}

// 对外暴露的文件元信息方法
export function getFileMeta(targetPath) { // 接收目标路径
  const normalizedPath = normalizeSrcPath(targetPath) // 规范化路径

  if (!normalizedPath) { // 如果返回 null
    console.warn(`[getFileRawCode] 仅支持读取 /src/views 目录下的文件: ${targetPath}`) // 提示路径不合法
    return null // 返回 null
  }

  return buildFileMeta(normalizedPath) // 构造并返回文件信息
}

// 对外暴露的读取函数
export async function getFileRawCode(targetPath, normalizedPath) { // 接收目标路径与可选规范路径
  const resolvedPath = normalizedPath || normalizeSrcPath(targetPath) // 优先使用传入的规范路径

  if (!resolvedPath) { // 如果返回 null
    console.warn(`[getFileRawCode] 仅支持读取 /src/views 目录下的文件: ${targetPath}`) // 提示路径不合法
    return null // 返回 null
  }

  return importRawFile(resolvedPath) // 调用内部读取函数
}
