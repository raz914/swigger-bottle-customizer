import React, { useState, useEffect } from 'react';

const CustomWorldView = ({ setView, customWorld, setCustomWorld, onSubmitToCart }) => {
    const [localState, setLocalState] = useState(customWorld || {
        enabled: true,
        name: '',
        roots: '',
        hobbies: '',
        future: '',
        motto: '',
        style: [],
        doDont: ''
    });

    const styleOptions = [
        'Clean', 'Stoer', 'Luxe', 'Street', 'Sportief', 'Rustig', 'Donker', 'Minimalistisch', 'Opvallend'
    ];

    useEffect(() => {
        setCustomWorld(localState);
    }, [localState, setCustomWorld]);

    const handleStyleToggle = (style) => {
        setLocalState(prev => {
            const current = prev.style || [];
            if (current.includes(style)) {
                return { ...prev, style: current.filter(s => s !== style) };
            } else {
                return { ...prev, style: [...current, style] };
            }
        });
    };

    const isFormValid = localState.name.length > 0 &&
        localState.roots.length > 0 &&
        localState.hobbies.length > 0 &&
        localState.future.length > 0 &&
        localState.motto.length > 0 &&
        localState.style.length > 0;

    return (
        <div className="flex flex-col flex-1 min-h-0 w-full max-w-2xl lg:max-w-[calc(33rem+32px)] lg:mx-auto pb-6">
            {/* Back Button */}
            <button
                onClick={() => setView('main')}
                className="flex items-center text-black font-bold text-xs lg:text-sm mb-2 lg:mb-4 hover:text-gray-600 transition-colors w-fit py-1 pr-4 relative z-[60]"
                style={{ letterSpacing: '1.8px' }}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="border-b-2 border-black leading-tight">Terug</span>
            </button>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="flex items-start justify-between mb-4 gap-2">
                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 lg:gap-3">
                        <h3 className="text-[16px] lg:text-[18px] font-bold text-black tracking-wide leading-tight">Maatwerk Design</h3>
                        <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded text-[10px] font-bold tracking-widest border border-gray-200 whitespace-nowrap">+ €30</span>
                    </div>
                    <p className="text-xs text-gray-500 font-bold tracking-wide mt-1">Vertel ons jouw wereld</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <button
                        onClick={() => {
                            setLocalState({ ...localState, enabled: !localState.enabled });
                        }}
                        className={`text-[10px] font-bold tracking-wide px-2 py-1 border rounded ${localState.enabled ? 'text-red-500 border-red-200 bg-red-50' : 'text-green-600 border-green-200 bg-green-50'}`}
                    >
                        {localState.enabled ? 'Uitzetten' : 'Aanzetten'}
                    </button>
                </div>
            </div>

            {!localState.enabled ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed border-gray-200 rounded-lg">
                    <p className="text-sm text-gray-500 mb-4">Maatwerk Design staat momenteel uit.</p>
                    <button
                        onClick={() => setLocalState({ ...localState, enabled: true })}
                        className="bg-black text-white px-6 py-2 rounded text-xs font-bold tracking-wide"
                    >
                        Activeer Maatwerk Design
                    </button>
                </div>
            ) : (
                <>
                    <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                        Beantwoord kort deze vragen. Hoe beter jouw antwoorden, hoe persoonlijker wij je ontwerp kunnen maken.
                    </p>

            <div className="space-y-6">
                {/* Field 1: Name */}
                <div className="flex flex-col">
                    <label className="text-xs font-bold text-gray-800 tracking-wide mb-1">
                        Wat is je naam of bijnaam? <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        maxLength={60}
                        value={localState.name}
                        onChange={e => setLocalState({ ...localState, name: e.target.value })}
                        placeholder="Bijv. Jayden, Mo, Ilias, Senna of J-Dog"
                        className="border border-gray-300 rounded px-3 py-2 text-sm focus:border-black focus:ring-1 focus:ring-black outline-none transition-colors"
                    />
                </div>

                {/* Field 2: Roots */}
                <div className="flex flex-col">
                    <label className="text-xs font-bold text-gray-800 tracking-wide mb-1">
                        Waar kom je vandaan en wat voelt als thuis? <span className="text-red-500">*</span>
                    </label>
                    <p className="text-[10px] text-gray-500 mb-2">Denk aan stad, buurt, familie, roots of cultuur. Deel alleen wat je zelf wilt.</p>
                    <textarea
                        maxLength={220}
                        rows={2}
                        value={localState.roots}
                        onChange={e => setLocalState({ ...localState, roots: e.target.value })}
                        placeholder="Bijv. Saendelft, Zaandam, Surinaamse roots, Marokkaanse roots..."
                        className="border border-gray-300 rounded px-3 py-2 text-sm focus:border-black focus:ring-1 focus:ring-black outline-none transition-colors resize-none"
                    />
                </div>

                {/* Field 3: Hobbies */}
                <div className="flex flex-col">
                    <label className="text-xs font-bold text-gray-800 tracking-wide mb-1">
                        Wat zijn je hobby’s, sport of interesses? <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        maxLength={240}
                        rows={2}
                        value={localState.hobbies}
                        onChange={e => setLocalState({ ...localState, hobbies: e.target.value })}
                        placeholder="Bijv. voetbal, gym, boksen, muziek, auto’s..."
                        className="border border-gray-300 rounded px-3 py-2 text-sm focus:border-black focus:ring-1 focus:ring-black outline-none transition-colors resize-none"
                    />
                </div>

                {/* Field 4: Future */}
                <div className="flex flex-col">
                    <label className="text-xs font-bold text-gray-800 tracking-wide mb-1">
                        Waar wil je naartoe in de toekomst? <span className="text-red-500">*</span>
                    </label>
                    <p className="text-[10px] text-gray-500 mb-2">Wat wil je bereiken, opbouwen of later kunnen geven aan jezelf of je familie?</p>
                    <textarea
                        maxLength={260}
                        rows={2}
                        value={localState.future}
                        onChange={e => setLocalState({ ...localState, future: e.target.value })}
                        placeholder="Bijv. eigen bedrijf, profvoetballer worden, sterker worden..."
                        className="border border-gray-300 rounded px-3 py-2 text-sm focus:border-black focus:ring-1 focus:ring-black outline-none transition-colors resize-none"
                    />
                </div>

                {/* Field 5: Motto */}
                <div className="flex flex-col">
                    <label className="text-xs font-bold text-gray-800 tracking-wide mb-1">
                        Welke woorden, quote of levensmotto passen bij jou? <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        maxLength={160}
                        value={localState.motto}
                        onChange={e => setLocalState({ ...localState, motto: e.target.value })}
                        placeholder="Bijv. familie boven alles, never give up, focus..."
                        className="border border-gray-300 rounded px-3 py-2 text-sm focus:border-black focus:ring-1 focus:ring-black outline-none transition-colors"
                    />
                </div>

                {/* Field 6: Style */}
                <div className="flex flex-col">
                    <label className="text-xs font-bold text-gray-800 tracking-wide mb-2">
                        Welke stijl wil je voor je ontwerp? <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {styleOptions.map(style => {
                            const isSelected = (localState.style || []).includes(style);
                            return (
                                <button
                                    key={style}
                                    onClick={() => handleStyleToggle(style)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold tracking-wider transition-all border ${isSelected ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'}`}
                                >
                                    {style}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Field 7: Do/Don't */}
                <div className="flex flex-col">
                    <label className="text-xs font-bold text-gray-800 tracking-wide mb-1">
                        Moet er iets absoluut wel of niet in het ontwerp?
                    </label>
                    <textarea
                        maxLength={240}
                        rows={2}
                        value={localState.doDont}
                        onChange={e => setLocalState({ ...localState, doDont: e.target.value })}
                        placeholder="Bijv. wel een leeuw, geen vlag, wel voetbal..."
                        className="border border-gray-300 rounded px-3 py-2 text-sm focus:border-black focus:ring-1 focus:ring-black outline-none transition-colors resize-none"
                    />
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-[11px] text-gray-500 mb-4 leading-relaxed">
                    Wij maken één persoonlijk ontwerp op basis van jouw antwoorden. Bij twijfel nemen we contact met je op. Maatwerk Design kan de verwerkingstijd iets verlengen.
                </p>
                <details className="text-xs text-gray-500">
                    <summary className="cursor-pointer font-bold tracking-wide hover:text-black mb-2">Designvoorwaarden</summary>
                    <ul className="list-disc pl-4 space-y-1 mt-2">
                        <li>Het ontwerp wordt geschikt gemaakt voor lasergravure.</li>
                        <li>Geen full-color print.</li>
                        <li>Geen haatdragende, discriminerende of beledigende inhoud.</li>
                        <li>Geen logo’s of merken waar je geen rechten op hebt.</li>
                        <li>BE FIT mag kleine aanpassingen doen zodat het ontwerp technisch goed graveerbaar blijft.</li>
                    </ul>
                </details>
            </div>
            </>
            )}

                <div className="mt-6">
                    <button
                        onClick={() => {
                            if (localState.enabled && !isFormValid) return;
                            
                            if (localState.enabled && onSubmitToCart) {
                                onSubmitToCart(localState);
                            } else {
                                setCustomWorld(localState);
                                setView('main');
                            }
                        }}
                        className={`w-full py-3 rounded text-sm font-bold tracking-wide transition-colors ${(!localState.enabled || isFormValid) ? 'bg-black text-white hover:bg-gray-800' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                    >
                        {!localState.enabled ? 'Terug naar menu' : (isFormValid ? 'Opslaan & Direct Bestellen' : 'Vul verplichte velden in')}
                    </button>
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

export default CustomWorldView;
