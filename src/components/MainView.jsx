import React from 'react';
import OptionCard from './OptionCard';
import { t } from '../i18n';

const MainView = ({ setView, activeTab, openGallery, openGalleryCategory }) => {
    return (
        <div className="w-full max-w-4xl mx-auto lg:mt-12 lg:px-0">
            <h3
                className="text-center text-[13px] lg:text-[15px] font-bold text-gray-700 mb-1 lg:mb-2"
                style={{ letterSpacing: '1.8px' }}
            >
                {t('main.heading')}
            </h3>
            <p
                className="text-center text-[12px] lg:text-[14px] text-gray-400 mb-6 lg:mb-12 tracking-widest font-light"
            >
                Vanaf €10,- per zijde
            </p>

            <div className="flex justify-start lg:justify-center w-full px-2">
                <div className="grid grid-cols-3 gap-3 lg:gap-6 w-full lg:w-full lg:max-w-[40rem] mx-auto">
                    <OptionCard
                        icon="UI/icons/upload.svg"
                        label={t('main.uploadOwn')}
                        onClick={() => setView('upload')}
                        scale={0.45}
                    />
                    <OptionCard
                        icon="UI/icons/text.png"
                        label={t('main.text')}
                        isImage={true}
                        onClick={() => setView('text')}
                    />

                    <OptionCard
                        icon="UI/icons/gallery.svg"
                        label={t('main.gallery')}
                        onClick={openGallery}
                    />
                    <OptionCard
                        renderIcon={() => (
                            <span
                                style={{
                                    fontFamily: 'Three Character N-Gram',
                                    fontSize: '4.5rem',
                                    lineHeight: 1,
                                    color: '#1a1a1a',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                {'?rJ*'}
                            </span>
                        )}
                        label={t('main.monogram')}
                        onClick={() => setView('monogram')}
                    />

                    <OptionCard
                        renderIcon={() => (
                            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-black">
                                <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path>
                                <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"></path>
                            </svg>
                        )}
                        label="Quotes"
                        onClick={() => setView('quotes')}
                    />

                    <OptionCard
                        renderIcon={() => (
                            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-black">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                            </svg>
                        )}
                        label="Custom Artwork"
                        onClick={() => setView('customWorld')}
                    />
                </div>
            </div>
        </div>
    );
};

export default MainView;



