# 🛠️ AI Tools - 开发者工具集

<p align="left">
  <img src="https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-blue?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-6.4-green?style=for-the-badge&logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/Version-1.0.3-blue?style=for-the-badge" alt="Version" />
</p>

> **AI Tools** 是一款面向开发者的多功能工具集，集成了二维码生成、时间转换、SQL 编辑、JSON 处理、Markdown 编辑、GitHub 检索等实用工具，提升开发效率。

---

## 🎯 功能概览

### 📦 核心功能模块

#### 1. 🔗 网络工具
- **二维码生成器**：支持自定义内容和多种相框样式
  - 7 种相框样式：无边框、简约白框、圆角边框、渐变边框、双边框、虚线边框、拍立得
  - 实时预览
  - 一键下载 PNG 格式
  - 使用 api.qrserver.com 生成二维码

#### 2. ⏰ 时间工具
- **日期 → 时间戳**：可编辑文本框，支持多种格式
  - ISO 格式：2024-01-01T12:00:00
  - 中文格式：2024-01-01 12:00:00
  - 时间戳：1704110400
  - 同时输出秒级和毫秒级时间戳

- **时间戳 → 日期**：毫秒/秒级时间戳转换
  - 自动识别时间戳类型
  - 格式化输出为本地时间

- **日期格式化**：统一日期格式
  - 支持多种输入格式
  - 输出标准格式：YYYY-MM-DD HH:mm:ss

#### 3. 🗄️ SQL 编辑器
- **SQLite 数据库管理**：
  - 创建/打开数据库文件
  - 执行 SQL 查询语句
  - 可视化数据表格
  - 导出查询结果为 CSV
  - 支持数据库文件下载

- **预设数据库**：
  - 示例数据库（包含用户和产品数据）
  - 支持自定义 SQL 脚本

#### 4. 📄 JSON 编辑器
- **JSON 格式化**：美化 JSON 格式
- **JSON 压缩**：移除空格和换行
- **JSON 验证**：检查 JSON 语法
- **错误提示**：显示具体错误位置和类型

#### 5. 🧮 开发者工具
- **Base64 编解码**：文本与 Base64 互转
- **URL 编解码**：处理 URL 特殊字符
- **时间戳转换**：快速时间转换工具

#### 6. 📝 Markdown 编辑器
- **实时预览**：左编辑右预览双栏布局
- **撤回 / 重做**：完整操作历史
- **XSS 防护**：DOMPurify 过滤渲染内容
- **样式适配**：使用 markdown-preview 自定义样式

#### 7. 🔍 GitHub 检索（新增）
- **仓库搜索**：调用 GitHub Search API，按关键词检索仓库
- **多维过滤**：
  - 编程语言：TypeScript / JavaScript / Python / Shell / HTML / Java / C# / CSS / Go
  - Stars 门槛：>100 / >1k / >10k
  - 排序方式：最多 Stars / 最近更新 / 最相关
- **分类 Chip**：12 个常用分类快速跳转（网络请求、图片加载、数据库、JSON 解析、UI 组件、依赖注入、压缩、日志、测试、缓存、安全加密、消息队列、**AI 工作流**）
- **热门库**：选中分类后展示该分类的热门库列表，一键搜索（含 LangChain、CrewAI、everything-claude-code、superpowers 等）
- **搜索历史**：本地记录最近 10 条搜索词，支持删除
- **左右分栏布局**：
  - 左侧：仓库卡片列表（Stars / Forks / 语言 / 更新时间）
  - 右侧：README 预览面板，优先展示中文 README
- **README 渲染**：marked + DOMPurify，安全渲染 Markdown
- **中文 README 优先**：自动检测 README_cn / README_zh 等命名，优先展示
- **分页加载**：底部"加载更多"，追加下一页结果
- **Token 配置**：Settings 中配置 GitHub Token，提升 API 频率限制（60 → 5000 次/小时）
- **错误处理**：Rate Limit 提示、搜索失败重试、README 加载独立容错

---

## 🏗️ 技术架构

### 技术栈
- **前端框架**：React 19.2.3 + TypeScript 5.8.2
- **构建工具**：Vite 6.4.1
- **图标库**：Lucide React 0.562.0
- **数据库引擎**：sql.js 1.14.1 (SQLite WebAssembly 版本)
- **Markdown 渲染**：marked 17 + DOMPurify
- **第三方 API**：qrserver.com (二维码生成)、GitHub REST API v3

### 项目结构
```
AI-Tools/
├── components/              # 组件目录
│   ├── Header.tsx          # 顶部导航栏
│   ├── TimeToolsView.tsx   # 时间工具视图
│   ├── NetworkToolsView.tsx # 网络工具视图（二维码生成）
│   ├── SQLEditorView.tsx   # SQL 编辑器视图
│   ├── JSONEditorView.tsx  # JSON 编辑器视图
│   ├── MarkdownEditorView.tsx # Markdown 编辑器视图
│   ├── GitHubSearchView.tsx   # GitHub 检索主视图
│   ├── SettingsView.tsx    # 设置视图
│   └── github/            # GitHub 检索子组件
│       ├── SearchBar.tsx   # 搜索框 + 过滤条 + 分类 + 热门库
│       ├── RepoList.tsx    # 仓库列表
│       ├── RepoCard.tsx    # 仓库卡片
│       └── ReadmePanel.tsx # README 预览面板
├── hooks/
│   └── useGitHubSearch.ts  # GitHub 搜索 Hook
├── types.ts                 # 类型定义
├── App.tsx                  # 主应用组件
├── package.json             # 项目配置
└── versions/                # 版本记录目录
    ├── 1.0.0/              # v1.0.0
    ├── 1.0.1/              # v1.0.1
    ├── 1.0.2/              # v1.0.2
    └── 1.0.3/              # v1.0.3��当前）
```

---

## 🚀 快速开始

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev
```

### 生产构建
```bash
npm run build
```

### 预览构建结果
```bash
npm run preview
```

---

## 📝 更新日志

### v1.0.3 (2026-03-29)

#### ✨ 新增功能
- **GitHub 检索模块**：全新模块，支持搜索 GitHub 仓库并预览 README
  - 多维过滤：语言、Stars 门槛、排序方式
  - 13 个分类 Chip 快速切换，含全新「AI 工作流」分类
  - 热门库列表：选中分类展示热门库，支持一键搜索
    - AI 工作流：LangChain、LangGraph、CrewAI、AutoGen、Dify、Flowise、n8n、LlamaIndex、Semantic Kernel、superpowers、everything-claude-code
  - 搜索历史记录（最多 10 条，可删除）
  - 左右分栏：仓库列表 + README 实时预览
  - 中文 README 优先展示（自动检测 README_cn / README_zh 等命名）
  - 分页加载��多
  - GitHub Token 配置（Settings 页面）

- **Markdown 编辑器**：
  - 撤回 / 重做功能
  - 实时预览，XSS 防护

#### 🐛 问题修复
- 修复 ReadmePanel 切换仓库时的竞态条件（AbortController 清理）
- 修复 loadMore 失败时整个列表被替换的问题（独立 loadMoreError 状态）
- 修复中文 README 大小写不匹配的检测问题（case-insensitive 正则）
- 修复宽表格撑破预览布局的问题（overflow-x-hidden）

#### 🔧 优化改进
- markdown-preview 样式统一（Markdown 编辑器与 GitHub 预览共用）
- GitHub 搜索 Hook 使用 useRef 避免异步闭包陈旧引用

---

### v1.0.2 (2026-03-22)

#### ✨ 新增功能
- **二维码相框样式**：新增 7 种相框样式供选择
- **日期输入优化**：时间工具的���期输入框改为可编辑文本框

#### 🐛 问题修复
- 修复二维码下载跳转到 API 地址的问题
- 修复相框样式下载后不显示的问题

#### 🔧 优化改进
- 升级 Vite 到 6.4.1

---

### v1.0.1
- 添加 SQL 编辑器功能
- 添加 JSON 编辑器功能
- 添加开发者工具（Base64、URL 编解码）

### v1.0.0
- 初始版本发布
- 包含图片编辑、AI 分析、批量处理等核心功能

---

## 🔧 开发指南

### 添加新工具模块

1. **创建组件文件**
```typescript
// components/NewToolView.tsx
import React from 'react';

export const NewToolView: React.FC = () => {
  return (
    <div className="tool-view">
      <h2>新工具</h2>
      {/* 实现功能 */}
    </div>
  );
};
```

2. **在 App.tsx 中注册**
```typescript
import { NewToolView } from './components/NewToolView';

// 添加到 mode 判断中
{currentMode === 'new-tool' && <NewToolView />}
```

3. **在 Header 中添加导航**
```typescript
case AppMode.NEW_TOOL:
  return '新工具';
```

---

## 📚 相关资源

- **GitHub REST API**: https://docs.github.com/en/rest
- **sql.js**: https://sql.js.org/
- **Lucide React**: https://lucide.dev/
- **marked**: https://marked.js.org/
- **DOMPurify**: https://github.com/cure53/DOMPurify

---

## 📄 许可证

MIT License

---

## 👥 贡献

欢迎提交 Issue 和 Pull Request！

---

**版本**: 1.0.3
**最后更新**: 2026-03-29
**维护者**: AI Tools Team
