import { cn } from "@/src/lib/utils";
import { Inbox } from "lucide-react";
import { Loading } from "./loading";

interface DataTableProps {
  toolbar?: React.ReactNode;
  banner?: React.ReactNode;
  footer?: React.ReactNode;
  loading?: boolean;
  empty?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function DataTable({
  toolbar,
  banner,
  footer,
  loading,
  empty,
  children,
  className,
}: DataTableProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-gray-200/80 bg-white/80 dark:bg-gray-50/85 backdrop-blur-xl shadow-sm overflow-hidden",
        className
      )}
    >
      {toolbar && (
        <div className="px-4 py-3.5 border-b border-gray-100 dark:border-gray-200/50">
          {toolbar}
        </div>
      )}
      {banner}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loading size="lg" />
        </div>
      ) : empty ? (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="h-12 w-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
            <Inbox className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500 max-w-sm">{empty}</p>
        </div>
      ) : (
        children
      )}
      {!loading && !empty && footer && (
        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-200/50 bg-gray-50/60">
          {footer}
        </div>
      )}
    </div>
  );
}
