# 2026 美加墨世界杯 · 实时赛况看板

FIFA 2026 世界杯（48队，12小组）实时赛况与历史数据。

## 立即使用（无需任何环境）

**Windows 用户:**
双击 `server.exe` → 自动打开浏览器访问 http://localhost:8080

**Mac / Linux:**
```bash
# 直接运行（已编译二进制）
./server

# 或手动编译（需要 Go 1.21+）
go build -o server server.go && ./server
```

## 数据来源

- **主数据源:** football-data.org API（需在 server.go 中配置 API Key）
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

## 配置 API Key（可选，获取实时比分）

打开 `server.go`，将你的 football-data.org API Key 填入：

```go
const API_KEY = "你的_football-data.org_API_KEY"
```

然后重新编译：
```bash
# Windows:
go build -o server.exe server.go

# Mac/Linux:
go build -o server server.go
```

## 技术栈

- 前端: React 18 + TypeScript + Tailwind CSS + Vite
- 后端/服务器: Go (单一可执行文件，自动打开浏览器)
- 数据: football-data.org API + 官方分组回退数据

## 目录结构

```
.
├── server.go        # Go 服务器源码（API代理 + 静态文件服务）
├── server.exe       # Windows 可执行文件（双击即运行）
├── server           # Linux/Mac 可执行文件
├── dist/            # 前端构建产物（静态网站）
├── src/             # 前端源码
├── index.html       # 入口
├── package.json     # Node 依赖
└── vite.config.ts   # Vite 配置
```
