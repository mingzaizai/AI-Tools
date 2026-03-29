# Markdown 编辑器 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 AI Tools 工具集中新增 Markdown 编辑器，支持左右分栏实时预览、工具栏快捷操作、本地存储自动保存、导出 HTML 和 Markdown 文件。

**Architecture:** 新增 `MarkdownEditorView.tsx` 组件，使用 `marked` 库解析 Markdown，textarea 绑定 value 实时渲染预览，debounce 500ms 自动保存到 localStorage。在 `types.ts` 添加新 AppMode，在 `App.tsx` 侧边栏注册导航，`Header.tsx` 添加标题映射。

**Tech Stack:** React 19, TypeScript, Vite, marked（新增）, Tailwind CSS, Lucide React

---

## 文件变更总览

| 操作 | 文件 | 说明 |
|------|------|------|
| 新增 | `components/MarkdownEditorView.tsx` | Markdown 编辑器主组件 |
| 修改 | `types.ts` | 添加 `MARKDOWN_EDITOR` 到 AppMode |
| 修改 | `App.tsx` | 注册侧边栏导航 + 渲染新 view |
| 修改 | `components/Header.tsx` | 添加 Markdown 编辑器标题映射 |

---

## Task 1: 安装 marked 依赖

**Files:**
- Modify: `package.json`（自动）

- [ ] **Step 1: 安装 marked**

```bash
cd /Users/zhaoxiaoming/AndroidProjects/Ai-Tools
npm install marked
```

- [ ] **Step 2: 验证安装成功**

```bash
cat package.json | grep marked
```

Expected output:
```
"marked": "^x.x.x",
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: 安装 marked 依赖"
```

---

## Task 2: 添加 AppMode 枚举值

**Files:**
- Modify: `types.ts`

- [ ] **Step 1: 在 AppMode 枚举末尾添加 MARKDOWN_EDITOR**

在 `types.ts` 第 58 行，找到：
```typescript
  NETWORK_TOOLS = 'NETWORK_TOOLS'
```
改为：
```typescript
  NETWORK_TOOLS = 'NETWORK_TOOLS',
  MARKDOWN_EDITOR = 'MARKDOWN_EDITOR'
```

- [ ] **Step 2: 验证 TypeScript 无报错**

```bash
npx tsc --noEmit
```

Expected: 无输出（无错误）

- [ ] **Step 3: Commit**

```bash
git add types.ts
git commit -m "feat: 添加 MARKDOWN_EDITOR AppMode"
```

---

## Task 3: 在 Header.tsx 添加标题映射

**Files:**
- Modify: `components/Header.tsx`

- [ ] **Step 1: 在 getTitle switch 中添加 MARKDOWN_EDITOR case**

在 `components/Header.tsx` 第 21 行，找到：
```typescript
      case AppMode.NETWORK_TOOLS: return '网络工具';
```
在其后添加：
```typescript
      case AppMode.MARKDOWN_EDITOR: return 'Markdown 编辑器';
```

- [ ] **Step 2: 验证 TypeScript 无报错**

```bash
npx tsc --noEmit
```

Expected: 无输出

- [ ] **Step 3: Commit**

```bash
git add components/Header.tsx
git commit -m "feat: Header 添加 Markdown 编辑器标题"
```

---

## Task 4: 创建 MarkdownEditorView 组件

**Files:**
- Create: `components/MarkdownEditorView.tsx`

- [ ] **Step 1: 创建组件文件**

创建 `components/MarkdownEditorView.tsx`，内容如下：

```typescript
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { marked } from 'marked';
import {
  Bold, Italic, Heading1, Heading2, Heading3,
  Minus, Link, Code, FileCode, ListChecks,
  Download, FileText
} from 'lucide-react';

const DEFAULT_CONTENT = `# 欢迎使用 Markdown 编辑器

## 基本语法

**加粗文字** 和 *斜体文字*

### 列���

- 无序列表项 1
- 无序列表项 2

1. 有序列表项 1
2. 有序列表项 2

### 任务列表

- [x] 已完成任务
- [ ] 待完成任务

### 代码

行内代码：\`const hello = 'world'\`

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

### 链接与分割线

[点击访问](https://example.com)

---

> 引用文字示例
`;

const STORAGE_KEY = 'md-editor-content';

// debounce 工具函数
function debounce<T extends (...args: any[]) => void>(fn: T, delay: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

const MarkdownEditorView: React.FC = () => {
  const [content, setContent] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY) ?? DEFAULT_CONTENT;
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const isSyncingScroll = useRef(false);

  // debounce 保存到 localStorage
  const saveToStorage = useCallback(
    debounce((value: string) => {
      localStorage.setItem(STORAGE_KEY, value);
    }, 500),
    []
  );

  useEffect(() => {
    saveToStorage(content);
  }, [content, saveToStorage]);

  // 同步滚动
  const handleEditorScroll = () => {
    if (isSyncingScroll.current) return;
    const textarea = textareaRef.current;
    const preview = previewRef.current;
    if (!textarea || !preview) return;
    isSyncingScroll.current = true;
    const ratio = textarea.scrollTop / (textarea.scrollHeight - textarea.clientHeight || 1);
    preview.scrollTop = ratio * (preview.scrollHeight - preview.clientHeight);
    setTimeout(() => { isSyncingScroll.current = false; }, 50);
  };

  const handlePreviewScroll = () => {
    if (isSyncingScroll.current) return;
    const textarea = textareaRef.current;
    const preview = previewRef.current;
    if (!textarea || !preview) return;
    isSyncingScroll.current = true;
    const ratio = preview.scrollTop / (preview.scrollHeight - preview.clientHeight || 1);
    textarea.scrollTop = ratio * (textarea.scrollHeight - textarea.clientHeight);
    setTimeout(() => { isSyncingScroll.current = false; }, 50);
  };

  // 工具栏插入逻辑
  const insertText = (before: string, after: string = '', placeholder: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.slice(start, end);
    const insertValue = selected || placeholder;
    const newText = content.slice(0, start) + before + insertValue + after + content.slice(end);

    setContent(newText);

    // 恢复光标位置
    requestAnimationFrame(() => {
      textarea.focus();
      const newCursorPos = start + before.length + insertValue.length + after.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    });
  };

  // 在行首插入标题前缀
  const insertHeading = (prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const lineStart = content.lastIndexOf('\n', start - 1) + 1;
    const newText = content.slice(0, lineStart) + prefix + content.slice(lineStart);
    setContent(newText);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(lineStart + prefix.length, lineStart + prefix.length);
    });
  };

  const toolbarButtons = [
    { icon: <Heading1 className="w-4 h-4" />, title: '标题 H1', action: () => insertHeading('# ') },
    { icon: <Heading2 className="w-4 h-4" />, title: '标题 H2', action: () => insertHeading('## ') },
    { icon: <Heading3 className="w-4 h-4" />, title: '标题 H3', action: () => insertHeading('### ') },
    null, // 分隔符
    { icon: <Bold className="w-4 h-4" />, title: '加粗', action: () => insertText('**', '**', '加粗文字') },
    { icon: <Italic className="w-4 h-4" />, title: '斜体', action: () => insertText('*', '*', '斜体文字') },
    null,
    { icon: <Minus className="w-4 h-4" />, title: '分割线', action: () => insertText('\n---\n', '', '') },
    { icon: <Link className="w-4 h-4" />, title: '链接', action: () => insertText('[', '](url)', '链接文字') },
    { icon: <Code className="w-4 h-4" />, title: '行内代码', action: () => insertText('`', '`', '代码') },
    { icon: <FileCode className="w-4 h-4" />, title: '代码块', action: () => insertText('```\n', '\n```', '代码') },
    { icon: <ListChecks className="w-4 h-4" />, title: '任务列表', action: () => insertText('\n- [ ] ', '', '任务') },
  ];

  // 导出 Markdown
  const exportMarkdown = () => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  // 导出 HTML
  const exportHTML = () => {
    const rendered = marked(content) as string;
    const html = `<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>导出文档</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.7; color: #1e293b; }
    h1, h2, h3, h4 { margin-top: 1.5em; margin-bottom: 0.5em; font-weight: 600; }
    h1 { font-size: 2em; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.3em; }
    h2 { font-size: 1.5em; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.2em; }
    code { background: #f1f5f9; padding: 0.2em 0.4em; border-radius: 4px; font-family: 'JetBrains Mono', monospace; font-size: 0.9em; }
    pre { background: #1e293b; color: #e2e8f0; padding: 1em; border-radius: 8px; overflow-x: auto; }
    pre code { background: none; padding: 0; color: inherit; }
    blockquote { border-left: 4px solid #6366f1; margin: 0; padding-left: 1em; color: #64748b; }
    table { border-collapse: collapse; width: 100%; margin: 1em 0; }
    th, td { border: 1px solid #e2e8f0; padding: 0.5em 1em; }
    th { background: #f8fafc; font-weight: 600; }
    a { color: #6366f1; }
    hr { border: none; border-top: 1px solid #e2e8f0; margin: 2em 0; }
    ul, ol { padding-left: 1.5em; }
    li { margin: 0.25em 0; }
  </style>
</head>
<body>
${rendered}
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderedHTML = marked(content) as string;

  return (
    <div className="flex flex-col h-full bg-[#f8fafc]">
      {/* 工具栏 */}
      <div className="flex items-center gap-1 px-4 py-2 bg-white border-b border-slate-200 flex-shrink-0 flex-wrap">
        {toolbarButtons.map((btn, i) =>
          btn === null ? (
            <div key={`sep-${i}`} className="w-px h-5 bg-slate-200 mx-1" />
          ) : (
            <button
              key={btn.title}
              onClick={btn.action}
              title={btn.title}
              className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
            >
              {btn.icon}
            </button>
          )
        )}

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={exportMarkdown}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            <FileText className="w-4 h-4" />
            导出 MD
          </button>
          <button
            onClick={exportHTML}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
          >
            <Download className="w-4 h-4" />
            导出 HTML
          </button>
        </div>
      </div>

      {/* 编辑区 + 预览区 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 编辑区 */}
        <div className="w-1/2 flex flex-col border-r border-slate-200">
          <div className="px-4 py-1.5 bg-slate-50 border-b border-slate-200 text-xs text-slate-500 font-medium">
            编辑
          </div>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onScroll={handleEditorScroll}
            className="flex-1 p-4 resize-none outline-none font-mono text-sm leading-relaxed text-slate-800 bg-white"
            placeholder="在此输入 Markdown..."
            spellCheck={false}
          />
        </div>

        {/* 预览区 */}
        <div className="w-1/2 flex flex-col">
          <div className="px-4 py-1.5 bg-slate-50 border-b border-slate-200 text-xs text-slate-500 font-medium">
            预览
          </div>
          <div
            ref={previewRef}
            onScroll={handlePreviewScroll}
            className="flex-1 p-6 overflow-y-auto prose prose-slate max-w-none"
            dangerouslySetInnerHTML={{ __html: renderedHTML }}
          />
        </div>
      </div>
    </div>
  );
};

export default MarkdownEditorView;
```

- [ ] **Step 2: 验证 TypeScript 无报错**

```bash
npx tsc --noEmit
```

Expected: 无输出

- [ ] **Step 3: Commit**

```bash
git add components/MarkdownEditorView.tsx
git commit -m "feat: 新增 MarkdownEditorView 组件"
```

---

## Task 5: 在 App.tsx 注册导航和视图

**Files:**
- Modify: `App.tsx`

- [ ] **Step 1: 添加 import**

在 `App.tsx` 第 27 行（`import NetworkToolsView` 之后）添加：

```typescript
import MarkdownEditorView from './components/MarkdownEditorView';
```

同时在 lucide-react 图标引入中（第 2-15 行），在 `Globe` 后面添加 `FileText`：

```typescript
import {
  Image as ImageIcon,
  Layers,
  Settings,
  Maximize2,
  Box,
  Combine,
  FileJson,
  Database,
  Code,
  Clock,
  Globe,
  FileText
} from 'lucide-react';
```

- [ ] **Step 2: 在侧边栏添加导航按钮**

在 `App.tsx` 第 122-129 行（网络工具 NavButton 块）之后，添加：

```typescript
        <div className="p-4 border-b border-slate-200">
          <NavButton
            active={mode === AppMode.MARKDOWN_EDITOR}
            icon={<FileText />}
            label="Markdown 编辑器"
            onClick={() => setMode(AppMode.MARKDOWN_EDITOR)}
          />
        </div>
```

- [ ] **Step 3: 在 main 区域添加视图渲染**

在 `App.tsx` 第 262-264 行（`NETWORK_TOOLS` 渲染块）之后，添加：

```typescript
          {mode === AppMode.MARKDOWN_EDITOR && (
            <MarkdownEditorView />
          )}
```

- [ ] **Step 4: 验证 TypeScript 无报错**

```bash
npx tsc --noEmit
```

Expected: 无输出

- [ ] **Step 5: 启动开发服务器验证页面正常**

```bash
npm run dev
```

打开 http://localhost:3000，点击侧边栏「Markdown 编辑器」，验证：
- [ ] 左右分栏正常显示
- [ ] 工具栏按钮可点击
- [ ] 输入 Markdown 后右侧实时预览更新
- [ ] 刷新页面后内容从 localStorage 恢复
- [ ] 导出 MD 按钮下载 `document.md` 文件
- [ ] 导出 HTML 按钮下载 `document.html` 文件，在浏览器打开样式正常

- [ ] **Step 6: Commit**

```bash
git add App.tsx
git commit -m "feat: App.tsx 注册 Markdown 编辑器导航和视图"
```

---

## Task 6: 添加 prose 样式支持

> 预览区使用了 Tailwind `prose` 类，需要安装 `@tailwindcss/typography` 插件。

**Files:**
- Modify: `package.json`（自动）
- Modify: `vite.config.ts` 或 Tailwind 配置（视项目结构而定）

- [ ] **Step 1: 检查是否已有 Tailwind 配置文件**

```bash
ls /Users/zhaoxiaoming/AndroidProjects/Ai-Tools | grep tailwind
```

- [ ] **Step 2a: 若无 tailwind.config.js，检查 vite.config.ts 中是否内联配置**

```bash
cat vite.config.ts
```

- [ ] **Step 2b: 安装 typography 插件**

```bash
npm install -D @tailwindcss/typography
```

- [ ] **Step 3: 若存在 tailwind.config.js，添加 plugins**

在 `tailwind.config.js` 的 `plugins` 数组中添加：
```javascript
require('@tailwindcss/typography')
```

若无独立配置文件，在 `index.css` 或全局 CSS 中添加 prose 基础样式（见 Step 4 备选方案）。

- [ ] **Step 4: 备选方案 — 若无法使用 typography 插件，给预览区添加内联样式类**

将 `MarkdownEditorView.tsx` 中预览区的 `className` 从：
```typescript
className="flex-1 p-6 overflow-y-auto prose prose-slate max-w-none"
```
改为：
```typescript
className="flex-1 p-6 overflow-y-auto overflow-x-hidden markdown-preview"
```

并在 `index.css`（或全局样式文件）中添加：
```css
.markdown-preview h1 { font-size: 1.875rem; font-weight: 700; margin: 1.2em 0 0.5em; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.3em; }
.markdown-preview h2 { font-size: 1.5rem; font-weight: 600; margin: 1.2em 0 0.5em; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.2em; }
.markdown-preview h3 { font-size: 1.25rem; font-weight: 600; margin: 1em 0 0.4em; }
.markdown-preview p { margin: 0.75em 0; line-height: 1.75; }
.markdown-preview code { background: #f1f5f9; padding: 0.2em 0.4em; border-radius: 4px; font-size: 0.875em; font-family: monospace; }
.markdown-preview pre { background: #1e293b; color: #e2e8f0; padding: 1em; border-radius: 8px; overflow-x: auto; margin: 1em 0; }
.markdown-preview pre code { background: none; padding: 0; color: inherit; }
.markdown-preview blockquote { border-left: 4px solid #6366f1; margin: 1em 0; padding-left: 1em; color: #64748b; }
.markdown-preview ul, .markdown-preview ol { padding-left: 1.5em; margin: 0.5em 0; }
.markdown-preview li { margin: 0.3em 0; }
.markdown-preview table { border-collapse: collapse; width: 100%; margin: 1em 0; }
.markdown-preview th, .markdown-preview td { border: 1px solid #e2e8f0; padding: 0.5em 1em; }
.markdown-preview th { background: #f8fafc; font-weight: 600; }
.markdown-preview a { color: #6366f1; }
.markdown-preview hr { border: none; border-top: 1px solid #e2e8f0; margin: 1.5em 0; }
.markdown-preview strong { font-weight: 700; }
.markdown-preview em { font-style: italic; }
```

- [ ] **Step 5: 验证预览区样式正常**

启动 `npm run dev`，在编辑器中输入以下测试内容，确认预览区各元素样式正常：

```markdown
# 标题一
## 标题二
**加粗** *斜体*
- 列表项
> 引用
`行内代码`
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: 添加 Markdown 预览区样式"
```
