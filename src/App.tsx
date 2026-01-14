import "@dev-agents/sdk-client/styles/base";
import { agentQueryClient, call } from "@dev-agents/sdk-client";
import { getUserTimeZone } from "@dev-agents/sdk-shared";
import { QueryClientProvider, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useState } from "react";
import { AlertTriangle, ArrowLeft, Bot, Calendar, Camera, Check, CheckCircle, ChevronDown, Circle, Clock, CreditCard, ExternalLink, Image as ImageIcon, Mail, MapPin, Package, RefreshCw, RotateCcw, Send, Shield, Store, Truck, X } from "lucide-react";
// Note: CreditCard icon kept for displaying card info in purchase cards
import type {
  getTrackedPurchases,
  addPurchase,
  updatePurchaseStatus,
  getExpiringPurchases,
  scanReceipt,
  initiateReturn,
  returnLineItems,
  scanRecentEmails,
  markAsDelivered,
  getReturnInstructions,
  emailReturnInstructions,
  triggerAutomatedReturn,
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

// Type for line items within a purchase (for multi-item orders)
interface LineItem {
  id: number;
  description: string;
  quantity: number | null;
  amountCents: number | null;
  amount: string | null;
  status: string | null; // "keeping", "returning", "returned"
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
  productImageUrl: string | null;
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
  // Line items for multi-item orders (e.g., Nordstrom)
  hasLineItems: boolean;
  lineItemCount: number;
  lineItems: LineItem[];
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

// Merchant icon configuration - returns icon URL or null for fallback
function getMerchantIcon(merchant: string): { url: string; bgColor: string } | null {
  const m = merchant.toLowerCase();
  
  // Major retailers with recognizable logos (using high-quality favicon/logo URLs)
  const merchantIcons: Record<string, { url: string; bgColor: string }> = {
    // E-commerce
    amazon: { url: "https://www.amazon.com/favicon.ico", bgColor: "#FF9900" },
    amzn: { url: "https://www.amazon.com/favicon.ico", bgColor: "#FF9900" },
    ebay: { url: "https://www.ebay.com/favicon.ico", bgColor: "#E53238" },
    etsy: { url: "https://www.etsy.com/favicon.ico", bgColor: "#F56400" },
    walmart: { url: "https://www.walmart.com/favicon.ico", bgColor: "#0071CE" },
    target: { url: "https://www.target.com/favicon.ico", bgColor: "#CC0000" },
    costco: { url: "https://www.costco.com/favicon.ico", bgColor: "#E31837" },
    bestbuy: { url: "https://www.bestbuy.com/favicon.ico", bgColor: "#0046BE" },
    "best buy": { url: "https://www.bestbuy.com/favicon.ico", bgColor: "#0046BE" },
    homedepot: { url: "https://www.homedepot.com/favicon.ico", bgColor: "#F96302" },
    "home depot": { url: "https://www.homedepot.com/favicon.ico", bgColor: "#F96302" },
    lowes: { url: "https://www.lowes.com/favicon.ico", bgColor: "#004990" },
    "lowe's": { url: "https://www.lowes.com/favicon.ico", bgColor: "#004990" },
    wayfair: { url: "https://www.wayfair.com/favicon.ico", bgColor: "#7B189F" },
    ikea: { url: "https://www.ikea.com/favicon.ico", bgColor: "#0058A3" },
    
    // Tech
    apple: { url: "https://www.apple.com/favicon.ico", bgColor: "#000000" },
    microsoft: { url: "https://www.microsoft.com/favicon.ico", bgColor: "#00A4EF" },
    google: { url: "https://www.google.com/favicon.ico", bgColor: "#4285F4" },
    samsung: { url: "https://www.samsung.com/favicon.ico", bgColor: "#1428A0" },
    dell: { url: "https://www.dell.com/favicon.ico", bgColor: "#007DB8" },
    hp: { url: "https://www.hp.com/favicon.ico", bgColor: "#0096D6" },
    lenovo: { url: "https://www.lenovo.com/favicon.ico", bgColor: "#E2231A" },
    
    // Fashion
    nike: { url: "https://www.nike.com/favicon.ico", bgColor: "#000000" },
    adidas: { url: "https://www.adidas.com/favicon.ico", bgColor: "#000000" },
    zara: { url: "https://www.zara.com/favicon.ico", bgColor: "#000000" },
    "h&m": { url: "https://www.hm.com/favicon.ico", bgColor: "#E50010" },
    uniqlo: { url: "https://www.uniqlo.com/favicon.ico", bgColor: "#FF0000" },
    gap: { url: "https://www.gap.com/favicon.ico", bgColor: "#000080" },
    nordstrom: { url: "https://www.nordstrom.com/favicon.ico", bgColor: "#000000" },
    macys: { url: "https://www.macys.com/favicon.ico", bgColor: "#E21A2C" },
    "macy's": { url: "https://www.macys.com/favicon.ico", bgColor: "#E21A2C" },
    
    // Streaming/Digital
    netflix: { url: "https://www.netflix.com/favicon.ico", bgColor: "#E50914" },
    spotify: { url: "https://www.spotify.com/favicon.ico", bgColor: "#1DB954" },
    hulu: { url: "https://www.hulu.com/favicon.ico", bgColor: "#1CE783" },
    disney: { url: "https://www.disneyplus.com/favicon.ico", bgColor: "#113CCF" },
    hbo: { url: "https://www.hbomax.com/favicon.ico", bgColor: "#000000" },
    youtube: { url: "https://www.youtube.com/favicon.ico", bgColor: "#FF0000" },
    audible: { url: "https://www.audible.com/favicon.ico", bgColor: "#F8991D" },
    adobe: { url: "https://www.adobe.com/favicon.ico", bgColor: "#FF0000" },
    
    // Food/Grocery
    doordash: { url: "https://www.doordash.com/favicon.ico", bgColor: "#FF3008" },
    ubereats: { url: "https://www.ubereats.com/favicon.ico", bgColor: "#06C167" },
    "uber eats": { url: "https://www.ubereats.com/favicon.ico", bgColor: "#06C167" },
    grubhub: { url: "https://www.grubhub.com/favicon.ico", bgColor: "#F63440" },
    instacart: { url: "https://www.instacart.com/favicon.ico", bgColor: "#43B02A" },
    wholefoods: { url: "https://www.wholefoodsmarket.com/favicon.ico", bgColor: "#00674B" },
    "whole foods": { url: "https://www.wholefoodsmarket.com/favicon.ico", bgColor: "#00674B" },
    starbucks: { url: "https://www.starbucks.com/favicon.ico", bgColor: "#00704A" },
    
    // Other
    chewy: { url: "https://www.chewy.com/favicon.ico", bgColor: "#1C49C2" },
    sephora: { url: "https://www.sephora.com/favicon.ico", bgColor: "#000000" },
    ulta: { url: "https://www.ulta.com/favicon.ico", bgColor: "#000000" },
    cvs: { url: "https://www.cvs.com/favicon.ico", bgColor: "#CC0000" },
    walgreens: { url: "https://www.walgreens.com/favicon.ico", bgColor: "#E31837" },
  };

  // Check for matches
  for (const [key, icon] of Object.entries(merchantIcons)) {
    if (m.includes(key)) {
      return icon;
    }
  }
  
  return null;
}

// Product/Merchant image component with animated fallback
function ProductImage({ merchant, productImageUrl, className }: { 
  merchant: string; 
  productImageUrl?: string | null;
  className?: string;
}) {
  const [imageError, setImageError] = useState(false);
  
  // If we have a product image URL, try to use it
  if (productImageUrl && !imageError) {
    return (
      <div className={`rounded-lg overflow-hidden bg-white ${className || "w-12 h-12"}`}>
        <img 
          src={productImageUrl} 
          alt="Product"
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      </div>
    );
  }
  
  // Dynamic gradient fallback based on merchant name
  const gradients = [
    "from-rose-500 to-orange-400",
    "from-orange-500 to-amber-400", 
    "from-emerald-500 to-teal-400",
    "from-teal-500 to-cyan-400",
    "from-blue-500 to-indigo-400",
    "from-indigo-500 to-purple-400",
    "from-purple-500 to-pink-400",
    "from-pink-500 to-rose-400",
    "from-slate-600 to-slate-400",
    "from-zinc-600 to-zinc-400",
  ];
  
  const gradientIndex = merchant.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % gradients.length;
  const gradient = gradients[gradientIndex];
  const initial = merchant.charAt(0).toUpperCase();
  
  // Clean merchant name for display
  const cleanName = merchant.replace(/\*[a-z0-9]+$/i, "").replace(/Mktpl$/i, "").trim();
  const secondInitial = cleanName.split(" ")[1]?.charAt(0).toUpperCase() || "";
  
  return (
    <div 
      className={`rounded-lg flex items-center justify-center bg-gradient-to-br ${gradient} shadow-sm ${className || "w-12 h-12"}`}
    >
      <div className="relative">
        {/* Subtle shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" 
          style={{ animationDuration: "3s" }} 
        />
        <span className="text-white font-bold text-lg drop-shadow-sm">
          {initial}{secondInitial}
        </span>
      </div>
    </div>
  );
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
        <Truck className="w-4 h-4" style={{ color: "#0D9488" }} />
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
                    ? "bg-[#0D9488]"
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
          className="absolute top-2 left-[12.5%] h-0.5 -z-0 transition-all bg-[#0D9488]"
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

// Return instructions data type
interface ReturnInstructions {
  merchant: string;
  orderNumber: string | null;
  itemDescription: string | null;
  amount: string;
  returnUrl: string | null;
  returnAction: string;
  daysLeft: number | null;
  steps: string[];
  supportedAutomation: boolean;
}

// Return modal component - supports both single items and multi-item orders
function ReturnModal({
  purchase,
  onClose,
  onSubmit,
  onSubmitLineItems,
  isSubmitting,
}: {
  purchase: Purchase;
  onClose: () => void;
  onSubmit: (reason: string, notes: string, action: "view" | "email" | "automate") => void;
  onSubmitLineItems: (lineItemIds: number[], reason: string, notes: string, action: "view" | "email" | "automate") => void;
  isSubmitting: boolean;
}) {
  // Steps: select_items -> select_reason -> choose_action -> show_instructions
  const [step, setStep] = useState<"select_items" | "select_reason" | "choose_action" | "show_instructions">(
    purchase.hasLineItems ? "select_items" : "select_reason"
  );
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedAction, setSelectedAction] = useState<"view" | "email" | "automate" | null>(null);
  const [instructions, setInstructions] = useState<ReturnInstructions | null>(null);
  const [isLoadingInstructions, setIsLoadingInstructions] = useState(false);
  const [automationStatus, setAutomationStatus] = useState<"idle" | "running" | "success" | "failed">("idle");

  // Toggle selection of a line item
  const toggleItem = (itemId: number) => {
    setSelectedItemIds((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  // Select/deselect all
  const selectAll = () => {
    const keepingItems = purchase.lineItems.filter((item) => item.status === "keeping");
    if (selectedItemIds.length === keepingItems.length) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(keepingItems.map((item) => item.id));
    }
  };

  const handleContinueToReason = () => {
    if (purchase.hasLineItems && selectedItemIds.length === 0) return;
    setStep("select_reason");
  };

  const handleContinueToActions = () => {
    if (!reason) return;
    setStep("choose_action");
  };

  const handleBack = () => {
    switch (step) {
      case "select_reason":
        if (purchase.hasLineItems) {
          setStep("select_items");
        } else {
          onClose();
        }
        break;
      case "choose_action":
        setStep("select_reason");
        break;
      case "show_instructions":
        setStep("choose_action");
        break;
      default:
        onClose();
    }
  };

  const handleSelectAction = async (action: "view" | "email" | "automate") => {
    setSelectedAction(action);
    
    if (action === "view") {
      // Fetch and display instructions
      setIsLoadingInstructions(true);
      try {
        const result = await call<typeof getReturnInstructions>("getReturnInstructions", {
          purchaseId: purchase.id,
          returnReason: reason,
        });
        if (result.success && result.instructions) {
          setInstructions(result.instructions);
          setStep("show_instructions");
        }
      } catch (error) {
        console.error("Failed to get instructions:", error);
      } finally {
        setIsLoadingInstructions(false);
      }
    } else if (action === "email") {
      // Email instructions to user
      if (purchase.hasLineItems) {
        onSubmitLineItems(selectedItemIds, reason, notes, "email");
      } else {
        onSubmit(reason, notes, "email");
      }
    } else if (action === "automate") {
      // Trigger automated return
      setAutomationStatus("running");
      try {
        const result = await call<typeof triggerAutomatedReturn>("triggerAutomatedReturn", {
          purchaseId: purchase.id,
          returnReason: reason,
          additionalNotes: notes || undefined,
        });
        if (result.success) {
          setAutomationStatus("success");
          // Update status after successful automation trigger
          if (purchase.hasLineItems) {
            onSubmitLineItems(selectedItemIds, reason, notes, "automate");
          } else {
            onSubmit(reason, notes, "automate");
          }
        } else {
          setAutomationStatus("failed");
        }
      } catch (error) {
        console.error("Automation failed:", error);
        setAutomationStatus("failed");
      }
    }
  };

  // Get items that can still be returned (status = "keeping")
  const returnableItems = purchase.lineItems.filter((item) => item.status === "keeping");
  const alreadyReturnedItems = purchase.lineItems.filter((item) => item.status === "returned");

  // Check if this merchant supports automation
  const supportsAutomation = () => {
    const m = purchase.merchant.toLowerCase();
    return m.includes("amazon") || m.includes("walmart") || m.includes("target");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5" style={{ color: "#0D9488" }} />
            <h2 className="font-semibold text-foreground">
              {step === "select_items" && "Select Items to Return"}
              {step === "select_reason" && "Return Reason"}
              {step === "choose_action" && "How Would You Like to Proceed?"}
              {step === "show_instructions" && "Return Instructions"}
            </h2>
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
                {purchase.merchant.replace(/\*[a-z0-9]+$/i, "").replace(/Mktpl$/i, "")}
              </h3>
              {purchase.hasLineItems ? (
                <p className="text-sm text-muted-foreground">
                  {purchase.lineItemCount} item{purchase.lineItemCount !== 1 ? "s" : ""} in order
                </p>
              ) : (
                purchase.itemDescription && (
                  <p className="text-sm text-muted-foreground truncate">{purchase.itemDescription}</p>
                )
              )}
            </div>
            <span className="font-semibold flex-shrink-0" style={{ color: "#0D9488" }}>
              {purchase.amount}
            </span>
          </div>
        </div>

        {/* Step 1: Select Items (only for multi-item orders) */}
        {step === "select_items" && (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">
                Which item(s) are you returning?
              </label>
              <button
                type="button"
                onClick={selectAll}
                className="text-xs text-teal-400 hover:text-teal-300 transition-colors"
              >
                {selectedItemIds.length === returnableItems.length ? "Deselect All" : "Select All"}
              </button>
            </div>

            <div className="space-y-2">
              {returnableItems.map((item) => (
                <label
                  key={item.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedItemIds.includes(item.id)
                      ? "border-teal-500 bg-teal-500/10"
                      : "border-border hover:bg-secondary/50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedItemIds.includes(item.id)}
                    onChange={() => toggleItem(item.id)}
                    className="sr-only"
                  />
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      selectedItemIds.includes(item.id)
                        ? "border-teal-500 bg-teal-500"
                        : "border-muted-foreground"
                    }`}
                  >
                    {selectedItemIds.includes(item.id) && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{item.description}</p>
                    {item.quantity && item.quantity > 1 && (
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                    )}
                  </div>
                  {item.amount && (
                    <span className="text-sm text-muted-foreground flex-shrink-0">{item.amount}</span>
                  )}
                </label>
              ))}
            </div>

            {/* Already returned items */}
            {alreadyReturnedItems.length > 0 && (
              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2">Already returned:</p>
                <div className="space-y-1">
                  {alreadyReturnedItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 text-xs text-muted-foreground opacity-60">
                      <Check className="w-3 h-3 text-green-400" />
                      <span className="truncate">{item.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 rounded bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleContinueToReason}
                disabled={selectedItemIds.length === 0}
                className="flex-1 px-4 py-2 rounded text-white disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                style={{ backgroundColor: "#0D9488" }}
              >
                Continue
                <span className="text-xs opacity-75">({selectedItemIds.length} selected)</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Select Reason */}
        {step === "select_reason" && (
          <div className="p-4 space-y-4">
            {/* Show selected items summary for multi-item orders */}
            {purchase.hasLineItems && selectedItemIds.length > 0 && (
              <div className="bg-secondary/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-2">Returning {selectedItemIds.length} item(s):</p>
                <div className="space-y-1">
                  {purchase.lineItems
                    .filter((item) => selectedItemIds.includes(item.id))
                    .map((item) => (
                      <p key={item.id} className="text-sm text-foreground truncate">
                        • {item.description}
                      </p>
                    ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Why are you returning {purchase.hasLineItems ? "these items" : "this item"}?
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

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 px-4 py-2 rounded bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                {purchase.hasLineItems ? "Back" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={handleContinueToActions}
                disabled={!reason}
                className="flex-1 px-4 py-2 rounded text-white disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                style={{ backgroundColor: "#0D9488" }}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Choose Action */}
        {step === "choose_action" && (
          <div className="p-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Choose how you'd like to proceed with your return:
            </p>

            {/* Option 1: View Instructions */}
            <button
              onClick={() => handleSelectAction("view")}
              disabled={isLoadingInstructions || isSubmitting}
              className="w-full p-4 rounded-lg border border-border hover:border-teal-500/50 hover:bg-teal-500/5 transition-all text-left group"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 group-hover:bg-teal-500/20">
                  <ExternalLink className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-foreground mb-1">View Instructions</h4>
                  <p className="text-sm text-muted-foreground">
                    See step-by-step return instructions with a direct link to {purchase.merchant}
                  </p>
                </div>
                {isLoadingInstructions && selectedAction === "view" && (
                  <LoadingIcon className="w-5 h-5 text-teal-400" />
                )}
              </div>
            </button>

            {/* Option 2: Email Instructions */}
            <button
              onClick={() => handleSelectAction("email")}
              disabled={isLoadingInstructions || isSubmitting}
              className="w-full p-4 rounded-lg border border-border hover:border-blue-500/50 hover:bg-blue-500/5 transition-all text-left group"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-foreground mb-1">Email Instructions</h4>
                  <p className="text-sm text-muted-foreground">
                    Get the return instructions and links sent to your email for later
                  </p>
                </div>
                {isSubmitting && selectedAction === "email" && (
                  <LoadingIcon className="w-5 h-5 text-blue-400" />
                )}
              </div>
            </button>

            {/* Option 3: Do It For Me (Automation) */}
            <button
              onClick={() => handleSelectAction("automate")}
              disabled={isLoadingInstructions || isSubmitting || !supportsAutomation() || automationStatus === "running"}
              className={`w-full p-4 rounded-lg border transition-all text-left group ${
                supportsAutomation()
                  ? "border-border hover:border-purple-500/50 hover:bg-purple-500/5"
                  : "border-border/50 opacity-60 cursor-not-allowed"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  supportsAutomation() 
                    ? "bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20"
                    : "bg-secondary text-muted-foreground"
                }`}>
                  <Bot className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-foreground">Do It For Me</h4>
                    {supportsAutomation() ? (
                      <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-400">
                        ✨ AI-Powered
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded bg-secondary text-muted-foreground">
                        Not available
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {supportsAutomation()
                      ? "Our AI will automatically navigate the return process for you"
                      : `Automation not yet available for ${purchase.merchant}`}
                  </p>
                </div>
                {automationStatus === "running" && (
                  <LoadingIcon className="w-5 h-5 text-purple-400" />
                )}
              </div>
            </button>

            {automationStatus === "failed" && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p className="text-sm text-red-400">
                  Automation failed. Please try "View Instructions" to complete the return manually.
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 px-4 py-2 rounded bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Show Instructions */}
        {step === "show_instructions" && instructions && (
          <div className="p-4 space-y-4">
            {/* Return link button */}
            {instructions.returnUrl && (
              <a
                href={instructions.returnUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full p-4 rounded-lg text-white text-center font-medium hover:opacity-90 transition-colors"
                style={{ backgroundColor: "#0D9488" }}
              >
                <div className="flex items-center justify-center gap-2">
                  <ExternalLink className="w-5 h-5" />
                  {instructions.returnAction}
                </div>
              </a>
            )}

            {/* Order details */}
            <div className="bg-secondary/50 rounded-lg p-3 space-y-2">
              {instructions.orderNumber && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Order #</span>
                  <span className="font-mono text-foreground">{instructions.orderNumber}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-medium" style={{ color: "#0D9488" }}>{instructions.amount}</span>
              </div>
              {instructions.daysLeft !== null && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Return window</span>
                  <span className={instructions.daysLeft <= 3 ? "text-red-400" : "text-foreground"}>
                    {instructions.daysLeft} days left
                  </span>
                </div>
              )}
            </div>

            {/* Step by step instructions */}
            <div>
              <h4 className="text-sm font-medium text-foreground mb-3">Return Steps:</h4>
              <ol className="space-y-2">
                {instructions.steps.map((step, index) => (
                  <li key={index} className="flex gap-3 text-sm">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs font-medium text-foreground">
                      {index + 1}
                    </span>
                    <span className="text-muted-foreground pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Email option */}
            <button
              onClick={() => handleSelectAction("email")}
              disabled={isSubmitting}
              className="w-full py-2 rounded border border-border text-sm text-muted-foreground hover:bg-secondary/50 transition-colors flex items-center justify-center gap-2"
            >
              <Mail className="w-4 h-4" />
              Also email me these instructions
            </button>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 rounded bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Single purchase card component
function PurchaseCard({ purchase, onMarkReturned, onRequestRefund, onInitiateReturn, onResolve, onMarkDelivered, onMarkRefunded }: {
  purchase: Purchase;
  onMarkReturned: (id: number) => void;
  onRequestRefund: (id: number) => void;
  onInitiateReturn: (id: number) => void;
  onResolve: (id: number) => void;
  onMarkDelivered: (id: number) => void;
  onMarkRefunded: (id: number) => void;
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
  
  // For multi-item orders, show merchant as primary; for single items, show description
  const primaryTitle = purchase.hasLineItems 
    ? displayMerchant 
    : (purchase.itemDescription || displayMerchant);
  const secondaryInfo = purchase.hasLineItems 
    ? `${purchase.lineItemCount} item${purchase.lineItemCount !== 1 ? "s" : ""}`
    : (purchase.itemDescription ? displayMerchant : null);

  // State for expanding line items
  const [lineItemsExpanded, setLineItemsExpanded] = useState(false);

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

      <div className="flex items-start gap-3 mb-3 pr-6">
        {/* Product image or merchant icon */}
        <ProductImage 
          merchant={purchase.merchant} 
          productImageUrl={purchase.productImageUrl}
          className="w-12 h-12 flex-shrink-0" 
        />
        
        <div className="flex-1 min-w-0 flex justify-between items-start">
          <div className="flex-1 min-w-0 mr-3">
            <h3 className="font-semibold text-foreground text-lg leading-tight">{primaryTitle}</h3>
            {secondaryInfo && (
              <p className="text-sm text-muted-foreground mt-0.5">{secondaryInfo}</p>
            )}
          </div>
          <span className="text-lg font-bold flex-shrink-0" style={{ color: "#0D9488" }}>
            {purchase.amount}
          </span>
        </div>
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

      {/* Line items for multi-item orders */}
      {purchase.hasLineItems && purchase.lineItems.length > 0 && (
        <div className="mb-3">
          <button
            onClick={() => setLineItemsExpanded(!lineItemsExpanded)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform ${lineItemsExpanded ? "rotate-180" : ""}`}
            />
            <Package className="w-4 h-4" />
            <span>
              {purchase.lineItemCount} item{purchase.lineItemCount !== 1 ? "s" : ""} in this order
            </span>
            {/* Show count of returned items if any */}
            {purchase.lineItems.filter((item) => item.status === "returned").length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400">
                {purchase.lineItems.filter((item) => item.status === "returned").length} returned
              </span>
            )}
          </button>

          {lineItemsExpanded && (
            <div className="mt-2 ml-6 space-y-2 border-l-2 border-border pl-3">
              {purchase.lineItems.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between text-sm ${
                    item.status === "returned" ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {item.status === "returned" ? (
                      <Check className="w-3 h-3 text-green-400 flex-shrink-0" />
                    ) : (
                      <div className="w-3 h-3 rounded-full bg-secondary flex-shrink-0" />
                    )}
                    <span className="truncate text-foreground">
                      {item.description}
                      {item.quantity && item.quantity > 1 && (
                        <span className="text-muted-foreground"> ×{item.quantity}</span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {item.status === "returned" && (
                      <span className="text-xs text-green-400">Returned</span>
                    )}
                    {item.amount && (
                      <span className="text-muted-foreground">{item.amount}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Shipping progress bar for physical products */}
      <ShippingProgress purchase={purchase} />

      {/* Return/Refund progress for physical products marked as returned */}
      {(() => {
        const isDigital = isDigitalOrSubscription(purchase.merchant, purchase.itemDescription);
        
        // Show return progress for physical products that are returned (awaiting refund)
        if (!isDigital && purchase.status === "returned") {
          return (
            <div className="py-3 border-t border-border space-y-3">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4" style={{ color: "#0D9488" }} />
                <span className="text-sm font-medium text-foreground">Return Sent</span>
                <span className="text-xs px-2 py-0.5 rounded bg-teal-500/20 text-teal-400">
                  Awaiting Refund
                </span>
              </div>

              {/* Progress bar */}
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col items-center flex-1">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center z-10 bg-[#0D9488]">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-xs mt-1 text-center text-foreground font-medium">Returned</span>
                  </div>
                  <div className="flex flex-col items-center flex-1">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center z-10 bg-[#0D9488]">
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
                <div className="absolute top-2 left-[16.5%] h-0.5 -z-0 transition-all bg-[#0D9488]" style={{ width: "33%" }} />
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Item returned. We'll check your card transactions and notify you when the refund arrives.
              </p>
            </div>
          );
        }
        
        return null;
      })()}

      {/* Subscription refund info or refund pending progress */}
      {(() => {
        const subscriptionInfo = getSubscriptionRefundInfo(purchase.merchant, purchase.itemDescription, purchase.purchaseDate);
        if (!subscriptionInfo) return null;

        // If refund has been requested, show pending progress
        if (purchase.status === "return_initiated") {
          return (
            <div className="py-3 border-t border-border space-y-3">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" style={{ color: "#0D9488" }} />
                <span className="text-sm font-medium text-foreground">Refund Requested</span>
                <span className="text-xs px-2 py-0.5 rounded bg-teal-500/20 text-teal-400">
                  Pending
                </span>
              </div>

              {/* Progress bar */}
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col items-center flex-1">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center z-10 bg-[#0D9488]">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-xs mt-1 text-center text-foreground font-medium">Requested</span>
                  </div>
                  <div className="flex flex-col items-center flex-1">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center z-10 bg-[#0D9488]">
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
                <div className="absolute top-2 left-[16.5%] h-0.5 -z-0 transition-all bg-[#0D9488]" style={{ width: "33%" }} />
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
              <RefreshCw className="w-4 h-4" style={{ color: "#0D9488" }} />
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

      {/* Return processing progress bar for physical products */}
      {(() => {
        const isSubscription = getSubscriptionRefundInfo(purchase.merchant, purchase.itemDescription, purchase.purchaseDate)?.isSubscription;
        const isProcessingReturn = purchase.status === "return_initiated" || purchase.status === "returned";
        
        // Only show for non-subscription items in return processing
        if (isSubscription || !isProcessingReturn) return null;
        
        const isReturned = purchase.status === "returned";
        const expectedRefund = purchase.amountCents ? `$${(purchase.amountCents / 100).toFixed(2)}` : purchase.amount;
        
        return (
          <div className="py-3 border-t border-border space-y-3">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4" style={{ color: "#0066CC" }} />
              <span className="text-sm font-medium text-foreground">Return in Progress</span>
              <span className={`text-xs px-2 py-0.5 rounded ${isReturned ? "bg-amber-500/20 text-amber-400" : "bg-blue-500/20 text-blue-400"}`}>
                {isReturned ? "Awaiting Refund" : "Processing"}
              </span>
            </div>

            {/* Progress bar */}
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="flex flex-col items-center flex-1">
                  <div className="w-4 h-4 rounded-full flex items-center justify-center z-10 bg-[#0066CC]">
                    <CheckCircle className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-xs mt-1 text-center text-foreground font-medium">Initiated</span>
                </div>
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center z-10 ${isReturned ? "bg-[#0066CC]" : "bg-[#0066CC] animate-pulse"}`}>
                    {isReturned ? (
                      <CheckCircle className="w-3 h-3 text-white" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                  <span className={`text-xs mt-1 text-center ${isReturned ? "text-foreground font-medium" : "text-foreground font-medium"}`}>
                    {isReturned ? "Returned" : "Processing"}
                  </span>
                </div>
                <div className="flex flex-col items-center flex-1">
                  <div className="w-4 h-4 rounded-full flex items-center justify-center z-10 bg-secondary border border-border" />
                  <span className="text-xs mt-1 text-center text-muted-foreground">Refunded</span>
                </div>
              </div>
              <div className="absolute top-2 left-[16.5%] right-[16.5%] h-0.5 bg-secondary -z-0" />
              <div 
                className="absolute top-2 left-[16.5%] h-0.5 -z-0 transition-all bg-[#0066CC]" 
                style={{ width: isReturned ? "66%" : "33%" }} 
              />
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Expected refund: <span className="text-foreground font-medium">{expectedRefund}</span>. 
              We'll automatically check your bank transactions and notify you when the refund arrives.
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
              <Store className="w-4 h-4" style={{ color: "#0D9488" }} />
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
            <Shield className="w-4 h-4" style={{ color: "#0D9488" }} />
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
          const isProcessing = purchase.status === "return_initiated" || purchase.status === "returned";

          // For items in processing state (awaiting refund), show "Mark Refunded" button
          if (isProcessing) {
            return (
              <button
                onClick={() => onMarkRefunded(purchase.id)}
                className="flex-1 px-3 py-1.5 text-sm rounded bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors flex items-center justify-center gap-1"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Mark Refunded
              </button>
            );
          }

          // For subscriptions, show "Ask for Refund" button
          if (isSubscription) {
            return (
              <button
                onClick={() => onRequestRefund(purchase.id)}
                className="flex-1 px-3 py-1.5 text-sm rounded text-white hover:opacity-90 transition-colors flex items-center justify-center gap-1"
                style={{ backgroundColor: "#0D9488" }}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Ask for Refund
              </button>
            );
          }

          // For physical products, show mark delivered button if not yet delivered
          if (!isDelivered && !isDigital) {
            return (
              <button
                onClick={() => onMarkDelivered(purchase.id)}
                className="flex-1 px-3 py-1.5 text-sm rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors flex items-center justify-center gap-1"
              >
                <Truck className="w-3.5 h-3.5" />
                Mark Delivered
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
                  style={{ backgroundColor: "#0D9488" }}
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
            style={{ backgroundColor: "#0D9488" }}
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
    mutationFn: ({ purchaseId, status }: { purchaseId: number; status: "returned" | "dismissed" | "return_initiated" | "resolved" | "tracking" | "refunded" }) =>
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

  // Mutation for returning specific line items from multi-item orders
  const returnLineItemsMutation = useMutation({
    mutationFn: ({ purchaseId, lineItemIds, returnReason, additionalNotes }: { 
      purchaseId: number; 
      lineItemIds: number[]; 
      returnReason: string; 
      additionalNotes?: string 
    }) =>
      call<typeof returnLineItems>("returnLineItems", { purchaseId, lineItemIds, returnReason, additionalNotes }),
    onSuccess: (result) => {
      if (result.success) {
        setReturnModalPurchase(null);
        queryClient.invalidateQueries({ queryKey: ["trackedPurchases"] });
      }
    },
  });

  const markDeliveredMutation = useMutation({
    mutationFn: ({ purchaseId }: { purchaseId: number }) =>
      call<typeof markAsDelivered>("markAsDelivered", { purchaseId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trackedPurchases"] });
    },
  });

  const [isScanning, setIsScanning] = useState(false);
  
  // Unified filters
  type FilterType = "all" | "active" | "subscriptions" | "processing" | "archived";
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

  const handleMarkDelivered = (id: number) => {
    markDeliveredMutation.mutate({ purchaseId: id });
  };

  const handleMarkRefunded = (id: number) => {
    // Mark as refunded - this moves the item to the resolved filter
    updateStatusMutation.mutate({ purchaseId: id, status: "refunded" });
  };

  const handleReturnSubmit = (reason: string, notes: string, action: "view" | "email" | "automate") => {
    if (!returnModalPurchase) return;
    
    // For "email" action, we use the initiateReturn which sends email
    // For "view" and "automate", the modal handles it directly
    if (action === "email") {
      initiateReturnMutation.mutate({
        purchaseId: returnModalPurchase.id,
        returnReason: reason,
        additionalNotes: notes || undefined,
      });
    } else if (action === "automate") {
      // Modal already triggered automation, just close and refresh
      setReturnModalPurchase(null);
      queryClient.invalidateQueries({ queryKey: ["trackedPurchases"] });
    }
  };

  // Handler for returning specific line items from multi-item orders
  const handleReturnLineItems = (lineItemIds: number[], reason: string, notes: string, action: "view" | "email" | "automate") => {
    if (!returnModalPurchase) return;
    
    if (action === "email") {
      returnLineItemsMutation.mutate({
        purchaseId: returnModalPurchase.id,
        lineItemIds,
        returnReason: reason,
        additionalNotes: notes || undefined,
      });
    } else if (action === "automate") {
      // Modal already triggered automation, just close and refresh
      setReturnModalPurchase(null);
      queryClient.invalidateQueries({ queryKey: ["trackedPurchases"] });
    }
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

  // Helper to check if item is in processing state (awaiting refund)
  const isProcessingReturn = (p: { status: string | null }) => 
    p.status === "return_initiated" || p.status === "returned" || p.status === "partial_return";

  // Helper to check if item is archived
  const isArchived = (p: { status: string | null }) => 
    p.status === "resolved" || p.status === "refunded";

  // Calculate counts for each filter
  const allCount = purchasesList.filter((p) => !isArchived(p)).length;
  const activeCount = purchasesList.filter((p) => 
    !isArchived(p) && !isProcessingReturn(p) && !isDigitalOrSubscription(p.merchant, p.itemDescription)
  ).length;
  const subscriptionCount = purchasesList.filter((p) =>
    isDigitalOrSubscription(p.merchant, p.itemDescription) && !isArchived(p) && !isProcessingReturn(p)
  ).length;
  const processingCount = purchasesList.filter((p) => isProcessingReturn(p)).length;
  const archivedCount = purchasesList.filter((p) => isArchived(p)).length;

  // Apply active filter
  const filteredPurchases = purchasesList.filter((p) => {
    switch (activeFilter) {
      case "all":
        // Show all non-archived purchases
        return !isArchived(p);
      case "active":
        // Show active physical products only
        return !isArchived(p) && !isProcessingReturn(p) && !isDigitalOrSubscription(p.merchant, p.itemDescription);
      case "subscriptions":
        return isDigitalOrSubscription(p.merchant, p.itemDescription) && !isArchived(p) && !isProcessingReturn(p);
      case "processing":
        return isProcessingReturn(p);
      case "archived":
        return isArchived(p);
      default:
        return !isArchived(p);
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
    all: "All Purchases",
    active: "Active",
    subscriptions: "Subscriptions",
    processing: "Processing",
    archived: "Archived",
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
            className="w-full appearance-none bg-secondary/50 border border-border rounded-lg px-4 py-2.5 pr-10 text-sm font-medium text-foreground cursor-pointer hover:bg-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-[#0D9488]/50"
          >
            <option value="all">
              📋 All Purchases ({allCount})
            </option>
            <option value="active">
              📦 Active Purchases ({activeCount})
            </option>
            <option value="subscriptions">
              🔄 Subscriptions ({subscriptionCount})
            </option>
            <option value="processing">
              ⏳ Processing Returns ({processingCount})
            </option>
            <option value="archived">
              📁 Archived ({archivedCount})
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
                onMarkDelivered={handleMarkDelivered}
                onMarkRefunded={handleMarkRefunded}
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
          onSubmitLineItems={handleReturnLineItems}
          isSubmitting={initiateReturnMutation.isPending || returnLineItemsMutation.isPending}
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
        <LoadingIcon className="w-6 h-6 text-[#0D9488]" />
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
        <Shield className="w-5 h-5" style={{ color: "#0D9488" }} />
        <span className="font-semibold text-foreground text-sm">Return Guardian</span>
      </div>

      <div className="flex-1 flex flex-col justify-center space-y-2">
        <div className="text-center">
          <div className="text-3xl font-bold" style={{ color: "#0D9488" }}>
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
      <header className="border-b border-border px-6 py-4" style={{ backgroundColor: "#0D9488" }}>
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
