## 简介

一款极简风格的后台管理模板，包含前后端解决方案，前端使用 Vite + Vue3 + Pinia + Unocss

## 特性

- 🆒 使用 **Vue3** 主流最新技术栈: `Vite + Vue3 + Pinia`
- 🍇 使用 **原子CSS**框架: `Unocss`，优雅、轻量、易用
- 🍍 集成 `Pinia` 状态管理，支持状态持久化
- 🤹 使用主流的 `iconify + unocss` 图标方案，支持自定义图标，支持动态渲染
- 🎨 使用 Naive UI，`极致简洁的代码风格和清爽的页面设计`，审美在线，主题轻松定制
- 👏 先进且易于理解的文件结构设计，多个模块之间**零耦合**，单个业务模块删除不影响其他模块
- 🚀 `扁平化路由`设计，每一个组件都可以是一个页面，告别多级路由 `KeepAlive` 难实现问题
- 🍒 `基于权限动态生成路由`，无需额外定义路由，`403和404页面可区分`，而不是无权限也跳404
- 🔐 基于Redis集成 `无感刷新`，用户登录态可控，安全与体验缺一不可
- ✨ 基于 Naive UI 封装 `message` 全局工具方法，支持批量提醒，支持跨页面单例模式
- ⚡️ 基于 Naive UI 封装常用的业务组件，包含`Page` 组件、`CRUD` 表格组件及 `Modal`组件等，简单易用，减少大量重复性工作

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 开发

```bash
pnpm dev
```

### 构建

```bash
pnpm build
```

## 🚀 Git 自动提交工具

项目内置了强大的 Git 自动化提交工具，让你告别繁琐的 `git add`、`git commit`、`git push` 操作！

### 一键提交（推荐）

```bash
# 四个命令任选其一，效果完全相同
npm run push      # 自动生成智能提交信息
npm run quick     # 快速提交
npm run git       # Git 操作
npm run commit    # 提交命令
```

### 自定义提交信息

```bash
npm run push "完成用户管理功能"
npm run git "修复登录页面样式问题"
```

### 功能特性

- ✅ 一键完成 add、commit、push 全流程
- ✅ 智能生成提交信息（根据文件变更类型）
- ✅ 彩色终端输出，清晰美观
- ✅ 实时显示文件变更统计
- ✅ 完善的错误检测和处理
- ✅ 自动设置上游分支（首次推送）

### 详细文档

- 📖 [快速入门](./GIT使用说明.md)
- 📚 [完整文档](./GIT-AUTO-PUSH.md)
- ⚡ [速查表](./QUICK-REFERENCE.md)
- 🎨 [运行示例](./scripts/EXAMPLE-OUTPUT.md)
