import React, { useState, useEffect } from 'react';
import { Save, Copy, CheckCircle2, Trash2, Download, Upload, Code, GitMerge, Languages, FileJson } from 'lucide-react';

const JsonEditView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'editor' | 'converter' | 'jsonxml'>(() => {
    return (localStorage.getItem('jsonEditor_activeTab') as 'editor' | 'converter' | 'jsonxml') || 'editor';
  });
  const [jsonContent, setJsonContent] = useState<string>(() => {
    return localStorage.getItem('jsonEditor_content') || `{
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
}`;
  });
  const [copyFeedback, setCopyFeedback] = useState<boolean>(false);
  const [formatError, setFormatError] = useState<string>('');
  const [converterInput, setConverterInput] = useState<string>(() => {
    return localStorage.getItem('jsonEditor_converterInput') || '';
  });
  const [converterOutput, setConverterOutput] = useState<string>(() => {
    return localStorage.getItem('jsonEditor_converterOutput') || '';
  });
  const [converterError, setConverterError] = useState<string>('');
  

  
  // JSON/XML 互转相关状态
  const [jsonXmlInput, setJsonXmlInput] = useState<string>('');
  const [jsonXmlOutput, setJsonXmlOutput] = useState<string>('');
  const [jsonXmlMode, setJsonXmlMode] = useState<'json2xml' | 'xml2json'>('json2xml');
  const [jsonXmlError, setJsonXmlError] = useState<string>('');

  useEffect(() => {
    localStorage.setItem('jsonEditor_content', jsonContent);
  }, [jsonContent]);

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(jsonContent);
      const formatted = JSON.stringify(parsed, null, 2);
      setJsonContent(formatted);
      setFormatError('');
    } catch (error) {
      console.error('JSON格式化失败:', error);
      const errorMsg = (error as Error).message;
      setFormatError(errorMsg);
      
      try {
        const trimmed = jsonContent.trim();
        let formatted = '';
        let remaining = '';
        
        for (let i = trimmed.length; i > 0; i--) {
          const substring = trimmed.substring(0, i);
          try {
            const parsed = JSON.parse(substring);
            formatted = JSON.stringify(parsed, null, 2);
            remaining = trimmed.substring(i);
            break;
          } catch (e) {
            continue;
          }
        }
        
        if (formatted) {
          setJsonContent(formatted + remaining);
        }
      } catch (e) {
        console.error('部分格式化失败:', e);
      }
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonContent);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const handleClear = () => {
    const empty = '';
    setJsonContent(empty);
    setFormatError('');
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
        setFormatError('');
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



  // Unicode 转中文 - 直接更新编辑器内容
  const handleUnicodeToChinese = () => {
    try {
      const result = jsonContent.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => {
        return String.fromCharCode(parseInt(hex, 16));
      });
      setJsonContent(result);
    } catch (error) {
      console.error('Unicode 转中文失败:', error);
    }
  };

  // 中文转 Unicode - 直接更新编辑器内容
  const handleChineseToUnicode = () => {
    try {
      const result = jsonContent.split('').map(char => {
        const code = char.charCodeAt(0);
        if (code > 127) {
          return '\\u' + code.toString(16).padStart(4, '0');
        }
        return char;
      }).join('');
      setJsonContent(result);
    } catch (error) {
      console.error('中文转 Unicode 失败:', error);
    }
  };

  // JSON 转 XML
  const jsonToXml = (obj: any, rootName: string = 'root'): string => {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    
    const convert = (data: any, nodeName: string): string => {
      let result = `<${nodeName}>`;
      
      if (Array.isArray(data)) {
        data.forEach((item, index) => {
          result += convert(item, `${nodeName}_item`);
        });
      } else if (typeof data === 'object' && data !== null) {
        Object.entries(data).forEach(([key, value]) => {
          result += convert(value as any, key);
        });
      } else {
        result += String(data);
      }
      
      result += `</${nodeName}>`;
      return result;
    };
    
    xml += convert(obj, rootName);
    return xml;
  };

  // XML 转 JSON
  const xmlToJson = (xml: string): any => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xml, 'text/xml');
    
    const parseNode = (node: Element): any => {
      const children = node.children;
      
      if (children.length === 0) {
        return node.textContent;
      }
      
      const result: any = {};
      
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        const childData = parseNode(child);
        
        if (result[child.nodeName]) {
          if (!Array.isArray(result[child.nodeName])) {
            result[child.nodeName] = [result[child.nodeName]];
          }
          result[child.nodeName].push(childData);
        } else {
          result[child.nodeName] = childData;
        }
      }
      
      return result;
    };
    
    const root = xmlDoc.documentElement;
    return parseNode(root);
  };

  // 处理 JSON/XML 转换
  const handleJsonXmlConvert = () => {
    try {
      setJsonXmlError('');
      if (jsonXmlMode === 'json2xml') {
        const parsed = JSON.parse(jsonXmlInput);
        const xml = jsonToXml(parsed);
        setJsonXmlOutput(xml);
      } else {
        const json = xmlToJson(jsonXmlInput);
        setJsonXmlOutput(JSON.stringify(json, null, 2));
      }
    } catch (error) {
      console.error('JSON/XML 转换失败:', error);
      setJsonXmlError('转换失败，请检查输入格式');
      setJsonXmlOutput('');
    }
  };

  // 处理 JSON/XML 清空
  const handleJsonXmlClear = () => {
    setJsonXmlInput('');
    setJsonXmlOutput('');
    setJsonXmlError('');
  };

  // 处理 JSON/XML 复制
  const handleJsonXmlCopy = () => {
    if (jsonXmlOutput) {
      navigator.clipboard.writeText(jsonXmlOutput);
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
        <div className="flex gap-2 flex-wrap">
          <button 
            onClick={() => {
              setActiveTab('editor');
              localStorage.setItem('jsonEditor_activeTab', 'editor');
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'editor' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Code className="w-4 h-4 inline mr-2" /> JSON 编辑器
          </button>
          <button 
            onClick={() => {
              setActiveTab('converter');
              localStorage.setItem('jsonEditor_activeTab', 'converter');
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'converter' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <GitMerge className="w-4 h-4 inline mr-2" /> JSON 转 Java 实体
          </button>
          <button 
            onClick={() => {
              setActiveTab('jsonxml');
              localStorage.setItem('jsonEditor_activeTab', 'jsonxml');
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'jsonxml' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <FileJson className="w-4 h-4 inline mr-2" /> JSON/XML 互转
          </button>
        </div>
      </div>

      {activeTab === 'editor' && (
        <>
          <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              <span className="text-xs px-2 py-1 rounded-full font-medium bg-slate-100 text-slate-700">
                JSON 编辑器
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
                onClick={handleUnicodeToChinese}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold transition-all border border-slate-200 flex items-center gap-1"
              >
                <Languages className="w-4 h-4" /> Unicode 转中文
              </button>
              <button 
                onClick={handleChineseToUnicode}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold transition-all border border-slate-200 flex items-center gap-1"
              >
                <Languages className="w-4 h-4" /> 中文转 Unicode
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
                onChange={(e) => {
                  setJsonContent(e.target.value);
                  setFormatError('');
                }}
                className="w-full h-full p-4 rounded-lg font-mono text-sm bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="在此输入JSON..."
              />
            </div>
          </div>

          {formatError && (
            <div className="p-4 border-t border-slate-200 bg-amber-50">
              <p className="text-sm text-amber-700 font-medium">格式化错误: {formatError}</p>
            </div>
          )}

          <div className="p-6 border-t border-slate-200 bg-white">
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-500">
                字符数: {jsonContent.length} | 行数: {jsonContent.split('\n').length}
              </div>
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
                placeholder="在此输入 JSON..."
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
              <p className="text-sm text-red-600 font-medium">错误：{converterError}</p>
            </div>
          )}
        </>
      )}

      {activeTab === 'jsonxml' && (
        <>
          <div className="flex-1 overflow-hidden flex p-6 gap-6">
            <div className="flex-1 flex flex-col">
              <label className="text-sm font-medium text-slate-700 mb-2">输入</label>
              <textarea
                value={jsonXmlInput}
                onChange={(e) => setJsonXmlInput(e.target.value)}
                className="flex-1 p-4 rounded-lg font-mono text-sm bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder={jsonXmlMode === 'json2xml' ? "在此输入 JSON..." : "在此输入 XML..."}
              />
              <div className="mt-4 flex gap-2 items-center">
                <select
                  value={jsonXmlMode}
                  onChange={(e) => setJsonXmlMode(e.target.value as 'json2xml' | 'xml2json')}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="json2xml">JSON 转 XML</option>
                  <option value="xml2json">XML 转 JSON</option>
                </select>
                <button 
                  onClick={handleJsonXmlConvert}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold transition-all"
                >
                  转换
                </button>
                <button 
                  onClick={handleJsonXmlClear}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-sm font-bold transition-all border border-slate-200"
                >
                  清空
                </button>
              </div>
            </div>
            <div className="flex-1 flex flex-col">
              <label className="text-sm font-medium text-slate-700 mb-2">输出</label>
              <textarea
                value={jsonXmlOutput}
                readOnly
                className="flex-1 p-4 rounded-lg font-mono text-sm bg-slate-50 border border-slate-200 focus:outline-none"
                placeholder="转换结果将显示在这里..."
              />
              <div className="mt-4 flex justify-end">
                <button 
                  onClick={handleJsonXmlCopy}
                  disabled={!jsonXmlOutput}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    jsonXmlOutput ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {copyFeedback ? <CheckCircle2 className="w-4 h-4 inline mr-2" /> : <Copy className="w-4 h-4 inline mr-2" />} 复制结果
                </button>
              </div>
            </div>
          </div>

          {jsonXmlError && (
            <div className="p-4 border-t border-slate-200 bg-red-50">
              <p className="text-sm text-red-600 font-medium">错误：{jsonXmlError}</p>
            </div>
          )}
        </>
      )}

    </div>
  );
};

export default JsonEditView;