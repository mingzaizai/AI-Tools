
import React, { useState } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { Wand2, BrainCircuit, Sparkles, Loader2, MessageSquare, AlertCircle } from 'lucide-react';
import { ImageData } from '../types';
import { fileToBase64 } from '../utils';

interface AIAnalysisPanelProps {
  image: ImageData;
}

const AIAnalysisPanel: React.FC<AIAnalysisPanelProps> = ({ image }) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const performAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const base64 = await fileToBase64(image.file);
      const base64Data = base64.split(',')[1];

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { text: "请分析这张图片并提供专业的修图建议。包括识别审美风格、技术问题（曝光、噪点、色彩平衡）以及 3 个具体的优化步骤。请务必使用中文返回。返回格式为 JSON。" },
            { inlineData: { mimeType: image.file.type, data: base64Data } }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              aesthetic: { type: Type.STRING },
              technicalIssues: { type: Type.ARRAY, items: { type: Type.STRING } },
              enhancements: { 
                type: Type.ARRAY, 
                items: { 
                  type: Type.OBJECT, 
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING }
                  }
                } 
              },
              suggestedCaption: { type: Type.STRING }
            },
            required: ["aesthetic", "technicalIssues", "enhancements"]
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("模型未返回任何文本内容。");
      }
      
      const result = JSON.parse(responseText.trim());
      setAnalysis(result);
    } catch (err: any) {
      console.error(err);
      setError("分析图片失败。请检查您的网络连接或 API Key。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-indigo-600/10 border border-indigo-500/20 rounded-xl">
        <div className="flex items-center gap-3 mb-3">
          <BrainCircuit className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm font-bold text-slate-200">AI 智能分析</h3>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed mb-4">
          让 Gemini 分析您的照片，提供专业的增强建议和智能配文。
        </p>
        <button 
          onClick={performAnalysis}
          disabled={loading}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? '分析画面中...' : '开始 AI 分析'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-red-400 font-medium">{error}</p>
        </div>
      )}

      {analysis && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div>
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">审美风格</h4>
            <div className="px-3 py-1.5 bg-slate-800 rounded-lg text-xs font-medium text-indigo-300 inline-block border border-slate-700/50">
              {analysis.aesthetic}
            </div>
          </div>

          {analysis.technicalIssues.length > 0 && (
            <div>
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">技术要点</h4>
              <ul className="space-y-2">
                {analysis.technicalIssues.map((issue: string, i: number) => (
                  <li key={i} className="text-[11px] text-slate-300 flex items-start gap-2">
                    <span className="text-indigo-500 mt-0.5">•</span>
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">增强步骤</h4>
            <div className="space-y-3">
              {analysis.enhancements.map((step: any, i: number) => (
                <div key={i} className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/50 group hover:border-indigo-500/30 transition-colors">
                  <h5 className="text-[11px] font-bold text-slate-200 mb-1 group-hover:text-indigo-300">{step.title}</h5>
                  <p className="text-[10px] text-slate-400 leading-normal">{step.description}</p>
                </div>
              ))}
            </div>
          </div>

          {analysis.suggestedCaption && (
            <div>
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">智能配文</h4>
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-700/50 flex gap-3 italic">
                <MessageSquare className="w-4 h-4 text-slate-500 shrink-0" />
                <p className="text-[11px] text-slate-400 leading-relaxed">"{analysis.suggestedCaption}"</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIAnalysisPanel;
