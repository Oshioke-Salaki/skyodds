"use client";

import React from "react";
import { Coins, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFaucet } from "@/hooks/useFaucet";

export function FaucetButton() {
  const { handleMint, isLoading } = useFaucet();

  return (
    <Button
      variant="default"
      size="sm"
      onClick={handleMint}
      disabled={isLoading}
      className="bg-black hover:bg-zinc-800 text-white font-semibold h-9 w-32 justify-center px-3 gap-2 transition-all duration-200"
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        "Deposit"
      )}
    </Button>
  );
}
