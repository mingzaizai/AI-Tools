import React, { useState, useCallback } from 'react';
import { useDeepSeek } from './useDeepSeek';
import { TextInputArea, NoKeyTip, ErrorTip, ChatPanel, EditableField, EditableTextarea } from './shared';

type ReviewType = 'writing' | 'compliance' | 'both';

interface WritingIssue { type: string; description: string; location: string; }
interface ComplianceIssue { description: string; location: string; }

interface ArticleResult {
  writing?: { overallComment: string; issues: WritingIssue[] };
  compliance?: { status: string; issues: ComplianceIssue[] };
}

const buildSystemPrompt = (type: ReviewType) => `你是专业文章审查员。请审查以下文章，返回严格的 JSON：
{
  ${type !== 'compliance' ? `"writing": { "overallComment": "整体评价", "issues": [{ "type": "类型", "description": "问题描述", "location": "相关原文片段" }] }${type === 'both' ? ',' : ''}` : ''}
  ${type !== 'writing' ? `"compliance": { "status": "合规|需注意|违规", "issues": [{ "description": "风险描述", "location": "相关原文片段" }] }` : ''}
}
只返回 JSON，不要其他内容。`;

const COMPLIANCE_STYLE: Record<string, string> = {
  '合规': 'bg-green-100 text-green-700',
  '需注意': 'bg-amber-100 text-amber-700',
  '违规': 'bg-red-100 text-red-700',
};

const ArticleReviewView: React.FC = () => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<ArticleResult | null>(null);
  const [history, setHistory] = useState<ArticleResult[]>([]);
  const [analysisKey, setAnalysisKey] = useState(0);
  const { call, loading, error } = useDeepSeek();
  const defaultModel = localStorage.getItem('default_ai_model') as 'deepseek' | 'qwen' ?? 'deepseek';
  const hasKey = !!localStorage.getItem(`${defaultModel}_api_key`);

  const handleAnalyze = async () => {
    try {
      const raw = await call(buildSystemPrompt('both'), input, defaultModel);
      const json = raw.replace(/```json\n?|```/g, '').trim();
      setResult(JSON.parse(json));
      setHistory([]);
      setAnalysisKey(k => k + 1);
    } catch {}
  };

  const handleUpdate = useCallback((data: unknown) => {
    setResult(prev => {
      if (prev) setHistory(h => [...h, prev]);
      return data as ArticleResult;
    });
  }, []);

  const handleUndo = () => {
    setHistory(h => {
      const prev = h[h.length - 1];
      if (prev) setResult(prev);
      return h.slice(0, -1);
    });
  };

  const updateWritingIssue = (i: number, field: keyof WritingIssue, val: string) => {
    if (!result?.writing) return;
    const issues = result.writing.issues.map((iss, idx) => idx === i ? { ...iss, [field]: val } : iss);
    setResult({ ...result, writing: { ...result.writing, issues } });
  };

  const updateComplianceIssue = (i: number, field: keyof ComplianceIssue, val: string) => {
    if (!result?.compliance) return;
    const issues = result.compliance.issues.map((iss, idx) => idx === i ? { ...iss, [field]: val } : iss);
    setResult({ ...result, compliance: { ...result.compliance, issues } });
  };

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 space-y-6 min-w-0">
        <TextInputArea value={input} onChange={setInput} placeholder="请输入或粘贴文章内容..." rows={20} onAnalyze={handleAnalyze} analyzeLoading={loading} analyzeDisabled={!input.trim() || !hasKey} />
        {!hasKey && <NoKeyTip />}
        {error && <ErrorTip message={error} onRetry={handleAnalyze} />}

        {result && (
          <div className="space-y-6">
            {result.writing && (
              <div className="space-y-3">
                <EditableTextarea
                  value={result.writing.overallComment}
                  onChange={v => setResult({ ...result, writing: { ...result.writing!, overallComment: v } })}
                  rows={3}
                  className="text-slate-600"
                />
                {result.writing.issues.map((issue, i) => (
                  <div key={i} className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center gap-2">
                      <EditableField value={issue.type} onChange={v => updateWritingIssue(i, 'type', v)} className="w-24 text-xs bg-slate-50" />
                      <EditableField value={issue.description} onChange={v => updateWritingIssue(i, 'description', v)} className="flex-1" />
                    </div>
                    <EditableField value={issue.location} onChange={v => updateWritingIssue(i, 'location', v)} className="text-xs text-slate-400" placeholder="原文片段" />
                  </div>
                ))}
              </div>
            )}
            {result.compliance && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-700">内容合规</span>
                  <select
                    value={result.compliance.status}
                    onChange={e => setResult({ ...result, compliance: { ...result.compliance!, status: e.target.value } })}
                    className={`text-xs font-bold px-2 py-0.5 rounded cursor-pointer focus:outline-none ${COMPLIANCE_STYLE[result.compliance.status] ?? 'bg-slate-100 text-slate-600'}`}
                  >
                    {['合规', '需注意', '违规'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                {result.compliance.issues.map((issue, i) => (
                  <div key={i} className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                    <EditableField value={issue.description} onChange={v => updateComplianceIssue(i, 'description', v)} />
                    <EditableField value={issue.location} onChange={v => updateComplianceIssue(i, 'location', v)} className="text-xs text-slate-400" placeholder="原文片段" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="w-[360px] shrink-0 border-l border-slate-200 flex flex-col">
        <ChatPanel
          key={analysisKey}
          systemPrompt={buildSystemPrompt('both')}
          contextSummary={result ? [
            `文章审查完成（写作质量 + 内容合规）。\n文章原文：\n${input}`,
            result.writing ? `\n\n写作质量：${result.writing.overallComment}\n${result.writing.issues.map(iss => `- [${iss.type}] ${iss.description}`).join('\n')}` : '',
            result.compliance ? `\n\n内容合规：${result.compliance.status}\n${result.compliance.issues.map(iss => `- ${iss.description}`).join('\n')}` : '',
          ].join('') : ''}
          onUpdate={handleUpdate}
          onUndo={handleUndo}
          canUndo={history.length > 0}
          hasResult={!!result}
        />
      </div>
    </div>
  );
};

export default ArticleReviewView;
