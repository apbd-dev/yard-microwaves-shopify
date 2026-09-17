# Klaviyo email copy deck — 2026-09-09

Three takes for each of the nine templates in `build.mjs` that still carry Klaviyo starter text. The three abandoned-cart emails are already written (design canvas, `email/design/src/`) and are not in this deck.

- Review page (pick one per email; picks persist): https://claude.ai/code/artifact/5095a2a4-7142-4bc1-8894-67ed685c324b
- Vault note: `04 - Content/newsletter/2026-09-09-ym-klaviyo-email-copy.md`
- Issues: apbd-dev/yard-microwaves-shopify#115 (this deck) · #116 (Rich's picks) · #59 #60 #61 (the flows)

**Angles.** A = the pitmaster (confident, BBQ wisdom, the register of the approved cart emails). B = backyard chaos (self-deprecating, extension cords). C = dry one-liner (fewest words wins).

**Merge fields.** `{{first_name}}` → Klaviyo `{{ first_name|default:'there' }}`. `[COUPON]` → the Shopify discount code. `{{order_number}}` → `{{ event.extra.order_number }}`. Dynamic blocks (order ticket, totals, addresses, product card, footer) are unchanged.

## Welcome series

_fires on signup to the list_

### Welcome #1 · new subscriber (20% off first order)

**Today:** ~~Welcome to the Yard Microwaves family! · Hey there, we're glad you're here! So, what can you expect now that you're an insider? Exciting product announcements, exclusive deals and promotions…~~

| | A — The pitmaster | B — Backyard chaos | C — Dry one-liner |
|---|---|---|---|
| **subject** | You're in. Here's 20% off. | Welcome to the Yard. Mind the extension cord. | 20% off. No sales pitch. |
| **preheader** | Code [COUPON] takes 20% off your first tee. The lid's already up. | 20% off your first tee. Nobody's hurt yet. | Code [COUPON]. First tee. That's the email. |
| **headline** | Pull up a chair, Pitmaster. | You joined a barbecue email list. On purpose. | Welcome. Code's below. |
| **body** | Welcome to the Yard, {{first_name}}. You're on the list now, which means drops hit your inbox before they hit anyone else's. First round's on us: 20% off your first tee with code [COUPON]. Low and slow is for brisket. This code's good for a week. | Hey {{first_name}}. Two childhood friends, one backyard, more extension cord than common sense. That's us. Now you get the drop previews, the deals, and an unreasonable amount of brisket. Here's 20% off your first tee with code [COUPON]. Don't tell the neighbors. | You're in, {{first_name}}. Drops land Saturdays. Everything else is just smoke. Your first tee is 20% off with code [COUPON]. |
| **cta** | Shop the drop | Grab 20% off | Use the code |

### Welcome #1 · existing customer (already bought, no coupon)

**Today:** ~~Awesome! You're in! · What can you expect from Yard Microwaves now that you're a real insider? Exciting product announcements, exclusive deals and promotions, content and recommendations we'll customize just for you!~~

| | A — The pitmaster | B — Backyard chaos | C — Dry one-liner |
|---|---|---|---|
| **subject** | You already knew. Now it's official. | Oh good, you came back. | Regular status: confirmed |
| **preheader** | You've got a tee. Now you've got a seat at the pit. | You bought one and still signed up. Bold. | Drops on Saturdays. You're first now. |
| **headline** | Welcome back to the Yard. | A repeat customer. We're as surprised as you. | You're on the list. |
| **body** | Good to see you again, {{first_name}}. You've already got the tee, so you know how this ends. From here on you get drop previews before the Saturday rush, the odd deal, and first look at every new design. We keep the best cuts for the regulars. | {{first_name}}, you already own the shirt and you subscribed anyway. That's either loyalty or a mistake, and we'll take it. Expect drop previews, the occasional deal, and grill footage that would worry a fire marshal. | You've got the tee, {{first_name}}. Now you get the drops first. Saturdays. That's the deal. |
| **cta** | See what's new | See what's new | Shop the Yard |

### Welcome #2 · follow us (Instagram nudge, a day later)

**Today:** ~~Follow the smoke · Email is where we make it official. Instagram is where we misbehave. This one already has some voice; the three below are alternatives, keep the current one if it wins.~~

| | A — The pitmaster | B — Backyard chaos | C — Dry one-liner |
|---|---|---|---|
| **subject** | Where the smoke actually is | We misbehave on Instagram | One more place |
| **preheader** | Drop previews and pit footage, days before the email. | Come watch us nearly burn things. | Instagram. Previews. Brisket. That's it. |
| **headline** | The pit's on Instagram. | Follow us. Watch us learn. | Follow the smoke. |
| **body** | Email is where we make it official, {{first_name}}. Instagram is where the smoker's running. New designs get previewed there first, drops get teased there first, and the brisket gets sliced there on camera. If you want the good seats, follow along. | This email list is the well-behaved version of us. Instagram gets the rest: drop previews, design sketches, and every time a fire extinguisher makes an appearance. Come for the tees. Stay for the poor decisions. | Drops get teased on Instagram first. So does the brisket. One tap, {{first_name}}. |
| **cta** | Follow @yardmicrowaves | Follow the chaos | Follow us |

## Review flow

_fires a few days after delivery_

### Review request (a few days after delivery)

**Today:** ~~What did you think? · Thank you for shopping with us. We'd love to hear what you think of your latest purchase. We appreciate your feedback.~~

| | A — The pitmaster | B — Backyard chaos | C — Dry one-liner |
|---|---|---|---|
| **subject** | How'd the tee hold up? | Did it survive the cookout? | Quick one |
| **preheader** | A word from you helps the next pitmaster pick a size. | Sauce stains count as a review. | Rate the tee. Twenty seconds. |
| **headline** | Verdict, please. | Tell us how it went. | How's the tee? |
| **body** | Your tee's had a few days on the job, {{first_name}}. How's the fit? Did the joke land at the cookout? A short review helps the next pitmaster order the right size, and it tells us what to make next. | By now your tee has met smoke, sauce, or both. We'd like to know how it held up, {{first_name}}. Be honest. We've heard worse from each other. | Shorter than a brisket rest, {{first_name}}. Tell us what you think. |
| **cta** | Leave a review | Review the tee | Leave a review |

### Review reminder (no review after the first ask)

**Today:** ~~We'd love to hear from you · Tell us what you think about your latest purchase. We appreciate your feedback.~~

| | A — The pitmaster | B — Backyard chaos | C — Dry one-liner |
|---|---|---|---|
| **subject** | Still waiting on your verdict | Your tee is still not reviewed | Rest is over |
| **preheader** | One more ask. Then we'll leave you to the grill. | We checked. Twice. It's not there. | Review the tee. Last nudge. |
| **headline** | Last call for reviews. | The tee's feeling ignored. | One line. That's all. |
| **body** | We asked once, {{first_name}}. This is the second and last time. If the tee's earned a spot in the rotation, or if it hasn't, tell us. Other pitmasters read these before they buy. | Not to nag, {{first_name}}, but the tee's been home a while now and hasn't heard a word. A sentence will do. "Fits, funny, smells like hickory" is a perfectly good review. | Still curious how it's holding up, {{first_name}}. One line, then we're done. |
| **cta** | Leave a review | Say something | Leave a review |

## Transactional

_order placed and order shipped_

### Order confirmation (order placed)

**Today:** ~~Thank you for your order! · Order {{order_number}} is in. This email is to confirm your order. We'll send another note the moment it ships. (Order ticket, totals and addresses stay as the dynamic block.)~~

| | A — The pitmaster | B — Backyard chaos | C — Dry one-liner |
|---|---|---|---|
| **subject** | Order {{order_number}} is in the pit | You bought a shirt from us. Thank you. | Confirmed: order {{order_number}} |
| **preheader** | We've got your order. Next email is the shipping one. | Order {{order_number}} confirmed. We're already bragging about it. | Received. Printing. Shipping soon. |
| **headline** | Order received. Fire's lit. | Somebody bought a tee! | Got it. |
| **body** | Thanks, {{first_name}}. Order {{order_number}} is in and we're on it. Everything's printed to order, so give us a few days to get it right. You'll get another email the moment it ships. | Order {{order_number}} is confirmed, {{first_name}}, and we're genuinely thrilled. We're printing it now, which is quieter than it sounds. Shipping email lands in a few days. In the meantime, go put something on the smoker. | Order {{order_number}} is confirmed, {{first_name}}. It prints this week and ships right after. We'll email when it moves. |
| **cta** | View your order | View your order | View your order |

### Shipping confirmation (order shipped)

**Today:** ~~It's on the way! · We've got some good news! All of the items from order {{order_number}} have now been shipped. Please allow some time for the status of the shipment to correctly display… (Items, address and tracking number stay as the dynamic block.)~~

| | A — The pitmaster | B — Backyard chaos | C — Dry one-liner |
|---|---|---|---|
| **subject** | Order {{order_number}} is on the way | Your tee has left the building | Shipped: order {{order_number}} |
| **preheader** | Tracking's inside. The smoke's already in the air. | Order {{order_number}} is in a truck somewhere. We think. | Tracking link below. |
| **headline** | Lid's closed. It's moving. | It's out of our hands now. | On its way. |
| **body** | Order {{order_number}} left the Yard and it's heading your way, {{first_name}}. Tracking is below. Give it a day to start showing movement, the carrier likes to keep us all guessing. | Order {{order_number}} is on a truck, {{first_name}}. We packed it ourselves, which is the last time it'll be handled by someone who cares. Tracking is below. If the number doesn't move right away, that's the carrier, not us. | Order {{order_number}} shipped, {{first_name}}. Track it below. Watch the mailbox, not the pot. |
| **cta** | Track your package | Track it down | Track your package |

## Browse abandonment

_viewed a product, did not add to cart_

### Browse abandonment #1 (viewed a product, left)

**Today:** ~~Well, what are you waiting for? · Hey there, this item is going fast, so grab it while you still can! (Product card stays as the dynamic block.)~~

| | A — The pitmaster | B — Backyard chaos | C — Dry one-liner |
|---|---|---|---|
| **subject** | Still thinking about it? | You looked. We noticed. | That tee's still here |
| **preheader** | That tee's still on the rack. For now. | The internet told us. Sorry. | Small drop. Fewer left. |
| **headline** | You had your eye on something. | We saw that. | Still on the rack. |
| **body** | We saw you looking, {{first_name}}. No judgment, it's a good-looking shirt. Drops are small and Saturdays-only, so when a size goes, it's gone until the next one. | You looked at a tee and walked off, {{first_name}}. Happens to us in the sauce aisle all the time. It's still there. Fewer of them than there were, but still there. | You looked, {{first_name}}. It's still there. Small batch, though. |
| **cta** | Take another look | Go back for it | Take another look |

### Browse abandonment #2 (second and last nudge)

**Today:** ~~Well, what are you waiting for? · Hey there, this item is going fast, so grab it while you still can! (Identical to #1 today.)~~

| | A — The pitmaster | B — Backyard chaos | C — Dry one-liner |
|---|---|---|---|
| **subject** | Last look before it's gone | Okay, this is the last email about the shirt | Last one |
| **preheader** | We won't bring it up again. | We promise. Well, we mostly promise. | Then we'll drop it. |
| **headline** | Final call from the pit. | We're done pestering. After this. | Last nudge. |
| **body** | This is the last time we'll mention it, {{first_name}}. The tee's still in stock today. Once the drop sells through, it doesn't come back until the next one, and that's weeks out. Your call. | Two emails is our limit, {{first_name}}. After this we go back to minding the smoker. The tee's still there today. If it sells out, we'll be sad on your behalf, and then we'll grill something. | Still there, {{first_name}}. This is the last we'll say about it. |
| **cta** | Grab it now | Fine, show me | Take a look |

