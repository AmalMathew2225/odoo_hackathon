"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Layers,
  FileSpreadsheet,
  Receipt,
  CreditCard,
  Users,
  Percent,
  Sliders,
  Clock,
  ShieldAlert,
  LogOut,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Zap,
} from "lucide-react";
import type { UserRole } from "@/types/database";
import { logoutAction } from "@/actions/auth";

interface SidebarProps {
  role: UserRole;
  userEmail: string;
  userName: string;
}

export function Sidebar({ role, userEmail, userName }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const adminNav = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Subscriptions", href: "/staff/subscriptions", icon: Layers },
    { label: "Invoices", href: "/staff/invoices", icon: Receipt },
    { label: "Payments", href: "/staff/payments", icon: CreditCard },
    { label: "Customers", href: "/staff/customers", icon: Users },
    { label: "Products & Variants", href: "/admin/products", icon: Package },
    { label: "Plans", href: "/admin/plans", icon: Sliders },
    { label: "Quotation Templates", href: "/admin/templates", icon: FileSpreadsheet },
    { label: "Taxes", href: "/admin/taxes", icon: Receipt },
    { label: "Discounts", href: "/admin/discounts", icon: Percent },
    { label: "Payment Terms", href: "/admin/payment-terms", icon: Clock },
    { label: "Staff Accounts", href: "/admin/staff", icon: UserCheck },
    { label: "Audit Logs", href: "/admin/audit-logs", icon: ShieldAlert },
  ];

  const staffNav = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Subscriptions", href: "/staff/subscriptions", icon: Layers },
    { label: "Invoices", href: "/staff/invoices", icon: Receipt },
    { label: "Payments", href: "/staff/payments", icon: CreditCard },
    { label: "Customers", href: "/staff/customers", icon: Users },
  ];

  const customerNav = [
    { label: "My Subscriptions", href: "/portal/subscriptions", icon: Layers },
    { label: "My Invoices", href: "/portal/invoices", icon: Receipt },
    { label: "Payment History", href: "/portal/payments", icon: CreditCard },
    { label: "Account Profile", href: "/portal/profile", icon: Users },
  ];

  const navItems =
    role === "admin" ? adminNav : role === "staff" ? staffNav : customerNav;

  return (
    <aside
      className={`relative flex flex-col border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 transition-all duration-200 select-none ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Brand Header */}
      <div className="flex h-14 items-center justify-between px-4 border-b border-neutral-200 dark:border-neutral-800">
        {!isCollapsed && (
          <div className="flex flex-col">
            <span className="font-bold text-sm tracking-wider uppercase text-neutral-900 dark:text-neutral-50">
              BRIGHTLOOP
            </span>
            <span className="text-[10px] text-neutral-400 tracking-tight">
              SUBSCRIPTION OPS
            </span>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-900 mx-auto"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2 text-xs font-medium rounded transition-colors ${
                isActive
                  ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                  : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900 hover:text-neutral-900 dark:hover:text-neutral-100"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User Card & Logout */}
      <div className="p-3 border-t border-neutral-200 dark:border-neutral-800">
        {!isCollapsed ? (
          <div className="flex flex-col space-y-2">
            <div className="flex flex-col">
              <span className="text-xs font-semibold truncate text-neutral-900 dark:text-neutral-100">
                {userName || userEmail}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-neutral-900 dark:bg-neutral-100" />
                <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-500">
                  {role}
                </span>
              </div>
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                className="flex w-full items-center gap-2 px-2 py-1.5 text-xs text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>
            </form>
          </div>
        ) : (
          <form action={logoutAction} className="flex justify-center">
            <button
              type="submit"
              title="Sign Out"
              className="p-2 text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 rounded"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        )}
      </div>
    </aside>
  );
}
