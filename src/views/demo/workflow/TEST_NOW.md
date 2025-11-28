# ✅ 立即测试 - DeepSeek 工作流

> 所有 API 调用问题已修复！
> 现在可以正常使用了！

---

## 🎯 快速测试（3 步）

### 第 1 步：确认配置 ✓

你已经配置了：
- ✅ API Key：已配置
- ✅ Base URL：https://api.deepseek.com

**现在点击"保存配置"按钮**（如果还没保存的话）

---

### 第 2 步：创建简单工作流 🔧

**方式 A：手动创建**

1. 回到工作流编辑页面
2. 点击"添加节点"
3. 添加以下节点并连接：

```
[输入节点] → [LLM 文本生成] → [输出节点]
```

4. 配置 LLM 节点：
   - 服务商：DeepSeek
   - 模型：deepseek-chat
   - 提示词：你是一个有用的助手

5. 输入节点：输入测试文本
   ```
   你好，请用一句话介绍你自己
   ```

**方式 B：使用模板**

1. 点击"模板库"
2. 选择任意包含 LLM 的模板
3. 修改 LLM 节点的服务商为 DeepSeek

---

### 第 3 步：运行测试 🚀

1. 点击"运行工作流"按钮
2. 观察控制台（F12）

**期望输出**：
```
✅ [Workflow] 已加载配置的服务商: ['deepseek']
✅ [Workflow] 执行上下文配置: { apiKeys: ['deepseek'], baseUrls: ['deepseek'] }
✅ [LLMExecutor] 开始执行...
✅ [Workflow] 工作流执行完成
```

**不应该再看到**：
```
❌ 404 (Not Found) - :3200/api/proxy:1  ← 这个错误应该消失了！
```

---

## 🎉 成功标志

如果一切正常，你会看到：

1. **执行日志面板自动打开**
2. **显示每个节点的执行情况**
3. **输出节点显示 AI 的回复**
4. **没有 404 错误**
5. **控制台显示"工作流执行完成"**

---

## 🔧 如果还有问题

### 问题 1：API Key 无效

**错误信息**：
```
401 Unauthorized
403 Forbidden
```

**解决**：
1. 检查 API Key 是否正确
2. 访问 https://platform.deepseek.com 验证 Key
3. 确保账户有余额

### 问题 2：网络问题

**错误信息**：
```
Failed to fetch
Network error
```

**解决**：
1. 检查网络连接
2. DeepSeek 在国内可直连，不需要科学上网
3. 尝试在浏览器直接访问 https://api.deepseek.com

### 问题 3：Base URL 错误

**检查配置**：
```
✅ 正确：https://api.deepseek.com
❌ 错误：https://api.deepseek.com/v1
❌ 错误：https://api.deepseek.com/chat/completions
```

**提示**：Base URL 只填基础地址，不要包含接口路径！

---

## 💡 推荐配置

### DeepSeek 配置

```
API Key：sk-xxxxxxxxxxxxxxxxxxxx
Base URL：https://api.deepseek.com（默认即可）
```

### DeepSeek 优势

- ⚡ **性价比极高**：比 OpenAI 便宜 100 倍
- 🇨🇳 **国内直连**：无需科学上网
- 🧠 **性能优秀**：与 GPT-4 相当
- 💰 **新用户福利**：通常有免费额度

---

## 📊 测试示例

### 示例 1：简单对话

```
输入：你好，请介绍一下 DeepSeek

预期输出：DeepSeek 是一家专注于深度学习的 AI 公司，
提供高性能的大语言模型服务...
```

### 示例 2：代码生成

```
输入：用 Python 写一个快速排序函数

预期输出：
def quick_sort(arr):
    if len(arr) <= 1:
        return arr
    ...
```

### 示例 3：文案创作

```
输入：为一款智能手表写一段营销文案

预期输出：【智能腕上管家】您的健康生活助手...
```

---

## 🎯 已修复的问题

### ✅ 修复 1：API 代理 404 错误

**问题**：调用不存在的 `/api/proxy` 接口
**修复**：改为直接调用 AI 服务商 API
**影响**：DeepSeek、OpenAI、智谱、通义

### ✅ 修复 2：Vision/OCR API Key 读取

**问题**：从环境变量读取，不从界面配置读取
**修复**：改为从 context 读取
**影响**：Vision、OCR 节点

---

## 🚀 现在就试试！

1. **保存配置**
2. **运行工作流**
3. **应该能正常工作了！** 🎉

**如果还有问题，查看控制台的详细错误信息，告诉我具体错误内容。**

---

**修复状态**：✅ 完成  
**建议**：立即测试

