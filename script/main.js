(function() {
    'use strict';

    const DEFAULT_ENGINES = [
        { id: 'bing-cn', name: '必应', url: 'https://cn.bing.com/search?q=' },
        { id: 'baidu', name: '百度', url: 'https://www.baidu.com/s?wd=' },
        { id: 'google', name: 'Google', url: 'https://www.google.com/search?q=' },
        { id: 'yandex', name: 'Yandex', url: 'https://yandex.com/search/?text=' },
        { id: 'duckgo', name: 'DuckGo', url: 'https://duckduckgo.com/?q=' },
        { id: '360', name: '360', url: 'https://www.so.com/s?q=' },
        { id: 'quark', name: '夸克', url: 'https://quark.sm.cn/s?q=' }
    ];

    const DEFAULT_BOOKMARKS = [
        { id: 'bm_1', name: 'GitHub', url: 'https://github.com', icon: 'GH' },
        { id: 'bm_2', name: 'Bilibili', url: 'https://bilibili.com', icon: 'B' },
        { id: 'bm_3', name: '知乎', url: 'https://zhihu.com', icon: '知' },
        { id: 'bm_4', name: '掘金', url: 'https://juejin.cn', icon: '掘' },
        { id: 'bm_5', name: 'CSDN', url: 'https://csdn.net', icon: 'C' },
        { id: 'bm_6', name: 'YouTube', url: 'https://youtube.com', icon: 'YT' },
        { id: 'bm_7', name: '微博', url: 'https://weibo.com', icon: '微' },
        { id: 'bm_8', name: '豆瓣', url: 'https://douban.com', icon: '豆' }
    ];

    const QUOTES = [
        { text: '生活不是等待风暴过去，而是学会在雨中翩翩起舞。', author: '佚名' },
        { text: '世界是一本书，而不旅行的人只读了其中一页。', author: '奥古斯丁' },
        { text: '保持好奇，保持善良，保持热爱。', author: '未知' },
        { text: '星光不问赶路人，岁月不负有心人。', author: '网络' },
        { text: '未来的答案，藏在现在的行动里。', author: '佚名' },
        { text: '做自己，因为别人都有人做了。', author: '王尔德' },
        { text: '每一个不曾起舞的日子，都是对生命的辜负。', author: '尼采' },
        { text: '生活明朗，万物可爱。', author: '网络' }
    ];

    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const engineSelect = document.getElementById('engineSelect');
    const searchSuggestions = document.getElementById('searchSuggestions');
    const quoteText = document.getElementById('quoteText');
    const quoteAuthor = document.getElementById('quoteAuthor');
    const timeMain = document.getElementById('timeMain');
    const timeDate = document.getElementById('timeDate');
    const searchDot = document.getElementById('searchDot');
    const searchExpandContainer = document.getElementById('searchExpandContainer');
    const searchDotWrapper = document.getElementById('searchDotWrapper');
    const searchHistory = document.getElementById('searchHistory');
    const historyTags = document.getElementById('historyTags');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    const bookmarksContainer = document.getElementById('bookmarksContainer');
    const bookmarksGrid = document.getElementById('bookmarksGrid');
    const addBookmarkBtn = document.getElementById('addBookmarkBtn');

    let searchEngines = [];
    let currentEngineIndex = 0;
    let stealthMode = true;
    let hoverTimeout = null;
    let idleTimeout = null;
    let searchHistoryData = [];
    let bookmarks = [];
    const MAX_HISTORY = 15;
    const HISTORY_STORAGE_KEY = 'startpage-search-history';
    const CONFIG_STORAGE_KEY = 'startpage-config';
    const IDLE_DELAY = 3000;

    function generateId(prefix = 'id') {
        return prefix + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    function loadConfig() {
        try {
            const saved = localStorage.getItem(CONFIG_STORAGE_KEY);
            if (saved) {
                const config = JSON.parse(saved);
                if (config.engines && Array.isArray(config.engines)) {
                    searchEngines = config.engines;
                }
                if (config.currentEngineIndex !== undefined) {
                    currentEngineIndex = config.currentEngineIndex;
                }
                if (config.stealth !== undefined) {
                    stealthMode = config.stealth;
                }
                if (config.bookmarks && Array.isArray(config.bookmarks)) {
                    bookmarks = config.bookmarks;
                }
            }
        } catch (_) {}

        if (searchEngines.length === 0) {
            fetch('./config.json')
                .then(r => r.ok ? r.json() : null)
                .then(cfg => {
                    if (cfg && cfg.engines) searchEngines = JSON.parse(JSON.stringify(cfg.engines));
                    if (cfg && cfg.bookmarks) bookmarks = JSON.parse(JSON.stringify(cfg.bookmarks));
                    if (searchEngines.length === 0) searchEngines = JSON.parse(JSON.stringify(DEFAULT_ENGINES));
                    if (bookmarks.length === 0) bookmarks = JSON.parse(JSON.stringify(DEFAULT_BOOKMARKS));
                })
                .catch(() => {
                    searchEngines = JSON.parse(JSON.stringify(DEFAULT_ENGINES));
                    bookmarks = JSON.parse(JSON.stringify(DEFAULT_BOOKMARKS));
                });
        }
        if (bookmarks.length === 0) {
            bookmarks = JSON.parse(JSON.stringify(DEFAULT_BOOKMARKS));
        }
    }

    function saveConfig() {
        try {
            const config = {
                engines: searchEngines,
                currentEngineIndex: currentEngineIndex,
                stealth: stealthMode,
                bookmarks: bookmarks
            };
            localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
        } catch (_) {}
    }

    function renderEngineSelect() {
        if (!engineSelect) return;
        
        engineSelect.innerHTML = '';
        searchEngines.forEach((engine, index) => {
            const opt = document.createElement('option');
            opt.value = index;
            opt.textContent = engine.name;
            if (index === currentEngineIndex) opt.selected = true;
            engineSelect.appendChild(opt);
        });
        
        searchInput.placeholder = `搜索 (${searchEngines[currentEngineIndex]?.name || '默认'})`;
    }

    function getCurrentEngine() {
        return searchEngines[currentEngineIndex] || searchEngines[0] || DEFAULT_ENGINES[0];
    }

    function addEngine(name, url) {
        searchEngines.push({
            id: generateId('engine'),
            name: name,
            url: url
        });
        saveConfig();
        renderEngineSelect();
    }

    function removeEngine(index) {
        if (searchEngines.length <= 1) {
            alert('至少保留一个搜索引擎');
            return;
        }
        searchEngines.splice(index, 1);
        if (currentEngineIndex >= searchEngines.length) {
            currentEngineIndex = searchEngines.length - 1;
        }
        saveConfig();
        renderEngineSelect();
    }

    function moveEngine(index, direction) {
        if (direction === 'up' && index > 0) {
            [searchEngines[index], searchEngines[index - 1]] = [searchEngines[index - 1], searchEngines[index]];
            if (currentEngineIndex === index) {
                currentEngineIndex--;
            } else if (currentEngineIndex === index - 1) {
                currentEngineIndex++;
            }
        } else if (direction === 'down' && index < searchEngines.length - 1) {
            [searchEngines[index], searchEngines[index + 1]] = [searchEngines[index + 1], searchEngines[index]];
            if (currentEngineIndex === index) {
                currentEngineIndex++;
            } else if (currentEngineIndex === index + 1) {
                currentEngineIndex--;
            }
        }
        saveConfig();
        renderEngineSelect();
    }

    function setDailyQuote() {
        const q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
        quoteText.textContent = `“${q.text}”`;
        quoteAuthor.textContent = `—— ${q.author}`;
    }

    const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

    function pad2(n) { return n < 10 ? '0' + n : '' + n; }

    function updateTime() {
        if (!timeMain || !timeDate) return;
        const now = new Date();
        timeMain.textContent = pad2(now.getHours()) + ':' + pad2(now.getMinutes()) + ':' + pad2(now.getSeconds());
        timeDate.textContent = now.getFullYear() + '年' + (now.getMonth() + 1) + '月' + now.getDate() + '日 · 星期' + WEEKDAYS[now.getDay()];
    }

    function initTime() {
        updateTime();
        setInterval(updateTime, 1000);
    }

    // ============= 模糊度 / 液态玻璃度 =============
    const EFFECT_STORAGE_KEY = 'startpage-effect';
    const LIQUID_COMPS_KEY = 'startpage-liquid-components';
    let effectSettings = { blur: 28, liquid: 50 };
    let liquidComponents = {
        time: true, quote: true, search: true, bookmarks: true,
        weather: false, wallpaper: false, settings: false,
        searchDot: false, settingsDot: false
    };
    const LIQUID_COMP_MAP = {
        time: '.time-display',
        quote: '.daily-quote-module',
        search: '.search-row',
        bookmarks: '.bookmarks-container',
        weather: '.weather-widget',
        wallpaper: '.wallpaper-info',
        settings: '.settings-popup',
        searchDot: '.search-dot',
        settingsDot: '.settings-dot'
    };

    function loadEffectSettings() {
        try {
            const saved = localStorage.getItem(EFFECT_STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (typeof parsed.blur === 'number') effectSettings.blur = parsed.blur;
                if (typeof parsed.liquid === 'number') effectSettings.liquid = parsed.liquid;
            }
        } catch (_) {}
    }

    function saveEffectSettings() {
        try { localStorage.setItem(EFFECT_STORAGE_KEY, JSON.stringify(effectSettings)); } catch (_) {}
    }

    function loadLiquidComponents() {
        try {
            const saved = localStorage.getItem(LIQUID_COMPS_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                Object.keys(liquidComponents).forEach(k => {
                    if (typeof parsed[k] === 'boolean') liquidComponents[k] = parsed[k];
                });
            }
        } catch (_) {}
    }

    function saveLiquidComponents() {
        try { localStorage.setItem(LIQUID_COMPS_KEY, JSON.stringify(liquidComponents)); } catch (_) {}
    }

    function applyEffectSettings() {
        const root = document.documentElement;
        root.style.setProperty('--glass-blur', effectSettings.blur + 'px');
        const liquidRatio = effectSettings.liquid / 100;
        root.style.setProperty('--liquid-highlight', (0.05 + liquidRatio * 0.35).toFixed(3));
        root.style.setProperty('--liquid-edge', (0.04 + liquidRatio * 0.12).toFixed(3));
        root.style.setProperty('--liquid-shine', (0.3 + liquidRatio * 1.2).toFixed(3));
        root.style.setProperty('--liquid-shadow', (0.12 + liquidRatio * 0.25).toFixed(3));
        applyLiquidToComponents();
    }

    function applyLiquidToComponents() {
        const globalEnabled = effectSettings.liquid > 0;
        Object.keys(LIQUID_COMP_MAP).forEach(key => {
            const selector = LIQUID_COMP_MAP[key];
            const els = document.querySelectorAll(selector);
            const shouldApply = globalEnabled && liquidComponents[key];
            els.forEach(el => {
                el.classList.toggle('liquid-glass', shouldApply);
            });
        });
    }

    function toggleLiquidComponent(key, enabled) {
        if (!(key in liquidComponents)) return;
        liquidComponents[key] = !!enabled;
        applyLiquidToComponents();
        saveLiquidComponents();
    }

    function setBlurLevel(value) {
        effectSettings.blur = Math.max(0, Math.min(60, parseInt(value) || 0));
        applyEffectSettings();
        saveEffectSettings();
        const valEl = document.getElementById('blurValue');
        if (valEl) valEl.textContent = effectSettings.blur;
        const slider = document.getElementById('blurSlider');
        if (slider) slider.value = effectSettings.blur;
    }

    function setLiquidLevel(value) {
        effectSettings.liquid = Math.max(0, Math.min(100, parseInt(value) || 0));
        applyEffectSettings();
        saveEffectSettings();
        const valEl = document.getElementById('liquidValue');
        if (valEl) valEl.textContent = effectSettings.liquid;
        const slider = document.getElementById('liquidSlider');
        if (slider) slider.value = effectSettings.liquid;
    }

    function initEffectControls() {
        const blurSlider = document.getElementById('blurSlider');
        const liquidSlider = document.getElementById('liquidSlider');
        if (blurSlider) {
            blurSlider.value = effectSettings.blur;
            blurSlider.addEventListener('input', e => setBlurLevel(e.target.value));
        }
        if (liquidSlider) {
            liquidSlider.value = effectSettings.liquid;
            liquidSlider.addEventListener('input', e => setLiquidLevel(e.target.value));
        }
        document.querySelectorAll('input[data-liquid-comp]').forEach(cb => {
            const key = cb.getAttribute('data-liquid-comp');
            if (key in liquidComponents) {
                cb.checked = liquidComponents[key];
                cb.addEventListener('change', e => {
                    toggleLiquidComponent(key, e.target.checked);
                });
            }
        });
        applyEffectSettings();
    }

    // ============= 联想搜索 =============
    let activeSuggestionIndex = -1;
    let currentSuggestions = [];

    function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
    }

    function highlightMatch(text, query) {
        const lower = text.toLowerCase();
        const q = query.toLowerCase();
        const idx = lower.indexOf(q);
        if (idx < 0) return escapeHtml(text);
        return escapeHtml(text.substring(0, idx)) +
            '<mark>' + escapeHtml(text.substring(idx, idx + q.length)) + '</mark>' +
            escapeHtml(text.substring(idx + q.length));
    }

    function updateSuggestions(query) {
        if (!searchSuggestions) return;
        const q = (query || '').trim();
        if (!q) {
            searchSuggestions.classList.remove('visible');
            searchSuggestions.innerHTML = '';
            currentSuggestions = [];
            activeSuggestionIndex = -1;
            return;
        }
        const ql = q.toLowerCase();
        const matches = searchHistoryData.filter(item => {
            const il = item.toLowerCase();
            return il.includes(ql) && il !== ql;
        }).slice(0, 8);
        currentSuggestions = matches;
        activeSuggestionIndex = -1;
        if (matches.length === 0) {
            searchSuggestions.classList.remove('visible');
            searchSuggestions.innerHTML = '';
            return;
        }
        searchSuggestions.innerHTML = matches.map(item =>
            '<div class="suggestion-item" data-value="' + escapeHtml(item) + '">' + highlightMatch(item, q) + '</div>'
        ).join('');
        searchSuggestions.classList.add('visible');
    }

    function setActiveSuggestion(idx) {
        if (!searchSuggestions) return;
        const items = searchSuggestions.querySelectorAll('.suggestion-item');
        items.forEach((el, i) => el.classList.toggle('active', i === idx));
        if (idx >= 0 && items[idx]) {
            items[idx].scrollIntoView({ block: 'nearest' });
        }
    }

    function pickSuggestion(value) {
        if (!searchInput) return;
        searchInput.value = value;
        if (searchSuggestions) {
            searchSuggestions.classList.remove('visible');
            searchSuggestions.innerHTML = '';
        }
        currentSuggestions = [];
        activeSuggestionIndex = -1;
        performSearch();
    }

    function initSuggestions() {
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                updateSuggestions(searchInput.value);
                resetIdle();
            });
            searchInput.addEventListener('keydown', e => {
                if (e.key === 'ArrowDown' && currentSuggestions.length > 0) {
                    e.preventDefault();
                    activeSuggestionIndex = (activeSuggestionIndex + 1) % currentSuggestions.length;
                    setActiveSuggestion(activeSuggestionIndex);
                } else if (e.key === 'ArrowUp' && currentSuggestions.length > 0) {
                    e.preventDefault();
                    activeSuggestionIndex = activeSuggestionIndex <= 0
                        ? currentSuggestions.length - 1
                        : activeSuggestionIndex - 1;
                    setActiveSuggestion(activeSuggestionIndex);
                } else if (e.key === 'Enter' && activeSuggestionIndex >= 0 && currentSuggestions[activeSuggestionIndex]) {
                    e.preventDefault();
                    pickSuggestion(currentSuggestions[activeSuggestionIndex]);
                } else if (e.key === 'Escape') {
                    if (searchSuggestions) {
                        searchSuggestions.classList.remove('visible');
                    }
                    activeSuggestionIndex = -1;
                }
            });
        }
        if (searchSuggestions) {
            searchSuggestions.addEventListener('click', e => {
                const item = e.target.closest('.suggestion-item');
                if (!item) return;
                pickSuggestion(item.dataset.value);
            });
        }
    }

    function saveSearchHistory(query) {
        if (!query || query.trim() === '') return;
        const trimmed = query.trim();
        
        searchHistoryData = searchHistoryData.filter(item => item !== trimmed);
        searchHistoryData.unshift(trimmed);
        
        if (searchHistoryData.length > MAX_HISTORY) {
            searchHistoryData = searchHistoryData.slice(0, MAX_HISTORY);
        }
        
        try {
            localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(searchHistoryData));
        } catch (_) {}
        
        renderSearchHistory();
    }

    function loadSearchHistory() {
        try {
            const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
            if (saved) {
                searchHistoryData = JSON.parse(saved);
            }
        } catch (_) {
            searchHistoryData = [];
        }
        renderSearchHistory();
    }

    function clearSearchHistory() {
        searchHistoryData = [];
        try {
            localStorage.removeItem(HISTORY_STORAGE_KEY);
        } catch (_) {}
        renderSearchHistory();
    }

    function removeFromHistory(item) {
        searchHistoryData = searchHistoryData.filter(h => h !== item);
        try {
            localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(searchHistoryData));
        } catch (_) {}
        renderSearchHistory();
    }

    function renderSearchHistory() {
        if (!historyTags) return;
        
        historyTags.innerHTML = '';
        
        if (searchHistoryData.length === 0) {
            const noHistory = document.createElement('div');
            noHistory.className = 'no-history';
            noHistory.textContent = '暂无搜索记录';
            historyTags.appendChild(noHistory);
            return;
        }
        
        searchHistoryData.forEach(item => {
            const tag = document.createElement('div');
            tag.className = 'history-tag';
            tag.innerHTML = `<span>${item}</span><span class="remove-tag">×</span>`;
            
            tag.addEventListener('click', function(e) {
                if (e.target.classList.contains('remove-tag')) {
                    e.stopPropagation();
                    removeFromHistory(item);
                    return;
                }
                searchInput.value = item;
                performSearch();
            });
            
            historyTags.appendChild(tag);
        });
    }

    function performSearch() {
        const query = searchInput.value.trim();
        if (!query) return;
        
        saveSearchHistory(query);
        
        const engine = getCurrentEngine();
        const url = engine.url + encodeURIComponent(query);
        window.open(url, '_blank');
        
        searchInput.value = '';
    }

    function showSearch() {
        if (stealthMode) {
            clearTimeout(hoverTimeout);
            searchExpandContainer.classList.add('expanded');
            if (searchDot) {
                searchDot.classList.add('hidden-when-expanded');
            }
            requestAnimationFrame(() => {
                searchInput.focus();
            });
        }
    }

    function hideSearch() {
        if (stealthMode) {
            hoverTimeout = setTimeout(() => {
                const isOverDot = searchDot && searchDot.matches(':hover');
                const isOverContainer = searchExpandContainer && searchExpandContainer.matches(':hover');
                const isOverWrapper = searchDotWrapper && searchDotWrapper.matches(':hover');
                const isOverBookmarks = bookmarksContainer && bookmarksContainer.matches(':hover');
                const hasValue = searchInput && searchInput.value && searchInput.value.trim() !== '';

                if (!isOverDot && !isOverContainer && !isOverWrapper && !isOverBookmarks && !hasValue) {
                    searchExpandContainer.classList.remove('expanded');
                    if (searchDot) {
                        searchDot.classList.remove('hidden-when-expanded');
                    }
                    searchInput.blur();
                }
            }, 150);
        }
    }

    if (searchExpandContainer) {
        searchExpandContainer.addEventListener('mouseenter', function() {
            clearTimeout(hoverTimeout);
        });

        searchExpandContainer.addEventListener('mouseleave', function() {
            hideSearch();
        });
    }

    if (bookmarksContainer) {
        bookmarksContainer.addEventListener('mouseenter', function() {
            clearTimeout(hoverTimeout);
        });

        bookmarksContainer.addEventListener('mouseleave', function() {
            hideSearch();
        });
    }
    if (searchDot) {
        searchDot.addEventListener('mouseenter', showSearch);
        searchDot.addEventListener('mouseleave', hideSearch);
    }

    if (searchDotWrapper) {
        searchDotWrapper.addEventListener('mouseleave', function() {
            hideSearch();
        });
    }

    // ===== 触摸设备支持 =====
    if (searchDot) {
        searchDot.addEventListener('touchstart', function(e) {
            if (!stealthMode) return;
            e.preventDefault();
            showSearch();
        }, { passive: false });
    }
    document.addEventListener('touchstart', function(e) {
        if (!stealthMode) return;
        if (!searchExpandContainer || !searchExpandContainer.classList.contains('expanded')) return;
        const target = e.target;
        const inDot = searchDot && searchDot.contains(target);
        const inContainer = searchExpandContainer && searchExpandContainer.contains(target);
        const inBookmarks = bookmarksContainer && bookmarksContainer.contains(target);
        const inSuggestions = searchSuggestions && searchSuggestions.contains(target);
        if (!inDot && !inContainer && !inBookmarks && !inSuggestions) {
            hideSearch();
        }
    }, { passive: true });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && stealthMode) {
            searchExpandContainer.classList.remove('expanded');
            if (searchDot) {
                searchDot.classList.remove('hidden-when-expanded');
            }
            searchInput.blur();
        }
    });

    function updateStealthVisibility() {
        if (!searchDotWrapper || !searchExpandContainer) return;

        if (stealthMode) {
            searchDotWrapper.classList.remove('stealth-off');
            searchExpandContainer.classList.remove('expanded');
            if (searchDot) {
                searchDot.classList.remove('hidden-when-expanded');
            }
        } else {
            searchDotWrapper.classList.add('stealth-off');
            searchExpandContainer.classList.add('expanded');
            if (searchDot) {
                searchDot.classList.add('hidden-when-expanded');
            }
            requestAnimationFrame(() => {
                searchInput.focus();
            });
        }
    }

    function setStealthMode(enabled) {
        stealthMode = enabled;
        updateStealthVisibility();
        saveConfig();
        if (window.__settings) {
            window.__settings.updateStealthButtons(enabled);
        }
    }

    function loadStealthPreference() {
        updateStealthVisibility();
        if (window.__settings) {
            window.__settings.updateStealthButtons(stealthMode);
        }
    }

    function addBookmark(name, url, icon) {
        if (!name || !url) return;
        
        const trimmedName = name.trim();
        const trimmedUrl = url.trim();
        
        if (trimmedName === '' || trimmedUrl === '') {
            alert('名称和URL不能为空');
            return;
        }
        
        let finalUrl = trimmedUrl;
        if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
            finalUrl = 'https://' + finalUrl;
        }
        
        let finalIcon = icon ? icon.trim().substring(0, 4) : getDefaultIcon(trimmedName);
        
        bookmarks.push({
            id: generateId('bm'),
            name: trimmedName,
            url: finalUrl,
            icon: finalIcon
        });
        
        saveConfig();
        renderBookmarks();
    }

    function removeBookmark(index) {
        bookmarks.splice(index, 1);
        saveConfig();
        renderBookmarks();
    }

    function moveBookmark(index, direction) {
        if (direction === 'up' && index > 0) {
            [bookmarks[index], bookmarks[index - 1]] = [bookmarks[index - 1], bookmarks[index]];
        } else if (direction === 'down' && index < bookmarks.length - 1) {
            [bookmarks[index], bookmarks[index + 1]] = [bookmarks[index + 1], bookmarks[index]];
        }
        saveConfig();
        renderBookmarks();
    }

    function getDefaultIcon(name) {
        const iconMap = {
            'github': 'GH', 'git': 'GH',
            'bilibili': 'B', 'b站': 'B', 'bili': 'B',
            '知乎': '知', 'zhihu': '知',
            '掘金': '掘', 'juejin': '掘',
            'csdn': 'C',
            'youtube': 'YT', 'yt': 'YT',
            '微博': '微', 'weibo': '微',
            '豆瓣': '豆', 'douban': '豆',
            '百度': '百', 'baidu': '百',
            'google': 'G', '谷歌': 'G',
            'bing': 'B', '必应': 'B',
            '淘宝': '淘', 'taobao': '淘',
            '京东': '京', 'jd': '京',
            '美团': '美', 'meituan': '美',
            '网易': '网', '163': '网',
            '腾讯': '腾', 'qq': '腾',
            '微信': '微', 'wechat': '微',
            '抖音': '抖', 'douyin': '抖',
            '小红书': '红', 'xiaohongshu': '红'
        };
        
        const lowerName = name.toLowerCase();
        for (const [key, val] of Object.entries(iconMap)) {
            if (lowerName.includes(key)) {
                return val;
            }
        }
        
        return name.substring(0, 2).toUpperCase();
    }

    function renderBookmarks() {
        if (!bookmarksGrid) return;
        
        bookmarksGrid.innerHTML = '';
        
        if (bookmarks.length === 0) {
            const noBookmarks = document.createElement('div');
            noBookmarks.className = 'no-bookmarks';
            noBookmarks.textContent = '暂无收藏网站';
            bookmarksGrid.appendChild(noBookmarks);
            return;
        }
        
        bookmarks.forEach((bookmark, index) => {
            const card = document.createElement('div');
            card.className = 'bookmark-card';
            card.style.animationDelay = `${index * 50}ms`;
            
            const icon = document.createElement('div');
            icon.className = 'bookmark-icon';
            icon.textContent = bookmark.icon;
            icon.style.background = getRandomGradient();
            
            const name = document.createElement('div');
            name.className = 'bookmark-name';
            name.textContent = bookmark.name;
            
            const removeBtn = document.createElement('button');
            removeBtn.className = 'bookmark-remove';
            removeBtn.textContent = '×';
            removeBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                if (confirm(`确定要删除 "${bookmark.name}" 吗？`)) {
                    removeBookmark(index);
                }
            });
            
            card.appendChild(icon);
            card.appendChild(name);
            card.appendChild(removeBtn);
            
            card.addEventListener('click', function() {
                window.open(bookmark.url, '_blank');
            });
            
            bookmarksGrid.appendChild(card);
        });
    }

    function getRandomGradient() {
        const gradients = [
            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
            'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
            'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
            'linear-gradient(135deg, #ff6e7f 0%, #bfe9ff 100%)',
            'linear-gradient(135deg, #c471ed 0%, #f64f59 100%)',
            'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
            'linear-gradient(135deg, #fc4a1a 0%, #f7b733 100%)'
        ];
        return gradients[Math.floor(Math.random() * gradients.length)];
    }

    const WEATHER_ICONS = {
        'Clear': '☀️', 'Sunny': '☀️',
        'Partly cloudy': '⛅', 'Cloudy': '☁️', 'Overcast': '☁️',
        'Mist': '🌫️', 'Fog': '🌫️',
        'Light rain': '🌦️', 'Rain': '🌧️', 'Heavy rain': '⛈️',
        'Snow': '❄️', 'Light snow': '🌨️', 'Heavy snow': '❄️',
        'Thunderstorm': '⛈️', 'Thunder': '⛈️',
        'Sleet': '🌨️', 'Drizzle': '🌦️'
    };

    const weatherLoading = document.getElementById('weatherLoading');
    const weatherContent = document.getElementById('weatherContent');
    const weatherIcon = document.getElementById('weatherIcon');
    const weatherTemp = document.getElementById('weatherTemp');
    const weatherDesc = document.getElementById('weatherDesc');
    const weatherCity = document.getElementById('weatherCity');

    function getWeatherEmoji(desc) {
        if (!desc) return '🌤️';
        for (const key of Object.keys(WEATHER_ICONS)) {
            if (desc.toLowerCase().includes(key.toLowerCase())) {
                return WEATHER_ICONS[key];
            }
        }
        return '🌤️';
    }

    function getSavedCity() {
        try { return localStorage.getItem('startpage-weather-city') || ''; } catch (_) { return ''; }
    }

    function setSavedCity(city) {
        try { localStorage.setItem('startpage-weather-city', city); } catch (_) {}
    }

    function renderWeather(data) {
        if (!data || !data.current_condition || !data.current_condition[0]) return;
        const cur = data.current_condition[0];
        const desc = (cur.weatherDesc && cur.weatherDesc[0] && cur.weatherDesc[0].value) || '未知';
        const area = (data.nearest_area && data.nearest_area[0]) || {};
        const cityName = (area.areaName && area.areaName[0] && area.areaName[0].value) || '当前位置';
        const country = (area.country && area.country[0] && area.country[0].value) || '';
        weatherIcon.textContent = getWeatherEmoji(desc);
        weatherTemp.textContent = cur.temp_C + '°C';
        weatherDesc.textContent = desc;
        weatherCity.textContent = country ? (cityName + ' · ' + country) : cityName;
        weatherLoading.style.display = 'none';
        weatherContent.style.display = 'flex';
    }

    function fetchWeather(city) {
        const url = city
            ? 'https://wttr.in/' + encodeURIComponent(city) + '?format=j1&lang=zh'
            : 'https://wttr.in/?format=j1&lang=zh';
        return fetch(url, { headers: { 'Accept-Language': 'zh' } })
            .then(res => { if (!res.ok) throw new Error('weather http ' + res.status); return res.json(); });
    }

    function initWeather() {
        const savedCity = getSavedCity();
        if (savedCity) {
            fetchWeather(savedCity)
                .then(renderWeather)
                .catch(() => {
                    fetchWeather('').then(renderWeather).catch(() => {
                        weatherLoading.textContent = '天气加载失败';
                    });
                });
        } else {
            if (navigator.geolocation && navigator.geolocation.getCurrentPosition) {
                navigator.geolocation.getCurrentPosition(function(pos) {
                    const lat = pos.coords.latitude.toFixed(2);
                    const lon = pos.coords.longitude.toFixed(2);
                    fetchWeather(lat + ',' + lon)
                        .then(renderWeather)
                        .catch(() => fetchWeather('').then(renderWeather).catch(() => {
                            weatherLoading.textContent = '天气加载失败';
                        }));
                }, function() {
                    fetchWeather('').then(renderWeather).catch(() => {
                        weatherLoading.textContent = '天气加载失败';
                    });
                }, { timeout: 5000 });
            } else {
                fetchWeather('').then(renderWeather).catch(() => {
                    weatherLoading.textContent = '天气加载失败';
                });
            }
        }
    }

    function isInteracting() {
        if (searchInput && document.activeElement === searchInput) return true;
        if (searchInput && searchInput.value && searchInput.value.trim() !== '') return true;
        if (searchSuggestions && searchSuggestions.matches(':hover')) return true;
        if (searchSuggestions && searchSuggestions.classList.contains('visible')) return true;
        if (searchDot && searchDot.matches(':hover')) return true;
        if (searchExpandContainer && searchExpandContainer.matches(':hover')) return true;
        if (bookmarksContainer && bookmarksContainer.matches(':hover')) return true;
        return false;
    }

    function applyIdleState() {
        if (isInteracting()) {
            document.body.classList.remove('idle');
        } else {
            document.body.classList.add('idle');
        }
    }

    function resetIdle() {
        clearTimeout(idleTimeout);
        document.body.classList.remove('idle');
        idleTimeout = setTimeout(applyIdleState, IDLE_DELAY);
    }

    function setupIdleDetection() {
        ['mousemove', 'keydown', 'mousedown', 'scroll', 'touchstart'].forEach(evt => {
            document.addEventListener(evt, resetIdle, { passive: true });
        });
        resetIdle();
    }

    function initMain() {
        loadConfig();
        loadEffectSettings();
        loadLiquidComponents();
        renderEngineSelect();
        setDailyQuote();
        initTime();
        loadSearchHistory();
        renderBookmarks();
        initWeather();
        initSuggestions();
        initEffectControls();
        setupIdleDetection();

        if (searchBtn) {
            searchBtn.addEventListener('click', performSearch);
        }
        
        if (searchInput) {
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') performSearch();
            });
        }

        if (engineSelect) {
            engineSelect.addEventListener('change', function() {
                const idx = parseInt(this.value);
                currentEngineIndex = idx;
                searchInput.placeholder = `搜索 (${searchEngines[idx]?.name || '默认'})`;
                saveConfig();
            });
        }

        if (clearHistoryBtn) {
            clearHistoryBtn.addEventListener('click', clearSearchHistory);
        }

        if (addBookmarkBtn) {
            addBookmarkBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                const name = prompt('请输入网站名称:', '新网站');
                if (name === null) return;
                
                const url = prompt('请输入网站URL:', 'https://');
                if (url === null) return;
                
                const icon = prompt('请输入网站图标（1-4个字符，可选）:', getDefaultIcon(name));
                
                addBookmark(name, url, icon);
            });
        }

        loadStealthPreference();

        console.log('✅ main.js 已加载');
    }

    window.__main = {
        performSearch,
        currentEngine: getCurrentEngine,
        setStealthMode,
        loadStealthPreference,
        saveSearchHistory,
        loadSearchHistory,
        clearSearchHistory,
        addEngine,
        removeEngine,
        moveEngine,
        getEngines: () => searchEngines,
        saveConfig,
        addBookmark,
        removeBookmark,
        moveBookmark,
        getBookmarks: () => bookmarks,
        renderBookmarks,
        refreshWeather: initWeather
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMain);
    } else {
        initMain();
    }
})();