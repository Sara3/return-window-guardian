import {
  backgroundFunction,
  EmailTriggerParamsSchema,
  type EmailTriggerParams,
  type ServerSdk,
  serverFunction,
} from "@dev-agents/sdk-server";
import { getUserTimeZone, Type } from "@dev-agents/sdk-shared";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { and, desc, eq, gte, isNull, lte, or } from "drizzle-orm";

import * as schema from "./schema";
import {
  cachedCardProtections,
  cachedPolicies,
  processedEmails,
  purchases,
  sentAlerts,
} from "./schema";

// Import tools
import { get_transactions } from "../tools/31ed98c5-7fd6-47d9-b21b-b55436a4076e.finance.js";
import { googleSearch } from "../tools/googlesearch.js";
import { searchMessages, getMessage } from "../tools/mail.js";
import { sonarSearch } from "../tools/perplexity.js";
import { create_agent_post } from "../tools/posts.js";
import { crawlUrl } from "../tools/webcrawl.js";

// Initialize dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);

// ============================================================================
// REFUND VERIFICATION (Attain Finance - used only for refund checking)
// ============================================================================

// Find a matching refund transaction for a returned purchase
async function findMatchingRefund(
  sdk: ServerSdk,
  purchase: {
    merchant: string;
    amount: number;
    updatedAt: Date | null;
  }
): Promise<{ transactionId: string; amount: number; date: string } | null> {
  const now = dayjs().tz(getUserTimeZone());
  // Look for refunds in the last 30 days
  const startDate = now.subtract(30, "day").format("YYYY-MM-DD");
  const endDate = now.format("YYYY-MM-DD");

  console.log(`findMatchingRefund: Looking for refund from ${purchase.merchant}`);

  try {
    const result = await get_transactions(sdk, {
      start_date: startDate,
      end_date: endDate,
      exclude_pending: true,
    });

    if (!result.transactions || result.transactions.length === 0) {
      return null;
    }

    // Look for credit transactions (negative amounts = money received)
    // that match the merchant and approximate amount
    const merchantLower = purchase.merchant.toLowerCase();
    const expectedAmount = purchase.amount; // in cents

    for (const txn of result.transactions) {
      // Refunds are negative amounts (credits)
      if (txn.amount >= 0) continue;

      const refundAmount = Math.abs(Math.round(txn.amount * 100)); // Convert to positive cents
      const descLower = txn.description.toLowerCase();

      // Check if merchant name appears in transaction description
      const merchantMatch =
        descLower.includes(merchantLower) ||
        merchantLower.includes(descLower.split(" ")[0] || "");

      // Check if amount is within 10% (to handle partial refunds, taxes, etc.)
      const amountDiff = Math.abs(refundAmount - expectedAmount);
      const amountMatch = amountDiff <= expectedAmount * 0.1 || amountDiff <= 500; // 10% or $5

      if (merchantMatch && amountMatch) {
        console.log(`findMatchingRefund: Found matching refund: ${txn.description} for ${refundAmount / 100}`);
        return {
          transactionId: txn.transaction_id,
          amount: refundAmount,
          date: txn.date,
        };
      }
    }

    return null;
  } catch (error) {
    console.error("findMatchingRefund: Failed to search transactions", error);
    return null;
  }
}

// Find the card used for a purchase by matching with Attain Finance transactions
async function findMatchingCard(
  sdk: ServerSdk,
  purchase: {
    merchant: string;
    amount: number;
    purchaseDate: Date | null;
  }
): Promise<string | null> {
  if (!purchase.purchaseDate) {
    console.log("findMatchingCard: No purchase date, cannot match");
    return null;
  }

  const purchaseDay = dayjs(purchase.purchaseDate).tz(getUserTimeZone());
  // Search a window of -3 to +3 days around the purchase date to account for timing differences
  const startDate = purchaseDay.subtract(3, "day").format("YYYY-MM-DD");
  const endDate = purchaseDay.add(3, "day").format("YYYY-MM-DD");

  console.log(`findMatchingCard: Looking for ${purchase.merchant} $${purchase.amount / 100} around ${purchaseDay.format("YYYY-MM-DD")}`);

  try {
    const result = await get_transactions(sdk, {
      start_date: startDate,
      end_date: endDate,
      exclude_pending: false,
    });

    if (!result.transactions || result.transactions.length === 0) {
      console.log("findMatchingCard: No transactions found in date range");
      return null;
    }

    const merchantLower = purchase.merchant.toLowerCase();
    const expectedAmount = purchase.amount; // in cents

    // First pass: look for exact merchant name match
    for (const txn of result.transactions) {
      // Only match debit transactions (positive amounts = money spent)
      if (txn.amount <= 0) continue;

      const txnAmountCents = Math.round(txn.amount * 100);
      const descLower = txn.description.toLowerCase();

      // Check for merchant name match
      const merchantMatch =
        descLower.includes(merchantLower) ||
        merchantLower.includes(descLower.split(" ")[0] || "") ||
        // Handle common variations
        (merchantLower.includes("amazon") && descLower.includes("amzn")) ||
        (merchantLower.includes("amzn") && descLower.includes("amazon"));

      // Check if amount matches within $1 (to account for small fees/taxes)
      const amountMatch = Math.abs(txnAmountCents - expectedAmount) <= 100;

      if (merchantMatch && amountMatch) {
        console.log(`findMatchingCard: Found match! ${txn.description} on ${txn.account_name}`);
        return txn.account_name;
      }
    }

    // Second pass: look for amount-only match if merchant didn't match (fuzzy)
    for (const txn of result.transactions) {
      if (txn.amount <= 0) continue;

      const txnAmountCents = Math.round(txn.amount * 100);

      // Exact amount match
      if (txnAmountCents === expectedAmount) {
        console.log(`findMatchingCard: Found amount-only match! ${txn.description} on ${txn.account_name}`);
        return txn.account_name;
      }
    }

    console.log("findMatchingCard: No matching transaction found");
    return null;
  } catch (error) {
    console.error("findMatchingCard: Failed to search transactions", error);
    return null;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function calculateExpiration(
  purchaseDate: Date,
  deliveryDate: Date | null,
  windowDays: number,
  startsFrom: string | null
): Date {
  const startDate =
    startsFrom === "delivery" && deliveryDate ? deliveryDate : purchaseDate;
  return dayjs(startDate).tz(getUserTimeZone()).add(windowDays, "day").toDate();
}

// Check if cache is still valid (7 days, or 3 days in holiday season Nov-Jan)
function isCacheValid(lookedUpAt: Date): boolean {
  const now = dayjs().tz(getUserTimeZone());
  const month = now.month() + 1; // dayjs months are 0-indexed
  const cacheDays = month >= 11 || month <= 1 ? 3 : 7; // Holiday season = shorter cache
  const cacheExpiry = dayjs(lookedUpAt)
    .tz(getUserTimeZone())
    .add(cacheDays, "day");
  return now.isBefore(cacheExpiry);
}

// ============================================================================
// SERVER FUNCTIONS
// ============================================================================

/**
 * Match a purchase to a transaction from Attain Finance
 * Returns the account_name from the matching transaction, or null if no match
 */
function matchPurchaseToTransaction(
  purchase: { merchant: string; amount: number; purchaseDate: Date | null },
  transactions: Array<{ date: string; amount: number; description: string; account_name: string }>
): string | null {
  if (!purchase.purchaseDate || transactions.length === 0) return null;
  
  const purchaseDate = dayjs(purchase.purchaseDate).tz(getUserTimeZone());
  const purchaseAmountDollars = purchase.amount / 100; // Convert cents to dollars
  
  // Normalize merchant name for matching
  const normalizeName = (name: string) => 
    name.toLowerCase()
      .replace(/[^a-z0-9]/g, '') // Remove special chars
      .replace(/amazon|amzn|mktpl|marketplace/g, 'amazon'); // Normalize Amazon variants
  
  const normalizedMerchant = normalizeName(purchase.merchant);
  
  // Find transactions within 5 days of purchase date that match amount
  const candidates = transactions.filter(tx => {
    const txDate = dayjs(tx.date).tz(getUserTimeZone());
    const daysDiff = Math.abs(txDate.diff(purchaseDate, 'day'));
    
    // Must be within 5 days
    if (daysDiff > 5) return false;
    
    // Amount must match (transactions are negative for purchases, so use absolute value)
    const txAmount = Math.abs(tx.amount);
    const amountDiff = Math.abs(txAmount - purchaseAmountDollars);
    
    // Allow small difference for rounding (within $0.05)
    return amountDiff < 0.05;
  });
  
  if (candidates.length === 0) return null;
  
  // If only one candidate, use it
  const firstCandidate = candidates[0];
  if (candidates.length === 1 && firstCandidate) {
    console.log(`matchPurchaseToTransaction: Matched ${purchase.merchant} $${purchaseAmountDollars} to ${firstCandidate.description} on ${firstCandidate.account_name}`);
    return firstCandidate.account_name;
  }
  
  // Multiple candidates - try to match by merchant name
  const normalizedDesc = (desc: string) => normalizeName(desc);
  
  for (const tx of candidates) {
    if (normalizedDesc(tx.description).includes(normalizedMerchant) || 
        normalizedMerchant.includes(normalizedDesc(tx.description).slice(0, 6))) {
      console.log(`matchPurchaseToTransaction: Matched ${purchase.merchant} to ${tx.description} on ${tx.account_name}`);
      return tx.account_name;
    }
  }
  
  // Fallback: return the closest date match
  const sorted = candidates.sort((a, b) => {
    const aDiff = Math.abs(dayjs(a.date).tz(getUserTimeZone()).diff(purchaseDate, 'day'));
    const bDiff = Math.abs(dayjs(b.date).tz(getUserTimeZone()).diff(purchaseDate, 'day'));
    return aDiff - bDiff;
  });
  
  const bestMatch = sorted[0];
  if (bestMatch) {
    console.log(`matchPurchaseToTransaction: Fuzzy matched ${purchase.merchant} to ${bestMatch.description} on ${bestMatch.account_name}`);
    return bestMatch.account_name;
  }
  
  return null;
}

/**
 * Get all tracked purchases
 */
export const getTrackedPurchases = serverFunction({
  description: "Get all tracked purchases with their return windows",
  params: Type.Object({
    _placeholder: Type.Optional(Type.String()),
  }),
  exported: true,
  execute: async (sdk: ServerSdk) => {
    const db = sdk.db<typeof schema>();
    console.log("getTrackedPurchases: Fetching all purchases");

    const allPurchases = await db
      .select()
      .from(purchases)
      .where(
        or(
          eq(purchases.status, "tracking"),
          eq(purchases.status, "return_initiated"),
          eq(purchases.status, "resolved")
        )
      )
      .orderBy(desc(purchases.purchaseDate));

    console.log(`getTrackedPurchases: Found ${allPurchases.length} purchases`);

    // Fetch transactions from Attain Finance to match cards
    let transactions: Array<{ date: string; amount: number; description: string; account_name: string }> = [];
    try {
      // Get transactions for the last 90 days to cover most purchases
      const now = dayjs().tz(getUserTimeZone());
      const startDate = now.subtract(90, 'day').format('YYYY-MM-DD');
      const endDate = now.format('YYYY-MM-DD');
      
      const txResult = await get_transactions(sdk, { start_date: startDate, end_date: endDate });
      transactions = txResult.transactions || [];
      console.log(`getTrackedPurchases: Fetched ${transactions.length} transactions for card matching`);
    } catch (error) {
      console.error("getTrackedPurchases: Failed to fetch transactions for card matching", error);
    }

    // Helper to safely convert date to ISO string
    const safeToISOString = (date: Date | null | undefined): string | null => {
      if (!date) return null;
      try {
        const iso = date.toISOString();
        // Check if the date is valid (Invalid Date returns NaN for getTime)
        if (isNaN(date.getTime())) return null;
        return iso;
      } catch {
        console.error("getTrackedPurchases: Invalid date encountered", date);
        return null;
      }
    };

    return allPurchases.map((p) => {
      // Try to match to a transaction to get the actual card used
      let cardUsed = p.cardUsed;
      if (transactions.length > 0) {
        const matchedCard = matchPurchaseToTransaction(
          { merchant: p.merchant, amount: p.amount, purchaseDate: p.purchaseDate },
          transactions
        );
        if (matchedCard) {
          cardUsed = matchedCard;
        }
      }
      
      return {
        id: p.id,
        merchant: p.merchant,
        amount: formatCurrency(p.amount),
        amountCents: p.amount,
        cardUsed: cardUsed,
        purchaseDate: safeToISOString(p.purchaseDate),
        itemDescription: p.itemDescription,
        deliveryDate: safeToISOString(p.deliveryDate),
        deliveryConfirmed: p.deliveryConfirmed ?? false,
        deliveryAddress: p.deliveryAddress,
        trackingNumber: p.trackingNumber,
        carrier: p.carrier,
        storePolicy: {
          windowDays: p.storePolicyWindowDays,
          startsFrom: p.storePolicyStartsFrom,
          sourceUrl: p.storePolicySourceUrl,
          expires: safeToISOString(p.storeExpires),
        },
        cardProtection: {
          windowDays: p.cardProtectionWindowDays,
          maxClaim: p.cardProtectionMaxClaim
            ? formatCurrency(p.cardProtectionMaxClaim)
            : null,
          sourceUrl: p.cardProtectionSourceUrl,
          expires: safeToISOString(p.cardExpires),
        },
        storeAlertSent: p.storeAlertSent,
        cardAlertSent: p.cardAlertSent,
        status: p.status,
      };
    });
  },
});

/**
 * Scan recent emails for order confirmations, shipping, and delivery notifications
 * This processes historical emails that may have been missed by triggers
 */
export const scanRecentEmails = backgroundFunction({
  description:
    "Scan Gmail for recent order confirmations, shipping updates, and delivery notifications",
  params: Type.Object({
    daysBack: Type.Number({
      description: "How many days back to search (default: 30)",
      minimum: 1,
      maximum: 90,
      default: 30,
    }),
  }),
  exported: true,
  execute: async (sdk: ServerSdk, params: { daysBack: number }) => {
    const daysBack = params.daysBack || 30;
    const db = sdk.db<typeof schema>();
    const now = dayjs().tz(getUserTimeZone());
    const startDate = now.subtract(daysBack, "day").format("YYYY-MM-DD");

    console.log(`scanRecentEmails: Scanning emails from ${startDate} to now`);

    // Get all connected email accounts
    const { listAccounts } = await import("../tools/mail.js");
    let accounts: string[] = [];
    try {
      const accountsResult = await listAccounts(sdk, {});
      if (accountsResult.accounts && accountsResult.accounts.length > 0) {
        accounts = accountsResult.accounts.map((a: { email: string }) => a.email);
        console.log(`scanRecentEmails: Found ${accounts.length} connected accounts: ${accounts.join(", ")}`);
      }
    } catch (error) {
      console.error("scanRecentEmails: Failed to list accounts", error);
    }

    if (accounts.length === 0) {
      console.error("scanRecentEmails: No email accounts found");
      return;
    }

    // Search queries for different types of purchase emails - expanded to catch more patterns
    const searchQueries = [
      `(subject:order OR subject:ordered OR subject:confirmation) after:${startDate}`,
      `(subject:shipped OR subject:shipping OR subject:shipment) after:${startDate}`,
      `(subject:delivered OR subject:delivery OR subject:"on its way") after:${startDate}`,
      `(subject:receipt) after:${startDate}`,
      `(from:amazon) after:${startDate}`,
      `(subject:tracking) after:${startDate}`,
    ];

    let processedCount = 0;
    let newPurchases = 0;
    let updatedPurchases = 0;

    // Loop through all connected accounts
    for (const account of accounts) {
      console.log(`scanRecentEmails: Scanning account ${account}`);

      for (const query of searchQueries) {
        try {
          console.log(`scanRecentEmails: Searching ${account} with query: ${query}`);

          const results = await searchMessages(sdk, {
            account,
            query,
            maxResults: 50,
            pageToken: null,
          });

          console.log(
            `scanRecentEmails: Found ${results.messages?.length ?? 0} messages in ${account}`
          );

          for (const msgSummary of results.messages ?? []) {
            // Check if already processed
            const existing = await db
              .select()
              .from(processedEmails)
              .where(eq(processedEmails.messageId, msgSummary.id))
              .limit(1);

            if (existing.length > 0) {
              console.log(
                `scanRecentEmails: Already processed email ${msgSummary.id}`
              );
              continue;
            }

            // Get full message
            const fullMessage = await getMessage(sdk, {
              account,
              messageId: msgSummary.id,
            });

            if (!fullMessage?.message) continue;

            const email = fullMessage.message;

            // Extract email content - body is string | null
            const emailContent = email.body || "";

          // Use LLM to extract ALL purchase info - supports MULTIPLE orders per email
          const extractedRaw = await sdk.callLLM(
            `Analyze this email to extract ALL purchase/order information.

CRITICAL: One email may contain MULTIPLE separate items/orders that ship separately.
For example, Amazon emails often say "Ordered: [Item 1] and 1 more item" or list multiple items.
Look for phrases like "and 1 more item", "Order 1 of 2", "Shipment 1", "Shipment 2", etc.
EACH ITEM that ships separately should be its own entry in the "orders" array.

From: ${email.sender}
Subject: ${email.subject}
Body: ${emailContent.slice(0, 12000)}

Today's date is ${now.format("YYYY-MM-DD")}.

For EACH order found, extract:
1. Order number (e.g., "114-9558898-8264233" for Amazon) - DIFFERENT orders have DIFFERENT order numbers
2. Item description - what specific product(s) in THIS order? Be detailed.
3. Amount in dollars - CRITICAL: Look for "Grand Total:", "Order Total:", "Total:" near each order.
   - Amazon emails show "Grand Total: $X.XX" for each order - extract that number
   - If you see "$189.65" or similar, extract 189.65 as the number
   - Each order has its OWN total - don't use 0 if a price is visible
4. Expected delivery date for THIS order (format: YYYY-MM-DD)
5. Confirmed delivery date - ONLY if THIS order was already delivered (format: YYYY-MM-DD)
6. Tracking number (if available for this shipment)
7. Carrier (UPS, FedEx, USPS, Amazon, etc.)

Also determine:
- Email type: "order_confirmation", "shipping", "delivery", or "not_purchase"
- Merchant/store name (e.g., Amazon, Target, Nike)
- Delivery address (usually same for all orders)
- Payment method: Look for "Visa ending in 1234", "Mastercard ****5678", "Amex ...4321", etc.
  Extract the card type (Visa, Mastercard, Amex, Discover, etc.) and last 4 digits.
  If payment method is not visible in the email, use EMPTY STRING "" for both cardType and lastFour.
  Do NOT use placeholder values like "UNKNOWN" or "<UNKNOWN>".

If this is NOT a purchase-related email (marketing, newsletter, etc.), set emailType to "not_purchase" and return empty orders array.
For text fields you cannot determine, use empty string "". Do NOT use placeholders like "UNKNOWN" or "<UNKNOWN>".
For amountDollars, ONLY use 0 if no price is visible - otherwise extract the actual price.

REMEMBER: Return ALL orders found. Do NOT combine multiple orders into one.`,
            Type.Object({
              emailType: Type.String(),
              merchant: Type.String(),
              deliveryAddress: Type.String(),
              paymentCardType: Type.String({ default: "" }), // Visa, Mastercard, Amex, Discover, etc. Use "" if not visible
              paymentCardLastFour: Type.String({ default: "" }), // Last 4 digits like "1234". Use "" if not visible
              orders: Type.Array(Type.Object({
                orderNumber: Type.String(),
                itemDescription: Type.String(),
                amountDollars: Type.Number({ default: 0 }),
                expectedDeliveryDate: Type.String(),
                confirmedDeliveryDate: Type.String(),
                trackingNumber: Type.String(),
                carrier: Type.String(),
              })),
            }),
            { modelVariant: "STANDARD" } // Use STANDARD for better multi-order extraction
          );

          if (!extractedRaw) continue;

          const emailType = extractedRaw.emailType as string;
          const merchant = extractedRaw.merchant as string | null;
          const deliveryAddress = (extractedRaw.deliveryAddress as string) || null;
          
          // Clean card info - filter out UNKNOWN placeholders
          const rawCardType = (extractedRaw.paymentCardType as string) || "";
          const rawCardLastFour = (extractedRaw.paymentCardLastFour as string) || "";
          const isValidCard = rawCardType && rawCardLastFour && 
            !rawCardType.toLowerCase().includes("unknown") && 
            !rawCardLastFour.toLowerCase().includes("unknown");
          
          // Format card used like "Visa ****1234"
          const cardUsed = isValidCard 
            ? `${rawCardType} ****${rawCardLastFour}` 
            : null;
          
          const orders = (extractedRaw.orders as Array<{
            orderNumber: string;
            itemDescription: string;
            amountDollars: number;
            expectedDeliveryDate: string;
            confirmedDeliveryDate: string;
            trackingNumber: string;
            carrier: string;
          }>) || [];

          // Mark as processed
          await db.insert(processedEmails).values({
            messageId: msgSummary.id,
            emailType: emailType,
            processedAt: now.toDate(),
          });

          processedCount++;

          if (emailType === "not_purchase" || !merchant) {
            console.log(
              `scanRecentEmails: Email ${msgSummary.id} is not purchase-related`
            );
            continue;
          }

          console.log(`scanRecentEmails: Found ${orders.length} order(s) from ${merchant}`);

          // Process EACH order separately
          for (const order of orders) {
            const orderNumber = order.orderNumber || null;
            const itemDescription = order.itemDescription || null;
            const trackingNumber = order.trackingNumber || null;
            const carrier = order.carrier || null;
            const amountCents = order.amountDollars ? Math.round(order.amountDollars * 100) : 0;

            // Skip $0 purchases - nothing to refund (e.g., audiobooks bought with credits)
            if (amountCents <= 0) {
              console.log(`scanRecentEmails: Skipping $0 purchase: ${itemDescription || orderNumber}`);
              continue;
            }

            // Parse delivery dates for this order
            let deliveryDate: Date | null = null;
            if (order.confirmedDeliveryDate) {
              const parsed = dayjs(order.confirmedDeliveryDate).tz(getUserTimeZone());
              if (parsed.isValid()) {
                deliveryDate = parsed.toDate();
              }
            } else if (order.expectedDeliveryDate) {
              const parsed = dayjs(order.expectedDeliveryDate).tz(getUserTimeZone());
              if (parsed.isValid()) {
                deliveryDate = parsed.toDate();
              }
            }

            // Handle based on email type
            if (emailType === "order_confirmation") {
              // Create new purchase - use already calculated amountCents

              // Check for existing purchase with same order number
              if (orderNumber) {
                const existingOrder = await db
                  .select()
                  .from(purchases)
                  .where(eq(purchases.orderNumber, orderNumber))
                  .limit(1);

                if (existingOrder.length > 0) {
                  console.log(
                    `scanRecentEmails: Order ${orderNumber} already exists`
                  );
                  continue;
                }
              }

              const insertResult = await db.insert(purchases).values({
                merchant: merchant ?? "Unknown",
                amount: amountCents,
                cardUsed: cardUsed,
                purchaseDate: now.toDate(),
                orderNumber: orderNumber,
                itemDescription: itemDescription,
                deliveryDate: deliveryDate,
                deliveryAddress: deliveryAddress,
                trackingNumber: trackingNumber,
                carrier: carrier,
                status: "tracking",
                createdAt: now.toDate(),
                updatedAt: now.toDate(),
              });

              newPurchases++;
              console.log(
                `scanRecentEmails: Created purchase for ${merchant} - ${itemDescription}`
              );

              // Look up policies for this new purchase
              const purchaseId = insertResult.lastInsertRowid as number;
              if (purchaseId && merchant) {
                await lookupAndApplyReturnPolicy(
                  sdk,
                  db,
                  purchaseId,
                  merchant,
                  now.toDate(),
                  deliveryDate,
                  null
                );

                // Try to match the card from Attain Finance
                try {
                  const cardName = await findMatchingCard(sdk, {
                    merchant: merchant,
                    amount: amountCents,
                    purchaseDate: now.toDate(),
                  });
                  if (cardName) {
                    await db
                      .update(purchases)
                      .set({ cardUsed: cardName })
                      .where(eq(purchases.id, purchaseId));
                    console.log(`scanRecentEmails: Matched card ${cardName} for purchase ${purchaseId}`);
                  }
                } catch (cardError) {
                  console.error(`scanRecentEmails: Failed to match card for purchase ${purchaseId}`, cardError);
                }
              }
            } else if (emailType === "shipping" || emailType === "delivery") {
              // Find matching purchase to update
              let matchingPurchase = null;

              if (orderNumber) {
                const byOrder = await db
                  .select()
                  .from(purchases)
                  .where(eq(purchases.orderNumber, orderNumber))
                  .limit(1);
                if (byOrder.length > 0) matchingPurchase = byOrder[0];
              }

              if (!matchingPurchase && merchant) {
                const byMerchant = await db
                  .select()
                  .from(purchases)
                  .where(eq(purchases.merchant, merchant))
                  .orderBy(desc(purchases.purchaseDate))
                  .limit(1);
                if (byMerchant.length > 0) matchingPurchase = byMerchant[0];
              }

              if (matchingPurchase) {
                const updates: Record<string, unknown> = {};

                if (trackingNumber && !matchingPurchase.trackingNumber) {
                  updates.trackingNumber = trackingNumber;
                }
                if (carrier && !matchingPurchase.carrier) {
                  updates.carrier = carrier;
                }
                if (deliveryAddress && !matchingPurchase.deliveryAddress) {
                  updates.deliveryAddress = deliveryAddress;
                }
                if (itemDescription && !matchingPurchase.itemDescription) {
                  updates.itemDescription = itemDescription;
                }

                // Update delivery date for both shipping (expected) and delivery (confirmed)
                // Confirmed date overrides expected date
                const isConfirmedDelivery = emailType === "delivery" && order.confirmedDeliveryDate;
                const shouldUpdateDate = isConfirmedDelivery || (deliveryDate && !matchingPurchase.deliveryDate);

                if (shouldUpdateDate && deliveryDate) {
                  updates.deliveryDate = deliveryDate;
                  if (isConfirmedDelivery) {
                    updates.deliveryConfirmed = true;
                  }
                  console.log(`scanRecentEmails: Setting delivery date to ${dayjs(deliveryDate).tz(getUserTimeZone()).format("YYYY-MM-DD")} (${isConfirmedDelivery ? "confirmed" : "expected"})`);

                  // Recalculate store expiry if policy starts from delivery
                  if (
                    matchingPurchase.storePolicyStartsFrom === "delivery" &&
                    matchingPurchase.storePolicyWindowDays
                  ) {
                    updates.storeExpires = dayjs(deliveryDate)
                      .tz(getUserTimeZone())
                      .add(matchingPurchase.storePolicyWindowDays, "day")
                      .toDate();
                  }
                }

                if (Object.keys(updates).length > 0) {
                  updates.updatedAt = now.toDate();
                  await db
                    .update(purchases)
                    .set(updates)
                    .where(eq(purchases.id, matchingPurchase.id));
                  updatedPurchases++;
                  console.log(
                    `scanRecentEmails: Updated purchase ${matchingPurchase.id} with ${emailType} info`
                  );
                }
              }
            }
          } // End of orders loop
        }
          } catch (error) {
            console.error(`scanRecentEmails: Error with query "${query}":`, error);
          }
        } // end of query loop
      } // end of accounts loop

    // Post a notification with results
    if (newPurchases > 0 || updatedPurchases > 0) {
      await create_agent_post(sdk, {
        shortMessage: "Email Scan Complete",
        attachments: [{
          type: "markdown",
          content: `Scanned ${processedCount} emails from the last ${daysBack} days:\n- ${newPurchases} new purchases added\n- ${updatedPurchases} purchases updated with shipping/delivery info`,
        }],
        duration: "read_once",
        priority: "normal",
      });
    }

  },
});

/**
 * Manually add a purchase (for testing or user command "Add [item]")
 */
export const addPurchase = serverFunction({
  description:
    "Manually add a purchase to track. Returns the created purchase ID.",
  params: Type.Object({
    merchant: Type.String({ minLength: 1, description: "Merchant name" }),
    amount: Type.Number({
      minimum: 0.01,
      description: "Purchase amount in dollars",
    }),
    cardUsed: Type.Optional(
      Type.String({ description: "Credit card used for purchase" })
    ),
    itemDescription: Type.Optional(Type.String({ description: "Item details" })),
    purchaseDate: Type.Optional(
      Type.String({ description: "Purchase date in ISO format" })
    ),
  }),
  exported: true,
  execute: async (
    sdk: ServerSdk,
    { merchant, amount, cardUsed, itemDescription, purchaseDate }
  ) => {
    const db = sdk.db<typeof schema>();
    const now = dayjs().tz(getUserTimeZone());

    const parsedDate = purchaseDate
      ? dayjs(purchaseDate).tz(getUserTimeZone()).toDate()
      : now.toDate();

    console.log(
      `addPurchase: Adding ${merchant} purchase for ${formatCurrency(amount * 100)}`
    );

    const insertResult = await db
      .insert(purchases)
      .values({
        transactionId: `manual_${Date.now()}`,
        merchant,
        amount: Math.round(amount * 100), // Convert to cents
        cardUsed: cardUsed ?? null,
        itemDescription: itemDescription ?? null,
        purchaseDate: parsedDate,
        createdAt: now.toDate(),
        updatedAt: now.toDate(),
      })
      .returning();

    const inserted = insertResult[0];
    if (!inserted) {
      return { success: false, purchaseId: null };
    }

    console.log(`addPurchase: Created purchase ID ${inserted.id}`);

    // If no card was provided, try to match from Attain Finance
    if (!cardUsed) {
      try {
        const cardName = await findMatchingCard(sdk, {
          merchant: merchant,
          amount: Math.round(amount * 100),
          purchaseDate: parsedDate,
        });
        if (cardName) {
          await db
            .update(purchases)
            .set({ cardUsed: cardName })
            .where(eq(purchases.id, inserted.id));
          console.log(`addPurchase: Matched card ${cardName} for purchase ${inserted.id}`);
        }
      } catch (cardError) {
        console.error(`addPurchase: Failed to match card for purchase ${inserted.id}`, cardError);
      }
    }

    return { success: true, purchaseId: inserted.id };
  },
});

/**
 * Scan a receipt image and extract purchase details using vision LLM
 */
export const scanReceipt = serverFunction({
  description:
    "Scan a receipt image and extract purchase details (merchant, amount, items, date)",
  params: Type.Object({
    imageDataUrl: Type.String({
      description: "Base64 data URL of the receipt image (e.g., data:image/jpeg;base64,...)",
    }),
  }),
  exported: true,
  execute: async (sdk: ServerSdk, { imageDataUrl }) => {
    console.log("scanReceipt: Processing receipt image");

    const today = dayjs().tz(getUserTimeZone()).format("YYYY-MM-DD");

    try {
      // Use vision-capable LLM to extract receipt data
      const extracted = await sdk.callLLM(
        `Analyze this receipt image and extract the purchase details.

Today's date is ${today}.

Extract:
1. Merchant/store name - the business name on the receipt
2. Total amount in dollars - the final total paid (look for "Total", "Grand Total", "Amount Due")
3. Item descriptions - list the main items purchased (summarize if many items)
4. Purchase date - the date on the receipt (format as YYYY-MM-DD)
5. Payment method - if visible (e.g., "Visa ending in 1234", "Cash", "Mastercard")

If any field cannot be determined from the image, return null for that field.
For items, combine similar items and summarize if there are more than 5 items.

Receipt image: ${imageDataUrl}`,
        Type.Object({
          merchant: Type.Union([Type.String(), Type.Null()]),
          amountDollars: Type.Union([Type.Number(), Type.Null()]),
          itemDescription: Type.Union([Type.String(), Type.Null()]),
          purchaseDate: Type.Union([Type.String(), Type.Null()]),
          paymentMethod: Type.Union([Type.String(), Type.Null()]),
        }),
        { modelVariant: "STANDARD" } // Use STANDARD for better vision accuracy
      );

      if (!extracted) {
        console.error("scanReceipt: Failed to extract data from image");
        return {
          success: false,
          error: "Could not read the receipt. Please try a clearer image.",
        };
      }

      console.log(`scanReceipt: Extracted merchant=${extracted.merchant}, amount=${extracted.amountDollars}`);

      return {
        success: true,
        data: {
          merchant: extracted.merchant,
          amount: extracted.amountDollars,
          itemDescription: extracted.itemDescription,
          purchaseDate: extracted.purchaseDate,
          cardUsed: extracted.paymentMethod,
        },
      };
    } catch (error) {
      console.error("scanReceipt: Error processing receipt", error);
      return {
        success: false,
        error: "Failed to process receipt image. Please try again.",
      };
    }
  },
});

/**
 * Update purchase status
 */
export const updatePurchaseStatus = serverFunction({
  description:
    "Update a purchase status (e.g., mark as returned, dismissed, or expired)",
  params: Type.Object({
    purchaseId: Type.Number({ description: "Purchase ID" }),
    status: Type.Union([
      Type.Literal("tracking"),
      Type.Literal("return_initiated"),
      Type.Literal("returned"),
      Type.Literal("expired"),
      Type.Literal("dismissed"),
      Type.Literal("refunded"),
      Type.Literal("resolved"),
    ]),
    refundExpectedAmount: Type.Optional(
      Type.Number({ description: "Expected refund amount in dollars (for returned items)" })
    ),
  }),
  exported: true,
  execute: async (sdk: ServerSdk, { purchaseId, status, refundExpectedAmount }) => {
    const db = sdk.db<typeof schema>();
    console.log(`updatePurchaseStatus: Setting purchase ${purchaseId} to ${status}`);

    const updates: Record<string, unknown> = {
      status,
      updatedAt: dayjs().tz(getUserTimeZone()).toDate(),
    };

    // If marking as returned, set expected refund amount
    if (status === "returned" && refundExpectedAmount) {
      updates.refundExpectedAmount = Math.round(refundExpectedAmount * 100);
    }

    await db
      .update(purchases)
      .set(updates)
      .where(eq(purchases.id, purchaseId));

    return { success: true };
  },
});

/**
 * Reset database for testing - clears all purchases and processed emails
 */
export const resetDatabase = serverFunction({
  description: "Reset database for testing - clears all purchases and processed emails to allow rescanning",
  params: Type.Object({}),
  exported: true,
  execute: async (sdk: ServerSdk) => {
    const db = sdk.db<typeof schema>();
    console.log("resetDatabase: Clearing all data for fresh rescan...");

    // Delete all processed emails so they can be rescanned
    await db.delete(processedEmails);
    console.log("resetDatabase: Cleared processed emails");

    // Delete all purchases
    await db.delete(purchases);
    console.log("resetDatabase: Cleared purchases");

    // Delete all sent alerts
    await db.delete(sentAlerts);
    console.log("resetDatabase: Cleared sent alerts");

    return { 
      success: true, 
      message: "Database reset. Run scanRecentEmails to rescan." 
    };
  },
});

/**
 * Fix deliveryConfirmed for existing purchases
 * This is a one-time migration to set deliveryConfirmed=true for purchases that have delivery emails
 */
export const fixDeliveryConfirmed = serverFunction({
  description: "Fix deliveryConfirmed flag for existing purchases that have delivery dates in the past",
  params: Type.Object({}),
  exported: true,
  execute: async (sdk: ServerSdk) => {
    const db = sdk.db<typeof schema>();
    const now = dayjs().tz(getUserTimeZone());
    
    console.log("fixDeliveryConfirmed: Finding purchases that need updating...");
    
    // Get all purchases with a delivery date that is today or in the past
    // These are clearly delivered, so set deliveryConfirmed = true
    const allPurchases = await db.select().from(purchases);
    
    let updatedCount = 0;
    for (const p of allPurchases) {
      if (p.deliveryDate && !p.deliveryConfirmed) {
        const deliveryDate = dayjs(p.deliveryDate).tz(getUserTimeZone());
        // If delivery date is today or in the past, mark as confirmed
        if (deliveryDate.isBefore(now, "day") || deliveryDate.isSame(now, "day")) {
          await db
            .update(purchases)
            .set({ 
              deliveryConfirmed: true,
              updatedAt: now.toDate()
            })
            .where(eq(purchases.id, p.id));
          updatedCount++;
          console.log(`fixDeliveryConfirmed: Updated purchase ${p.id} - ${p.itemDescription}`);
        }
      }
    }
    
    console.log(`fixDeliveryConfirmed: Updated ${updatedCount} purchases`);
    return { 
      success: true, 
      updatedCount,
      message: `Set deliveryConfirmed=true for ${updatedCount} purchases with past delivery dates`
    };
  },
});

/**
 * Initiate a return - sends notification with order details and return instructions
 * Option B: User-Initiated Local Execution (Simplest approach)
 */
export const initiateReturn = serverFunction({
  description:
    "Mark a purchase for return and send notification with order details and return instructions",
  params: Type.Object({
    purchaseId: Type.Number({ description: "Purchase ID to return" }),
    returnReason: Type.String({
      description: "Reason for return (e.g., 'defective', 'wrong item', 'changed mind')",
    }),
    additionalNotes: Type.Optional(
      Type.String({ description: "Any additional notes about the return" })
    ),
  }),
  exported: true,
  execute: async (sdk: ServerSdk, { purchaseId, returnReason, additionalNotes }) => {
    const db = sdk.db<typeof schema>();
    const now = dayjs().tz(getUserTimeZone());

    console.log(`initiateReturn: Starting return for purchase ${purchaseId}`);

    // Get the purchase details
    const purchaseResult = await db
      .select()
      .from(purchases)
      .where(eq(purchases.id, purchaseId))
      .limit(1);

    const purchase = purchaseResult[0];
    if (!purchase) {
      console.error(`initiateReturn: Purchase ${purchaseId} not found`);
      return { success: false, error: "Purchase not found" };
    }

    // Check if return window is still open
    const storeExpired = purchase.storeExpires && dayjs(purchase.storeExpires).tz(getUserTimeZone()).isBefore(now);
    const cardExpired = purchase.cardExpires && dayjs(purchase.cardExpires).tz(getUserTimeZone()).isBefore(now);

    if (storeExpired && cardExpired) {
      console.log(`initiateReturn: Both windows expired for purchase ${purchaseId}`);
      return {
        success: false,
        error: "Both store return window and card protection have expired",
      };
    }

    // Generate merchant-specific return info
    const merchantLower = purchase.merchant.toLowerCase();
    let returnLinks = "";
    let automatedReturnOption = "";

    if (merchantLower.includes("amazon")) {
      returnLinks = `
**Quick Links:**
- [Order History](https://www.amazon.com/gp/css/order-history)
- [Returns Center](https://www.amazon.com/gp/css/returns/homepage.html)
${purchase.orderNumber ? `- [This Order](https://www.amazon.com/gp/your-account/order-details?orderID=${purchase.orderNumber})` : ""}`;

      automatedReturnOption = `
---

**🤖 Want me to return this for you?**

Run the Amazon return automation script:
\`\`\`
cd amazonRefund && ./run.sh
\`\`\`

This will open a browser and handle the return process automatically.
*(Make sure you're logged into Amazon in Chrome first)*`;

    } else if (merchantLower.includes("walmart")) {
      returnLinks = `
**Quick Links:**
- [Order History](https://www.walmart.com/orders)
- [Start a Return](https://www.walmart.com/help/article/return-items/a2a6e96e5a964c5f88f31f07a4d95e6c)`;
    } else if (merchantLower.includes("target")) {
      returnLinks = `
**Quick Links:**
- [Order History](https://www.target.com/orders)
- [Returns Policy](https://www.target.com/returns)`;
    } else if (merchantLower.includes("bestbuy") || merchantLower.includes("best buy")) {
      returnLinks = `
**Quick Links:**
- [Order Status](https://www.bestbuy.com/profile/ss/orderlookup)
- [Returns & Exchanges](https://www.bestbuy.com/site/help-topics/return-exchange-policy/pcmcat260800050014.c)`;
    } else if (merchantLower.includes("apple")) {
      returnLinks = `
**Quick Links:**
- [Order Status](https://www.apple.com/shop/order/list)
- [Returns & Refunds](https://www.apple.com/shop/help/returns_refund)`;
    } else if (merchantLower.includes("costco")) {
      returnLinks = `
**Quick Links:**
- [Order History](https://www.costco.com/OrderStatusCmd)
- [Returns Policy](https://customerservice.costco.com/app/answers/detail/a_id/1191)`;
    }

    // Build the notification content
    const markdown = `## Return Initiated: ${purchase.merchant}

**Order Details:**
| | |
|---|---|
| **Item** | ${purchase.itemDescription || "Not specified"} |
| **Amount** | ${formatCurrency(purchase.amount)} |
| **Order #** | ${purchase.orderNumber || "Not available"} |
| **Purchased** | ${purchase.purchaseDate ? dayjs(purchase.purchaseDate).tz(getUserTimeZone()).format("MMM D, YYYY") : "Unknown"} |
${purchase.deliveryDate ? `| **Delivered** | ${dayjs(purchase.deliveryDate).tz(getUserTimeZone()).format("MMM D, YYYY")} |` : ""}
${purchase.deliveryAddress ? `| **Address** | ${purchase.deliveryAddress} |` : ""}

**Return Reason:** ${returnReason}${additionalNotes ? `\n**Notes:** ${additionalNotes}` : ""}

**Return Windows:**
${purchase.storeExpires && !storeExpired ? `✅ Store: ${dayjs(purchase.storeExpires).tz(getUserTimeZone()).diff(now, "day")} days left (expires ${dayjs(purchase.storeExpires).tz(getUserTimeZone()).format("MMM D")})` : "❌ Store window expired"}
${purchase.cardExpires && !cardExpired ? `\n✅ Card Protection: ${dayjs(purchase.cardExpires).tz(getUserTimeZone()).diff(now, "day")} days left (expires ${dayjs(purchase.cardExpires).tz(getUserTimeZone()).format("MMM D")})` : purchase.cardProtectionWindowDays ? "\n❌ Card protection expired" : ""}
${returnLinks}${automatedReturnOption}`;

    try {
      // Send the notification
      await create_agent_post(sdk, {
        shortMessage: `Return initiated: ${purchase.merchant} - ${formatCurrency(purchase.amount)}`,
        attachments: [{ type: "markdown", content: markdown }],
        duration: "read_once",
        priority: "urgent", // Push notification
      });

      // Update purchase status to indicate return initiated
      await db
        .update(purchases)
        .set({
          status: "return_initiated",
          refundExpectedAmount: purchase.amount, // Expect full refund by default
          updatedAt: now.toDate(),
        })
        .where(eq(purchases.id, purchaseId));

      // Record the alert
      await db.insert(sentAlerts).values({
        purchaseId: purchase.id,
        alertType: "return_initiated",
        sentAt: now.toDate(),
      });

      console.log(`initiateReturn: Sent notification for ${purchase.merchant}`);

      return {
        success: true,
        message: "Return marked! Check your notifications for order details and return links.",
      };
    } catch (error) {
      console.error("initiateReturn: Error sending notification", error);
      return { success: false, error: "Failed to send return notification" };
    }
  },
});

/**
 * Lookup return policy for a merchant via web search
 */
export const lookupReturnPolicy = serverFunction({
  description: "Look up return policy for a merchant using web search",
  params: Type.Object({
    merchant: Type.String({ minLength: 1, description: "Merchant name" }),
    forceRefresh: Type.Optional(
      Type.Boolean({ description: "Force refresh even if cached" })
    ),
  }),
  exported: true,
  execute: async (sdk: ServerSdk, { merchant, forceRefresh }) => {
    const db = sdk.db<typeof schema>();
    const now = dayjs().tz(getUserTimeZone());

    console.log(`lookupReturnPolicy: Looking up policy for ${merchant}`);

    // Check cache first
    if (!forceRefresh) {
      const cached = await db
        .select()
        .from(cachedPolicies)
        .where(eq(cachedPolicies.merchant, merchant.toLowerCase()))
        .limit(1);

      const cachedItem = cached[0];
      if (cachedItem && cachedItem.lookedUpAt && isCacheValid(cachedItem.lookedUpAt)) {
        console.log(`lookupReturnPolicy: Using cached policy for ${merchant}`);
        return {
          windowDays: cachedItem.windowDays,
          startsFrom: cachedItem.startsFrom,
          sourceUrl: cachedItem.sourceUrl,
          fromCache: true,
        };
      }
    }

    // Search for return policy
    try {
      const searchResult = await googleSearch(sdk, {
        query: `${merchant} return policy 2024 2025`,
      });

      if (!searchResult.success || !searchResult.results?.length) {
        console.error(
          `lookupReturnPolicy: No search results for ${merchant}`
        );
        return { error: "No results found" };
      }

      // Find official merchant page if possible
      const results = searchResult.results;
      const officialResult = results.find((r) =>
        r.url?.toLowerCase().includes(merchant.toLowerCase())
      );
      const bestResult = officialResult ?? results[0];

      // Try to get more detail from the page
      let pageContent = "";
      if (bestResult?.url) {
        try {
          const crawled = await crawlUrl(sdk, { url: bestResult.url });
          if (crawled.success && crawled.readableHtml) {
            // Extract text, limit length
            pageContent = crawled.readableHtml.slice(0, 5000);
          }
        } catch (e) {
          console.error(`lookupReturnPolicy: Failed to crawl ${bestResult.url}`, e);
        }
      }

      // Use LLM to extract policy details
      const snippets = results
        .map((r) => r.snippet)
        .filter(Boolean)
        .join("\n");

      const extracted = await sdk.callLLM(
        `Extract the return policy details for ${merchant} from this information:

Search results snippets:
${snippets}

${pageContent ? `Page content:\n${pageContent}` : ""}

Extract:
1. Return window in days (e.g., 30 days, 90 days)
2. Whether the window starts from "delivery" or "purchase" date
3. The source URL

Be conservative - if unclear, use a shorter window. Default to 30 days from purchase if not specified.`,
        Type.Object({
          windowDays: Type.Number({
            description: "Return window in days",
            minimum: 0,
            maximum: 365,
          }),
          startsFrom: Type.Union([
            Type.Literal("delivery"),
            Type.Literal("purchase"),
          ]),
          sourceUrl: Type.Optional(Type.String()),
        }),
        { modelVariant: "FAST" }
      );

      if (!extracted) {
        return { error: "Failed to extract policy" };
      }

      // Cache the result
      await db
        .insert(cachedPolicies)
        .values({
          merchant: merchant.toLowerCase(),
          windowDays: extracted.windowDays,
          startsFrom: extracted.startsFrom,
          sourceUrl: extracted.sourceUrl ?? bestResult?.url ?? null,
          rawResponse: JSON.stringify(extracted),
          lookedUpAt: now.toDate(),
        })
        .onConflictDoUpdate({
          target: cachedPolicies.merchant,
          set: {
            windowDays: extracted.windowDays,
            startsFrom: extracted.startsFrom,
            sourceUrl: extracted.sourceUrl ?? bestResult?.url ?? null,
            rawResponse: JSON.stringify(extracted),
            lookedUpAt: now.toDate(),
          },
        });

      console.log(
        `lookupReturnPolicy: Found ${extracted.windowDays} day policy for ${merchant}`
      );

      return {
        windowDays: extracted.windowDays,
        startsFrom: extracted.startsFrom,
        sourceUrl: extracted.sourceUrl ?? bestResult?.url,
        fromCache: false,
      };
    } catch (error) {
      console.error(`lookupReturnPolicy: Error looking up ${merchant}`, error);
      return { error: "Failed to look up policy" };
    }
  },
});

/**
 * Lookup card protection benefits via web search
 */
export const lookupCardProtection = serverFunction({
  description: "Look up return protection benefits for a credit card",
  params: Type.Object({
    cardName: Type.String({ minLength: 1, description: "Credit card name" }),
    forceRefresh: Type.Optional(
      Type.Boolean({ description: "Force refresh even if cached" })
    ),
  }),
  exported: true,
  execute: async (sdk: ServerSdk, { cardName, forceRefresh }) => {
    const db = sdk.db<typeof schema>();
    const now = dayjs().tz(getUserTimeZone());

    console.log(`lookupCardProtection: Looking up benefits for ${cardName}`);

    // Check cache first
    if (!forceRefresh) {
      const cached = await db
        .select()
        .from(cachedCardProtections)
        .where(eq(cachedCardProtections.cardName, cardName.toLowerCase()))
        .limit(1);

      const cachedItem = cached[0];
      if (cachedItem && cachedItem.lookedUpAt && isCacheValid(cachedItem.lookedUpAt)) {
        console.log(`lookupCardProtection: Using cached benefits for ${cardName}`);
        return {
          windowDays: cachedItem.windowDays,
          maxClaim: cachedItem.maxClaim,
          sourceUrl: cachedItem.sourceUrl,
          hasProtection: cachedItem.windowDays !== null && cachedItem.windowDays > 0,
          fromCache: true,
        };
      }
    }

    // Use Perplexity for card benefits (better for synthesized info)
    try {
      const searchResult = await sonarSearch(sdk, {
        query: `${cardName} credit card return protection benefit details coverage amount window 2024 2025`,
      });

      if (!searchResult.success || !searchResult.result) {
        console.error(
          `lookupCardProtection: No results for ${cardName}`
        );
        return { error: "No results found", hasProtection: false };
      }

      // Use LLM to extract structured info
      const extracted = await sdk.callLLM(
        `Extract the return protection benefit details for ${cardName} from this information:

${searchResult.result}

Sources: ${searchResult.sources?.map((s) => s.title).join(", ")}

Extract:
1. Protection window in days (typically 90 days)
2. Maximum claim amount per item in dollars
3. Whether this card actually HAS return protection (some cards dropped this benefit)

Note: Many cards dropped return protection in recent years. If the information says the benefit was removed or doesn't exist, indicate hasProtection: false.`,
        Type.Object({
          windowDays: Type.Optional(
            Type.Number({ minimum: 0, maximum: 365 })
          ),
          maxClaimDollars: Type.Optional(Type.Number({ minimum: 0 })),
          hasProtection: Type.Boolean(),
          sourceUrl: Type.Optional(Type.String()),
        }),
        { modelVariant: "FAST" }
      );

      if (!extracted) {
        return { error: "Failed to extract card protection", hasProtection: false };
      }

      // Cache the result
      await db
        .insert(cachedCardProtections)
        .values({
          cardName: cardName.toLowerCase(),
          windowDays: extracted.hasProtection ? extracted.windowDays ?? null : null,
          maxClaim: extracted.hasProtection && extracted.maxClaimDollars
            ? Math.round(extracted.maxClaimDollars * 100)
            : null,
          sourceUrl:
            extracted.sourceUrl ?? searchResult.sources?.[0]?.url ?? null,
          rawResponse: JSON.stringify(extracted),
          lookedUpAt: now.toDate(),
        })
        .onConflictDoUpdate({
          target: cachedCardProtections.cardName,
          set: {
            windowDays: extracted.hasProtection
              ? extracted.windowDays ?? null
              : null,
            maxClaim:
              extracted.hasProtection && extracted.maxClaimDollars
                ? Math.round(extracted.maxClaimDollars * 100)
                : null,
            sourceUrl:
              extracted.sourceUrl ?? searchResult.sources?.[0]?.url ?? null,
            rawResponse: JSON.stringify(extracted),
            lookedUpAt: now.toDate(),
          },
        });

      console.log(
        `lookupCardProtection: ${cardName} hasProtection=${extracted.hasProtection}, windowDays=${extracted.windowDays}`
      );

      return {
        windowDays: extracted.windowDays,
        maxClaim: extracted.maxClaimDollars
          ? Math.round(extracted.maxClaimDollars * 100)
          : null,
        sourceUrl:
          extracted.sourceUrl ?? searchResult.sources?.[0]?.url ?? null,
        hasProtection: extracted.hasProtection,
        fromCache: false,
      };
    } catch (error) {
      console.error(`lookupCardProtection: Error looking up ${cardName}`, error);
      return { error: "Failed to look up card protection", hasProtection: false };
    }
  },
});


/**
 * Get purchases expiring soon (within N days)
 */
export const getExpiringPurchases = serverFunction({
  description: "Get purchases with return windows expiring soon",
  params: Type.Object({
    withinDays: Type.Number({
      minimum: 1,
      maximum: 30,
      description: "Days until expiration",
    }),
  }),
  exported: true,
  execute: async (sdk: ServerSdk, { withinDays }) => {
    const db = sdk.db<typeof schema>();
    const now = dayjs().tz(getUserTimeZone());
    const cutoff = now.add(withinDays, "day").toDate();

    console.log(`getExpiringPurchases: Finding items expiring within ${withinDays} days`);

    const expiring = await db
      .select()
      .from(purchases)
      .where(
        and(
          eq(purchases.status, "tracking"),
          or(
            and(
              gte(purchases.storeExpires, now.toDate()),
              lte(purchases.storeExpires, cutoff)
            ),
            and(
              gte(purchases.cardExpires, now.toDate()),
              lte(purchases.cardExpires, cutoff)
            )
          )
        )
      );

    console.log(`getExpiringPurchases: Found ${expiring.length} expiring items`);

    return expiring.map((p) => ({
      id: p.id,
      merchant: p.merchant,
      amount: formatCurrency(p.amount),
      itemDescription: p.itemDescription,
      storeExpires: p.storeExpires?.toISOString() ?? null,
      cardExpires: p.cardExpires?.toISOString() ?? null,
      daysUntilStoreExpires: p.storeExpires
        ? dayjs(p.storeExpires).tz(getUserTimeZone()).diff(now, "day")
        : null,
      daysUntilCardExpires: p.cardExpires
        ? dayjs(p.cardExpires).tz(getUserTimeZone()).diff(now, "day")
        : null,
    }));
  },
});

// ============================================================================
// BACKGROUND FUNCTIONS (for cron triggers)
// ============================================================================

/**
 * Check for refunds - runs daily at 9am
 * Monitors Attain Finance for refund transactions matching returned purchases
 */
export const checkRefunds = backgroundFunction({
  description: "Check for refunds on returned purchases via Attain Finance",
  params: Type.Object({}),
  exported: true,
  execute: async (sdk: ServerSdk) => {
    const db = sdk.db<typeof schema>();
    const now = dayjs().tz(getUserTimeZone());

    console.log("checkRefunds: Starting refund check");

    // Get purchases marked as "returned" without refund confirmation
    const pendingRefunds = await db
      .select()
      .from(purchases)
      .where(
        and(
          eq(purchases.status, "returned"),
          isNull(purchases.refundConfirmedAt)
        )
      );

    if (pendingRefunds.length === 0) {
      console.log("checkRefunds: No pending refunds to check");
      return;
    }

    console.log(`checkRefunds: Checking ${pendingRefunds.length} pending refunds`);

    for (const purchase of pendingRefunds) {
      try {
        const refund = await findMatchingRefund(sdk, {
          merchant: purchase.merchant,
          amount: purchase.refundExpectedAmount ?? purchase.amount,
          updatedAt: purchase.updatedAt,
        });

        if (refund) {
          // Update purchase with refund confirmation
          await db
            .update(purchases)
            .set({
              refundConfirmedAt: dayjs(refund.date).tz(getUserTimeZone()).toDate(),
              refundAmount: refund.amount,
              status: "refunded",
              updatedAt: now.toDate(),
            })
            .where(eq(purchases.id, purchase.id));

          // Notify user
          const markdown = `## Refund Confirmed! ✓

**${purchase.merchant}** - ${formatCurrency(refund.amount)}
${purchase.itemDescription ? `Item: ${purchase.itemDescription}\n` : ""}
Refund posted on ${dayjs(refund.date).tz(getUserTimeZone()).format("MMM D, YYYY")}`;

          await create_agent_post(sdk, {
            shortMessage: `Refund confirmed: ${purchase.merchant}`,
            attachments: [{ type: "markdown", content: markdown }],
            duration: "read_once",
            priority: "normal",
          });

          console.log(`checkRefunds: Confirmed refund for ${purchase.merchant}`);
        }
      } catch (error) {
        console.error(`checkRefunds: Error checking refund for ${purchase.merchant}`, error);
      }
    }

    console.log("checkRefunds: Completed refund check");
  },
});

/**
 * Daily alert check - runs at 9am Pacific
 * Sends alerts for items expiring in exactly 2 days
 */
export const dailyAlertCheck = backgroundFunction({
  description: "Check for purchases expiring in 2 days and send alerts",
  params: Type.Object({}),
  exported: true,
  execute: async (sdk: ServerSdk) => {
    const db = sdk.db<typeof schema>();
    const now = dayjs().tz(getUserTimeZone());
    const twoDaysFromNow = now.add(2, "day");
    const twoDaysStart = twoDaysFromNow.startOf("day").toDate();
    const twoDaysEnd = twoDaysFromNow.endOf("day").toDate();

    console.log("dailyAlertCheck: Checking for expiring purchases");

    // Find purchases with store window expiring in 2 days (not yet alerted)
    const storeExpiring = await db
      .select()
      .from(purchases)
      .where(
        and(
          eq(purchases.status, "tracking"),
          eq(purchases.storeAlertSent, false),
          gte(purchases.storeExpires, twoDaysStart),
          lte(purchases.storeExpires, twoDaysEnd)
        )
      );

    for (const p of storeExpiring) {
      console.log(`dailyAlertCheck: Store expiring alert for ${p.merchant}`);

      let markdown = `## Return Window Closing Soon!\n\n`;
      markdown += `**${p.merchant}** - ${formatCurrency(p.amount)}\n`;
      if (p.itemDescription) markdown += `Item: ${p.itemDescription}\n`;
      markdown += `\n**Store return window expires:** ${dayjs(p.storeExpires).tz(getUserTimeZone()).format("dddd, MMMM D, YYYY")}\n`;
      markdown += `\nAct now if you want to return this item to the store.`;

      await create_agent_post(sdk, {
        shortMessage: `Return deadline in 2 days: ${p.merchant}`,
        attachments: [{ type: "markdown", content: markdown }],
        duration: "read_once",
        priority: "urgent", // Push notification
      });

      await db
        .update(purchases)
        .set({ storeAlertSent: true, updatedAt: now.toDate() })
        .where(eq(purchases.id, p.id));

      await db.insert(sentAlerts).values({
        purchaseId: p.id,
        alertType: "store_expiring",
        sentAt: now.toDate(),
      });
    }

    // Find purchases with card protection expiring in 2 days (not yet alerted)
    // Only alert if store window already passed
    const cardExpiring = await db
      .select()
      .from(purchases)
      .where(
        and(
          eq(purchases.status, "tracking"),
          eq(purchases.cardAlertSent, false),
          gte(purchases.cardExpires, twoDaysStart),
          lte(purchases.cardExpires, twoDaysEnd)
        )
      );

    let cardAlertCount = 0;
    for (const p of cardExpiring) {
      // Only alert about card protection if store window already passed
      if (p.storeExpires && dayjs(p.storeExpires).tz(getUserTimeZone()).isAfter(now)) {
        continue; // Store window still open, skip card alert
      }

      cardAlertCount++;
      console.log(`dailyAlertCheck: Card expiring alert for ${p.merchant}`);

      let markdown = `## Card Protection Deadline Approaching!\n\n`;
      markdown += `**${p.merchant}** - ${formatCurrency(p.amount)}\n`;
      if (p.itemDescription) markdown += `Item: ${p.itemDescription}\n`;
      markdown += `\n**Card protection expires:** ${dayjs(p.cardExpires).tz(getUserTimeZone()).format("dddd, MMMM D, YYYY")}\n`;
      if (p.cardProtectionMaxClaim) {
        markdown += `Maximum claim: ${formatCurrency(p.cardProtectionMaxClaim)}\n`;
      }
      markdown += `\nStore return window has passed. File a card protection claim if needed.`;

      await create_agent_post(sdk, {
        shortMessage: `Card protection deadline in 2 days: ${p.merchant}`,
        attachments: [{ type: "markdown", content: markdown }],
        duration: "read_once",
        priority: "urgent",
      });

      await db
        .update(purchases)
        .set({ cardAlertSent: true, updatedAt: now.toDate() })
        .where(eq(purchases.id, p.id));

      await db.insert(sentAlerts).values({
        purchaseId: p.id,
        alertType: "card_expiring",
        sentAt: now.toDate(),
      });
    }

    console.log(
      `dailyAlertCheck: Sent ${storeExpiring.length} store alerts, ${cardAlertCount} card alerts`
    );
  },
});

/**
 * Weekly summary - runs Sunday 9am Pacific
 */
export const weeklySummary = backgroundFunction({
  description: "Generate and send weekly summary of tracked purchases",
  params: Type.Object({}),
  exported: true,
  execute: async (sdk: ServerSdk) => {
    const db = sdk.db<typeof schema>();
    const now = dayjs().tz(getUserTimeZone());

    console.log("weeklySummary: Generating weekly summary");

    const allTracking = await db
      .select()
      .from(purchases)
      .where(eq(purchases.status, "tracking"));

    if (allTracking.length === 0) {
      console.log("weeklySummary: No purchases being tracked");
      return;
    }

    // Categorize purchases
    const expiringSoon: typeof allTracking = [];
    const noActionNeeded: typeof allTracking = [];

    const twoWeeksFromNow = now.add(14, "day").toDate();

    for (const p of allTracking) {
      const earliestExpiry = [p.storeExpires, p.cardExpires]
        .filter(Boolean)
        .sort((a, b) => (a! < b! ? -1 : 1))[0];

      if (earliestExpiry && earliestExpiry < twoWeeksFromNow) {
        expiringSoon.push(p);
      } else {
        noActionNeeded.push(p);
      }
    }

    // Build summary
    let markdown = `## Weekly Return Window Summary\n\n`;
    markdown += `**Total tracked purchases:** ${allTracking.length}\n\n`;

    if (expiringSoon.length > 0) {
      markdown += `### Expiring Soon (next 14 days)\n`;
      for (const p of expiringSoon) {
        const earliestExpiry = [p.storeExpires, p.cardExpires]
          .filter(Boolean)
          .sort((a, b) => (a! < b! ? -1 : 1))[0];
        markdown += `- **${p.merchant}** - ${formatCurrency(p.amount)}`;
        if (p.itemDescription) markdown += ` (${p.itemDescription})`;
        markdown += ` - Expires ${dayjs(earliestExpiry).tz(getUserTimeZone()).format("MMM D")}\n`;
      }
      markdown += "\n";
    }

    if (noActionNeeded.length > 0) {
      markdown += `### No Immediate Action Needed\n`;
      for (const p of noActionNeeded) {
        markdown += `- **${p.merchant}** - ${formatCurrency(p.amount)}`;
        if (p.itemDescription) markdown += ` (${p.itemDescription})`;
        markdown += "\n";
      }
    }

    await create_agent_post(sdk, {
      shortMessage: `Weekly summary: ${allTracking.length} purchases tracked`,
      attachments: [{ type: "markdown", content: markdown }],
      duration: "read_once",
      priority: "normal",
    });

    console.log("weeklySummary: Sent weekly summary");
  },
});

// ============================================================================
// EMAIL TRIGGER HANDLER - PRIMARY PURCHASE DETECTION
// ============================================================================

/**
 * Match a shipping/delivery email to an existing order
 */
async function matchToExistingOrder(
  db: ReturnType<ServerSdk["db"]>,
  merchant: string,
  orderNumber: string | null,
  amount: number | null
): Promise<typeof purchases.$inferSelect | null> {
  // Try exact order number match first
  if (orderNumber) {
    const exactMatch = await db
      .select()
      .from(purchases)
      .where(eq(purchases.orderNumber, orderNumber))
      .limit(1);
    if (exactMatch[0]) {
      console.log(`matchToExistingOrder: Found exact match by order number ${orderNumber}`);
      return exactMatch[0];
    }
  }

  // Fall back to merchant + recent timeframe (14 days)
  const recentCutoff = dayjs().tz(getUserTimeZone()).subtract(14, "day").toDate();
  const merchantLower = merchant.toLowerCase();

  const candidates = await db
    .select()
    .from(purchases)
    .where(
      and(
        eq(purchases.status, "tracking"),
        gte(purchases.createdAt, recentCutoff),
        isNull(purchases.deliveryDate)
      )
    )
    .orderBy(desc(purchases.createdAt));

  // Find best match by merchant name similarity
  for (const candidate of candidates) {
    const candidateMerchant = candidate.merchant.toLowerCase();
    if (
      candidateMerchant.includes(merchantLower) ||
      merchantLower.includes(candidateMerchant)
    ) {
      // If amount provided, prefer matching amount
      if (amount && candidate.amount) {
        const amountDiff = Math.abs(candidate.amount - amount);
        if (amountDiff <= 100) {
          // Within $1
          console.log(`matchToExistingOrder: Found match by merchant + amount: ${candidate.merchant}`);
          return candidate;
        }
      }
      // Otherwise return first merchant match
      console.log(`matchToExistingOrder: Found match by merchant: ${candidate.merchant}`);
      return candidate;
    }
  }

  return null;
}

/**
 * Look up and apply return policy for a purchase
 */
async function lookupAndApplyReturnPolicy(
  sdk: ServerSdk,
  db: ReturnType<ServerSdk["db"]>,
  purchaseId: number,
  merchant: string,
  purchaseDate: Date,
  deliveryDate: Date | null,
  cardUsed: string | null
) {
  const now = dayjs().tz(getUserTimeZone());

  // Look up store return policy
  try {
    // Check cache first
    const cached = await db
      .select()
      .from(cachedPolicies)
      .where(eq(cachedPolicies.merchant, merchant.toLowerCase()))
      .limit(1);

    let policy: { windowDays: number; startsFrom: string; sourceUrl?: string } | null = null;

    const cachedItem = cached[0];
    if (cachedItem && cachedItem.lookedUpAt && isCacheValid(cachedItem.lookedUpAt)) {
      policy = {
        windowDays: cachedItem.windowDays ?? 30,
        startsFrom: cachedItem.startsFrom ?? "purchase",
        sourceUrl: cachedItem.sourceUrl ?? undefined,
      };
      console.log(`lookupAndApplyReturnPolicy: Using cached policy for ${merchant}`);
    } else {
      // Search for return policy
      const searchResult = await googleSearch(sdk, {
        query: `${merchant} return policy 2024 2025`,
      });

      if (searchResult.success && searchResult.results?.length) {
        const snippets = searchResult.results
          .map((r) => r.snippet)
          .filter(Boolean)
          .join("\n");

        const extractedRaw = await sdk.callLLM(
          `Extract return policy for ${merchant}:\n${snippets}\nReturn window days (number) and whether starts from "delivery" or "purchase".`,
          Type.Object({
            windowDays: Type.Number(),
            startsFrom: Type.String(),
          }),
          { modelVariant: "FAST" }
        );

        if (extractedRaw) {
          const windowDays = extractedRaw.windowDays as number;
          const startsFrom = (extractedRaw.startsFrom as string) === "delivery" ? "delivery" : "purchase";
          
          policy = {
            windowDays,
            startsFrom,
            sourceUrl: searchResult.results[0]?.url,
          };

          // Cache the policy
          await db
            .insert(cachedPolicies)
            .values({
              merchant: merchant.toLowerCase(),
              windowDays,
              startsFrom,
              sourceUrl: searchResult.results[0]?.url ?? null,
              rawResponse: JSON.stringify(extractedRaw),
              lookedUpAt: now.toDate(),
            })
            .onConflictDoUpdate({
              target: cachedPolicies.merchant,
              set: {
                windowDays,
                startsFrom,
                sourceUrl: searchResult.results[0]?.url ?? null,
                rawResponse: JSON.stringify(extractedRaw),
                lookedUpAt: now.toDate(),
              },
            });
        }
      }
    }

    if (policy) {
      const storeExpires = calculateExpiration(
        purchaseDate,
        deliveryDate,
        policy.windowDays,
        policy.startsFrom
      );

      await db
        .update(purchases)
        .set({
          storePolicyWindowDays: policy.windowDays,
          storePolicyStartsFrom: policy.startsFrom,
          storePolicySourceUrl: policy.sourceUrl ?? null,
          storePolicyLookedUp: now.toDate(),
          storeExpires,
          updatedAt: now.toDate(),
        })
        .where(eq(purchases.id, purchaseId));

      console.log(`lookupAndApplyReturnPolicy: Set ${policy.windowDays} day policy for ${merchant}`);
    }
  } catch (error) {
    console.error(`lookupAndApplyReturnPolicy: Failed to look up policy for ${merchant}`, error);
  }

  // Look up card protection if card is known
  if (cardUsed) {
    try {
      // Check cache first
      const cached = await db
        .select()
        .from(cachedCardProtections)
        .where(eq(cachedCardProtections.cardName, cardUsed.toLowerCase()))
        .limit(1);

      let protection: { windowDays: number; maxClaim: number | null } | null = null;

      const cachedItem = cached[0];
      if (cachedItem && cachedItem.lookedUpAt && isCacheValid(cachedItem.lookedUpAt)) {
        if (cachedItem.windowDays) {
          protection = {
            windowDays: cachedItem.windowDays,
            maxClaim: cachedItem.maxClaim,
          };
        }
      } else {
        const cardResult = await sonarSearch(sdk, {
          query: `${cardUsed} return protection benefit coverage 2024 2025`,
        });

        if (cardResult.success && cardResult.result) {
          const extracted = await sdk.callLLM(
            `Does ${cardUsed} have return protection? If yes, extract window days and max claim amount:\n${cardResult.result}`,
            Type.Object({
              hasProtection: Type.Boolean(),
              windowDays: Type.Optional(Type.Number({ minimum: 0, maximum: 365 })),
              maxClaimDollars: Type.Optional(Type.Number({ minimum: 0 })),
            }),
            { modelVariant: "FAST" }
          );

          if (extracted && extracted.hasProtection && extracted.windowDays) {
            protection = {
              windowDays: extracted.windowDays,
              maxClaim: extracted.maxClaimDollars ? Math.round(extracted.maxClaimDollars * 100) : null,
            };

            // Cache the result
            await db
              .insert(cachedCardProtections)
              .values({
                cardName: cardUsed.toLowerCase(),
                windowDays: extracted.windowDays,
                maxClaim: protection.maxClaim,
                sourceUrl: cardResult.sources?.[0]?.url ?? null,
                rawResponse: JSON.stringify(extracted),
                lookedUpAt: now.toDate(),
              })
              .onConflictDoUpdate({
                target: cachedCardProtections.cardName,
                set: {
                  windowDays: extracted.windowDays,
                  maxClaim: protection.maxClaim,
                  sourceUrl: cardResult.sources?.[0]?.url ?? null,
                  rawResponse: JSON.stringify(extracted),
                  lookedUpAt: now.toDate(),
                },
              });
          }
        }
      }

      if (protection) {
        const cardExpires = calculateExpiration(
          purchaseDate,
          null,
          protection.windowDays,
          "purchase"
        );

        await db
          .update(purchases)
          .set({
            cardProtectionWindowDays: protection.windowDays,
            cardProtectionMaxClaim: protection.maxClaim,
            cardProtectionLookedUp: now.toDate(),
            cardExpires,
            updatedAt: now.toDate(),
          })
          .where(eq(purchases.id, purchaseId));

        console.log(`lookupAndApplyReturnPolicy: Set ${protection.windowDays} day card protection`);
      }
    } catch (error) {
      console.error(`lookupAndApplyReturnPolicy: Failed to look up card protection for ${cardUsed}`, error);
    }
  }
}

/**
 * Unified handler for purchase-related emails (order, shipping, delivery)
 * This is the PRIMARY method for detecting and tracking purchases
 */
export const handlePurchaseEmail = backgroundFunction({
  description: "Process incoming order confirmation, shipping, and delivery emails",
  params: EmailTriggerParamsSchema,
  exported: true,
  execute: async (sdk: ServerSdk, params: EmailTriggerParams) => {
    const db = sdk.db<typeof schema>();
    const now = dayjs().tz(getUserTimeZone());

    console.log(`handlePurchaseEmail: Processing ${params.messages.length} emails`);

    for (const email of params.messages) {
      // Check if already processed
      const existing = await db
        .select()
        .from(processedEmails)
        .where(eq(processedEmails.messageId, email.messageId))
        .limit(1);

      if (existing.length > 0) {
        console.log(`handlePurchaseEmail: Email ${email.messageId} already processed`);
        continue;
      }

      console.log(`handlePurchaseEmail: Processing email from ${email.from}: ${email.subject}`);

      try {
        const emailContent = email.body ?? `Subject: ${email.subject}`;
        const today = dayjs().tz(getUserTimeZone()).format("YYYY-MM-DD");

        // Use LLM to classify and extract purchase information
        // IMPORTANT: Schema supports MULTIPLE orders per email (e.g., Amazon often combines orders)
        const extractedRaw = await sdk.callLLM(
          `Analyze this email to extract ALL purchase/order information.

CRITICAL: One email may contain MULTIPLE separate items/orders that ship separately.
For example, Amazon emails often say "Ordered: [Item 1] and 1 more item" or list multiple items.
Look for phrases like "and 1 more item", "Order 1 of 2", "Shipment 1", "Shipment 2", etc.
EACH ITEM that ships separately should be its own entry in the "orders" array.

From: ${email.from}
Subject: ${email.subject}
Body: ${emailContent.slice(0, 12000)}

Today's date is ${today}.

For EACH order found, extract:
1. Order number (e.g., "114-9558898-8264233" for Amazon) - DIFFERENT orders have DIFFERENT order numbers
2. Item description - what specific product(s) in THIS order? Be detailed.
3. Amount in dollars - CRITICAL: Look for "Grand Total:", "Order Total:", "Total:" near each order.
   - Amazon emails show "Grand Total: $X.XX" for each order - extract that number
   - If you see "$189.65" or similar, extract 189.65 as the number
   - Each order has its OWN total - don't use 0 if a price is visible
4. Expected delivery date for THIS order (format: YYYY-MM-DD)
5. Confirmed delivery date - ONLY if THIS order was already delivered (format: YYYY-MM-DD)
6. Tracking number (if available for this shipment)
7. Carrier (UPS, FedEx, USPS, Amazon, etc.)

Also determine:
- Email type: "order_confirmation", "shipping", "delivery", or "not_purchase"
- Merchant/store name (e.g., Amazon, Target, Nike)
- Delivery address (usually same for all orders)
- Payment method: Look for "Visa ending in 1234", "Mastercard ****5678", "Amex ...4321", etc.
  Extract the card type (Visa, Mastercard, Amex, Discover, etc.) and last 4 digits.
  If payment method is not visible in the email, use EMPTY STRING "" for both cardType and lastFour.
  Do NOT use placeholder values like "UNKNOWN" or "<UNKNOWN>".

If this is NOT a purchase-related email (marketing, newsletter, etc.), set emailType to "not_purchase" and return empty orders array.
For text fields you cannot determine, use empty string "". Do NOT use placeholders like "UNKNOWN" or "<UNKNOWN>".
For amountDollars, ONLY use 0 if no price is visible - otherwise extract the actual price.

REMEMBER: Return ALL orders found. Do NOT combine multiple orders into one.`,
          Type.Object({
            emailType: Type.String(),
            merchant: Type.String(),
            deliveryAddress: Type.String(),
            paymentCardType: Type.String({ default: "" }), // Visa, Mastercard, Amex, Discover, etc. Use "" if not visible
            paymentCardLastFour: Type.String({ default: "" }), // Last 4 digits like "1234". Use "" if not visible
            orders: Type.Array(Type.Object({
              orderNumber: Type.String(),
              itemDescription: Type.String(),
              amountDollars: Type.Number({ default: 0 }),
              expectedDeliveryDate: Type.String(),
              confirmedDeliveryDate: Type.String(),
              trackingNumber: Type.String(),
              carrier: Type.String(),
            })),
          }),
          { modelVariant: "STANDARD" } // Use STANDARD for better multi-order extraction
        );

        if (!extractedRaw || extractedRaw.emailType === "not_purchase" || !extractedRaw.merchant) {
          console.log(`handlePurchaseEmail: Not a purchase email or no merchant found`);
          await db.insert(processedEmails).values({
            messageId: email.messageId,
            emailType: "not_purchase",
            processedAt: now.toDate(),
          });
          continue;
        }

        const emailType = extractedRaw.emailType as "order_confirmation" | "shipping" | "delivery";
        const merchant = extractedRaw.merchant as string;
        const deliveryAddress = (extractedRaw.deliveryAddress as string) || null;
        
        // Clean card info - filter out UNKNOWN placeholders
        const rawCardType = (extractedRaw.paymentCardType as string) || "";
        const rawCardLastFour = (extractedRaw.paymentCardLastFour as string) || "";
        const isValidCard = rawCardType && rawCardLastFour && 
          !rawCardType.toLowerCase().includes("unknown") && 
          !rawCardLastFour.toLowerCase().includes("unknown");
        
        // Format card used like "Visa ****1234"
        const cardUsed = isValidCard 
          ? `${rawCardType} ****${rawCardLastFour}` 
          : null;
        
        const orders = (extractedRaw.orders as Array<{
          orderNumber: string;
          itemDescription: string;
          amountDollars: number;
          expectedDeliveryDate: string;
          confirmedDeliveryDate: string;
          trackingNumber: string;
          carrier: string;
        }>) || [];

        console.log(`handlePurchaseEmail: Found ${orders.length} order(s) from ${merchant}`);

        // If no orders extracted but it's a purchase email, create a fallback single order
        if (orders.length === 0) {
          console.log(`handlePurchaseEmail: No orders extracted, skipping`);
          await db.insert(processedEmails).values({
            messageId: email.messageId,
            emailType: emailType,
            processedAt: now.toDate(),
          });
          continue;
        }

        // Process EACH order separately
        for (const order of orders) {
          const orderNumber = order.orderNumber || null;
          const itemDescription = order.itemDescription || null;
          const amountCents = order.amountDollars ? Math.round(order.amountDollars * 100) : null;
          const trackingNumber = order.trackingNumber || null;
          const carrier = order.carrier || null;

          // Skip $0 purchases - nothing to refund (e.g., audiobooks bought with credits)
          if (!amountCents || amountCents <= 0) {
            console.log(`handlePurchaseEmail: Skipping $0 purchase: ${itemDescription || orderNumber}`);
            continue;
          }

          // Parse confirmed delivery date (item was delivered)
          let confirmedDeliveryDate: Date | null = null;
          if (order.confirmedDeliveryDate) {
            const parsed = dayjs(order.confirmedDeliveryDate).tz(getUserTimeZone());
            const nowDate = dayjs().tz(getUserTimeZone());
            if (parsed.isValid() && !parsed.isAfter(nowDate, "day")) {
              confirmedDeliveryDate = parsed.toDate();
            }
          }

          // Parse expected delivery date (from shipping notification)
          let expectedDeliveryDate: Date | null = null;
          if (order.expectedDeliveryDate) {
            const parsed = dayjs(order.expectedDeliveryDate).tz(getUserTimeZone());
            if (parsed.isValid()) {
              expectedDeliveryDate = parsed.toDate();
            }
          }

          // Use confirmed date if available, otherwise expected date
          const deliveryDate = confirmedDeliveryDate || expectedDeliveryDate;

          // Handle based on email type
          if (emailType === "order_confirmation") {
            // CREATE NEW PURCHASE RECORD
            console.log(`handlePurchaseEmail: Creating new purchase for ${merchant} - Order ${orderNumber}`);

            // Check if we already have this order number
            if (orderNumber) {
              const existingOrder = await db
                .select()
                .from(purchases)
                .where(eq(purchases.orderNumber, orderNumber))
                .limit(1);

              if (existingOrder[0]) {
                console.log(`handlePurchaseEmail: Order ${orderNumber} already exists, skipping`);
                continue; // Skip this order, continue to next in loop
              }
            }

            const insertResult = await db
              .insert(purchases)
              .values({
                transactionId: `email_${email.messageId}_${orderNumber || Date.now()}`,
                merchant: merchant,
                amount: amountCents ?? 0,
                cardUsed: cardUsed,
                itemDescription: itemDescription,
                orderNumber: orderNumber,
                deliveryDate,
                deliveryAddress: deliveryAddress,
                trackingNumber: trackingNumber,
                carrier: carrier,
                purchaseDate: dayjs(email.timestamp).tz(getUserTimeZone()).toDate(),
                createdAt: now.toDate(),
                updatedAt: now.toDate(),
              })
              .returning();

            const inserted = insertResult[0];
            if (inserted) {
              // Look up return policies
              await lookupAndApplyReturnPolicy(
                sdk,
                db,
                inserted.id,
                merchant,
                dayjs(email.timestamp).tz(getUserTimeZone()).toDate(),
                deliveryDate,
                null // Card info not available from email
              );

              // Try to match the card from Attain Finance
              try {
                const cardName = await findMatchingCard(sdk, {
                  merchant: merchant,
                  amount: amountCents ?? 0,
                  purchaseDate: dayjs(email.timestamp).tz(getUserTimeZone()).toDate(),
                });
                if (cardName) {
                  await db
                    .update(purchases)
                    .set({ cardUsed: cardName })
                    .where(eq(purchases.id, inserted.id));
                  console.log(`handlePurchaseEmail: Matched card ${cardName} for purchase ${inserted.id}`);
                }
              } catch (cardError) {
                console.error(`handlePurchaseEmail: Failed to match card for purchase ${inserted.id}`, cardError);
              }

              // Send notification
              const purchaseResult = await db
                .select()
                .from(purchases)
                .where(eq(purchases.id, inserted.id))
                .limit(1);

              const p = purchaseResult[0];
              if (p) {
                let markdown = `**${p.merchant}**${p.amount ? ` - ${formatCurrency(p.amount)}` : ""}\n`;
                if (p.itemDescription) markdown += `${p.itemDescription}\n\n`;

                if (p.storePolicyWindowDays) {
                  markdown += `**Store Return Window:** ${p.storePolicyWindowDays} days from ${p.storePolicyStartsFrom ?? "purchase"}\n`;
                  if (p.storeExpires) {
                    markdown += `Expires: ${dayjs(p.storeExpires).tz(getUserTimeZone()).format("MMM D, YYYY")}\n`;
                  }
                }

                await create_agent_post(sdk, {
                  shortMessage: `Now tracking: ${p.merchant} order`,
                  attachments: [{ type: "markdown", content: markdown }],
                  duration: "read_once",
                  priority: "normal",
                });

                await db.insert(sentAlerts).values({
                  purchaseId: p.id,
                  alertType: "new_tracking",
                  sentAt: now.toDate(),
                });
              }

              console.log(`handlePurchaseEmail: Created purchase ${inserted.id} for ${merchant} - ${itemDescription}`);
            }
          } else {
            // SHIPPING or DELIVERY - update existing order
            const existingOrder = await matchToExistingOrder(
              db,
              merchant,
              orderNumber,
              amountCents
            );

            if (existingOrder) {
              const updates: Record<string, unknown> = {
                updatedAt: now.toDate(),
              };

              // Enrich existing order with new info (only add, don't overwrite unless it's a confirmed delivery)
              if (itemDescription && !existingOrder.itemDescription) {
                updates.itemDescription = itemDescription;
              }
              if (orderNumber && !existingOrder.orderNumber) {
                updates.orderNumber = orderNumber;
              }
              if (trackingNumber && !existingOrder.trackingNumber) {
                updates.trackingNumber = trackingNumber;
              }
              if (carrier && !existingOrder.carrier) {
                updates.carrier = carrier;
              }
              if (deliveryAddress && !existingOrder.deliveryAddress) {
                updates.deliveryAddress = deliveryAddress;
              }

              // Update delivery date:
              // - If we have a confirmed delivery date, always update (overrides expected)
              // - If we have an expected date and no existing date, update
              const shouldUpdateDeliveryDate =
                (confirmedDeliveryDate) ||
                (expectedDeliveryDate && !existingOrder.deliveryDate);

              if (shouldUpdateDeliveryDate && deliveryDate) {
                updates.deliveryDate = deliveryDate;
                if (confirmedDeliveryDate) {
                  updates.deliveryConfirmed = true;
                }
                console.log(`handlePurchaseEmail: Setting delivery date to ${dayjs(deliveryDate).tz(getUserTimeZone()).format("YYYY-MM-DD")} (${confirmedDeliveryDate ? "confirmed" : "expected"})`);

                // Recalculate expiration if policy starts from delivery
                if (
                  existingOrder.storePolicyStartsFrom === "delivery" &&
                  existingOrder.storePolicyWindowDays
                ) {
                  updates.storeExpires = dayjs(deliveryDate)
                    .tz(getUserTimeZone())
                    .add(existingOrder.storePolicyWindowDays, "day")
                    .toDate();
                  console.log(`handlePurchaseEmail: Updated expiration based on delivery date`);
                }
              }

              await db
                .update(purchases)
                .set(updates)
                .where(eq(purchases.id, existingOrder.id));

              console.log(`handlePurchaseEmail: Updated order ${existingOrder.id} with ${emailType} info`);
            } else {
              // No existing order found - create one if we have enough info
              if (emailType === "delivery" && merchant) {
                console.log(`handlePurchaseEmail: No matching order found, creating from delivery email`);

                const insertResult = await db
                  .insert(purchases)
                  .values({
                    transactionId: `email_${email.messageId}_${orderNumber || Date.now()}`,
                    merchant: merchant,
                    amount: amountCents ?? 0,
                    itemDescription: itemDescription,
                    orderNumber: orderNumber,
                    deliveryDate,
                    deliveryConfirmed: true, // Created from delivery email, so delivery is confirmed
                    deliveryAddress: deliveryAddress,
                    trackingNumber: trackingNumber,
                    carrier: carrier,
                    purchaseDate: dayjs(email.timestamp).tz(getUserTimeZone()).subtract(7, "day").toDate(), // Estimate purchase date
                    createdAt: now.toDate(),
                    updatedAt: now.toDate(),
                  })
                  .returning();

                const inserted = insertResult[0];
                if (inserted) {
                  await lookupAndApplyReturnPolicy(
                    sdk,
                    db,
                    inserted.id,
                    merchant,
                    inserted.purchaseDate ?? now.toDate(),
                    deliveryDate,
                    null
                  );

                  console.log(`handlePurchaseEmail: Created purchase ${inserted.id} from delivery email for ${merchant}`);
                }
              } else {
                console.log(`handlePurchaseEmail: No matching order found for ${emailType} email, order ${orderNumber}`);
              }
            }
          }
        } // End of orders loop

        // Mark email as processed after handling all orders
        await db.insert(processedEmails).values({
          messageId: email.messageId,
          emailType: emailType,
          processedAt: now.toDate(),
        });

      } catch (error) {
        console.error(`handlePurchaseEmail: Failed to process email ${email.messageId}`, error);
        // Mark as processed to avoid retrying
        try {
          await db.insert(processedEmails).values({
            messageId: email.messageId,
            emailType: "error",
            processedAt: now.toDate(),
          });
        } catch {
          // Ignore if already inserted
        }
      }
    }

    console.log("handlePurchaseEmail: Completed processing");
  },
});
