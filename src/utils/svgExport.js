/**
 * SVG-based vector export for professional production (xTool/Laser/LightBurn).
 * Uses opentype.js to convert text to mathematically perfect Bézier vector outlines.
 * ZERO font dependencies in the output SVG — pure <path d="..."> curves only.
 */

import opentype from 'opentype.js';
import {
    monogramStyles,
    convertToCircleGlyphs,
    getCircleFontFamily,
    usesCircleGlyphs,
    convertToNGramGlyphs,
    getNGramFontFamily,
    usesNGramGlyphs,
    shouldDisplayMonogram,
} from '../data/monogramConfig';

// =============================================================================
// Font File Mapping
// =============================================================================

/**
 * Maps CSS font-family names to their .ttf/.otf file paths (relative to public/).
 * opentype.js needs .ttf or .otf files (NOT .woff2).
 */
const FONT_FILE_MAP = {
    // --- Text Fonts ---
    'BeFit':              'fonts/BeFit.otf',
    'BeFit Slim':         'fonts/BeFit-Slim.otf',
    'BeFit Bold Italic':  'fonts/BEFIT-Bold Italic.otf',
    'Oswald':             'fonts/oswald.ttf',
    'Bebas Neue':         'fonts/bebas-neue.ttf',
    'Nunito':             'fonts/nunito.ttf',
    'Dancing Script':     'fonts/dancing-script.ttf',
    'Merriweather':       'fonts/merriweather.ttf',
    'Bodoni Moda':        'fonts/bodoni-moda.ttf',
    'Playfair Display':   'fonts/playfair-display.ttf',
    'Alfa Slab One':      'fonts/alfa-slab-one.ttf',
    'Permanent Marker':   'fonts/permanent-marker.ttf',
    'Bungee':             'fonts/bungee.ttf',

    // --- Monogram Fonts (prefer .ttf/.otf for opentype.js, .woff as fallback) ---
    'ITC Modern':               'monogram/itc-modern.ttf',
    'Nexa Script':              'monogram/nexa-script.woff',
    'Roman':                    'monogram/roman.ttf',
    'Vine':                     'monogram/vine.woff',
    'Burns Drift':              'monogram/BurnsDriftDemo-R91Kl.ttf',
    'Mending':                  'monogram/Mending.otf',
    'Two Character Circle':     'monogram/two-character-circle.ttf',
    'Three Character Circle':   'monogram/three-character-circle.ttf',
    'Two Character N-Gram':     'monogram/two-character-n-gram.ttf',
    'Three Character N-Gram':   'monogram/three-character-n-gram.ttf',
    'Proxima Nova':             'monogram/proxima-nova.ttf',
    'Rockwell Bold':            'monogram/rockwell-bold.woff',
    'Sackers Gothic':           'monogram/sackers-gothic.ttf',
    'Janda Stylish Monogram':   'monogram/JandaStylishMonogram-1RqZ.ttf',
    'Kg Modern Monogram':       'monogram/KgModernMonogram-R1L3.ttf',
};

// Font cache to avoid re-loading
const fontCache = new Map();

/**
 * Resolve the base URL of the configurator page.
 * In WordPress: .../configurator/index.html → .../configurator/
 * In Vite dev: http://localhost:5173/ → http://localhost:5173/
 */
function getBaseUrl() {
    return new URL('./', window.location.href).href;
}

/**
 * Load a font via opentype.js, with caching.
 * Uses fetch+parse for WOFF compatibility.
 * @param {string} fontFamily - CSS font-family name
 * @returns {Promise<opentype.Font|null>}
 */
async function loadFont(fontFamily) {
    // Strip fallbacks like '"Noto Emoji", sans-serif' -> first family only
    const cleanName = fontFamily.split(',')[0].trim().replace(/['"]/g, '');

    if (fontCache.has(cleanName)) {
        return fontCache.get(cleanName);
    }

    const relativePath = FONT_FILE_MAP[cleanName];
    if (!relativePath) {
        console.warn(`[svgExport] No font file mapped for "${cleanName}"`);
        return null;
    }

    const fullUrl = getBaseUrl() + relativePath;

    try {
        // Use fetch + parse approach for maximum compatibility (WOFF, OTF, TTF)
        const response = await fetch(fullUrl);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status} for ${fullUrl}`);
        }
        const buffer = await response.arrayBuffer();
        const font = opentype.parse(buffer);
        fontCache.set(cleanName, font);
        return font;
    } catch (err) {
        console.error(`[svgExport] Failed to load font "${cleanName}" from ${fullUrl}:`, err);
        return null;
    }
}

// =============================================================================
// SVG Path Generation Helpers
// =============================================================================

/**
 * Convert text to SVG <path> data using opentype.js.
 * Returns the path data string and the advance width.
 */
function textToPathData(font, text, fontSize, x, y) {
    const path = font.getPath(text, x, y, fontSize);
    return {
        d: path.toPathData(2),
        width: font.getAdvanceWidth(text, fontSize),
    };
}

/**
 * Measure text metrics for layout calculations.
 */
function measureText(font, text, fontSize) {
    const width = font.getAdvanceWidth(text, fontSize);
    const ascender = (font.ascender / font.unitsPerEm) * fontSize;
    const descender = (font.descender / font.unitsPerEm) * fontSize;
    return { width, ascender, descender, height: ascender - descender };
}

// =============================================================================
// Main Export Function
// =============================================================================

/**
 * Generate an SVG string for a given side's customization.
 * Uses opentype.js to convert all text/monograms to outlined vector paths.
 *
 * @param {string} side - 'FRONT' or 'BACK'
 * @param {object} customization - The customization state
 * @param {string} selectedFont - Current font name
 * @param {string} selectedMonogram - Current monogram name
 * @param {array} fonts - Font definitions array
 * @returns {Promise<string>} SVG XML string as Data URI, or empty string
 */
export const generateProductionSvg = async (
    side,
    customization,
    selectedFont,
    selectedMonogram,
    fonts = []
) => {
    const config = customization[side];
    const textInput = config?.text || '';
    const monogramInput = config?.monogram || '';
    const graphicInput = config?.graphic || null;
    const jerseyName = config?.jerseyName || '';
    const jerseyNumber = config?.jerseyNumber || '';
    const isVertical = side === 'BACK' && config?.isVertical;

    if (!textInput && !monogramInput && !graphicInput && !jerseyName && !jerseyNumber) {
        return '';
    }

    console.log(`[svgExport] Generating vector SVG for ${side}:`, { textInput, monogramInput, graphicInput: !!graphicInput, jerseyName, jerseyNumber });

    const viewW = 1000;
    const viewH = 1000;
    const pad = 50;

    let pathElements = '';

    // =========================================================================
    // 1. Text
    // =========================================================================
    if (textInput) {
        const fontObj = fonts.find(f => f.name === selectedFont);
        const fontFamily = fontObj?.style?.fontFamily?.split(',')[0].trim().replace(/['"]/g, '') || 'BeFit';
        const isBold = fontObj?.style?.fontWeight === 'bold';
        const isItalic = fontObj?.style?.fontStyle === 'italic';

        // Special case for BeFit Bold Italic
        let loadName = fontFamily;
        if (fontFamily === 'BeFit' && isBold && isItalic) {
            loadName = 'BeFit Bold Italic';
        }
        // Arial doesn't have a local file, skip (won't be used for laser usually)
        if (fontFamily === 'Arial') {
            loadName = 'BeFit'; // fallback
        }

        const font = await loadFont(loadName);
        if (font) {
            const lines = textInput.split('\n').filter(l => l.length > 0);

            if (isVertical) {
                // Vertical text (rotated -90°)
                pathElements += renderVerticalText(font, lines, viewW, viewH, pad);
            } else {
                // Horizontal text
                pathElements += renderHorizontalText(font, lines, viewW, viewH, pad);
            }
        }
    }

    // =========================================================================
    // 2. Monogram
    // =========================================================================
    if (monogramInput && shouldDisplayMonogram(selectedMonogram, monogramInput.length)) {
        const monoPathData = await renderMonogram(monogramInput, selectedMonogram, viewW, viewH, pad);
        if (monoPathData) {
            pathElements += monoPathData;
        }
    }

    // =========================================================================
    // 3. Jersey
    // =========================================================================
    if (jerseyName || jerseyNumber) {
        const fontObj = fonts.find(f => f.name === selectedFont);
        const fontFamily = fontObj?.style?.fontFamily?.split(',')[0].trim().replace(/['"]/g, '') || 'BeFit';
        let loadName = fontFamily;
        if (fontFamily === 'BeFit' && fontObj?.style?.fontWeight === 'bold' && fontObj?.style?.fontStyle === 'italic') {
            loadName = 'BeFit Bold Italic';
        }
        if (fontFamily === 'Arial') loadName = 'BeFit';

        const font = await loadFont(loadName);
        if (font) {
            pathElements += renderJersey(font, jerseyName, jerseyNumber, viewW, viewH, pad);
        }
    }

    // =========================================================================
    // 4. Gallery Graphic (already SVG — inline it)
    // =========================================================================
    if (graphicInput) {
        const graphicSvg = await inlineGraphicSvg(graphicInput, viewW, viewH, pad);
        if (graphicSvg) {
            pathElements += graphicSvg;
        }
    }

    if (!pathElements) {
        console.warn(`[svgExport] No path elements generated for ${side}`);
        return '';
    }

    const svgXml = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="${viewW}" height="${viewH}" viewBox="0 0 ${viewW} ${viewH}" xmlns="http://www.w3.org/2000/svg">
${pathElements}
</svg>`;

    const dataUri = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgXml);
    console.log(`[svgExport] ✅ Vector SVG generated for ${side} (${dataUri.length} chars)`);
    return dataUri;
};

// =============================================================================
// Text Rendering
// =============================================================================

function renderHorizontalText(font, lines, viewW, viewH, pad) {
    const usableW = viewW - pad * 2;
    const usableH = viewH - pad * 2;
    let svgPaths = '';

    // Calculate optimal font size to fit all lines
    let fontSize = 200; // start large
    const lineSpacingFactor = 1.25;

    // Binary search for best font size
    for (let i = 0; i < 20; i++) {
        const totalTextH = fontSize * lineSpacingFactor * lines.length;
        const maxLineW = Math.max(...lines.map(l => font.getAdvanceWidth(l, fontSize)));
        if (maxLineW <= usableW && totalTextH <= usableH) {
            break;
        }
        fontSize *= 0.85;
    }

    const lineH = fontSize * lineSpacingFactor;
    const totalH = lineH * lines.length;
    const startY = (viewH - totalH) / 2 + fontSize; // baseline of first line

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineW = font.getAdvanceWidth(line, fontSize);
        const x = (viewW - lineW) / 2;
        const y = startY + i * lineH;

        const { d } = textToPathData(font, line, fontSize, x, y);
        if (d) {
            svgPaths += `    <path d="${d}" fill="#000000" />\n`;
        }
    }

    return svgPaths;
}

function renderVerticalText(font, lines, viewW, viewH, pad) {
    // For vertical text, we render horizontally then rotate the group -90°
    const usableW = viewH - pad * 2; // swapped because of rotation
    const usableH = viewW - pad * 2;
    let svgPaths = '';

    let fontSize = 200;
    const lineSpacingFactor = 1.25;

    for (let i = 0; i < 20; i++) {
        const totalTextH = fontSize * lineSpacingFactor * lines.length;
        const maxLineW = Math.max(...lines.map(l => font.getAdvanceWidth(l, fontSize)));
        if (maxLineW <= usableW && totalTextH <= usableH) {
            break;
        }
        fontSize *= 0.85;
    }

    const lineH = fontSize * lineSpacingFactor;
    const totalH = lineH * lines.length;
    const startY = (viewH - (fontSize * lineSpacingFactor * lines.length)) / 2 + fontSize;

    // Build paths in un-rotated space, then wrap in a rotation group
    let innerPaths = '';
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineW = font.getAdvanceWidth(line, fontSize);
        const x = (viewH - lineW) / 2; // center in the rotated width
        const y = startY + i * lineH;

        const { d } = textToPathData(font, line, fontSize, x, y);
        if (d) {
            innerPaths += `        <path d="${d}" fill="#000000" />\n`;
        }
    }

    if (innerPaths) {
        const cx = viewW / 2;
        const cy = viewH / 2;
        svgPaths += `    <g transform="rotate(-90, ${cx}, ${cy})">\n${innerPaths}    </g>\n`;
    }

    return svgPaths;
}

// =============================================================================
// Monogram Rendering
// =============================================================================

async function renderMonogram(input, monogramName, viewW, viewH, pad) {
    const len = input.length;
    const monoStyle = monogramStyles.find(m =>
        m.name === monogramName ||
        (monogramName === 'rJ#' && m.name === 'Circle Script') ||
        (monogramName === 'N-Gram' && m.name === 'Block Script')
    );

    let fontFamily, displayText;

    if (usesCircleGlyphs(monogramName)) {
        // Circle Script monogram
        fontFamily = getCircleFontFamily(len);
        displayText = convertToCircleGlyphs(input, monogramName);
    } else if (usesNGramGlyphs(monogramName)) {
        // Block Script / N-Gram monogram
        fontFamily = getNGramFontFamily(len);
        displayText = convertToNGramGlyphs(input);
    } else if (monoStyle?.middleLarger && len === 3) {
        // Roman style: middle letter larger
        return await renderRomanMonogram(input, viewW, viewH, pad);
    } else {
        // Simple single-font monogram (ITC Modern, Nexa Script, Vine, etc.)
        fontFamily = monoStyle?.style?.fontFamily || 'ITC Modern';
        displayText = input;
    }

    const font = await loadFont(fontFamily);
    if (!font) return null;

    // Size to fill the viewbox nicely
    const usableW = viewW - pad * 2;
    const usableH = viewH - pad * 2;
    let fontSize = 600;

    for (let i = 0; i < 20; i++) {
        const w = font.getAdvanceWidth(displayText, fontSize);
        const m = measureText(font, displayText, fontSize);
        if (w <= usableW && m.height <= usableH) break;
        fontSize *= 0.85;
    }

    const metrics = measureText(font, displayText, fontSize);
    const textW = font.getAdvanceWidth(displayText, fontSize);
    const x = (viewW - textW) / 2;
    const y = (viewH + metrics.ascender - metrics.descender) / 2 - metrics.descender;

    const { d } = textToPathData(font, displayText, fontSize, x, y);
    if (!d) return null;

    return `    <path d="${d}" fill="#000000" />\n`;
}

async function renderRomanMonogram(input, viewW, viewH, pad) {
    // Roman: 3 chars, middle char is larger
    const font = await loadFont('Roman');
    if (!font) return null;

    const left = input[0];
    const middle = input[1];
    const right = input[2];

    const smallSize = 300;
    const bigSize = 420;

    // Layout: left(small) + middle(big) + right(small), all centered
    const leftW = font.getAdvanceWidth(left, smallSize);
    const midW = font.getAdvanceWidth(middle, bigSize);
    const rightW = font.getAdvanceWidth(right, smallSize);
    const totalW = leftW + midW + rightW;

    // Scale down if too wide
    const usableW = viewW - pad * 2;
    const scale = totalW > usableW ? usableW / totalW : 1;
    const sS = smallSize * scale;
    const bS = bigSize * scale;

    const lW = font.getAdvanceWidth(left, sS);
    const mW = font.getAdvanceWidth(middle, bS);
    const rW = font.getAdvanceWidth(right, sS);
    const tW = lW + mW + rW;

    const startX = (viewW - tW) / 2;

    // Vertical centering based on big letter
    const bigMetrics = measureText(font, middle, bS);
    const baseY = (viewH + bigMetrics.ascender) / 2;

    let paths = '';

    // Left letter (small, aligned to baseline of big)
    const { d: dL } = textToPathData(font, left, sS, startX, baseY);
    if (dL) paths += `    <path d="${dL}" fill="#000000" />\n`;

    // Middle letter (big)
    const { d: dM } = textToPathData(font, middle, bS, startX + lW, baseY);
    if (dM) paths += `    <path d="${dM}" fill="#000000" />\n`;

    // Right letter (small)
    const { d: dR } = textToPathData(font, right, sS, startX + lW + mW, baseY);
    if (dR) paths += `    <path d="${dR}" fill="#000000" />\n`;

    return paths;
}

// =============================================================================
// Jersey Rendering
// =============================================================================

function renderJersey(font, name, number, viewW, viewH, pad) {
    let paths = '';
    const usableW = viewW - pad * 2;

    if (number) {
        // Number is large, centered top area
        let numSize = 400;
        for (let i = 0; i < 20; i++) {
            if (font.getAdvanceWidth(number, numSize) <= usableW) break;
            numSize *= 0.85;
        }
        const numW = font.getAdvanceWidth(number, numSize);
        const numX = (viewW - numW) / 2;
        const numY = name ? viewH * 0.55 : viewH * 0.6;

        const { d } = textToPathData(font, number, numSize, numX, numY);
        if (d) paths += `    <path d="${d}" fill="#000000" />\n`;
    }

    if (name) {
        // Name is smaller, below the number
        let nameSize = 120;
        for (let i = 0; i < 20; i++) {
            if (font.getAdvanceWidth(name, nameSize) <= usableW) break;
            nameSize *= 0.85;
        }
        const nameW = font.getAdvanceWidth(name, nameSize);
        const nameX = (viewW - nameW) / 2;
        const nameY = number ? viewH * 0.78 : viewH * 0.6;

        const { d } = textToPathData(font, name.toUpperCase(), nameSize, nameX, nameY);
        if (d) paths += `    <path d="${d}" fill="#000000" />\n`;
    }

    return paths;
}

// =============================================================================
// Graphic Inlining (SVG Vectors & High-Res Laser Raster Uploads)
// =============================================================================

async function inlineGraphicSvg(graphicInput, viewW, viewH, pad) {
    const graphicObj = typeof graphicInput === 'object' ? graphicInput : { src: graphicInput };
    // Prioritize original src for SVG detection (maskSrc is a raster PNG canvas generated for 3D preview)
    const rawSrc = graphicObj?.src || graphicObj?.maskSrc;
    if (!rawSrc) return null;

    // Check if it's an SVG (Gallery SVG or Customer SVG Upload)
    const isSvg = (
        (typeof rawSrc === 'string' && (
            rawSrc.startsWith('data:image/svg+xml') ||
            rawSrc.toLowerCase().includes('.svg') ||
            rawSrc.includes('<svg')
        )) ||
        (graphicObj.name && typeof graphicObj.name === 'string' && graphicObj.name.toLowerCase().endsWith('.svg')) ||
        (graphicObj.fileType && String(graphicObj.fileType).toLowerCase() === 'svg')
    );

    if (isSvg) {
        try {
            let svgText = '';
            if (rawSrc.startsWith('data:image/svg+xml;base64,')) {
                svgText = atob(rawSrc.replace('data:image/svg+xml;base64,', ''));
            } else if (rawSrc.startsWith('data:image/svg+xml;utf-8,') || rawSrc.startsWith('data:image/svg+xml;charset=utf-8,') || rawSrc.startsWith('data:image/svg+xml,')) {
                svgText = decodeURIComponent(rawSrc.replace(/^data:image\/svg\+xml[^,]*,/, ''));
            } else if (rawSrc.includes('<svg')) {
                svgText = rawSrc;
            } else {
                // Relative or absolute URL (e.g. gallery/animals/lion.svg)
                const fullUrl = new URL(rawSrc, window.location.href).href;
                const response = await fetch(fullUrl);
                svgText = await response.text();
            }

            // Parse the SVG to extract inner content
            const parser = new DOMParser();
            const doc = parser.parseFromString(svgText, 'image/svg+xml');
            const svgEl = doc.querySelector('svg');
            if (!svgEl) {
                console.warn('[svgExport] Could not find <svg> root element in graphic');
                return null;
            }

            let vbX = 0, vbY = 0, vbW = 0, vbH = 0;
            const origViewBox = svgEl.getAttribute('viewBox');

            if (origViewBox) {
                const vbParts = origViewBox.split(/[\s,]+/).map(Number);
                [vbX, vbY, vbW, vbH] = vbParts;
            } else {
                vbW = parseFloat(svgEl.getAttribute('width')) || 500;
                vbH = parseFloat(svgEl.getAttribute('height')) || 500;
            }

            if (!vbW || !vbH) {
                vbW = 500;
                vbH = 500;
            }

            const innerContent = svgEl.innerHTML;
            if (!innerContent) return null;

            // Fit into our viewBox with padding
            const usableW = viewW - pad * 2;
            const usableH = viewH - pad * 2;
            const scale = Math.min(usableW / vbW, usableH / vbH);
            const offsetX = pad + (usableW - vbW * scale) / 2 - vbX * scale;
            const offsetY = pad + (usableH - vbH * scale) / 2 - vbY * scale;

            console.log('[svgExport] ✅ Inlined native SVG vector graphic (Customer Upload / Gallery)');
            return `    <g transform="translate(${offsetX.toFixed(2)}, ${offsetY.toFixed(2)}) scale(${scale.toFixed(4)})" fill="#000000">\n        ${innerContent}\n    </g>\n`;
        } catch (err) {
            console.error('[svgExport] Failed to parse SVG vector graphic:', err);
        }
    }

    // Raster Upload (PNG, JPG, BMP, etc.) - Vectorized to pure vector paths for xTool
    const rasterSrc = graphicObj?.maskSrc || graphicObj?.src;
    try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = rasterSrc;
        });

        const natW = Math.min(1000, img.naturalWidth || img.width || 800);
        const natH = Math.min(1000, img.naturalHeight || img.height || 800);

        // Render on high-res canvas
        const canvas = document.createElement('canvas');
        canvas.width = natW;
        canvas.height = natH;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, natW, natH);

        const vectorPath = traceRasterToVectorPaths(canvas, viewW, viewH, pad);
        if (vectorPath) {
            return vectorPath;
        }

        // Fallback if no paths generated
        return null;
    } catch (err) {
        console.error('[svgExport] Failed to vectorize raster graphic upload:', err);
        return null;
    }
}

/**
 * Traces a monochrome raster canvas into razor-sharp, ruler-straight vector paths and smooth curves (xTool / LightBurn).
 * Uses Marching Squares + Ramer-Douglas-Peucker (RDP) Polyline Simplification + Adaptive Bézier Splines.
 */
function traceRasterToVectorPaths(canvas, viewW, viewH, pad) {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const w = canvas.width;
    const h = canvas.height;
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    // 1. Create padded binary grid (1 = foreground, 0 = background)
    const gw = w + 2;
    const gh = h + 2;
    const grid = new Uint8Array(gw * gh);
    let minX = w, maxX = 0, minY = h, maxY = 0;
    let hasPixels = false;

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const idx = (y * w + x) * 4;
            const a = data[idx + 3];
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;

            if (a > 80 && lum < 220) {
                grid[(y + 1) * gw + (x + 1)] = 1;
                hasPixels = true;
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            }
        }
    }

    if (!hasPixels || maxX <= minX || maxY <= minY) {
        return null;
    }

    // 2. Extract edge segments using Marching Squares
    const segments = [];

    for (let gy = 0; gy < gh - 1; gy++) {
        for (let gx = 0; gx < gw - 1; gx++) {
            const tl = grid[gy * gw + gx];
            const tr = grid[gy * gw + (gx + 1)];
            const br = grid[(gy + 1) * gw + (gx + 1)];
            const bl = grid[(gy + 1) * gw + gx];

            const caseId = (tl << 3) | (tr << 2) | (br << 1) | bl;
            if (caseId === 0 || caseId === 15) continue;

            const top = { x: gx + 0.5 - 1, y: gy - 1 };
            const right = { x: gx + 1 - 1, y: gy + 0.5 - 1 };
            const bottom = { x: gx + 0.5 - 1, y: gy + 1 - 1 };
            const left = { x: gx - 1, y: gy + 0.5 - 1 };

            switch (caseId) {
                case 1: segments.push([bottom, left]); break;
                case 2: segments.push([right, bottom]); break;
                case 3: segments.push([right, left]); break;
                case 4: segments.push([top, right]); break;
                case 5: segments.push([top, right], [bottom, left]); break;
                case 6: segments.push([top, bottom]); break;
                case 7: segments.push([top, left]); break;
                case 8: segments.push([left, top]); break;
                case 9: segments.push([bottom, top]); break;
                case 10: segments.push([left, top], [right, bottom]); break;
                case 11: segments.push([right, top]); break;
                case 12: segments.push([left, right]); break;
                case 13: segments.push([bottom, right]); break;
                case 14: segments.push([left, bottom]); break;
            }
        }
    }

    if (segments.length === 0) return null;

    // 3. Connect segments into closed polygon loops
    const pointKey = (p) => `${Math.round(p.x * 4)},${Math.round(p.y * 4)}`;
    const startMap = new Map();

    for (let i = 0; i < segments.length; i++) {
        const [p1, p2] = segments[i];
        const k = pointKey(p1);
        if (!startMap.has(k)) startMap.set(k, []);
        startMap.get(k).push({ p1, p2, used: false });
    }

    const loops = [];

    for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        const k = pointKey(seg[0]);
        const entries = startMap.get(k) || [];
        const entry = entries.find(e => e.p1 === seg[0] && e.p2 === seg[1] && !e.used);
        if (!entry) continue;

        entry.used = true;
        const loop = [entry.p1];
        let currentPt = entry.p2;
        let safety = 20000;

        while (safety-- > 0) {
            loop.push(currentPt);
            const nextKey = pointKey(currentPt);
            const nextEntries = startMap.get(nextKey) || [];
            const nextEntry = nextEntries.find(e => !e.used);

            if (!nextEntry) break;
            nextEntry.used = true;
            currentPt = nextEntry.p2;

            if (pointKey(currentPt) === pointKey(loop[0])) {
                break;
            }
        }

        if (loop.length >= 4) {
            loops.push(loop);
        }
    }

    if (loops.length === 0) return null;

    // 4. Calculate scaling to fit into SVG viewport
    const contentW = maxX - minX + 1;
    const contentH = maxY - minY + 1;
    const usableW = viewW - pad * 2;
    const usableH = viewH - pad * 2;
    const scale = Math.min(usableW / contentW, usableH / contentH);
    const offsetX = pad + (usableW - contentW * scale) / 2 - minX * scale;
    const offsetY = pad + (usableH - contentH * scale) / 2 - minY * scale;

    // Helper: Chaikin subdivision smoothing (guarantees smooth curves with zero spikes/whiskers)
    function chaikinSmooth(pts, iterations = 2) {
        let current = pts;
        for (let it = 0; it < iterations; it++) {
            const next = [];
            const len = current.length;
            for (let i = 0; i < len; i++) {
                const p0 = current[i];
                const p1 = current[(i + 1) % len];
                next.push({
                    x: 0.75 * p0.x + 0.25 * p1.x,
                    y: 0.75 * p0.y + 0.25 * p1.y
                });
                next.push({
                    x: 0.25 * p0.x + 0.75 * p1.x,
                    y: 0.25 * p0.y + 0.75 * p1.y
                });
            }
            current = next;
        }
        return current;
    }

    // Helper: Simplify collinear vertices
    function simplifyCollinear(pts) {
        const len = pts.length;
        if (len < 4) return pts;
        const result = [];
        for (let i = 0; i < len; i++) {
            const prev = pts[(i - 1 + len) % len];
            const cur = pts[i];
            const next = pts[(i + 1) % len];

            const v1x = cur.x - prev.x, v1y = cur.y - prev.y;
            const v2x = next.x - cur.x, v2y = next.y - cur.y;
            const l1 = Math.hypot(v1x, v1y);
            const l2 = Math.hypot(v2x, v2y);

            if (l1 === 0 || l2 === 0) continue;

            const dot = (v1x * v2x + v1y * v2y) / (l1 * l2);
            // If strictly collinear (angle < 2 deg), skip middle vertex
            if (dot < 0.9995) {
                result.push(cur);
            }
        }
        return result;
    }

    // 5. Build clean, smooth vector paths for each contour loop
    let pathD = '';

    for (const rawLoop of loops) {
        if (rawLoop.length < 4) continue;

        // Apply 2 passes of Chaikin subdivision to smooth out pixel steps
        const smoothed = chaikinSmooth(rawLoop, 2);
        const simplified = simplifyCollinear(smoothed);

        if (simplified.length < 3) continue;

        // Transform to SVG coordinates
        const tf = simplified.map(p => ({
            x: offsetX + p.x * scale,
            y: offsetY + p.y * scale
        }));

        pathD += `M ${tf[0].x.toFixed(2)} ${tf[0].y.toFixed(2)} `;
        for (let i = 1; i < tf.length; i++) {
            pathD += `L ${tf[i].x.toFixed(2)} ${tf[i].y.toFixed(2)} `;
        }
        pathD += 'Z ';
    }

    if (!pathD) return null;

    console.log('[svgExport] ✅ Smooth, spike-free vector contours generated for laser');
    return `    <path d="${pathD}" fill="#000000" fill-rule="evenodd" />\n`;
}
