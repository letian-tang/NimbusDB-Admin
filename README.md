# NimbusDB Admin

舟谱 NimbusDB 管理后台 - 用于管理 NimbusDB 实例的 Web 管理界面。

## 项目结构

```
NimbusDB-Admin/
├── app/                      # Next.js App Router 目录
│   ├── api/                  # API 路由（后端接口）
│   │   ├── auth/             # 认证相关接口（登录、用户管理）
│   │   ├── connections/      # 连接管理接口
│   │   ├── query/            # SQL 查询接口
│   │   └── test/             # 连接测试接口
│   ├── globals.css           # 全局样式
│   ├── layout.tsx            # 根布局组件
│   └── page.tsx              # 首页入口
│
├── components/               # 可复用 UI 组件
│   ├── Layout.tsx            # 页面布局组件（侧边栏、顶部导航）
│   └── ConfirmDialog.tsx     # 确认对话框组件
│
├── lib/                      # 工具库和服务端逻辑
│   ├── db.ts                 # SQLite 数据库操作（用户、会话、连接管理）
│   └── auth.ts               # 认证工具函数
│
├── services/                 # 前端服务层
│   └── nimbusService.ts      # 与后端 API 通信的服务封装
│
├── views/                    # 页面视图组件
│   ├── Dashboard.tsx         # 概览仪表盘
│   ├── SqlEditor.tsx         # SQL 编辑器
│   ├── ConnectionManager.tsx # 连接管理
│   ├── UserManagement.tsx    # 用户管理
│   ├── SettingsView.tsx      # 实例设置
│   └── LoginView.tsx         # 登录页面
│
├── types.ts                  # TypeScript 类型定义
├── App.tsx                   # 主应用组件
├── .env.local                # 环境变量配置（需自行创建）
├── next.config.mjs           # Next.js 配置
├── tailwind.config.ts        # Tailwind CSS 配置
└── package.json              # 项目依赖
```

## 目录说明

### `app/` - Next.js App Router

基于 Next.js 16 App Router 架构：

- **`api/`** - 后端 API 路由，处理 HTTP 请求
- **`layout.tsx`** - 根布局，包含全局脚本加载（如阿里云验证码）
- **`page.tsx`** - 首页入口，渲染 `<App />` 组件
- **`globals.css`** - 全局 CSS 样式

### `components/` - 可复用组件

存放可在多个页面复用的 UI 组件：

- **`Layout.tsx`** - 主布局组件，包含侧边栏导航、顶部栏、用户信息展示
- **`ConfirmDialog.tsx`** - 通用确认对话框

### `lib/` - 服务端工具库

服务端使用的核心逻辑：

- **`db.ts`** - SQLite 数据库操作，包含：
  - 用户管理（创建、验证、更新、删除）
  - 会话管理（登录状态）
  - 连接配置存储
- **`auth.ts`** - 认证相关工具函数

### `services/` - 前端服务层

封装与后端 API 的通信：

- **`nimbusService.ts`** - 单例服务类，提供：
  - 登录/登出
  - 连接管理
  - SQL 查询执行
  - 用户管理
  - 配置管理

### `views/` - 页面视图

各功能页面的 UI 组件：

| 组件 | 功能 |
|------|------|
| `LoginView.tsx` | 登录页面，集成阿里云滑块验证码 |
| `Dashboard.tsx` | 概览仪表盘，显示实例状态 |
| `SqlEditor.tsx` | SQL 编辑器，执行查询 |
| `ConnectionManager.tsx` | 连接管理，添加/删除实例 |
| `UserManagement.tsx` | 用户管理 |
| `SettingsView.tsx` | 实例设置 |

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env.local` 文件：

```bash
# 阿里云滑块验证码配置（可选）
NEXT_PUBLIC_ALIYUN_CAPTCHA_SCENE_ID=your_scene_id
NEXT_PUBLIC_ALIYUN_CAPTCHA_PREFIX=your_prefix
ALIYUN_ACCESS_KEY_ID=your_access_key_id
ALIYUN_ACCESS_KEY_SECRET=your_access_key_secret

# 数据库路径配置（可选，默认为 ./data/nimbus_admin.db）
# Docker 部署建议设置为持久化目录
# NIMBUS_DB_PATH=/app/data/nimbus_admin.db
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 默认账号

- 用户名：`admin`
- 密码：`admin`

## 技术栈

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **数据库**: SQLite (better-sqlite3)
- **验证码**: 阿里云验证码 2.0
- **图标**: Lucide React

## 功能特性

- ✅ 用户认证（支持验证码）
- ✅ 多实例连接管理
- ✅ SQL 编辑器
- ✅ 用户管理
- ✅ 实例设置
- ✅ 侧边栏展开/收起
