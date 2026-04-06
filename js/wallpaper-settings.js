/**
 * wallpaper-settings.js
 * 壁纸更换页：
 *  - 高质量图片存储（IndexedDB，不限 KB，不损质量）
 *  - 独立 wallpaper-layer 渲染，不干扰小组件图片
 *  - 不透明度 / 模糊 / 毛玻璃 三轴调节
 *  - 天气动态效果联动（复用 Weather 模块）
 */

const WallpaperSettings = (() => {
    'use strict';

    // ── 壁纸样式配置存 localStorage（轻量） ──
    const SK_STYLE = 'wallpaper_style';
    const STYLE_DEFAULTS = {
        opacity: 100,   // 0~100，壁纸图片不透明度
        blur: 0,        // 0~20，px
        frosted: 0,     // 0~20，毛玻璃 px
    };

    // ── 壁纸图片存 IndexedDB（大文件，不损质量）──
    const IDB_NAME = 'HomeScreenDB';
    const IDB_STORE = 'wallpaper';
    const IDB_KEY = 'current';

    let _db = null;

    // ════════════════════════════════════════════════
    //  IndexedDB 工具
    // ════════════════════════════════════════════════
    // wallpaper-settings.js 里找到 openDB，改成：
    function openDB() {
        return new Promise((resolve, reject) => {
            if (_db) { resolve(_db); return; }
            const req = indexedDB.open(IDB_NAME, 2);   // ← version 改为 2
            req.onupgradeneeded = e => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('wallpaper')) {
                    db.createObjectStore('wallpaper');
                }
                if (!db.objectStoreNames.contains('widgets')) { // ← 同步建 widgets store
                    db.createObjectStore('widgets');
                }
            };
            req.onsuccess = e => { _db = e.target.result; resolve(_db); };
            req.onerror = e => reject(e.target.error);
        });
    }

    async function idbSave(blob) {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(IDB_STORE, 'readwrite');
            tx.objectStore(IDB_STORE).put(blob, IDB_KEY);
            tx.oncomplete = resolve;
            tx.onerror = e => reject(e.target.error);
        });
    }

    async function idbLoad() {
        try {
            const db = await openDB();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(IDB_STORE, 'readonly');
                const req = tx.objectStore(IDB_STORE).get(IDB_KEY);
                req.onsuccess = e => resolve(e.target.result || null);
                req.onerror = e => reject(e.target.error);
            });
        } catch { return null; }
    }

    async function idbClear() {
        const db = await openDB();
        return new Promise((resolve) => {
            const tx = db.transaction(IDB_STORE, 'readwrite');
            tx.objectStore(IDB_STORE).delete(IDB_KEY);
            tx.oncomplete = resolve;
        });
    }

    // ════════════════════════════════════════════════
    //  样式配置 localStorage
    // ════════════════════════════════════════════════
    function styleGet() {
        try {
            const r = localStorage.getItem(SK_STYLE);
            return r ? { ...STYLE_DEFAULTS, ...JSON.parse(r) } : { ...STYLE_DEFAULTS };
        } catch { return { ...STYLE_DEFAULTS }; }
    }

    function styleSet(s) {
        try { localStorage.setItem(SK_STYLE, JSON.stringify(s)); } catch { }
    }

    // ════════════════════════════════════════════════
    //  应用壁纸样式到 DOM（CSS 变量）
    //  ★ 只操作 #wallpaperImgWrap / #wallpaperOverlay，
    //    绝不碰 polaroidImg / photoBoxImg 等小组件图片
    // ════════════════════════════════════════════════
    function applyStyle(style) {
        const wrap = document.getElementById('wallpaperImgWrap');
        const overlay = document.getElementById('wallpaperOverlay');
        const screen = document.getElementById('screen');
        if (!wrap) return;

        // 不透明度
        const op = (style.opacity / 100).toFixed(3);
        screen?.style.setProperty('--wp-opacity', op);

        // 模糊
        const bl = style.blur.toFixed(1) + 'px';
        screen?.style.setProperty('--wp-blur', bl);

        // 毛玻璃
        const fr = style.frosted.toFixed(1) + 'px';
        screen?.style.setProperty('--wp-frosted', fr);
        screen?.style.setProperty('--wp-overlay-opacity', style.frosted > 0 ? '1' : '0');
        screen?.style.setProperty('--wp-overlay-color', 'rgba(255,255,255,0.08)');
    }

    // ════════════════════════════════════════════════
    //  设置壁纸图片（只写 wallpaperImgWrap，不污染其他）
    // ════════════════════════════════════════════════
    function applyWallpaperImage(url) {
        const wrap = document.getElementById('wallpaperImgWrap');
        if (!wrap) return;
        if (url) {
            wrap.style.backgroundImage = `url(${url})`;
            wrap.style.opacity = ''; // 由 CSS 变量控制
        } else {
            wrap.style.backgroundImage = '';
        }
    }

    // ── 从 IndexedDB 加载并应用壁纸 ──
    async function loadAndApplyWallpaper() {
        const url = await Storage.getWallpaper();
        if (!url) return;
        applyWallpaperImage(url);
        return url;
    }

    // ════════════════════════════════════════════════
    //  读取文件为 Blob（不压缩，保持原始质量）
    // ════════════════════════════════════════════════
    function fileToBlob(file) {
        return new Promise((resolve) => {
            // 直接使用原始 File Blob，不经过 canvas 压缩
            resolve(file);
        });
    }

    // ════════════════════════════════════════════════
    //  构建页面 HTML
    // ════════════════════════════════════════════════
    function buildHTML(style, weatherCfg) {
        const wTypes = [
            { id: 'none', label: '无效果', icon: noneIcon() },
            { id: 'rain', label: '小雨', icon: rainIcon() },
            { id: 'heavyrain', label: '暴雨', icon: heavyRainIcon() },
            { id: 'snow', label: '下雪', icon: snowIcon() },
            { id: 'fog', label: '雾', icon: fogIcon() },
            { id: 'sand', label: '风沙', icon: sandIcon() },
            { id: 'sakura', label: '樱花', icon: sakuraIcon() },
        ];

        const weatherItems = wTypes.map(w => `
      <div class="weather-item ${weatherCfg.type === w.id ? 'active' : ''}"
           data-weather="${w.id}">
        <div class="weather-icon">${w.icon}</div>
        <span class="weather-label">${w.label}</span>
      </div>
    `).join('');

        return `
      <div class="inner-header">
        <button class="inner-header-back" id="wpBack">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
        <span class="inner-header-title">壁纸更换</span>
        <div class="inner-header-placeholder"></div>
      </div>

      <div class="inner-main">

        <!-- ══ 壁纸选择 ══ -->
        <p class="settings-subtitle">壁纸图片</p>
        <div class="api-group">
          <div class="api-card" style="padding:14px 16px 16px;">

            <!-- 预览框 -->
            <div class="wp-preview-wrap">
              <div class="wp-preview-phone" id="wpPreviewPhone">
                <div class="wp-preview-img" id="wpPreviewImg"></div>
                <div class="wp-preview-overlay" id="wpPreviewOverlay"></div>
                <label class="wp-upload-btn" for="wpFileInput">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                       stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="3"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <path d="M21 15l-5-5L5 21"/>
                  </svg>
                  <span class="wp-upload-hint" id="wpUploadHint">点击选择图片</span>
                </label>
                <input type="file" accept="image/*" id="wpFileInput"
                       style="display:none;" />
              </div>
            </div>

            <!-- 移除壁纸按钮 -->
            <div style="display:flex;justify-content:center;margin-top:10px;">
              <button class="api-btn api-btn-outline" id="wpRemoveBtn"
                      style="font-size:11.5px;padding:7px 18px;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"
                     style="width:14px;height:14px;">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6M14 11v6"/>
                </svg>
                <span>移除壁纸</span>
              </button>
            </div>

          </div>
        </div>

        <!-- ══ 壁纸样式调整 ══ -->
        <p class="settings-subtitle">壁纸样式</p>
        <div class="api-group">

          <!-- 不透明度 -->
          <div class="api-card" style="padding:13px 16px 14px;">
            <div class="api-card-label" style="margin-bottom:8px;">图片不透明度</div>
            <div class="wp-slider-row">
              <input class="wp-slider" id="wpOpacity" type="range"
                     min="0" max="100" step="1" value="${style.opacity}" />
              <span class="wp-slider-val" id="wpOpacityVal">${style.opacity}%</span>
            </div>
          </div>

          <!-- 模糊 -->
          <div class="api-card" style="padding:13px 16px 14px;">
            <div class="api-card-label" style="margin-bottom:8px;">模糊强度</div>
            <div class="wp-slider-row">
              <input class="wp-slider" id="wpBlur" type="range"
                     min="0" max="20" step="0.5" value="${style.blur}" />
              <span class="wp-slider-val" id="wpBlurVal">${style.blur}px</span>
            </div>
          </div>

          <!-- 毛玻璃 -->
          <div class="api-card" style="padding:13px 16px 14px;">
            <div class="api-card-label" style="margin-bottom:8px;">毛玻璃（Frosted Glass）</div>
            <div class="wp-slider-row">
              <input class="wp-slider" id="wpFrosted" type="range"
                     min="0" max="20" step="0.5" value="${style.frosted}" />
              <span class="wp-slider-val" id="wpFrostedVal">${style.frosted}px</span>
            </div>
          </div>

        </div>

        <!-- ══ 天气动态效果 ══ -->
        <p class="settings-subtitle">天气动态效果</p>
        <div class="api-group">

          <div class="api-card" style="padding:14px 14px 12px;">
            <div class="weather-grid" id="wpWeatherGrid">
              ${weatherItems}
            </div>
          </div>

          <!-- 粒子密度 -->
          <div class="api-card" id="wpIntensityCard"
               style="padding:13px 16px 14px;${weatherCfg.type === 'none' ? 'display:none;' : ''}">
            <div class="api-card-label" style="margin-bottom:8px;">粒子密度</div>
            <div class="wp-slider-row">
              <input class="wp-slider" id="wpIntensity" type="range"
                     min="10" max="100" step="5" value="${weatherCfg.intensity}" />
              <span class="wp-slider-val" id="wpIntensityVal">${weatherCfg.intensity}%</span>
            </div>
          </div>

        </div>

        <!-- ══ 保存 ══ -->
        <div class="api-group">
          <div class="api-card api-card-action">
            <div class="api-card-body">
              <button class="api-btn api-btn-solid" id="wpSave"
                      style="flex:1;justify-content:center;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                  <polyline points="17 21 17 13 7 13 7 21"/>
                  <polyline points="7 3 7 8 15 8"/>
                </svg>
                <span>保存设置</span>
              </button>
              <button class="api-btn api-btn-outline" id="wpReset">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="1 4 1 10 7 10"/>
                  <path d="M3.51 15a9 9 0 1 0 .49-3.32"/>
                </svg>
                <span>重置</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    `;
    }

    // ════════════════════════════════════════════════
    //  SVG 天气图标（纯代码，无 emoji）
    // ════════════════════════════════════════════════
    function noneIcon() {
        return `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="2" x2="12" y2="4"/>
      <line x1="12" y1="20" x2="12" y2="22"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="2" y1="12" x2="4" y2="12"/>
      <line x1="20" y1="12" x2="22" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
    }

    function rainIcon() {
        return `<svg viewBox="0 0 24 24">
      <path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25"/>
      <line x1="8" y1="19" x2="8" y2="21"/>
      <line x1="12" y1="17" x2="12" y2="21"/>
      <line x1="16" y1="19" x2="16" y2="21"/></svg>`;
    }

    function heavyRainIcon() {
        return `<svg viewBox="0 0 24 24">
      <path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25"/>
      <line x1="7" y1="19" x2="5" y2="23"/>
      <line x1="11" y1="17" x2="9" y2="23"/>
      <line x1="15" y1="19" x2="13" y2="23"/>
      <line x1="19" y1="17" x2="17" y2="23"/></svg>`;
    }

    function snowIcon() {
        return `<svg viewBox="0 0 24 24">
      <path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25"/>
      <line x1="8" y1="19" x2="8" y2="21"/>
      <line x1="12" y1="17" x2="12" y2="21"/>
      <line x1="16" y1="19" x2="16" y2="21"/>
      <line x1="7" y1="20" x2="9" y2="20"/>
      <line x1="11" y1="18" x2="13" y2="18"/>
      <line x1="15" y1="20" x2="17" y2="20"/></svg>`;
    }

    function fogIcon() {
        return `<svg viewBox="0 0 24 24">
      <path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25"/>
      <line x1="3" y1="19" x2="21" y2="19"/>
      <line x1="3" y1="22" x2="21" y2="22"/></svg>`;
    }

    function sandIcon() {
        return `<svg viewBox="0 0 24 24">
      <path d="M9 18V5l12-2v13"/>
      <circle cx="6" cy="18" r="3"/>
      <circle cx="18" cy="16" r="3"/>
      <line x1="2" y1="10" x2="22" y2="10"/>
      <line x1="4" y1="13" x2="20" y2="13"/></svg>`;
    }

    function sakuraIcon() {
        return `<svg viewBox="0 0 24 24">
      <path d="M12 2a5 5 0 0 1 5 5c0 1.5-.66 2.85-1.71 3.79"/>
      <path d="M12 2a5 5 0 0 0-5 5c0 1.5.66 2.85 1.71 3.79"/>
      <path d="M12 22a5 5 0 0 0 5-5c0-1.5-.66-2.85-1.71-3.79"/>
      <path d="M12 22a5 5 0 0 1-5-5c0-1.5.66-2.85 1.71-3.79"/>
      <circle cx="12" cy="12" r="2.5"/></svg>`;
    }

    // ════════════════════════════════════════════════
    //  更新 slider 背景
    // ════════════════════════════════════════════════
    function syncSlider(slider) {
        if (!slider) return;
        const min = parseFloat(slider.min);
        const max = parseFloat(slider.max);
        const val = parseFloat(slider.value);
        const pct = (((val - min) / (max - min)) * 100).toFixed(1) + '%';
        slider.style.setProperty('--pct', pct);
    }

    // ════════════════════════════════════════════════
    //  更新预览框样式
    // ════════════════════════════════════════════════
    function updatePreview(style) {
        const img = document.getElementById('wpPreviewImg');
        const overlay = document.getElementById('wpPreviewOverlay');
        if (!img) return;

        const op = (style.opacity / 100).toFixed(3);
        const bl = style.blur.toFixed(1) + 'px';
        const fr = style.frosted.toFixed(1) + 'px';

        img.style.opacity = op;
        img.style.filter = `blur(${bl})`;
        img.style.transform = `scale(${1 + style.blur * 0.015})`;

        if (overlay) {
            overlay.style.backdropFilter = `blur(${fr})`;
            overlay.style.webkitBackdropFilter = `blur(${fr})`;
            overlay.style.background = style.frosted > 0 ? 'rgba(255,255,255,0.08)' : 'transparent';
        }
    }

    // ════════════════════════════════════════════════
    //  初始化页面
    // ════════════════════════════════════════════════
    function initPage(container) {
        const style = styleGet();
        const weatherCfg = Weather.lsGet();

        container.innerHTML = buildHTML(style, weatherCfg);

        let localStyle = { ...style };
        let localWeather = { ...weatherCfg };
        let _pendingBlob = null;     // 待保存的新壁纸 Blob
        let _previewURL = null;     // 预览用 ObjectURL

        // ── 初始化预览图（显示已保存壁纸）──
        Storage.getWallpaper().then(url => {
            if (!url) return;
            _previewURL = url;
            const img = document.getElementById('wpPreviewImg');
            const phone = document.getElementById('wpPreviewPhone');
            if (img) img.style.backgroundImage = `url(${_previewURL})`;
            if (phone) phone.classList.add('has-image');
            document.getElementById('wpUploadHint').textContent = '点击更换图片';
            updatePreview(localStyle);
        });

        // ── 返回 ──
        document.getElementById('wpBack')?.addEventListener('click', () => Router.pop());

        // ── 文件选择 ──
        document.getElementById('wpFileInput')?.addEventListener('change', async e => {
            const file = e.target.files?.[0];
            if (!file || !file.type.startsWith('image/')) return;

            // 直接使用原始 File，不压缩
            _pendingBlob = file;

            // 生成预览 ObjectURL
            if (_previewURL) URL.revokeObjectURL(_previewURL);
            _previewURL = URL.createObjectURL(file);

            const img = document.getElementById('wpPreviewImg');
            const phone = document.getElementById('wpPreviewPhone');
            if (img) img.style.backgroundImage = `url(${_previewURL})`;
            if (phone) phone.classList.add('has-image');
            document.getElementById('wpUploadHint').textContent = '点击更换图片';

            // 实时预览样式
            updatePreview(localStyle);
            applyWallpaperImage(_previewURL);
            applyStyle(localStyle);
        });

        // ── 移除壁纸 ──
        document.getElementById('wpRemoveBtn')?.addEventListener('click', async () => {
            _pendingBlob = null;
            if (_previewURL) { URL.revokeObjectURL(_previewURL); _previewURL = null; }
            await Storage.removeWallpaper();
            applyWallpaperImage(null);
            const img = document.getElementById('wpPreviewImg');
            const phone = document.getElementById('wpPreviewPhone');
            if (img) { img.style.backgroundImage = ''; }
            if (phone) phone.classList.remove('has-image');
            document.getElementById('wpUploadHint').textContent = '点击选择图片';
            toast('壁纸已移除');
        });

        // ── 不透明度 ──
        const sliderOp = document.getElementById('wpOpacity');
        document.getElementById('wpOpacity')?.addEventListener('input', () => {
            const v = parseInt(sliderOp.value, 10);
            document.getElementById('wpOpacityVal').textContent = v + '%';
            localStyle.opacity = v;
            syncSlider(sliderOp);
            updatePreview(localStyle);
            applyStyle(localStyle); // 实时预览
        });
        syncSlider(sliderOp);

        // ── 模糊 ──
        const sliderBl = document.getElementById('wpBlur');
        document.getElementById('wpBlur')?.addEventListener('input', () => {
            const v = parseFloat(sliderBl.value);
            document.getElementById('wpBlurVal').textContent = v + 'px';
            localStyle.blur = v;
            syncSlider(sliderBl);
            updatePreview(localStyle);
            applyStyle(localStyle);
        });
        syncSlider(sliderBl);

        // ── 毛玻璃 ──
        const sliderFr = document.getElementById('wpFrosted');
        document.getElementById('wpFrosted')?.addEventListener('input', () => {
            const v = parseFloat(sliderFr.value);
            document.getElementById('wpFrostedVal').textContent = v + 'px';
            localStyle.frosted = v;
            syncSlider(sliderFr);
            updatePreview(localStyle);
            applyStyle(localStyle);
        });
        syncSlider(sliderFr);

        // ── 天气选择 ──
        document.getElementById('wpWeatherGrid')?.querySelectorAll('.weather-item').forEach(item => {
            item.addEventListener('click', () => {
                document.querySelectorAll('#wpWeatherGrid .weather-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                localWeather.type = item.dataset.weather;
                Weather.setConfig(localWeather); // 实时预览
                // 显示/隐藏密度滑块
                const intensityCard = document.getElementById('wpIntensityCard');
                if (intensityCard) {
                    intensityCard.style.display = localWeather.type === 'none' ? 'none' : '';
                }
            });
        });

        // ── 粒子密度 ──
        const sliderIt = document.getElementById('wpIntensity');
        document.getElementById('wpIntensity')?.addEventListener('input', () => {
            const v = parseInt(sliderIt.value, 10);
            document.getElementById('wpIntensityVal').textContent = v + '%';
            localWeather.intensity = v;
            syncSlider(sliderIt);
            Weather.setConfig(localWeather);
        });
        syncSlider(sliderIt);

        // ── 保存 ──
        document.getElementById('wpSave')?.addEventListener('click', async () => {
            // 保存壁纸图片到 IndexedDB
            if (_pendingBlob) {
                await Storage.setWallpaper(_pendingBlob);
                _pendingBlob = null;
            }
            // 保存样式到 localStorage
            styleSet(localStyle);
            applyStyle(localStyle);
            // 天气已由 Weather.setConfig 实时写入，此处再确认一次
            Weather.setConfig(localWeather);
            toast('壁纸设置已保存 ✓');
        });

        // ── 重置 ──
        document.getElementById('wpReset')?.addEventListener('click', async () => {
            localStyle = { ...STYLE_DEFAULTS };
            localWeather = { type: 'none', intensity: 50 };
            styleSet(localStyle);
            Weather.setConfig(localWeather);
            applyStyle(localStyle);
            container.innerHTML = '';
            container.removeAttribute('data-initialized');
            // 重新初始化
            container.innerHTML = buildHTML(localStyle, localWeather);
            initPage(container);
            toast('已重置壁纸设置');
        });
    }

    // ════════════════════════════════════════════════
    //  Toast 工具
    // ════════════════════════════════════════════════
    function toast(msg) {
        const el = document.getElementById('apiToast');
        if (!el) return;
        el.textContent = msg;
        el.classList.add('show');
        clearTimeout(el._wt);
        el._wt = setTimeout(() => el.classList.remove('show'), 2000);
    }

    // ════════════════════════════════════════════════
    //  启动时恢复壁纸
    // ════════════════════════════════════════════════
    async function restoreOnLoad() {
        const style = styleGet();
        applyStyle(style);
        await loadAndApplyWallpaper();
    }

    // ════════════════════════════════════════════════
    //  注册路由
    // ════════════════════════════════════════════════
    function init() {
        restoreOnLoad();
        Router.onInit('wallpaperSettings', initPage);
    }

    return { init };
})();
