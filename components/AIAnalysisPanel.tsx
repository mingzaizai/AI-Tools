
import React from 'react';
import { BrainCircuit } from 'lucide-react';
import { ImageData } from '../types';

interface AIAnalysisPanelProps {
  image: ImageData;
}

const AIAnalysisPanel: React.FC<AIAnalysisPanelProps> = () => {
  return (
    <div className="space-y-6">
      <div className="p-4 bg-indigo-600/10 border border-indigo-500/20 rounded-xl">
        <div className="flex items-center gap-3 mb-3">
          <BrainCircuit className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm font-bold text-slate-200">AI 智能分析</h3>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          AI 图片分析功能暂不可用。
        </p>
      </div>
    </div>
  );
};

export default AIAnalysisPanel;
