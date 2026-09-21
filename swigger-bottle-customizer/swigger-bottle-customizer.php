<?php
/**
 * Plugin Name: Swigger Be Fit Swigger Bottle Customizer
 * Plugin URI: https://example.com
 * Description: Adds a "Personalize" button to bottle products that opens a fullscreen customizer and adds customized products to WooCommerce cart.
 * Version: 2.0.0
 * Author: Be Fit
 * Author URI: https://befitoriginals.com
 * License: GPL-2.0+
 * License URI: http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain: swigger-bottle-customizer
 * Domain Path: /languages
 * Requires at least: 5.8
 * Requires PHP: 7.4
 * WC requires at least: 5.0
 */

// If this file is called directly, abort.
if (!defined('WPINC')) {
    die;
}

define('swigger_bottle_VERSION', '2.0.0');
define('swigger_bottle_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('swigger_bottle_PLUGIN_URL', plugin_dir_url(__FILE__));

// Target product slug
define('swigger_bottle_PRODUCT_SLUG', 'swigger');

// ── Customization pricing constants ──
define('swigger_bottle_FRONT_SURCHARGE', 10.00);
define('swigger_bottle_BACK_SURCHARGE',  10.00);

/**
 * Check whether a given side has any customization.
 */
/** Store bounded transform values and descriptive item metadata, never raw upload markup. */
function swigger_bottle_sanitize_design_items($items) {
    if (!is_array($items)) return array();
    $clean = array();
    foreach ($items as $item) {
        if (!is_array($item) || !in_array($item['type'] ?? '', array('text', 'monogram', 'graphic'), true)) continue;
        $entry = array('type' => $item['type']);
        foreach (array('id', 'name', 'text', 'monogram', 'font', 'monogramStyle') as $field) {
            $entry[$field] = sanitize_textarea_field(is_scalar($item[$field] ?? '') ? (string) ($item[$field] ?? '') : '');
        }
        foreach (array('x' => array(0, 1, .5), 'y' => array(0, 1, .5), 'width' => array(.001, 1, .7), 'aspect' => array(.001, 1000, 1), 'rotation' => array(-360, 360, 0)) as $field => $limits) {
            $value = isset($item[$field]) && is_numeric($item[$field]) ? (float) $item[$field] : $limits[2];
            $entry[$field] = is_finite($value) ? max($limits[0], min($limits[1], $value)) : $limits[2];
        }
        $entry['isVertical'] = !empty($item['isVertical']);
        if (isset($item['graphic']) && is_array($item['graphic'])) {
            $entry['graphic'] = array(
                'name' => sanitize_text_field($item['graphic']['name'] ?? ''),
                'isUpload' => !empty($item['graphic']['isUpload']),
                'src' => swigger_bottle_sanitize_graphic_src($item['graphic']['src'] ?? ''),
            );
        }
        $clean[] = $entry;
    }
    return $clean;
}

function swigger_bottle_side_has_customization($customization, $side = 'front') {
    $side = ($side === 'back') ? 'back' : 'front';
    return !empty($customization[$side . '_items'])
        || !empty($customization[$side . '_text'])
        || !empty($customization[$side . '_monogram'])
        || !empty($customization[$side . '_graphic'])
        || !empty($customization[$side . '_jersey_number'])
        || !empty($customization[$side . '_jersey_name']);
}

/**
 * Return the surcharge amount (float) for a given side.
 */
function swigger_bottle_side_surcharge($side = 'front') {
    return ($side === 'back') ? swigger_bottle_BACK_SURCHARGE : swigger_bottle_FRONT_SURCHARGE;
}

/**
 * Compute total customization surcharge for a cart/order item.
 */
function swigger_bottle_total_surcharge($customization) {
    if (!empty($customization['custom_world_enabled']) && $customization['custom_world_enabled'] === 'yes') {
        return 30.00;
    }

    $total = 0;
    if (swigger_bottle_side_has_customization($customization, 'front')) {
        $total += swigger_bottle_side_surcharge('front');
    }
    if (swigger_bottle_side_has_customization($customization, 'back')) {
        $total += swigger_bottle_side_surcharge('back');
    }
    return $total;
}

/**
 * Return a formatted price string like "+€0,00" / "+€6,00" for a surcharge amount.
 */
function swigger_bottle_format_surcharge($amount) {
    if ($amount <= 0) {
        return '';
    }
    // Clean integer display (neutral for buttons/UI)
    return '+ ' . intval($amount) . '€';
}

/**
 * True when WooCommerce is active/loaded.
 */
function swigger_bottle_is_woocommerce_active() {
    return class_exists('WooCommerce') && function_exists('WC');
}

/**
 * Plugin enabled?
 */
function swigger_bottle_is_enabled() {
    return get_option('swigger_bottle_enabled', 'yes') === 'yes';
}

/**
 * Get target product ID (0 means "not set").
 */
function swigger_bottle_get_target_product_id() {
    $id = absint(get_option('swigger_bottle_target_product_id', 0));
    return $id > 0 ? $id : 4141; // Hardcoded fallback to 4141
}

/**
 * Check if the given product is the configured target.
 * Falls back to the legacy slug constant if no product ID is configured.
 */
function swigger_bottle_is_target_product($product) {
    if (!$product || !is_object($product) || !method_exists($product, 'get_id')) {
        return false;
    }

    $target_id = swigger_bottle_get_target_product_id();
    if ($target_id > 0) {
        if (absint($product->get_id()) === $target_id) {
            return true;
        }
        // Support plugins that show variations as single products in the shop loop
        if (method_exists($product, 'get_parent_id') && absint($product->get_parent_id()) === $target_id) {
            return true;
        }
        return false;
    }

    // Backwards-compatible fallback (legacy behavior)
    return method_exists($product, 'get_slug') && $product->get_slug() === swigger_bottle_PRODUCT_SLUG;
}

/**
 * Convert a slug like "dark-blue" to "Dark Blue" for display.
 */
function swigger_bottle_pretty_value($value) {
    $value = (string) $value;
    $value = str_replace(array('-', '_'), ' ', $value);
    return trim(ucwords($value));
}

/**
 * Attempt to detect a "color" attribute name on a variable product.
 * Examples: "pa_color", "pa_kleur", "color", "kleur".
 */
function swigger_bottle_detect_color_attribute_name($product) {
    if (!is_object($product) || !method_exists($product, 'get_attributes')) {
        return '';
    }
    $attrs = $product->get_attributes();
    foreach ($attrs as $attr) {
        $name = '';
        if (is_object($attr) && method_exists($attr, 'get_name')) {
            $name = (string) $attr->get_name();
        } elseif (is_string($attr)) {
            $name = $attr;
        }
        $lname = strtolower($name);
        if ($lname && (strpos($lname, 'color') !== false || strpos($lname, 'kleur') !== false)) {
            return $name;
        }
    }
    return '';
}

/**
 * Attempt to detect a "size/format" attribute name on a variable product.
 * Examples: "pa_formaat", "pa_size", "pa_maat", "pa_inhoud", "pa_volume".
 */
function swigger_bottle_detect_size_attribute_name($product) {
    if (!is_object($product) || !method_exists($product, 'get_attributes')) {
        return '';
    }
    $attrs = $product->get_attributes();
    foreach ($attrs as $attr) {
        $name = '';
        if (is_object($attr) && method_exists($attr, 'get_name')) {
            $name = (string) $attr->get_name();
        } elseif (is_string($attr)) {
            $name = $attr;
        }
        $lname = strtolower($name);
        if ($lname && (
            strpos($lname, 'formaat') !== false ||
            strpos($lname, 'format') !== false ||
            strpos($lname, 'size') !== false ||
            strpos($lname, 'maat') !== false ||
            strpos($lname, 'inhoud') !== false ||
            strpos($lname, 'volume') !== false
        )) {
            return $name;
        }
    }
    return '';
}

/**
 * Normalize a variation attribute value for fuzzy matching.
 * Strips non-alphanumeric chars so "1-liter", "1 liter", "1liter" all match "1liter".
 */
function swigger_bottle_normalize_attr($value) {
    return preg_replace('/[^a-z0-9]/', '', strtolower(sanitize_title((string) $value)));
}

/**
 * Format the chosen color for display, attempting to resolve a term name when possible.
 */
function swigger_bottle_format_color_display($color_slug, $color_attr_name = '') {
    $color_slug = sanitize_title((string) $color_slug);
    if ($color_attr_name && function_exists('taxonomy_exists') && taxonomy_exists($color_attr_name) && function_exists('get_term_by')) {
        $term = get_term_by('slug', $color_slug, $color_attr_name);
        if ($term && !is_wp_error($term) && !empty($term->name)) {
            return (string) $term->name;
        }
    }
    return swigger_bottle_pretty_value($color_slug);
}

/**
 * Check if WooCommerce is active
 */
function swigger_bottle_check_woocommerce() {
    if (!swigger_bottle_is_woocommerce_active()) {
        add_action('admin_notices', function() {
            echo '<div class="error"><p><strong>Be Fit Swigger Bottle Customizer</strong> requires WooCommerce to be installed and active.</p></div>';
        });
        return false;
    }
    return true;
}
add_action('plugins_loaded', 'swigger_bottle_check_woocommerce');

/**
 * Allow <details> and <summary> tags in wp_kses_post so the cart dropdown renders correctly.
 */
function swigger_bottle_allow_details_summary_tags($allowed_tags, $context = '') {
    if ($context === 'post') {
        $allowed_tags['details'] = array(
            'class' => true,
            'open'  => true,
        );
        $allowed_tags['summary'] = array(
            'class' => true,
        );
    }
    return $allowed_tags;
}
add_filter('wp_kses_allowed_html', 'swigger_bottle_allow_details_summary_tags', 10, 2);

/**
 * Register settings + admin page
 */
function swigger_bottle_register_settings() {
    register_setting(
        'swigger_bottle_settings',
        'swigger_bottle_enabled',
        array(
            'type' => 'string',
            'sanitize_callback' => function($value) {
                return $value === 'yes' ? 'yes' : 'no';
            },
            'default' => 'yes',
        )
    );

    register_setting(
        'swigger_bottle_settings',
        'swigger_bottle_target_product_id',
        array(
            'type' => 'integer',
            'sanitize_callback' => function($value) {
                $value = absint($value);
                if ($value === 0) {
                    return 0;
                }

                // Validate product exists (only if Woo is active).
                if (swigger_bottle_is_woocommerce_active() && function_exists('wc_get_product')) {
                    $p = wc_get_product($value);
                    if (!$p) {
                        add_settings_error(
                            'swigger_bottle_target_product_id',
                            'swigger_bottle_invalid_product',
                            __('Invalid product ID. Please enter a valid WooCommerce product ID.', 'swigger-swigger-bottle-customizer')
                        );
                        return 0;
                    }
                }

                return $value;
            },
            'default' => 0,
        )
    );

    add_settings_section(
        'swigger_bottle_main',
        __('Be Fit Swigger Bottle Customizer Settings', 'swigger-swigger-bottle-customizer'),
        function() {
            echo '<p>' . esc_html__('Choose which product should show the “Personalize” button.', 'swigger-swigger-bottle-customizer') . '</p>';
        },
        'swigger-swigger-bottle-customizer'
    );

    add_settings_field(
        'swigger_bottle_enabled',
        __('Enable customizer', 'swigger-swigger-bottle-customizer'),
        'swigger_bottle_field_enabled',
        'swigger-swigger-bottle-customizer',
        'swigger_bottle_main'
    );

    add_settings_field(
        'swigger_bottle_target_product_id',
        __('Target product (ID)', 'swigger-swigger-bottle-customizer'),
        'swigger_bottle_field_target_product_id',
        'swigger-swigger-bottle-customizer',
        'swigger_bottle_main'
    );
}
add_action('admin_init', 'swigger_bottle_register_settings');

function swigger_bottle_add_admin_menu() {
    $cap = swigger_bottle_is_woocommerce_active() ? 'manage_woocommerce' : 'manage_options';
    $parent = swigger_bottle_is_woocommerce_active() ? 'woocommerce' : 'options-general.php';

    add_submenu_page(
        $parent,
        __('Be Fit Swigger Bottle Customizer', 'swigger-swigger-bottle-customizer'),
        __('Be Fit Swigger Bottle Customizer', 'swigger-swigger-bottle-customizer'),
        $cap,
        'swigger-swigger-bottle-customizer',
        'swigger_bottle_render_settings_page'
    );
}
add_action('admin_menu', 'swigger_bottle_add_admin_menu');

function swigger_bottle_render_settings_page() {
    if (!current_user_can(swigger_bottle_is_woocommerce_active() ? 'manage_woocommerce' : 'manage_options')) {
        return;
    }

    echo '<div class="wrap">';
    echo '<h1>' . esc_html__('Be Fit Swigger Bottle Customizer', 'swigger-swigger-bottle-customizer') . '</h1>';
    echo '<form method="post" action="options.php">';
    settings_fields('swigger_bottle_settings');
    do_settings_sections('swigger-swigger-bottle-customizer');
    submit_button();
    echo '</form>';
    echo '</div>';
}

function swigger_bottle_field_enabled() {
    $value = get_option('swigger_bottle_enabled', 'yes');
    echo '<label>';
    echo '<input type="checkbox" name="swigger_bottle_enabled" value="yes" ' . checked($value, 'yes', false) . ' />';
    echo ' ' . esc_html__('Show the Personalize button on the configured product', 'swigger-swigger-bottle-customizer');
    echo '</label>';
}

function swigger_bottle_field_target_product_id() {
    $value = swigger_bottle_get_target_product_id();
    echo '<input type="number" min="0" step="1" name="swigger_bottle_target_product_id" value="' . esc_attr($value) . '" class="regular-text" />';

    $help = __('Enter a WooCommerce Product ID. Tip: edit a product in WP Admin and check the URL for “post=123”.', 'swigger-swigger-bottle-customizer');
    echo '<p class="description">' . esc_html($help) . '</p>';

    if ($value > 0 && swigger_bottle_is_woocommerce_active() && function_exists('wc_get_product')) {
        $p = wc_get_product($value);
        if ($p) {
            echo '<p class="description"><strong>' . esc_html__('Selected:', 'swigger-swigger-bottle-customizer') . '</strong> ' . esc_html($p->get_name()) . '</p>';
        }
    }
}

/**
 * Enqueue frontend styles and scripts
 */
function swigger_bottle_enqueue_assets() {
    // Avoid fatal errors if WooCommerce isn't active.
    if (!swigger_bottle_is_woocommerce_active()) {
        return;
    }
    if (!swigger_bottle_is_enabled()) {
        return;
    }

    $css_path = swigger_bottle_PLUGIN_DIR . 'assets/css/frontend.css';
    $js_path  = swigger_bottle_PLUGIN_DIR . 'assets/js/frontend.js';
    $css_ver  = file_exists($css_path) ? (string) filemtime($css_path) : swigger_bottle_VERSION;
    $js_ver   = file_exists($js_path) ? (string) filemtime($js_path) : swigger_bottle_VERSION;

    // Enqueue styles site-wide (needed for cart drawer / mini-cart on any page)
    wp_enqueue_style(
        'swigger-bottle-customizer-frontend',
        swigger_bottle_PLUGIN_URL . 'assets/css/frontend.css',
        array(),
        $css_ver
    );

    $target_product_id = swigger_bottle_get_target_product_id();
    
    if (!$target_product_id) {
        $fallback_post = get_page_by_path(swigger_bottle_PRODUCT_SLUG, OBJECT, 'product');
        if ($fallback_post) {
            $target_product_id = $fallback_post->ID;
        }
    }
    
    $queried_id = function_exists('get_queried_object_id') ? absint(get_queried_object_id()) : 0;
    $queried_product = $queried_id ? wc_get_product($queried_id) : null;
    $is_target_product = function_exists('is_product') && is_product() && swigger_bottle_is_target_product($queried_product);

    if (!$target_product_id && $is_target_product) {
        $target_product_id = $queried_id;
    }

    $target_product = $target_product_id ? wc_get_product($target_product_id) : null;
    
    wp_enqueue_script(
        'swigger-bottle-customizer-frontend',
        swigger_bottle_PLUGIN_URL . 'assets/js/frontend.js',
        array(),
        $js_ver,
        true
    );

    // Pass lightweight metadata to JavaScript (variations are lazy-loaded via .variations_form or AJAX to save ~180KB on initial HTML)
    wp_localize_script('swigger-bottle-customizer-frontend', 'swiggerBottleData', array(
        'ajaxUrl' => admin_url('admin-ajax.php'),
        'nonce' => wp_create_nonce('swigger_bottle_nonce'),
        'configuratorUrl' => swigger_bottle_PLUGIN_URL . 'configurator/index.html',
        'productId' => $target_product_id,
    ));
}
add_action('wp_enqueue_scripts', 'swigger_bottle_enqueue_assets');

/**
 * AJAX endpoint to return compact stock manifest for SWIGGER product (used on collection pages / lazy loading).
 * Only returns: variation_id, attributes, is_in_stock, is_purchasable, backorders_allowed, availability_html.
 */
function swigger_bottle_get_variation_stock_manifest() {
    check_ajax_referer('swigger_bottle_nonce', 'nonce');

    $target_product_id = swigger_bottle_get_target_product_id();
    if (!$target_product_id) {
        $fallback_post = get_page_by_path(swigger_bottle_PRODUCT_SLUG, OBJECT, 'product');
        if ($fallback_post) {
            $target_product_id = $fallback_post->ID;
        }
    }

    $product = $target_product_id ? wc_get_product($target_product_id) : null;
    if (!$product || !is_a($product, 'WC_Product_Variable')) {
        wp_send_json_success(array());
    }

    $raw_variations = $product->get_available_variations();
    $compact_manifest = array();

    foreach ($raw_variations as $v) {
        $compact_manifest[] = array(
            'variation_id'       => isset($v['variation_id']) ? absint($v['variation_id']) : 0,
            'attributes'         => isset($v['attributes']) ? $v['attributes'] : array(),
            'is_in_stock'        => !empty($v['is_in_stock']),
            'is_purchasable'     => !empty($v['is_purchasable']),
            'backorders_allowed' => isset($v['backorders_allowed']) && $v['backorders_allowed'] !== 'no' && $v['backorders_allowed'] !== false,
            'availability_html'  => isset($v['availability_html']) ? (string) $v['availability_html'] : '',
        );
    }

    wp_send_json_success($compact_manifest);
}
add_action('wp_ajax_swigger_bottle_get_variation_stock_manifest', 'swigger_bottle_get_variation_stock_manifest');
add_action('wp_ajax_nopriv_swigger_bottle_get_variation_stock_manifest', 'swigger_bottle_get_variation_stock_manifest');

/**
 * Add the "Personalize" button to product page
 */
function swigger_bottle_add_personalize_button() {
    if (!swigger_bottle_is_woocommerce_active()) {
        return;
    }
    if (!swigger_bottle_is_enabled()) {
        return;
    }

    global $product;
    
    if (!$product || !swigger_bottle_is_target_product($product)) {
        return;
    }

    $configurator_url = swigger_bottle_PLUGIN_URL . 'configurator/index.html';
    $ajax_url = admin_url('admin-ajax.php');
    $nonce = wp_create_nonce('swigger_bottle_nonce');

    echo '<div class="swigger-customizer-wrapper">
        <div id="swigger-bottle-customizer-btn"
            class="swigger-customizer-box"
            data-configurator-url="' . esc_url($configurator_url) . '"
            data-ajax-url="' . esc_url($ajax_url) . '"
            data-nonce="' . esc_attr($nonce) . '"
            data-product-id="' . esc_attr($product->get_id()) . '">
            <span class="swigger-customizer-title">' . esc_html__('Personaliseer', 'swigger-bottle-customizer') . '</span>
            <span class="swigger-customizer-icon">
                <svg width="18" height="39" viewBox="0 0 18 39" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;">
                    <path d="M2.28516 0.285645V15.3297H15.3668V0.285645" stroke="#000"/>
                    <path d="M5.55859 15.0432V21.961L8.82901 23.0667L12.0994 21.961V15.0432" stroke="#000"/>
                    <path d="M8.82632 23.0667V33.096" stroke="#D90000" stroke-linecap="round"/>
                    <path d="M8.82794 36.1047V37.1077" stroke="#D90000" stroke-linecap="round"/>
                    <path d="M11.0078 34.0989L15.3684 30.0872" stroke="#D90000" stroke-linecap="round"/>
                    <path d="M11.0156 37.457H16.3512" stroke="#d90000" stroke-linecap="round"/>
                    <path d="M1.08984 37.457H6.42543" stroke="#d90000" stroke-linecap="round"/>
                    <path d="M6.64844 34.0989L2.28788 30.0872" stroke="#d90000" stroke-linecap="round"/>
                </svg>
            </span>
        </div>
    </div>';
}
add_action('woocommerce_before_add_to_cart_button', 'swigger_bottle_add_personalize_button', 8);

/**
 * Render the modal at body level to avoid stacking context issues with sticky headers.
 */
function swigger_bottle_render_modal() {
    static $rendered = false;
    if ($rendered) {
        return;
    }
    $rendered = true;

    if (!swigger_bottle_is_woocommerce_active()) {
        return;
    }
    if (!swigger_bottle_is_enabled()) {
        return;
    }

    // Always render the modal so it's available on shop loop pages as well.
    echo '<div id="swigger-bottle-customizer-modal" class="swigger-bottle-customizer-modal" aria-hidden="true">
        <div class="swigger-bottle-customizer-modal-content" role="dialog" aria-modal="true">
            <iframe id="swigger-bottle-customizer-iframe" class="swigger-bottle-customizer-iframe" src="" frameborder="0"></iframe>
        </div>
    </div>';
}
add_action('wp_footer', 'swigger_bottle_render_modal', 5);

/**
 * Disable WooCommerce "added to cart" notices for customizer flow.
 */
function swigger_bottle_disable_add_to_cart_notice($message = '', $products = array(), $show_qty = false) {
    return '';
}

/**
 * Handle AJAX request to add customized product to cart
 */
function swigger_bottle_add_to_cart() {
    if (!swigger_bottle_is_woocommerce_active()) {
        wp_send_json_error(array('message' => 'WooCommerce is not active'));
        return;
    }

    // Verify nonce
    $nonce = isset($_POST['nonce']) ? sanitize_text_field(wp_unslash($_POST['nonce'])) : '';
    if (!$nonce || !wp_verify_nonce($nonce, 'swigger_bottle_nonce')) {
        wp_send_json_error(array('message' => 'Security check failed'));
        return;
    }
    
    $product_id = isset($_POST['product_id']) ? intval($_POST['product_id']) : 0;
    $customization_data = isset($_POST['customization']) ? $_POST['customization'] : array();

    // Support JSON payloads (e.g. fetch/FormData) in addition to jQuery's nested POST object.
    if (is_string($customization_data)) {
        $decoded = json_decode(wp_unslash($customization_data), true);
        if (is_array($decoded)) {
            $customization_data = $decoded;
        } else {
            $customization_data = array();
        }
    }

    if ($product_id <= 0) {
        wp_send_json_error(array('message' => 'Invalid product'));
        return;
    }

    // Ensure cart/session is loaded in admin-ajax context.
    if (function_exists('wc_load_cart')) {
        wc_load_cart();
    } else {
        if (method_exists(WC(), 'frontend_includes')) {
            WC()->frontend_includes();
        }
        if (method_exists(WC(), 'initialize_session')) {
            WC()->initialize_session();
        }
        if (method_exists(WC(), 'initialize_cart')) {
            WC()->initialize_cart();
        }
    }
    if (!WC()->cart) {
        wp_send_json_error(array('message' => 'Cart is not available'));
        return;
    }
    if (WC()->session && method_exists(WC()->session, 'set_customer_session_cookie')) {
        WC()->session->set_customer_session_cookie(true);
    }
    
    // Validate product
    $product = wc_get_product($product_id);
    if (!$product) {
        wp_send_json_error(array('message' => 'Product not found'));
        return;
    }
    
    // If a variation ID was passed directly as the product_id, resolve it to its parent
    if ($product->is_type('variation')) {
        $_POST['variation_id'] = $product_id;
        $product_id = $product->get_parent_id();
        $product = wc_get_product($product_id);
        
        if (isset($_POST['variation_attributes']) && !empty($_POST['variation_attributes'])) {
            $raw_attrs = json_decode(stripslashes($_POST['variation_attributes']), true);
            if (is_array($raw_attrs)) {
                $customization_data['color'] = isset($raw_attrs['attribute_pa_kleur']) ? $raw_attrs['attribute_pa_kleur'] : (isset($raw_attrs['pa_kleur']) ? $raw_attrs['pa_kleur'] : '');
                $customization_data['size'] = isset($raw_attrs['attribute_pa_formaat']) ? $raw_attrs['attribute_pa_formaat'] : (isset($raw_attrs['pa_formaat']) ? $raw_attrs['pa_formaat'] : '');
            }
        } else {
             $customization_data['color'] = $product->get_attribute('pa_kleur');
             $customization_data['size'] = $product->get_attribute('pa_formaat');
        }
    }

    if (method_exists($product, 'is_purchasable') && !$product->is_purchasable()) {
        wp_send_json_error(array('message' => 'Product is not purchasable'));
        return;
    }
    
    // Process and save images temporarily
    $front_image_url = '';
    $back_image_url = '';
    
    if (!empty($customization_data['frontImage'])) {
        $front_image_url = swigger_bottle_save_temp_image($customization_data['frontImage'], 'front');
    }
    
    if (!empty($customization_data['backImage'])) {
        $back_image_url = swigger_bottle_save_temp_image($customization_data['backImage'], 'back');
    }
    
    $front_design_url = '';
    $back_design_url = '';

    // Accept both with and without underscore prefix (frontend sends _frontDesignImage)
    $fdi = !empty($customization_data['frontDesignImage']) ? $customization_data['frontDesignImage'] : (!empty($customization_data['_frontDesignImage']) ? $customization_data['_frontDesignImage'] : '');
    $bdi = !empty($customization_data['backDesignImage']) ? $customization_data['backDesignImage'] : (!empty($customization_data['_backDesignImage']) ? $customization_data['_backDesignImage'] : '');

    if ($fdi) {
        $front_design_url = swigger_bottle_save_temp_image($fdi, 'front-design');
    }
    if ($bdi) {
        $back_design_url = swigger_bottle_save_temp_image($bdi, 'back-design');
    }

    $front_prod_url = '';
    $back_prod_url = '';

    $fpi = !empty($customization_data['frontProductionImage']) ? $customization_data['frontProductionImage'] : (!empty($customization_data['_frontProductionImage']) ? $customization_data['_frontProductionImage'] : '');
    $bpi = !empty($customization_data['backProductionImage']) ? $customization_data['backProductionImage'] : (!empty($customization_data['_backProductionImage']) ? $customization_data['_backProductionImage'] : '');
    $fps = !empty($customization_data['frontProductionSvg']) ? $customization_data['frontProductionSvg'] : (!empty($customization_data['_frontProductionSvg']) ? $customization_data['_frontProductionSvg'] : '');
    $bps = !empty($customization_data['backProductionSvg']) ? $customization_data['backProductionSvg'] : (!empty($customization_data['_backProductionSvg']) ? $customization_data['_backProductionSvg'] : '');

    // Prioritize SVG vector export for production (laser-ready)
    if ($fps) {
        $front_prod_url = swigger_bottle_save_temp_image($fps, 'front-prod');
    } elseif ($fpi) {
        $front_prod_url = swigger_bottle_save_temp_image($fpi, 'front-prod');
    }

    if ($bps) {
        $back_prod_url = swigger_bottle_save_temp_image($bps, 'back-prod');
    } elseif ($bpi) {
        $back_prod_url = swigger_bottle_save_temp_image($bpi, 'back-prod');
    }

    // Prepare cart item data
    $cart_item_data = array(
        '_bottle_customization' => array(
            'design_version' => 2,
            'front_items' => swigger_bottle_sanitize_design_items($customization_data['frontItems'] ?? array()),
            'back_items' => swigger_bottle_sanitize_design_items($customization_data['backItems'] ?? array()),
            'color' => sanitize_text_field($customization_data['color'] ?? ''),
            'front_text' => sanitize_text_field($customization_data['frontText'] ?? ''),
            'back_text' => sanitize_text_field($customization_data['backText'] ?? ''),
            'front_monogram' => sanitize_text_field($customization_data['frontMonogram'] ?? ''),
            'back_monogram' => sanitize_text_field($customization_data['backMonogram'] ?? ''),
            'front_graphic' => sanitize_text_field($customization_data['frontGraphic'] ?? ''),
            'back_graphic' => sanitize_text_field($customization_data['backGraphic'] ?? ''),
            'front_jersey_name' => sanitize_text_field($customization_data['frontJerseyName'] ?? ''),
            'front_jersey_number' => sanitize_text_field($customization_data['frontJerseyNumber'] ?? ''),
            'back_jersey_name' => sanitize_text_field($customization_data['backJerseyName'] ?? ''),
            'back_jersey_number' => sanitize_text_field($customization_data['backJerseyNumber'] ?? ''),
            'front_graphic_src' => swigger_bottle_sanitize_graphic_src($customization_data['frontGraphicSrc'] ?? ''),
            'back_graphic_src' => swigger_bottle_sanitize_graphic_src($customization_data['backGraphicSrc'] ?? ''),
            'font' => sanitize_text_field($customization_data['font'] ?? ''),
            'custom_world_enabled' => !empty($customization_data['customWorldEnabled']) ? 'yes' : 'no',
            'custom_world_name' => sanitize_text_field($customization_data['customWorldName'] ?? ''),
            'custom_world_roots' => sanitize_textarea_field($customization_data['customWorldRoots'] ?? ''),
            'custom_world_hobbies' => sanitize_textarea_field($customization_data['customWorldHobbies'] ?? ''),
            'custom_world_future' => sanitize_textarea_field($customization_data['customWorldFuture'] ?? ''),
            'custom_world_motto' => sanitize_textarea_field($customization_data['customWorldMotto'] ?? ''),
            'custom_world_style' => sanitize_text_field($customization_data['customWorldStyle'] ?? ''),
            'custom_world_do_dont' => sanitize_textarea_field($customization_data['customWorldDoDont'] ?? ''),
            'monogram_style' => sanitize_text_field($customization_data['monogramStyle'] ?? ''),
            'front_monogram_style' => sanitize_text_field($customization_data['frontMonogramStyle'] ?? ''),
            'back_monogram_style' => sanitize_text_field($customization_data['backMonogramStyle'] ?? ''),
            'front_image_url' => $front_image_url,
            'back_image_url' => $back_image_url,
            'front_design_url' => $front_design_url,
            'back_design_url' => $back_design_url,
            'front_prod_url' => $front_prod_url,
            'back_prod_url' => $back_prod_url,
        ),
        'unique_key' => md5(microtime() . rand()), // Make each customization unique
    );

    // Compute and store per-side surcharges so display helpers and price hooks have stable values.
    $c = &$cart_item_data['_bottle_customization'];
    $c['front_amount'] = swigger_bottle_side_has_customization($c, 'front') ? swigger_bottle_side_surcharge('front') : 0;
    $c['back_amount']  = swigger_bottle_side_has_customization($c, 'back')  ? swigger_bottle_side_surcharge('back')  : 0;
    unset($c);
    
    // Add to cart
    wc_clear_notices();
    add_filter('wc_add_to_cart_message_html', 'swigger_bottle_disable_add_to_cart_notice', 10, 3);
    add_filter('woocommerce_add_to_cart_message_html', 'swigger_bottle_disable_add_to_cart_notice', 10, 3);

    $quantity = isset($_POST['quantity']) ? max(1, intval($_POST['quantity'])) : 1;
    $variation_id = isset($_POST['variation_id']) ? intval($_POST['variation_id']) : 0;
    $variation = array();
    $color_attr_name = '';

    // If target product is variable, we must provide a variation_id + attributes.
    if (is_a($product, 'WC_Product_Variable')) {
        $color_raw = isset($customization_data['color']) ? (string) $customization_data['color'] : '';
        $color     = $color_raw !== '' ? swigger_bottle_normalize_attr($color_raw) : '';

        $size_raw  = isset($customization_data['size']) ? (string) $customization_data['size'] : '';
        $size      = $size_raw !== '' ? swigger_bottle_normalize_attr($size_raw) : '';

        $color_attr_name = swigger_bottle_detect_color_attribute_name($product);
        $size_attr_name  = $size ? swigger_bottle_detect_size_attribute_name($product) : '';

        $variations = $product->get_available_variations();
        $chosen = null;
        $fallback_chosen = null;
        $available_attr_values = array();

        // If we received an explicit variation ID from the frontend, prioritize it.
        $passed_v_id = isset($_POST['variation_id']) ? intval($_POST['variation_id']) : 0;
        if ($passed_v_id > 0) {
            $vp = wc_get_product($passed_v_id);
            if ($vp && $vp->get_parent_id() == $product_id) {
                if (method_exists($vp, 'is_in_stock') && !$vp->is_in_stock()) {
                    wp_send_json_error(array(
                        'message' => __('Excuses, deze variant is momenteel uitverkocht.', 'swigger-bottle-customizer'),
                    ));
                    return;
                }
                $variation_id = $passed_v_id;
                $raw_attrs = isset($_POST['variation_attributes']) ? json_decode(stripslashes($_POST['variation_attributes']), true) : array();
                if (is_array($raw_attrs) && !empty($raw_attrs)) {
                    $variation = $raw_attrs;
                } else {
                    $variation = $vp->get_variation_attributes();
                }
                // Store as fallback so PASS 1 and 2 can try to match Customizer choices first
                $fallback_chosen = array('variation_id' => $variation_id, 'attributes' => $variation);
            }
        }

        // Helper: check if a single variation attribute value matches a normalised target.
        // Uses strict exact matching so "dipdyemint" never fuzzy-matches "mint" or "mintgreen".
        $attr_matches = function($val, $target_norm) {
            if ($target_norm === '') return false;
            // If variation value is empty, it means "Any", which matches our target.
            if ($val === '') return true;
            
            $val_norm = swigger_bottle_normalize_attr($val);
            if ($val_norm === '') return false;
            
            // Exact normalized match
            if ($val_norm === $target_norm) return true;

            // Size aliases support (e.g. 536ml <=> 500ml, 946ml <=> 1liter)
            $is_500 = function($s) { return $s === '536ml' || $s === '500ml' || $s === '536' || $s === '500' || $s === 'jr'; };
            $is_710 = function($s) { return $s === '710ml' || $s === '710'; };
            $is_1L  = function($s) { return $s === '946ml' || $s === '1liter' || $s === '1l' || $s === '946' || $s === '1'; };
            
            if ($is_500($target_norm) && $is_500($val_norm)) return true;
            if ($is_710($target_norm) && $is_710($val_norm)) return true;
            if ($is_1L($target_norm) && $is_1L($val_norm)) return true;
            
            return false;
        };

        // Helper: check all attributes of a variation for a match, optionally restricted to one attr key.
        $variation_matches_attr = function($attrs, $target_norm, $preferred_key = '') use ($attr_matches) {
            if ($target_norm === '') return false;
            foreach ($attrs as $k => $val) {
                // Support both 'pa_color' and 'attribute_pa_color'
                if ($preferred_key && $k !== $preferred_key && $k !== 'attribute_' . $preferred_key) continue;
                if ($attr_matches($val, $target_norm)) return true;
                // Also check the WP taxonomy term name (slug may differ from display name)
                $tax_name = str_replace('attribute_', '', $k);
                if (function_exists('taxonomy_exists') && taxonomy_exists($tax_name) && function_exists('get_term_by')) {
                    $term = get_term_by('slug', $val, $tax_name);
                    if ($term && !is_wp_error($term)) {
                        if ($attr_matches($term->name, $target_norm)) return true;
                    }
                }
            }
            return false;
        };

        foreach ($variations as $v) {
            if (empty($v['variation_id']) || empty($v['attributes']) || !is_array($v['attributes'])) continue;
            $vp = wc_get_product((int) $v['variation_id']);
            if (!$vp || (method_exists($vp, 'is_purchasable') && !$vp->is_purchasable())) continue;
            if (method_exists($vp, 'is_in_stock') && !$vp->is_in_stock()) continue;

            $attrs = $v['attributes'];
            foreach ($attrs as $k => $val) {
                $available_attr_values[$k][] = (string) $val;
            }
        }

        // PASS 1 — match BOTH color AND size (exact product variant for SWIGGER from 3D Customizer).
        if ($color && $size) {
            foreach ($variations as $v) {
                if (empty($v['variation_id']) || empty($v['attributes']) || !is_array($v['attributes'])) continue;
                $vp = wc_get_product((int) $v['variation_id']);
                if (!$vp || (method_exists($vp, 'is_purchasable') && !$vp->is_purchasable())) continue;
                if (method_exists($vp, 'is_in_stock') && !$vp->is_in_stock()) continue;

                $attrs = $v['attributes'];
                $color_ok = $variation_matches_attr($attrs, $color, $color_attr_name);
                $size_ok  = $variation_matches_attr($attrs, $size,  $size_attr_name);
                if ($color_ok && $size_ok) {
                    $chosen = $v;
                    break;
                }
            }
        }

        // PASS 2 — match color only (fallback when no size attribute or no double match).
        if (!$chosen && $color) {
            foreach ($variations as $v) {
                if (empty($v['variation_id']) || empty($v['attributes']) || !is_array($v['attributes'])) continue;
                $vp = wc_get_product((int) $v['variation_id']);
                if (!$vp || (method_exists($vp, 'is_purchasable') && !$vp->is_purchasable())) continue;
                if (method_exists($vp, 'is_in_stock') && !$vp->is_in_stock()) continue;

                if ($variation_matches_attr($v['attributes'], $color, $color_attr_name)) {
                    $chosen = $v;
                    break;
                }
            }
        }

        // PASS 3 — If a specific variation_id was passed via POST (e.g. from direct add to bag)
        if (!$chosen && $fallback_chosen) {
            if ($color) {
                if ($variation_matches_attr($fallback_chosen['attributes'], $color, $color_attr_name)) {
                    $chosen = $fallback_chosen;
                }
            } else {
                $chosen = $fallback_chosen;
            }
        }

        // Final Check: If a color was requested but the chosen variation doesn't match or is out of stock
        if ($color) {
            $is_match = false;
            if ($chosen) {
                $is_match = $variation_matches_attr($chosen['attributes'], $color, $color_attr_name);
            }
            
            if (!$is_match || !$chosen) {
                wp_send_json_error(array(
                    'message' => __('Excuses, deze variant is momenteel uitverkocht.', 'swigger-bottle-customizer'),
                ));
                return;
            }
        }

        // PASS 3 — first purchasable/in-stock variation (only if NO color was specified).
        if (!$chosen && empty($color)) {
            foreach ($variations as $v) {
                if (empty($v['variation_id']) || empty($v['attributes']) || !is_array($v['attributes'])) {
                    continue;
                }
                $variation_product = wc_get_product((int) $v['variation_id']);
                if (!$variation_product || (method_exists($variation_product, 'is_purchasable') && !$variation_product->is_purchasable())) {
                    continue;
                }
                if (method_exists($variation_product, 'is_in_stock') && !$variation_product->is_in_stock()) {
                    continue;
                }
                $chosen = $v;
                break;
            }
        }

        // As a last resort, try child variations directly (some configs return empty available variations).
        if (!$chosen) {
            $children = $product->get_children();
            foreach ($children as $child_id) {
                $variation_product = wc_get_product((int) $child_id);
                if (!$variation_product || (method_exists($variation_product, 'is_purchasable') && !$variation_product->is_purchasable())) {
                    continue;
                }
                if (method_exists($variation_product, 'is_in_stock') && !$variation_product->is_in_stock()) {
                    continue;
                }

                $variation_id = (int) $child_id;
                if (method_exists($variation_product, 'get_variation_attributes')) {
                    $variation = $variation_product->get_variation_attributes();
                }
                break;
            }
        } else {
            $variation_id = (int) $chosen['variation_id'];
            foreach ($chosen['attributes'] as $k => $val) {
                $variation[$k] = (string) $val;
            }
        }

        if ($variation_id <= 0) {
            wp_send_json_error(array(
                'message' => 'No purchasable variation found for this product',
                'debug' => array(
                    'product_id' => $product_id,
                    'color' => $color_raw,
                    'available_variations_count' => is_array($variations) ? count($variations) : 0,
                    'available_attribute_values' => $available_attr_values,
                ),
            ));
            return;
        }
    }

    // Store detected color attribute name for later display override (cart/checkout/order).
    if ($color_attr_name) {
        $cart_item_data['_bottle_customization']['color_attribute'] = $color_attr_name;
    }

    $cart_item_key = WC()->cart->add_to_cart($product_id, $quantity, $variation_id, $variation, $cart_item_data);
    wc_clear_notices();
    remove_filter('wc_add_to_cart_message_html', 'swigger_bottle_disable_add_to_cart_notice', 10);
    remove_filter('woocommerce_add_to_cart_message_html', 'swigger_bottle_disable_add_to_cart_notice', 10);
    
    if ($cart_item_key) {
        wp_send_json_success(array(
            'cart_url' => wc_get_cart_url(),
            'cart_count' => WC()->cart->get_cart_contents_count(),
        ));
    } else {
        $errors = wc_get_notices('error');
        $msg = 'Failed to add product to cart';
        if (!empty($errors) && is_array($errors)) {
            $first = reset($errors);
            if (is_array($first) && !empty($first['notice'])) {
                $msg = wp_strip_all_tags($first['notice']);
            }
        }
        wp_send_json_error(array(
            'message' => $msg,
            'debug' => array(
                'product_id' => $product_id,
                'variation_id' => $variation_id,
                'color' => isset($customization_data['color']) ? (string) $customization_data['color'] : '',
            ),
        ));
    }
}
add_action('wp_ajax_swigger_bottle_add_to_cart', 'swigger_bottle_add_to_cart');
add_action('wp_ajax_nopriv_swigger_bottle_add_to_cart', 'swigger_bottle_add_to_cart');

/**
 * Save base64 media / SVG vector files to temporary directory.
 */
function swigger_bottle_save_temp_image($raw_media, $prefix) {
    $raw_media = (string) $raw_media;
    if (empty($raw_media)) {
        return '';
    }

    $ext = 'png';
    $image_data = '';

    // 1. Raw XML / SVG string check
    if (stripos($raw_media, '<svg') !== false && (stripos($raw_media, '</svg>') !== false || stripos($raw_media, 'xmlns') !== false)) {
        $ext = 'svg';
        $image_data = $raw_media;
    }
    // 2. Data URI (handles base64 and utf-8/uri-encoded SVG, PNG, JPG, WEBP, PDF)
    elseif (preg_match('/^data:([a-z0-9.+\/-]+)(?:;([a-z0-9_=-]+))*,/i', $raw_media, $m)) {
        $mime = strtolower((string) $m[1]);
        $is_base64 = stripos($raw_media, ';base64,') !== false;
        $content_part = preg_replace('/^data:[^,]+,/i', '', $raw_media);

        if ($mime === 'image/svg+xml') {
            $ext = 'svg';
            $image_data = $is_base64 ? base64_decode(preg_replace('/\s+/', '', $content_part), true) : rawurldecode($content_part);
        } elseif ($mime === 'image/png') {
            $ext = 'png';
            $image_data = base64_decode(preg_replace('/\s+/', '', $content_part), true);
        } elseif ($mime === 'image/jpeg' || $mime === 'image/jpg') {
            $ext = 'jpg';
            $image_data = base64_decode(preg_replace('/\s+/', '', $content_part), true);
        } elseif ($mime === 'image/webp') {
            $ext = 'webp';
            $image_data = base64_decode(preg_replace('/\s+/', '', $content_part), true);
        } elseif ($mime === 'application/pdf') {
            $ext = 'pdf';
            $image_data = base64_decode(preg_replace('/\s+/', '', $content_part), true);
        } else {
            return '';
        }
    } else {
        // Fallback standard base64 string
        $image_data = base64_decode(preg_replace('/\s+/', '', $raw_media), true);
    }

    if (!$image_data) {
        return '';
    }
    
    // Create temp directory if it doesn't exist
    $upload_dir = wp_upload_dir();
    $temp_dir = trailingslashit($upload_dir['basedir']) . 'swigger-bottle-customizer-temp/';
    
    if (!file_exists($temp_dir)) {
        wp_mkdir_p($temp_dir);
        // Add index.php for security
        file_put_contents($temp_dir . 'index.php', '<?php // Silence is golden');
    }
    
    // Generate unique filename
    $filename = $prefix . '-' . uniqid() . '.' . $ext;
    $filepath = $temp_dir . $filename;
    
    // Save the file
    $written = @file_put_contents($filepath, $image_data);
    if (!$written || !file_exists($filepath)) {
        return '';
    }
    
    // Return the URL
    return trailingslashit($upload_dir['baseurl']) . 'swigger-bottle-customizer-temp/' . $filename;
}

/**
 * Sanitize a configurator gallery graphic src (relative path like "gallery/.../file.svg").
 * We only accept gallery paths to avoid loading arbitrary remote URLs.
 */
function swigger_bottle_sanitize_graphic_src($src) {
    $src = trim((string) $src);
    if ($src === '') return '';
    $src = str_replace('\\', '/', $src);

    // Disallow URLs, data URIs, blobs, and path traversal.
    if (preg_match('#^(https?:)?//#i', $src)) return '';
    if (strpos($src, 'data:') === 0) return '';
    if (strpos($src, 'blob:') === 0) return '';
    if (strpos($src, '..') !== false) return '';

    // Only allow built-in gallery assets.
    if (strpos($src, 'gallery/') !== 0) return '';

    return $src;
}

/**
 * Build a URL to a configurator asset by relative path (e.g. "gallery/.../icon.svg").
 */
function swigger_bottle_configurator_asset_url($relative_path) {
    $relative_path = ltrim((string) $relative_path, '/');
    return swigger_bottle_PLUGIN_URL . 'configurator/' . $relative_path;
}

/**
 * Monogram glyph mapping for 3-character circle/N-gram fonts (right position).
 */
function swigger_bottle_monogram_right_glyph_map() {
    return array(
        'A' => '1', 'B' => '2', 'C' => '3', 'D' => '4', 'E' => '5',
        'F' => '6', 'G' => '7', 'H' => '8', 'I' => '9', 'J' => '0',
        'K' => '!', 'L' => '@', 'M' => '#', 'N' => '$', 'O' => '%',
        'P' => '^', 'Q' => '&', 'R' => '*', 'S' => '(', 'T' => ')',
        'U' => '-', 'V' => '+', 'W' => '[', 'X' => ']', 'Y' => '\\\\', 'Z' => ':',
    );
}

function swigger_bottle_monogram_convert_circle_glyphs($input) {
    $input = (string) $input;
    if ($input === '') return '';

    $upper = strtoupper($input);
    $len = strlen($upper);

    if ($len === 2) {
        return strtolower($upper[0]) . $upper[1];
    }
    if ($len === 3) {
        $map = swigger_bottle_monogram_right_glyph_map();
        $left = strtolower($upper[0]);
        $middle = $upper[1];
        $right = isset($map[$upper[2]]) ? $map[$upper[2]] : $upper[2];
        return $left . $middle . $right;
    }

    return $input;
}

function swigger_bottle_monogram_convert_ngram_glyphs($input) {
    $input = (string) $input;
    if ($input === '') return '';

    $upper = strtoupper($input);
    $len = strlen($upper);

    if ($len === 2) {
        return '?' . strtolower($upper[0]) . $upper[1];
    }
    if ($len === 3) {
        $map = swigger_bottle_monogram_right_glyph_map();
        $left = strtolower($upper[0]);
        $middle = $upper[1];
        $right = isset($map[$upper[2]]) ? $map[$upper[2]] : $upper[2];
        return '?' . $left . $middle . $right;
    }

    return $input;
}

/**
 * Render a monogram as text using the correct font/glyph rules.
 * Returns HTML (safe to echo into the cart item display block).
 */
function swigger_bottle_render_monogram_html($monogram, $monogram_style) {
    $monogram = (string) $monogram;
    $monogram_style = (string) $monogram_style;
    $len = strlen($monogram);

    if ($monogram === '') return '';

    // Circle glyph fonts
    if ($monogram_style === 'Circle Script') {
        $class = ($len === 3) ? 'bc-monogram--circle3' : 'bc-monogram--circle2';
        $value = swigger_bottle_monogram_convert_circle_glyphs($monogram);
        return '<span class="bc-monogram ' . esc_attr($class) . '">' . esc_html($value) . '</span>';
    }

    // N-Gram glyph fonts
    if ($monogram_style === 'Block Script') {
        $class = ($len === 3) ? 'bc-monogram--ngram3' : 'bc-monogram--ngram2';
        $value = swigger_bottle_monogram_convert_ngram_glyphs($monogram);
        return '<span class="bc-monogram ' . esc_attr($class) . '">' . esc_html($value) . '</span>';
    }

    // Regular monogram fonts by style name.
    $class_map = array(
        'ITC Modern' => 'bc-monogram--itc-modern',
        'Nexa Script' => 'bc-monogram--nexa-script',
        'Roman' => 'bc-monogram--roman',
        'Vine' => 'bc-monogram--vine',
    );
    $class = isset($class_map[$monogram_style]) ? $class_map[$monogram_style] : 'bc-monogram--roman';

    // Roman monogram: middle letter larger when 3 characters.
    if ($monogram_style === 'Roman' && $len === 3) {
        $chars = str_split($monogram);
        return '<span class="bc-monogram ' . esc_attr($class) . ' bc-monogram--roman-split">'
            . '<span class="bc-monogram__left">' . esc_html($chars[0]) . '</span>'
            . '<span class="bc-monogram__middle">' . esc_html($chars[1]) . '</span>'
            . '<span class="bc-monogram__right">' . esc_html($chars[2]) . '</span>'
            . '</span>';
    }

    return '<span class="bc-monogram ' . esc_attr($class) . '">' . esc_html($monogram) . '</span>';
}

/**
 * Build a one-line text summary for a side.
 */
function swigger_bottle_build_side_summary($customization, $side, $include_amount = true) {
    $side = ($side === 'back') ? 'back' : 'front';
    $parts = array();

    if (!empty($customization[$side . '_items'])) {
        foreach ($customization[$side . '_items'] as $design) {
            $label = strtoupper($design['type'] ?? 'design');
            $name = $design['name'] ?? '';
            $style = $design['type'] === 'text' ? ($design['font'] ?? '') : ($design['monogramStyle'] ?? '');
            $parts[] = trim($label . ': ' . $name . ($style ? ' (' . $style . ')' : ''));
        }
    } elseif (!empty($customization[$side . '_jersey_number']) || !empty($customization[$side . '_jersey_name'])) {
        $parts[] = 'JERSEY';
        $nr = !empty($customization[$side . '_jersey_number']) ? $customization[$side . '_jersey_number'] : '';
        $name = !empty($customization[$side . '_jersey_name']) ? $customization[$side . '_jersey_name'] : '';
        $val = implode(' - ', array_filter(array($nr, $name)));
        if ($val) $parts[] = $val;
    } elseif (!empty($customization[$side . '_text'])) {
        $parts[] = 'TEXT';
        $parts[] = $customization[$side . '_text'];
    } elseif (!empty($customization[$side . '_monogram'])) {
        $parts[] = 'MONOGRAM';
        // Show the monogram style/font name if available
        $mono_style_key = $side . '_monogram_style';
        $mono_style = !empty($customization[$mono_style_key])
            ? (string) $customization[$mono_style_key]
            : (!empty($customization['monogram_style']) ? (string) $customization['monogram_style'] : '');
        if ($mono_style !== '') {
            $parts[] = $mono_style;
        }
        $parts[] = $customization[$side . '_monogram'];
    } elseif (!empty($customization[$side . '_graphic'])) {
        $parts[] = 'GRAPHIC';
        $name = !empty($customization[$side . '_graphic']) ? basename($customization[$side . '_graphic']) : '';
        // Strip file extension for cleaner display.
        $name = preg_replace('/\.[^.]+$/', '', $name);
        if ($name) {
            $parts[] = ucfirst($name);
        }
    }

    if (empty($parts)) {
        return '';
    }

    if ($include_amount) {
        $amount = swigger_bottle_side_has_customization($customization, $side)
            ? swigger_bottle_format_surcharge(swigger_bottle_side_surcharge($side))
            : swigger_bottle_format_surcharge(0);
        $parts[] = $amount;
    }
    return implode(', ', $parts);
}

/**
 * Render the customization preview for a side (front/back).
 */
function swigger_bottle_render_side_preview_html($customization, $side) {
    $side = ($side === 'back') ? 'back' : 'front';

    $text_key = $side . '_text';
    $mono_key = $side . '_monogram';
    $graphic_key = $side . '_graphic';
    $graphic_src_key = $side . '_graphic_src';
    $design_url_key = $side . '_design_url';

    $text = !empty($customization[$text_key]) ? (string) $customization[$text_key] : '';
    $monogram = !empty($customization[$mono_key]) ? (string) $customization[$mono_key] : '';
    $graphic = !empty($customization[$graphic_key]) ? (string) $customization[$graphic_key] : '';
    $graphic_src = !empty($customization[$graphic_src_key]) ? (string) $customization[$graphic_src_key] : '';
    $design_url = !empty($customization[$design_url_key]) ? (string) $customization[$design_url_key] : '';
    // Prefer per-side monogram style, fall back to shared monogram_style for backward compatibility.
    $monogram_style_key = $side . '_monogram_style';
    $monogram_style = !empty($customization[$monogram_style_key])
        ? (string) $customization[$monogram_style_key]
        : (!empty($customization['monogram_style']) ? (string) $customization['monogram_style'] : '');

    // Prefer showing the monogram as real text if present.
    if ($monogram !== '') {
        return swigger_bottle_render_monogram_html($monogram, $monogram_style);
    }

    // Try Jersey rendering
    $jersey_name = !empty($customization[$side . '_jersey_name']) ? (string) $customization[$side . '_jersey_name'] : '';
    $jersey_number = !empty($customization[$side . '_jersey_number']) ? (string) $customization[$side . '_jersey_number'] : '';
    if ($jersey_name !== '' || $jersey_number !== '') {
         $val = implode(' - ', array_filter(array($jersey_number, $jersey_name)));
         return '<span class="bc-text">' . esc_html($val) . '</span>';
    }

    // If a graphic exists, try to show original gallery SVG, else fall back to captured design image.
    if ($graphic !== '') {
        $safe_src = swigger_bottle_sanitize_graphic_src($graphic_src);
        if ($safe_src !== '') {
            $url = swigger_bottle_configurator_asset_url($safe_src);
            return '<img src="' . esc_url($url) . '" alt="' . esc_attr__('Graphic', 'swigger-swigger-bottle-customizer') . '" class="bc-graphic-img" />';
        }
        if ($design_url !== '') {
            return '<img src="' . esc_url($design_url) . '" alt="' . esc_attr__('Graphic', 'swigger-swigger-bottle-customizer') . '" class="bc-graphic-img" />';
        }
        return '<span class="bc-text">' . esc_html__('Graphic', 'swigger-swigger-bottle-customizer') . '</span>';
    }

    // Text fallback
    if ($text !== '') {
        return '<span class="bc-text">' . esc_html($text) . '</span>';
    }

    return '<span class="bc-text">—</span>';
}

/**
 * Adjust line-item price to include the customization surcharge.
 */
function swigger_bottle_adjust_cart_prices($cart) {
    if (is_admin() && !defined('DOING_AJAX')) {
        return;
    }
    if (did_action('woocommerce_before_calculate_totals') >= 2) {
        return;
    }

    foreach ($cart->get_cart() as $cart_item) {
        if (empty($cart_item['_bottle_customization'])) {
            continue;
        }
        $c = $cart_item['_bottle_customization'];
        $surcharge = swigger_bottle_total_surcharge($c);
        if ($surcharge > 0) {
            $product = $cart_item['data'];
            
            // 1. Get the real base price (sale or regular)
            $base_price = (float) $product->get_regular_price();
            if ($product->get_sale_price() !== '') {
                $base_price = (float) $product->get_sale_price();
            }

            // 2. Set the absolute final price: [Base Price] + [Surcharge]
            $product->set_regular_price((float)$product->get_regular_price() + $surcharge);
            $product->set_price($base_price + $surcharge);
        }
    }
}
add_action('woocommerce_before_calculate_totals', 'swigger_bottle_adjust_cart_prices', 20, 1);

/**
 * Exclude customization surcharge from coupon discounts.
 * Personalization is a fixed fee and coupons must only discount the bottle base price.
 */
function swigger_bottle_adjust_coupon_discount($discount, $discounting_amount, $cart_item, $single, $coupon) {
    if (!empty($cart_item['_bottle_customization'])) {
        $surcharge = swigger_bottle_total_surcharge($cart_item['_bottle_customization']);
        if ($surcharge > 0 && !empty($cart_item['data'])) {
            $product = $cart_item['data'];
            $full_price = (float) $product->get_price();
            $base_price = max(0, $full_price - $surcharge);
            if ($full_price > 0 && $base_price > 0) {
                // Pro-rate discount to only apply to the base bottle price
                $discount = $discount * ($base_price / $full_price);
            }
        }
    }
    return $discount;
}
add_filter('woocommerce_coupon_get_discount_amount', 'swigger_bottle_adjust_coupon_discount', 20, 5);

/**
 * Helper to get user-friendly type label for a customized side.
 * E.g., translates "Tekst," "Jersey," "Monogram," "Upload," or "Galerij."
 */
function swigger_bottle_get_type_label($customization, $side) {
    if (!empty($customization[$side . '_jersey_number']) || !empty($customization[$side . '_jersey_name'])) {
        $nr = !empty($customization[$side . '_jersey_number']) ? $customization[$side . '_jersey_number'] : '';
        $name = !empty($customization[$side . '_jersey_name']) ? $customization[$side . '_jersey_name'] : '';
        $val = implode(' - ', array_filter(array($nr, $name)));
        return __('Jersey', 'swigger-swigger-bottle-customizer') . ($val ? ' - ' . $val : '');
    }
    if (!empty($customization[$side . '_text'])) {
        return __('Tekst', 'swigger-swigger-bottle-customizer') . ' - ' . $customization[$side . '_text'];
    }
    if (!empty($customization[$side . '_monogram'])) {
        return __('Monogram', 'swigger-swigger-bottle-customizer') . ' - ' . $customization[$side . '_monogram'];
    }
    if (!empty($customization[$side . '_graphic'])) {
        $is_upload = (!empty($customization[$side . '_graphic_src']) && strpos($customization[$side . '_graphic_src'], 'upload') !== false);
        $name = basename($customization[$side . '_graphic']);
        if (!$is_upload && preg_match('/^user_design_/', $name)) {
            $is_upload = true;
        }
        
        $label = $is_upload ? __('Eigen Design', 'swigger-swigger-bottle-customizer') : __('Design', 'swigger-swigger-bottle-customizer');
        
        // Strip user_design_ prefix and extension for cleaner look
        $display_name = preg_replace('/^user_design_/', '', $name);
        $display_name = preg_replace('/\.[^.]+$/', '', $display_name);
        
        return $label . ($display_name ? ' - ' . $display_name : '');
    }
    return '';
}

/**
 * Helper to get a super compact summary of a side for the mini-cart (e.g. 'jd' or '"Talent without..."').
 */
function swigger_bottle_get_compact_side_summary($customization, $side) {
    if (!empty($customization[$side . '_jersey_number']) || !empty($customization[$side . '_jersey_name'])) {
        $nr = !empty($customization[$side . '_jersey_number']) ? $customization[$side . '_jersey_number'] : '';
        $name = !empty($customization[$side . '_jersey_name']) ? $customization[$side . '_jersey_name'] : '';
        return implode(' - ', array_filter(array($nr, $name)));
    }
    if (!empty($customization[$side . '_monogram'])) {
        return (string) $customization[$side . '_monogram'];
    }
    if (!empty($customization[$side . '_text'])) {
        $txt = (string) $customization[$side . '_text'];
        if (mb_strlen($txt) > 24) {
            $txt = mb_substr($txt, 0, 22) . '...';
        }
        return '"' . $txt . '"';
    }
    if (!empty($customization[$side . '_graphic'])) {
        $name = basename($customization[$side . '_graphic']);
        $name = preg_replace('/^user_design_/', '', $name);
        $name = preg_replace('/\.[^.]+$/', '', $name);
        if (mb_strlen($name) > 18) {
            $name = mb_substr($name, 0, 16) . '...';
        }
        return ucfirst($name);
    }
    return '';
}

/**
 * Display customization data in cart
 */
function swigger_bottle_cart_item_data($item_data, $cart_item = array()) {
    if (!is_array($cart_item) || !isset($cart_item['_bottle_customization'])) {
        return $item_data;
    }

    $customization = $cart_item['_bottle_customization'];
        
        // Override displayed variation color (e.g. "Kleur" / "Color") with configurator chosen color.
        $chosen_color_slug = !empty($customization['color']) ? (string) $customization['color'] : '';
        $color_attr_name = !empty($customization['color_attribute']) ? (string) $customization['color_attribute'] : '';
        $chosen_color_display = $chosen_color_slug ? swigger_bottle_format_color_display($chosen_color_slug, $color_attr_name) : '';

        if ($chosen_color_display) {
            $possible_keys = array();
            if ($color_attr_name && function_exists('wc_attribute_label')) {
                // Strip "pa_" for label lookup if needed.
                $possible_keys[] = wc_attribute_label(str_replace('pa_', '', $color_attr_name));
                $possible_keys[] = wc_attribute_label($color_attr_name);
            }
            // Fallback key names (multilingual-ish).
            $possible_keys[] = __('Color', 'swigger-swigger-bottle-customizer');
            $possible_keys[] = 'Color';
            $possible_keys[] = 'Kleur';

            $replaced = false;
            foreach ($item_data as &$row) {
                if (!is_array($row) || empty($row['key'])) {
                    continue;
                }
                $key = (string) $row['key'];
                $lkey = strtolower($key);
                $is_color_key = in_array($key, $possible_keys, true) || strpos($lkey, 'color') !== false || strpos($lkey, 'kleur') !== false;
                if ($is_color_key) {
                    $row['value'] = $chosen_color_display;
                    $replaced = true;
                    break;
                }
            }
            unset($row);

            // If we couldn't find an existing variation "color" row, add our own.
            if (!$replaced) {
                $item_data[] = array(
                    'key' => __('Color', 'swigger-swigger-bottle-customizer'),
                    'value' => $chosen_color_display,
                );
            }
        }
        
        // --- Personalized Options (1 Single Ultra-Compact Line) ---
        $has_front = swigger_bottle_side_has_customization($customization, 'front');
        $has_back  = swigger_bottle_side_has_customization($customization, 'back');
        $has_cw    = !empty($customization['custom_world_enabled']) && $customization['custom_world_enabled'] === 'yes';

        if ($has_front || $has_back || $has_cw) {
            if ($has_cw) {
                $item_data[] = array(
                    'key'   => '⚙️ Personalisatie',
                    'value' => 'Maatwerk Design (briefing ingevuld)',
                );
            } else {
                $parts = array();
                if ($has_front) {
                    $parts[] = swigger_bottle_get_compact_side_summary($customization, 'front');
                }
                if ($has_back) {
                    $parts[] = swigger_bottle_get_compact_side_summary($customization, 'back');
                }
                $parts = array_filter($parts);
                if (!empty($parts)) {
                    $item_data[] = array(
                        'key'   => '⚙️ Personalisatie',
                        'value' => implode(' / ', $parts),
                    );
                }
            }
        }

        // --- Cleanup Conflicting Metadata from other tools (e.g. Shaker tool) ---
        $forbidden_keywords = array('Gravure', 'Gekozen', 'Bottle Customization');
        foreach ($item_data as $index => $row) {
            if (empty($row['key'])) continue;
            foreach ($forbidden_keywords as $keyword) {
                if (stripos($row['key'], $keyword) !== false) {
                    unset($item_data[$index]);
                    break;
                }
            }
        }
        $item_data = array_values($item_data); // Re-index

    return $item_data;
}
add_filter('woocommerce_get_item_data', 'swigger_bottle_cart_item_data', 99, 2);

/**
 * Override displayed order item meta (e.g. variation attribute "Color"/"Kleur") with configurator chosen color.
 */
function swigger_bottle_override_order_item_meta($formatted_meta, $item = null) {
    if (!is_object($item) || !method_exists($item, 'get_meta')) {
        return $formatted_meta;
    }

    // Hide explicit befit_ keys from frontend & emails (they are for admin only)
    if (!is_admin() || defined('DOING_AJAX')) {
        foreach ($formatted_meta as $key => $meta) {
            if (isset($meta->key) && strpos($meta->key, 'befit_') === 0) {
                unset($formatted_meta[$key]);
            }
        }
    }

    $customization = $item->get_meta('_bottle_customization');
    if (!$customization || !is_array($customization) || empty($customization['color'])) {
        return $formatted_meta;
    }

    $color_attr_name = !empty($customization['color_attribute']) ? (string) $customization['color_attribute'] : '';
    $chosen_color_display = swigger_bottle_format_color_display((string) $customization['color'], $color_attr_name);

    $possible_keys = array('Color', 'Kleur');
    if ($color_attr_name && function_exists('wc_attribute_label')) {
        $possible_keys[] = wc_attribute_label(str_replace('pa_', '', $color_attr_name));
        $possible_keys[] = wc_attribute_label($color_attr_name);
    }

    foreach ($formatted_meta as $meta) {
        // $meta is usually an object with display_key/display_value
        if (!is_object($meta) || !isset($meta->display_key)) {
            continue;
        }
        $key = (string) $meta->display_key;
        $lkey = strtolower($key);
        $is_color_key = in_array($key, $possible_keys, true) || strpos($lkey, 'color') !== false || strpos($lkey, 'kleur') !== false;
        if ($is_color_key) {
            $meta->display_value = $chosen_color_display;
            break;
        }
    }

    return $formatted_meta;
}
add_filter('woocommerce_order_item_get_formatted_meta_data', 'swigger_bottle_override_order_item_meta', 10, 2);

/**
 * Display preview images in cart
 */
// Custom cart item thumbnail logic removed per user request to use default WooCommerce thumbnails.
// add_filter('woocommerce_cart_item_thumbnail', 'swigger_bottle_cart_item_thumbnail', 99, 3);
// Standard WooCommerce thumbnails are now used.

/**
 * Save customization data to order item meta
 */
function swigger_bottle_add_order_item_meta($item, $cart_item_key = '', $values = array(), $order = null) {
    if (!is_array($values) || !isset($values['_bottle_customization'])) {
        return;
    }
    if (!is_object($item) || !method_exists($item, 'add_meta_data')) {
        return;
    }
    
    $c = $values['_bottle_customization'];
    $item->add_meta_data('_bottle_customization', $c, true);
    
    if (!empty($c['custom_world_enabled']) && $c['custom_world_enabled'] === 'yes') {
        $item->add_meta_data('befit_personalization_type', 'maatwerk_design', true);
        $item->add_meta_data('befit_custom_world_enabled', 'yes', true);
        $item->add_meta_data('befit_custom_world_price', '30.00', true);
        if (!empty($c['custom_world_name'])) $item->add_meta_data('befit_custom_world_name_nickname', $c['custom_world_name'], true);
        if (!empty($c['custom_world_roots'])) $item->add_meta_data('befit_custom_world_roots_home', $c['custom_world_roots'], true);
        if (!empty($c['custom_world_hobbies'])) $item->add_meta_data('befit_custom_world_hobbies', $c['custom_world_hobbies'], true);
        if (!empty($c['custom_world_future'])) $item->add_meta_data('befit_custom_world_future', $c['custom_world_future'], true);
        if (!empty($c['custom_world_motto'])) $item->add_meta_data('befit_custom_world_motto', $c['custom_world_motto'], true);
        if (!empty($c['custom_world_style'])) $item->add_meta_data('befit_custom_world_style', $c['custom_world_style'], true);
        if (!empty($c['custom_world_do_dont'])) $item->add_meta_data('befit_custom_world_do_dont', $c['custom_world_do_dont'], true);
    }
}
add_action('woocommerce_checkout_create_order_line_item', 'swigger_bottle_add_order_item_meta', 10, 4);

/**
 * Display customization in order details (admin)
 */
function swigger_bottle_order_item_meta($item_id, $item, $order = null, $plain_text = false) {
    $customization = $item->get_meta('_bottle_customization');
    
    if ($customization) {
        $is_admin = is_admin() || current_user_can('manage_woocommerce');

        echo '<div class="bottle-customization-details" style="margin-top:10px; padding-top:10px; border-top:1px solid #eee;">';
        
        // Front
        if (swigger_bottle_side_has_customization($customization, 'front')) {
            $front_summary = swigger_bottle_build_side_summary($customization, 'front', false);
            echo '<p><strong>' . esc_html__('Voorzijde:', 'swigger-bottle-customizer') . '</strong> ' . esc_html($front_summary) . '</p>';
        }
        
        // Back
        if (swigger_bottle_side_has_customization($customization, 'back')) {
            $back_summary = swigger_bottle_build_side_summary($customization, 'back', false);
            echo '<p><strong>' . esc_html__('Achterzijde:', 'swigger-bottle-customizer') . '</strong> ' . esc_html($back_summary) . '</p>';
        }

        // Font used (Admin Only) — only show when text or monogram is actually present
        $has_text_content = !empty($customization['front_text']) || !empty($customization['back_text']) || !empty($customization['front_monogram']) || !empty($customization['back_monogram']);
        if ($is_admin && !empty($customization['font']) && $has_text_content) {
            echo '<p><strong>' . esc_html__('Lettertype:', 'swigger-bottle-customizer') . '</strong> ' . esc_html($customization['font']) . '</p>';
        }
        
        // Design downloads - Admin Only - Just 2 buttons: Voorkant Laserklaar + Achterkant Laserklaar
        $has_prod = !empty($customization['_frontProductionImage']) || !empty($customization['_backProductionImage']) || !empty($customization['_frontProductionSvg']) || !empty($customization['_backProductionSvg']) || !empty($customization['front_prod_url']) || !empty($customization['back_prod_url']);
        if ($is_admin && $has_prod) {
            echo '<p><strong>' . esc_html__('Designs (download voor productie):', 'swigger-bottle-customizer') . '</strong></p>';
            echo '<p style="display:flex;gap:12px;flex-wrap:wrap;">';
            
            $f_url = !empty($customization['front_prod_url']) ? $customization['front_prod_url'] : (!empty($customization['_frontProductionImage']) ? $customization['_frontProductionImage'] : (!empty($customization['_frontDesignImage']) ? $customization['_frontDesignImage'] : ''));
            $b_url = !empty($customization['back_prod_url']) ? $customization['back_prod_url'] : (!empty($customization['_backProductionImage']) ? $customization['_backProductionImage'] : (!empty($customization['_backDesignImage']) ? $customization['_backDesignImage'] : ''));

            if ($f_url) {
                echo '<a href="' . esc_url($f_url) . '" download target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:4px;padding:6px 12px;background:#2271b1;color:#fff;text-decoration:none;border-radius:4px;font-size:12px;font-weight:bold;">&#11015; ' . esc_html__('Voorkant (Laserklaar)', 'swigger-bottle-customizer') . '</a>';
            }
            if ($b_url) {
                echo '<a href="' . esc_url($b_url) . '" download target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:4px;padding:6px 12px;background:#2271b1;color:#fff;text-decoration:none;border-radius:4px;font-size:12px;font-weight:bold;">&#11015; ' . esc_html__('Achterkant (Laserklaar)', 'swigger-bottle-customizer') . '</a>';
            }
            echo '</p>';
        }
        
        // Custom World details
        if (!empty($customization['custom_world_enabled']) && $customization['custom_world_enabled'] === 'yes') {
            echo '<div style="margin-top:10px; padding:10px; background:#f9f9f9; border:1px solid #ddd; border-radius:4px;">';
            echo '<h4 style="margin-top:0;margin-bottom:8px;">' . esc_html__('Maatwerk Design (Customer World)', 'swigger-bottle-customizer') . '</h4>';
            
            $cw_fields = array(
                'custom_world_name' => 'Naam/Bijnaam',
                'custom_world_roots' => 'Roots/Thuis',
                'custom_world_hobbies' => 'Hobby\'s/Interesses',
                'custom_world_future' => 'Toekomst/Doelen',
                'custom_world_motto' => 'Levensmotto/Quote',
                'custom_world_style' => 'Stijl',
                'custom_world_do_dont' => 'Wel/Niet doen'
            );
            
            foreach ($cw_fields as $key => $label) {
                if (!empty($customization[$key])) {
                    echo '<p style="margin-bottom:4px;"><strong>' . esc_html($label) . ':</strong> ' . esc_html($customization[$key]) . '</p>';
                }
            }
            echo '</div>';
        }

        echo '</div>';
    }
}
// Admin order detail views.
add_action('woocommerce_after_order_itemmeta', 'swigger_bottle_order_item_meta', 10, 3);


/**
 * Ensure each customized item is treated as unique in cart
 */
function swigger_bottle_add_cart_item_data($cart_item_data, $product_id = 0, $variation_id = 0) {
    if (isset($cart_item_data['_bottle_customization'])) {
        $cart_item_data['unique_key'] = md5(microtime() . rand());
    }
    return $cart_item_data;
}
add_filter('woocommerce_add_cart_item_data', 'swigger_bottle_add_cart_item_data', 10, 3);

/**
 * Clean up old temporary media files (scheduled task)
 */
function swigger_bottle_cleanup_temp_images() {
    $upload_dir = wp_upload_dir();
    $temp_dir = $upload_dir['basedir'] . '/swigger-bottle-customizer-temp/';
    
    if (!file_exists($temp_dir)) {
        return;
    }
    
    $files = array_merge(
        glob($temp_dir . '*.png') ?: array(),
        glob($temp_dir . '*.jpg') ?: array(),
        glob($temp_dir . '*.webp') ?: array(),
        glob($temp_dir . '*.pdf') ?: array()
    );
    $now = time();
    
    foreach ($files as $file) {
        // Delete files older than 24 hours
        if ($now - filemtime($file) > 86400) {
            unlink($file);
        }
    }
}

/**
 * Schedule cleanup task on plugin activation
 */
function swigger_bottle_activate() {
    if (!wp_next_scheduled('swigger_bottle_cleanup_hook')) {
        wp_schedule_event(time(), 'daily', 'swigger_bottle_cleanup_hook');
    }
}
register_activation_hook(__FILE__, 'swigger_bottle_activate');

/**
 * Clear scheduled task on plugin deactivation
 */
function swigger_bottle_deactivate() {
    wp_clear_scheduled_hook('swigger_bottle_cleanup_hook');
}
register_deactivation_hook(__FILE__, 'swigger_bottle_deactivate');

add_action('swigger_bottle_cleanup_hook', 'swigger_bottle_cleanup_temp_images');

/**
 * Helper: Get preferred custom image URL (Prioritize Back > Front)
 */
function swigger_bottle_get_custom_image_url($customization) {
    if (!empty($customization['back_image_url'])) {
        return $customization['back_image_url'];
    }
    if (!empty($customization['front_image_url'])) {
        return $customization['front_image_url'];
    }
    return false;
}

// Removed redundant thumbnail filter.

/**
 * Filter: Restore original product image in order/checkout/emails.
 * Returning the default product image ensures it never expires.
 */
function swigger_bottle_order_thumbnail($product_image, $item = null, $visible = true) {
    return $product_image;
}
add_filter('woocommerce_order_item_thumbnail', 'swigger_bottle_order_thumbnail', 10, 3);

/**
 * Render expected delivery note per-item in the mini-cart (drawer) for customized items.
 * Hooked to run after each cart item in the mini-cart widget.
 */
function swigger_bottle_mini_cart_item_delivery_note($cart_item = array(), $cart_item_key = '') {
    // Only show for customized items.
    if (empty($cart_item['_bottle_customization'])) {
        return;
    }
    ?>
    <div class="bc-mini-cart-note-row">
        <div class="bc-mini-cart-note">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="bc-note-icon"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <div class="bc-note-text">
                <strong><?php esc_html_e('Expected delivery:', 'swigger-swigger-bottle-customizer'); ?></strong>
                <?php esc_html_e('Allow 7 business days for personalization and 2–3 days for delivery. Delivery date cannot be guaranteed. All purchases are final.', 'swigger-swigger-bottle-customizer'); ?>
            </div>
        </div>
    </div>
    <?php
}
add_action('woocommerce_widget_shopping_cart_after_cart_item', 'swigger_bottle_mini_cart_item_delivery_note', 20, 2);

/**
 * Remove default add to cart button link for target products.
 */
function swigger_bottle_remove_loop_add_to_cart_link($html, $product, $args) {
    if (swigger_bottle_is_woocommerce_active() && swigger_bottle_is_enabled() && swigger_bottle_is_target_product($product)) {
        return '';
    }
    return $html;
}
add_filter('woocommerce_loop_add_to_cart_link', 'swigger_bottle_remove_loop_add_to_cart_link', 99, 3);

/**
 * Output Yeti-style "Voeg toe" and "+ Ontwerp" buttons on the shop loop directly.
 */
function swigger_bottle_after_shop_loop_item() {
    global $product;
    if (!swigger_bottle_is_woocommerce_active() || !swigger_bottle_is_enabled() || !$product || !swigger_bottle_is_target_product($product)) {
        return;
    }

    $product_url = $product->get_permalink();
    $product_id = $product->get_id();
    
    // Check stock status
    $is_out_of_stock = !$product->is_in_stock() || $product->get_stock_status() === 'outofstock';

    // Add to cart link (either add to cart ajax for simple, or select options for variable)
    $href = $product->add_to_cart_url();
    $ajax_class = $product->supports('ajax_add_to_cart') && $product->is_purchasable() && !$is_out_of_stock && !$product->is_type('variable') ? 'ajax_add_to_cart add_to_cart_button' : 'add_to_cart_button';

    // Suitcase / Bag icon
    $bag_icon = '<i class="fa fa-bag"></i>';

    $current_url = strtolower($_SERVER['REQUEST_URI']);
    $hide_add_btn = strpos($current_url, '/collecties/drinkflessen-bedrukken') !== false ||
                    strpos($current_url, '/collecties/thermosflessen-bedrukken') !== false ||
                    strpos($current_url, '/collecties/bidons-bedrukken') !== false ||
                    strpos($current_url, '/shakebekers-bedrukken') !== false;

    // 1. "Kies variatie" (generic variable product) or "Toevoegen" (specific variation / simple product)
    $btn1 = '';
    if (!$hide_add_btn) {
        $add_disabled_class = $is_out_of_stock ? ' swigger-yeti-disabled' : '';
        $add_disabled_style = $is_out_of_stock ? 'pointer-events: none; opacity: 0.4; cursor: not-allowed;' : '';
        if ($product->is_type('variable')) {
            $btn1 = '<a href="' . esc_url($product_url) . '" data-product_id="' . esc_attr($product_id) . '" class="button swigger-yeti-add-to-bag swigger-yeti-select-options' . $add_disabled_class . '" style="' . $add_disabled_style . '" rel="nofollow">' . $bag_icon . '<span class="swigger-yeti-add-to-bag-text">' . esc_html__('Kies variatie', 'swigger-bottle-customizer') . '</span></a>';
        } else {
            $btn1 = '<a href="' . esc_url($href) . '" data-product_id="' . esc_attr($product_id) . '" class="button add_to_cart_button swigger-yeti-add-to-bag ' . esc_attr($ajax_class) . $add_disabled_class . '" style="' . $add_disabled_style . '" rel="nofollow">' . $bag_icon . '<span class="swigger-yeti-add-to-bag-text">' . esc_html__('Toevoegen', 'swigger-bottle-customizer') . '</span></a>';
        }
    }

    // 2. "+ Ontwerp" (Free Custom) button
    $attributes_json = '';
    $is_disabled = $is_out_of_stock;
    if ($product->is_type('variation')) {
        $attrs = $product->get_variation_attributes();
        $attributes_json = json_encode($attrs);
        foreach($attrs as $key => $val) {
            if (strpos(strtolower($val), '710') !== false) {
                $is_disabled = true;
                break;
            }
        }
    }
    
    $disabled_class = $is_disabled ? ' swigger-yeti-disabled' : '';
    $disabled_style = $is_disabled ? 'pointer-events: none; cursor: not-allowed;' : '';
    $customize_text = $is_disabled ? esc_html__('Nu niet beschikbaar', 'swigger-bottle-customizer') : esc_html__('+ Ontwerp', 'swigger-bottle-customizer');
    
    $btn2 = '<a href="#" data-product-id="' . esc_attr($product_id) . '" data-attributes="' . esc_attr($attributes_json) . '" class="button swigger-yeti-customize' . $disabled_class . '" style="' . $disabled_style . '">' . $customize_text . '</a>';

    echo '<div class="swigger-yeti-loop-buttons">' . $btn1 . $btn2 . '</div>';
}
add_action('woocommerce_after_shop_loop_item', 'swigger_bottle_after_shop_loop_item', 15);

/**
 * Shortcode to render the personalize button anywhere
 * Usage: [swigger_personalize]
 */
function swigger_bottle_shortcode_personalize() {
    if (!swigger_bottle_is_woocommerce_active() || !swigger_bottle_is_enabled()) {
        return '';
    }

    $target_product_id = swigger_bottle_get_target_product_id();
    if (!$target_product_id) {
        $fallback_post = get_page_by_path(swigger_bottle_PRODUCT_SLUG, OBJECT, 'product');
        if ($fallback_post) {
            $target_product_id = $fallback_post->ID;
        }
    }

    if (!$target_product_id) return '';

    $configurator_url = swigger_bottle_PLUGIN_URL . 'configurator/index.html';
    $ajax_url = admin_url('admin-ajax.php');
    $nonce = wp_create_nonce('swigger_bottle_nonce');
    
    $product = wc_get_product($target_product_id);
    if (!$product) return '';

    echo '<div class="swigger-customizer-wrapper">
        <div id="swigger-bottle-customizer-btn"
            class="swigger-customizer-box"
            data-configurator-url="' . esc_url($configurator_url) . '"
            data-ajax-url="' . esc_url($ajax_url) . '"
            data-nonce="' . esc_attr($nonce) . '"
            data-product-id="' . esc_attr($product->get_id()) . '">
            <span class="swigger-customizer-title">' . esc_html__('Personaliseer', 'swigger-bottle-customizer') . '</span>
            <span class="swigger-customizer-icon">
                <svg width="18" height="39" viewBox="0 0 18 39" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;">
                    <path d="M2.28516 0.285645V15.3297H15.3668V0.285645" stroke="#000"/>
                    <path d="M5.55859 15.0432V21.961L8.82901 23.0667L12.0994 21.961V15.0432" stroke="#000"/>
                    <path d="M8.82632 23.0667V33.096" stroke="#D90000" stroke-linecap="round"/>
                    <path d="M8.82794 36.1047V37.1077" stroke="#D90000" stroke-linecap="round"/>
                    <path d="M11.0078 34.0989L15.3684 30.0872" stroke="#D90000" stroke-linecap="round"/>
                    <path d="M11.0156 37.457H16.3512" stroke="#d90000" stroke-linecap="round"/>
                    <path d="M1.08984 37.457H6.42543" stroke="#d90000" stroke-linecap="round"/>
                    <path d="M6.64844 34.0989L2.28788 30.0872" stroke="#d90000" stroke-linecap="round"/>
                </svg>
            </span>
        </div>
    </div>';
}
add_shortcode('swigger_personalize', 'swigger_bottle_shortcode_personalize');
