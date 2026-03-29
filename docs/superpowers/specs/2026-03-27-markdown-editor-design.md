# Markdown 编辑器 设计文档

**日期**: 2026-03-27
**状态**: 已确认

---

## 概述

在 AI Tools 工具集中新增 Markdown 编辑器模块，支持左右分栏实时预览、工具栏快捷操作、本地存储自动保存、导出 HTML 和 Markdown 文件。

---

## 技术选型

- **Markdown 渲染库**: `marked`（轻量、支持 GFM、接入简单）
- **框架**: React + TypeScript（与现有项目一致）

---

## 组件结构

新增文件：
- `components/MarkdownEditorView.tsx` — 主组件

修改文件：
- `App.tsx` — 注册新 mode
- `components/Header.tsx` — 添加导航入口
- `types.ts` — 添加新的 AppMode 枚举值

---

## UI 布局

```
┌──────────────────────────────────────────────────────┐
│ 工具栏: H1 H2 H3 | B I | 分割线 | 链接 代码 代码块 任务列表 | 导出MD 导出HTML │
├─────────────────────┬────────────────────────────────┤
│                     │                                │
│   Markdown 输入区   │        HTML 实时预览区          │
│   (textarea)        │        (dangerouslySetInner)   │
│   左右各 50%        │        左右各 50%              │
│                     │                                │
└─────────────────────┴────────────────────────────────┘
```

- 左右各占 50% 宽度
- 两侧同步滚动（scroll 事件联动）
- 编辑区字体使用等宽字体

---

## 工具栏功能

| 按钮 | 插入内容 | 说明 |
|------|----------|------|
| H1 | `# ` | 在行首插入 |
| H2 | `## ` | 在行首插入 |
| H3 | `### ` | 在行首插入 |
| 加粗 | `**选中文字**` | 包裹选中内容 |
| 斜体 | `*选中文字*` | 包裹选中内容 |
| 分割线 | `\n---\n` | 插入到光标处 |
| 链接 | `[文字](url)` | 插入模板 |
| 行内代码 | `` `选中文字` `` | 包裹选中内容 |
| 代码块 | ` ```\n选中文字\n``` ` | 包裹选中内容 |
| 任务列表 | `- [ ] 任务` | 插入模板 |

工具栏按钮操作逻辑：
- 有选中文本时：包裹选中内容
- 无选中文本时：插入模板占位符

---

## 本地存储

- **Key**: `md-editor-content`
- **时机**: 内容变化后 debounce 500ms 写入 `localStorage`
- **恢复**: 组件挂载时从 `localStorage` 读取，若无内容则显示默认示例文本

---

## 导出功能

### 导出 Markdown
- 将编辑区原始文本下载为 `document.md`
- 使用 Blob + `<a>` 标签触发下载

### 导出 HTML
- 将 marked 渲染结果包裹完整 HTML 文档结构
- 内嵌基础 CSS 样式（字体、行高、代码块、表格样式）
- 下载为 `document.html`

导出 HTML 模板结构：
```html
<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <title>导出文档</title>
  <style>/* 基础排版样式 */</style>
</head>
<body>
  <!-- marked 渲染结果 -->
</body>
</html>
```

---

## 数据流

```
用户输入 → textarea value 更新
        → marked 解析 → 预览区 innerHTML 更新（实时）
        → debounce 500ms → localStorage 写入（自动保存）
```

---

## 依赖变更

新增：
```bash
npm install marked
npm install @types/marked  # TypeScript 类型
```

---

## 不在本次范围内

- 图片上传
- 多文档 tab 管理
- 代码高亮（syntax highlighting）
- 协同编辑
