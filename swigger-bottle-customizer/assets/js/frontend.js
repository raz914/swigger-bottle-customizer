/**
 * Be Fit Bottle Customizer Frontend JavaScript
 */
(function () {
    'use strict';

    function $(selector, root) {
        return (root || document).querySelector(selector);
    }

    function getConfig(buttonEl) {
        var data = window.swiggerBottleData || {};
        var ds = (buttonEl && buttonEl.dataset) ? buttonEl.dataset : {};

        return {
            ajaxUrl: data.ajaxUrl || ds.ajaxUrl || '',
            nonce: data.nonce || ds.nonce || '',
            configuratorUrl: data.configuratorUrl || ds.configuratorUrl || '',
            productId: data.productId || '4141'
        };
    }

    function showNotification(message, type) {
        var existing = document.querySelectorAll('.swigger-bottle-customizer-notification');
        existing.forEach(function (el) { el.remove(); });

        var n = document.createElement('div');
        n.className = 'swigger-bottle-customizer-notification ' + (type || 'info');
        n.textContent = message;

        n.style.position = 'fixed';
        n.style.top = '20px';
        n.style.right = '20px';
        n.style.padding = '15px 25px';
        n.style.borderRadius = '8px';
        n.style.fontWeight = '600';
        n.style.zIndex = '1000000';
        n.style.animation = 'slideIn 0.3s ease';
        n.style.background = (type === 'success') ? '#4CAF50' : '#f44336';
        n.style.color = '#ffffff';
        n.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';

        document.body.appendChild(n);

        setTimeout(function () {
            n.style.opacity = '0';
            n.style.transition = 'opacity 300ms ease';
            setTimeout(function () { n.remove(); }, 350);
        }, 3000);
    }

    function updateCartCount(count, skipRefresh) {
        var selectors = ['.cart-contents-count', '.cart-count', '.wc-cart-count', '.mini-cart-count'];
        selectors.forEach(function (sel) {
            var el = document.querySelector(sel);
            if (el) {
                el.textContent = String(count);
            }
        });

        // WooCommerce fragment refresh if available (skip if we want to stay on page without reload side-effects)
        if (!skipRefresh) {
            try {
                var evt = document.createEvent('Event');
                evt.initEvent('wc_fragment_refresh', true, true);
                document.body.dispatchEvent(evt);
            } catch (e) {
                // ignore
            }
        }
    }

    // FunnelKit thumbnail helper functions removed per user request.


    function init() {
        var button = $('#swigger-bottle-customizer-btn');
        // Do NOT return if button is missing, because we need to run collection page logic

        var modal = $('#swigger-bottle-customizer-modal');
        var iframe = $('#swigger-bottle-customizer-iframe');
        if (modal && modal.parentElement !== document.body) {
            document.body.appendChild(modal);
        }
        var closeBtn = modal ? $('.swigger-bottle-customizer-close', modal) : null;
        var config = getConfig(button);

        if (!modal || !iframe) {
            console.warn('[BottleCustomizer] Missing modal/iframe markup.');
            return;
        }

        var savedScrollTop = 0;
        var wasAddedDuringSession = false;
        var variationManifestPromise = null;

        function compactVariations(variations) {
            return (variations || []).map(function (v) {
                return {
                    variation_id: v.variation_id || 0,
                    attributes: v.attributes || {},
                    is_in_stock: !!v.is_in_stock,
                    is_purchasable: !!v.is_purchasable,
                    backorders_allowed: v.backorders_allowed !== 'no' && v.backorders_allowed !== false,
                    availability_html: v.availability_html || ''
                };
            });
        }

        function fetchCompactManifestViaAjax(cfg) {
            if (!cfg || !cfg.ajaxUrl || !cfg.nonce) {
                return Promise.resolve([]);
            }

            var formData = new FormData();
            formData.append('action', 'swigger_bottle_get_variation_stock_manifest');
            formData.append('nonce', cfg.nonce);

            return fetch(cfg.ajaxUrl, {
                method: 'POST',
                body: formData
            })
            .then(function (res) { return res.json(); })
            .then(function (json) {
                if (json && json.success && Array.isArray(json.data)) {
                    return json.data;
                }
                return [];
            })
            .catch(function (err) {
                console.warn('[BottleCustomizer] Failed to load variation manifest via AJAX:', err);
                return [];
            });
        }

        function getVariationManifest(cfg) {
            if (!variationManifestPromise) {
                var form = document.querySelector('.variations_form');
                if (form && window.jQuery) {
                    var variations = window.jQuery(form).data('product_variations');
                    if (Array.isArray(variations) && variations.length) {
                        variationManifestPromise = Promise.resolve(compactVariations(variations));
                        return variationManifestPromise;
                    }
                }
                variationManifestPromise = fetchCompactManifestViaAjax(cfg);
            }
            return variationManifestPromise;
        }

        function getSelectedVariationData() {
            var form = $('.variations_form');
            if (!form) return null;

            var vIdInput = $('input[name="variation_id"]', form);
            var variationId = vIdInput ? vIdInput.value : '';

            // Get all variation attributes (e.g. attribute_pa_kleur, attribute_pa_formaat)
            var attributes = {};
            form.querySelectorAll('select[name^="attribute_"]').forEach(function (sel) {
                if (sel.name && sel.value) {
                    attributes[sel.name] = sel.value;
                }
            });

            return {
                variationId: variationId,
                attributes: attributes
            };
        }

        function openModal(triggerBtn) {
            if (!config.configuratorUrl) {
                showNotification('Customizer URL missing. Please contact support.', 'error');
                return;
            }

            // Reset session flag
            wasAddedDuringSession = false;

            // Detect current selection to pass to iframe
            var selection = getSelectedVariationData() || { variationId: '', attributes: {} };

            if (triggerBtn && triggerBtn.hasAttribute('data-attributes')) {
                try {
                    var attrs = JSON.parse(triggerBtn.getAttribute('data-attributes'));
                    if (attrs) {
                        selection.attributes = Object.assign(selection.attributes, attrs);
                        var pid = triggerBtn.getAttribute('data-product-id');
                        if (pid) {
                            selection.variationId = pid;
                        }
                    }
                } catch (e) { }
            }

            window._swiggerCurrentSelection = selection; // Store for add-to-cart AJAX later

            var url = new URL(config.configuratorUrl);
            if (selection && selection.attributes) {
                Object.keys(selection.attributes).forEach(function (key) {
                    url.searchParams.set(key, selection.attributes[key]);
                });
            }

            // Save current scroll position
            savedScrollTop = window.scrollY || document.documentElement.scrollTop;

            document.body.classList.add('swigger-bottle-customizer-open');

            // Standard overflow hidden
            document.body.style.overflow = 'hidden';
            document.documentElement.style.overflow = 'hidden';

            // Mobile scroll lock: fix body position
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
            document.body.style.top = '-' + savedScrollTop + 'px';

            modal.classList.add('active', 'loading');
            iframe.src = url.toString();
        }

        function closeModal() {
            // Restore styles
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
            document.body.style.top = '';

            document.body.classList.remove('swigger-bottle-customizer-open');
            modal.classList.remove('active', 'loading');
            iframe.src = '';

            // Restore scroll position
            window.scrollTo(0, savedScrollTop);

            // If we added anything during this session, make sure the cart UI is 100% up to date
            if (wasAddedDuringSession) {
                updateCartCount(null, false); // Trigger full refresh
            }
        }
        // Bind clicks for all customizer buttons globally
        document.addEventListener('click', function (e) {
            var targetBtn = e.target.closest('.swigger-yeti-customize, #swigger-bottle-customizer-btn, .swigger-bottle-customizer-btn-class');
            if (targetBtn) {
                if (targetBtn.classList.contains('swigger-yeti-disabled') || targetBtn.hasAttribute('disabled')) {
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                }
                e.preventDefault();
                if (modal && iframe) {
                    var productId = targetBtn.getAttribute('data-product-id') || '4141';
                    if (productId) {
                        if (window.swiggerBottleData) {
                            window.swiggerBottleData.productId = productId;
                        }
                        window._swiggerCurrentSelection = window._swiggerCurrentSelection || {};
                    }
                    openModal(targetBtn);
                }
            }
        });

        if (closeBtn) {
            closeBtn.addEventListener('click', function (e) {
                e.preventDefault();
                closeModal();
            });
        }

        document.addEventListener('keyup', function (e) {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                closeModal();
            }
        });

        modal.addEventListener('click', function (e) {
            if (e.target === modal) {
                closeModal();
            }
        });

        iframe.addEventListener('load', function () {
            modal.classList.remove('loading');
            // Send variations data to the iframe for stock status display
            sendVariationsToIframe();
        });

        // Safety fallback: if iframe takes too long or event was missed
        setTimeout(function () {
            if (modal && modal.classList.contains('loading')) {
                modal.classList.remove('loading');
            }
        }, 3500);

        // Helper: send current variation stock data to the iframe
        function sendVariationsToIframe() {
            if (!iframe || !iframe.contentWindow) {
                return;
            }

            getVariationManifest(config).then(function (variations) {
                if (iframe && iframe.contentWindow && Array.isArray(variations) && variations.length) {
                    iframe.contentWindow.postMessage({
                        type: 'BEFIT_SWIGGER_V2_VARIATIONS',
                        variations: variations
                    }, '*');
                }
            });
        }

        // Helper to send status back to iframe
        function postStatusToIframe(status, message) {
            if (iframe && iframe.contentWindow) {
                iframe.contentWindow.postMessage({
                    type: 'BEFIT_SWIGGER_V2_ADD_TO_CART_STATUS',
                    status: status,
                    message: message || ''
                }, '*');
            }
        }

        window.addEventListener('message', function (event) {
            var payload = event.data;
            if (!payload || !payload.type) return;

            if (payload.type === 'BEFIT_SWIGGER_V2_READY') {
                modal.classList.remove('loading');
                // Re-send variations on READY — guarantees stock state is correct
                // even if the iframe load event fired before variations data was available
                sendVariationsToIframe();
                return;
            }
            if (payload.type === 'BEFIT_SWIGGER_V2_CLOSE') {
                closeModal();
                return;
            }
            if (payload.type !== 'BEFIT_SWIGGER_V2_ADD_TO_CART') return;

            if (!config.ajaxUrl || !config.nonce || !config.productId) {
                postStatusToIframe('error', 'Cart config missing. Please contact support.');
                showNotification('Cart config missing. Please contact support.', 'error');
                return;
            }

            // Notify iframe (not needed if iframe sent the message, but kept for logic)
            if (!payload.continueEditing) {
                // modal.classList.add('loading'); // REMOVED to prevent full white screen conflict
            }
            postStatusToIframe('loading');

            var fd = new FormData();
            fd.append('action', 'swigger_bottle_add_to_cart');
            fd.append('nonce', config.nonce);
            fd.append('product_id', config.productId || '4141');

            fd.append('customization', JSON.stringify(payload.data || {}));
            if (payload.quantity) {
                fd.append('quantity', String(payload.quantity));
            }

            fetch(config.ajaxUrl, {
                method: 'POST',
                credentials: 'same-origin',
                body: fd
            })
                .then(function (r) { return r.json(); })
                .then(function (response) {
                    console.log('[BottleCustomizer] add_to_cart response', response);
                    if (response && response.success) {
                        postStatusToIframe('success');
                        modal.classList.remove('loading');
                        wasAddedDuringSession = true;

                        if (response.data && response.data.cart_count != null) {
                            updateCartCount(response.data.cart_count, payload.continueEditing);
                        }

                        // Only close modal if not continuing to next design
                        if (!payload.continueEditing) {
                            setTimeout(function () {
                                closeModal();
                            }, 1500);
                        } else {
                            // If continueEditing is true, just stop the loading state on modal
                            setTimeout(function () {
                                modal.classList.remove('loading');
                            }, 1500);
                        }
                    } else {
                        var msg = (response && response.data && response.data.message) ? response.data.message : 'Error adding to cart';
                        postStatusToIframe('error', msg);
                        showNotification(msg, 'error');
                        modal.classList.remove('loading');
                    }
                })

                .catch(function () {
                    var msg = 'Error adding to cart. Please try again.';
                    postStatusToIframe('error', msg);
                    showNotification(msg, 'error');
                    modal.classList.remove('loading');
                });
        });
        // ------------------------------------------------
        // Fallback injection for Uncode / WPBakery Grids
        // These grids often strip out standard WooCommerce hooks like woocommerce_after_shop_loop_item
        // ------------------------------------------------
        function injectUncodeGridButtons() {
            var blocks = document.querySelectorAll('.tmb-woocommerce');
            blocks.forEach(function(block) {
                // Prevent duplicate injection
                if (block.querySelector('.swigger-yeti-loop-buttons')) return;

                var linkEl = block.querySelector('.t-entry-title a');
                if (!linkEl) return;

                var href = linkEl.getAttribute('href');
                if (!href || href.indexOf('/product/swigger') === -1) return;

                // ALWAYS use the global target product ID for the cart payload.
                // tmb-id-X is often the PAGE post ID, not the Product ID. Using it causes "Product not found".
                var productId = '4141';

                var attrs = {};
                var hasAttrs = false;
                var isDisabled = false;
                try {
                    var urlObj = new URL(href, window.location.origin);
                    urlObj.searchParams.forEach(function(val, key) {
                        if (key.indexOf('attribute_') === 0) {
                            attrs[key] = val;
                            hasAttrs = true;
                            if (val.toLowerCase() === '710ml' || val.toLowerCase() === '710-ml') {
                                isDisabled = true;
                            }
                        }
                    });
                } catch(e) {}

                // Check for Out-Of-Stock status in the product card / tile
                var isOutOfStock = false;
                if (block.classList.contains('outofstock') || 
                    block.classList.contains('out-of-stock') || 
                    block.classList.contains('sold-out') ||
                    block.classList.contains('tmb-soldout') ||
                    block.querySelector('.outofstock, .out-of-stock, .sold-out, .badge-out-of-stock, .out-of-stock-badge, .is-out-of-stock, .tmb-soldout, .t-entry-soldout')) {
                    isOutOfStock = true;
                }
                var blockText = (block.innerText || '').toLowerCase();
                if (blockText.indexOf('uitverkocht') !== -1 || blockText.indexOf('out of stock') !== -1 || blockText.indexOf('niet op voorraad') !== -1 || blockText.indexOf('sold out') !== -1) {
                    isOutOfStock = true;
                }

                if (isOutOfStock) {
                    isDisabled = true;
                }

                var attrsJson = hasAttrs ? JSON.stringify(attrs) : '';
                var disabledClass = isDisabled ? ' swigger-yeti-disabled' : '';
                var disabledStyle = isDisabled ? 'pointer-events: none; cursor: not-allowed;' : '';

                var currentPath = window.location.pathname.toLowerCase();
                var hideAddBtn = currentPath.indexOf('/collecties/drinkflessen-bedrukken') > -1 ||
                                 currentPath.indexOf('/collecties/thermosflessen-bedrukken') > -1 ||
                                 currentPath.indexOf('/collecties/bidons-bedrukken') > -1 ||
                                 currentPath.indexOf('/shakebekers-bedrukken') > -1;

                var buttonsHtml = '<div class="swigger-yeti-loop-buttons">';
                if (!hideAddBtn) {
                    var addDisabledClass = isOutOfStock ? ' swigger-yeti-disabled' : '';
                    var addDisabledStyle = isOutOfStock ? 'pointer-events: none; opacity: 0.4; cursor: not-allowed;' : '';
                    if (hasAttrs) {
                        buttonsHtml += '<a href="' + href + '" data-product_id="' + productId + '" class="button swigger-yeti-add-to-bag' + addDisabledClass + '" style="' + addDisabledStyle + '" rel="nofollow">' +
                        '<i class="fa fa-bag"></i>' +
                        '<span class="swigger-yeti-add-to-bag-text">Toevoegen</span></a>';
                    } else {
                        buttonsHtml += '<a href="' + href + '" data-product_id="' + productId + '" class="button swigger-yeti-add-to-bag swigger-yeti-select-options' + addDisabledClass + '" style="' + addDisabledStyle + '" rel="nofollow">' +
                        '<i class="fa fa-bag"></i>' +
                        '<span class="swigger-yeti-add-to-bag-text">Kies variatie</span></a>';
                    }
                }
                var customizeText = isDisabled ? 'Nu niet beschikbaar' : '+ Ontwerp';
                buttonsHtml += '<a href="#" data-product-id="' + productId + '" ' + (hasAttrs ? "data-attributes='" + attrsJson.replace(/'/g, "&#39;") + "'" : "") + ' class="button swigger-yeti-customize' + disabledClass + '" style="' + disabledStyle + '">' + customizeText + '</a>' +
                    '</div>';

                var entryDiv = block.querySelector('.t-entry');
                if (entryDiv) {
                    var temp = document.createElement('div');
                    temp.innerHTML = buttonsHtml;
                    var btns = temp.firstChild;
                    
                    var spacer = entryDiv.querySelector('.spacer');
                    if (spacer) {
                        entryDiv.insertBefore(btns, spacer);
                    } else {
                        entryDiv.appendChild(btns);
                    }
                }
            });
        }
        
        // Inject buttons on load, resize, and scroll (Uncode grids sometimes load lazy)
        injectUncodeGridButtons();
        window.addEventListener('scroll', injectUncodeGridButtons, { passive: true });
        window.addEventListener('resize', injectUncodeGridButtons, { passive: true });

        // Add visual feedback hooks for native WooCommerce AJAX add to cart
        if (typeof jQuery !== 'undefined') {
            jQuery(document).ajaxComplete(function() {
                setTimeout(injectUncodeGridButtons, 150);
            });
            
            jQuery(document.body).on('adding_to_cart', function(e, button) {
                if (button && button.hasClass('swigger-yeti-add-to-bag') && !button.hasClass('swigger-yeti-select-options')) {
                    var textEl = button.find('.swigger-yeti-add-to-bag-text');
                    if (textEl.length) {
                        textEl.data('original-text', textEl.text());
                        textEl.text('Bezig...');
                        button.find('i.fa-bag').removeClass('fa-bag').addClass('fa-spinner fa-spin swigger-loading-icon');
                    }
                }
            });
            jQuery(document.body).on('added_to_cart', function(e, fragments, cart_hash, button) {
                if (button && button.hasClass('swigger-yeti-add-to-bag') && !button.hasClass('swigger-yeti-select-options')) {
                    var textEl = button.find('.swigger-yeti-add-to-bag-text');
                    if (textEl.length) {
                        textEl.text(textEl.data('original-text'));
                        button.find('i.swigger-loading-icon').removeClass('fa-spinner fa-spin swigger-loading-icon').addClass('fa-bag');
                    }
                }
            });
        }
        
        var addToCartQueue = Promise.resolve();

        // Intercept native Toevoegen button to prevent WooCommerce redirecting for variable products
        document.addEventListener('click', function(e) {
            var addToBagBtn = e.target.closest('.swigger-yeti-add-to-bag');
            if (addToBagBtn) {
                if (addToBagBtn.classList.contains('swigger-yeti-select-options')) {
                    return; // Allow standard link navigation to product options page
                }

                if (addToBagBtn.classList.contains('swigger-yeti-disabled') || addToBagBtn.hasAttribute('disabled')) {
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                }
                e.preventDefault();
                
                // Set button to loading state manually
                var textEl = addToBagBtn.querySelector('.swigger-yeti-add-to-bag-text');
                var iconEl = addToBagBtn.querySelector('i.fa');
                var originalText = textEl ? textEl.innerText : 'Toevoegen';
                
                if (textEl) textEl.innerText = 'Bezig...';
                if (iconEl) {
                    iconEl.className = 'fa fa-spinner fa-spin swigger-loading-icon';
                }

                var productId = '4141';
                var customizeBtn = addToBagBtn.nextElementSibling;
                var attrsJson = customizeBtn ? customizeBtn.getAttribute('data-attributes') : null;
                
                var fd = new FormData();
                fd.append('action', 'swigger_bottle_add_to_cart');
                if (window.swiggerBottleData && window.swiggerBottleData.nonce) {
                    fd.append('nonce', window.swiggerBottleData.nonce);
                }
                fd.append('product_id', productId);
                
                if (attrsJson) {
                    try {
                        var parsedAttrs = JSON.parse(attrsJson);
                        fd.append('variation_attributes', attrsJson);
                        // Convert to customization payload for the backend to use for color/size matching
                        var cust = {
                            color: parsedAttrs['attribute_pa_kleur'] || parsedAttrs['pa_kleur'] || '',
                            size: parsedAttrs['attribute_pa_formaat'] || parsedAttrs['pa_formaat'] || ''
                        };
                        fd.append('customization', JSON.stringify(cust));
                    } catch(e) {}
                } else {
                    fd.append('customization', JSON.stringify({}));
                }

                var ajaxUrl = window.swiggerBottleData ? window.swiggerBottleData.ajaxUrl : '/wp-admin/admin-ajax.php';
                
                addToCartQueue = addToCartQueue.then(function() {
                    return fetch(ajaxUrl, {
                        method: 'POST',
                        credentials: 'same-origin',
                        body: fd
                    })
                    .then(function(r) { return r.json(); });
                })
                .then(function(res) {
                    if (res && res.success) {
                        if (typeof updateCartCount === 'function' && res.data && res.data.cart_count != null) {
                            updateCartCount(res.data.cart_count, false);
                        }
                        if (textEl) textEl.innerText = 'Gelukt!';
                        if (iconEl) iconEl.className = 'fa fa-check swigger-loading-icon';
                        
                        setTimeout(function() {
                            if (textEl) textEl.innerText = originalText;
                            if (iconEl) iconEl.className = 'fa fa-bag';
                        }, 2000);
                        
                        // Trigger native WooCommerce fragment refresh
                        if (typeof jQuery !== 'undefined') {
                            jQuery(document.body).trigger('wc_fragment_refresh');
                        }
                    } else {
                        if (textEl) textEl.innerText = 'Fout!';
                        if (iconEl) iconEl.className = 'fa fa-times swigger-loading-icon';
                        setTimeout(function() {
                            if (textEl) textEl.innerText = originalText;
                            if (iconEl) iconEl.className = 'fa fa-bag';
                        }, 2000);
                        if (typeof showNotification === 'function') {
                            showNotification(res.data && res.data.message ? res.data.message : 'Fout bij toevoegen.', 'error');
                        }
                    }
                })
                .catch(function() {
                    if (textEl) textEl.innerText = 'Fout!';
                    if (iconEl) iconEl.className = 'fa fa-times swigger-loading-icon';
                    setTimeout(function() {
                        if (textEl) textEl.innerText = originalText;
                        if (iconEl) iconEl.className = 'fa fa-bag';
                    }, 2000);
                });
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            init();
        });
    } else {
        init();
    }

})();
