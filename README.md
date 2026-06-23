# 2026 美加墨世界杯 · 实时赛况看板

FIFA 2026 世界杯（48队，12小组）实时赛况与历史数据。

## 功能特性

- 实时比赛信息展示
- 球队名称中英文双语显示
- 比赛时间自动转换为北京时间
- 小组赛积分榜
- 淘汰赛对阵图
- 点击球队查看历史对战记录
- 响应式设计，支持电脑和手机
- API Key 前端配置，无需修改代码
- 支持 Docker 部署

## 快速开始

### 方式一：本地开发调试

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 http://localhost:3578

### 方式二：编译 Go 服务器运行

```bash
# 先构建前端
npm run build

# 编译 Go 服务器
# Windows:
go build -o server.exe server.go
# Mac/Linux:
go build -o server server.go

# 运行
# Windows: 双击 server.exe
# Mac/Linux: ./server
```

访问 http://localhost:3578

### 方式三：Docker 部署

```bash
# 拉取镜像（替换为你的 Docker Hub 仓库）
docker pull zaizaiyang/wc_data:latest

# 运行容器（外部端口 3578，内部端口 9000）
docker run -d -p 3578:9000 --name worldcup-server -e TZ=Asia/Shanghai zaizaiyang/wc_data:latest
```

或者使用 docker-compose：

```bash
docker-compose up -d
```

访问 http://localhost:3578

## 配置 API Key

1. 打开网页后，点击右上角的 **设置** 按钮
2. 在弹出的窗口中填入你的 football-data.org API Key
3. （可选）配置代理
4. 点击 **保存并测试**
5. 配置会自动保存到服务器的 `config.json` 文件中

## 数据来源

- **主数据源:** football-data.org API
- **回退数据:** FIFA 官方抽签结果（2025-12-05）12个小组 + 48支球队的正确分组
- 未配置 API Key 时，显示官方分组信息和赛程安排

## 官方分组（FIFA 2025年12月5日抽签结果）

| 组别 | 球队 |
|------|------|
| A组 | 墨西哥、南非、韩国、丹麦 |
| B组 | 加拿大、意大利、卡塔尔、瑞士 |
| C组 | 巴西、摩洛哥、海地、苏格兰 |
| D组 | 美国、巴拉圭、澳大利亚、土耳其 |
| E组 | 德国、库拉索、科特迪瓦、厄瓜多尔 |
| F组 | 荷兰、日本、波兰、突尼斯 |
| G组 | 比利时、埃及、伊朗、新西兰 |
| H组 | 西班牙、佛得角、沙特阿拉伯、乌拉圭 |
| I组 | 法国、塞内加尔、伊拉克、挪威 |
| J组 | 阿根廷、阿尔及利亚、奥地利、约旦 |
| K组 | 葡萄牙、牙买加、乌兹别克斯坦、哥伦比亚 |
| L组 | 英格兰、克罗地亚、加纳、巴拿马 |

## 技术栈

- **前端:** React 18 + TypeScript + Tailwind CSS + Vite + Zustand
- **后端/服务器:** Go (单一可执行文件，API 代理 + 静态文件服务，自动打开浏览器)
- **数据:** football-data.org API + 官方分组回退数据
- **部署:** Docker + GitHub Actions 自动构建

## 目录结构

```
.
├── server.go              # Go 服务器源码
├── Dockerfile             # Docker 镜像构建配置
├── docker-compose.yml     # Docker Compose 配置（NAS 部署用）
├── docker-compose-local.yml # 本地构建用 Docker Compose
├── .github/
│   └── workflows/
│       └── docker-publish.yml # GitHub Actions 自动构建配置
├── src/                   # 前端源码
├── public/                # 静态资源
├── dist/                  # 前端构建产物（构建后生成）
├── index.html             # 入口 HTML
├── package.json           # Node 依赖
├── vite.config.ts         # Vite 配置
├── tailwind.config.js     # Tailwind 配置
├── tsconfig.json          # TypeScript 配置
└── .gitignore             # Git 忽略文件
```

## GitHub Actions 自动构建

代码推送到 `main` 分支后，GitHub Actions 会自动：
1. 构建前端
2. 编译 Go 服务器
3. 打包 Docker 镜像
4. 推送到 Docker Hub

需要在 GitHub 仓库 Secrets 中配置：
- `DOCKERHUB_USERNAME`: Docker Hub 用户名
- `DOCKERHUB_TOKEN`: Docker Hub Access Token
