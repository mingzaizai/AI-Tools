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

  // transform: 可选，将原始 reply 转换为显示内容；返回 raw reply 供调用方进一步处理
  const send = useCallback(async (
    systemPrompt: string,
    userContent: string,
    contextSummary?: string,
    transform?: (reply: string) => string
  ): Promise<string | null> => {
    const apiKey = localStorage.getItem('deepseek_api_key');
    if (!apiKey) {
      setError('请先在设置中配置 DeepSeek API Key');
      return null;
    }

    const userMsg: ChatMessage = { role: 'user', content: userContent };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setLoading(true);
    setError(null);

    try {
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
      const displayContent = transform ? transform(reply) : reply;
      setMessages(prev => [...prev, { role: 'assistant', content: displayContent }]);
      return reply;
    } catch (err: any) {
      const msg = err.message ?? '网络错误，请检查连接';
      setError(msg);
      setMessages(messages);
      return null;
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
