## 图标替换方案（使用 Remix Icon）
- 替换清单：
  - 输入：`ri-login-circle-line`
  - 输出：`ri-logout-circle-line`
  - LLM/大脑：`ri-brain-line`
  - 工具：`ri-tools-line`
  - 分支：`ri-git-branch-line`
  - 兜底：`ri-cube-line`
  - 工具栏压缩：`ri-fullscreen-exit-line`
- 统一注册位置：`src/plugins/icons.js`
  - 引入并注册：`import { addIcons } from 'oh-vue-icons'`
  - `import { RiLoginCircleLine, RiLogoutCircleLine, RiBrainLine, RiToolsLine, RiGitBranchLine, RiCubeLine, RiFullscreenExitLine } from 'oh-vue-icons/icons/ri'`
  - `addIcons(RiLoginCircleLine, RiLogoutCircleLine, RiBrainLine, RiToolsLine, RiGitBranchLine, RiCubeLine, RiFullscreenExitLine)`
- 使用方式不变：继续在组件里 `<h-icon name="ri-..." />`；默认兜底改为 `ri-cube-line`。
- 同步更新节点数据里的 `data.icon`（index.vue 初始节点与 addNode 映射）到上述新名称。

## 变量编辑生效保障
- 目前已在属性面板提供新增/编辑/删除变量，但为确保 VueFlow 重新渲染：
  - 在 `addVariable` / `removeVariable` 后，替换节点引用：
    - 找到索引 `i = nodes.value.findIndex(n => n.id === selectedNode.value.id)`
    - `nodes.value[i] = { ...selectedNode.value, data: { ...selectedNode.value.data, variables: { ...selectedNode.value.data.variables } } }`
  - 保证节点 `data` 引用变化，从而触发自定义节点的重新渲染。

## 实施步骤
1. 编辑 `src/plugins/icons.js`：按上表注册 Remix 图标。
2. 编辑 `src/views/demo/workflow/index.vue`：将初始与新增节点的 `data.icon` 名称改为 `ri-*`。
3. 在 `addVariable/removeVariable` 中加入节点替换逻辑，确保变量编辑实时反映到节点卡片。
4. 验证：控制台无图标未注册告警；新增/编辑/删除变量后节点折叠详情即时更新。

如果确认，我将按上述步骤直接修改并验证。