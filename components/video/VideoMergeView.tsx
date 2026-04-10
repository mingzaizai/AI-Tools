import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, Save, Loader2, GripVertical, StopCircle } from 'lucide-react';
import { UseFFmpegReturn } from './useFFmpeg';

interface VideoMergeViewProps {
  ffmpegState: UseFFmpegReturn;
}

interface VideoItem {
  id: string;
  file: File;
  url: string;
  name: string;
  duration: number;
}

const VideoMergeView: React.FC<VideoMergeViewProps> = ({ ffmpegState }) => {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const outputFormat = 'mp4' as const;
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const dragItemId = useRef<string | null>(null);
  const videosRef = useRef<VideoItem[]>(videos);
  useEffect(() => {
    videosRef.current = videos;
  }, [videos]);

  useEffect(() => {
    return () => {
      videosRef.current.forEach(v => URL.revokeObjectURL(v.url));
    };
  }, []);

  const addVideos = (files: FileList) => {
    Array.from(files).forEach(file => {
      const tempUrl = URL.createObjectURL(file);
      const vid = document.createElement('video');
      vid.preload = 'metadata';
      vid.onloadedmetadata = () => {
        const duration = vid.duration || 0;
        URL.revokeObjectURL(tempUrl);
        setVideos(prev => [...prev, {
          id: Math.random().toString(36).slice(2),
          file,
          url: URL.createObjectURL(file),
          name: file.name,
          duration,
        }]);
      };
      vid.src = tempUrl;
    });
  };

  const removeVideo = (id: string) => {
    setVideos(prev => {
      const item = prev.find(v => v.id === id);
      if (item) URL.revokeObjectURL(item.url);
      return prev.filter(v => v.id !== id);
    });
  };

  const moveVideo = (id: string, direction: 'up' | 'down') => {
    setVideos(prev => {
      const idx = prev.findIndex(v => v.id === id);
      if (direction === 'up' && idx === 0) return prev;
      if (direction === 'down' && idx === prev.length - 1) return prev;
      const next = [...prev];
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      return next;
    });
  };

  const handleDragStart = (id: string) => {
    dragItemId.current = id;
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    setDragOverId(id);
  };

  const handleDrop = (targetId: string) => {
    const srcId = dragItemId.current;
    if (!srcId || srcId === targetId) {
      setDragOverId(null);
      return;
    }
    setVideos(prev => {
      const srcIdx = prev.findIndex(v => v.id === srcId);
      const tgtIdx = prev.findIndex(v => v.id === targetId);
      const next = [...prev];
      const [moved] = next.splice(srcIdx, 1);
      next.splice(tgtIdx, 0, moved);
      return next;
    });
    setDragOverId(null);
    dragItemId.current = null;
  };

  const handleExport = async () => {
    if (videos.length < 2 || !ffmpegState.isReady) return;
    setExporting(true);
    setExportError(null);
    const outputName = `output.${outputFormat}`;
    try {
      for (let i = 0; i < videos.length; i++) {
        await ffmpegState.writeFile(`input_${i}.mp4`, videos[i].file);
      }

      // 用 filter_complex concat 重新编码，时间戳正确
      const n = videos.length;
      const inputs: string[] = [];
      for (let i = 0; i < n; i++) inputs.push('-i', `input_${i}.mp4`);

      const filterIn = Array.from({ length: n }, (_, i) => `[${i}:v][${i}:a]`).join('');
      const filterComplex = `${filterIn}concat=n=${n}:v=1:a=1[v][a]`;

      const totalDuration = videos.reduce((sum, v) => sum + v.duration, 0);

      await ffmpegState.run([
        ...inputs,
        '-filter_complex', filterComplex,
        '-map', '[v]',
        '-map', '[a]',
        outputName,
      ], totalDuration);

      const data = await ffmpegState.readFile(outputName);
      const mimeMap = { mp4: 'video/mp4' };
      const blob = new Blob([data], { type: mimeMap[outputFormat] });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `merged_${Date.now()}.${outputFormat}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      const msg: string = err.message ?? '合并失败';
      if (!msg.includes('terminate') && !msg.includes('Terminated')) {
        setExportError(msg);
      }
    } finally {
      setExporting(false);
      for (let i = 0; i < videos.length; i++) {
        try { await ffmpegState.deleteFile(`input_${i}.mp4`); } catch {}
      }
      try { await ffmpegState.deleteFile(outputName); } catch {}
    }
  };

  return (
    <div className="h-full flex flex-col md:flex-row bg-[#f8fafc]">
      {/* 左：素材列表 */}
      <div className="flex-1 flex flex-col border-r border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between shrink-0">
          <h3 className="font-bold text-slate-800 text-sm">素材列表（{videos.length} 个）</h3>
          <label className="cursor-pointer bg-white hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 border border-slate-200">
            <Plus className="w-3.5 h-3.5" /> 添加视频
            <input
              type="file"
              multiple
              accept="video/*"
              className="hidden"
              onChange={e => e.target.files && addVideos(e.target.files)}
            />
          </label>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {videos.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
              <Plus className="w-10 h-10 opacity-20" />
              <p className="text-sm">添加至少 2 个视频开始合并</p>
            </div>
          ) : (
            videos.map((video, idx) => (
              <div
                key={video.id}
                draggable
                onDragStart={() => handleDragStart(video.id)}
                onDragOver={e => handleDragOver(e, video.id)}
                onDrop={() => handleDrop(video.id)}
                onDragLeave={() => setDragOverId(null)}
                className={`flex items-center gap-3 p-3 bg-white rounded-xl border transition-all ${
                  dragOverId === video.id ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200'
                }`}
              >
                <GripVertical className="w-4 h-4 text-slate-300 cursor-grab shrink-0" />
                <video src={video.url} className="w-16 h-10 rounded-lg object-cover bg-slate-900 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">{video.name}</p>
                  <p className="text-[10px] text-slate-400">第 {idx + 1} 段</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => moveVideo(video.id, 'up')}
                    disabled={idx === 0}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 disabled:opacity-20 transition-colors"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => moveVideo(video.id, 'down')}
                    disabled={idx === videos.length - 1}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 disabled:opacity-20 transition-colors"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => removeVideo(video.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 右：参数面板 */}
      <div className="w-full md:w-80 bg-white shrink-0 flex flex-col p-6 gap-6">
        <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-500 space-y-1">
          <p className="font-bold text-slate-700">注意</p>
          <p>多段视频需编码格式一致（均为 H.264 MP4）才能使用快速合并模式。格式不一致时建议先在剪辑编辑里分别转码为 MP4 再合并。</p>
        </div>

        <div className="mt-auto space-y-3">
          {exportError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
              {exportError}
            </div>
          )}

          <button
            onClick={handleExport}
            disabled={videos.length < 2 || !ffmpegState.isReady || exporting}
            className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-bold shadow-xl transition-all ${
              videos.length >= 2 && ffmpegState.isReady && !exporting
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {exporting ? (
              <><Loader2 className="w-5 h-5 animate-spin" />合并中 {ffmpegState.progress}%</>
            ) : (
              <><Save className="w-5 h-5" />开始合并导出</>
            )}
          </button>

          {exporting && (
            <>
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-300"
                  style={{ width: `${ffmpegState.progress}%` }}
                />
              </div>
              <button
                onClick={() => {
                  ffmpegState.cancel();
                  setExporting(false);
                  ffmpegState.load();
                }}
                className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all"
              >
                <StopCircle className="w-4 h-4" />
                停止合并
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoMergeView;
