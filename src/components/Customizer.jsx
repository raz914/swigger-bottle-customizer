import React, { useState, useEffect } from 'react';
import MainView from './MainView';
import TextView from './TextView';
import MonogramView from './MonogramView';
import GalleryView from './GalleryView';
import ColorSelector from './ColorSelector';
import BottomBar from './BottomBar';
import ReviewScreen from './ReviewScreen';
import UploadView from './UploadView';
import BottlePreview from './ItemBottlePreview';
import DesignItemPanel from './DesignItemPanel';
import { areaAspect, constrainItem, summarizeSide } from '../utils/designItems';
import { captureItemSide } from '../utils/itemArtwork';
import MiniNav from './MiniNav';
import SplashScreen from './SplashScreen';
import CustomWorldView from './CustomWorldView';
import { monogramStyles } from '../data/monogramConfig';
import { t } from '../i18n';


// Utility for robust matching: strips non-alphanumeric so "Midnight Black", "midnight-black",
// "midnight black" all match to "midnightblack". Fixes WooCommerce attribute mismatch.
const normalizeColorKey = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

// SWIGGER color definitions per format (Moved outside for robust matching)
const SWIGGER_COLORS_946ML = [
    { id: 'midnight-black', name: 'Midnight Black', hex: '#2C2C2C' },
    { id: 'pure-white', name: 'Pure White', hex: '#F5F5F5', lightColor: true },
    { id: 'white-frost', name: 'White Frost', hex: '#EEE9DC', lightColor: true },
    { id: 'light-grey', name: 'Light Grey', hex: '#D3CEC5', lightColor: true },
    { id: 'sky-blue', name: 'Sky Blue', hex: '#58A9ED', lightColor: true },
    { id: 'deep-navy', name: 'Deep Navy', hex: '#273A68' },
    { id: 'candy-pink', name: 'Candy Pink', hex: '#F29CC0', lightColor: true },
    { id: 'lavender-purple', name: 'Lavender Purple', hex: '#CF77D9', lightColor: true },
    { id: 'forest-green', name: 'Forest Green', hex: '#407A65' },
    { id: 'sage-green', name: 'Sage Green', hex: '#A9B89E', lightColor: true },
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
    const [view, setViewState] = useState('main');
    const [selectedItemId, setSelectedItemId] = useState(null);
    const [editorError, setEditorError] = useState('');
    const setView = (next) => { setSelectedItemId(null); setViewState(next); setEditorError(''); }; // 'main' | 'text' | 'monogram' | 'customWorld'
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


    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        handleResize(); // Initial check
        window.addEventListener('resize', handleResize);

        // Notify parent that we are ready to remove the modal loader
        if (window.parent && window.parent !== window) {
            window.parent.postMessage({ type: 'BEFIT_SWIGGER_V2_READY' }, '*');
        }

        return () => {
            window.removeEventListener('resize', handleResize);
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
    }, [selectedSize]);

    // Show loader ONLY when color or tab changes (URL changes)
    useEffect(() => {
        setIsImageLoading(true);
        // Safety timeout: never show internal loader longer than 3s
        const timer = setTimeout(() => setIsImageLoading(false), 3000);
        return () => clearTimeout(timer);
    }, [selectedColor, activeTab]);

    // No view restrictions needed — all views work on both sides

    const [designState, setCustomization] = useState({
        FRONT: { items: [] }, BACK: { items: [] }
    });
    // Legacy summaries keep existing review/order labels compatible.
    const customization = { FRONT: summarizeSide(designState.FRONT), BACK: summarizeSide(designState.BACK) };
    const activeItems = designState[activeTab].items;
    const selectedItem = activeItems.find(item => item.id === selectedItemId);
    const [defaultFont, setDefaultFont] = useState('BeFit');
    const [defaultMonogram, setDefaultMonogram] = useState('Block Script');
    const selectedFont = selectedItem?.font || defaultFont;
    const selectedMonogram = selectedItem?.monogramStyle || defaultMonogram;
    const selectedMonogramBySide = {
        FRONT: designState.FRONT.items.find(i => i.type === 'monogram')?.monogramStyle || defaultMonogram,
        BACK: designState.BACK.items.find(i => i.type === 'monogram')?.monogramStyle || defaultMonogram,
    };
    const updateItem = (id, patch) => {
        setCustomization(prev => ({ ...prev, [activeTab]: { items: prev[activeTab].items.map(item =>
            item.id === id ? constrainItem({ ...item, ...patch }, areaAspect(selectedSize, activeTab)) : item) } }));
    };
    const selectItem = (id) => {
        setSelectedItemId(id);
        const item = activeItems.find(i => i.id === id);
        if (item) setViewState(item.type === 'graphic' ? (item.graphic?.isUpload ? 'upload' : 'gallery') : item.type);
    };
    const removeItem = (id) => {
        setCustomization(prev => ({ ...prev, [activeTab]: { items: prev[activeTab].items.filter(i => i.id !== id) } }));
        setSelectedItemId(null);
        setEditorError('');
    };
    const artworkReady = (id, aspect) => {
        setCustomization(prev => {
            const item = prev[activeTab].items.find(i => i.id === id);
            if (!item || Math.abs((item.aspect || 1) - aspect) < .0001) return prev;
            return { ...prev, [activeTab]: { items: prev[activeTab].items.map(i => i.id === id
                ? constrainItem({ ...i, aspect }, areaAspect(selectedSize, activeTab)) : i) } };
        });
    };
    const setSelectedFont = font => { setDefaultFont(font); if (selectedItem) updateItem(selectedItem.id, { font }); };
    const setSelectedMonogram = monogramStyle => { setDefaultMonogram(monogramStyle); if (selectedItem) updateItem(selectedItem.id, { monogramStyle }); };
    // Changing bottle format clamps every item to its new printable area.
    useEffect(() => {
        setCustomization(prev => Object.fromEntries(['FRONT', 'BACK'].map(side => [side, {
            items: prev[side].items.map(item => constrainItem(item, areaAspect(selectedSize, side)))
        }])));
    }, [selectedSize]);

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

    const textInput = selectedItem?.type === 'text' ? selectedItem.text : '';
    const monogramInput = selectedItem?.type === 'monogram' ? selectedItem.monogram : '';
    const graphicInput = selectedItem?.type === 'graphic' ? selectedItem.graphic : null;
    const upsertItem = (type, patch) => {
        setEditorError('');
        if (selectedItem?.type === type) {
            updateItem(selectedItem.id, patch);
            return;
        }
        const id = crypto.randomUUID();
        const offset = (activeItems.length % 5) * .055;
        const item = constrainItem({ id, type, x: .5 + offset, y: .4 + offset, width: .7,
            aspect: type === 'text' ? 3 : 1, rotation: 0, font: defaultFont,
            monogramStyle: defaultMonogram, ...patch }, areaAspect(selectedSize, activeTab));
        setCustomization(prev => ({ ...prev, [activeTab]: { items: [...prev[activeTab].items, item] } }));
        setSelectedItemId(id);
    };
    const setTextInput = value => {
        const text = String(value ?? '').replace(/\r\n/g, '\n');
        if (!text.trim()) { if (selectedItem?.type === 'text') removeItem(selectedItem.id); return; }
        upsertItem('text', { text });
    };
    const setMonogramInput = monogram => {
        if (!monogram) { if (selectedItem?.type === 'monogram') removeItem(selectedItem.id); return; }
        upsertItem('monogram', { monogram });
    };
    const setGraphic = graphic => {
        if (!graphic) { if (selectedItem?.type === 'graphic') removeItem(selectedItem.id); return; }
        const patch = { graphic };
        if (selectedItem?.graphic && graphic.src === selectedItem.graphic.src && graphic.scale !== selectedItem.graphic.scale) {
            patch.width = selectedItem.width * (graphic.scale || 1) / (selectedItem.graphic.scale || 1);
        }
        upsertItem('graphic', patch);
    };
    const setIsVertical = isVertical => { if (selectedItem) updateItem(selectedItem.id, { isVertical }); };
    const handleRemove = () => { if (selectedItemId) removeItem(selectedItemId); };

    const hasFrontDesignContent = !!(customization.FRONT.text || customization.FRONT.monogram || customization.FRONT.graphic);
    const hasBackDesignContent = !!(customization.BACK.text || customization.BACK.monogram || customization.BACK.graphic);

    // Determines if any side has content (used for enabling BottomBar review button)
    const hasContent = hasFrontDesignContent || hasBackDesignContent;

    const captureReviewAssets = async () => {
        const [front, back] = await Promise.all([
            captureItemSide(customization.FRONT.items, selectedSize, 'FRONT', fonts, bottleImageSrc, selectedColor),
            captureItemSide(customization.BACK.items, selectedSize, 'BACK', fonts, backBottleImageSrc, selectedColor),
        ]);
        return { frontImg: front.bottle, backImg: back.bottle,
            frontDesignImg: front.design, backDesignImg: back.design,
            frontProductionImg: front.production, backProductionImg: back.production,
            frontProductionSvg: front.svg, backProductionSvg: back.svg };
    };
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
            setEditorError(t('editor.reviewError'));
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
                                onClick={() => { setActiveTab(tab); setSelectedItemId(null); setViewState('main'); }}
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
                                selectedItemId={selectedItemId}
                                onSelectItem={selectItem}
                                onUpdateItem={updateItem}
                                onRemoveItem={removeItem}
                                onArtworkReady={artworkReady}
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
                    <DesignItemPanel items={activeItems} selectedItemId={selectedItemId} onSelect={selectItem} onUpdate={updateItem} onAdd={() => setView('main')} />
                    {editorError && <p role="alert" className="text-red-700 text-sm mb-3">{editorError}</p>}
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
                                isVertical={selectedItem?.isVertical || false}
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
            {(view !== 'main' || hasContent) && (
                <BottomBar
                    onRemove={handleRemove}
                    onAdd={() => setView('main')}
                    hasSelection={!!selectedItem}
                    onReview={handleReview}
                    isDisabled={!hasContent}
                    isPreparing={isPreparingReview}
                />
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



