const Settings = (() => {
  'use strict';

  function buildSettingsHTML() {
    return `
      <div class="inner-header">
        <button class="inner-header-back" id="settingsBack">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
        <span class="inner-header-title">设置</span>
        <div class="inner-header-placeholder"></div>
      </div>

      <div class="inner-main">
        <p class="settings-subtitle">系统管理</p>
        <div class="settings-group">

          <div class="settings-card" data-route="apiSettings">
            <div class="card-icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2"/>
                <path d="M8 21h8M12 17v4"/>
                <path d="M7 8h2l2 4 2-6 2 4h2"/>
              </svg>
            </div>
            <div class="card-content">
              <span class="card-title">API 设置</span>
              <span class="card-desc">配置模型接口与语音服务</span>
            </div>
            <div class="card-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 18l6-6-6-6"/></svg></div>
          </div>

          <div class="settings-card" data-route="screenSettings">
            <div class="card-icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="4" width="20" height="14" rx="2"/>
                <path d="M8 20h8M12 18v2"/>
                <circle cx="12" cy="11" r="3"/>
              </svg>
            </div>
            <div class="card-content">
              <span class="card-title">屏幕调整</span>
              <span class="card-desc">色调滤镜、位置偏移、隐藏状态栏</span>
            </div>
            <div class="card-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 18l6-6-6-6"/></svg></div>
          </div>

          <!-- ★ 壁纸更换 → 真实路由 -->
          <div class="settings-card" data-route="wallpaperSettings">
            <div class="card-icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="3"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <path d="M21 15l-5-5L5 21"/>
              </svg>
            </div>
            <div class="card-content">
              <span class="card-title">壁纸更换</span>
              <span class="card-desc">自定义壁纸、天气动态效果</span>
            </div>
            <div class="card-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 18l6-6-6-6"/></svg></div>
          </div>

          <div class="settings-card" data-route="iconSettings">
            <div class="card-icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="2"/>
                <rect x="14" y="3" width="7" height="7" rx="2"/>
                <rect x="3" y="14" width="7" height="7" rx="2"/>
                <rect x="14" y="14" width="7" height="7" rx="2"/>
              </svg>
            </div>
            <div class="card-content">
              <span class="card-title">应用图标更换</span>
              <span class="card-desc">为每个 APP 设置自定义图标</span>
            </div>
            <div class="card-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 18l6-6-6-6"/></svg></div>
          </div>

          <div class="settings-card" data-route="fontSettings">
            <div class="card-icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="4 7 4 4 20 4 20 7"/>
                <line x1="9" y1="20" x2="15" y2="20"/>
                <line x1="12" y1="4" x2="12" y2="20"/>
              </svg>
            </div>
            <div class="card-content">
              <span class="card-title">字体更换</span>
              <span class="card-desc">切换全局字体风格</span>
            </div>
            <div class="card-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 18l6-6-6-6"/></svg></div>
          </div>

          <div class="settings-card" data-route="dataSettings">
            <div class="card-icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                <ellipse cx="12" cy="5" rx="9" ry="3"/>
                <path d="M3 5v4c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/>
                <path d="M3 9v6c0 1.66 4.03 3 9 3s9-1.34 9-3V9"/>
              </svg>
            </div>
            <div class="card-content">
              <span class="card-title">数据管理</span>
              <span class="card-desc">清除缓存、导入导出配置</span>
            </div>
            <div class="card-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 18l6-6-6-6"/></svg></div>
          </div>

        </div>
        <p class="settings-version">HomeScreen · v1.0.0</p>
      </div>
    `;
  }

  function initSettingsPage(container) {
    container.innerHTML = buildSettingsHTML();

    container.querySelector('#settingsBack')?.addEventListener('click', () => Router.pop());

    container.querySelectorAll('.settings-card[data-route]').forEach(card => {
      card.addEventListener('click', () => {
        const route = card.dataset.route;
        switch (route) {
          case 'apiSettings': Router.push('apiSettings'); break;
          case 'screenSettings': Router.push('screenSettings'); break;
          case 'wallpaperSettings': Router.push('wallpaperSettings'); break; // ★
          case 'iconSettings':
          case 'fontSettings':
          case 'dataSettings':
            showComingSoon(card.querySelector('.card-title')?.textContent || '该功能');
            break;
        }
      });
    });
  }

  function showComingSoon(name) {
    const toast = document.getElementById('apiToast');
    if (!toast) return;
    toast.textContent = `「${name}」功能开发中...`;
    toast.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove('show'), 2200);
  }

  function init() { Router.onInit('settings', initSettingsPage); }

  return { init };
})();
