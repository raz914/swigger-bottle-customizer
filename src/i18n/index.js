/**
 * Lightweight i18n module for the bottle configurator.
 *
 * Usage:
 *   import { t } from '../i18n';
 *   <span>{t('main.heading')}</span>
 *   <span>{t('color.selectAria', { color: 'BLACK' })}</span>
 *
 * To switch language, change APP_LOCALE below (or set
 * window.SWIGGER_BOTTLE_LOCALE before the app boots).
 */

import translations from './translations';

// ---------------------------------------------------------------------------
// Locale resolution: explicit window global -> fallback constant -> 'en'
// ---------------------------------------------------------------------------
const resolveLocale = () => {
    if (typeof window !== 'undefined' && window.SWIGGER_BOTTLE_LOCALE) {
        return window.SWIGGER_BOTTLE_LOCALE;
    }
    return 'nl'; // <-- change to 'en' for English, 'nl' for Dutch
};

let currentLocale = resolveLocale();

/** Get current locale id */
export const getLocale = () => currentLocale;

/** Change locale at runtime (re-render needed by caller) */
export const setLocale = (locale) => {
    currentLocale = locale;
};

/**
 * Translate a key, with optional interpolation variables.
 *
 * Interpolation uses `{varName}` placeholders:
 *   t('color.selectAria', { color: 'BLACK' })
 *   => "Select BLACK color"   (en)
 *   => "Selecteer kleur BLACK" (nl)
 *
 * Falls back: current locale -> 'en' -> raw key.
 */
export const t = (key, vars) => {
    const dict = translations[currentLocale] || translations.en || {};
    let text = dict[key];

    // Fallback to English if key missing in current locale
    if (text === undefined && currentLocale !== 'en') {
        text = (translations.en || {})[key];
    }

    // Ultimate fallback: return the key itself
    if (text === undefined) return key;

    // Interpolation
    if (vars) {
        Object.entries(vars).forEach(([k, v]) => {
            text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
        });
    }

    return text;
};



