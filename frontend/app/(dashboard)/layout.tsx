import { Sidebar } from "@/components/navigation/sidebar";
import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConnectButton } from "@particle-network/connectkit";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50">
      {/* 1. Fixed Sidebar (White) */}
      <Sidebar />

      {/* 2. Main Content Area (Zinc-50) */}
      <div className="flex-1 flex flex-col overflow-auto">
        {/* Header - White, Sticky, Minimal borders */}
        <header className="h-16 border-b border-zinc-200 bg-white/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between px-6">
          {/* Left: Breadcrumbs or Page Title could go here */}
          <div className="flex items-center gap-4">
            {/* Global Search Bar (Optional) */}
            <div className="relative hidden md:block w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Type to search..."
                className="pl-9 bg-zinc-50 border-zinc-200 text-zinc-800 focus-visible:ring-black h-9 text-sm"
              />
            </div>
          </div>

          {/* Right: Actions */}
          <ConnectButton />
          {/* <div className="flex items-center gap-3">
            <Button
              size="icon"
              variant="ghost"
              className="text-zinc-400 hover:text-black hover:bg-zinc-100"
            >
              <Bell className="w-5 h-5" />
            </Button>


            <div className="flex items-center gap-3 pl-3 border-l border-zinc-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-black">0x3A...9f2</p>
                <p className="text-xs text-zinc-500">Pro Trader</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold ring-2 ring-zinc-100">
                JD
              </div>
            </div>
          </div> */}
        </header>

        {/* Page Content - Injected here */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-[1600px] mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
