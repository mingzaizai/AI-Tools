
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Trash2, 
  Layout, 
  ArrowRight, 
  ArrowDown, 
  Save, 
  Maximize, 
  Settings2,
  X,
  Palette,
  Type as TypeIcon
} from 'lucide-react';
import { ImageData, TextOverlay } from '../types';

interface MergeViewProps {
  images: ImageData[];
  onUpload: (files: File[]) => void;
}

const MergeView: React.FC<MergeViewProps> = ({ images, onUpload }) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [direction, setDirection] = useState<'horizontal' | 'vertical'>('horizontal');
  const [gap, setGap] = useState(10);
  const [padding, setPadding] = useState(10);
  const [bgColor, setBgColor] = useState('#0f172a');
  const [align, setAlign] = useState<'start' | 'center' | 'end'>('center');
  const [texts, setTexts] = useState<TextOverlay[]>([]);
  const [activeTextId, setActiveTextId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'layout' | 'text'>('layout');
  const [gridLayout, setGridLayout] = useState<'free' | '2-grid' | '4-grid' | '6-grid' | '9-grid'>('free');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const toggleImage = (id: string) => {
    let maxImages = 4;
    if (gridLayout === '2-grid') maxImages = 2;
    if (gridLayout === '4-grid') maxImages = 4;
    if (gridLayout === '6-grid') maxImages = 6;
    if (gridLayout === '9-grid') maxImages = 9;
    
    setSelectedIds(prev => {
      if (prev.includes(id)) return prev.filter(i => i !== id);
      if (prev.length >= maxImages) {
        alert(`最多只能合并 ${maxImages} 张图片`);
        return prev;
      }
      return [...prev, id];
    });
  };

  const addText = () => {
    const newText: TextOverlay = {
      id: Math.random().toString(36).substr(2, 9),
      text: '新标题',
      x: 50,
      y: 50,
      fontSize: 60,
      color: '#ffffff',
      rotation: 0,
      fontWeight: 'bold'
    };
    setTexts([...texts, newText]);
    setActiveTextId(newText.id);
    setActiveTab('text');
  };

  const updateText = (id: string, updates: Partial<TextOverlay>) => {
    setTexts(texts.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const removeText = (id: string) => {
    setTexts(texts.filter(t => t.id !== id));
    if (activeTextId === id) setActiveTextId(null);
  };

  const renderMerged = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || selectedIds.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const selectedImages = selectedIds
      .map(id => images.find(img => img.id === id))
      .filter(Boolean) as ImageData[];

    const loadedImages = await Promise.all(selectedImages.map(imgData => {
      return new Promise<HTMLImageElement>((resolve) => {
        const img = new Image();
        img.src = imgData.preview;
        img.onload = () => resolve(img);
      });
    }));

    let totalWidth = 0, totalHeight = 0;
    
    // 宫格布局
    if (gridLayout !== 'free') {
      const cols = gridLayout === '2-grid' ? 2 : 
                   gridLayout === '4-grid' ? 2 : 
                   gridLayout === '6-grid' ? 3 : 3;
      const rows = gridLayout === '2-grid' ? 1 : 
                   gridLayout === '4-grid' ? 2 : 
                   gridLayout === '6-grid' ? 2 : 3;
      
      const numImages = Math.min(loadedImages.length, cols * rows);
      const cellWidth = Math.max(...loadedImages.map(img => img.width));
      const cellHeight = Math.max(...loadedImages.map(img => img.height));
      
      totalWidth = cellWidth * cols + (cols - 1) * gap + padding * 2;
      totalHeight = cellHeight * rows + (rows - 1) * gap + padding * 2;
      
      canvas.width = totalWidth;
      canvas.height = totalHeight;
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, totalWidth, totalHeight);
      
      loadedImages.slice(0, numImages).forEach((img, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);
        const drawX = padding + col * (cellWidth + gap);
        const drawY = padding + row * (cellHeight + gap);
        
        // 计算缩放比例以适应单元格
        const scaleX = cellWidth / img.width;
        const scaleY = cellHeight / img.height;
        const scale = Math.min(scaleX, scaleY);
        
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;
        const offsetX = (cellWidth - scaledWidth) / 2;
        const offsetY = (cellHeight - scaledHeight) / 2;
        
        ctx.drawImage(img, drawX + offsetX, drawY + offsetY, scaledWidth, scaledHeight);
      });
    } else {
      // 自由布局（水平/垂直排列）
      if (direction === 'horizontal') {
        totalWidth = loadedImages.reduce((sum, img) => sum + img.width, 0) + (loadedImages.length - 1) * gap + padding * 2;
        totalHeight = Math.max(...loadedImages.map(img => img.height)) + padding * 2;
      } else {
        totalWidth = Math.max(...loadedImages.map(img => img.width)) + padding * 2;
        totalHeight = loadedImages.reduce((sum, img) => sum + img.height, 0) + (loadedImages.length - 1) * gap + padding * 2;
      }

      canvas.width = totalWidth;
      canvas.height = totalHeight;
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, totalWidth, totalHeight);

      let currentX = padding, currentY = padding;
      loadedImages.forEach((img) => {
        let drawX = currentX, drawY = currentY;
        if (direction === 'horizontal') {
          if (align === 'center') drawY = padding + (totalHeight - padding * 2 - img.height) / 2;
          if (align === 'end') drawY = totalHeight - padding - img.height;
          ctx.drawImage(img, drawX, drawY);
          currentX += img.width + gap;
        } else {
          if (align === 'center') drawX = padding + (totalWidth - padding * 2 - img.width) / 2;
          if (align === 'end') drawX = totalWidth - padding - img.width;
          ctx.drawImage(img, drawX, drawY);
          currentY += img.height + gap;
        }
      });
    }

    texts.forEach(t => {
      ctx.save();
      const textX = (t.x / 100) * canvas.width;
      const textY = (t.y / 100) * canvas.height;
      ctx.translate(textX, textY);
      ctx.rotate((t.rotation * Math.PI) / 180);
      ctx.fillStyle = t.color;
      ctx.font = `${t.fontWeight} ${t.fontSize}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(t.text, 0, 0);
      ctx.restore();
    });
  }, [selectedIds, images, direction, gap, padding, bgColor, align, texts, gridLayout]);

  useEffect(() => { renderMerged(); }, [renderMerged]);

  const activeText = texts.find(t => t.id === activeTextId);

  return (
    <div className="h-full flex flex-col lg:flex-row bg-[#f8fafc]">
      {/* 左侧：图片选择区域 */}
      <div className="lg:w-80 bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <Layout className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-800 text-sm">选择合并素材 (已选 {selectedIds.length}/{gridLayout === '2-grid' ? 2 : gridLayout === '4-grid' ? 4 : gridLayout === '6-grid' ? 6 : gridLayout === '9-grid' ? 9 : 4})</h3>
          </div>
        </div>
        
        <div className="p-3 border-b border-slate-200">
          <label className="cursor-pointer bg-white hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 border border-slate-200 w-full justify-center">
            <Plus className="w-3.5 h-3.5" /> 导入新图
            <input type="file" multiple className="hidden" accept="image/*" onChange={(e) => e.target.files && onUpload(Array.from(e.target.files))} />
          </label>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-3">
            {images.map(img => (
              <div key={img.id} onClick={() => toggleImage(img.id)} className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${selectedIds.includes(img.id) ? 'border-indigo-500 scale-95 ring-4 ring-indigo-500/20' : 'border-slate-200 hover:border-slate-400'}`}>
                <img src={img.preview} className="w-full h-full object-cover" />
                {selectedIds.includes(img.id) && <div className="absolute inset-0 bg-indigo-600/20 flex items-center justify-center"><div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-[10px] font-black text-white">{selectedIds.indexOf(img.id) + 1}</div></div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 中间：预览区域 */}
      <div className="flex-1 bg-white border-r border-slate-200 p-8 flex flex-col items-center justify-center overflow-hidden">
        {selectedIds.length > 0 ? (
          <div className="relative w-full h-full flex items-center justify-center">
             <canvas ref={canvasRef} className="max-w-full max-h-full shadow-2xl rounded-sm object-contain" />
          </div>
        ) : (
          <div className="text-center opacity-30"><Maximize className="w-12 h-12 mx-auto mb-3" /><p className="text-sm font-medium text-slate-500">请选择图片进行预览</p></div>
        )}
      </div>

      {/* 右侧：设置面板 */}
      <div className="w-full lg:w-80 bg-white shrink-0 flex flex-col overflow-hidden">
        <div className="flex border-b border-slate-200 shrink-0">
          <button onClick={() => setActiveTab('layout')} className={`flex-1 py-4 flex flex-col items-center gap-1 transition-all border-b-2 ${activeTab === 'layout' ? 'bg-indigo-50 text-indigo-600 border-indigo-600' : 'text-slate-600 border-transparent'}`}><Settings2 className="w-4 h-4" /><span className="text-[9px] font-bold uppercase">布局</span></button>
          <button onClick={() => setActiveTab('text')} className={`flex-1 py-4 flex flex-col items-center gap-1 transition-all border-b-2 ${activeTab === 'text' ? 'bg-indigo-50 text-indigo-600 border-indigo-600' : 'text-slate-600 border-transparent'}`}><TypeIcon className="w-4 h-4" /><span className="text-[9px] font-bold uppercase">文字</span></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {activeTab === 'layout' && (
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase">排列方向</label>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => { setDirection('horizontal'); setGridLayout('free'); }} className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-bold transition-all ${direction === 'horizontal' && gridLayout === 'free' ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-white border-slate-200 text-slate-700'}`}><ArrowRight className="w-4 h-4" /> 左右</button>
                  <button onClick={() => { setDirection('vertical'); setGridLayout('free'); }} className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-bold transition-all ${direction === 'vertical' && gridLayout === 'free' ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-white border-slate-200 text-slate-700'}`}><ArrowDown className="w-4 h-4" /> 上下</button>
                </div>
              </div>
              
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase">宫格布局</label>
                <div className="grid grid-cols-5 gap-2">
                  <button onClick={() => setGridLayout('free')} className={`py-2 rounded-lg border text-xs font-bold transition-all ${gridLayout === 'free' ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-white border-slate-200 text-slate-700'}`}>自由</button>
                  <button onClick={() => setGridLayout('2-grid')} className={`py-2 rounded-lg border text-xs font-bold transition-all ${gridLayout === '2-grid' ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-white border-slate-200 text-slate-700'}`}>2宫格</button>
                  <button onClick={() => setGridLayout('4-grid')} className={`py-2 rounded-lg border text-xs font-bold transition-all ${gridLayout === '4-grid' ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-white border-slate-200 text-slate-700'}`}>4宫格</button>
                  <button onClick={() => setGridLayout('6-grid')} className={`py-2 rounded-lg border text-xs font-bold transition-all ${gridLayout === '6-grid' ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-white border-slate-200 text-slate-700'}`}>6宫格</button>
                  <button onClick={() => setGridLayout('9-grid')} className={`py-2 rounded-lg border text-xs font-bold transition-all ${gridLayout === '9-grid' ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-white border-slate-200 text-slate-700'}`}>9宫格</button>
                </div>
              </div>
              
              <Slider label="间隙" value={gap} min={0} max={100} onChange={setGap} />
              <Slider label="内边距" value={padding} min={0} max={100} onChange={setPadding} />
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase">背景颜色</label>
                <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-full h-10 rounded-lg bg-transparent border border-slate-300 cursor-pointer p-0" />
              </div>
            </div>
          )}

          {activeTab === 'text' && (
            <div className="space-y-6">
              <button onClick={addText} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> 添加文字</button>
              <div className="space-y-2">
                {texts.map(t => (
                  <div key={t.id} onClick={() => setActiveTextId(t.id)} className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer ${activeTextId === t.id ? 'bg-indigo-600/10 border-indigo-500' : 'bg-white border-slate-200'}`}>
                    <span className="text-xs text-slate-800 truncate">{t.text}</span>
                    <button onClick={(e) => { e.stopPropagation(); removeText(t.id); }} className="text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
              {activeText && (
                <div className="pt-4 border-t border-slate-200 space-y-6">
                  <input type="text" value={activeText.text} onChange={(e) => updateText(activeText.id, { text: e.target.value })} className="w-full bg-slate-100 border border-slate-300 rounded-lg p-2 text-xs text-slate-800" />
                  <Slider label="字号" value={activeText.fontSize} min={10} max={300} onChange={v => updateText(activeText.id, { fontSize: v })} />
                  <Slider label="旋转 (360°)" value={activeText.rotation} min={0} max={360} onChange={v => updateText(activeText.id, { rotation: v })} />
                  <div className="grid grid-cols-2 gap-4">
                    <Slider label="位置 X" value={activeText.x} min={0} max={100} onChange={v => updateText(activeText.id, { x: v })} />
                    <Slider label="位置 Y" value={activeText.y} min={0} max={100} onChange={v => updateText(activeText.id, { y: v })} />
                  </div>
                  <input type="color" value={activeText.color} onChange={(e) => updateText(activeText.id, { color: e.target.value })} className="w-full h-8 bg-transparent border border-slate-300 cursor-pointer" />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-200 shrink-0">
          <button onClick={() => { const canvas = canvasRef.current; if (canvas) { const link = document.createElement('a'); link.download = 'merged.png'; link.href = canvas.toDataURL('image/png'); link.click(); } }} disabled={selectedIds.length < 2} className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-bold transition-all shadow-xl ${selectedIds.length >= 2 ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}><Save className="w-5 h-5" /> 导出合并结果</button>
        </div>
      </div>
    </div>
  );
};

const Slider: React.FC<{ label: string; value: number; min: number; max: number; onChange: (v: number) => void }> = ({ label, value, min, max, onChange }) => (
  <div className="space-y-2">
    <div className="flex justify-between text-[10px] font-medium"><span className="text-slate-500">{label}</span><span className="text-indigo-600">{value}</span></div>
    <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
  </div>
);

export default MergeView;
