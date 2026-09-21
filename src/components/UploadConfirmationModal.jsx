import React, { useState } from 'react';
import { t } from '../i18n';

const UploadConfirmationModal = ({ isOpen, onClose, onConfirm }) => {
    const [agreed, setAgreed] = useState(false);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Content */}
                <div className="p-6 lg:p-8 flex flex-col h-full overflow-hidden">
                    <h2 className="text-lg lg:text-xl font-bold text-black text-left pr-10 tracking-wider mb-6 leading-tight">
                        {t('uploadConfirm.heading')}
                    </h2>

                    <div className="flex-1 overflow-y-auto pr-2 mb-6 text-sm text-gray-600 leading-relaxed space-y-4 custom-scrollbar">
                        <p>{t('uploadConfirm.body1')}</p>

                        <h3 className="font-bold text-gray-800 text-xs tracking-wider">{t('uploadConfirm.repWarrantiesHeading')}</h3>
                        <p>{t('uploadConfirm.repWarrantiesBody')}</p>

                        <h3 className="font-bold text-gray-800 text-xs tracking-wider">{t('uploadConfirm.liabilityHeading')}</h3>
                        <p>{t('uploadConfirm.liabilityBody')}</p>

                        <h3 className="font-bold text-gray-800 text-xs tracking-wider">{t('uploadConfirm.indemnificationHeading')}</h3>
                        <p>{t('uploadConfirm.indemnificationBody')}</p>
                    </div>

                    {/* Agreement Checkbox */}
                    <label className="flex items-start space-x-3 mb-8 cursor-pointer group flex-shrink-0">
                        <div className="flex items-center h-5 mt-0.5">
                            <input
                                type="checkbox"
                                checked={agreed}
                                onChange={(e) => setAgreed(e.target.checked)}
                                className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black cursor-pointer transition-colors"
                            />
                        </div>
                        <span className="text-sm font-semibold text-gray-800 group-hover:text-black transition-colors">
                            {t('uploadConfirm.agreeLabel')}
                        </span>
                    </label>

                    {/* Buttons */}
                    <div className="flex space-x-4 flex-shrink-0">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 bg-white text-black border border-black font-bold capitalize tracking-wide text-xs hover:bg-gray-50 transition-colors rounded shadow-sm"
                        >
                            {t('uploadConfirm.cancel')}
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={!agreed}
                            className={`flex-1 py-3 font-bold capitalize tracking-wide text-xs rounded shadow-sm transition-all ${agreed
                                ? 'bg-black text-white hover:bg-gray-800'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                            style={{ color: 'white' }}
                        >
                            <span style={{ color: 'white' }}>
                                {t('uploadConfirm.submit')}
                            </span>
                        </button>
                    </div>
                </div>
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
    );
};

export default UploadConfirmationModal;



