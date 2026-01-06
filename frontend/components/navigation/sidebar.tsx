"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Plane,
  Wallet,
  Settings,
  PlusCircle,
  LogOut,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FaucetButton } from "../layout/faucet-button";
import { useUserBalance } from "@/hooks/useUserBalance";

const navItems = [
  { name: "Markets", href: "/markets", icon: Plane },
  { name: "Portfolio", href: "/portfolio", icon: LayoutDashboard },
  { name: "Create Market", href: "/create", icon: PlusCircle },
  // { name: "Governance", href: "/governance", icon: FileText },
  // { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { balance, isLoading } = useUserBalance();

  return (
    <div className="flex h-screen flex-col justify-between border-r border-zinc-200 bg-white w-64 p-4 md:flex font-sans">
      {/* --- LOGO AREA --- */}
      <div>
        <div className="flex items-center gap-2 mb-10 px-2 mt-2">
          <div className="bg-black p-1.5 rounded-md shadow-sm">
            <Plane className="w-4 h-4 text-white transform -rotate-45" />
          </div>
          <span className="text-lg font-bold tracking-tight text-zinc-900">
            SkyOdds
          </span>
        </div>

        {/* --- NAVIGATION --- */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-zinc-100 text-black shadow-sm" // Active: Light gray bg, sharp black text
                      : "text-zinc-500 hover:text-black hover:bg-zinc-50" // Inactive: Gray text
                  )}
                >
                  <item.icon
                    className={cn(
                      "w-4 h-4",
                      isActive ? "text-black" : "text-zinc-400"
                    )}
                  />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* --- USER / WALLET AREA --- */}
      <div className="pt-4 border-t border-zinc-100 space-y-3">
        <FaucetButton />
        <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200">
          <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold mb-1 flex items-center gap-1">
            <Wallet className="w-3 h-3" /> Available Balance
          </p>
          <p className="text-lg font-bold text-zinc-900 font-mono">
            {isLoading ? (
              <span className="animate-pulse text-zinc-400">...</span>
            ) : (
              balance
            )}
            <span className="text-sm text-zinc-500 font-sans ml-1">USDC</span>
          </p>
        </div>

        <Button
          variant="ghost"
          className="w-full justify-start text-zinc-500 hover:text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Disconnect
        </Button>
      </div>
    </div>
  );
}
