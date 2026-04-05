/**
 * storage.js
 * 统一的本地持久化层，使用 localStorage
 * 存储"语义数据"（文字/图片base64/顺序），不存像素坐标
 */

const Storage = (() => {
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
            console.warn('[Storage] set failed:', e);
        }
    }

    function remove(key) {
        localStorage.removeItem(KEY_PREFIX + key);
    }

    // ── 小组件文字 ──
    function getWidgetText(id, defaultText = '') {
        return get('widget_text_' + id, defaultText);
    }
    function setWidgetText(id, text) {
        set('widget_text_' + id, text);
    }

    // ── 小组件图片（base64） ──
    function getWidgetImage(id) {
        return get('widget_img_' + id, null);
    }
    function setWidgetImage(id, base64) {
        set('widget_img_' + id, base64);
    }

    // ── 通用设置 ──
    function getSetting(key, defaultVal) {
        return get('setting_' + key, defaultVal);
    }
    function setSetting(key, val) {
        set('setting_' + key, val);
    }

    return {
        get, set, remove,
        getWidgetText, setWidgetText,
        getWidgetImage, setWidgetImage,
        getSetting, setSetting
    };
})();
