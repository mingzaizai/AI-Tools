
import React from 'react';
import { Shield, Key, Cpu, Info, Github, ExternalLink, HardDrive } from 'lucide-react';

const SettingsView: React.FC = () => {
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
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-800 mb-6">存储管理</h2>
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-4 mb-4">
              <HardDrive className="w-6 h-6 text-slate-500" />
              <div>
                <p className="text-sm font-bold text-slate-800">本地缓存</p>
                <p className="text-xs text-slate-500">管理浏览器为 AI 智能工具 预留的临时空间</p>
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
                <span className="flex items-center gap-2"><Info className="w-4 h-4" /> AI 智能工具 v1.2.0</span>
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
