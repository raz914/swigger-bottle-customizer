# File Map

## Top Level
- `package.json`: React app scripts/deps.
- `vite.config.js`: Vite config + PDF worker copy plugin + relative base path.
- `tailwind.config.js`: Tailwind content scan + custom theme tokens.
- `deploy.bat`: Build, copy to plugin configurator folder, zip plugin.
- `PROJECT_GUIDE.md`: Architecture and flow guide.

## React Configurator (`src/`)
- `src/main.jsx`: App bootstrap.
- `src/App.jsx`: Thin wrapper that renders `Customizer`.
- `src/components/Customizer.jsx`: Primary orchestration component and state owner.
- `src/components/BottlePreview.jsx`: Live bottle preview with overlays and capture mode.
- `src/components/DesignCapture.jsx`: Isolated design-only render surface for preview exports.
- `src/components/ReviewScreen.jsx`: Final review, terms modal handoff, add-to-cart postMessage.
- `src/components/UploadView.jsx`: Upload + PDF render + mask generation + scale control.
- `src/components/TextView.jsx`: Text editing UI, font picker, back-side vertical toggle.
- `src/components/MonogramView.jsx`: Monogram input and style picker.
- `src/components/GalleryView.jsx`: Built-in icon browsing and selection.
- `src/components/MainView.jsx`: Entry menu for customization tools.
- `src/components/BottomBar.jsx`: Remove/review action bar.
- `src/components/ColorSelector.jsx`: Mobile color selector modal and trigger.
- `src/components/OptionCard.jsx`: Reusable tool tile.
- `src/components/ConfirmationModal.jsx`: Terms confirmation for add-to-cart.
- `src/components/UploadConfirmationModal.jsx`: Upload-specific terms confirmation.

## Shared Logic/Data (`src/data`, `src/utils`)
- `src/data/capturePositions.js`: Shared positional constants used by DOM render and canvas render.
- `src/data/monogramConfig.js`: Monogram definitions, font rules, glyph conversion, size helpers.
- `src/data/galleryData.jsx`: Category and icon source registry for gallery view.
- `src/utils/canvasCapture.js`: Canvas snapshot engine used on iOS/forced mode.

## Static Assets (`public/`)
- `public/bottle/front/*`, `public/bottle/back/*`: Bottle base render assets per color and side.
- `public/gallery/*`: Built-in gallery graphics (nature/animals/symbols/etc.).
- `public/UI/icons/*`: Tool icons.
- `public/fonts/*`: Brand text fonts.
- `public/monogram/*`: Monogram fonts used in rendering and cart displays.

## WordPress Plugin (`bottle-customizer-plugin/`)
- `bottle-customizer-plugin/bottle-customizer.php`: Main plugin logic (hooks, admin settings, AJAX, cart/order rendering, cleanup).
- `bottle-customizer-plugin/assets/js/frontend.js`: Product-page modal + iframe bridge + AJAX + checkout thumbnail swap logic.
- `bottle-customizer-plugin/assets/css/frontend.css`: Button/modal/cart/checkout/FunnelKit styling + monogram font faces.
- `bottle-customizer-plugin/configurator/`: Built React app deployed into the plugin.
- `bottle-customizer-plugin/README.md`: Plugin-level install/usage instructions.

## Build Artifacts
- `dist/`: Vite build output.
- `dist.zip`: Archived build output.
- `bottle-customizer-plugin/configurator/assets/*`: Built JS/CSS/PDF worker shipped with plugin.

## Editing Guide
- Change UI/behavior in editor flow: start in `src/components/Customizer.jsx`.
- Change text/monogram/graphic placement: update `src/data/capturePositions.js` and validate both DOM + canvas capture.
- Change monogram rules/fonts: update `src/data/monogramConfig.js` and matching font assets.
- Change Add-to-Cart bridge protocol: keep `src/components/ReviewScreen.jsx` and `bottle-customizer-plugin/assets/js/frontend.js` in sync.
- Change WooCommerce cart/order output: edit `bottle-customizer-plugin/bottle-customizer.php` and plugin CSS.

