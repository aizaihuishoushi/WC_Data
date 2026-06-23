# 世界杯信息服务器 Docker 镜像
# 多阶段构建：前端构建 → Go编译 → 最终镜像

# 阶段1：前端构建
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# 复制前端依赖文件
COPY package.json package-lock.json ./

# 安装依赖
RUN npm ci

# 复制前端源码
COPY src ./src
COPY public ./public
COPY tsconfig.json vite.config.ts tailwind.config.js postcss.config.js index.html ./

# 构建前端
RUN npm run build

# 阶段2：Go服务器编译
FROM golang:1.21-alpine AS go-builder

WORKDIR /build
COPY server.go .
RUN go build -o server server.go

# 阶段3：最终镜像
FROM alpine:3.19

RUN apk add --no-cache ca-certificates tzdata

ENV TZ=Asia/Shanghai

WORKDIR /app

COPY --from=go-builder /build/server .
COPY --from=frontend-builder /app/dist ./dist

EXPOSE 8080

CMD ["./server"]