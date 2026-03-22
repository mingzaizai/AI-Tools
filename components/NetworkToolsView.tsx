import React, { useState, useEffect } from 'react';
import { Send, Globe, QrCode, Copy, CheckCircle2, Trash2, Plus, Trash } from 'lucide-react';

const NetworkToolsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'http' | 'ip' | 'qrcode'>(() => {
    return (localStorage.getItem('networkTools_activeTab') as 'http' | 'ip' | 'qrcode') || 'http';
  });

  const [copyFeedback, setCopyFeedback] = useState(false);

  // HTTP 请求相关状态
  const [httpUrl, setHttpUrl] = useState('');
  const [httpMethod, setHttpMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE'>('GET');
  const [httpHeaders, setHttpHeaders] = useState<{ key: string; value: string }[]>([]);
  const [httpBody, setHttpBody] = useState('');
  const [httpResponse, setHttpResponse] = useState('');
  const [httpStatus, setHttpStatus] = useState<number | null>(null);
  const [httpLoading, setHttpLoading] = useState(false);

  // IP 查询相关状态
  const [ipAddress, setIpAddress] = useState('');
  const [ipInfo, setIpInfo] = useState<any>(null);
  const [ipLoading, setIpLoading] = useState(false);

  // 二维码生成相关状态
  const [qrText, setQrText] = useState('');
  const [qrSize, setQrSize] = useState(200);
  const [qrCode, setQrCode] = useState('');
  const [qrFrame, setQrFrame] = useState<string>('none');

  // 相框样式定义
  const frameStyles = [
    { id: 'none', name: '无边框', preview: '无' },
    { id: 'simple', name: '简约白框', preview: '白框' },
    { id: 'rounded', name: '圆角边框', preview: '圆角' },
    { id: 'gradient', name: '渐变边框', preview: '渐变' },
    { id: 'double', name: '双边框', preview: '双边' },
    { id: 'dashed', name: '虚线边框', preview: '虚线' },
    { id: 'polaroid', name: '拍立得', preview: '拍立得' },
  ];

  // 获取相框样式
  const getFrameStyle = (frameId: string) => {
    switch (frameId) {
      case 'simple':
        return {
          padding: '16px',
          background: 'white',
          border: '2px solid #e2e8f0',
          borderRadius: '8px',
        };
      case 'rounded':
        return {
          padding: '20px',
          background: 'white',
          border: '3px solid #6366f1',
          borderRadius: '20px',
        };
      case 'gradient':
        return {
          padding: '16px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '12px',
        };

      case 'double':
        return {
          padding: '20px',
          background: 'white',
          border: '4px double #1e293b',
          borderRadius: '8px',
        };
      case 'dashed':
        return {
          padding: '16px',
          background: 'white',
          border: '3px dashed #94a3b8',
          borderRadius: '8px',
        };
      case 'polaroid':
        return {
          padding: '16px 16px 50px 16px',
          background: 'white',
        };
      default:
        return {
          padding: '0',
          background: 'transparent',
          border: 'none',
          borderRadius: '0',
        };
    }
  };

  // 获取二维码内部样式（用于渐变等背景）
  const getInnerStyle = (frameId: string) => {
    switch (frameId) {
      case 'gradient':
        return {
          padding: '8px',
          background: 'white',
          borderRadius: '8px',
        };
      default:
        return {};
    }
  };

  // 添加请求头
  const addHeader = () => {
    setHttpHeaders([...httpHeaders, { key: '', value: '' }]);
  };

  // 删除请求头
  const removeHeader = (index: number) => {
    setHttpHeaders(httpHeaders.filter((_, i) => i !== index));
  };

  // 更新请求头
  const updateHeader = (index: number, field: 'key' | 'value', value: string) => {
    const newHeaders = [...httpHeaders];
    newHeaders[index][field] = value;
    setHttpHeaders(newHeaders);
  };

  // 发送 HTTP 请求
  const sendHttpRequest = async () => {
    if (!httpUrl) {
      setHttpResponse('请输入 URL');
      return;
    }

    setHttpLoading(true);
    setHttpResponse('');
    setHttpStatus(null);

    try {
      const headers: Record<string, string> = {};
      httpHeaders.forEach(h => {
        if (h.key && h.value) {
          headers[h.key] = h.value;
        }
      });

      const options: RequestInit = {
        method: httpMethod,
        headers,
      };

      if ((httpMethod === 'POST' || httpMethod === 'PUT') && httpBody) {
        options.body = httpBody;
      }

      const response = await fetch(httpUrl, options);
      setHttpStatus(response.status);
      
      const text = await response.text();
      try {
        const json = JSON.parse(text);
        setHttpResponse(JSON.stringify(json, null, 2));
      } catch {
        setHttpResponse(text);
      }
    } catch (error) {
      setHttpResponse(`请求失败: ${error instanceof Error ? error.message : '未知错误'}`);
      setHttpStatus(null);
    } finally {
      setHttpLoading(false);
    }
  };

  // 查询 IP 信息
  const queryIp = async () => {
    if (!ipAddress) {
      setIpInfo({ error: '请输入 IP 地址' });
      return;
    }

    setIpLoading(true);
    setIpInfo(null);

    try {
      const response = await fetch(`https://ipapi.co/${ipAddress}/json/`);
      const data = await response.json();
      setIpInfo(data);
    } catch (error) {
      setIpInfo({ error: '查询失败，请检查 IP 地址是否正确' });
    } finally {
      setIpLoading(false);
    }
  };

  // 查询当前 IP
  const queryCurrentIp = async () => {
    setIpLoading(true);
    setIpInfo(null);

    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      setIpAddress(data.ip);
      setIpInfo(data);
    } catch (error) {
      setIpInfo({ error: '查询失败' });
    } finally {
      setIpLoading(false);
    }
  };

  // 生成二维码
  const generateQrCode = () => {
    if (!qrText) {
      alert('请输入文本或 URL');
      return;
    }

    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(qrText)}`;
    console.log('生成二维码 URL:', qrApiUrl);
    setQrCode(qrApiUrl);
  };

  // 下载二维码
  const downloadQrCode = async () => {
    if (!qrCode) {
      alert('请先生成二维码');
      return;
    }
    
    try {
      console.log('开始下载二维码:', qrCode);
      console.log('当前相框样式:', qrFrame);
      
      const response = await fetch(qrCode);
      console.log('Fetch 响应状态:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const blob = await response.blob();
      console.log('Blob 大小:', blob.size);
      
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.src = URL.createObjectURL(blob);
      
      img.onload = () => {
        console.log('图片加载成功，开始绘制 Canvas');
        
        const frameStyle = getFrameStyle(qrFrame);
        const padding = parseInt(frameStyle.padding as string) || 16;
        const borderRadius = parseInt(frameStyle.borderRadius as string) || 0;
        
        console.log('Padding:', padding, 'BorderRadius:', borderRadius);
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          alert('浏览器不支持 Canvas');
          return;
        }

        const totalSize = qrSize + padding * 2;
        const extraBottom = qrFrame === 'polaroid' ? 34 : 0;
        canvas.width = totalSize;
        canvas.height = totalSize + extraBottom;

        console.log('Canvas 尺寸:', canvas.width, 'x', canvas.height);

        ctx.fillStyle = '#ffffff';
        
        if (borderRadius > 0) {
          ctx.beginPath();
          ctx.roundRect(0, 0, totalSize, totalSize + extraBottom, borderRadius);
          ctx.fill();
        } else {
          ctx.fillRect(0, 0, totalSize, totalSize + extraBottom);
        }

        if (qrFrame === 'gradient') {
          console.log('绘制渐变背景');
          const gradient = ctx.createLinearGradient(0, 0, totalSize, totalSize);
          gradient.addColorStop(0, '#667eea');
          gradient.addColorStop(1, '#764ba2');
          ctx.fillStyle = gradient;
          if (borderRadius > 0) {
            ctx.beginPath();
            ctx.roundRect(0, 0, totalSize, totalSize, borderRadius);
            ctx.fill();
          } else {
            ctx.fillRect(0, 0, totalSize, totalSize);
          }
          ctx.fillStyle = '#ffffff';
          const innerPadding = 8;
          if (borderRadius > 0) {
            ctx.beginPath();
            ctx.roundRect(padding - innerPadding, padding - innerPadding, qrSize + innerPadding * 2, qrSize + innerPadding * 2, 8);
            ctx.fill();
          } else {
            ctx.fillRect(padding - innerPadding, padding - innerPadding, qrSize + innerPadding * 2, qrSize + innerPadding * 2);
          }
        }

        if (qrFrame === 'neon') {
          console.log('绘制霓虹背景');
          ctx.fillStyle = '#0f172a';
          if (borderRadius > 0) {
            ctx.beginPath();
            ctx.roundRect(0, 0, totalSize, totalSize, borderRadius);
            ctx.fill();
          } else {
            ctx.fillRect(0, 0, totalSize, totalSize);
          }
          ctx.fillStyle = '#ffffff';
          const innerPadding = 8;
          if (borderRadius > 0) {
            ctx.beginPath();
            ctx.roundRect(padding - innerPadding, padding - innerPadding, qrSize + innerPadding * 2, qrSize + innerPadding * 2, 8);
            ctx.fill();
          } else {
            ctx.fillRect(padding - innerPadding, padding - innerPadding, qrSize + innerPadding * 2, qrSize + innerPadding * 2);
          }
        }

        if (qrFrame === 'rounded') {
          console.log('绘制圆角边框');
          ctx.strokeStyle = '#6366f1';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.roundRect(1.5, 1.5, totalSize - 3, totalSize - 3, borderRadius);
          ctx.stroke();
        }

        if (qrFrame === 'double') {
          console.log('绘制双边框');
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 4;
          ctx.strokeRect(2, 2, totalSize - 4, totalSize - 4);
          ctx.strokeRect(8, 8, totalSize - 16, totalSize - 16);
        }

        if (qrFrame === 'dashed') {
          console.log('绘制虚线边框');
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 3;
          ctx.setLineDash([10, 5]);
          ctx.strokeRect(1.5, 1.5, totalSize - 3, totalSize - 3);
          ctx.setLineDash([]);
        }

        if (qrFrame === 'polaroid') {
          console.log('绘制拍立得样式');
          ctx.fillStyle = '#ffffff';
          if (borderRadius > 0) {
            ctx.beginPath();
            ctx.roundRect(0, 0, totalSize, totalSize + extraBottom, borderRadius);
            ctx.fill();
          } else {
            ctx.fillRect(0, 0, totalSize, totalSize + extraBottom);
          }
        }

        // 绘制二维码图片
        console.log('绘制二维码图片，位置:', padding, padding, '尺寸:', qrSize, qrSize);
        ctx.drawImage(img, padding, padding, qrSize, qrSize);

        const dataUrl = canvas.toDataURL('image/png');
        console.log('Canvas 绘制完成，开始下载');
        
        const link = document.createElement('a');
        link.download = 'qrcode.png';
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log('下载完成');
      };
      
      img.onerror = (error) => {
        console.error('图片加载失败:', error);
        alert('图片加载失败，请重试');
      };
    } catch (error) {
      console.error('下载失败:', error);
      alert(`下载失败: ${error instanceof Error ? error.message : '未知错误'}`);
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

  return (
    <div className="h-full flex flex-col bg-[#f8fafc]">
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-slate-800">网络工具</h3>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button 
              onClick={() => {
                setActiveTab('http');
                localStorage.setItem('networkTools_activeTab', 'http');
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'http' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Send className="w-4 h-4 inline mr-2" /> HTTP 请求
            </button>
            <button 
              onClick={() => {
                setActiveTab('ip');
                localStorage.setItem('networkTools_activeTab', 'ip');
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'ip' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Globe className="w-4 h-4 inline mr-2" /> IP 查询
            </button>
            <button 
              onClick={() => {
                setActiveTab('qrcode');
                localStorage.setItem('networkTools_activeTab', 'qrcode');
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'qrcode' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <QrCode className="w-4 h-4 inline mr-2" /> 二维码
            </button>
          </div>
        </div>
      </div>

      {/* HTTP 请求测试 */}
      {activeTab === 'http' && (
        <div className="flex-1 overflow-auto p-6">
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="mb-4">
              <label className="text-sm font-medium text-slate-700 mb-2 block">请求 URL</label>
              <div className="flex gap-2">
                <select
                  value={httpMethod}
                  onChange={(e) => setHttpMethod(e.target.value as any)}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                </select>
                <input
                  type="text"
                  value={httpUrl}
                  onChange={(e) => setHttpUrl(e.target.value)}
                  className="flex-1 p-3 rounded-lg font-mono text-sm bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="https://api.example.com/endpoint"
                />
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-700">请求头</label>
                <button 
                  onClick={addHeader}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold transition-all flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> 添加
                </button>
              </div>
              {httpHeaders.map((header, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={header.key}
                    onChange={(e) => updateHeader(index, 'key', e.target.value)}
                    className="flex-1 p-2 rounded-lg font-mono text-sm bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Header 名称"
                  />
                  <input
                    type="text"
                    value={header.value}
                    onChange={(e) => updateHeader(index, 'value', e.target.value)}
                    className="flex-1 p-2 rounded-lg font-mono text-sm bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Header 值"
                  />
                  <button
                    onClick={() => removeHeader(index)}
                    className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {(httpMethod === 'POST' || httpMethod === 'PUT') && (
              <div className="mb-4">
                <label className="text-sm font-medium text-slate-700 mb-2 block">请求体</label>
                <textarea
                  value={httpBody}
                  onChange={(e) => setHttpBody(e.target.value)}
                  className="w-full p-3 rounded-lg font-mono text-sm bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder='{"key": "value"}'
                  rows={4}
                />
              </div>
            )}

            <div className="flex gap-2 mb-4">
              <button 
                onClick={sendHttpRequest}
                disabled={httpLoading}
                className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold transition-all disabled:opacity-50"
              >
                {httpLoading ? '发送中...' : '发送请求'}
              </button>
              <button 
                onClick={() => {
                  setHttpResponse('');
                  setHttpStatus(null);
                }}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-sm font-bold transition-all border border-slate-200"
              >
                清空
              </button>
            </div>

            {httpStatus && (
              <div className="mb-4 p-3 rounded-lg bg-slate-50">
                <span className="text-sm font-medium text-slate-700">状态码: </span>
                <span className={`text-sm font-bold ${
                  httpStatus >= 200 && httpStatus < 300 ? 'text-green-600' :
                  httpStatus >= 300 && httpStatus < 400 ? 'text-yellow-600' :
                  httpStatus >= 400 && httpStatus < 500 ? 'text-orange-600' :
                  'text-red-600'
                }`}>
                  {httpStatus}
                </span>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">响应结果</label>
              <textarea
                value={httpResponse}
                readOnly
                className="w-full h-64 p-3 rounded-lg font-mono text-sm bg-slate-50 border border-slate-200 focus:outline-none"
                placeholder="响应结果将显示在这里..."
              />
              {httpResponse && (
                <div className="mt-2 flex justify-end">
                  <button 
                    onClick={() => handleCopy(httpResponse)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold transition-all"
                  >
                    {copyFeedback ? <CheckCircle2 className="w-4 h-4 inline mr-2" /> : <Copy className="w-4 h-4 inline mr-2" />} 复制结果
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* IP 查询 */}
      {activeTab === 'ip' && (
        <div className="flex-1 overflow-auto p-6">
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="mb-4">
              <label className="text-sm font-medium text-slate-700 mb-2 block">IP 地址</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={ipAddress}
                  onChange={(e) => setIpAddress(e.target.value)}
                  className="flex-1 p-3 rounded-lg font-mono text-sm bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="输入 IP 地址，如 8.8.8.8"
                />
                <button 
                  onClick={queryIp}
                  disabled={ipLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold transition-all disabled:opacity-50"
                >
                  查询
                </button>
                <button 
                  onClick={queryCurrentIp}
                  disabled={ipLoading}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-sm font-bold transition-all border border-slate-200 disabled:opacity-50"
                >
                  查询当前 IP
                </button>
              </div>
            </div>

            {ipLoading && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <p className="mt-2 text-sm text-slate-600">查询中...</p>
              </div>
            )}

            {ipInfo && !ipInfo.error && (
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="text-sm text-slate-600 mb-1">IP 地址</div>
                  <div className="text-lg font-bold text-slate-800">{ipInfo.ip}</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="text-sm text-slate-600 mb-1">版本</div>
                  <div className="text-lg font-bold text-slate-800">{ipInfo.version}</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="text-sm text-slate-600 mb-1">城市</div>
                  <div className="text-lg font-bold text-slate-800">{ipInfo.city}</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="text-sm text-slate-600 mb-1">地区</div>
                  <div className="text-lg font-bold text-slate-800">{ipInfo.region}</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="text-sm text-slate-600 mb-1">国家</div>
                  <div className="text-lg font-bold text-slate-800">{ipInfo.country_name}</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="text-sm text-slate-600 mb-1">国家代码</div>
                  <div className="text-lg font-bold text-slate-800">{ipInfo.country_code}</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="text-sm text-slate-600 mb-1">时区</div>
                  <div className="text-lg font-bold text-slate-800">{ipInfo.timezone}</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="text-sm text-slate-600 mb-1">ISP</div>
                  <div className="text-lg font-bold text-slate-800">{ipInfo.org}</div>
                </div>
              </div>
            )}

            {ipInfo && ipInfo.error && (
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-red-600">{ipInfo.error}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 二维码生成 */}
      {activeTab === 'qrcode' && (
        <div className="flex-1 overflow-auto p-6">
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="mb-4">
              <label className="text-sm font-medium text-slate-700 mb-2 block">文本或 URL</label>
              <textarea
                value={qrText}
                onChange={(e) => setQrText(e.target.value)}
                className="w-full p-3 rounded-lg font-mono text-sm bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="输入要生成二维码的文本或 URL"
                rows={3}
              />
            </div>

            <div className="mb-4">
              <label className="text-sm font-medium text-slate-700 mb-2 block">二维码尺寸</label>
              <div className="flex gap-2 flex-wrap">
                {[100, 150, 200, 300, 400].map(size => (
                  <button
                    key={size}
                    onClick={() => setQrSize(size)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      qrSize === size ? 'bg-indigo-600 text-white' : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {size}x{size}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="text-sm font-medium text-slate-700 mb-2 block">相框样式</label>
              <div className="grid grid-cols-5 gap-2">
                {frameStyles.map(style => (
                  <button
                    key={style.id}
                    onClick={() => setQrFrame(style.id)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      qrFrame === style.id 
                        ? 'bg-indigo-600 text-white ring-2 ring-indigo-300' 
                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {style.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 mb-6">
              <button 
                onClick={generateQrCode}
                className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold transition-all"
              >
                生成二维码
              </button>
              <button 
                onClick={() => {
                  setQrText('');
                  setQrCode('');
                  setQrFrame('none');
                }}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-sm font-bold transition-all border border-slate-200"
              >
                清空
              </button>
            </div>

            {qrCode && (
              <div className="text-center">
                <div 
                  className="inline-block"
                  style={qrFrame !== 'none' ? getFrameStyle(qrFrame) : { padding: '16px', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                >
                  <div style={getInnerStyle(qrFrame)}>
                    <img 
                      src={qrCode} 
                      alt="QR Code" 
                      className="mx-auto block"
                      style={{ width: qrSize, height: qrSize }}
                      onLoad={() => console.log('二维码图片加载成功')}
                      onError={(e) => {
                        console.error('二维码图片加载失败:', qrCode);
                        console.error('错误详情:', e);
                      }}
                    />
                  </div>
                </div>
                <div className="mt-4 flex gap-2 justify-center">
                  <button 
                    onClick={downloadQrCode}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold transition-all"
                  >
                    下载二维码
                  </button>
                  <button 
                    onClick={() => handleCopy(qrText)}
                    className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-sm font-bold transition-all border border-slate-200"
                  >
                    {copyFeedback ? <CheckCircle2 className="w-4 h-4 inline mr-2" /> : <Copy className="w-4 h-4 inline mr-2" />} 复制文本
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NetworkToolsView;
