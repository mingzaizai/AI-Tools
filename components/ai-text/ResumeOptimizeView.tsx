import React, { useState, useCallback } from 'react';
import { useDeepSeek } from './useDeepSeek';
import { TextInputArea, CopyButton, NoKeyTip, ErrorTip, ChatPanel, EditableField, EditableTextarea } from './shared';

interface Suggestion { priority: 'high' | 'medium' | 'low'; field: string; suggestion: string; }

interface ResumeResult {
  overallComment: string;
  suggestions: Suggestion[];
  optimizedResume: string;
}

const SYSTEM_PROMPT = `你是专业的简历优化顾问。请优化用户提供的简历，返回严格的 JSON：
{
  "overallComment": "整体评价",
  "suggestions": [{ "priority": "high|medium|low", "field": "模块名称", "suggestion": "具体建议" }],
  "optimizedResume": "优化后简历全文"
}
只返回 JSON，不要其他内容。`;

const PRIORITY_STYLE: Record<string, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-green-100 text-green-700',
};
const PRIORITY_LABEL: Record<string, string> = { high: '优先', medium: '建议', low: '可选' };

const ResumeOptimizeView: React.FC = () => {
  const [resumeText, setResumeText] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [result, setResult] = useState<ResumeResult | null>(null);
  const [history, setHistory] = useState<ResumeResult[]>([]);
  const [analysisKey, setAnalysisKey] = useState(0);
  const { call, loading, error } = useDeepSeek();
  const hasKey = !!localStorage.getItem('deepseek_api_key') || !!localStorage.getItem('qwen_api_key');
  const defaultModel = localStorage.getItem('default_ai_model') as 'deepseek' | 'qwen' ?? 'deepseek';

  const handleAnalyze = async () => {
    const userContent = jobDesc.trim()
      ? `【简历】\n${resumeText}\n\n【目标职位描述】\n${jobDesc}`
      : resumeText;
    try {
      const raw = await call(SYSTEM_PROMPT, userContent, defaultModel);
      const json = raw.replace(/```json\n?|```/g, '').trim();
      setResult(JSON.parse(json));
      setHistory([]);
      setAnalysisKey(k => k + 1);
    } catch {}
  };

  const handleUpdate = useCallback((data: unknown) => {
    setResult(prev => {
      if (prev) setHistory(h => [...h, prev]);
      return data as ResumeResult;
    });
  }, []);

  const handleUndo = () => {
    setHistory(h => {
      const prev = h[h.length - 1];
      if (prev) setResult(prev);
      return h.slice(0, -1);
    });
  };

  const updateSuggestion = (i: number, field: keyof Suggestion, val: string) => {
    if (!result) return;
    const suggestions = result.suggestions.map((s, idx) => idx === i ? { ...s, [field]: val } : s);
    setResult({ ...result, suggestions });
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* 左侧：输入 + 结果 */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 min-w-0">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">简历内容</label>
          <TextInputArea value={resumeText} onChange={setResumeText} placeholder="请粘贴简历内容..." rows={20} onAnalyze={handleAnalyze} analyzeLoading={loading} analyzeDisabled={!resumeText.trim() || !hasKey} />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">目标职位描述（可选）</label>
          <textarea
            value={jobDesc}
            onChange={e => setJobDesc(e.target.value)}
            placeholder="粘贴 JD 可获得更有针对性的优化建议..."
            rows={4}
            className="w-full px-4 py-3 text-sm text-slate-700 bg-white border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 leading-relaxed"
          />
        </div>

        {!hasKey && <NoKeyTip />}
        {error && <ErrorTip message={error} onRetry={handleAnalyze} />}

        {result && (
          <div className="space-y-6">
            <EditableTextarea
              value={result.overallComment}
              onChange={v => setResult({ ...result, overallComment: v })}
              rows={3}
              className="text-slate-600"
            />

            <div className="space-y-2">
              {result.suggestions.map((s, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-white border border-slate-200 rounded-xl text-sm">
                  <select
                    value={s.priority}
                    onChange={e => updateSuggestion(i, 'priority', e.target.value)}
                    className={`text-xs font-bold px-2 py-0.5 rounded shrink-0 cursor-pointer focus:outline-none ${PRIORITY_STYLE[s.priority]}`}
                  >
                    {(['high', 'medium', 'low'] as const).map(p => (
                      <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>
                    ))}
                  </select>
                  <div className="flex-1 space-y-1">
                    <EditableField value={s.field} onChange={v => updateSuggestion(i, 'field', v)} className="font-medium text-slate-700" />
                    <EditableField value={s.suggestion} onChange={v => updateSuggestion(i, 'suggestion', v)} className="text-slate-600" />
                  </div>
                </div>
              ))}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500">优化后简历</span>
                <CopyButton text={result.optimizedResume} />
              </div>
              <EditableTextarea
                value={result.optimizedResume}
                onChange={v => setResult({ ...result, optimizedResume: v })}
                rows={20}
              />
            </div>
          </div>
        )}
      </div>

      {/* 右侧：对话面板，始终显示 */}
      <div className="w-[360px] shrink-0 border-l border-slate-200 flex flex-col">
        <ChatPanel
          key={analysisKey}
          systemPrompt={SYSTEM_PROMPT}
          contextSummary={result ? `简历优化完成。\n\n原始简历：\n${resumeText}${jobDesc ? `\n\n目标职位描述：\n${jobDesc}` : ''}\n\n整体评价：${result.overallComment}\n\n改进建议：\n${result.suggestions.map(s => `- [${PRIORITY_LABEL[s.priority]}] ${s.field}：${s.suggestion}`).join('\n')}\n\n优化后简历：\n${result.optimizedResume}` : ''}
          onUpdate={handleUpdate}
          onUndo={handleUndo}
          canUndo={history.length > 0}
          hasResult={!!result}
        />
      </div>
    </div>
  );
};

export default ResumeOptimizeView;
