#!/bin/bash

# PostgreSQL 数据库备份脚本
# 自动备份并保留最近 7 天的备份

set -e

# 配置
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$DATE.sql.gz"
KEEP_DAYS=${BACKUP_KEEP_DAYS:-7}

echo "================================"
echo "开始数据库备份"
echo "时间: $(date)"
echo "================================"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 执行备份
echo "正在备份数据库..."
PGPASSWORD=$POSTGRES_PASSWORD pg_dump \
  -h postgres \
  -U $POSTGRES_USER \
  -d $POSTGRES_DB \
  --clean \
  --if-exists \
  --verbose \
  | gzip > $BACKUP_FILE

# 检查备份文件
if [ -f "$BACKUP_FILE" ]; then
  BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
  echo "✅ 备份成功！"
  echo "文件: $BACKUP_FILE"
  echo "大小: $BACKUP_SIZE"
else
  echo "❌ 备份失败！"
  exit 1
fi

# 清理旧备份
echo ""
echo "清理 $KEEP_DAYS 天前的备份..."
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +$KEEP_DAYS -delete
echo "清理完成"

# 显示当前备份列表
echo ""
echo "当前备份列表:"
ls -lh $BACKUP_DIR/backup_*.sql.gz 2>/dev/null || echo "无备份文件"

echo ""
echo "================================"
echo "备份完成"
echo "================================"
