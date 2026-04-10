import React, { useState, useRef, useEffect } from 'react';
import {
  Upload, Play, Pause, SkipBack, SkipForward,
  Plus, Trash2, Save, Loader2, StopCircle, FolderOpen
} from 'lucide-react';
import { UseFFmpegReturn } from './useFFmpeg';
import { VideoSubtitle } from '../../types';

interface VideoTrimViewProps {
  ffmpegState: UseFFmpegReturn;
}

type PanelTab = 'trim' | 'subtitle' | 'filter' | 'export';

interface VideoFilters {
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
}

const DEFAULT_FILTERS: VideoFilters = {
  brightness: 1,
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
  const [outputFormat, setOutputFormat] = useState<'mp4' | 'gif' | 'mp3'>('mp4');
  const [outputResolution, setOutputResolution] = useState<'original' | '720p' | '1080p'>('original');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);

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
      video.play().catch(() => setIsPlaying(false));
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

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || duration === 0) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    seekTo(pct * duration);
  };

  const handleHandleDrag = (type: 'start' | 'end', e: React.MouseEvent<HTMLDivElement>) => {
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

  const addSubtitle = () => {
    const sub: VideoSubtitle = {
      id: Math.random().toString(36).slice(2),
      text: '字幕文字',
      startTime: Math.floor(startTime),
      endTime: Math.min(Math.floor(startTime) + 3, Math.floor(endTime)),
      fontSize: 32,
      color: '#ffffff',
      x: 50,
      y: 90,
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

  const handleExport = async () => {
    if (!videoFile || !ffmpegState.isReady) return;
    setExporting(true);
    setExportError(null);
    const inputExt = videoFile.name.split('.').pop()?.toLowerCase() || 'mp4';
    const inputName = `input.${inputExt}`;
    const ext = outputFormat;
    const outputName = `output.${ext}`;
    let fontLoaded = false;
    try {
      await ffmpegState.writeFile(inputName, videoFile);

      const vfFilters: string[] = [];

      const hasFilter =
        filters.brightness !== 1 ||
        filters.contrast !== 1 ||
        filters.saturation !== 1 ||
        filters.hue !== 0;
      if (hasFilter) {
        // colorchannelmixer 做亮度乘法，与 CSS brightness() 语义一致
        if (filters.brightness !== 1) {
          const b = filters.brightness.toFixed(3);
          vfFilters.push(`colorchannelmixer=${b}:0:0:0:0:${b}:0:0:0:0:${b}:0`);
        }
        if (filters.contrast !== 1 || filters.saturation !== 1) {
          vfFilters.push(`eq=contrast=${filters.contrast}:saturation=${filters.saturation}`);
        }
        if (filters.hue !== 0) vfFilters.push(`hue=h=${filters.hue}`);
      }

      if (subtitles.length > 0) {
        // 加载本地 NotoSansSC 字体（支持中文）到 FFmpeg 虚拟 FS
        const fontResp = await fetch('/ffmpeg/NotoSansSC-Regular.otf');
        if (!fontResp.ok) throw new Error('字体文件加载失败');
        const fontData = new Uint8Array(await fontResp.arrayBuffer());
        await ffmpegState.writeFile('font.otf', fontData);
        fontLoaded = true;

        subtitles.forEach(sub => {
          const escapedText = sub.text.replace(/'/g, "\\'").replace(/:/g, '\\:');
          const xPos = sub.x === 50 ? '(w-tw)/2' : `w*${sub.x / 100}-tw/2`;
          const yPos = `h*${sub.y / 100}-th/2`;
          vfFilters.push(
            `drawtext=fontfile=font.otf:text='${escapedText}':fontsize=${sub.fontSize}:fontcolor=${sub.color}:x=${xPos}:y=${yPos}:enable='between(t,${sub.startTime},${sub.endTime})'`
          );
        });
      }

      if (outputResolution === '720p') vfFilters.push('scale=-2:720');
      if (outputResolution === '1080p') vfFilters.push('scale=-2:1080');

      const args: string[] = [];
      if (startTime > 0 || endTime < duration) {
        args.push('-ss', startTime.toFixed(3), '-to', endTime.toFixed(3));
      }
      args.push('-i', inputName);

      if (outputFormat === 'gif') {
        const gifScale = outputResolution === '720p' ? '720' : outputResolution === '1080p' ? '1080' : '480';
        args.push('-vf', `fps=15,scale=${gifScale}:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`);
        // GIF 不支持字幕/颜色滤镜叠加，vfFilters 在此分支忽略
      } else if (outputFormat === 'mp3') {
        args.push('-vn', '-acodec', 'libmp3lame', '-q:a', '2');
      } else {
        if (vfFilters.length > 0) args.push('-vf', vfFilters.join(','));
        if (outputFormat === 'mp4') args.push('-c:v', 'libx264', '-crf', '23', '-preset', 'fast');
      }

      args.push(outputName);
      const clipDuration = endTime - startTime;
      await ffmpegState.run(args, clipDuration);

      const data = await ffmpegState.readFile(outputName);
      const mimeMap = { mp4: 'video/mp4', gif: 'image/gif', mp3: 'audio/mpeg' };
      const blob = new Blob([data], { type: mimeMap[outputFormat] });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `edited_${Date.now()}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      const msg: string = err.message ?? '导出失败';
      // terminate() 产生的错误不作为导出失败展示
      if (!msg.includes('terminate') && !msg.includes('Terminated')) {
        setExportError(msg);
      }
    } finally {
      setExporting(false);
      try { await ffmpegState.deleteFile(inputName); } catch {}
      try { await ffmpegState.deleteFile(outputName); } catch {}
      if (fontLoaded) { try { await ffmpegState.deleteFile('font.otf'); } catch {} }
    }
  };

  const activeSubtitle = subtitles.find(s => s.id === activeSubtitleId);
  const startPct = duration > 0 ? (startTime / duration) * 100 : 0;
  const endPct = duration > 0 ? (endTime / duration) * 100 : 100;
  const currentPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="h-full flex flex-col md:flex-row bg-[#f8fafc]">
      {/* 中：预览区 */}
      <div className="flex-1 flex flex-col overflow-hidden p-6 gap-4">
        {!videoUrl ? (
          <div className="flex-1 flex items-center justify-center">
            <label
              className="cursor-pointer flex flex-col items-center gap-4 p-12 border-2 border-dashed border-slate-300 rounded-2xl hover:border-indigo-400 transition-colors bg-white"
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file && file.type.startsWith('video/')) handleFileChange(file);
              }}
            >
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
            <div className="flex-1 bg-black rounded-xl overflow-hidden flex items-center justify-center min-h-0 relative">
              <video
                ref={videoRef}
                src={videoUrl}
                onLoadedMetadata={handleVideoLoaded}
                onTimeUpdate={handleTimeUpdate}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                className="max-w-full max-h-full"
                style={{
                  filter: [
                    filters.brightness !== 1 ? `brightness(${filters.brightness})` : '',
                    filters.contrast !== 1 ? `contrast(${filters.contrast})` : '',
                    filters.saturation !== 1 ? `saturate(${filters.saturation})` : '',
                    filters.hue !== 0 ? `hue-rotate(${filters.hue}deg)` : '',
                  ].filter(Boolean).join(' ') || undefined,
                }}
              />
              {/* 字幕预览层 */}
              {subtitles
                .filter(sub => currentTime >= sub.startTime && currentTime <= sub.endTime)
                .map(sub => (
                  <div
                    key={sub.id}
                    className="absolute pointer-events-none"
                    style={{
                      left: `${sub.x}%`,
                      top: `${sub.y}%`,
                      transform: 'translate(-50%, -50%)',
                      fontSize: `${sub.fontSize * 0.6}px`,
                      color: sub.color,
                      textShadow: '0 1px 4px rgba(0,0,0,0.8)',
                      fontWeight: 'bold',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {sub.text}
                  </div>
                ))
              }
            </div>

            <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-slate-200 shrink-0">
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
              <div className="ml-auto flex items-center gap-2">
                <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                  <FolderOpen className="w-3.5 h-3.5" />
                  换一个
                  <input type="file" accept="video/*" className="hidden" onChange={e => e.target.files?.[0] && handleFileChange(e.target.files[0])} />
                </label>
                <button
                  onClick={() => {
                    if (videoUrl) URL.revokeObjectURL(videoUrl);
                    setVideoFile(null);
                    setVideoUrl(null);
                    setDuration(0);
                    setCurrentTime(0);
                    setStartTime(0);
                    setEndTime(0);
                    setSubtitles([]);
                    setFilters(DEFAULT_FILTERS);
                    setExportError(null);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  删除
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 shrink-0">
              <div
                ref={timelineRef}
                onClick={handleTimelineClick}
                className="relative h-8 bg-slate-100 rounded-lg cursor-pointer"
              >
                <div
                  className="absolute top-0 h-full bg-indigo-200 rounded-lg"
                  style={{ left: `${startPct}%`, width: `${endPct - startPct}%` }}
                />
                <div
                  className="absolute top-0 w-0.5 h-full bg-indigo-600 pointer-events-none"
                  style={{ left: `${currentPct}%` }}
                />
                <div
                  onMouseDown={e => handleHandleDrag('start', e)}
                  className="absolute top-0 w-3 h-full bg-indigo-600 rounded-l-lg cursor-ew-resize z-10"
                  style={{ left: `${startPct}%`, transform: 'translateX(-50%)' }}
                />
                <div
                  onMouseDown={e => handleHandleDrag('end', e)}
                  className="absolute top-0 w-3 h-full bg-indigo-600 rounded-r-lg cursor-ew-resize z-10"
                  style={{ left: `${endPct}%`, transform: 'translateX(-50%)' }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>{formatTime(0)}</span>
                <span className="text-indigo-600 font-medium">选中 {formatTime(endTime - startTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 右：参数面板 */}
      <div className="w-full md:w-80 border-l border-slate-200 bg-white flex flex-col shrink-0">
        <div className="flex border-b border-slate-200 overflow-x-auto">
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
                onClick={() => {
                  seekTo(startTime);
                  if (videoRef.current) { videoRef.current.play().catch(() => setIsPlaying(false)); setIsPlaying(true); }
                }}
                disabled={!videoUrl}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                预览选中片段
              </button>
            </div>
          )}

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
                  <VideoSlider label="字号" value={activeSubtitle.fontSize} min={12} max={120} onChange={v => updateSubtitle(activeSubtitle.id, { fontSize: v })} />
                  <VideoSlider label="水平位置" value={activeSubtitle.x} min={0} max={100} onChange={v => updateSubtitle(activeSubtitle.id, { x: v })} />
                  <VideoSlider label="垂直位置" value={activeSubtitle.y} min={0} max={100} onChange={v => updateSubtitle(activeSubtitle.id, { y: v })} />
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

          {panelTab === 'filter' && (
            <div className="space-y-6">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">色彩调节</h4>
              <VideoSlider label="亮度" value={filters.brightness} min={0} max={2} step={0.05} display={v => v.toFixed(2)} onChange={v => setFilters(p => ({ ...p, brightness: v }))} />
              <VideoSlider label="对比度" value={filters.contrast} min={0} max={3} step={0.05} display={v => v.toFixed(2)} onChange={v => setFilters(p => ({ ...p, contrast: v }))} />
              <VideoSlider label="饱和度" value={filters.saturation} min={0} max={3} step={0.05} display={v => v.toFixed(2)} onChange={v => setFilters(p => ({ ...p, saturation: v }))} />
              <VideoSlider label="色调偏移" value={filters.hue} min={-180} max={180} step={1} display={v => `${v}°`} onChange={v => setFilters(p => ({ ...p, hue: v }))} />
              <button onClick={() => setFilters(DEFAULT_FILTERS)} className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all">
                重置滤镜
              </button>
            </div>
          )}

          {panelTab === 'export' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">输出格式</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['mp4', 'gif', 'mp3'] as const).map(fmt => (
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
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">{exportError}</div>
              )}
              <button
                onClick={handleExport}
                disabled={!videoUrl || !ffmpegState.isReady || exporting}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-2xl flex items-center justify-center gap-3 font-bold shadow-xl transition-all"
              >
                {exporting ? (
                  <><Loader2 className="w-5 h-5 animate-spin" />导出中 {ffmpegState.progress}%</>
                ) : (
                  <><Save className="w-5 h-5" />开始导出</>
                )}
              </button>
              {exporting && (
                <>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${ffmpegState.progress}%` }} />
                  </div>
                  <button
                    onClick={() => {
                      ffmpegState.cancel();
                      setExporting(false);
                      setExportError(null);
                      ffmpegState.load();
                    }}
                    className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all"
                  >
                    <StopCircle className="w-4 h-4" />
                    停止导出
                  </button>
                </>
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
