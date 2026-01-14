import "@dev-agents/sdk-client/styles/base";
import { agentQueryClient, call } from "@dev-agents/sdk-client";
import { getUserTimeZone } from "@dev-agents/sdk-shared";
import { QueryClientProvider, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useState } from "react";
import { AlertTriangle, ArrowLeft, Calendar, Camera, Check, CheckCircle, ChevronDown, Circle, Clock, CreditCard, Image as ImageIcon, MapPin, Package, RefreshCw, RotateCcw, Send, Shield, Store, Truck, X } from "lucide-react";
// Note: CreditCard icon kept for displaying card info in purchase cards
import type {
  getTrackedPurchases,
  addPurchase,
  updatePurchaseStatus,
  getExpiringPurchases,
  scanReceipt,
  initiateReturn,
  scanRecentEmails,
} from "./server";

dayjs.extend(utc);
dayjs.extend(timezone);

interface RenderContext {
  type: "widget" | "app" | "feed_item";
  data?: unknown;
}

// Loading spinner component
function LoadingIcon({ className }: { className?: string }) {
  return (
    <svg
      className={`animate-spin w-5 h-5 ${className || ""}`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-50"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

// Type for purchase data
interface Purchase {
  id: number;
  merchant: string;
  amount: string;
  amountCents: number;
  cardUsed: string | null;
  purchaseDate: string | null;
  itemDescription: string | null;
  deliveryDate: string | null;
  deliveryConfirmed: boolean;
  deliveryAddress: string | null;
  trackingNumber: string | null;
  carrier: string | null;
  storePolicy: {
    windowDays: number | null;
    startsFrom: string | null;
    sourceUrl: string | null;
    expires: string | null;
  };
  cardProtection: {
    windowDays: number | null;
    maxClaim: string | null;
    sourceUrl: string | null;
    expires: string | null;
  };
  storeAlertSent: boolean | null;
  cardAlertSent: boolean | null;
  status: string | null;
}

// Helper to calculate days until expiration
function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const date = dayjs(dateStr).tz(getUserTimeZone());
  const now = dayjs().tz(getUserTimeZone());
  return date.diff(now, "day");
}

// Helper to format date
function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Unknown";
  return dayjs(dateStr).tz(getUserTimeZone()).format("MMM D, YYYY");
}

// Expiration badge component
function ExpirationBadge({ days }: { days: number | null }) {
  if (days === null) return null;

  if (days < 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-400">
        <X className="w-3 h-3" />
        Expired
      </span>
    );
  }

  if (days <= 2) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-400">
        <AlertTriangle className="w-3 h-3" />
        {days} days left
      </span>
    );
  }

  if (days <= 7) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-yellow-500/20 text-yellow-400">
        <AlertTriangle className="w-3 h-3" />
        {days} days left
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-400">
      <CheckCircle className="w-3 h-3" />
      {days} days left
    </span>
  );
}

// Shipping status type
type ShippingStatus = "ordered" | "shipped" | "out_for_delivery" | "delivered";

// Determine shipping status based on purchase data
function getShippingStatus(purchase: Purchase): ShippingStatus {
  const now = dayjs().tz(getUserTimeZone());
  const deliveryDate = purchase.deliveryDate ? dayjs(purchase.deliveryDate).tz(getUserTimeZone()) : null;

  // If delivery is confirmed (from delivery email), it's delivered
  if (purchase.deliveryConfirmed) {
    return "delivered";
  }

  // If delivery date is in the past, it's delivered
  if (deliveryDate && deliveryDate.isBefore(now, "day")) {
    return "delivered";
  }

  // If delivery date is today, it's out for delivery
  if (deliveryDate && deliveryDate.isSame(now, "day")) {
    return "out_for_delivery";
  }

  // If there's a tracking number or delivery date set, it's shipped
  if (purchase.trackingNumber || purchase.deliveryDate) {
    return "shipped";
  }

  // Otherwise just ordered
  return "ordered";
}

// Helper to check if a value is unknown/placeholder
function isUnknownValue(value: string | null): boolean {
  if (!value) return true;
  const lower = value.toLowerCase().trim();
  return lower === "unknown" || lower === "<unknown>" || lower === "n/a" || lower === "na" || lower === "";
}

// Helper to detect if merchant is likely a subscription or digital product
function isDigitalOrSubscription(merchant: string, itemDescription: string | null): boolean {
  const text = `${merchant} ${itemDescription || ""}`.toLowerCase();
  const digitalKeywords = [
    "subscription", "netflix", "spotify", "hulu", "disney+", "disney plus",
    "apple music", "youtube", "prime video", "hbo", "paramount+",
    "adobe", "microsoft 365", "office 365", "google one", "icloud",
    "dropbox", "slack", "zoom", "audible", "kindle", "ebook", "e-book",
    "digital", "streaming", "membership", "monthly", "annual plan",
    "software", "saas", "cloud", "online service", "app store", "play store",
    "henry meds", "henrymeds"
  ];
  return digitalKeywords.some(keyword => text.includes(keyword));
}

// Get subscription refund info
function getSubscriptionRefundInfo(merchant: string, itemDescription: string | null, purchaseDate: string | null): {
  isSubscription: boolean;
  refundLikelihood: "high" | "medium" | "low";
  refundTip: string;
  cancelTip: string;
} | null {
  const text = `${merchant} ${itemDescription || ""}`.toLowerCase();

  // Check if it's a subscription - includes keywords and known subscription services
  const subscriptionKeywords = ["subscription", "membership", "monthly", "annual"];
  const knownSubscriptionServices = [
    "netflix", "spotify", "hulu", "disney+", "disney plus", "audible",
    "adobe", "claude", "anthropic", "microsoft 365", "office 365",
    "apple music", "icloud", "youtube premium", "hbo", "paramount+",
    "henry meds", "henrymeds"
  ];
  const isSubscription = subscriptionKeywords.some(kw => text.includes(kw)) ||
    knownSubscriptionServices.some(service => text.includes(service));

  if (!isSubscription) return null;

  // Calculate days since purchase
  const daysSincePurchase = purchaseDate
    ? dayjs().tz(getUserTimeZone()).diff(dayjs(purchaseDate).tz(getUserTimeZone()), "day")
    : 999;

  // Determine refund likelihood and tips based on merchant and timing
  let refundLikelihood: "high" | "medium" | "low" = "medium";
  let refundTip = "";
  let cancelTip = "";

  if (text.includes("netflix")) {
    refundLikelihood = daysSincePurchase <= 7 ? "high" : "low";
    refundTip = daysSincePurchase <= 7
      ? "Netflix typically refunds within first week if you haven't used the service much."
      : "Netflix rarely refunds after the first week, but you can cancel to avoid future charges.";
    cancelTip = "Go to Netflix.com > Account > Cancel Membership";
  } else if (text.includes("spotify")) {
    refundLikelihood = daysSincePurchase <= 7 ? "medium" : "low";
    refundTip = "Spotify offers refunds on a case-by-case basis. Contact support if you haven't used Premium features.";
    cancelTip = "Go to Spotify.com > Account > Subscription > Cancel Premium";
  } else if (text.includes("disney") || text.includes("hulu")) {
    refundLikelihood = daysSincePurchase <= 7 ? "high" : "low";
    refundTip = daysSincePurchase <= 7
      ? "Disney+/Hulu usually refunds within 7 days if you haven't streamed content."
      : "Contact support - they may offer partial refund or credit.";
    cancelTip = "Go to DisneyPlus.com > Account > Subscription > Cancel";
  } else if (text.includes("adobe")) {
    refundLikelihood = daysSincePurchase <= 14 ? "high" : "medium";
    refundTip = "Adobe offers full refund within 14 days. After that, you may owe early termination fee.";
    cancelTip = "Go to Adobe.com > Account > Plans > Cancel Plan";
  } else if (text.includes("audible")) {
    refundLikelihood = "high";
    refundTip = "Audible has a generous refund policy. You can return audiobooks and cancel anytime for unused credits.";
    cancelTip = "Go to Audible.com > Account > Membership > Cancel";
  } else if (text.includes("claude") || text.includes("anthropic")) {
    refundLikelihood = daysSincePurchase <= 7 ? "medium" : "low";
    refundTip = "Contact Anthropic support. Refunds may be available if you haven't used the service significantly.";
    cancelTip = "Go to Claude.ai > Settings > Subscription > Cancel";
  } else if (text.includes("microsoft") || text.includes("office")) {
    refundLikelihood = daysSincePurchase <= 30 ? "high" : "low";
    refundTip = "Microsoft offers refunds within 30 days for most subscriptions if not extensively used.";
    cancelTip = "Go to account.microsoft.com > Services & subscriptions > Cancel";
  } else if (text.includes("apple") || text.includes("icloud")) {
    refundLikelihood = daysSincePurchase <= 14 ? "medium" : "low";
    refundTip = "Apple considers refund requests through reportaproblem.apple.com within 14 days.";
    cancelTip = "Go to Settings > Apple ID > Subscriptions > Cancel";
  } else if (text.includes("henry meds") || text.includes("henrymeds")) {
    refundLikelihood = daysSincePurchase <= 7 ? "medium" : "low";
    refundTip = "Contact Henry Meds support for refund requests. Unused medication shipments may be eligible for refund.";
    cancelTip = "Go to HenryMeds.com > Account > Subscription > Cancel";
  } else {
    // Generic subscription
    refundLikelihood = daysSincePurchase <= 3 ? "high" : daysSincePurchase <= 7 ? "medium" : "low";
    refundTip = daysSincePurchase <= 7
      ? "Most subscriptions offer refunds within the first week. Contact customer support."
      : "Refunds become harder after the first week. Try contacting support and explain you haven't used the service.";
    cancelTip = "Check your account settings on the service's website to cancel.";
  }

  return { isSubscription: true, refundLikelihood, refundTip, cancelTip };
}

// Shipping progress bar component
function ShippingProgress({ purchase }: { purchase: Purchase }) {
  const status = getShippingStatus(purchase);
  const deliveryDate = purchase.deliveryDate ? dayjs(purchase.deliveryDate).tz(getUserTimeZone()) : null;

  // Skip for digital products and subscriptions
  if (isDigitalOrSubscription(purchase.merchant, purchase.itemDescription)) {
    return null;
  }

  // If delivered, just show delivery date - no progress bar
  if (status === "delivered") {
    return (
      <div className="py-2 border-t border-border">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span className="text-sm text-green-400 font-medium">
            Delivered{deliveryDate ? ` on ${deliveryDate.format("MMM D")}` : ""}
          </span>
        </div>
      </div>
    );
  }

  const steps: { key: ShippingStatus; label: string }[] = [
    { key: "ordered", label: "Ordered" },
    { key: "shipped", label: "Shipped" },
    { key: "out_for_delivery", label: "Out for Delivery" },
    { key: "delivered", label: "Delivered" },
  ];

  const statusIndex = steps.findIndex((s) => s.key === status);

  // Status message based on current status
  const getStatusMessage = () => {
    switch (status) {
      case "out_for_delivery":
        return "Out for delivery today";
      case "shipped":
        return deliveryDate ? `Arriving ${deliveryDate.format("ddd, MMM D")}` : "On the way";
      case "ordered":
        return "Not shipped yet";
      default:
        return "";
    }
  };

  return (
    <div className="py-3 border-t border-border">
      {/* Status message */}
      <div className="flex items-center gap-2 mb-3">
        <Truck className="w-4 h-4" style={{ color: "#D97706" }} />
        <span className="text-sm font-medium text-foreground">
          {getStatusMessage()}
        </span>
        {purchase.carrier && (
          <span className="text-xs text-muted-foreground">via {purchase.carrier}</span>
        )}
      </div>

      {/* Progress bar */}
      <div className="relative">
        {/* Background track */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.key} className="flex flex-col items-center flex-1">
              {/* Step circle */}
              <div
                className={`w-4 h-4 rounded-full flex items-center justify-center z-10 ${
                  index <= statusIndex
                    ? "bg-[#D97706]"
                    : "bg-secondary border border-border"
                }`}
              >
                {index <= statusIndex && (
                  <CheckCircle className="w-3 h-3 text-white" />
                )}
              </div>
              {/* Step label */}
              <span
                className={`text-xs mt-1 text-center ${
                  index <= statusIndex
                    ? "text-foreground font-medium"
                    : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>

        {/* Connecting line (behind the circles) */}
        <div className="absolute top-2 left-[12.5%] right-[12.5%] h-0.5 bg-secondary -z-0" />
        <div
          className="absolute top-2 left-[12.5%] h-0.5 -z-0 transition-all bg-[#D97706]"
          style={{
            width: `${Math.max(0, (statusIndex / (steps.length - 1)) * 75)}%`,
          }}
        />
      </div>

      {/* Tracking number if available and not unknown */}
      {purchase.trackingNumber && !isUnknownValue(purchase.trackingNumber) && (
        <div className="mt-2 text-xs text-muted-foreground">
          Tracking: {purchase.trackingNumber}
        </div>
      )}
    </div>
  );
}

// Return reason options
const RETURN_REASONS = [
  { value: "defective", label: "Defective or doesn't work" },
  { value: "damaged", label: "Arrived damaged" },
  { value: "wrong_item", label: "Wrong item received" },
  { value: "not_as_described", label: "Not as described" },
  { value: "changed_mind", label: "Changed my mind" },
  { value: "too_late", label: "Arrived too late" },
  { value: "other", label: "Other reason" },
];

// Return modal component
function ReturnModal({
  purchase,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  purchase: Purchase;
  onClose: () => void;
  onSubmit: (reason: string, notes: string) => void;
  isSubmitting: boolean;
}) {
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) return;
    onSubmit(reason, notes);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5" style={{ color: "#D97706" }} />
            <h2 className="font-semibold text-foreground">Return Item</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-secondary transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Purchase info */}
        <div className="p-4 border-b border-border bg-secondary/30">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0 mr-3">
              <h3 className="font-medium text-foreground">
                {purchase.itemDescription || purchase.merchant.replace(/\*[a-z0-9]+$/i, "").replace(/Mktpl$/i, "")}
              </h3>
              {purchase.itemDescription && (
                <p className="text-sm text-muted-foreground">
                  {purchase.merchant.replace(/\*[a-z0-9]+$/i, "").replace(/Mktpl$/i, "").trim()}
                </p>
              )}
            </div>
            <span className="font-semibold flex-shrink-0" style={{ color: "#D97706" }}>
              {purchase.amount}
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Why are you returning this item?
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 rounded border border-border bg-background text-foreground"
              required
            >
              <option value="">Select a reason...</option>
              {RETURN_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Additional notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional details about the return..."
              className="w-full px-3 py-2 rounded border border-border bg-background text-foreground placeholder:text-muted-foreground resize-none"
              rows={3}
            />
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
            <p className="text-sm text-amber-400">
              <strong>What happens next:</strong> We'll research the return process for {purchase.merchant} and email you step-by-step instructions with direct links to initiate your return.
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={!reason || isSubmitting}
              className="flex-1 px-4 py-2 rounded text-white disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              style={{ backgroundColor: "#D97706" }}
            >
              {isSubmitting ? (
                <>
                  <LoadingIcon className="w-4 h-4" />
                  Processing...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Get Instructions
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Single purchase card component
function PurchaseCard({ purchase, onMarkReturned, onRequestRefund, onInitiateReturn, onResolve }: {
  purchase: Purchase;
  onMarkReturned: (id: number) => void;
  onRequestRefund: (id: number) => void;
  onInitiateReturn: (id: number) => void;
  onResolve: (id: number) => void;
}) {
  const storeDaysLeft = daysUntil(purchase.storePolicy.expires);
  const cardDaysLeft = daysUntil(purchase.cardProtection.expires);
  const earliestExpiry = [storeDaysLeft, cardDaysLeft].filter((d) => d !== null).sort((a, b) => (a as number) - (b as number))[0];
  const isUrgent = earliestExpiry !== undefined && earliestExpiry <= 7;

  // Card name is now matched on the server via transaction data
  const displayCardName = purchase.cardUsed;

  // Clean up cryptic merchant names (bank transaction descriptions)
  const cleanMerchantName = (name: string) => {
    // Remove common bank transaction suffixes like *nu67u43e1
    let cleaned = name.replace(/\*[a-z0-9]+$/i, "").trim();
    // Clean up common patterns
    cleaned = cleaned.replace(/Mktpl$/i, "Marketplace");
    cleaned = cleaned.replace(/^AMZN\s*/i, "Amazon ");
    cleaned = cleaned.replace(/^Amazon Mktpl$/i, "Amazon");
    cleaned = cleaned.replace(/^Amazon Marketplace$/i, "Amazon");
    return cleaned || name;
  };

  const displayMerchant = cleanMerchantName(purchase.merchant);
  
  // Use item description as primary if available, otherwise use cleaned merchant name
  const primaryTitle = purchase.itemDescription || displayMerchant;
  const secondaryInfo = purchase.itemDescription ? displayMerchant : null;

  return (
    <div className={`border rounded-lg p-4 relative ${isUrgent ? "border-red-500/50 bg-red-500/5" : "border-border bg-card"}`}>
      {/* Resolved toggle button at top right */}
      <button
        onClick={() => onResolve(purchase.id)}
        className={`absolute top-2 right-2 p-1.5 rounded-full transition-colors ${
          purchase.status === "resolved" 
            ? "bg-green-500/20 text-green-500" 
            : "hover:bg-secondary text-muted-foreground hover:text-green-500"
        }`}
        title={purchase.status === "resolved" ? "Unmark resolved" : "Mark as resolved (keeping it)"}
      >
        {purchase.status === "resolved" ? (
          <Check className="w-4 h-4" />
        ) : (
          <Circle className="w-4 h-4" />
        )}
      </button>

      <div className="flex justify-between items-start mb-3 pr-6">
        <div className="flex-1 min-w-0 mr-3">
          <h3 className="font-semibold text-foreground text-lg leading-tight">{primaryTitle}</h3>
          {secondaryInfo && (
            <p className="text-sm text-muted-foreground mt-0.5">{secondaryInfo}</p>
          )}
        </div>
        <span className="text-lg font-bold flex-shrink-0" style={{ color: "#D97706" }}>
          {purchase.amount}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>Purchased: {formatDate(purchase.purchaseDate)}</span>
        </div>
        {displayCardName && !isUnknownValue(displayCardName) && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <CreditCard className="w-4 h-4" />
            <span>{displayCardName}</span>
          </div>
        )}
      </div>

      {/* Delivery address - only show if it's a real address, not unknown */}
      {purchase.deliveryAddress && !isUnknownValue(purchase.deliveryAddress) && (
        <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <span>{purchase.deliveryAddress}</span>
        </div>
      )}

      {/* Shipping progress bar for physical products */}
      <ShippingProgress purchase={purchase} />

      {/* Subscription refund info or refund pending progress */}
      {(() => {
        const subscriptionInfo = getSubscriptionRefundInfo(purchase.merchant, purchase.itemDescription, purchase.purchaseDate);
        if (!subscriptionInfo) return null;

        // If refund has been requested, show pending progress
        if (purchase.status === "return_initiated") {
          return (
            <div className="py-3 border-t border-border space-y-3">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" style={{ color: "#D97706" }} />
                <span className="text-sm font-medium text-foreground">Refund Requested</span>
                <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">
                  Pending
                </span>
              </div>

              {/* Progress bar */}
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col items-center flex-1">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center z-10 bg-[#D97706]">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-xs mt-1 text-center text-foreground font-medium">Requested</span>
                  </div>
                  <div className="flex flex-col items-center flex-1">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center z-10 bg-[#D97706]">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-xs mt-1 text-center text-foreground font-medium">Processing</span>
                  </div>
                  <div className="flex flex-col items-center flex-1">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center z-10 bg-secondary border border-border" />
                    <span className="text-xs mt-1 text-center text-muted-foreground">Refunded</span>
                  </div>
                </div>
                <div className="absolute top-2 left-[16.5%] right-[16.5%] h-0.5 bg-secondary -z-0" />
                <div className="absolute top-2 left-[16.5%] h-0.5 -z-0 transition-all bg-[#D97706]" style={{ width: "33%" }} />
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Waiting for refund to be processed. We'll check your bank transactions and notify you when the refund arrives.
              </p>
            </div>
          );
        }

        const likelihoodColors = {
          high: "text-green-400",
          medium: "text-yellow-400",
          low: "text-red-400",
        };
        const likelihoodBgColors = {
          high: "bg-green-500/20",
          medium: "bg-yellow-500/20",
          low: "bg-red-500/20",
        };
        const likelihoodLabels = {
          high: "High",
          medium: "Medium",
          low: "Low",
        };

        return (
          <div className="py-3 border-t border-border space-y-2">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" style={{ color: "#D97706" }} />
              <span className="text-sm font-medium text-foreground">Subscription</span>
              <span className={`text-xs px-2 py-0.5 rounded ${likelihoodBgColors[subscriptionInfo.refundLikelihood]} ${likelihoodColors[subscriptionInfo.refundLikelihood]}`}>
                {likelihoodLabels[subscriptionInfo.refundLikelihood]} refund chance
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {subscriptionInfo.refundTip}
            </p>
          </div>
        );
      })()}

      {/* Store return policy section - only show after delivery */}
      {(() => {
        const shippingStatus = getShippingStatus(purchase);
        const isDelivered = shippingStatus === "delivered";
        const isDigital = isDigitalOrSubscription(purchase.merchant, purchase.itemDescription);
        
        // Only show store return for delivered items or digital products
        if (!isDelivered && !isDigital) return null;
        if (!purchase.storePolicy.windowDays) return null;
        if (!purchase.storePolicy.expires) return null;
        
        return (
          <div
            className="flex items-center justify-between py-2 border-t border-border cursor-help"
            title={`${purchase.storePolicy.windowDays} days from ${purchase.storePolicy.startsFrom || "purchase"}`}
          >
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4" style={{ color: "#D97706" }} />
              <span className="text-sm text-foreground">Store Return</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {formatDate(purchase.storePolicy.expires)}
              </span>
              <ExpirationBadge days={storeDaysLeft} />
            </div>
          </div>
        );
      })()}

      {/* Card protection section - only show when store return window has expired */}
      {purchase.cardProtection.windowDays && (!purchase.storePolicy.windowDays || (storeDaysLeft !== null && storeDaysLeft < 0)) && (
        <div className="flex items-center justify-between py-2 border-t border-border">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" style={{ color: "#D97706" }} />
            <div className="text-sm">
              <span className="text-foreground">
                {purchase.cardUsed && purchase.cardUsed !== "CREDIT CARD"
                  ? `${purchase.cardUsed} Protection`
                  : "Card Protection"}: {purchase.cardProtection.windowDays} days
              </span>
              {purchase.cardProtection.maxClaim && (
                <span className="text-muted-foreground"> (up to {purchase.cardProtection.maxClaim})</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {formatDate(purchase.cardProtection.expires)}
            </span>
            <ExpirationBadge days={cardDaysLeft} />
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 mt-3">
        {(() => {
          const shippingStatus = getShippingStatus(purchase);
          const isDelivered = shippingStatus === "delivered";
          const isDigital = isDigitalOrSubscription(purchase.merchant, purchase.itemDescription);
          const subscriptionInfo = getSubscriptionRefundInfo(purchase.merchant, purchase.itemDescription, purchase.purchaseDate);
          const isSubscription = subscriptionInfo?.isSubscription;
          // For digital products, they're "delivered" immediately. For physical, check delivery status
          const canReturn = isDigital || isDelivered;
          const hasReturnWindow = storeDaysLeft === null || storeDaysLeft >= 0 || cardDaysLeft === null || cardDaysLeft >= 0;
          const isRefundPending = purchase.status === "return_initiated";

          // For subscriptions, show "Ask for Refund" button (unless refund is pending)
          if (isSubscription) {
            // Don't show button if refund already requested
            if (isRefundPending) {
              return null;
            }
            return (
              <button
                onClick={() => onRequestRefund(purchase.id)}
                className="flex-1 px-3 py-1.5 text-sm rounded text-white hover:opacity-90 transition-colors flex items-center justify-center gap-1"
                style={{ backgroundColor: "#D97706" }}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Ask for Refund
              </button>
            );
          }

          // For physical products, show return buttons only when delivered
          return (
            <>
              {canReturn && hasReturnWindow && (
                <button
                  onClick={() => onInitiateReturn(purchase.id)}
                  className="flex-1 px-3 py-1.5 text-sm rounded text-white hover:opacity-90 transition-colors flex items-center justify-center gap-1"
                  style={{ backgroundColor: "#D97706" }}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Return This
                </button>
              )}
              {canReturn && (
                <button
                  onClick={() => onMarkReturned(purchase.id)}
                  className="flex-1 px-3 py-1.5 text-sm rounded bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                >
                  Mark Returned
                </button>
              )}
            </>
          );
        })()}
      </div>
    </div>
  );
}

// Add purchase form with receipt scanning
function AddPurchaseForm({ onSuccess }: { onSuccess: () => void }) {
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [cardUsed, setCardUsed] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  const addMutation = useMutation({
    mutationFn: (data: { merchant: string; amount: number; cardUsed?: string; itemDescription?: string; purchaseDate?: string }) =>
      call<typeof addPurchase>("addPurchase", data),
    onSuccess: () => {
      resetForm();
      onSuccess();
    },
  });

  const scanMutation = useMutation({
    mutationFn: (imageDataUrl: string) =>
      call<typeof scanReceipt>("scanReceipt", { imageDataUrl }),
    onSuccess: (result) => {
      if (result.success && result.data) {
        // Auto-fill form with extracted data
        if (result.data.merchant) setMerchant(result.data.merchant);
        if (result.data.amount) setAmount(result.data.amount.toString());
        if (result.data.cardUsed) setCardUsed(result.data.cardUsed);
        if (result.data.itemDescription) setItemDescription(result.data.itemDescription);
        if (result.data.purchaseDate) setPurchaseDate(result.data.purchaseDate);
        setScanError(null);
      } else {
        setScanError(result.error || "Failed to scan receipt");
      }
    },
    onError: () => {
      setScanError("Failed to scan receipt. Please try again.");
    },
  });

  const resetForm = () => {
    setMerchant("");
    setAmount("");
    setCardUsed("");
    setItemDescription("");
    setPurchaseDate("");
    setReceiptPreview(null);
    setScanError(null);
    setIsOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setScanError("Please upload an image file");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setScanError("Image too large. Please upload an image under 10MB.");
      return;
    }

    // Convert to base64 data URL
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setReceiptPreview(dataUrl);
      setScanError(null);
      // Automatically scan the receipt
      scanMutation.mutate(dataUrl);
    };
    reader.onerror = () => {
      setScanError("Failed to read image file");
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchant || !amount) return;

    addMutation.mutate({
      merchant,
      amount: parseFloat(amount),
      cardUsed: cardUsed || undefined,
      itemDescription: itemDescription || undefined,
      purchaseDate: purchaseDate || undefined,
    });
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full py-3 px-4 border border-dashed border-border rounded-lg text-muted-foreground hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
      >
        <Package className="w-5 h-5" />
        Add Purchase Manually
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="border border-border rounded-lg p-4 bg-card">
      <h3 className="font-semibold text-foreground mb-3">Add New Purchase</h3>
      <div className="space-y-3">
        {/* Receipt Upload Section */}
        <div className="border border-dashed border-border rounded-lg p-4 bg-background/50">
          <div className="flex flex-col items-center gap-3">
            {receiptPreview ? (
              <div className="relative w-full">
                <img
                  src={receiptPreview}
                  alt="Receipt preview"
                  className="w-full max-h-48 object-contain rounded-lg"
                />
                {scanMutation.isPending && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
                    <div className="flex items-center gap-2 text-primary">
                      <LoadingIcon className="w-5 h-5" />
                      <span className="text-sm font-medium">Scanning receipt...</span>
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setReceiptPreview(null);
                    setScanError(null);
                  }}
                  className="absolute top-2 right-2 p-1 rounded-full bg-background/80 hover:bg-background text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 cursor-pointer transition-colors">
                    <Camera className="w-4 h-4" />
                    <span className="text-sm">Scan Receipt</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  <span className="text-muted-foreground text-sm">or</span>
                  <label className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 cursor-pointer transition-colors">
                    <ImageIcon className="w-4 h-4" />
                    <span className="text-sm">Upload Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Take a photo or upload an image of your receipt to auto-fill
                </p>
              </>
            )}
            {scanError && (
              <p className="text-sm text-red-400">{scanError}</p>
            )}
            {scanMutation.isSuccess && !scanError && receiptPreview && (
              <p className="text-sm text-green-400 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Receipt scanned - verify details below
              </p>
            )}
          </div>
        </div>

        <div className="border-t border-border pt-3">
          <p className="text-xs text-muted-foreground mb-2">Or enter details manually:</p>
        </div>

        <input
          type="text"
          value={merchant}
          onChange={(e) => setMerchant(e.target.value)}
          placeholder="Merchant name (e.g., Amazon, Apple)"
          className="w-full px-3 py-2 rounded border border-border bg-background text-foreground placeholder:text-muted-foreground"
          required
        />
        <input
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount ($)"
          className="w-full px-3 py-2 rounded border border-border bg-background text-foreground placeholder:text-muted-foreground"
          required
        />
        <input
          type="text"
          value={cardUsed}
          onChange={(e) => setCardUsed(e.target.value)}
          placeholder="Card used (optional)"
          className="w-full px-3 py-2 rounded border border-border bg-background text-foreground placeholder:text-muted-foreground"
        />
        <input
          type="text"
          value={itemDescription}
          onChange={(e) => setItemDescription(e.target.value)}
          placeholder="Item description (optional)"
          className="w-full px-3 py-2 rounded border border-border bg-background text-foreground placeholder:text-muted-foreground"
        />
        <input
          type="date"
          value={purchaseDate}
          onChange={(e) => setPurchaseDate(e.target.value)}
          className="w-full px-3 py-2 rounded border border-border bg-background text-foreground placeholder:text-muted-foreground"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={addMutation.isPending || scanMutation.isPending || !merchant || !amount}
            className="flex-1 py-2 rounded text-white disabled:opacity-50 transition-colors"
            style={{ backgroundColor: "#D97706" }}
          >
            {addMutation.isPending ? "Adding..." : "Add Purchase"}
          </button>
          <button
            type="button"
            onClick={resetForm}
            className="px-4 py-2 rounded bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}

// Main purchases list component
function PurchasesList() {
  const queryClient = useQueryClient();
  const [returnModalPurchase, setReturnModalPurchase] = useState<Purchase | null>(null);

  const { data: purchases, isLoading, error, refetch } = useQuery({
    queryKey: ["trackedPurchases"],
    queryFn: () => call<typeof getTrackedPurchases>("getTrackedPurchases", {}),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ purchaseId, status }: { purchaseId: number; status: "returned" | "dismissed" | "return_initiated" | "resolved" | "tracking" }) =>
      call<typeof updatePurchaseStatus>("updatePurchaseStatus", { purchaseId, status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trackedPurchases"] });
    },
  });

  const initiateReturnMutation = useMutation({
    mutationFn: ({ purchaseId, returnReason, additionalNotes }: { purchaseId: number; returnReason: string; additionalNotes?: string }) =>
      call<typeof initiateReturn>("initiateReturn", { purchaseId, returnReason, additionalNotes }),
    onSuccess: (result) => {
      if (result.success) {
        setReturnModalPurchase(null);
        queryClient.invalidateQueries({ queryKey: ["trackedPurchases"] });
      }
    },
  });

  const [isScanning, setIsScanning] = useState(false);
  
  // Unified filters
  type FilterType = "all" | "subscriptions" | "processing" | "resolved";
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const handleScanEmails = async () => {
    setIsScanning(true);
    try {
      await call<typeof scanRecentEmails>("scanRecentEmails", { daysBack: 60 });
      // Refetch purchases after scan completes
      queryClient.invalidateQueries({ queryKey: ["trackedPurchases"] });
    } catch (err) {
      console.error("Email scan failed:", err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleMarkReturned = (id: number) => {
    updateStatusMutation.mutate({ purchaseId: id, status: "returned" });
  };

  const handleRequestRefund = (id: number) => {
    // For subscriptions, mark as return_initiated to track pending refund
    updateStatusMutation.mutate({ purchaseId: id, status: "return_initiated" });
  };

  const handleResolve = (id: number) => {
    // Toggle between resolved and tracking
    const purchase = purchases?.find((p) => p.id === id);
    const newStatus = purchase?.status === "resolved" ? "tracking" : "resolved";
    updateStatusMutation.mutate({ purchaseId: id, status: newStatus });
  };

  const handleInitiateReturn = (id: number) => {
    const purchase = purchases?.find((p) => p.id === id);
    if (purchase) {
      setReturnModalPurchase(purchase as Purchase);
    }
  };

  const handleReturnSubmit = (reason: string, notes: string) => {
    if (!returnModalPurchase) return;
    initiateReturnMutation.mutate({
      purchaseId: returnModalPurchase.id,
      returnReason: reason,
      additionalNotes: notes || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingIcon className="w-8 h-8 text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        <p>Error loading purchases</p>
        <button
          onClick={() => refetch()}
          className="mt-2 px-4 py-2 rounded bg-secondary text-secondary-foreground hover:bg-secondary/80"
        >
          Try Again
        </button>
      </div>
    );
  }

  const purchasesList = purchases || [];

  // Calculate counts for each filter
  const subscriptionCount = purchasesList.filter((p) =>
    isDigitalOrSubscription(p.merchant, p.itemDescription) && p.status !== "resolved"
  ).length;
  const processingCount = purchasesList.filter((p) => p.status === "return_initiated").length;
  const resolvedCount = purchasesList.filter((p) => p.status === "resolved").length;
  const activeCount = purchasesList.filter((p) => 
    p.status !== "resolved" && !isDigitalOrSubscription(p.merchant, p.itemDescription)
  ).length;

  // Apply active filter
  const filteredPurchases = purchasesList.filter((p) => {
    switch (activeFilter) {
      case "subscriptions":
        return isDigitalOrSubscription(p.merchant, p.itemDescription) && p.status !== "resolved";
      case "processing":
        return p.status === "return_initiated";
      case "resolved":
        return p.status === "resolved";
      case "all":
      default:
        // Show all active non-subscription items
        return p.status !== "resolved" && !isDigitalOrSubscription(p.merchant, p.itemDescription);
    }
  });

  // Sort by purchase date (latest first)
  const sortedPurchases = [...filteredPurchases].sort((a, b) => {
    const aDate = a.purchaseDate ? dayjs(a.purchaseDate).tz(getUserTimeZone()).valueOf() : 0;
    const bDate = b.purchaseDate ? dayjs(b.purchaseDate).tz(getUserTimeZone()).valueOf() : 0;
    return bDate - aDate;
  });

  // Filter labels
  const filterLabels: Record<FilterType, string> = {
    all: "Active",
    subscriptions: "Subscriptions",
    processing: "Processing",
    resolved: "Resolved",
  };

  return (
    <>
      <div className="space-y-4">
        {/* Header with title and scan button */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            {filterLabels[activeFilter]} ({sortedPurchases.length})
          </h2>
          <button
            onClick={handleScanEmails}
            disabled={isScanning}
            className="p-2 rounded hover:bg-secondary transition-colors disabled:opacity-50"
            title="Scan emails and refresh"
          >
            {isScanning ? (
              <LoadingIcon className="w-4 h-4" />
            ) : (
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        </div>

        {/* Filter Dropdown */}
        <div className="relative">
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value as FilterType)}
            className="w-full appearance-none bg-secondary/50 border border-border rounded-lg px-4 py-2.5 pr-10 text-sm font-medium text-foreground cursor-pointer hover:bg-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-[#D97706]/50"
          >
            <option value="all">
              📦 Active Purchases ({activeCount})
            </option>
            <option value="subscriptions">
              🔄 Subscriptions ({subscriptionCount})
            </option>
            <option value="processing">
              ⏳ Processing Returns ({processingCount})
            </option>
            <option value="resolved">
              ✓ Resolved ({resolvedCount})
            </option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>

        {purchasesList.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No purchases being tracked yet.</p>
            <p className="text-sm mt-1">Add a purchase manually or wait for automatic detection.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedPurchases.map((purchase) => (
              <PurchaseCard
                key={purchase.id}
                purchase={purchase as Purchase}
                onMarkReturned={handleMarkReturned}
                onRequestRefund={handleRequestRefund}
                onInitiateReturn={handleInitiateReturn}
                onResolve={handleResolve}
              />
            ))}
          </div>
        )}

        <AddPurchaseForm onSuccess={() => queryClient.invalidateQueries({ queryKey: ["trackedPurchases"] })} />
      </div>

      {/* Return Modal */}
      {returnModalPurchase && (
        <ReturnModal
          purchase={returnModalPurchase}
          onClose={() => setReturnModalPurchase(null)}
          onSubmit={handleReturnSubmit}
          isSubmitting={initiateReturnMutation.isPending}
        />
      )}
    </>
  );
}

// Widget view - compact summary
function WidgetView() {
  const { data: expiring, isLoading } = useQuery({
    queryKey: ["expiringPurchases"],
    queryFn: () => call<typeof getExpiringPurchases>("getExpiringPurchases", { withinDays: 14 }),
  });

  const { data: allPurchases } = useQuery({
    queryKey: ["trackedPurchases"],
    queryFn: () => call<typeof getTrackedPurchases>("getTrackedPurchases", {}),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingIcon className="w-6 h-6 text-[#D97706]" />
      </div>
    );
  }

  const totalTracked = allPurchases?.length || 0;
  const expiringCount = expiring?.length || 0;
  const urgentCount = expiring?.filter((p) => {
    const storeDays = p.daysUntilStoreExpires;
    const cardDays = p.daysUntilCardExpires;
    const min = Math.min(storeDays ?? Infinity, cardDays ?? Infinity);
    return min <= 2;
  }).length || 0;

  return (
    <div className="h-full flex flex-col p-3">
      <div className="flex items-center gap-2 mb-3">
        <Shield className="w-5 h-5" style={{ color: "#D97706" }} />
        <span className="font-semibold text-foreground text-sm">Return Guardian</span>
      </div>

      <div className="flex-1 flex flex-col justify-center space-y-2">
        <div className="text-center">
          <div className="text-3xl font-bold" style={{ color: "#D97706" }}>
            {totalTracked}
          </div>
          <div className="text-xs text-muted-foreground">purchases tracked</div>
        </div>

        {expiringCount > 0 && (
          <div className={`text-center p-2 rounded ${urgentCount > 0 ? "bg-red-500/10" : "bg-yellow-500/10"}`}>
            <div className={`text-lg font-semibold ${urgentCount > 0 ? "text-red-400" : "text-yellow-400"}`}>
              {expiringCount} expiring soon
            </div>
            {urgentCount > 0 && (
              <div className="text-xs text-red-400">{urgentCount} urgent</div>
            )}
          </div>
        )}

        {expiringCount === 0 && totalTracked > 0 && (
          <div className="text-center p-2 rounded bg-green-500/10">
            <div className="text-sm text-green-400">All safe for now</div>
          </div>
        )}
      </div>
    </div>
  );
}

// Full app view
function AppView() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-4" style={{ backgroundColor: "#D97706" }}>
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Shield className="w-8 h-8 text-white" />
          <div>
            <h1 className="text-xl font-bold text-white">Return Window Guardian</h1>
            <p className="text-sm text-white/80">Never miss a return deadline</p>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-3xl mx-auto p-6">
        <PurchasesList />
      </main>
    </div>
  );
}

export default function App({ renderContext }: { renderContext: RenderContext }) {
  return (
    <QueryClientProvider client={agentQueryClient}>
      {renderContext.type === "widget" ? <WidgetView /> : <AppView />}
    </QueryClientProvider>
  );
}
