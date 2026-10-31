export type StatusType =
  | "draft"
  | "quotation"
  | "confirmed"
  | "active"
  | "paused"
  | "closed"
  | "paid"
  | "overdue"
  | "cancelled";

interface StatusBadgeProps {
  status: StatusType | string;
  className?: string;
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const normalized = status.toLowerCase() as StatusType;

  const styles: Record<
    StatusType,
    { label: string; dot: string; container: string }
  > = {
    draft: {
      label: "Draft",
      dot: "○",
      container:
        "border border-dashed border-neutral-400 text-neutral-600 dark:border-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-900",
    },
    quotation: {
      label: "Quotation",
      dot: "•",
      container:
        "border border-neutral-300 dark:border-neutral-700 bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200",
    },
    confirmed: {
      label: "Confirmed",
      dot: "◉",
      container:
        "border border-neutral-400 dark:border-neutral-600 bg-neutral-200 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100 font-medium",
    },
    active: {
      label: "Active",
      dot: "●",
      container:
        "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-semibold shadow-xs",
    },
    paused: {
      label: "Paused",
      dot: "⏸",
      container:
        "border border-neutral-400 dark:border-neutral-500 text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800",
    },
    closed: {
      label: "Closed",
      dot: "■",
      container:
        "border border-neutral-200 dark:border-neutral-800 text-neutral-400 dark:text-neutral-500 bg-neutral-50 dark:bg-neutral-950",
    },
    paid: {
      label: "Paid",
      dot: "✓",
      container:
        "border-2 border-neutral-900 dark:border-neutral-100 bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-bold",
    },
    overdue: {
      label: "Overdue",
      dot: "!",
      container:
        "border-2 border-dashed border-neutral-900 dark:border-neutral-100 text-neutral-950 dark:text-white font-extrabold underline tracking-wider",
    },
    cancelled: {
      label: "Cancelled",
      dot: "✕",
      container:
        "border border-neutral-300 dark:border-neutral-700 text-neutral-400 dark:text-neutral-500 line-through bg-neutral-50 dark:bg-neutral-950",
    },
  };

  const current = styles[normalized] || {
    label: status,
    dot: "•",
    container:
      "border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs tracking-tight uppercase select-none ${current.container} ${className}`}
    >
      <span className="font-mono text-[10px] leading-none" aria-hidden="true">
        {current.dot}
      </span>
      <span>{current.label}</span>
    </span>
  );
}
