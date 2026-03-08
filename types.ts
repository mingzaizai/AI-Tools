
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
  SETTINGS = 'SETTINGS'
}

export interface ProcessingHistory {
  filters: ImageFilters;
  transform: ImageTransform;
  texts: TextOverlay[];
}
