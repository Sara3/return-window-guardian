# Data Plan for Return Window Guardian

## External Data Requirements

1. **Transaction Data** - Need to track purchases/transactions (PRD mentions Attain Finance but notes to use hardcoded placeholder data if unavailable)
2. **Return Policy Information** - Dynamic lookup of merchant return policies via web search
3. **Credit Card Protection Benefits** - Dynamic lookup of card return protection benefits via web search
4. **Email Order/Shipping/Delivery Confirmations** - Match emails to extract item details and actual delivery dates
5. **Notifications** - Create agent posts for alerts

## User Profile

**Does this agent collect user profile data?** No

This agent primarily tracks purchases and policies. It doesn't store user preferences beyond the purchases being tracked.

## Data Sources

### 1. Transaction Data (Hardcoded Placeholder)
Per PRD: "if we cant connect to attain finance yet. create hardcoded plaid transaction and have placeholder for connecting to attain finance later"

**Implementation**: Create a function `getTransactions()` that returns hardcoded sample transactions for now. Include placeholder comment for future Attain Finance integration.

**Sample Hardcoded Data**:
```typescript
{
  merchant: "Amazon",
  amount: 149.99,
  card_used: "Chase Sapphire Reserve",
  purchase_date: "2024-12-28",
  transaction_id: "txn_001"
}
```

### 2. Return Policy Information
**Tool**: `googlesearch/googleSearch` + `webcrawl/crawlUrl`
**Test Command**: `dreamer call-tool -s googlesearch -n googleSearch '{"query": "Amazon return policy 2024"}'`
**Sample Output**: (tested successfully)
```json
{
  "success": true,
  "results": [
    {"snippet": "30 days from date of delivery...", "url": "https://..."}
  ]
}
```

**Processing Strategy**:
- Use `googleSearch` to find merchant's return policy page
- Use `crawlUrl` to get full page content if needed
- Use `sdk.callLLM` to extract:
  - Return window days
  - Window starts from (delivery or purchase)
  - Source URL
  - Any special conditions

### 3. Credit Card Protection Benefits
**Tool**: `perplexity/sonarSearch` (best for synthesizing information)
**Test Command**: `dreamer call-tool -s perplexity -n sonarSearch '{"query": "Chase Sapphire Reserve return protection benefit details 2024"}'`
**Sample Output**: (tested successfully)
```json
{
  "success": true,
  "result": "The Chase Sapphire Reserve's Return Protection benefit reimburses the purchase price of eligible items up to $500 per item when the retailer refuses a return, covering purchases made within 90 days...",
  "sources": [...]
}
```

**Processing Strategy**:
- Use `sonarSearch` for comprehensive card benefit info
- Use `sdk.callLLM` to extract:
  - Protection window days
  - Maximum claim amount
  - Any exclusions

### 4. Email Confirmations
**Tool**: `mail/searchMessages` + `mail/getMessage`
**Test Command**: `dreamer call-tool -s mail -n searchMessages '{"account": "pubandsubs@gmail.com", "query": "order confirmation OR order shipped OR delivery confirmation", "maxResults": 5, "pageToken": null}'`
**Sample Output**: (tested successfully - found emails)

**Processing Strategy**:
- Search for emails matching tracked merchants
- Use `sdk.callLLM` to extract:
  - Item description
  - Order number
  - Delivery date (if present)
- Match to tracked purchases via merchant name and date proximity

### 5. Agent Posts
**Tool**: `posts/create_agent_post`
**Processing Strategy**:
- Use for new purchase tracking notifications
- Use for expiration alerts (priority: "urgent" for push notification)
- Use for weekly summaries

## Implementation Sequence

### Server Functions (implement and test in order):

1. **`getTrackedPurchases`** - Returns all tracked purchases from database
2. **`addPurchase`** - Manually add a purchase (for testing and user commands)
3. **`lookupReturnPolicy`** - Web search for merchant return policy
4. **`lookupCardProtection`** - Web search for card protection benefits
5. **`matchEmailTourchases`** - Search emails and match to purchases
6. **`checkExpiringPurchases`** - Find purchases with windows expiring in 2 days
7. **`sendExpirationAlert`** - Send alert for expiring purchase
8. **`generateWeeklySummary`** - Compile and send weekly summary

### Background Functions (cron triggers):

1. **`main`** (6 hour cron) - Check for new transactions, research policies
2. **`checkEmails`** (1 hour cron) - Search for shipping/delivery emails
3. **`dailyAlertCheck`** (daily 9am Pacific) - Check for 2-day expiration alerts
4. **`weeklySummary`** (Sunday 9am Pacific) - Send weekly summary

## Rejected Approaches

### Direct Attain Finance API
**Why Tested**: PRD mentions Attain Finance for transactions
**Why Rejected**: No Attain Finance tool available in tools/. PRD explicitly says to use hardcoded data as placeholder.

## Controlling Costs

1. **Policy Caching**: Store looked-up policies in database with `looked_up` timestamp. Re-use policies within 7 days unless holiday season (Nov-Jan) when we re-check more frequently.

2. **Email Deduplication**: Track processed email messageIds to avoid reprocessing.

3. **Batch Processing**: Process all pending items in single cron runs rather than individual triggers.

4. **Alert Deduplication**: Track sent alerts (store_alert_sent, card_alert_sent) to prevent repeat notifications.

5. **Smart Filtering**: Only search emails for merchants with tracked purchases, not all emails.

6. **LLM Call Optimization**: Use `FAST` model variant for extraction/classification. Only use `STANDARD` for complex synthesis.
