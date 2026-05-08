#!/usr/bin/env python3
"""向 news.json 插入4条新资讯，并更新 latest.json"""
import json
from datetime import datetime, timezone, timedelta
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent
DATA_DIR = BASE / "data"

TZ = timezone(timedelta(hours=8))
today = datetime.now(TZ).strftime("%Y-%m-%d")

# 4 条新资讯
new_articles = [
    {
        "id": 19,
        "date": "2026-05-06",
        "category": "大模型",
        "title": "OpenAI 发布 GPT-5.5 Instant：幻觉率下降 52.5%，设为 ChatGPT 默认模型",
        "summary": "OpenAI 于 5 月 6 日发布 GPT-5.5 Instant 并设为 ChatGPT 默认模型。在医疗、法律、金融等专业领域的幻觉率下降约 52.5%，推理速度较 GPT-5 提升 40%，成为 OpenAI 迄今最实用的日常模型。",
        "tags": ["OpenAI", "GPT-5.5", "大模型", "幻觉率"],
        "source": "TechCrunch",
        "url": "https://techcrunch.com/",
        "cover": "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600"
    },
    {
        "id": 20,
        "date": "2026-05-07",
        "category": "算力",
        "title": "SpaceXAI 与 Anthropic 签署协议：太空算力时代开启",
        "summary": "xAI 与 Anthropic 签署计算合作伙伴协议，未来 1 个月内将带来超 300 兆瓦新增算力（约 22 万块 NVIDIA GPU）。双方还规划了数吉瓦级轨道 AI 算力愿景，将 AI 计算送入太空。Anthropic 年化收入已超 440 亿美元。",
        "tags": ["SpaceXAI", "Anthropic", "算力", "太空", "xAI"],
        "source": "路透社",
        "url": "https://www.reuters.com/",
        "cover": "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=600"
    },
    {
        "id": 21,
        "date": "2026-05-06",
        "category": "政策",
        "title": "奥斯卡奖最新宣布：AI 演员和 AI 剧本不能参评",
        "summary": "奥斯卡奖主办方美国电影艺术与科学学院最新宣布，AI 生成的演员表演和 AI 撰写的剧本不得参与奥斯卡奖项评选，只有真实人类演员和人类撰写的剧本有资格。这是好莱坞应对生成式 AI 冲击的标志性规则变革。",
        "tags": ["奥斯卡", "AI伦理", "好莱坞", "政策", "娱乐产业"],
        "source": "新浪科技",
        "url": "https://news.sina.com.cn/",
        "cover": "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=600"
    },
    {
        "id": 22,
        "date": "2026-05-03",
        "category": "行业",
        "title": "中国 AI 大模型周调用量首次超越美国：7.94 万亿 Token 创纪录",
        "summary": "2026 年 4 月 27 日至 5 月 3 日，中国 AI 大模型周调用量达 7.942 万亿 Token，历史上首次超越美国。豆包以 3.45 亿月活领跑，千问 1.66 亿、DeepSeek 1.27 亿紧随其后。中国 AI 原生 APP 月活用户总数达 4.4 亿。",
        "tags": ["中国AI", "大模型", "豆包", "DeepSeek", "月活"],
        "source": "钛媒体",
        "url": "https://www.tmtpost.com/",
        "cover": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600"
    }
]

# 读取现有 news.json
with open(DATA_DIR / "news.json", encoding="utf-8") as f:
    news_data = json.load(f)

# 插入到开头
for art in reversed(new_articles):
    news_data["news"].insert(0, art)
news_data["updated"] = today

# 写回
with open(DATA_DIR / "news.json", "w", encoding="utf-8") as f:
    json.dump(news_data, f, ensure_ascii=False, indent=2)

print(f"[OK] news.json: 新增 4 条，共 {len(news_data['news'])} 条")

# 更新 latest.json
latest_items = []
for i, item in enumerate(new_articles[:6]):
    latest_items.append({
        "id": i + 1,
        "num": f"{i+1:02d}",
        "tag": item["category"],
        "title": item["title"],
        "date": item["date"],
        "url": item["url"]
    })

latest_data = {
    "latest": latest_items,
    "updatedAt": datetime.now(TZ).strftime("%Y-%m-%dT%H:%M:%S+08:00")
}

with open(DATA_DIR / "latest.json", "w", encoding="utf-8") as f:
    json.dump(latest_data, f, ensure_ascii=False, indent=2)

print(f"[OK] latest.json: 已更新 {len(latest_items)} 条最新快讯")
