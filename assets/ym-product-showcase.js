/**
 * Yard Microwaves – Product Showcase interactivity
 * - Thumbnail → hero swap (existing .ym-showcase__thumb pattern)
 * - Color thumb (card) → active state + optional hero swap (#43)
 * - Swatch + size highlighting + variant/price update
 * - AJAX Add to Cart → fires cart:update so the cart drawer auto-opens (#43, #45)
 */
(function () {
  document.querySelectorAll('[data-showcase-mockups]').forEach(function (panel) {
    var hero = panel.querySelector('[data-showcase-hero]');

    // Inline thumbnail strip (data-full-src on each thumb)
    if (hero) {
      panel.querySelectorAll('.ym-showcase__thumb').forEach(function (thumb) {
        thumb.addEventListener('click', function () {
          var fullSrc = thumb.getAttribute('data-full-src');
          if (!fullSrc) return;
          hero.setAttribute('src', fullSrc);
          if (hero.hasAttribute('srcset')) hero.removeAttribute('srcset');
          panel.querySelectorAll('.ym-showcase__thumb').forEach(function (t) {
            t.classList.remove('is-active');
          });
          thumb.classList.add('is-active');
        });
      });
    }

    // Color card thumbs (#43) — bone vs briquette etc. Active state always;
    // hero image swap if the thumb carries a data-hero-src attribute.
    var cardThumbs = panel.querySelectorAll('.ym-showcase__card-thumb');
    if (cardThumbs.length) {
      // Mark the first as active by default
      cardThumbs[0].classList.add('is-active');
      cardThumbs.forEach(function (thumb) {
        thumb.addEventListener('click', function () {
          cardThumbs.forEach(function (t) { t.classList.remove('is-active'); });
          thumb.classList.add('is-active');
          var heroSrc = thumb.getAttribute('data-hero-src');
          if (heroSrc && hero) {
            hero.setAttribute('src', heroSrc);
            if (hero.hasAttribute('srcset')) hero.removeAttribute('srcset');
          }
        });
      });
    }
  });

  // Swatch click handling
  document.querySelectorAll('[data-showcase-swatches]').forEach(function (container) {
    container.querySelectorAll('.ym-showcase__swatch').forEach(function (swatch) {
      swatch.addEventListener('click', function () {
        container.querySelectorAll('.ym-showcase__swatch').forEach(function (s) {
          s.classList.remove('is-active');
        });
        swatch.classList.add('is-active');
      });
    });
  });

  // Size click handling — moves the X marker, updates variant + price
  document.querySelectorAll('[data-showcase-sizes]').forEach(function (container) {
    var section = container.closest('[data-section-id]') || container.closest('section');
    var variantInput = section && section.querySelector('[data-showcase-variant-input]');
    var priceEl = section && section.querySelector('[data-showcase-price]');

    container.querySelectorAll('.ym-showcase__size-option').forEach(function (btn) {
      btn.addEventListener('click', function () {
        container.querySelectorAll('.ym-showcase__size-option').forEach(function (b) {
          b.classList.remove('is-active');
        });
        btn.classList.add('is-active');

        var variantId = btn.getAttribute('data-variant-id');
        var variantPrice = btn.getAttribute('data-variant-price');
        if (variantId && variantInput) variantInput.value = variantId;
        if (variantPrice && priceEl) priceEl.textContent = variantPrice;
      });
    });
  });

  // AJAX Add to Cart (#43). Submits to /cart/add.js and dispatches a
  // cart:update event so cart-drawer-component (Dawn) auto-opens and
  // cart-icon refreshes its bubble. Falls back to native form POST on error.
  document.querySelectorAll('[data-showcase-cart-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = form.querySelector('button[type="submit"]');
      var originalLabel = btn ? btn.textContent : '';
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Adding…';
      }

      var formData = new FormData(form);
      // Ask Shopify to render the cart-drawer section back so listeners can patch DOM.
      formData.append('sections', 'cart-drawer');

      fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: formData,
      })
        .then(function (res) {
          if (!res.ok) throw new Error('Add-to-cart failed: ' + res.status);
          return res.json();
        })
        .then(function (data) {
          // Re-fetch the cart so listeners get accurate item_count etc.
          return fetch('/cart.js').then(function (r) { return r.json(); }).then(function (cart) {
            document.dispatchEvent(new CustomEvent('cart:update', {
              bubbles: true,
              detail: {
                resource: cart,
                sourceId: form.closest('[data-section-id]')?.getAttribute('data-section-id') || 'ym-showcase',
                data: { source: 'ym-showcase', itemCount: cart.item_count, variantId: formData.get('id') },
              },
            }));
            // Drawer's auto-open key is the CartAddEvent name which is also 'cart:update'
            // — Dawn's CartDrawerComponent#handleCartAdd listens for it.
            var drawer = document.querySelector('cart-drawer-component');
            if (drawer && typeof drawer.open === 'function') drawer.open();
          });
        })
        .catch(function (err) {
          console.error('[ym-showcase] add-to-cart error', err);
          // As a fallback, do a real navigation submit — server-side add still works.
          form.submit();
        })
        .finally(function () {
          if (btn) {
            btn.disabled = false;
            btn.textContent = originalLabel || 'Add to Cart';
          }
        });
    });
  });
})();
