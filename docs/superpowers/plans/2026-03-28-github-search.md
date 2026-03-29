# GitHub 检索模块 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 AI-Tools 工具箱中新增 GitHub 检索模块，支持关键词搜索仓库、按语言/Stars/排序过滤，左右分栏预览 README。

**Architecture:** 自定义 Hook `useGitHubSearch` 封装所有 GitHub API ��求和状态管理；主视图 `GitHubSearchView` 持有已选仓库状态，将搜索结果列表和 README 预览分拆到独立子组件；Settings 页新增 Token 配置项，Token 存 localStorage，请求时注入 Authorization Header。

**Tech Stack:** React 19, TypeScript, Tailwind CSS (inline), GitHub REST API v3, marked v17 (`marked.parse`), dompurify, lucide-react

---

## 文件清单

| 操作 | 路径 | 职责 |
|------|------|------|
| 修改 | `types.ts` | 添加 `GitHubRepo`、`SearchParams` 类型，`AppMode.GITHUB_SEARCH` |
| 新建 | `hooks/useGitHubSearch.ts` | GitHub 搜索 API、分页、loading/error 状态 |
| 新建 | `components/github/RepoCard.tsx` | 单个仓库卡片展示 |
| 新建 | `components/github/SearchBar.tsx` | 搜索框 + 语言/Stars/排序过滤条 |
| 新建 | `components/github/ReadmePanel.tsx` | 右侧 README Markdown 渲染面板 |
| 新建 | `components/github/RepoList.tsx` | 仓库列表（含加载更多、空/错误状态） |
| 新建 | `components/GitHubSearchView.tsx` | 主入口，左右分栏布局 |
| 修改 | `components/SettingsView.tsx` | 新增 GitHub Token 配置项 |
| 修改 | `App.tsx` | 注册导航项和视图渲染 |

---

## Task 1: 添加类型定义

**Files:**
- Modify: `types.ts`

- [ ] **Step 1: 在 `types.ts` 末尾添加类型**

打开 `types.ts`，在文件末尾追加：

```typescript
// GitHub 检索相关类型
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

- [ ] **Step 2: 在 `AppMode` 枚举中添加新模式**

在 `types.ts` 的 `AppMode` 枚举末尾添加一行：

```typescript
export enum AppMode {
  LIBRARY = 'LIBRARY',
  EDITOR = 'EDITOR',
  BATCH = 'BATCH',
  MERGE = 'MERGE',
  JSON_EDIT = 'JSON_EDIT',
  SETTINGS = 'SETTINGS',
  SQL_EDITOR = 'SQL_EDITOR',
  ENCODING_TOOLS = 'ENCODING_TOOLS',
  TIME_TOOLS = 'TIME_TOOLS',
  NETWORK_TOOLS = 'NETWORK_TOOLS',
  MARKDOWN_EDITOR = 'MARKDOWN_EDITOR',
  GITHUB_SEARCH = 'GITHUB_SEARCH'   // ← 新增这行
}
```

- [ ] **Step 3: 验证 TypeScript 无报错**

```bash
npx tsc --noEmit
```

期望：无输出（无错误）

---

## Task 2: 创建 useGitHubSearch Hook

**Files:**
- Create: `hooks/useGitHubSearch.ts`

- [ ] **Step 1: 创建 `hooks/` 目录并新建文件**

创建文件 `hooks/useGitHubSearch.ts`，内容如下：

```typescript
import { useState, useRef } from 'react';
import { GitHubRepo, SearchParams } from '../types';

const PER_PAGE = 30;

function buildQuery(params: SearchParams): string {
  let q = params.query.trim();
  if (params.language) q += ` language:${params.language}`;
  if (params.minStars) q += ` stars:>${params.minStars}`;
  return q;
}

function getHeaders(): Record<string, string> {
  const token = localStorage.getItem('github_token');
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github+json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

function buildUrl(params: SearchParams, page: number): string {
  const q = encodeURIComponent(buildQuery(params));
  const sortPart = params.sort !== 'best-match' ? `&sort=${params.sort}` : '';
  return `https://api.github.com/search/repositories?q=${q}${sortPart}&per_page=${PER_PAGE}&page=${page}`;
}

export function useGitHubSearch() {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const currentParams = useRef<SearchParams | null>(null);
  const currentPage = useRef(1);

  const search = async (params: SearchParams) => {
    if (!params.query.trim()) return;
    currentParams.current = params;
    currentPage.current = 1;

    setLoading(true);
    setError(null);
    setRepos([]);
    setHasMore(false);

    try {
      const res = await fetch(buildUrl(params, 1), { headers: getHeaders() });

      if (res.status === 403 && res.headers.get('X-RateLimit-Remaining') === '0') {
        throw new Error('RATE_LIMIT');
      }
      if (!res.ok) throw new Error(`请求失败 (${res.status})`);

      const data = await res.json();
      setRepos(data.items ?? []);
      setHasMore(data.total_count > PER_PAGE);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!currentParams.current || loadingMore) return;
    const nextPage = currentPage.current + 1;

    setLoadingMore(true);
    try {
      const res = await fetch(buildUrl(currentParams.current, nextPage), { headers: getHeaders() });
      if (!res.ok) throw new Error(`请求失败 (${res.status})`);

      const data = await res.json();
      setRepos(prev => [...prev, ...(data.items ?? [])]);
      currentPage.current = nextPage;
      setHasMore(data.total_count > nextPage * PER_PAGE);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoadingMore(false);
    }
  };

  return { repos, loading, loadingMore, error, hasMore, search, loadMore };
}
```

- [ ] **Step 2: 验证 TypeScript 无报错**

```bash
npx tsc --noEmit
```

期望：无输出

---

## Task 3: 创建 RepoCard 组件

**Files:**
- Create: `components/github/RepoCard.tsx`

- [ ] **Step 1: 创建目录并新建文件**

创建文件 `components/github/RepoCard.tsx`：

```typescript
import React from 'react';
import { Star, GitFork, ExternalLink } from 'lucide-react';
import { GitHubRepo } from '../../types';

const LANG_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572A5',
  Go: '#00ADD8',
  Rust: '#dea584',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  Vue: '#41b883',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Shell: '#89e051',
};

function formatStars(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return '今天';
  if (days === 1) return '1 天前';
  if (days < 30) return `${days} 天前`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} 个月前`;
  return `${Math.floor(months / 12)} 年前`;
}

interface RepoCardProps {
  repo: GitHubRepo;
  selected: boolean;
  onClick: () => void;
}

const RepoCard: React.FC<RepoCardProps> = ({ repo, selected, onClick }) => {
  const langColor = repo.language ? (LANG_COLORS[repo.language] ?? '#8b949e') : null;

  return (
    <div
      onClick={onClick}
      className={`p-4 border-b border-slate-100 cursor-pointer transition-colors hover:bg-slate-50 ${
        selected ? 'bg-indigo-50 border-l-2 border-l-indigo-500' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <span className="text-sm font-semibold text-indigo-600 truncate flex-1">
          {repo.full_name}
        </span>
        <a
          href={repo.html_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className="text-slate-400 hover:text-slate-600 shrink-0"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {repo.description && (
        <p className="text-xs text-slate-500 line-clamp-2 mb-2">{repo.description}</p>
      )}

      <div className="flex items-center gap-3 text-xs text-slate-500">
        {langColor && (
          <span className="flex items-center gap-1">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: langColor }}
            />
            {repo.language}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Star className="w-3 h-3" />
          {formatStars(repo.stargazers_count)}
        </span>
        <span className="flex items-center gap-1">
          <GitFork className="w-3 h-3" />
          {formatStars(repo.forks_count)}
        </span>
        <span className="ml-auto">{relativeTime(repo.updated_at)}</span>
      </div>
    </div>
  );
};

export default RepoCard;
```

- [ ] **Step 2: 验证 TypeScript 无报错**

```bash
npx tsc --noEmit
```

期望：无输出

---

## Task 4: 创建 SearchBar 组件

**Files:**
- Create: `components/github/SearchBar.tsx`

- [ ] **Step 1: 新建文件**

创建文件 `components/github/SearchBar.tsx`：

```typescript
import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { SearchParams } from '../../types';

interface SearchBarProps {
  onSearch: (params: SearchParams) => void;
  loading: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, loading }) => {
  const [query, setQuery] = useState('');
  const [language, setLanguage] = useState('');
  const [minStars, setMinStars] = useState<SearchParams['minStars']>('');
  const [sort, setSort] = useState<SearchParams['sort']>('stars');

  const handleSearch = () => {
    if (!query.trim()) return;
    onSearch({ query, language, minStars, sort });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="p-4 border-b border-slate-200 bg-white space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="搜索 GitHub 项目..."
          className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
        >
          <Search className="w-4 h-4" />
          搜索
        </button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-slate-500 shrink-0">语言</label>
          <input
            type="text"
            value={language}
            onChange={e => setLanguage(e.target.value)}
            placeholder="如 TypeScript"
            className="w-28 px-2 py-1 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-400"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <label className="text-xs text-slate-500 shrink-0">Stars</label>
          <select
            value={minStars}
            onChange={e => setMinStars(e.target.value as SearchParams['minStars'])}
            className="px-2 py-1 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white"
          >
            <option value="">不限</option>
            <option value="100">&gt; 100</option>
            <option value="1000">&gt; 1k</option>
            <option value="10000">&gt; 10k</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <label className="text-xs text-slate-500 shrink-0">排序</label>
          <select
            value={sort}
            onChange={e => setSort(e.target.value as SearchParams['sort'])}
            className="px-2 py-1 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white"
          >
            <option value="stars">最多 Stars</option>
            <option value="updated">最近更新</option>
            <option value="best-match">最相关</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
```

- [ ] **Step 2: 验证 TypeScript 无报错**

```bash
npx tsc --noEmit
```

期望：无输出

---

## Task 5: 创建 ReadmePanel 组件

**Files:**
- Create: `components/github/ReadmePanel.tsx`

- [ ] **Step 1: 新建文件**

创建文件 `components/github/ReadmePanel.tsx`：

```typescript
import React, { useEffect, useState } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { ExternalLink, BookOpen } from 'lucide-react';
import { GitHubRepo } from '../../types';

function getHeaders(): Record<string, string> {
  const token = localStorage.getItem('github_token');
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github+json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

interface ReadmePanelProps {
  repo: GitHubRepo | null;
}

const ReadmePanel: React.FC<ReadmePanelProps> = ({ repo }) => {
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!repo) return;
    setHtml(null);
    setError(null);
    setLoading(true);

    fetch(`https://api.github.com/repos/${repo.full_name}/readme`, {
      headers: getHeaders(),
    })
      .then(res => {
        if (res.status === 404) throw new Error('NO_README');
        if (!res.ok) throw new Error('加载失败');
        return res.json();
      })
      .then(data => {
        const base64 = (data.content as string).replace(/\s/g, '');
        const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
        const text = new TextDecoder('utf-8').decode(bytes);
        const rendered = DOMPurify.sanitize(marked.parse(text) as string);
        setHtml(rendered);
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : '加载失败');
      })
      .finally(() => setLoading(false));
  }, [repo?.full_name]);

  if (!repo) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3">
        <BookOpen className="w-12 h-12 opacity-30" />
        <p className="text-sm">← 选择左侧项目查看 README</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* 顶部栏 */}
      <div className="px-5 py-3 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
        <span className="text-sm font-semibold text-slate-700 truncate">{repo.full_name}</span>
        <a
          href={repo.html_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 shrink-0 ml-3"
        >
          在 GitHub 打开
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading && (
          <div className="space-y-3 animate-pulse">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="h-4 bg-slate-200 rounded"
                style={{ width: `${60 + Math.random() * 40}%` }}
              />
            ))}
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-2">
            <p className="text-sm">
              {error === 'NO_README' ? '该项目暂无 README' : 'README 加载失败'}
            </p>
          </div>
        )}

        {html && !loading && (
          <div
            className="prose prose-sm max-w-none prose-pre:bg-slate-100 prose-pre:rounded prose-code:text-indigo-600 prose-a:text-indigo-600"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )}
      </div>
    </div>
  );
};

export default ReadmePanel;
```

- [ ] **Step 2: 验证 TypeScript 无报错**

```bash
npx tsc --noEmit
```

期望：无输出

---

## Task 6: 创建 RepoList 组件

**Files:**
- Create: `components/github/RepoList.tsx`

- [ ] **Step 1: 新建文件**

创建文件 `components/github/RepoList.tsx`：

```typescript
import React from 'react';
import { Loader2, SearchX, AlertCircle } from 'lucide-react';
import { GitHubRepo } from '../../types';
import RepoCard from './RepoCard';

interface RepoListProps {
  repos: GitHubRepo[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  selectedId: number | null;
  onSelect: (repo: GitHubRepo) => void;
  onLoadMore: () => void;
  onRetry: () => void;
}

const RepoList: React.FC<RepoListProps> = ({
  repos,
  loading,
  loadingMore,
  error,
  hasMore,
  selectedId,
  onSelect,
  onLoadMore,
  onRetry,
}) => {
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">搜索中...</span>
      </div>
    );
  }

  if (error) {
    const isRateLimit = error === 'RATE_LIMIT';
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3 p-6 text-center">
        <AlertCircle className="w-8 h-8 text-red-400" />
        <p className="text-sm text-slate-600">
          {isRateLimit
            ? 'API 请求次数已用完，请在设置中配置 GitHub Token'
            : `请求失败：${error}`}
        </p>
        {!isRateLimit && (
          <button
            onClick={onRetry}
            className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            重试
          </button>
        )}
      </div>
    );
  }

  if (repos.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2">
        <SearchX className="w-8 h-8 opacity-40" />
        <p className="text-sm">未找到相关项目，试试其他关键词</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {repos.map(repo => (
        <RepoCard
          key={repo.id}
          repo={repo}
          selected={repo.id === selectedId}
          onClick={() => onSelect(repo)}
        />
      ))}

      {hasMore && (
        <div className="p-4 flex justify-center">
          <button
            onClick={onLoadMore}
            disabled={loadingMore}
            className="px-4 py-2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg disabled:opacity-50 flex items-center gap-2 transition-colors"
          >
            {loadingMore && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {loadingMore ? '加载中...' : '加载更多'}
          </button>
        </div>
      )}
    </div>
  );
};

export default RepoList;
```

- [ ] **Step 2: 验证 TypeScript 无报错**

```bash
npx tsc --noEmit
```

期望：无输出

---

## Task 7: 创建 GitHubSearchView 主视图

**Files:**
- Create: `components/GitHubSearchView.tsx`

- [ ] **Step 1: 新建文件**

创建文件 `components/GitHubSearchView.tsx`：

```typescript
import React, { useState, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import { GitHubRepo, SearchParams } from '../types';
import { useGitHubSearch } from '../hooks/useGitHubSearch';
import SearchBar from './github/SearchBar';
import RepoList from './github/RepoList';
import ReadmePanel from './github/ReadmePanel';

const GitHubSearchView: React.FC = () => {
  const { repos, loading, loadingMore, error, hasMore, search, loadMore } = useGitHubSearch();
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const lastParams = useRef<SearchParams | null>(null);

  const hasToken = !!localStorage.getItem('github_token');

  const handleSearch = (params: SearchParams) => {
    lastParams.current = params;
    setSelectedRepo(null);
    setHasSearched(true);
    search(params);
  };

  const handleRetry = () => {
    if (lastParams.current) search(lastParams.current);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Token 未配置提示条 */}
      {!hasToken && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border-b border-amber-200 text-amber-700 text-xs shrink-0">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          未配置 GitHub Token，每小时仅 60 次请求限额。前往
          <button
            className="underline font-medium hover:text-amber-900"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('navigate-to-settings'));
            }}
          >
            设置
          </button>
          配置 Token 可提升至 5000 次/小时。
        </div>
      )}

      {/* 搜索栏 */}
      <SearchBar onSearch={handleSearch} loading={loading} />

      {/* 主体：左右分栏 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧列表（45%） */}
        <div className="w-[45%] flex flex-col border-r border-slate-200 overflow-hidden">
          {!hasSearched ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2">
              <p className="text-sm">输入关键词搜索 GitHub 项目</p>
            </div>
          ) : (
            <RepoList
              repos={repos}
              loading={loading}
              loadingMore={loadingMore}
              error={error}
              hasMore={hasMore}
              selectedId={selectedRepo?.id ?? null}
              onSelect={setSelectedRepo}
              onLoadMore={loadMore}
              onRetry={handleRetry}
            />
          )}
        </div>

        {/* 右侧 README（55%） */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          <ReadmePanel repo={selectedRepo} />
        </div>
      </div>
    </div>
  );
};

export default GitHubSearchView;
```

- [ ] **Step 2: 验证 TypeScript 无报错**

```bash
npx tsc --noEmit
```

期望：无输出

---

## Task 8: 更新 SettingsView 添加 GitHub Token 配置

**Files:**
- Modify: `components/SettingsView.tsx`

- [ ] **Step 1: 在文件顶部添加 useState 和 Key 图标引入**

找到 `components/SettingsView.tsx` 的第一行：

```typescript
import React from 'react';
import { Shield, Key, Cpu, Info, Github, ExternalLink, HardDrive } from 'lucide-react';
```

将其替换为（添加 useState，Key 已存在无需改）：

```typescript
import React, { useState } from 'react';
import { Shield, Key, Cpu, Info, Github, ExternalLink, HardDrive, CheckCircle2 } from 'lucide-react';
```

- [ ] **Step 2: 在 SettingsView 组件内添加 Token 状态和处理函数**

找到 `const SettingsView: React.FC = () => {` 这行，在其后的 `return` 之前插入状态代码：

```typescript
const SettingsView: React.FC = () => {
  const [token, setToken] = useState(localStorage.getItem('github_token') ?? '');
  const [saved, setSaved] = useState(false);

  const handleSaveToken = () => {
    if (token.trim()) {
      localStorage.setItem('github_token', token.trim());
    } else {
      localStorage.removeItem('github_token');
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
```

- [ ] **Step 3: 在"系统设置" section 的 grid 中新增 GitHub Token 卡片**

找到现有的两个 `<SettingsCard` 之后，在 `</div>` 关闭 grid div 之前，插入 GitHub Token 卡片：

在现有的 `</div>` (关闭 `<div className="grid gap-4">`) 之前，紧接在第二个 `<SettingsCard` 之后插入：

```tsx
            {/* GitHub Token 配置 */}
            <div className="flex items-start gap-4 p-5 bg-white rounded-2xl border border-slate-200">
              <div className="p-2 bg-slate-100 rounded-xl shrink-0">
                <Key className="text-indigo-600 w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-800 mb-1">GitHub Token</h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-3">
                  配置后每小时可请求 5000 次（未配置仅 60 次）。在{' '}
                  <a
                    href="https://github.com/settings/tokens"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 underline"
                  >
                    GitHub → Settings → Developer Settings
                  </a>{' '}
                  生成 Personal Access Token（无需勾选任何权限）。
                </p>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={token}
                    onChange={e => setToken(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxx"
                    className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  <button
                    onClick={handleSaveToken}
                    className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1.5"
                  >
                    {saved ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        已保存
                      </>
                    ) : (
                      '保存'
                    )}
                  </button>
                </div>
              </div>
            </div>
```

- [ ] **Step 4: 验证 TypeScript 无报错**

```bash
npx tsc --noEmit
```

期望：无输出

---

## Task 9: 在 App.tsx 注册导航和视图

**Files:**
- Modify: `App.tsx`

- [ ] **Step 1: 添加 import**

在 `App.tsx` 的 import 区域，添加两行：

```typescript
import { Github } from 'lucide-react';       // 加到现有 lucide-react import 中
import GitHubSearchView from './components/GitHubSearchView';
```

具体操作：找到现有的 lucide-react import 行：

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

将 `FileText` 后面加上 `Github`：

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
  FileText,
  Github
} from 'lucide-react';
```

然后在其他 import 之后加上：

```typescript
import GitHubSearchView from './components/GitHubSearchView';
```

- [ ] **Step 2: 监听 navigate-to-settings 事件**

在 `App` 组件的 `useState` 声明之后，添加 useEffect：

```typescript
  useEffect(() => {
    const handler = () => setMode(AppMode.SETTINGS);
    window.addEventListener('navigate-to-settings', handler);
    return () => window.removeEventListener('navigate-to-settings', handler);
  }, []);
```

（此 useEffect 与其他 useEffect 放在一起即可）

- [ ] **Step 3: 在侧边栏添加导航按钮**

找到 Markdown 编辑器的导航按钮（在 `mt-auto` 之前）：

```tsx
        <div className="p-4 border-b border-slate-200">
          <NavButton
            active={mode === AppMode.MARKDOWN_EDITOR}
            icon={<FileText />}
            label="Markdown 编辑器"
            onClick={() => setMode(AppMode.MARKDOWN_EDITOR)}
          />
        </div>
```

在其后插入：

```tsx
        <div className="p-4 border-b border-slate-200">
          <NavButton
            active={mode === AppMode.GITHUB_SEARCH}
            icon={<Github />}
            label="GitHub 检索"
            onClick={() => setMode(AppMode.GITHUB_SEARCH)}
          />
        </div>
```

- [ ] **Step 4: 在主内容区添加视图渲染**

找到 `{mode === AppMode.MARKDOWN_EDITOR && (` 的渲染块，在其后添加：

```tsx
          {mode === AppMode.GITHUB_SEARCH && (
            <GitHubSearchView />
          )}
```

- [ ] **Step 5: 验证 TypeScript 无报错**

```bash
npx tsc --noEmit
```

期望：无输出

- [ ] **Step 6: 启动开发服务器，端到端验证**

```bash
npm run dev
```

验证清单：
1. 左侧导航出现"GitHub 检索"按钮，点击可进入
2. 未配置 Token 时顶部显示黄色提示条，点击"设置"跳转到 Settings
3. Settings 页出现"GitHub Token"配置卡片，输入 Token 后点击"保存"按钮变为"已保存"
4. 搜索"react"，左侧列表出现仓库卡片（名称、Stars、语言、时间）
5. 点击卡片，右侧渲染出 README Markdown 内容
6. 底部"加载更多"按钮可追加下一页结果
7. 搜索词为空时不发请求，显示引导文案
