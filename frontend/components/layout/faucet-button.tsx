"use client";

import React, { useState } from "react";
import { Coins, Loader2, Wallet, ArrowRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useFaucet } from "@/hooks/useFaucet";
import { cn } from "@/lib/utils";

export function FaucetButton() {
  const { handleMint, isLoading } = useFaucet();
  const [isOpen, setIsOpen] = useState(false);

  const onMint = async () => {
    await handleMint();
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-fit justify-start text-emerald-600 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-700 transition-colors group"
        >
          <Coins className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
          Get Testnet USDC
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px] bg-white gap-0 p-0 overflow-hidden border-zinc-200">
        {/* --- HERO SECTION --- */}
        <div className="bg-zinc-50 p-6 border-b border-zinc-100 flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-12 h-12 bg-white rounded-full shadow-sm border border-zinc-200 flex items-center justify-center">
            <Coins className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <DialogTitle className="text-xl font-bold text-zinc-900">
              Top Up Wallet
            </DialogTitle>
            <DialogDescription className="text-zinc-500 mt-1">
              Get free testnet tokens.
            </DialogDescription>
          </div>
        </div>

        {/* --- DETAILS SECTION --- */}
        <div className="p-6 space-y-6">
          {/* Info Card */}
          <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-emerald-900">
                This is Play Money
              </h4>
              <p className="text-xs text-emerald-700 leading-relaxed">
                These funds are <strong>Mock USDC</strong> on the Mantle
                Testnet. They have no real-world value and are for testing
                SkyOdds only.
              </p>
            </div>
          </div>

          {/* Amount Row */}
          <div className="flex items-center justify-between border border-zinc-200 rounded-lg p-3 bg-white shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-zinc-100 p-2 rounded-md">
                <Wallet className="w-5 h-5 text-zinc-500" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Amount
                </p>
                <p className="text-sm font-bold text-zinc-900">1,000.00 USDC</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-zinc-300" />
          </div>

          {/* Action Button */}
          <Button
            onClick={onMint}
            disabled={isLoading}
            className="w-full h-12 text-base font-bold bg-black hover:bg-zinc-800 text-white shadow-md transition-all active:scale-[0.98]"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Minting...
              </>
            ) : (
              "Mint $1,000"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
