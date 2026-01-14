"use client";

import { useAccount, useModal } from "@particle-network/connectkit";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function WalletButton() {
    const { address, isConnected } = useAccount();
    const { setOpen } = useModal();

    const truncatedAddress = address
        ? `${address.slice(0, 4)}...${address.slice(-4)}`
        : "";

    return (
        <Button
            onClick={() => setOpen(true)}
            className={cn(
                "bg-black hover:bg-zinc-800 text-white font-semibold h-9 w-32 justify-center px-3 gap-2 transition-all duration-200"
            )}
        >
            {isConnected ? (
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-mono text-sm">{truncatedAddress}</span>
                </div>
            ) : (
                "Connect"
            )}
        </Button>
    );
}
