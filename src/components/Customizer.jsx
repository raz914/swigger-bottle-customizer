import React, { useState, useEffect, useRef } from 'react';
import { toPng } from 'html-to-image';
import MainView from './MainView';
import TextView from './TextView';
import MonogramView from './MonogramView';
import GalleryView from './GalleryView';
import ColorSelector from './ColorSelector';
import BottomBar from './BottomBar';
import ReviewScreen from './ReviewScreen';
import UploadView from './UploadView';
import BottlePreview from './BottlePreview';
import DesignCapture from './DesignCapture';
import MiniNav from './MiniNav';
import SplashScreen from './SplashScreen';
import CustomWorldView from './CustomWorldView';
import { monogramStyles, getMonogramFontSize, shouldDisplayMonogram, convertToCircleGlyphs, getCircleFontFamily, usesCircleGlyphs, convertToNGramGlyphs, getNGramFontFamily, usesNGramGlyphs } from '../data/monogramConfig';
import { isIOSDevice, captureBottleSnapshotCanvas, captureDesignSnapshotCanvas } from '../utils/canvasCapture';
import { generateProductionSvg } from '../utils/svgExport';
import { t } from '../i18n';

const MAX_CAPTURE_PIXEL_RATIO = 4;
const FALLBACK_CAPTURE_PIXEL_RATIO = 3;

// Utility for robust matching: strips non-alphanumeric so "Midnight Black", "midnight-black",
// "midnight black" all match to "midnightblack". Fixes WooCommerce attribute mismatch.
const normalizeColorKey = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

// SWIGGER color definitions per format (Moved outside for robust matching)
const SWIGGER_COLORS_946ML = [
    { id: 'midnight-black', name: 'Midnight Black', hex: '#2C2C2C', img: '2026/03/rvs-drinkfles-1-liter-zwart.png' },
    { id: 'pure-white', name: 'Pure White', hex: '#F5F5F5', img: '2025/12/rvs-drinkfles-1-liter-pure-white-swigger.jpg', lightColor: true },
    { id: 'warm-white', name: 'Warm White', hex: '#E8E2D6', img: '2025/12/rvs-drinkfles-1-liter-warm-white-swigger.jpg', lightColor: true },
    { id: 'sky-blue', name: 'Sky Blue', hex: '#8BAFD4', img: '2025/12/rvs-drinkfles-1-liter-sky-blue-swigger.jpg', lightColor: true },
    { id: 'deep-navy', name: 'Deep Navy', hex: '#4A5568', img: '2025/12/rvs-drinkfles-1-liter-deep-navy-swigger.jpg' },
    { id: 'berry-wine', name: 'Berry Wine', hex: '#B8878F', img: '2025/12/rvs-drinkfles-1-liter-berry-wine-swigger.jpg' },
    { id: 'candy-pink', name: 'Candy Pink', hex: '#E8B0C0', img: '2025/12/rvs-drinkfles-1-liter-candy-pink-swigger.jpg', lightColor: true },
    { id: 'lavender-purple', name: 'Lavender Purple', hex: '#B49CC8', img: '2025/12/rvs-drinkfles-1-liter-lavender-purple-swigger.jpg', lightColor: true },
    { id: 'forest-green', name: 'Forest Green', hex: '#6B8F7B', img: '2025/12/rvs-drinkfles-1-liter-forest-green-swigger.jpg' },
    { id: 'dip-dye-mint', name: 'Dip Dye Mint', hex: '#C5E8D8', img: '2025/12/rvs-drinkfles-1-liter-dip-dye-mint-swigger.jpg', lightColor: true },
];

const SWIGGER_COLORS_710ML = [
    { id: 'deep-navy', name: 'Deep Navy', hex: '#4A5568' },
    { id: 'forest-green', name: 'Forest Green', hex: '#6B8F7B' },
    { id: 'lavender-purple', name: 'Lavender Purple', hex: '#B49CC8', lightColor: true },
    { id: 'light-pink', name: 'Light Pink', hex: '#F9D1D1', lightColor: true },
    { id: 'lila', name: 'Lila', hex: '#C9B8E8', lightColor: true },
    { id: 'midnight-black', name: 'Midnight Black', hex: '#2C2C2C' },
    { id: 'mint-green', name: 'Mint Green', hex: '#C5E8D8', lightColor: true },
    { id: 'pink-dip-dye', name: 'Pink Dip Dye', hex: '#F0A1B2', lightColor: true },
    { id: 'pure-white', name: 'Pure White', hex: '#F5F5F5', lightColor: true },
    { id: 'sage-green', name: 'Sage Green', hex: '#A3B19B', lightColor: true },
    { id: 'warm-white', name: 'Warm White', hex: '#E8E2D6', lightColor: true },
];

const SWIGGER_COLORS_536ML = [
    { id: 'midnight-black', name: 'Midnight Black', hex: '#2C2C2C', img: '2025/12/rvs-drinkfles-500ml-midnight-black-swigger.jpg' },
    { id: 'pure-white', name: 'Pure White', hex: '#F5F5F5', img: '2025/12/rvs-drinkfles-500ml-pure-white-swigger.jpg', lightColor: true },
    { id: 'warm-white', name: 'Warm White', hex: '#E8E2D6', img: '2025/12/rvs-drinkfles-500ml-warm-white-swigger.jpg', lightColor: true },
    { id: 'sky-blue', name: 'Sky Blue', hex: '#8BAFD4', img: '2025/12/rvs-drinkfles-500ml-sky-blue-swigger.jpg', lightColor: true },
    { id: 'candy-pink', name: 'Candy Pink', hex: '#E8B0C0', img: '2025/12/rvs-drinkfles-500ml-candy-pink-swigger.jpg', lightColor: true },
    { id: 'lavender-purple', name: 'Lavender Purple', hex: '#B49CC8', img: '2025/12/rvs-drinkfles-500ml-lavender-purple-swigger.jpg', lightColor: true },
    { id: 'dip-dye-mint', name: 'Dip Dye Mint', hex: '#C5E8D8', img: '2025/12/rvs-drinkfles-500ml-dip-dye-mint-swigger.jpg', lightColor: true },
    { id: 'dip-dye-lila', name: 'Dip Dye Lila', hex: '#C9B8E8', img: '2025/12/rvs-drinkfles-500ml-dip-dye-lila-swigger.jpg', lightColor: true },
];

const Customizer = () => {
    const [activeTab, setActiveTab] = useState('FRONT');
    const bottlePreviewRef = useRef(null);
    const frontCaptureRef = useRef(null);
    const backCaptureRef = useRef(null);
    const frontDesignCaptureRef = useRef(null);
    const backDesignCaptureRef = useRef(null);

    // Initial state from URL parameters (robust for WooCommerce integration)
    const getInitialState = () => {
        if (typeof window === 'undefined') return { color: 'midnight-black', size: '946ml' };
        const params = new URLSearchParams(window.location.search);

        // 1. Get raw values (support multiple common WC attribute naming patterns)
        let rawColor = params.get('color') || params.get('attribute_pa_kleur') || params.get('attribute_pa_color') || params.get('attribute_kleur') || params.get('attribute_color') || '';
        let rawSize = params.get('size') || params.get('attribute_pa_formaat') || params.get('attribute_pa_size') || params.get('attribute_formaat') || params.get('attribute_size') || '';

        // 2. Normalize Size
        let size = '946ml';
        if (rawSize) {
            const s = rawSize.toLowerCase();
            if (s.includes('536') || s.includes('500') || s.includes('jr')) size = '536ml';
            else if (s.includes('710')) size = '710ml';
            else if (s.includes('946') || s.includes('1') || s.includes('liter')) size = '946ml';
        }

        // 3. Normalize Color
        let color = 'midnight-black';
        const availableColors = size === '536ml' ? SWIGGER_COLORS_536ML : (size === '710ml' ? SWIGGER_COLORS_710ML : SWIGGER_COLORS_946ML);

        if (rawColor) {
            const normalizedRaw = normalizeColorKey(rawColor);

            // Try to find by ID or by Name (normalized)
            const match = availableColors.find(c =>
                normalizeColorKey(c.id) === normalizedRaw ||
                normalizeColorKey(c.name) === normalizedRaw
            );

            if (match) color = match.id;
        }

        return { color, size };
    };

    const initialState = getInitialState();
    const [selectedColor, setSelectedColor] = useState(initialState.color);
    const [selectedSize, setSelectedSize] = useState(initialState.size);
    const [view, setView] = useState('main'); // 'main' | 'text' | 'monogram' | 'customWorld'
    const [galleryInitialCategory, setGalleryInitialCategory] = useState(null);
    const [isMobile, setIsMobile] = useState(false);
    const [isImageLoading, setIsImageLoading] = useState(false);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);
    
    // Custom World state
    const [customWorld, setCustomWorld] = useState({
        enabled: false,
        name: '',
        roots: '',
        hobbies: '',
        future: '',
        motto: '',
        style: [],
        doDont: ''
    });
    const [autoSubmitReview, setAutoSubmitReview] = useState(false);

    // Custom handler to track when initial image load is done
    const handlePreviewImageLoad = (loading) => {
        setIsImageLoading(loading);
        if (!loading && !initialLoadComplete) {
            setInitialLoadComplete(true);
        }
    };

    // Force canvas capture flag for desktop testing of iOS code path
    const [forceCanvasCapture, setForceCanvasCaptureState] = useState(false);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        handleResize(); // Initial check
        window.addEventListener('resize', handleResize);

        // Notify parent that we are ready to remove the modal loader
        if (window.parent && window.parent !== window) {
            window.parent.postMessage({ type: 'BEFIT_SWIGGER_V2_READY' }, '*');
        }

        // Expose snapshot function (html-to-image)
        window.takeSnapshot = async () => {
            if (bottlePreviewRef.current) {
                try {
                    const dataUrl = await captureNodeWithFallback(bottlePreviewRef.current, {
                        label: 'single preview'
                    });

                    const link = document.createElement('a');
                    link.download = `bottle-snapshot-${Date.now()}.png`;
                    link.href = dataUrl;
                    link.click();
                    console.log('Snapshot taken with html-to-image!');
                } catch (err) {
                    console.error('Snapshot failed:', err);
                }
            } else {
                console.warn('Bottle preview ref not found');
            }
        };

        return () => {
            window.removeEventListener('resize', handleResize);
            delete window.takeSnapshot;
        };
    }, []);


    // Stock status from parent WooCommerce
    const [variationStock, setVariationStock] = useState({});

    useEffect(() => {
        const handleMessage = (event) => {
            const payload = event.data;
            if (!payload || payload.type !== 'BEFIT_SWIGGER_V2_VARIATIONS' || !payload.variations) return;

            console.log('[Customizer] Received variations from parent', payload.variations);

            const stockMap = {};
            payload.variations.forEach(v => {
                const attrs = v.attributes || {};
                let colorValue = '';
                let sizeValue = '';

                // Look for color and size attributes
                for (const key in attrs) {
                    if (key.toLowerCase().includes('color') || key.toLowerCase().includes('kleur')) {
                        colorValue = String(attrs[key]);
                    }
                    if (key.toLowerCase().includes('formaat') || key.toLowerCase().includes('size')) {
                        sizeValue = String(attrs[key]);
                    }
                }

                if (colorValue) {
                    let sKey = '946ml';
                    if (sizeValue) {
                        let s = sizeValue.toLowerCase();
                        if (s.includes('536') || s.includes('500') || s.includes('jr')) sKey = '536ml';
                        else if (s.includes('710')) sKey = '710ml';
                        else if (s.includes('946') || s.includes('1') || s.includes('liter')) sKey = '946ml';
                    }

                    const cKey = normalizeColorKey(colorValue);
                    const stockData = {
                        is_in_stock: v.is_in_stock,
                        is_purchasable: v.is_purchasable,
                        backorders_allowed: v.backorders_allowed !== 'no' && v.backorders_allowed !== false,
                        availability_html: v.availability_html
                    };

                    // Store both specific size-color key and a fallback color-only key
                    stockMap[`${sKey}_${cKey}`] = stockData;
                    stockMap[cKey] = stockData;
                }
            });
            setVariationStock(stockMap);
        };

        const handleStateUpdate = (event) => {
            const payload = event.data;
            if (!payload || payload.type !== 'BEFIT_SWIGGER_V2_SET_STATE') return;

            console.log('[Customizer] Received state update from parent', payload);

            const rawColor = payload.color || payload.attribute_pa_kleur || payload.attribute_pa_color || payload.attribute_kleur || payload.attribute_color;
            const rawSize = payload.size || payload.attribute_pa_formaat || payload.attribute_pa_size || payload.attribute_formaat || payload.attribute_size;

            // Robust size matching
            let newSize = selectedSize;
            if (rawSize) {
                let s = String(rawSize).toLowerCase();
                if (s.includes('536') || s.includes('500') || s.includes('jr')) {
                    newSize = '536ml';
                    setSelectedSize('536ml');
                } else if (s.includes('710')) {
                    newSize = '710ml';
                    setSelectedSize('710ml');
                } else if (s.includes('946') || s.includes('1') || s.includes('liter')) {
                    newSize = '946ml';
                    setSelectedSize('946ml');
                }
            }

            // Robust color matching
            if (rawColor) {
                const availableColors = newSize === '536ml' ? SWIGGER_COLORS_536ML : (newSize === '710ml' ? SWIGGER_COLORS_710ML : SWIGGER_COLORS_946ML);
                const normalizedRaw = normalizeColorKey(rawColor);
                const match = availableColors.find(c =>
                    normalizeColorKey(c.id) === normalizedRaw ||
                    normalizeColorKey(c.name) === normalizedRaw
                );

                if (match) {
                    setSelectedColor(match.id);
                } else {
                    setSelectedColor(rawColor);
                }
            }
        };

        window.addEventListener('message', handleMessage);
        window.addEventListener('message', handleStateUpdate);
        return () => {
            window.removeEventListener('message', handleMessage);
            window.removeEventListener('message', handleStateUpdate);
        };
    }, []);

    // Show loader ONLY when color or tab changes (URL changes)
    useEffect(() => {
        setIsImageLoading(true);
        // Safety timeout: never show internal loader longer than 3s
        const timer = setTimeout(() => setIsImageLoading(false), 3000);
        return () => clearTimeout(timer);
    }, [selectedColor, activeTab]);

    // No view restrictions needed — all views work on both sides

    // Expose canvas capture testing functions for desktop iPhone simulation
    useEffect(() => {
        // Toggle force canvas capture mode
        window.setForceCanvasCapture = (value) => {
            setForceCanvasCaptureState(!!value);
            console.log(`[Customizer] Force canvas capture: ${!!value}`);
        };

        // Get current force canvas capture state
        window.getForceCanvasCapture = () => forceCanvasCapture;

        return () => {
            delete window.setForceCanvasCapture;
            delete window.getForceCanvasCapture;
        };
    }, [forceCanvasCapture]);

    const [customization, setCustomization] = useState({
        FRONT: { text: '', monogram: '', graphic: null },
        BACK: { text: '', monogram: '', isVertical: false, graphic: null }
    });

    const [selectedFont, setSelectedFont] = useState('BeFit');
    // Store monogram style per side to allow different styles for front/back
    const [selectedMonogramBySide, setSelectedMonogramBySide] = useState({
        FRONT: 'Block Script',
        BACK: 'Block Script'
    });
    // Helper to get current side's monogram style
    const selectedMonogram = selectedMonogramBySide[activeTab];
    // Helper to set current side's monogram style
    const setSelectedMonogram = (style) => {
        setSelectedMonogramBySide(prev => ({
            ...prev,
            [activeTab]: style
        }));
    };

    // Master Fonts list (for lookups in Preview/Capture)
    const allFonts = [
        { name: 'BeFit', css: 'font-sans', style: { fontFamily: 'BeFit, "Noto Emoji", sans-serif' } },
        { name: 'BeFit Slim', css: 'font-sans', style: { fontFamily: 'BeFit Slim, "Noto Emoji", sans-serif' } },
        { name: 'BeFit Bold Italic', css: 'font-sans font-bold italic', style: { fontFamily: 'BeFit, "Noto Emoji", sans-serif', fontWeight: 'bold', fontStyle: 'italic' } },
        { name: 'Oswald', css: 'font-sans capitalize', style: { fontFamily: 'Oswald, "Noto Emoji", sans-serif' } },
        { name: 'Bebas Neue', css: 'font-serif capitalize font-black', style: { fontFamily: 'Bebas Neue, "Noto Emoji", sans-serif' } },
        { name: 'Nunito', css: 'font-sans', style: { fontFamily: 'Nunito, "Noto Emoji", sans-serif' } },
        { name: 'Dancing Script', css: 'font-cursive', style: { fontFamily: 'Dancing Script, "Noto Emoji", cursive' } },
        { name: 'Nexa Script', css: 'font-cursive', style: { fontFamily: 'Nexa Script, "Noto Emoji", cursive' } },
        { name: 'Merriweather', css: 'font-serif', style: { fontFamily: 'Merriweather, "Noto Emoji", serif' } },
        { name: 'Arial Bold', css: 'font-sans font-bold', style: { fontFamily: 'Arial, "Noto Emoji", sans-serif', fontWeight: 'bold' } },
        { name: 'Bodoni Moda', css: 'font-serif font-bold', style: { fontFamily: 'Bodoni Moda, "Noto Emoji", serif' } },
        { name: 'Playfair Display', css: 'font-serif font-bold', style: { fontFamily: 'Playfair Display, "Noto Emoji", serif', fontWeight: 'bold' } },
        { name: 'Alfa Slab One', css: 'font-serif font-bold', style: { fontFamily: 'Alfa Slab One, "Noto Emoji", serif' } },
        { name: 'Permanent Marker', css: 'font-display capitalize', style: { fontFamily: 'Permanent Marker, "Noto Emoji", cursive', fontStyle: 'italic' } },
        { name: 'Burns Drift', css: 'font-cursive', style: { fontFamily: 'Burns Drift, "Noto Emoji", cursive' } },
        { name: 'Mending', css: 'font-cursive', style: { fontFamily: 'Mending, "Noto Emoji", cursive' } },
        { name: 'Bungee', css: 'font-display capitalize', style: { fontFamily: 'Bungee, "Noto Emoji", sans-serif' } },
    ];

    // Alias for backwards compatibility (capture refs etc. use `fonts`)
    const fonts = allFonts;

    // Derived lists for view components
    const normalFonts = allFonts;

    // Monogram scale for capture/review images
    const getMonogramScale = (renderSide, isForCapture = false) => {
        // isPreparingReview is true only DURING the actual capture process
        const isCaptureMode = isPreparingReview || isForCapture;

        // ============================================================
        // VOORKANT (FRONT) - PAS HIER JE CIJFERS AAN
        // ============================================================
        if (renderSide === 'FRONT') {
            if (isCaptureMode) return 2; // Review scherm (Direct aanpasbaar!)
            if (view === 'main') return 1;  // MainView (Groot op de fles bij start)
            return 1;                    // UI / Editor (Basis maat voorkant - nu groot!)
        }

        // ============================================================
        // ACHTERKANT (BACK) - PAS HIER JE CIJFERS AAN
        // ============================================================
        if (renderSide === 'BACK') {
            // 1. Review Scherm (Snapshots - Direct aanpasbaar!)
            if (isCaptureMode) {
                return (selectedSize === '536ml' || selectedSize === '710ml') ? 1.6 : 1.7;
            }

            // 2. MainView (Groot op de fles bij start)
            if (view === 'main') {
                return (selectedSize === '536ml' || selectedSize === '710ml') ? 0.8 : 0.8;
            }

            // 3. UI / Editor (Basis maat achterkant)
            return (selectedSize === '536ml' || selectedSize === '710ml') ? 0.8 : 0.8;
        }

        return 1.0;
    };

    const [showReview, setShowReview] = useState(false);
    const [isPreparingReview, setIsPreparingReview] = useState(false);
    const [capturedImages, setCapturedImages] = useState({
        front: null,
        back: null,
        frontDesign: null,
        backDesign: null,
        frontProduction: null,
        backProduction: null,
        frontProductionSvg: null,
        backProductionSvg: null
    });

    const requestParentClose = () => {
        if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
            window.parent.postMessage({ type: 'BEFIT_SWIGGER_V2_CLOSE' }, '*');
            return true;
        }
        return false;
    };

    // Derived values for the current view
    const textInput = customization[activeTab].text;
    const monogramInput = customization[activeTab].monogram;
    const graphicInput = customization[activeTab].graphic;

    const setTextInput = (val) => {
        const normalized = String(val ?? '').replace(/\r\n/g, '\n');
        const finalText = normalized;

        setCustomization(prev => ({
            ...prev,
            [activeTab]: {
                ...prev[activeTab],
                text: finalText,
                monogram: finalText ? '' : prev[activeTab].monogram,
                graphic: finalText ? null : prev[activeTab].graphic
            }
        }));
    }

    const setMonogramInput = (val) => {
        setCustomization(prev => ({
            ...prev,
            [activeTab]: {
                ...prev[activeTab],
                monogram: val,
                text: val ? '' : prev[activeTab].text,
                graphic: val ? null : prev[activeTab].graphic
            }
        }));
    }


    const setGraphic = (val) => {
        setCustomization(prev => ({
            ...prev,
            [activeTab]: {
                ...prev[activeTab],
                graphic: val,
                text: val ? '' : prev[activeTab].text,
                monogram: val ? '' : prev[activeTab].monogram
            }
        }));
    }

    const setIsVertical = (val) => {
        setCustomization(prev => ({
            ...prev,
            [activeTab]: {
                ...prev[activeTab],
                isVertical: val
            }
        }));
    }

    const handleRemove = () => {
        setCustomization(prev => ({
            ...prev,
            [activeTab]: {
                text: '',
                monogram: '',
                graphic: null
            }
        }));
    };

    // Helper to wait for image to load inside a ref
    const waitForImagesToLoad = (ref) => {
        return new Promise((resolve) => {
            if (!ref.current) {
                resolve();
                return;
            }
            const images = ref.current.querySelectorAll('img');
            if (images.length === 0) {
                resolve();
                return;
            }
            let loadedCount = 0;
            const checkAllLoaded = () => {
                loadedCount++;
                if (loadedCount >= images.length) {
                    resolve();
                }
            };
            images.forEach((img) => {
                if (img.complete) {
                    checkAllLoaded();
                } else {
                    img.addEventListener('load', checkAllLoaded);
                    img.addEventListener('error', checkAllLoaded); // Resolve even on error
                }
            });
            // Timeout fallback in case images take too long
            setTimeout(resolve, 2000);
        });
    };

    const captureNodeWithFallback = async (
        node,
        {
            label = 'capture',
            backgroundColor
        } = {}
    ) => {
        if (!node) return null;

        const ratios = [MAX_CAPTURE_PIXEL_RATIO, FALLBACK_CAPTURE_PIXEL_RATIO];
        let lastError = null;

        for (const pixelRatio of ratios) {
            try {
                return await toPng(node, {
                    cacheBust: true,
                    skipAutoScale: true,
                    pixelRatio,
                    backgroundColor
                });
            } catch (error) {
                lastError = error;
                console.warn(`[Customizer] ${label} capture failed at ${pixelRatio}x`, error);
            }
        }

        throw lastError || new Error(`[Customizer] ${label} capture failed`);
    };

    const hasFrontDesignContent = !!(customization.FRONT.text || customization.FRONT.monogram || customization.FRONT.graphic);
    const hasBackDesignContent = !!(customization.BACK.text || customization.BACK.monogram || customization.BACK.graphic);

    // Determines if any side has content (used for enabling BottomBar review button)
    const hasContent = hasFrontDesignContent || hasBackDesignContent;

    const captureReviewAssets = async ({ includeDesign = true } = {}) => {
        let frontImg = null;
        let backImg = null;
        let frontDesignImg = null;
        let backDesignImg = null;
        let frontProductionImg = null;
        let backProductionImg = null;
        let frontProductionSvg = null;
        let backProductionSvg = null;

        const useCanvasCapture = true; // Always use canvas capture to ensure auto-cropping

        if (useCanvasCapture) {
            console.log(`[Customizer] Using canvas capture (iOS: ${isIOSDevice()}, forced: ${forceCanvasCapture})`);

            if (document.fonts && document.fonts.ready) {
                await document.fonts.ready;
            }

            frontImg = await captureBottleSnapshotCanvas(
                'FRONT',
                customization,
                selectedColor,
                selectedFont,
                selectedMonogramBySide.FRONT,
                fonts,
                getMonogramScale('FRONT', true),
                isMobile,
                bottleImageSrc,
                selectedSize
            );

            backImg = await captureBottleSnapshotCanvas(
                'BACK',
                customization,
                selectedColor,
                selectedFont,
                selectedMonogramBySide.BACK,
                fonts,
                getMonogramScale('BACK', true),
                isMobile,
                backBottleImageSrc,
                selectedSize
            );

            if (includeDesign && hasFrontDesignContent) {
                frontDesignImg = await captureDesignSnapshotCanvas(
                    'FRONT',
                    customization,
                    selectedColor,
                    selectedFont,
                    selectedMonogramBySide.FRONT,
                    fonts,
                    getMonogramScale('FRONT', true),
                    false, // isProduction
                    isMobile,
                    selectedSize
                );
            }

            if (includeDesign && hasBackDesignContent) {
                backDesignImg = await captureDesignSnapshotCanvas(
                    'BACK',
                    customization,
                    selectedColor,
                    selectedFont,
                    selectedMonogramBySide.BACK,
                    fonts,
                    getMonogramScale('BACK', true),
                    false, // isProduction
                    isMobile,
                    selectedSize
                );
            }

            // Production Snapshots (Laser-ready)
            if (includeDesign && hasFrontDesignContent) {
                frontProductionImg = await captureDesignSnapshotCanvas(
                    'FRONT',
                    customization,
                    selectedColor,
                    selectedFont,
                    selectedMonogramBySide.FRONT,
                    fonts,
                    getMonogramScale('FRONT', true),
                    true, // isProduction
                    isMobile,
                    selectedSize
                );
            }
            if (includeDesign && hasBackDesignContent) {
                backProductionImg = await captureDesignSnapshotCanvas(
                    'BACK',
                    customization,
                    selectedColor,
                    selectedFont,
                    selectedMonogramBySide.BACK,
                    fonts,
                    getMonogramScale('BACK', true),
                    true, // isProduction
                    isMobile,
                    selectedSize
                );
            }

            // --- Vector SVG Export for xTool (opentype.js outlined paths) ---
            if (includeDesign && hasFrontDesignContent) {
                frontProductionSvg = await generateProductionSvg(
                    'FRONT',
                    customization,
                    selectedFont,
                    selectedMonogramBySide.FRONT,
                    fonts
                );
            }
            if (includeDesign && hasBackDesignContent) {
                backProductionSvg = await generateProductionSvg(
                    'BACK',
                    customization,
                    selectedFont,
                    selectedMonogramBySide.BACK,
                    fonts
                );
            }
        } else {
            console.log('[Customizer] Using html-to-image capture');

            await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

            const refsToWait = [frontCaptureRef, backCaptureRef];
            if (includeDesign) {
                refsToWait.push(frontDesignCaptureRef, backDesignCaptureRef);
            }

            await Promise.all(refsToWait.map(waitForImagesToLoad));
            await new Promise(resolve => setTimeout(resolve, 100));

            if (frontCaptureRef.current) {
                frontImg = await captureNodeWithFallback(frontCaptureRef.current, { label: 'front bottle' });
            }

            if (backCaptureRef.current) {
                backImg = await captureNodeWithFallback(backCaptureRef.current, { label: 'back bottle' });
            }

            if (includeDesign && frontDesignCaptureRef.current && hasFrontDesignContent) {
                frontDesignImg = await captureNodeWithFallback(frontDesignCaptureRef.current, {
                    label: 'front design',
                    backgroundColor: null
                });
            }

            if (includeDesign && backDesignCaptureRef.current && hasBackDesignContent) {
                backDesignImg = await captureNodeWithFallback(backDesignCaptureRef.current, {
                    label: 'back design',
                    backgroundColor: null
                });
            }
        }

        return { frontImg, backImg, frontDesignImg, backDesignImg, frontProductionImg, backProductionImg, frontProductionSvg, backProductionSvg };
    };

    // Expose canvas snapshot function for testing iOS capture path on desktop
    useEffect(() => {
        window.takeSnapshotCanvas = async (side = 'FRONT') => {
            const sideUpper = side.toUpperCase();
            if (sideUpper !== 'FRONT' && sideUpper !== 'BACK') {
                console.error('[takeSnapshotCanvas] Invalid side. Use "FRONT" or "BACK".');
                return;
            }

            console.log(`[takeSnapshotCanvas] Capturing ${sideUpper} with canvas compositor...`);

            try {
                // Wait for fonts
                if (document.fonts && document.fonts.ready) {
                    await document.fonts.ready;
                }

                const dataUrl = await captureBottleSnapshotCanvas(
                    sideUpper,
                    customization,
                    selectedColor,
                    selectedFont,
                    selectedMonogramBySide[sideUpper],
                    fonts,
                    CAPTURE_MONOGRAM_SCALE,
                    isMobile,
                    bottleImageSrc
                );

                // Download
                const link = document.createElement('a');
                link.download = `bottle-canvas-${sideUpper.toLowerCase()}-${Date.now()}.png`;
                link.href = dataUrl;
                link.click();

                console.log(`[takeSnapshotCanvas] ${sideUpper} snapshot saved!`);
            } catch (err) {
                console.error('[takeSnapshotCanvas] Failed:', err);
            }
        };

        // Compare both capture methods side-by-side
        window.compareSnapshots = async (side = 'FRONT') => {
            const sideUpper = side.toUpperCase();
            if (sideUpper !== 'FRONT' && sideUpper !== 'BACK') {
                console.error('[compareSnapshots] Invalid side. Use "FRONT" or "BACK".');
                return;
            }

            const ref = sideUpper === 'FRONT' ? frontCaptureRef : backCaptureRef;

            console.log(`[compareSnapshots] Capturing ${sideUpper} with both methods...`);

            try {
                // Wait for images and fonts
                await waitForImagesToLoad(ref);
                if (document.fonts && document.fonts.ready) {
                    await document.fonts.ready;
                }
                await new Promise(r => setTimeout(r, 100));

                // Capture with html-to-image
                let htmlToImageUrl = null;
                if (ref.current) {
                    htmlToImageUrl = await captureNodeWithFallback(ref.current, {
                        label: `${sideUpper} comparison`
                    });
                }

                // Capture with canvas
                const canvasUrl = await captureBottleSnapshotCanvas(
                    sideUpper,
                    customization,
                    selectedColor,
                    selectedFont,
                    selectedMonogramBySide[sideUpper],
                    fonts,
                    getMonogramScale(sideUpper),
                    isMobile,
                    bottleImageSrc
                );

                // Open comparison in new window
                const compareWindow = window.open('', '_blank', 'width=700,height=600');
                compareWindow.document.write(`
                    <!DOCTYPE html>
                    <html>
                    <head><title>Snapshot Comparison - ${sideUpper}</title></head>
                    <body style="margin:0;padding:20px;background:#f0f0f0;font-family:sans-serif;">
                        <h3 style="margin:0 0 10px;">Snapshot Comparison: ${sideUpper}</h3>
                        <div style="display:flex;gap:20px;">
                            <div style="text-align:center;">
                                <p style="margin:0 0 5px;font-weight:bold;">html-to-image</p>
                                <img src="${htmlToImageUrl}" style="border:1px solid #ccc;max-width:300px;" />
                            </div>
                            <div style="text-align:center;">
                                <p style="margin:0 0 5px;font-weight:bold;">Canvas Compositor</p>
                                <img src="${canvasUrl}" style="border:1px solid #ccc;max-width:300px;" />
                            </div>
                        </div>
                        <p style="margin-top:20px;font-size:12px;color:#666;">
                            Canvas should match html-to-image. If text/position differs, adjust canvasCapture.js
                        </p>
                    </body>
                    </html>
                `);

                console.log('[compareSnapshots] Comparison window opened!');
            } catch (err) {
                console.error('[compareSnapshots] Failed:', err);
            }
        };

        return () => {
            delete window.takeSnapshotCanvas;
            delete window.compareSnapshots;
        };
    }, [customization, selectedColor, selectedFont, selectedMonogramBySide]);

    const handleReview = async () => {
        try {
            setIsPreparingReview(true); // Show full-screen loader
            setIsImageLoading(true);

            const { frontImg, backImg, frontDesignImg, backDesignImg, frontProductionImg, backProductionImg, frontProductionSvg, backProductionSvg } = await captureReviewAssets({ includeDesign: true });

            setCapturedImages({
                front: frontImg,
                back: backImg,
                frontDesign: frontDesignImg,
                backDesign: backDesignImg,
                frontProduction: frontProductionImg,
                backProduction: backProductionImg,
                frontProductionSvg,
                backProductionSvg
            });
            setIsImageLoading(false);
            setIsPreparingReview(false);
            setShowReview(true);

        } catch (error) {
            console.error("Failed to capture review images", error);
            setIsImageLoading(false);
            setIsPreparingReview(false);
            setShowReview(true);
        }
    };

    // hasContent removed, handled above
    const openGallery = () => {
        setGalleryInitialCategory(null);
        setView('gallery');
    };
    const openGalleryCategory = (categoryId) => {
        setGalleryInitialCategory(categoryId);
        setView('gallery');
    };

    const SWIGGER_BASE_URL = 'https://befitoriginals.com/wp-content/uploads/';

    const colorsBySize = { '946ml': SWIGGER_COLORS_946ML, '710ml': SWIGGER_COLORS_710ML, '536ml': SWIGGER_COLORS_536ML };
    const baseColors = colorsBySize[selectedSize] || SWIGGER_COLORS_946ML;

    const colors = baseColors.map(c => {
        // Look up by specific size first, then fallback to global color if size wasn't passed by WooCommerce
        const cKey1 = `${selectedSize}_${normalizeColorKey(c.id)}`;
        const cKey2 = `${selectedSize}_${normalizeColorKey(c.name)}`;
        const vStock = variationStock[cKey1] || variationStock[cKey2] || variationStock[normalizeColorKey(c.id)] || variationStock[normalizeColorKey(c.name)];
        const legacyStockStatus = window.bottleConfig?.stockStatus?.[c.id];

        const outOfStock = vStock
            ? (!vStock.is_in_stock && !vStock.backorders_allowed)
            : (legacyStockStatus === 'out_of_stock' || c.outOfStock);

        const onBackorder = vStock
            ? (!vStock.is_in_stock && vStock.backorders_allowed)
            : (legacyStockStatus === 'backorder' || c.onBackorder);

        return { ...c, outOfStock, onBackorder };
    });

    // Fallback to midnight-black when switching sizes if current color isn't available
    useEffect(() => {
        const available = colorsBySize[selectedSize] || SWIGGER_COLORS_946ML;
        if (!available.find(c => c.id === selectedColor)) {
            setSelectedColor('midnight-black');
        }
    }, [selectedSize]); // eslint-disable-line react-hooks/exhaustive-deps

    const currentColor = colors.find(c => c.id === selectedColor);
    
    // Map new size names to old file names on disk
    const getFileNameSize = (size) => {
        if (size === '946ml') return '1liter';
        if (size === '536ml') return '500ml';
        return size;
    };
    const fileSize = getFileNameSize(selectedSize);

    // Front image: use local transparent PNG photos
    const frontImageFolder = 'bottle/voor';
    const bottleImageSrc = `${frontImageFolder}/${selectedColor}-${fileSize}-voor.png`;

    // Back image: use local blank mockups (no branding)
    const backImageFolder = 'bottle/achter';
    const backBottleImageSrc = `${backImageFolder}/${selectedColor}-${fileSize}-achter.png`;

    return (
        <div className="flex flex-col bg-gray-100 font-sans text-slate-900 overflow-hidden" style={{ height: '100dvh' }}>
            {/* Branded Splash Screen */}
            <SplashScreen isReady={initialLoadComplete} />

            {/* Header */}
            <header id="app-header" className="bg-white border-b border-gray-200 z-10 relative">
                <div className="w-full px-4 lg:px-[30px] h-14 lg:h-16 flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                        <img src="logo.png" alt="BE FIT" loading="lazy" className="h-8 lg:h-10 w-auto object-contain" />
                    </div>

                    {/* Navigation Tabs */}
                    <nav className="flex space-x-4 lg:space-x-8 h-full">
                        {['FRONT', 'BACK'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`relative h-full flex flex-col items-center justify-center px-1 min-h-[3.5rem] text-xs lg:text-sm font-bold transition-colors capitalize
                  ${activeTab === tab
                                        ? 'text-black border-b-4 border-[#00A86B]'
                                        : 'text-gray-400 hover:text-gray-600'
                                    }`}
                                style={{ letterSpacing: '1.8px' }}
                            >
                                <span>{tab === 'FRONT' ? t('tab.front') : t('tab.back')}</span>
                                <span className={`text-[10px] lg:text-xs font-normal normal-case mt-0.5 ${activeTab === tab ? 'text-[#00A86B]' : 'text-gray-400 opacity-90'}`} style={{ letterSpacing: '1.8px' }}>
                                    {tab === 'FRONT' ? t('tab.frontPrice') : t('tab.backPrice')}
                                </span>
                            </button>
                        ))}
                    </nav>

                    {/* Close Button */}
                    <button onClick={requestParentClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="w-full flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden relative bg-[#f4f4f4]">
                {/* Left Panel - Bottle Preview */}
                <div id="bottle-canvas" className={`w-full lg:w-[50%] flex-shrink-0 flex flex-col items-center bg-[#f4f4f4] relative lg:pt-2 min-h-0 lg:overflow-y-auto ${isMobile || view !== 'main' ? 'pt-2' : 'pt-2'}`}>
                    <div className="w-full flex justify-center flex-shrink-0">
                        <div className="w-full h-auto flex justify-center">
                            <BottlePreview
                                side={activeTab}
                                customization={customization}
                                selectedColor={selectedColor}
                                selectedSize={selectedSize}
                                selectedFont={selectedFont}
                                selectedMonogram={selectedMonogram}
                                fonts={fonts}
                                isMobile={isMobile}
                                isImageLoading={isImageLoading}
                                setIsImageLoading={handlePreviewImageLoad}
                                view={view}
                                bottleImageSrc={activeTab === 'BACK' ? backBottleImageSrc : bottleImageSrc}
                                monogramScale={getMonogramScale(activeTab)}
                            />
                        </div>
                    </div>

                    {/* Size toggle — always in normal flow, no negative margin, always clickable.
                        Mobile: always visible. Desktop: visible via lg:flex. */}
                    {view === 'main' && (
                        <div className="flex flex-col items-center gap-1 py-1 relative z-10 flex-shrink-0 lg:-mt-4">
                            <span className="text-sm font-bold text-black capitalize tracking-[3px]">SWIGGER<sup className="text-[8px] ml-0.5">™</sup></span>
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-gray-500" style={{ letterSpacing: '1.8px' }}>Formaat:</span>
                                <div className="flex rounded-lg overflow-hidden border border-gray-300">
                                    {[{ id: '946ml', label: '946ml' }, { id: '536ml', label: '536ml' }].map(size => (
                                        <button
                                            key={size.id}
                                            onClick={() => setSelectedSize(size.id)}
                                            className={`px-4 py-2 text-xs font-bold tracking-[1.5px] transition-colors ${selectedSize === size.id ? 'bg-black text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                                        >
                                            {size.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Color picker (desktop only, positioned right under size toggle) */}
                    <div className={`text-center space-y-2 hidden lg:block transition-all duration-300 flex-shrink-0 pb-3 ${view !== 'main' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>

                        {/* Productkleur label */}
                        <span className="text-xs font-bold text-gray-500" style={{ letterSpacing: '1.8px' }}>Productkleur: <span className="text-black">{currentColor?.name || ''}</span></span>

                        {/* Color Picker */}
                        <div className="flex items-center justify-center flex-nowrap gap-2 max-w-full overflow-x-visible mx-auto px-4">
                            {colors.map((color) => (
                                <div key={color.id} className="relative">
                                    <button
                                        onClick={() => !color.outOfStock && setSelectedColor(color.id)}
                                        disabled={color.outOfStock}
                                        style={{ backgroundColor: color.hex }}
                                        className={`relative w-9 h-9 rounded-full transition-all
                                                ${selectedColor === color.id
                                                ? 'ring-2 ring-black ring-offset-2'
                                                : `border ${color.lightColor ? 'border-gray-300' : 'border-gray-700'} hover:scale-105`}
                                                ${color.outOfStock ? 'opacity-40 cursor-not-allowed' : ''}
                                            `}
                                        title={color.name}
                                        aria-label={t('color.selectAria', { color: color.name })}
                                    >
                                        {color.outOfStock && (
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden rounded-full">
                                                <div className="w-[150%] h-[2px] bg-red-600 rotate-45 shadow-sm" />
                                            </div>
                                        )}
                                    </button>
                                    {(color.outOfStock || color.onBackorder) && (
                                        <div className={`absolute -top-2 -right-2 px-1 py-0.5 rounded text-[7px] font-bold capitalize tracking-tighter text-white shadow-sm border border-white/20 ${color.outOfStock ? 'bg-red-600' : 'bg-orange-500'}`}>
                                            {color.outOfStock ? 'Uitverkocht' : 'Backorder'}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>


                        {(currentColor?.outOfStock || currentColor?.onBackorder) && (
                            <div className={`py-2 px-4 rounded-full text-[10px] font-bold capitalize tracking-widest inline-block border ${currentColor.outOfStock ? 'bg-red-50 border-red-200 text-red-600' : 'bg-orange-50 border-orange-200 text-orange-500'}`}>
                                {currentColor.outOfStock ? t('color.outOfStock') : t('color.onBackorder')}
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile Color Selector - Top Right of Preview Panel */}
                <ColorSelector
                    colors={colors}
                    selectedColor={selectedColor}
                    setSelectedColor={setSelectedColor}
                    selectedSize={selectedSize}
                    setSelectedSize={setSelectedSize}
                    isMobile={isMobile}
                />


                {/* <div className="absolute bottom-4 left-4 lg:bottom-6 lg:left-6">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-500 shadow-sm border border-blue-200">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                        </div>

                {/* Right Panel - Customization Options */}
                {/* Fixed: overflow-y-auto only for main view. Sub-views manage their own scroll. */}
                {/* Added dynamic background for mobile: gray for main, white+rounded for features */}
                <div className={`w-full lg:w-[50%] px-4 py-4 lg:pt-12 lg:pb-12 lg:px-[30px] flex flex-col items-stretch justify-start flex-1 lg:mb-0 min-h-0 
                    ${(isMobile && view !== 'main') ? 'bg-white rounded-2xl shadow-sm mt-2' : 'bg-[#f4f4f4]'} 
                    ${view === 'main' ? 'pb-4 overflow-y-auto' : 'overflow-hidden'}`}>
                    {/* Top Navigation for features (Desktop only) */}
                    {view !== 'main' && (
                        <div className="w-full flex justify-center mt-2 lg:mt-0">
                            <MiniNav setView={setView} activeView={view} activeTab={activeTab} />
                        </div>
                    )}

                    {view === 'main' && (
                        <MainView
                            setView={setView}
                            activeTab={activeTab}
                            openGallery={openGallery}
                            openGalleryCategory={openGalleryCategory}
                        />
                    )}

                    {(view === 'text' || view === 'quotes') && (
                        <div className="w-full flex-1 min-h-0 flex flex-col justify-center">
                            <TextView
                                setView={setView}
                                textInput={textInput}
                                setTextInput={setTextInput}
                                normalFonts={normalFonts}
                                selectedFont={selectedFont}
                                setSelectedFont={setSelectedFont}
                                activeTab={activeTab}
                                isVertical={customization[activeTab].isVertical}
                                setIsVertical={setIsVertical}
                            />
                        </div>
                    )}

                    {view === 'monogram' && (
                        <div className="w-full flex-1 min-h-0 flex flex-col justify-center">
                            <MonogramView
                                setView={setView}
                                monogramInput={monogramInput}
                                setMonogramInput={setMonogramInput}
                                monogramStyles={monogramStyles}
                                selectedMonogram={selectedMonogram}
                                setSelectedMonogram={setSelectedMonogram}
                                activeTab={activeTab}
                            />
                        </div>
                    )}

                    {view === 'gallery' && (
                        <div className="w-full flex-1 min-h-0 flex flex-col justify-center">
                            <GalleryView
                                setView={setView}
                                setGraphic={setGraphic}
                                selectedGraphic={graphicInput}
                                activeTab={activeTab}
                                initialCategory={galleryInitialCategory}
                            />
                        </div>
                    )}

                    {view === 'upload' && (
                        <div className="w-full flex-1 min-h-0 flex flex-col justify-center">
                            <UploadView
                                setView={setView}
                                setGraphic={setGraphic}
                                graphicInput={graphicInput}
                                activeTab={activeTab}
                                selectedColor={selectedColor}
                            />
                        </div>
                    )}

                    {view === 'customWorld' && (
                        <div className="w-full flex-1 min-h-0 flex flex-col justify-start overflow-y-auto">
                            <CustomWorldView
                                setView={setView}
                                customWorld={customWorld}
                                setCustomWorld={setCustomWorld}
                                onSubmitToCart={(cwState) => {
                                    setCustomWorld(cwState);
                                    setAutoSubmitReview(true);
                                    setShowReview(true);
                                }}
                            />
                        </div>
                    )}
                </div>
            </main>

            {/* Bottom Actions Bar - Outside main for 100% width */}
            {view !== 'main' && (
                <BottomBar
                    onRemove={handleRemove}
                    onReview={handleReview}
                    isDisabled={!hasContent}
                    isPreparing={isPreparingReview}
                />
            )}

            {/* HIDDEN CAPTURE AREA */}
            {/* Render both sides off-screen with fixed 'Desktop' dimensions for high-quality capture */}
            {/* Position offscreen (not opacity:0) for better html-to-image compatibility on non-iOS browsers */}
            {/* Only render after initial load to prevent blocking the main thread during startup */}
            {initialLoadComplete && (
                <div style={{ position: 'fixed', top: 0, left: '-9999px', width: '433px', height: '650px', pointerEvents: 'none', zIndex: -1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div ref={frontCaptureRef}>
                        <BottlePreview
                            side="FRONT"
                            customization={customization}
                            selectedColor={selectedColor}
                            selectedSize={selectedSize}
                            selectedFont={selectedFont}
                            selectedMonogram={selectedMonogramBySide.FRONT}
                            fonts={fonts}
                            isMobile={isMobile}
                            view="capture" // Special view mode to force sizes
                            monogramScale={getMonogramScale('FRONT', true)}
                            bottleImageSrc={bottleImageSrc}
                        />
                    </div>
                    <div ref={backCaptureRef}>
                        <BottlePreview
                            side="BACK"
                            customization={customization}
                            selectedColor={selectedColor}
                            selectedSize={selectedSize}
                            selectedFont={selectedFont}
                            selectedMonogram={selectedMonogramBySide.BACK}
                            fonts={fonts}
                            isMobile={isMobile}
                            view="capture"
                            monogramScale={getMonogramScale('BACK', true)}
                            bottleImageSrc={backBottleImageSrc}
                        />
                    </div>

                    {/* VISUAL DESIGN CAPTURES (No Bottle, Just Design) */}
                    <div ref={frontDesignCaptureRef} style={{ width: '433px', height: '650px' }}>
                        <DesignCapture
                            side="FRONT"
                            customization={customization}
                            selectedColor={selectedColor}
                            selectedFont={selectedFont}
                            selectedMonogram={selectedMonogramBySide.FRONT}
                            fonts={fonts}
                            monogramScale={getMonogramScale('FRONT', true)}
                            isMobile={isMobile}
                            selectedSize={selectedSize}
                        />
                    </div>
                    <div ref={backDesignCaptureRef} style={{ width: '433px', height: '650px' }}>
                        <DesignCapture
                            side="BACK"
                            customization={customization}
                            selectedColor={selectedColor}
                            selectedFont={selectedFont}
                            selectedMonogram={selectedMonogramBySide.BACK}
                            fonts={fonts}
                            monogramScale={getMonogramScale('BACK', true)}
                            isMobile={isMobile}
                            selectedSize={selectedSize}
                        />
                    </div>
                </div>
            )}

            {/* Full-screen loader while preparing review */}
            {isPreparingReview && (
                <div className="fixed inset-0 z-[60] bg-white/95 flex flex-col items-center justify-center">
                    <div className="w-14 h-14 border-4 border-gray-300 border-t-black rounded-full animate-spin mb-4"></div>
                    <p className="text-lg font-semibold text-black">{t('loader.preparingDesign')}</p>
                </div>
            )}

            {/* Review Screen Modal */}
            {showReview && (
                <ReviewScreen
                    onClose={() => setShowReview(false)}
                    onRequestClose={requestParentClose}
                    customization={customization}
                    customWorld={customWorld}
                    selectedColor={selectedColor}
                    selectedSize={selectedSize}
                    selectedFont={selectedFont}
                    selectedMonogramBySide={selectedMonogramBySide}
                    fonts={fonts}
                    monogramStyles={monogramStyles}
                    convertToCircleGlyphs={convertToCircleGlyphs}
                    getCircleFontFamily={getCircleFontFamily}
                    usesCircleGlyphs={usesCircleGlyphs}
                    convertToNGramGlyphs={convertToNGramGlyphs}
                    getNGramFontFamily={getNGramFontFamily}
                    usesNGramGlyphs={usesNGramGlyphs}
                    getMonogramFontSize={getMonogramFontSize}
                    shouldDisplayMonogram={shouldDisplayMonogram}
                    setActiveTab={setActiveTab}
                    setView={setView}
                    frontImage={capturedImages.front}
                    backImage={capturedImages.back}
                    frontDesignImage={capturedImages.frontDesign}
                    backDesignImage={capturedImages.backDesign}
                    frontProductionImage={capturedImages.frontProduction}
                    backProductionImage={capturedImages.backProduction}
                    frontProductionSvg={capturedImages.frontProductionSvg}
                    backProductionSvg={capturedImages.backProductionSvg}
                    autoSubmit={autoSubmitReview}
                />
            )}
        </div>
    );
};


export default Customizer;



