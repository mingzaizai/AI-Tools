
import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Settings2, 
  Trash2, 
  Plus, 
  CheckCircle2, 
  Loader2, 
  Files,
  Download,
  Link,
  Link2Off
} from 'lucide-react';
import { ImageData } from '../types';

interface BatchViewProps {
  images: ImageData[];
  onRemove: (id: string) => void;
  onUpload: (files: File[]) => void;
}

const BatchView: React.FC<BatchViewProps> = ({ images, onRemove, onUpload }) => {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{name: string, dataUrl: string}[]>([]);
  
  const [outputFormat, setOutputFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/jpeg');
  const [quality, setQuality] = useState(90);
  
  // 新版自定义尺寸状态
  const [resizeMode, setResizeMode] = useState<'original' | 'custom'>('original');
  const [targetWidth, setTargetWidth] = useState<number>(1920);
  const [targetHeight, setTargetHeight] = useState<number>(1080);
  const [aspectLocked, setAspectLocked] = useState(true);
  const [compressionRatio, setCompressionRatio] = useState(90);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startBatch = async () => {
    if (images.length === 0) return;
    setProcessing(true);
    setProgress(0);
    setResults([]);

    const processedItems: {name: string, dataUrl: string}[] = [];
    for (let i = 0; i < images.length; i++) {
      const imgData = images[i];
      try {
        const result = await processImage(imgData);
        processedItems.push(result);
      } catch (err) {
        console.error(`处理失败: ${imgData.file.name}`, err);
      }
      setProgress(Math.round(((i + 1) / images.length) * 100));
    }

    setResults(processedItems);
    setProcessing(false);
  };

  const processImage = (imgData: ImageData): Promise<{name: string, dataUrl: string}> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = imgData.preview;
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return reject('Canvas 不可用');
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('Context 不可用');

        let finalWidth = img.width;
        let finalHeight = img.height;

        if (resizeMode === 'custom') {
          finalWidth = targetWidth;
          finalHeight = targetHeight;
        } else if (resizeMode === 'original' && outputFormat === 'image/png' && compressionRatio < 100) {
          // 对于PNG格式，通过缩小尺寸来实现压缩
          const scaleFactor = Math.sqrt(compressionRatio / 100);
          finalWidth = Math.round(img.width * scaleFactor);
          finalHeight = Math.round(img.height * scaleFactor);
        }

        canvas.width = finalWidth;
        canvas.height = finalHeight;

        ctx.drawImage(img, 0, 0, finalWidth, finalHeight);
        const ext = outputFormat.split('/')[1];
        const dataUrl = canvas.toDataURL(outputFormat, compressionRatio / 100);
        const newName = `${imgData.file.name.split('.')[0]}_processed.${ext}`;
        resolve({ name: newName, dataUrl });
      };
      img.onerror = reject;
    });
  };

  const handleWidthChange = (val: number) => {
    setTargetWidth(val);
    if (aspectLocked) {
      setTargetHeight(Math.round(val / (16/9))); // 这里默认按 16:9，实际建议取首张图比例
    }
  };

  const handleHeightChange = (val: number) => {
    setTargetHeight(val);
    if (aspectLocked) {
      setTargetWidth(Math.round(val * (16/9)));
    }
  };

  const downloadAll = () => {
    results.forEach((res, index) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = res.dataUrl;
        link.download = res.name;
        link.click();
      }, index * 200);
    });
  };

  return (
    <div className="h-full flex flex-col md:flex-row bg-[#f8fafc]">
      <canvas ref={canvasRef} className="hidden" />

      <div className="flex-1 flex flex-col min-w-0 border-r border-slate-200">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Files className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-800">处理队列 ({images.length})</h3>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {images.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
              <Plus className="w-12 h-12 opacity-20" />
              <p className="text-sm">队列中暂无图片</p>
            </div>
          ) : (
            images.map(img => (
              <div key={img.id} className="flex items-center gap-4 p-3 bg-white rounded-xl border border-slate-200 group">
                <img src={img.preview} className="w-12 h-12 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">{img.file.name}</p>
                  <p className="text-[10px] text-slate-500">{(img.size / 1024).toFixed(1)} KB</p>
                </div>
                {!processing && (
                  <button onClick={() => onRemove(img.id)} className="p-2 text-slate-400 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="w-full md:w-96 bg-white p-8 shrink-0 flex flex-col">
        <div className="mb-8 flex-1 overflow-y-auto pr-2 no-scrollbar space-y-8">
          <div className="flex items-center gap-3">
            <Settings2 className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-800">批量输出设置</h3>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">输出格式</label>
              <div className="grid grid-cols-3 gap-2">
                {['JPEG', 'PNG', 'WEBP'].map(fmt => (
                  <button 
                    key={fmt} 
                    onClick={() => setOutputFormat(`image/${fmt.toLowerCase()}` as any)}
                    className={`py-2 rounded-lg text-xs font-bold border ${outputFormat.includes(fmt.toLowerCase()) ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white border-slate-200 text-slate-700'}`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">尺寸缩放模式</label>
              <div className="flex gap-2 mb-4">
                <button 
                  onClick={() => setResizeMode('original')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg border ${resizeMode === 'original' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white border-slate-200 text-slate-700'}`}
                >
                  保持原样
                </button>
                <button 
                  onClick={() => setResizeMode('custom')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg border ${resizeMode === 'custom' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white border-slate-200 text-slate-700'}`}
                >
                  自定义尺寸
                </button>
              </div>

              {resizeMode === 'custom' && (
                <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 space-y-1">
                       <span className="text-[9px] text-slate-500 font-bold uppercase">宽度 (W)</span>
                       <input 
                         type="number" 
                         value={targetWidth}
                         onChange={(e) => handleWidthChange(parseInt(e.target.value) || 0)}
                         className="w-full bg-slate-100 border border-slate-300 rounded-lg p-2 text-xs text-slate-800"
                       />
                    </div>
                    <button 
                      onClick={() => setAspectLocked(!aspectLocked)}
                      className={`mt-4 p-1.5 rounded-md ${aspectLocked ? 'text-indigo-600 bg-indigo-100' : 'text-slate-500 bg-slate-200'}`}
                    >
                      {aspectLocked ? <Link className="w-4 h-4" /> : <Link2Off className="w-4 h-4" />}
                    </button>
                    <div className="flex-1 space-y-1">
                       <span className="text-[9px] text-slate-500 font-bold uppercase">高度 (H)</span>
                       <input 
                         type="number" 
                         value={targetHeight}
                         onChange={(e) => handleHeightChange(parseInt(e.target.value) || 0)}
                         className="w-full bg-slate-100 border border-slate-300 rounded-lg p-2 text-xs text-slate-800"
                       />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">压缩比</label>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-medium">
                  <span className="text-slate-500">低质量 (小文件)</span>
                  <span className="text-indigo-600">{compressionRatio}%</span>
                  <span className="text-slate-500">高质量 (大文件)</span>
                </div>
                <input 
                  type="range" 
                  min="10" 
                  max="100" 
                  value={compressionRatio} 
                  onChange={(e) => setCompressionRatio(parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                {outputFormat === 'image/png' && (
                  <p className="text-[9px] text-slate-500 mt-1">
                    PNG 格式通过调整尺寸实现压缩
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-200">
          {processing ? (
            <div className="space-y-4">
              <div className="flex justify-between items-end mb-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-2"><Loader2 className="w-3.5 h-3.5 animate-spin" /> 处理中...</span>
                <span className="text-xs font-black text-indigo-600">{progress}%</span>
              </div>
              <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>
          ) : results.length > 0 ? (
            <button onClick={downloadAll} className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-2xl flex items-center justify-center gap-3 font-bold shadow-xl transition-all">
              <Download className="w-5 h-5" /> 下载所有 ({results.length})
            </button>
          ) : (
            <button onClick={startBatch} disabled={images.length === 0} className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-bold transition-all ${images.length > 0 ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
              <Play className="w-5 h-5 fill-current" /> 开始执行
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BatchView;
