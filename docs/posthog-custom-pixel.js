/*
 * PostHog — checkout half. Yard Microwaves.
 * ---------------------------------------------------------------------------
 * THIS FILE IS NOT LOADED BY THE THEME. It is version-controlled here so the
 * code has a home and a diff; it runs only once pasted into the Shopify admin:
 *
 *   Settings -> Customer events -> Add custom pixel -> name it "PostHog"
 *   -> paste this file -> set Permission to "Analytics" -> Save -> Connect
 *
 * Why a pixel at all: checkout and the thank-you page are Shopify-hosted. No
 * theme code runs there, so snippets/posthog.liquid physically cannot see a
 * purchase. Without this file the funnel ends at "reached checkout" and
 * conversion reads 0%.
 *
 * Why raw fetch instead of loading posthog-js: the pixel runs in a sandboxed
 * iframe with its own storage. posthog-js would mint a second, unrelated
 * distinct_id there and every purchase would attach to a stranger. Posting to
 * the capture API directly lets us set distinct_id ourselves, from the cookie
 * the theme wrote (`browser.cookie.get` executes in the TOP frame, so it reads
 * the storefront's first-party cookies).
 *
 * Division of labour with the theme snippet, so nothing double-counts:
 *   theme -> $pageview, autocapture, replay, identity
 *   here  -> commerce events, and $pageview ONLY on checkout paths
 *
 * After editing this file, re-paste it into the admin. There is no deploy.
 */

// ---------------------------------------------------------------------------
// CONFIG — must match Theme settings -> Analytics exactly, or storefront and
// checkout events land in two different projects and no funnel will join up.
// ---------------------------------------------------------------------------
var POSTHOG_TOKEN = 'phc_REPLACE_ME';
var POSTHOG_HOST = 'https://us.i.posthog.com';

var STITCH_COOKIE = 'ym_ph_id';

// ---------------------------------------------------------------------------
// Identity
// ---------------------------------------------------------------------------

/*
 * Resolved once, reused by every event. The cookie read is async and events can
 * fire before it settles, so this is a promise that each capture awaits rather
 * than a value — otherwise the first checkout event of a session races the
 * lookup and silently falls back to the wrong id.
 */
var identityPromise = (function () {
  return Promise.resolve()
    .then(function () {
      return browser.cookie.get(STITCH_COOKIE);
    })
    .then(function (raw) {
      if (!raw) return null;
      // Written by snippets/posthog.liquid as "<distinct_id>|<session_id>".
      var parts = decodeURIComponent(raw).split('|');
      if (!parts[0]) return null;
      return { distinctId: parts[0], sessionId: parts[1] || null };
    })
    .catch(function () {
      return null;
    });
})();

/*
 * Shopify's own per-browser id. Used when the visitor never touched a theme
 * page in this browser (a direct checkout link, or cookies cleared mid-flow).
 * Prefixed so these are obvious in PostHog as un-stitched sessions rather than
 * looking like ordinary people.
 */
function fallbackIdentity(event) {
  var clientId = event && event.clientId;
  return {
    distinctId: clientId ? 'shopify:' + clientId : 'shopify:anonymous',
    sessionId: null,
  };
}

// ---------------------------------------------------------------------------
// Capture
// ---------------------------------------------------------------------------

function money(amount) {
  // Shopify money objects are { amount, currencyCode }; amount is a number.
  return amount && typeof amount.amount === 'number' ? amount.amount : null;
}

function currencyOf(amount) {
  return (amount && amount.currencyCode) || null;
}

/*
 * Context properties, so PostHog's own UI (sessions, paths, referrers) works on
 * pixel events the same way it does on theme events. The pixel gets a snapshot
 * of the top frame rather than a live `window`.
 */
function contextProperties(event) {
  var context = (event && event.context) || {};
  var doc = context.document || {};
  var nav = context.navigator || {};
  var loc = doc.location || {};

  return {
    $current_url: loc.href || null,
    $host: loc.host || null,
    $pathname: loc.pathname || null,
    $referrer: doc.referrer || null,
    $referring_domain: doc.referrer ? doc.referrer.split('/')[2] || null : null,
    $raw_user_agent: nav.userAgent || null,
    $lib: 'shopify-web-pixel',
  };
}

/*
 * options.identified — when true the event is allowed to create/update a person
 * profile. Left false for browsing events: the theme runs with
 * person_profiles:'identified_only' and minting a profile per anonymous
 * checkout visitor would both cost money and contradict that setting.
 */
function capture(event, name, properties, options) {
  var opts = options || {};

  return identityPromise
    .then(function (identity) {
      var who = identity || fallbackIdentity(event);

      var payload = Object.assign(
        {},
        contextProperties(event),
        properties || {},
        {
          // Ties pixel events to the theme's session replay timeline, so a
          // purchase opens onto the recording of the browse that produced it.
          $session_id: who.sessionId || undefined,
          shop_domain: (event.context && event.context.document && event.context.document.location && event.context.document.location.host) || null,
          brand: 'yard-microwaves',
        }
      );

      if (!opts.identified) {
        payload.$process_person_profile = false;
      }
      if (opts.set) {
        payload.$set = opts.set;
      }

      return fetch(POSTHOG_HOST + '/i/v0/e/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // The thank-you page can navigate away mid-flight; keepalive is what
        // stops the purchase event — the one event that matters most — from
        // being cancelled on unload.
        keepalive: true,
        body: JSON.stringify({
          api_key: POSTHOG_TOKEN,
          event: name,
          distinct_id: who.distinctId,
          properties: payload,
          timestamp: event && event.timestamp ? event.timestamp : new Date().toISOString(),
        }),
      });
    })
    .catch(function () {
      // Analytics must never break a checkout.
    });
}

// ---------------------------------------------------------------------------
// Product / cart events
// ---------------------------------------------------------------------------

function variantProperties(variant) {
  if (!variant) return {};
  var product = variant.product || {};
  return {
    variant_id: variant.id || null,
    variant_title: variant.title || null,
    sku: variant.sku || null,
    price: money(variant.price),
    currency: currencyOf(variant.price),
    product_id: product.id || null,
    product_title: product.title || null,
    product_type: product.type || null,
    product_vendor: product.vendor || null,
  };
}

analytics.subscribe('product_viewed', function (event) {
  capture(event, 'product_viewed', variantProperties(event.data.productVariant));
});

analytics.subscribe('product_added_to_cart', function (event) {
  var line = event.data.cartLine || {};
  capture(
    event,
    'product_added_to_cart',
    Object.assign({}, variantProperties(line.merchandise), {
      quantity: line.quantity || null,
      line_total: money(line.cost && line.cost.totalAmount),
    })
  );
});

analytics.subscribe('product_removed_from_cart', function (event) {
  var line = event.data.cartLine || {};
  capture(
    event,
    'product_removed_from_cart',
    Object.assign({}, variantProperties(line.merchandise), {
      quantity: line.quantity || null,
    })
  );
});

analytics.subscribe('cart_viewed', function (event) {
  var cart = event.data.cart || {};
  capture(event, 'cart_viewed', {
    cart_id: cart.id || null,
    cart_total: money(cart.cost && cart.cost.totalAmount),
    currency: currencyOf(cart.cost && cart.cost.totalAmount),
    item_count: cart.totalQuantity || 0,
  });
});

analytics.subscribe('collection_viewed', function (event) {
  var collection = event.data.collection || {};
  capture(event, 'collection_viewed', {
    collection_id: collection.id || null,
    collection_title: collection.title || null,
  });
});

analytics.subscribe('search_submitted', function (event) {
  var result = event.data.searchResult || {};
  capture(event, 'search_submitted', {
    query: result.query || null,
    result_count: (result.productVariants || []).length,
  });
});

// ---------------------------------------------------------------------------
// Checkout funnel
// ---------------------------------------------------------------------------

function lineItems(checkout) {
  return (checkout.lineItems || []).map(function (item) {
    var variant = item.variant || {};
    var product = variant.product || {};
    return {
      product_id: product.id || null,
      product_title: product.title || null,
      variant_id: variant.id || null,
      variant_title: variant.title || null,
      sku: variant.sku || null,
      quantity: item.quantity || null,
      price: money(variant.price),
    };
  });
}

function checkoutProperties(checkout) {
  return {
    checkout_token: checkout.token || null,
    value: money(checkout.totalPrice),
    currency: currencyOf(checkout.totalPrice) || checkout.currencyCode || null,
    subtotal: money(checkout.subtotalPrice),
    shipping: money(checkout.shippingLine && checkout.shippingLine.price),
    tax: money(checkout.totalTax),
    item_count: (checkout.lineItems || []).reduce(function (sum, item) {
      return sum + (item.quantity || 0);
    }, 0),
    line_items: lineItems(checkout),
    discount_codes: (checkout.discountApplications || [])
      .map(function (d) {
        return d.title || d.code || null;
      })
      .filter(Boolean),
  };
}

/*
 * Every step between "started checkout" and "paid". These are the drop-off
 * points — the whole reason for instrumenting checkout rather than just
 * counting orders in Shopify admin.
 */
[
  'checkout_started',
  'checkout_contact_info_submitted',
  'checkout_address_info_submitted',
  'checkout_shipping_info_submitted',
  'payment_info_submitted',
].forEach(function (name) {
  analytics.subscribe(name, function (event) {
    capture(event, name, checkoutProperties(event.data.checkout || {}));
  });
});

analytics.subscribe('checkout_completed', function (event) {
  var checkout = event.data.checkout || {};
  var order = checkout.order || {};

  var properties = Object.assign({}, checkoutProperties(checkout), {
    order_id: order.id || null,
    // PostHog's revenue analytics reads `revenue`; `$revenue` is the older
    // convention still used by some insights. Both are set so either works.
    revenue: money(checkout.totalPrice),
    $revenue: money(checkout.totalPrice),
  });

  // The one moment a person profile is worth creating: a real customer with a
  // real email, at the end of a journey we can now attribute end to end.
  var personProperties = {};
  if (checkout.email) {
    personProperties.email = checkout.email;
    personProperties.$email = checkout.email;
  }
  var billing = checkout.billingAddress || {};
  if (billing.firstName) personProperties.first_name = billing.firstName;
  if (billing.lastName) personProperties.last_name = billing.lastName;
  if (billing.city) personProperties.city = billing.city;
  if (billing.province) personProperties.region = billing.province;
  if (billing.country) personProperties.country = billing.country;

  capture(event, 'purchase', properties, {
    identified: true,
    set: personProperties,
  })
    .then(function () {
      /*
       * Link this browser's anonymous id to the customer's email, so a repeat
       * buyer on a different device resolves to one person rather than two.
       * Sent after the purchase so the event itself is never delayed or lost
       * if aliasing fails.
       */
      if (!checkout.email) return;
      return identityPromise.then(function (identity) {
        var who = identity || fallbackIdentity(event);
        if (who.distinctId === checkout.email) return;
        return fetch(POSTHOG_HOST + '/i/v0/e/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          keepalive: true,
          body: JSON.stringify({
            api_key: POSTHOG_TOKEN,
            event: '$create_alias',
            distinct_id: who.distinctId,
            properties: { alias: checkout.email },
          }),
        });
      });
    })
    .catch(function () {});
});

// ---------------------------------------------------------------------------
// Pageviews — checkout only
// ---------------------------------------------------------------------------

/*
 * The theme snippet already fires $pageview everywhere it runs. Firing again
 * here would double every storefront pageview and halve every conversion rate.
 * So this covers exactly the pages the theme cannot reach.
 */
analytics.subscribe('page_viewed', function (event) {
  var loc =
    (event.context && event.context.document && event.context.document.location) || {};
  var path = loc.pathname || '';
  var isCheckout =
    path.indexOf('/checkouts') === 0 ||
    path.indexOf('/checkout') === 0 ||
    path.indexOf('/orders/') !== -1 ||
    path.indexOf('/thank_you') !== -1;

  if (!isCheckout) return;
  capture(event, '$pageview', {});
});
