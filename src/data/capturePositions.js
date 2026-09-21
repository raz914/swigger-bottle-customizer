// Shared capture positioning constants
// Used by BottlePreview.jsx (DOM capture) and canvasCapture.js (canvas capture)
// Edit these values once to affect both capture paths

// Desktop positioning values (used for capture mode on desktop)
export const DESKTOP_POSITIONS = {
    '1liter': {
        FRONT: {
            text: { top: '37%', left: '22%', right: '26%', bottom: '28%' },
            monogram: { top: '40%', left: '30%', right: '33%', bottom: '30%' },
            graphic: { top: '39%', left: '30%', right: '34%', bottom: '30%' },
            boundary: { top: '40%', left: '30%', right: '33%', bottom: '30%' }
        },
        BACK: {
            text: { top: '30%', left: '18%', right: '13.5%', bottom: '26%' },
            textVertical: { top: '42%', left: '33%', right: '28%', bottom: '27%' },
            monogram: { top: '20%', left: '38%', right: '33.5%', bottom: '26%' },
            graphic: { top: '20%', left: '27%', right: '22.5%', bottom: '26%' },
            boundary: { top: '40.5%', left: '33%', right: '33.5%', bottom: '26%' },
            boundaryVertical: { top: '39%', left: '33%', right: '33.5%', bottom: '26%' }
        }
    },
    '500ml': {
        FRONT: {
            text: { top: '36%', left: '18%', right: '20%', bottom: '27%' },
            monogram: { top: '43%', left: '37%', right: '38%', bottom: '34%' },
            graphic: { top: '43%', left: '30%', right: '31.5%', bottom: '35%' },
            boundary: { top: '40%', left: '36%', right: '38%', bottom: '34%' }
        },
        BACK: {
            text: { top: '29%', left: '20%', right: '17%', bottom: '26%' },
            textVertical: { top: '50%', left: '36%', right: '33%', bottom: '31%' },
            monogram: { top: '20%', left: '40%', right: '37%', bottom: '26%' },
            graphic: { top: '20%', left: '30%', right: '27%', bottom: '26%' },
            boundary: { top: '40.5%', left: '33%', right: '33%', bottom: '31%' },
            boundaryVertical: { top: '39%', left: '33%', right: '33%', bottom: '25%' }
        }
    }
};

// Mobile positioning values (used for capture mode on iOS/mobile)
export const MOBILE_POSITIONS = {
    '1liter': {
        FRONT: {
            text: { top: '33%', left: '22%', right: '26%', bottom: '24.5%' },
            textVertical: { top: '50%', left: '33%', right: '40%', bottom: '34%' },
            monogram: { top: '43%', left: '37%', right: '40%', bottom: '34%' },
            graphic: { top: '43%', left: '28.5%', right: '32%', bottom: '34%' },
            boundary: { top: '55%', left: '33%', right: '40%', bottom: '34%' }
        },
        BACK: {
            text: { top: '36%', left: '20%', right: '16%', bottom: '31%' },
            textVertical: { top: '50%', left: '38%', right: '33%', bottom: '31%' },
            monogram: { top: '20%', left: '37%', right: '33%', bottom: '24%' },
            graphic: { top: '20%', left: '30%', right: '26%', bottom: '24%' },
            boundary: { top: '39.5%', left: '33%', right: '33%', bottom: '31%' },
            boundaryVertical: { top: '39%', left: '33%', right: '33%', bottom: '25%' }
        }
    },
    '500ml': {
        FRONT: {
            text: { top: '33%', left: '23.5%', right: '25%', bottom: '24%' },
            textVertical: { top: '48%', left: '33%', right: '36%', bottom: '34%' },
            monogram: { top: '43%', left: '35%', right: '36%', bottom: '34%' },
            graphic: { top: '42%', left: '32%', right: '34%', bottom: '34%' },
            boundary: { top: '53%', left: '33%', right: '36%', bottom: '34%' }
        },
        BACK: {
            text: { top: '36%', left: '19%', right: '16%', bottom: '31%' },
            textVertical: { top: '50%', left: '35%', right: '33%', bottom: '31%' },
            monogram: { top: '20%', left: '35%', right: '33%', bottom: '24%' },
            graphic: { top: '20%', left: '35%', right: '33%', bottom: '24%' },
            boundary: { top: '39.5%', left: '33%', right: '33%', bottom: '31%' },
            boundaryVertical: { top: '39%', left: '33%', right: '33%', bottom: '25%' }
        }
    }
};

export const GRAPHIC_MAX_SIZE = {
    mobile: {
        FRONT: 0.75,
        BACK: 0.75,
    },
    test: {
        FRONT: 0.75,
        BACK: 0.75,
    },
    desktop: {
        FRONT: 0.75,
        BACK: 0.75,
    }
};



