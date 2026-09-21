# Bottle Customizer

Bottle personalization system with:
1. A React configurator app (`src/`).
2. A WordPress/WooCommerce plugin (`bottle-customizer-plugin/`) that embeds it in a modal and adds customized items to cart.

## Start Here
- Architecture and flow: `PROJECT_GUIDE.md`
- File-by-file ownership map: `docs/FILE_MAP.md`
- Plugin-specific setup details: `bottle-customizer-plugin/README.md`

## Quick Local Development
1. Install dependencies:
```bash
npm install
```
2. Start the configurator locally:
```bash
npm run dev
```
3. Open the Vite URL shown in terminal.

## Build
```bash
npm run build
```

Build output is written to `dist/`.

## Deploy to WordPress Plugin Folder
Use:
```bash
npm run deploy
```

This runs `deploy.bat`, which:
1. Builds the React app.
2. Copies `dist/*` to `bottle-customizer-plugin/configurator/`.
3. Creates `bottle-customizer-plugin.zip`.

## Repository Layout
- `src/`: React UI, customization flow, preview/capture logic.
- `public/`: Bottle images, gallery SVGs, fonts.
- `bottle-customizer-plugin/`: WP plugin PHP/JS/CSS and built configurator copy.
- `dist/`: Vite production build.

## Main Commands
- `npm run dev`: run local Vite dev server.
- `npm run build`: build production assets.
- `npm run preview`: preview production build locally.
- `npm run lint`: run ESLint.
- `npm run deploy`: build + copy to plugin + zip plugin.
