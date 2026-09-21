/**
 * Canvas-based snapshot capture for iOS Safari compatibility.
 * iOS Safari has issues with html-to-image's SVG foreignObject approach,
 * so we use direct canvas drawing as a fallback.
 */

import {
    monogramStyles,
    convertToCircleGlyphs,
    getCircleFontFamily,
    usesCircleGlyphs,
    convertToNGramGlyphs,
    getNGramFontFamily,
    usesNGramGlyphs,
    shouldDisplayMonogram,
    getMonogramFontSize
} from '../data/monogramConfig';
import { DESKTOP_POSITIONS, MOBILE_POSITIONS, GRAPHIC_MAX_SIZE } from '../data/capturePositions';
import {
    getMetallicCanvasStops,
    cssUrl
} from './metallicStyle';

// =============================================================================
// iOS Detection
// =============================================================================

/**
 * Detect if the current device is iOS (iPhone/iPad) including iPadOS
 * iPadOS reports as "MacIntel" but has touch support
 */
export const isIOSDevice = () => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
        return false;
    }

    const ua = navigator.userAgent || '';
    const platform = navigator.platform || '';

    // Classic iOS detection
    if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) {
        return true;
    }

    // iPadOS 13+ detection (reports as MacIntel but has touch)
    if (platform === 'MacIntel' && navigator.maxTouchPoints > 1) {
        return true;
    }

    // Additional check for Safari on iOS via webkit
    if (/Safari/.test(ua) && /Apple/.test(navigator.vendor)) {
        if ('ontouchstart' in window && navigator.maxTouchPoints > 1) {
            // Could be iOS Safari
            // Check for lack of mouse events typical on desktop
            if (!/Macintosh/.test(ua) || navigator.maxTouchPoints > 1) {
                return true;
            }
        }
    }

    return false;
};

// =============================================================================
// Image Loading Helper
// =============================================================================

/**
 * Load an image and return a promise that resolves with the loaded Image element
 */
const loadImage = (src) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(err);
        img.src = src;
    });
};

// =============================================================================
// Canvas Positioning Constants (matching BottlePreview.jsx capture mode)
// =============================================================================

// Resolution multiplier for high-quality capture (e.g., Retina)
const RESOLUTION_SCALE = 4;

// Canvas dimensions for bottle snapshot (Updated to match BottlePreview 433px editor width)
const BOTTLE_CANVAS_WIDTH = 433 * RESOLUTION_SCALE;
const BOTTLE_CANVAS_HEIGHT = 650 * RESOLUTION_SCALE;

// Canvas dimensions for design-only snapshot
const DESIGN_CANVAS_SIZE = 433 * RESOLUTION_SCALE;

// Base font size scaled
const BASE_FONT_SIZE = 16 * RESOLUTION_SCALE;

/**
 * Convert percentage-based positioning to pixel coordinates
 * CSS uses top/bottom/left/right percentages from container edges
 */
const getPixelBounds = (percentPos, canvasWidth, canvasHeight, side) => {
    const topPercent = parseFloat(percentPos.top) / 100;
    const bottomPercent = parseFloat(percentPos.bottom) / 100;
    const leftPercent = parseFloat(percentPos.left) / 100;
    const rightPercent = parseFloat(percentPos.right) / 100;

    const nudge = (side === 'BACK') ? (canvasHeight * 0.012) : 0;
    const x = leftPercent * canvasWidth;
    const y = (topPercent * canvasHeight) + nudge;
    const width = canvasWidth - (leftPercent * canvasWidth) - (rightPercent * canvasWidth);
    const height = canvasHeight - (topPercent * canvasHeight) - (bottomPercent * canvasHeight);

    return { x, y, width, height };
};

// Positions imported from ../data/capturePositions.js

// =============================================================================
// Font Style Helpers
// =============================================================================

/**
 * Get the font family string for a given font name from the fonts array
 */
const getFontFamily = (fontName, fonts) => {
    const font = fonts.find(f => f.name === fontName);
    if (font && font.style && font.style.fontFamily) {
        return font.style.fontFamily;
    }
    return 'sans-serif';
};

/**
 * Get font weight from font style
 */
const getFontWeight = (fontName, fonts) => {
    const font = fonts.find(f => f.name === fontName);
    if (font && font.style && font.style.fontWeight) {
        return font.style.fontWeight;
    }
    return 'normal';
};

/**
 * Get font style (italic) from font style
 */
const getFontStyle = (fontName, fonts) => {
    const font = fonts.find(f => f.name === fontName);
    if (font && font.style && font.style.fontStyle) {
        return font.style.fontStyle;
    }
    return 'normal';
};

// =============================================================================
// Canvas Drawing & Utility Functions
// =============================================================================

/**
 * Trims a canvas to the exact bounding box of its non-transparent pixels.
 * Mathematically removes all asymmetric transparent padding.
 */
const autoCropCanvas = (canvas) => {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const data = ctx.getImageData(0, 0, w, h).data;

    let minX = w, minY = h, maxX = 0, maxY = 0;
    let hasVisiblePixels = false;

    // Scan the image data to find the extreme bounds of all non-transparent pixels
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const alpha = data[(y * w + x) * 4 + 3];
            if (alpha > 5) { // Threshold for any stray phantom pixels
                hasVisiblePixels = true;
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            }
        }
    }

    if (!hasVisiblePixels) return canvas; // Fallback if empty

    // Add a tiny safety buffer (e.g. 10px) to prevent absolute edge slicing
    const buffer = 10;
    minX = Math.max(0, minX - buffer);
    minY = Math.max(0, minY - buffer);
    maxX = Math.min(w, maxX + buffer);
    maxY = Math.min(h, maxY + buffer);

    const cropWidth = maxX - minX;
    const cropHeight = maxY - minY;

    // Create a new strictly sized canvas
    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = cropWidth;
    croppedCanvas.height = cropHeight;
    const croppedCtx = croppedCanvas.getContext('2d');

    croppedCtx.drawImage(
        canvas,
        minX, minY, cropWidth, cropHeight,
        0, 0, cropWidth, cropHeight
    );

    return croppedCanvas;
};


/**
 * Draw an image like CSS `object-fit: contain` within a destination box.
 */
const drawImageContain = (ctx, img, dx, dy, dw, dh) => {
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    if (!iw || !ih) return;

    const scale = Math.min(dw / iw, dh / ih);
    const w = iw * scale;
    const h = ih * scale;
    const x = dx + (dw - w) / 2;
    const y = dy + (dh - h) / 2;

    ctx.drawImage(img, x, y, w, h);
};

/**
 * Create metallic gradient matching CSS gradients from metallicStyle.js
 * Uses pre-brightened canvas colour stops so the result visually matches
 * the CSS gradient + brightness(1.1) filter used in React components.
 * 
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} bounds - {x, y, width, height}
 * @param {string} selectedColor - Bottle color ('white', 'black', etc.)
 * @returns {CanvasGradient} Linear gradient for metallic silver effect
 */
const createMetallicGradient = (ctx, bounds, selectedColor) => {
    const stops = getMetallicCanvasStops(selectedColor);

    // CSS linear-gradient(90deg) goes from left to right.
    // In canvas, this is x0=bounds.x, y0=y, x1=bounds.x + bounds.width, y1=y.
    const gradient = ctx.createLinearGradient(
        bounds.x,
        bounds.y + bounds.height / 2,
        bounds.x + bounds.width,
        bounds.y + bounds.height / 2
    );

    stops.forEach(stop => gradient.addColorStop(stop.offset, stop.color));
    return gradient;
};

/**
 * Calculate absolute maximum font size for binary search
 * Matches the DOM's maxFontSizePx calculation logic during capture
 * 
 * @param {number} boundsWidth - Width of the container in pixels
 * @param {string} side - 'FRONT' or 'BACK'
 * @returns {number} Maximum font size in pixels
 */
const calculateMaxFontSize = (boundsWidth, side) => {
    // Strictly limit font size to a percentage of the boundary width 
    // to ensure shrinking the container actually shrinks the text.
    const maxRatio = side === 'FRONT' ? 0.75 : 0.85;
    return boundsWidth * maxRatio;
};

/**
 * Draw text on canvas with proper centering, using cqi-based sizing
 * 
 * @param {CanvasRenderingContext2D} ctx 
 * @param {string} text 
 * @param {object} bounds - {x, y, width, height}
 * @param {string} fontFamily 
 * @param {string} fontWeight 
 * @param {string} fontStyle 
 * @param {string} selectedColor - Bottle color for gradient selection
 * @param {string} side - 'FRONT' or 'BACK' (for font size calculation)
 * @param {boolean} isVertical - whether text is vertical (BACK side option)
 */
const drawTextOnCanvas = (
    ctx,
    text,
    bounds,
    fontFamily,
    fontWeight,
    fontStyle,
    selectedColor,
    side,
    isVertical = false,
    frontMaxRatio = 0.14, // Matches DOM 0.12 with small buffer 0.02
    isProduction = false
) => {
    if (!text) return;

    ctx.save();
    // Apply metallic filters to match the editor style
    if (!isProduction) {
        ctx.filter = 'contrast(1.4) brightness(1.2) drop-shadow(0 2px 4px rgba(0,0,0,0.3)) saturate(0.9)';
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;

    const rawLines = String(text).replace(/\r\n/g, '\n').split('\n');
    const letterSpacingPx = 0.5 * RESOLUTION_SCALE; // matches DOM letterSpacing: 0.5px
    const lineHeight = 1.2; // matches DOM
    // Canvas text metrics can still differ slightly from DOM glyph rendering.
    // Use a more conservative margin to avoid clipping across fonts/devices.
    const fitScale = 1.0;

    const measureLine = (line, sizePx) => {
        ctx.font = `${fontStyle} ${fontWeight} ${sizePx}px ${fontFamily}`;
        const base = ctx.measureText(line).width;
        // CSS letter-spacing applies after every character including last
        const extra = (line?.length || 0) * letterSpacingPx;
        return base + extra;
    };

    const fitFontSizeHorizontal = () => {
        const hardMinPx = 1 * RESOLUTION_SCALE;
        // CRITICAL: Calculate the Editor's exact maxFontSizePx absolute limit.
        // This ensures the font stretches completely to the safety padding bounds unless it hits the hard cap.
        const maxPx = calculateMaxFontSize(bounds.width, side);

        const fits = (sizePx) => {
            const maxLineWidth = Math.max(0, ...rawLines.map(l => measureLine(l, sizePx)));
            const totalHeight = rawLines.length * sizePx * lineHeight;
            // Use different fit tolerance for FRONT vs BACK to better match DOM sizes
            // Use smaller fit tolerance to ensure designs don't touch the edges of the boundary box
            const fitTolerance = side === 'FRONT' ? 0.85 : 0.88;
            return (
                maxLineWidth <= bounds.width * fitTolerance &&
                totalHeight <= bounds.height * fitTolerance
            );
        };

        let lo = hardMinPx;
        let hi = maxPx;
        let best = hardMinPx;
        for (let i = 0; i < 16; i++) {
            const mid = (lo + hi) / 2;
            if (fits(mid)) {
                best = mid;
                lo = mid;
            } else {
                hi = mid;
            }
        }
        return best;
    };

    if (isVertical) {
        // Vertical text (writing-mode: vertical-rl in CSS)
        // For vertical, use height as the "inline-size" for cqi calculation.
        // IMPORTANT: use max line length (not total text.length which includes \n chars)
        const verticalCols = rawLines.map(l => l.trimStart()).filter(l => l.length > 0);
        const maxLineLen = Math.max(1, ...verticalCols.map(l => l.length));

        const VERTICAL_SCALE = 0.7; // matches BottlePreview.jsx safety factor
        // Directly compute like DOM does (BottlePreview.jsx verticalFittedFontSizePx)
        const maxFontSizeByHeight = (bounds.height / maxLineLen) * VERTICAL_SCALE;
        const maxFontSizeByWidth = (bounds.width / (verticalCols.length * 1.6)) * VERTICAL_SCALE;
        const maxAbsoluteSize = bounds.height * 0.3 * VERTICAL_SCALE;
        const fontSize = Math.max(8 * RESOLUTION_SCALE, Math.min(maxFontSizeByHeight, maxFontSizeByWidth, maxAbsoluteSize));
        ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;

        ctx.translate(centerX, centerY);
        ctx.rotate(-Math.PI / 2);

        // Create gradient AFTER transform so it's in the rotated coordinate space.
        // CSS uses a horizontal gradient (90deg = left-to-right in screen space).
        // After rotating 90deg clockwise:
        //   - Local +X maps to original +Y (down)
        //   - Local +Y maps to original -X (left)
        // To get a left-to-right gradient in original screen space, we need
        // the gradient to go from local +Y to local -Y (i.e., along local Y axis).
        const gradient = ctx.createLinearGradient(
            0, bounds.width / 2,    // maps to original left edge
            0, -bounds.width / 2    // maps to original right edge
        );
        // Use shared metallic tokens (pre-brightened ~10 % for canvas)
        const stops = getMetallicCanvasStops(selectedColor);
        stops.forEach(stop => {
            gradient.addColorStop(stop.offset, stop.color);
        });
        ctx.fillStyle = isProduction ? '#000000' : gradient;

        // Manual line breaks only — columns come from explicit newlines,
        // matching the DOM behaviour (whiteSpace: 'pre').
        //
        // In rotated coords (+90deg):
        // - text advances along +X, which maps to DOWN in the original canvas
        // - increasing Y maps to LEFT in the original canvas (new columns move left)
        const colAdvance = fontSize * 1.6; // MUST match BottlePreview.jsx: width / (lines.length * 1.6)

        // Columns are derived from user-typed newlines only (no auto-wrap).
        const columns = rawLines.map(l => l.trimStart()).filter(l => l.length > 0);
        if (!columns.length) columns.push('');

        // Center columns within the available width.
        // Column 0 is the "first" column (rightmost in vertical-rl), subsequent columns go left.
        const colsWidth = (columns.length - 1) * colAdvance;
        const startY = -colsWidth / 2;

        columns.forEach((run, colIdx) => {
            const y = startY + colIdx * colAdvance;
            // Draw character by character for vertical too to ensure spacing parity
            if (letterSpacingPx > 0) {
                const colWidth = measureLine(run, fontSize);
                let currentX = 0 - colWidth / 2;
                for (let i = 0; i < run.length; i++) {
                    const char = run[i];
                    ctx.fillText(char, currentX + ctx.measureText(char).width / 2, y);
                    currentX += ctx.measureText(char).width + letterSpacingPx;
                }
            } else {
                ctx.fillText(run, 0, y);
            }
        });
    } else {
        // Horizontal text: manual line breaks only; shrink-to-fit inside bounds.
        const fontSize = fitFontSizeHorizontal();
        const maxBaseFontSize = (bounds.width * (0.18 / 0.18)) * 0.42; // Hard cap at ~42% of boundary width
        const finalFontSize = Math.min(fontSize * 0.9 * 0.24, maxBaseFontSize);
        const lineSpacingFactor = 1.2;
        const totalHeight = rawLines.length * finalFontSize * lineSpacingFactor;

        // -------------------------------------------------------------------------
        // "Text-to-Path" / Flat Vector Simulation:
        // Render the entire text block to an offscreen buffer first.
        // This prevents font-engine memory leaks during multiple snapshot passes.
        // -------------------------------------------------------------------------
        const buffer = document.createElement('canvas');
        buffer.width = bounds.width;
        buffer.height = totalHeight + (20 * RESOLUTION_SCALE); // padding for descenders
        const btx = buffer.getContext('2d');

        btx.textAlign = 'center';
        btx.textBaseline = 'middle';
        btx.font = `${fontStyle} ${fontWeight} ${finalFontSize}px ${fontFamily}`;

        // Create gradient in buffer space
        const bufferBounds = { x: 0, y: 0, width: buffer.width, height: buffer.height };
        const gradient = createMetallicGradient(btx, bufferBounds, selectedColor);
        btx.fillStyle = isProduction ? '#000000' : gradient;

        const bCenterX = buffer.width / 2;
        const bCenterY = buffer.height / 2;
        const firstLineY = bCenterY - (totalHeight / 2) + (finalFontSize * lineSpacingFactor) / 2;

        rawLines.forEach((line, idx) => {
            const y = firstLineY + idx * finalFontSize * lineSpacingFactor;
            if (letterSpacingPx > 0) {
                const lineWidth = measureLine(line, finalFontSize);
                let currentX = bCenterX - lineWidth / 2;
                for (let i = 0; i < line.length; i++) {
                    const char = line[i];
                    btx.fillText(char, currentX + btx.measureText(char).width / 2, y);
                    currentX += btx.measureText(char).width + letterSpacingPx;
                }
            } else {
                btx.fillText(line, bCenterX, y);
            }
        });

        // Now draw the flattened text buffer onto the main canvas
        ctx.drawImage(buffer, bounds.x, centerY - buffer.height / 2);
    }

    ctx.restore();
};

/**
 * Parse CSS font size value and convert to pixels
 * Handles: em, cqi, px, and max/min expressions
 * 
 * @param {string} cssValue - CSS font size like "5em", "17cqi", "max(4px, min(50cqi, 17cqi))"
 * @param {number} boundsWidth - Width of container in pixels (for cqi calculation)
 * @param {number} baseFontSize - Base font size in pixels for em calculation
 * @returns {number} Font size in pixels
 */
export const parseCssFontSize = (cssValue, boundsWidth, baseFontSize = 16) => {
    if (!cssValue) return baseFontSize;

    const str = String(cssValue).trim();

    // Handle simple em values like "5em", "2.2em"
    if (/^[\d.]+em$/i.test(str)) {
        const emValue = parseFloat(str);
        // In the actual DOM, `em` resolves against the inherited font-size (typically 16px).
        // Using a fixed baseFontSize here matches CSS behavior and avoids size drift vs preview.
        return emValue * baseFontSize;
    }

    // Handle simple cqi values like "17cqi"
    if (/^[\d.]+cqi$/i.test(str)) {
        const cqiValue = parseFloat(str);
        return (boundsWidth / 100) * cqiValue;
    }

    // Helper to resolve units to pixels
    const resolveUnits = (valStr) => {
        if (!valStr) return 0;

        // Handle cqi (relative to container width)
        if (valStr.endsWith('cqi')) {
            return parseFloat(valStr) * (boundsWidth / 100);
        }

        // Handle em (relative to base font size)
        if (valStr.endsWith('em')) {
            return parseFloat(valStr) * baseFontSize;
        }

        // Handle px
        if (valStr.endsWith('px')) {
            return parseFloat(valStr) * RESOLUTION_SCALE;
        }

        // Default (assumed px or unitless)
        return parseFloat(valStr) * RESOLUTION_SCALE;
    };

    // If it's a simple value without max/min, just resolve it
    if (!str.startsWith('max(') && !str.startsWith('min(')) {
        return resolveUnits(str);
    }

    // Handle max/min expressions like "max(4px, min(150cqi, 17cqi))"
    // Extract numbers and units, resolve them, then evaluate the Math expression
    let expr = str;

    // Replace all unit values with their pixel equivalents
    expr = expr.replace(/([\d.]+)(cqi|em|px)/g, (_, num, unit) => {
        return resolveUnits(num + unit);
    });

    try {
        // Safe eval using Function constructor with only Math operations.
        // Replace max/min with Math counterparts.
        const evalExpr = expr
            .replace(/max/g, 'Math.max')
            .replace(/min/g, 'Math.min');
        return new Function('return ' + evalExpr)();
    } catch (e) {
        console.warn('Failed to evaluate CSS font size expression:', str, e);
        return baseFontSize;
    }
};

/**
 * Draw monogram on canvas using proper sizing from getMonogramFontSize
 * 
 * @param {CanvasRenderingContext2D} ctx 
 * @param {string} monogramInput 
 * @param {string} selectedMonogram 
 * @param {object} bounds - {x, y, width, height}
 * @param {string} selectedColor 
 * @param {string} side - 'FRONT' or 'BACK'
 * @param {number} monogramScale - scale factor
 * @param {boolean} isProduction - force black/white
 */
const drawMonogramOnCanvas = (ctx, monogramInput, selectedMonogram, bounds, selectedColor, side, monogramScale = 1, isProduction = false) => {
    if (!monogramInput || !shouldDisplayMonogram(selectedMonogram, monogramInput.length)) return;

    ctx.save();
    // Apply metallic filters to match the editor style
    if (!isProduction) {
        ctx.filter = 'contrast(1.4) brightness(1.2) drop-shadow(0 2px 4px rgba(0,0,0,0.3)) saturate(0.9)';
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;

    let displayText = monogramInput;
    let fontFamily = 'sans-serif';
    let offsetX = 0;
    const monogramStyle = monogramStyles.find(m => m.name === selectedMonogram);

    // Get font size from monogramConfig (same as BottlePreview uses)
    const cssFontSize = getMonogramFontSize(selectedMonogram, side, monogramInput.length, false);

    // Directly use the monogramScale provided by the caller (Customizer.jsx)
    let fontSize = parseCssFontSize(cssFontSize, bounds.width) * monogramScale;
    const maxMonogramWidth = bounds.width * 0.9;

    // Quick test draw to check width
    ctx.font = `${fontSize}px ${fontFamily}`;
    let measuredWidth = ctx.measureText(displayText).width;

    // If it's too wide for the box, shrink it down
    if (measuredWidth > maxMonogramWidth) {
        fontSize *= (maxMonogramWidth / measuredWidth);
    }

    if (usesCircleGlyphs(selectedMonogram)) {
        displayText = convertToCircleGlyphs(monogramInput, selectedMonogram);
        fontFamily = getCircleFontFamily(monogramInput.length);
    } else if (usesNGramGlyphs(selectedMonogram)) {
        displayText = convertToNGramGlyphs(monogramInput);
        fontFamily = getNGramFontFamily(monogramInput.length);
        // N-Gram monogram has a slight left offset in the UI (margin-left: .1em) on BACK only
        if (side === 'BACK') {
            offsetX = fontSize * 0.05;
        }
    } else if (monogramStyle) {
        fontFamily = monogramStyle.style?.fontFamily || 'sans-serif';
        // Handle maxLength === 1 monograms
        if (monogramStyle.maxLength === 1) {
            displayText = monogramInput.charAt(0);
        }
    }

    // CSS applies gradient to a span.block which takes 100% width of the bounding box,
    // but its height is determined by the text's line height.
    const lineHeightRatio = selectedMonogram === 'Vine' ? 2.4 : 1.4;
    const textHeight = fontSize * lineHeightRatio;

    const gradientBounds = {
        x: bounds.x,
        y: centerY - textHeight / 2,
        width: bounds.width,
        height: textHeight
    };

    // Use metallic gradient instead of solid color
    const gradient = createMetallicGradient(ctx, gradientBounds, selectedColor);
    ctx.fillStyle = isProduction ? '#000000' : gradient;

    ctx.font = `normal normal ${fontSize}px ${fontFamily}`;

    // For middleLarger style (like Roman), draw with size variations
    if (monogramStyle?.middleLarger && monogramInput.length === 3) {
        const smallSize = fontSize * 0.75;
        const largeSize = fontSize;

        // Draw left character (smaller)
        ctx.font = `normal normal ${smallSize}px ${fontFamily}`;
        const leftMetrics = ctx.measureText(monogramInput[0]);

        // Draw middle character (larger)
        ctx.font = `normal normal ${largeSize}px ${fontFamily}`;
        const middleMetrics = ctx.measureText(monogramInput[1]);

        // Draw right character (smaller)
        ctx.font = `normal normal ${smallSize}px ${fontFamily}`;
        const rightMetrics = ctx.measureText(monogramInput[2]);

        const totalWidth = leftMetrics.width + middleMetrics.width + rightMetrics.width;
        let currentX = centerX - totalWidth / 2;

        // Draw each character
        ctx.font = `normal normal ${smallSize}px ${fontFamily}`;
        ctx.fillText(monogramInput[0], currentX + leftMetrics.width / 2, centerY);
        currentX += leftMetrics.width;

        ctx.font = `normal normal ${largeSize}px ${fontFamily}`;
        ctx.fillText(monogramInput[1], currentX + middleMetrics.width / 2, centerY);
        currentX += middleMetrics.width;

        ctx.font = `normal normal ${smallSize}px ${fontFamily}`;
        ctx.fillText(monogramInput[2], currentX + rightMetrics.width / 2, centerY);
    } else if (selectedMonogram === 'Vine') {
        // Vine monogram: apply letter-spacing manually (canvas doesn't support CSS letter-spacing)
        // From monogramConfig: letterSpacing: '.55em'
        // Note: CSS marginLeft (0.6em) compensates for letter-spacing's trailing space,
        // but our canvas implementation doesn't add trailing space, so we skip marginLeft.
        const letterSpacing = fontSize * 0.55; // Convert em to px

        // Measure total width including spacing (no trailing space after last char)
        let totalWidth = 0;
        const charWidths = [];
        for (let i = 0; i < displayText.length; i++) {
            const charWidth = ctx.measureText(displayText[i]).width;
            charWidths.push(charWidth);
            totalWidth += charWidth;
            if (i < displayText.length - 1) {
                totalWidth += letterSpacing;
            }
        }

        // Start position (centered)
        let currentX = centerX - totalWidth / 2;

        // Draw each character with spacing
        for (let i = 0; i < displayText.length; i++) {
            ctx.fillText(displayText[i], currentX + charWidths[i] / 2, centerY);
            currentX += charWidths[i] + letterSpacing;
        }
    } else {
        // Standard monogram drawing
        ctx.fillText(displayText, centerX + offsetX, centerY);
    }

    ctx.restore();
};

/**
 * Draw graphic on canvas with gradient masking for gallery SVGs
 */
const drawGraphicOnCanvas = async (ctx, graphic, bounds, selectedColor, maxPercent = 0.75, isProduction = false) => {
    if (!graphic || !graphic.src) return;

    try {
        const maskSrc = graphic.isUpload ? graphic.maskSrc : graphic.src;
        const sourceSrc = maskSrc || graphic.src;
        const img = await loadImage(sourceSrc);

        const scale = graphic.scale || 0.6;
        const imgAspect = img.width / img.height;

        // 3. Absolute Scaling & Relative Centering (Matches Monogram)
        // Unified to use the same 0.5 global shrink
        const globalShrink = 0.25; // Shrunk by an additional 50% (total 0.25 effective) to match monogram scale
        const effectiveScale = scale;
        const drawWidth = bounds.width * effectiveScale * globalShrink;
        const drawHeight = drawWidth / imgAspect;

        const centerX = bounds.x + (bounds.width / 2);
        const drawX = centerX - (drawWidth / 2);

        // Final height constraint: ensure graphic never stretches taller than the allowed boundary box (avoids Football stretching)
        const finalDrawHeight = Math.min(drawHeight, bounds.height * 0.9);
        const drawY = bounds.y + (bounds.height - finalDrawHeight) / 2;

        ctx.save();

        // Final protection: Clip the drawing area to the boundary box. 
        // This physically stops the football.svg from bleeding outside its area.
        ctx.beginPath();
        ctx.rect(bounds.x, bounds.y, bounds.width, bounds.height);
        ctx.clip();

        const useMetalMask = !graphic.isUpload || !!graphic.maskSrc;

        // Match BottlePreview behavior
        if (useMetalMask) {
            // Metallic gradient with mask (gallery SVGs and uploads with mask)
            // Create a temporary canvas for the gradient + mask composition
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = drawWidth;
            tempCanvas.height = drawHeight;
            const tempCtx = tempCanvas.getContext('2d');

            // Step 1: Fill the temp canvas with metallic gradient or solid black
            const tempBounds = { x: 0, y: 0, width: drawWidth, height: drawHeight };
            if (isProduction) {
                tempCtx.fillStyle = '#000000';
            } else {
                const gradient = createMetallicGradient(tempCtx, tempBounds, selectedColor);
                tempCtx.fillStyle = gradient;
                tempCtx.filter = 'contrast(1.4) brightness(1.2) drop-shadow(0 2px 4px rgba(0,0,0,0.3)) saturate(0.9)';
            }
            tempCtx.fillRect(0, 0, drawWidth, drawHeight);

            // Step 2: Apply the graphic as a mask using destination-in
            tempCtx.globalCompositeOperation = 'destination-in';
            tempCtx.drawImage(img, 0, 0, drawWidth, drawHeight);

            // Step 3: Draw the masked gradient result onto the main canvas
            ctx.globalAlpha = 1;

            ctx.drawImage(tempCanvas, drawX, drawY);
        } else {
            // Uploaded images without mask fallback to grayscale
            ctx.filter = isProduction ? 'brightness(0)' : 'grayscale(100%) contrast(1.2) brightness(1.2)';
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = isProduction ? 1 : 0.9;
            ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
        }

        ctx.restore();
    } catch (err) {
        console.warn('Failed to load graphic for canvas capture:', err);
    }
};

/**
 * Draw jersey elements (name and number) on canvas
 */
const drawJerseyOnCanvas = (ctx, name, number, bounds, selectedFont, fonts, selectedColor, scale, isProduction = false) => {
    const fontFamily = getFontFamily(selectedFont, fonts);
    const fontWeight = 'bold'; // Jersey is always bold

    // Apply metallic filters to match the editor style
    if (!isProduction) {
        ctx.filter = 'contrast(1.4) brightness(1.2) drop-shadow(0 2px 4px rgba(0,0,0,0.3)) saturate(0.9)';
    }

    const gradient = createMetallicGradient(ctx, bounds, selectedColor);
    ctx.fillStyle = isProduction ? '#000000' : gradient;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;
    const gap = 0; // Match BottlePreview gap-0

    const cqi = bounds.width / 100;

    // Apply global 0.5 shrink for Review Screen parity
    const globalShrink = 0.5;
    const nameSize = Math.max(8 * RESOLUTION_SCALE, 20 * cqi) * scale * nameLengthScale * globalShrink;
    const numberSize = Math.max(8 * RESOLUTION_SCALE, (number && number.length > 1 ? 75 : 90) * cqi) * scale * globalShrink;

    // Apply a small vertical nudge up (1.5% of container height) to compensate for visual shift on review screen
    const nudge = -bounds.height * 0.015;

    let nameY = centerY + nudge;
    let numberY = centerY + nudge;

    if (name && number) {
        const blockHeight = nameSize + gap + numberSize;
        const top = (centerY + nudge) - blockHeight / 2;
        nameY = top + nameSize / 2;
        numberY = nameY + nameSize / 2 + gap + numberSize / 2;
    } else if (name) {
        nameY = centerY + nudge;
    } else if (number) {
        numberY = centerY + nudge;
    }

    if (name) {
        ctx.font = `${fontWeight} ${nameSize}px ${fontFamily}`;
        ctx.fillText(name.toUpperCase(), centerX, nameY);
    }

    if (number) {
        ctx.font = `${fontWeight} ${numberSize}px ${fontFamily}`;
        ctx.fillText(number, centerX, numberY);
    }
};

// =============================================================================
// Auto-Crop Transparent Pixels
// =============================================================================

/**
 * Trim transparent pixels from all edges of a canvas, but strictly maintain 
 * the horizontal center point (symmetrical horizontal crop).
 */
const trimSymmetrical = (sourceCanvas, padding = 10) => {
    const ctx = sourceCanvas.getContext('2d');
    const w = sourceCanvas.width;
    const h = sourceCanvas.height;
    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;

    let top = h, bottom = 0, left = w, right = 0;

    // Scan pixels for content bounding box
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const alpha = data[(y * w + x) * 4 + 3];
            if (alpha > 5) {
                if (y < top) top = y;
                if (y > bottom) bottom = y;
                if (x < left) left = x;
                if (x > right) right = x;
            }
        }
    }

    // Fallback if no content found
    if (top > bottom || left > right) return sourceCanvas;

    const centerX = w / 2;
    // Calculate the maximum horizontal distance from the center to any pixel.
    // This allows us to crop dead space on the right (like shadows) while keeping
    // the bottle perfectly in the middle of the exported image.
    const maxHorizDist = Math.max(Math.abs(centerX - left), Math.abs(centerX - right));

    // Force symmetrical horizontal bounds around the center to prevent 'jumpy' alignment shifts
    const finalLeft = Math.max(0, Math.floor(centerX - maxHorizDist - padding));
    const finalRight = Math.min(w - 1, Math.ceil(centerX + maxHorizDist + padding));

    // Tight vertical crop to maximize the bottle's large appearance in the Review Screen
    const finalTop = Math.max(0, top - padding);
    const finalBottom = Math.min(h - 1, bottom + padding);

    const croppedWidth = finalRight - finalLeft + 1;
    const croppedHeight = finalBottom - finalTop + 1;

    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = croppedWidth;
    croppedCanvas.height = croppedHeight;
    const croppedCtx = croppedCanvas.getContext('2d');

    croppedCtx.drawImage(
        sourceCanvas,
        finalLeft, finalTop, croppedWidth, croppedHeight,
        0, 0, croppedWidth, croppedHeight
    );

    return croppedCanvas;
};

// =============================================================================
// Main Capture Functions
// =============================================================================

/**
 * Capture bottle snapshot using canvas compositor
 * @param {string} side - 'FRONT' or 'BACK'
 * @param {object} customization - The customization state object
 * @param {string} selectedColor - The selected bottle color
 * @param {string} selectedFont - The selected font name
 * @param {string} selectedMonogram - The selected monogram style
 * @param {array} fonts - Array of font objects with name and style
 * @returns {Promise<string>} - PNG data URL
 */
export const captureBottleSnapshotCanvas = async (
    side,
    customization,
    selectedColor,
    selectedFont,
    selectedMonogram,
    fonts,
    monogramScale = 1,
    isMobile = false, // Received from caller (matches editor state)
    bottleImageSrc = null, // External URL override (e.g. SWIGGER CDN image)
    selectedSize = '1liter' // Used for correct bounds lookup
) => {
    const canvas = document.createElement('canvas');
    canvas.width = BOTTLE_CANVAS_WIDTH;
    canvas.height = BOTTLE_CANVAS_HEIGHT;
    const ctx = canvas.getContext('2d');

    // Wait for fonts to be ready
    if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
    }

    // 1. Draw bottle base image
    const bottleImagePath = bottleImageSrc || (side === 'FRONT'
        ? `bottle/voor/${selectedColor}-${selectedSize}-voor.png`
        : `bottle/achter/${selectedColor}-${selectedSize}-achter.png`);

    try {
        const bottleImg = await loadImage(bottleImagePath);
        // CRITICAL: Use drawImageContain to avoid stretching the bottle height/width.
        // This matches the Editor's <img object-contain> and preserves the bottle aspect ratio.
        drawImageContain(ctx, bottleImg, 0, 0, BOTTLE_CANVAS_WIDTH, BOTTLE_CANVAS_HEIGHT);
    } catch (err) {
        console.warn('Failed to load bottle image:', err);
        // Fill with a placeholder background
        ctx.fillStyle = '#f3f4f6';
        ctx.fillRect(0, 0, BOTTLE_CANVAS_WIDTH, BOTTLE_CANVAS_HEIGHT);
    }

    // 2. Get customization for this side
    const config = customization[side];
    const textInput = config?.text || '';
    const monogramInput = config?.monogram || '';
    const graphicInput = config?.graphic || null;
    const isVertical = side === 'BACK' && config?.isVertical;

    // 3. Draw overlays - use caller's isMobile state and selectedSize
    const SIZE_POSITIONS = isMobile ? MOBILE_POSITIONS : DESKTOP_POSITIONS;
    // Fallback to 1liter configuration if size not found (for legacy support)
    const positions = SIZE_POSITIONS[selectedSize]?.[side] || SIZE_POSITIONS['1liter'][side];

    // Use side-specific text positions from capturePositions.js
    const textPos = (side === 'BACK' && config?.isVertical)
        ? positions.textVertical
        : positions.text;

    // Draw text
    if (textInput) {
        const textBounds = getPixelBounds(textPos, BOTTLE_CANVAS_WIDTH, BOTTLE_CANVAS_HEIGHT, side);
        const fontFamily = getFontFamily(selectedFont, fonts);
        const fontWeight = getFontWeight(selectedFont, fonts);
        const fontStyle = getFontStyle(selectedFont, fonts);

        drawTextOnCanvas(
            ctx,
            textInput,
            textBounds,
            fontFamily,
            fontWeight,
            fontStyle,
            selectedColor,
            side,
            isVertical,
            0.92, // Matches editor safety multiplier
            false // isProduction is false for bottle preview
        );
    }

    // Draw monogram
    if (monogramInput) {
        const monogramBounds = getPixelBounds(positions.monogram, BOTTLE_CANVAS_WIDTH, BOTTLE_CANVAS_HEIGHT, side);
        drawMonogramOnCanvas(ctx, monogramInput, selectedMonogram, monogramBounds, selectedColor, side, monogramScale);
    }

    // Draw graphic
    if (graphicInput) {
        const graphicBounds = getPixelBounds(positions.graphic, BOTTLE_CANVAS_WIDTH, BOTTLE_CANVAS_HEIGHT, side);
        await drawGraphicOnCanvas(ctx, graphicInput, graphicBounds, selectedColor); // Removed all overrides
    }

    // Draw jersey
    if (config.jerseyNumber || config.jerseyName) {
        const jerseyBounds = getPixelBounds(positions.jersey || positions.text, BOTTLE_CANVAS_WIDTH, BOTTLE_CANVAS_HEIGHT, side);
        drawJerseyOnCanvas(
            ctx,
            config.jerseyName,
            config.jerseyNumber,
            jerseyBounds,
            selectedFont,
            fonts,
            selectedColor,
            config.jerseyScale || 1.0
        );
    }

    // 4. Return cropped canvas that is tightly height-fitted but horizontally symmetrical.
    // This removes 'dead weight' white space while strictly locking the bottle to the center.
    const croppedCanvas = trimSymmetrical(canvas, 10);
    return croppedCanvas.toDataURL('image/png');
};

/**
 * Capture design-only snapshot (no bottle, just the design element)
 * @param {string} side - 'FRONT' or 'BACK'
 * @param {object} customization - The customization state object
 * @param {string} selectedColor - The selected bottle color
 * @param {string} selectedFont - The selected font name
 * @param {string} selectedMonogram - The selected monogram style
 * @param {array} fonts - Array of font objects with name and style
 * @returns {Promise<string|null>} - PNG data URL or null if no content
 */
export const captureDesignSnapshotCanvas = async (
    side,
    customization,
    selectedColor,
    selectedFont,
    selectedMonogram,
    fonts,
    monogramScale = 1,
    isProduction = false,
    isMobile = false, // Received from caller
    selectedSize = '1liter' // Used for correct bounds lookup
) => {
    const config = customization[side];
    const textInput = config?.text || '';
    const monogramInput = config?.monogram || '';
    const graphicInput = config?.graphic || null;

    // Return null if no content
    if (!textInput && !monogramInput && !graphicInput && !config?.jerseyName && !config?.jerseyNumber) {
        return null;
    }

    const canvas = document.createElement('canvas');
    canvas.width = DESIGN_CANVAS_SIZE;
    canvas.height = DESIGN_CANVAS_SIZE;
    const ctx = canvas.getContext('2d');

    // Wait for fonts to be ready
    if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
    }

    // Transparent background (default)
    ctx.clearRect(0, 0, DESIGN_CANVAS_SIZE, DESIGN_CANVAS_SIZE);

    // Design bounds fill the canvas with some padding
    const padding = 20 * RESOLUTION_SCALE;
    const bounds = {
        x: padding,
        y: padding,
        width: DESIGN_CANVAS_SIZE - padding * 2,
        height: DESIGN_CANVAS_SIZE - padding * 2
    };

    const isVertical = side === 'BACK' && config?.isVertical;

    // Draw text - use 'white' bottle color for dark gradient
    if (textInput) {
        const fontFamily = getFontFamily(selectedFont, fonts);
        const fontWeight = getFontWeight(selectedFont, fonts);
        const fontStyle = getFontStyle(selectedFont, fonts);
        drawTextOnCanvas(ctx, textInput, bounds, fontFamily, fontWeight, fontStyle, 'white', side, isVertical, monogramScale * 0.5, isProduction);
    }

    // Draw monogram
    if (monogramInput && shouldDisplayMonogram(selectedMonogram, monogramInput.length)) {
        // For design capture, we use a fixed dark color
        drawMonogramOnCanvas(ctx, monogramInput, selectedMonogram, bounds, 'white', side, monogramScale, isProduction); // 'white' bottle gives dark text
    }

    // Draw graphic
    if (graphicInput) {
        await drawGraphicOnCanvas(ctx, graphicInput, bounds, 'white', 0.75, isProduction);
    }

    // Draw jersey
    if (config.jerseyNumber || config.jerseyName) {
        drawJerseyOnCanvas(
            ctx,
            config.jerseyName,
            config.jerseyNumber,
            bounds,
            selectedFont,
            fonts,
            'white', // Use 'white' bottle color so text is dark for design capture
            config.jerseyScale || 1.0,
            isProduction
        );
    }

    return canvas.toDataURL('image/png');
};



