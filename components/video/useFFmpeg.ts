import { useState, useRef, useCallback } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

export interface UseFFmpegReturn {
  ffmpeg: FFmpeg | null;
  isLoading: boolean;
  isReady: boolean;
  progress: number;
  error: string | null;
  load: () => Promise<void>;
  run: (args: string[], totalDurationSec?: number) => Promise<void>;
  cancel: () => void;
  writeFile: (name: string, data: Uint8Array | File) => Promise<void>;
  readFile: (name: string) => Promise<Uint8Array>;
  deleteFile: (name: string) => Promise<void>;
}

export const useFFmpeg = (): UseFFmpegReturn => {
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const isLoadingRef = useRef(false);
  const isReadyRef = useRef(false);
  const totalDurationRef = useRef<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (isReadyRef.current || isLoadingRef.current) return;
    isLoadingRef.current = true;
    setIsLoading(true);
    try {
      const ffmpeg = new FFmpeg();
      ffmpegRef.current = ffmpeg;

      ffmpeg.on('progress', ({ progress: p, time }) => {
        const total = totalDurationRef.current;
        if (total && total > 0) {
          // time 单位：微秒，total 单位：秒
          setProgress(Math.min(99, Math.round((time / 1e6 / total) * 100)));
        } else {
          setProgress(Math.min(99, Math.round(p * 100)));
        }
      });
      ffmpeg.on('log', ({ message }) => {
        console.log('[FFmpeg log]', message);
      });

      await ffmpeg.load({
        classWorkerURL: '/ffmpeg/worker.js',
        coreURL: '/ffmpeg/ffmpeg-core.js',
        wasmURL: '/ffmpeg/ffmpeg-core.wasm',
      });
      isReadyRef.current = true;
      setIsReady(true);
    } catch (err) {
      ffmpegRef.current = null;
      setError(err instanceof Error ? err.message : 'FFmpeg 加载失败');
      throw err;
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, []);

  const run = useCallback(async (args: string[], totalDurationSec?: number) => {
    const ffmpeg = ffmpegRef.current;
    if (!ffmpeg || !isReadyRef.current) throw new Error('FFmpeg 尚未加载');
    totalDurationRef.current = totalDurationSec ?? null;
    setProgress(0);
    try {
      const ret = await ffmpeg.exec(args);
      if (ret !== 0) throw new Error(`FFmpeg 执行失败（退出码 ${ret}），请检查参数`);
      setProgress(100);
    } finally {
      totalDurationRef.current = null;
    }
  }, []);

  const cancel = useCallback(() => {
    const ffmpeg = ffmpegRef.current;
    if (ffmpeg) {
      ffmpeg.terminate();
      ffmpegRef.current = null;
    }
    isReadyRef.current = false;
    isLoadingRef.current = false;
    totalDurationRef.current = null;
    setIsReady(false);
    setProgress(0);
  }, []);

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
    error,
    load,
    run,
    cancel,
    writeFile,
    readFile,
    deleteFile,
  };
};
