"""
API 客户端 - 与工作流平台后端交互
"""
import requests
from typing import List, Dict, Optional, Set
import config


class FeedsAPIClient:
    """
    与工作流平台的 Feeds API 交互
    """

    def __init__(self, base_url: str = None):
        self.base_url = base_url or config.API_BASE_URL
        self.api_url = f"{self.base_url}/api/admin/feeds"
        # 缓存已存在的 URL，避免重复请求
        self._duplicate_cache: Set[str] = set()

    def create_feed(self, feed_data: Dict) -> Optional[Dict]:
        """
        创建新的 feed 记录
        """
        try:
            response = requests.post(
                self.api_url,
                json=feed_data,
                timeout=30
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"创建 feed 失败: {e}")
            return None

    def get_feeds(self, status: str = "pending", limit: int = 50) -> List[Dict]:
        """
        获取 feeds 列表
        """
        try:
            response = requests.get(
                self.api_url,
                params={"status": status, "limit": limit},
                timeout=30
            )
            response.raise_for_status()
            data = response.json()
            return data.get("data", [])
        except Exception as e:
            print(f"获取 feeds 失败: {e}")
            return []

    def update_feed(self, feed_id: str, data: Dict) -> bool:
        """
        更新 feed
        """
        try:
            response = requests.patch(
                f"{self.api_url}/{feed_id}",
                json=data,
                timeout=30
            )
            response.raise_for_status()
            return True
        except Exception as e:
            print(f"更新 feed 失败: {e}")
            return False

    def check_duplicates_batch(self, urls: List[str]) -> Dict[str, bool]:
        """
        批量检查 URL 是否已存在（高效版本）
        返回 {url: True/False} 字典，True 表示已存在
        """
        if not urls:
            return {}

        try:
            response = requests.post(
                f"{self.api_url}/check-duplicates",
                json={"urls": urls},
                timeout=60
            )
            response.raise_for_status()
            data = response.json()
            results = data.get("data", {}).get("results", {})

            # 更新缓存
            for url, exists in results.items():
                if exists:
                    self._duplicate_cache.add(url)

            return results
        except Exception as e:
            print(f"批量检查重复失败: {e}")
            # 失败时返回空字典，让后续逻辑继续处理
            return {}

    def check_duplicate(self, url: str) -> bool:
        """
        检查单个 URL 是否已存在
        优先使用缓存，避免重复请求
        """
        # 先检查缓存
        if url in self._duplicate_cache:
            return True

        # 单个 URL 也用批量接口
        results = self.check_duplicates_batch([url])
        return results.get(url, False)

    def preload_duplicates(self, urls: List[str]) -> int:
        """
        预加载重复检查结果到缓存
        返回已存在的数量
        """
        if not urls:
            return 0

        results = self.check_duplicates_batch(urls)
        existing_count = sum(1 for exists in results.values() if exists)
        return existing_count

    def is_duplicate(self, url: str) -> bool:
        """
        从缓存中检查是否重复（需要先调用 preload_duplicates）
        """
        return url in self._duplicate_cache

    def clear_cache(self):
        """
        清空重复检查缓存
        """
        self._duplicate_cache.clear()

    def get_stats(self) -> Dict:
        """
        获取统计信息
        """
        try:
            response = requests.get(
                f"{self.api_url}/stats",
                timeout=30
            )
            response.raise_for_status()
            data = response.json()
            return data.get("data", {})
        except Exception as e:
            print(f"获取统计信息失败: {e}")
            return {}


# 全局客户端实例
api_client = FeedsAPIClient()
