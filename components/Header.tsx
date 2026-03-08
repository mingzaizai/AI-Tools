
import React from 'react';
import { Download } from 'lucide-react';
import { AppMode } from '../types';

interface HeaderProps {
  mode: AppMode;
  onExport: () => void;
  canExport: boolean;
  imagesCount: number;
}

const Header: React.FC<HeaderProps> = ({ mode, onExport, canExport, imagesCount }) => {
  const getTitle = () => {
    switch (mode) {
      case AppMode.LIBRARY: return '图片库';
      case AppMode.EDITOR: return 'AI 智能工具';
      case AppMode.BATCH: return '批量处理中心';
      case AppMode.MERGE: return '拼图合并中心';
      case AppMode.JSON_EDIT: return 'JSON 编辑器';
      case AppMode.SETTINGS: return '设置';
      default: return 'AI 智能工具';
    }
  };

  return (
    <header className="h-16 border-b border-slate-200 px-6 flex items-center justify-between bg-white shrink-0">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
          {getTitle()}
        </h1>
        {imagesCount > 0 && mode !== AppMode.JSON_EDIT && mode !== AppMode.SETTINGS && (
          <span className="px-2 py-0.5 bg-slate-200 rounded-full text-xs font-medium text-slate-600">
            {imagesCount} 个文件
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {mode !== AppMode.JSON_EDIT && mode !== AppMode.SETTINGS && (
          <button
            onClick={onExport}
            disabled={!canExport}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
              ${canExport 
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'}
            `}
          >
            <Download className="w-4 h-4" />
            导出结果
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
