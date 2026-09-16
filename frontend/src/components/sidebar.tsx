"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/src/lib/utils";
import { useAuth } from "@/src/lib/auth-context";
import {
  LayoutDashboard,
  Package,
  Warehouse,
  Truck,
  ShoppingCart,
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
  Menu,
  X,
  FolderTree,
} from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, permission: null },
  { name: "Products", href: "/products", icon: Package, permission: "products:read" },
  { name: "Categories", href: "/categories", icon: FolderTree, permission: "categories:read" },
  { name: "Inventory", href: "/inventory", icon: Warehouse, permission: "inventory:read" },
  { name: "Suppliers", href: "/suppliers", icon: Truck, permission: "suppliers:read" },
  { name: "Warehouses", href: "/warehouses", icon: Warehouse, permission: "warehouses:read" },
  { name: "Purchase Orders", href: "/purchase-orders", icon: ShoppingCart, permission: "purchase-orders:read" },
  { name: "Reservations", href: "/reservations", icon: ArrowLeftRight, permission: "reservations:read" },
  { name: "Returns", href: "/returns", icon: RotateCcw, permission: "returns:read" },
  { name: "Stock Alerts", href: "/alerts", icon: Bell, permission: "alerts:read" },
  { name: "Customers", href: "/customers", icon: UserCheck, permission: "customers:read" },
  { name: "Sales Orders", href: "/sales-orders", icon: ShoppingCart, permission: "sales-orders:read" },
  { name: "Users", href: "/users", icon: Users, permission: "users:read" },
  { name: "Roles", href: "/roles", icon: Shield, permission: "roles:read" },
  { name: "Audit Logs", href: "/audit-logs", icon: FileText, permission: "audit:read" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout, hasPermission } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const filteredNav = navigation.filter(
    (item) => !item.permission || hasPermission(item.permission)
  );

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b px-4 py-3 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
        <span className="font-semibold">Inventory Management</span>
        <div className="w-10" />
      </div>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/50"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen w-64 bg-gray-900 text-white transition-transform lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-2 px-4 py-6 border-b border-gray-800">
            <Package className="h-8 w-8 text-blue-500" />
            <span className="text-xl font-bold">Inventory</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-2">
              {filteredNav.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer",
                        isActive
                          ? "bg-blue-600 text-white"
                          : "text-gray-300 hover:bg-gray-800 hover:text-white"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User section */}
          <div className="border-t border-gray-800 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-gray-400 truncate">{user?.role?.name}</p>
              </div>
            </div>
            {hasPermission("*") && (
              <Link
                href="/settings"
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors mb-1 w-full",
                  pathname === "/settings"
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                )}
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>
            )}
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800"
              onClick={logout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
