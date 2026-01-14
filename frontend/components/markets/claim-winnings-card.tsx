"use client";

import { useEffect, useState } from "react";
import { useReadContract, useWaitForTransactionReceipt } from "wagmi";
import { useWallets } from "@particle-network/connectkit";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Trophy,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { formatUnits, encodeFunctionData } from "viem";
import skyOddsAbi from "../../app/abis/SkyOdds.json";
import { skyOddsAddress } from "@/hooks/generated";
import { useAccount } from "@particle-network/connectkit";
import { cn } from "@/lib/utils";

interface ClaimWinningsCardProps {
  marketId: string;
  tokenDecimals?: number; // Default to 6 for USDC
  isResolved?: boolean;
}

export function ClaimWinningsCard({
  marketId,
  tokenDecimals = 6,
  isResolved = true,
}: ClaimWinningsCardProps) {
  const { address } = useAccount();
  const [primaryWallet] = useWallets();

  // State for manual transaction tracking
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- READ DATA ---
  const { data: winningsData, isLoading: isLoadingData } = useReadContract({
    address: skyOddsAddress,
    abi: skyOddsAbi,
    functionName: "calculateWinnings",
    args: address ? [marketId, address] : undefined,
    query: {
      enabled: !!address && isResolved,
      refetchInterval: 10000,
    },
  });

  const [payoutBN, feeBN, canClaim] = (winningsData as [
    bigint,
    bigint,
    boolean,
  ]) || [0n, 0n, false];

  const winningsAmount = Number(formatUnits(payoutBN, tokenDecimals));
  const feeAmount = Number(formatUnits(feeBN, tokenDecimals));

  // --- WAIT FOR RECEIPT ---
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // --- HANDLER (Particle Native) ---
  const handleClaim = async () => {
    if (!primaryWallet) {
      toast.error("Wallet Disconnected");
      return;
    }

    try {
      setIsSubmitting(true);
      const walletClient = primaryWallet.getWalletClient();
      const account = primaryWallet.accounts[0];

      const data = encodeFunctionData({
        abi: skyOddsAbi,
        functionName: "claimWinnings",
        args: [marketId],
      });

      toast.loading("Confirm claim in wallet...", { id: "claim" });

      const hash = await walletClient.sendTransaction({
        to: skyOddsAddress,
        data: data,
        account: account as `0x${string}`,
        chain: undefined,
        value: 0n,
      });

      toast.dismiss("claim");
      setTxHash(hash);

      toast.info("Claim Submitted", {
        description: "Waiting for blockchain confirmation...",
      });
    } catch (err: any) {
      console.error(err);
      toast.dismiss("claim");
      toast.error("Claim Failed", {
        description: err.message?.split("\n")[0] || "Transaction failed",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (isSuccess) {
      toast.success("Winnings Claimed!", {
        description: `Successfully claimed ${winningsAmount.toFixed(2)} USDC.`,
      });
    }
  }, [isSuccess, winningsAmount]);

  if (isLoadingData) return null;
  if (!isResolved) return null;

  const shouldShow = (canClaim && winningsAmount > 0) || isSuccess;

  if (!shouldShow) return null;

  const isWorking = isSubmitting || isConfirming;

  return (
    <Card className="bg-emerald-50/50 border border-emerald-100 shadow-sm overflow-hidden mb-6 animate-in fade-in slide-in-from-top-4 duration-500 relative">
      {/* Background Decorator */}
      <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none">
        <Trophy className="w-48 h-48 text-emerald-900 rotate-12" />
      </div>

      <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-emerald-100 rounded-full shrink-0">
            {isSuccess ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            ) : (
              <Trophy className="w-6 h-6 text-emerald-600" />
            )}
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
              {isSuccess ? "Payout Complete" : "You Won!"}
              {!isSuccess && (
                <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" />
              )}
            </h3>
            <p className="text-sm text-zinc-500">
              {isSuccess
                ? "Funds have been transferred to your wallet."
                : "Claim your earnings now."}
            </p>

            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-3xl font-mono font-bold text-emerald-600 tracking-tight">
                $
                {winningsAmount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              {feeAmount > 0 && (
                <span className="text-xs font-medium text-zinc-400">
                  (after ${feeAmount.toFixed(2)} fee)
                </span>
              )}
            </div>
          </div>
        </div>

        <Button
          onClick={handleClaim}
          disabled={!canClaim || isWorking || isSuccess}
          className={cn(
            "w-full md:w-auto h-12 px-8 text-base font-bold transition-all active:scale-[0.98]",
            isSuccess
              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 cursor-default shadow-none"
              : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200"
          )}
        >
          {isWorking ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : isSuccess ? (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Claimed
            </>
          ) : (
            <>
              Claim Winnings
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}
