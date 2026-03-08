
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, 
  RotateCw, 
  FlipHorizontal, 
  FlipVertical, 
  Save, 
  RefreshCcw,
  Palette,
  Undo2,
  Pipette,
  Copy,
  CheckCircle2,
  Grid,
  Scissors,
  Type as TypeIcon,
  Plus,
  Trash2,
  Move
} from 'lucide-react';

import { ImageData, ImageFilters, ImageTransform, TextOverlay } from '../types';
import { DEFAULT_FILTERS, DEFAULT_TRANSFORM, FILTER_PRESETS } from '../constants';

interface EditorState {
  filters: ImageFilters;
  transform: ImageTransform;
  texts: TextOverlay[];
}

interface EditorViewProps {
  image: ImageData;
  onClose: () => void;
}

const EditorView: React.FC<EditorViewProps> = ({ image, onClose }) => {
  const [filters, setFilters] = useState<ImageFilters>(DEFAULT_FILTERS);
  const [transform, setTransform] = useState<ImageTransform>(DEFAULT_TRANSFORM);
  const [texts, setTexts] = useState<TextOverlay[]>([]);
  const [history, setHistory] = useState<EditorState[]>([]);
  const [activeTab, setActiveTab] = useState<'adjust' | 'presets' | 'text' | 'color'>('adjust');
  const [pickedColor, setPickedColor] = useState<string | null>(null);
  const [pickedColorRGB, setPickedColorRGB] = useState<string | null>(null);
  const [pickedColorHSL, setPickedColorHSL] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [isCropMode, setIsCropMode] = useState(false);
  const [activeTextId, setActiveTextId] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = image.preview;
    img.onload = () => {
      imgRef.current = img;
      renderImage();
    };
  }, [image]);

  const saveToHistory = useCallback(() => {
    setHistory(prev => [...prev.slice(-19), { 
      filters: JSON.parse(JSON.stringify(filters)), 
      transform: JSON.parse(JSON.stringify(transform)),
      texts: JSON.parse(JSON.stringify(texts))
    }]);
  }, [filters, transform, texts]);

  const handleUndo = () => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setFilters(last.filters);
    setTransform(last.transform);
    setTexts(last.texts);
    setHistory(prev => prev.slice(0, -1));
  };

  const getFilterString = (f: ImageFilters) => {
    return `
      brightness(${f.brightness}%) 
      contrast(${f.contrast}%) 
      saturate(${f.saturation}%) 
      blur(${f.blur}px) 
      sepia(${f.sepia}%) 
      grayscale(${f.grayscale}%)
      hue-rotate(${f.hueRotate}deg)
    `.trim();
  };

  const renderImage = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const { crop } = transform;
    const sWidth = img.width * (1 - (crop.left + crop.right) / 100);
    const sHeight = img.height * (1 - (crop.top + crop.bottom) / 100);
    const sx = img.width * (crop.left / 100);
    const sy = img.height * (crop.top / 100);

    const isRotated = transform.rotate % 180 !== 0;
    canvas.width = isRotated ? sHeight : sWidth;
    canvas.height = isRotated ? sWidth : sHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((transform.rotate * Math.PI) / 180);
    ctx.scale(transform.scaleX, transform.scaleY);
    
    if (filters.borderRadius > 0) {
      const minDim = Math.min(sWidth, sHeight);
      const radius = (minDim / 2) * (filters.borderRadius / 100);
      ctx.beginPath();
      
      if (typeof (ctx as any).roundRect === 'function') {
        (ctx as any).roundRect(-sWidth / 2, -sHeight / 2, sWidth, sHeight, radius);
      } else {
        const x = -sWidth / 2;
        const y = -sHeight / 2;
        ctx.moveTo(x + radius, y);
        ctx.arcTo(x + sWidth, y, x + sWidth, y + sHeight, radius);
        ctx.arcTo(x + sWidth, y + sHeight, x, y + sHeight, radius);
        ctx.arcTo(x, y + sHeight, x, y, radius);
        ctx.arcTo(x, y, x + sWidth, y, radius);
      }
      ctx.clip();
    }

    ctx.filter = getFilterString(filters);
    ctx.drawImage(img, sx, sy, sWidth, sHeight, -sWidth / 2, -sHeight / 2, sWidth, sHeight);
    ctx.restore();

    // Render Text Overlays
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
  }, [filters, transform, texts]);

  useEffect(() => { renderImage(); }, [renderImage]);

  const rgbToHsl = (r: number, g: number, b: number): string => {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    let l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    h = Math.round(h * 360);
    s = Math.round(s * 100);
    l = Math.round(l * 100);

    return `hsl(${h}, ${s}%, ${l}%)`;
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTab === 'color') {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
      const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
      try {
        const pixel = ctx.getImageData(x, y, 1, 1).data;
        const r = pixel[0];
        const g = pixel[1];
        const b = pixel[2];
        const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
        const rgb = `rgb(${r}, ${g}, ${b})`;
        const hsl = rgbToHsl(r, g, b);
        setPickedColor(hex);
        setPickedColorRGB(rgb);
        setPickedColorHSL(hsl);
      } catch (err) { console.error(err); }
    }
  };

  const addText = () => {
    saveToHistory();
    const newText: TextOverlay = {
      id: Math.random().toString(36).substr(2, 9),
      text: '新文字',
      x: 50,
      y: 50,
      fontSize: 40,
      color: '#ffffff',
      rotation: 0,
      fontWeight: 'bold'
    };
    setTexts([...texts, newText]);
    setActiveTextId(newText.id);
  };

  const updateText = (id: string, updates: Partial<TextOverlay>) => {
    setTexts(texts.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const removeText = (id: string) => {
    saveToHistory();
    setTexts(texts.filter(t => t.id !== id));
    if (activeTextId === id) setActiveTextId(null);
  };

  const handleCropDrag = (edge: 'top' | 'bottom' | 'left' | 'right', deltaPct: number) => {
    setTransform(prev => {
      const nextCrop = { ...prev.crop };
      nextCrop[edge] = Math.max(0, Math.min(80, nextCrop[edge] + deltaPct));
      return { ...prev, crop: nextCrop };
    });
  };

  const activeText = texts.find(t => t.id === activeTextId);

  return (
    <div className="h-full flex flex-col md:flex-row bg-[#f8fafc]">
      <div className="flex-1 relative bg-white overflow-hidden flex items-center justify-center p-8">
        <div ref={containerRef} className="relative inline-block group">
          <canvas 
            ref={canvasRef} 
            onClick={handleCanvasClick}
            className={`max-w-full max-h-[80vh] object-contain shadow-2xl transition-all duration-500 
              opacity-100
              ${activeTab === 'color' ? 'cursor-crosshair' : 'cursor-default'}
            `} 
          />
          {isCropMode && (
            <div className="absolute inset-0 z-10 pointer-events-none border-2 border-indigo-500/50">
               <CropHandle edge="top" onDrag={(d) => handleCropDrag('top', d)} onStart={saveToHistory} />
               <CropHandle edge="bottom" onDrag={(d) => handleCropDrag('bottom', d)} onStart={saveToHistory} />
               <CropHandle edge="left" onDrag={(d) => handleCropDrag('left', d)} onStart={saveToHistory} />
               <CropHandle edge="right" onDrag={(d) => handleCropDrag('right', d)} onStart={saveToHistory} />
            </div>
          )}

        </div>
        
        <div className="absolute top-6 left-1/2 -translate-x-1/2 flex gap-1.5 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full border border-slate-200 shadow-lg z-20">
          <button onClick={handleUndo} disabled={history.length === 0} className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${history.length > 0 ? 'text-indigo-600 hover:bg-indigo-100' : 'text-slate-400 cursor-not-allowed'}`}><Undo2 className="w-3 h-3" /> 撤销</button>
          <span className="h-3 border-r border-slate-300 mx-1"></span>
          <button onClick={() => { saveToHistory(); setFilters(DEFAULT_FILTERS); setTransform(DEFAULT_TRANSFORM); setTexts([]); }} className="flex items-center gap-1 px-2 py-0.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md text-[10px] font-bold transition-all"><RefreshCcw className="w-3 h-3" /> 重置</button>
        </div>

        <button onClick={onClose} className="absolute top-6 left-6 p-2 bg-white/80 backdrop-blur-md text-slate-600 hover:text-slate-900 rounded-lg border border-slate-200 transition-all z-20"><X className="w-5 h-5" /></button>
        <button onClick={() => {
          const canvas = canvasRef.current;
          if (!canvas) return;
          const link = document.createElement('a');
          link.download = `aipicture_${Date.now()}.png`;
          link.href = canvas.toDataURL('image/png', 1.0);
          link.click();
        }} className="absolute bottom-6 right-6 flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xl shadow-indigo-600/30 transition-all active:scale-95 z-20"><Save className="w-5 h-5" /> 导出图片</button>
      </div>

      <div className="w-full md:w-80 border-l border-slate-200 bg-white flex flex-col shrink-0">
        <div className="flex border-b border-slate-200 overflow-x-auto no-scrollbar">
          <TabButton active={activeTab === 'adjust'} onClick={() => setActiveTab('adjust')} icon={<Palette />} label="微调" />
          <TabButton active={activeTab === 'presets'} onClick={() => setActiveTab('presets')} icon={<Grid />} label="模板" />
          <TabButton active={activeTab === 'text'} onClick={() => setActiveTab('text')} icon={<TypeIcon />} label="文字" />
          <TabButton active={activeTab === 'color'} onClick={() => setActiveTab('color')} icon={<Pipette />} label="取色" />
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {activeTab === 'adjust' && (
            <div className="space-y-6">
              <ControlSection title="光影调节">
                <Slider label="亮度" value={filters.brightness} min={0} max={200} onStart={saveToHistory} onChange={v => setFilters(p => ({ ...p, brightness: v }))} />
                <Slider label="对比度" value={filters.contrast} min={0} max={200} onStart={saveToHistory} onChange={v => setFilters(p => ({ ...p, contrast: v }))} />
                <Slider label="饱和度" value={filters.saturation} min={0} max={200} onStart={saveToHistory} onChange={v => setFilters(p => ({ ...p, saturation: v }))} />
              </ControlSection>
              <ControlSection title="效果调节">
                <Slider label="怀旧色" value={filters.sepia} min={0} max={100} onStart={saveToHistory} onChange={v => setFilters(p => ({ ...p, sepia: v }))} />
                <Slider label="模糊" value={filters.blur} min={0} max={20} onStart={saveToHistory} onChange={v => setFilters(p => ({ ...p, blur: v }))} />
                <Slider label="圆角" value={filters.borderRadius} min={0} max={100} onStart={saveToHistory} onChange={v => setFilters(p => ({ ...p, borderRadius: v }))} />
              </ControlSection>
              <div className="grid grid-cols-3 gap-2">
                <TransformButton onClick={() => { saveToHistory(); setTransform(p => ({ ...p, rotate: (p.rotate + 90) % 360 })); }} icon={<RotateCw />} label="旋转" />
                <TransformButton onClick={() => { saveToHistory(); setTransform(p => ({ ...p, scaleX: p.scaleX * -1 })); }} icon={<FlipHorizontal />} label="翻转H" />
                <button onClick={() => setIsCropMode(!isCropMode)} className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${isCropMode ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-100 border-slate-300 text-slate-700'}`}><Scissors className="w-5 h-5 mb-1" /><span className="text-[9px] font-bold">裁剪</span></button>
              </div>
            </div>
          )}

          {activeTab === 'text' && (
            <div className="space-y-6">
              <button onClick={addText} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> 添加文字</button>
              
              {texts.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">图层列表</h4>
                  <div className="space-y-2">
                    {texts.map(t => (
                      <div key={t.id} onClick={() => setActiveTextId(t.id)} className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${activeTextId === t.id ? 'bg-indigo-600/10 border-indigo-500' : 'bg-white border-slate-200 hover:border-slate-400'}`}>
                        <span className="text-xs text-slate-800 truncate pr-4">{t.text}</span>
                        <button onClick={(e) => { e.stopPropagation(); removeText(t.id); }} className="text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeText && (
                <div className="space-y-6 pt-4 border-t border-slate-200">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase">文字内容</label>
                    <input type="text" value={activeText.text} onChange={(e) => updateText(activeText.id, { text: e.target.value })} className="w-full bg-slate-100 border border-slate-300 rounded-lg p-2 text-xs text-slate-800" />
                  </div>
                  <Slider label="字号" value={activeText.fontSize} min={10} max={200} onChange={v => updateText(activeText.id, { fontSize: v })} />
                  <Slider label="旋转 (360°)" value={activeText.rotation} min={0} max={360} onChange={v => updateText(activeText.id, { rotation: v })} />
                  <div className="grid grid-cols-2 gap-4">
                    <Slider label="位置 X" value={activeText.x} min={0} max={100} onChange={v => updateText(activeText.id, { x: v })} />
                    <Slider label="位置 Y" value={activeText.y} min={0} max={100} onChange={v => updateText(activeText.id, { y: v })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase">颜色</label>
                    <input type="color" value={activeText.color} onChange={(e) => updateText(activeText.id, { color: e.target.value })} className="w-full h-8 rounded-lg bg-transparent border border-slate-300 cursor-pointer p-0" />
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'presets' && (
            <div className="grid grid-cols-2 gap-3">
              {FILTER_PRESETS.map((preset) => (
                <button key={preset.id} onClick={() => { saveToHistory(); setFilters({ ...preset.values }); }} className="group p-2 rounded-xl bg-white border border-slate-200 hover:border-indigo-500/50 transition-all">
                  <div className="aspect-video rounded-lg bg-slate-100 overflow-hidden mb-2">
                     <img src={image.preview} className="w-full h-full object-cover" style={{ filter: getFilterString(preset.values) }} />
                  </div>
                  <span className="text-[10px] font-bold text-slate-800 uppercase">{preset.name}</span>
                </button>
              ))}
            </div>
          )}

          {activeTab === 'color' && (
            <div className="p-6 bg-white rounded-2xl flex flex-col items-center gap-4 border border-slate-200 text-center">
              <div className="w-20 h-20 rounded-2xl shadow-inner border border-slate-200" style={{ backgroundColor: pickedColor || 'transparent' }} />
              {pickedColor && (
                <div className="w-full space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="text-xs font-medium text-slate-600">HEX</span>
                    <span className="text-xs font-bold text-slate-800">{pickedColor}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="text-xs font-medium text-slate-600">RGB</span>
                    <span className="text-xs font-bold text-slate-800">{pickedColorRGB}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="text-xs font-medium text-slate-600">HSL</span>
                    <span className="text-xs font-bold text-slate-800">{pickedColorHSL}</span>
                  </div>
                </div>
              )}
              <button onClick={() => { if (!pickedColor) return; navigator.clipboard.writeText(pickedColor); setCopyFeedback(true); setTimeout(() => setCopyFeedback(false), 2000); }} disabled={!pickedColor} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 text-white w-full">
                {copyFeedback ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />} 复制 HEX 值
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CropHandle: React.FC<{ edge: 'top' | 'bottom' | 'left' | 'right', onDrag: (d: number) => void, onStart: () => void }> = ({ edge, onDrag, onStart }) => {
  const handleMouseDown = (e: React.MouseEvent) => {
    onStart();
    const startY = e.clientY;
    const startX = e.clientX;
    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = ((moveEvent.clientY - startY) / window.innerHeight) * 100;
      const deltaX = ((moveEvent.clientX - startX) / window.innerWidth) * 100;
      if (edge === 'top') onDrag(deltaY);
      if (edge === 'bottom') onDrag(-deltaY);
      if (edge === 'left') onDrag(deltaX);
      if (edge === 'right') onDrag(-deltaX);
    };
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };
  const styleMap = { top: "top-0 left-0 right-0 h-2 cursor-ns-resize", bottom: "bottom-0 left-0 right-0 h-2 cursor-ns-resize", left: "top-0 bottom-0 left-0 w-2 cursor-ew-resize", right: "top-0 bottom-0 right-0 w-2 cursor-ew-resize" };
  return <div onMouseDown={handleMouseDown} className={`absolute z-20 hover:bg-indigo-400/50 pointer-events-auto transition-colors ${styleMap[edge]}`} />;
};

const TabButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex-1 py-4 px-1 flex flex-col items-center gap-1 transition-all border-b-2 ${active ? 'bg-indigo-50 text-indigo-600 border-indigo-600' : 'text-slate-600 border-transparent hover:text-slate-900'}`}>
    {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-4 h-4' })}
    <span className="text-[9px] font-bold uppercase tracking-tighter">{label}</span>
  </button>
);

const ControlSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="space-y-4">
    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{title}</h4>
    <div className="space-y-4">{children}</div>
  </div>
);

const Slider: React.FC<{ label: string; value: number; min: number; max: number; onStart?: () => void; onChange: (v: number) => void }> = ({ label, value, min, max, onStart, onChange }) => (
  <div className="space-y-2">
    <div className="flex justify-between text-[10px] font-medium"><span className="text-slate-500">{label}</span><span className="text-indigo-600">{value}</span></div>
    <input type="range" min={min} max={max} value={value} onMouseDown={onStart} onChange={(e) => onChange(parseFloat(e.target.value))} className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
  </div>
);

const TransformButton: React.FC<{ onClick: () => void; icon: React.ReactNode; label: string }> = ({ onClick, icon, label }) => (
  <button onClick={onClick} className="flex flex-col items-center justify-center p-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 transition-all text-center group">
    {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-5 h-5 mb-1.5 group-hover:scale-110' })}
    <span className="text-[9px] font-bold">{label}</span>
  </button>
);

export default EditorView;
