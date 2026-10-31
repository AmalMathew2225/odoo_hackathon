export type BillingPeriod = "daily" | "weekly" | "monthly" | "yearly";

/**
 * Calculates the exact end date of period n from the original anchor start date.
 * Guarantees zero month-end drift (e.g., Jan 31 -> Feb 28 -> Mar 31).
 */
export function getAnchorPeriodDate(
  anchorStartDate: string | Date,
  period: BillingPeriod,
  periodIndex: number,
): Date {
  const base = new Date(anchorStartDate);
  const startDay = base.getUTCDate();
  const startMonth = base.getUTCMonth();
  const startYear = base.getUTCFullYear();

  if (periodIndex <= 0) {
    return new Date(Date.UTC(startYear, startMonth, startDay));
  }

  if (period === "daily") {
    const d = new Date(Date.UTC(startYear, startMonth, startDay));
    d.setUTCDate(d.getUTCDate() + periodIndex);
    return d;
  }

  if (period === "weekly") {
    const d = new Date(Date.UTC(startYear, startMonth, startDay));
    d.setUTCDate(d.getUTCDate() + periodIndex * 7);
    return d;
  }

  if (period === "monthly") {
    const targetTotalMonths = startMonth + periodIndex;
    const targetYear = startYear + Math.floor(targetTotalMonths / 12);
    const targetMonth = ((targetTotalMonths % 12) + 12) % 12;

    // Days in target month (passing 0 day gives last day of target month)
    const daysInTargetMonth = new Date(
      Date.UTC(targetYear, targetMonth + 1, 0),
    ).getUTCDate();

    // Preserve the original anchor start day or clamp to month end
    const targetDay = Math.min(startDay, daysInTargetMonth);
    return new Date(Date.UTC(targetYear, targetMonth, targetDay));
  }

  if (period === "yearly") {
    const targetYear = startYear + periodIndex;
    const daysInTargetMonth = new Date(
      Date.UTC(targetYear, startMonth + 1, 0),
    ).getUTCDate();
    const targetDay = Math.min(startDay, daysInTargetMonth);
    return new Date(Date.UTC(targetYear, startMonth, targetDay));
  }

  throw new Error(`Unsupported billing period: ${period}`);
}

/**
 * Calculates the next billing date given an anchor date and the current period start date.
 */
export function getNextBillingDate(
  anchorStartDate: string | Date,
  period: BillingPeriod,
  currentPeriodStart: string | Date,
): Date {
  const base = new Date(anchorStartDate);
  const current = new Date(currentPeriodStart);

  if (period === "daily") {
    const next = new Date(current);
    next.setUTCDate(next.getUTCDate() + 1);
    return next;
  }

  if (period === "weekly") {
    const next = new Date(current);
    next.setUTCDate(next.getUTCDate() + 7);
    return next;
  }

  if (period === "monthly") {
    // Estimate period index n
    const monthsDiff =
      (current.getUTCFullYear() - base.getUTCFullYear()) * 12 +
      (current.getUTCMonth() - base.getUTCMonth());
    const nextIndex = Math.max(1, monthsDiff + 1);
    return getAnchorPeriodDate(base, "monthly", nextIndex);
  }

  if (period === "yearly") {
    const yearsDiff = current.getUTCFullYear() - base.getUTCFullYear();
    const nextIndex = Math.max(1, yearsDiff + 1);
    return getAnchorPeriodDate(base, "yearly", nextIndex);
  }

  throw new Error(`Unsupported billing period: ${period}`);
}

/**
 * Formats a Date object to YYYY-MM-DD
 */
export function formatDateISO(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().split("T")[0];
}
