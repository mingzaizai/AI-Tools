import React, { useState } from 'react';
import SpellCheckView from './ai-text/SpellCheckView';
import ContractReviewView from './ai-text/ContractReviewView';
import ArticleReviewView from './ai-text/ArticleReviewView';
import TextPolishView from './ai-text/TextPolishView';
import MeetingMinutesView from './ai-text/MeetingMinutesView';
import ResumeOptimizeView from './ai-text/ResumeOptimizeView';

type TabId = 'spell' | 'contract' | 'article' | 'polish' | 'meeting' | 'resume';

const TABS_GROUP1: { id: TabId; label: string }[] = [
  { id: 'spell', label: '错别字识别' },
  { id: 'contract', label: '合同审查' },
  { id: 'article', label: '文章审查' },
];

const TABS_GROUP2: { id: TabId; label: string }[] = [
  { id: 'polish', label: '文本润色' },
  { id: 'meeting', label: '会议纪要整理' },
  { id: 'resume', label: '简历优化' },
];

const AITextToolsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('spell');

  const tabClass = (id: TabId) =>
    `px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
      activeTab === id
        ? 'bg-indigo-600 text-white'
        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
    }`;

  return (
    <div className="flex flex-col h-full bg-[#f8fafc]">
      {/* 顶部 Tab 栏 */}
      <div className="shrink-0 border-b border-slate-200 bg-white px-6 py-3 flex items-center gap-2">
        <div className="flex items-center gap-1">
          {TABS_GROUP1.map(t => (
            <button key={t.id} className={tabClass(t.id)} onClick={() => setActiveTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="w-px h-5 bg-slate-200 mx-1" />
        <div className="flex items-center gap-1">
          {TABS_GROUP2.map(t => (
            <button key={t.id} className={tabClass(t.id)} onClick={() => setActiveTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* 内容区：保持所有 tab 挂载，用 CSS 控制显隐，切换不丢失状态 */}
      <div className="flex-1 overflow-hidden relative">
        <div className={`h-full ${activeTab === 'spell' ? '' : 'hidden'}`}><SpellCheckView /></div>
        <div className={`h-full ${activeTab === 'contract' ? '' : 'hidden'}`}><ContractReviewView /></div>
        <div className={`h-full ${activeTab === 'article' ? '' : 'hidden'}`}><ArticleReviewView /></div>
        <div className={`h-full ${activeTab === 'polish' ? '' : 'hidden'}`}><TextPolishView /></div>
        <div className={`h-full ${activeTab === 'meeting' ? '' : 'hidden'}`}><MeetingMinutesView /></div>
        <div className={`h-full ${activeTab === 'resume' ? '' : 'hidden'}`}><ResumeOptimizeView /></div>
      </div>
    </div>
  );
};

export default AITextToolsView;
