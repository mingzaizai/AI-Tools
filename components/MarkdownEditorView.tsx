import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import {
  Bold, Italic, Heading1, Heading2, Heading3,
  Minus, Link, Code, FileCode, ListChecks,
  Download, FileText
} from 'lucide-react';

const DEFAULT_CONTENT = `# 欢迎使用 Markdown 编辑器

## 基本语法

**加粗文字** 和 *斜体文字*

### 列表

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
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 导出 HTML
  const exportHTML = () => {
    const rendered = DOMPurify.sanitize(marked.parse(content) as string);
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
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderedHTML = useMemo(
    () => DOMPurify.sanitize(marked.parse(content) as string),
    [content]
  );

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
            className="flex-1 p-6 overflow-y-auto overflow-x-hidden markdown-preview"
            dangerouslySetInnerHTML={{ __html: renderedHTML }}
          />
        </div>
      </div>
    </div>
  );
};

export default MarkdownEditorView;
