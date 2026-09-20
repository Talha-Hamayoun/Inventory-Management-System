"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/src/lib/utils";
import { useAuth } from "@/src/lib/auth-context";
import {
  LayoutDashboard,
  Package,
  Warehouse,
  Truck,
  ArrowLeftRight,
  RotateCcw,
  Bell,
  Users,
  UserCheck,
  Shield,
  FileText,
  Settings,
  LogOut,
  ChevronDown,
  X,
  FolderTree,
  LayoutList,
  Building2,
  ClipboardList,
  ShoppingBag,
  ScanLine,
} from "lucide-react";
import { useState } from "react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, permission: null },
  { name: "POS", href: "/pos", icon: ScanLine, permission: "pos:view" },
  { name: "Products", href: "/products", icon: Package, permission: "products:read" },
  { name: "Categories", href: "/categories", icon: FolderTree, permission: "categories:read" },
  { name: "Inventory", href: "/inventory", icon: Warehouse, permission: "inventory:read" },
  { name: "Suppliers", href: "/suppliers", icon: Truck, permission: "suppliers:read" },
  { name: "Warehouses", href: "/warehouses", icon: Building2, permission: "warehouses:read" },
  { name: "Purchase Orders", href: "/purchase-orders", icon: ClipboardList, permission: "purchase-orders:read" },
  { name: "Reservations", href: "/reservations", icon: ArrowLeftRight, permission: "reservations:read" },
  { name: "Returns", href: "/returns", icon: RotateCcw, permission: "returns:read" },
  { name: "Stock Alerts", href: "/alerts", icon: Bell, permission: "alerts:read" },
  { name: "Customers", href: "/customers", icon: UserCheck, permission: "customers:read" },
  { name: "Sales Orders", href: "/sales-orders", icon: ShoppingBag, permission: "sales-orders:read" },
  { name: "Users", href: "/users", icon: Users, permission: "users:read" },
  { name: "Roles", href: "/roles", icon: Shield, permission: "roles:read" },
  { name: "Audit Logs", href: "/audit-logs", icon: FileText, permission: "audit:read" },
];

export function Sidebar({
  isOpen,
  onOpenChange,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const pathname = usePathname();
  const { user, logout, hasPermission } = useAuth();
  const [menuOpen, setMenuOpen] = useState(true);

  const filteredNav = navigation.filter((item) => {
    if (!item.permission) return true;
    if (item.href === "/pos") {
      return (
        hasPermission(item.permission) ||
        hasPermission("pos:create-sale") ||
        hasPermission("sales-orders:create")
      );
    }
    return hasPermission(item.permission);
  });

  const isItemActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const hasActiveChild = filteredNav.some((item) => isItemActive(item.href));

  return (
    <>
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-35 bg-black/50 backdrop-blur-sm"
          onClick={() => onOpenChange(false)}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen w-64 overflow-hidden text-white transition-transform duration-300 lg:translate-x-0",
          "bg-[#0b1220]/95 backdrop-blur-2xl border-r border-white/10 shadow-2xl shadow-black/20",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="relative px-4 pt-5 pb-4">
            <Link href="/dashboard" className="mx-auto flex h-14 w-full items-center justify-center overflow-hidden">
              <Image
                src="/Logo1.png"
                alt="AutoLine"
                width={2172}
                height={724}
                className="h-14 w-auto max-h-14 max-w-full object-contain"
                style={{ width: "auto", height: "4rem" }}
                priority
                unoptimized
              />
            </Link>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="lg:hidden absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 shrink-0 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 cursor-pointer"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto sidebar-scroll px-3 pb-3">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className={cn(
                "sticky top-0 z-10 w-full flex items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-sm font-semibold transition-colors cursor-pointer backdrop-blur-xl",
                hasActiveChild
                  ? "text-white bg-[#0b1220]/95"
                  : "text-white/80 bg-[#0b1220]/90 hover:bg-white/6 hover:text-white"
              )}
              aria-expanded={menuOpen}
            >
              <span className="flex items-center gap-3">
                <span
                  className={cn(
                    "h-8 w-8 rounded-lg flex items-center justify-center",
                    hasActiveChild ? "bg-blue-500/20 text-blue-300" : "bg-white/8 text-white/70"
                  )}
                >
                  <LayoutList className="h-4 w-4" />
                </span>
                Menu
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-white/50 transition-transform duration-200",
                  menuOpen && "rotate-180"
                )}
              />
            </button>

            <div
              className={cn(
                "grid transition-[grid-template-rows] duration-200 ease-out",
                menuOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              )}
            >
              <div className="min-h-0 overflow-hidden">
                <ul className="relative mt-1 ml-5 border-l border-white/10 pl-3 space-y-0.5 py-1">
                  {filteredNav.map((item) => {
                    const active = isItemActive(item.href);
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          onClick={() => onOpenChange(false)}
                          className={cn(
                            "group relative flex min-w-0 items-center gap-3 rounded-xl px-2.5 py-1.5 text-[13px] font-medium transition-all duration-200 cursor-pointer",
                            active
                              ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                              : "text-white/65 hover:text-white hover:bg-white/8"
                          )}
                        >
                          <item.icon
                            className={cn(
                              "h-4 w-4 shrink-0",
                              active ? "text-white" : "text-white/45 group-hover:text-white/80"
                            )}
                          />
                          <span className="min-w-0 truncate">{item.name}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </nav>

          <div className="p-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-linear-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-sm font-semibold shadow-md shadow-blue-500/20">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user?.name}</p>
                  <p className="text-[11px] text-white/45 truncate">{user?.role?.name}</p>
                </div>
              </div>

              <div className="mt-3 space-y-1">
                {hasPermission("*") && (
                  <Link
                    href="/settings"
                    onClick={() => onOpenChange(false)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors",
                      pathname === "/settings"
                        ? "bg-blue-600 text-white"
                        : "text-white/70 hover:text-white hover:bg-white/10"
                    )}
                  >
                    <Settings className="h-3.5 w-3.5 shrink-0" />
                    Settings
                  </Link>
                )}
                <button
                  type="button"
                  onClick={logout}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-white/70 hover:text-red-200 hover:bg-red-500/15 transition-colors cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5 shrink-0" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
