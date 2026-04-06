/**
 * widgets.js
 * 所有小组件的可编辑逻辑
 * ★ 修复：图片持久化在刷新后依旧保留
 */

const Widgets = (() => {

    // ════════════════════════════════
    //  通用：图片工具
    // ════════════════════════════════

    /** 将 File 读取为 base64，返回 Promise */
    function readFileAsBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    /**
     * 设置图片显示状态
     * src 有值 → 显示 img，隐藏 placeholder
     * src 无值 → 隐藏 img，显示 placeholder
     */
    function applyImage(imgId, placeholderId, src) {
        const img = document.getElementById(imgId);
        const ph = document.getElementById(placeholderId);
        if (!img || !ph) return;
        if (src) {
            img.src = src;
            img.style.display = 'block';
            ph.style.display = 'none';
        } else {
            img.style.display = 'none';
            ph.style.display = 'flex';
        }
    }

    /**
     * 绑定可点击元素 → 触发文件选择 → 读base64 → 回调
     * @param {HTMLElement} triggerEl  - 触发点击的容器元素
     * @param {string}      inputId    - file input 的 id
     * @param {Function}    onImage    - callback(base64)
     */
    function bindImageUpload(triggerEl, inputId, onImage) {
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

        triggerEl.addEventListener('click', (e) => {
            // 如果点击的是文字区域，不触发图片上传（由文字自己处理）
            if (e.target.closest('.polaroid-caption')) return;
            input.click();
        });

        input.addEventListener('change', async () => {
            const file = input.files[0];
            if (!file) return;
            try {
                const base64 = await readFileAsBase64(file);
                onImage(base64);
            } catch (e) {
                console.warn('[Widgets] 图片读取失败:', e);
            }
            input.value = '';
        });
    }

    // ════════════════════════════════
    //  通用：弹窗编辑
    // ════════════════════════════════

    let _editCallback = null;

    function openEditModal(title, currentValue, onConfirm) {
        const modal = document.getElementById('editModal');
        const input = document.getElementById('editModalInput');
        const titleEl = document.getElementById('editModalTitle');
        if (!modal || !input) return;

        titleEl.textContent = title;
        input.value = currentValue || '';
        modal.classList.add('visible');

        // 延迟聚焦，避免 iOS Safari 弹窗动画干扰
        setTimeout(() => { input.focus(); input.select(); }, 100);
        _editCallback = onConfirm;
    }

    function closeEditModal() {
        const modal = document.getElementById('editModal');
        if (modal) modal.classList.remove('visible');
        _editCallback = null;
    }

    function bindModalActions() {
        document.getElementById('editModalConfirm')?.addEventListener('click', () => {
            const val = (document.getElementById('editModalInput')?.value || '').trim();
            if (_editCallback) _editCallback(val);
            closeEditModal();
        });

        document.getElementById('editModalCancel')?.addEventListener('click', closeEditModal);

        document.getElementById('editModal')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) closeEditModal();
        });

        document.getElementById('editModalInput')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') document.getElementById('editModalConfirm')?.click();
            if (e.key === 'Escape') closeEditModal();
        });
    }

    // ════════════════════════════════
    //  头像（★ 持久化修复）
    // ════════════════════════════════

    function initBannerAvatar() {
        const wrap = document.querySelector('.banner-avatar-wrap');

        // ★ 优先从 storage 恢复图片
        const saved = Storage.getWidgetImage('bannerAvatar');
        applyImage('bannerAvatar', 'bannerAvatarPlaceholder', saved);

        // 动态创建 input
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.className = 'hidden-input';
        input.id = 'bannerAvatarInput';
        document.body.appendChild(input);

        wrap?.addEventListener('click', () => input.click());

        input.addEventListener('change', async () => {
            const file = input.files[0];
            if (!file) return;
            try {
                const base64 = await readFileAsBase64(file);
                // ★ 先存储，再更新 UI
                Storage.setWidgetImage('bannerAvatar', base64);
                applyImage('bannerAvatar', 'bannerAvatarPlaceholder', base64);
            } catch (e) {
                console.warn('[Avatar] 图片读取失败:', e);
            }
            input.value = '';
        });
    }

    // ════════════════════════════════
    //  格言（★ 持久化修复）
    // ════════════════════════════════

    function initBannerMotto() {
        const el = document.getElementById('bannerMotto');
        if (!el) return;

        // ★ 从 storage 恢复文字
        const saved = Storage.getWidgetText('bannerMotto', '幸好爱是小小的奇迹');
        el.textContent = saved;

        el.addEventListener('click', () => {
            openEditModal('编辑格言', el.textContent, (val) => {
                const text = val || el.textContent;
                el.textContent = text;
                // ★ 立即持久化
                Storage.setWidgetText('bannerMotto', text);
            });
        });
    }

    // ════════════════════════════════
    //  Baby / Contact（★ 持久化修复）
    // ════════════════════════════════

    function initBannerInfo() {
        const fields = [
            { id: 'infoBaby', label: '编辑 Baby', defaultVal: 'call Aero', editBtnSelector: '[data-target="infoBaby"]' },
            { id: 'infoContact', label: '编辑 Contact', defaultVal: "http//>Aero's love.com", editBtnSelector: null }
        ];

        fields.forEach(({ id, label, defaultVal, editBtnSelector }) => {
            const el = document.getElementById(id);
            if (!el) return;

            // ★ 恢复持久化文字
            el.textContent = Storage.getWidgetText(id, defaultVal);

            const doEdit = () => {
                openEditModal(label, el.textContent, (val) => {
                    const text = val || el.textContent;
                    el.textContent = text;
                    Storage.setWidgetText(id, text);
                });
            };

            el.addEventListener('click', doEdit);
            if (editBtnSelector) {
                document.querySelector(editBtnSelector)?.addEventListener('click', doEdit);
            }
        });
    }

    // ════════════════════════════════
    //  拍立得（★ 持久化修复）
    // ════════════════════════════════

    function initPolaroid() {
        const card = document.getElementById('widgetPolaroid');

        // ★ 恢复图片
        const savedImg = Storage.getWidgetImage('polaroid');
        applyImage('polaroidImg', 'polaroidPlaceholder', savedImg);

        // ★ 恢复文字
        const textEl = document.getElementById('polaroidText');
        if (textEl) {
            textEl.textContent = Storage.getWidgetText('polaroidText', 'First Choice');
        }

        // 绑定换图
        bindImageUpload(card, 'polaroidFileInput', (base64) => {
            Storage.setWidgetImage('polaroid', base64);
            applyImage('polaroidImg', 'polaroidPlaceholder', base64);
        });

        // 绑定文字编辑
        textEl?.addEventListener('click', (e) => {
            e.stopPropagation();
            openEditModal('编辑说明文字', textEl.textContent, (val) => {
                const text = val || textEl.textContent;
                textEl.textContent = text;
                Storage.setWidgetText('polaroidText', text);
            });
        });
    }

    // ════════════════════════════════
    //  右侧图片框（★ 持久化修复）
    // ════════════════════════════════

    function initPhotoBox() {
        const card = document.getElementById('widgetPhotoBox');

        // ★ 恢复图片
        const savedImg = Storage.getWidgetImage('photoBox');
        applyImage('photoBoxImg', 'photoBoxPlaceholder', savedImg);

        // 绑定换图
        bindImageUpload(card, 'photoBoxFileInput', (base64) => {
            Storage.setWidgetImage('photoBox', base64);
            applyImage('photoBoxImg', 'photoBoxPlaceholder', base64);
        });
    }

    // ════════════════════════════════
    //  入口
    // ════════════════════════════════
    function init() {
        bindModalActions();
        initBannerAvatar();
        initBannerMotto();
        initBannerInfo();
        initPolaroid();
        initPhotoBox();
    }

    return { init };
})();
