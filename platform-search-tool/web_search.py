#!/usr/bin/env python3
"""
平台搜索工具 - Web版本
提供简单的Web界面用于搜索多个平台
"""

import os
import sys
import json
import asyncio
import subprocess
from pathlib import Path
from datetime import datetime
from typing import Optional, List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
import uvicorn

# 路径配置
BASE_DIR = Path(__file__).parent
CRAWLER_DIR = BASE_DIR.parent / "crawler" / "MediaCrawler"
DATA_DIR = CRAWLER_DIR / "data"
CACHE_DIR = BASE_DIR / "cache"
CACHE_DIR.mkdir(exist_ok=True)

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
    platform: str
    keyword: str
    max_count: int = 20
    sort_type: str = "general"  # general, latest, popular

class SearchResult(BaseModel):
    id: str
    title: str
    content: Optional[str] = ""
    author: Optional[str] = ""
    like_count: Optional[int] = 0
    comment_count: Optional[int] = 0
    publish_time: Optional[str] = ""
    url: Optional[str] = ""
    platform: str

# 平台配置
PLATFORMS = {
    "xhs": {
        "name": "小红书",
        "data_dir": "xhs",
        "note_file": "xhs_notes.json"
    },
    "dy": {
        "name": "抖音",
        "data_dir": "douyin",
        "note_file": "douyin_aweme.json"
    },
    "bili": {
        "name": "B站",
        "data_dir": "bilibili",
        "note_file": "bilibili_videos.json"
    },
    "ks": {
        "name": "快手",
        "data_dir": "kuaishou",
        "note_file": "kuaishou_videos.json"
    },
    "wb": {
        "name": "微博",
        "data_dir": "weibo",
        "note_file": "weibo_notes.json"
    },
    "tieba": {
        "name": "贴吧",
        "data_dir": "tieba",
        "note_file": "tieba_notes.json"
    },
    "zhihu": {
        "name": "知乎",
        "data_dir": "zhihu",
        "note_file": "zhihu_notes.json"
    }
}

async def search_all_platforms(keyword: str, max_count: int, sort_type: str):
    """搜索所有已授权的平台"""
    # 检查授权状态
    browser_data_dir = CRAWLER_DIR / "browser_data"
    authorized_platforms = []

    for platform_id in PLATFORMS.keys():
        # 检查多种可能的目录名
        platform_dir1 = browser_data_dir / platform_id
        platform_dir2 = browser_data_dir / f"cdp_{platform_id}_user_data_dir"
        platform_dir3 = browser_data_dir / f"{platform_id}_user_data_dir"

        if ((platform_dir1.exists() and any(platform_dir1.iterdir())) or
            (platform_dir2.exists() and any(platform_dir2.iterdir())) or
            (platform_dir3.exists() and any(platform_dir3.iterdir()))):
            authorized_platforms.append(platform_id)

    if not authorized_platforms:
        return {
            "success": False,
            "message": "没有已授权的平台，请先在授权管理中登录",
            "platform": "全部平台",
            "keyword": keyword,
            "count": 0,
            "results": []
        }

    print(f"📋 已授权平台: {[PLATFORMS[p]['name'] for p in authorized_platforms]}")

    # 并发搜索所有平台
    all_results = []
    for platform_id in authorized_platforms:
        try:
            print(f"  🔍 搜索 {PLATFORMS[platform_id]['name']}...")

            # 准备环境变量
            env = os.environ.copy()
            env["KEYWORDS"] = keyword
            env["CRAWLER_MAX_NOTES_COUNT"] = str(max_count)

            if sort_type == "latest":
                env["SORT_TYPE"] = "latest_time"
            elif sort_type == "popular":
                env["SORT_TYPE"] = "popularity_descending"
            else:
                env["SORT_TYPE"] = "general"

            # 执行爬虫
            cmd = [
                sys.executable,
                str(CRAWLER_DIR / "main.py"),
                "--platform", platform_id,
                "--lt", "qrcode",
                "--type", "search",
                "--save_data_option", "json"
            ]

            process = await asyncio.create_subprocess_exec(
                *cmd,
                env=env,
                cwd=str(CRAWLER_DIR),
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )

            await process.communicate()

            # 读取结果
            platform_config = PLATFORMS[platform_id]
            data_file = DATA_DIR / platform_config["data_dir"] / platform_config["note_file"]

            if data_file.exists():
                with open(data_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)

                for item in data[:max_count]:
                    result = SearchResult(
                        id=item.get('note_id', item.get('aweme_id', item.get('video_id', ''))),
                        title=item.get('title', item.get('aweme_desc', item.get('video_title', ''))),
                        content=item.get('desc', item.get('aweme_desc', ''))[:200],
                        author=item.get('nickname', ''),
                        like_count=item.get('liked_count', item.get('digg_count', 0)),
                        comment_count=item.get('comments_count', item.get('comment_count', 0)),
                        publish_time=item.get('time', item.get('create_time', '')),
                        url=item.get('note_url', item.get('aweme_url', item.get('video_url', ''))),
                        platform=platform_config["name"]
                    )
                    all_results.append(result.dict())

            print(f"  ✅ {PLATFORMS[platform_id]['name']} 完成")

        except Exception as e:
            print(f"  ❌ {PLATFORMS[platform_id]['name']} 失败: {e}")
            continue

    return {
        "success": True,
        "platform": "全部平台",
        "keyword": keyword,
        "count": len(all_results),
        "results": all_results,
        "searched_platforms": [PLATFORMS[p]["name"] for p in authorized_platforms]
    }

@app.get("/")
async def root():
    """返回首页"""
    html_file = BASE_DIR / "search_web.html"
    if html_file.exists():
        return FileResponse(html_file)
    return {"message": "平台搜索工具", "status": "running"}

@app.get("/api/platforms")
async def get_platforms():
    """获取支持的平台"""
    return {
        "platforms": [
            {"id": k, "name": v["name"]}
            for k, v in PLATFORMS.items()
        ]
    }

@app.get("/api/auth/status")
async def get_auth_status():
    """获取所有平台的授权状态"""
    try:
        # 检查browser_data目录中的登录状态
        browser_data_dir = CRAWLER_DIR / "browser_data"
        browser_data_dir.mkdir(exist_ok=True)

        authorized = {}
        for platform_id in PLATFORMS.keys():
            # 检查两种可能的目录名
            platform_dir1 = browser_data_dir / platform_id
            platform_dir2 = browser_data_dir / f"cdp_{platform_id}_user_data_dir"
            platform_dir3 = browser_data_dir / f"{platform_id}_user_data_dir"

            # 如果任一目录存在且有文件，认为已授权
            authorized[platform_id] = (
                (platform_dir1.exists() and any(platform_dir1.iterdir())) or
                (platform_dir2.exists() and any(platform_dir2.iterdir())) or
                (platform_dir3.exists() and any(platform_dir3.iterdir()))
            )

        return {
            "success": True,
            "authorized": authorized
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "authorized": {pid: False for pid in PLATFORMS.keys()}
        }

@app.post("/api/auth/login")
async def login_platform(request: dict):
    """授权登录平台"""
    try:
        platform = request.get("platform")

        if platform not in PLATFORMS:
            raise HTTPException(400, f"不支持的平台: {platform}")

        print(f"\n🔐 开始授权: {PLATFORMS[platform]['name']}")

        # 构建登录命令（只登录不搜索）
        cmd = [
            sys.executable,
            str(CRAWLER_DIR / "main.py"),
            "--platform", platform,
            "--lt", "qrcode",
            "--type", "search"  # 会触发登录但不会真正搜索
        ]

        # 设置一个空关键词，让它登录后立即退出
        env = os.environ.copy()
        env["KEYWORDS"] = "__test_login__"
        env["CRAWLER_MAX_NOTES_COUNT"] = "1"

        print(f"📝 执行命令: {' '.join(cmd)}")

        # 执行登录（同步执行，需要用户交互）
        process = await asyncio.create_subprocess_exec(
            *cmd,
            env=env,
            cwd=str(CRAWLER_DIR),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )

        stdout, stderr = await process.communicate()

        if process.returncode == 0 or "login" in stdout.decode().lower():
            return {
                "success": True,
                "message": "授权成功"
            }
        else:
            return {
                "success": False,
                "message": "授权失败，请查看控制台日志"
            }

    except Exception as e:
        print(f"❌ 授权失败: {e}")
        return {
            "success": False,
            "message": str(e)
        }

@app.post("/api/auth/revoke")
async def revoke_auth(request: dict):
    """删除授权"""
    try:
        platform = request.get("platform")

        if platform not in PLATFORMS:
            raise HTTPException(400, f"不支持的平台: {platform}")

        # 删除browser_data目录中的平台数据
        browser_data_dir = CRAWLER_DIR / "browser_data" / platform
        if browser_data_dir.exists():
            import shutil
            shutil.rmtree(browser_data_dir)

        return {
            "success": True,
            "message": "授权已删除"
        }

    except Exception as e:
        return {
            "success": False,
            "message": str(e)
        }

@app.post("/api/search")
async def search_content(request: SearchRequest):
    """执行搜索（支持单平台和多平台）"""
    try:
        platform = request.platform
        keyword = request.keyword
        max_count = request.max_count
        sort_type = request.sort_type

        # 多平台搜索
        if platform == "all":
            print(f"\n🌐 开始多平台搜索: {keyword}")
            return await search_all_platforms(keyword, max_count, sort_type)

        if platform not in PLATFORMS:
            raise HTTPException(400, f"不支持的平台: {platform}")

        print(f"\n🔍 开始搜索: {PLATFORMS[platform]['name']} - {keyword} - 排序:{sort_type}")

        # 准备环境变量
        env = os.environ.copy()
        env["KEYWORDS"] = keyword
        env["CRAWLER_MAX_NOTES_COUNT"] = str(max_count)

        # 设置排序类型（小红书支持：general综合, latest最新, popular最热）
        if sort_type == "latest":
            env["SORT_TYPE"] = "latest_time"  # 小红书的最新排序
        elif sort_type == "popular":
            env["SORT_TYPE"] = "popularity_descending"  # 小红书的最热排序
        else:
            env["SORT_TYPE"] = "general"  # 综合排序

        # 构建命令
        cmd = [
            sys.executable,
            str(CRAWLER_DIR / "main.py"),
            "--platform", platform,
            "--lt", "qrcode",
            "--type", "search",
            "--save_data_option", "json"
        ]

        print(f"📝 执行命令: {' '.join(cmd)}")
        print(f"📁 数据将保存到: {DATA_DIR}")

        # 执行爬虫（异步）
        process = await asyncio.create_subprocess_exec(
            *cmd,
            env=env,
            cwd=str(CRAWLER_DIR),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )

        stdout, stderr = await process.communicate()

        if process.returncode != 0:
            error_msg = stderr.decode('utf-8', errors='ignore')
            print(f"❌ 爬虫执行失败: {error_msg}")
            return {
                "success": False,
                "message": "爬虫执行失败",
                "error": error_msg[:500],
                "suggestion": "请检查MediaCrawler是否正确安装，并尝试手动运行一次"
            }

        # 读取结果
        platform_config = PLATFORMS[platform]
        data_file = DATA_DIR / platform_config["data_dir"] / platform_config["note_file"]

        if not data_file.exists():
            return {
                "success": True,
                "message": "搜索完成，但未找到数据文件",
                "platform": platform_config["name"],
                "keyword": keyword,
                "count": 0,
                "results": [],
                "data_file": str(data_file)
            }

        # 读取并解析数据
        with open(data_file, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # 转换为统一格式
        results = []
        for item in data[:max_count]:
            result = SearchResult(
                id=item.get('note_id', item.get('aweme_id', item.get('video_id', ''))),
                title=item.get('title', item.get('aweme_desc', item.get('video_title', ''))),
                content=item.get('desc', item.get('aweme_desc', ''))[:200],
                author=item.get('nickname', ''),
                like_count=item.get('liked_count', item.get('digg_count', 0)),
                comment_count=item.get('comments_count', item.get('comment_count', 0)),
                publish_time=item.get('time', item.get('create_time', '')),
                url=item.get('note_url', item.get('aweme_url', item.get('video_url', ''))),
                platform=platform_config["name"]
            )
            results.append(result.dict())

        print(f"✅ 搜索完成，找到 {len(results)} 条结果")

        return {
            "success": True,
            "platform": platform_config["name"],
            "keyword": keyword,
            "count": len(results),
            "results": results
        }

    except Exception as e:
        import traceback
        error_detail = traceback.format_exc()
        print(f"❌ 搜索失败: {error_detail}")
        raise HTTPException(500, f"搜索失败: {str(e)}")

@app.get("/api/status")
async def get_status():
    """获取服务状态"""
    return {
        "status": "running",
        "crawler_dir": str(CRAWLER_DIR),
        "data_dir": str(DATA_DIR),
        "crawler_exists": CRAWLER_DIR.exists(),
        "platforms": list(PLATFORMS.keys())
    }

if __name__ == "__main__":
    print("=" * 60)
    print("🔍 平台搜索工具 - Web版")
    print("=" * 60)
    print(f"📁 MediaCrawler: {CRAWLER_DIR}")
    print(f"💾 数据目录: {DATA_DIR}")
    print(f"🌐 访问地址: http://localhost:8899")
    print("=" * 60)
    print("\n⚠️  重要提示:")
    print("  - 首次使用需要扫码登录")
    print("  - 建议每次搜索不超过50条")
    print("  - 仅供个人学习研究使用")
    print("\n")

    uvicorn.run(app, host="0.0.0.0", port=8899, log_level="info")
