import React, { useState, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import UploadConfirmationModal from './UploadConfirmationModal';
import { cssUrl } from '../utils/metallicStyle';
import { t } from '../i18n';

// Set up the worker for PDF.js
// - Dev: use Vite-served worker URL
// - Prod: use a copied `.js` worker (some WP hosts serve `.mjs` as text/plain)
import pdfWorkerDevUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = import.meta.env.PROD
    ? new URL('./pdf.worker.min.js', import.meta.url).toString()
    : pdfWorkerDevUrl;

const MAX_MASK_DIMENSION = 1024;

const createMetalMaskFromImage = (img, options = {}) => {
    const {
        removeBg = true,
        invert = false,
        threshold = 140
    } = options;

    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    if (!iw || !ih) return null;

    const scale = Math.min(1, MAX_MASK_DIMENSION / Math.max(iw, ih));
    const width = Math.max(1, Math.round(iw * scale));
    const height = Math.max(1, Math.round(ih * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;

    ctx.drawImage(img, 0, 0, width, height);

    let imageData;
    try {
        imageData = ctx.getImageData(0, 0, width, height);
    } catch (err) {
        console.warn('Failed to read image data for metal mask:', err);
        return null;
    }

    const data = imageData.data;

    // Check if the original image already has native transparent pixels (e.g. true transparent PNG)
    let nativeTransparentCount = 0;
    for (let i = 3; i < data.length; i += 4) {
        if (data[i] < 30) {
            nativeTransparentCount++;
        }
    }
    const isAlreadyTransparentPng = (nativeTransparentCount / (width * height)) > 0.05;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;

        // If the pixel was originally transparent in a PNG
        if (isAlreadyTransparentPng && a < 30) {
            data[i] = 0;
            data[i + 1] = 0;
            data[i + 2] = 0;
            data[i + 3] = 0;
            continue;
        }

        if (!removeBg) {
            // Background removal disabled: keep whatever opacity it had
            data[i] = 0;
            data[i + 1] = 0;
            data[i + 2] = 0;
            data[i + 3] = a;
            continue;
        }

        if (invert) {
            // White artwork on black background:
            // High luminance (white letters) -> Engraved (alpha 255)
            // Low luminance (black background) -> Transparent (alpha 0)
            if (lum > threshold) {
                data[i] = 0;
                data[i + 1] = 0;
                data[i + 2] = 0;
                data[i + 3] = 255;
            } else {
                data[i] = 0;
                data[i + 1] = 0;
                data[i + 2] = 0;
                data[i + 3] = 0;
            }
        } else {
            // Standard: Black/dark artwork on white/light background:
            // Low luminance (dark logo/letters) -> Engraved (alpha 255)
            // High luminance (white background) -> Transparent (alpha 0)
            if (lum < threshold) {
                data[i] = 0;
                data[i + 1] = 0;
                data[i + 2] = 0;
                data[i + 3] = 255;
            } else {
                data[i] = 0;
                data[i + 1] = 0;
                data[i + 2] = 0;
                data[i + 3] = 0;
            }
        }
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL('image/png');
};

const UploadView = ({ setView, setGraphic, graphicInput }) => {
    const fileInputRef = useRef(null);
    const [showModal, setShowModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const [pendingGraphicData, setPendingGraphicData] = useState(null);

    // Aspect ratio limits: Very relaxed
    const MIN_RATIO = 0.1;
    const MAX_RATIO = 10.0;

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadError(null);
        setIsLoading(true);
        setShowModal(false);
        setPendingGraphicData(null);

        const fileName = file.name.toLowerCase();
        const isPdf = fileName.endsWith('.pdf') || file.type === 'application/pdf';

        try {
            let src;
            if (isPdf) {
                try {
                    src = await renderPdfFirstPage(file);
                } catch (pdfErr) {
                    console.error("PDF preview error:", pdfErr);
                    setUploadError(t('upload.errorPdf'));
                    setIsLoading(false);
                    return;
                }
            } else {
                src = await readFileAsDataURL(file);
            }

            const img = new Image();
            img.onload = () => {
                const ratio = img.width / img.height;
                if (ratio < MIN_RATIO || ratio > MAX_RATIO) {
                    setUploadError(t('upload.errorAspectRatio'));
                    setIsLoading(false);
                    return;
                }

                const defaultOptions = { removeBg: true, invert: false, threshold: 140 };
                let maskSrc = null;
                try {
                    maskSrc = createMetalMaskFromImage(img, defaultOptions);
                } catch (err) {
                    console.warn('Failed to generate metal mask:', err);
                }

                // Instead of setting graphic directly, set pending data and show modal
                setPendingGraphicData({
                    src,
                    name: file.name,
                    isUpload: true,
                    scale: 0.5,
                    fileType: fileName.split('.').pop(),
                    maskSrc,
                    ...defaultOptions
                });

                setIsLoading(false);
                setShowModal(true);
            };
            img.onerror = () => {
                setUploadError(t('upload.errorLoadImage'));
                setIsLoading(false);
            };
            img.src = src;

        } catch (error) {
            console.error(error);
            setUploadError(t('upload.errorProcessing'));
            setIsLoading(false);
        }
    };

    const handleConfirmUpload = () => {
        if (pendingGraphicData) {
            setGraphic(pendingGraphicData);
            setPendingGraphicData(null);
            setShowModal(false);
        }
    };

    const handleCancelUpload = () => {
        setPendingGraphicData(null);
        setShowModal(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const readFileAsDataURL = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsDataURL(file);
        });
    };

    const renderPdfFirstPage = async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        // Disable worker to avoid `.mjs` MIME issues on some WP hosts/CDNs.
        // We're only rendering the first page for a preview, so main-thread rendering is acceptable.
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer, disableWorker: true }).promise;
        const page = await pdf.getPage(1);

        // Render to temporary canvas
        const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better quality
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');

        await page.render({ canvasContext: ctx, viewport }).promise;
        return canvas.toDataURL('image/png');
    };

    const handleRemove = () => {
        setGraphic(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleUpdateProcessing = async (newOptions) => {
        if (!graphicInput || !graphicInput.src) return;

        const updatedOptions = {
            removeBg: graphicInput.removeBg !== false,
            invert: !!graphicInput.invert,
            threshold: graphicInput.threshold || 140,
            ...newOptions
        };

        try {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = graphicInput.src;
            });

            const newMaskSrc = createMetalMaskFromImage(img, updatedOptions);
            setGraphic({
                ...graphicInput,
                ...updatedOptions,
                maskSrc: newMaskSrc
            });
        } catch (err) {
            console.warn('Failed to reprocess image mask:', err);
        }
    };

    return (
        <div className="flex flex-col flex-1 min-h-0 w-full max-w-2xl lg:max-w-[calc(33rem+32px)] lg:mx-auto">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/png, image/jpeg, image/jpg, image/bmp, image/svg+xml, application/pdf"
                className="hidden"
            />

            <div className="flex flex-col flex-1 min-h-0 px-4 py-2 overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <button
                        onClick={() => setView('main')}
                        className="flex items-center text-xs font-bold text-gray-900 tracking-wider hover:opacity-70 transition-opacity"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                        </svg>
                        {t('upload.back')}
                    </button>
                </div>

                {/* Error Message */}
                {uploadError && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <div className="flex-1">
                            <p className="text-xs font-bold text-red-700 tracking-wide mb-1">{t('upload.uploadFailed')}</p>
                            <p className="text-xs text-red-600">{uploadError}</p>
                        </div>
                    </div>
                )}

                {/* Main Content */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin mb-4"></div>
                        <span className="text-sm font-bold text-gray-500 tracking-widest">{t('upload.processing')}</span>
                    </div>
                ) : graphicInput ? (
                    <div className="flex flex-col items-center w-full animate-fade-in-up">
                        {/* Processing Controls for Uploaded graphics */}
                        {graphicInput.isUpload && !graphicInput.name?.toLowerCase().endsWith('.svg') && (
                            <div className="w-full bg-white border border-gray-200 rounded-xl p-3.5 mb-4 shadow-sm space-y-3">
                                {/* Toggle 1: Remove Background */}
                                <div
                                    className="flex items-center justify-between cursor-pointer py-1 select-none"
                                    onClick={() => handleUpdateProcessing({ removeBg: graphicInput.removeBg === false })}
                                >
                                    <span className="text-xs font-bold text-gray-900">{t('upload.removeBg')}</span>
                                    <div className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors ${graphicInput.removeBg !== false ? 'bg-black' : 'bg-gray-300'}`}>
                                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${graphicInput.removeBg !== false ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                    </div>
                                </div>

                                {/* Toggle 2: Invert Colors (White on Black) */}
                                <div
                                    className="flex items-center justify-between cursor-pointer py-1 select-none border-t border-gray-100 pt-2"
                                    onClick={() => handleUpdateProcessing({ invert: !graphicInput.invert })}
                                >
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-gray-900">{t('upload.invert')}</span>
                                        <span className="text-[10px] text-gray-500">Handig voor witte letters op zwarte achtergrond</span>
                                    </div>
                                    <div className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors ${graphicInput.invert ? 'bg-black' : 'bg-gray-300'}`}>
                                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${graphicInput.invert ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                    </div>
                                </div>

                                {/* Threshold Slider */}
                                {graphicInput.removeBg !== false && (
                                    <div className="pt-2 border-t border-gray-100">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-[11px] font-bold text-gray-700">{t('upload.contrast')}</span>
                                            <span className="text-[11px] font-semibold text-gray-500">{graphicInput.threshold || 140}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="30"
                                            max="230"
                                            step="5"
                                            value={graphicInput.threshold || 140}
                                            onChange={(e) => handleUpdateProcessing({ threshold: parseInt(e.target.value, 10) })}
                                            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        <button
                            onClick={handleRemove}
                            className="text-xs font-bold text-red-500 underline hover:text-red-700 tracking-wider mb-4 self-end"
                        >
                            {t('upload.removeImage')}
                        </button>

                        {/* Preview State - Adaptive height, no metallic effect */}
                        <div className="w-full max-h-[180px] lg:max-h-[240px] border-2 border-dashed border-gray-300 rounded bg-gray-50 flex items-center justify-center p-4 mb-4 relative overflow-hidden">
                            {graphicInput.maskSrc ? (
                                <div
                                    className="w-full aspect-video max-h-[160px]"
                                    style={{
                                        backgroundColor: '#000000',
                                        maskImage: cssUrl(graphicInput.maskSrc),
                                        WebkitMaskImage: cssUrl(graphicInput.maskSrc),
                                        maskSize: 'contain',
                                        WebkitMaskSize: 'contain',
                                        maskPosition: 'center',
                                        WebkitMaskPosition: 'center',
                                        maskRepeat: 'no-repeat',
                                        WebkitMaskRepeat: 'no-repeat',
                                    }}
                                />
                            ) : (
                                <img
                                    src={graphicInput.src}
                                    alt={t('upload.previewAlt')}
                                    className="max-w-full max-h-full object-contain"
                                    style={{ filter: 'grayscale(100%) contrast(1.5) brightness(0)' }}
                                />
                            )}
                        </div>
                        <p className="text-[10px] text-gray-400 text-center">
                            {t('upload.placementHint')}
                        </p>
                    </div>
                ) : (
                    // INITIAL STATE (Matching Reference)
                    <div className="flex flex-col w-full animate-fade-in-up">
                        {/* Upload Button */}
                        <button
                            onClick={() => fileInputRef.current.click()}
                            className="w-full py-4 bg-white border-2 border-black text-black font-bold text-sm tracking-widest rounded hover:bg-gray-50 transition-colors mb-6 shadow-sm"
                        >
                            {t('upload.uploadDesign')}
                        </button>

                        <p className="text-center text-[10px] lg:text-xs text-gray-700 font-semibold mb-8 tracking-wide">
                            {t('upload.acceptedTypes')}
                        </p>

                        {/* Icons Grid */}
                        <div className="grid grid-cols-4 gap-2 mb-8">
                            {/* 1. Image Size */}
                            <div className="flex flex-col items-center text-center">
                                <div className="w-14 h-14 mb-2 flex items-center justify-center text-gray-900">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                        <polyline points="21 15 16 10 5 21"></polyline>
                                    </svg>
                                </div>
                                <span className="text-[10px] leading-tight text-gray-800 font-medium">
                                    {t('upload.iconImageSize').split('\n').map((line, i) => <span key={i}>{line}{i === 0 && <br />}</span>)}
                                </span>
                            </div>

                            {/* 2. No TM */}
                            <div className="flex flex-col items-center text-center">
                                <div className="w-14 h-14 mb-2 flex items-center justify-center text-gray-900 relative">
                                    <span className="font-serif font-bold text-2xl">TM</span>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-12 h-0.5 bg-gray-900 rotate-45 transform origin-center"></div>
                                    </div>
                                </div>
                                <span className="text-[10px] leading-tight text-gray-800 font-medium">
                                    {t('upload.iconNoTrademark')}
                                </span>
                            </div>

                            {/* 3. No Copyright */}
                            <div className="flex flex-col items-center text-center">
                                <div className="w-14 h-14 mb-2 flex items-center justify-center text-gray-900 relative">
                                    <span className="font-sans font-bold text-3xl">©</span>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-12 h-0.5 bg-gray-900 rotate-45 transform origin-center"></div>
                                    </div>
                                </div>
                                <span className="text-[10px] leading-tight text-gray-800 font-medium">
                                    {t('upload.iconNoCopyright')}
                                </span>
                            </div>

                            {/* 4. No Photos */}
                            <div className="flex flex-col items-center text-center">
                                <div className="w-14 h-14 mb-2 flex items-center justify-center text-gray-900 relative">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                        <circle cx="12" cy="13" r="4"></circle>
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-12 h-0.5 bg-gray-900 rotate-45 transform origin-center"></div>
                                    </div>
                                </div>
                                <span className="text-[10px] leading-tight text-gray-800 font-medium">
                                    {t('upload.iconNoPhotos')}
                                </span>
                            </div>
                        </div>

                        <div className="w-full h-px bg-gray-200 mb-6"></div>

                        {/* Instructions */}
                        <div className="mb-4 space-y-4">
                            <h4 className="text-sm font-bold text-gray-900 tracking-widest mb-4 text-center">{t('upload.instructionsHeading')}</h4>

                            <p className="text-xs text-gray-700 font-medium leading-relaxed text-left">
                                {t('upload.instruction1')}
                            </p>

                            <p className="text-xs text-gray-700 font-medium leading-relaxed text-left">
                                {t('upload.instruction2')}
                            </p>

                            <p className="text-xs text-gray-700 font-medium leading-relaxed text-left">
                                {t('upload.instruction3')}
                            </p>

                            <p className="text-xs text-gray-700 font-medium leading-relaxed text-left">
                                {t('upload.instruction4')}
                            </p>
                        </div>

                    </div>
                )
                }

                {/* Confirmation Modal */}
                <UploadConfirmationModal
                    isOpen={showModal}
                    onClose={handleCancelUpload}
                    onConfirm={handleConfirmUpload}
                />
            </div >
        </div >
    );
};

export default UploadView;

