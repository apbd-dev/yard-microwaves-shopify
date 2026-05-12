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

    // Color card thumbs (#43) — Bone vs Briquette. Click swaps which is big:
    //  - .is-active toggle gives the clicked thumb the primary slot (CSS handles position)
    //  - the back-print hero shirt image swaps to that color (data-hero-src)
    //  - the color label text swaps (data-label)
    //  - the cart variant updates to (currentSize, newColor) using the per-color
    //    variant IDs the Liquid emitted on each size button
    var cardThumbs = panel.querySelectorAll('.ym-showcase__card-thumb');
    if (cardThumbs.length) {
      var sectionEl = panel.closest('[data-section-id]') || panel.closest('section');
      var label = sectionEl && sectionEl.querySelector('[data-showcase-color-label]');
      var variantInput = sectionEl && sectionEl.querySelector('[data-showcase-variant-input]');
      var priceEl = sectionEl && sectionEl.querySelector('[data-showcase-price]');
      var sizeContainer = sectionEl && sectionEl.querySelector('[data-showcase-sizes]');

      if (!Array.from(cardThumbs).some(function (t) { return t.classList.contains('is-active'); })) {
        cardThumbs[0].classList.add('is-active');
      }

      cardThumbs.forEach(function (thumb) {
        thumb.addEventListener('click', function () {
          if (thumb.classList.contains('is-active')) return;
          cardThumbs.forEach(function (t) { t.classList.remove('is-active'); });
          thumb.classList.add('is-active');

          var heroSrc = thumb.getAttribute('data-hero-src');
          if (heroSrc) {
            // Swap every back-print hero image in the panel (the big back
            // shirt overlapping the card AND the smaller card-hero inside).
            panel.querySelectorAll('[data-showcase-hero]').forEach(function (img) {
              img.setAttribute('src', heroSrc);
              if (img.hasAttribute('srcset')) img.removeAttribute('srcset');
            });
          }

          var frontHeroSrc = thumb.getAttribute('data-front-hero-src');
          if (frontHeroSrc) {
            // Swap the big front folded shirt to match the active color.
            panel.querySelectorAll('[data-showcase-front-hero]').forEach(function (img) {
              img.setAttribute('src', frontHeroSrc);
              if (img.hasAttribute('srcset')) img.removeAttribute('srcset');
            });
          }

          var newLabel = thumb.getAttribute('data-label');
          if (newLabel && label) label.textContent = newLabel;

          var color = thumb.getAttribute('data-color') || 'bone';
          var activeSize = sizeContainer && sizeContainer.querySelector('.ym-showcase__size-option.is-active');
          if (activeSize) {
            var newVariantId = activeSize.getAttribute('data-variant-id-' + color);
            var newVariantPrice = activeSize.getAttribute('data-variant-price-' + color);
            if (newVariantId && variantInput) variantInput.value = newVariantId;
            if (newVariantPrice && priceEl) priceEl.textContent = newVariantPrice;
          } else {
            var fallback = thumb.getAttribute('data-default-variant-id');
            if (fallback && variantInput) variantInput.value = fallback;
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

  // Size click handling — moves the X marker, updates variant + price.
  // Variant lookup is color-aware: prefer data-variant-id-{color} matching the
  // active color thumb so size+color combine into one specific variant.
  document.querySelectorAll('[data-showcase-sizes]').forEach(function (container) {
    var section = container.closest('[data-section-id]') || container.closest('section');
    var variantInput = section && section.querySelector('[data-showcase-variant-input]');
    var priceEl = section && section.querySelector('[data-showcase-price]');
    var getActiveColor = function () {
      var activeThumb = section && section.querySelector('.ym-showcase__card-thumb.is-active');
      return (activeThumb && activeThumb.getAttribute('data-color')) || 'bone';
    };

    container.querySelectorAll('.ym-showcase__size-option').forEach(function (btn) {
      btn.addEventListener('click', function () {
        container.querySelectorAll('.ym-showcase__size-option').forEach(function (b) {
          b.classList.remove('is-active');
        });
        btn.classList.add('is-active');

        var color = getActiveColor();
        var variantId = btn.getAttribute('data-variant-id-' + color) || btn.getAttribute('data-variant-id');
        var variantPrice = btn.getAttribute('data-variant-price-' + color) || btn.getAttribute('data-variant-price');
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
      // Ask Shopify to render back the section that hosts the cart drawer's
      // cart-items-component, so its CartAddEvent listener can morph in the
      // updated HTML. Section IDs are dynamic (sections--<theme>__header_section)
      // so we discover them from the live DOM rather than hard-coding 'cart-drawer'.
      var cartSectionIds = Array.from(document.querySelectorAll('cart-items-component[data-section-id]'))
        .map(function (el) { return el.dataset.sectionId; })
        .filter(Boolean);
      var uniqueSectionIds = Array.from(new Set(cartSectionIds));
      if (uniqueSectionIds.length) {
        formData.append('sections', uniqueSectionIds.join(','));
      }

      fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: formData,
      })
        .then(function (res) {
          if (!res.ok) throw new Error('Add-to-cart failed: ' + res.status);
          return res.json();
        })
        .then(function (response) {
          // Re-fetch the cart for accurate item_count / totals.
          return fetch('/cart.js').then(function (r) { return r.json(); }).then(function (cart) {
            // Shape matches CartAddEvent in @theme/events: detail.data.sections is
            // what cart-items-component reads to morphSection(). Drawer auto-open
            // is also keyed off this same event (eventName === 'cart:update').
            document.dispatchEvent(new CustomEvent('cart:update', {
              bubbles: true,
              detail: {
                resource: cart,
                sourceId: form.closest('[data-section-id]')?.getAttribute('data-section-id') || 'ym-showcase',
                data: {
                  source: 'ym-showcase',
                  itemCount: cart.item_count,
                  variantId: formData.get('id'),
                  sections: response.sections,
                },
              },
            }));
            // Belt-and-braces: open the drawer directly. cart-drawer-component
            // also auto-opens on cart:update via the auto-open attribute, but
            // calling open() makes us resilient to that attribute being absent.
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
