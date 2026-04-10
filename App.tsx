
import React, { useState, useCallback, useEffect } from 'react';
import {
  Image as ImageIcon,
  Layers,
  Settings,
  Maximize2,
  Box,
  Combine,
  FileJson,
  Database,
  Code,
  Clock,
  Globe,
  FileText,
  Github,
  BrainCircuit,
  Clapperboard
} from 'lucide-react';
import { AppMode, ImageData } from './types';
import Header from './components/Header';
import EditorView from './components/EditorView';
import LibraryView from './components/LibraryView';
import BatchView from './components/BatchView';
import MergeView from './components/MergeView';
import SettingsView from './components/SettingsView';
import JsonEditView from './components/JsonEditView';
import SQLEditorView from './components/SQLEditorView';
import EncodingToolsView from './components/EncodingToolsView';
import TimeToolsView from './components/TimeToolsView';
import NetworkToolsView from './components/NetworkToolsView';
import MarkdownEditorView from './components/MarkdownEditorView';
import GitHubSearchView from './components/GitHubSearchView';
import AITextToolsView from './components/AITextToolsView';
import VideoEditorView from './components/VideoEditorView';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.LIBRARY);
  const [images, setImages] = useState<ImageData[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [imageProcessingMode, setImageProcessingMode] = useState<AppMode>(AppMode.LIBRARY);
  const [lastSelectedImage, setLastSelectedImage] = useState<ImageData | null>(null);
  const [videoEditorMounted, setVideoEditorMounted] = useState(false);

  useEffect(() => {
    const handler = () => setMode(AppMode.SETTINGS);
    window.addEventListener('navigate-to-settings', handler);
    return () => window.removeEventListener('navigate-to-settings', handler);
  }, []);

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
  if (selectedImage && selectedImage !== lastSelectedImage) {
    setLastSelectedImage(selectedImage);
  }

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] overflow-hidden text-slate-800">
      <aside className="w-64 border-r border-slate-200 bg-white shrink-0 flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <h2 className="font-bold text-slate-800">功能导航</h2>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-3 py-2 border-b border-slate-200">
            <NavButton
              active={mode === AppMode.LIBRARY || mode === AppMode.EDITOR || mode === AppMode.MERGE || mode === AppMode.BATCH}
              icon={<ImageIcon />}
              label="图片编辑"
              onClick={() => setMode(imageProcessingMode)}
            />
          </div>
          <div className="px-3 py-2 border-b border-slate-200">
            <NavButton
              active={mode === AppMode.JSON_EDIT}
              icon={<FileJson />}
              label="JSON 编辑器"
              onClick={() => setMode(AppMode.JSON_EDIT)}
            />
          </div>
          <div className="px-3 py-2 border-b border-slate-200">
            <NavButton
              active={mode === AppMode.SQL_EDITOR}
              icon={<Database />}
              label="SQL 编辑器"
              onClick={() => setMode(AppMode.SQL_EDITOR)}
            />
          </div>
          <div className="px-3 py-2 border-b border-slate-200">
            <NavButton
              active={mode === AppMode.ENCODING_TOOLS}
              icon={<Code />}
              label="编解码工具"
              onClick={() => setMode(AppMode.ENCODING_TOOLS)}
            />
          </div>
          <div className="px-3 py-2 border-b border-slate-200">
            <NavButton
              active={mode === AppMode.TIME_TOOLS}
              icon={<Clock />}
              label="时间工具"
              onClick={() => setMode(AppMode.TIME_TOOLS)}
            />
          </div>
          <div className="px-3 py-2 border-b border-slate-200">
            <NavButton
              active={mode === AppMode.NETWORK_TOOLS}
              icon={<Globe />}
              label="网络工具"
              onClick={() => setMode(AppMode.NETWORK_TOOLS)}
            />
          </div>
          <div className="px-3 py-2 border-b border-slate-200">
            <NavButton
              active={mode === AppMode.MARKDOWN_EDITOR}
              icon={<FileText />}
              label="Markdown 编辑器"
              onClick={() => setMode(AppMode.MARKDOWN_EDITOR)}
            />
          </div>
          <div className="px-3 py-2 border-b border-slate-200">
            <NavButton
              active={mode === AppMode.GITHUB_SEARCH}
              icon={<Github />}
              label="GitHub 检索"
              onClick={() => setMode(AppMode.GITHUB_SEARCH)}
            />
          </div>
          <div className="px-3 py-2 border-b border-slate-200">
            <NavButton
              active={mode === AppMode.AI_TEXT_TOOLS}
              icon={<BrainCircuit />}
              label="AI 文本审查"
              onClick={() => setMode(AppMode.AI_TEXT_TOOLS)}
            />
          </div>
          <div className="px-3 py-2 border-b border-slate-200">
            <NavButton
              active={mode === AppMode.VIDEO_EDITOR}
              icon={<Clapperboard />}
              label="视频编辑"
              onClick={() => {
                setVideoEditorMounted(true);
                setMode(AppMode.VIDEO_EDITOR);
              }}
            />
          </div>
        </div>

        <div className="px-3 py-2 border-t border-slate-200">
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
          <div className={mode === AppMode.LIBRARY ? 'h-full' : 'hidden'}>
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
          </div>

          {lastSelectedImage && (
            <div className={mode === AppMode.EDITOR ? 'h-full' : 'hidden'}>
              <EditorView
                key={lastSelectedImage.id}
                image={lastSelectedImage}
                onClose={() => {
                  setMode(AppMode.LIBRARY);
                  setImageProcessingMode(AppMode.LIBRARY);
                }}
              />
            </div>
          )}

          <div className={mode === AppMode.BATCH ? 'h-full' : 'hidden'}>
            <BatchView images={images} onRemove={removeImage} onUpload={handleUpload} />
          </div>

          <div className={mode === AppMode.MERGE ? 'h-full' : 'hidden'}>
            <MergeView images={images} onUpload={handleUpload} />
          </div>

          <div className={mode === AppMode.JSON_EDIT ? 'h-full' : 'hidden'}>
            <JsonEditView />
          </div>

          <div className={mode === AppMode.SETTINGS ? 'h-full' : 'hidden'}>
            <SettingsView />
          </div>

          <div className={mode === AppMode.SQL_EDITOR ? 'h-full' : 'hidden'}>
            <SQLEditorView />
          </div>

          <div className={mode === AppMode.ENCODING_TOOLS ? 'h-full' : 'hidden'}>
            <EncodingToolsView />
          </div>

          <div className={mode === AppMode.TIME_TOOLS ? 'h-full' : 'hidden'}>
            <TimeToolsView />
          </div>

          <div className={mode === AppMode.NETWORK_TOOLS ? 'h-full' : 'hidden'}>
            <NetworkToolsView />
          </div>

          <div className={mode === AppMode.MARKDOWN_EDITOR ? 'h-full' : 'hidden'}>
            <MarkdownEditorView />
          </div>

          <div className={mode === AppMode.GITHUB_SEARCH ? 'h-full' : 'hidden'}>
            <GitHubSearchView />
          </div>

          <div className={mode === AppMode.AI_TEXT_TOOLS ? 'h-full' : 'hidden'}>
            <AITextToolsView />
          </div>

          {videoEditorMounted && (
            <div className={mode === AppMode.VIDEO_EDITOR ? 'h-full' : 'hidden'}>
              <VideoEditorView />
            </div>
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
