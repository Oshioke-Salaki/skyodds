"use client";

import React, { useEffect, useState } from "react";
import { Loader2, Trophy, Wallet, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useUserPositions } from "@/hooks/useUserPositions";
import { useWriteSkyOddsClaimWinnings } from "@/hooks/generated";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Helper to map Outcome Index to Label
const OUTCOME_LABELS: Record<number, string> = {
  1: "On Time",
  2: "Delayed > 30m",
  3: "Delayed > 2h",
  4: "Cancelled",
};

interface UserPositionsCardProps {
  flightId: string;
  isResolved: boolean; // Passed from parent (marketData.outcome != 0)
}

export function UserPositionsCard({
  flightId,
  isResolved,
}: UserPositionsCardProps) {
  const { positions, hasClaimed, isLoading, refetch } =
    useUserPositions(flightId);
  const { mutateAsync: claimWinnings } = useWriteSkyOddsClaimWinnings();
  const [isClaiming, setIsClaiming] = useState(false);

  useEffect(() => {
    console.log("Here are your positions", positions);
  }, [positions]);

  const handleClaim = async () => {
    try {
      setIsClaiming(true);
      await claimWinnings({ args: [flightId as `0x${string}`] });
      toast.success("Winnings Claimed!", {
        description: "Funds sent to your wallet.",
      });
      refetch(); // Refresh UI
    } catch (err: any) {
      toast.error("Claim Failed", { description: err.message.split("\n")[0] });
    } finally {
      setIsClaiming(false);
    }
  };

  // 1. Loading State
  if (isLoading) {
    return (
      <Card className="p-6 border-zinc-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 text-zinc-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading positions...
        </div>
      </Card>
    );
  }

  // 2. Empty State (No Bets)
  if (positions.length === 0 && !hasClaimed) {
    return null; // Hide card if user has never bet here
  }

  return (
    <Card className="bg-white border border-zinc-200 shadow-sm overflow-hidden mb-6 py-0 gap-3">
      <div className="p-4 border-b border-zinc-100 bg-zinc-50 flex justify-between items-center">
        <h3 className="font-bold text-sm text-zinc-900 flex items-center gap-2">
          <Wallet className="w-4 h-4 text-zinc-500" /> My Positions
        </h3>
        {isResolved && !hasClaimed && (
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full animate-pulse">
            PAYOUT READY
          </span>
        )}
      </div>

      <div className="divide-y divide-zinc-100">
        {/* List of Positions */}
        {positions.map((pos, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-4 hover:bg-zinc-50 transition-colors"
          >
            <div>
              <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider mb-0.5">
                {pos.side === "YES" ? "Long" : "Short"}
              </p>
              <p className="font-bold text-zinc-900 text-sm">
                {OUTCOME_LABELS[pos.outcomeIndex]}
              </p>
            </div>
            <div className="text-right">
              <span
                className={cn(
                  "font-mono font-bold block",
                  pos.side === "YES" ? "text-emerald-600" : "text-red-600"
                )}
              >
                {pos.shares}
              </span>
              <span className="text-[10px] text-zinc-400">Shares</span>
            </div>
          </div>
        ))}

        {/* Claim UI */}
        {/* {hasClaimed ? (
          <div className="p-4 bg-emerald-50/50 flex items-center justify-center gap-2 text-emerald-700 font-bold text-sm">
            <CheckCircle2 className="w-4 h-4" /> Winnings Claimed
          </div>
        ) : isResolved && positions.length > 0 ? (
          <div className="p-4 bg-zinc-50">
            <Button
              onClick={handleClaim}
              disabled={isClaiming}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              {isClaiming ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trophy className="w-4 h-4 mr-2" />
              )}
              Claim Winnings
            </Button>
          </div>
        ) : null} */}
      </div>
    </Card>
  );
}
