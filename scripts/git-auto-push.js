#!/usr/bin/env node

/**
 * Git 自动化提交工具 - Node.js 版本
 * 功能：一键完成 add、commit、push 操作
 * 使用：npm run git "提交信息"
 */

import { execSync } from 'node:child_process'

// 颜色配置
const colors = {
  reset: '\x1B[0m',
  bright: '\x1B[1m',
  red: '\x1B[31m',
  green: '\x1B[32m',
  yellow: '\x1B[33m',
  blue: '\x1B[34m',
  cyan: '\x1B[36m',
  magenta: '\x1B[35m',
}

// 工具函数
const log = {
  success: msg => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  error: msg => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  warning: msg => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  info: msg => console.log(`${colors.cyan}ℹ ${msg}${colors.reset}`),
  step: (num, total, msg) => console.log(`${colors.blue}${colors.bright}[${num}/${total}] ${msg}${colors.reset}`),
  title: (msg) => {
    console.log(`\n${colors.cyan}${colors.bright}${'='.repeat(50)}`)
    console.log(`  ${msg}`)
    console.log(`${'='.repeat(50)}${colors.reset}\n`)
  },
}

// 执行命令
function exec(command, silent = false) {
  try {
    return execSync(command, {
      encoding: 'utf8',
      stdio: silent ? 'pipe' : 'inherit',
      shell: true,
    })
  }
  catch (error) {
    if (silent) {
      throw error // 即使 silent 模式也要抛出错误
    }
    throw error
  }
}

// 获取 Git 状态
function getGitStatus() {
  try {
    return exec('git status --porcelain', true)
  }
  catch {
    return null
  }
}

// 检查是否是 Git 仓库
function isGitRepo() {
  try {
    exec('git rev-parse --git-dir', true)
    return true
  }
  catch {
    return false
  }
}

// 获取当前分支
function getCurrentBranch() {
  try {
    return exec('git branch --show-current', true).trim()
  }
  catch {
    return 'unknown'
  }
}

// 获取远程仓库信息
function getRemoteInfo() {
  try {
    const remote = exec('git remote -v', true)
    return remote.includes('origin')
  }
  catch {
    return false
  }
}

// 统计变更
function getChangeStats() {
  const status = getGitStatus() || ''
  const lines = status.split('\n').filter(line => line.trim())

  let added = 0
  let modified = 0
  let deleted = 0
  let untracked = 0

  lines.forEach((line) => {
    const flag = line.substring(0, 2)
    if (flag.includes('A'))
      added++
    else if (flag.includes('M'))
      modified++
    else if (flag.includes('D'))
      deleted++
    else if (flag.includes('?'))
      untracked++
  })

  return { added, modified, deleted, untracked, total: lines.length }
}

// 生成智能提交信息
function generateCommitMessage() {
  const now = new Date()
  const timestamp = now.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).replace(/\//g, '-')

  const stats = getChangeStats()

  if (stats.total === 0) {
    return `📦 代码提交 - ${timestamp}`
  }

  // 根据变更类型生成描述
  if (stats.added > 0 && stats.modified === 0 && stats.deleted === 0) {
    return `✨ 新增功能 (${stats.added}个文件) - ${timestamp}`
  }
  else if (stats.modified > 0 && stats.added === 0 && stats.deleted === 0) {
    return `🔧 更新代码 (${stats.modified}个文件) - ${timestamp}`
  }
  else if (stats.deleted > 0 && stats.added === 0 && stats.modified === 0) {
    return `🗑️ 删除文件 (${stats.deleted}个文件) - ${timestamp}`
  }
  else if (stats.untracked > 0 && stats.modified === 0 && stats.deleted === 0) {
    return `➕ 添加文件 (${stats.untracked}个文件) - ${timestamp}`
  }
  else {
    const parts = []
    if (stats.added > 0)
      parts.push(`新增${stats.added}`)
    if (stats.modified > 0)
      parts.push(`修改${stats.modified}`)
    if (stats.deleted > 0)
      parts.push(`删除${stats.deleted}`)
    return `📦 代码更新 (${parts.join(', ')}个文件) - ${timestamp}`
  }
}

// 显示提交历史
function showLastCommit() {
  try {
    console.log(`${colors.cyan}\n最新提交:${colors.reset}`)
    exec('git log -1 --pretty=format:"%C(yellow)%h%Creset - %C(cyan)%an%Creset, %C(green)%ar%Creset%n%s" --abbrev-commit')
    console.log('')
  }
  catch {
    // 忽略错误
  }
}

// 主函数
async function main() {
  // 清屏
  console.clear()

  // 显示标题
  log.title('🚀 Git 自动化提交工具')

  // 步骤 1: 检查 Git 仓库
  log.step(1, 5, '检查 Git 仓库...')
  if (!isGitRepo()) {
    log.error('当前目录不是 Git 仓库！')
    process.exit(1)
  }
  log.success('Git 仓库检查通过')

  // 步骤 2: 检查远程仓库
  log.step(2, 5, '检查远程仓库...')
  if (!getRemoteInfo()) {
    log.error('未配置远程仓库 origin！')
    process.exit(1)
  }
  const branch = getCurrentBranch()
  log.info(`当前分支: ${branch}`)
  log.success('远程仓库配置正常')

  // 步骤 3: 检查文件变更
  log.step(3, 5, '检查文件变更...')
  const status = getGitStatus()

  if (!status || status.trim() === '') {
    log.warning('没有需要提交的更改')
    console.log('')
    exec('git status')
    process.exit(0)
  }

  const stats = getChangeStats()
  log.success(`发现 ${stats.total} 个文件变更`)
  console.log(`${colors.cyan}   新增: ${stats.added} | 修改: ${stats.modified} | 删除: ${stats.deleted} | 未跟踪: ${stats.untracked}${colors.reset}\n`)

  // 显示变更状态
  exec('git status --short')
  console.log('')

  // 获取提交信息
  const commitMsg = process.argv[2] || generateCommitMessage()
  console.log(`${colors.cyan}${colors.bright}提交信息: ${commitMsg}${colors.reset}\n`)

  // 步骤 4: 执行 Git 提交
  log.step(4, 5, '执行 Git 提交流程...')

  try {
    // git add .
    console.log(`${colors.cyan}  ➜ 添加文件到暂存区...${colors.reset}`)
    exec('git add .', true)
    log.success('  文件添加成功')

    // git commit - 使用更安全的方式处理提交信息
    console.log(`${colors.cyan}  ➜ 提交更改...${colors.reset}`)
    // 转义提交信息中的特殊字符
    const safeMsg = commitMsg.replace(/"/g, '\\"')
    exec(`git commit -m "${safeMsg}"`, true)
    log.success('  提交成功')
  }
  catch (error) {
    log.error('  提交失败！')
    console.log(`${colors.red}错误详情: ${error.message}${colors.reset}`)
    // 显示 git 状态帮助调试
    console.log('\n当前 Git 状态：')
    exec('git status', false)
    process.exit(1)
  }

  // 步骤 5: 推送到远程
  log.step(5, 5, '推送到远程仓库...')
  console.log(`${colors.cyan}  ➜ 正在推送到 origin/${branch}...${colors.reset}`)

  try {
    exec(`git push origin ${branch}`, true)
    log.success('  推送成功')
  }
  catch {
    // 尝试设置上游分支
    log.warning('  推送失败，尝试设置上游分支...')
    try {
      exec(`git push --set-upstream origin ${branch}`, true)
      log.success('  推送成功（已设置上游分支）')
    }
    catch (error) {
      log.error('  推送失败！')
      log.info('  提示: 请检查网络连接或远程仓库权限')
      log.info(`  你可以稍后手动运行: git push origin ${branch}`)
      console.log(`${colors.red}错误详情: ${error.message}${colors.reset}`)
      process.exit(1)
    }
  }

  // 完成
  console.log(`\n${colors.green}${colors.bright}`)
  console.log('╔════════════════════════════════════════╗')
  console.log('║     ✨ 所有操作完成！🎉               ║')
  console.log('╚════════════════════════════════════════╝')
  console.log(colors.reset)

  // 显示最后一次提交
  showLastCommit()
}

// 运行
main().catch((error) => {
  log.error(`发生错误：${error.message}`)
  process.exit(1)
})
