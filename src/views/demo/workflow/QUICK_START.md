# 🚀 快速入门指南

> 5 分钟上手 AI 工作流系统

---

## 📦 一、环境准备

### 1. 安装依赖

```bash
# 使用 pnpm（推荐）
pnpm install

# 或使用 npm
npm install
```

### 2. 配置 API Key

在项目根目录创建 `.env.local` 文件：

```bash
# OpenAI（Vision、OCR）
VITE_OPENAI_API_KEY=sk-your-key-here

# 智谱 AI（Vision、LLM）
VITE_ZHIPU_API_KEY=your-zhipu-key

# 阿里通义（Vision、OCR、图片生成）
VITE_QWEN_API_KEY=your-qwen-key

# 百度（OCR 专用）
VITE_BAIDU_API_KEY=your-baidu-key
VITE_BAIDU_SECRET_KEY=your-baidu-secret

# DeepSeek（高性价比文本生成）
VITE_DEEPSEEK_API_KEY=your-deepseek-key

# Moonshot（长上下文）
VITE_MOONSHOT_API_KEY=your-moonshot-key
```

### 3. 启动项目

```bash
pnpm dev
```

访问：http://localhost:3200

---

## 🎯 二、第一个工作流（3分钟）

### 场景：使用 OCR 提取图片文字

#### 步骤 1：打开编辑器

1. 导航到：Demo → Workflow
2. 点击"新建工作流"

#### 步骤 2：添加节点

**添加输入节点：**

1. 点击"添加节点"
2. 选择"输入/输出" → "输入"
3. 在节点参数中输入图片 URL：
   ```
   https://example.com/document.jpg
   ```

**添加 OCR 节点：**

1. 点击"添加节点"
2. 选择"数据处理" → "OCR 识别"
3. 配置参数：
   - 服务商：阿里通义
   - 识别语言：自动检测
   - 输出格式：文本

**添加输出节点：**

1. 点击"添加节点"
2. 选择"输入/输出" → "输出"

#### 步骤 3：连接节点

拖动节点右侧的小圆点，连接到下一个节点：

```
[输入] → [OCR 识别] → [输出]
```

#### 步骤 4：运行工作流

1. 点击顶部"运行工作流"按钮
2. 等待执行完成
3. 查看输出结果

🎉 恭喜！你已经创建并运行了第一个工作流！

---

## 🖼️ 三、使用模板快速开始

### 方式一：从模板库选择

1. 点击顶部"模板库"按钮
2. 浏览可用模板：

   - 📝 小红书图文生成器
   - 🎬 短视频脚本生成器
   - 🤖 AI 客服助手
   - 📄 智能文档处理
   - 🎨 品牌VI生成器
   - 📋 OCR 文档处理器 ⭐ 新增
   - 👁️ AI 图片智能分析 ⭐ 新增

3. 选择模板，点击"使用模板"
4. 根据需要调整参数
5. 运行工作流

### 方式二：导入 JSON

1. 准备工作流 JSON 文件
2. 点击"导入工作流"
3. 选择 JSON 文件
4. 开始使用

---

## 🌟 四、体验新功能

### 1. Vision 图片理解

**快速示例：分析一张照片**

```
[输入节点]
 ↓ （输入图片 URL）
[Vision 节点]
 - 服务商：OpenAI
 - 模型：GPT-4o
 - 提示词："请详细描述这张图片的内容、色彩和氛围"
 ↓
[输出节点]
```

**试试看**：使用模板"AI 图片智能分析"

### 2. OCR 文字识别

**快速示例：识别名片**

```
[输入节点]
 ↓ （输入名片图片 URL）
[OCR 节点]
 - 服务商：百度 OCR
 - 识别语言：中英混合
 ↓
[LLM 节点]
 - 提示词："提取姓名、电话、邮箱、公司信息"
 ↓
[输出节点]
```

**试试看**：使用模板"OCR 文档处理器"

### 3. 智能缓存

**自动启用**：缓存功能默认开启

**查看效果**：

1. 运行一个工作流
2. 不修改任何参数
3. 再次运行
4. 对比执行时间（第二次几乎瞬间完成！）

**查看统计**：

```javascript
// 在执行结果中查看
{
  cacheStats: {
    hits: 3,
    misses: 2,
    hitRate: '60%'
  }
}
```

---

## 💡 五、常用工作流场景

### 场景 1：内容创作

**小红书种草文案生成**

```
[输入产品描述]
 → [DeepSeek 分析卖点]
 → [智谱 生成文案]
 → [通义万相 生成配图]
 → [合并输出]
```

### 场景 2：文档处理

**扫描文档数字化**

```
[输入文档图片]
 → [OCR 识别文字]
 → [LLM 格式化整理]
 → [提取关键信息]
 → [生成 Markdown]
```

### 场景 3：图片分析

**商品图片智能审核**

```
[输入商品图片]
 → [Vision 识别商品]
 → [Vision 检查合规性]
 → [条件分支：合规/不合规]
 → [输出审核结果]
```

### 场景 4：多模态生成

**从文案到视频**

```
[输入文案]
 → [LLM 生成分镜脚本]
 → [图片生成 生成关键帧]
 → [图生视频]
 → [音频生成 配音]
 → [合并输出]
```

---

## 🔧 六、常见问题

### Q1: API Key 配置后不生效？

**解决方案：**

1. 确认 `.env.local` 文件在项目根目录
2. 重启开发服务器（`pnpm dev`）
3. 检查 API Key 格式是否正确
4. 查看浏览器控制台错误信息

### Q2: 节点执行失败怎么办？

**解决方案：**

1. 检查节点参数是否正确
2. 确认 API Key 有额度
3. 查看执行日志的错误信息
4. 尝试重新运行（自动重试 2 次）

### Q3: 图片 URL 无法访问？

**解决方案：**

1. 确认图片 URL 公开可访问
2. 支持的格式：JPG, PNG, WebP
3. 建议图片大小 < 5MB
4. 也可以使用 Base64 编码

### Q4: OCR 识别不准确？

**解决方案：**

1. 使用更清晰的图片
2. 切换到百度 OCR（专业引擎）
3. 后接 LLM 节点纠错
4. 调整识别语言参数

### Q5: 缓存如何清理？

**解决方案：**

```javascript
// 在浏览器控制台执行
await workflowStorage.clearAll()
```

或者：

1. 打开浏览器开发者工具
2. Application → IndexedDB
3. 删除 `WorkflowCache` 数据库

---

## 📚 七、进阶学习

### 1. 节点类型完整列表

查看 `config/node-types.js`，包含 17+ 种节点类型：

- **输入输出**：输入、输出
- **AI 生成**：LLM、图片生成、视频生成、音频生成、Vision、图生视频
- **数据处理**：文本处理、图片处理、OCR、向量化
- **逻辑控制**：条件分支、循环、合并
- **数据操作**：HTTP 请求、数据库、文件操作
- **组织管理**：工作组、自定义工具

### 2. 自定义节点

创建自定义节点执行器：

```javascript
// executors/custom.js
import { BaseExecutor } from './base'

export class CustomExecutor extends BaseExecutor {
  async execute(node, input, context) {
    // 你的自定义逻辑
    return output
  }
}
```

### 3. 工作流 API

```javascript
// 创建执行引擎
import { WorkflowExecutor } from './engine/executor'

const executor = new WorkflowExecutor({
  enableRetry: true,
  enableCache: true,
  timeout: 60000
})

// 执行工作流
const result = await executor.execute(nodes, edges, context)

// 查看结果
console.log(result.outputs)
console.log(result.cacheStats)
```

### 4. 存储 API

```javascript
import { workflowStorage } from './utils/storage'

// 保存工作流
await workflowStorage.saveWorkflow({ name, nodes, edges })

// 加载工作流
const workflows = await workflowStorage.getAllWorkflows()

// 保存执行历史
await workflowStorage.saveHistory({ workflowId, logs })
```

---

## 🎓 八、学习资源

### 官方文档

- **README.md** - 项目说明
- **SYSTEM_CHECK_REPORT.md** - 系统检查报告
- **NEW_FEATURES.md** - 新功能详细说明

### 代码示例

- `templates/index.js` - 7 个完整工作流模板
- `executors/` - 各种节点执行器实现
- `components/` - UI 组件示例

### 在线资源

- [OpenAI Vision API](https://platform.openai.com/docs/guides/vision)
- [智谱 GLM-4V](https://open.bigmodel.cn/dev/api#glm-4v)
- [阿里通义千问](https://help.aliyun.com/zh/dashscope/)
- [百度 OCR](https://ai.baidu.com/tech/ocr)

---

## 🎯 九、下一步

### 初学者

1. ✅ 完成第一个工作流
2. ✅ 尝试所有预设模板
3. ✅ 了解各种节点类型
4. ✅ 创建自己的工作流

### 进阶用户

1. ✅ 组合多个 AI 服务
2. ✅ 创建复杂的逻辑分支
3. ✅ 使用循环批量处理
4. ✅ 自定义节点和工具

### 高级用户

1. ✅ 深入理解执行引擎
2. ✅ 优化工作流性能
3. ✅ 集成到自己的项目
4. ✅ 贡献代码和模板

---

## 💬 十、获取帮助

### 遇到问题？

1. 查看 **NEW_FEATURES.md** 的故障排除章节
2. 检查浏览器控制台错误信息
3. 查看执行日志的详细错误
4. 搜索相关文档和示例

### 需要支持？

- 📧 邮箱：support@example.com
- 💬 GitHub Issues：[项目地址]
- 📖 在线文档：[文档地址]

---

**祝你使用愉快！** 🎉

记住：

- ⚡ 缓存让你的工作流飞起来
- 👁️ Vision 让 AI 看懂图片
- 📝 OCR 让文字从图片中解放
- 🔧 模板让你快速上手

**开始创造吧！** 🚀
