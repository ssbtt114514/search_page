(function() {
    'use strict';

    const BING_IMAGE_API = 'https://bing.com/HPImageArchive.aspx?format=js&idx=0&n=1';
    const ANIME_API = 'https://api.btstu.cn/sjbz/api.php?format=json&lx=dongman';
    const UNSPLASH_API = 'https://api.unsplash.com/photos/random?orientation=landscape&per_page=1';
    const PEXELS_API = 'https://api.pexels.com/v1/search?query=nature+landscape&per_page=1&orientation=landscape';
    const SAMPLE_VIDEO = 'https://assets.mixkit.co/videos/preview/mixkit-forest-stream-2217-large.mp4';

    const bgLayer = document.getElementById('bg-layer');
    const volumeSlider = document.getElementById('volumeSlider');
    const muteToggle = document.getElementById('muteToggle');
    const wallpaperSource = document.getElementById('wallpaperSource');
    const wallpaperAuthor = document.getElementById('wallpaperAuthor');
    const wallpaperInfo = document.getElementById('wallpaperInfo');

    let videoElement = null;
    let isMuted = false;
    let volumeValue = 0.6;
    let customVideoUrl = SAMPLE_VIDEO;
    let currentBgType = 'anime';
    let bgLoadInProgress = false;
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let currentTranslateX = 0;
    let currentTranslateY = 0;

    const WALLPAPER_SOURCES = {
        anime: { name: '二次元', icon: '🎨', fallback: 'https://api.btstu.cn/sjbz/api.php?lx=dongman&format=images' },
        bing: { name: '必应', icon: '🌅', fallback: 'https://bing.com/az/hprichbg/rb/StJohnsCoast_EN-US9365784974_1920x1080.jpg' },
        unsplash: { name: 'Unsplash', icon: '🖼️', fallback: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop' },
        pexels: { name: 'Pexels', icon: '📷', fallback: 'https://images.pexels.com/photos/158163/clouds-cloudporn-weather-lookup-158163.jpeg?w=1920&h=1080&fit=crop' }
    };

    function showFallbackBackground() {
        bgLayer.innerHTML = '';
        const fallback = document.createElement('div');
        fallback.className = 'fallback-bg';
        fallback.style.cssText = 'width:100%;height:100%;background:linear-gradient(135deg,#1a2233 0%,#2a3a5a 100%);';
        bgLayer.appendChild(fallback);
        hideWallpaperInfo();
        resetDrag();
        console.log('🎨 使用纯色背景');
    }

    function applyVolumeToVideo() {
        if (videoElement) {
            videoElement.volume = volumeValue;
            videoElement.muted = isMuted;
        }
        if (muteToggle) muteToggle.textContent = isMuted ? '🔊' : '🔇';
        if (volumeSlider) volumeSlider.value = isMuted ? 0 : volumeValue;
    }

    function showWallpaperInfo(source, author) {
        if (!wallpaperSource || !wallpaperAuthor || !wallpaperInfo) return;
        wallpaperSource.textContent = source || '';
        wallpaperAuthor.textContent = author || '';
        wallpaperInfo.classList.add('visible');
    }

    function hideWallpaperInfo() {
        if (wallpaperInfo) wallpaperInfo.classList.remove('visible');
    }

    function resetDrag() {
        isDragging = false;
        dragStartX = 0;
        dragStartY = 0;
        currentTranslateX = 0;
        currentTranslateY = 0;
        updateBgTransform();
    }

    function updateBgTransform() {
        const bgContent = bgLayer.querySelector('img');
        if (bgContent) {
            bgContent.style.transform = `translate(${currentTranslateX}px, ${currentTranslateY}px)`;
        }
    }

    function handleMouseDown(e) {
        const bgContent = bgLayer.querySelector('img');
        if (!bgContent || videoElement) return;
        
        isDragging = true;
        dragStartX = e.clientX - currentTranslateX;
        dragStartY = e.clientY - currentTranslateY;
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        
        e.preventDefault();
    }

    function handleMouseMove(e) {
        if (!isDragging) return;
        
        currentTranslateX = e.clientX - dragStartX;
        currentTranslateY = e.clientY - dragStartY;
        
        updateBgTransform();
        e.preventDefault();
    }

    function handleMouseUp() {
        isDragging = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    }

    function createBgImage(src) {
        const img = document.createElement('img');
        img.style.cssText = 'width:100%;height:100%;object-fit:cover;position:absolute;top:0;left:0;cursor:grab;transition:none;';
        img.draggable = false;
        return img;
    }

    function fadeInNewBackground(newElement) {
        resetDrag();
        newElement.classList.add('bg-transition-enter');
        bgLayer.appendChild(newElement);
        
        const existingElements = Array.from(bgLayer.children).filter(el => el !== newElement);
        existingElements.forEach(el => {
            el.classList.add('bg-transition-exit');
            setTimeout(() => {
                if (el.parentNode) el.parentNode.removeChild(el);
            }, 500);
        });
    }

    function loadAnimeBackground() {
        if (bgLoadInProgress) return;
        bgLoadInProgress = true;
        
        if (videoElement) {
            videoElement.pause();
            videoElement.remove();
            videoElement = null;
        }
        
        currentBgType = 'anime';
        const img = createBgImage();
        img.onerror = function() {
            showFallbackBackground();
            bgLoadInProgress = false;
        };
        
        fetch(ANIME_API)
            .then(res => {
                if (!res.ok) throw new Error('Network response was not ok');
                return res.json();
            })
            .then(data => {
                if (data && data.imgurl) {
                    img.src = data.imgurl;
                    img.onload = () => {
                        fadeInNewBackground(img);
                        showWallpaperInfo(WALLPAPER_SOURCES.anime.icon + ' ' + WALLPAPER_SOURCES.anime.name, '');
                        bgLoadInProgress = false;
                    };
                    console.log('🎨 二次元壁纸加载成功');
                } else {
                    throw new Error('No image data');
                }
            })
            .catch(err => {
                console.warn('二次元壁纸加载失败，使用备用', err);
                img.src = WALLPAPER_SOURCES.anime.fallback + '&' + Date.now();
                img.onload = () => {
                    fadeInNewBackground(img);
                    showWallpaperInfo(WALLPAPER_SOURCES.anime.icon + ' ' + WALLPAPER_SOURCES.anime.name, '');
                    bgLoadInProgress = false;
                };
            });
    }

    function loadBingBackground() {
        if (bgLoadInProgress) return;
        bgLoadInProgress = true;
        
        if (videoElement) {
            videoElement.pause();
            videoElement.remove();
            videoElement = null;
        }
        
        currentBgType = 'bing';
        const img = createBgImage();
        img.onerror = function() {
            showFallbackBackground();
            bgLoadInProgress = false;
        };
        
        fetch(BING_IMAGE_API)
            .then(res => {
                if (!res.ok) throw new Error('Network response was not ok');
                return res.json();
            })
            .then(data => {
                if (data && data.images && data.images[0]) {
                    const imageData = data.images[0];
                    const url = 'https://bing.com' + imageData.url;
                    img.src = url;
                    img.onload = () => {
                        fadeInNewBackground(img);
                        const copyright = imageData.copyright || '';
                        showWallpaperInfo(WALLPAPER_SOURCES.bing.icon + ' ' + WALLPAPER_SOURCES.bing.name, copyright.split('©')[0].trim());
                        bgLoadInProgress = false;
                    };
                    console.log('📸 必应壁纸加载成功');
                } else {
                    throw new Error('No image data');
                }
            })
            .catch(err => {
                console.warn('必应壁纸加载失败，使用备用图片', err);
                img.src = WALLPAPER_SOURCES.bing.fallback;
                img.onload = () => {
                    fadeInNewBackground(img);
                    showWallpaperInfo(WALLPAPER_SOURCES.bing.icon + ' ' + WALLPAPER_SOURCES.bing.name, '');
                    bgLoadInProgress = false;
                };
            });
    }

    function loadUnsplashBackground() {
        if (bgLoadInProgress) return;
        bgLoadInProgress = true;
        
        if (videoElement) {
            videoElement.pause();
            videoElement.remove();
            videoElement = null;
        }
        
        currentBgType = 'unsplash';
        const img = createBgImage();
        img.onerror = function() {
            showFallbackBackground();
            bgLoadInProgress = false;
        };
        
        fetch(UNSPLASH_API)
            .then(res => {
                if (!res.ok) throw new Error('Network response was not ok');
                return res.json();
            })
            .then(data => {
                if (data && data.urls && data.urls.regular) {
                    img.src = data.urls.regular + '&w=1920&h=1080&fit=crop';
                    img.onload = () => {
                        fadeInNewBackground(img);
                        const authorName = data.user ? data.user.name : '';
                        showWallpaperInfo(WALLPAPER_SOURCES.unsplash.icon + ' ' + WALLPAPER_SOURCES.unsplash.name, authorName);
                        bgLoadInProgress = false;
                    };
                    console.log('🖼️ Unsplash壁纸加载成功');
                } else {
                    throw new Error('No image data');
                }
            })
            .catch(err => {
                console.warn('Unsplash壁纸加载失败，使用备用图片', err);
                img.src = WALLPAPER_SOURCES.unsplash.fallback;
                img.onload = () => {
                    fadeInNewBackground(img);
                    showWallpaperInfo(WALLPAPER_SOURCES.unsplash.icon + ' ' + WALLPAPER_SOURCES.unsplash.name, '');
                    bgLoadInProgress = false;
                };
            });
    }

    function loadPexelsBackground() {
        if (bgLoadInProgress) return;
        bgLoadInProgress = true;
        
        if (videoElement) {
            videoElement.pause();
            videoElement.remove();
            videoElement = null;
        }
        
        currentBgType = 'pexels';
        const img = createBgImage();
        img.onerror = function() {
            showFallbackBackground();
            bgLoadInProgress = false;
        };
        
        fetch(PEXELS_API)
            .then(res => {
                if (!res.ok) throw new Error('Network response was not ok');
                return res.json();
            })
            .then(data => {
                if (data && data.photos && data.photos[0]) {
                    const photo = data.photos[0];
                    img.src = photo.src ? photo.src.landscape || photo.src.medium : photo.url;
                    img.onload = () => {
                        fadeInNewBackground(img);
                        showWallpaperInfo(WALLPAPER_SOURCES.pexels.icon + ' ' + WALLPAPER_SOURCES.pexels.name, photo.photographer || '');
                        bgLoadInProgress = false;
                    };
                    console.log('📷 Pexels壁纸加载成功');
                } else {
                    throw new Error('No image data');
                }
            })
            .catch(err => {
                console.warn('Pexels壁纸加载失败，使用备用图片', err);
                img.src = WALLPAPER_SOURCES.pexels.fallback;
                img.onload = () => {
                    fadeInNewBackground(img);
                    showWallpaperInfo(WALLPAPER_SOURCES.pexels.icon + ' ' + WALLPAPER_SOURCES.pexels.name, '');
                    bgLoadInProgress = false;
                };
            });
    }

    function loadVideoBackground(src) {
        if (bgLoadInProgress) return;
        bgLoadInProgress = true;
        
        if (src === undefined) src = SAMPLE_VIDEO;
        if (videoElement) {
            videoElement.pause();
            videoElement.remove();
            videoElement = null;
        }
        
        currentBgType = 'video';
        bgLayer.innerHTML = '';
        const video = document.createElement('video');
        video.src = src;
        video.autoplay = true;
        video.loop = true;
        video.muted = isMuted;
        video.volume = volumeValue;
        video.playsInline = true;
        video.style.cssText = 'width:100%;height:100%;object-fit:cover;';
        video.setAttribute('playsinline', '');
        video.setAttribute('webkit-playsinline', '');
        video.onerror = function() {
            showFallbackBackground();
            bgLoadInProgress = false;
        };
        video.addEventListener('loadeddata', () => {
            video.play().catch(() => showFallbackBackground());
            bgLayer.appendChild(video);
            videoElement = video;
            applyVolumeToVideo();
            showWallpaperInfo('🎬 视频背景', '');
            bgLoadInProgress = false;
        });
        console.log('🎬 视频背景');
    }

    function loadCustomBackground() {
        const url = prompt('请输入网络视频链接 (mp4/webm等):', customVideoUrl);
        if (url === null) return;
        const trimmed = url.trim();
        if (trimmed === '') { alert('链接不能为空'); return; }
        customVideoUrl = trimmed;
        loadVideoBackground(customVideoUrl);
        document.querySelectorAll('[data-bg]').forEach(btn => btn.classList.remove('active'));
        const customBtn = document.querySelector('[data-bg="custom"]');
        if (customBtn) customBtn.classList.add('active');
        console.log('📎 自定义视频');
    }

    function loadLocalVideo() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'video/*';
        input.onchange = function(e) {
            const file = e.target.files[0];
            if (!file) return;
            const url = URL.createObjectURL(file);
            loadVideoBackground(url);
            document.querySelectorAll('[data-bg]').forEach(btn => btn.classList.remove('active'));
            const localBtn = document.querySelector('[data-bg="local"]');
            if (localBtn) localBtn.classList.add('active');
            console.log('📁 本地视频:', file.name);
        };
        input.click();
    }

    function setupVolumeControls() {
        if (!volumeSlider || !muteToggle) return;
        volumeSlider.addEventListener('input', function() {
            volumeValue = parseFloat(this.value);
            if (videoElement) videoElement.volume = volumeValue;
            if (isMuted && volumeValue > 0) isMuted = false;
            else if (volumeValue === 0) isMuted = true;
            applyVolumeToVideo();
        });
        muteToggle.addEventListener('click', function() {
            isMuted = !isMuted;
            if (!isMuted && volumeValue === 0) {
                volumeValue = 0.5;
                volumeSlider.value = volumeValue;
            }
            applyVolumeToVideo();
        });
    }

    function setupDragControl() {
        bgLayer.addEventListener('mousedown', handleMouseDown);
    }

    function initVideo() {
        loadBingBackground();
        setupVolumeControls();
        setupDragControl();
        if (volumeSlider) volumeSlider.value = volumeValue;
        applyVolumeToVideo();
        console.log('✅ video.js 已加载');
    }

    window.__video = {
        loadAnimeBackground,
        loadBingBackground,
        loadUnsplashBackground,
        loadPexelsBackground,
        loadVideoBackground,
        loadCustomBackground,
        loadLocalVideo,
        setVolume: (val) => { volumeValue = val; applyVolumeToVideo(); },
        toggleMute: () => { isMuted = !isMuted; applyVolumeToVideo(); },
        getVolume: () => volumeValue,
        isMuted: () => isMuted,
        getVideoElement: () => videoElement,
        showFallbackBackground,
        getCurrentBgType: () => currentBgType,
        resetDrag
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initVideo);
    } else {
        initVideo();
    }
})();