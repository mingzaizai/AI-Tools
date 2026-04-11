import React, { useState, useCallback } from 'react';
import { useDeepSeek } from './useDeepSeek';
import { TextInputArea, CopyButton, NoKeyTip, ErrorTip, ChatPanel, EditableField, EditableTextarea } from './shared';

interface SpellError {
  original: string;
  suggestion: string;
  context: string;
}

interface SpellResult {
  errors: SpellError[];
  correctedText: string;
}

const SYSTEM_PROMPT = `你是专业的中文校对员。请检查用户提供的文本中的错别字，返回严格的 JSON 格式：
{
  "errors": [{ "original": "错误字", "suggestion": "建议替换", "context": "包含错误字的短句" }],
  "correctedText": "修正后的完整文本"
}
只返回 JSON，不要任何其他内容。若无错别字，errors 返回空数组。`;

const SpellCheckView: React.FC = () => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<SpellResult | null>(null);
  const [history, setHistory] = useState<SpellResult[]>([]);
  const [analysisKey, setAnalysisKey] = useState(0);
  const { call, loading, error } = useDeepSeek();
  const hasKey = !!localStorage.getItem('deepseek_api_key') || !!localStorage.getItem('qwen_api_key');
  const defaultModel = localStorage.getItem('default_ai_model') as 'deepseek' | 'qwen' ?? 'deepseek';

  const handleAnalyze = async () => {
    try {
      const raw = await call(SYSTEM_PROMPT, input, defaultModel);
      const json = raw.replace(/```json\n?|```/g, '').trim();
      setResult(JSON.parse(json));
      setHistory([]);
      setAnalysisKey(k => k + 1);
    } catch {}
  };

  const handleUpdate = useCallback((data: unknown) => {
    setResult(prev => {
      if (prev) setHistory(h => [...h, prev]);
      return data as SpellResult;
    });
  }, []);

  const handleUndo = () => {
    setHistory(h => {
      const prev = h[h.length - 1];
      if (prev) setResult(prev);
      return h.slice(0, -1);
    });
  };

  const updateError = (i: number, field: keyof SpellError, val: string) => {
    if (!result) return;
    const errors = result.errors.map((e, idx) => idx === i ? { ...e, [field]: val } : e);
    setResult({ ...result, errors });
  };

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 space-y-6 min-w-0">
        <TextInputArea value={input} onChange={setInput} placeholder="请输入或粘贴需要检查的文本..." onAnalyze={handleAnalyze} analyzeLoading={loading} analyzeDisabled={!input.trim() || !hasKey} />
        {!hasKey && <NoKeyTip />}
        {error && <ErrorTip message={error} onRetry={handleAnalyze} />}

        {result && (
          <div className="space-y-4">
            {result.errors.length === 0 ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">未发现错别字</div>
            ) : (
              <div className="space-y-2">
                {result.errors.map((e, i) => (
                  <div key={i} className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center gap-2">
                      <EditableField value={e.original} onChange={v => updateError(i, 'original', v)} className="w-24" />
                      <span className="text-slate-400 shrink-0">→</span>
                      <EditableField value={e.suggestion} onChange={v => updateError(i, 'suggestion', v)} className="w-24" />
                      <EditableField value={e.context} onChange={v => updateError(i, 'context', v)} className="flex-1 text-slate-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500">修正后文本</span>
                <CopyButton text={result.correctedText} />
              </div>
              <EditableTextarea
                value={result.correctedText}
                onChange={v => setResult({ ...result, correctedText: v })}
                rows={20}
              />
            </div>
          </div>
        )}
      </div>

      <div className="w-[360px] shrink-0 border-l border-slate-200 flex flex-col">
        <ChatPanel
          key={analysisKey}
          systemPrompt={SYSTEM_PROMPT}
          contextSummary={result ? `错别字检查完成。\n原文：\n${input}\n\n发现 ${result.errors.length} 处错别字。\n${result.errors.map(e => `- "${e.original}" → "${e.suggestion}"（${e.context}）`).join('\n')}\n\n修正后文本：\n${result.correctedText}` : ''}
          onUpdate={handleUpdate}
          onUndo={handleUndo}
          canUndo={history.length > 0}
          hasResult={!!result}
        />
      </div>
    </div>
  );
};

export default SpellCheckView;
