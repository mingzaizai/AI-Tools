# 🎨 AI Picture - AI 本地图片编辑器

<p align="left">
  <img src="https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-blue?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-6.2-green?style=for-the-badge&logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/Gemini_AI-1.35-orange?style=for-the-badge&logo=google-gemini" alt="Gemini" />
  <img src="https://img.shields.io/badge/Privacy-Local_Only-green?style=for-the-badge&logo=shieldcheck" alt="Privacy" />
</p>

> **AI Picture** 是一款功能强大的本地图片编辑器，集成了 Google Gemini AI 技术，为创作者提供专业级的图片处理工具。所有处理均在本地完成，确保您的隐私安全。

---

## � 功能概览

### 🎯 核心功能
- **🖼️ 图片库管理**：支持文件拖拽上传、批量管理和实时预览
- **🎨 高级图片编辑**：滤镜调整、颜色校正、裁剪、旋转、翻转等
- **📝 文本叠加**：添加文字、调整字体、大小和颜色
- **🎨 颜色拾取**：像素级精准取色，支持 HEX、RGB、HSL 格式
- **📦 批量处理**：批量调整多张图片的尺寸、格式和滤镜
- **🔄 图片合并**：将多张图片合并为一张
- **📄 JSON 编辑器**：内置 JSON 文件编辑功能
- **🤖 Gemini AI 集成**：智能图像分析和处理

---

## 🏗️ 技术架构

### 技术栈
- **前端框架**：React 19 + TypeScript
- **构建工具**：Vite 6.2
- **AI 集成**：Google Gemini AI 1.35
- **图标库**：Lucide React

### 项目结构
```
AI-Tools/
├── components/          # 组件目录
│   ├── AIAnalysisPanel.tsx    # AI 分析面板
│   ├── BatchView.tsx          # 批量处理视图
│   ├── EditorView.tsx         # 图片编辑器视图
│   ├── Header.tsx             # 头部组件
│   ├── ImageUploader.tsx      # 图片上传组件
│   ├── JsonEditView.tsx       # JSON 编辑器视图
│   ├── LibraryView.tsx        # 图片库视图
│   ├── MergeView.tsx          # 图片合并视图
│   └── SettingsView.tsx       # 设置视图
├── App.tsx              # 应用主组件
├── constants.tsx        # 常量定义
├── types.ts             # 类型定义
├── utils.ts             # 工具函数
├── package.json         # 项目配置
└── vite.config.ts       # Vite 配置
```

---

## � 快速开始

### 环境准备
1. 克隆项目到本地
2. 安装依赖
   ```bash
   npm install
   ```

### 本地运行
```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

### AI 配置
1. 访问 [Google AI Studio](https://aistudio.google.com/)
2. 获取 Gemini API Key
3. 在应用的 **设置** 页面中配置 API Key

---

## 📁 功能模块详解

### � 图片库 (Library)
- **文件上传**：支持拖拽上传和文件选择器
- **图片管理**：查看、选择和删除图片
- **快速操作**：一键进入编辑、批量处理或合并模式

### 🎨 编辑器 (Editor)
- **基础编辑**：裁剪、旋转、翻转
- **颜色调整**：亮度、对比度、饱和度等参数调节
- **滤镜预设**：多种预设滤镜效果
- **文本工具**：添加和编辑文本
- **颜色拾取**：从图片中提取颜色
- **历史记录**：支持撤销和重做操作

### 📦 批量处理 (Batch)
- **批量调整**：同时处理多张图片
- **格式转换**：支持不同图片格式之间的转换
- **尺寸调整**：统一调整图片尺寸

### � 图片合并 (Merge)
- **多图合并**：将多张图片合并为一张
- **布局调整**：调整合并图片的布局

### � JSON 编辑器 (JSON Edit)
- **语法高亮**：JSON 语法高亮显示
- **错误提示**：实时检测 JSON 格式错误
- **格式化**：自动格式化 JSON 代码

### ⚙️ 设置 (Settings)
- **AI 配置**：设置 Gemini API Key
- **应用设置**：调整应用行为

---

## 🔒 隐私保障

- **100% 本地处理**：所有图片处理均在浏览器本地完成，无后端上传
- **数据安全**：您的图片和 API 密钥仅存储在本地浏览器中
- **离线可用**：核心功能无需网络连接即可使用

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来帮助改进这个项目！

---

<p align="center">
  Built with ❤️ for Creators everywhere.
</p>