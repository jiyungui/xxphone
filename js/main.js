/**
 * main.js
 * 应用初始化入口
 */

(function () {

    // ── 注册 Service Worker（PWA支持） ──
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(() => console.log('[SW] registered'))
                .catch(e => console.warn('[SW] register failed:', e));
        });
    }

    // ── 状态栏时间实时更新 ──
    function updateTime() {
        const el = document.getElementById('statusTime');
        if (!el) return;
        const now = new Date();
        const h = String(now.getHours()).padStart(2, '0');
        const m = String(now.getMinutes()).padStart(2, '0');
        el.textContent = `${h}:${m}`;
    }
    updateTime();
    setInterval(updateTime, 10000);

    // ── DOM 加载完毕后初始化各模块 ──
    function boot() {
        Apps.init();       // 渲染APP图标
        Widgets.init();    // 初始化小组件编辑功能
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

})();
