import React, { useState } from 'react';
import { Code, Link, FileCode, Copy, CheckCircle2, Trash2 } from 'lucide-react';

const EncodingToolsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'base64' | 'url' | 'html'>(() => {
    return (localStorage.getItem('encodingTools_activeTab') as 'base64' | 'url' | 'html') || 'base64';
  });

  const [copyFeedback, setCopyFeedback] = useState(false);

  // Base64 相关状态
  const [base64Input, setBase64Input] = useState('');
  const [base64Output, setBase64Output] = useState('');
  const [base64Mode, setBase64Mode] = useState<'encode' | 'decode'>('encode');
  const [base64Error, setBase64Error] = useState('');

  // URL 相关状态
  const [urlInput, setUrlInput] = useState('');
  const [urlOutput, setUrlOutput] = useState('');
  const [urlMode, setUrlMode] = useState<'encode' | 'decode'>('encode');
  const [urlError, setUrlError] = useState('');

  // HTML 相关状态
  const [htmlInput, setHtmlInput] = useState('');
  const [htmlOutput, setHtmlOutput] = useState('');
  const [htmlMode, setHtmlMode] = useState<'encode' | 'decode'>('encode');
  const [htmlError, setHtmlError] = useState('');

  // Base64 编码
  const handleBase64Convert = () => {
    try {
      setBase64Error('');
      if (base64Mode === 'encode') {
        const encoded = btoa(unescape(encodeURIComponent(base64Input)));
        setBase64Output(encoded);
      } else {
        const decoded = decodeURIComponent(escape(atob(base64Input)));
        setBase64Output(decoded);
      }
    } catch (error) {
      setBase64Error('转换失败，请检查输入格式');
      setBase64Output('');
    }
  };

  // URL 编码
  const handleUrlConvert = () => {
    try {
      setUrlError('');
      if (urlMode === 'encode') {
        setUrlOutput(encodeURIComponent(urlInput));
      } else {
        setUrlOutput(decodeURIComponent(urlInput));
      }
    } catch (error) {
      setUrlError('转换失败，请检查输入格式');
      setUrlOutput('');
    }
  };

  // HTML 实体编码
  const handleHtmlConvert = () => {
    try {
      setHtmlError('');
      if (htmlMode === 'encode') {
        const encoded = htmlInput
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
        setHtmlOutput(encoded);
      } else {
        const decoded = htmlInput
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'");
        setHtmlOutput(decoded);
      }
    } catch (error) {
      setHtmlError('转换失败，请检查输入格式');
      setHtmlOutput('');
    }
  };

  // 复制功能
  const handleCopy = (text: string) => {
    if (text) {
      navigator.clipboard.writeText(text);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    }
  };

  // 清空功能
  const handleClear = (type: 'base64' | 'url' | 'html') => {
    if (type === 'base64') {
      setBase64Input('');
      setBase64Output('');
      setBase64Error('');
    } else if (type === 'url') {
      setUrlInput('');
      setUrlOutput('');
      setUrlError('');
    } else {
      setHtmlInput('');
      setHtmlOutput('');
      setHtmlError('');
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#f8fafc]">
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-slate-800">编码工具</h3>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button 
              onClick={() => {
                setActiveTab('base64');
                localStorage.setItem('encodingTools_activeTab', 'base64');
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'base64' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Code className="w-4 h-4 inline mr-2" /> Base64
            </button>
            <button 
              onClick={() => {
                setActiveTab('url');
                localStorage.setItem('encodingTools_activeTab', 'url');
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'url' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Link className="w-4 h-4 inline mr-2" /> URL
            </button>
            <button 
              onClick={() => {
                setActiveTab('html');
                localStorage.setItem('encodingTools_activeTab', 'html');
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'html' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <FileCode className="w-4 h-4 inline mr-2" /> HTML
            </button>
          </div>
        </div>
      </div>

      {/* Base64 编码 */}
      {activeTab === 'base64' && (
        <>
          <div className="flex-1 overflow-hidden flex p-6 gap-6">
            <div className="flex-1 flex flex-col">
              <label className="text-sm font-medium text-slate-700 mb-2">输入</label>
              <textarea
                value={base64Input}
                onChange={(e) => setBase64Input(e.target.value)}
                className="flex-1 p-4 rounded-lg font-mono text-sm bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="在此输入文本..."
              />
              <div className="mt-4 flex gap-2 items-center">
                <select
                  value={base64Mode}
                  onChange={(e) => setBase64Mode(e.target.value as 'encode' | 'decode')}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="encode">编码</option>
                  <option value="decode">解码</option>
                </select>
                <button 
                  onClick={handleBase64Convert}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold transition-all"
                >
                  转换
                </button>
                <button 
                  onClick={() => handleClear('base64')}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-sm font-bold transition-all border border-slate-200"
                >
                  清空
                </button>
              </div>
            </div>
            <div className="flex-1 flex flex-col">
              <label className="text-sm font-medium text-slate-700 mb-2">输出</label>
              <textarea
                value={base64Output}
                readOnly
                className="flex-1 p-4 rounded-lg font-mono text-sm bg-slate-50 border border-slate-200 focus:outline-none"
                placeholder="转换结果将显示在这里..."
              />
              <div className="mt-4 flex justify-end">
                <button 
                  onClick={() => handleCopy(base64Output)}
                  disabled={!base64Output}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    base64Output ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {copyFeedback ? <CheckCircle2 className="w-4 h-4 inline mr-2" /> : <Copy className="w-4 h-4 inline mr-2" />} 复制结果
                </button>
              </div>
            </div>
          </div>

          {base64Error && (
            <div className="p-4 border-t border-slate-200 bg-red-50">
              <p className="text-sm text-red-600 font-medium">错误：{base64Error}</p>
            </div>
          )}
        </>
      )}

      {/* URL 编码 */}
      {activeTab === 'url' && (
        <>
          <div className="flex-1 overflow-hidden flex p-6 gap-6">
            <div className="flex-1 flex flex-col">
              <label className="text-sm font-medium text-slate-700 mb-2">输入</label>
              <textarea
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="flex-1 p-4 rounded-lg font-mono text-sm bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="在此输入 URL 或文本..."
              />
              <div className="mt-4 flex gap-2 items-center">
                <select
                  value={urlMode}
                  onChange={(e) => setUrlMode(e.target.value as 'encode' | 'decode')}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="encode">编码</option>
                  <option value="decode">解码</option>
                </select>
                <button 
                  onClick={handleUrlConvert}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold transition-all"
                >
                  转换
                </button>
                <button 
                  onClick={() => handleClear('url')}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-sm font-bold transition-all border border-slate-200"
                >
                  清空
                </button>
              </div>
            </div>
            <div className="flex-1 flex flex-col">
              <label className="text-sm font-medium text-slate-700 mb-2">输出</label>
              <textarea
                value={urlOutput}
                readOnly
                className="flex-1 p-4 rounded-lg font-mono text-sm bg-slate-50 border border-slate-200 focus:outline-none"
                placeholder="转换结果将显示在这里..."
              />
              <div className="mt-4 flex justify-end">
                <button 
                  onClick={() => handleCopy(urlOutput)}
                  disabled={!urlOutput}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    urlOutput ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {copyFeedback ? <CheckCircle2 className="w-4 h-4 inline mr-2" /> : <Copy className="w-4 h-4 inline mr-2" />} 复制结果
                </button>
              </div>
            </div>
          </div>

          {urlError && (
            <div className="p-4 border-t border-slate-200 bg-red-50">
              <p className="text-sm text-red-600 font-medium">错误：{urlError}</p>
            </div>
          )}
        </>
      )}

      {/* HTML 编码 */}
      {activeTab === 'html' && (
        <>
          <div className="flex-1 overflow-hidden flex p-6 gap-6">
            <div className="flex-1 flex flex-col">
              <label className="text-sm font-medium text-slate-700 mb-2">输入</label>
              <textarea
                value={htmlInput}
                onChange={(e) => setHtmlInput(e.target.value)}
                className="flex-1 p-4 rounded-lg font-mono text-sm bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="在此输入 HTML 或文本..."
              />
              <div className="mt-4 flex gap-2 items-center">
                <select
                  value={htmlMode}
                  onChange={(e) => setHtmlMode(e.target.value as 'encode' | 'decode')}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="encode">编码</option>
                  <option value="decode">解码</option>
                </select>
                <button 
                  onClick={handleHtmlConvert}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold transition-all"
                >
                  转换
                </button>
                <button 
                  onClick={() => handleClear('html')}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-sm font-bold transition-all border border-slate-200"
                >
                  清空
                </button>
              </div>
            </div>
            <div className="flex-1 flex flex-col">
              <label className="text-sm font-medium text-slate-700 mb-2">输出</label>
              <textarea
                value={htmlOutput}
                readOnly
                className="flex-1 p-4 rounded-lg font-mono text-sm bg-slate-50 border border-slate-200 focus:outline-none"
                placeholder="转换结果将显示在这里..."
              />
              <div className="mt-4 flex justify-end">
                <button 
                  onClick={() => handleCopy(htmlOutput)}
                  disabled={!htmlOutput}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    htmlOutput ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {copyFeedback ? <CheckCircle2 className="w-4 h-4 inline mr-2" /> : <Copy className="w-4 h-4 inline mr-2" />} 复制结果
                </button>
              </div>
            </div>
          </div>

          {htmlError && (
            <div className="p-4 border-t border-slate-200 bg-red-50">
              <p className="text-sm text-red-600 font-medium">错误：{htmlError}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EncodingToolsView;
