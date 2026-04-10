# 视频编辑器设计文档

**日期**：2026-04-08  
**状态**：待实现

---

## 1. 背景与目标

在现有图片编辑模块的基础上，新增独立的视频编辑功能模块。目标是支持常见的视频处理操作，全部在浏览器本地完成，无需上传服务器。

**功能范围：**
- 视频剪裁（入点/出点掐头去尾）
- 多段视频合并
- 字幕/文字水印叠加
- 视频转码（MP4/WebM/GIF/MP3）
- 调色/滤镜

---

## 2. 技术方案

使用 **FFmpeg.wasm（@ffmpeg/ffmpeg）** 在浏览器 WebAssembly 环境中执行所有视频处理操作。

**选型理由：**
- 支持所有目标功能（剪裁、合并、字幕、转码、GIF、滤镜）
- 输出质量与本地 FFmpeg 一致
- 无需服务端，数据完全本地处理

**依赖：**
- `@ffmpeg/ffmpeg` — FFmpeg wasm 主包
- `@ffmpeg/util` — 文件读写工具函数

**注意事项：**
- wasm 核心文件约 30MB，首次加载需异步等待，需在 UI 中显示加载状态
- 需要 HTTP 响应头设置 `Cross-Origin-Embedder-Policy: require-corp` 和 `Cross-Origin-Opener-Policy: same-origin`（SharedArrayBuffer 依赖），需在 `vite.config.ts` 中配置开发服务器响应头

---

## 3. 整体结构

### 3.1 导航层

`App.tsx` 左侧新增"视频编辑"导航项，对应 `AppMode.VIDEO_EDITOR`，与"图片编辑"并列。

### 3.2 文件组织

```
components/
  VideoEditorView.tsx         # 主容器，管理 FFmpeg 实例、全局状态、子导航
  video/
    useFFmpeg.ts              # FFmpeg 初始化、命令执行、进度监听 hook
    VideoTrimView.tsx         # 剪辑编辑工作区
    VideoMergeView.tsx        # 合并工作区
```

### 3.3 子导航

进入视频编辑后顶部显示两个子 tab：**[剪辑编辑]** 和 **[合并]**。

---

## 4. 剪辑编辑工作区（VideoTrimView）

### 4.1 布局

两栏布局：中间预览区（flex-1）+ 右侧参数面板（w-80）。

```
┌────────────────────────┬───────────────────────────────────┐
│  中：预览区              │  右：参数面板                      │
│                        │  tab: [微调] [字幕] [滤镜] [导出]  │
│   <video> 播放器        │                                   │
│                        │  微调：入点/出点滑块 + 精确输入      │
│  时间轴：               │  字幕：字幕条列表管理               │
│  [██████░░░░░░░░░░]    │  滤镜：亮度/对比度/饱和度等         │
│   ↑入点        出点↑   │  导出：格式/质量/分辨率             │
│  00:00  当前  总时长    │                                   │
├────────────────────────┴───────────────────────────────────┤
│  底部：[上传视频]  FFmpeg 加载状态  导出进度条                 │
└────────────────────────────────────────────────────────────┘
```

### 4.2 时间轴

- 显示视频总时长，播放头随 `<video> currentTime` 实时移动
- 左把手拖拽 = 设置入点，右把手拖拽 = 设置出点
- 点击时间轴任意位置 = seek 到对应时间
- 入点/出点区域高亮显示选中范围

### 4.3 参数面板各 tab

**微调 tab**
- 入点时间输入框（hh:mm:ss 格式）
- 出点时间输入框
- 当前选中时长显示
- [预览选中片段] 按钮

**字幕 tab**
- [添加字幕] 按钮，每条字幕包含：文字内容、开始时间、结束时间、字号、颜色
- 字幕列表，支持编辑和删除
- 字幕通过 FFmpeg `drawtext` filter 烧录进视频

**滤镜 tab**
- 亮度、对比度、饱和度、色调滑块
- 复用 `FILTER_PRESETS` 常量中的预设（原图/电影感/黑白等），转换为 FFmpeg `eq` filter 参数

**导出 tab**
- 输出格式：MP4 / WebM / GIF / MP3（提取音频）
- 分辨率缩放：原始 / 720p / 1080p / 自定义
- 质量（CRF 值，仅 MP4/WebM）
- [开始导出] 按钮

### 4.4 FFmpeg 命令逻辑

**剪裁：**
```
ffmpeg -i input.mp4 -ss {startTime} -to {endTime} -c copy output.mp4
```

**字幕烧录（drawtext）：**
```
ffmpeg -i input.mp4 -vf "drawtext=text='{text}':fontsize={size}:fontcolor={color}:x=(w-tw)/2:y=h-th-10:enable='between(t,{start},{end})'" output.mp4
```

**滤镜（eq）：**
```
ffmpeg -i input.mp4 -vf "eq=brightness={b}:contrast={c}:saturation={s}" output.mp4
```

**转 GIF：**
```
ffmpeg -i input.mp4 -vf "fps=15,scale=480:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" output.gif
```

当多个操作同时存在时（剪裁+字幕+滤镜），合并为单条 FFmpeg 命令一次性处理，避免多次编解码损耗画质。

---

## 5. 合并工作区（VideoMergeView）

### 5.1 布局

两栏布局：左侧素材列表 + 右侧参数面板。

```
┌──────────────────────┬─────────────────────────────────────┐
│  左：素材列表          │  右：参数面板                        │
│                      │  排列顺序：拖拽素材卡片调整            │
│  1. video_a.mp4      │  过渡效果：无 / 淡入淡出              │
│  2. video_b.mp4      │  分辨率：以第一段为基准 / 自定义       │
│  + 添加视频           │  导出格式：MP4 / WebM                │
│                      │                                     │
│  预览区（合并效果）    │                                     │
├──────────────────────┴─────────────────────────────────────┤
│  底部：[开始合并导出]  进度条                                  │
└────────────────────────────────────────────────────────────┘
```

### 5.2 关键设计

- **排列顺序**：素材卡片支持鼠标拖拽排序（不引入第三方库，使用原生 dragstart/dragover/drop 事件）
- **分辨率对齐**：多段视频尺寸不一致时，以第一段为基准，其余通过 `scale + pad` 自动补黑边
- **合并命令**：使用 FFmpeg concat demuxer（生成 concat list 文件），比 `-filter_complex concat` 更高效

```
ffmpeg -f concat -safe 0 -i list.txt -c copy output.mp4
```

- 合并完成后结果可直接下载，不自动跳转

---

## 6. useFFmpeg hook

```typescript
interface UseFFmpegReturn {
  ffmpeg: FFmpeg | null;
  isLoading: boolean;       // wasm 正在加载
  isReady: boolean;         // wasm 加载完成可用
  progress: number;         // 0-100，当前命令执行进度
  run: (args: string[]) => Promise<void>;
  writeFile: (name: string, data: Uint8Array) => Promise<void>;
  readFile: (name: string) => Promise<Uint8Array>;
  deleteFile: (name: string) => Promise<void>;
}
```

- FFmpeg 实例在 `VideoEditorView` 层初始化一次，通过 props 传递给子组件，避免重复加载
- 进度通过 FFmpeg 的 `progress` 事件回调更新

---

## 7. AppMode 变更

`types.ts` 中 `AppMode` 枚举新增：
```typescript
VIDEO_EDITOR = 'VIDEO_EDITOR'
```

---

## 8. vite.config.ts 变更

开发服务器需添加 COOP/COEP 响应头以支持 SharedArrayBuffer（FFmpeg.wasm 依赖）：

```typescript
server: {
  headers: {
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Opener-Policy': 'same-origin',
  }
}
```

---

## 9. 不在本次范围内

- 音频波形可视化
- 关键帧动画
- 多轨道时间轴
- 视频速度调整
- 去背景/抠图
