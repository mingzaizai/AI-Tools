# 视频编辑器 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在左侧导航新增独立的"视频编辑"模块，支持视频剪裁、多段合并、字幕水印、转码/GIF 导出、调色滤镜，全部基于 FFmpeg.wasm 在浏览器本地运行。

**Architecture:** `VideoEditorView` 作为主容器初始化并持有 FFmpeg 实例，通过 props 传给 `VideoTrimView`（剪辑编辑，含字幕/滤镜/导出）和 `VideoMergeView`（多段合并）两个子工作区；`useFFmpeg` hook 封装 wasm 加载、命令执行和进度监听。

**Tech Stack:** React 19, TypeScript, Tailwind CSS, `@ffmpeg/ffmpeg@0.12.x`, `@ffmpeg/util@0.12.x`

---

## 文件变更清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `package.json` | 修改 | 新增 `@ffmpeg/ffmpeg`、`@ffmpeg/util` 依赖 |
| `types.ts` | 修改 | 新增 `AppMode.VIDEO_EDITOR`、`VideoSubtitle` 类型 |
| `App.tsx` | 修改 | 新增导航项和路由渲染 |
| `components/VideoEditorView.tsx` | 新建 | 主容器，管理 FFmpeg 实例和子导航 |
| `components/video/useFFmpeg.ts` | 新建 | FFmpeg 初始化、执行、进度 hook |
| `components/video/VideoTrimView.tsx` | 新建 | 剪辑编辑工作区（含字幕/滤镜/导出） |
| `components/video/VideoMergeView.tsx` | 新建 | 多段合并工作区 |

---

## Task 1: 安装依赖并扩展类型

**Files:**
- Modify: `package.json`
- Modify: `types.ts`

- [ ] **Step 1: 安装 FFmpeg.wasm 依赖**

```bash
cd /Users/zhaoxiaoming/AndroidProjects/Ai-Tools
npm install @ffmpeg/ffmpeg@0.12.10 @ffmpeg/util@0.12.2
```

Expected: `package.json` 的 `dependencies` 中出现 `@ffmpeg/ffmpeg` 和 `@ffmpeg/util`。

- [ ] **Step 2: 在 `types.ts` 的 `AppMode` 枚举中新增 VIDEO_EDITOR**

在 `types.ts` 第 61 行 `AI_TEXT_TOOLS = 'AI_TEXT_TOOLS'` 后新增：

```typescript
  VIDEO_EDITOR = 'VIDEO_EDITOR'
```

- [ ] **Step 3: 在 `types.ts` 末尾新增 `VideoSubtitle` 类型**

```typescript
export interface VideoSubtitle {
  id: string;
  text: string;
  startTime: number; // 秒
  endTime: number;   // 秒
  fontSize: number;
  color: string;
}
```

- [ ] **Step 4: 提交**

```bash
git add package.json package-lock.json types.ts
git commit -m "feat: add ffmpeg.wasm deps and VIDEO_EDITOR app mode"
```

---

## Task 2: useFFmpeg hook

**Files:**
- Create: `components/video/useFFmpeg.ts`

- [ ] **Step 1: 创建目录并新建 hook 文件**

```bash
mkdir -p /Users/zhaoxiaoming/AndroidProjects/Ai-Tools/components/video
```

新建 `components/video/useFFmpeg.ts`：

```typescript
import { useState, useRef, useCallback } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

export interface UseFFmpegReturn {
  ffmpeg: FFmpeg | null;
  isLoading: boolean;
  isReady: boolean;
  progress: number;
  load: () => Promise<void>;
  run: (args: string[]) => Promise<void>;
  writeFile: (name: string, data: Uint8Array | File) => Promise<void>;
  readFile: (name: string) => Promise<Uint8Array>;
  deleteFile: (name: string) => Promise<void>;
}

export const useFFmpeg = (): UseFFmpegReturn => {
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [progress, setProgress] = useState(0);

  const load = useCallback(async () => {
    if (isReady || isLoading) return;
    setIsLoading(true);
    try {
      const ffmpeg = new FFmpeg();
      ffmpegRef.current = ffmpeg;

      ffmpeg.on('progress', ({ progress: p }) => {
        setProgress(Math.round(p * 100));
      });

      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      setIsReady(true);
    } finally {
      setIsLoading(false);
    }
  }, [isReady, isLoading]);

  const run = useCallback(async (args: string[]) => {
    const ffmpeg = ffmpegRef.current;
    if (!ffmpeg || !isReady) throw new Error('FFmpeg 尚未加载');
    setProgress(0);
    await ffmpeg.exec(args);
  }, [isReady]);

  const writeFile = useCallback(async (name: string, data: Uint8Array | File) => {
    const ffmpeg = ffmpegRef.current;
    if (!ffmpeg) throw new Error('FFmpeg 尚未加载');
    if (data instanceof File) {
      await ffmpeg.writeFile(name, await fetchFile(data));
    } else {
      await ffmpeg.writeFile(name, data);
    }
  }, []);

  const readFile = useCallback(async (name: string): Promise<Uint8Array> => {
    const ffmpeg = ffmpegRef.current;
    if (!ffmpeg) throw new Error('FFmpeg 尚未加载');
    const data = await ffmpeg.readFile(name);
    return data as Uint8Array;
  }, []);

  const deleteFile = useCallback(async (name: string) => {
    const ffmpeg = ffmpegRef.current;
    if (!ffmpeg) return;
    await ffmpeg.deleteFile(name);
  }, []);

  return {
    ffmpeg: ffmpegRef.current,
    isLoading,
    isReady,
    progress,
    load,
    run,
    writeFile,
    readFile,
    deleteFile,
  };
};
```

- [ ] **Step 2: 提交**

```bash
git add components/video/useFFmpeg.ts
git commit -m "feat: add useFFmpeg hook with load/run/progress support"
```

---

## Task 3: VideoEditorView 主容器

**Files:**
- Create: `components/VideoEditorView.tsx`

- [ ] **Step 1: 新建 `components/VideoEditorView.tsx`**

```typescript
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
        </div>
      </div>

      {/* 工作区 */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'trim' && (
          <VideoTrimView ffmpegState={ffmpegState} />
        )}
        {activeTab === 'merge' && (
          <VideoMergeView ffmpegState={ffmpegState} />
        )}
      </div>
    </div>
  );
};

export default VideoEditorView;
```

- [ ] **Step 2: 提交**

```bash
git add components/VideoEditorView.tsx
git commit -m "feat: add VideoEditorView container with sub-navigation and FFmpeg status"
```

---

## Task 4: VideoTrimView — 布局骨架与视频上传

**Files:**
- Create: `components/video/VideoTrimView.tsx`

- [ ] **Step 1: 新建 `components/video/VideoTrimView.tsx`，实现上传和播放器骨架**

```typescript
import React, { useState, useRef, useEffect } from 'react';
import {
  Upload, Play, Pause, SkipBack, SkipForward,
  Plus, Trash2, Save, Loader2
} from 'lucide-react';
import { UseFFmpegReturn } from './useFFmpeg';
import { VideoSubtitle } from '../../types';

interface VideoTrimViewProps {
  ffmpegState: UseFFmpegReturn;
}

type PanelTab = 'trim' | 'subtitle' | 'filter' | 'export';

export interface VideoFilters {
  brightness: number; // eq filter: -1.0 to 1.0, default 0
  contrast: number;   // eq filter: -1000 to 1000, default 1
  saturation: number; // eq filter: 0 to 3, default 1
  hue: number;        // hue filter: -180 to 180, default 0
}

const DEFAULT_FILTERS: VideoFilters = {
  brightness: 0,
  contrast: 1,
  saturation: 1,
  hue: 0,
};

const VideoTrimView: React.FC<VideoTrimViewProps> = ({ ffmpegState }) => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [panelTab, setPanelTab] = useState<PanelTab>('trim');
  const [subtitles, setSubtitles] = useState<VideoSubtitle[]>([]);
  const [activeSubtitleId, setActiveSubtitleId] = useState<string | null>(null);
  const [filters, setFilters] = useState<VideoFilters>(DEFAULT_FILTERS);
  const [outputFormat, setOutputFormat] = useState<'mp4' | 'webm' | 'gif' | 'mp3'>('mp4');
  const [outputResolution, setOutputResolution] = useState<'original' | '720p' | '1080p'>('original');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const handleFileChange = (file: File) => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    const url = URL.createObjectURL(file);
    setVideoFile(file);
    setVideoUrl(url);
    setStartTime(0);
    setEndTime(0);
    setCurrentTime(0);
    setSubtitles([]);
    setFilters(DEFAULT_FILTERS);
    setExportError(null);
  };

  const handleVideoLoaded = () => {
    const video = videoRef.current;
    if (!video) return;
    setDuration(video.duration);
    setEndTime(video.duration);
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);
    if (video.currentTime >= endTime) {
      video.pause();
      setIsPlaying(false);
    }
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      if (video.currentTime >= endTime) video.currentTime = startTime;
      video.play();
      setIsPlaying(true);
    }
  };

  const seekTo = (time: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = time;
    setCurrentTime(time);
  };

  const formatTime = (s: number): string => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const parseTime = (str: string): number => {
    const parts = str.split(':').map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return Number(str) || 0;
  };

  // 时间轴点击 seek
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || duration === 0) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    seekTo(pct * duration);
  };

  // 时间轴把手拖拽
  const handleHandleDrag = (
    type: 'start' | 'end',
    e: React.MouseEvent<HTMLDivElement>
  ) => {
    e.preventDefault();
    const timeline = timelineRef.current;
    if (!timeline || duration === 0) return;
    const onMouseMove = (moveEvent: MouseEvent) => {
      const rect = timeline.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (moveEvent.clientX - rect.left) / rect.width));
      const t = pct * duration;
      if (type === 'start') setStartTime(Math.min(t, endTime - 0.5));
      else setEndTime(Math.max(t, startTime + 0.5));
    };
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // 字幕管理
  const addSubtitle = () => {
    const sub: VideoSubtitle = {
      id: Math.random().toString(36).slice(2),
      text: '字幕文字',
      startTime: Math.floor(startTime),
      endTime: Math.min(Math.floor(startTime) + 3, Math.floor(endTime)),
      fontSize: 32,
      color: '#ffffff',
    };
    setSubtitles(prev => [...prev, sub]);
    setActiveSubtitleId(sub.id);
  };

  const updateSubtitle = (id: string, updates: Partial<VideoSubtitle>) => {
    setSubtitles(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const removeSubtitle = (id: string) => {
    setSubtitles(prev => prev.filter(s => s.id !== id));
    if (activeSubtitleId === id) setActiveSubtitleId(null);
  };

  const activeSubtitle = subtitles.find(s => s.id === activeSubtitleId);

  // 构建 FFmpeg 命令并导出
  const handleExport = async () => {
    if (!videoFile || !ffmpegState.isReady) return;
    setExporting(true);
    setExportError(null);
    try {
      await ffmpegState.writeFile('input.mp4', videoFile);

      const vfFilters: string[] = [];

      // 滤镜
      const hasFilter =
        filters.brightness !== 0 ||
        filters.contrast !== 1 ||
        filters.saturation !== 1 ||
        filters.hue !== 0;
      if (hasFilter) {
        vfFilters.push(
          `eq=brightness=${filters.brightness}:contrast=${filters.contrast}:saturation=${filters.saturation}`
        );
        if (filters.hue !== 0) vfFilters.push(`hue=h=${filters.hue}`);
      }

      // 字幕 drawtext
      subtitles.forEach(sub => {
        const escapedText = sub.text.replace(/'/g, "\\'").replace(/:/g, '\\:');
        vfFilters.push(
          `drawtext=text='${escapedText}':fontsize=${sub.fontSize}:fontcolor=${sub.color}:x=(w-tw)/2:y=h-th-30:enable='between(t,${sub.startTime},${sub.endTime})'`
        );
      });

      // 分辨率
      if (outputResolution === '720p') vfFilters.push('scale=-2:720');
      if (outputResolution === '1080p') vfFilters.push('scale=-2:1080');

      const args: string[] = ['-i', 'input.mp4'];

      // 剪裁
      if (startTime > 0 || endTime < duration) {
        args.push('-ss', String(startTime.toFixed(3)), '-to', String(endTime.toFixed(3)));
      }

      const ext = outputFormat;
      const outputName = `output.${ext}`;

      if (outputFormat === 'gif') {
        const gifScale = outputResolution === '720p' ? '720' : outputResolution === '1080p' ? '1080' : '480';
        vfFilters.push(`fps=15,scale=${gifScale}:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`);
        args.push('-vf', vfFilters.join(','));
      } else if (outputFormat === 'mp3') {
        args.push('-vn', '-acodec', 'libmp3lame', '-q:a', '2');
      } else {
        if (vfFilters.length > 0) args.push('-vf', vfFilters.join(','));
        if (outputFormat === 'mp4') args.push('-c:v', 'libx264', '-crf', '23', '-preset', 'fast');
      }

      args.push(outputName);
      await ffmpegState.run(args);

      const data = await ffmpegState.readFile(outputName);
      const mimeMap = { mp4: 'video/mp4', webm: 'video/webm', gif: 'image/gif', mp3: 'audio/mpeg' };
      const blob = new Blob([data], { type: mimeMap[outputFormat] });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `edited_${Date.now()}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);

      await ffmpegState.deleteFile('input.mp4');
      await ffmpegState.deleteFile(outputName);
    } catch (err: any) {
      setExportError(err.message ?? '导出失败');
    } finally {
      setExporting(false);
    }
  };

  const startPct = duration > 0 ? (startTime / duration) * 100 : 0;
  const endPct = duration > 0 ? (endTime / duration) * 100 : 100;
  const currentPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="h-full flex flex-col md:flex-row bg-[#f8fafc]">
      {/* 中：预览区 */}
      <div className="flex-1 flex flex-col overflow-hidden p-6 gap-4">
        {!videoUrl ? (
          <div className="flex-1 flex items-center justify-center">
            <label className="cursor-pointer flex flex-col items-center gap-4 p-12 border-2 border-dashed border-slate-300 rounded-2xl hover:border-indigo-400 transition-colors bg-white">
              <Upload className="w-12 h-12 text-slate-400" />
              <span className="text-sm font-medium text-slate-600">点击或拖拽上传视频</span>
              <span className="text-xs text-slate-400">支持 MP4、WebM、MOV 等格式</span>
              <input
                type="file"
                accept="video/*"
                className="hidden"
                onChange={e => e.target.files?.[0] && handleFileChange(e.target.files[0])}
              />
            </label>
          </div>
        ) : (
          <>
            {/* 播放器 */}
            <div className="flex-1 bg-black rounded-xl overflow-hidden flex items-center justify-center">
              <video
                ref={videoRef}
                src={videoUrl}
                onLoadedMetadata={handleVideoLoaded}
                onTimeUpdate={handleTimeUpdate}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                className="max-w-full max-h-full"
              />
            </div>

            {/* 播放控制 */}
            <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-slate-200">
              <button onClick={() => seekTo(startTime)} className="p-1.5 text-slate-600 hover:text-indigo-600 transition-colors">
                <SkipBack className="w-4 h-4" />
              </button>
              <button onClick={togglePlay} className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
              </button>
              <button onClick={() => seekTo(endTime)} className="p-1.5 text-slate-600 hover:text-indigo-600 transition-colors">
                <SkipForward className="w-4 h-4" />
              </button>
              <span className="text-xs text-slate-500 ml-2 font-mono">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            {/* 时间轴 */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div
                ref={timelineRef}
                onClick={handleTimelineClick}
                className="relative h-8 bg-slate-100 rounded-lg cursor-pointer overflow-visible"
              >
                {/* 选中范围 */}
                <div
                  className="absolute top-0 h-full bg-indigo-200 rounded-lg"
                  style={{ left: `${startPct}%`, width: `${endPct - startPct}%` }}
                />
                {/* 播放头 */}
                <div
                  className="absolute top-0 w-0.5 h-full bg-indigo-600 pointer-events-none"
                  style={{ left: `${currentPct}%` }}
                />
                {/* 入点把手 */}
                <div
                  onMouseDown={e => handleHandleDrag('start', e)}
                  className="absolute top-0 w-3 h-full bg-indigo-600 rounded-l-lg cursor-ew-resize z-10 flex items-center justify-center"
                  style={{ left: `${startPct}%`, transform: 'translateX(-50%)' }}
                />
                {/* 出点把手 */}
                <div
                  onMouseDown={e => handleHandleDrag('end', e)}
                  className="absolute top-0 w-3 h-full bg-indigo-600 rounded-r-lg cursor-ew-resize z-10"
                  style={{ left: `${endPct}%`, transform: 'translateX(-50%)' }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>{formatTime(0)}</span>
                <span className="text-indigo-600 font-medium">
                  选中 {formatTime(endTime - startTime)}
                </span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 右：参数面板 */}
      <div className="w-full md:w-80 border-l border-slate-200 bg-white flex flex-col shrink-0">
        {/* Panel tab */}
        <div className="flex border-b border-slate-200 overflow-x-auto no-scrollbar">
          {(['trim', 'subtitle', 'filter', 'export'] as PanelTab[]).map(tab => {
            const labels: Record<PanelTab, string> = { trim: '微调', subtitle: '字幕', filter: '滤镜', export: '导出' };
            return (
              <button
                key={tab}
                onClick={() => setPanelTab(tab)}
                className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-tighter transition-all border-b-2 ${
                  panelTab === tab ? 'bg-indigo-50 text-indigo-600 border-indigo-600' : 'text-slate-600 border-transparent hover:text-slate-900'
                }`}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 微调 tab */}
          {panelTab === 'trim' && (
            <div className="space-y-5">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">入点 / 出点</h4>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">入点 (mm:ss)</label>
                  <input
                    type="text"
                    value={formatTime(startTime)}
                    onChange={e => {
                      const t = parseTime(e.target.value);
                      if (!isNaN(t) && t < endTime) setStartTime(Math.max(0, t));
                    }}
                    className="w-full bg-slate-100 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">出点 (mm:ss)</label>
                  <input
                    type="text"
                    value={formatTime(endTime)}
                    onChange={e => {
                      const t = parseTime(e.target.value);
                      if (!isNaN(t) && t > startTime) setEndTime(Math.min(duration, t));
                    }}
                    className="w-full bg-slate-100 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 font-mono"
                  />
                </div>
                <div className="p-3 bg-indigo-50 rounded-lg text-xs text-indigo-700 font-medium">
                  选中时长：{formatTime(endTime - startTime)}
                </div>
              </div>
              <button
                onClick={() => { seekTo(startTime); if (videoRef.current) { videoRef.current.play(); setIsPlaying(true); } }}
                disabled={!videoUrl}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                预览选中片段
              </button>
            </div>
          )}

          {/* 字幕 tab */}
          {panelTab === 'subtitle' && (
            <div className="space-y-4">
              <button
                onClick={addSubtitle}
                disabled={!videoUrl}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> 添加字幕
              </button>
              <div className="space-y-2">
                {subtitles.map(sub => (
                  <div
                    key={sub.id}
                    onClick={() => setActiveSubtitleId(sub.id)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      activeSubtitleId === sub.id ? 'bg-indigo-600/10 border-indigo-500' : 'bg-white border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    <span className="text-xs text-slate-800 truncate pr-2">{sub.text}</span>
                    <button
                      onClick={e => { e.stopPropagation(); removeSubtitle(sub.id); }}
                      className="text-slate-400 hover:text-red-500 transition-colors shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              {activeSubtitle && (
                <div className="pt-4 border-t border-slate-200 space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">文字内容</label>
                    <input
                      type="text"
                      value={activeSubtitle.text}
                      onChange={e => updateSubtitle(activeSubtitle.id, { text: e.target.value })}
                      className="w-full bg-slate-100 border border-slate-300 rounded-lg p-2 text-xs text-slate-800"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase">开始 (s)</label>
                      <input
                        type="number"
                        value={activeSubtitle.startTime}
                        min={0}
                        max={activeSubtitle.endTime - 0.5}
                        step={0.5}
                        onChange={e => updateSubtitle(activeSubtitle.id, { startTime: Number(e.target.value) })}
                        className="w-full bg-slate-100 border border-slate-300 rounded-lg p-2 text-xs text-slate-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase">结束 (s)</label>
                      <input
                        type="number"
                        value={activeSubtitle.endTime}
                        min={activeSubtitle.startTime + 0.5}
                        max={duration}
                        step={0.5}
                        onChange={e => updateSubtitle(activeSubtitle.id, { endTime: Number(e.target.value) })}
                        className="w-full bg-slate-100 border border-slate-300 rounded-lg p-2 text-xs text-slate-800"
                      />
                    </div>
                  </div>
                  <VideoSlider
                    label="字号"
                    value={activeSubtitle.fontSize}
                    min={12}
                    max={120}
                    onChange={v => updateSubtitle(activeSubtitle.id, { fontSize: v })}
                  />
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">颜色</label>
                    <input
                      type="color"
                      value={activeSubtitle.color}
                      onChange={e => updateSubtitle(activeSubtitle.id, { color: e.target.value })}
                      className="w-full h-8 rounded-lg bg-transparent border border-slate-300 cursor-pointer p-0"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 滤镜 tab */}
          {panelTab === 'filter' && (
            <div className="space-y-6">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">色彩调节</h4>
              <VideoSlider
                label="亮度"
                value={filters.brightness}
                min={-1}
                max={1}
                step={0.05}
                display={v => v.toFixed(2)}
                onChange={v => setFilters(p => ({ ...p, brightness: v }))}
              />
              <VideoSlider
                label="对比度"
                value={filters.contrast}
                min={0}
                max={3}
                step={0.05}
                display={v => v.toFixed(2)}
                onChange={v => setFilters(p => ({ ...p, contrast: v }))}
              />
              <VideoSlider
                label="饱和度"
                value={filters.saturation}
                min={0}
                max={3}
                step={0.05}
                display={v => v.toFixed(2)}
                onChange={v => setFilters(p => ({ ...p, saturation: v }))}
              />
              <VideoSlider
                label="色调偏移"
                value={filters.hue}
                min={-180}
                max={180}
                step={1}
                display={v => `${v}°`}
                onChange={v => setFilters(p => ({ ...p, hue: v }))}
              />
              <button
                onClick={() => setFilters(DEFAULT_FILTERS)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                重置滤镜
              </button>
            </div>
          )}

          {/* 导出 tab */}
          {panelTab === 'export' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">输出格式</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['mp4', 'webm', 'gif', 'mp3'] as const).map(fmt => (
                    <button
                      key={fmt}
                      onClick={() => setOutputFormat(fmt)}
                      className={`py-2 rounded-lg text-xs font-bold border transition-all ${
                        outputFormat === fmt ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400'
                      }`}
                    >
                      {fmt.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {outputFormat !== 'mp3' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">分辨率</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['original', '720p', '1080p'] as const).map(res => (
                      <button
                        key={res}
                        onClick={() => setOutputResolution(res)}
                        className={`py-2 rounded-lg text-xs font-bold border transition-all ${
                          outputResolution === res ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400'
                        }`}
                      >
                        {res === 'original' ? '原始' : res}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {exportError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
                  {exportError}
                </div>
              )}

              <button
                onClick={handleExport}
                disabled={!videoUrl || !ffmpegState.isReady || exporting}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-2xl flex items-center justify-center gap-3 font-bold shadow-xl transition-all"
              >
                {exporting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    导出中 {ffmpegState.progress}%
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    开始导出
                  </>
                )}
              </button>

              {exporting && (
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 transition-all duration-300"
                    style={{ width: `${ffmpegState.progress}%` }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const VideoSlider: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  display?: (v: number) => string;
  onChange: (v: number) => void;
}> = ({ label, value, min, max, step = 1, display, onChange }) => (
  <div className="space-y-2">
    <div className="flex justify-between text-[10px] font-medium">
      <span className="text-slate-500">{label}</span>
      <span className="text-indigo-600">{display ? display(value) : value}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={e => onChange(parseFloat(e.target.value))}
      className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
    />
  </div>
);

export default VideoTrimView;
```

- [ ] **Step 2: 提交**

```bash
git add components/video/VideoTrimView.tsx
git commit -m "feat: add VideoTrimView with trim/subtitle/filter/export panels"
```

---

## Task 5: VideoMergeView

**Files:**
- Create: `components/video/VideoMergeView.tsx`

- [ ] **Step 1: 新建 `components/video/VideoMergeView.tsx`**

```typescript
import React, { useState, useRef } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, Save, Loader2, GripVertical } from 'lucide-react';
import { UseFFmpegReturn } from './useFFmpeg';

interface VideoMergeViewProps {
  ffmpegState: UseFFmpegReturn;
}

interface VideoItem {
  id: string;
  file: File;
  url: string;
  name: string;
}

const VideoMergeView: React.FC<VideoMergeViewProps> = ({ ffmpegState }) => {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [outputFormat, setOutputFormat] = useState<'mp4' | 'webm'>('mp4');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const dragItemId = useRef<string | null>(null);

  const addVideos = (files: FileList) => {
    const newItems: VideoItem[] = Array.from(files).map(file => ({
      id: Math.random().toString(36).slice(2),
      file,
      url: URL.createObjectURL(file),
      name: file.name,
    }));
    setVideos(prev => [...prev, ...newItems]);
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

  // 拖拽排序
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
    try {
      // 写入所有视频文件
      for (let i = 0; i < videos.length; i++) {
        await ffmpegState.writeFile(`input_${i}.mp4`, videos[i].file);
      }

      // 生成 concat list 文件内容
      const listContent = videos
        .map((_, i) => `file 'input_${i}.mp4'`)
        .join('\n');
      const listBytes = new TextEncoder().encode(listContent);
      await ffmpegState.writeFile('list.txt', listBytes);

      const outputName = `output.${outputFormat}`;
      await ffmpegState.run([
        '-f', 'concat',
        '-safe', '0',
        '-i', 'list.txt',
        '-c', 'copy',
        outputName,
      ]);

      const data = await ffmpegState.readFile(outputName);
      const mimeMap = { mp4: 'video/mp4', webm: 'video/webm' };
      const blob = new Blob([data], { type: mimeMap[outputFormat] });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `merged_${Date.now()}.${outputFormat}`;
      a.click();
      URL.revokeObjectURL(url);

      // 清理 FFmpeg 虚拟文件系统
      for (let i = 0; i < videos.length; i++) {
        await ffmpegState.deleteFile(`input_${i}.mp4`);
      }
      await ffmpegState.deleteFile('list.txt');
      await ffmpegState.deleteFile(outputName);
    } catch (err: any) {
      setExportError(err.message ?? '合并失败');
    } finally {
      setExporting(false);
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
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">输出格式</label>
          <div className="grid grid-cols-2 gap-2">
            {(['mp4', 'webm'] as const).map(fmt => (
              <button
                key={fmt}
                onClick={() => setOutputFormat(fmt)}
                className={`py-2 rounded-lg text-xs font-bold border transition-all ${
                  outputFormat === fmt ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                {fmt.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

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
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                合并中 {ffmpegState.progress}%
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                开始合并导出
              </>
            )}
          </button>

          {exporting && (
            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 transition-all duration-300"
                style={{ width: `${ffmpegState.progress}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoMergeView;
```

- [ ] **Step 2: 提交**

```bash
git add components/video/VideoMergeView.tsx
git commit -m "feat: add VideoMergeView with drag-sort and concat export"
```

---

## Task 6: 接入 App.tsx 导航

**Files:**
- Modify: `App.tsx`

- [ ] **Step 1: 在 `App.tsx` 顶部 import 区新增以下两行**

在 `import AITextToolsView` 之后添加：

```typescript
import VideoEditorView from './components/VideoEditorView';
import { Clapperboard } from 'lucide-react';
```

同时在已有的 lucide-react import 中已有 `Clapperboard`（如果没有，在 `App.tsx` 第 3 行的 lucide-react import 里追加 `Clapperboard`）。

- [ ] **Step 2: 在左侧导航 AI 文本工具 NavButton 之后添加视频编辑导航项**

在 `App.tsx` 的 AI_TEXT_TOOLS `NavButton` 的 `</div>` 之后、`mt-auto` 的 `<div>` 之前插入：

```tsx
        <div className="p-4 border-b border-slate-200">
          <NavButton
            active={mode === AppMode.VIDEO_EDITOR}
            icon={<Clapperboard />}
            label="视频编辑"
            onClick={() => setMode(AppMode.VIDEO_EDITOR)}
          />
        </div>
```

- [ ] **Step 3: 在 `<div className="flex-1 overflow-hidden">` 区块末尾添加视频编辑渲染**

在 `{mode === AppMode.AI_TEXT_TOOLS && <AITextToolsView />}` 之后添加：

```tsx
          {mode === AppMode.VIDEO_EDITOR && (
            <VideoEditorView />
          )}
```

- [ ] **Step 4: 启动开发服务器验证页面能正常渲染**

```bash
cd /Users/zhaoxiaoming/AndroidProjects/Ai-Tools
npm run dev
```

访问 `http://localhost:3000`，点击左侧"视频编辑"，确认：
- 子导航 [剪辑编辑] [合并] 正常显示
- FFmpeg 开始加载（顶部显示"FFmpeg 加载中..."）
- 加载完成后显示"FFmpeg 就绪"
- 剪辑编辑区显示上传视频的拖拽区域
- 合并页显示素材列表和添加按钮

- [ ] **Step 5: 提交**

```bash
git add App.tsx
git commit -m "feat: add 视频编辑 entry to sidebar navigation"
```

---

## 自检报告

**Spec 覆盖：**
- ✅ 视频剪裁（入点/出点）— Task 4 微调 tab
- ✅ 多段视频合并 — Task 5 VideoMergeView
- ✅ 字幕/文字水印 — Task 4 字幕 tab（drawtext filter）
- ✅ 视频转码（MP4/WebM/GIF/MP3）— Task 4 导出 tab
- ✅ 调色/滤镜 — Task 4 滤镜 tab（eq + hue filter）
- ✅ 左侧独立导航项 — Task 6
- ✅ FFmpeg.wasm 技术方案 — Task 1-2
- ✅ useFFmpeg hook — Task 2
- ✅ AppMode.VIDEO_EDITOR — Task 1
- ✅ COOP/COEP 头 — vite.config.ts 已有，无需修改

**类型一致性：**
- `VideoSubtitle` 在 Task 1 的 `types.ts` 中定义，在 Task 4 的 `VideoTrimView.tsx` 中从 `../../types` 导入 ✅
- `UseFFmpegReturn` 在 Task 2 定义并 export，在 Task 3/4/5 中从 `./useFFmpeg` 导入 ✅
- `VideoFilters` 在 Task 4 内部定义，未跨文件使用 ✅
