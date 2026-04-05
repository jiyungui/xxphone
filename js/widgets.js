/**
 * widgets.js
 * 所有小组件的可编辑逻辑：
 *   - 换图（头像、拍立得、右侧图片框）
 *   - 编辑文字（格言、Baby、拍立得说明文字）
 * 数据持久化依赖 storage.js
 */

const Widgets = (() => {

    // ════════════════════════════════
    //  通用：图片上传工具
    // ════════════════════════════════

    /**
     * 绑定点击→触发文件选择→读取base64→回调
     * @param {string} triggerId   - 触发点击的元素ID
     * @param {string} inputId     - <input type=file> 的ID
     * @param {Function} onImage   - callback(base64String)
     */
    function bindImageUpload(triggerId, inputId, onImage) {
        const trigger = document.getElementById(triggerId);
        const input = document.getElementById(inputId);
        if (!trigger || !input) return;

        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            input.click();
        });

        input.addEventListener('change', () => {
            const file = input.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                onImage(e.target.result);
                input.value = ''; // 允许重复选同一文件
            };
            reader.readAsDataURL(file);
        });
    }

    /** 设置图片元素：有图显示img，无图显示placeholder */
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

    // ════════════════════════════════
    //  通用：弹窗编辑工具
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
        input.focus();
        input.select();
        _editCallback = onConfirm;
    }

    function closeEditModal() {
        const modal = document.getElementById('editModal');
        if (modal) modal.classList.remove('visible');
        _editCallback = null;
    }

    function bindModalActions() {
        document.getElementById('editModalConfirm')?.addEventListener('click', () => {
            const val = document.getElementById('editModalInput')?.value.trim() || '';
            if (_editCallback) _editCallback(val);
            closeEditModal();
        });
        document.getElementById('editModalCancel')?.addEventListener('click', closeEditModal);

        // 点击遮罩关闭
        document.getElementById('editModal')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) closeEditModal();
        });

        // 回车确认
        document.getElementById('editModalInput')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('editModalConfirm')?.click();
            }
            if (e.key === 'Escape') closeEditModal();
        });
    }

    // ════════════════════════════════
    //  头像小组件
    // ════════════════════════════════

    function initBannerAvatar() {
        // 读取持久化图片
        const saved = Storage.getWidgetImage('bannerAvatar');
        applyImage('bannerAvatar', 'bannerAvatarPlaceholder', saved);

        // 点击头像触发上传（复用wrap作为trigger）
        const wrap = document.querySelector('.banner-avatar-wrap');
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.className = 'hidden-input';
        input.id = 'bannerAvatarInput';
        wrap?.appendChild(input);

        wrap?.addEventListener('click', () => input.click());
        input.addEventListener('change', () => {
            const file = input.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                const base64 = e.target.result;
                applyImage('bannerAvatar', 'bannerAvatarPlaceholder', base64);
                Storage.setWidgetImage('bannerAvatar', base64);
                input.value = '';
            };
            reader.readAsDataURL(file);
        });
    }

    // ════════════════════════════════
    //  格言编辑
    // ════════════════════════════════

    function initBannerMotto() {
        const el = document.getElementById('bannerMotto');
        if (!el) return;

        // 读取持久化
        const saved = Storage.getWidgetText('bannerMotto', '幸好爱是小小的奇迹');
        el.textContent = saved;

        el.addEventListener('click', () => {
            openEditModal('编辑格言', el.textContent, (val) => {
                if (val) {
                    el.textContent = val;
                    Storage.setWidgetText('bannerMotto', val);
                }
            });
        });
    }

    // ════════════════════════════════
    //  Baby / Contact 编辑
    // ════════════════════════════════

    function initBannerInfo() {
        // Baby
        const babyEl = document.getElementById('infoBaby');
        if (babyEl) {
            babyEl.textContent = Storage.getWidgetText('infoBaby', 'call Aero');
            document.querySelector('[data-target="infoBaby"]')?.addEventListener('click', () => {
                openEditModal('编辑 Baby', babyEl.textContent, (val) => {
                    babyEl.textContent = val || babyEl.textContent;
                    Storage.setWidgetText('infoBaby', babyEl.textContent);
                });
            });
            babyEl.addEventListener('click', () => {
                openEditModal('编辑 Baby', babyEl.textContent, (val) => {
                    babyEl.textContent = val || babyEl.textContent;
                    Storage.setWidgetText('infoBaby', babyEl.textContent);
                });
            });
        }

        // Contact
        const contactEl = document.getElementById('infoContact');
        if (contactEl) {
            contactEl.textContent = Storage.getWidgetText('infoContact', "http//>Aero's love.com");
            contactEl.addEventListener('click', () => {
                openEditModal('编辑 Contact', contactEl.textContent, (val) => {
                    contactEl.textContent = val || contactEl.textContent;
                    Storage.setWidgetText('infoContact', contactEl.textContent);
                });
            });
        }
    }

    // ════════════════════════════════
    //  拍立得小组件
    // ════════════════════════════════

    function initPolaroid() {
        // 图片
        const savedImg = Storage.getWidgetImage('polaroid');
        applyImage('polaroidImg', 'polaroidPlaceholder', savedImg);

        bindImageUpload('widgetPolaroid', 'polaroidFileInput', (base64) => {
            applyImage('polaroidImg', 'polaroidPlaceholder', base64);
            Storage.setWidgetImage('polaroid', base64);
        });

        // 文字
        const textEl = document.getElementById('polaroidText');
        if (textEl) {
            textEl.textContent = Storage.getWidgetText('polaroidText', 'First Choice');
            textEl.addEventListener('click', (e) => {
                e.stopPropagation(); // 防止冒泡触发图片上传
                openEditModal('编辑说明文字', textEl.textContent, (val) => {
                    textEl.textContent = val || textEl.textContent;
                    Storage.setWidgetText('polaroidText', textEl.textContent);
                });
            });
        }
    }

    // ════════════════════════════════
    //  右侧图片框
    // ════════════════════════════════

    function initPhotoBox() {
        const savedImg = Storage.getWidgetImage('photoBox');
        applyImage('photoBoxImg', 'photoBoxPlaceholder', savedImg);

        bindImageUpload('widgetPhotoBox', 'photoBoxFileInput', (base64) => {
            applyImage('photoBoxImg', 'photoBoxPlaceholder', base64);
            Storage.setWidgetImage('photoBox', base64);
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
