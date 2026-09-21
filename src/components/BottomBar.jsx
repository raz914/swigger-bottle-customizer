import React from 'react';
import { t } from '../i18n';

const BottomBar = ({ onRemove, onReview, isDisabled, isPreparing }) => {
    const reviewDisabled = isDisabled || isPreparing;

    return (
        <div className="w-full bg-white/70 backdrop-blur-xl border-t border-white/60 py-3 px-2 lg:py-4 lg:px-[30px] shadow-[0_-8px_30px_rgb(0,0,0,0.04)] z-50 mt-auto">
            <div className="max-w-md lg:max-w-none mx-auto flex space-x-3 w-full lg:px-[30px] lg:justify-end">
                <button
                    onClick={onRemove}
                    disabled={isDisabled || isPreparing}
                    className={`flex-1 lg:flex-none lg:w-48 py-3 font-bold capitalize tracking-widest text-xs rounded-full transition-all duration-300 shadow-sm ${isDisabled || isPreparing
                            ? 'bg-white/50 text-gray-400 cursor-not-allowed'
                            : 'bg-white/90 border border-white/60 text-gray-600 hover:shadow-md hover:-translate-y-0.5 hover:text-red-500'
                        }`}
                    style={{ letterSpacing: '1.8px' }}>
                    {t('bottomBar.remove')}
                </button>
                <button
                    onClick={onReview}
                    disabled={reviewDisabled}
                    className={`flex-1 lg:flex-none lg:w-48 py-3 font-bold capitalize tracking-widest text-xs rounded-full transition-all duration-300 shadow-md ${reviewDisabled
                            ? 'bg-gray-400 text-white cursor-not-allowed'
                            : 'bg-black text-white hover:bg-gray-800 hover:shadow-lg hover:-translate-y-0.5'
                        }`}
                    style={{ letterSpacing: '1.8px' }}>
                    <span className="!text-white" style={{ color: 'white' }}>
                        {isPreparing ? t('bottomBar.preparing') : t('bottomBar.review')}
                    </span>
                </button>
            </div>
        </div>
    );
};

export default BottomBar;



