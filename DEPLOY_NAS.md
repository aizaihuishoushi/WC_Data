# 部署到飞牛NAS（Docker + GitHub）

## 方式一：本地构建（手动更新）

### 1. 上传项目到NAS
- 将整个项目文件夹上传到NAS

### 2. 在NAS上构建并运行
```bash
cd /path/to/worldcup-app
docker-compose -f docker-compose-local.yml up -d --build
```

---

## 方式二：GitHub自动构建（推荐）

代码推送到GitHub后，自动构建镜像并推送到Docker Hub，NAS一键拉取更新。

### 1. 创建 GitHub 仓库

在 GitHub 创建新仓库，将代码上传。

### 2. 配置 Docker Hub 访问令牌

1. 登录 [Docker Hub](https://hub.docker.com/)
2. Account Settings → Security → New Access Token
3. 创建一个 Token，保存好

### 3. 在 GitHub 仓库配置密钥

1. 打开你的 GitHub 仓库 → Settings → Secrets and variables → Actions
2. 添加两个 Secrets：
   - `DOCKERHUB_USERNAME`: 你的Docker Hub用户名
   - `DOCKERHUB_TOKEN`: 刚才创建的Access Token

### 4. 修改 docker-compose.yml

将 `YOUR_DOCKERHUB_USERNAME` 改成你的Docker Hub用户名：
```yaml
image: 你的用户名/worldcup-app:latest
```

### 5. 以后更新代码

```bash
# 提交代码到GitHub
git add .
git commit -m "更新代码"
git push

# GitHub Actions会自动构建并推送到Docker Hub

# 在NAS上拉取最新版本
docker-compose pull
docker-compose up -d
```

---

## 公司电脑访问

在公司电脑浏览器打开：
```
http://你的NAS内网IP:8080
```

如果NAS和公司不在同一网络，需要：
- 配置 NAS 的外网访问（端口转发/DDNS）
- 或使用 VPN 连接回家

## 常用命令

```bash
# 查看运行状态
docker ps

# 查看日志
docker logs worldcup-server

# 重启服务
docker restart worldcup-server

# 停止服务
docker stop worldcup-server

# 拉取最新镜像并更新
docker-compose pull
docker-compose up -d

# 完全删除重建
docker-compose down
docker-compose up -d --build
```

## 端口修改

如果8080端口冲突，修改 `docker-compose.yml`：
```yaml
ports:
  - "3578:8080"  # 外部端口改为3578
```

然后访问 `http://NAS的IP:3578`