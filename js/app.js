// app.js - AI 前线资讯 数据渲染引擎 v1.0
(function () {
  const BASE = ''; // 相对路径，发布后自动适配

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

  // ========== 首页 ==========
  function renderFeatured(data) {
    const grid = document.querySelector('.featured-grid');
    if (!grid || !data.featured) return;
    grid.innerHTML = data.featured.map((item, i) => {
      const tagClass = item.tagColor || 'cyan';
      const sizeClass = item.size === 'large' ? 'card-featured' : item.size === 'small' ? 'card-sm' : 'card-regular';
      const hotBadge = item.hot ? '<span class="card-tag-hot">🔥 热门</span>' : '';
      return `
      <article class="card ${sizeClass} fade-in" role="listitem" itemscope itemtype="https://schema.org/Article" style="animation-delay:${i*0.05}s">
        <div class="card-image"><span class="card-tag ${tagClass}">${esc(item.tag)}</span>${hotBadge}</div>
        <div class="card-body">
          <div class="card-meta"><span itemprop="datePublished">${esc(item.date)}</span><span class="sep">·</span><span itemprop="author">${esc(item.author)}</span><span class="sep">·</span><span>${esc(item.readTime)}</span></div>
          <h3 class="card-title" itemprop="headline"><a href="${esc(item.url||'#')}">${esc(item.title)}</a></h3>
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
      <article class="news-item fade-in" role="listitem" itemscope itemtype="https://schema.org/NewsArticle">
        <div class="news-item-num" aria-hidden="true">${esc(item.num)}</div>
        <div class="news-item-content">
          <div class="news-item-tag">${esc(item.tag)}</div>
          <h3 class="news-item-title" itemprop="headline"><a href="${esc(item.url||'#')}">${esc(item.title)}</a></h3>
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

  // ========== AI 资讯页 ==========
  function renderNews(data) {
    const timeline = document.querySelector('.news-timeline');
    if (!timeline || !data.news) return;
    timeline.innerHTML = data.news.map(item => `
      <div class="timeline-item" itemscope itemtype="https://schema.org/NewsArticle">
        <div class="timeline-date"><time datetime="${esc(item.date)}">${esc(item.displayDate||item.date)}</time></div>
        <span class="timeline-category" style="color:var(--${item.categoryColor||'purple'});border-color:var(--${item.categoryColor||'purple'})">${esc(item.category)}</span>
        <h3 class="timeline-title" itemprop="headline"><a href="${esc(item.url||'#')}">${esc(item.title)}</a></h3>
        <p class="timeline-excerpt" itemprop="description">${esc(item.excerpt)}</p>
        <div class="timeline-tags">${item.tags.map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div>
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
    const navLinks = document.querySelectorAll('.nav-links a');
    const pages = document.querySelectorAll('.page');
    navLinks.forEach(link => {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        const page = this.getAttribute('data-page');
        navLinks.forEach(l => l.classList.remove('active'));
        this.classList.add('active');
        pages.forEach(p => {
          p.classList.remove('active');
          if (p.id === 'page-' + page) p.classList.add('active');
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
  }

  // ========== 主流程 ==========
  async function main() {
    initNav();
    try {
      const [featured, news, skills, trends, latest] = await Promise.all([
        fetchJSON('data/featured.json').catch(() => null),
        fetchJSON('data/news.json').catch(() => null),
        fetchJSON('data/skills.json').catch(() => null),
        fetchJSON('data/trends.json').catch(() => null),
        fetchJSON('data/latest.json').catch(() => null)
      ]);
      if (featured) { renderFeatured(featured); renderStats(featured); }
      if (latest) renderLatest(latest);
      if (news) renderNews(news);
      if (skills) renderSkills(skills);
      if (trends) { renderTrends(trends); renderChart(trends); renderReports(trends); }
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
