import React from 'react';
import { t } from '../i18n';

const MiniNav = ({ setView, activeView, activeTab }) => {
    const allNavItems = [
        { id: 'upload', label: t('miniNav.upload'), icon: 'UI/icons/upload.svg' },
        { id: 'text', label: t('miniNav.text'), icon: 'UI/icons/text.png' },
        { id: 'monogram', label: t('miniNav.monogram'), icon: null, isMonogram: true },
        { id: 'gallery', label: t('miniNav.gallery'), icon: 'UI/icons/gallery.svg' },
        { id: 'customWorld', label: 'Maatwerk', isCustomWorld: true },
    ];

    const navItems = allNavItems;

    return (
            <div className="hidden lg:grid grid-cols-5 gap-2 lg:gap-3 mb-8 w-full max-w-[calc(42rem+40px)]">
            {navItems.map((item) => {
                const isActive = activeView === item.id;
                return (
                    <button
                        key={item.id}
                        onClick={!isActive ? () => setView(item.id) : undefined}
                        className={`group flex flex-col items-center gap-2 ${isActive ? 'cursor-default' : ''} min-w-0`}
                    >
                        <div
                            className={`w-full aspect-square lg:aspect-[8.25/6] rounded-[20px] flex items-center justify-center transition-all duration-300 backdrop-blur-xl border
                                ${isActive
                                    ? 'bg-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border-gray-400 scale-105'
                                    : 'bg-white/60 shadow-[0_4px_20px_rgb(0,0,0,0.04)] border-white/60 group-hover:bg-white/80 group-hover:-translate-y-1'
                                }
                            `}
                        >
                            {item.isMonogram ? (
                                <span
                                    style={{
                                        fontFamily: 'Three Character N-Gram',
                                        fontSize: '2rem',
                                        lineHeight: 1,
                                        color: 'currentColor',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    {'?rJ*'}
                                </span>
                            ) : item.isQuotes ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-black scale-125">
                                    <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path>
                                    <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"></path>
                                </svg>
                            ) : item.isCustomWorld ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-black scale-125">
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                </svg>
                            ) : (
                                <img
                                    src={item.icon}
                                    className={`object-contain scale-[80%] ${item.id === 'upload' ? 'w-6 h-6 lg:w-8 lg:h-8' : 'w-7 h-7 lg:w-12 lg:h-12'}`}
                                    alt={item.label}
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                            )}
                        </div>
                        <span
                            className="text-[9px] lg:text-[10px] font-bold text-gray-900 text-center w-full leading-tight capitalize"
                            style={{ letterSpacing: '1.8px' }}
                        >
                            {item.label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};

export default MiniNav;



