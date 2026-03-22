import React, { useState, useEffect } from 'react';
import { Clock, Globe, Copy, CheckCircle2, Trash2 } from 'lucide-react';

const TimeToolsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'timestamp' | 'timezone'>(() => {
    return (localStorage.getItem('timeTools_activeTab') as 'timestamp' | 'timezone') || 'timestamp';
  });

  const [copyFeedback, setCopyFeedback] = useState(false);

  // 时间戳转换相关状态
  const [timestampInput, setTimestampInput] = useState('');
  const [dateOutput, setDateOutput] = useState('');
  const [dateInput, setDateInput] = useState('');
  const [timestampOutput, setTimestampOutput] = useState('');
  const [currentTimestamp, setCurrentTimestamp] = useState(Math.floor(Date.now() / 1000));

  // 时区转换相关状态
  const [timezoneInput, setTimezoneInput] = useState('');
  const [sourceTimezone, setSourceTimezone] = useState('Asia/Shanghai');
  const [targetTimezone, setTargetTimezone] = useState('America/New_York');
  const [timezoneOutput, setTimezoneOutput] = useState('');

  // 更新当前时间戳
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimestamp(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 时间戳转日期
  const handleTimestampToDate = () => {
    try {
      let timestamp = parseInt(timestampInput);
      if (isNaN(timestamp)) {
        setDateOutput('请输入有效的时间戳');
        return;
      }
      if (timestampInput.length === 10) {
        timestamp *= 1000;
      }
      const date = new Date(timestamp);
      const formatted = date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      const iso = date.toISOString();
      const local = date.toString();
      setDateOutput(`本地时间: ${formatted}\nISO 格式: ${iso}\n完整格式: ${local}`);
    } catch (error) {
      setDateOutput('转换失败，请检查输入');
    }
  };

  // 日期转时间戳
  const handleDateToTimestamp = () => {
    try {
      if (!dateInput.trim()) {
        setTimestampOutput('请输入日期时间');
        return;
      }

      let date: Date;
      
      // 尝试解析各种格式
      const input = dateInput.trim();
      
      // 1. 尝试解析 ISO 格式 (2024-01-01T12:00:00)
      date = new Date(input);
      
      // 2. 如果失败，尝试解析中文格式 (2024-01-01 12:00:00)
      if (isNaN(date.getTime())) {
        const normalized = input.replace(/[年月]/g, '-').replace(/[日时分秒]/g, ':').replace(/\s+/g, ' ');
        date = new Date(normalized);
      }
      
      // 3. 如果还是失败，尝试解析时间戳
      if (isNaN(date.getTime())) {
        const timestamp = parseInt(input);
        if (!isNaN(timestamp)) {
          date = new Date(timestamp);
        }
      }

      if (isNaN(date.getTime())) {
        setTimestampOutput('无法解析日期格式，请尝试：\n- 2024-01-01 12:00:00\n- 2024-01-01T12:00:00\n- 2024年1月1日 12:00:00');
        return;
      }

      const timestamp = Math.floor(date.getTime() / 1000);
      const timestampMs = date.getTime();
      
      const formatted = date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      
      setTimestampOutput(`解析为: ${formatted}\n秒级时间戳: ${timestamp}\n毫秒级时间戳: ${timestampMs}`);
    } catch (error) {
      setTimestampOutput('转换失败，请检查输入格式');
    }
  };

  // 获取当前时间戳
  const handleGetCurrentTimestamp = () => {
    setTimestampInput(currentTimestamp.toString());
  };

  // 时区转换
  const handleTimezoneConvert = () => {
    try {
      if (!timezoneInput.trim()) {
        setTimezoneOutput('请输入时间');
        return;
      }

      let date: Date;
      const input = timezoneInput.trim();
      
      // 尝试解析各种格式
      // 1. 尝试解析 ISO 格式
      date = new Date(input);
      
      // 2. 如果失败，尝试解析中文格式
      if (isNaN(date.getTime())) {
        const normalized = input.replace(/[年月]/g, '-').replace(/[日时分秒]/g, ':').replace(/\s+/g, ' ');
        date = new Date(normalized);
      }
      
      // 3. 如果还是失败，尝试解析时间戳
      if (isNaN(date.getTime())) {
        const timestamp = parseInt(input);
        if (!isNaN(timestamp)) {
          date = new Date(timestamp);
        }
      }

      if (isNaN(date.getTime())) {
        setTimezoneOutput('无法解析日期格式，请尝试：\n- 2024-01-01 12:00:00\n- 2024-01-01T12:00:00\n- 2024年1月1日 12:00:00');
        return;
      }
      
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: targetTimezone
      };
      
      const sourceFormatted = date.toLocaleString('zh-CN', {
        ...options,
        timeZone: sourceTimezone
      });
      
      const targetFormatted = date.toLocaleString('zh-CN', options);
      const utc = date.toUTCString();
      
      setTimezoneOutput(`源时区时间: ${sourceFormatted}\n目标时区时间: ${targetFormatted}\nUTC 时间: ${utc}`);
    } catch (error) {
      setTimezoneOutput('转换失败，请检查输入格式');
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
  const handleClear = (type: 'timestamp' | 'timezone') => {
    if (type === 'timestamp') {
      setTimestampInput('');
      setDateOutput('');
      setDateInput('');
      setTimestampOutput('');
    } else {
      setTimezoneInput('');
      setTimezoneOutput('');
    }
  };

  // 常用时区列表
  const commonTimezones = [
    { value: 'Asia/Shanghai', label: '中国 (UTC+8)' },
    { value: 'Asia/Tokyo', label: '日本 (UTC+9)' },
    { value: 'Asia/Seoul', label: '韩国 (UTC+9)' },
    { value: 'Asia/Singapore', label: '新加坡 (UTC+8)' },
    { value: 'America/New_York', label: '纽约 (UTC-5/-4)' },
    { value: 'America/Los_Angeles', label: '洛杉矶 (UTC-8/-7)' },
    { value: 'Europe/London', label: '伦敦 (UTC+0/+1)' },
    { value: 'Europe/Paris', label: '巴黎 (UTC+1/+2)' },
    { value: 'Australia/Sydney', label: '悉尼 (UTC+10/+11)' },
    { value: 'UTC', label: 'UTC' }
  ];

  return (
    <div className="h-full flex flex-col bg-[#f8fafc]">
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-slate-800">时间工具</h3>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button 
              onClick={() => {
                setActiveTab('timestamp');
                localStorage.setItem('timeTools_activeTab', 'timestamp');
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'timestamp' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Clock className="w-4 h-4 inline mr-2" /> 时间戳转换
            </button>
            <button 
              onClick={() => {
                setActiveTab('timezone');
                localStorage.setItem('timeTools_activeTab', 'timezone');
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'timezone' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Globe className="w-4 h-4 inline mr-2" /> 时区转换
            </button>
          </div>
        </div>
      </div>

      {/* 时间戳转换 */}
      {activeTab === 'timestamp' && (
        <div className="flex-1 overflow-auto p-6">
          <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-slate-700">当前时间戳</h4>
              <button 
                onClick={handleGetCurrentTimestamp}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold transition-all"
              >
                使用当前时间戳
              </button>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1 p-4 bg-slate-50 rounded-lg font-mono text-lg">
                秒级: {currentTimestamp}
              </div>
              <div className="flex-1 p-4 bg-slate-50 rounded-lg font-mono text-lg">
                毫秒级: {currentTimestamp * 1000}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h4 className="font-bold text-slate-700 mb-4">时间戳 → 日期</h4>
              <input
                type="text"
                value={timestampInput}
                onChange={(e) => setTimestampInput(e.target.value)}
                className="w-full p-3 rounded-lg font-mono text-sm bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
                placeholder="输入时间戳（秒或毫秒）"
              />
              <div className="flex gap-2 mb-4">
                <button 
                  onClick={handleTimestampToDate}
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold transition-all"
                >
                  转换
                </button>
                <button 
                  onClick={() => { setTimestampInput(''); setDateOutput(''); }}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-sm font-bold transition-all border border-slate-200"
                >
                  清空
                </button>
              </div>
              <textarea
                value={dateOutput}
                readOnly
                className="w-full h-32 p-3 rounded-lg font-mono text-sm bg-slate-50 border border-slate-200 focus:outline-none"
                placeholder="转换结果..."
              />
            </div>

            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h4 className="font-bold text-slate-700 mb-4">日期 → 时间戳</h4>
              <input
                type="text"
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                className="w-full p-3 rounded-lg font-mono text-sm bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
                placeholder="输入日期时间，如：2024-01-01 12:00:00"
              />
              <div className="flex gap-2 mb-4">
                <button 
                  onClick={handleDateToTimestamp}
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold transition-all"
                >
                  转换
                </button>
                <button 
                  onClick={() => { 
                    const now = new Date();
                    const formatted = now.toLocaleString('zh-CN', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: false
                    }).replace(/\//g, '-');
                    setDateInput(formatted);
                  }}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-sm font-bold transition-all border border-slate-200"
                >
                  当前时间
                </button>
                <button 
                  onClick={() => { setDateInput(''); setTimestampOutput(''); }}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-sm font-bold transition-all border border-slate-200"
                >
                  清空
                </button>
              </div>
              <textarea
                value={timestampOutput}
                readOnly
                className="w-full h-32 p-3 rounded-lg font-mono text-sm bg-slate-50 border border-slate-200 focus:outline-none"
                placeholder="转换结果..."
              />
            </div>
          </div>
        </div>
      )}

      {/* 时区转换 */}
      {activeTab === 'timezone' && (
        <div className="flex-1 overflow-auto p-6">
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h4 className="font-bold text-slate-700 mb-4">时区转换</h4>
            
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">源时区</label>
                <select
                  value={sourceTimezone}
                  onChange={(e) => setSourceTimezone(e.target.value)}
                  className="w-full p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {commonTimezones.map(tz => (
                    <option key={tz.value} value={tz.value}>{tz.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">目标时区</label>
                <select
                  value={targetTimezone}
                  onChange={(e) => setTargetTimezone(e.target.value)}
                  className="w-full p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {commonTimezones.map(tz => (
                    <option key={tz.value} value={tz.value}>{tz.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="text-sm font-medium text-slate-700 mb-2 block">输入时间</label>
              <input
                type="text"
                value={timezoneInput}
                onChange={(e) => setTimezoneInput(e.target.value)}
                className="w-full p-3 rounded-lg font-mono text-sm bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="输入日期时间，如：2024-01-01 12:00:00"
              />
            </div>

            <div className="flex gap-2 mb-4">
              <button 
                onClick={handleTimezoneConvert}
                className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold transition-all"
              >
                转换
              </button>
              <button 
                onClick={() => { 
                  const now = new Date();
                  const formatted = now.toLocaleString('zh-CN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false
                  }).replace(/\//g, '-');
                  setTimezoneInput(formatted);
                }}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-sm font-bold transition-all border border-slate-200"
              >
                当前时间
              </button>
              <button 
                onClick={() => handleClear('timezone')}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-sm font-bold transition-all border border-slate-200"
              >
                清空
              </button>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">转换结果</label>
              <textarea
                value={timezoneOutput}
                readOnly
                className="w-full h-32 p-3 rounded-lg font-mono text-sm bg-slate-50 border border-slate-200 focus:outline-none"
                placeholder="转换结果将显示在这里..."
              />
              <div className="mt-2 flex justify-end">
                <button 
                  onClick={() => handleCopy(timezoneOutput)}
                  disabled={!timezoneOutput}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    timezoneOutput ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {copyFeedback ? <CheckCircle2 className="w-4 h-4 inline mr-2" /> : <Copy className="w-4 h-4 inline mr-2" />} 复制结果
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeToolsView;
