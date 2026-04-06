const Router = (() => {
    'use strict';

    let _stack = ['home'];

    const PAGE_MAP = {
        home: 'pageHome',
        settings: 'pageSettings',
        apiSettings: 'pageApiSettings',
        screenSettings: 'pageScreenSettings',
        wallpaperSettings: 'pageWallpaperSettings', // ★ 新增
    };

    const _initCallbacks = {};
    const _onShowCallbacks = {};

    function onInit(pageId, cb) { _initCallbacks[pageId] = cb; }
    function onShow(pageId, cb) { _onShowCallbacks[pageId] = cb; }
    function current() { return _stack[_stack.length - 1]; }

    function push(pageId) {
        if (!PAGE_MAP[pageId]) { console.warn('[Router] unknown pageId:', pageId); return; }
        if (current() === pageId) return;

        const fromId = current();
        const fromEl = document.getElementById(PAGE_MAP[fromId]);
        const toEl = document.getElementById(PAGE_MAP[pageId]);
        if (!fromEl || !toEl) return;

        if (_initCallbacks[pageId] && !toEl.dataset.initialized) {
            _initCallbacks[pageId](toEl);
            toEl.dataset.initialized = 'true';
        }

        fromEl.classList.remove('active');
        fromEl.classList.add('slide-out');
        toEl.classList.add('active');
        _stack.push(pageId);

        if (_onShowCallbacks[pageId]) _onShowCallbacks[pageId](toEl);
    }

    function pop() {
        if (_stack.length <= 1) return;
        const fromId = _stack.pop();
        const backId = current();
        const fromEl = document.getElementById(PAGE_MAP[fromId]);
        const backEl = document.getElementById(PAGE_MAP[backId]);
        if (!fromEl || !backEl) return;

        fromEl.classList.remove('active');
        backEl.classList.remove('slide-out');
        backEl.classList.add('active');
        setTimeout(() => fromEl.classList.remove('slide-out'), 340);

        if (_onShowCallbacks[backId]) _onShowCallbacks[backId](backEl);
    }

    function init() {
        const homeEl = document.getElementById(PAGE_MAP['home']);
        if (homeEl) homeEl.classList.add('active');
    }

    return { push, pop, current, onInit, onShow, init };
})();
