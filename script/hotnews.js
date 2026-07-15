// ===== script/hotnews.js =====
(function() {
    'use strict';

    const hotNewsList = document.getElementById('hotNewsList');

    const FALLBACK_NEWS = [
        '科技：AI 模型性能再突破',
        '财经：全球股市震荡上行',
        '体育：欧冠决赛即将开赛',
        '娱乐：新电影票房创新高',
        '健康：专家建议适度运动'
    ];

    async function fetchHotNews() {
        try {
            const shuffled = [...FALLBACK_NEWS].sort(() => Math.random() - 0.5);
            return shuffled;
        } catch (_) {
            return [...FALLBACK_NEWS].sort(() => Math.random() - 0.5);
        }
    }

    function renderHotNews(newsList) {
        hotNewsList.innerHTML = '';
        if (!newsList || newsList.length === 0) {
            hotNewsList.innerHTML = '<li>暂无热点</li>';
            return;
        }
        const top5 = newsList.slice(0, 5);
        top5.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item;
            hotNewsList.appendChild(li);
        });
    }

    async function initHotNews() {
        const news = await fetchHotNews();
        renderHotNews(news);
        console.log('✅ hotnews.js 已加载');
    }

    window.__hotnews = {
        refresh: async () => {
            const news = await fetchHotNews();
            renderHotNews(news);
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initHotNews);
    } else {
        initHotNews();
    }
})();