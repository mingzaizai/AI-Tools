import React, { useState, useCallback } from 'react';
import { useDeepSeek } from './useDeepSeek';
import { TextInputArea, CopyButton, NoKeyTip, ErrorTip, ChatPanel, EditableTextarea } from './shared';

type PolishStyle = 'formal' | 'casual' | 'concise' | 'professional';

const STYLE_LABEL: Record<PolishStyle, string> = {
  formal: '正式', casual: '口语', concise: '简洁', professional: '专业',
};

interface PolishResult {
  polishedText: string;
  changes: string[];
}

const buildPrompt = (style: PolishStyle) =>
  `你是专业文字编辑。请将用户文本润色为"${STYLE_LABEL[style]}"风格，返回严格的 JSON：
{ "polishedText": "润色后文本", "changes": ["改动说明1", "改动说明2"] }
只返回 JSON，不要其他内容。`;

const TextPolishView: React.FC = () => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<PolishResult | null>(null);
  const [history, setHistory] = useState<PolishResult[]>([]);
  const [analysisKey, setAnalysisKey] = useState(0);
  const { call, loading, error } = useDeepSeek();
  const hasKey = !!localStorage.getItem('deepseek_api_key') || !!localStorage.getItem('qwen_api_key');
  const defaultModel = localStorage.getItem('default_ai_model') as 'deepseek' | 'qwen' ?? 'deepseek';

  const handleAnalyze = async () => {
    try {
      const raw = await call(buildPrompt('professional'), input, defaultModel);
      const json = raw.replace(/```json\n?|```/g, '').trim();
      setResult(JSON.parse(json));
      setHistory([]);
      setAnalysisKey(k => k + 1);
    } catch {}
  };

  const handleUpdate = useCallback((data: unknown) => {
    setResult(prev => {
      if (prev) setHistory(h => [...h, prev]);
      return data as PolishResult;
    });
  }, []);

  const handleUndo = () => {
    setHistory(h => {
      const prev = h[h.length - 1];
      if (prev) setResult(prev);
      return h.slice(0, -1);
    });
  };

  const updateChange = (i: number, val: string) => {
    if (!result) return;
    const changes = result.changes.map((c, idx) => idx === i ? val : c);
    setResult({ ...result, changes });
  };

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 space-y-6 min-w-0">
        <TextInputArea value={input} onChange={setInput} placeholder="请输入或粘贴需要润色的文本..." onAnalyze={handleAnalyze} analyzeLoading={loading} analyzeDisabled={!input.trim() || !hasKey} />
        {!hasKey && <NoKeyTip />}
        {error && <ErrorTip message={error} onRetry={handleAnalyze} />}

        {result && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500">润色结果</span>
                <CopyButton text={result.polishedText} />
              </div>
              <EditableTextarea
                value={result.polishedText}
                onChange={v => setResult({ ...result, polishedText: v })}
                rows={20}
              />
            </div>
            <div className="space-y-1.5">
              {result.changes.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-indigo-400 shrink-0">•</span>
                  <input
                    type="text"
                    value={c}
                    onChange={e => updateChange(i, e.target.value)}
                    className="flex-1 px-2 py-1 text-xs text-slate-500 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="w-[360px] shrink-0 border-l border-slate-200 flex flex-col">
        <ChatPanel
          key={analysisKey}
          systemPrompt={buildPrompt('professional')}
          contextSummary={result ? `文本润色完成（专业风格）。\n\n原文：\n${input}\n\n改动：\n${result.changes.map(c => `- ${c}`).join('\n')}\n\n润色后文本：\n${result.polishedText}` : ''}
          onUpdate={handleUpdate}
          onUndo={handleUndo}
          canUndo={history.length > 0}
          hasResult={!!result}
        />
      </div>
    </div>
  );
};

export default TextPolishView;
