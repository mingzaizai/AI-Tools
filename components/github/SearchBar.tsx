import React, { useState, useRef, useEffect } from 'react';
import { Search, Clock, X } from 'lucide-react';
import { SearchParams } from '../../types';

const HISTORY_KEY = 'github_search_history';
const MAX_HISTORY = 10;

const HOT_LIBS: Record<string, string[]> = {
  network:   ['OkHttp', 'Retrofit', 'Volley', 'Ktor', 'Axios', 'Feign'],
  image:     ['Glide', 'Picasso', 'Coil', 'Fresco', 'SDWebImage'],
  database:  ['Room', 'Realm', 'SQLDelight', 'ObjectBox', 'GreenDAO'],
  json:      ['Gson', 'Moshi', 'Jackson', 'Fastjson2', 'kotlinx-serialization'],
  ui:        ['Material UI', 'Ant Design', 'shadcn', 'Jetpack Compose', 'SwiftUI'],
  injection: ['Hilt', 'Dagger2', 'Koin', 'Spring DI'],
  compress:  ['zstd', 'lz4', 'brotli', 'zlib'],
  log:       ['Timber', 'SLF4J', 'Log4j', 'Logback'],
  test:      ['JUnit', 'Mockito', 'Espresso', 'Robolectric', 'Jest'],
  cache:     ['Redis', 'Caffeine', 'Ehcache', 'DiskLruCache'],
  crypto:    ['Bouncy Castle', 'Tink', 'OpenSSL', 'jose4j'],
  mq:        ['RabbitMQ', 'Kafka', 'RocketMQ', 'ActiveMQ'],
  'ai-agent': ['LangChain', 'LangGraph', 'CrewAI', 'AutoGen', 'Dify', 'Flowise', 'n8n', 'LlamaIndex', 'Semantic Kernel', 'superpowers', 'everything-claude-code'],
};

const CATEGORIES = [
  { label: '网络请求', keyword: 'network' },
  { label: '图片加载', keyword: 'image' },
  { label: '数据库', keyword: 'database' },
  { label: 'JSON 解析', keyword: 'json' },
  { label: 'UI 组件', keyword: 'ui' },
  { label: '依赖注入', keyword: 'injection' },
  { label: '压缩', keyword: 'compress' },
  { label: '日志', keyword: 'log' },
  { label: '测试', keyword: 'test' },
  { label: '缓存', keyword: 'cache' },
  { label: '安全加密', keyword: 'crypto' },
  { label: '消息队列', keyword: 'mq' },
  { label: 'AI 工作流', keyword: 'ai-agent' },
];

function loadHistory(): string[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function saveHistory(query: string) {
  const prev = loadHistory().filter(q => q !== query);
  localStorage.setItem(HISTORY_KEY, JSON.stringify([query, ...prev].slice(0, MAX_HISTORY)));
}

function removeHistory(query: string) {
  const prev = loadHistory().filter(q => q !== query);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(prev));
}

interface SearchBarProps {
  onSearch: (params: SearchParams) => void;
  loading: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, loading }) => {
  const [query, setQuery] = useState('');
  const [language, setLanguage] = useState('');
  const [minStars, setMinStars] = useState<SearchParams['minStars']>('');
  const [sort, setSort] = useState<SearchParams['sort']>('stars');
  const [activeCategory, setActiveCategory] = useState('');
  const [history, setHistory] = useState<string[]>(loadHistory);
  const [showHistory, setShowHistory] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowHistory(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSearch = (q = query) => {
    if (!q.trim()) return;
    saveHistory(q.trim());
    setHistory(loadHistory());
    setShowHistory(false);
    onSearch({ query: q.trim(), language, minStars, sort });
  };

  const handleCategoryClick = (keyword: string) => {
    if (activeCategory === keyword) {
      setActiveCategory('');
      return;
    }
    setActiveCategory(keyword);
    setQuery(keyword);
    onSearch({ query: keyword, language, minStars, sort });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
    if (e.key === 'Escape') setShowHistory(false);
  };

  const handleRemove = (e: React.MouseEvent, item: string) => {
    e.stopPropagation();
    removeHistory(item);
    setHistory(loadHistory());
  };

  const filteredHistory = query.trim()
    ? history.filter(h => h.toLowerCase().includes(query.toLowerCase()))
    : history;

  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="p-4 space-y-3">
        {/* 搜索框 */}
        <div className="flex gap-2">
          <div className="relative flex-1" ref={wrapperRef}>
            <input
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setActiveCategory(''); }}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowHistory(true)}
              placeholder="搜索 GitHub 项目..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            {showHistory && filteredHistory.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 overflow-hidden">
                <div className="px-3 py-1.5 text-xs text-slate-400 border-b border-slate-100 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  搜索历史
                </div>
                {filteredHistory.map(item => (
                  <div
                    key={item}
                    onMouseDown={() => { setQuery(item); handleSearch(item); }}
                    className="flex items-center justify-between px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer group"
                  >
                    <span className="truncate">{item}</span>
                    <button
                      onMouseDown={e => handleRemove(e, item)}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 ml-2 shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => handleSearch()}
            disabled={loading || !query.trim()}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            <Search className="w-4 h-4" />
            搜索
          </button>
        </div>

        {/* 过滤条 */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-slate-500 shrink-0">语言</label>
            <select
              value={language}
              onChange={e => setLanguage(e.target.value)}
              className="px-2 py-1 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white"
            >
              <option value="">不限</option>
              <option value="TypeScript">TypeScript</option>
              <option value="JavaScript">JavaScript</option>
              <option value="Python">Python</option>
              <option value="Shell">Shell</option>
              <option value="HTML">HTML</option>
              <option value="Java">Java</option>
              <option value="C#">C#</option>
              <option value="CSS">CSS</option>
              <option value="Go">Go</option>
            </select>
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

      {/* 分类标签栏 */}
      <div className="px-4 pb-3 flex items-center gap-2 flex-wrap">
        <span className="text-xs text-slate-400 shrink-0">分类</span>
        {CATEGORIES.map(({ label, keyword }) => (
          <button
            key={keyword}
            onClick={() => handleCategoryClick(keyword)}
            className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
              activeCategory === keyword
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-400 hover:text-indigo-600'
            }`}
          >
            {label}
          </button>
        ))}
        {activeCategory && (
          <button
            onClick={() => setActiveCategory('')}
            className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-0.5"
          >
            <X className="w-3 h-3" />
            清除
          </button>
        )}
      </div>

      {/* 热门库 */}
      {activeCategory && HOT_LIBS[activeCategory] && (
        <div className="px-4 pb-3 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400 shrink-0">热门库</span>
          {HOT_LIBS[activeCategory].map(lib => (
            <button
              key={lib}
              onClick={() => { setQuery(lib); handleSearch(lib); }}
              className="px-2.5 py-1 text-xs rounded-full border bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 hover:border-amber-400 transition-colors"
            >
              {lib}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
