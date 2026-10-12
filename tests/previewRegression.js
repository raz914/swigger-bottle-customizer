import { captureItemSide } from '../src/utils/itemArtwork.js';

const uri = svg => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
const fonts = [{ name: 'BeFit', style: { fontFamily: 'BeFit' } }];
const circle = uri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" /></svg>');
const square = uri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" /></svg>');
const repeated = uri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><path id="shape" d="M0 0H100V100H0Z" /></defs><use href="#shape" /></svg>');
const graphic = (src, patch = {}) => ({ id: 'graphic', type: 'graphic', graphic: { src, name: 'Test shape' }, x: .5, y: .5, width: .94, aspect: 1, rotation: 0, ...patch });
let passed = 0, failed = 0;
function assert(condition, message) { if (!condition) throw new Error(message); }
async function test(name, run) {
    const row = document.createElement('li');
    try { await run(); passed++; row.className = 'pass'; row.textContent = `PASS — ${name}`; }
    catch (error) { failed++; row.className = 'fail'; row.textContent = `FAIL — ${name}: ${error.message}`; }
    document.querySelector('#results').appendChild(row);
}
async function pixels(src) {
    const image = new Image(); image.src = src; await image.decode();
    const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
    const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0);
    return { width: canvas.width, height: canvas.height, data: ctx.getImageData(0, 0, canvas.width, canvas.height).data };
}
function bounds({ width, height, data }) {
    let minX = width, minY = height, maxX = -1, maxY = -1;
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) if (data[(y * width + x) * 4 + 3] > 127) {
        minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    }
    return { width: maxX - minX + 1, height: maxY - minY + 1, minY };
}
const capture = (items, size = '946ml', side = 'BACK', color = 'forest-green') => captureItemSide(
    items, size, side, fonts, `/bottle/${side === 'BACK' ? 'achter' : 'voor'}/${color}-${({ '946ml': '1liter', '536ml': '500ml' })[size] || size}-${side === 'BACK' ? 'achter' : 'voor'}.png`, color,
);

// Independent expected calibrations: catch accidental use of the legacy 946ml ratio.
const matrix = [
    ...['midnight-black', 'pure-white', 'white-frost', 'light-grey', 'sky-blue', 'deep-navy', 'candy-pink', 'lavender-purple', 'forest-green', 'sage-green'].map(color => ({ size: '946ml', color, front: [.33, .17], back: [.33, .355] })),
    { size: '946ml', color: 'warm-white', front: [.31, .17], back: [.34, .285] },
    { size: '710ml', color: 'forest-green', front: [.28, .18], back: [.28, .39] },
    { size: '536ml', color: 'light-pink', front: [.30, .185], back: [.31, .38] },
];
for (const entry of matrix) for (const side of ['FRONT', 'BACK']) {
    await test(`${entry.size} ${entry.color} ${side}: circle shape, top edge, export dimensions`, async () => {
        const output = await capture([graphic(circle, { y: -1 })], entry.size, side, entry.color);
        const svg = new DOMParser().parseFromString(decodeURIComponent(output.svg.split(',')[1]), 'image/svg+xml').documentElement;
        const [areaWidth, areaHeight] = entry[side.toLowerCase()];
        const expectedHeight = 1000 * areaHeight * 650 / (areaWidth * 433);
        assert(Math.abs(Number(svg.getAttribute('height')) - expectedHeight) < .001, 'SVG uses the wrong engraving area');
        const production = await pixels(output.production), preview = await pixels(output.design);
        assert(production.height === Math.round(expectedHeight), 'PNG uses the wrong engraving area');
        const box = bounds(production), previewBox = bounds(preview);
        assert(Math.abs(box.width - box.height) <= 2, `Circle stretched to ${box.width}×${box.height}`);
        assert(Math.abs(box.width - previewBox.width) <= 2 && Math.abs(box.height - previewBox.height) <= 2, 'Preview and production shapes differ');
        assert(box.minY <= 3, `Unnecessary gap at top: ${box.minY}px`);
    });
}
await test('mixed monogram, text, and repeated SVG layers survive export', async () => {
    const items = [
        { id: 'monogram', type: 'monogram', monogram: 'D', monogramStyle: 'ITC Modern', x: .22, y: .2, width: .25, aspect: 1, rotation: 20 },
        { id: 'text', type: 'text', text: 'HYDRATE', font: 'BeFit', x: .7, y: .35, width: .4, aspect: 3, rotation: -15 },
        graphic(repeated, { id: 'one', x: .25, y: .75, width: .22 }),
        graphic(repeated, { id: 'two', x: .75, y: .75, width: .22 }),
    ];
    const output = await capture(items);
    const svg = new DOMParser().parseFromString(decodeURIComponent(output.svg.split(',')[1]), 'image/svg+xml').documentElement;
    assert(svg.children.length === items.length, 'Layer missing from vector export');
    const ids = [...svg.querySelectorAll('[id]')].map(el => el.id);
    assert(ids.length === new Set(ids).size, 'Repeated SVG IDs collide');
    const result = await pixels(output.production);
    for (const item of items) {
        const single = await pixels((await capture([item])).production);
        let visible = 0;
        for (let i = 3; i < single.data.length; i += 4) if (single.data[i] > 127 && result.data[i] > 127) visible++;
        assert(visible > 100, `Layer ${item.id} missing from raster export`);
    }
    const image = new Image(); image.src = output.bottle; image.alt = 'Mixed layered preview'; document.querySelector('#examples').appendChild(image);
});
for (const color of ['forest-green', 'pure-white']) await test(`${color}: each item keeps its own metallic highlight`, async () => {
    const items = [graphic(square, { x: .2, width: .22 }), graphic(square, { x: .8, width: .22 })];
    const result = await pixels((await capture(items, '946ml', 'BACK', color)).design);
    const sample = center => {
        const x = Math.round((center - .11 + .22 * .45) * result.width), y = Math.floor(result.height / 2);
        const i = (y * result.width + x) * 4; return [...result.data.slice(i, i + 4)];
    };
    const left = sample(.2), right = sample(.8);
    assert(left[3] > 250 && right[3] > 250, 'A preview layer is missing');
    assert(left.every((v, i) => Math.abs(v - right[i]) <= 2), `Highlights differ: ${left} / ${right}`);
    assert(left[0] >= (color === 'pure-white' ? 145 : 230), 'Item highlight is lost');
});
await test('empty side exports a bottle with no design or production files', async () => {
    const output = await capture([]);
    assert(output.bottle.startsWith('data:image/png'), 'Bottle preview missing');
    assert(output.design === null && output.production === null && output.svg === null, 'Blank side gained artwork');
});
document.querySelector('#status').textContent = `${passed} passed, ${failed} failed`;
document.querySelector('#status').dataset.result = failed ? 'fail' : 'pass';
