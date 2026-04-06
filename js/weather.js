/**
 * weather.js
 * Canvas 粒子天气引擎
 * 支持：无 / 雨 / 暴雨 / 雪 / 雾 / 风沙 / 樱花
 * 全部纯 Canvas 绘制，无 emoji，不影响任何其他 DOM 层
 */

const Weather = (() => {
    'use strict';

    const SK = 'weather_config';
    const DEFAULTS = { type: 'none', intensity: 50 };

    // ── 粒子池 ──
    let _canvas = null;
    let _ctx = null;
    let _raf = null;
    let _particles = [];
    let _cfg = { ...DEFAULTS };
    let _running = false;

    // ── 存储 ──
    function lsGet() {
        try { const r = localStorage.getItem(SK); return r ? { ...DEFAULTS, ...JSON.parse(r) } : { ...DEFAULTS }; }
        catch { return { ...DEFAULTS }; }
    }
    function lsSet(c) { try { localStorage.setItem(SK, JSON.stringify(c)); } catch { } }

    // ── Canvas 尺寸同步 ──
    function resize() {
        if (!_canvas) return;
        const screen = document.getElementById('screen');
        if (screen) {
            _canvas.width = screen.offsetWidth;
            _canvas.height = screen.offsetHeight;
        }
    }

    // ════════════════════════════
    //  粒子工厂
    // ════════════════════════════
    function makeParticle(type) {
        const W = _canvas.width;
        const H = _canvas.height;
        const intensity = _cfg.intensity / 100;

        switch (type) {
            case 'rain':
            case 'heavyrain':
                return {
                    x: Math.random() * W,
                    y: Math.random() * H - H,
                    len: type === 'heavyrain' ? 14 + Math.random() * 10 : 9 + Math.random() * 8,
                    speed: type === 'heavyrain' ? 18 + Math.random() * 12 : 10 + Math.random() * 8,
                    angle: 0.2 + Math.random() * 0.15,  // 倾斜角（弧度）
                    alpha: 0.25 + Math.random() * 0.45,
                    width: type === 'heavyrain' ? 1.2 : 0.8,
                };
            case 'snow':
                return {
                    x: Math.random() * W,
                    y: Math.random() * H - H,
                    r: 1.5 + Math.random() * 3,
                    speedY: 0.8 + Math.random() * 1.4,
                    speedX: (Math.random() - 0.5) * 0.8,
                    drift: Math.random() * Math.PI * 2,
                    driftSpeed: 0.01 + Math.random() * 0.015,
                    alpha: 0.5 + Math.random() * 0.45,
                };
            case 'fog':
                return {
                    x: Math.random() * W,
                    y: Math.random() * H,
                    w: 80 + Math.random() * 120,
                    h: 30 + Math.random() * 50,
                    speedX: (Math.random() - 0.5) * 0.4,
                    alpha: 0.04 + Math.random() * 0.08,
                    phase: Math.random() * Math.PI * 2,
                };
            case 'sand':
                return {
                    x: -10,
                    y: Math.random() * H,
                    speed: 3 + Math.random() * 5,
                    r: 0.8 + Math.random() * 1.5,
                    alpha: 0.3 + Math.random() * 0.5,
                    vy: (Math.random() - 0.5) * 0.6,
                };
            case 'sakura':
                return {
                    x: Math.random() * W,
                    y: Math.random() * H - H,
                    r: 3 + Math.random() * 3,
                    speedY: 0.6 + Math.random() * 1.2,
                    speedX: (Math.random() - 0.5) * 1.2,
                    rot: Math.random() * Math.PI * 2,
                    rotSpeed: (Math.random() - 0.5) * 0.06,
                    alpha: 0.6 + Math.random() * 0.35,
                    drift: Math.random() * Math.PI * 2,
                    driftSpeed: 0.008 + Math.random() * 0.012,
                };
            default:
                return null;
        }
    }

    // ── 批量初始化粒子 ──
    function initParticles() {
        _particles = [];
        if (_cfg.type === 'none') return;

        const W = _canvas.width;
        const H = _canvas.height;
        const intensity = _cfg.intensity / 100;
        const counts = {
            rain: Math.floor(60 * intensity),
            heavyrain: Math.floor(120 * intensity),
            snow: Math.floor(80 * intensity),
            fog: Math.floor(12 * intensity),
            sand: Math.floor(90 * intensity),
            sakura: Math.floor(50 * intensity),
        };
        const n = counts[_cfg.type] || 0;
        for (let i = 0; i < n; i++) {
            const p = makeParticle(_cfg.type);
            if (p) {
                // 初始化时随机散布 Y 轴
                if ('y' in p) p.y = Math.random() * H;
                _particles.push(p);
            }
        }
    }

    // ════════════════════════════
    //  各类型渲染 & 更新
    // ════════════════════════════
    function updateDraw() {
        if (!_ctx || !_canvas) return;
        const W = _canvas.width;
        const H = _canvas.height;
        _ctx.clearRect(0, 0, W, H);

        const type = _cfg.type;

        for (let i = _particles.length - 1; i >= 0; i--) {
            const p = _particles[i];

            if (type === 'rain' || type === 'heavyrain') {
                // ── 更新 ──
                p.x += Math.sin(p.angle) * p.speed * 0.5;
                p.y += p.speed;
                // ── 绘制：斜线雨滴 ──
                _ctx.save();
                _ctx.globalAlpha = p.alpha;
                _ctx.strokeStyle = type === 'heavyrain'
                    ? `rgba(160, 200, 240, 1)`
                    : `rgba(180, 215, 245, 1)`;
                _ctx.lineWidth = p.width;
                _ctx.beginPath();
                _ctx.moveTo(p.x, p.y);
                _ctx.lineTo(p.x + Math.sin(p.angle) * p.len * 0.5, p.y + p.len);
                _ctx.stroke();
                _ctx.restore();
                // 回收
                if (p.y > H + 20) {
                    p.x = Math.random() * W;
                    p.y = -p.len;
                }

            } else if (type === 'snow') {
                // ── 更新 ──
                p.drift += p.driftSpeed;
                p.x += p.speedX + Math.sin(p.drift) * 0.5;
                p.y += p.speedY;
                // ── 绘制：圆形雪花 ──
                _ctx.save();
                _ctx.globalAlpha = p.alpha;
                _ctx.fillStyle = 'rgba(255,255,255,1)';
                _ctx.beginPath();
                _ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                _ctx.fill();
                _ctx.restore();
                if (p.y > H + 10 || p.x < -10 || p.x > W + 10) {
                    p.x = Math.random() * W;
                    p.y = -p.r;
                }

            } else if (type === 'fog') {
                // ── 更新 ──
                p.x += p.speedX;
                p.phase += 0.004;
                const alpha = p.alpha * (0.7 + 0.3 * Math.sin(p.phase));
                // ── 绘制：模糊椭圆雾气 ──
                _ctx.save();
                _ctx.globalAlpha = alpha;
                const grad = _ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.w * 0.5);
                grad.addColorStop(0, 'rgba(220,235,250,0.9)');
                grad.addColorStop(0.6, 'rgba(210,228,248,0.4)');
                grad.addColorStop(1, 'rgba(200,220,245,0)');
                _ctx.fillStyle = grad;
                _ctx.scale(1, p.h / p.w);
                _ctx.beginPath();
                _ctx.arc(p.x, p.y * (p.w / p.h), p.w * 0.5, 0, Math.PI * 2);
                _ctx.fill();
                _ctx.restore();
                if (p.x > W + p.w) p.x = -p.w;
                if (p.x < -p.w) p.x = W + p.w;

            } else if (type === 'sand') {
                // ── 更新 ──
                p.x += p.speed;
                p.y += p.vy;
                // ── 绘制：风沙粒子 ──
                _ctx.save();
                _ctx.globalAlpha = p.alpha;
                _ctx.fillStyle = 'rgba(210,180,120,1)';
                _ctx.beginPath();
                _ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                _ctx.fill();
                _ctx.restore();
                if (p.x > W + 10) {
                    p.x = -10;
                    p.y = Math.random() * H;
                }

            } else if (type === 'sakura') {
                // ── 更新 ──
                p.drift += p.driftSpeed;
                p.x += p.speedX + Math.sin(p.drift) * 0.8;
                p.y += p.speedY;
                p.rot += p.rotSpeed;
                // ── 绘制：花瓣（椭圆旋转） ──
                _ctx.save();
                _ctx.globalAlpha = p.alpha;
                _ctx.translate(p.x, p.y);
                _ctx.rotate(p.rot);
                _ctx.fillStyle = 'rgba(255,182,193,0.9)';
                _ctx.beginPath();
                _ctx.ellipse(0, 0, p.r, p.r * 0.55, 0, 0, Math.PI * 2);
                _ctx.fill();
                // 花瓣纹路
                _ctx.strokeStyle = 'rgba(255,150,170,0.4)';
                _ctx.lineWidth = 0.5;
                _ctx.beginPath();
                _ctx.moveTo(0, -p.r * 0.5);
                _ctx.lineTo(0, p.r * 0.5);
                _ctx.stroke();
                _ctx.restore();
                if (p.y > H + 10 || p.x < -20 || p.x > W + 20) {
                    p.x = Math.random() * W;
                    p.y = -p.r;
                }
            }
        }
    }

    // ════════════════════════════
    //  动画循环
    // ════════════════════════════
    function loop() {
        if (!_running) return;
        updateDraw();
        _raf = requestAnimationFrame(loop);
    }

    function startLoop() {
        if (_running) return;
        _running = true;
        loop();
    }

    function stopLoop() {
        _running = false;
        if (_raf) { cancelAnimationFrame(_raf); _raf = null; }
        if (_ctx && _canvas) _ctx.clearRect(0, 0, _canvas.width, _canvas.height);
    }

    // ════════════════════════════
    //  应用配置
    // ════════════════════════════
    function applyConfig(cfg) {
        _cfg = { ...cfg };
        resize();
        initParticles();
        if (_cfg.type === 'none') {
            stopLoop();
        } else {
            startLoop();
        }
    }

    // ════════════════════════════
    //  公开 API
    // ════════════════════════════
    function init() {
        _canvas = document.getElementById('weatherCanvas');
        if (!_canvas) return;
        _ctx = _canvas.getContext('2d');
        resize();
        window.addEventListener('resize', resize);

        const cfg = lsGet();
        applyConfig(cfg);
    }

    function setConfig(cfg) {
        lsSet(cfg);
        applyConfig(cfg);
    }

    function getConfig() { return { ..._cfg }; }

    return { init, setConfig, getConfig, lsGet };
})();
