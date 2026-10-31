/**
 * Pricing Engine for Quotations and Invoices
 * All monetary amounts are handled strictly as whole integers in paise (₹1 = 100 paise).
 * No floating point math is ever used for stored values.
 */

export interface PricingLineInput {
  basePrice: number; // in paise
  variantExtra?: number; // in paise
  quantity: number;
  discountType?: "fixed" | "percentage" | null;
  discountValue?: number | null; // paise if fixed, basis percent if percentage (e.g. 10 = 10%)
  taxRates: number[]; // Array of percentage tax rates to stack, e.g. [9, 9] for CGST+SGST or [18] for GST
}

export interface PricingLineResult {
  unitPrice: number; // base + variant in paise
  subtotal: number; // unitPrice * quantity in paise
  discountAmount: number; // in paise
  discountedBase: number; // subtotal - discount in paise
  combinedTaxRate: number; // sum of stacked tax rates
  taxAmount: number; // tax on discountedBase, rounded half-up
  lineTotal: number; // discountedBase + taxAmount in paise
}

export interface DocumentPricingResult {
  lines: PricingLineResult[];
  subtotal: number; // sum of line subtotals in paise
  totalDiscount: number; // sum of line discounts in paise
  totalTax: number; // sum of line taxes in paise
  grandTotal: number; // subtotal - totalDiscount + totalTax in paise
}

/**
 * Rounds a number half-up to the nearest integer.
 * e.g. 10.5 -> 11, 10.4 -> 10.
 */
export function roundHalfUp(val: number): number {
  return Math.floor(val + 0.5);
}

/**
 * Calculates pricing for a single line item.
 * Rule: (base + variant) * quantity - discount + tax(on discounted amount)
 */
export function calculateLinePricing(
  line: PricingLineInput,
): PricingLineResult {
  const quantity = Math.max(1, Math.floor(line.quantity));
  const variantExtra = Math.max(0, Math.floor(line.variantExtra || 0));
  const unitPrice = Math.max(0, Math.floor(line.basePrice)) + variantExtra;
  const subtotal = unitPrice * quantity;

  // Calculate discount
  let discountAmount = 0;
  if (line.discountType && line.discountValue && line.discountValue > 0) {
    if (line.discountType === "fixed") {
      discountAmount = Math.min(subtotal, Math.floor(line.discountValue));
    } else if (line.discountType === "percentage") {
      discountAmount = roundHalfUp((subtotal * line.discountValue) / 100);
    }
  }

  const discountedBase = Math.max(0, subtotal - discountAmount);

  // Stack taxes
  const combinedTaxRate = (line.taxRates || []).reduce(
    (sum, rate) => sum + rate,
    0,
  );
  const taxAmount = roundHalfUp((discountedBase * combinedTaxRate) / 100);
  const lineTotal = discountedBase + taxAmount;

  return {
    unitPrice,
    subtotal,
    discountAmount,
    discountedBase,
    combinedTaxRate,
    taxAmount,
    lineTotal,
  };
}

/**
 * Calculates totals across multiple lines for a quotation or invoice.
 */
export function calculateDocumentPricing(
  lines: PricingLineInput[],
): DocumentPricingResult {
  const lineResults = lines.map(calculateLinePricing);

  const subtotal = lineResults.reduce((acc, l) => acc + l.subtotal, 0);
  const totalDiscount = lineResults.reduce(
    (acc, l) => acc + l.discountAmount,
    0,
  );
  const totalTax = lineResults.reduce((acc, l) => acc + l.taxAmount, 0);
  const grandTotal = subtotal - totalDiscount + totalTax;

  return {
    lines: lineResults,
    subtotal,
    totalDiscount,
    totalTax,
    grandTotal,
  };
}

/**
 * Formats paise to Indian Rupee string, e.g. 499900 -> "₹4,999.00"
 */
export function formatPaiseToINR(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rupees);
}
