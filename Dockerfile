# 使用 Node.js 20 作为基础镜像
FROM node:20-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制 package 文件
COPY package*.json ./
COPY pnpm-lock.yaml ./

# 复制 server 目录的 package 文件
COPY server/package*.json ./server/
COPY server/pnpm-lock.yaml ./server/

# 安装 pnpm
RUN npm install -g pnpm

# 安装前端依赖
RUN pnpm install --frozen-lockfile

# 安装后端依赖
WORKDIR /app/server
RUN pnpm install --frozen-lockfile

# 复制项目文件
WORKDIR /app
COPY . .

# 构建前端项目
RUN pnpm run build

# 构建后端项目
RUN pnpm run build:server

# ============================================
# 生产镜像
# ============================================
FROM node:20-alpine

# 设置工作目录
WORKDIR /app

# 复制构建产物
COPY --from=builder /app/server/wwwroot ./

# 安装生产依赖
RUN npm install --production --registry=https://registry.npmmirror.com

# 暴露端口
EXPOSE 9000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:9000', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 启动应用
CMD ["npm", "run", "start"]

