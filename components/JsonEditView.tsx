import React, { useState, useEffect } from 'react';
import { Save, Copy, CheckCircle2, Trash2, Download, Upload, Code, GitMerge } from 'lucide-react';

const JsonEditView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'editor' | 'converter'>('editor');
  const [jsonContent, setJsonContent] = useState<string>(`{
  "name": "JSON Editor",
  "version": "1.0.0",
  "description": "在线JSON编辑器",
  "features": [
    "语法高亮",
    "格式化",
    "验证",
    "导入/导出"
  ],
  "config": {
    "theme": "light",
    "autoFormat": true,
    "lineNumbers": true
  }
}`);
  const [isValid, setIsValid] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [copyFeedback, setCopyFeedback] = useState<boolean>(false);
  const [converterInput, setConverterInput] = useState<string>('');
  const [converterOutput, setConverterOutput] = useState<string>('');
  const [converterError, setConverterError] = useState<string>('');

  useEffect(() => {
    validateJson();
  }, [jsonContent]);

  const validateJson = () => {
    try {
      JSON.parse(jsonContent);
      setIsValid(true);
      setErrorMessage('');
    } catch (error) {
      setIsValid(false);
      setErrorMessage((error as Error).message);
    }
  };

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(jsonContent);
      setJsonContent(JSON.stringify(parsed, null, 2));
    } catch (error) {
      alert('JSON格式错误，无法格式化');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonContent);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const handleClear = () => {
    setJsonContent('');
  };

  const handleDownload = () => {
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'data.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setJsonContent(content);
      };
      reader.readAsText(file);
    }
  };

  const capitalize = (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const snakeToCamel = (str: string): string => {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  };

  const generateJavaClasses = (name: string, obj: any, generatedClasses: Set<string> = new Set()): { mainClass: string, nestedClasses: string[] } => {
    const nestedClasses: string[] = [];
    
    const toJavaType = (value: any, fieldName: string): string => {
      if (value === null) return 'Object';
      if (Array.isArray(value)) {
        if (value.length === 0) return 'List<Object>';
        return `List<${toJavaType(value[0], fieldName)}>`;
      }
      if (typeof value === 'object') {
        const nestedClassName = capitalize(snakeToCamel(fieldName));
        if (!generatedClasses.has(nestedClassName)) {
          generatedClasses.add(nestedClassName);
          const nestedResult = generateJavaClasses(nestedClassName, value, generatedClasses);
          nestedClasses.push(...nestedResult.nestedClasses);
          nestedClasses.push(nestedResult.mainClass);
        }
        return nestedClassName;
      }
      switch (typeof value) {
        case 'string': return 'String';
        case 'number': return 'double';
        case 'boolean': return 'boolean';
        default: return 'Object';
      }
    };
    
    let code = `public class ${capitalize(name)} {\n`;
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const javaType = toJavaType(obj[key], key);
        const camelKey = snakeToCamel(key);
        code += `    private ${javaType} ${camelKey};\n`;
      }
    }
    
    code += '\n';
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const javaType = toJavaType(obj[key], key);
        const camelKey = snakeToCamel(key);
        const capitalizedKey = capitalize(camelKey);
        code += `    public ${javaType} get${capitalizedKey}() {\n`;
        code += `        return ${camelKey};\n`;
        code += `    }\n\n`;
        code += `    public void set${capitalizedKey}(${javaType} ${camelKey}) {\n`;
        code += `        this.${camelKey} = ${camelKey};\n`;
        code += `    }\n\n`;
      }
    }
    
    code += '}';
    
    return { mainClass: code, nestedClasses };
  };

  const generateJavaClass = (name: string, obj: any): string => {
    const result = generateJavaClasses(name, obj);
    return [...result.nestedClasses, result.mainClass].join('\n\n');
  };

  const handleConvert = () => {
    try {
      setConverterError('');
      const parsed = JSON.parse(converterInput);
      const javaCode = generateJavaClass('MyClass', parsed);
      setConverterOutput(javaCode);
    } catch (error) {
      setConverterError('JSON格式错误，请检查输入');
      setConverterOutput('');
    }
  };

  const handleConverterClear = () => {
    setConverterInput('');
    setConverterOutput('');
    setConverterError('');
  };

  const handleConverterCopy = () => {
    if (converterOutput) {
      navigator.clipboard.writeText(converterOutput);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#f8fafc]">
      <div className="p-6 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800">JSON 工具</h3>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveTab('editor')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'editor' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Code className="w-4 h-4 inline mr-2" /> JSON 编辑器
          </button>
          <button 
            onClick={() => setActiveTab('converter')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'converter' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <GitMerge className="w-4 h-4 inline mr-2" /> JSON 转 Java 实体
          </button>
        </div>
      </div>

      {activeTab === 'editor' && (
        <>
          <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {isValid ? '有效' : '无效'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleFormat}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold transition-all border border-slate-200"
              >
                格式化
              </button>
              <button 
                onClick={handleCopy}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold transition-all border border-slate-200 flex items-center gap-1"
              >
                {copyFeedback ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />} 复制
              </button>
              <button 
                onClick={handleClear}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold transition-all border border-slate-200 flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" /> 清空
              </button>
              <button 
                onClick={handleDownload}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold transition-all border border-slate-200 flex items-center gap-1"
              >
                <Download className="w-4 h-4" /> 下载
              </button>
              <label className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold transition-all border border-slate-200 flex items-center gap-1 cursor-pointer">
                <Upload className="w-4 h-4" /> 导入
                <input type="file" accept=".json" className="hidden" onChange={handleUpload} />
              </label>
            </div>
          </div>

          <div className="flex-1 overflow-hidden flex">
            <div className="flex-1 p-6 overflow-auto">
              <textarea
                value={jsonContent}
                onChange={(e) => setJsonContent(e.target.value)}
                className={`w-full h-full p-4 rounded-lg font-mono text-sm ${isValid ? 'bg-white border border-slate-200' : 'bg-red-50 border border-red-200'} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                placeholder="在此输入JSON..."
              />
            </div>
          </div>

          {!isValid && (
            <div className="p-4 border-t border-slate-200 bg-red-50">
              <p className="text-sm text-red-600 font-medium">错误: {errorMessage}</p>
            </div>
          )}

          <div className="p-6 border-t border-slate-200 bg-white">
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-500">
                字符数: {jsonContent.length} | 行数: {jsonContent.split('\n').length}
              </div>
              <button 
                onClick={() => {
                  if (isValid) {
                    alert('JSON格式正确！');
                  } else {
                    alert('JSON格式错误，请检查后重试。');
                  }
                }}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  isValid ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
                disabled={!isValid}
              >
                验证 JSON
              </button>
            </div>
          </div>
        </>
      )}

      {activeTab === 'converter' && (
        <>
          <div className="flex-1 overflow-hidden flex p-6 gap-6">
            <div className="flex-1 flex flex-col">
              <label className="text-sm font-medium text-slate-700 mb-2">JSON 输入</label>
              <textarea
                value={converterInput}
                onChange={(e) => setConverterInput(e.target.value)}
                className="flex-1 p-4 rounded-lg font-mono text-sm bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="在此输入JSON..."
              />
              <div className="mt-4 flex gap-2">
                <button 
                  onClick={handleConvert}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold transition-all"
                >
                  转换
                </button>
                <button 
                  onClick={handleConverterClear}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-sm font-bold transition-all border border-slate-200"
                >
                  清空
                </button>
              </div>
            </div>
            <div className="flex-1 flex flex-col">
              <label className="text-sm font-medium text-slate-700 mb-2">实体输出</label>
              <textarea
                value={converterOutput}
                readOnly
                className="flex-1 p-4 rounded-lg font-mono text-sm bg-slate-50 border border-slate-200 focus:outline-none"
                placeholder="转换结果将显示在这里..."
              />
              <div className="mt-4 flex justify-end">
                <button 
                  onClick={handleConverterCopy}
                  disabled={!converterOutput}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    converterOutput ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {copyFeedback ? <CheckCircle2 className="w-4 h-4 inline mr-2" /> : <Copy className="w-4 h-4 inline mr-2" />} 复制结果
                </button>
              </div>
            </div>
          </div>

          {converterError && (
            <div className="p-4 border-t border-slate-200 bg-red-50">
              <p className="text-sm text-red-600 font-medium">错误: {converterError}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default JsonEditView;