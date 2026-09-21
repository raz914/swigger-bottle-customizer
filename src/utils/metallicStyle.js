/**
 * Shared metallic gradient tokens for engraving effects.
 *
 * Single source of truth consumed by:
 *   - BottlePreview.jsx  (live preview – CSS gradient)
 *   - DesignCapture.jsx  (design capture – CSS gradient)
 *   - UploadView.jsx     (upload preview – CSS gradient)
 *   - canvasCapture.js   (canvas export – pre-brightened color stops)
 *
 * White bottle gets a darker gradient so engravings remain clearly visible
 * against the light bottle surface.
 */

// ---------------------------------------------------------------------------
// 1. Digital Simulation: SHARP Brushed Steel Texture (CSS Pattern)
// Uses vector-based lines instead of noise to ensure 100% sharpness (no blur).
// Horizontal grain (0deg) – fine 1px lines to mimic Yeti brushed steel.
// ---------------------------------------------------------------------------
const STEEL_TEXTURE_CSS = `repeating-linear-gradient(0deg, 
    transparent 0px, 
    transparent 1px, 
    rgba(0,0,0,0.04) 1px, 
    rgba(0,0,0,0.04) 2px,
    transparent 2px,
    transparent 6px,
    rgba(0,0,0,0.01) 6px,
    rgba(0,0,0,0.01) 7px
)`;

// ---------------------------------------------------------------------------
// 2. Anisotropic Reflection Gradient (3D Yeti Style)
// 40% Chrome Peak | 30% Core Shadow | 30% Secondary Mid/Rim
// ---------------------------------------------------------------------------
const ANISOTROPIC_STEEL_GRADIENT = `linear-gradient(105deg, 
    #7a7c82 0%,    /* Edge Shadow Start */
    #7a7c82 5%,    /* Edge Shadow End */
    #9fa1a6 25%,   /* Plate Starts */
    #8c8e94 35%,   /* Core Shadow 1 */
    #ffffff 50%,   /* Peak */
    #8c8e94 65%,   /* Core Shadow 2 */
    #9fa1a6 75%,   /* Plate Ends */
    #7a7c82 95%,   /* Edge Shadow Start */
    #7a7c82 100%   /* Edge Shadow End */
)`;

// ---------------------------------------------------------------------------
// 3. High-Contrast Metallic Gradient (Universal)
// Forces a bright silver peak (#FFFFFF) and high-contrast edges for visibility.
// ---------------------------------------------------------------------------
const UNIVERSAL_STEEL_GRADIENT = `linear-gradient(90deg, 
    #fafafa 0%, #606060 10%, #fafafa 15%, #fafafa 17%, #606060 22%, 
    #fafafa 25%, #fafafa 35%, #606060 45%, #ffffff 50%, #ffffff 52%, 
    #606060 57%, #fafafa 60%, #fafafa 70%, #606060 80%, #fafafa 85%, 
    #fafafa 87%, #606060 92%, #fafafa 100%
)`;

/**
 * Return a CSS gradient string for the metallic engraving effect (brushed steel).
 * @param {string} selectedColor - Bottle colour id ('white', 'black', etc.)
 * @returns {string} CSS background value (multiple layers)
 */
export const getMetallicGradientCSS = (selectedColor) => {
    return `
        ${STEEL_TEXTURE_CSS},
        ${UNIVERSAL_STEEL_GRADIENT}
    `;
};

/**
 * Universal Blend Mode for Metallic Engraving
 * Uses 'normal' (CSS) / 'source-over' (Canvas) to ensure the 
 * opaque silver gradient is visible on both white and black bottles.
 */
export const getMetallicBlendMode = () => 'normal';

/**
 * Universal Metallic Filter (High Contrast)
 * Optimized for both light and dark backgrounds.
 */
export const getMetallicTextFilterCSS = (color) => {
    return 'contrast(1.4) brightness(1.2) drop-shadow(0 2px 4px rgba(0,0,0,0.4)) saturate(0.8)';
};

export const getMetallicVibrancyFilter = (ctx) => {
    ctx.filter = 'drop-shadow(0.5px 0.5px 0.5px rgba(0,0,0,0.2))';
};
/**
 * Whether metallic text should use shadow in canvas export.
 */
export const shouldUseMetallicTextShadow = (selectedColor) => true;

// ---------------------------------------------------------------------------
// Canvas colour-stop values (pre-brightened ≈ +15 %)
// ---------------------------------------------------------------------------

const CANVAS_STOPS = [
    { offset: 0.00,  color: '#fafafa' },
    { offset: 0.10,  color: '#606060' },
    { offset: 0.15,  color: '#fafafa' },
    { offset: 0.17,  color: '#fafafa' },
    { offset: 0.22,  color: '#606060' },
    { offset: 0.25,  color: '#fafafa' },
    { offset: 0.35,  color: '#fafafa' },
    { offset: 0.45,  color: '#606060' },
    { offset: 0.50,  color: '#ffffff' },
    { offset: 0.52,  color: '#ffffff' },
    { offset: 0.57,  color: '#606060' },
    { offset: 0.60,  color: '#fafafa' },
    { offset: 0.70,  color: '#fafafa' },
    { offset: 0.80,  color: '#606060' },
    { offset: 0.85,  color: '#fafafa' },
    { offset: 0.87,  color: '#fafafa' },
    { offset: 0.92,  color: '#606060' },
    { offset: 1.00,  color: '#fafafa' }
];

export const getMetallicCanvasStops = (selectedColor) => CANVAS_STOPS;

/**
 * Return a safely quoted CSS `url("...")` value.
 */
export const cssUrl = (value) => {
    if (!value || typeof value !== 'string') return 'none';
    return `url("${value.replace(/"/g, '\\"')}")`;
};



