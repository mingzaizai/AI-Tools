import React, { useRef, useState, useEffect } from 'react';
import { Upload, Loader2, Trash2, Send, Undo2 } from 'lucide-react';
import { extractTextFromFile } from '../../utils';
import { useDeepSeekChat } from './useDeepSeek';

interface TextInputAreaProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  onAnalyze?: () => void;
  analyzeLoading?: boolean;
  analyzeDisabled?: boolean;
}

// 可编辑的单行字段（用于标题/短文本结果）
interface EditableFieldProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}
export const EditableField: React.FC<EditableFieldProps> = ({ value, onChange, placeholder = '', className = '' }) => (
  <input
    type="text"
    value={value}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    className={`w-full px-3 py-1.5 text-sm text-slate-700 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 ${className}`}
  />
);

// 可编辑的多行文本（用于长文本结果）
interface EditableTextareaProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}
export const EditableTextarea: React.FC<EditableTextareaProps> = ({ value, onChange, placeholder = '', rows = 4, className = '' }) => (
  <textarea
    value={value}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    rows={rows}
    className={`w-full px-3 py-2 text-sm text-slate-700 bg-white border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 leading-relaxed ${className}`}
  />
);

export const TextInputArea: React.FC<TextInputAreaProps> = ({ value, onChange, placeholder = '请输入或粘贴文本...', rows = 20, onAnalyze, analyzeLoading, analyzeDisabled }) => {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await extractTextFromFile(file);
      onChange(text);
    } catch (err: any) {
      alert(err.message);
    }
    e.target.value = '';
  };

  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-4 py-3 text-sm text-slate-700 bg-white border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 leading-relaxed"
      />
      <div className="mt-2 flex gap-2 items-center">
        <button
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <Upload className="w-3.5 h-3.5" />
          上传文件
        </button>
        {value && (
          <button
            onClick={() => onChange('')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            清空
          </button>
        )}
        {onAnalyze && (
          <button
            onClick={onAnalyze}
            disabled={analyzeLoading || analyzeDisabled}
            className="flex items-center gap-2 px-5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-xs font-medium rounded-lg transition-colors"
          >
            {analyzeLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {analyzeLoading ? '分析中...' : '开始分析'}
          </button>
        )}
        <span className="text-xs text-slate-400 self-center ml-auto">支持 .txt / .docx</span>
      </div>
      <input ref={fileRef} type="file" accept=".txt,.docx" className="hidden" onChange={handleFile} />
    </div>
  );
};

interface AnalyzeButtonProps {
  onClick: () => void;
  loading: boolean;
  disabled?: boolean;
}

export const AnalyzeButton: React.FC<AnalyzeButtonProps> = ({ onClick, loading, disabled }) => (
  <button
    onClick={onClick}
    disabled={loading || disabled}
    className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-sm font-medium rounded-xl transition-colors"
  >
    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
    {loading ? '分析中...' : '开始分析'}
  </button>
);

interface CopyButtonProps {
  text: string;
}

export const CopyButton: React.FC<CopyButtonProps> = ({ text }) => {
  const [copied, setCopied] = React.useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={handleCopy} className="text-xs text-indigo-600 hover:underline">
      {copied ? '已复制' : '一键复制'}
    </button>
  );
};

export const NoKeyTip: React.FC = () => (
  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
    请先配置 DeepSeek API Key。
    <button
      onClick={() => window.dispatchEvent(new Event('navigate-to-settings'))}
      className="ml-1 text-indigo-600 underline"
    >
      前往设置
    </button>
  </div>
);

interface ErrorTipProps {
  message: string;
  onRetry: () => void;
}

export const ErrorTip: React.FC<ErrorTipProps> = ({ message, onRetry }) => (
  <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-center justify-between">
    <span>{message}</span>
    <button onClick={onRetry} className="text-xs text-indigo-600 underline ml-4">重试</button>
  </div>
);

interface ChatPanelProps {
  systemPrompt: string;
  contextSummary: string;
  // 当 AI 返回合法 JSON 时，回调更新父组件的 result 状态
  onUpdate?: (data: unknown) => void;
  // 撤回上一步修改
  onUndo?: () => void;
  canUndo?: boolean;
  // 是否已有分析结果（无结果时禁用输入）
  hasResult?: boolean;
}

// 在原始 systemPrompt 基础上追加对话模式说明
function buildChatPrompt(base: string): string {
  return `${base}

---
你现在处于对话模式。规则：
1. 若用户要求修改、调整、优化分析结果，返回完整的更新后 JSON（格式与上方一致），用 \`\`\`json 包裹。
2. 若用户只是提问或需要解释，直接用中文回答，不要返回 JSON。`;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ systemPrompt, contextSummary, onUpdate, onUndo, canUndo, hasResult }) => {
  const [input, setInput] = useState('');
  const { messages, send, loading, error } = useDeepSeekChat();
  const bottomRef = useRef<HTMLDivElement>(null);
  const hasKey = !!localStorage.getItem('deepseek_api_key');
  const chatPrompt = buildChatPrompt(systemPrompt);
  const inputDisabled = !hasResult || !hasKey || loading;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || inputDisabled) return;
    setInput('');
    await send(
      chatPrompt,
      text,
      messages.length === 0 ? contextSummary : undefined,
      (reply) => {
        // 尝试解析为 JSON，成功则更新左侧结果，显示简短确认
        try {
          const cleaned = reply.replace(/```json\n?|```/g, '').trim();
          const parsed = JSON.parse(cleaned);
          onUpdate?.(parsed);
          return '✅ 已根据你的要求更新了分析结果';
        } catch {
          return reply;
        }
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* 顶部操作栏 */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 shrink-0">
        <span className="text-xs text-slate-400">AI 对话</span>
        {canUndo && (
          <button
            onClick={onUndo}
            className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            <Undo2 className="w-3.5 h-3.5" />
            撤回修改
          </button>
        )}
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-xs text-slate-400 text-center pt-8 leading-relaxed">
            {hasResult ? <>分析完成，可继续追问<br />或要求 AI 调整结果</> : <>完成分析后<br />可在此与 AI 对话</>}
          </p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[88%] px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
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

      {/* 输入区 */}
      <div className="p-3 border-t border-slate-100 bg-white shrink-0">
        {!hasKey && <div className="mb-2"><NoKeyTip /></div>}
        {error && (
          <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
            {error}
          </div>
        )}
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={inputDisabled}
            placeholder={!hasResult ? '请先完成分析...' : '追问或要求调整... (Enter 发送)'}
            rows={3}
            className="flex-1 px-3 py-2 text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 leading-relaxed disabled:opacity-40 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || inputDisabled}
            className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white rounded-xl transition-colors shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
