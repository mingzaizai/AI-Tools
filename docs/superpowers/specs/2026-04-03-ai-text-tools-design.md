# AI 文本工具模块设计文档

**日期：** 2026-04-03
**状态：** 待实现

---

## 1. 背景与目标

在现有 AI 工具集基础上，新增"AI 文本工具"模块，使用 DeepSeek 作为唯一 AI 后端（替换现有 Gemini），提供 6 个文本处理功能，帮助用户完成文档审查、润色、整理等任务。

---

## 2. 整体架构

### 2.1 导航结构

侧边栏新增一个导航入口"AI 文本工具"，位于"GitHub 检索"下方，图标使用 `BrainCircuit`（lucide-react）。

进入该页面后，顶部展示功能 Tab，分两组：

**审查类：** 错别字识别 / 合同审查 / 文章审查
**文档类：** 文本润色 / 会议纪要整理 / 简历优化

Tab 样式与现有图片编辑子 Tab（图库/编辑/合并/批量）保持一致，两组之间用竖线分隔。默认选中"错别字识别"。

### 2.2 页面布局

```
┌─────────────────────────────────────────────────────┐
│ 主侧边栏 (w-64)  │  内容区                          │
│                  │  ┌─────────────────────────────┐ │
│  ...其他导航...  │  │ 错别字 合同审查 文章审查  |  │ │
│  ● AI 文本工具 ← │  │ 文本润色 会议纪要 简历优化   │ │
│  ...             │  └─────────────────────────────┘ │
│                  │                                   │
│                  │  功能内容区（滚动）               │
└─────────────────────────────────────────────────────┘
```

### 2.3 新增文件结构

```
components/
  AITextToolsView.tsx              # 主容器，包含顶部 Tab 与内容切换
  ai-text/
    SpellCheckView.tsx             # 错别字识别
    ContractReviewView.tsx         # 合同审查
    ArticleReviewView.tsx          # 文章审查
    TextPolishView.tsx             # 文本润色
    MeetingMinutesView.tsx         # 会议纪要整理
    ResumeOptimizeView.tsx         # 简历优化
    useDeepSeek.ts                 # DeepSeek API 调用 Hook
```

### 2.4 修改现有文件

- `types.ts`：新增 `AI_TEXT_TOOLS = 'AI_TEXT_TOOLS'` 枚举值
- `App.tsx`：新增导航入口、导入 `AITextToolsView`、渲染对应视图
- `SettingsView.tsx`：新增 DeepSeek API Key 配置区块
- `utils.ts`：新增 `extractTextFromFile(file)` 工具函数

---

## 3. DeepSeek 配置与 API 封装

### 3.1 设置页配置

在 `SettingsView.tsx` 新增"AI 模型配置"区块：
- 输入框填写 DeepSeek API Key，保存到 `localStorage`（key: `deepseek_api_key`）
- 显示 key 前 8 位 + `****` 遮码预览
- "测试连接"按钮：发送一个简单请求验证 key 是否有效，显示成功/失败提示
- 现有 Gemini 的 `process.env.API_KEY` 相关代码同步移除（`AIAnalysisPanel.tsx`）

### 3.2 useDeepSeek Hook

```typescript
// 接口设计
const { call, loading, error } = useDeepSeek();
// call(systemPrompt: string, userContent: string) => Promise<string>
```

- 从 `localStorage` 读取 API Key，未配置时抛出"请先在设置中配置 DeepSeek API Key"
- 调用端点：`https://api.deepseek.com/v1/chat/completions`
- 模型：`deepseek-chat`
- 统一处理三类错误：未配置 key / 网络错误 / API 返回错误（401、429、500 等）

### 3.3 文件解析工具函数

```typescript
// utils.ts 新增
extractTextFromFile(file: File): Promise<string>
```

- `.txt`：直接用 `FileReader` 读取文本
- `.doc/.docx`：使用 `mammoth` 库提取纯文本
- 其他格式：抛出"不支持的文件格式"错误
- 新增依赖：`mammoth`

---

## 4. 六个功能模块详细设计

### 共同交互规范

- 输入区：文本框（可粘贴/输入）+ 上传文件按钮（支持 .txt / .doc / .docx）
- 操作按钮："开始分析" + "清空"
- 未配置 API Key 时，点击"开始分析"显示提示并提供跳转设置页的链接
- AI 分析中显示 loading 动画（`Loader2` 旋转图标）
- 结果区支持"一键复制"按钮

---

### 4.1 错别字识别（SpellCheckView）

**输入：** 任意文本
**Prompt 策略：** System prompt 要求 AI 返回 JSON，包含错别字列表和修正后全文
**输出展示：**
- 错别字列表：每条显示"原字 → 建议替换"
- 原文高亮：错别字标红显示
- 修正后完整文本（可一键复制）

**输出 JSON 结构：**
```json
{
  "errors": [{ "original": "错", "suggestion": "对", "context": "上下文片段" }],
  "correctedText": "修正后的完整文本"
}
```

---

### 4.2 合同审查（ContractReviewView）

**输入：** 合同文本
**输出展示：**
- 综合评分（0-100，环形或进度条显示）
- 风险标签（高风险 / 中风险 / 低风险，彩色标签）
- 逐条风险详情列表：条款摘要 + 风险描述 + 修改建议，按风险等级排序

**输出 JSON 结构：**
```json
{
  "score": 72,
  "summary": "整体风险摘要",
  "risks": [{
    "level": "high",
    "clause": "条款摘要",
    "description": "风险描述",
    "suggestion": "修改建议"
  }]
}
```

---

### 4.3 文章审查（ArticleReviewView）

**输入：** 文章文本 + 审查类型选择（写作质量 / 内容合规 / 两者都查）
**输出展示：**
- 写作质量：整体评价 + 问题列表（逻辑/语法/表达）
- 内容合规：合规状态标签（合规/需注意/违规）+ 风险点列表

**输出 JSON 结构：**
```json
{
  "writing": {
    "overallComment": "整体评价",
    "issues": [{ "type": "逻辑", "description": "问题描述", "location": "相关原文片段" }]
  },
  "compliance": {
    "status": "需注意",
    "issues": [{ "description": "风险描述", "location": "相关原文片段" }]
  }
}
```

---

### 4.4 文本润色（TextPolishView）

**输入：** 原始文本 + 润色风格选择（正式 / 口语 / 简洁 / 专业）
**输出展示：**
- 润色后文本（可一键复制）
- 修改说明：列出主要改动点

**输出 JSON 结构：**
```json
{
  "polishedText": "润色后文本",
  "changes": ["改动说明1", "改动说明2"]
}
```

---

### 4.5 会议纪要整理（MeetingMinutesView）

**输入：** 原始会议记录文本
**输出展示：**
- 会议议题列表
- 决议事项列表
- 待办事项列表（含负责人/截止日期，若原文有提及）

**输出 JSON 结构：**
```json
{
  "topics": ["议题1", "议题2"],
  "decisions": ["决议1", "决议2"],
  "todos": [{ "task": "任务描述", "owner": "负责人", "deadline": "截止日期" }]
}
```

---

### 4.6 简历优化（ResumeOptimizeView）

**输入：** 简历文本 + 目标职位描述（可选）
**输出展示：**
- 简历整体评价
- 具体改进建议列表（按优先级排序）
- 优化后简历全文（可一键复制）

**输出 JSON 结构：**
```json
{
  "overallComment": "整体评价",
  "suggestions": [{ "priority": "high", "field": "工作经历", "suggestion": "建议内容" }],
  "optimizedResume": "优化后简历全文"
}
```

---

## 5. 错误处理

| 场景 | 处理方式 |
|------|---------|
| 未配置 API Key | 提示文字 + "前往设置"链接 |
| 网络错误 | 红色错误提示，可重试 |
| API 401 | 提示"API Key 无效，请检查设置" |
| API 429 | 提示"请求过于频繁，请稍后重试" |
| 文件格式不支持 | 提示支持的格式列表 |
| 文本为空 | 按钮 disabled，不发请求 |

---

## 6. 依赖变更

- **新增：** `mammoth`（解析 .docx 文件）
- **移除：** `@google/genai`（不再使用 Gemini）

---

## 7. 不在本次范围内

- 历史记录/结果保存
- 批量文件处理
- 流式输出（streaming）
- 移动端适配
