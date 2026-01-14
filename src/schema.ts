/**
 * Database Schema Definition for Return Window Guardian
 *
 * Tracks purchases, return policies, card protections, and alert status.
 */

import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// Tracked purchases - the core table
export const purchases = sqliteTable("purchases", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  // Transaction info
  transactionId: text("transaction_id").unique(), // From Attain Finance or generated
  merchant: text("merchant").notNull(),
  amount: integer("amount").notNull(), // Stored in cents to avoid float issues
  cardUsed: text("card_used"),
  purchaseDate: integer("purchase_date", { mode: "timestamp" }).notNull(),

  // From email matching
  itemDescription: text("item_description"),
  productImageUrl: text("product_image_url"), // Product image URL extracted from email
  orderNumber: text("order_number"),
  deliveryDate: integer("delivery_date", { mode: "timestamp" }),
  deliveryConfirmed: integer("delivery_confirmed", { mode: "boolean" }).default(false), // True when delivery is confirmed (vs expected)
  deliveryAddress: text("delivery_address"), // Shipping/delivery address

  // Store return policy (looked up via web search)
  storePolicyWindowDays: integer("store_policy_window_days"),
  storePolicyStartsFrom: text("store_policy_starts_from"), // "delivery" or "purchase"
  storePolicySourceUrl: text("store_policy_source_url"),
  storePolicyLookedUp: integer("store_policy_looked_up", { mode: "timestamp" }),

  // Card protection (looked up via web search)
  cardProtectionWindowDays: integer("card_protection_window_days"),
  cardProtectionMaxClaim: integer("card_protection_max_claim"), // In cents
  cardProtectionSourceUrl: text("card_protection_source_url"),
  cardProtectionLookedUp: integer("card_protection_looked_up", { mode: "timestamp" }),

  // Calculated expiration dates
  storeExpires: integer("store_expires", { mode: "timestamp" }),
  cardExpires: integer("card_expires", { mode: "timestamp" }),

  // Alert tracking (prevent repeat alerts)
  storeAlertSent: integer("store_alert_sent", { mode: "boolean" }).default(false),
  cardAlertSent: integer("card_alert_sent", { mode: "boolean" }).default(false),

  // Status
  status: text("status").default("tracking"), // "tracking", "returned", "expired", "dismissed"

  // Shipping tracking
  trackingNumber: text("tracking_number"),
  carrier: text("carrier"), // "UPS", "FedEx", "USPS", etc.

  // Refund tracking (for returned items)
  refundExpectedAmount: integer("refund_expected_amount"), // In cents
  refundConfirmedAt: integer("refund_confirmed_at", { mode: "timestamp" }),
  refundAmount: integer("refund_amount"), // Actual refund amount in cents

  // Timestamps
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// Processed emails - prevent duplicate processing
export const processedEmails = sqliteTable("processed_emails", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  messageId: text("message_id").notNull().unique(),
  purchaseId: integer("purchase_id"), // Linked purchase if matched
  emailType: text("email_type"), // "order", "shipping", "delivery"
  processedAt: integer("processed_at", { mode: "timestamp" }).notNull(),
});

// Cached return policies - avoid redundant lookups
export const cachedPolicies = sqliteTable("cached_policies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  merchant: text("merchant").notNull().unique(),
  windowDays: integer("window_days"),
  startsFrom: text("starts_from"), // "delivery" or "purchase"
  sourceUrl: text("source_url"),
  rawResponse: text("raw_response"), // Store full LLM extraction
  lookedUpAt: integer("looked_up_at", { mode: "timestamp" }).notNull(),
});

// Cached card protections - avoid redundant lookups
export const cachedCardProtections = sqliteTable("cached_card_protections", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  cardName: text("card_name").notNull().unique(),
  windowDays: integer("window_days"),
  maxClaim: integer("max_claim"), // In cents
  sourceUrl: text("source_url"),
  rawResponse: text("raw_response"), // Store full LLM extraction
  lookedUpAt: integer("looked_up_at", { mode: "timestamp" }).notNull(),
});

// Sent alerts - track what we've notified about
export const sentAlerts = sqliteTable("sent_alerts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  purchaseId: integer("purchase_id").notNull(),
  alertType: text("alert_type").notNull(), // "store_expiring", "card_expiring", "new_tracking", "weekly_summary"
  sentAt: integer("sent_at", { mode: "timestamp" }).notNull(),
});

// Line items within a purchase (for multi-item orders like Nordstrom)
// When an order contains multiple products that ship together,
// each product is a line item. This enables:
// - Tracking which specific items are returned
// - Asking "which item?" in the return flow
// - Partial returns (return some items, keep others)
export const purchaseLineItems = sqliteTable("purchase_line_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  purchaseId: integer("purchase_id").notNull(), // FK to purchases.id

  // Item details
  description: text("description").notNull(), // Product name/description
  quantity: integer("quantity").default(1),
  amountCents: integer("amount_cents"), // Price for this item in cents
  sku: text("sku"), // Optional product SKU/identifier
  imageUrl: text("image_url"), // Product image URL from email

  // Return tracking per item
  status: text("status").default("keeping"), // "keeping", "returning", "returned"
  returnReason: text("return_reason"),
  returnedAt: integer("returned_at", { mode: "timestamp" }),

  // Timestamps
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});
