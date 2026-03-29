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
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);

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

    setLoadMoreError(null);
    setLoadingMore(true);
    try {
      const res = await fetch(buildUrl(currentParams.current, nextPage), { headers: getHeaders() });
      if (!res.ok) throw new Error(`请求失败 (${res.status})`);

      const data = await res.json();
      setRepos(prev => [...prev, ...(data.items ?? [])]);
      currentPage.current = nextPage;
      setHasMore(data.total_count > nextPage * PER_PAGE);
    } catch (err) {
      setLoadMoreError(err instanceof Error ? err.message : '加载更多失败');
    } finally {
      setLoadingMore(false);
    }
  };

  return { repos, loading, loadingMore, error, loadMoreError, hasMore, search, loadMore };
}
