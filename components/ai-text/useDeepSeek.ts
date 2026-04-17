import { useState, useCallback } from 'react';

export type AIModel = 'deepseek' | 'qwen';

const getAIConfig = (model: AIModel): AIConfig | null => {
  const configs: Record<AIModel, { endpoint: string; modelName: string; keyName: string; format: 'openai' | 'qwen' }> = {
    deepseek: {
      endpoint: '/api/deepseek/chat/completions',
      modelName: 'deepseek-chat',
      keyName: 'deepseek_api_key',
      format: 'openai',
    },
    qwen: {
      endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
      modelName: 'qwen-turbo',
      keyName: 'qwen_api_key',
      format: 'openai',
    },
  };
  
  const cfg = configs[model];
  const apiKey = localStorage.getItem(cfg.keyName)?.replace(/[^\x20-\x7E]/g, '') || null;

  if (!apiKey) return null;
  
  return {
    model,
    apiKey,
    endpoint: cfg.endpoint,
    modelName: cfg.modelName,
    format: cfg.format,
  };
};

export interface AIConfig {
  model: AIModel;
  apiKey: string;
  endpoint: string;
  modelName: string;
  format: 'openai' | 'qwen';
}

export const useDeepSeek = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const call = useCallback(async (systemPrompt: string, userContent: string, model: AIModel = 'deepseek'): Promise<string> => {
    const config = getAIConfig(model);
    if (!config) {
      const modelNames: Record<AIModel, string> = {
        deepseek: 'DeepSeek',
        qwen: 'Qwen',
      };
      throw new Error(`请先在设置中配置 ${modelNames[model]} API Key`);
    }
    
    setLoading(true);
    setError(null);
    
    try {
      let requestBody: Record<string, unknown>;
      
      if (config.format === 'qwen') {
        // Qwen API 格式
        requestBody = {
          model: config.modelName,
          input: {
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userContent },
            ],
          },
          parameters: {
            max_tokens: 2048,
            temperature: 0.7,
          },
        };
      } else {
        // OpenAI 兼容格式（DeepSeek）
        requestBody = {
          model: config.modelName,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent },
          ],
        };
      }
      
      const res = await fetch(config.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.apiKey}` },
        body: JSON.stringify(requestBody),
      });
      
      if (res.status === 401) throw new Error('API Key 无效，请检查设置');
      if (res.status === 429) throw new Error('请求过于频繁，请稍后重试');
      if (!res.ok) throw new Error(`请求失败（${res.status}）`);
      
      const data = await res.json();
      
      // 解析响应
      if (config.format === 'qwen') {
        // Qwen 响应格式: { output: { text }, usage, request_id }
        return data.output?.text as string;
      } else {
        // OpenAI 兼容格式: { choices: [{ message: { content } }] }
        return data.choices?.[0]?.message?.content as string;
      }
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

  const send = useCallback(async (
    systemPrompt: string,
    userContent: string,
    contextSummary?: string,
    transform?: (reply: string) => string,
    model: AIModel = 'deepseek'
  ): Promise<string | null> => {
    const config = getAIConfig(model);
    if (!config) {
      const modelNames: Record<AIModel, string> = {
        deepseek: 'DeepSeek',
        qwen: 'Qwen',
      };
      setError(`请先在设置中配置 ${modelNames[model]} API Key`);
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

      let requestBody: Record<string, unknown>;
      
      if (config.format === 'qwen') {
        // Qwen API 格式
        requestBody = {
          model: config.modelName,
          input: {
            messages: [
              { role: 'system', content: systemPrompt },
              ...apiMessages,
            ],
          },
          parameters: {
            max_tokens: 2048,
            temperature: 0.7,
          },
        };
      } else {
        // OpenAI 兼容格式（DeepSeek）
        requestBody = {
          model: config.modelName,
          messages: [
            { role: 'system', content: systemPrompt },
            ...apiMessages,
          ],
        };
      }

      const res = await fetch(config.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.apiKey}` },
        body: JSON.stringify(requestBody),
      });
      
      if (res.status === 401) throw new Error('API Key 无效，请检查设置');
      if (res.status === 429) throw new Error('请求过于频繁，请稍后重试');
      if (!res.ok) throw new Error(`请求失败（${res.status}）`);
      
      const data = await res.json();
      
      // 解析响应
      const reply = config.format === 'qwen' 
        ? (data.output?.text as string)
        : (data.choices?.[0]?.message?.content as string);
      
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

// 新增：检查可用的模型
export const getAvailableModels = (): AIModel[] => {
  const models: AIModel[] = [];
  if (localStorage.getItem('deepseek_api_key')) {
    models.push('deepseek');
  }
  if (localStorage.getItem('qwen_api_key')) {
    models.push('qwen');
  }
  return models;
};

// 新增：检查是否有任何模型配置
export const hasAnyModelConfigured = (): boolean => {
  return !!localStorage.getItem('deepseek_api_key') || !!localStorage.getItem('qwen_api_key');
};