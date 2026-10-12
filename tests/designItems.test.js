import test from 'node:test';
import assert from 'node:assert/strict';
import { areaAspect, constrainItem, getPrintArea, itemHeight, serializeItems, snapItemToCenter, summarizeSide } from '../src/utils/designItems.js';

test('back print areas follow the visible body center for each bottle size', () => {
    assert.equal(getPrintArea('946ml', 'BACK').x, .365);
    assert.deepEqual(getPrintArea('710ml', 'BACK'), {
        x: .379, y: .38, width: .28, height: .39,
    });
    assert.deepEqual(getPrintArea('536ml', 'BACK'), {
        x: .359, y: .395, width: .31, height: .38,
    });
    assert.equal(getPrintArea('946ml', 'FRONT').x, .31);
    assert.deepEqual(getPrintArea('710ml', 'FRONT'), {
        x: .345, y: .485, width: .28, height: .18,
    });
});

test('updated 1L assets use their recalibrated body centers', () => {
    assert.equal(getPrintArea('946ml', 'FRONT', 'midnight-black').x, .343);
    assert.equal(getPrintArea('946ml', 'BACK', 'midnight-black').x, .305);
    assert.equal(getPrintArea('946ml', 'FRONT', 'pure-white').x, .343);
    assert.equal(getPrintArea('946ml', 'BACK', 'pure-white').x, .305);
    assert.equal(getPrintArea('946ml', 'FRONT', 'sage-green').x, .343);
    assert.equal(getPrintArea('946ml', 'BACK', 'white-frost').x, .305);
});

test('all rotated corners remain inside the print area across sizes and sides', () => {
    for (const size of ['536ml', '710ml', '946ml']) for (const side of ['FRONT', 'BACK']) for (const color of [undefined, 'forest-green', 'pure-white']) {
        const area = areaAspect(size, side, color);
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
test('94% square artwork reaches the top of the updated green 946ml back area', () => {
    const aspect = areaAspect('946ml', 'BACK', 'forest-green');
    const item = constrainItem({ x: .5, y: -1, width: .94, aspect: 1, rotation: 0 }, aspect);
    assert.ok(Math.abs(item.y - .29104355362946915) < 1e-12);
    assert.ok(Math.abs(item.y - itemHeight(item, aspect) / 2) < 1e-12);
    assert.equal(item.width, .94);
});
test('moving within bounds preserves size and shape', () => {
    const item = { x: .4, y: .5, width: .3, aspect: 2, rotation: 25 };
    assert.deepEqual(constrainItem(item, 1), item);
});
test('center snapping treats the horizontal and vertical axes independently', () => {
    const rect = { width: 200, height: 400 };
    const verticalOnly = snapItemToCenter({ x: .53, y: .6 }, rect);
    assert.equal(verticalOnly.item.x, .5);
    assert.equal(verticalOnly.item.y, .6);
    assert.deepEqual(verticalOnly.guides, { vertical: true, horizontal: false });

    const horizontalOnly = snapItemToCenter({ x: .6, y: .51 }, rect);
    assert.equal(horizontalOnly.item.x, .6);
    assert.equal(horizontalOnly.item.y, .5);
    assert.deepEqual(horizontalOnly.guides, { vertical: false, horizontal: true });

    const both = snapItemToCenter({ x: .47, y: .49 }, rect);
    assert.deepEqual({ x: both.item.x, y: both.item.y }, { x: .5, y: .5 });
    assert.deepEqual(both.guides, { vertical: true, horizontal: true });

    const neither = snapItemToCenter({ x: .44, y: .47 }, rect);
    assert.deepEqual(neither.guides, { vertical: false, horizontal: false });
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
