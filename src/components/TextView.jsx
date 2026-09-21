import React, { useEffect, useRef } from 'react';
import { motivatieQuotes } from '../data/galleryData';
import { t } from '../i18n';

const BEFIT_FONT_NAMES = ['BeFit', 'BeFit Slim', 'BeFit Bold Italic'];

const TextView = ({
    setView,
    textInput,
    setTextInput,
    normalFonts = [],
    selectedFont,
    setSelectedFont,
    activeTab,
    isVertical,
    setIsVertical
}) => {
    const MAX_CHARS_PER_LINE = 20;
    const MAX_FRONT_LINES = 6;
    const MAX_FRONT_TOTAL = 125;
    const textAreaRef = useRef(null);

    // All fonts: Merge and de-duplicate by name
    const allFonts = normalFonts;
    const befitFonts = allFonts.filter(f => BEFIT_FONT_NAMES.includes(f.name));
    const otherFonts = allFonts.filter(f => !BEFIT_FONT_NAMES.includes(f.name));

    // Auto-resize textarea
    useEffect(() => {
        if (textAreaRef.current) {
            textAreaRef.current.style.height = 'auto';
            textAreaRef.current.style.height = textAreaRef.current.scrollHeight + 'px';
        }
    }, [textInput]);

    const labelStyle = { letterSpacing: '1.8px' };

    const FontButton = ({ font }) => (
        <button
            key={font.name}
            onClick={() => setSelectedFont(font.name)}
            className={`
                w-12 h-12 rounded flex items-center justify-center transition-all bg-white overflow-hidden
                ${selectedFont === font.name
                    ? 'border-2 border-black shadow-sm'
                    : 'border border-gray-300 hover:border-gray-400'
                }
            `}
            style={{
                fontFamily: font.style.fontFamily,
                fontWeight: font.style.fontWeight,
                fontStyle: font.style.fontStyle,
            }}
            title={font.name}
            aria-label={`Select font ${font.name}`}
        >
            <span className="text-lg leading-none">Aa</span>
        </button>
    );

    return (
        <div className="flex flex-col flex-1 min-h-0 w-full max-w-2xl lg:max-w-[calc(33rem+32px)] lg:mx-auto">

            {/* Back Button */}
            <button
                onClick={() => setView('main')}
                className="flex items-center text-black font-bold text-xs lg:text-sm mb-1 lg:mb-2 hover:text-gray-600 transition-colors w-fit py-1 pr-4 relative z-[60]"
                style={labelStyle}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="border-b-2 border-black leading-tight">{t('common.back', 'Terug')}</span>
            </button>

            <div className="flex-1 overflow-y-auto pl-2 pr-4 pb-6">

                {/* Text Input */}
                <div className="bg-white rounded-lg shadow-sm mb-3 border border-gray-200 flex items-center flex-shrink-0">
                    <textarea
                        value={textInput}
                        onChange={(e) => {
                            const raw = String(e.target.value || '').replace(/\r\n/g, '\n');
                            // If vertical text: max 18 chars per line. Else default horizontal: 30. Front side: MAX_CHARS_PER_LINE (20)
                            const maxChars = activeTab === 'FRONT' ? MAX_CHARS_PER_LINE : 18;
                            let lines = raw.split('\n').map(line => line.slice(0, maxChars));
                            if (activeTab === 'FRONT') {
                                lines = lines.slice(0, MAX_FRONT_LINES);
                            } else if (activeTab === 'BACK') {
                                if (isVertical) {
                                    lines = lines.slice(0, 9); // Max 3 columns for vertical text
                                } else {
                                    lines = lines.slice(0, 13);
                                }
                            }
                            setTextInput(lines.join('\n'));
                        }}
                        placeholder={t('text.placeholder')}
                        // 6 lines of 18 chars + 5 newlines = 108 + 5 = 113. We'll set a safe max length
                        maxLength={activeTab === 'FRONT' ? MAX_FRONT_TOTAL : (activeTab === 'BACK' && isVertical ? 60 : 150)}
                        rows={1}
                        wrap="off"
                        className="flex-1 w-full px-2 lg:px-4 py-2 text-center text-sm lg:text-base text-gray-700 placeholder-gray-300 focus:outline-none resize-none"
                        autoFocus
                        style={{
                            ...allFonts.find(f => f.name === selectedFont)?.style,
                            overflow: 'hidden'
                        }}
                        ref={textAreaRef}
                    />
                    <div className="text-[#00A86B] px-2 pt-2">
                        {textInput && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                        )}
                    </div>
                </div>

                {/* Vertical Orientation Toggle - Only for Back Side */}
                {activeTab === 'BACK' && (
                    <div className="mb-6 flex flex-col items-start w-full px-1">
                        <span className="text-sm font-bold text-gray-800 mb-2 tracking-[0.9px]">
                            {t('text.orientationLabel')} <span className="font-normal">{isVertical ? t('text.vertical') : t('text.horizontal')}</span>
                        </span>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => {
                                    // Switching to VERTICAL: truncate to 18 chars/col, 3 cols max
                                    const lines = textInput.split('\n').map(l => l.slice(0, 18)).slice(0, 3);
                                    setTextInput(lines.join('\n'));
                                    setIsVertical(true);
                                }}
                                className={`w-12 h-12 rounded flex items-center justify-center transition-all bg-white
                        ${isVertical ? 'border-2 border-black shadow-sm' : 'border border-gray-300 hover:border-gray-400'}`}
                                aria-label={t('text.verticalAria')}
                            >
                                <span className="text-xs font-medium text-gray-800 transform -rotate-90 leading-none">Aaa</span>
                            </button>
                            <button
                                onClick={() => {
                                    // Switching to HORIZONTAL: truncate to 18 chars/line, 13 lines max
                                    const lines = textInput.split('\n').map(l => l.slice(0, 18)).slice(0, 13);
                                    setTextInput(lines.join('\n'));
                                    setIsVertical(false);
                                }}
                                className={`w-12 h-12 rounded flex items-center justify-center transition-all bg-white
                        ${!isVertical ? 'border-2 border-black shadow-sm' : 'border border-gray-300 hover:border-gray-400'}`}
                                aria-label={t('text.horizontalAria')}
                            >
                                <span className="text-xs font-medium text-gray-800 leading-none">Aaa</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Populaire Quotes — quick-insert presets */}
                <div className="mb-6 flex flex-col items-start w-full px-1">
                    <span className="text-sm font-bold text-gray-800 mb-2 tracking-[0.9px]">Populaire Quotes</span>
                    <div className="flex overflow-x-auto w-full pb-3 custom-scrollbar snap-x snap-mandatory space-x-2 -mx-1 px-1">
                        {motivatieQuotes.map((q) => (
                            <button
                                key={q.id}
                                onClick={() => setTextInput(q.text)}
                                className={`text-left rounded-lg border px-3 py-2 transition-all shadow-sm flex-shrink-0 w-36 snap-start hover:border-black hover:shadow-md active:scale-[0.97] ${
                                    textInput === q.text
                                        ? 'border-black bg-black text-white'
                                        : 'border-gray-200 bg-white text-gray-800'
                                }`}
                            >
                                <span
                                    className="block text-[10px] leading-tight whitespace-pre-line font-bold"
                                    style={{ letterSpacing: '0.3px' }}
                                >
                                    {q.text}
                                </span>
                                {q.attribution && (
                                    <span className={`block text-[9px] mt-1.5 font-medium truncate ${
                                        textInput === q.text ? 'text-gray-300' : 'text-gray-400'
                                    }`}>
                                        — {q.attribution}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Be Fit Font Group */}
                {befitFonts.length > 0 && (
                    <div className="mb-4 flex flex-col items-start w-full px-1">
                        <span className="text-sm font-bold text-gray-800 mb-2 tracking-[0.9px]">
                            Be Fit Lettertype: <span className="font-normal capitalize">{BEFIT_FONT_NAMES.includes(selectedFont) ? selectedFont : ''}</span>
                        </span>
                        <div className="flex flex-wrap gap-3 w-full">
                            {befitFonts.map((font) => <FontButton key={font.name} font={font} />)}
                        </div>
                    </div>
                )}

                {/* Other Fonts Group (all non-BeFit fonts, including jersey fonts) */}
                {otherFonts.length > 0 && (
                    <div className="mb-4 flex flex-col items-start w-full px-1">
                        <span className="text-sm font-bold text-gray-800 mb-2 tracking-[0.9px]">
                            {t('text.fontLabel')} <span className="font-normal capitalize">{!BEFIT_FONT_NAMES.includes(selectedFont) ? selectedFont : ''}</span>
                        </span>
                        <div className="flex flex-wrap gap-3 w-full">
                            {otherFonts.map((font) => <FontButton key={font.name} font={font} />)}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TextView;



