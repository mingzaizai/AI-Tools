import React, { useState, useCallback } from 'react';
import { useDeepSeek } from './useDeepSeek';
import { TextInputArea, NoKeyTip, ErrorTip, ChatPanel, EditableField } from './shared';

interface Todo { task: string; owner: string; deadline: string; }

interface MeetingResult {
  topics: string[];
  decisions: string[];
  todos: Todo[];
}

const SYSTEM_PROMPT = `你是专业的会议纪要整理助手。请将用户提供的会议记录整理为结构化纪要，返回严格的 JSON：
{
  "topics": ["议题1"],
  "decisions": ["决议1"],
  "todos": [{ "task": "任务描述", "owner": "负责人（若无则空字符串）", "deadline": "截止日期（若无则空字符串）" }]
}
只返回 JSON，不要其他内容。`;

const MeetingMinutesView: React.FC = () => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<MeetingResult | null>(null);
  const [history, setHistory] = useState<MeetingResult[]>([]);
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
      return data as MeetingResult;
    });
  }, []);

  const handleUndo = () => {
    setHistory(h => {
      const prev = h[h.length - 1];
      if (prev) setResult(prev);
      return h.slice(0, -1);
    });
  };

  const updateList = (field: 'topics' | 'decisions', i: number, val: string) => {
    if (!result) return;
    const arr = result[field].map((v, idx) => idx === i ? val : v);
    setResult({ ...result, [field]: arr });
  };

  const updateTodo = (i: number, field: keyof Todo, val: string) => {
    if (!result) return;
    const todos = result.todos.map((t, idx) => idx === i ? { ...t, [field]: val } : t);
    setResult({ ...result, todos });
  };

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 space-y-6 min-w-0">
        <TextInputArea value={input} onChange={setInput} placeholder="请粘贴原始会议记录..." rows={20} onAnalyze={handleAnalyze} analyzeLoading={loading} analyzeDisabled={!input.trim() || !hasKey} />
        {!hasKey && <NoKeyTip />}
        {error && <ErrorTip message={error} onRetry={handleAnalyze} />}

        {result && (
          <div className="space-y-6 p-5 bg-white border border-slate-200 rounded-2xl">
            {/* 会议议题 */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-2">会议议题</h3>
              {result.topics.length === 0 ? <p className="text-xs text-slate-400">无</p> : (
                <div className="space-y-1.5">
                  {result.topics.map((t, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-indigo-400 shrink-0">•</span>
                      <EditableField value={t} onChange={v => updateList('topics', i, v)} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 决议事项 */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-2">决议事项</h3>
              {result.decisions.length === 0 ? <p className="text-xs text-slate-400">无</p> : (
                <div className="space-y-1.5">
                  {result.decisions.map((d, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-green-400 shrink-0">•</span>
                      <EditableField value={d} onChange={v => updateList('decisions', i, v)} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 待办事项 */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-2">待办事项</h3>
              {result.todos.length === 0 ? <p className="text-xs text-slate-400">无</p> : (
                <div className="space-y-2">
                  {result.todos.map((t, i) => (
                    <div key={i} className="p-3 bg-slate-50 rounded-xl space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-amber-400 shrink-0">•</span>
                        <EditableField value={t.task} onChange={v => updateTodo(i, 'task', v)} className="flex-1" />
                      </div>
                      <div className="flex gap-3 pl-5">
                        <EditableField value={t.owner} onChange={v => updateTodo(i, 'owner', v)} placeholder="负责人" className="flex-1 text-xs text-slate-400" />
                        <EditableField value={t.deadline} onChange={v => updateTodo(i, 'deadline', v)} placeholder="截止日期" className="flex-1 text-xs text-slate-400" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="w-[360px] shrink-0 border-l border-slate-200 flex flex-col">
        <ChatPanel
          key={analysisKey}
          systemPrompt={SYSTEM_PROMPT}
          contextSummary={result ? `会议纪要整理完成。\n\n原始记录：\n${input}\n\n议题：\n${result.topics.map(t => `- ${t}`).join('\n')}\n\n决议：\n${result.decisions.map(d => `- ${d}`).join('\n')}\n\n待办：\n${result.todos.map(t => `- ${t.task}${t.owner ? `（负责：${t.owner}）` : ''}${t.deadline ? `（截止：${t.deadline}）` : ''}`).join('\n')}` : ''}
          onUpdate={handleUpdate}
          onUndo={handleUndo}
          canUndo={history.length > 0}
          hasResult={!!result}
        />
      </div>
    </div>
  );
};

export default MeetingMinutesView;
