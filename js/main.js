(function () {

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(() => console.log('[SW] registered'))
                .catch(e => console.warn('[SW] failed:', e));
        });
    }

    function updateTime() {
        const el = document.getElementById('statusTime');
        if (!el) return;
        const now = new Date();
        el.textContent =
            String(now.getHours()).padStart(2, '0') + ':' +
            String(now.getMinutes()).padStart(2, '0');
    }
    updateTime();
    setInterval(updateTime, 10000);

    function boot() {
        Router.init();
        Apps.init();
        Widgets.init();
        Settings.init();
        ApiSettings.init();
        ScreenSettings.init();
        Weather.init();               // ★ 天气引擎初始化（恢复持久化天气配置）
        WallpaperSettings.init();     // ★ 壁纸初始化（恢复壁纸 + 样式）
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

})();
