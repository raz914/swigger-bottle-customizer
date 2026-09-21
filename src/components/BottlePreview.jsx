import React, { useMemo, useRef, useState, useEffect, useLayoutEffect } from 'react';
import { monogramStyles, getMonogramFontSize, shouldDisplayMonogram, convertToCircleGlyphs, getCircleFontFamily, usesCircleGlyphs, convertToNGramGlyphs, getNGramFontFamily, usesNGramGlyphs } from '../data/monogramConfig';
import { DESKTOP_POSITIONS, MOBILE_POSITIONS, GRAPHIC_MAX_SIZE } from '../data/capturePositions';
import { parseCssFontSize } from '../utils/canvasCapture';
import { cssUrl } from '../utils/metallicStyle';
import { t } from '../i18n';

const BottlePreview = ({
    side, // 'FRONT' or 'BACK'
    customization,
    selectedColor,
    selectedSize = '1liter', // '1liter' or '500ml'
    selectedFont,
    selectedMonogram,
    fonts,
    isMobile,
    isImageLoading,
    setIsImageLoading,
    view, // 'main', 'text', 'monogram', 'capture' etc.
    monogramScale = 1, // Scale factor for monogram font size (< 1 to shrink for capture)
    bottleImageSrc = null // External image URL override (e.g. Swigger from CDN)
}) => {
    const imgRef = useRef(null);

    // Dynamic scaling factor based on bottle size
    // 1L = 0.9 (slightly smaller than previous default), 500ml = 0.7
    const sizeScaleFactor = selectedSize === '536ml' ? 0.9 : 0.9;

    const isCapture = view === 'capture';
    const isVertical = side === 'BACK' && customization.BACK?.isVertical;

    // Compute effective monogram scale: compensate for CSS zoom applied in feature (non-main) views
    // so monograms look the same visual size on screen in main and feature modes.
    const featureZoom = (!isCapture && view && view !== 'main')
        ? (isMobile ? 1.4 : 1.45)
        : 1;
    const effectiveMonogramScale = monogramScale / featureZoom;


    // Helper to get position with vertical text handling
    const getPositions = (positionsObj) => {
        const sidePos = positionsObj[selectedSize]?.[side] || positionsObj['946ml']?.[side];
        if (!sidePos) return {};
        return {
            ...sidePos,
            text: isVertical && sidePos.textVertical ? sidePos.textVertical : sidePos.text,
            boundary: isVertical && sidePos.boundaryVertical ? sidePos.boundaryVertical : sidePos.boundary,
        };
    };

    // Tailwind classes for responsive mode (normal viewing)
    // Size-dependent positioning: 1L and 500ml bottles have different body widths
    const FRONT_CONFIG = {
        '946ml': {
            // Restore original constraints for elements so they don't render too large
            text: "top-[50%] lg:top-[50%] left-[35%] lg:left-[35%] right-[42%] lg:right-[42%] bottom-[34%] lg:bottom-[34%]",
            monogram: "top-[50%] lg:top-[50%] left-[33%] lg:left-[33%] right-[40%] lg:right-[40%] bottom-[34%] lg:bottom-[34%]",
            graphic: "top-[47%] lg:top-[47%] left-[33%] lg:left-[33%] right-[40%] lg:right-[40%] bottom-[31%] lg:bottom-[31%]",
            // Adjust visual boundary to exactly touch the B logo and BE FIT text without overlapping
            boundary: "top-[47.5%] lg:top-[47.5%] left-[31%] lg:left-[31%] right-[38%] lg:right-[38%] bottom-[30.5%] lg:bottom-[30.5%]",
            zoom: "scale-[1.4] lg:scale-[1.45]"
        },
        '536ml': {
            // Restore original constraints
            text: "top-[50%] lg:top-[50%] left-[36%] lg:left-[36%] right-[39%] lg:right-[39%] bottom-[34%] lg:bottom-[34%]",
            monogram: "top-[48%] lg:top-[48%] left-[33%] lg:left-[33%] right-[36%] lg:right-[36%] bottom-[34%] lg:bottom-[34%]",
            graphic: "top-[50%] lg:top-[49%] left-[35%] lg:left-[35%] right-[38%] lg:right-[38%] bottom-[35%] lg:bottom-[35%]",
            // Adjust visual boundary
            boundary: "top-[48.5%] lg:top-[48.5%] left-[31%] lg:left-[31%] right-[34%] lg:right-[34%] bottom-[33%] lg:bottom-[33%]",
            zoom: "scale-[1.4] lg:scale-[1.45]"
        }
    };

    const BACK_CONFIG = {
        '946ml': {
            text: (side === 'BACK' && customization.BACK?.isVertical)
                ? "top-[50%] lg:top-[39%] left-[36%] lg:left-[36%] right-[28%] lg:right-[28%] bottom-[12%] lg:bottom-[6%]"
                : "top-[39%] lg:top-[39%] left-[39%] lg:left-[39%] right-[31%] lg:right-[31%] bottom-[30%] lg:bottom-[30%]",
            monogram: "top-[20%] lg:top-[20%] left-[38%] lg:left-[38%] right-[30%] lg:right-[30%] bottom-[24%] lg:bottom-[26%]",
            graphic: "top-[20%] lg:top-[20%] left-[38%] lg:left-[38%] right-[30%] lg:right-[30%] bottom-[24%] lg:bottom-[26%]",
            boundary: (side === 'BACK' && customization.BACK?.isVertical)
                ? "top-[39%] lg:top-[39%] left-[33%] lg:left-[33%] right-[33%] lg:right-[33%] bottom-[25%] lg:bottom-[25%]"
                : "top-[39.5%] lg:top-[40.5%] left-[33%] lg:left-[33%] right-[33%] lg:right-[33%] bottom-[31%] lg:bottom-[31%]",
            zoom: "scale-[1.4] lg:scale-[1.45]"
        },
        '710ml': {
            text: (side === 'BACK' && customization.BACK?.isVertical)
                ? "top-[50%] lg:top-[39%] left-[36%] lg:left-[36%] right-[28%] lg:right-[28%] bottom-[12%] lg:bottom-[6%]"
                : "top-[39%] lg:top-[39%] left-[39%] lg:left-[39%] right-[31%] lg:right-[31%] bottom-[30%] lg:bottom-[30%]",
            monogram: "top-[20%] lg:top-[20%] left-[38%] lg:left-[38%] right-[30%] lg:right-[30%] bottom-[24%] lg:bottom-[26%]",
            graphic: "top-[20%] lg:top-[20%] left-[38%] lg:left-[38%] right-[30%] lg:right-[30%] bottom-[24%] lg:bottom-[26%]",
            boundary: (side === 'BACK' && customization.BACK?.isVertical)
                ? "top-[39%] lg:top-[39%] left-[33%] lg:left-[33%] right-[33%] lg:right-[33%] bottom-[25%] lg:bottom-[25%]"
                : "top-[39.5%] lg:top-[40.5%] left-[33%] lg:left-[33%] right-[33%] lg:right-[33%] bottom-[31%] lg:bottom-[31%]",
            zoom: "scale-[1.4] lg:scale-[1.45]"
        },
        '536ml': {
            text: (side === 'BACK' && customization.BACK?.isVertical)
                ? "top-[50%] lg:top-[50%] left-[38%] lg:left-[38%] right-[34%] lg:right-[34%] bottom-[10%] lg:bottom-[12%]"
                : "top-[33%] lg:top-[33%] left-[38%] lg:left-[38%] right-[34%] lg:right-[34%] bottom-[24%] lg:bottom-[26%]",
            monogram: "top-[20%] lg:top-[20%] left-[38%] lg:left-[38%] right-[34%] lg:right-[34%] bottom-[24%] lg:bottom-[26%]",
            graphic: "top-[20%] lg:top-[20%] left-[38%] lg:left-[38%] right-[34%] lg:right-[34%] bottom-[24%] lg:bottom-[26%]",
            boundary: (side === 'BACK' && customization.BACK?.isVertical)
                ? "top-[39%] lg:top-[39%] left-[33%] lg:left-[33%] right-[33%] lg:right-[33%] bottom-[25%] lg:bottom-[25%]"
                : "top-[39.5%] lg:top-[40.5%] left-[33%] lg:left-[33%] right-[33%] lg:right-[33%] bottom-[31%] lg:bottom-[31%]",
            zoom: "scale-[1.4] lg:scale-[1.45]"
        }
    };

    const SIDE_CONFIG = {
        FRONT: FRONT_CONFIG[selectedSize] || FRONT_CONFIG['946ml'],
        BACK: BACK_CONFIG[selectedSize] || BACK_CONFIG['946ml']
    };

    // Use mobile positions for capture mode on mobile devices
    const capturePos = (isCapture && isMobile) ? getPositions(MOBILE_POSITIONS) : getPositions(DESKTOP_POSITIONS);
    const currentConfig = isCapture ? capturePos : SIDE_CONFIG[side];

    // Dynamically calculate the box width in pixels for accurate CQI font size resolution during capture
    const boxWidthPx = useMemo(() => {
        if (!isCapture) return 0;
        try {
            const leftMatch = currentConfig.monogram?.match(/left-\[(\d+)%\]/);
            const rightMatch = currentConfig.monogram?.match(/right-\[(\d+)%\]/);
            if (leftMatch && rightMatch) {
                const left = parseInt(leftMatch[1]);
                const right = parseInt(rightMatch[1]);
                return 433 * ((100 - left - right) / 100);
            }
        } catch (e) {
            console.warn('Failed to parse box width for monogram scaling', e);
        }
        return 433 * 0.37; // Fallback to 946ml default width
    }, [currentConfig, isCapture]);

    // Helper to apply effectiveMonogramScale to CSS font-size strings
    const scaleMonogramSize = (sizeStr) => {
        if (!sizeStr) return sizeStr;
        if (isCapture) {
            // Force pixel resolution for snapshots to avoid CSS container-type issues
            return `${parseCssFontSize(sizeStr, boxWidthPx, 16) * monogramScale}px`;
        }

        return `calc(${sizeStr} * ${monogramScale})`;
    };
    const config = customization[side];
    const textInput = config.text;
    const monogramInput = config.monogram;
    const graphicInput = config.graphic;
    const graphicRenderSrc = graphicInput?.isUpload
        ? (graphicInput.maskSrc || graphicInput.src)
        : graphicInput?.src;

    // Graphic loading state
    const [isGraphicLoading, setIsGraphicLoading] = useState(false);
    const [loadedGraphicSrc, setLoadedGraphicSrc] = useState(null);

    // Preload graphic when it changes
    useEffect(() => {
        if (graphicRenderSrc) {
            // Don't show loader for capture mode
            if (isCapture) {
                setLoadedGraphicSrc(graphicRenderSrc);
                return;
            }

            // Check if it's the same image already loaded
            if (graphicRenderSrc === loadedGraphicSrc) {
                return;
            }

            setIsGraphicLoading(true);
            const img = new Image();
            img.onload = () => {
                setLoadedGraphicSrc(graphicRenderSrc);
                setIsGraphicLoading(false);
            };
            img.onerror = () => {
                setLoadedGraphicSrc(graphicRenderSrc);
                setIsGraphicLoading(false);
            };
            img.src = graphicRenderSrc;
        } else {
            setLoadedGraphicSrc(null);
            setIsGraphicLoading(false);
        }
    }, [graphicRenderSrc, isCapture]);

    const handleImageLoad = () => {
        if (setIsImageLoading) setIsImageLoading(false);
    };

    const handleImageError = (e) => {
        console.warn("Image load error", e.target.src);
        if (setIsImageLoading) setIsImageLoading(false);
    };

    // Robust check for cached images
    useLayoutEffect(() => {
        if (imgRef.current && imgRef.current.complete) {
            handleImageLoad();
        }
    }, [bottleImageSrc, side, selectedColor]);

    // Helper to get positioning style (inline for capture, classes for responsive)
    const getPositionStyle = (type) => {
        if (isCapture) {
            return { position: 'absolute', ...capturePos[type] };
        }
        return {}; // Use className instead
    };

    const getPositionClass = (type) => {
        if (isCapture) return 'absolute'; // Only base class, style handles positioning
        return `absolute ${currentConfig[type]}`;
    };

    // Container dimensions (RESTORED TO 1.5 ratio for coordinate math safety)
    const containerStyle = isCapture ? {
        width: '433px',
        height: '650px',
        transform: 'none',
        marginBottom: 0,
        position: 'relative'
    } : {};

    const containerClass = isCapture
        ? `bottle-preview-wrapper ${selectedColor.toLowerCase() === 'white' ? 'white-bottle' : ''}`
        : `relative mb-0 lg:mb-2 transition-transform duration-300 ease-in-out w-[180px] h-[270px] lg:w-[433px] lg:h-[650px] aspect-[433/650] overflow-hidden ${view && view !== 'main' ? currentConfig.zoom : ''} ${selectedColor.toLowerCase() === 'white' ? 'white-bottle' : ''}`;

    // Graphic size - uses shared config from capturePositions.js
    const sizeConfig = isMobile ? GRAPHIC_MAX_SIZE.mobile : GRAPHIC_MAX_SIZE.desktop;
    const graphicMaxSize = `${sizeConfig[side] * 100}%`;

    // Universal Zoom Compensation: In feature views, the container is scaled by 1.4x (mobile) or 1.8x (desktop).
    // To keep design elements the same size relative to the bottle image, we scale them by (1 / zoomFactor).
    const isZoomedView = !isCapture && view && view !== 'main';
    const zoomFactor = isMobile ? 1.4 : 1.45;
    const effectiveZoomFactor = isZoomedView ? (1 / zoomFactor) : 1;


    const metalMaskSrc = (graphicInput && (!graphicInput.isUpload || graphicInput.maskSrc)) ? loadedGraphicSrc : null;

    // =========================================================================
    // Text sizing: horizontal text should never wrap; it shrinks to fit bounds.
    // =========================================================================
    const textBoxRef = useRef(null);
    const textMeasureRef = useRef(null);
    const [textBoxSize, setTextBoxSize] = useState({ width: 0, height: 0 });
    const [fittedFontSizePx, setFittedFontSizePx] = useState(null);
    const [fontReadyTick, setFontReadyTick] = useState(0);

    const fontStyleObj = fonts.find(f => f.name === selectedFont)?.style || {};
    const fontFamily = fontStyleObj.fontFamily || 'sans-serif';
    const fontWeight = fontStyleObj.fontWeight || 'normal';
    const fontStyle = fontStyleObj.fontStyle || 'normal';

    // When the font finishes loading, re-run fitting.
    useEffect(() => {
        let cancelled = false;
        const run = async () => {
            try {
                if (document?.fonts?.load) {
                    await document.fonts.load(`16px ${fontFamily}`);
                }
                if (document?.fonts?.ready) {
                    await document.fonts.ready;
                }
            } finally {
                if (!cancelled) setFontReadyTick(t => t + 1);
            }
        };
        run();
        return () => { cancelled = true; };
    }, [fontFamily]);

    // Observe the text box size (works for both normal view + capture view)
    // IMPORTANT: use offsetWidth/offsetHeight, NOT getBoundingClientRect().
    // The container has a CSS scale transform (zoom) when in text view, so
    // getBoundingClientRect returns screen-scaled dimensions, but CSS fontSize
    // operates in the element's own (unscaled) coordinate space.
    useLayoutEffect(() => {
        const el = textBoxRef.current;
        if (!el) return;

        const update = () => {
            setTextBoxSize({ width: el.offsetWidth || 0, height: el.offsetHeight || 0 });
        };

        update();

        let ro;
        if (typeof ResizeObserver !== 'undefined') {
            ro = new ResizeObserver(update);
            ro.observe(el);
        }

        window.addEventListener('resize', update);
        return () => {
            window.removeEventListener('resize', update);
            if (ro) ro.disconnect();
        };
    }, [side, isCapture, isMobile, selectedColor, config?.isVertical, !!textInput]);

    const maxFontSizePx = useMemo(() => {
        if (!textBoxSize.width) return null;
        const frontMaxRatio = 0.5;  // Hard sync: UI and Review now both use 0.18
        const baseMax = Math.max(1, (side === 'FRONT' ? frontMaxRatio : 0.54) * textBoxSize.width);
        return baseMax * sizeScaleFactor;
    }, [textBoxSize.width, side, isCapture, sizeScaleFactor]);

    // Uniform vertical text scale — applied to the cqi-based size so all
    // character counts shrink consistently without abrupt jumps.
    // NOTE: You can change this number (e.g. 0.85, 1.0) to fine-tune how quickly vertical text shrinks.
    // Uniform vertical text scale
    const VERTICAL_SCALE = 0.7;

    const verticalFittedFontSizePx = useMemo(() => {
        const isVerticalText = side === 'BACK' && config?.isVertical;
        if (!isVerticalText || !textInput || !textBoxSize.height || !textBoxSize.width) return null;

        const lines = textInput.split('\n');
        const maxLineLength = Math.max(1, ...lines.map(line => line.length));

        // Vertical text characters take up vertical space based on font-size.
        // Approx 0.8em to 1.0em per character vertically. We use 1.0 for safety.
        const maxFontSizeByHeight = textBoxSize.height / maxLineLength;

        // Vertical text lines take up horizontal space based on line-height.
        // Approx 1.6em width per line (increased from 1.4 for breathing room).
        const maxFontSizeByWidth = textBoxSize.width / (lines.length * 1.6);

        // Absolute cap so a single letter isn't massive (0.3 instead of 0.4).
        const maxAbsoluteSize = textBoxSize.height * 0.3;

        // Take the most restrictive constraint
        const calculatedSize = Math.min(maxFontSizeByHeight, maxFontSizeByWidth, maxAbsoluteSize);

        // Apply a conservative margin of 30% (0.7 scale) to handle font variations
        const finalSizePx = calculatedSize * 0.7;

        return Math.max(8, finalSizePx);
    }, [side, config?.isVertical, textInput, textBoxSize.height, textBoxSize.width]);

    // Fit based on actual DOM measurements (most accurate across fonts/devices).
    useLayoutEffect(() => {
        const isVerticalText = side === 'BACK' && config?.isVertical;
        if (!textInput || isVerticalText) {
            setFittedFontSizePx(null);
            return;
        }
        if (!maxFontSizePx || !textBoxSize.width || !textBoxSize.height) return;

        const boxW = textBoxSize.width;
        const boxH = textBoxSize.height;
        const measureEl = textMeasureRef.current;
        if (!measureEl) return;

        const safety = isMobile ? 0.91 : 0.92;
        const targetW = boxW * safety;
        const targetH = boxH * safety;

        const fits = (sizePx) => {
            measureEl.style.fontSize = `${sizePx}px`;
            const w = measureEl.offsetWidth || 0;
            const h = measureEl.offsetHeight || 0;
            return w <= targetW && h <= targetH;
        };

        let lo = 1;
        let hi = maxFontSizePx;
        let best = 1;

        for (let i = 0; i < 16; i++) {
            const mid = (lo + hi) / 2;
            if (fits(mid)) {
                best = mid;
                lo = mid;
            } else {
                hi = mid;
            }
        }

        // Extra shrink on mobile + zoomed editing view to absorb subpixel clipping.
        const extraShrinkFactor = isMobile ? 0.92 : 0.9;
        const zoomPenalty = 1; // Removed penalty to prevent text jumping between views
        const finalSize = Math.max(1, best * extraShrinkFactor * zoomPenalty);
        setFittedFontSizePx(prev => (prev && Math.abs(prev - finalSize) < 0.05 ? prev : finalSize));
    }, [textInput, side, config?.isVertical, maxFontSizePx, textBoxSize.width, textBoxSize.height, fontReadyTick, isMobile, isCapture]);

    return (
        <div className="flex flex-col items-center">
            <div className={containerClass} style={containerStyle}>
                <img
                    ref={imgRef}
                    src={bottleImageSrc || `bottle/${side === 'FRONT' ? 'front' : 'back'}/${selectedColor}${side === 'BACK' ? 'back' : ''}.webp`}
                    alt={t('bottlePreview.alt', { side })}
                    loading="eager"
                    className="w-full h-[82%] object-cover block absolute top-[9%] left-0 select-none"
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                />

                {/* Loading Spinner */}
                {isImageLoading && !isCapture && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-10 h-10 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
                    </div>
                )}

                {/* Text Overlay */}
                {textInput && (
                    <div
                        key={`text-${selectedColor}`}
                        ref={textBoxRef}
                        className={`${getPositionClass('text')} flex items-center justify-center z-20 pointer-events-none overflow-hidden`}
                        style={{
                            containerType: 'inline-size',
                            letterSpacing: '0.5px', // Global VA spacing
                            lineHeight: '1.2',      // Global VA spacing
                            transformOrigin: 'center center',
                            ...getPositionStyle('text'),
                        }}
                    >
                        {/* Hidden measurement element (horizontal only) */}
                        {!(side === 'BACK' && config.isVertical) && maxFontSizePx && (
                            <span
                                ref={textMeasureRef}
                                aria-hidden="true"
                                style={{
                                    position: 'absolute',
                                    left: -99999,
                                    top: -99999,
                                    visibility: 'hidden',
                                    pointerEvents: 'none',
                                    ...fonts.find(f => f.name === selectedFont)?.style,
                                    fontSize: `${maxFontSizePx}px`,
                                    letterSpacing: '0.5px',
                                    whiteSpace: 'pre',
                                    wordBreak: 'normal',
                                    overflowWrap: 'normal',
                                    lineHeight: 1.2,
                                    display: 'inline-block',
                                }}
                            >
                                {textInput}
                            </span>
                        )}
                        <span
                            className="text-center block engraving-effect"
                            style={{
                                ...(fonts?.find(f => f.name === selectedFont)?.style || {}),
                                fontSize: (side === 'BACK' && isVertical)
                                    ? (verticalFittedFontSizePx
                                        ? `${verticalFittedFontSizePx}px`
                                        : `max(8px, min(${(220 * (textBoxSize.width / 433))}px, 35cqi))`) // approx match
                                    : (fittedFontSizePx
                                        ? `${fittedFontSizePx}px`
                                        : (side === 'FRONT'
                                            ? `${Math.min((180 * (textBoxSize.width / 433)) / Math.max(1, textInput.length * 0.25), (textBoxSize.width * 0.18) * 0.42)}px`
                                            : `max(8px, min(${220 / Math.max(1, textInput.length * 0.4)}cqi, 60cqi))`)),
                                letterSpacing: '0.5px',
                                wordBreak: 'normal',
                                overflowWrap: 'normal',
                                whiteSpace: 'pre',
                                lineHeight: 1.2,
                                fontVariantEmoji: 'text',
                                verticalAlign: 'middle',
                                textRendering: 'geometricPrecision',
                                boxSizing: 'border-box',
                                width: (side === 'BACK' && isVertical) ? 'fit-content' : '100%',
                                height: (side === 'BACK' && isVertical) ? '100%' : undefined,
                                maxWidth: '100%',
                                display: (side === 'BACK' && isVertical) ? 'inline-flex' : 'block',
                                alignItems: 'center',
                                justifyContent: 'center',
                                writingMode: (side === 'BACK' && isVertical) ? 'vertical-rl' : undefined,
                                textOrientation: (side === 'BACK' && isVertical) ? 'sideways' : undefined,
                                glyphOrientationVertical: (side === 'BACK' && isVertical) ? '90deg' : undefined,
                                transform: (side === 'BACK' && isVertical) ? 'rotate(180deg)' : undefined,
                            }}
                        >
                            {textInput}
                        </span>
                    </div>
                )}

                {/* Graphic Overlay */}
                {graphicInput && (
                    <div
                        key={`graphic-${selectedColor}-${loadedGraphicSrc}`}
                        className={`${getPositionClass('graphic')} flex items-center justify-center z-20 pointer-events-none overflow-hidden`}
                        style={{
                            containerType: 'inline-size',
                            transform: `scale(${(graphicInput.scale || 1.0) * sizeScaleFactor})`,
                            transformOrigin: 'center center',
                            ...getPositionStyle('graphic')
                        }}
                    >
                        {/* Loading Spinner for Graphics */}
                        {isGraphicLoading && !isCapture && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-6 h-6 border-2 border-gray-300 border-t-[#00A86B] rounded-full animate-spin"></div>
                            </div>
                        )}

                        {/* Only show graphic when loaded */}
                        {loadedGraphicSrc && !isGraphicLoading && (
                            <>
                                {/* Uploaded images use metallic mask when available */}
                                {metalMaskSrc ? (
                                    <div
                                        className="w-full h-full engraving-effect-mask"
                                        style={{
                                            maskImage: cssUrl(metalMaskSrc),
                                            WebkitMaskImage: cssUrl(metalMaskSrc),
                                            maskSize: 'contain',
                                            WebkitMaskSize: 'contain',
                                            maskPosition: 'center',
                                            WebkitMaskPosition: 'center',
                                            maskRepeat: 'no-repeat',
                                            WebkitMaskRepeat: 'no-repeat',
                                            maxHeight: '75%',
                                            maxWidth: '75%'
                                        }}
                                    />
                                ) : (
                                    <img
                                        src={graphicInput.src}
                                        alt={graphicInput.name || t('bottlePreview.uploadedImageAlt')}
                                        className="w-full h-full object-contain"
                                        style={{
                                            filter: 'grayscale(100%) contrast(1.2) brightness(1.2)',
                                            maxHeight: '75%',
                                            maxWidth: '75%'
                                        }}
                                    />
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* Monogram Overlay */}
                {monogramInput && shouldDisplayMonogram(selectedMonogram, monogramInput.length) && (
                    <div
                        key={`monogram-${selectedColor}-${selectedMonogram}`}
                        className={`${getPositionClass('monogram')} flex items-center justify-center z-20 pointer-events-none`}
                        style={{
                            containerType: 'inline-size',
                            ...getPositionStyle('monogram'),
                            transformOrigin: 'center center'
                        }}
                    >
                        {usesCircleGlyphs(selectedMonogram) ? (
                            <span
                                className="text-center whitespace-nowrap block engraving-effect"
                                style={{
                                    fontFamily: getCircleFontFamily(monogramInput.length),
                                    fontSize: scaleMonogramSize(getMonogramFontSize(selectedMonogram, side, monogramInput.length, isCapture ? false : isMobile)),
                                    lineHeight: 1.4,
                                }}
                            >
                                {convertToCircleGlyphs(monogramInput, selectedMonogram)}
                            </span>
                        ) : usesNGramGlyphs(selectedMonogram) ? (
                            <span
                                className="text-center whitespace-nowrap block engraving-effect"
                                style={{
                                    ...(monogramStyles.find(m => m.name === selectedMonogram)?.style || {}),
                                    fontFamily: getNGramFontFamily(monogramInput.length),
                                    fontSize: scaleMonogramSize(getMonogramFontSize(selectedMonogram, side, monogramInput.length, isCapture ? false : isMobile)),
                                    lineHeight: 1.4,
                                }}
                            >
                                {convertToNGramGlyphs(monogramInput)}
                            </span>
                        ) : monogramStyles.find(m => m.name === selectedMonogram)?.middleLarger && monogramInput.length === 3 ? (
                            <span
                                className="text-center whitespace-nowrap block engraving-effect"
                                style={{
                                    ...(monogramStyles.find(m => m.name === selectedMonogram)?.style || {}),
                                    fontSize: scaleMonogramSize(getMonogramFontSize(selectedMonogram, side, monogramInput.length, isCapture ? false : isMobile)),
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    lineHeight: 1.4,
                                }}
                            >
                                <span style={{ fontSize: '0.75em' }}>{monogramInput[0]}</span>
                                <span style={{ fontSize: '1em' }}>{monogramInput[1]}</span>
                                <span style={{ fontSize: '0.75em' }}>{monogramInput[2]}</span>
                            </span>
                        ) : (
                            <span
                                className="text-center whitespace-nowrap block engraving-effect"
                                style={{
                                    ...(monogramStyles.find(m => m.name === selectedMonogram)?.style || {}),
                                    fontSize: scaleMonogramSize(getMonogramFontSize(selectedMonogram, side, monogramInput.length, isCapture ? false : isMobile)),
                                    lineHeight: selectedMonogram === 'Vine' ? 2.4 : 1.4,
                                    marginLeft: selectedMonogram === 'Vine' ? 0 : undefined,
                                    paddingLeft: selectedMonogram === 'Vine' ? '0.6em' : undefined,
                                    paddingTop: selectedMonogram === 'Vine' ? '0.3em' : undefined,
                                    paddingBottom: selectedMonogram === 'Vine' ? '0.3em' : undefined,
                                }}
                            >
                                {monogramStyles.find(m => m.name === selectedMonogram)?.maxLength === 1
                                    ? monogramInput.charAt(0)
                                    : monogramInput
                                }
                            </span>
                        )}
                    </div>
                )}


                {/* Boundary Box Overlay - Disabled per user request */}
                {/* {view !== 'main' && !isCapture && (
                    <div
                        className={`absolute border-[1.5px] border-dashed border-black/60 pointer-events-none z-[40] transition-all duration-300 ${currentConfig.boundary}`}
                    />
                )} */}
            </div>
        </div>
    );
};

export default BottlePreview;


