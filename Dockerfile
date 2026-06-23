# 世界杯信息服务器 Docker 镜像
# 包含：Go服务器 + 前端静态文件

FROM golang:1.21-alpine AS builder

# 编译 Go 服务器
WORKDIR /build
COPY server.go .
RUN go build -o server server.go

# 最终镜像
FROM alpine:3.19

# 安装必要工具
RUN apk add --no-cache ca-certificates tzdata

# 设置时区为上海
ENV TZ=Asia/Shanghai

WORKDIR /app

# 复制编译好的服务器
COPY --from=builder /build/server .

# 复制前端静态文件
COPY dist ./dist

# 暴露端口
EXPOSE 8080

# 启动服务器
CMD ["./server"]