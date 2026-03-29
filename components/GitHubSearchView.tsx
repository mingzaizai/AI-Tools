import React, { useState, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import { GitHubRepo, SearchParams } from '../types';
import { useGitHubSearch } from '../hooks/useGitHubSearch';
import SearchBar from './github/SearchBar';
import RepoList from './github/RepoList';
import ReadmePanel from './github/ReadmePanel';

const GitHubSearchView: React.FC = () => {
  const { repos, loading, loadingMore, error, loadMoreError, hasMore, search, loadMore } = useGitHubSearch();
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
              loadMoreError={loadMoreError}
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
