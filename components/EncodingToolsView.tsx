import React, { useState, useEffect } from 'react';
import { Code, Link, FileCode, Copy, CheckCircle2, Trash2, Hash } from 'lucide-react';

const EncodingToolsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'encode' | 'radix'>(() => {
    return (localStorage.getItem('encodingTools_activeTab') as 'encode' | 'radix') || 'encode';
  });

  const [encodeType, setEncodeType] = useState<'base64' | 'url' | 'html'>(() => {
    return (localStorage.getItem('encodingTools_encodeType') as 'base64' | 'url' | 'html') || 'base64';
  });

  const [copyFeedback, setCopyFeedback] = useState(false);

  // Base64 相关状态
  const [base64Input, setBase64Input] = useState(() => {
    return localStorage.getItem('encodingTools_base64Input') || '';
  });
  const [base64Output, setBase64Output] = useState('');
  const [base64Mode, setBase64Mode] = useState<'encode' | 'decode'>(() => {
    return (localStorage.getItem('encodingTools_base64Mode') as 'encode' | 'decode') || 'encode';
  });
  const [base64Error, setBase64Error] = useState('');

  // URL 相关状态
  const [urlInput, setUrlInput] = useState(() => {
    return localStorage.getItem('encodingTools_urlInput') || '';
  });
  const [urlOutput, setUrlOutput] = useState('');
  const [urlMode, setUrlMode] = useState<'encode' | 'decode'>(() => {
    return (localStorage.getItem('encodingTools_urlMode') as 'encode' | 'decode') || 'encode';
  });
  const [urlError, setUrlError] = useState('');

  // HTML 相关状态
  const [htmlInput, setHtmlInput] = useState(() => {
    return localStorage.getItem('encodingTools_htmlInput') || '';
  });
  const [htmlOutput, setHtmlOutput] = useState('');
  const [htmlMode, setHtmlMode] = useState<'encode' | 'decode'>(() => {
    return (localStorage.getItem('encodingTools_htmlMode') as 'encode' | 'decode') || 'encode';
  });
  const [htmlError, setHtmlError] = useState('');

  // 进制转换相关状态
  const [radixInput, setRadixInput] = useState(() => {
    return localStorage.getItem('encodingTools_radixInput') || '';
  });
  const [radixInputBase, setRadixInputBase] = useState<2 | 8 | 10 | 16>(() => {
    const saved = localStorage.getItem('encodingTools_radixInputBase');
    return (saved ? parseInt(saved) as 2 | 8 | 10 | 16 : 10) || 10;
  });
  const [radixBinary, setRadixBinary] = useState('');
  const [radixOctal, setRadixOctal] = useState('');
  const [radixDecimal, setRadixDecimal] = useState('');
  const [radixHex, setRadixHex] = useState('');
  const [radixError, setRadixError] = useState('');

  // 保存到 localStorage
  useEffect(() => {
    localStorage.setItem('encodingTools_base64Input', base64Input);
  }, [base64Input]);

  useEffect(() => {
    localStorage.setItem('encodingTools_base64Mode', base64Mode);
  }, [base64Mode]);

  useEffect(() => {
    localStorage.setItem('encodingTools_urlInput', urlInput);
  }, [urlInput]);

  useEffect(() => {
    localStorage.setItem('encodingTools_urlMode', urlMode);
  }, [urlMode]);

  useEffect(() => {
    localStorage.setItem('encodingTools_htmlInput', htmlInput);
  }, [htmlInput]);

  useEffect(() => {
    localStorage.setItem('encodingTools_htmlMode', htmlMode);
  }, [htmlMode]);

  useEffect(() => {
    localStorage.setItem('encodingTools_radixInput', radixInput);
  }, [radixInput]);

  useEffect(() => {
    localStorage.setItem('encodingTools_radixInputBase', radixInputBase.toString());
  }, [radixInputBase]);

  useEffect(() => {
    localStorage.setItem('encodingTools_encodeType', encodeType);
  }, [encodeType]);

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

  // 进制转换
  const handleRadixConvert = () => {
    try {
      setRadixError('');
      
      if (!radixInput.trim()) {
        setRadixBinary('');
        setRadixOctal('');
        setRadixDecimal('');
        setRadixHex('');
        return;
      }

      const num = parseInt(radixInput, radixInputBase);
      
      if (isNaN(num)) {
        setRadixError('输入格式错误，请检查输入是否为有效的数字');
        setRadixBinary('');
        setRadixOctal('');
        setRadixDecimal('');
        setRadixHex('');
        return;
      }

      setRadixBinary(num.toString(2));
      setRadixOctal(num.toString(8));
      setRadixDecimal(num.toString(10));
      setRadixHex(num.toString(16).toUpperCase());
    } catch (error) {
      setRadixError('转换失败，请检查输入格式');
      setRadixBinary('');
      setRadixOctal('');
      setRadixDecimal('');
      setRadixHex('');
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
  const handleClear = (type: 'encode' | 'radix') => {
    if (type === 'encode') {
      setBase64Input('');
      setBase64Output('');
      setBase64Error('');
      setUrlInput('');
      setUrlOutput('');
      setUrlError('');
      setHtmlInput('');
      setHtmlOutput('');
      setHtmlError('');
    } else {
      setRadixInput('');
      setRadixBinary('');
      setRadixOctal('');
      setRadixDecimal('');
      setRadixHex('');
      setRadixError('');
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#f8fafc]">
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-slate-800">编解码工具</h3>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button 
              onClick={() => {
                setActiveTab('encode');
                localStorage.setItem('encodingTools_activeTab', 'encode');
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'encode' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Code className="w-4 h-4 inline mr-2" /> 编解码
            </button>
            <button 
              onClick={() => {
                setActiveTab('radix');
                localStorage.setItem('encodingTools_activeTab', 'radix');
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'radix' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Hash className="w-4 h-4 inline mr-2" /> 进制转换
            </button>
          </div>
        </div>
      </div>

      {/* 编解码 */}
      {activeTab === 'encode' && (
        <>
          <div className="flex-1 overflow-hidden flex p-6 gap-6">
            <div className="flex-1 flex flex-col">
              <label className="text-sm font-medium text-slate-700 mb-2">输入</label>
              <textarea
                value={encodeType === 'base64' ? base64Input : encodeType === 'url' ? urlInput : htmlInput}
                onChange={(e) => {
                  if (encodeType === 'base64') setBase64Input(e.target.value);
                  else if (encodeType === 'url') setUrlInput(e.target.value);
                  else setHtmlInput(e.target.value);
                }}
                className="flex-1 p-4 rounded-lg font-mono text-sm bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder={encodeType === 'base64' ? '在此输入文本...' : encodeType === 'url' ? '在此输入 URL 或文本...' : '在此输入 HTML 或文本...'}
              />
              <div className="mt-4 flex gap-2 items-center">
                <select
                  value={encodeType}
                  onChange={(e) => setEncodeType(e.target.value as 'base64' | 'url' | 'html')}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="base64">Base64</option>
                  <option value="url">URL</option>
                  <option value="html">HTML</option>
                </select>
                <select
                  value={encodeType === 'base64' ? base64Mode : encodeType === 'url' ? urlMode : htmlMode}
                  onChange={(e) => {
                    const mode = e.target.value as 'encode' | 'decode';
                    if (encodeType === 'base64') setBase64Mode(mode);
                    else if (encodeType === 'url') setUrlMode(mode);
                    else setHtmlMode(mode);
                  }}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="encode">编码</option>
                  <option value="decode">解码</option>
                </select>
                <button 
                  onClick={() => {
                    if (encodeType === 'base64') handleBase64Convert();
                    else if (encodeType === 'url') handleUrlConvert();
                    else handleHtmlConvert();
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold transition-all"
                >
                  转换
                </button>
                <button 
                  onClick={() => handleClear('encode')}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-sm font-bold transition-all border border-slate-200"
                >
                  清空
                </button>
              </div>
            </div>
            <div className="flex-1 flex flex-col">
              <label className="text-sm font-medium text-slate-700 mb-2">输出</label>
              <textarea
                value={encodeType === 'base64' ? base64Output : encodeType === 'url' ? urlOutput : htmlOutput}
                readOnly
                className="flex-1 p-4 rounded-lg font-mono text-sm bg-slate-50 border border-slate-200 focus:outline-none"
                placeholder="转换结果将显示在这里..."
              />
              <div className="mt-4 flex justify-end">
                <button 
                  onClick={() => handleCopy(encodeType === 'base64' ? base64Output : encodeType === 'url' ? urlOutput : htmlOutput)}
                  disabled={!((encodeType === 'base64' && base64Output) || (encodeType === 'url' && urlOutput) || (encodeType === 'html' && htmlOutput))}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    (encodeType === 'base64' && base64Output) || (encodeType === 'url' && urlOutput) || (encodeType === 'html' && htmlOutput) ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {copyFeedback ? <CheckCircle2 className="w-4 h-4 inline mr-2" /> : <Copy className="w-4 h-4 inline mr-2" />} 复制结果
                </button>
              </div>
            </div>
          </div>

          {(encodeType === 'base64' && base64Error) || (encodeType === 'url' && urlError) || (encodeType === 'html' && htmlError) && (
            <div className="p-4 border-t border-slate-200 bg-red-50">
              <p className="text-sm text-red-600 font-medium">错误：{encodeType === 'base64' ? base64Error : encodeType === 'url' ? urlError : htmlError}</p>
            </div>
          )}
        </>
      )}

      {/* 进制转换 */}
      {activeTab === 'radix' && (
        <>
          <div className="flex-1 overflow-hidden flex p-6 gap-6">
            <div className="flex-1 flex flex-col">
              <label className="text-sm font-medium text-slate-700 mb-2">输入</label>
              <textarea
                value={radixInput}
                onChange={(e) => setRadixInput(e.target.value)}
                className="flex-1 p-4 rounded-lg font-mono text-sm bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="在此输入数字..."
              />
              <div className="mt-4 flex gap-2 items-center">
                <select
                  value={radixInputBase}
                  onChange={(e) => setRadixInputBase(parseInt(e.target.value) as 2 | 8 | 10 | 16)}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={2}>二进制</option>
                  <option value={8}>八进制</option>
                  <option value={10}>十进制</option>
                  <option value={16}>十六进制</option>
                </select>
                <button 
                  onClick={handleRadixConvert}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold transition-all"
                >
                  转换
                </button>
                <button 
                  onClick={() => handleClear('radix')}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-sm font-bold transition-all border border-slate-200"
                >
                  清空
                </button>
              </div>
            </div>
            <div className="flex-1 flex flex-col gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium text-slate-700 mb-2">二进制 (2)</label>
                <textarea
                  value={radixBinary}
                  readOnly
                  className="w-full h-20 p-3 rounded-lg font-mono text-sm bg-slate-50 border border-slate-200 focus:outline-none"
                  placeholder="二进制结果"
                />
                <div className="mt-2 flex justify-end">
                  <button 
                    onClick={() => handleCopy(radixBinary)}
                    disabled={!radixBinary}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      radixBinary ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {copyFeedback ? <CheckCircle2 className="w-3 h-3 inline mr-1" /> : <Copy className="w-3 h-3 inline mr-1" />} 复制
                  </button>
                </div>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium text-slate-700 mb-2">八进制 (8)</label>
                <textarea
                  value={radixOctal}
                  readOnly
                  className="w-full h-20 p-3 rounded-lg font-mono text-sm bg-slate-50 border border-slate-200 focus:outline-none"
                  placeholder="八进制结果"
                />
                <div className="mt-2 flex justify-end">
                  <button 
                    onClick={() => handleCopy(radixOctal)}
                    disabled={!radixOctal}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      radixOctal ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {copyFeedback ? <CheckCircle2 className="w-3 h-3 inline mr-1" /> : <Copy className="w-3 h-3 inline mr-1" />} 复制
                  </button>
                </div>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium text-slate-700 mb-2">十进制 (10)</label>
                <textarea
                  value={radixDecimal}
                  readOnly
                  className="w-full h-20 p-3 rounded-lg font-mono text-sm bg-slate-50 border border-slate-200 focus:outline-none"
                  placeholder="十进制结果"
                />
                <div className="mt-2 flex justify-end">
                  <button 
                    onClick={() => handleCopy(radixDecimal)}
                    disabled={!radixDecimal}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      radixDecimal ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {copyFeedback ? <CheckCircle2 className="w-3 h-3 inline mr-1" /> : <Copy className="w-3 h-3 inline mr-1" />} 复制
                  </button>
                </div>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium text-slate-700 mb-2">十六进制 (16)</label>
                <textarea
                  value={radixHex}
                  readOnly
                  className="w-full h-20 p-3 rounded-lg font-mono text-sm bg-slate-50 border border-slate-200 focus:outline-none"
                  placeholder="十六进制结果"
                />
                <div className="mt-2 flex justify-end">
                  <button 
                    onClick={() => handleCopy(radixHex)}
                    disabled={!radixHex}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      radixHex ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {copyFeedback ? <CheckCircle2 className="w-3 h-3 inline mr-1" /> : <Copy className="w-3 h-3 inline mr-1" />} 复制
                  </button>
                </div>
              </div>
            </div>
          </div>

          {radixError && (
            <div className="p-4 border-t border-slate-200 bg-red-50">
              <p className="text-sm text-red-600 font-medium">错误：{radixError}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EncodingToolsView;
