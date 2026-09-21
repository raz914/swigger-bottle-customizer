import React, { useCallback, useState, useEffect } from 'react';
import ConfirmationModal from './ConfirmationModal';
import { t } from '../i18n';

const ReviewScreen = ({
    onClose,
    onRequestClose,
    customization,
    customWorld,
    selectedColor,
    selectedSize,
    selectedFont,
    selectedMonogramBySide, // { FRONT: '...', BACK: '...' }
    frontImage, // Received from parent (snapshot)
    backImage,   // Received from parent (snapshot)
    frontDesignImage,
    backDesignImage,
    frontProductionImage,
    backProductionImage,
    frontProductionSvg,
    backProductionSvg,
    setActiveTab,
    setView,
    autoSubmit = false
}) => {
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [showConfirmationModal, setShowConfirmationModal] = useState(false);
    const [isProcessingModal, setIsProcessingModal] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // Listen for status messages from the parent window
    useEffect(() => {
        const handleMessage = (event) => {
            const payload = event.data;
            if (payload.type === 'BEFIT_SWIGGER_V2_ADD_TO_CART_STATUS') {
                if (payload.status === 'success') {
                    setIsSuccess(true);
                    setIsAddingToCart(false);
                    setIsProcessingModal(false);

                    // Always wait 1.5s for the success message to be seen before closing/redirecting
                    setTimeout(() => {
                        if (showConfirmationModal) {
                            onClose(); // Return to editor (this will unmount ReviewScreen)
                        } else {
                            // If modal wasn't used but we were adding, still close
                            onRequestClose();
                        }
                    }, 1500);
                } else if (payload.status === 'error') {
                    setIsAddingToCart(false);
                    setIsProcessingModal(false);
                    setShowConfirmationModal(false);
                    setErrorMessage(payload.message || t('review.errorDefault'));
                }
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [showConfirmationModal, onClose, onRequestClose]);

    // Handle auto-submit on mount if enabled
    useEffect(() => {
        if (autoSubmit) {
            setShowConfirmationModal(true);
        }
    }, [autoSubmit]);

    // "Add to Cart" logic
    const handleAddToCart = useCallback(async (quantity = 1, continueEditing = false) => {
        // Collect all customization data
        const frontGraphicSrc =
            customization.FRONT.graphic && typeof customization.FRONT.graphic.src === 'string' && customization.FRONT.graphic.src.startsWith('gallery/')
                ? customization.FRONT.graphic.src
                : '';
        const backGraphicSrc =
            customization.BACK.graphic && typeof customization.BACK.graphic.src === 'string' && customization.BACK.graphic.src.startsWith('gallery/')
                ? customization.BACK.graphic.src
                : '';

        const customizationData = {
            color: selectedColor,
            size: selectedSize || '',
            font: selectedFont,
            frontMonogramStyle: selectedMonogramBySide?.FRONT || '',
            backMonogramStyle: selectedMonogramBySide?.BACK || '',
            monogramStyle: selectedMonogramBySide?.BACK || '',
            frontText: customization.FRONT.text || '',
            backText: customization.BACK.text || '',
            frontMonogram: customization.FRONT.monogram || '',
            backMonogram: customization.BACK.monogram || '',
            frontGraphic: customization.FRONT.graphic ? customization.FRONT.graphic.name : '',
            backGraphic: customization.BACK.graphic ? customization.BACK.graphic.name : '',
            frontJerseyName: customization.FRONT.jerseyName || '',
            frontJerseyNumber: customization.FRONT.jerseyNumber || '',
            backJerseyName: customization.BACK.jerseyName || '',
            backJerseyNumber: customization.BACK.jerseyNumber || '',
            frontGraphicSrc,
            backGraphicSrc,
            frontImage: frontImage || '',
            backImage: backImage || '',
            _frontDesignImage: frontDesignImage || '',
            _backDesignImage: backDesignImage || '',
            _frontProductionImage: frontProductionImage || '',
            _backProductionImage: backProductionImage || '',
            _frontProductionSvg: frontProductionSvg || '',
            _backProductionSvg: backProductionSvg || '',
        };

        if (customWorld && customWorld.enabled) {
            customizationData.customWorldEnabled = true;
            customizationData.customWorldName = customWorld.name;
            customizationData.customWorldRoots = customWorld.roots;
            customizationData.customWorldHobbies = customWorld.hobbies;
            customizationData.customWorldFuture = customWorld.future;
            customizationData.customWorldMotto = customWorld.motto;
            customizationData.customWorldStyle = (customWorld.style || []).join(', ');
            customizationData.customWorldDoDont = customWorld.doDont;
        }

        let gravureType = '';
        const hasUpload = customization.FRONT.graphic?.isUpload || customization.BACK.graphic?.isUpload;
        const hasGallery = customization.FRONT.graphic || customization.BACK.graphic;
        const hasJersey = customization.FRONT.jerseyName || customization.FRONT.jerseyNumber || customization.BACK.jerseyName || customization.BACK.jerseyNumber;
        const hasMonogram = customization.FRONT.monogram || customization.BACK.monogram;
        const hasText = customization.FRONT.text || customization.BACK.text;

        if (hasUpload) gravureType = 'Eigen Design';
        else if (hasGallery) gravureType = 'Afbeelding uit Galerij';
        else if (hasJersey) gravureType = 'Jersey';
        else if (hasMonogram) gravureType = 'Monogram';
        else if (hasText) gravureType = 'Tekst';

        if (gravureType !== '') {
            customizationData['Gekozen Gravure Per Item'] = gravureType;
        }

        setErrorMessage('');

        if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
            setIsProcessingModal(true);
            if (!continueEditing) {
                setIsAddingToCart(true);
            }

            window.parent.postMessage({
                type: 'BEFIT_SWIGGER_V2_ADD_TO_CART',
                data: customizationData,
                quantity: quantity,
                continueEditing: continueEditing
            }, '*');
        } else {
            onRequestClose();
        }

    }, [customization, selectedColor, selectedFont, selectedMonogramBySide, frontImage, backImage, frontDesignImage, backDesignImage, frontProductionImage, backProductionImage, frontProductionSvg, backProductionSvg, onRequestClose]);

    const handleEdit = (side) => {
        setActiveTab(side);
        const config = customization[side];
        if (config.graphic) {
            setView('gallery');
        } else if (config.monogram) {
            setView('monogram');
        } else {
            setView('text');
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[150] flex flex-col font-sans text-slate-900" style={{ backgroundColor: autoSubmit ? 'transparent' : 'white' }}>
            {/* Header with Logo */}
            <header className="bg-white border-b border-gray-200 flex-shrink-0" style={{ display: autoSubmit ? 'none' : 'block' }}>
                <div className="w-full px-4 lg:px-[60px] h-14 lg:h-16 flex items-center justify-between">
                    <div className="flex-shrink-0">
                        <img
                            src="logo.png"
                            alt={t('review.logoAlt')}
                            className="h-8 lg:h-10 w-auto object-contain"
                        />
                    </div>

                    <nav className="flex space-x-4 lg:space-x-8 h-full">
                        {['FRONT', 'BACK'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => handleEdit(tab)}
                                className="relative h-full flex flex-col items-center justify-center px-1 min-h-[3.5rem] text-xs lg:text-sm font-bold tracking-widest transition-colors capitalize text-gray-400 hover:text-gray-600"
                            >
                                <span>{tab === 'FRONT' ? t('tab.front') : t('tab.back')}</span>
                                <span className="text-[10px] lg:text-xs font-normal tracking-wider normal-case mt-0.5 text-gray-400 opacity-90">
                                    {tab === 'FRONT' ? t('tab.frontPrice') : t('tab.backPrice')}
                                </span>
                            </button>
                        ))}
                    </nav>

                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </header>

            {/* Content - Scrollable */}
            <main className="flex-1 overflow-y-auto p-0 pb-6 bg-[#f4f4f4]" style={{ display: autoSubmit ? 'none' : 'block' }}>
                <div className="text-center mx-auto pt-4 pb-2 px-4">
                    <h1 className="text-xl lg:text-2xl font-bold text-black tracking-wider mb-1">
                        {t('review.heading')}
                    </h1>
                    <p className="text-sm text-gray-800 font-medium leading-snug">
                        {t('review.deliveryNotice')}
                    </p>
                </div>

                <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-20 pb-20 w-full max-w-4xl mx-auto mt-4 px-4 lg:px-0">
                    <div className="flex flex-col items-center justify-center w-full lg:w-1/2">
                        <div className="relative flex items-center justify-center w-full h-[320px] lg:h-[420px]">
                            {frontImage ? (
                                <img
                                    src={frontImage}
                                    alt={t('review.frontPreviewAlt')}
                                    className="object-contain w-full h-full"
                                />
                            ) : (
                                <div className="text-gray-400 text-sm py-8">{t('review.noPreview')}</div>
                            )}
                        </div>
                        <button
                            onClick={() => handleEdit('FRONT')}
                            className="group w-full max-w-[300px] flex items-center justify-center space-x-2 bg-white px-6 py-2 mt-6 rounded-lg shadow-sm border border-gray-100 font-bold text-black text-xs lg:text-sm tracking-wider hover:shadow-md transition-all"
                        >
                            <span>{t('review.editFront')}</span>
                            <div className="w-6 h-6 rounded-full border border-black flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </button>
                    </div>

                    <div className="flex flex-col items-center justify-center w-full lg:w-1/2 mt-8 lg:mt-0">
                        <div className="relative flex items-center justify-center w-full h-[320px] lg:h-[420px]">
                            {backImage ? (
                                <img
                                    src={backImage}
                                    alt={t('review.backPreviewAlt')}
                                    className="object-contain w-full h-full"
                                />
                            ) : (
                                <div className="text-gray-400 text-sm py-8">{t('review.noPreview')}</div>
                            )}
                        </div>
                        <button
                            onClick={() => handleEdit('BACK')}
                            className="group w-full max-w-[300px] flex items-center justify-center space-x-2 bg-white px-6 py-2 mt-6 rounded-lg shadow-sm border border-gray-100 font-bold text-black text-xs lg:text-sm tracking-wider hover:shadow-md transition-all"
                        >
                            <span>{t('review.editBack')}</span>
                            <div className="w-6 h-6 rounded-full border border-black flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </button>
                    </div>
                </div>
            </main>

            {/* Footer Actions */}
            <footer className="bg-[#f3f4f6] border-t border-gray-200 py-2 px-2 lg:py-3 lg:px-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50 flex-shrink-0" style={{ display: autoSubmit ? 'none' : 'block' }}>
                <div className="flex flex-col lg:flex-row lg:items-center gap-2">
                    <div className="flex-1 text-center lg:text-left lg:pl-[60px]">
                        {errorMessage ? (
                            <p className="text-sm font-medium text-red-600">{errorMessage}</p>
                        ) : (
                            <p className="text-sm font-medium text-gray-500">{t('review.footerNotice')}</p>
                        )}
                    </div>
                    <div className="max-w-md lg:max-w-none mx-auto lg:mx-0 lg:w-[35%] flex space-x-3 w-full lg:px-12">
                        <button
                            onClick={onClose}
                            disabled={isAddingToCart}
                            className={`flex-1 px-6 py-3 rounded-full text-xs bg-white/90 border border-gray-200 text-gray-600 font-bold tracking-widest transition-all duration-300 capitalize shadow-sm ${isAddingToCart ? 'bg-white/50 text-gray-400 cursor-not-allowed' : 'hover:shadow-md hover:-translate-y-0.5 hover:text-black hover:border-gray-300'}`}
                        >
                            {t('review.backButton')}
                        </button>
                        <button
                            onClick={() => setShowConfirmationModal(true)}
                            disabled={isAddingToCart}
                            className={`flex-1 px-6 py-3 rounded-full text-xs bg-black !text-white font-bold tracking-widest transition-all duration-300 capitalize whitespace-nowrap shadow-md ${isAddingToCart ? 'bg-gray-400 text-white cursor-not-allowed' : 'hover:bg-gray-800 hover:shadow-lg hover:-translate-y-0.5'}`}
                            style={{ color: 'white' }}
                        >
                            <span style={{ color: 'white' }}>
                                {isAddingToCart ? t('review.adding') : t('review.addToCart')}
                            </span>
                        </button>
                    </div>
                </div>
            </footer>

            <ConfirmationModal
                isOpen={showConfirmationModal}
                isProcessing={isProcessingModal}
                isSuccess={isSuccess}
                onClose={() => setShowConfirmationModal(false)}
                onConfirm={(qty, keepEditing) => {
                    handleAddToCart(qty, keepEditing);
                }}
                autoConfirm={autoSubmit}
            />
        </div>
    );
};

export default ReviewScreen;
