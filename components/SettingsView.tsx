
import React, { useState } from 'react';
import { Shield, Key, Cpu, Info, HardDrive, CheckCircle2, BrainCircuit, Loader2, AlertCircle } from 'lucide-react';

const SettingsView: React.FC = () => {
  const [token, setToken] = useState(localStorage.getItem('github_token') ?? '');
  const [saved, setSaved] = useState(false);
  const [dsKey, setDsKey] = useState(localStorage.getItem('deepseek_api_key') ?? '');
  const [dsSaved, setDsSaved] = useState(false);
  const [dsTesting, setDsTesting] = useState(false);
  const [dsTestResult, setDsTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const handleSaveToken = () => {
    if (token.trim()) {
      localStorage.setItem('github_token', token.trim());
    } else {
      localStorage.removeItem('github_token');
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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
    const key = dsKey.trim();
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

  const dsPreview = dsKey.length > 8 ? dsKey.slice(0, 8) + '****' : dsKey ? '****' : '';

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
                  <input
                    type="password"
                    value={dsKey}
                    onChange={e => { setDsKey(e.target.value); setDsTestResult(null); }}
                    placeholder="sk-xxxxxxxxxxxx"
                    className="flex-1 min-w-0 px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
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
