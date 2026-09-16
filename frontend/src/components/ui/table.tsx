import { cn } from "@/src/lib/utils";

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {}

export function Table({ className, ...props }: TableProps) {
  return (
    <div className="relative w-full overflow-x-auto">
      <table
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  );
}

export function TableHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn("sticky top-0 z-10 [&_tr]:border-b-0", className)}
      {...props}
    />
  );
}

export function TableBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody
      className={cn("[&_tr:last-child_td]:border-b-0", className)}
      {...props}
    />
  );
}

export function TableFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tfoot
      className={cn("border-t border-gray-100 bg-gray-50/80 font-medium", className)}
      {...props}
    />
  );
}

export function TableRow({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        "group transition-colors hover:bg-blue-50/50 dark:hover:bg-white/4 data-[state=selected]:bg-blue-50/80 dark:data-[state=selected]:bg-blue-500/10",
        className
      )}
      {...props}
    />
  );
}

export function TableHead({
  className,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "h-11 px-4 text-left align-middle text-[11px] font-semibold uppercase tracking-wider text-gray-500 bg-gray-50/90 whitespace-nowrap first:pl-5 last:pr-5 has-[[role=checkbox]]:pr-0",
        className
      )}
      {...props}
    />
  );
}

export function TableCell({
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn(
        "px-4 py-3.5 align-middle text-gray-700 border-b border-gray-100 whitespace-nowrap first:pl-5 last:pr-5 has-[[role=checkbox]]:pr-0",
        className
      )}
      {...props}
    />
  );
}

export function tableIconButtonClass(tone: "default" | "danger" = "default") {
  return cn(
    "inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:pointer-events-none",
    tone === "danger"
      ? "text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/15"
      : "text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/15"
  );
}

export function TableIconButton({
  className,
  tone = "default",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      className={cn(tableIconButtonClass(tone), className)}
      {...props}
    />
  );
}
