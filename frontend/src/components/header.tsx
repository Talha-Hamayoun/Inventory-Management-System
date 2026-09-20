"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Moon, Sun, ScanLine } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useAuth } from "@/src/lib/auth-context";
import { useTheme } from "@/src/lib/theme-context";
import { Button } from "@/src/components/ui/button";

const PAGE_META: { prefix: string; title: string; subtitle: string }[] = [
  { prefix: "/dashboard", title: "Dashboard", subtitle: "Overview of inventory and sales" },
  { prefix: "/pos", title: "Point of Sale", subtitle: "Fast checkout and receipts" },
  { prefix: "/products", title: "Products", subtitle: "Manage your product catalog" },
  { prefix: "/categories", title: "Categories", subtitle: "Organize products by category" },
  { prefix: "/inventory", title: "Inventory", subtitle: "Stock levels across warehouses" },
  { prefix: "/suppliers", title: "Suppliers", subtitle: "Vendor and supplier records" },
  { prefix: "/warehouses", title: "Warehouses", subtitle: "Storage locations and capacity" },
  { prefix: "/purchase-orders", title: "Purchase Orders", subtitle: "Incoming stock and receiving" },
  { prefix: "/reservations", title: "Reservations", subtitle: "Reserved inventory movements" },
  { prefix: "/returns", title: "Returns", subtitle: "Customer and supplier returns" },
  { prefix: "/alerts", title: "Stock Alerts", subtitle: "Low-stock and threshold alerts" },
  { prefix: "/customers", title: "Customers", subtitle: "Customer profiles and history" },
  { prefix: "/sales-orders", title: "Sales Orders", subtitle: "Orders, fulfillment, and invoices" },
  { prefix: "/users", title: "Users", subtitle: "People with system access" },
  { prefix: "/roles", title: "Roles", subtitle: "Permissions and access control" },
  { prefix: "/audit-logs", title: "Audit Logs", subtitle: "Activity across the system" },
  { prefix: "/settings", title: "Settings", subtitle: "Company and system preferences" },
];

function getPageMeta(pathname: string) {
  return (
    PAGE_META.find((item) => pathname === item.prefix || pathname.startsWith(item.prefix + "/")) || {
      title: "Inventory",
      subtitle: "Management System",
    }
  );
}

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname();
  const { user, hasAnyPermission } = useAuth();
  const { theme, setTheme } = useTheme();
  const meta = getPageMeta(pathname);
  const canOpenPos = hasAnyPermission(["pos:view", "pos:create-sale", "sales-orders:create"]);
  const onPosPage = pathname === "/pos" || pathname.startsWith("/pos/");

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-64 z-30 h-16">
      <div className="h-full mx-3 mt-0 lg:mx-4 lg:mt-3 lg:h-14 lg:rounded-2xl border-b lg:border border-white/40 dark:border-white/10 bg-white/70 dark:bg-[#0b1220]/75 backdrop-blur-xl shadow-sm shadow-black/5">
        <div className="h-full px-3 lg:px-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onMenuClick}
              className="lg:hidden h-10 w-10 rounded-xl flex items-center justify-center text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h2 className="text-sm lg:text-[15px] font-semibold text-gray-900 truncate">
                {meta.title}
              </h2>
              <p className="hidden sm:block text-[11px] text-gray-500 truncate">{meta.subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {canOpenPos && !onPosPage && (
              <Link href="/pos" className="shrink-0">
                <Button
                  type="button"
                  size="sm"
                  className="h-9 gap-1.5 rounded-xl bg-blue-600 px-3 text-xs font-semibold shadow-sm shadow-blue-600/20 hover:bg-blue-700 sm:text-sm"
                >
                  <ScanLine className="h-4 w-4" />
                  <span className="hidden sm:inline">POS / New Sale</span>
                  <span className="sm:hidden">POS</span>
                </Button>
              </Link>
            )}
            <div
              className="flex items-center rounded-full bg-gray-100/90 dark:bg-white/8 p-1 border border-gray-200/80 dark:border-white/10"
              role="group"
              aria-label="Color theme"
            >
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium transition-all cursor-pointer",
                  theme === "light"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
                )}
                aria-pressed={theme === "light"}
              >
                <Sun className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Light</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium transition-all cursor-pointer",
                  theme === "dark"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
                )}
                aria-pressed={theme === "dark"}
              >
                <Moon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Dark</span>
              </button>
            </div>

            <div className="hidden md:flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-white/10">
              <div className="h-8 w-8 rounded-full bg-linear-to-br from-blue-500 to-indigo-500 text-white text-xs font-semibold flex items-center justify-center">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-900 truncate max-w-35">{user?.name}</p>
                <p className="text-[10px] text-gray-500 truncate max-w-35">{user?.role?.name}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
