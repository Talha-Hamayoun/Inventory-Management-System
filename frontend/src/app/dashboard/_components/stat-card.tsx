import type { ReactNode } from "react";
import { cn } from "@/src/lib/utils";
import type { LucideIcon } from "lucide-react";

const tones = {
  emerald: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-300",
  blue: "bg-blue-500/12 text-blue-600 dark:text-blue-300",
  violet: "bg-violet-500/12 text-violet-600 dark:text-violet-300",
  rose: "bg-rose-500/12 text-rose-600 dark:text-rose-300",
  amber: "bg-amber-500/12 text-amber-600 dark:text-amber-300",
} as const;

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  iconNode,
  tone,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: LucideIcon;
  iconNode?: ReactNode;
  tone: keyof typeof tones;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-gray-200/70 bg-white/80 dark:bg-gray-50/80 backdrop-blur-xl shadow-sm p-5",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            {label}
          </p>
          <p className="mt-1.5 text-2xl xl:text-3xl font-bold tracking-tight text-gray-900 truncate">
            {value}
          </p>
          {hint && <div className="mt-1.5 text-xs text-gray-500">{hint}</div>}
        </div>
        {(Icon || iconNode) && (
          <div
            className={cn(
              "h-11 w-11 rounded-2xl flex items-center justify-center shrink-0",
              tones[tone]
            )}
          >
            {Icon ? <Icon className="h-5 w-5" /> : iconNode}
          </div>
        )}
      </div>
    </div>
  );
}
