/**
 * api-settings.js — SPA 内嵌版
 * 改动：
 *   ★ 去掉音色 select（下拉选择音色）
 *   ★ 新增 Voice 板块（语速/音量/音调 保留，增加输入文字试听）
 *   ★ 设置/API页面背景已由 CSS 改为淡蓝纯色
 */

const ApiSettings = (() => {
    'use strict';

    // ════════════════════════════════════════════════
    //  Storage key 常量
    // ════════════════════════════════════════════════
    const SK = {
        MODEL_LIST: 'api_model_list',
        ACTIVE_MODEL: 'api_active_model',
        MINIMAX_CONFIG: 'api_minimax_config',
    };

    // ════════════════════════════════════════════════
    //  工具函数
    // ════════════════════════════════════════════════
    function lsGet(key, def = null) {
        try {
            const raw = localStorage.getItem(key);
            return raw !== null ? JSON.parse(raw) : def;
        } catch { return def; }
    }

    function lsSet(key, val) {
        try { localStorage.setItem(key, JSON.stringify(val)); }
        catch (e) { console.warn('[ApiSettings] storage error:', e); }
    }

    function uid() {
        return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    }

    function toast(msg, duration = 2400) {
        const el = document.getElementById('apiToast');
        if (!el) return;
        el.textContent = msg;
        el.classList.add('show');
        clearTimeout(el._timer);
        el._timer = setTimeout(() => el.classList.remove('show'), duration);
    }

    function setStatus(id, text, type = '') {
        const el = document.getElementById(id);
        if (!el) return;
        el.textContent = text;
        el.className = 'api-status' + (type ? ' ' + type : '');
    }

    function updateSliderBg(slider) {
        if (!slider) return;
        const min = parseFloat(slider.min);
        const max = parseFloat(slider.max);
        const val = parseFloat(slider.value);
        const pct = (((val - min) / (max - min)) * 100).toFixed(1) + '%';
        slider.style.setProperty('--pct', pct);
    }

    function normalizeUrl(url) {
        return (url || '').trim().replace(/\/+$/, '');
    }

    function truncate(str, len = 36) {
        if (!str) return '';
        return str.length > len ? str.slice(0, len) + '…' : str;
    }

    function escapeHtml(str) {
        return String(str || '')
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    const q = (id) => document.getElementById(id);

    // ════════════════════════════════════════════════
    //  HTML 模板
    // ════════════════════════════════════════════════
    function buildHTML() {
        return `
      <div class="inner-header">
        <button class="inner-header-back" id="apiSettingsBack">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
        <span class="inner-header-title">API 设置</span>
        <div class="inner-header-placeholder"></div>
      </div>

      <div class="inner-main api-main">

        <!-- ══ 板块一：模型配置 ══ -->
        <p class="settings-subtitle">模型配置</p>
        <div class="api-group">

          <div class="api-card">
            <div class="api-card-label">API 名称</div>
            <div class="api-card-body">
              <input class="api-input" id="inputApiName" type="text"
                     placeholder="例：GPT-4o / Claude" autocomplete="off"/>
            </div>
          </div>

          <div class="api-card">
            <div class="api-card-label">API URL</div>
            <div class="api-card-body">
              <input class="api-input" id="inputApiUrl" type="url"
                     placeholder="https://api.openai.com/v1" autocomplete="off"/>
            </div>
          </div>

          <div class="api-card">
            <div class="api-card-label">API Key</div>
            <div class="api-card-body api-key-row">
              <input class="api-input api-input-key" id="inputApiKey"
                     type="password" placeholder="sk-..." autocomplete="new-password"/>
              <button class="api-key-toggle" id="btnToggleKey">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
            </div>
          </div>

        </div>

        <!-- ══ 板块二：模型管理 ══ -->
        <p class="settings-subtitle">模型管理</p>
        <div class="api-group">

          <div class="api-card api-card-action">
            <div class="api-card-label">拉取模型</div>
            <div class="api-card-body">
              <button class="api-btn api-btn-outline" id="btnFetchModels">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                <span>从接口拉取</span>
              </button>
              <span class="api-status" id="statusFetch"></span>
            </div>
          </div>

          <div class="api-card">
            <div class="api-card-label">选取模型</div>
            <div class="api-card-body">
              <div class="api-select-wrap">
                <select class="api-select" id="selectModel">
                  <option value="" disabled selected>请先拉取模型</option>
                </select>
                <svg class="select-arrow" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="1.8">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </div>
            </div>
          </div>

          <div class="api-card api-card-action">
            <div class="api-card-label">测试模型</div>
            <div class="api-card-body">
              <button class="api-btn api-btn-outline" id="btnTestModel">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="10 8 16 12 10 16 10 8"/>
                </svg>
                <span>发送测试请求</span>
              </button>
              <span class="api-status" id="statusTest"></span>
            </div>
          </div>

          <div class="api-test-result" id="testResult" style="display:none">
            <div class="test-result-inner" id="testResultText"></div>
          </div>

          <div class="api-card api-card-action">
            <div class="api-card-label">保存模型</div>
            <div class="api-card-body">
              <button class="api-btn api-btn-solid" id="btnSaveModel">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                  <polyline points="17 21 17 13 7 13 7 21"/>
                  <polyline points="7 3 7 8 15 8"/>
                </svg>
                <span>保存当前配置</span>
              </button>
              <span class="api-status" id="statusSave"></span>
            </div>
          </div>

        </div>

        <!-- ══ 板块三：模型列表 ══ -->
        <p class="settings-subtitle">模型列表</p>
        <div class="api-group" id="modelListGroup">
          <div class="api-empty-hint" id="modelListEmpty">
            暂无保存的模型，配置后点击保存即可
          </div>
        </div>

        <!-- ══ 板块四：MiniMax 语音配置 ══ -->
        <p class="settings-subtitle">MiniMax 语音配置</p>
        <div class="api-group">

          <div class="api-card">
            <div class="api-card-label">Group ID</div>
            <div class="api-card-body">
              <input class="api-input" id="inputMiniMaxGroupId" type="text"
                     placeholder="MiniMax Group ID" autocomplete="off"/>
            </div>
          </div>

          <div class="api-card">
            <div class="api-card-label">API Key</div>
            <div class="api-card-body api-key-row">
              <input class="api-input api-input-key" id="inputMiniMaxKey"
                     type="password" placeholder="MiniMax API Key" autocomplete="new-password"/>
              <button class="api-key-toggle" id="btnToggleMiniMaxKey">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
            </div>
          </div>

          <div class="api-card">
            <div class="api-card-label">语速</div>
            <div class="api-card-body api-slider-row">
              <input class="api-slider" id="sliderSpeed" type="range"
                     min="0.5" max="2.0" step="0.1" value="1.0"/>
              <span class="slider-value" id="labelSpeed">1.0</span>
            </div>
          </div>

          <div class="api-card">
            <div class="api-card-label">音量</div>
            <div class="api-card-body api-slider-row">
              <input class="api-slider" id="sliderVolume" type="range"
                     min="1" max="10" step="1" value="5"/>
              <span class="slider-value" id="labelVolume">5</span>
            </div>
          </div>

          <div class="api-card">
            <div class="api-card-label">音调</div>
            <div class="api-card-body api-slider-row">
              <input class="api-slider" id="sliderPitch" type="range"
                     min="-12" max="12" step="1" value="0"/>
              <span class="slider-value" id="labelPitch">0</span>
            </div>
          </div>

          <div class="api-card api-card-action">
            <div class="api-card-label">保存配置</div>
            <div class="api-card-body">
              <button class="api-btn api-btn-solid" id="btnSaveMiniMax">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                  <polyline points="17 21 17 13 7 13 7 21"/>
                  <polyline points="7 3 7 8 15 8"/>
                </svg>
                <span>保存语音配置</span>
              </button>
              <span class="api-status" id="statusMiniMax"></span>
            </div>
          </div>

        </div>

        <!-- ══ 板块五：Voice 试听 ══ -->
        <p class="settings-subtitle">Voice 试听</p>
        <div class="api-group">

          <!-- 音色 ID 输入（手动填写，不再用下拉选择） -->
          <div class="api-card">
            <div class="api-card-label">音色 Voice ID</div>
            <div class="api-card-body">
              <input class="api-input" id="inputVoiceId" type="text"
                     placeholder="例：female-tianmei / presenter_male" autocomplete="off"/>
            </div>
          </div>

          <!-- 输入试听文字 + 播放按钮 -->
          <div class="api-card">
            <div class="api-card-label">输入文字试听</div>
            <div class="api-card-body" style="flex-direction:column; align-items:stretch; gap:10px;">
              <textarea class="voice-preview-textarea" id="voicePreviewText"
                        placeholder="输入想要试听的文字内容..." rows="2"></textarea>
              <div class="voice-preview-actions">
                <button class="api-btn api-btn-outline" id="btnVoicePreview">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                       stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                  <span id="btnVoicePreviewLabel">播放试听</span>
                </button>
                <!-- 播放中波形动画 -->
                <div class="voice-wave" id="voiceWave">
                  <span></span><span></span><span></span><span></span><span></span>
                </div>
                <!-- 停止按钮（播放中才显示） -->
                <button class="api-btn api-btn-outline" id="btnVoiceStop"
                        style="display:none; padding:9px 14px;">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                       stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="6" y="6" width="12" height="12" rx="1"/>
                  </svg>
                </button>
                <span class="voice-preview-status" id="voicePreviewStatus"></span>
              </div>
            </div>
          </div>

        </div><!-- /voice group -->

      </div><!-- /inner-main -->
    `;
    }

    // ════════════════════════════════════════════════
    //  Key 显示/隐藏
    // ════════════════════════════════════════════════
    function bindKeyToggle(btnEl, inputEl) {
        if (!btnEl || !inputEl) return;
        btnEl.addEventListener('click', () => {
            const show = inputEl.type === 'password';
            inputEl.type = show ? 'text' : 'password';
            const svg = btnEl.querySelector('svg');
            if (!svg) return;
            svg.innerHTML = show
                ? `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
           <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
           <line x1="1" y1="1" x2="23" y2="23"/>
           <circle cx="12" cy="12" r="3" stroke-dasharray="4 2"/>`
                : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
           <circle cx="12" cy="12" r="3"/>`;
        });
    }

    // ════════════════════════════════════════════════
    //  拉取模型
    // ════════════════════════════════════════════════
    async function fetchModels() {
        const url = normalizeUrl(q('inputApiUrl')?.value);
        const key = (q('inputApiKey')?.value || '').trim();
        if (!url) { toast('请先填写 API URL'); return; }
        if (!key) { toast('请先填写 API Key'); return; }

        setStatus('statusFetch', '拉取中...', 'loading');
        const btn = q('btnFetchModels');
        if (btn) btn.disabled = true;

        try {
            const res = await fetch(`${url}/models`, {
                headers: {
                    'Authorization': `Bearer ${key}`,
                    'Content-Type': 'application/json',
                },
                signal: AbortSignal.timeout(12000),
            });
            if (!res.ok) {
                const t = await res.text().catch(() => '');
                throw new Error(`HTTP ${res.status}${t ? ': ' + t.slice(0, 80) : ''}`);
            }
            const data = await res.json();

            let models = [];
            if (Array.isArray(data)) {
                models = data.map(m => typeof m === 'string' ? m : m.id).filter(Boolean);
            } else if (data.data && Array.isArray(data.data)) {
                models = data.data.map(m => m.id || m).filter(Boolean);
            } else if (data.models && Array.isArray(data.models)) {
                models = data.models.map(m => m.id || m.name || m).filter(Boolean);
            }

            if (!models.length) {
                setStatus('statusFetch', '未获取到模型', 'error');
                toast('接口返回内容中未找到模型列表');
                return;
            }

            const sel = q('selectModel');
            if (sel) {
                sel.innerHTML = '';
                models.forEach(id => {
                    const opt = document.createElement('option');
                    opt.value = id; opt.textContent = id;
                    sel.appendChild(opt);
                });
            }
            setStatus('statusFetch', `已获取 ${models.length} 个`, 'success');
            toast(`成功拉取 ${models.length} 个模型`);

        } catch (e) {
            setStatus('statusFetch', '拉取失败', 'error');
            toast('拉取失败：' + (e.message || '网络错误'));
        } finally {
            if (btn) btn.disabled = false;
        }
    }

    // ════════════════════════════════════════════════
    //  测试模型
    // ════════════════════════════════════════════════
    async function testModel() {
        const url = normalizeUrl(q('inputApiUrl')?.value);
        const key = (q('inputApiKey')?.value || '').trim();
        const model = q('selectModel')?.value;
        if (!url) { toast('请填写 API URL'); return; }
        if (!key) { toast('请填写 API Key'); return; }
        if (!model) { toast('请先选取一个模型'); return; }

        setStatus('statusTest', '测试中...', 'loading');
        const btn = q('btnTestModel');
        if (btn) btn.disabled = true;
        const resBox = q('testResult');
        const resTxt = q('testResultText');
        if (resBox) resBox.style.display = 'none';
        if (resTxt) resTxt.textContent = '';

        try {
            const res = await fetch(`${url}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${key}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model,
                    messages: [{ role: 'user', content: 'Hello! Please reply with one short sentence.' }],
                    max_tokens: 60,
                    stream: false,
                }),
                signal: AbortSignal.timeout(20000),
            });
            if (!res.ok) {
                const t = await res.text().catch(() => '');
                throw new Error(`HTTP ${res.status}${t ? ': ' + t.slice(0, 120) : ''}`);
            }
            const data = await res.json();
            const reply =
                data?.choices?.[0]?.message?.content ||
                data?.choices?.[0]?.text ||
                data?.content ||
                JSON.stringify(data).slice(0, 200);

            setStatus('statusTest', '测试通过', 'success');
            if (resBox) resBox.style.display = 'block';
            if (resTxt) resTxt.textContent = reply;
            toast('模型测试通过');

        } catch (e) {
            setStatus('statusTest', '测试失败', 'error');
            if (resBox) resBox.style.display = 'block';
            if (resTxt) resTxt.textContent = '错误：' + (e.message || '请求失败');
            toast('测试失败：' + (e.message || '网络错误'));
        } finally {
            if (btn) btn.disabled = false;
        }
    }

    // ════════════════════════════════════════════════
    //  保存模型
    // ════════════════════════════════════════════════
    function saveModel() {
        const name = (q('inputApiName')?.value || '').trim();
        const url = normalizeUrl(q('inputApiUrl')?.value);
        const key = (q('inputApiKey')?.value || '').trim();
        const model = q('selectModel')?.value || '';

        if (!name) { toast('请填写 API 名称'); return; }
        if (!url) { toast('请填写 API URL'); return; }
        if (!key) { toast('请填写 API Key'); return; }
        if (!model) { toast('请先拉取并选取模型'); return; }

        const list = lsGet(SK.MODEL_LIST, []);
        const existIdx = list.findIndex(m => m.name === name && m.url === url);
        const entry = {
            id: existIdx >= 0 ? list[existIdx].id : uid(),
            name, url, key, model,
            savedAt: new Date().toISOString(),
        };

        if (existIdx >= 0) list[existIdx] = entry;
        else list.push(entry);

        lsSet(SK.MODEL_LIST, list);
        lsSet(SK.ACTIVE_MODEL, entry.id);

        setStatus('statusSave', '已保存', 'success');
        toast(`「${name}」已保存并设为当前模型`);
        renderModelList();
        setTimeout(() => setStatus('statusSave', '', ''), 2500);
    }

    // ════════════════════════════════════════════════
    //  渲染模型列表
    // ════════════════════════════════════════════════
    function renderModelList() {
        const group = q('modelListGroup');
        const empty = q('modelListEmpty');
        if (!group) return;

        const list = lsGet(SK.MODEL_LIST, []);
        const activeId = lsGet(SK.ACTIVE_MODEL, null);

        Array.from(group.children).forEach(c => {
            if (c.id !== 'modelListEmpty') c.remove();
        });

        if (!list.length) {
            if (empty) empty.style.display = 'block';
            return;
        }
        if (empty) empty.style.display = 'none';

        list.forEach(entry => {
            const isActive = entry.id === activeId;
            const item = document.createElement('div');
            item.className = 'model-list-item' + (isActive ? ' active' : '');
            item.dataset.id = entry.id;
            item.innerHTML = `
        <div class="model-item-dot"></div>
        <div class="model-item-info">
          <div class="model-item-name">${escapeHtml(entry.name)}</div>
          <div class="model-item-url">${escapeHtml(truncate(entry.url))} · ${escapeHtml(entry.model)}</div>
        </div>
        <div class="model-item-actions">
          <button class="model-item-btn btn-use ${isActive ? 'active-btn' : ''}"
                  data-action="use">${isActive ? '使用中' : '切换'}</button>
          <button class="model-item-btn btn-delete" data-action="delete">删除</button>
        </div>
      `;
            item.querySelector('[data-action="use"]').addEventListener('click', e => {
                e.stopPropagation(); activateModel(entry.id);
            });
            item.querySelector('[data-action="delete"]').addEventListener('click', e => {
                e.stopPropagation(); deleteModel(entry.id);
            });
            item.addEventListener('click', () => activateModel(entry.id));
            group.appendChild(item);
        });
    }

    function activateModel(id) {
        const list = lsGet(SK.MODEL_LIST, []);
        const entry = list.find(m => m.id === id);
        if (!entry) return;

        lsSet(SK.ACTIVE_MODEL, id);
        if (q('inputApiName')) q('inputApiName').value = entry.name || '';
        if (q('inputApiUrl')) q('inputApiUrl').value = entry.url || '';
        if (q('inputApiKey')) q('inputApiKey').value = entry.key || '';

        const sel = q('selectModel');
        if (sel) {
            let opt = Array.from(sel.options).find(o => o.value === entry.model);
            if (!opt) {
                opt = document.createElement('option');
                opt.value = entry.model; opt.textContent = entry.model;
                sel.appendChild(opt);
            }
            sel.value = entry.model;
        }
        renderModelList();
        toast(`已切换至「${entry.name}」`);
    }

    function deleteModel(id) {
        let list = lsGet(SK.MODEL_LIST, []);
        const entry = list.find(m => m.id === id);
        if (!entry) return;

        list = list.filter(m => m.id !== id);
        lsSet(SK.MODEL_LIST, list);

        const activeId = lsGet(SK.ACTIVE_MODEL, null);
        if (activeId === id) {
            lsSet(SK.ACTIVE_MODEL, list.length > 0 ? list[0].id : null);
        }
        renderModelList();
        toast(`「${entry.name}」已删除`);
    }

    // ════════════════════════════════════════════════
    //  MiniMax 保存（去掉 voice，其余保留）
    // ════════════════════════════════════════════════
    function saveMiniMax() {
        const groupId = (q('inputMiniMaxGroupId')?.value || '').trim();
        const key = (q('inputMiniMaxKey')?.value || '').trim();
        if (!groupId) { toast('请填写 MiniMax Group ID'); return; }
        if (!key) { toast('请填写 MiniMax API Key'); return; }

        // 读取旧配置中的 voice（若有），保持不丢失
        const old = lsGet(SK.MINIMAX_CONFIG, {});

        lsSet(SK.MINIMAX_CONFIG, {
            groupId,
            key,
            voice: (q('inputVoiceId')?.value || old.voice || 'female-tianmei').trim(),
            speed: parseFloat(q('sliderSpeed')?.value || 1.0),
            volume: parseInt(q('sliderVolume')?.value || 5, 10),
            pitch: parseInt(q('sliderPitch')?.value || 0, 10),
        });
        setStatus('statusMiniMax', '已保存', 'success');
        toast('语音配置已保存');
        setTimeout(() => setStatus('statusMiniMax', '', ''), 2500);
    }

    // ════════════════════════════════════════════════
    //  Voice 试听逻辑
    // ════════════════════════════════════════════════
    let _currentAudio = null; // 当前播放的 Audio 对象

    /** 设置试听状态 UI */
    function setVoicePlayingState(playing) {
        const btn = q('btnVoicePreview');
        const btnLabel = q('btnVoicePreviewLabel');
        const btnStop = q('btnVoiceStop');
        const wave = q('voiceWave');

        if (playing) {
            if (btn) btn.classList.add('api-btn-playing');
            if (btnLabel) btnLabel.textContent = '试听中';
            if (btnStop) btnStop.style.display = 'inline-flex';
            if (wave) wave.classList.add('playing');
        } else {
            if (btn) btn.classList.remove('api-btn-playing');
            if (btnLabel) btnLabel.textContent = '播放试听';
            if (btnStop) btnStop.style.display = 'none';
            if (wave) wave.classList.remove('playing');
        }
    }

    /** 停止当前播放 */
    function stopVoicePreview() {
        if (_currentAudio) {
            _currentAudio.pause();
            _currentAudio.src = '';
            _currentAudio = null;
        }
        setVoicePlayingState(false);
        const statusEl = q('voicePreviewStatus');
        if (statusEl) { statusEl.textContent = ''; statusEl.className = 'voice-preview-status'; }
    }

    /** 设置试听状态文字 */
    function setVoiceStatus(text, type = '') {
        const el = q('voicePreviewStatus');
        if (!el) return;
        el.textContent = text;
        el.className = 'voice-preview-status' + (type ? ' ' + type : '');
    }

    /**
     * 调用 MiniMax TTS 接口
     * 文档：https://platform.minimaxi.com/document/T2A V2
     * POST https://api.minimax.chat/v1/t2a_v2?GroupId=xxx
     */
    async function playVoicePreview() {
        // 若正在播放，先停止
        if (_currentAudio) { stopVoicePreview(); return; }

        const mm = lsGet(SK.MINIMAX_CONFIG, {});
        const groupId = mm.groupId || (q('inputMiniMaxGroupId')?.value || '').trim();
        const key = mm.key || (q('inputMiniMaxKey')?.value || '').trim();
        const voiceId = (q('inputVoiceId')?.value || mm.voice || 'female-tianmei').trim();
        const text = (q('voicePreviewText')?.value || '').trim();

        if (!groupId) { toast('请先填写 MiniMax Group ID'); return; }
        if (!key) { toast('请先填写 MiniMax API Key'); return; }
        if (!voiceId) { toast('请填写音色 Voice ID'); return; }
        if (!text) { toast('请输入试听文字'); return; }

        setVoicePlayingState(true);
        setVoiceStatus('合成中...', '');
        const btn = q('btnVoicePreview');
        if (btn) btn.disabled = true;

        try {
            const body = {
                model: 'speech-01-turbo',
                text,
                stream: false,
                voice_setting: {
                    voice_id: voiceId,
                    speed: mm.speed ?? 1.0,
                    vol: mm.volume ?? 5,
                    pitch: mm.pitch ?? 0,
                },
                audio_setting: {
                    audio_sample_rate: 32000,
                    bitrate: 128000,
                    format: 'mp3',
                    channel: 1,
                },
            };

            const res = await fetch(
                `https://api.minimax.chat/v1/t2a_v2?GroupId=${encodeURIComponent(groupId)}`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${key}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(body),
                    signal: AbortSignal.timeout(25000),
                }
            );

            if (!res.ok) {
                const errText = await res.text().catch(() => '');
                throw new Error(`HTTP ${res.status}${errText ? ': ' + errText.slice(0, 100) : ''}`);
            }

            const data = await res.json();

            // 接口返回格式：{ data: { audio: "hex_encoded_audio" }, ... }
            // 或：{ audio_file: "base64..." }（旧版）
            let audioSrc = '';

            if (data?.data?.audio) {
                // 新版：hex 编码的 MP3 数据
                const hexStr = data.data.audio;
                const bytes = new Uint8Array(hexStr.match(/.{1,2}/g).map(b => parseInt(b, 16)));
                const blob = new Blob([bytes], { type: 'audio/mpeg' });
                audioSrc = URL.createObjectURL(blob);

            } else if (data?.audio_file) {
                // 旧版 base64
                audioSrc = 'data:audio/mp3;base64,' + data.audio_file;

            } else if (data?.data?.audio_file) {
                audioSrc = 'data:audio/mp3;base64,' + data.data.audio_file;

            } else {
                throw new Error('接口返回中未找到音频数据');
            }

            // 播放
            const audio = new Audio(audioSrc);
            _currentAudio = audio;

            audio.onplay = () => { setVoiceStatus('播放中...', ''); };
            audio.onended = () => {
                setVoiceStatus('播放完毕', 'ok');
                setVoicePlayingState(false);
                _currentAudio = null;
                // 释放 ObjectURL
                if (audioSrc.startsWith('blob:')) URL.revokeObjectURL(audioSrc);
            };
            audio.onerror = () => {
                setVoiceStatus('播放失败', 'error');
                setVoicePlayingState(false);
                _currentAudio = null;
            };

            await audio.play();

        } catch (e) {
            console.error('[VoicePreview]', e);
            setVoiceStatus('合成失败：' + (e.message || '网络错误'), 'error');
            setVoicePlayingState(false);
            toast('语音合成失败：' + (e.message || ''));
        } finally {
            const b = q('btnVoicePreview');
            if (b) b.disabled = false;
        }
    }

    // ════════════════════════════════════════════════
    //  Sliders
    // ════════════════════════════════════════════════
    function bindSliders() {
        [
            ['sliderSpeed', 'labelSpeed'],
            ['sliderVolume', 'labelVolume'],
            ['sliderPitch', 'labelPitch'],
        ].forEach(([sid, lid]) => {
            const s = q(sid); const l = q(lid);
            if (!s) return;
            updateSliderBg(s);
            s.addEventListener('input', () => {
                if (l) l.textContent = s.value;
                updateSliderBg(s);
            });
        });
    }

    // ════════════════════════════════════════════════
    //  填充已保存数据
    // ════════════════════════════════════════════════
    function loadSavedData() {
        // 激活模型回填
        const activeId = lsGet(SK.ACTIVE_MODEL, null);
        const list = lsGet(SK.MODEL_LIST, []);
        if (activeId) {
            const active = list.find(m => m.id === activeId);
            if (active) {
                if (q('inputApiName')) q('inputApiName').value = active.name || '';
                if (q('inputApiUrl')) q('inputApiUrl').value = active.url || '';
                if (q('inputApiKey')) q('inputApiKey').value = active.key || '';
                const sel = q('selectModel');
                if (sel && active.model) {
                    sel.innerHTML = '';
                    const opt = document.createElement('option');
                    opt.value = active.model; opt.textContent = active.model; opt.selected = true;
                    sel.appendChild(opt);
                }
            }
        }

        // MiniMax 回填
        const mm = lsGet(SK.MINIMAX_CONFIG, {});
        if (q('inputMiniMaxGroupId')) q('inputMiniMaxGroupId').value = mm.groupId || '';
        if (q('inputMiniMaxKey')) q('inputMiniMaxKey').value = mm.key || '';
        // Voice ID 回填
        if (q('inputVoiceId') && mm.voice) q('inputVoiceId').value = mm.voice;

        // Sliders 回填
        [
            ['sliderSpeed', 'labelSpeed', mm.speed],
            ['sliderVolume', 'labelVolume', mm.volume],
            ['sliderPitch', 'labelPitch', mm.pitch],
        ].forEach(([sid, lid, val]) => {
            if (val == null) return;
            const s = q(sid); const l = q(lid);
            if (s) { s.value = val; updateSliderBg(s); }
            if (l) l.textContent = String(val);
        });

        renderModelList();
    }

    // ════════════════════════════════════════════════
    //  页面初始化（首次进入）
    // ════════════════════════════════════════════════
    function initPage(container) {
        container.innerHTML = buildHTML();

        // 返回按钮
        q('apiSettingsBack')?.addEventListener('click', () => {
            stopVoicePreview(); // 离开页面时停止播放
            Router.pop();
        });

        // Key 切换
        bindKeyToggle(q('btnToggleKey'), q('inputApiKey'));
        bindKeyToggle(q('btnToggleMiniMaxKey'), q('inputMiniMaxKey'));

        // 模型按钮
        q('btnFetchModels')?.addEventListener('click', fetchModels);
        q('btnTestModel')?.addEventListener('click', testModel);
        q('btnSaveModel')?.addEventListener('click', saveModel);

        // MiniMax 保存
        q('btnSaveMiniMax')?.addEventListener('click', saveMiniMax);

        // Voice 试听
        q('btnVoicePreview')?.addEventListener('click', playVoicePreview);
        q('btnVoiceStop')?.addEventListener('click', stopVoicePreview);

        // 回车跳字段
        [q('inputApiName'), q('inputApiUrl'), q('inputApiKey')].forEach((el, i, arr) => {
            el?.addEventListener('keydown', e => {
                if (e.key === 'Enter' && arr[i + 1]) { e.preventDefault(); arr[i + 1].focus(); }
            });
        });

        // Sliders
        bindSliders();

        // 回填已保存数据
        loadSavedData();
    }

    // ════════════════════════════════════════════════
    //  注册到路由
    // ════════════════════════════════════════════════
    function init() {
        Router.onInit('apiSettings', initPage);
        Router.onShow('apiSettings', () => {
            if (q('modelListGroup')) renderModelList();
        });
    }

    return { init };
})();
