import { cn } from "@/src/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "error" | "info";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "bg-gray-100 text-gray-800",
    success: "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300",
    warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-200",
    error: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300",
    info: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-wide",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

// Status badge helper
export function StatusBadge({ status }: { status: string }) {
  const statusVariants: Record<string, "success" | "warning" | "error" | "info" | "default"> = {
    ACTIVE: "success",
    INACTIVE: "warning",
    ARCHIVED: "default",
    DRAFT: "default",
    ORDERED: "info",
    PARTIALLY_RECEIVED: "warning",
    COMPLETED: "success",
    CANCELLED: "error",
    RESERVED: "info",
    RELEASED: "warning",
    FULFILLED: "success",
    RESTOCKABLE: "success",
    DAMAGED: "error",
    LOW_STOCK: "warning",
    OUT_OF_STOCK: "error",
  };

  return <Badge variant={statusVariants[status] || "default"}>{status.replace(/_/g, " ")}</Badge>;
}
