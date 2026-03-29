# GitHub 检索模块设计文档

**日期：** 2026-03-28
**状态：** 待实现

---

## 概述

在现有 AI-Tools 工具箱中新增"GitHub 检索"模块，允许用户搜索 GitHub 仓库，按语言、Stars、更新时间过滤，并在页面内直接预览项目 README。

---

## 文件结构

```
/ (项目根目录)
├── components/
│   ├── GitHubSearchView.tsx         # 主入口，左右分栏布局
│   └── github/
│       ├── SearchBar.tsx            # 搜索框 + 过滤条
│       ├── RepoList.tsx             # 滚动结果列表，含加载/空状态
│       ├── RepoCard.tsx             # 单个仓库卡片
│       └── ReadmePanel.tsx          # 右侧 README 预览面板
├── hooks/
│   └── useGitHubSearch.ts           # API 请求与状态管理
└── types.ts                         # 新增 GitHubRepo、SearchParams 类型
```

---

## 架构与数据流

```
SearchBar (用户输入关键词 + 过滤条件)
  → useGitHubSearch (调用 GitHub Search API，管理分页/loading/error)
  → RepoList (渲染结果列表)
    → RepoCard (单条仓库信息)
      → 用户点击卡片
        → ReadmePanel (调用 README API，用 marked + dompurify 渲染)
```

GitHub API 端点：
- 搜索仓库：`GET https://api.github.com/search/repositories?q={query}&sort={sort}&per_page=30&page={page}`
- 读取 README：`GET https://api.github.com/repos/{owner}/{repo}/readme`（响应体 content 字段为 base64，需 atob 解码）

---

## 组件详细设计

### SearchBar

- 搜索框支持回车或点击按钮触发搜索
- 过滤项：
  - **语言**：文本输入（如 `TypeScript`、`Go`），附加到 query 为 `language:xxx`
  - **Stars**：下拉选择，选项：不限 / >100 / >1k / >10k，附加为 `stars:>xxx`
  - **排序**：下拉选择，选项：最多 Stars（`sort=stars`）/ 最近更新（`sort=updated`）/ 最相关（不传 `sort` 参数，GitHub 默认行为）
- 任意过滤条变更后自动重新搜索（重置到第 1 页）

### RepoList

- 每次加载 30 条，底部"加载更多"按钮追加下一页
- 状态：loading 骨架屏 / 空结果提示 / 错误提示 + 重试按钮
- 选中状态高亮当前卡片

### RepoCard

展示字段：
- 仓库全名（`owner/repo`），点击跳转 GitHub 新标签页
- 描述（最多 2 行截断）
- 编程语言（带色块）
- ⭐ Stars 数（千位格式化，如 `12.3k`）
- 🍴 Forks 数
- 更新时间（相对时间，如"3 天前"）

### ReadmePanel

- 右侧固定，宽度约 55%
- 顶部：仓库全名 + "在 GitHub 打开 ↗" 按钮
- 内容区：README Markdown 经 `marked` 解析后，`dompurify` 过滤，dangerouslySetInnerHTML 渲染
- 加载中显示骨架屏
- 未选中仓库时显示空占位："← 选择左侧项目查看 README"

---

## Settings 变更

在 `SettingsView.tsx` 中新增 "GitHub Token" 配置项：
- 输入框类型 `type="password"`，防止 Token 明文显示
- 存入 `localStorage`，key 为 `github_token`
- `useGitHubSearch` 和 README 请求均从 localStorage 读取，若存在则加入 `Authorization: Bearer {token}` Header

---

## 导航注册

- `types.ts`：`AppMode` 枚举新增 `GITHUB_SEARCH`
- `App.tsx`：导入 `GitHubSearchView`，注册导航按钮（图标：`Github`），添加渲染分支

---

## 错误处理

| 场景 | 处理方式 |
|------|---------|
| Rate limit 耗尽（HTTP 403 / RateLimit-Remaining: 0） | 列表区显示提示，引导前往 Settings 配置 Token |
| 未配置 Token | 顶部显示淡黄色提示条，说明每小时仅 60 次限制 |
| 搜索请求失败 | 列表区显示错误信息 + 重试按钮 |
| README 加载失败 | 右侧面板显示"README 加载失败"，不影响左侧列表 |
| 仓库无 README（404） | 右侧面板显示"该项目暂无 README" |
| 搜索词为空 | 不发请求，显示引导文案 |
| 搜索无结果 | 显示"未找到相关项目，试试其他关键词" |

---

## 类型定义（新增到 types.ts）

```typescript
export interface GitHubRepo {
  id: number;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  updated_at: string;
  license: { spdx_id: string } | null;
  owner: { login: string; avatar_url: string };
}

export interface SearchParams {
  query: string;
  language: string;
  minStars: '' | '100' | '1000' | '10000';
  sort: 'stars' | 'updated' | 'best-match'; // best-match 时 API 不传 sort 参数
}
```

---

## 布局示意

```
┌──────────────────────────────────────────────────────────────┐
│ [搜索框________________________] [搜索]                       │
│ 语言: [________] Stars: [▼不限] 排序: [▼最多Stars]           │
├──────────────────────┬───────────────────────────────────────┤
│ facebook/react  ★195k│ facebook/react          [在GitHub打开]│
│ JavaScript · 2天前   │                                       │
│ A declarative, ...   │ # React                               │
│──────────────────────│ A declarative, efficient, and         │
│ vuejs/vue       ★209k│ flexible JavaScript library...        │
│ TypeScript · 3天前   │                                       │
│──────────────────────│ ## Installation                       │
│                      │ ```                                   │
│ [加载更多]           │ npm install react react-dom           │
│                      │ ```                                   │
└──────────────────────┴───────────────────────────────────────┘
```
