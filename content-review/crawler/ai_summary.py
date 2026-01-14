"""
AI 摘要生成模块 - 支持多个 AI 服务提供商
"""
import config


def generate_summary(title: str, content: str) -> str:
    """
    使用配置的 AI 服务生成摘要
    """
    if config.AI_PROVIDER == "openai":
        return _openai_summary(title, content)
    elif config.AI_PROVIDER == "dashscope":
        return _dashscope_summary(title, content)
    elif config.AI_PROVIDER == "anthropic":
        return _anthropic_summary(title, content)
    else:
        # 如果没有配置 AI，返回内容前 200 字
        return content[:200] + "..." if len(content) > 200 else content


def _openai_summary(title: str, content: str) -> str:
    """使用 OpenAI API 生成摘要"""
    try:
        from openai import OpenAI

        client = OpenAI(
            api_key=config.OPENAI_API_KEY,
            base_url=config.OPENAI_BASE_URL
        )

        prompt = config.SUMMARY_PROMPT.format(title=title, content=content[:3000])

        response = client.chat.completions.create(
            model=config.OPENAI_MODEL,
            messages=[
                {"role": "user", "content": prompt}
            ],
            max_tokens=500,
            temperature=0.7
        )

        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"OpenAI 摘要生成失败: {e}")
        return content[:200] + "..." if len(content) > 200 else content


def _dashscope_summary(title: str, content: str) -> str:
    """使用通义千问生成摘要 (国内推荐)"""
    try:
        import dashscope
        from dashscope import Generation

        dashscope.api_key = config.DASHSCOPE_API_KEY

        prompt = config.SUMMARY_PROMPT.format(title=title, content=content[:3000])

        response = Generation.call(
            model='qwen-turbo',
            messages=[
                {'role': 'user', 'content': prompt}
            ]
        )

        if response.status_code == 200:
            return response.output.text.strip()
        else:
            print(f"通义千问摘要生成失败: {response.message}")
            return content[:200] + "..." if len(content) > 200 else content
    except Exception as e:
        print(f"通义千问摘要生成失败: {e}")
        return content[:200] + "..." if len(content) > 200 else content


def _anthropic_summary(title: str, content: str) -> str:
    """使用 Claude 生成摘要"""
    try:
        import anthropic

        client = anthropic.Anthropic()

        prompt = config.SUMMARY_PROMPT.format(title=title, content=content[:3000])

        message = client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=500,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )

        return message.content[0].text.strip()
    except Exception as e:
        print(f"Claude 摘要生成失败: {e}")
        return content[:200] + "..." if len(content) > 200 else content
