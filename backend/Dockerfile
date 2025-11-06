# 多阶段构建，优化镜像大小
FROM node:20-alpine AS builder

WORKDIR /app

# 复制依赖文件
COPY package*.json ./
COPY prisma ./prisma/

# 安装所有依赖（包括 devDependencies，用于构建）
RUN npm ci

# 生成 Prisma Client
RUN npx prisma generate

# 复制源代码
COPY tsconfig.json ./
COPY src ./src

# 构建 TypeScript
RUN npm run build

# 生产阶段
FROM node:20-alpine

WORKDIR /app

# 安装生产依赖
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --only=production && \
    npx prisma generate && \
    npm cache clean --force

# 从构建阶段复制编译后的代码
COPY --from=builder /app/dist ./dist

# 创建上传文件目录
RUN mkdir -p uploads logs && \
    chown -R node:node /app

# 使用非 root 用户运行
USER node

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# 启动命令
CMD ["node", "dist/server.js"]
