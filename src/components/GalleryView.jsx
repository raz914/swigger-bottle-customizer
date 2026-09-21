import React, { useEffect, useState, useRef } from 'react';
import { galleryCategories, galleryIcons } from '../data/galleryData';
import { t } from '../i18n';

const GalleryView = ({ setView, setGraphic, selectedGraphic, activeTab, initialCategory }) => {
    const [view, setViewInternal] = useState('categories'); // 'categories' | 'icons'
    const [activeCategory, setActiveCategory] = useState(null);
    const contentRef = useRef(null);

    useEffect(() => {
        if (!initialCategory || !galleryIcons[initialCategory]?.length) return;
        setActiveCategory(initialCategory);
        setViewInternal('icons');
        if (contentRef.current) {
            contentRef.current.scrollTop = 0;
        }
    }, [initialCategory]);

    const handleCategoryClick = (category) => {
        setActiveCategory(category);
        setViewInternal('icons');
        // Reset scroll position of content area
        if (contentRef.current) {
            contentRef.current.scrollTop = 0;
        }
    };

    const handleIconClick = (icon) => {
        // Use existing scale if it exists, otherwise 1.0
        const currentScale = selectedGraphic?.scale || 1.0;
        setGraphic({ ...icon, scale: currentScale });
    };

    const handleBackClick = () => {
        if (view === 'icons') {
            setViewInternal('categories');
            setActiveCategory(null);
            // Reset scroll position
            if (contentRef.current) {
                contentRef.current.scrollTop = 0;
            }
        } else {
            setView('main');
        }
    };

    /** Translate a gallery category name via i18n key */
    const catName = (cat) => t(`gallery.cat.${cat.id}`) || cat.name;

    return (
        <div className="flex flex-col flex-1 min-h-0 w-full lg:max-w-[calc(33rem+32px)] lg:mx-auto">

            {/* Header / Navigation */}
            <button
                onClick={handleBackClick}
                className="flex items-center text-black font-bold text-xs lg:text-sm mb-1 lg:mb-2 hover:text-gray-600 transition-colors w-fit py-1 pr-4 relative z-[60]"
                style={{ letterSpacing: '1.8px' }}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="border-b-2 border-black leading-tight">
                    {view === 'categories' ? t('common.back', 'Terug') : t('gallery.backToCategories')}
                </span>
            </button>

            {/* Selected Graphic Controls */}
            {selectedGraphic && !selectedGraphic.isUpload && (
                <div className="mb-6 flex flex-col items-start w-full px-1">
                    <div className="flex justify-between w-full mb-1">
                        <span className="text-[10px] font-bold text-gray-400 tracking-widest px-1">
                            {t('gallery.selectedLabel', { name: selectedGraphic.name })} - {Math.round((selectedGraphic.scale || 1) * 100)}%
                        </span>
                    </div>
                    <input
                        type="range"
                        min="0.2"
                        max="1.0"
                        step="0.05"
                        value={selectedGraphic.scale || 1}
                        onChange={(e) => setGraphic({ ...selectedGraphic, scale: parseFloat(e.target.value) })}
                        className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
                    />
                </div>
            )}

            <div ref={contentRef} className="flex-1 min-h-0 overflow-y-auto pr-4 pb-6 custom-scrollbar lg:max-h-[500px]">

                {/* Categories Grid */}
                {view === 'categories' && (
                    <div className="grid grid-cols-3 gap-[13px] lg:gap-4">
                        {galleryCategories.map((cat) => (
                            <div key={cat.id} className="flex flex-col items-center gap-2">
                                <button
                                    onClick={() => handleCategoryClick(cat.id)}
                                    className="aspect-square w-full max-h-[110px] lg:max-h-[130px] bg-white border border-gray-200 rounded-lg flex items-center justify-center p-2 lg:p-3 shadow-md hover:border-[#00A86B] hover:shadow-lg transition-all group overflow-hidden"
                                >
                                    {/* Category Preview Icon */}
                                    <img
                                        src={galleryIcons[cat.id]?.[0]?.src}
                                        alt={catName(cat)}
                                        className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                                    />
                                </button>
                                <span className={`font-bold text-gray-600 tracking-wider text-center leading-tight capitalize
                                    ${catName(cat).length > 8 ? 'text-[10px]' : 'text-xs'}
                                `} style={{ letterSpacing: '1.8px' }}>
                                    {catName(cat)}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Icons Grid */}
                {view === 'icons' && activeCategory && (
                    <div>
                        <h3 className="text-sm font-bold text-gray-500 mb-4 capitalize" style={{ letterSpacing: '1.8px' }}>
                            {catName(galleryCategories.find(c => c.id === activeCategory))}
                        </h3>
                        <div className="grid grid-cols-3 gap-[13px] lg:gap-4">
                            {galleryIcons[activeCategory]?.map((icon) => (
                                <button
                                    key={icon.id}
                                    onClick={() => handleIconClick(icon)}
                                    className={`aspect-square w-full max-h-[110px] lg:max-h-[130px] bg-white border rounded-md flex items-center justify-center p-2 lg:p-3 shadow-md transition-all overflow-hidden
                                        ${selectedGraphic?.id === icon.id
                                            ? 'border-[#00A86B] ring-1 ring-[#00A86B] shadow-lg'
                                            : 'border-gray-200 hover:border-[#00A86B] hover:shadow-lg'
                                        }
                                    `}
                                >
                                    <img
                                        src={icon.src}
                                        alt={icon.name}
                                        className="w-full h-full object-contain"
                                    />
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
            `}</style>
        </div>
    );
};

export default GalleryView;



