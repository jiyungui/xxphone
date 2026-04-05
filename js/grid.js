/**
 * grid.js
 * 网格计算引擎
 * 参考 GIGI HomeScreen 思路，纯计算，不依赖任何 DOM 操作
 */

const Grid = (() => {

    // ── 默认网格参数（手机端） ──
    const DEFAULTS = {
        columns: 3,       // APP区3列
        iconSize: 62,
        gap: 14,
        padding: 16,
    };

    /**
     * 根据容器宽度计算真实单元格尺寸
     * @param {number} containerWidth  - 内容容器宽度（px）
     * @param {object} opts            - 覆盖默认参数
     * @returns {{ cellSize, gridContentWidth, leftOffset, columns }}
     */
    function calcGrid(containerWidth, opts = {}) {
        const { columns, iconSize, gap, padding } = { ...DEFAULTS, ...opts };
        const contentWidth = containerWidth - padding * 2;
        const maxCellWidth = (contentWidth - (columns - 1) * gap) / columns;
        const cellSize = Math.min(iconSize, Math.max(44, maxCellWidth));
        const gridContentWidth = cellSize * columns + gap * (columns - 1);
        const leftOffset = (contentWidth - gridContentWidth) / 2;
        return { cellSize, gridContentWidth, leftOffset, columns, gap, padding };
    }

    /**
     * 根据 index 计算图标在网格中的位置
     * @param {number} index     - 图标在数组中的顺序（0-based）
     * @param {object} gridInfo  - calcGrid 的返回值
     * @returns {{ col, row }}
     */
    function indexToCell(index, gridInfo) {
        const col = index % gridInfo.columns;
        const row = Math.floor(index / gridInfo.columns);
        return { col, row };
    }

    return { calcGrid, indexToCell, DEFAULTS };
})();
