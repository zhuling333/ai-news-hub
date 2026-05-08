#!/usr/bin/env python3
"""update_news.py - AI 新闻自动采集脚本 v2.0
由 Cron 定时触发，抓取多源 AI 新闻，更新 data/*.json，提交 Git 触发 Vercel 部署。
"""
import json, os, sys, time
from datetime import datetime, timezone, timedelta
from pathlib import Path

TZ = timezone(timedelta(hours=8))
BASE = Path(__file__).resolve().parent.parent
DATA_DIR = BASE / "data"

# ---- RSS 源列表 ----
RSS_FEEDS = [
    # 国际源
    "https://huggingface.co/papers/rss",
    "https://www.theverge.com/ai-artificial-intelligence/rss/index.xml",
    # 中文源（通过 RSSHub）
    "https://rsshub.app/36kr/motif/ai",
    "https://rsshub.app/huxiu/tag/10/feed",
    "https://rsshub.app/sspai/topic/ai",
    "https://rsshub.app/qq/om/tech",
    "https://rsshub.app/along/tech/ai",
    "https://rsshub.app/leiphone/ai",
]


# ---- 分类映射 ----
CATEGORY_KEYWORDS = [
    ("大模型", ["gpt", "llama", "gemini", "claude", "deepseek", "模型发布",
                 "大模型", "参数", "上下文", "token", "多模态", "推理"]),
    ("开源", ["open source", "开源", "开放权重", "huggingface", "github",
              "release", "模型权重"]),
    ("AI 工具", ["tool", "agent", "cursor", "copilot", "工具", "机器人",
                  "应用", "智能体", "插件"]),
    ("政策", ["regulation", "law", "policy", "ban", "政策", "监管",
              "法案", "法规", "合规", "治理"]),
    ("商业", ["融资", "估值", "投资", "上市", "收购", "财报",
              "funding", "valuation", "revenue"]),
]


def classify_article(title, content=""):
    text = (title + " " + content).lower()
    for category, keywords in CATEGORY_KEYWORDS:
        if any(kw in text for kw in keywords):
            return category
    return "AI 资讯"


# ---- 辅助函数 ----
def now_iso():
    return datetime.now(TZ).strftime("%Y-%m-%dT%H:%M:%S+08:00")


def safe_write(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"  [OK] updated {path.name}")


def try_fetch_rss(feed_urls):
    """从 RSS 源抓取最新标题"""
    items = []
    try:
        import feedparser
        for url in feed_urls:
            try:
                feed = feedparser.parse(url)
                for entry in feed.entries[:5]:
                    items.append({
                        "title": entry.get("title", ""),
                        "url": entry.get("link", ""),
                        "date": entry.get("published", entry.get("updated", "")),
                        "source": url.split("/")[2] if url.startswith("http") else url,
                    })
                print(f"  [OK] RSS: {url.split('/')[2]} -> {len(feed.entries[:5])} items")
            except Exception as e:
                print(f"  [WARN] RSS failed: {url.split('/')[2]}: {e}")
    except ImportError:
        print("  [WARN] feedparser not installed, skipping RSS")
    return items


def try_web_scrape():
    """尝试用 requests+bs4 抓取 HuggingFace Daily Papers"""
    items = []
    try:
        import requests
        r = requests.get("https://huggingface.co/papers", timeout=15, headers={
            "User-Agent": "AI-News-Hub/1.0 Bot"})
        if r.status_code == 200:
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(r.text, "html.parser")
            for h3 in soup.select("h3")[:8]:
                t = h3.get_text(strip=True)
                if t and len(t) > 5:
                    items.append({
                        "title": t,
                        "url": "https://huggingface.co/papers",
                        "date": "",
                        "source": "huggingface.co",
                    })
    except ImportError:
        print("  [WARN] BeautifulSoup/requests not installed, skipping scrape")
    except Exception as e:
        print(f"  [WARN] scrape failed: {e}")
    return items


def generate_latest(items):
    """从新闻项生成 latest.json"""
    result = []
    for i, item in enumerate(items[:6]):
        cat = classify_article(item.get("title", ""), item.get("content", ""))
        result.append({
            "id": i + 1,
            "num": f"{i+1:02d}",
            "tag": cat,
            "title": item["title"],
            "date": item.get("date", now_iso())[:10],
            "url": item.get("url", "#"),
        })
    return {"latest": result, "updatedAt": now_iso()}


# ---- 主逻辑 ----
def main():
    print(f"[{datetime.now(TZ).strftime('%Y-%m-%d %H:%M')}] AI News Updater v2 starting...")

    # 多渠道抓取
    all_items = try_fetch_rss(RSS_FEEDS)
    scraped = try_web_scrape()
    for s in scraped:
        if not any(i["title"] == s["title"] for i in all_items):
            all_items.append(s)

    # 去重
    seen = set()
    unique_items = []
    for item in all_items:
        title = item.get("title", "")
        if title and title not in seen:
            seen.add(title)
            unique_items.append(item)
    all_items = unique_items

    print(f"  collected {len(all_items)} unique items")

    # 写入 latest.json
    latest_data = generate_latest(all_items)
    safe_write(DATA_DIR / "latest.json", latest_data)

    # 状态标记
    status = {
        "lastRun": now_iso(),
        "itemsCollected": len(all_items),
        "success": True,
    }
    safe_write(BASE / ".update-status.json", status)
    print(f"[{datetime.now(TZ).strftime('%Y-%m-%d %H:%M')}] Update complete. {len(all_items)} items.")

    # Git 自动提交
    auto_git = os.environ.get("AI_NEWS_AUTO_GIT", "0")
    if auto_git == "1":
        os.chdir(BASE)
        os.system("git add data/ .update-status.json")
        os.system(f"git commit -m '🤖 Auto-update: {now_iso()}'")
        os.system("git push")
        print("  [OK] git push done -> Vercel auto-deploy")


if __name__ == "__main__":
    main()
