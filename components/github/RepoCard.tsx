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
