# 🛠️ AI Tools - 开发者工具集

<p align="left">
  <img src="https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-blue?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-6.4-green?style=for-the-badge&logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/Version-1.0.2-blue?style=for-the-badge" alt="Version" />
</p>

> **AI Tools** 是一款面向开发者的多功能工具集，集成了二维码生成、时间转换、SQL 编辑、JSON 处理等实用工具，提升开发效率。

---

## 🎯 功能概览

### 📦 核心功能模块

#### 1. 🔗 网络工具
- **二维码生成器**：支持自定义内容和多种相框样式
  - 7 种相框样式：无边框、简约白框、圆角边框、渐变边框、双边框、虚线边框、拍立得
  - 实时预览
  - 一键下载 PNG 格式
  - 使用 api.qrserver.com 生成二维码

#### 2. ⏰ 时间工具
- **日期 → 时间戳**：可编辑文本框，支持多种格式
  - ISO 格式：2024-01-01T12:00:00
  - 中文格式：2024-01-01 12:00:00
  - 时间戳：1704110400
  - 同时输出秒级和毫秒级时间戳

- **时间戳 → 日期**：毫秒/秒级时间戳转换
  - 自动识别时间戳类型
  - 格式化输出为本地时间

- **日期格式化**：统一日期格式
  - 支持多种输入格式
  - 输出标准格式：YYYY-MM-DD HH:mm:ss

#### 3. 🗄️ SQL 编辑器
- **SQLite 数据库管理**：
  - 创建/打开数据库文件
  - 执行 SQL 查询语句
  - 可视化数据表格
  - 导出查询结果为 CSV
  - 支持数据库文件下载

- **预设数据库**：
  - 示例数据库（包含用户和产品数据）
  - 支持自定义 SQL 脚本

#### 4. 📄 JSON 编辑器
- **JSON 格式化**：美化 JSON 格式
- **JSON 压缩**：移除空格和换行
- **JSON 验证**：检查 JSON 语法
- **错误提示**：显示具体错误位置和类型

#### 5. 🧮 开发者工具
- **Base64 编解码**：文本与 Base64 互转
- **URL 编解码**：处理 URL 特殊字符
- **时间戳转换**：快速时间转换工具

---

## 🏗️ 技术架构

### 技术栈
- **前端框架**：React 19.2.3 + TypeScript 5.8.2
- **构建工具**：Vite 6.4.1
- **图标库**：Lucide React 0.562.0
- **数据库引擎**：sql.js 1.14.1 (SQLite WebAssembly 版本)
- **第三方 API**：qrserver.com (二维码生成)

### 项目结构
```
AI-Tools/
├── components/              # 组件目录
│   ├── Header.tsx          # 顶部导航栏
│   ├── TimeToolsView.tsx   # 时间工具视图
│   ├── NetworkToolsView.tsx # 网络工具视图（二维码生成）
│   ├── SQLEditorView.tsx   # SQL 编辑器视图
│   ├── JSONEditorView.tsx  # JSON 编辑器视图
│   └── DeveloperToolsView.tsx # 开发者工具视图
├── types.ts                 # 类型定义
├── App.tsx                  # 主应用组件
├── package.json             # 项目配置
└── versions/                # 版本记录目录
    ├── 1.0.0/              # v1.0.0 版本记录
    ├── 1.0.1/              # v1.0.1 版本记录
    └── 1.0.2/              # v1.0.2 版本记录（当前）
```

---

## 🚀 快速开始

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev
```

### 生产构建
```bash
npm run build
```

### 预览构建结果
```bash
npm run preview
```

---

## 📝 更新日志

### v1.0.2 (2026-03-22)

#### ✨ 新增功能
- **二维码相框样式**：新增 7 种相框样式供选择
  - 简约白框、圆角边框、渐变边框
  - 双边框、虚线边框、拍立得样式
- **日期输入优化**：时间工具的日期输入框改为可编辑文本框
  - 支持多种日期格式解析
  - 更灵活的输入体验

#### 🐛 问题修复
- 修复二维码下载跳转到 API 地址的问题
- 修复相框样式下载后不显示的问题
- 优化 Canvas 绘制逻辑，确保样式正确应用

#### 🔧 优化改进
- 移除未使用的"导出结果"按钮
- 移除霓虹背景和卡片样式（兼容性问题）
- 优化代码结构，提升可维护性

#### 📦 技术更新
- 升级 Vite 到 6.4.1
- 优化构建配置，提升构建速度

---

### v1.0.1
- 添加 SQL 编辑器功能
- 添加 JSON 编辑器功能
- 添加开发者工具（Base64、URL 编解码）

### v1.0.0
- 初始版本发布
- 包含图片编辑、AI 分析、批量处理等核心功能

---

## 🔧 开发指南

### 添加新工具模块

1. **创建组件文件**
```typescript
// components/NewToolView.tsx
import React from 'react';

export const NewToolView: React.FC = () => {
  return (
    <div className="tool-view">
      <h2>新工具</h2>
      {/* 实现功能 */}
    </div>
  );
};
```

2. **在 App.tsx 中注册**
```typescript
import { NewToolView } from './components/NewToolView';

// 添加到 mode 判断中
{currentMode === 'new-tool' && <NewToolView />}
```

3. **在 Header 中添加导航**
```typescript
case AppMode.NEW_TOOL:
  return '新工具';
```

### Canvas 绘制最佳实践

```typescript
// 下载图片时使用 Blob URL
const link = document.createElement('a');
link.download = 'qrcode.png';
link.href = canvas.toDataURL('image/png');
document.body.appendChild(link);
link.click();
document.body.removeChild(link);
```

### 日期解析技巧

```typescript
// 支持多种格式
const input = '2024-01-01 12:00:00';
const date = new Date(input);

// 中文格式处理
const normalized = input
  .replace(/[年月]/g, '-')
  .replace(/[日时分秒]/g, ':')
  .replace(/\s+/g, ' ');
```

---

## 📚 相关资源

### 使用的库和 API
- **qrserver.com**: https://www.qrserver.com/qr-code-api/
- **sql.js**: https://sql.js.org/
- **Lucide React**: https://lucide.dev/

### 推荐工具
- **PDF.js**: PDF 处理库
- **Tesseract.js**: 图片文字识别 (OCR)
- **SheetJS**: Excel 文件处理
- **jsPDF**: PDF 生成库

---

## 🎯 下一步计划

### 格式转换工具模块（优先级高）
1. **PDF 转 TXT** - 使用 PDF.js 提取文本
2. **图片转文字 (OCR)** - 使用 Tesseract.js
3. **Excel 转 PDF** - 使用 SheetJS + jsPDF

### 功能优化
- 改进二维码相框样式的视觉效果
- 优化时间工具的日期解析逻辑
- 增强 SQL 编辑器的查询性能

### 后端服务（可选）
- 如需高质量 PDF ↔ Word 互转，考虑部署 LibreOffice 服务
- 使用 Vercel/Netlify Functions 实现云函数

---

## 📄 许可证

MIT License

---

## 👥 贡献

欢迎提交 Issue 和 Pull Request！

---

**版本**: 1.0.2  
**最后更新**: 2026-03-22  
**维护者**: AI Tools Team
