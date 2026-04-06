/**
 * router.js
 * SPA 页面路由控制器
 * 管理 .page 层之间的切换动画，维护页面历史栈
 * 不依赖任何其他模块，其他模块依赖此模块
 */

const Router = (() => {
    'use strict';

    // 当前页面历史栈（初始包含主页）
    let _stack = ['home'];

    // 页面ID映射
    const PAGE_MAP = {
        home: 'pageHome',
        settings: 'pageSettings',
        apiSettings: 'pageApiSettings',
        screenSettings: 'pageScreenSettings',  // ★ 新增
    };

    // 页面初始化回调（每个页面首次打开时执行一次）
    const _initCallbacks = {};
    // 页面显示回调（每次进入页面时执行）
    const _onShowCallbacks = {};

    /** 注册页面初始化回调（只执行一次） */
    function onInit(pageId, cb) {
        _initCallbacks[pageId] = cb;
    }

    /** 注册页面每次显示时的回调 */
    function onShow(pageId, cb) {
        _onShowCallbacks[pageId] = cb;
    }

    /** 获取当前页面ID */
    function current() {
        return _stack[_stack.length - 1];
    }

    /**
     * 跳转到指定页面
     * @param {string} pageId - 目标页面ID（见 PAGE_MAP）
     */
    function push(pageId) {
        if (!PAGE_MAP[pageId]) {
            console.warn('[Router] unknown pageId:', pageId);
            return;
        }
        if (current() === pageId) return;

        const fromId = current();
        const fromEl = document.getElementById(PAGE_MAP[fromId]);
        const toEl = document.getElementById(PAGE_MAP[pageId]);
        if (!fromEl || !toEl) return;

        // 初始化目标页面内容（首次）
        if (_initCallbacks[pageId] && !toEl.dataset.initialized) {
            _initCallbacks[pageId](toEl);
            toEl.dataset.initialized = 'true';
        }

        // 动画：from → slide-out，to → active
        fromEl.classList.remove('active');
        fromEl.classList.add('slide-out');
        toEl.classList.add('active');

        _stack.push(pageId);

        // 触发 onShow
        if (_onShowCallbacks[pageId]) {
            _onShowCallbacks[pageId](toEl);
        }
    }

    /**
     * 返回上一页面
     */
    function pop() {
        if (_stack.length <= 1) return;

        const fromId = _stack.pop();
        const backId = current();
        const fromEl = document.getElementById(PAGE_MAP[fromId]);
        const backEl = document.getElementById(PAGE_MAP[backId]);
        if (!fromEl || !backEl) return;

        // 动画反向：from 滑回右侧，back 从左恢复
        fromEl.classList.remove('active');
        backEl.classList.remove('slide-out');
        backEl.classList.add('active');

        // 延迟清理，等动画完成
        setTimeout(() => {
            fromEl.classList.remove('slide-out');
        }, 340);

        // 触发 onShow
        if (_onShowCallbacks[backId]) {
            _onShowCallbacks[backId](backEl);
        }
    }

    /** 初始化路由（设置主页为active） */
    function init() {
        const homeEl = document.getElementById(PAGE_MAP['home']);
        if (homeEl) homeEl.classList.add('active');
    }

    return { push, pop, current, onInit, onShow, init };
})();
