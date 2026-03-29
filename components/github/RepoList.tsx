import React from 'react';
import { Loader2, SearchX, AlertCircle } from 'lucide-react';
import { GitHubRepo } from '../../types';
import RepoCard from './RepoCard';

interface RepoListProps {
  repos: GitHubRepo[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  loadMoreError: string | null;
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
  loadMoreError,
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

      {loadMoreError && (
        <p className="text-xs text-red-500 text-center py-2 px-4">{loadMoreError}，请重试</p>
      )}
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
