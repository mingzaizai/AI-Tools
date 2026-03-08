
import React, { useState, useCallback, useEffect } from 'react';
import { 
  Image as ImageIcon, 
  Layers, 
  Settings, 
  Maximize2,
  Box,
  Combine,
  FileJson
} from 'lucide-react';
import { AppMode, ImageData } from './types';
import Header from './components/Header';
import EditorView from './components/EditorView';
import LibraryView from './components/LibraryView';
import BatchView from './components/BatchView';
import MergeView from './components/MergeView';
import SettingsView from './components/SettingsView';
import JsonEditView from './components/JsonEditView';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.LIBRARY);
  const [images, setImages] = useState<ImageData[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [imageProcessingMode, setImageProcessingMode] = useState<AppMode>(AppMode.LIBRARY);

  const handleUpload = useCallback((newFiles: File[]) => {
    const newImages: ImageData[] = newFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      width: 0,
      height: 0,
      lastModified: file.lastModified,
      size: file.size
    }));

    setImages(prev => [...prev, ...newImages]);
    
    if (images.length === 0 && newFiles.length === 1) {
    setSelectedImageId(newImages[0].id);
    setMode(AppMode.EDITOR);
    setImageProcessingMode(AppMode.EDITOR);
  }
  }, [images.length]);

  const removeImage = (id: string) => {
    setImages(prev => {
      const filtered = prev.filter(img => img.id !== id);
      const removed = prev.find(img => img.id === id);
      if (removed) URL.revokeObjectURL(removed.preview);
      return filtered;
    });
    if (selectedImageId === id) setSelectedImageId(null);
  };

  const selectedImage = images.find(img => img.id === selectedImageId);

  const handleGlobalExport = () => {
    const buttons = Array.from(document.querySelectorAll('button'));
    
    if (mode === AppMode.EDITOR) {
      const saveBtn = buttons.find(b => b.textContent?.includes('导出图片'));
      if (saveBtn) saveBtn.click();
    } else if (mode === AppMode.BATCH) {
      const batchDownloadBtn = buttons.find(b => b.textContent?.includes('下载所有'));
      if (batchDownloadBtn) {
        batchDownloadBtn.click();
      } else {
        alert("请先点击右下角的 '开始执行' 以生成结果。");
      }
    } else if (mode === AppMode.MERGE) {
      const mergeExportBtn = buttons.find(b => b.textContent?.includes('导出合并结果'));
      if (mergeExportBtn) mergeExportBtn.click();
    } else if (mode === AppMode.LIBRARY) {
      alert("请进入编辑模式、批量模式或合并模式进行导出。");
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] overflow-hidden text-slate-800">
      <aside className="w-64 border-r border-slate-200 bg-white shrink-0 flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <h2 className="font-bold text-slate-800">功能导航</h2>
        </div>
        
        <div className="p-4 border-b border-slate-200">
          <NavButton 
            active={mode === AppMode.LIBRARY || mode === AppMode.EDITOR || mode === AppMode.MERGE || mode === AppMode.BATCH} 
            icon={<ImageIcon />} 
            label="图片处理" 
            onClick={() => {
              setMode(AppMode.LIBRARY);
              setImageProcessingMode(AppMode.LIBRARY);
            }} 
          />
        </div>
        
        <div className="p-4 border-b border-slate-200">
          <NavButton 
            active={mode === AppMode.JSON_EDIT} 
            icon={<FileJson />} 
            label="JSON 编辑器" 
            onClick={() => setMode(AppMode.JSON_EDIT)} 
          />
        </div>
        
        <div className="mt-auto p-4 border-t border-slate-200">
          <NavButton 
            active={mode === AppMode.SETTINGS}
            icon={<Settings />} 
            label="设置" 
            onClick={() => setMode(AppMode.SETTINGS)} 
          />
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <Header 
          mode={mode} 
          onExport={handleGlobalExport} 
          canExport={mode === AppMode.EDITOR ? !!selectedImageId : images.length > 0} 
          imagesCount={images.length}
        />

        {(mode === AppMode.LIBRARY || mode === AppMode.EDITOR || mode === AppMode.MERGE || mode === AppMode.BATCH) && (
          <div className="bg-white border-b border-slate-200 px-6 py-3">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  setMode(AppMode.LIBRARY);
                  setImageProcessingMode(AppMode.LIBRARY);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  imageProcessingMode === AppMode.LIBRARY ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                图库
              </button>
              <button 
                onClick={() => {
                  if (selectedImageId) {
                    setMode(AppMode.EDITOR);
                    setImageProcessingMode(AppMode.EDITOR);
                  } else {
                    alert('请先选择一张图片');
                  }
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  imageProcessingMode === AppMode.EDITOR ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
                disabled={!selectedImageId}
              >
                编辑
              </button>
              <button 
                onClick={() => {
                  setMode(AppMode.MERGE);
                  setImageProcessingMode(AppMode.MERGE);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  imageProcessingMode === AppMode.MERGE ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                合并
              </button>
              <button 
                onClick={() => {
                  setMode(AppMode.BATCH);
                  setImageProcessingMode(AppMode.BATCH);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  imageProcessingMode === AppMode.BATCH ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                批量
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-hidden">
          {mode === AppMode.LIBRARY && (
            <LibraryView 
              images={images} 
              onSelect={(id) => {
                setSelectedImageId(id);
                setMode(AppMode.EDITOR);
                setImageProcessingMode(AppMode.EDITOR);
              }}
              onRemove={removeImage}
              onUpload={handleUpload}
            />
          )}

          {mode === AppMode.EDITOR && selectedImage && (
            <EditorView 
              image={selectedImage} 
              onClose={() => {
                setMode(AppMode.LIBRARY);
                setImageProcessingMode(AppMode.LIBRARY);
              }}
            />
          )}

          {mode === AppMode.BATCH && (
            <BatchView 
              images={images} 
              onRemove={removeImage}
              onUpload={handleUpload}
            />
          )}

          {mode === AppMode.MERGE && (
            <MergeView 
              images={images}
              onUpload={handleUpload}
            />
          )}

          {mode === AppMode.JSON_EDIT && (
            <JsonEditView />
          )}

          {mode === AppMode.SETTINGS && (
            <SettingsView />
          )}
        </div>
      </main>
    </div>
  );
};

interface NavButtonProps {
  active?: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

const NavButton: React.FC<NavButtonProps> = ({ active, icon, label, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`w-full p-3 rounded-lg transition-all flex items-center gap-3 group
      ${active ? 'bg-indigo-600/10 text-indigo-600' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-800'}
      ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
    `}
  >
    {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-5 h-5' })}
    <span className="text-sm font-medium">{label}</span>
  </button>
);

export default App;
