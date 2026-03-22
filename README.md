# 🛠️ AI Tools - 开发者工具集

<p align="left">
  <img src="https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-blue?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-6.4-green?style=for-the-badge&logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License" />
</p>

> **AI Tools** 是一款面向开发者的多功能工具集，集成了二维码生成、时间转换、SQL 编辑、JSON 处理、Base64 编解码等实用工具，提升开发效率。所有工具均在浏览器本地运行，无需后端服务器，确保数据安全。

---

## ✨ 特性亮点

- 🚀 **纯前端运行** - 无需后端，所有数据在本地处理
- 🛠️ **多功能集成** - 一个应用包含多种开发工具
- 🎨 **简洁界面** - 直观易用的现代化 UI
- 🔒 **安全隐私** - 数据不上传服务器，完全本地处理
- 📦 **开箱即用** - 安装依赖即可运行

---

## 🎯 功能模块

### 1. 🔗 网络工具
**二维码生成器**
- 自定义二维码内容（URL、文本等）
- 7 种相框样式：无边框、简约白框、圆角边框、渐变边框、双边框、虚线边框、拍立得
- 实时预览效果
- 一键下载 PNG 格式

### 2. ⏰ 时间工具
**日期 ↔ 时间戳转换**
- 日期转时间戳（支持多种格式输入）
- 时间戳转日期（自动识别毫秒/秒级）
- 日期格式化（统一输出标准格式）

### 3. 🗄️ SQL 编辑器
**SQLite 数据库管理**
- 创建/打开 SQLite 数据库文件
- 执行 SQL 查询语句
- 可视化数据表格展示
- 导出查询结果为 CSV
- 支持数据库文件下载
- 预设示例数据库

### 4. 📄 JSON 编辑器
**JSON 处理工具**
- JSON 格式化（美化显示）
- JSON 压缩（移除空格换行）
- JSON 语法验证
- 详细错误提示

### 5. 🧮 开发者工具
**常用编码转换**
- Base64 编解码
- URL 编解码
- 快速时间戳转换

---

## 🏗️ 技术架构

### 技术栈
| 技术 | 版本 | 说明 |
|------|------|------|
| **React** | 19.2.3 | 前端框架 |
| **TypeScript** | 5.8.2 | 开发语言 |
| **Vite** | 6.4.1 | 构建工具 |
| **Lucide React** | 0.562.0 | 图标库 |
| **sql.js** | 1.14.1 | SQLite 引擎 |

### 浏览器支持
- Chrome / Edge (推荐)
- Firefox
- Safari

---

## 🚀 快速开始

### 环境要求
- Node.js >= 18.0.0
- npm >= 9.0.0

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev
```
访问 http://localhost:5173

### 生产构建
```bash
npm run build
```
构建产物输出到 `dist/` 目录

### 预览构建结果
```bash
npm run preview
```

### 部署
构建后的 `dist/` 目录可直接部署到：
- GitHub Pages
- Vercel
- Netlify
- 任何静态文件服务器

---

## 📁 项目结构

```
AI-Tools/
├── components/              # React 组件目录
│   ├── Header.tsx          # 顶部导航栏
│   ├── TimeToolsView.tsx   # 时间工具视图
│   ├── NetworkToolsView.tsx # 网络工具视图
│   ├── SQLEditorView.tsx   # SQL 编辑器视图
│   ├── JSONEditorView.tsx  # JSON 编辑器视图
│   └── DeveloperToolsView.tsx # 开发者工具视图
├── App.tsx                  # 主应用组件
├── types.ts                 # TypeScript 类型定义
├── package.json             # 项目配置
├── tsconfig.json            # TypeScript 配置
├── vite.config.ts           # Vite 配置
└── README.md                # 项目说明
```

---

## 📝 使用示例

### 生成二维码
1. 切换到"网络工具"
2. 输入二维码内容（如：https://example.com）
3. 选择相框样式
4. 点击"生成二维码"
5. 点击"下载二维码"保存

### SQL 查询
1. 切换到"SQL 编辑器"
2. 创建或打开数据库
3. 输入 SQL 语句（如：`SELECT * FROM users`）
4. 点击"执行查询"
5. 查看结果或导出 CSV

### 时间戳转换
1. 切换到"时间工具"
2. 在"日期 → 时间戳"输入框输入日期
3. 自动显示对应时间戳
4. 或在"时间戳 → 日期"输入时间戳
5. 显示格式化后的日期

---

## 🔧 开发指南

### 添加新工具模块

1. **创建组件**
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

2. **在 App.tsx 注册**
```typescript
import { NewToolView } from './components/NewToolView';

// 添加到 mode 判断
{currentMode === 'new-tool' && <NewToolView />}
```

3. **在 Header 添加导航**
```typescript
case AppMode.NEW_TOOL:
  return '新工具';
```

---

## 📚 相关资源

### 使用的 API 和库
- [qrserver.com](https://www.qrserver.com/qr-code-api/) - 二维码生成 API
- [sql.js](https://sql.js.org/) - SQLite WebAssembly 版本
- [Lucide React](https://lucide.dev/) - 图标库

### 推荐扩展
- **PDF.js** - PDF 文本提取
- **Tesseract.js** - 图片文字识别 (OCR)
- **SheetJS** - Excel 文件处理
- **jsPDF** - PDF 生成

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

---

## 👥 联系方式

- **项目地址**: [GitHub](https://github.com/your-username/ai-tools)
- **问题反馈**: [Issues](https://github.com/your-username/ai-tools/issues)

---

<p align="center">
  <strong>⭐ 如果这个项目对你有帮助，请给一个 Star 支持！⭐</strong>
</p>
