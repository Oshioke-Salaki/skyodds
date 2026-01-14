"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plane, LayoutDashboard, PlusCircle, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { WalletButton } from "./wallet-button";
import { FaucetButton } from "../layout/faucet-button";
import { useUserBalance } from "@/hooks/useUserBalance";
import { usePortfolio } from "@/hooks/usePortfolio";

const navItems = [
  { name: "Markets", href: "/markets", icon: Plane },
  { name: "Portfolio", href: "/portfolio", icon: LayoutDashboard },
  { name: "Create Market", href: "/create", icon: PlusCircle },
];

export function Navbar() {
  const { positions, stats, isLoading: isLoadingPortfolio } = usePortfolio();
  const pathname = usePathname();
  const { balance, isLoading } = useUserBalance();

  return (
    <header className="h-16 border-b border-zinc-200 bg-white/80 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between px-6 w-full">
      {/* Left: Logo and Nav Links */}
      <div className="flex items-center gap-8">
        <Link href="/markets" className="flex items-center gap-2">
          <div className="bg-black p-1.5 rounded-md shadow-sm">
            <Plane className="w-4 h-4 text-white transform -rotate-45" />
          </div>
          <span className="text-lg font-bold tracking-tight text-zinc-900 hidden sm:block">
            Outcome
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-zinc-100 text-black shadow-sm"
                      : "text-zinc-500 hover:text-black hover:bg-zinc-50"
                  )}
                >
                  <item.icon
                    className={cn(
                      "w-4 h-4",
                      isActive ? "text-black" : "text-zinc-400"
                    )}
                  />
                  <span className="hidden md:block">{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Right: Wallet Actions & Balance */}
      <div className="flex items-center gap-3">
        <div className="hidden lg:flex items-center gap-8">
          <div className="flex flex-col items-start translate-y-[1px]">
            <div className="text-[11px] font-semibold text-zinc-400 leading-none mb-1.5">
              Portfolio
            </div>
            <p className="text-[15px] font-bold text-emerald-500 font-mono leading-none">
              ${stats.totalValue.toFixed(2)}
            </p>
          </div>

          <div className="flex flex-col items-start translate-y-[1px]">
            <div className="text-[11px] font-semibold text-zinc-400 leading-none mb-1.5">
              Cash
            </div>
            <p className="text-[15px] font-bold text-emerald-500 font-mono leading-none">
              {isLoading ? (
                <span className="animate-pulse text-zinc-300">...</span>
              ) : (
                `$${balance}`
              )}
            </p>
          </div>
          <FaucetButton />
        </div>

        <WalletButton />
      </div>
    </header>
  );
}
