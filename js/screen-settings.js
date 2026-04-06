/**
 * screen-settings.js
 * 屏幕调整页：色调滤镜 / 屏幕位置偏移 / 隐藏状态栏
 * 所有配置持久化到 localStorage，页面加载时自动恢复
 */

const ScreenSettings = (() => {
    'use strict';

    const SK = 'screen_display_config';

    // 默认配置
    const DEFAULTS = {
        filter: 'none',   // 色调滤镜
        offsetX: 0,        // 水平偏移 px（-30 ~ 30）
        offsetY: 0,        // 垂直偏移 px（-30 ~ 30）
        hideStatusBar: false,   // 隐藏状态栏
    };

    // 滤镜定义
    const FILTERS = [
        { id: 'none', label: '原色' },
        { id: 'vintage', label: '复古' },
        { id: 'dopamine', label: '多巴胺' },
        { id: 'cream', label: '奶油' },
        { id: 'cool', label: '冷调' },
        { id: 'forest', label: '森林' },
        { id: 'dusk', label: '黄昏' },
        { id: 'mono', label: '灰度' },
    ];

    // ── 工具 ──
    function lsGet(def) {
        try {
            const raw = localStorage.getItem(SK);
            return raw ? { ...def, ...JSON.parse(raw) } : { ...def };
        } catch { return { ...def }; }
    }

    function lsSet(cfg) {
        try { localStorage.setItem(SK, JSON.stringify(cfg)); }
        catch (e) { console.warn('[ScreenSettings]', e); }
    }

    function toast(msg) {
        const el = document.getElementById('apiToast');
        if (!el) return;
        el.textContent = msg;
        el.classList.add('show');
        clearTimeout(el._st);
        el._st = setTimeout(() => el.classList.remove('show'), 2000);
    }

    // ════════════════════════════════════════════════
    //  应用配置到 DOM（不依赖页面是否打开，随时可调用）
    // ════════════════════════════════════════════════
    function applyConfig(cfg) {
        const overlay = document.getElementById('screenFilterOverlay');
        const screen = document.getElementById('screen');
        const statusBar = document.getElementById('statusBar');
        const shell = document.getElementById('phoneShell');

        // ── 1. 色调滤镜 ──
        if (overlay) {
            if (cfg.filter === 'none') {
                overlay.classList.remove('active');
                overlay.removeAttribute('data-filter');
            } else {
                overlay.setAttribute('data-filter', cfg.filter);
                overlay.classList.add('active');
            }
        }
        // 灰度特殊处理（用 CSS filter 在 screen 上）
        if (screen) {
            if (cfg.filter === 'mono') {
                screen.classList.add('filter-mono');
            } else {
                screen.classList.remove('filter-mono');
            }
        }

        // ── 2. 位置偏移（作用在 phone-shell） ──
        if (shell) {
            shell.style.transform = (cfg.offsetX || cfg.offsetY)
                ? `translate(${cfg.offsetX}px, ${cfg.offsetY}px)`
                : '';
        }

        // ── 3. 隐藏状态栏 ──
        if (statusBar) {
            statusBar.style.display = cfg.hideStatusBar ? 'none' : '';
        }
    }

    // ════════════════════════════════════════════════
    //  构建页面 HTML
    // ════════════════════════════════════════════════
    function buildHTML(cfg) {
        const filterItems = FILTERS.map(f => `
      <div class="filter-item ${cfg.filter === f.id ? 'active' : ''}"
           data-filter="${f.id}">
        <div class="filter-preview" data-filter="${f.id}"></div>
        <span class="filter-label">${f.label}</span>
      </div>
    `).join('');

        return `
      <div class="inner-header">
        <button class="inner-header-back" id="ssBack">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
        <span class="inner-header-title">屏幕调整</span>
        <div class="inner-header-placeholder"></div>
      </div>

      <div class="inner-main">

        <!-- ══ 色调滤镜 ══ -->
        <p class="settings-subtitle">色调滤镜</p>
        <div class="api-group">
          <div class="api-card">
            <div class="filter-grid" id="ssFilterGrid">
              ${filterItems}
            </div>
          </div>
        </div>

        <!-- ══ 屏幕位置 ══ -->
        <p class="settings-subtitle">屏幕位置</p>
        <div class="api-group">

          <!-- 预览小图 -->
          <div class="api-card">
            <div class="ss-preview-wrap">
              <div class="ss-preview-phone">
                <div class="ss-preview-screen" id="ssPreviewScreen">
                  <div class="ss-preview-bar"></div>
                  <div class="ss-preview-line"></div>
                  <div class="ss-preview-line"></div>
                  <div class="ss-preview-line"></div>
                </div>
              </div>
            </div>
          </div>

          <div class="api-card">
            <div class="api-card-label">左右偏移</div>
            <div class="api-card-body api-slider-row">
              <input class="api-slider" id="ssOffsetX" type="range"
                     min="-30" max="30" step="1" value="${cfg.offsetX}"/>
              <span class="slider-value" id="ssOffsetXVal">${cfg.offsetX}</span>
            </div>
          </div>

          <div class="api-card">
            <div class="api-card-label">上下偏移</div>
            <div class="api-card-body api-slider-row">
              <input class="api-slider" id="ssOffsetY" type="range"
                     min="-30" max="30" step="1" value="${cfg.offsetY}"/>
              <span class="slider-value" id="ssOffsetYVal">${cfg.offsetY}</span>
            </div>
          </div>

          <div class="api-card" style="padding: 14px 16px;">
            <div class="ss-switch-row">
              <div class="ss-switch-text">
                <span class="ss-switch-label">隐藏顶部状态栏</span>
                <span class="ss-switch-desc">隐藏时间与信号图标</span>
              </div>
              <label class="ss-toggle">
                <input type="checkbox" id="ssHideStatusBar"
                       ${cfg.hideStatusBar ? 'checked' : ''}/>
                <span class="ss-toggle-track"></span>
              </label>
            </div>
          </div>

        </div>

        <!-- ══ 保存 ══ -->
        <div class="api-group">
          <div class="api-card api-card-action">
            <div class="api-card-body">
              <button class="api-btn api-btn-solid" id="ssSave" style="flex:1;justify-content:center;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                  <polyline points="17 21 17 13 7 13 7 21"/>
                  <polyline points="7 3 7 8 15 8"/>
                </svg>
                <span>保存设置</span>
              </button>
              <button class="api-btn api-btn-outline" id="ssReset">
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
    //  更新预览小图偏移
    // ════════════════════════════════════════════════
    function updatePreview(x, y) {
        const preview = document.getElementById('ssPreviewScreen');
        if (!preview) return;
        // 预览图缩小16倍感受偏移
        preview.style.transform = `translate(${(x / 30) * 8}px, ${(y / 30) * 8}px)`;
    }

    // ════════════════════════════════════════════════
    //  更新 slider 背景
    // ════════════════════════════════════════════════
    function updateSliderBg(slider) {
        if (!slider) return;
        const min = parseFloat(slider.min);
        const max = parseFloat(slider.max);
        const val = parseFloat(slider.value);
        const pct = (((val - min) / (max - min)) * 100).toFixed(1) + '%';
        slider.style.setProperty('--pct', pct);
    }

    // ════════════════════════════════════════════════
    //  页面初始化
    // ════════════════════════════════════════════════
    function initPage(container) {
        let cfg = lsGet(DEFAULTS);
        container.innerHTML = buildHTML(cfg);

        // 当前页面内的"实时预览"用 localCfg，保存后才写入 localStorage
        let localCfg = { ...cfg };

        // ── 返回 ──
        document.getElementById('ssBack')?.addEventListener('click', () => {
            Router.pop();
        });

        // ── 滤镜选择 ──
        document.getElementById('ssFilterGrid')?.querySelectorAll('.filter-item').forEach(item => {
            item.addEventListener('click', () => {
                document.querySelectorAll('#ssFilterGrid .filter-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                localCfg.filter = item.dataset.filter;
                applyConfig(localCfg); // 实时预览
            });
        });

        // ── 左右偏移 ──
        const sliderX = document.getElementById('ssOffsetX');
        const labelX = document.getElementById('ssOffsetXVal');
        if (sliderX) {
            updateSliderBg(sliderX);
            sliderX.addEventListener('input', () => {
                const v = parseInt(sliderX.value, 10);
                if (labelX) labelX.textContent = v;
                localCfg.offsetX = v;
                updateSliderBg(sliderX);
                updatePreview(v, localCfg.offsetY);
                applyConfig(localCfg);
            });
        }

        // ── 上下偏移 ──
        const sliderY = document.getElementById('ssOffsetY');
        const labelY = document.getElementById('ssOffsetYVal');
        if (sliderY) {
            updateSliderBg(sliderY);
            sliderY.addEventListener('input', () => {
                const v = parseInt(sliderY.value, 10);
                if (labelY) labelY.textContent = v;
                localCfg.offsetY = v;
                updateSliderBg(sliderY);
                updatePreview(localCfg.offsetX, v);
                applyConfig(localCfg);
            });
        }

        // ── 隐藏状态栏 ──
        document.getElementById('ssHideStatusBar')?.addEventListener('change', e => {
            localCfg.hideStatusBar = e.target.checked;
            applyConfig(localCfg);
        });

        // ── 保存 ──
        document.getElementById('ssSave')?.addEventListener('click', () => {
            cfg = { ...localCfg };
            lsSet(cfg);
            applyConfig(cfg);
            toast('屏幕设置已保存 ✓');
        });

        // ── 重置 ──
        document.getElementById('ssReset')?.addEventListener('click', () => {
            localCfg = { ...DEFAULTS };
            lsSet(DEFAULTS);
            applyConfig(DEFAULTS);
            // 重建页面内容以刷新 UI
            container.innerHTML = buildHTML(DEFAULTS);
            initPage(container); // 重新绑定事件
            toast('已恢复默认设置');
        });

        // 初始化预览
        updatePreview(localCfg.offsetX, localCfg.offsetY);
    }

    // ════════════════════════════════════════════════
    //  启动时恢复配置
    // ════════════════════════════════════════════════
    function restoreOnLoad() {
        const cfg = lsGet(DEFAULTS);
        applyConfig(cfg);
    }

    // ════════════════════════════════════════════════
    //  注册路由
    // ════════════════════════════════════════════════
    function init() {
        // 页面一加载就恢复配置
        restoreOnLoad();
        // 注册 SPA 页面
        Router.onInit('screenSettings', initPage);
    }

    return { init };
})();
