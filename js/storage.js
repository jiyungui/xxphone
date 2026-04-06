/**
 * storage.js
 * 统一持久化层
 *
 * 文字 / 设置  →  localStorage（轻量，5 MB 够用）
 * 图片         →  IndexedDB（无限制，存原始 Blob，不损质量）
 *
 * DB: HomeScreenDB  v2
 * ├── store: 'wallpaper'   壁纸图片
 * └── store: 'widgets'     小组件图片（polaroid / photoBox / avatar 等）
 */

const Storage = (() => {
    'use strict';

    /* ══════════════════════════════════════════
       LocalStorage —— 文字 / 设置
    ══════════════════════════════════════════ */
    const KEY_PREFIX = 'hs_';

    function get(key, defaultVal = null) {
        try {
            const raw = localStorage.getItem(KEY_PREFIX + key);
            return raw !== null ? JSON.parse(raw) : defaultVal;
        } catch {
            return defaultVal;
        }
    }

    function set(key, value) {
        try {
            localStorage.setItem(KEY_PREFIX + key, JSON.stringify(value));
        } catch (e) {
            console.warn('[Storage] localStorage.set failed:', key, e);
        }
    }

    function remove(key) {
        try { localStorage.removeItem(KEY_PREFIX + key); } catch { }
    }

    // ── 小组件文字 ──
    function getWidgetText(id, defaultText = '') {
        return get('widget_text_' + id, defaultText);
    }
    function setWidgetText(id, text) {
        set('widget_text_' + id, text);
    }

    // ── 通用设置 ──
    function getSetting(key, defaultVal) {
        return get('setting_' + key, defaultVal);
    }
    function setSetting(key, val) {
        set('setting_' + key, val);
    }

    /* ══════════════════════════════════════════
       IndexedDB —— 图片 Blob
       DB 版本统一由此处管理，其他模块不再各自 open
    ══════════════════════════════════════════ */
    const IDB_NAME = 'HomeScreenDB';
    const IDB_VERSION = 2;

    let _db = null;

    /** 获取（或初始化）DB 实例，返回 Promise<IDBDatabase> */
    function _openDB() {
        return new Promise((resolve, reject) => {
            if (_db) { resolve(_db); return; }

            const req = indexedDB.open(IDB_NAME, IDB_VERSION);

            req.onupgradeneeded = e => {
                const db = e.target.result;
                // 壁纸 store（壁纸模块使用）
                if (!db.objectStoreNames.contains('wallpaper')) {
                    db.createObjectStore('wallpaper');
                }
                // 小组件图片 store
                if (!db.objectStoreNames.contains('widgets')) {
                    db.createObjectStore('widgets');
                }
            };

            req.onsuccess = e => {
                _db = e.target.result;

                // DB 被外部强制关闭时重置引用，下次重新 open
                _db.onversionchange = () => { _db.close(); _db = null; };
                _db.onclose = () => { _db = null; };

                resolve(_db);
            };

            req.onerror = e => reject(e.target.error);
            req.onblocked = () => reject(new Error('[Storage] IDB open blocked'));
        });
    }

    /**
     * 存图片 Blob 到 IndexedDB
     * @param {string} store   - 'wallpaper' | 'widgets'
     * @param {string} key     - 存储键
     * @param {Blob}   blob    - 原始 File / Blob，不压缩
     */
    async function idbSet(store, key, blob) {
        try {
            const db = await _openDB();
            await new Promise((resolve, reject) => {
                const tx = db.transaction(store, 'readwrite');
                tx.objectStore(store).put(blob, key);
                tx.oncomplete = resolve;
                tx.onerror = e => reject(e.target.error);
            });
        } catch (e) {
            console.warn('[Storage] idbSet failed:', store, key, e);
        }
    }

    /**
     * 读取图片 Blob
     * @returns {Promise<Blob|null>}
     */
    async function idbGet(store, key) {
        try {
            const db = await _openDB();
            return await new Promise((resolve, reject) => {
                const tx = db.transaction(store, 'readonly');
                const req = tx.objectStore(store).get(key);
                req.onsuccess = e => resolve(e.target.result || null);
                req.onerror = e => reject(e.target.error);
            });
        } catch (e) {
            console.warn('[Storage] idbGet failed:', store, key, e);
            return null;
        }
    }

    /**
     * 删除图片
     */
    async function idbRemove(store, key) {
        try {
            const db = await _openDB();
            await new Promise((resolve, reject) => {
                const tx = db.transaction(store, 'readwrite');
                tx.objectStore(store).delete(key);
                tx.oncomplete = resolve;
                tx.onerror = e => reject(e.target.error);
            });
        } catch (e) {
            console.warn('[Storage] idbRemove failed:', store, key, e);
        }
    }

    /* ══════════════════════════════════════════
       小组件图片 —— 语义化封装
       key 命名：widget_<id>  例如 widget_polaroid
    ══════════════════════════════════════════ */

    // ObjectURL 缓存：避免每次读取都重新 createObjectURL，也便于统一 revoke
    const _urlCache = {};

    /**
     * 读取小组件图片，返回可直接赋给 img.src 的 ObjectURL
     * @returns {Promise<string|null>}
     */
    async function getWidgetImage(id) {
        // 如果内存里还有缓存就直接用（页面生命周期内只创建一次）
        if (_urlCache['w_' + id]) return _urlCache['w_' + id];

        const blob = await idbGet('widgets', 'widget_' + id);
        if (!blob) return null;

        const url = URL.createObjectURL(blob);
        _urlCache['w_' + id] = url;
        return url;
    }

    /**
     * 存小组件图片
     * @param {string} id
     * @param {Blob|File} blob  直接传 File，不走 base64
     */
    async function setWidgetImage(id, blob) {
        // 更新 ObjectURL 缓存
        if (_urlCache['w_' + id]) {
            URL.revokeObjectURL(_urlCache['w_' + id]);
            delete _urlCache['w_' + id];
        }
        const url = URL.createObjectURL(blob);
        _urlCache['w_' + id] = url;

        await idbSet('widgets', 'widget_' + id, blob);
        return url;
    }

    /**
     * 删除小组件图片
     */
    async function removeWidgetImage(id) {
        if (_urlCache['w_' + id]) {
            URL.revokeObjectURL(_urlCache['w_' + id]);
            delete _urlCache['w_' + id];
        }
        await idbRemove('widgets', 'widget_' + id);
    }

    /* ══════════════════════════════════════════
       壁纸图片 —— 语义化封装（供 wallpaper-settings.js 调用）
    ══════════════════════════════════════════ */

    async function getWallpaper() {
        if (_urlCache['wallpaper']) return _urlCache['wallpaper'];
        const blob = await idbGet('wallpaper', 'current');
        if (!blob) return null;
        const url = URL.createObjectURL(blob);
        _urlCache['wallpaper'] = url;
        return url;
    }

    async function setWallpaper(blob) {
        if (_urlCache['wallpaper']) {
            URL.revokeObjectURL(_urlCache['wallpaper']);
            delete _urlCache['wallpaper'];
        }
        const url = URL.createObjectURL(blob);
        _urlCache['wallpaper'] = url;
        await idbSet('wallpaper', 'current', blob);
        return url;
    }

    async function removeWallpaper() {
        if (_urlCache['wallpaper']) {
            URL.revokeObjectURL(_urlCache['wallpaper']);
            delete _urlCache['wallpaper'];
        }
        await idbRemove('wallpaper', 'current');
    }

    /* ══════════════════════════════════════════
       迁移：把旧 localStorage base64 图片迁入 IndexedDB
       只执行一次，迁移完打标记
    ══════════════════════════════════════════ */
    async function _migrateBase64() {
        if (localStorage.getItem('hs_idb_migrated')) return;

        const legacyKeys = [
            { lsKey: 'hs_widget_img_polaroid', idbId: 'polaroid' },
            { lsKey: 'hs_widget_img_photoBox', idbId: 'photoBox' },
            { lsKey: 'hs_widget_img_bannerAvatar', idbId: 'bannerAvatar' },
        ];

        for (const { lsKey, idbId } of legacyKeys) {
            const raw = localStorage.getItem(lsKey);
            if (!raw) continue;
            try {
                // base64 → Blob
                const base64 = JSON.parse(raw);
                const res = await fetch(base64);
                const blob = await res.blob();
                await idbSet('widgets', 'widget_' + idbId, blob);
                localStorage.removeItem(lsKey);
                console.log('[Storage] migrated:', lsKey);
            } catch (e) {
                console.warn('[Storage] migrate failed:', lsKey, e);
            }
        }

        localStorage.setItem('hs_idb_migrated', '1');
    }

    /* 初始化：触发迁移（静默，不阻塞主流程）*/
    _migrateBase64().catch(() => { });

    return {
        // localStorage
        get, set, remove,
        getWidgetText, setWidgetText,
        getSetting, setSetting,
        // IndexedDB - 图片
        getWidgetImage, setWidgetImage, removeWidgetImage,
        getWallpaper, setWallpaper, removeWallpaper,
        // 底层（供壁纸/天气等模块直接调用）
        idbGet, idbSet, idbRemove,
        openDB: _openDB,
    };
})();
