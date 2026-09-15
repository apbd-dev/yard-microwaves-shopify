/**
 * The approved copy for every Klaviyo email — ONE source of truth.
 *
 * Rich picked one of three takes per email on the review deck
 * (https://claude.ai/code/artifact/5095a2a4-7142-4bc1-8894-67ed685c324b,
 * picks saved 2026-09-10; full deck in copy-deck.md). The three
 * abandoned-cart emails were approved earlier on the design canvas.
 *
 *   headline  → rendered to a Milenia PNG by render-assets.mjs (h-<slug>)
 *   cta       → rendered to pill PNGs by render-assets.mjs (b-/pill-<slug>)
 *   body/lede → live text in build.mjs
 *   subject / preheader → flow message settings (klaviyo.mjs wire)
 *
 * Merge fields: FIRST = profile first name, "there" fallback. Order number
 * comes off the Shopify event. [COUPON] is a placeholder until Rich creates
 * the Shopify discount codes — never invent one.
 */
export const FIRST = `{{ first_name|title|default:'there' }}`;
export const ORDER = `{{ event.extra.order_number }}`;
export const COUPON = 'INSERT-COUPON';

export const COPY = {
  'welcome-1-new': {
    take: 'B',
    name: 'Welcome #1 - New Subscriber (10% Off)',
    subject: 'Welcome to the Yard. Mind the extension cord.',
    preheader: "10% off your first tee. Nobody's hurt yet.",
    headline: 'You joined a barbecue email list. On purpose.',
    lede: `Hey ${FIRST}.`,
    body: `<p>Two childhood friends, one backyard, more extension cord than common sense. That's us.</p><p style="margin:0;">Now you get the drop previews, the deals, and an unreasonable amount of brisket. Here's 10% off your first tee. Don't tell the neighbors.</p>`,
    coupon: `Use code <strong>${COUPON}</strong> for 10% off your first tee`,
    cta: { key: 'grab-10', label: 'Grab 10% off' },
  },
  'welcome-1-existing': {
    take: 'C',
    name: 'Welcome #1 - Existing Customer',
    subject: 'Regular status: confirmed',
    preheader: "Drops on Saturdays. You're first now.",
    headline: "You're on the list.",
    lede: `You've got the tee, ${FIRST}.`,
    body: `<p style="margin:0;">Now you get the drops first. Saturdays. That's the deal.</p>`,
    cta: { key: 'shop-yard', label: 'Shop the Yard' },
  },
  'welcome-2-follow': {
    take: 'B',
    name: 'Welcome #2 - Follow Us',
    subject: 'We misbehave on Instagram',
    preheader: 'Come watch us nearly burn things.',
    headline: 'Follow us. Watch us learn.',
    lede: `This email list is the well-behaved version of us.`,
    body: `<p style="margin:0;">Instagram gets the rest: drop previews, design sketches, and every time a fire extinguisher makes an appearance. Come for the tees. Stay for the poor decisions.</p>`,
    cta: { key: 'follow-chaos', label: 'Follow the chaos' },
  },
  'review-request': {
    take: 'B',
    name: 'Review Request',
    subject: 'Did it survive the cookout?',
    preheader: 'Sauce stains count as a review.',
    headline: 'Tell us how it went.',
    lede: `By now your tee has met smoke, sauce, or both.`,
    body: `<p style="margin:0;">We'd like to know how it held up, ${FIRST}. Be honest. We've heard worse from each other.</p>`,
    cta: { key: 'review-tee', label: 'Review the tee' },
  },
  'review-reminder': {
    take: 'B',
    name: 'Review Reminder',
    subject: 'Your tee is still not reviewed',
    preheader: "We checked. Twice. It's not there.",
    headline: "The tee's feeling ignored.",
    lede: `Not to nag, ${FIRST},`,
    body: `<p style="margin:0;">but the tee's been home a while now and hasn't heard a word. A sentence will do. &ldquo;Fits, funny, smells like hickory&rdquo; is a perfectly good review.</p>`,
    cta: { key: 'say-something', label: 'Say something' },
  },
  'order-confirmation': {
    take: 'B',
    name: 'Order Confirmation',
    subject: 'You bought a shirt from us. Thank you.',
    preheader: `Order ${ORDER} confirmed. We're already bragging about it.`,
    headline: 'Somebody bought a tee!',
    lede: `Order <strong>${ORDER}</strong> is confirmed, ${FIRST}, and we're genuinely thrilled.`,
    body: `<p style="margin:0;">We're printing it now, which is quieter than it sounds. Shipping email lands in a few days. In the meantime, go put something on the smoker.</p>`,
    cta: { key: 'view-order', label: 'View your order' },
  },
  'shipping-confirmation': {
    take: 'C',
    name: 'Shipping Confirmation',
    subject: `Shipped: order ${ORDER}`,
    preheader: 'Tracking link below.',
    headline: 'On its way.',
    lede: `Order <strong>${ORDER}</strong> shipped, ${FIRST}.`,
    body: `<p style="margin:0;">Track it below. Watch the mailbox, not the pot.</p>`,
    cta: { key: 'track-package', label: 'Track your package' },
  },
  'abandoned-cart-1': {
    take: 'canvas',
    name: 'Abandoned Cart #1',
    subject: 'HEADS UP, PITMASTER!',   // subject + preview: Rich's own lines from the flow, kept verbatim
    preheader: "You left the lid up! Your cart’s losing heat—and flavor.",
    headline: 'Heads up, Pitmaster!',
    lede: `You left the lid up! Your cart's losing heat &mdash; and flavor.`,
    body: `<p style="margin:0;">We saved everything right where you left it. Come back and close that lid before the smoke escapes.</p>`,
    cta: { key: 'back-to-cart', label: 'Back to my cart' },
  },
  'abandoned-cart-2': {
    take: 'canvas',
    name: 'Abandoned Cart #2',
    subject: 'TRUE BARBECUE WISDOM INCOMING',
    preheader: 'It’s rested. It’s ready. Time to carve into that cart and claim your reward.',
    headline: "It's rested. It's ready.",
    lede: `True barbecue wisdom: low and slow wins &mdash; but not this slow.`,
    body: `<p style="margin:0;">Your cart has had plenty of time to rest. Time to carve into it and claim your reward.</p>`,
    cta: { key: 'back-to-cart', label: 'Back to my cart' },
  },
  'abandoned-cart-3': {
    take: 'canvas',
    name: 'Abandoned Cart #3 (15% Off)',
    subject: 'FOR THE SAUCE LOVERS OUT THERE',
    preheader: 'Sauce boss status: confirmed. Use your 15% before it drips away.',
    headline: 'A little sauce on the house',
    lede: `Sauce boss status: confirmed.`,
    coupon: `Use code <strong>${COUPON}</strong> for 15% off your cart &mdash; good for the next 48 hours, then it drips away.`,
    cta: { key: 'claim-15', label: 'Claim 15% off' },
  },
  'browse-abandonment-1': {
    take: 'B',
    name: 'Browse Abandonment #1',
    subject: 'You looked. We noticed.',
    preheader: 'The internet told us. Sorry.',
    headline: 'We saw that.',
    lede: `You looked at a tee and walked off, ${FIRST}.`,
    body: `<p style="margin:0;">Happens to us in the sauce aisle all the time. It's still there. Fewer of them than there were, but still there.</p>`,
    cta: { key: 'go-back', label: 'Go back for it' },
  },
  'browse-abandonment-2': {
    take: 'A',
    name: 'Browse Abandonment #2',
    subject: "Last look before it's gone",
    preheader: "We won't bring it up again.",
    headline: 'Final call from the pit.',
    lede: `This is the last time we'll mention it, ${FIRST}.`,
    body: `<p style="margin:0;">The tee's still in stock today. Once the drop sells through, it doesn't come back until the next one, and that's weeks out. Your call.</p>`,
    cta: { key: 'grab-now', label: 'Grab it now' },
  },
};

/** Headline PNGs to render: slug → text (render-assets.mjs). */
export const HEADLINES = Object.fromEntries(Object.entries(COPY).map(([slug, c]) => [slug, c.headline]));

/** Button pills to render: key → label. Shared pills render once. */
export const BUTTONS = Object.fromEntries([
  ...Object.values(COPY).map((c) => [c.cta.key, c.cta.label]),
  ['our-story', 'Our Story'],   // footer
]);
