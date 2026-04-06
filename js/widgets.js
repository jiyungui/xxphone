/**
 * widgets.js
 * 小组件可编辑逻辑
 *
 * 图片：调用 Storage.getWidgetImage / setWidgetImage（→ IndexedDB Blob）
 * 文字：调用 Storage.getWidgetText / setWidgetText（→ localStorage）
 */

const Widgets = (() => {
    'use strict';

    /* ══════════════════════════════════════════
       工具：UI 显示
    ══════════════════════════════════════════ */

    /**
     * 把 url 应用到 img 元素，同时切换 placeholder 显示
     * url 为 null 时还原为占位状态
     */
    function applyImage(imgId, placeholderId, url) {
        const img = document.getElementById(imgId);
        const ph = document.getElementById(placeholderId);
        if (img) {
            if (url) {
                img.src = url;
                img.style.display = 'block';
            } else {
                img.src = '';
                img.style.display = 'none';
            }
        }
        if (ph) {
            ph.style.display = url ? 'none' : 'flex';
        }
    }

    /* ══════════════════════════════════════════
       工具：图片上传绑定
       triggerEl 被点击 → 触发 input → 存 IndexedDB → 回调
    ══════════════════════════════════════════ */

    /**
     * @param {HTMLElement} triggerEl   点击触发区域
     * @param {string}      inputId     file input id（可已存在于 HTML 中）
     * @param {Function}    onUrl       callback(objectURL: string) 存完后调用
     * @param {Object}      [opts]
     * @param {Function}    [opts.skipIf]  (e: Event) => bool，返回 true 则跳过
     */
    function bindImageUpload(triggerEl, inputId, onUrl, opts = {}) {
        if (!triggerEl) return;

        let input = document.getElementById(inputId);
        if (!input) {
            input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.className = 'hidden-input';
            input.id = inputId;
            document.body.appendChild(input);
        }

        triggerEl.addEventListener('click', e => {
            if (opts.skipIf && opts.skipIf(e)) return;
            input.click();
        });

        input.addEventListener('change', async () => {
            const file = input.files?.[0];
            if (!file) return;
            input.value = ''; // 允许重复选同一文件

            try {
                // ★ 直接存原始 File Blob，不经 canvas 压缩
                const url = await Storage.setWidgetImage(
                    input.id.replace('FileInput', '').replace('Input', ''),
                    file
                );
                onUrl(url);
            } catch (e) {
                console.warn('[Widgets] 图片上传失败:', e);
            }
        });
    }

    /* ══════════════════════════════════════════
       弹窗编辑
    ══════════════════════════════════════════ */

    let _editCallback = null;

    function openEditModal(title, currentValue, onConfirm) {
        const modal = document.getElementById('editModal');
        const input = document.getElementById('editModalInput');
        const titleEl = document.getElementById('editModalTitle');
        if (!modal || !input) return;

        titleEl.textContent = title;
        input.value = currentValue || '';
        modal.classList.add('visible');
        setTimeout(() => { input.focus(); input.select(); }, 100);
        _editCallback = onConfirm;
    }

    function closeEditModal() {
        document.getElementById('editModal')?.classList.remove('visible');
        _editCallback = null;
    }

    function bindModalActions() {
        document.getElementById('editModalConfirm')?.addEventListener('click', () => {
            const val = (document.getElementById('editModalInput')?.value || '').trim();
            if (_editCallback) _editCallback(val);
            closeEditModal();
        });
        document.getElementById('editModalCancel')?.addEventListener('click', closeEditModal);
        document.getElementById('editModal')?.addEventListener('click', e => {
            if (e.target === e.currentTarget) closeEditModal();
        });
        document.getElementById('editModalInput')?.addEventListener('keydown', e => {
            if (e.key === 'Enter') document.getElementById('editModalConfirm')?.click();
            if (e.key === 'Escape') closeEditModal();
        });
    }

    /* ══════════════════════════════════════════
       头像
    ══════════════════════════════════════════ */

    async function initBannerAvatar() {
        // 1. 恢复
        const url = await Storage.getWidgetImage('bannerAvatar');
        applyImage('bannerAvatar', 'bannerAvatarPlaceholder', url);

        // 2. 创建 input & 绑定
        const wrap = document.querySelector('.banner-avatar-wrap');
        let input = document.getElementById('bannerAvatarInput');
        if (!input) {
            input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.id = 'bannerAvatarInput';
            input.style.display = 'none';
            document.body.appendChild(input);
        }

        wrap?.addEventListener('click', () => input.click());

        input.addEventListener('change', async () => {
            const file = input.files?.[0];
            if (!file) return;
            input.value = '';
            try {
                const newUrl = await Storage.setWidgetImage('bannerAvatar', file);
                applyImage('bannerAvatar', 'bannerAvatarPlaceholder', newUrl);
            } catch (e) {
                console.warn('[Avatar] 上传失败:', e);
            }
        });
    }

    /* ══════════════════════════════════════════
       格言
    ══════════════════════════════════════════ */

    function initBannerMotto() {
        const el = document.getElementById('bannerMotto');
        if (!el) return;

        el.textContent = Storage.getWidgetText('bannerMotto', '幸好爱是小小的奇迹');

        el.addEventListener('click', () => {
            openEditModal('编辑格言', el.textContent, val => {
                if (!val) return;
                el.textContent = val;
                Storage.setWidgetText('bannerMotto', val);
            });
        });
    }

    /* ══════════════════════════════════════════
       Baby / Contact
    ══════════════════════════════════════════ */

    function initBannerInfo() {
        const fields = [
            {
                id: 'infoBaby',
                label: '编辑 Baby',
                defaultVal: 'call Aero',
                editBtnSel: '[data-target="infoBaby"]',
            },
            {
                id: 'infoContact',
                label: '编辑 Contact',
                defaultVal: "http//>Aero's love.com",
                editBtnSel: null,
            },
        ];

        fields.forEach(({ id, label, defaultVal, editBtnSel }) => {
            const el = document.getElementById(id);
            if (!el) return;

            el.textContent = Storage.getWidgetText(id, defaultVal);

            const doEdit = () => {
                openEditModal(label, el.textContent, val => {
                    if (!val) return;
                    el.textContent = val;
                    Storage.setWidgetText(id, val);
                });
            };

            el.addEventListener('click', doEdit);
            if (editBtnSel) {
                document.querySelector(editBtnSel)?.addEventListener('click', e => {
                    e.stopPropagation();
                    doEdit();
                });
            }
        });
    }

    /* ══════════════════════════════════════════
       拍立得
    ══════════════════════════════════════════ */

    async function initPolaroid() {
        const card = document.getElementById('widgetPolaroid');
        const textEl = document.getElementById('polaroidText');

        // 1. 恢复图片
        const url = await Storage.getWidgetImage('polaroid');
        applyImage('polaroidImg', 'polaroidPlaceholder', url);

        // 2. 恢复文字
        if (textEl) {
            textEl.textContent = Storage.getWidgetText('polaroidText', 'First Choice');
        }

        // 3. 绑定换图（点击卡片，跳过文字区域点击）
        const front = card?.querySelector('.polaroid-front');
        if (front) {
            const input = document.getElementById('polaroidFileInput')
                || (() => {
                    const el = document.createElement('input');
                    el.type = 'file';
                    el.accept = 'image/*';
                    el.id = 'polaroidFileInput';
                    el.style.display = 'none';
                    document.body.appendChild(el);
                    return el;
                })();

            front.addEventListener('click', e => {
                if (e.target.closest('.polaroid-caption')) return;
                input.click();
            });

            input.addEventListener('change', async () => {
                const file = input.files?.[0];
                if (!file) return;
                input.value = '';
                try {
                    const newUrl = await Storage.setWidgetImage('polaroid', file);
                    applyImage('polaroidImg', 'polaroidPlaceholder', newUrl);
                } catch (e) {
                    console.warn('[Polaroid] 上传失败:', e);
                }
            });
        }

        // 4. 绑定文字编辑
        textEl?.addEventListener('click', e => {
            e.stopPropagation();
            openEditModal('编辑说明文字', textEl.textContent, val => {
                if (!val) return;
                textEl.textContent = val;
                Storage.setWidgetText('polaroidText', val);
            });
        });
    }

    /* ══════════════════════════════════════════
       右侧图片框
    ══════════════════════════════════════════ */

    async function initPhotoBox() {
        const card = document.getElementById('widgetPhotoBox');

        // 1. 恢复图片
        const url = await Storage.getWidgetImage('photoBox');
        applyImage('photoBoxImg', 'photoBoxPlaceholder', url);

        // 2. 绑定换图
        const input = document.getElementById('photoBoxFileInput')
            || (() => {
                const el = document.createElement('input');
                el.type = 'file';
                el.accept = 'image/*';
                el.id = 'photoBoxFileInput';
                el.style.display = 'none';
                document.body.appendChild(el);
                return el;
            })();

        card?.addEventListener('click', () => input.click());

        input.addEventListener('change', async () => {
            const file = input.files?.[0];
            if (!file) return;
            input.value = '';
            try {
                const newUrl = await Storage.setWidgetImage('photoBox', file);
                applyImage('photoBoxImg', 'photoBoxPlaceholder', newUrl);
            } catch (e) {
                console.warn('[PhotoBox] 上传失败:', e);
            }
        });
    }

    /* ══════════════════════════════════════════
       入口
    ══════════════════════════════════════════ */

    async function init() {
        bindModalActions();

        // 并行初始化，加快启动速度
        await Promise.all([
            initBannerAvatar(),
            initPolaroid(),
            initPhotoBox(),
        ]);

        // 文字类同步初始化
        initBannerMotto();
        initBannerInfo();
    }

    return { init };
})();
