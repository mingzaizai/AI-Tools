
import React, { useState } from 'react';
import { Shield, Key, Cpu, Info, HardDrive, CheckCircle2, BrainCircuit, Loader2, AlertCircle, Sparkles, ChevronDown, Eye, EyeOff } from 'lucide-react';

type AIModel = 'deepseek' | 'qwen';

const SettingsView: React.FC = () => {
  const [token, setToken] = useState(localStorage.getItem('github_token') ?? '');
  const [saved, setSaved] = useState(false);
  const [dsKey, setDsKey] = useState(localStorage.getItem('deepseek_api_key') ?? '');
  const [dsSaved, setDsSaved] = useState(false);
  const [dsTesting, setDsTesting] = useState(false);
  const [dsTestResult, setDsTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [dsShowKey, setDsShowKey] = useState(false);
  
  // Qwen 相关状态
  const [qwKey, setQwKey] = useState(localStorage.getItem('qwen_api_key') ?? '');
  const [qwSaved, setQwSaved] = useState(false);
  const [qwTesting, setQwTesting] = useState(false);
  const [qwTestResult, setQwTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [qwShowKey, setQwShowKey] = useState(false);
  
  // 通义万相相关状态
  const [wxKey, setWxKey] = useState(localStorage.getItem('wanxiang_api_key') ?? '');
  const [wxSaved, setWxSaved] = useState(false);
  const [wxTesting, setWxTesting] = useState(false);
  const [wxTestResult, setWxTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [wxShowKey, setWxShowKey] = useState(false);
  const [useQwKey, setUseQwKey] = useState(localStorage.getItem('wanxiang_use_qw_key') === 'true');
  
  // 默认模型选择
  const [selectedModel, setSelectedModel] = useState<AIModel>(localStorage.getItem('default_ai_model') as AIModel ?? 'deepseek');
  const [modelSaved, setModelSaved] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);

  const modelOptions: { value: AIModel; label: string; color: string }[] = [
    { value: 'deepseek', label: 'DeepSeek', color: 'indigo' },
    { value: 'qwen', label: 'Qwen (通义千问)', color: 'orange' },
  ];

  const handleSaveToken = () => {
    if (token.trim()) {
      localStorage.setItem('github_token', token.trim());
    } else {
      localStorage.removeItem('github_token');
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSaveModel = () => {
    localStorage.setItem('default_ai_model', selectedModel);
    setModelSaved(true);
    setShowModelDropdown(false);
    setTimeout(() => setModelSaved(false), 2000);
  };

  const handleSaveDsKey = () => {
    if (dsKey.trim()) {
      localStorage.setItem('deepseek_api_key', dsKey.trim());
    } else {
      localStorage.removeItem('deepseek_api_key');
    }
    setDsSaved(true);
    setDsTestResult(null);
    setTimeout(() => setDsSaved(false), 2000);
  };

  const handleTestDs = async () => {
    const key = dsKey.trim().replace(/[^\x20-\x7E]/g, '');
    if (!key) { setDsTestResult({ ok: false, msg: '请先填写 API Key' }); return; }
    setDsTesting(true);
    setDsTestResult(null);
    try {
      const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({ model: 'deepseek-chat', messages: [{ role: 'user', content: 'hi' }], max_tokens: 1 }),
      });
      if (res.ok) {
        setDsTestResult({ ok: true, msg: '连接成功' });
      } else if (res.status === 401) {
        setDsTestResult({ ok: false, msg: 'API Key 无效（401）' });
      } else {
        setDsTestResult({ ok: false, msg: `请求失败（${res.status}）` });
      }
    } catch {
      setDsTestResult({ ok: false, msg: '网络错误，请检查连接' });
    } finally {
      setDsTesting(false);
    }
  };

  // Qwen 保存和测试
  const handleSaveQwKey = () => {
    if (qwKey.trim()) {
      localStorage.setItem('qwen_api_key', qwKey.trim());
    } else {
      localStorage.removeItem('qwen_api_key');
    }
    setQwSaved(true);
    setQwTestResult(null);
    setTimeout(() => setQwSaved(false), 2000);
  };

  const handleTestQw = async () => {
    const key = qwKey.trim().replace(/[^\x20-\x7E]/g, '');
    if (!key) { setQwTestResult({ ok: false, msg: '请先填写 API Key' }); return; }
    setQwTesting(true);
    setQwTestResult(null);
    try {
      const res = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({ model: 'qwen-turbo', messages: [{ role: 'user', content: 'hi' }], max_tokens: 1 }),
      });
      if (res.ok) {
        setQwTestResult({ ok: true, msg: '连接成功' });
      } else if (res.status === 401) {
        setQwTestResult({ ok: false, msg: 'API Key 无效（401）' });
      } else {
        const text = await res.text();
        setQwTestResult({ ok: false, msg: `请求失败（${res.status}）: ${text.substring(0, 200)}` });
      }
    } catch (err: any) {
      setQwTestResult({ ok: false, msg: `网络错误: ${err.message || err.toString()}` });
    } finally {
      setQwTesting(false);
    }
  };

  // 通义万相保存和测试
  const handleSaveWxKey = () => {
    localStorage.setItem('wanxiang_use_qw_key', useQwKey.toString());
    if (!useQwKey) {
      if (wxKey.trim()) {
        localStorage.setItem('wanxiang_api_key', wxKey.trim());
      } else {
        localStorage.removeItem('wanxiang_api_key');
      }
    } else {
      localStorage.removeItem('wanxiang_api_key');
    }
    setWxSaved(true);
    setWxTestResult(null);
    setTimeout(() => setWxSaved(false), 2000);
  };

  const handleTestWx = async () => {
    const key = (useQwKey ? qwKey.trim() : wxKey.trim()).replace(/[^\x20-\x7E]/g, '');
    if (!key) { 
      setWxTestResult({ ok: false, msg: '请先填写 API Key' }); 
      return; 
    }
    setWxTesting(true);
    setWxTestResult(null);
    try {
      const res = await fetch('/api/wanxiang/text2image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`
        },
        body: JSON.stringify({
          model: 'qwen-image-2.0-pro',
          input: {
            messages: [{ role: 'user', content: [{ text: '测试' }] }]
          },
          parameters: { n: 1, watermark: false }
        }),
      });
      if (res.ok) {
        setWxTestResult({ ok: true, msg: '连接成功' });
      } else if (res.status === 401) {
        setWxTestResult({ ok: false, msg: 'API Key 无效（401）' });
      } else {
        const text = await res.text();
        setWxTestResult({ ok: false, msg: `请求失败（${res.status}）: ${text.substring(0, 200)}` });
      }
    } catch (err: any) {
      setWxTestResult({ ok: false, msg: `网络错误: ${err.message || err.toString()}` });
    } finally {
      setWxTesting(false);
    }
  };

  const dsPreview = dsKey.length > 8 ? dsKey.slice(0, 8) + '****' : dsKey ? '****' : '';
  const qwPreview = qwKey.length > 8 ? qwKey.slice(0, 8) + '****' : qwKey ? '****' : '';

  return (
    <div className="h-full overflow-y-auto bg-[#f8fafc] p-8 md:p-12">
      <div className="max-w-3xl mx-auto space-y-10">
        <section>
          <h2 className="text-2xl font-bold text-slate-800 mb-6">系统设置</h2>
          <div className="grid gap-4">
            <SettingsCard 
              icon={<Shield className="text-green-600" />}
              title="隐私模式"
              description="当前处于 100% 本地处理模式。您的图片不会被上传至任何第三方服务器进行存储。"
            />
            <SettingsCard
              icon={<Cpu className="text-purple-600" />}
              title="硬件加速"
              description="已启用 WebGL 和 Canvas 硬件加速，以获得流畅的编辑体验。"
            />
            {/* 默认 AI 模型选择 */}
            <div className="flex items-start gap-4 p-5 bg-white rounded-2xl border border-slate-200">
              <div className="p-2 bg-slate-100 rounded-xl shrink-0">
                <Cpu className="text-blue-600 w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-800 mb-1">默认 AI 模型</h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-3">
                  选择"AI 文本审查"模块使用的默认模型。
                </p>
                <div className="flex gap-2 flex-wrap items-center">
                  <div className="relative">
                    <button
                      onClick={() => setShowModelDropdown(!showModelDropdown)}
                      className="px-3 py-1.5 text-xs border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 min-w-[140px] justify-between"
                    >
                      {modelOptions.find(m => m.value === selectedModel)?.label}
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showModelDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    {showModelDropdown && (
                      <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 min-w-[140px]">
                        {modelOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setSelectedModel(option.value);
                              localStorage.setItem('default_ai_model', option.value);
                              setShowModelDropdown(false);
                              setModelSaved(true);
                              setTimeout(() => setModelSaved(false), 2000);
                            }}
                            className={`w-full px-3 py-2 text-left text-xs hover:bg-slate-50 flex items-center gap-2 ${
                              selectedModel === option.value ? 'bg-slate-50 font-bold' : ''
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${option.color === 'indigo' ? 'bg-indigo-500' : 'bg-orange-500'}`} />
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {modelSaved && (
                    <span className="flex items-center gap-1 text-xs text-green-600">
                      <CheckCircle2 className="w-3.5 h-3.5" />已保存
                    </span>
                  )}
                </div>
              </div>
            </div>
            {/* DeepSeek API Key 配置 */}
            <div className="flex items-start gap-4 p-5 bg-white rounded-2xl border border-slate-200">
              <div className="p-2 bg-slate-100 rounded-xl shrink-0">
                <BrainCircuit className="text-indigo-600 w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-800 mb-1">DeepSeek API Key</h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-3">
                  用于"AI 文本审查"模块。在{' '}
                  <a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">
                    DeepSeek 开放平台
                  </a>{' '}
                  创建 API Key。
                  {dsPreview && <span className="ml-2 text-slate-400">当前：{dsPreview}</span>}
                </p>
                <div className="flex gap-2 flex-wrap">
                  <div className="relative flex-1 min-w-0">
                    <input
                      type={dsShowKey ? 'text' : 'password'}
                      value={dsKey}
                      onChange={e => { setDsKey(e.target.value); setDsTestResult(null); }}
                      placeholder="sk-xxxxxxxxxxxx"
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 pr-8"
                    />
                    <button
                      onClick={() => setDsShowKey(!dsShowKey)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {dsShowKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button
                    onClick={handleTestDs}
                    disabled={dsTesting}
                    className="px-3 py-1.5 text-xs border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {dsTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    测试连接
                  </button>
                  <button
                    onClick={handleSaveDsKey}
                    className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1.5"
                  >
                    {dsSaved ? <><CheckCircle2 className="w-3.5 h-3.5" />已保存</> : '保存'}
                  </button>
                </div>
                {dsTestResult && (
                  <div className={`mt-2 flex items-center gap-1.5 text-xs ${dsTestResult.ok ? 'text-green-600' : 'text-red-500'}`}>
                    {dsTestResult.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    {dsTestResult.msg}
                  </div>
                )}
              </div>
            </div>
            {/* Qwen API Key 配置 */}
            <div className="flex items-start gap-4 p-5 bg-white rounded-2xl border border-slate-200">
              <div className="p-2 bg-slate-100 rounded-xl shrink-0">
                <Sparkles className="text-orange-500 w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-800 mb-1">Qwen (通义千问) API Key</h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-3">
                  用于"AI 文本审查"模块。在{' '}
                  <a href="https://dashscope.aliyun.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">
                    阿里云 DashScope
                  </a>{' '}
                  创建 API Key。
                  {qwPreview && <span className="ml-2 text-slate-400">当前：{qwPreview}</span>}
                </p>
                <div className="flex gap-2 flex-wrap">
                  <div className="relative flex-1 min-w-0">
                    <input
                      type={qwShowKey ? 'text' : 'password'}
                      value={qwKey}
                      onChange={e => { setQwKey(e.target.value); setQwTestResult(null); }}
                      placeholder="sk-xxxxxxxxxxxx"
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 pr-8"
                    />
                    <button
                      onClick={() => setQwShowKey(!qwShowKey)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {qwShowKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button
                    onClick={handleTestQw}
                    disabled={qwTesting}
                    className="px-3 py-1.5 text-xs border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {qwTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    测试连接
                  </button>
                  <button
                    onClick={handleSaveQwKey}
                    className="px-3 py-1.5 text-xs bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-1.5"
                  >
                    {qwSaved ? <><CheckCircle2 className="w-3.5 h-3.5" />已保存</> : '保存'}
                  </button>
                </div>
                {qwTestResult && (
                  <div className={`mt-2 flex items-center gap-1.5 text-xs ${qwTestResult.ok ? 'text-green-600' : 'text-red-500'}`}>
                    {qwTestResult.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    {qwTestResult.msg}
                  </div>
                )}
              </div>
            </div>
            {/* 通义万相 API Key 配置 */}
            <div className="flex items-start gap-4 p-5 bg-white rounded-2xl border border-slate-200">
              <div className="p-2 bg-slate-100 rounded-xl shrink-0">
                <Sparkles className="text-purple-500 w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-800 mb-1">通义万相 API Key</h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-3">
                  用于"图片编辑"模块的AI换装/生成功能。在{' '}
                  <a href="https://dashscope.aliyun.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">
                    阿里云 DashScope
                  </a>{' '}
                  创建 API Key。
                </p>
                {/* 使用Qwen Key开关 */}
                <div className="flex items-center gap-2 mb-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useQwKey}
                      onChange={(e) => setUseQwKey(e.target.checked)}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <span className="text-xs text-slate-600">使用 Qwen 的 API Key</span>
                  </label>
                </div>
                {!useQwKey && (
                  <div className="flex gap-2 flex-wrap">
                    <div className="relative flex-1 min-w-0">
                      <input
                        type={wxShowKey ? 'text' : 'password'}
                        value={wxKey}
                        onChange={e => { setWxKey(e.target.value); setWxTestResult(null); }}
                        placeholder="sk-xxxxxxxxxxxx"
                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 pr-8"
                      />
                      <button
                        onClick={() => setWxShowKey(!wxShowKey)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {wxShowKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <button
                      onClick={handleTestWx}
                      disabled={wxTesting}
                      className="px-3 py-1.5 text-xs border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {wxTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      测试连接
                    </button>
                    <button
                      onClick={handleSaveWxKey}
                      className="px-3 py-1.5 text-xs bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-1.5"
                    >
                      {wxSaved ? <><CheckCircle2 className="w-3.5 h-3.5" />已保存</> : '保存'}
                    </button>
                  </div>
                )}
                {useQwKey && (
                  <div className="flex gap-2 flex-wrap items-center">
                    <span className="text-xs text-slate-400">将使用 Qwen 的 API Key</span>
                    <button
                      onClick={handleTestWx}
                      disabled={wxTesting}
                      className="px-3 py-1.5 text-xs border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {wxTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      测试连接
                    </button>
                    <button
                      onClick={handleSaveWxKey}
                      className="px-3 py-1.5 text-xs bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-1.5"
                    >
                      {wxSaved ? <><CheckCircle2 className="w-3.5 h-3.5" />已保存</> : '保存'}
                    </button>
                  </div>
                )}
                {wxTestResult && (
                  <div className={`mt-2 flex items-center gap-1.5 text-xs ${wxTestResult.ok ? 'text-green-600' : 'text-red-500'}`}>
                    {wxTestResult.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    {wxTestResult.msg}
                  </div>
                )}
              </div>
            </div>
            {/* GitHub Token 配置 */}
            <div className="flex items-start gap-4 p-5 bg-white rounded-2xl border border-slate-200">
              <div className="p-2 bg-slate-100 rounded-xl shrink-0">
                <Key className="text-indigo-600 w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-800 mb-1">GitHub Token</h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-3">
                  配置后每小时可请求 5000 次（未配置仅 60 次）。在{' '}
                  <a
                    href="https://github.com/settings/tokens"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 underline"
                  >
                    GitHub → Settings → Developer Settings
                  </a>{' '}
                  生成 Personal Access Token（无需勾选任何权限）。
                </p>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={token}
                    onChange={e => setToken(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxx"
                    className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  <button
                    onClick={handleSaveToken}
                    className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1.5"
                  >
                    {saved ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        已保存
                      </>
                    ) : (
                      '保存'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-800 mb-6">存储管理</h2>
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-4 mb-4">
              <HardDrive className="w-6 h-6 text-slate-500" />
              <div>
                <p className="text-sm font-bold text-slate-800">本地缓存</p>
                <p className="text-xs text-slate-500">管理浏览器为 AI 文本审查 预留的临时空间</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-700 rounded-lg text-xs font-bold transition-all border border-slate-300">
              清空所有本地数据
            </button>
          </div>
        </section>

        <section className="pt-10 border-t border-slate-200">
          <div className="flex flex-col md:flex-row gap-8 justify-between text-slate-500">
            <div className="space-y-2">
              <p className="text-sm font-bold text-slate-600 flex items-center gap-2">
                <span className="flex items-center gap-2"><Info className="w-4 h-4" /> AI 文本审查 v1.0.1</span>
              </p>
              <p className="text-sm font-bold text-slate-600 flex items-center gap-2">
                <span className="flex items-center gap-2"><Info className="w-4 h-4" /> <a href="https://beian.miit.gov.cn" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 transition-colors">皖ICP备2026009011号-1</a></span>
              </p>
            </div>
            <div className="flex gap-6">
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

const SettingsCard: React.FC<{ icon: React.ReactNode, title: string, description: string }> = ({ icon, title, description }) => (
  <div className="flex items-start gap-4 p-5 bg-white rounded-2xl border border-slate-200 hover:bg-slate-50 transition-colors">
    <div className="p-2 bg-slate-100 rounded-xl shrink-0">
      {icon}
    </div>
    <div>
      <h3 className="text-sm font-bold text-slate-800 mb-1">{title}</h3>
      <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
    </div>
  </div>
);

export default SettingsView;
