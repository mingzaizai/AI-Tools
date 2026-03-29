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

function decodeContent(base64: string): string {
  const clean = base64.replace(/\s/g, '');
  const bytes = Uint8Array.from(atob(clean), c => c.charCodeAt(0));
  return new TextDecoder('utf-8').decode(bytes);
}

const CN_README_PATTERNS = /^readme[_-]?(cn|zh|zh[-_]cn|chinese)(\.md)?$/i;

async function fetchReadme(fullName: string, signal: AbortSignal): Promise<{ html: string; isChinese: boolean }> {
  // 获取根目录文件列表，查找中文 README
  const listRes = await fetch(
    `https://api.github.com/repos/${fullName}/contents/`,
    { headers: getHeaders(), signal }
  );
  if (listRes.ok) {
    const files: { name: string; download_url: string; type: string }[] = await listRes.json();
    const cnFile = files.find(f => f.type === 'file' && CN_README_PATTERNS.test(f.name));
    if (cnFile) {
      const fileRes = await fetch(
        `https://api.github.com/repos/${fullName}/contents/${cnFile.name}`,
        { headers: getHeaders(), signal }
      );
      if (fileRes.ok) {
        const data = await fileRes.json();
        const text = decodeContent(data.content as string);
        return { html: DOMPurify.sanitize(marked.parse(text) as string), isChinese: true };
      }
    }
  }

  // 回退到默认 README
  const res = await fetch(
    `https://api.github.com/repos/${fullName}/readme`,
    { headers: getHeaders(), signal }
  );
  if (res.status === 404) throw new Error('NO_README');
  if (!res.ok) throw new Error('加载失败');
  const data = await res.json();
  const text = decodeContent(data.content as string);
  return { html: DOMPurify.sanitize(marked.parse(text) as string), isChinese: false };
}

interface ReadmePanelProps {
  repo: GitHubRepo | null;
}

const ReadmePanel: React.FC<ReadmePanelProps> = ({ repo }) => {
  const [html, setHtml] = useState<string | null>(null);
  const [isChinese, setIsChinese] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!repo) return;
    const controller = new AbortController();
    setHtml(null);
    setError(null);
    setIsChinese(false);
    setLoading(true);

    fetchReadme(repo.full_name, controller.signal)
      .then(({ html, isChinese }) => {
        setHtml(html);
        setIsChinese(isChinese);
      })
      .catch(err => {
        if (err instanceof Error && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : '加载失败');
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
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
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-semibold text-slate-700 truncate">{repo.full_name}</span>
          {isChinese && (
            <span className="shrink-0 px-1.5 py-0.5 text-xs bg-green-100 text-green-700 rounded">中文</span>
          )}
        </div>
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
            className="markdown-preview"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )}
      </div>
    </div>
  );
};

export default ReadmePanel;
