#!/bin/bash

# PostgreSQL 数据库恢复脚本

set -e

if [ -z "$1" ]; then
  echo "用法: ./restore.sh <备份文件>"
  echo ""
  echo "示例: ./restore.sh /backups/backup_20251103_120000.sql.gz"
  echo ""
  echo "可用备份:"
  ls -lh /backups/backup_*.sql.gz 2>/dev/null || echo "无备份文件"
  exit 1
fi

BACKUP_FILE=$1

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ 备份文件不存在: $BACKUP_FILE"
  exit 1
fi

echo "================================"
echo "开始恢复数据库"
echo "备份文件: $BACKUP_FILE"
echo "时间: $(date)"
echo "================================"

# 确认操作
echo ""
echo "⚠️  警告：此操作将覆盖当前数据库！"
read -p "确认继续？(yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "❌ 已取消恢复操作"
  exit 1
fi

# 解压并恢复
echo ""
echo "正在恢复数据库..."
gunzip -c $BACKUP_FILE | PGPASSWORD=$POSTGRES_PASSWORD psql \
  -h postgres \
  -U $POSTGRES_USER \
  -d $POSTGRES_DB \
  --quiet

echo ""
echo "✅ 恢复完成！"
echo "================================"
