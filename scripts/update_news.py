#!/usr/bin/env python3
# update_news.py - AI 新闻自动采集脚本 v1.0
"""由 Cron 定时触发的 AI 新闻更新脚本。
目标：抓取最新 AI 资讯，更新 data/*.json，提交 Git 触发 Vercel 部署。
"""
import json, os, sys, time
from datetime import datetime, timezone, timedelta
from pathlib import Path

TZ = timezone(timedelta(hours=8))
BASE = Path(__file__).resolve().parent.parent
DATA_DIR = BASE / "data"

# ---- 辅助函数 ----
def now_iso():
    return datetime.now(TZ).strftime("%Y-%m-%dT%H:%M:%S+08:00")

def safe_write(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"  ✓ updated {path.name}")

def try_fetch_rss(feed_urls):
    """尝试从 RSS 源抓取最新标题（需要 feedparser）"""
    items = []
    try:
        import feedparser
        for url in feed_urls:
            feed = feedparser.parse(url)
            for entry in feed.entries[:5]:
                items.append({
                    "title": entry.get("title", ""),
                    "url": entry.get("link", ""),
                    "date": entry.get("published", ""),
                })
    except ImportError:
        print("  ⚠ feedparser 未安装，跳过 RSS")
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
                    items.append({"title": t, "url": "https://huggingface.co/papers", "date": ""})
    except ImportError:
        print("  ⚠ BeautifulSoup/requests 未安装，跳过网页抓取")
    except Exception:
        pass
    return items

def generate_latest(news_items):
    """从新闻项生成 latest.json"""
    result = []
    for i, item in enumerate(news_items[:6]):
        result.append({
            "id": i + 1,
            "num": f"{i+1:02d}",
            "tag": item.get("category", "AI 资讯"),
            "title": item["title"],
            "date": item.get("date", ""),
            "url": item.get("url", "#")
        })
    return {"latest": result, "updatedAt": now_iso()}

# ---- 主逻辑 ----
def main():
    print(f"[{datetime.now(TZ).strftime('%Y-%m-%d %H:%M')}] AI News Updater starting...")

    # 1. RSS 源列表
    rss_feeds = [
        "https://huggingface.co/papers/rss",
        "https://www.theverge.com/ai-artificial-intelligence/rss/index.xml",
    ]

    # 2. 尝试多渠道抓取
    all_items = try_fetch_rss(rss_feeds)
    scraped = try_web_scrape()
    for s in scraped:
        if not any(i["title"] == s["title"] for i in all_items):
            all_items.append(s)

    # 3. 标记分类
    for item in all_items:
        title = item.get("title", "").lower()
        if any(w in title for w in ["gpt", "llama", "gemini", "claude", "model", "deepseek"]):
            item["category"] = "大模型"
        elif any(w in title for w in ["open source", "release", "github"]):
            item["category"] = "开源"
        elif any(w in title for w in ["tool", "agent", "cursor", "copilot"]):
            item["category"] = "AI 工具"
        elif any(w in title for w in ["regulation", "law", "policy", "ban"]):
            item["category"] = "政策"
        else:
            item["category"] = "AI 资讯"

    print(f"  collected {len(all_items)} items (RSS + scrape)")

    # 4. 写入 latest.json
    latest_data = generate_latest(all_items)
    safe_write(DATA_DIR / "latest.json", latest_data)

    # 5. 标记完成
    status = {
        "lastRun": now_iso(),
        "itemsCollected": len(all_items),
        "success": True
    }
    safe_write(DATA_DIR.parent / ".update-status.json", status)
    print(f"[{datetime.now(TZ).strftime('%Y-%m-%d %H:%M')}] Update complete. {len(all_items)} items.")

    # 6. 可选：Git 自动提交
    auto_git = os.environ.get("AI_NEWS_AUTO_GIT", "0")
    if auto_git == "1":
        os.chdir(BASE)
        os.system("git add data/ .update-status.json")
        os.system(f"git commit -m '🤖 Auto-update: {now_iso()}'")
        os.system("git push")
        print("  ✓ git push done → Vercel auto-deploy")

if __name__ == "__main__":
    main()
