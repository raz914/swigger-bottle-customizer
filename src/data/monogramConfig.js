// Monogram configuration file
// Contains all monogram styles with their fonts, sizes, and special properties

export const monogramStyles = [
    // {
    //     name: 'Circle',
    //     style: { fontFamily: 'Kg Modern Monogram', fontSize: '1.2em' },
    //     frontSize: null, // uses default
    //     backSize: null   // uses default
    // },
    // {
    //     name: 'Elegant',
    //     style: { fontFamily: 'Janda Stylish Monogram', fontSize: '1.2em' },
    //     frontSize: null,
    //     backSize: null
    // },
    // {
    //     name: 'Square',
    //     style: { fontFamily: 'Mending', fontSize: '1.2em' },
    //     frontSize: null,
    //     backSize: null
    // },
    // {
    //     name: 'Drift',
    //     style: { fontFamily: 'Burns Drift' },
    //     frontSize: null,
    //     backSize: null
    // },
    {
        name: 'Block Script',
        style: { fontFamily: 'Two Character N-Gram', fontSize: '1.2em', marginLeft: '0.1em' },  // Default, will switch dynamically
        frontSize: '4.2em',
        backSize: '6.6em',
        frontSizeMobile: '1.8em',
        backSizeMobile: '2.7em',
        useNGramGlyphs: true  // Flag to use N-Gram glyph rendering (switches between 2-char and 3-char fonts)
    },
    {
        name: 'ITC Modern',
        style: { fontFamily: 'ITC Modern', fontSize: '1.8em' },
        maxLength: 1,
        frontSize: '3.8em',
        backSize: '8.2em',
        frontSizeMobile: '2.1em',
        backSizeMobile: '2.6em'
    },
    {
        name: 'Nexa Script',
        style: { fontFamily: 'Nexa Script', fontSize: '1.8em' },
        maxLength: 1,
        frontSize: '4.2em',
        backSize: '7em',
        frontSizeMobile: '2.1em',
        backSizeMobile: '2.9em'
    },
    {
        name: 'Roman',
        style: { fontFamily: 'Roman', fontSize: '1.2em' },
        middleLarger: true,
        frontSize: '3.4em',
        backSize: '4.64em',
        frontSizeMobile: '1.5em',
        backSizeMobile: '1.6em'
    },
    {
        name: 'Circle Script',
        style: { fontFamily: 'Two Character Circle', fontSize: '1.2em' },  // Removed marginLeft to center 2-char input
        frontSize: '4.2em',
        backSize: '7.4em',
        frontSizeMobile: '1.8em',
        backSizeMobile: '2.6em',
        useCircleGlyphs: true  // Flag to use special glyph rendering (switches between 2-char and 3-char fonts)
    },
    {
        name: 'Vine',
        style: { fontFamily: 'Vine', fontSize: '1.2em', letterSpacing: '.55em', marginLeft: '0.6em' },
        frontSize: '3.4em',
        backSize: '2.8em',
        frontSizeMobile: '1.4em',
        backSizeMobile: '0.95em'
    },
    // {
    //     name: 'Proxima Nova',
    //     style: { fontFamily: 'Proxima Nova', fontSize: '1.2em' },
    //     frontSize: null,
    //     backSize: null
    // },
    // {
    //     name: 'Rockwell Bold',
    //     style: { fontFamily: 'Rockwell Bold', fontSize: '1.2em', fontWeight: 'bold' },
    //     frontSize: null,
    //     backSize: null
    // },
    // {
    //     name: 'Sackers Gothic',
    //     style: { fontFamily: 'Sackers Gothic', fontSize: '1.2em' },
    //     frontSize: null,
    //     backSize: null
    // },
    // {
    //     name: '2-Char Circle 2',
    //     style: { fontFamily: 'Two Character Circle 2', fontSize: '1.2em' },
    //     frontSize: null,
    //     backSize: null
    // },
    // {
    //     name: '3-Char Circle 2',
    //     style: { fontFamily: 'Three Character Circle 2', fontSize: '1.2em' },
    //     frontSize: null,
    //     backSize: null
    // },
];

// Glyph mapping for 3-character circle font (right position)
const rightGlyphMap = {
    'A': '1', 'B': '2', 'C': '3', 'D': '4', 'E': '5',
    'F': '6', 'G': '7', 'H': '8', 'I': '9', 'J': '0',
    'K': '!', 'L': '@', 'M': '#', 'N': '$', 'O': '%',
    'P': '^', 'Q': '&', 'R': '*', 'S': '(', 'T': ')',
    'U': '-', 'V': '+', 'W': '[', 'X': ']', 'Y': '\\', 'Z': ':'
};

// Helper function to convert monogram input to circle glyphs
export const convertToCircleGlyphs = (input, monogramName) => {
    if (!input) return '';

    const upperInput = input.toUpperCase();

    // 2-character: first lowercase, second uppercase
    if (input.length === 2) {
        return upperInput[0].toLowerCase() + upperInput[1];
    }

    // 3-character: left lowercase, middle uppercase, right mapped glyph
    if (input.length === 3) {
        const left = upperInput[0].toLowerCase();
        const middle = upperInput[1];
        const right = rightGlyphMap[upperInput[2]] || upperInput[2];
        return left + middle + right;
    }

    return input;
};

// Helper to get the correct font family for circle monograms based on input length
export const getCircleFontFamily = (inputLength) => {
    if (inputLength === 2) return 'Two Character Circle';
    if (inputLength === 3) return 'Three Character Circle';
    return 'Two Character Circle';
};

// Helper function to convert monogram input to N-Gram glyphs (with ? prefix for container)
export const convertToNGramGlyphs = (input) => {
    if (!input) return '';

    const upperInput = input.toUpperCase();

    // 2-character: ? + first lowercase + second uppercase
    if (input.length === 2) {
        return '?' + upperInput[0].toLowerCase() + upperInput[1];
    }

    // 3-character: ? + left lowercase + middle uppercase + right mapped glyph
    if (input.length === 3) {
        const left = upperInput[0].toLowerCase();
        const middle = upperInput[1];
        const right = rightGlyphMap[upperInput[2]] || upperInput[2];
        return '?' + left + middle + right;
    }

    return input;
};

// Helper to get the correct font family for N-Gram monograms based on input length
export const getNGramFontFamily = (inputLength) => {
    if (inputLength === 2) return 'Two Character N-Gram';
    if (inputLength === 3) return 'Three Character N-Gram';
    return 'Two Character N-Gram';
};

// Check if monogram uses N-Gram glyph system
export const usesNGramGlyphs = (monogramName) => {
    const monogram = monogramStyles.find(m => m.name === monogramName || (monogramName === 'N-Gram' && m.name === 'Block Script'));
    return monogram?.useNGramGlyphs === true;
};

// Check if monogram uses circle glyph system
export const usesCircleGlyphs = (monogramName) => {
    const monogram = monogramStyles.find(m => m.name === monogramName || (monogramName === 'rJ#' && m.name === 'Circle Script'));
    return monogram?.useCircleGlyphs === true;
};

// Helper function to get font size based on monogram, side, and device
export const getMonogramFontSize = (monogramName, activeTab, inputLength, isMobile = false) => {
    const monogram = monogramStyles.find(m => m.name === monogramName ||
        (monogramName === 'rJ#' && m.name === 'Circle Script') ||
        (monogramName === 'N-Gram' && m.name === 'Block Script'));

    // Default dynamic sizing for mobile and desktop
    const defaultSize = isMobile
        ? `max(4px, min(${150 / Math.max(1, inputLength)}cqi, 17cqi))`
        : `max(4px, min(${150 / Math.max(1, inputLength)}cqi, 20cqi))`;

    if (!monogram) return defaultSize;

    // Get the appropriate size based on side and device
    let sideSize;
    if (isMobile) {
        sideSize = activeTab === 'FRONT' ? monogram.frontSizeMobile : monogram.backSizeMobile;
    } else {
        sideSize = activeTab === 'FRONT' ? monogram.frontSize : monogram.backSize;
    }

    if (sideSize) return sideSize;

    // Fall back to default dynamic sizing
    return defaultSize;
};

// Helper to check if monogram should be displayed based on input length
export const shouldDisplayMonogram = (monogramName, inputLength) => {
    const monogram = monogramStyles.find(m => m.name === monogramName ||
        (monogramName === 'rJ#' && m.name === 'Circle Script') ||
        (monogramName === 'N-Gram' && m.name === 'Block Script'));
    if (!monogram) return false;

    // Circle fonts work with 2 or 3 characters
    if (monogram.useCircleGlyphs) {
        return inputLength === 2 || inputLength === 3;
    }

    // N-Gram fonts work with 2 or 3 characters
    if (monogram.useNGramGlyphs) {
        return inputLength === 2 || inputLength === 3;
    }

    if (monogram.maxLength === 1) {
        return inputLength >= 1;
    }
    return inputLength >= 1;
};



