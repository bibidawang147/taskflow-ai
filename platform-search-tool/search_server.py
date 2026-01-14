#!/usr/bin/env python3
"""
平台搜索工具 - 后端服务器
支持搜索：小红书、抖音、B站、快手、微博、贴吧、知乎
"""

import sys
import os
import asyncio
import json
from datetime import datetime
from pathlib import Path
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
import uvicorn

# 添加MediaCrawler到Python路径
CRAWLER_PATH = Path(__file__).parent.parent / "crawler" / "MediaCrawler"
sys.path.insert(0, str(CRAWLER_PATH))

try:
    from media_platform.xhs import XiaoHongShuCrawler
    from media_platform.douyin import DouYinCrawler
    from media_platform.bilibili import BilibiliCrawler
    from base.base_crawler import AbstractCrawler
except ImportError as e:
    print(f"❌ 无法导入MediaCrawler: {e}")
    print(f"请确保MediaCrawler位于: {CRAWLER_PATH}")
    sys.exit(1)

app = FastAPI(title="平台搜索工具", description="个人使用的多平台内容搜索工具")

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 数据模型
class SearchRequest(BaseModel):
    platform: str  # xhs, dy, bili, ks, wb, tieba, zhihu
    keyword: str
    max_count: int = 20

class SearchResult(BaseModel):
    id: str
    title: str
    content: str
    author: str
    author_id: str
    like_count: int
    comment_count: int
    share_count: int
    publish_time: str
    url: str
    platform: str
    cover_image: Optional[str] = None
    tags: List[str] = []

# 平台映射
PLATFORM_MAP = {
    "xhs": {"name": "小红书", "class": XiaoHongShuCrawler},
    "dy": {"name": "抖音", "class": DouYinCrawler},
    "bili": {"name": "B站", "class": BilibiliCrawler},
    # 其他平台可以后续添加
}

# 结果缓存目录
CACHE_DIR = Path(__file__).parent / "search_cache"
CACHE_DIR.mkdir(exist_ok=True)

@app.get("/")
async def root():
    """返回首页"""
    html_file = Path(__file__).parent / "index.html"
    if html_file.exists():
        return FileResponse(html_file)
    return {"message": "平台搜索工具API", "platforms": list(PLATFORM_MAP.keys())}

@app.get("/api/platforms")
async def get_platforms():
    """获取支持的平台列表"""
    return {
        "platforms": [
            {"id": pid, "name": info["name"]}
            for pid, info in PLATFORM_MAP.items()
        ]
    }

@app.post("/api/search")
async def search_content(request: SearchRequest):
    """执行搜索"""
    try:
        # 验证平台
        if request.platform not in PLATFORM_MAP:
            raise HTTPException(
                status_code=400,
                detail=f"不支持的平台: {request.platform}。支持的平台: {list(PLATFORM_MAP.keys())}"
            )

        # 检查缓存
        cache_key = f"{request.platform}_{request.keyword}_{request.max_count}"
        cache_file = CACHE_DIR / f"{cache_key}.json"

        # 如果缓存存在且未过期（1小时内），直接返回
        if cache_file.exists():
            cache_age = datetime.now().timestamp() - cache_file.stat().st_mtime
            if cache_age < 3600:  # 1小时
                with open(cache_file, "r", encoding="utf-8") as f:
                    cached_data = json.load(f)
                return {
                    "success": True,
                    "platform": PLATFORM_MAP[request.platform]["name"],
                    "keyword": request.keyword,
                    "count": len(cached_data),
                    "results": cached_data,
                    "cached": True,
                    "cache_age": int(cache_age)
                }

        # 执行搜索
        print(f"🔍 开始搜索: 平台={request.platform}, 关键词={request.keyword}")

        # 注意：这里需要根据实际的MediaCrawler使用方式调整
        # 由于MediaCrawler主要是命令行工具，这里提供一个简化的调用示例

        # 临时方案：调用命令行
        import subprocess
        crawler_main = CRAWLER_PATH / "main.py"

        # 设置环境变量
        env = os.environ.copy()
        env["KEYWORDS"] = request.keyword
        env["CRAWLER_MAX_NOTES_COUNT"] = str(request.max_count)

        cmd = [
            sys.executable,
            str(crawler_main),
            "--platform", request.platform,
            "--lt", "qrcode",
            "--type", "search",
            "--save_data_option", "json"
        ]

        # 这是简化实现，实际使用时需要处理登录和数据提取
        return {
            "success": False,
            "message": "搜索功能需要进一步集成MediaCrawler",
            "suggestion": "请直接使用crawler目录下的MediaCrawler工具",
            "command": " ".join(cmd)
        }

    except Exception as e:
        print(f"❌ 搜索失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/cache/list")
async def list_cache():
    """列出所有缓存的搜索"""
    caches = []
    for cache_file in CACHE_DIR.glob("*.json"):
        stat = cache_file.stat()
        parts = cache_file.stem.split("_")
        caches.append({
            "file": cache_file.name,
            "platform": parts[0] if len(parts) > 0 else "unknown",
            "keyword": parts[1] if len(parts) > 1 else "unknown",
            "size": stat.st_size,
            "modified": datetime.fromtimestamp(stat.st_mtime).isoformat()
        })
    return {"caches": caches}

@app.delete("/api/cache/clear")
async def clear_cache():
    """清空所有缓存"""
    count = 0
    for cache_file in CACHE_DIR.glob("*.json"):
        cache_file.unlink()
        count += 1
    return {"success": True, "deleted": count}

if __name__ == "__main__":
    print("🚀 启动平台搜索工具...")
    print(f"📁 MediaCrawler路径: {CRAWLER_PATH}")
    print(f"💾 缓存目录: {CACHE_DIR}")
    print(f"🌐 访问地址: http://localhost:8888")

    uvicorn.run(app, host="0.0.0.0", port=8888, log_level="info")
