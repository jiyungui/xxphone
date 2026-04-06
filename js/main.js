/**
 * main.js
 * 应用初始化总入口
 */

(function () {

    // ── PWA Service Worker ──
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(() => console.log('[SW] registered'))
                .catch(e => console.warn('[SW] failed:', e));
        });
    }

    // ── 状态栏时间 ──
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

    // ── 初始化 ──
    function boot() {
        Router.init();          // 路由初始化（主页设为active）
        Apps.init();            // 渲染图标
        Widgets.init();         // 小组件可编辑
        Settings.init();        // 注册设置页到路由
        ApiSettings.init();     // 注册API设置页到路由
        ScreenSettings.init();  // ★ 注册屏幕调整页到路由 + 恢复持久化配置
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

})();
