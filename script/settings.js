(function() {
    'use strict';

    const settingsDot = document.getElementById('settingsDot');
    const settingsPopup = document.getElementById('settingsPopup');
    const settingsClose = document.getElementById('settingsClose');
    const settingsBody = document.getElementById('settingsBody');
    const bgBtns = settingsPopup.querySelectorAll('[data-bg]');
    const themeBtns = settingsPopup.querySelectorAll('.theme-btn');
    const stealthBtns = settingsPopup.querySelectorAll('.stealth-btn');

    let isOpen = false;

    function toggleSettings(open) {
        isOpen = open !== undefined ? open : !isOpen;
        settingsPopup.classList.toggle('open', isOpen);
        if (isOpen) {
            renderEngineList();
            renderBookmarksList();
        }
    }

    settingsDot.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleSettings(true);
    });

    settingsClose.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleSettings(false);
    });

    document.addEventListener('click', function(e) {
        if (isOpen && !settingsPopup.contains(e.target) && e.target !== settingsDot) {
            toggleSettings(false);
        }
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && isOpen) {
            toggleSettings(false);
        }
    });

    function setTheme(theme) {
        document.body.classList.remove('theme-light', 'theme-dark', 'theme-system');
        if (theme === 'light') document.body.classList.add('theme-light');
        else if (theme === 'dark') document.body.classList.add('theme-dark');
        else if (theme === 'system') document.body.classList.add('theme-system');
        themeBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.theme === theme));
        try { localStorage.setItem('startpage-theme', theme); } catch (_) {}
    }

    function loadThemePreference() {
        let preferred = 'system';
        try { const saved = localStorage.getItem('startpage-theme'); if (saved) preferred = saved; } catch (_) {}
        const exists = Array.from(themeBtns).some(btn => btn.dataset.theme === preferred);
        if (!exists) preferred = 'system';
        setTheme(preferred);
    }

    function setWallpaper(type) {
        bgBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.bg === type));
        try { localStorage.setItem('startpage-wallpaper', type); } catch (_) {}
        if (window.__video) {
            switch (type) {
                case 'anime': window.__video.loadAnimeBackground(); break;
                case 'bing': window.__video.loadBingBackground(); break;
                case 'unsplash': window.__video.loadUnsplashBackground(); break;
                case 'pexels': window.__video.loadPexelsBackground(); break;
                case 'video': window.__video.loadVideoBackground(); break;
                case 'custom': window.__video.loadCustomBackground(); break;
                case 'local': window.__video.loadLocalVideo(); break;
                default: break;
            }
        }
    }

    function setStealth(enabled) {
        stealthBtns.forEach(btn => {
            btn.classList.toggle('active', (btn.dataset.stealth === 'on') === enabled);
        });
        if (window.__main) {
            window.__main.setStealthMode(enabled);
        }
    }

    function updateStealthButtons(enabled) {
        stealthBtns.forEach(btn => {
            btn.classList.toggle('active', (btn.dataset.stealth === 'on') === enabled);
        });
    }

    function addEngine() {
        const name = prompt('请输入搜索引擎名称:', '新搜索引擎');
        if (name === null) return;
        const trimmedName = name.trim();
        if (trimmedName === '') { alert('名称不能为空'); return; }
        
        const url = prompt('请输入搜索URL (使用 {query} 作为占位符):', 'https://example.com/search?q={query}');
        if (url === null) return;
        const trimmedUrl = url.trim();
        if (trimmedUrl === '') { alert('URL不能为空'); return; }
        
        const formattedUrl = trimmedUrl.replace('{query}', '');
        
        if (window.__main) {
            window.__main.addEngine(trimmedName, formattedUrl);
            renderEngineList();
        }
    }

    function removeEngine(index) {
        if (window.__main) {
            window.__main.removeEngine(index);
            renderEngineList();
        }
    }

    function moveEngine(index, direction) {
        if (window.__main) {
            window.__main.moveEngine(index, direction);
            renderEngineList();
        }
    }

    function renderEngineList() {
        let engineListContainer = document.getElementById('engineListContainer');
        if (!engineListContainer) {
            engineListContainer = document.createElement('div');
            engineListContainer.id = 'engineListContainer';
            engineListContainer.className = 'settings-group engine-list-group';
            
            const label = document.createElement('span');
            label.className = 'settings-label';
            label.textContent = '🔍 搜索引擎';
            engineListContainer.appendChild(label);
            
            const addBtn = document.createElement('button');
            addBtn.className = 'settings-btn engine-add-btn';
            addBtn.textContent = '+ 添加';
            addBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                addEngine();
            });
            engineListContainer.appendChild(addBtn);
            
            const divider = document.createElement('div');
            divider.className = 'settings-divider';
            engineListContainer.appendChild(divider);
            
            const list = document.createElement('div');
            list.id = 'engineList';
            list.className = 'engine-list';
            engineListContainer.appendChild(list);
            
            settingsBody.appendChild(engineListContainer);
        }
        
        const list = document.getElementById('engineList');
        if (!list) return;
        
        list.innerHTML = '';
        
        const engines = window.__main ? window.__main.getEngines() : [];
        engines.forEach((engine, index) => {
            const item = document.createElement('div');
            item.className = 'engine-list-item';
            
            const arrowUp = document.createElement('button');
            arrowUp.className = 'engine-arrow-btn';
            arrowUp.textContent = '↑';
            arrowUp.disabled = index === 0;
            arrowUp.addEventListener('click', function(e) {
                e.stopPropagation();
                moveEngine(index, 'up');
            });
            
            const arrowDown = document.createElement('button');
            arrowDown.className = 'engine-arrow-btn';
            arrowDown.textContent = '↓';
            arrowDown.disabled = index === engines.length - 1;
            arrowDown.addEventListener('click', function(e) {
                e.stopPropagation();
                moveEngine(index, 'down');
            });
            
            const name = document.createElement('span');
            name.className = 'engine-name';
            name.textContent = engine.name;
            
            const url = document.createElement('span');
            url.className = 'engine-url';
            url.textContent = engine.url;
            
            const removeBtn = document.createElement('button');
            removeBtn.className = 'engine-remove-btn';
            removeBtn.textContent = '×';
            removeBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                if (confirm(`确定要删除 "${engine.name}" 吗？`)) {
                    removeEngine(index);
                }
            });
            
            item.appendChild(arrowUp);
            item.appendChild(arrowDown);
            const info = document.createElement('div');
            info.className = 'engine-info';
            info.appendChild(name);
            info.appendChild(url);
            item.appendChild(info);
            item.appendChild(removeBtn);
            
            list.appendChild(item);
        });
    }

    function addBookmark() {
        if (!window.__main) return;
        
        const name = prompt('请输入网站名称:', '新网站');
        if (name === null) return;
        
        const url = prompt('请输入网站URL:', 'https://');
        if (url === null) return;
        
        const icon = prompt('请输入网站图标（1-4个字符，可选）:');
        
        window.__main.addBookmark(name, url, icon);
        renderBookmarksList();
    }

    function removeBookmark(index) {
        if (window.__main) {
            window.__main.removeBookmark(index);
            renderBookmarksList();
        }
    }

    function moveBookmark(index, direction) {
        if (window.__main) {
            window.__main.moveBookmark(index, direction);
            renderBookmarksList();
        }
    }

    function editBookmarkIcon(index) {
        const bookmarks = window.__main ? window.__main.getBookmarks() : [];
        const bookmark = bookmarks[index];
        if (!bookmark) return;
        
        const newIcon = prompt('请输入新的图标（1-4个字符）:', bookmark.icon);
        if (newIcon === null) return;
        
        const trimmedIcon = newIcon.trim().substring(0, 4);
        if (trimmedIcon === '') {
            alert('图标不能为空');
            return;
        }
        
        bookmark.icon = trimmedIcon;
        window.__main.saveConfig();
        window.__main.renderBookmarks();
        renderBookmarksList();
    }

    function renderBookmarksList() {
        let bookmarksListContainer = document.getElementById('bookmarksListContainer');
        if (!bookmarksListContainer) {
            bookmarksListContainer = document.createElement('div');
            bookmarksListContainer.id = 'bookmarksListContainer';
            bookmarksListContainer.className = 'settings-group engine-list-group';
            
            const label = document.createElement('span');
            label.className = 'settings-label';
            label.textContent = '⭐ 收藏网站';
            bookmarksListContainer.appendChild(label);
            
            const addBtn = document.createElement('button');
            addBtn.className = 'settings-btn engine-add-btn';
            addBtn.textContent = '+ 添加';
            addBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                addBookmark();
            });
            bookmarksListContainer.appendChild(addBtn);
            
            const divider = document.createElement('div');
            divider.className = 'settings-divider';
            bookmarksListContainer.appendChild(divider);
            
            const list = document.createElement('div');
            list.id = 'bookmarksList';
            list.className = 'engine-list';
            bookmarksListContainer.appendChild(list);
            
            const stealthGroup = document.querySelector('.settings-group:last-child');
            if (stealthGroup) {
                stealthGroup.parentNode.insertBefore(bookmarksListContainer, stealthGroup);
            } else {
                settingsBody.appendChild(bookmarksListContainer);
            }
        }
        
        const list = document.getElementById('bookmarksList');
        if (!list) return;
        
        list.innerHTML = '';
        
        const bookmarks = window.__main ? window.__main.getBookmarks() : [];
        bookmarks.forEach((bookmark, index) => {
            const item = document.createElement('div');
            item.className = 'engine-list-item';
            
            const arrowUp = document.createElement('button');
            arrowUp.className = 'engine-arrow-btn';
            arrowUp.textContent = '↑';
            arrowUp.disabled = index === 0;
            arrowUp.addEventListener('click', function(e) {
                e.stopPropagation();
                moveBookmark(index, 'up');
            });
            
            const arrowDown = document.createElement('button');
            arrowDown.className = 'engine-arrow-btn';
            arrowDown.textContent = '↓';
            arrowDown.disabled = index === bookmarks.length - 1;
            arrowDown.addEventListener('click', function(e) {
                e.stopPropagation();
                moveBookmark(index, 'down');
            });
            
            const icon = document.createElement('span');
            icon.className = 'bookmark-icon-small';
            icon.textContent = bookmark.icon;
            
            const name = document.createElement('span');
            name.className = 'engine-name';
            name.textContent = bookmark.name;
            
            const url = document.createElement('span');
            url.className = 'engine-url';
            url.textContent = bookmark.url;
            
            const editBtn = document.createElement('button');
            editBtn.className = 'engine-edit-btn';
            editBtn.textContent = '✎';
            editBtn.title = '编辑图标';
            editBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                editBookmarkIcon(index);
            });
            
            const removeBtn = document.createElement('button');
            removeBtn.className = 'engine-remove-btn';
            removeBtn.textContent = '×';
            removeBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                if (confirm(`确定要删除 "${bookmark.name}" 吗？`)) {
                    removeBookmark(index);
                }
            });
            
            item.appendChild(arrowUp);
            item.appendChild(arrowDown);
            const info = document.createElement('div');
            info.className = 'engine-info';
            info.appendChild(icon);
            info.appendChild(name);
            info.appendChild(url);
            item.appendChild(info);
            item.appendChild(editBtn);
            item.appendChild(removeBtn);
            
            list.appendChild(item);
        });
    }

    function initSettings() {
        themeBtns.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                setTheme(this.dataset.theme);
            });
        });
        bgBtns.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                setWallpaper(this.dataset.bg);
            });
        });
        stealthBtns.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const enabled = this.dataset.stealth === 'on';
                setStealth(enabled);
            });
        });

        loadThemePreference();

        const savedBg = (() => { try { return localStorage.getItem('startpage-wallpaper'); } catch (_) { return null; } })() || 'bing';
        const defaultBg = document.querySelector('[data-bg="' + savedBg + '"]') || document.querySelector('[data-bg="bing"]');
        if (defaultBg) defaultBg.classList.add('active');
        if (window.__video && savedBg) {
            switch (savedBg) {
                case 'bing': window.__video.loadBingBackground(); break;
                case 'unsplash': window.__video.loadUnsplashBackground(); break;
                case 'pexels': window.__video.loadPexelsBackground(); break;
                case 'video': window.__video.loadVideoBackground(); break;
                default: break;
            }
        }

        if (window.__main) {
            const saved = localStorage.getItem('startpage-stealth');
            const enabled = saved !== 'off';
            updateStealthButtons(enabled);
        }

        console.log('✅ settings.js 已加载');
    }

    window.__settings = {
        setTheme,
        setWallpaper,
        loadThemePreference,
        setStealth,
        updateStealthButtons,
        toggleSettings,
        renderEngineList,
        renderBookmarksList
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSettings);
    } else {
        initSettings();
    }
})();