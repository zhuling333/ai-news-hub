// app.js - AI 前线资讯 数据渲染引擎 v2.0（含详情页 SPA 路由）
(function () {
  const BASE = '';

  // ========== 内联数据读取（优先） ==========
  function getInlineData(name) {
    const el = document.getElementById('data-' + name);
    if (!el) return null;
    try {
      return JSON.parse(el.textContent);
    } catch { return null; }
  }

  function fetchJSON(path) {
    return fetch(BASE + path).then(r => {
      if (!r.ok) throw new Error('Failed to load ' + path);
      return r.json();
    });
  }

  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  // ========== 详情页 SPA 路由 ==========
  function showDetail(articleId) {
    // 从所有数据中查找文章
    const allArticles = getAllArticles();
    const article = allArticles.find(a => String(a.id) === String(articleId));
    if (!article) return;

    // 隐藏所有页面，显示详情页
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const detailPage = document.getElementById('page-detail');
    if (detailPage) detailPage.classList.add('active');

    // 渲染详情内容
    renderDetailContent(article, allArticles);

    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // 更新 URL（不刷新页面）
    history.pushState(null, '', '/article/' + articleId);
  }

  function hideDetail() {
    const detailPage = document.getElementById('page-detail');
    if (detailPage) detailPage.classList.remove('active');

    // 返回首页
    document.querySelectorAll('.nav-links a, .nav-bar a').forEach(l => l.classList.remove('active'));
    document.querySelectorAll('.nav-links a[data-page="home"], .nav-bar a[data-page="home"]').forEach(l => l.classList.add('active'));
    document.getElementById('page-home').classList.add('active');

    history.pushState(null, '', '/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function getAllArticles() {
    // 合并 featured + news 数据
    try {
      const featured = JSON.parse(localStorage.getItem('featured_data') || '{"featured":[]}').featured || [];
      const news = JSON.parse(localStorage.getItem('news_data') || '{"news":[]}').news || [];
      return [...featured, ...news];
    } catch (e) {
      return [];
    }
  }

  function renderDetailContent(article, allArticles) {
    const container = document.getElementById('detail-content');
    if (!container) return;

    // 查找相关文章（同类别或同标签）
    const related = allArticles
      .filter(a => String(a.id) !== String(article.id))
      .filter(a => {
        const tags1 = article.tags || [];
        const tags2 = a.tags || [];
        return tags1.some(t => tags2.includes(t)) ||
               a.category === article.category ||
               a.tag === article.tag;
      })
      .slice(0, 3);

    const coverUrl = article.cover || 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&h=600&fit=crop';

    container.innerHTML = `
      <div class="detail-cover">
        <img src="${esc(coverUrl)}" alt="${esc(article.title)}" loading="lazy" class="detail-cover-img">
        <div class="detail-cover-overlay">
          <span class="detail-tag ${article.tagColor || article.categoryColor || 'cyan'}">${esc(article.tag || article.category)}</span>
          ${article.hot ? '<span class="card-tag-hot">🔥 热门</span>' : ''}
        </div>
      </div>
      <div class="detail-body">
        <h1 class="detail-title">${esc(article.title)}</h1>
        <div class="detail-meta">
          <span>${esc(article.author || '编辑部')}</span>
          <span class="sep">·</span>
          <time>${esc(article.date + (article.displayDate ? ' (' + article.displayDate + ')' : ''))}</time>
          <span class="sep">·</span>
          <span>${esc(article.readTime || '5 分钟阅读')}</span>
          <span class="sep">·</span>
          <span>${esc(article.source || '')}</span>
        </div>
        <div class="detail-content">
          ${(article.content || article.excerpt || '').split('\n').map(p => p.trim() ? `<p>${esc(p)}</p>` : '').join('')}
        </div>
        ${article.tags ? `
        <div class="detail-tags">
          ${article.tags.map(t => `<span class="tag">${esc(t)}</span>`).join('')}
        </div>` : ''}
        ${related.length > 0 ? `
        <div class="detail-related">
          <h3 class="detail-related-title">相关推荐</h3>
          <div class="detail-related-grid">
            ${related.map(r => `
              <div class="detail-related-card" onclick="window.showDetailPage('${r.id}')">
                <img class="detail-related-cover" src="${esc(r.cover || 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=300&fit=crop')}" alt="${esc(r.title)}" loading="lazy">
                <div class="detail-related-info">
                  <span class="detail-related-tag">${esc(r.tag || r.category)}</span>
                  <h4>${esc(r.title)}</h4>
                </div>
              </div>`).join('')}
          </div>
        </div>` : ''}
        <button class="detail-back-btn" onclick="window.hideDetailPage()">← 返回列表</button>
      </div>`;
  }

  // 暴露到全局供 onclick 使用
  window.showDetailPage = showDetail;
  window.hideDetailPage = hideDetail;

  // 监听 popstate（浏览器前进后退）
  window.addEventListener('popstate', function () {
    const path = window.location.pathname;
    const match = path.match(/^\/article\/(\d+)/);
    if (match) {
      showDetail(match[1]);
    } else {
      hideDetail();
    }
  });

  // 初始化时检查路径
  function checkInitialPath() {
    const path = window.location.pathname;
    const match = path.match(/^\/article\/(\d+)/);
    if (match) {
      // 延迟执行，等数据加载完
      setTimeout(() => showDetail(match[1]), 500);
    }
  }

  // ========== 首页 ==========
  function renderFeatured(data) {
    const grid = document.querySelector('.featured-grid');
    if (!grid || !data.featured) return;

    // 缓存数据供详情页使用
    localStorage.setItem('featured_data', JSON.stringify(data));

    grid.innerHTML = data.featured.map((item, i) => {
      const tagClass = item.tagColor || 'cyan';
      const sizeClass = item.size === 'large' ? 'card-featured' : item.size === 'small' ? 'card-sm' : 'card-regular';
      const hotBadge = item.hot ? '<span class="card-tag-hot">🔥 热门</span>' : '';
      const coverUrl = item.cover || 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=500&fit=crop';
      const isLarge = sizeClass === 'card-featured';
      return `
      <article class="card ${sizeClass} fade-in" role="listitem" itemscope itemtype="https://schema.org/Article" style="animation-delay:${i*0.05}s" onclick="window.showDetailPage('${item.id}')">
        <div class="card-image">
          <img src="${esc(coverUrl)}" alt="${esc(item.title)}" loading="${isLarge ? 'eager' : 'lazy'}" fetchpriority="${isLarge ? 'high' : 'auto'}" class="card-image-img">
          <span class="card-tag ${tagClass}">${esc(item.tag)}</span>${hotBadge}
        </div>
        <div class="card-body">
          <div class="card-meta"><span itemprop="datePublished">${esc(item.date)}</span><span class="sep">·</span><span itemprop="author">${esc(item.author)}</span><span class="sep">·</span><span>${esc(item.readTime)}</span></div>
          <h3 class="card-title" itemprop="headline">${esc(item.title)}</h3>
          <p class="card-excerpt" itemprop="description">${esc(item.excerpt)}</p>
        </div>
        <div class="card-footer"><span class="card-author">${esc(item.source)}</span><span class="card-read-time">${esc(item.readTime)}</span></div>
      </article>`;
    }).join('');
  }

  function renderLatest(data) {
    const grid = document.querySelector('.latest-grid');
    if (!grid || !data.latest) return;
    grid.innerHTML = data.latest.map(item => `
      <article class="news-item fade-in" role="listitem" itemscope itemtype="https://schema.org/NewsArticle" onclick="window.showDetailPage('${item.id}')">
        <div class="news-item-num" aria-hidden="true">${esc(item.num)}</div>
        <div class="news-item-content">
          <div class="news-item-tag">${esc(item.tag)}</div>
          <h3 class="news-item-title" itemprop="headline">${esc(item.title)}</h3>
          <time class="news-item-date" datetime="${esc(item.date)}" itemprop="datePublished">${esc(item.date)}</time>
        </div>
      </article>`).join('');
  }

  function renderStats(data) {
    if (!data.stats) return;
    const statsEl = document.querySelector('.hero-stats');
    if (!statsEl) return;
    statsEl.innerHTML = data.stats.map(s => `
      <div><div class="stat-number">${esc(s.number)}</div><div class="stat-label">${esc(s.label)}</div></div>`).join('');
  }

  // ========== 统计页 ==========
  function renderAnalytics() {
    const ANALYTICS_KEY = 'ai_news_analytics';
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    function getLocalData() {
      let data = localStorage.getItem(ANALYTICS_KEY);
      if (!data) data = { todayVisits: 0, lastDate: null, pageViews: 0, pages: {}, weekly: {} };
      else data = JSON.parse(data);
      if (data.lastDate !== today) { data.todayVisits = 0; data.lastDate = today; }
      return data;
    }
    function saveLocalData(data) { localStorage.setItem(ANALYTICS_KEY, JSON.stringify(data)); }
    function trackLocal() {
      const data = getLocalData();
      const page = window.location.pathname || '/';
      data.todayVisits++;
      data.pageViews++;
      data.pages[page] = (data.pages[page] || 0) + 1;
      const dayOfWeek = now.getDay();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - dayOfWeek);
      const weekKey = weekStart.toISOString().split('T')[0];
      if (!data.weekly[weekKey]) data.weekly[weekKey] = [0,0,0,0,0,0,0];
      data.weekly[weekKey][dayOfWeek]++;
      saveLocalData(data);
      return data;
    }

    const localData = trackLocal();

    // 全局统计
    fetch('/api/count').then(r => r.json()).then(d => {
      const el = document.getElementById('analytics-total');
      if (el) el.textContent = d.count || 0;
    }).catch(() => {});

    // 本地统计
    const todayEl = document.getElementById('analytics-today');
    const pvEl = document.getElementById('analytics-pv');
    if (todayEl) todayEl.textContent = localData.todayVisits;
    if (pvEl) pvEl.textContent = localData.pageViews;

    // 周趋势图表
    const days = ['日','一','二','三','四','五','六'];
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    const currentWeekKey = weekStart.toISOString().split('T')[0];
    const weekData = localData.weekly[currentWeekKey] || [0,0,0,0,0,0,0];
    const maxVal = Math.max(...weekData, 1);
    const chartEl = document.getElementById('analytics-weekly');
    if (chartEl) {
      chartEl.innerHTML = weekData.map((v, i) => {
        const h = Math.max((v / maxVal) * 160, 4);
        return `<div class="chart-bar" style="height:${h}px;flex:1;background:linear-gradient(to top,var(--purple),var(--cyan));border-radius:3px 3px 0 0" data-label="${days[i]}"></div>`;
      }).join('');
    }

    // 热门页面
    const pages = Object.entries(localData.pages).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const tbody = document.getElementById('analytics-pages-tbody');
    if (tbody) {
      tbody.innerHTML = pages.map((p, i) => {
        const url = p[0];
        const views = p[1];
        return `<tr><td style="padding:12px 16px;border-bottom:1px solid var(--border)"><span style="font-family:var(--font-mono);color:var(--cyan)">${i + 1}</span></td><td style="padding:12px 16px;border-bottom:1px solid var(--border)"><div style="font-weight:500">${url === '/' ? '首页' : url}</div><div style="font-size:12px;color:var(--text-dim);font-family:var(--font-mono)">${url}</div></td><td style="padding:12px 16px;border-bottom:1px solid var(--border);font-family:var(--font-mono);color:var(--purple)">${views}</td></tr>`;
      }).join('');
    }
  }

  // ========== AI 资讯页 ==========
  function renderNews(data) {
    const timeline = document.querySelector('.news-timeline');
    if (!timeline || !data.news) return;

    // 缓存数据供详情页使用
    localStorage.setItem('news_data', JSON.stringify(data));

    timeline.innerHTML = data.news.map(item => `
      <div class="timeline-item" itemscope itemtype="https://schema.org/NewsArticle" onclick="window.showDetailPage('${item.id}')">
        <div class="timeline-date"><time datetime="${esc(item.date)}">${esc(item.displayDate||item.date)}</time></div>
        <span class="timeline-category" style="color:var(--${item.categoryColor||'purple'});border-color:var(--${item.categoryColor||'purple'})">${esc(item.category)}</span>
        <h3 class="timeline-title" itemprop="headline">${esc(item.title)}</h3>
        <p class="timeline-excerpt" itemprop="description">${esc(item.excerpt)}</p>
        ${item.tags ? `<div class="timeline-tags">${item.tags.map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div>` : ''}
        ${item.content ? '' : `<div class="timeline-readmore">点击查看详情 →</div>`}
      </div>`).join('');
  }

  // ========== AI 技能页 ==========
  function renderSkills(data) {
    const grid = document.querySelector('.skills-grid');
    if (!grid || !data.skills) return;
    grid.innerHTML = data.skills.map((item, i) => `
      <article class="skill-card fade-in" itemscope itemtype="https://schema.org/Article" style="animation-delay:${i*0.05}s">
        <div class="skill-icon">${item.icon||'📌'}</div>
        <div class="skill-level">${Array(item.maxLevel||5).fill(0).map((_,j)=>`<span class="skill-level-bar${j<item.level?' filled':''}"></span>`).join('')}</div>
        <h3 class="skill-title">${esc(item.title)}</h3>
        <p class="skill-desc">${esc(item.desc)}</p>
        <div class="skill-meta"><span>${item.count||0} 篇文章</span><span>${esc(item.difficulty||'中级')}</span></div>
      </article>`).join('');
  }

  // ========== 行业动态页 ==========
  function renderTrends(data) {
    const trendsGrid = document.querySelector('#page-trends .trends-grid');
    if (!trendsGrid || !data.trends) return;
    trendsGrid.innerHTML = data.trends.map(item => `
      <div class="trend-card">
        <div class="trend-eyebrow">${esc(item.eyebrow)}</div>
        <h3 class="trend-title">${esc(item.title)}</h3>
        <p class="trend-excerpt">${esc(item.excerpt)}</p>
        <div class="market-bar">${item.data.map(d=>`
          <div class="market-item">
            <div class="market-label">${esc(d.label)}</div>
            <div class="market-value">${esc(d.value)}</div>
            ${d.change?`<span class="market-change ${d.direction==='up'?'up':'down'}">${esc(d.change)}</span>`:''}
          </div>`).join('')}
        </div>
      </div>`).join('');
  }

  function renderChart(data) {
    const chart = document.querySelector('.chart-placeholder');
    if (!chart || !data.chart || !data.chart.bars) return;
    chart.innerHTML = data.chart.bars.map(b => `
      <div class="chart-bar" style="height:${b.height}%" data-label="${esc(b.label)}"></div>`).join('');
  }

  function renderReports(data) {
    const reportSection = document.querySelector('#page-trends .subsection:last-child .trends-grid');
    if (!reportSection || !data.reports) return;
    reportSection.innerHTML = data.reports.map(item => `
      <div class="trend-card">
        <div class="trend-eyebrow">${esc(item.eyebrow)}</div>
        <h3 class="trend-title">${esc(item.title)}</h3>
        <p class="trend-excerpt">${esc(item.excerpt)}</p>
        <div class="market-bar"><span class="market-change up">${esc(item.cta||'查看详情')}</span></div>
      </div>`).join('');
  }

  // ========== 导航 ==========
  function initNav() {
    const allNavLinks = document.querySelectorAll('.nav-links a, .nav-bar a');
    const pages = document.querySelectorAll('.page');
    allNavLinks.forEach(link => {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        const page = this.getAttribute('data-page');
        // 同步 active 到所有导航链接
        allNavLinks.forEach(l => l.classList.remove('active'));
        allNavLinks.forEach(l => { if (l.getAttribute('data-page') === page) l.classList.add('active'); });
        pages.forEach(p => {
          p.classList.remove('active');
          if (p.id === 'page-' + page) p.classList.add('active');
        });
        if (window.location.pathname !== '/') history.pushState(null, '', '/');
        if (page === 'analytics') renderAnalytics();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
  }

  // ========== 主流程 ==========
  async function main() {
    initNav();
    try {
      // 优先读取内联数据，fallback 到 fetch
      const featured = getInlineData('featured') || (await fetchJSON('data/featured.json').catch(() => null));
      const news = getInlineData('news') || (await fetchJSON('data/news.json').catch(() => null));
      const skills = getInlineData('skills') || (await fetchJSON('data/skills.json').catch(() => null));
      const trends = getInlineData('trends') || (await fetchJSON('data/trends.json').catch(() => null));
      const latest = getInlineData('latest') || (await fetchJSON('data/latest.json').catch(() => null));
      if (featured) { renderFeatured(featured); renderStats(featured); }
      if (latest) renderLatest(latest);
      if (news) renderNews(news);
      if (skills) renderSkills(skills);
      if (trends) { renderTrends(trends); renderChart(trends); renderReports(trends); }

      // 检查初始路径
      checkInitialPath();
    } catch (err) {
      console.error('AI News Hub render error:', err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
  } else {
    main();
  }
})();
