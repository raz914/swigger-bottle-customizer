import { generateProductionSvg } from './svgExport';
import { BOTTLE_FRAME, getPrintArea, areaAspect, constrainItem, itemHeight } from './designItems';

const cache = new Map();
export const artworkKey = item => JSON.stringify([item.type, item.text, item.monogram, item.font, item.monogramStyle, item.isVertical, item.graphic?.src, item.graphic?.maskSrc]);
const uri = xml => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);

// Only inert SVG geometry is attached for measurement. No scripts, event handlers,
// external resources, foreignObject, or style rules from uploaded files.
function sanitizeGeometry(root) {
    const tags = new Set(['svg', 'g', 'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'defs', 'clippath', 'mask', 'lineargradient', 'radialgradient', 'stop', 'use']);
    const attrs = new Set(['d', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'width', 'height', 'viewbox', 'preserveaspectratio', 'points', 'transform', 'fill', 'fill-rule', 'fill-opacity', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'stroke-opacity', 'opacity', 'clip-path', 'clip-rule', 'mask', 'id', 'href', 'offset', 'stop-color', 'stop-opacity', 'gradientunits', 'gradienttransform', 'xmlns']);
    for (const el of [root, ...root.querySelectorAll('*')]) {
        if (!tags.has(el.localName.toLowerCase())) { el.remove(); continue; }
        // Preserve inline presentation properties, without retaining arbitrary CSS.
        for (const prop of ['fill', 'stroke', 'stroke-width', 'fill-rule', 'opacity']) {
            if (el.style?.getPropertyValue(prop)) el.setAttribute(prop, el.style.getPropertyValue(prop));
        }
        for (const attr of [...el.attributes]) {
            const name = attr.name.toLowerCase(), value = attr.value;
            if (!attrs.has(name) || (name === 'href' && !value.startsWith('#')) || (/url\s*\(/i.test(value) && !/^url\(\s*['"]?#[\w.-]+['"]?\s*\)$/i.test(value))) el.removeAttribute(attr.name);
        }
    }
    return root;
}
export function getItemArtwork(item, fonts) {
    const key = artworkKey(item);
    if (cache.has(key)) return cache.get(key);
    const promise = (async () => {
        const data = await generateProductionSvg('BACK', { BACK: item }, item.font || 'BeFit', item.monogramStyle || 'Block Script', fonts);
        if (!data) throw new Error('No artwork could be generated. Check the text or monogram length.');
        const doc = new DOMParser().parseFromString(decodeURIComponent(data.split(',').slice(1).join(',')), 'image/svg+xml');
        const svg = sanitizeGeometry(doc.documentElement);
        const host = document.createElement('div');
        host.style.cssText = 'position:fixed;left:-10000px;top:0;visibility:hidden;pointer-events:none';
        host.appendChild(document.importNode(svg, true));
        document.body.appendChild(host);
        let box;
        try { box = host.firstChild.getBBox(); } finally { host.remove(); }
        if (!box || box.width <= 0 || box.height <= 0) throw new Error('This design has no visible artwork.');
        const padding = 2;
        const viewBox = [box.x - padding, box.y - padding, box.width + padding * 2, box.height + padding * 2];
        svg.setAttribute('viewBox', viewBox.join(' '));
        svg.setAttribute('width', viewBox[2]); svg.setAttribute('height', viewBox[3]);
        const xml = new XMLSerializer().serializeToString(svg);
        return { src: uri(xml), inner: svg.innerHTML, viewBox, aspect: viewBox[2] / viewBox[3] };
    })();
    cache.set(key, promise);
    promise.catch(() => cache.delete(key));
    // Bound artwork cache, not the number of items the user may add.
    if (cache.size > 150) cache.delete(cache.keys().next().value);
    return promise;
}

export async function composeItemsSvg(items, size, side, fonts, color) {
    const aspect = areaAspect(size, side, color), w = 1000, h = w / aspect;
    const layers = await Promise.all(items.map(async (item, index) => {
        const art = await getItemArtwork(item, fonts);
        const fitted = constrainItem({ ...item, aspect: art.aspect }, aspect);
        const iw = fitted.width * w, ih = itemHeight(fitted, aspect) * h;
        // Prefix SVG ids so repeated gallery artwork cannot collide in an export.
        const inner = art.inner.replace(/\bid="([^"]+)"/g, `id="item${index}-$1"`)
            .replace(/url\(#([^)]*)\)/g, `url(#item${index}-$1)`)
            .replace(/href="#([^"]+)"/g, `href="#item${index}-$1"`);
        return `<g transform="translate(${fitted.x * w} ${fitted.y * h}) rotate(${fitted.rotation || 0})"><svg x="${-iw / 2}" y="${-ih / 2}" width="${iw}" height="${ih}" viewBox="${art.viewBox.join(' ')}">${inner}</svg></g>`;
    }));
    // Preserve the complete engraving area: never crop/recenter the composition.
    return uri(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${layers.join('')}</svg>`);
}
function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image(); img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img); img.onerror = () => reject(new Error('Unable to load design preview image.'));
        img.src = src;
    });
}
export async function captureItemSide(items, size, side, fonts, bottleSrc, color) {
    const svg = await composeItemsSvg(items, size, side, fonts, color);
    const [design, bottle] = await Promise.all([loadImage(svg), loadImage(bottleSrc)]);
    const area = getPrintArea(size, side, color);
    const aspect = areaAspect(size, side, color);
    const canvas = document.createElement('canvas'); canvas.width = BOTTLE_FRAME.width * 3; canvas.height = BOTTLE_FRAME.height * 3;
    const ctx = canvas.getContext('2d');
    // Match the preview's object-cover image at top 9%, height 82% exactly.
    const imageH = canvas.height * .82;
    const scale = Math.max(canvas.width / bottle.width, imageH / bottle.height);
    ctx.save(); ctx.beginPath(); ctx.rect(0, canvas.height * .09, canvas.width, imageH); ctx.clip();
    ctx.drawImage(bottle, (canvas.width - bottle.width * scale) / 2, canvas.height * .09 + (imageH - bottle.height * scale) / 2, bottle.width * scale, bottle.height * scale); ctx.restore();
    const designCanvas = document.createElement('canvas'); designCanvas.width = 1000; designCanvas.height = Math.round(1000 / aspect);
    const dctx = designCanvas.getContext('2d'); dctx.drawImage(design, 0, 0, designCanvas.width, designCanvas.height);
    const production = designCanvas.toDataURL('image/png');
    // The editor applies metallic shading to each item before rotation. Applying
    // one gradient to the entire composition changes highlights and overlapping layers.
    const layers = await Promise.all(items.map(async raw => {
        const art = await getItemArtwork(raw, fonts);
        return { item: constrainItem({ ...raw, aspect: art.aspect }, aspect), image: await loadImage(art.src) };
    }));
    dctx.clearRect(0, 0, designCanvas.width, designCanvas.height);
    const light = /white|frost|grey|gray|sage|mint|pink|lila|lavender|sky/.test(color);
    for (const { item, image } of layers) {
        const width = item.width * designCanvas.width;
        const height = itemHeight(item, aspect) * designCanvas.height;
        const layer = document.createElement('canvas');
        layer.width = Math.ceil(width); layer.height = Math.ceil(height);
        const lctx = layer.getContext('2d');
        lctx.drawImage(image, 0, 0, layer.width, layer.height);
        lctx.globalCompositeOperation = 'source-in';
        const gradient = lctx.createLinearGradient(0, 0, layer.width, 0);
        gradient.addColorStop(0, light ? '#55575b' : '#96989d');
        gradient.addColorStop(.45, light ? '#999ba0' : '#eeeeef');
        gradient.addColorStop(1, light ? '#55575b' : '#77797e');
        lctx.fillStyle = gradient; lctx.fillRect(0, 0, layer.width, layer.height);
        dctx.save();
        dctx.translate(item.x * designCanvas.width, item.y * designCanvas.height);
        dctx.rotate((item.rotation || 0) * Math.PI / 180);
        dctx.drawImage(layer, -width / 2, -height / 2, width, height);
        dctx.restore();
    }
    ctx.drawImage(designCanvas, area.x * canvas.width, area.y * canvas.height, area.width * canvas.width, area.height * canvas.height);
    return { bottle: canvas.toDataURL('image/png'), design: items.length ? designCanvas.toDataURL('image/png') : null, production: items.length ? production : null, svg: items.length ? svg : null };
}
