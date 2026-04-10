import React, { useState, useCallback } from 'react';
import { useDeepSeek } from './useDeepSeek';
import { TextInputArea, NoKeyTip, ErrorTip, ChatPanel, EditableField, EditableTextarea } from './shared';

interface Risk {
  level: 'high' | 'medium' | 'low';
  clause: string;
  description: string;
  suggestion: string;
}

interface ContractResult {
  score: number;
  summary: string;
  risks: Risk[];
}

const SYSTEM_PROMPT = `你是专业合同法律顾问。请审查合同文本，返回严格的 JSON：
{
  "score": 0-100整数,
  "summary": "整体风险摘要",
  "risks": [{ "level": "high|medium|low", "clause": "条款摘要", "description": "风险描述", "suggestion": "修改建议" }]
}
只返回 JSON，不要其他内容。`;

const LEVEL_STYLE: Record<string, string> = {
  high: 'bg-red-100 text-red-700 border-red-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low: 'bg-green-100 text-green-700 border-green-200',
};
const LEVEL_LABEL: Record<string, string> = { high: '高风险', medium: '中风险', low: '低风险' };
const LEVELS = ['high', 'medium', 'low'] as const;

const ContractReviewView: React.FC = () => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<ContractResult | null>(null);
  const [history, setHistory] = useState<ContractResult[]>([]);
  const [analysisKey, setAnalysisKey] = useState(0);
  const { call, loading, error } = useDeepSeek();
  const hasKey = !!localStorage.getItem('deepseek_api_key');

  const handleAnalyze = async () => {
    try {
      const raw = await call(SYSTEM_PROMPT, input);
      const json = raw.replace(/```json\n?|```/g, '').trim();
      setResult(JSON.parse(json));
      setHistory([]);
      setAnalysisKey(k => k + 1);
    } catch {}
  };

  const handleUpdate = useCallback((data: unknown) => {
    setResult(prev => {
      if (prev) setHistory(h => [...h, prev]);
      return data as ContractResult;
    });
  }, []);

  const handleUndo = () => {
    setHistory(h => {
      const prev = h[h.length - 1];
      if (prev) setResult(prev);
      return h.slice(0, -1);
    });
  };

  const updateRisk = (i: number, field: keyof Risk, val: string) => {
    if (!result) return;
    const risks = result.risks.map((r, idx) => idx === i ? { ...r, [field]: val } : r);
    setResult({ ...result, risks });
  };

  const scoreColor = (s: number) => s >= 80 ? 'text-green-600' : s >= 60 ? 'text-amber-500' : 'text-red-600';

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 space-y-6 min-w-0">
        <TextInputArea value={input} onChange={setInput} placeholder="请输入或粘贴合同文本..." rows={20} onAnalyze={handleAnalyze} analyzeLoading={loading} analyzeDisabled={!input.trim() || !hasKey} />
        {!hasKey && <NoKeyTip />}
        {error && <ErrorTip message={error} onRetry={handleAnalyze} />}

        {result && (
          <div className="space-y-6">
            <div className="flex items-center gap-6 p-5 bg-white border border-slate-200 rounded-2xl">
              <div className="text-center shrink-0">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={result.score}
                  onChange={e => setResult({ ...result, score: Math.min(100, Math.max(0, Number(e.target.value))) })}
                  className={`w-16 text-4xl font-black text-center bg-transparent border-b-2 border-slate-200 focus:outline-none focus:border-indigo-400 ${scoreColor(result.score)}`}
                />
                <div className="text-xs text-slate-400 mt-1">综合评分</div>
              </div>
              <EditableTextarea
                value={result.summary}
                onChange={v => setResult({ ...result, summary: v })}
                rows={2}
                className="flex-1 text-slate-600"
              />
            </div>

            <div className="space-y-3">
              {result.risks.map((r, i) => (
                <div key={i} className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2">
                    <select
                      value={r.level}
                      onChange={e => updateRisk(i, 'level', e.target.value)}
                      className={`text-xs font-bold px-2 py-0.5 rounded border cursor-pointer focus:outline-none ${LEVEL_STYLE[r.level]}`}
                    >
                      {LEVELS.map(l => <option key={l} value={l}>{LEVEL_LABEL[l]}</option>)}
                    </select>
                    <EditableField value={r.clause} onChange={v => updateRisk(i, 'clause', v)} className="flex-1 font-medium" />
                  </div>
                  <EditableTextarea value={r.description} onChange={v => updateRisk(i, 'description', v)} rows={2} className="text-slate-500 text-xs" />
                  <div className="flex items-start gap-1.5 pt-1 border-t border-slate-100">
                    <span className="text-xs text-slate-400 shrink-0 mt-1.5">建议：</span>
                    <EditableTextarea value={r.suggestion} onChange={v => updateRisk(i, 'suggestion', v)} rows={2} className="flex-1 text-xs text-slate-600" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="w-[360px] shrink-0 border-l border-slate-200 flex flex-col">
        <ChatPanel
          key={analysisKey}
          systemPrompt={SYSTEM_PROMPT}
          contextSummary={result ? `合同审查完成，综合评分 ${result.score}。\n摘要：${result.summary}\n\n合同原文：\n${input}\n\n风险详情：\n${result.risks.map(r => `- [${LEVEL_LABEL[r.level]}] ${r.clause}：${r.description}。建议：${r.suggestion}`).join('\n')}` : ''}
          onUpdate={handleUpdate}
          onUndo={handleUndo}
          canUndo={history.length > 0}
          hasResult={!!result}
        />
      </div>
    </div>
  );
};

export default ContractReviewView;
