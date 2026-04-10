# AI 文本工具对话增强 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 AI 文本工具所有 6 个 tab 分析结果下方增加对话区，让用户基于分析结果继续追问 AI 并做交互式调整。

**Architecture:** 在 `useDeepSeek.ts` 新增 `useDeepSeekChat` hook 支持多轮消息历史；在 `shared.tsx` 新增可复用 `ChatPanel` 组件；各 tab 在有分析结果时渲染 `ChatPanel`，将原文和结构化结果序列化为文本作为隐式上下文注入到对话首条消息。

**Tech Stack:** React 18, TypeScript, Tailwind CSS, DeepSeek API (已有集成)

---

## 文件变更清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `components/ai-text/useDeepSeek.ts` | 修改 | 新增 `useDeepSeekChat` hook |
| `components/ai-text/shared.tsx` | 修改 | 新增 `ChatPanel` 组件 |
| `components/ai-text/SpellCheckView.tsx` | 修改 | 集成 ChatPanel |
| `components/ai-text/ContractReviewView.tsx` | 修改 | 集成 ChatPanel |
| `components/ai-text/ArticleReviewView.tsx` | 修改 | 集成 ChatPanel |
| `components/ai-text/TextPolishView.tsx` | 修改 | 集成 ChatPanel |
| `components/ai-text/MeetingMinutesView.tsx` | 修改 | 集成 ChatPanel |
| `components/ai-text/ResumeOptimizeView.tsx` | 修改 | 集成 ChatPanel |

---

## Task 1: 新增 `useDeepSeekChat` hook

**Files:**
- Modify: `components/ai-text/useDeepSeek.ts`

- [ ] **Step 1: 在文件末尾追加 `useDeepSeekChat` 导出**

将 `components/ai-text/useDeepSeek.ts` 全部内容替换为：

```typescript
import { useState, useCallback } from 'react';

export const useDeepSeek = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const call = useCallback(async (systemPrompt: string, userContent: string): Promise<string> => {
    const apiKey = localStorage.getItem('deepseek_api_key');
    if (!apiKey) {
      throw new Error('请先在设置中配置 DeepSeek API Key');
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent },
          ],
        }),
      });
      if (res.status === 401) throw new Error('API Key 无效，请检查设置');
      if (res.status === 429) throw new Error('请求过于频繁，请稍后重试');
      if (!res.ok) throw new Error(`请求失败（${res.status}）`);
      const data = await res.json();
      return data.choices[0].message.content as string;
    } catch (err: any) {
      const msg = err.message ?? '网络错误，请检查连接';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  return { call, loading, error };
};

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const useDeepSeekChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // send 发送一条用户消息。首次发送时可传 contextSummary，
  // 该文本会作为隐式 assistant 消息注入 API，但不显示在 UI 中。
  const send = useCallback(async (
    systemPrompt: string,
    userContent: string,
    contextSummary?: string
  ) => {
    const apiKey = localStorage.getItem('deepseek_api_key');
    if (!apiKey) {
      setError('请先在设置中配置 DeepSeek API Key');
      return;
    }

    const userMsg: ChatMessage = { role: 'user', content: userContent };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setLoading(true);
    setError(null);

    try {
      // 构造发给 API 的消息序列：
      // 若是第一条用户消息且有 contextSummary，先注入一条隐式 assistant 消息作为上下文。
      const apiMessages: ChatMessage[] =
        contextSummary && messages.length === 0
          ? [{ role: 'assistant', content: contextSummary }, userMsg]
          : nextMessages;

      const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: systemPrompt },
            ...apiMessages,
          ],
        }),
      });
      if (res.status === 401) throw new Error('API Key 无效，请检查设置');
      if (res.status === 429) throw new Error('请求过于频繁，请稍后重试');
      if (!res.ok) throw new Error(`请求失败（${res.status}）`);
      const data = await res.json();
      const reply = data.choices[0].message.content as string;
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (err: any) {
      const msg = err.message ?? '网络错误，请检查连接';
      setError(msg);
      // 发送失败时撤回刚追加的用户消息
      setMessages(messages);
    } finally {
      setLoading(false);
    }
  }, [messages]);

  const reset = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, send, loading, error, reset };
};
```

- [ ] **Step 2: 验证编译无报错**

在浏览器 `http://localhost:3001` 确认控制台无 TypeScript 错误。

---

## Task 2: 新增 `ChatPanel` 组件

**Files:**
- Modify: `components/ai-text/shared.tsx`

- [ ] **Step 1: 在 `shared.tsx` 顶部追加新 import**

在文件第 1 行 import 行，将：
```typescript
import React, { useRef } from 'react';
import { Upload, Loader2, Trash2 } from 'lucide-react';
```
替换为：
```typescript
import React, { useRef, useState, useEffect } from 'react';
import { Upload, Loader2, Trash2, Send, MessageCircle } from 'lucide-react';
import { useDeepSeekChat } from './useDeepSeek';
```

- [ ] **Step 2: 在文件末尾追加 `ChatPanel` 组件**

在 `shared.tsx` 末尾（`ErrorTip` 组件之后）追加：

```typescript
interface ChatPanelProps {
  systemPrompt: string;
  /** 将分析结果序列化为纯文本传入，作为对话首轮的隐式上下文 */
  contextSummary: string;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ systemPrompt, contextSummary }) => {
  const [input, setInput] = useState('');
  const { messages, send, loading, error } = useDeepSeekChat();
  const bottomRef = useRef<HTMLDivElement>(null);
  const hasKey = !!localStorage.getItem('deepseek_api_key');

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading || !hasKey) return;
    setInput('');
    // 首次发送时注入分析结果作为上下文
    await send(systemPrompt, text, messages.length === 0 ? contextSummary : undefined);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="mt-6 border-t border-slate-200 pt-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
        <MessageCircle className="w-4 h-4 text-indigo-500" />
        继续追问
      </h3>

      {messages.length > 0 && (
        <div className="space-y-3 mb-4 max-h-96 overflow-y-auto pr-1">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-sm'
                    : 'bg-white border border-slate-200 text-slate-700 rounded-bl-sm'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="px-4 py-3 bg-white border border-slate-200 rounded-2xl rounded-bl-sm">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      {!hasKey && <NoKeyTip />}
      {error && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
          {error}
        </div>
      )}

      <div className="flex gap-2 items-end">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入问题，按 Enter 发送（Shift+Enter 换行）..."
          rows={2}
          className="flex-1 px-4 py-2.5 text-sm text-slate-700 bg-white border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 leading-relaxed"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || loading || !hasKey}
          className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white rounded-xl transition-colors shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
```

- [ ] **Step 3: 验证页面正常渲染**

访问 `http://localhost:3001`，切换到"AI 文本工具"，确认控制台无报错。

---

## Task 3: SpellCheckView 集成 ChatPanel

**Files:**
- Modify: `components/ai-text/SpellCheckView.tsx`

- [ ] **Step 1: 添加 ChatPanel import**

在文件顶部第 3 行 import 行：
```typescript
import { TextInputArea, AnalyzeButton, CopyButton, NoKeyTip, ErrorTip } from './shared';
```
替换为：
```typescript
import { TextInputArea, AnalyzeButton, CopyButton, NoKeyTip, ErrorTip, ChatPanel } from './shared';
```

- [ ] **Step 2: 在分析结果底部追加 ChatPanel**

找到组件末尾的 `{result && (` 代码块，在 `</div>` 闭合（`{result && (...)}`的结束处）之前、整个 `result` 区块最后，追加 ChatPanel。

将：
```typescript
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-slate-700">修正后文本</h3>
              <CopyButton text={result.correctedText} />
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
              {result.correctedText}
            </div>
          </div>
        </div>
      )}
```
替换为：
```typescript
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-slate-700">修正后文本</h3>
              <CopyButton text={result.correctedText} />
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
              {result.correctedText}
            </div>
          </div>

          <ChatPanel
            key={JSON.stringify(result)}
            systemPrompt={SYSTEM_PROMPT}
            contextSummary={`错别字检查完成。\n原文：\n${input}\n\n检查结果：\n发现 ${result.errors.length} 处错别字。\n${result.errors.map(e => `- "${e.original}" → "${e.suggestion}"（${e.context}）`).join('\n')}\n\n修正后文本：\n${result.correctedText}`}
          />
        </div>
      )}
```

- [ ] **Step 3: 验证**

访问"错别字识别" tab，输入文本点击分析，确认结果下方出现"继续追问"区域，追问一条消息后 AI 正常回复。

---

## Task 4: ContractReviewView 集成 ChatPanel

**Files:**
- Modify: `components/ai-text/ContractReviewView.tsx`

- [ ] **Step 1: 添加 ChatPanel import**

将：
```typescript
import { TextInputArea, AnalyzeButton, NoKeyTip, ErrorTip } from './shared';
```
替换为：
```typescript
import { TextInputArea, AnalyzeButton, NoKeyTip, ErrorTip, ChatPanel } from './shared';
```

- [ ] **Step 2: 在结果区追加 ChatPanel**

将文件末尾：
```typescript
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-700">风险详情（{result.risks.length} 条）</h3>
            {result.risks.map((r, i) => (
              <div key={i} className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded border ${LEVEL_STYLE[r.level]}`}>{LEVEL_LABEL[r.level]}</span>
                  <span className="text-sm font-medium text-slate-700">{r.clause}</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{r.description}</p>
                <div className="pt-1 border-t border-slate-100">
                  <span className="text-xs text-slate-400">建议：</span>
                  <span className="text-xs text-slate-600">{r.suggestion}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
```
替换为：
```typescript
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-700">风险详情（{result.risks.length} 条）</h3>
            {result.risks.map((r, i) => (
              <div key={i} className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded border ${LEVEL_STYLE[r.level]}`}>{LEVEL_LABEL[r.level]}</span>
                  <span className="text-sm font-medium text-slate-700">{r.clause}</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{r.description}</p>
                <div className="pt-1 border-t border-slate-100">
                  <span className="text-xs text-slate-400">建议：</span>
                  <span className="text-xs text-slate-600">{r.suggestion}</span>
                </div>
              </div>
            ))}
          </div>

          <ChatPanel
            key={JSON.stringify(result)}
            systemPrompt={SYSTEM_PROMPT}
            contextSummary={`合同审查完成，综合评分 ${result.score}。\n摘要：${result.summary}\n\n合同原文：\n${input}\n\n风险详情：\n${result.risks.map(r => `- [${LEVEL_LABEL[r.level]}] ${r.clause}：${r.description}。建议：${r.suggestion}`).join('\n')}`}
          />
        </div>
      )}
```

- [ ] **Step 3: 验证**

访问"合同审查" tab，分析后追问"帮我把高风险条款改得更严格"，AI 应正常回复。

---

## Task 5: ArticleReviewView 集成 ChatPanel

**Files:**
- Modify: `components/ai-text/ArticleReviewView.tsx`

- [ ] **Step 1: 添加 ChatPanel import**

将：
```typescript
import { TextInputArea, AnalyzeButton, NoKeyTip, ErrorTip } from './shared';
```
替换为：
```typescript
import { TextInputArea, AnalyzeButton, NoKeyTip, ErrorTip, ChatPanel } from './shared';
```

- [ ] **Step 2: 在结果区末尾追加 ChatPanel**

找到结果区末尾，将：
```typescript
        </div>
      )}
    </div>
  );
};
```
替换为（注意保留原有的 result 内容，仅在 `</div>` 前插入 ChatPanel）：

在 `{result && (` 块内，在最后一个 `</div>` 关闭之前追加：

```typescript
          <ChatPanel
            key={JSON.stringify(result)}
            systemPrompt={buildSystemPrompt(reviewType)}
            contextSummary={[
              `文章审查完成（审查类型：${reviewType === 'writing' ? '写作质量' : reviewType === 'compliance' ? '内容合规' : '两者都查'}）。`,
              `\n文章原文：\n${input}`,
              result.writing
                ? `\n\n写作质量评价：${result.writing.overallComment}\n问题列表：\n${result.writing.issues.map(i => `- [${i.type}] ${i.description}（原文：…${i.location}…）`).join('\n')}`
                : '',
              result.compliance
                ? `\n\n内容合规状态：${result.compliance.status}\n合规问题：\n${result.compliance.issues.map(i => `- ${i.description}（原文：…${i.location}…）`).join('\n')}`
                : '',
            ].join('')}
          />
```

具体替换位置（文件第 100 行左右）：

将：
```typescript
          )}
        </div>
      )}
    </div>
```
替换为：
```typescript
          )}

          <ChatPanel
            key={JSON.stringify(result)}
            systemPrompt={buildSystemPrompt(reviewType)}
            contextSummary={[
              `文章审查完成（审查类型：${reviewType === 'writing' ? '写作质量' : reviewType === 'compliance' ? '内容合规' : '两者都查'}）。`,
              `\n文章原文：\n${input}`,
              result.writing
                ? `\n\n写作质量评价：${result.writing.overallComment}\n问题列表：\n${result.writing.issues.map(iss => `- [${iss.type}] ${iss.description}（原文：…${iss.location}…）`).join('\n')}`
                : '',
              result.compliance
                ? `\n\n内容合规状态：${result.compliance.status}\n合规问题：\n${result.compliance.issues.map(iss => `- ${iss.description}（原文：…${iss.location}…）`).join('\n')}`
                : '',
            ].join('')}
          />
        </div>
      )}
    </div>
```

- [ ] **Step 3: 验证**

访问"文章审查" tab，完成分析后追问，AI 应正常回复。

---

## Task 6: TextPolishView 集成 ChatPanel

**Files:**
- Modify: `components/ai-text/TextPolishView.tsx`

- [ ] **Step 1: 添加 ChatPanel import**

将：
```typescript
import { TextInputArea, AnalyzeButton, CopyButton, NoKeyTip, ErrorTip } from './shared';
```
替换为：
```typescript
import { TextInputArea, AnalyzeButton, CopyButton, NoKeyTip, ErrorTip, ChatPanel } from './shared';
```

- [ ] **Step 2: 在结果区追加 ChatPanel**

将：
```typescript
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-2">主要改动</h3>
            <ul className="space-y-1">
              {result.changes.map((c, i) => (
                <li key={i} className="text-xs text-slate-500 flex gap-2">
                  <span className="text-indigo-400">•</span>{c}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
```
替换为：
```typescript
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-2">主要改动</h3>
            <ul className="space-y-1">
              {result.changes.map((c, i) => (
                <li key={i} className="text-xs text-slate-500 flex gap-2">
                  <span className="text-indigo-400">•</span>{c}
                </li>
              ))}
            </ul>
          </div>

          <ChatPanel
            key={JSON.stringify(result)}
            systemPrompt={buildPrompt(style)}
            contextSummary={`文本润色完成（${STYLE_LABEL[style]}风格）。\n\n原文：\n${input}\n\n主要改动：\n${result.changes.map(c => `- ${c}`).join('\n')}\n\n润色后文本：\n${result.polishedText}`}
          />
        </div>
      )}
```

- [ ] **Step 3: 验证**

访问"文本润色" tab，润色后追问"再简洁一些"，AI 应返回进一步润色的版本。

---

## Task 7: MeetingMinutesView 集成 ChatPanel

**Files:**
- Modify: `components/ai-text/MeetingMinutesView.tsx`

- [ ] **Step 1: 添加 ChatPanel import**

将：
```typescript
import { TextInputArea, AnalyzeButton, NoKeyTip, ErrorTip } from './shared';
```
替换为：
```typescript
import { TextInputArea, AnalyzeButton, NoKeyTip, ErrorTip, ChatPanel } from './shared';
```

- [ ] **Step 2: 在结果区追加 ChatPanel**

将：
```typescript
        </div>
      )}
    </div>
  );
};
```
找到 `{result && (` 块内最后一个 `</div>` 前，将：
```typescript
        </div>
      )}
    </div>
  );
};
```
替换为：
```typescript
          <ChatPanel
            key={JSON.stringify(result)}
            systemPrompt={SYSTEM_PROMPT}
            contextSummary={`会议纪要整理完成。\n\n原始记录：\n${input}\n\n议题：\n${result.topics.map(t => `- ${t}`).join('\n')}\n\n决议：\n${result.decisions.map(d => `- ${d}`).join('\n')}\n\n待办：\n${result.todos.map(t => `- ${t.task}${t.owner ? `（负责：${t.owner}）` : ''}${t.deadline ? `（截止：${t.deadline}）` : ''}`).join('\n')}`}
          />
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 3: 验证**

访问"会议纪要整理" tab，整理后追问"把待办事项格式化为表格"，AI 应正常响应。

---

## Task 8: ResumeOptimizeView 集成 ChatPanel

**Files:**
- Modify: `components/ai-text/ResumeOptimizeView.tsx`

- [ ] **Step 1: 添加 ChatPanel import**

将：
```typescript
import { TextInputArea, AnalyzeButton, CopyButton, NoKeyTip, ErrorTip } from './shared';
```
替换为：
```typescript
import { TextInputArea, AnalyzeButton, CopyButton, NoKeyTip, ErrorTip, ChatPanel } from './shared';
```

- [ ] **Step 2: 在结果区追加 ChatPanel**

将：
```typescript
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-slate-700">优化后简历</h3>
              <CopyButton text={result.optimizedResume} />
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
              {result.optimizedResume}
            </div>
          </div>
        </div>
      )}
```
替换为：
```typescript
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-slate-700">优化后简历</h3>
              <CopyButton text={result.optimizedResume} />
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
              {result.optimizedResume}
            </div>
          </div>

          <ChatPanel
            key={JSON.stringify(result)}
            systemPrompt={SYSTEM_PROMPT}
            contextSummary={`简历优化完成。\n\n原始简历：\n${resumeText}${jobDesc ? `\n\n目标职位描述：\n${jobDesc}` : ''}\n\n整体评价：${result.overallComment}\n\n改进建议：\n${result.suggestions.map(s => `- [${PRIORITY_LABEL[s.priority]}] ${s.field}：${s.suggestion}`).join('\n')}\n\n优化后简历：\n${result.optimizedResume}`}
          />
        </div>
      )}
```

- [ ] **Step 3: 验证**

访问"简历优化" tab，优化后追问"帮我强化工作经历部分"，AI 应正常响应。

---

## 整体验收

- [ ] 6 个 tab 均在分析结果下方显示"继续追问"区域
- [ ] 输入问题按 Enter 发送，Shift+Enter 换行
- [ ] AI 回复显示在对话气泡中（用户右侧蓝色，AI 左侧白色）
- [ ] 重新点击"开始分析"后，对话历史自动重置（因 `key={JSON.stringify(result)}` 变化）
- [ ] 未配置 API Key 时，对话区显示"请先配置"提示，发送按钮禁用
- [ ] 切换 tab 后再切回，对话历史保留（因 Task 0 的 CSS keep-alive 策略）
