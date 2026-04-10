import React, { useState, useEffect } from 'react';
import { useFFmpeg } from './video/useFFmpeg';
import VideoTrimView from './video/VideoTrimView';
import VideoMergeView from './video/VideoMergeView';
import { Loader2, Clapperboard } from 'lucide-react';

type VideoTab = 'trim' | 'merge';

const VideoEditorView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<VideoTab>('trim');
  const ffmpegState = useFFmpeg();

  useEffect(() => {
    ffmpegState.load();
  }, []);

  return (
    <div className="h-full flex flex-col bg-[#f8fafc]">
      {/* 子导航 */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('trim')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'trim' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            剪辑编辑
          </button>
          <button
            onClick={() => setActiveTab('merge')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'merge' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            合并
          </button>
        </div>

        {/* FFmpeg 状态 */}
        <div className="ml-auto flex items-center gap-2 text-xs">
          {ffmpegState.isLoading && (
            <span className="flex items-center gap-1.5 text-amber-600">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              FFmpeg 加载中...
            </span>
          )}
          {ffmpegState.isReady && (
            <span className="flex items-center gap-1.5 text-green-600">
              <Clapperboard className="w-3.5 h-3.5" />
              FFmpeg 就绪
            </span>
          )}
          {ffmpegState.error && (
            <span className="flex items-center gap-1.5 text-red-600">
              FFmpeg 加载失败：{ffmpegState.error}
            </span>
          )}
        </div>
      </div>

      {/* 工作区 */}
      <div className="flex-1 overflow-hidden">
        <div className={activeTab === 'trim' ? 'h-full' : 'hidden'}>
          <VideoTrimView ffmpegState={ffmpegState} />
        </div>
        <div className={activeTab === 'merge' ? 'h-full' : 'hidden'}>
          <VideoMergeView ffmpegState={ffmpegState} />
        </div>
      </div>
    </div>
  );
};

export default VideoEditorView;
