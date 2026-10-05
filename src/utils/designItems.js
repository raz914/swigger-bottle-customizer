// All transforms are fractions of the printable area, independent of viewport size.
export const BOTTLE_FRAME = { width: 433, height: 650 };
// Updated 1L product photos use a wider, differently centered bottle body.
// Add colors here as their new photos replace the legacy assets.
const UPDATED_1L_ASSET_COLORS = new Set([
    'midnight-black', 'pure-white', 'white-frost', 'light-grey', 'sky-blue',
    'deep-navy', 'candy-pink', 'lavender-purple', 'forest-green', 'sage-green',
]);
export function getPrintArea(size, side, color) {
    if (size === '946ml' && UPDATED_1L_ASSET_COLORS.has(color)) return side === 'BACK'
        ? { x: .305, y: .420, width: .33, height: .355 }
        : { x: .343, y: .50, width: .33, height: .17 };
    if (size === '710ml') return side === 'BACK'
        ? { x: .379, y: .38, width: .28, height: .39 }
        : { x: .345, y: .485, width: .28, height: .18 };
    if (side === 'BACK') return size === '536ml'
        ? { x: .359, y: .395, width: .31, height: .38 }
        : { x: .365, y: .405, width: .34, height: .285 };
    return size === '536ml'
        ? { x: .335, y: .485, width: .30, height: .185 }
        : { x: .31, y: .50, width: .31, height: .17 };
}
export function areaAspect(size, side, color) {
    const a = getPrintArea(size, side, color);
    return a.width * BOTTLE_FRAME.width / (a.height * BOTTLE_FRAME.height);
}
export function itemHeight(item, aspect) {
    return item.width * aspect / (item.aspect || 1);
}
export function constrainItem(item, aspect) {
    const angle = (item.rotation || 0) * Math.PI / 180;
    const cos = Math.abs(Math.cos(angle)), sin = Math.abs(Math.sin(angle));
    let width = Math.max(.025, Math.min(1, item.width));
    const h = width * aspect / (item.aspect || 1);
    const extentX = width * cos + h / aspect * sin;
    const extentY = width * aspect * sin + h * cos;
    width *= Math.min(1, 1 / extentX, 1 / extentY);
    const height = width * aspect / (item.aspect || 1);
    const halfX = (width * cos + height / aspect * sin) / 2;
    const halfY = (width * aspect * sin + height * cos) / 2;
    return { ...item, width,
        x: Math.max(halfX, Math.min(1 - halfX, item.x)),
        y: Math.max(halfY, Math.min(1 - halfY, item.y)) };
}
export function snapItemToCenter(item, rect, thresholdPx = 8) {
    const vertical = Math.abs(item.x - .5) * rect.width <= thresholdPx;
    const horizontal = Math.abs(item.y - .5) * rect.height <= thresholdPx;
    return {
        item: { ...item, x: vertical ? .5 : item.x, y: horizontal ? .5 : item.y },
        guides: { vertical, horizontal },
    };
}
export function itemLabel(item) {
    return item.type === 'text' ? item.text : item.type === 'monogram' ? item.monogram : item.graphic?.name || 'Design';
}
export function summarizeSide(side) {
    const items = side.items || [];
    return { ...side,
        text: items.filter(i => i.type === 'text').map(i => i.text).join(' / '),
        monogram: items.filter(i => i.type === 'monogram').map(i => i.monogram).join(' / '),
        graphic: items.some(i => i.graphic) ? {
            name: items.filter(i => i.graphic).map(i => i.graphic.name).join(' / '),
            isUpload: items.some(i => i.graphic?.isUpload),
        } : null };
}
// Artwork is already included in the composite SVG/PNG; retain editable metadata
// without repeating large upload data URLs in order metadata.
export function serializeItems(items) {
    return items.map(({ id, type, text, monogram, font, monogramStyle, isVertical, x, y, width, aspect, rotation, graphic }) => ({
        id, type, text, monogram, font, monogramStyle, isVertical, x, y, width, aspect, rotation,
        name: itemLabel({ type, text, monogram, graphic }),
        graphic: graphic ? { name: graphic.name, isUpload: !!graphic.isUpload,
            src: graphic.src?.startsWith('gallery/') ? graphic.src : '' } : undefined,
    }));
}
