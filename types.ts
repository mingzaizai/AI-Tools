
export interface ImageData {
  id: string;
  file: File;
  preview: string;
  width: number;
  height: number;
  lastModified: number;
  size: number;
}

export interface TextOverlay {
  id: string;
  text: string;
  x: number; // 0-100 percentage
  y: number; // 0-100 percentage
  fontSize: number;
  color: string;
  rotation: number; // 0-360
  fontWeight: string;
}

export interface ImageFilters {
  brightness: number;
  contrast: number;
  saturation: number;
  exposure: number;
  sepia: number;
  blur: number;
  grayscale: number;
  hueRotate: number;
  borderRadius: number;
}

export interface ImageTransform {
  rotate: number;
  scaleX: number;
  scaleY: number;
  // 剪切范围：相对于原图尺寸的百分比 (0-100)
  crop: {
    top: number;
    left: number;
    right: number;
    bottom: number;
  };
}

export enum AppMode {
  LIBRARY = 'LIBRARY',
  EDITOR = 'EDITOR',
  BATCH = 'BATCH',
  MERGE = 'MERGE',
  JSON_EDIT = 'JSON_EDIT',
  SETTINGS = 'SETTINGS',
  SQL_EDITOR = 'SQL_EDITOR',
  ENCODING_TOOLS = 'ENCODING_TOOLS',
  TIME_TOOLS = 'TIME_TOOLS',
  NETWORK_TOOLS = 'NETWORK_TOOLS',
  MARKDOWN_EDITOR = 'MARKDOWN_EDITOR',
  GITHUB_SEARCH = 'GITHUB_SEARCH',
  AI_TEXT_TOOLS = 'AI_TEXT_TOOLS',
  VIDEO_EDITOR = 'VIDEO_EDITOR'
}

// 数据库相关类型
export interface TableInfo {
  name: string;
  columns: ColumnInfo[];
  rowCount: number;
}

export interface ColumnInfo {
  name: string;
  type: string;
  notNull: boolean;
  defaultValue: string | null;
  primaryKey: boolean;
}

export interface QueryResult {
  columns: string[];
  values: any[][];
}

export interface SQLError {
  message: string;
  code?: number;
}

export interface ProcessingHistory {
  filters: ImageFilters;
  transform: ImageTransform;
  texts: TextOverlay[];
}

// GitHub 检索相关类型
export interface GitHubRepo {
  id: number;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  updated_at: string;
  license: { spdx_id: string } | null;
  owner: { login: string; avatar_url: string };
}

export interface SearchParams {
  query: string;
  language: string;
  minStars: '' | '100' | '1000' | '10000';
  sort: 'stars' | 'updated' | 'best-match'; // best-match 时 API 不传 sort 参数
}

export interface VideoSubtitle {
  id: string;
  text: string;
  startTime: number; // 秒
  endTime: number;   // 秒
  fontSize: number;
  x: number; // 0-100，水平位置百分比，50 = 居中
  y: number; // 0-100，垂直位置百分比，90 = 靠底部
  color: string;
}
