import React, { useState } from 'react';
import { t } from '../i18n';

const ColorSelector = ({ colors, selectedColor, setSelectedColor, selectedSize, setSelectedSize, isMobile }) => {
    const [isOpen, setIsOpen] = useState(false);

    const currentColor = colors.find(c => c.id === selectedColor);
    const sizes = [{ id: '946ml', label: '946ml' }, { id: '536ml', label: '536ml' }];

    return (
        <>
            {/* Mobile Color Picker Trigger */}
            {isMobile && (
                <button
                    id="mobile-color-trigger"
                    onClick={() => setIsOpen(true)}
                    className="absolute top-2.5 right-1.5 lg:hidden flex items-center gap-1 bg-white/90 backdrop-blur-md rounded-full shadow-md px-3 py-1.5 border border-gray-200/60 z-30 transition-all duration-200 active:scale-95"
                >
                    <div className={`w-6 h-6 rounded-full ${currentColor?.bg} ${currentColor?.border || ''} shadow-sm ring-1 ring-black/10`} />
                    <span className="text-[11px] text-gray-600 font-semibold tracking-wide">{t('color.chooseColor')}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            )}

            {/* Mobile Color Selection Modal */}
            {isMobile && isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Modal Content */}
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all">
                        {/* Close Button */}
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <div className="p-8 pt-10">
                            <h3 className="text-xl font-bold text-black leading-tight mb-2 tracking-wide capitalize">
                                {t('product.heading')}
                            </h3>

                            <hr className="mb-6 opacity-20" />

                            <div className="space-y-6">
                                {/* Size Toggle */}
                                <div>
                                    <p className="text-sm font-bold text-gray-500 tracking-widest mb-3">Formaat:</p>
                                    <div className="flex rounded-lg overflow-hidden border border-gray-300 w-fit">
                                        {sizes.map(size => (
                                            <button
                                                key={size.id}
                                                onClick={() => setSelectedSize(size.id)}
                                                className={`px-5 py-2 text-sm font-bold tracking-wide transition-colors ${selectedSize === size.id ? 'bg-black text-white' : 'bg-white text-gray-600'}`}
                                            >
                                                {size.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <p className="text-sm font-bold text-gray-500 capitalize tracking-widest mb-4">
                                        {t('product.colorLabelShort')} <span className="text-black ml-1">{currentColor?.name}</span>
                                    </p>

                                    <div className="flex flex-wrap gap-4">
                                        {colors.map((color) => (
                                            <div key={color.id} className="relative">
                                                <button
                                                    onClick={() => !color.outOfStock && setSelectedColor(color.id)}
                                                    disabled={color.outOfStock}
                                                    style={{ backgroundColor: color.hex }}
                                                    className={`relative w-12 h-12 rounded-full transition-all duration-200
                                                        ${selectedColor === color.id
                                                            ? 'ring-2 ring-black ring-offset-4'
                                                            : `border ${color.lightColor ? 'border-gray-300' : 'border-gray-700'} ring-2 ring-transparent ring-offset-4 hover:scale-105 active:scale-95`}
                                                        ${color.outOfStock ? 'opacity-40 cursor-not-allowed' : ''}
                                                    `}
                                                    title={color.name}
                                                    aria-label={t('color.selectAria', { color: color.name })}
                                                >
                                                    {/* Out of Stock Diagonal Line */}
                                                    {color.outOfStock && (
                                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden rounded-full">
                                                            <div className="w-[150%] h-[2px] bg-red-600 rotate-45 shadow-sm" />
                                                        </div>
                                                    )}
                                                </button>

                                                {/* Status Badge */}
                                                {(color.outOfStock || color.onBackorder) && (
                                                    <div className={`absolute -top-2 -right-2 px-1.5 py-0.5 rounded text-[8px] font-bold capitalize tracking-tighter text-white shadow-sm border border-white/20 ${color.outOfStock ? 'bg-red-600' : 'bg-orange-500'}`}>
                                                        {color.outOfStock ? t('color.outOfStock') : t('color.onBackorder')}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="w-full bg-black text-white font-bold py-4 rounded-lg tracking-widest transition-all active:scale-[0.98] shadow-lg"
                                    style={{ color: 'white' }}
                                >
                                    <span style={{ color: 'white' }}>
                                        {t('color.update')}
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ColorSelector;



