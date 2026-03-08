
import { ImageFilters, ImageTransform } from './types';

export const DEFAULT_FILTERS: ImageFilters = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  exposure: 0,
  sepia: 0,
  blur: 0,
  grayscale: 0,
  hueRotate: 0,
  borderRadius: 0,
};

export const DEFAULT_TRANSFORM: ImageTransform = {
  rotate: 0,
  scaleX: 1,
  scaleY: 1,
  crop: { top: 0, left: 0, right: 0, bottom: 0 },
};

export interface FilterPreset {
  id: string;
  name: string;
  values: ImageFilters;
  description: string;
}

export const FILTER_PRESETS: FilterPreset[] = [
  {
    id: 'original',
    name: '原图',
    description: '保持照片原始风貌',
    values: { ...DEFAULT_FILTERS }
  },
  {
    id: 'cinematic',
    name: '电影感',
    description: '高对比度，冷暖对比强烈',
    values: { ...DEFAULT_FILTERS, contrast: 120, saturation: 110, exposure: -5, hueRotate: 10 }
  },
  {
    id: 'vintage',
    name: '复古胶片',
    description: '怀旧的暖黄色调',
    values: { ...DEFAULT_FILTERS, sepia: 40, contrast: 90, brightness: 105, saturation: 85 }
  },
  {
    id: 'noir',
    name: '黑白',
    description: '经典纯粹的黑白灰',
    values: { ...DEFAULT_FILTERS, grayscale: 100, contrast: 130, brightness: 90 }
  },
  {
    id: 'vibrant',
    name: '鲜艳',
    description: '色彩极度跳跃',
    values: { ...DEFAULT_FILTERS, saturation: 160, contrast: 110, brightness: 105 }
  },
  {
    id: 'fade',
    name: '褪色',
    description: '低饱和度的忧郁感',
    values: { ...DEFAULT_FILTERS, saturation: 60, contrast: 80, brightness: 110 }
  },
  {
    id: 'cool',
    name: '冷调',
    description: '清晨般的静谧蓝',
    values: { ...DEFAULT_FILTERS, hueRotate: 180, saturation: 90, sepia: 10 }
  },
  {
    id: 'warm',
    name: '暖阳',
    description: '午后阳光般的温柔',
    values: { ...DEFAULT_FILTERS, hueRotate: 340, saturation: 120, sepia: 20 }
  }
];

export const ASPECT_RATIOS = [
  { label: 'Original', value: null },
  { label: '1:1', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '3:4', value: 3 / 4 },
  { label: '16:9', value: 16 / 9 },
  { label: '9:16', value: 9 / 16 },
];
