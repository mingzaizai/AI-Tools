import React, { useState, useCallback } from 'react';
import { useDeepSeek } from './useDeepSeek';
import { TextInputArea, NoKeyTip, ErrorTip, ChatPanel, EditableField, EditableTextarea } from './shared';

interface Risk {
  level: 'high' | 'medium' | 'low';
  clause: string;
  description: string;
  suggestion: string;
}

interface ContractResult {
  score: number;
  summary: string;
  risks: Risk[];
}

const SYSTEM_PROMPT = `你是专业合同法律顾问。请审查合同文本，识别潜在风险并提供具体的修改建议。返回严格的 JSON：
{
  "score": 0-100整数,
  "summary": "整体风险摘要",
  "risks": [{ "level": "high|medium|low", "clause": "条款摘要", "description": "风险描述", "suggestion": "具体的修改建议，包括推荐的文本内容" }]
}

要求：
1. suggestion 字段必须给出具体、可操作的修改建议，包括推荐使用的具体文本内容
2. 对于模糊或缺失的条款，提供合理的默认值和文本表述
3. 确保建议符合《中华人民共和国民法典》相关规定
4. 只返回 JSON，不要其他内容。`;

const LEVEL_STYLE: Record<string, string> = {
  high: 'bg-red-100 text-red-700 border-red-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low: 'bg-green-100 text-green-700 border-green-200',
};
const LEVEL_LABEL: Record<string, string> = { high: '高风险', medium: '中风险', low: '低风险' };
const LEVELS = ['high', 'medium', 'low'] as const;

const ContractReviewView: React.FC = () => {
  const [input, setInput] = useState(`房屋租赁合同 (范本)

出租方（甲方）： ____________________

承租方（乙房）： ____________________

根据《中华人民共和国民法典》及相关法律法规，甲、乙双方在平等、自愿的基础上，就房屋租赁事宜达成如下协议：

第一条 房屋基本情况
房屋地址： 位于________________________________________________。

房屋面积： 建筑面积约_______平方米。

第二条 租赁期限
租赁期共_______个月，自_______年_____月_____日起至_______年_____月_____日止。

租赁期满，甲方有权收回房屋，乙方应如期交还。乙方如需续租，应提前_______日通知甲方。

第三条 租金及支付方式
租金标准： 每月租金为人民币（大写）______元（￥）。

支付方式： □月付 / □季付 / □半年付。

支付时间： 乙方应于每期租赁期开始前的_______日内将租金支付给甲方。

第四条 押金
本合同签订之日，乙方应向甲方支付押金人民币（大写）______元（￥）。

租赁期满或合同解除后，乙方结清相关费用（水、电、燃气、物业费等）并交还房屋后，甲方应将押金全额无息退还给乙方。

第五条 相关费用承担
租赁期间，因使用房屋所产生的下列费用由乙方承担：

水、电、煤气/天然气费；

物业管理费、清扫费；

宽带及有线电视费。

第六条 房屋维护与装修
甲方应保证房屋结构安全。

乙方在租赁期间不得擅自改变房屋结构。如需装修或安装大型设备，须征得甲方书面同意。

因乙方使用不当导致房屋及其附属设施损坏的，由乙方负责赔偿或维修。

第七条 合同解除与违约责任
甲方违约： 若甲方提前收回房屋或未按约定提供房屋，需双倍返还押金并赔偿乙方损失。

乙方违约： 若乙方逾期支付租金超过_______日，或擅自转租房屋，甲方有权解除合同并没收押金。

提前终止： 任何一方需提前终止合同，应提前_______日通知对方，并支付相当于_______个月租金的违约金。

第八条 免责条件
因不可抗力（如地震、火灾、政府拆迁等）导致合同无法履行的，本合同自动终止，双方互不承担违约责任。

第九条 其他约定
本合同未尽事宜，由双方协商解决，可签署补充协议。

本合同一式两份，甲、乙双方各执一份，自签字/盖章之日起生效。

甲方（签字）： ____________________

联系电话： ____________________

日期： _______年_____月_____日

乙方（签字）： ____________________

联系电话： ____________________

日期： _______年_____月_____日`);
  const [result, setResult] = useState<ContractResult | null>(null);
  const [history, setHistory] = useState<ContractResult[]>([]);
  const [analysisKey, setAnalysisKey] = useState(0);
  const { call, loading, error } = useDeepSeek();
  const defaultModel = localStorage.getItem('default_ai_model') as 'deepseek' | 'qwen' ?? 'deepseek';
  const hasKey = !!localStorage.getItem(`${defaultModel}_api_key`);

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
      return data as ContractResult;
    });
  }, []);

  const handleUndo = () => {
    setHistory(h => {
      const prev = h[h.length - 1];
      if (prev) setResult(prev);
      return h.slice(0, -1);
    });
  };

  const updateRisk = (i: number, field: keyof Risk, val: string) => {
    if (!result) return;
    const risks = result.risks.map((r, idx) => idx === i ? { ...r, [field]: val } : r);
    setResult({ ...result, risks });
  };

  const scoreColor = (s: number) => s >= 80 ? 'text-green-600' : s >= 60 ? 'text-amber-500' : 'text-red-600';

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 space-y-6 min-w-0">
        <TextInputArea value={input} onChange={setInput} placeholder="请输入或粘贴合同文本..." rows={20} onAnalyze={handleAnalyze} analyzeLoading={loading} analyzeDisabled={!input.trim() || !hasKey} />
        {!hasKey && <NoKeyTip />}
        {error && <ErrorTip message={error} onRetry={handleAnalyze} />}

        {result && (
          <div className="space-y-6">
            <div className="flex items-center gap-6 p-5 bg-white border border-slate-200 rounded-2xl">
              <div className="text-center shrink-0">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={result.score}
                  onChange={e => setResult({ ...result, score: Math.min(100, Math.max(0, Number(e.target.value))) })}
                  className={`w-16 text-4xl font-black text-center bg-transparent border-b-2 border-slate-200 focus:outline-none focus:border-indigo-400 ${scoreColor(result.score)}`}
                />
                <div className="text-xs text-slate-400 mt-1">综合评分</div>
              </div>
              <EditableTextarea
                value={result.summary}
                onChange={v => setResult({ ...result, summary: v })}
                rows={2}
                className="flex-1 text-slate-600"
              />
            </div>

            <div className="space-y-3">
              {result.risks.map((r, i) => (
                <div key={i} className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2">
                    <select
                      value={r.level}
                      onChange={e => updateRisk(i, 'level', e.target.value)}
                      className={`text-xs font-bold px-2 py-0.5 rounded border cursor-pointer focus:outline-none ${LEVEL_STYLE[r.level]}`}
                    >
                      {LEVELS.map(l => <option key={l} value={l}>{LEVEL_LABEL[l]}</option>)}
                    </select>
                    <EditableField value={r.clause} onChange={v => updateRisk(i, 'clause', v)} className="flex-1 font-medium" />
                  </div>
                  <EditableTextarea value={r.description} onChange={v => updateRisk(i, 'description', v)} rows={2} className="text-slate-500 text-xs" />
                  <div className="flex items-start gap-1.5 pt-1 border-t border-slate-100">
                    <span className="text-xs text-slate-400 shrink-0 mt-1.5">建议：</span>
                    <EditableTextarea value={r.suggestion} onChange={v => updateRisk(i, 'suggestion', v)} rows={2} className="flex-1 text-xs text-slate-600" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="w-[360px] shrink-0 border-l border-slate-200 flex flex-col">
        <ChatPanel
          key={analysisKey}
          systemPrompt={SYSTEM_PROMPT}
          contextSummary={result ? `合同审查完成，综合评分 ${result.score}。\n摘要：${result.summary}\n\n合同原文：\n${input}\n\n风险详情：\n${result.risks.map(r => `- [${LEVEL_LABEL[r.level]}] ${r.clause}：${r.description}。建议：${r.suggestion}`).join('\n')}` : ''}
          onUpdate={handleUpdate}
          onUndo={handleUndo}
          canUndo={history.length > 0}
          hasResult={!!result}
        />
      </div>
    </div>
  );
};

export default ContractReviewView;
