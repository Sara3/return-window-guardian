# OVERVIEW
Return Window Guardian is a background monitoring agent that protects every purchase by detecting orders from email, tracking deliveries, and monitoring return policy windows. It dynamically researches merchant return policies and credit card protection benefits via web search, then sends a single alert 2 days before any return window expires—ensuring the user never loses money to forgotten deadlines.

# KEY FEATURES
- **Email-first detection**: Automatically detects purchases from order confirmation, shipping, and delivery emails in real-time. No manual entry required for most online purchases.
- **Order lifecycle tracking**: Tracks the full journey from order confirmation → shipping → delivery, updating records as new emails arrive.
- **Dynamic policy lookup**: Web searches each merchant's return policy using Google Search and crawling, and card benefits via Perplexity API. Never relies on hardcoded data since policies change constantly.
- **Dual-window tracking**: Tracks both store return windows and card protection benefits, calculating expiration dates for each layer.
- **Refund verification**: Uses Attain Finance to verify refunds have posted for returned items.
- **Smart alerting**: Sends push notification 2 days before the earliest window closes—no spam, no early alerts.
- **Weekly summaries**: Sunday morning summary of all tracked purchases.
- **Late Delivery Incentive Scanner**: Scans all past emails (including trash) for Amazon late delivery compensation opportunities. Identifies eligible credits and promotional offers from delayed deliveries.

# IMPLEMENTATION DETAILS

## Database Schema
- **purchases**: Main tracking table with merchant, amount, card used, purchase/delivery dates, tracking info, store policy details, card protection details, calculated expiration dates, refund tracking, and alert flags
- **cached_policies**: Caches merchant return policies (7 day TTL, 3 days during holiday season Nov-Jan)
- **cached_card_protections**: Caches card protection benefits (7 day TTL, 3 days during holidays)
- **processed_emails**: Tracks which emails have been processed to avoid duplicates
- **sent_alerts**: Records alerts sent to prevent duplicate notifications
- **late_delivery_incentives**: Tracks Amazon late delivery compensation opportunities found in emails (order number, promised/actual delivery dates, incentive type/amount, claim status)

## Server Functions (Exported)
- `getTrackedPurchases`: Returns all currently tracked purchases with full policy details
- `addPurchase`: Manually add a purchase to track (merchant, amount, card, item description)
- `updatePurchaseStatus`: Mark purchase as returned, dismissed, expired, or refunded
- `lookupReturnPolicy`: Web search for merchant return policy (with caching)
- `lookupCardProtection`: Web search for card protection benefits (with caching)
- `getExpiringPurchases`: Get purchases expiring within N days
- `checkRefunds`: Check Attain Finance for refunds on returned purchases (cron)
- `dailyAlertCheck`: Check for purchases expiring in 2 days and send alerts (cron)
- `weeklySummary`: Generate and send weekly summary (cron)
- `handlePurchaseEmail`: Process incoming order/shipping/delivery emails (email trigger)
- `scanLateDeliveryIncentives`: Scan Gmail (including trash) for Amazon late delivery compensation
- `getLateDeliveryIncentives`: Get all found late delivery incentives with optional status filter

## Triggers (Cron + Email)
- **Daily 9am** (`checkRefunds`): Check for refunds on returned purchases via Attain Finance
- **Daily 9am** (`dailyAlertCheck`): Send 2-day expiration alerts
- **Sunday 9am** (`weeklySummary`): Send weekly summary of tracked purchases
- **Email triggers** (`handlePurchaseEmail`): Real-time processing of purchase-related emails:
  - Order confirmation emails (subject contains "order")
  - Shipping notification emails (subject contains "shipped")
  - Delivery confirmation emails (subject contains "delivered")
  - Receipt emails (subject contains "receipt")
  - Confirmation emails (subject contains "confirmation")

## Tools Used
- `finance` (MCP): Verify refunds have posted for returned purchases via Attain Finance
- `googlesearch`: Search for merchant return policies
- `webcrawl`: Crawl merchant policy pages for detailed info
- `perplexity`: Search for card protection benefit details
- `posts`: Send notifications and alerts to user

# DESIGN
Return Window Guardian has a protective, financial watchdog aesthetic with an ocean blue primary color (#0066CC). The design emphasizes clarity and timeliness, helping users see at a glance what's being watched and when action is needed.

## Widget View (Dashboard)
- Compact display showing total tracked purchases count
- Expiring soon alert badge (yellow/red based on urgency)
- Quick status indicator (all safe / X expiring)

## Full App View
- Header with ocean blue background, shield icon, and tagline
- Purchase cards showing:
  - Merchant name and item description
  - Purchase amount (in ocean blue)
  - Purchase date and card used
  - Delivery address (if available)
  - Store return policy (window days, start from, expiration date, days left badge)
  - Card protection (window days, max claim amount, expiration date, days left badge)
- Expiration badges: Green (safe), Yellow (7 days), Red (2 days or less)
- Action buttons: Mark Returned, Dismiss
- Add Purchase form for manual entry

## Notifications (Posts)
- **New tracking**: Shows merchant, amount, looked-up policy windows
- **Expiration alert (urgent)**: Push notification 2 days before deadline
- **Card protection alert (urgent)**: After store window passes, before card protection expires
- **Refund confirmed**: Notification when refund is verified
- **Weekly summary (normal)**: All tracked purchases, categorized by urgency

# FUTURE ENHANCEMENTS (Not Implemented)
- User commands via Sidekick ("What's expiring?", "Stop tracking [item]", etc.)
- Generate return instructions and claim documentation
- Extended holiday policy detection
- Carrier tracking API integration for real-time shipment status
- Deep links to merchant return portals

# HOW IT OPERATES

The agent is always-on and performs:

1. **Email-Based Order Detection**: Real-time email triggers detect and process purchase-related emails:
   - **Order confirmations**: Creates new purchase record, extracts item details, order number, amount
   - **Shipping notifications**: Updates existing order with tracking number and carrier
   - **Delivery confirmations**: Sets delivery date and recalculates return window expiration
   
   For each new purchase:
   - Web searches merchant return policy
   - Web searches card return protection (if card is known)
   - Creates tracking record with calculated expiration dates
   - Notifies user with "Now tracking" post

2. **Order Matching**: Shipping and delivery emails are intelligently matched to existing orders using:
   - Exact order number match
   - Merchant name + recent timeframe (14 days)
   - Amount matching as tiebreaker

3. **Refund Verification**: Daily at 9am, checks Attain Finance for refunds on purchases marked as "returned". When refund is found, confirms and notifies user.

4. **Alert Generation**: Daily at 9am, checks all tracked purchases. If any window expires in exactly 2 days, sends an urgent push notification. Marks alert sent to prevent repeats.

5. **Weekly Summary**: Every Sunday at 9am, compiles all tracked purchases into a summary showing items expiring soon vs. items safe for now.

# RULES FOLLOWED

1. **Email-first** — Purchase detection via order confirmation emails (real-time)
2. **Search, don't assume** — Every policy is looked up via web search
3. **Delivery date matters** — Many windows start from delivery, not purchase
4. **2 days only** — One alert, 2 days before expiration
5. **Both layers** — Always tracks store AND card protection
6. **Verify cards** — Checks if card actually has return protection (many dropped it)
7. **Conservative approach** — Unclear policy? Uses shorter window
8. **Holiday awareness** — Shorter cache during Nov-Jan (3 days vs 7 days) for holiday policy changes
9. **Refund verification** — Uses Attain Finance to confirm refunds posted
