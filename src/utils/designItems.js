// All transforms are fractions of the printable area, independent of viewport size.
export const BOTTLE_FRAME = { width: 433, height: 650 };
export function getPrintArea(size, side) {
    if (side === 'BACK') return {
        x: size === '536ml' ? .34 : .35,
        y: .405,
        width: .34,
        height: .285,
    };
    return size === '536ml'
        ? { x: .31, y: .485, width: .35, height: .185 }
        : { x: .31, y: .50, width: .31, height: .17 };
}
export function areaAspect(size, side) {
    const a = getPrintArea(size, side);
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
