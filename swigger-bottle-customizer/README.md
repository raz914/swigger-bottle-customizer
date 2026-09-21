# Bottle Customizer for WooCommerce

A WordPress/WooCommerce plugin that adds a "Personalize" button to the Be Fit Shakebeker product, opening a fullscreen bottle customizer and adding customized products to the cart.

## Installation

1. Copy the entire `bottle-customizer-plugin` folder to your WordPress `wp-content/plugins/` directory
2. Build the React configurator and copy the build files:
   ```bash
   cd project
   npm run build
   ```
3. Copy the contents of the `dist` folder to `bottle-customizer-plugin/configurator/`
4. Activate the plugin in WordPress Admin → Plugins
5. The "PERSONALIZE" button will automatically appear on the `/product/be-fit-shakebeker/` product page

## Plugin Structure

```
bottle-customizer-plugin/
├── bottle-customizer.php      # Main plugin file
├── assets/
│   ├── css/
│   │   └── frontend.css       # Button and modal styles
│   └── js/
│       └── frontend.js        # Modal handling and cart integration
├── configurator/              # React app build (copy from dist/)
│   ├── index.html
│   └── assets/
│       ├── index-*.js
│       └── index-*.css
└── README.md
```

## How It Works

1. **Product Page**: The "PERSONALIZE" button appears below the Add to Cart button on the target product page
2. **Modal**: Clicking opens a fullscreen modal with the React configurator in an iframe
3. **Customization**: User customizes the bottle (color, text, monogram, graphics)
4. **Add to Cart**: User clicks "ADD TO CART" in the configurator, which:
   - Captures screenshots of front and back bottle views
   - Sends customization data to WordPress via postMessage
   - Adds the customized product to WooCommerce cart
5. **Cart**: Shows customization details and preview images

## Temporary Images

Preview images are stored temporarily in `wp-content/uploads/bottle-customizer-temp/` and automatically cleaned up after 24 hours via a scheduled WordPress cron job.

## Customization

### Choose which product shows the button (recommended)

Go to **WooCommerce → Bottle Customizer** in WP Admin:

- **Enable customizer**: turns the feature on/off
- **Target product (ID)**: enter the WooCommerce product ID (e.g. you can find it in the product edit URL like `post=123`)

### Legacy fallback (optional)

If you do not set a Target product ID, the plugin falls back to the constant in `bottle-customizer.php`:

```php
define('BOTTLE_CUSTOMIZER_PRODUCT_SLUG', 'your-product-slug');
```

## Requirements

- WordPress 5.8+
- WooCommerce 5.0+
- PHP 7.4+
