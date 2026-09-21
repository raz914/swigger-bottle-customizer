import React, { useState, useEffect, useRef } from 'react';
import { t } from '../i18n';

const ConfirmationModal = ({ isOpen, isProcessing, isSuccess, onClose, onConfirm, autoConfirm = false }) => {
    const [agreed, setAgreed] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [hasConfirmed, setHasConfirmed] = useState(false);
    const timeoutRef = useRef(null);

    // Reset all local state every time the modal opens fresh.
    useEffect(() => {
        if (isOpen) {
            setAgreed(false);
            if (autoConfirm) {
                setHasConfirmed(true);
                // Call onConfirm automatically to start the process
                setTimeout(() => {
                    onConfirm(1, false);
                }, 100);
            } else {
                setHasConfirmed(false);
            }
        } else {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        }
    }, [isOpen]);

    // When hasConfirmed flips true (loading started), start a 30s safety timer.
    useEffect(() => {
        if (hasConfirmed && !isSuccess && !isProcessing) {
            timeoutRef.current = setTimeout(() => {
                setHasConfirmed(false);
            }, 30000);
        }
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        };
    }, [hasConfirmed, isSuccess, isProcessing]);

    // Also reset hasConfirmed when isProcessing becomes false after an error
    useEffect(() => {
        if (hasConfirmed && isProcessing === false && isSuccess === false) {
            const t = setTimeout(() => setHasConfirmed(false), 2000);
            return () => clearTimeout(t);
        }
    }, [isProcessing, isSuccess, hasConfirmed]);

    if (!isOpen) return null;

    const handleConfirm = (qty, keepEditing) => {
        if (!agreed) return;
        setHasConfirmed(true);
        onConfirm(qty, keepEditing);
    };

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/75 p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative overflow-hidden flex flex-col max-h-[90vh]">
                {/* Close Button */}
                {!hasConfirmed && (
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}

                {/* Content */}
                <div className="p-6 flex flex-col h-full overflow-hidden bg-white">
                    {hasConfirmed ? (
                        <div className="flex flex-col items-center justify-center py-8 animate-in zoom-in duration-300">
                            {!isSuccess ? (
                                <div className="flex flex-col items-center w-full px-4 py-12">
                                    <img
                                        src="befit-loader-logo.jpg"
                                        alt="Be Fit"
                                        className="h-48 w-auto mb-10"
                                    />
                                    <p className="text-black font-bold text-[13px] tracking-[4px] mb-8">Bezig met toevoegen...</p>
                                    <div className="w-full h-[4px] bg-gray-100 rounded-full overflow-hidden max-w-[280px]">
                                        <div className="h-full bg-black animate-[loading_2s_ease-in-out_infinite]" style={{ width: '100%' }}></div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-4 animate-bounce">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <h2 className="text-xl font-black text-black tracking-wide text-center">
                                        Gelukt!
                                    </h2>
                                    <p className="text-sm text-gray-500 font-bold mt-1 text-center">
                                        {quantity} {quantity === 1 ? 'fles' : 'flessen'} toegevoegd aan winkelwagen
                                    </p>
                                </>
                            )}
                        </div>
                    ) : (
                        <>
                            <h2 className="text-lg font-bold text-black text-left pr-10 tracking-wider mb-3">
                                {t('confirm.heading')}
                            </h2>

                            <div className="flex-1 overflow-y-auto pr-2 mb-3 text-sm text-gray-600 leading-relaxed space-y-2 custom-scrollbar">
                                {[1, 2, 3, 4, 5, 6].map(i => {
                                    const text = t(`confirm.body${i}`);
                                    if (!text) return null;
                                    return <p key={i}>{text}</p>;
                                })}
                            </div>

                            <label className="flex items-center space-x-3 mb-4 cursor-pointer group">
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={agreed}
                                        onChange={(e) => setAgreed(e.target.checked)}
                                        className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black accent-black cursor-pointer transition-colors"
                                    />
                                </div>
                                <span className="text-[11px] font-bold text-gray-500 group-hover:text-black transition-colors tracking-wide leading-none">
                                    {t('confirm.agreeLabel')}
                                </span>
                            </label>

                            <div className="flex flex-col space-y-3 border-t border-gray-100 pt-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center bg-gray-100 rounded-full px-2 py-1 border border-gray-200">
                                        <button
                                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                            className="w-7 h-7 flex items-center justify-center text-black font-bold hover:bg-white rounded-full transition-all"
                                        >
                                            -
                                        </button>
                                        <span className="mx-2 text-xs font-bold min-w-[1rem] text-center">
                                            {quantity}
                                        </span>
                                        <button
                                            onClick={() => setQuantity(quantity + 1)}
                                            className="w-7 h-7 flex items-center justify-center text-black font-bold hover:bg-white rounded-full transition-all"
                                        >
                                            +
                                        </button>
                                    </div>

                                    <button
                                        onClick={() => handleConfirm(quantity, false)}
                                        className={`flex-1 py-3.5 font-black tracking-wide text-[12px] rounded-full transition-all shadow-lg ${agreed
                                            ? 'bg-black text-white hover:bg-gray-800 active:scale-[0.97]'
                                            : 'bg-gray-100 text-gray-300 cursor-not-allowed shadow-none'
                                            }`}
                                        style={{ color: agreed ? 'white' : '#d1d5db' }}
                                    >
                                        {t('confirm.addAndClose')}
                                    </button>
                                </div>

                                <div className="flex items-center justify-between px-2">
                                    <button
                                        onClick={onClose}
                                        className="text-gray-400 font-bold tracking-wide text-[11px] hover:text-black transition-colors"
                                    >
                                        {t('confirm.cancel')}
                                    </button>

                                    <button
                                        onClick={() => handleConfirm(quantity, true)}
                                        className={`font-bold tracking-wide text-[11px] transition-all underline decoration-2 underline-offset-4 ${agreed
                                            ? 'text-black hover:text-gray-600 active:scale-[0.97]'
                                            : 'text-gray-200 cursor-not-allowed'
                                            }`}
                                    >
                                        {t('confirm.designMore')}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <style>{`
                    .custom-scrollbar::-webkit-scrollbar {
                        width: 6px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                        background: #f1f1f1;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: #cbd5e1;
                        border-radius: 3px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: #94a3b8;
                    }
                `}</style>
            </div>
        </div>
    );
};

export default ConfirmationModal;



