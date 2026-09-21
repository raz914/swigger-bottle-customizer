import test from 'node:test';
import assert from 'node:assert/strict';
import { areaAspect, constrainItem, getPrintArea, itemHeight, serializeItems, summarizeSide } from '../src/utils/designItems.js';

test('back print areas follow the visible body center for each bottle size', () => {
    assert.equal(getPrintArea('946ml', 'BACK').x, .365);
    assert.equal(getPrintArea('710ml', 'BACK').x, .365);
    assert.equal(getPrintArea('536ml', 'BACK').x, .35);
    assert.equal(getPrintArea('946ml', 'FRONT').x, .31);
});

test('updated 1L assets use their recalibrated body centers', () => {
    assert.equal(getPrintArea('946ml', 'FRONT', 'midnight-black').x, .35);
    assert.equal(getPrintArea('946ml', 'BACK', 'midnight-black').x, .30);
    assert.equal(getPrintArea('946ml', 'FRONT', 'pure-white').x, .35);
    assert.equal(getPrintArea('946ml', 'BACK', 'pure-white').x, .30);
    assert.equal(getPrintArea('946ml', 'FRONT', 'sage-green').x, .35);
    assert.equal(getPrintArea('946ml', 'BACK', 'white-frost').x, .30);
});

test('all rotated corners remain inside the print area across sizes and sides', () => {
    for (const size of ['536ml', '710ml', '946ml']) for (const side of ['FRONT', 'BACK']) {
        const area = areaAspect(size, side);
        for (const ratio of [.1, .5, 1, 5, 20]) for (const rotation of [-175, -90, -45, 0, 30, 90, 160]) {
            const item = constrainItem({ x: -.2, y: 1.4, width: 1.8, aspect: ratio, rotation }, area);
            const angle = rotation * Math.PI / 180;
            const h = itemHeight(item, area);
            for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
                const x = item.x + sx * item.width / 2 * Math.cos(angle) - sy * h / area / 2 * Math.sin(angle);
                const y = item.y + sx * item.width * area / 2 * Math.sin(angle) + sy * h / 2 * Math.cos(angle);
                assert.ok(x >= -1e-9 && x <= 1 + 1e-9 && y >= -1e-9 && y <= 1 + 1e-9);
            }
        }
    }
});
test('moving within bounds preserves size and shape', () => {
    const item = { x: .4, y: .5, width: .3, aspect: 2, rotation: 25 };
    assert.deepEqual(constrainItem(item, 1), item);
});
test('mixed repeated items remain in summaries and order metadata in order', () => {
    const items = [{ id: '1', type: 'text', text: 'HELLO', font: 'BeFit', x: .2 },
        { id: '2', type: 'graphic', graphic: { name: 'Logo', src: 'data:image/png;base64,large', isUpload: true }, x: .6 },
        { id: '3', type: 'text', text: 'AGAIN', font: 'Oswald', x: .8 }];
    const summary = summarizeSide({ items });
    assert.equal(summary.text, 'HELLO / AGAIN');
    assert.equal(summary.graphic.name, 'Logo');
    const saved = serializeItems(items);
    assert.equal(saved.length, 3);
    assert.deepEqual(saved.map(i => i.id), ['1', '2', '3']);
    assert.equal(saved[1].graphic.src, '');
    assert.equal(saved[2].font, 'Oswald');
    assert.equal(saved[2].x, .8);
});
