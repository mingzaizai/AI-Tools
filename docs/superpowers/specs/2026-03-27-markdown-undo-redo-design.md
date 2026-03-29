# Markdown 编辑器 撤回/重做 设计文档

**日期**: 2026-03-27
**状态**: 已确认

---

## 概述

为 MarkdownEditorView 添加撤回/重做功能，支持快捷键（Cmd+Z / Cmd+Shift+Z）和工具栏按钮两种触发方式，历史记录按输入停顿（500ms）分组。

---

## 功能描述

- **撤回**：`Cmd+Z`（Mac）/ `Ctrl+Z`（Windows）+ 工具栏按钮
- **重做**：`Cmd+Shift+Z`（Mac）/ `Ctrl+Shift+Z`（Windows）+ 工具栏按钮
- **历史粒度**：输入停顿 500ms 后推入历史栈；工具栏操作（加粗、标题等按钮点击）立即推入历史栈
- **历史上限**：最多保存 100 步，超出时丢弃最旧的记录
- **按钮状态**：无历史可撤回时撤回按钮禁用；无未来可重做时重做按钮禁用

---

## 实现方案

### 历史栈结构

```typescript
interface HistoryState {
  stack: string[];   // 历史内容数组
  index: number;     // 当前指针（指向当前内容）
}
```

用 `useRef` 持有历史栈（不触发重渲染），用 `useState` 持有当前 index（触发按钮禁用状态更新）。

### 推入历史的时机

1. **输入停顿 500ms**：在 `onChange` 的 debounce 回调中，将当前内容推入栈
2. **工具栏按钮点击**：在 `insertText` / `insertHeading` 操作前，先推入当前内容快照

### 撤回逻辑

```
index > 0 时：index -= 1，setContent(stack[index])
```

### 重做逻辑

```
index < stack.length - 1 时：index += 1，setContent(stack[index])
```

### 推入新内容时清除未来历史

当用户在撤回中间状态后继续输入，清除 index 之后的所有历史：

```
stack = stack.slice(0, index + 1)
stack.push(newContent)
index = stack.length - 1
```

### 历史上限处理

推入时若 `stack.length > 100`，丢弃 `stack[0]`，index 相应 -1。

---

## UI 变更

### 工具栏

在现有工具栏按钮最左侧（H1 之前）添加：

```
↩ 撤回  ↪ 重做  |  H1 H2 H3 ...
```

使用 Lucide 图标：`Undo2`、`Redo2`

禁用状态：`opacity-50 cursor-not-allowed`，点击无效果

### 快捷键

在编辑区 textarea 上监听 `onKeyDown`：

```typescript
if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
  e.preventDefault();
  handleUndo();
}
if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) {
  e.preventDefault();
  handleRedo();
}
```

---

## 与 localStorage 的关系

撤回/重做操作修改 content 后，现有的 debounce localStorage 保存逻辑自动触发，无需额外处理。

---

## 不在本次范围内

- 光标位置的撤回恢复（仅恢复内容，不恢复光标位置）
- 跨会话的历史持久化
- 选区状态的撤回
