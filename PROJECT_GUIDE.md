# Bottle Customizer Project Guide

## Purpose
This repository contains a bottle personalization system with two runtime parts:
1. A React + Vite configurator UI.
2. A WordPress/WooCommerce plugin that embeds that UI and adds customized products to cart.

## High-Level Architecture
- `src/`: React configurator source code (editor UI, preview rendering, snapshot generation).
- `public/`: Static assets used by the configurator (bottle images, gallery SVGs, fonts, monogram fonts).
- `bottle-customizer-plugin/`: WordPress plugin that shows the "PERSONALIZE" button, opens the configurator in an iframe, receives customization payloads, and writes customization data into WooCommerce cart/order items.
- `dist/`: Built React app output (copied into plugin `configurator/` for production use).

## End-to-End Runtime Flow
1. WooCommerce product page loads plugin assets from `bottle-customizer-plugin/assets/css/frontend.css` and `bottle-customizer-plugin/assets/js/frontend.js`.
2. Plugin injects a `PERSONALIZE` button and modal iframe shell from `bottle-customizer-plugin/bottle-customizer.php`.
3. User opens modal; iframe loads `bottle-customizer-plugin/configurator/index.html` (built React app).
4. React app (`src/components/Customizer.jsx`) manages all customization state for FRONT/BACK sides.
5. On review, React generates snapshots (DOM capture or canvas fallback) and opens `src/components/ReviewScreen.jsx`.
6. On "Add to Cart", React posts `BOTTLE_CUSTOMIZER_ADD_TO_CART` to parent window.
7. Plugin JS receives the message, sends AJAX request to `wp_ajax_bottle_customizer_add_to_cart`.
8. PHP handler stores temporary preview images, resolves variation/color, adds product to cart with `bottle_customization` metadata.
9. Cart/checkout/order UI is customized by plugin filters to show chosen text/monogram/graphics and custom thumbnails.

## React App Internals

### Entry + App Shell
- `src/main.jsx`: React mount.
- `src/App.jsx`: Renders `Customizer`.
- `src/components/Customizer.jsx`: Main controller and state owner.

### Core State Model (`Customizer.jsx`)
- `activeTab`: `FRONT` or `BACK`.
- `view`: active tool view (`main`, `text`, `monogram`, `gallery`, `upload`).
- `customization`: per-side content (`text`, `monogram`, `graphic`, and back `isVertical`).
- `selectedColor`, `selectedFont`, `selectedMonogramBySide`.
- `capturedImages`: front/back bottle images + isolated design images.

Important behavior:
- Text, monogram, and graphic are mutually exclusive per side.
- Capture mode is delayed until initial preview load completes (`initialLoadComplete`) to avoid startup overhead.

### Rendering + Capture
- `src/components/BottlePreview.jsx`: Bottle base + overlay rendering (text/graphic/monogram), responsive + capture mode.
- `src/components/DesignCapture.jsx`: Design-only rendering (no bottle), used for cart-side previews.
- `src/utils/canvasCapture.js`: iOS-safe canvas compositor for snapshots; mirrors DOM layout logic when `html-to-image` is unreliable.
- `src/data/capturePositions.js`: Shared positioning constants for both DOM overlay and canvas capture.

### Tool Views
- `src/components/MainView.jsx`: Tool chooser.
- `src/components/TextView.jsx`: Text input + font selection + back vertical mode.
- `src/components/MonogramView.jsx`: Monogram input + style selection.
- `src/components/GalleryView.jsx`: Built-in SVG gallery categories/icons.
- `src/components/UploadView.jsx`: Upload image/PDF, generate mask, validate ratio, scale adjustment.
- `src/components/ReviewScreen.jsx`: Final confirmation and parent window messaging.

### Data + Config
- `src/data/monogramConfig.js`: Monogram style metadata, glyph conversion for circle/N-gram fonts, size logic.
- `src/data/galleryData.jsx`: Gallery taxonomy and icon sources.
- `src/index.css`: Tailwind + custom font-face declarations.
- `tailwind.config.js`: Theme extension (`brand-blue`, default font family).

## WordPress Plugin Internals

### Main Plugin File
- `bottle-customizer-plugin/bottle-customizer.php`: All hooks, AJAX handler, cart/order render logic, admin settings, cleanup cron.

### Product Integration
- Adds submenu settings under WooCommerce for enable flag + target product ID.
- Enqueues plugin JS/CSS.
- Injects button on configured product via `woocommerce_after_add_to_cart_button`.
- Renders iframe modal in footer to avoid theme stacking-context issues.

### JS Bridge (`frontend.js`)
- Opens/closes fullscreen modal + scroll locking.
- Listens for `BOTTLE_CUSTOMIZER_CLOSE`.
- Listens for `BOTTLE_CUSTOMIZER_ADD_TO_CART`.
- Sends `BOTTLE_CUSTOMIZER_ADD_TO_CART_STATUS` back to iframe with `loading|success|error`.
- Also includes FunnelKit checkout thumbnail swap logic.

### Add-to-Cart Handler (PHP)
- Validates nonce and product.
- Decodes `customization` payload.
- Saves base64 snapshots into `wp-content/uploads/bottle-customizer-temp/`.
- Resolves variable product variation based on selected color.
- Adds cart line item with `bottle_customization` metadata and unique key.

### Cart/Checkout/Order Rendering
- Overrides item color display to match configurator-selected color.
- Renders personalized options block (front/back details).
- Replaces thumbnail with custom preview image (back preferred).
- Persists customization into order line item meta.
- Adds mini-cart delivery note for customized items.

### Cleanup
- Daily cron (`bottle_customizer_cleanup_hook`) removes temp preview files older than 24 hours.

## Build and Deployment
- Local dev: `npm run dev`
- Production build: `npm run build`
- Deploy helper: `deploy.bat`
- Packaging flow step 1: build Vite app.
- Packaging flow step 2: copy `dist/*` into `bottle-customizer-plugin/configurator/`.
- Packaging flow step 3: zip `bottle-customizer-plugin/` as plugin artifact.

## Maintenance Notes
- The root `README.md` is still the Vite template and does not describe this project.
- The active production docs are now this file and `docs/FILE_MAP.md`.
