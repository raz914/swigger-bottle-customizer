import React, { useState, useEffect } from 'react';

const SplashScreen = ({ isReady, onComplete }) => {
    const [progress, setProgress] = useState(0);
    const [isVisible, setIsVisible] = useState(true);
    const [minTimeElapsed, setMinTimeElapsed] = useState(false);

    useEffect(() => {
        // Simulated progress animation (0 to 90% in 1.8s)
        const duration = 1800;
        const interval = 20;
        const step = 90 / (duration / interval);

        const timer = setInterval(() => {
            setProgress(prev => {
                if (prev < 90) return prev + step;
                return prev;
            });
        }, interval);

        // Ensure at least 2 seconds of display time
        const minTimer = setTimeout(() => {
            setMinTimeElapsed(true);
        }, 2000);

        return () => {
            clearInterval(timer);
            clearTimeout(minTimer);
        };
    }, []);

    useEffect(() => {
        // Only proceed to 100% and fade out if BOTH the app is ready AND the minimum time has passed
        if (isReady && minTimeElapsed) {
            setProgress(100);
            const fadeTimer = setTimeout(() => {
                setIsVisible(false);
                if (onComplete) onComplete();
            }, 600);
            return () => clearTimeout(fadeTimer);
        }
    }, [isReady, minTimeElapsed, onComplete]);

    if (!isVisible) return null;

    return (
        <div className={`fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center transition-opacity duration-500 ${isReady && minTimeElapsed && progress === 100 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <div className="flex flex-col items-center max-w-[300px] w-full px-4">
                {/* Logo */}
                <img 
                    src="befit-loader-logo.jpg" 
                    alt="Be Fit" 
                    className="w-full h-auto mb-8"
                />

                {/* Text */}
                <span className="text-black font-bold text-sm tracking-[3px] mb-6">
                    Laden...
                </span>

                {/* Progress Bar Container */}
                <div className="w-full h-[2px] bg-gray-100 rounded-full overflow-hidden">
                    {/* Progress Bar Fill */}
                    <div 
                        className="h-full bg-black transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
        </div>
    );
};

export default SplashScreen;
