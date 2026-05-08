#!/usr/bin/env python3
"""inline_data.py - 将 data/*.json 内联到 index.html 中，消除前端网络请求。"""
import json, re, glob
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent
DATA_DIR = BASE / "data"
INDEX_HTML = BASE / "index.html"

SENTINEL_START = "<!--INLINE_DATA_START-->"
SENTINEL_END = "<!--INLINE_DATA_END-->"

def main():
    # 读取所有 JSON 数据
    data_blocks = []
    for fpath in sorted(glob.glob(str(DATA_DIR / "*.json"))):
        name = Path(fpath).stem  # featured, news, skills, etc.
        with open(fpath, encoding="utf-8") as f:
            raw = f.read()
        # 验证是合法 JSON
        try:
            json.loads(raw)
        except json.JSONDecodeError as e:
            print(f"  ⚠ {name}.json 不是合法 JSON，跳过: {e}")
            continue
        data_blocks.append((name, raw))

    # 读取 index.html
    with open(INDEX_HTML, encoding="utf-8") as f:
        html = f.read()

    # 构建内联数据 HTML
    inline_html = ""
    for name, raw in data_blocks:
        inline_html += f'<script type="application/json" id="data-{name}">{raw}</script>\n'

    # 替换或插入
    if SENTINEL_START in html and SENTINEL_END in html:
        # 替换现有内联数据
        pattern = re.escape(SENTINEL_START) + r".*?" + re.escape(SENTINEL_END)
        html = re.sub(pattern, f"{SENTINEL_START}\n{inline_html}{SENTINEL_END}", html, flags=re.DOTALL)
        print("[OK] 已更新现有内联数据")
    else:
        # 在 </body> 前插入
        marker = SENTINEL_START + "\n" + inline_html + SENTINEL_END + "\n"
        html = html.replace("</body>", marker + "</body>")
        print("[OK] 已插入内联数据")

    with open(INDEX_HTML, "w", encoding="utf-8") as f:
        f.write(html)

    print(f"[OK] 完成: {len(data_blocks)} 个数据文件内联到 index.html")


if __name__ == "__main__":
    main()
