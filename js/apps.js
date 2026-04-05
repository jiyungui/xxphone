/**
 * apps.js
 * APP图标数据 + SVG图标 + 渲染逻辑
 */

const Apps = (() => {

    // ── SVG图标定义（纯线条，韩ins风） ──
    const ICONS = {
        chat: `<svg viewBox="0 0 32 32" fill="none" stroke="#7a93aa" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M6 8h20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H10l-5 4V10a2 2 0 0 1 1-2z"/>
      <line x1="11" y1="14" x2="21" y2="14"/><line x1="11" y1="18" x2="17" y2="18"/>
    </svg>`,

        worldbook: `<svg viewBox="0 0 32 32" fill="none" stroke="#7a93aa" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="16" cy="16" r="10"/>
      <path d="M6 16h20M16 6a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10 15 15 0 0 1 4-10z"/>
    </svg>`,

        voice: `<svg viewBox="0 0 32 32" fill="none" stroke="#7a93aa" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M16 4a4 4 0 0 1 4 4v8a4 4 0 0 1-8 0V8a4 4 0 0 1 4-4z"/>
      <path d="M8 18a8 8 0 0 0 16 0"/><line x1="16" y1="26" x2="16" y2="29"/>
      <line x1="12" y1="29" x2="20" y2="29"/>
    </svg>`,

        forum: `<svg viewBox="0 0 32 32" fill="none" stroke="#7a93aa" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <rect x="4" y="6" width="16" height="12" rx="2"/>
      <path d="M8 22h16a2 2 0 0 0 2-2v-8"/><line x1="8" y1="11" x2="16" y2="11"/>
      <line x1="8" y1="14" x2="13" y2="14"/>
    </svg>`,

        diary: `<svg viewBox="0 0 32 32" fill="none" stroke="#7a93aa" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <rect x="7" y="4" width="18" height="24" rx="2"/>
      <line x1="7" y1="4" x2="7" y2="28"/>
      <line x1="11" y1="4" x2="11" y2="28"/>
      <line x1="15" y1="10" x2="22" y2="10"/>
      <line x1="15" y1="14" x2="22" y2="14"/>
      <line x1="15" y1="18" x2="19" y2="18"/>
    </svg>`,

        street: `<svg viewBox="0 0 32 32" fill="none" stroke="#7a93aa" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 28 L10 8 L16 20 L22 12 L28 28"/>
      <circle cx="16" cy="20" r="2"/>
      <circle cx="10" cy="8" r="2"/>
      <circle cx="22" cy="12" r="2"/>
    </svg>`,

        writing: `<svg viewBox="0 0 32 32" fill="none" stroke="#7a93aa" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 4l8 8-16 16H4v-8L20 4z"/>
      <line x1="16" y1="8" x2="24" y2="16"/>
    </svg>`,

        music: `<svg viewBox="0 0 32 32" fill="none" stroke="#7a93aa" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 26V10l14-4v16"/>
      <circle cx="9" cy="26" r="3"/><circle cx="23" cy="22" r="3"/>
    </svg>`,

        settings: `<svg viewBox="0 0 32 32" fill="none" stroke="#7a93aa" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="16" cy="16" r="3.5"/>
      <path d="M16 4v3M16 25v3M4 16h3M25 16h3
               M7.1 7.1l2.1 2.1M22.8 22.8l2.1 2.1
               M7.1 24.9l2.1-2.1M22.8 9.2l2.1-2.1"/>
    </svg>`,
    };

    // ── APP 定义 ──
    const APP_LIST = [
        { id: 'chat', name: '聊天', icon: 'chat', area: 'dock' },
        { id: 'worldbook', name: '世界书', icon: 'worldbook', area: 'dock' },
        { id: 'settings', name: '设置', icon: 'settings', area: 'dock' },
        { id: 'voice', name: '心声', icon: 'voice', area: 'grid' },
        { id: 'forum', name: '论坛', icon: 'forum', area: 'grid' },
        { id: 'diary', name: '小芽日记', icon: 'diary', area: 'grid' },
        { id: 'street', name: '街の声', icon: 'street', area: 'grid' },
        { id: 'writing', name: '笔X阁', icon: 'writing', area: 'grid' },
        { id: 'music', name: '音乐', icon: 'music', area: 'grid' },
    ];

    /** 创建单个图标的 DOM 元素 */
    function createIconEl(app) {
        const wrap = document.createElement('div');
        wrap.className = 'app-icon';
        wrap.dataset.id = app.id;

        const shape = document.createElement('div');
        shape.className = 'app-icon-shape';
        shape.innerHTML = ICONS[app.icon] || '';

        const name = document.createElement('span');
        name.className = 'app-icon-name';
        name.textContent = app.name;

        wrap.appendChild(shape);
        wrap.appendChild(name);

        // 点击事件（占位，后续可跳转页面）
        wrap.addEventListener('click', () => {
            onAppClick(app);
        });

        return wrap;
    }

    /** APP点击处理 */
    function onAppClick(app) {
        // 轻触反馈
        console.log('[App] click:', app.id);
        // 后续：跳转对应模块页面，如 window.location.href = `pages/${app.id}.html`
    }

    /** 渲染 Dock */
    function renderDock() {
        const dock = document.getElementById('dock');
        if (!dock) return;
        dock.innerHTML = '';
        APP_LIST
            .filter(a => a.area === 'dock')
            .forEach(app => dock.appendChild(createIconEl(app)));
    }

    /** 渲染 APP Grid */
    function renderGrid() {
        const grid = document.getElementById('appGrid');
        if (!grid) return;
        grid.innerHTML = '';
        APP_LIST
            .filter(a => a.area === 'grid')
            .forEach(app => grid.appendChild(createIconEl(app)));
    }

    /** 初始化 */
    function init() {
        renderDock();
        renderGrid();
    }

    return { init, APP_LIST, ICONS };
})();
