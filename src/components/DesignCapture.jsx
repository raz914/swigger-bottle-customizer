import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { monogramStyles, getMonogramFontSize, shouldDisplayMonogram, convertToCircleGlyphs, getCircleFontFamily, usesCircleGlyphs, convertToNGramGlyphs, getNGramFontFamily, usesNGramGlyphs } from '../data/monogramConfig';
import { cssUrl } from '../utils/metallicStyle';
import { parseCssFontSize } from '../utils/canvasCapture';

const DesignCapture = ({
    side, // 'FRONT' or 'BACK'
    customization,
    selectedColor,
    selectedFont,
    selectedMonogram,
    fonts,
    monogramScale = 1, // Scale factor for monogram font size (< 1 to shrink for capture)
    isProduction = false, // Force pure black/white for xTool
    isMobile = false,
    selectedSize = '1liter' // Default added for backwards compatibility
}) => {
    const config = customization[side];
    const isCapture = true; // DesignCapture is only used for capture/review snapshots
    const textInput = config.text;
    const monogramInput = config.monogram;
    const graphicInput = config.graphic;
    const monogramCaptureFontSize = `${Math.round(180 * monogramScale)}px`;

    const graphicMaskSrc = graphicInput
        ? (graphicInput.isUpload ? graphicInput.maskSrc : graphicInput.src)
        : null;

    const textBoxRef = useRef(null);
    const textMeasureRef = useRef(null);
    const [textBoxSize, setTextBoxSize] = useState({ width: 0, height: 0 });
    const [fittedFontSizePx, setFittedFontSizePx] = useState(null);
    const [fontReadyTick, setFontReadyTick] = useState(0);

    const fontStyleObj = fonts.find(f => f.name === selectedFont)?.style || {};
    const fontFamily = fontStyleObj.fontFamily || 'sans-serif';
    const fontWeight = fontStyleObj.fontWeight || 'normal';
    const fontStyle = fontStyleObj.fontStyle || 'normal';

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
    }, [side, config?.isVertical]);

    const maxFontSizePx = useMemo(() => 72, []);

    useLayoutEffect(() => {
        const isVerticalText = side === 'BACK' && config?.isVertical;
        if (!textInput || isVerticalText) {
            setFittedFontSizePx(null);
            return;
        }
        if (!textBoxSize.width || !textBoxSize.height) return;

        // Account for the fixed padding: 10px on each side
        const availableWidth = Math.max(0, textBoxSize.width - 20);
        const availableHeight = Math.max(0, textBoxSize.height - 20);

        const measureEl = textMeasureRef.current;
        if (!measureEl) return;

        const safety = 0.92;
        const targetW = availableWidth * safety;
        const targetH = availableHeight * safety;

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

        // Extra global shrink factor to avoid edge clipping on narrow devices/fonts.
        const extraShrinkFactor = 0.9;
        const finalSize = Math.max(1, best * extraShrinkFactor);
        setFittedFontSizePx(prev => (prev && Math.abs(prev - finalSize) < 0.05 ? prev : finalSize));
    }, [textInput, side, config?.isVertical, textBoxSize.width, textBoxSize.height, maxFontSizePx, fontReadyTick]);

    // Fixed container size for standardized capture
    const containerStyle = {
        width: '433px',
        height: '650px',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    };

    const getPositions = () => {
        const CONFIGS = {
            '1liter': {
                FRONT: {
                    text: "top-[50%] lg:top-[50%] left-[33%] lg:left-[33%] right-[40%] lg:right-[40%] bottom-[34%] lg:bottom-[34%]",
                    monogram: "top-[50%] lg:top-[50%] left-[33%] lg:left-[33%] right-[40%] lg:right-[40%] bottom-[34%] lg:bottom-[34%]",
                    graphic: "top-[50%] lg:top-[50%] left-[33%] lg:left-[33%] right-[40%] lg:right-[40%] bottom-[34%] lg:bottom-[34%]",
                },
                BACK: {
                    text: (customization.BACK?.isVertical)
                        ? "top-[39%] lg:top-[39%] left-[33%] lg:left-[33%] right-[33%] lg:right-[33%] bottom-[25%] lg:bottom-[25%]"
                        : "top-[39%] lg:top-[39%] left-[33%] lg:left-[33%] right-[33%] lg:right-[33%] bottom-[31%] lg:bottom-[31%]",
                    monogram: "top-[28%] lg:top-[28%] left-[33%] lg:left-[33%] right-[33%] lg:right-[33%] bottom-[26%] lg:bottom-[26%]",
                    graphic: "top-[33%] lg:top-[33%] left-[33%] lg:left-[33%] right-[33%] lg:right-[33%] bottom-[31%] lg:bottom-[31%]",
                }
            },
            '500ml': {
                FRONT: {
                    text: "top-[48%] lg:top-[48%] left-[33%] lg:left-[33%] right-[36%] lg:right-[36%] bottom-[34%] lg:bottom-[34%]",
                    monogram: "top-[48%] lg:top-[48%] left-[33%] lg:left-[33%] right-[36%] lg:right-[36%] bottom-[34%] lg:bottom-[34%]",
                    graphic: "top-[48%] lg:top-[48%] left-[33%] lg:left-[33%] right-[36%] lg:right-[36%] bottom-[34%] lg:bottom-[34%]",
                },
                BACK: {
                    text: (customization.BACK?.isVertical)
                        ? "top-[39%] lg:top-[39%] left-[33%] lg:left-[33%] right-[33%] lg:right-[33%] bottom-[25%] lg:bottom-[25%]"
                        : "top-[39%] lg:top-[39%] left-[33%] lg:left-[33%] right-[33%] lg:right-[33%] bottom-[31%] lg:bottom-[31%]",
                    monogram: "top-[28%] lg:top-[28%] left-[33%] lg:left-[33%] right-[33%] lg:right-[33%] bottom-[26%] lg:bottom-[26%]",
                    graphic: "top-[33%] lg:top-[33%] left-[33%] lg:left-[33%] right-[33%] lg:right-[33%] bottom-[31%] lg:bottom-[31%]",
                }
            }
        };
        return CONFIGS[selectedSize]?.[side] || CONFIGS['1liter'][side];
    };

    const posConfig = getPositions();

    // Dynamically calculate the box width in pixels for accurate CQI font size resolution
    const boxWidthPx = useMemo(() => {
        try {
            const leftMatch = posConfig.monogram?.match(/left-\[(\d+)%\]/);
            const rightMatch = posConfig.monogram?.match(/right-\[(\d+)%\]/);
            if (leftMatch && rightMatch) {
                const left = parseInt(leftMatch[1]);
                const right = parseInt(rightMatch[1]);
                return 433 * ((100 - left - right) / 100);
            }
        } catch (e) {
            console.warn('Failed to parse box width for monogram scaling', e);
        }
        return 433 * 0.37; // Fallback to 1L default width
    }, [posConfig, side, selectedSize]);

    const getPosClass = (type) => {
        const base = "absolute flex items-center justify-center z-20 pointer-events-none ";
        return base + posConfig[type];
    };

    return (
        <div style={containerStyle}>
            {/* Text Overlay */}
            {textInput && (
                <div
                    ref={textBoxRef}
                    className={getPosClass('text')}
                    style={{
                        containerType: 'inline-size',
                        padding: '2px', // Minimal padding for capture
                    }}
                >
                    <span
                        className={isProduction ? '' : 'engraving-effect'}
                        style={{
                            ...(fonts?.find(f => f.name === selectedFont)?.style || {}),
                            color: isProduction ? '#000000' : undefined,
                            fontSize: fittedFontSizePx ? `${fittedFontSizePx}px` : '10px',
                            letterSpacing: '0.5px',
                            wordBreak: 'normal',
                            overflowWrap: 'normal',
                            whiteSpace: 'pre',
                            lineHeight: 1.2,
                            fontVariantEmoji: 'text',
                            textAlign: 'center',
                            verticalAlign: 'middle',
                            textRendering: 'geometricPrecision',
                            display: 'block',
                            width: '100%',
                        }}
                    >
                        {textInput}
                    </span>
                </div>
            )}

            {/* Graphic Overlay */}
            {graphicInput && (
                <div
                    className={getPosClass('graphic')}
                    style={{
                        containerType: 'inline-size',
                        transform: `scale(${graphicInput.scale || 0.6})`,
                        maxWidth: '75%',
                        maxHeight: '75%',
                    }}
                >
                    {graphicMaskSrc ? (
                        <div
                            className={isProduction ? '' : 'engraving-effect-mask'}
                            style={{
                                width: '100%',
                                height: '100%',
                                maskImage: cssUrl(graphicMaskSrc),
                                WebkitMaskImage: cssUrl(graphicMaskSrc),
                                maskSize: 'contain',
                                WebkitMaskSize: 'contain',
                                maskPosition: 'center',
                                WebkitMaskPosition: 'center',
                                maskRepeat: 'no-repeat',
                                WebkitMaskRepeat: 'no-repeat',
                                background: isProduction ? '#000000' : undefined,
                                maxWidth: '100%',
                                maxHeight: '100%',
                            }}
                        />
                    ) : (
                        <img
                            src={graphicInput.src}
                            alt={graphicInput.name}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain',
                                filter: isProduction ? 'brightness(0)' : 'grayscale(100%) contrast(1.2) brightness(1.2)',
                            }}
                        />
                    )}
                </div>
            )}

            {/* Monogram Overlay */}
            {monogramInput && shouldDisplayMonogram(selectedMonogram, monogramInput.length) && (
                <div
                    className={getPosClass('monogram')}
                    style={{
                        containerType: 'inline-size',
                    }}
                >
                    {usesCircleGlyphs(selectedMonogram) ? (
                        <span
                            className={isProduction ? '' : 'engraving-effect'}
                            style={{
                                fontFamily: getCircleFontFamily(monogramInput.length),
                                color: isProduction ? '#000000' : undefined,
                                fontSize: `${parseCssFontSize(getMonogramFontSize(selectedMonogram, side, monogramInput.length, isMobile), boxWidthPx, 16) * monogramScale}px`,
                                lineHeight: 1,
                            }}
                        >
                            {convertToCircleGlyphs(monogramInput, selectedMonogram)}
                        </span>
                    ) : usesNGramGlyphs(selectedMonogram) ? (
                        <span
                            className={isProduction ? '' : 'engraving-effect'}
                            style={{
                                ...(monogramStyles.find(m => m.name === selectedMonogram)?.style || {}),
                                fontFamily: getNGramFontFamily(monogramInput.length),
                                color: isProduction ? '#000000' : undefined,
                                fontSize: `${parseCssFontSize(getMonogramFontSize(selectedMonogram, side, monogramInput.length, isMobile), boxWidthPx, 16) * monogramScale}px`,
                                lineHeight: 1,
                            }}
                        >
                            {convertToNGramGlyphs(monogramInput)}
                        </span>
                    ) : monogramStyles.find(m => m.name === selectedMonogram)?.middleLarger && monogramInput.length === 3 ? (
                        <span
                            className={isProduction ? '' : 'engraving-effect'}
                            style={{
                                ...(monogramStyles.find(m => m.name === selectedMonogram)?.style || {}),
                                color: isProduction ? '#000000' : undefined,
                                fontSize: `${parseCssFontSize(getMonogramFontSize(selectedMonogram, side, monogramInput.length, isMobile), boxWidthPx, 16) * monogramScale}px`,
                                lineHeight: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <span style={{ fontSize: '0.75em' }}>{monogramInput[0]}</span>
                            <span style={{ fontSize: '1em' }}>{monogramInput[1]}</span>
                            <span style={{ fontSize: '0.75em' }}>{monogramInput[2]}</span>
                        </span>
                    ) : (
                        <span
                            className={isProduction ? '' : 'engraving-effect'}
                            style={{
                                ...(monogramStyles.find(m => m.name === selectedMonogram)?.style || {}),
                                color: isProduction ? '#000000' : undefined,
                                fontSize: `${parseCssFontSize(getMonogramFontSize(selectedMonogram, side, monogramInput.length, isMobile), boxWidthPx, 16) * monogramScale}px`,
                                lineHeight: 1,
                                letterSpacing: selectedMonogram === 'Vine' ? '.55em' : undefined,
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

            {/* Jersey Overlay */}
            {(config.jerseyNumber || config.jerseyName) && (
                <div
                    style={{
                        width: '80%',
                        height: '80%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10%',
                    }}
                >
                    {config.jerseyName && (
                        <span
                            className={isProduction ? '' : 'engraving-effect'}
                            style={{
                                ...(fonts?.find(f => f.name === selectedFont)?.style || {}),
                                fontSize: `calc(min(25cqb, 20cqi) * ${config.jerseyName.length > 5 ? (5.5 / config.jerseyName.length) : 1} * ${config.jerseyScale || 1.0})`,
                                textAlign: 'center',
                                textTransform: 'none',
                                fontWeight: 'bold',
                                lineHeight: 1.2,
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {config.jerseyName}
                        </span>
                    )}
                    {config.jerseyNumber && (
                        <span
                            className={isProduction ? '' : 'engraving-effect'}
                            style={{
                                ...(fonts?.find(f => f.name === selectedFont)?.style || {}),
                                fontSize: `calc(min(90cqb, ${config.jerseyNumber.length > 1 ? '75' : '90'}cqi) * ${config.jerseyScale || 1.0})`,
                                color: isProduction ? '#000000' : undefined,
                                textAlign: 'center',
                                fontWeight: 'bold',
                                lineHeight: 1,
                            }}
                        >
                            {config.jerseyNumber}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};

export default DesignCapture;



