"use client";

import { useEffect, useState } from "react";
import { useReadContract, useWaitForTransactionReceipt } from "wagmi";
import { useWallets } from "@particle-network/connectkit"; // 1. Use Particle Wallets
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, ArrowRight, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { formatUnits, encodeFunctionData } from "viem"; // 2. Encode manually
import skyOddsAbi from "../../app/abis/SkyOdds.json";
import { skyOddsAddress } from "@/hooks/generated";
import { useAccount } from "@particle-network/connectkit";

interface ClaimWinningsCardProps {
  marketId: string;
  tokenDecimals?: number; // Default to 6 for USDC
  isResolved?: boolean;
}

const MANTLE_SEPOLIA_ID = 5003;

export function ClaimWinningsCard({
  marketId,
  tokenDecimals = 6,
  isResolved = true,
}: ClaimWinningsCardProps) {
  const { address } = useAccount();
  const [primaryWallet] = useWallets(); // 3. Get Wallet Instance

  // State for manual transaction tracking
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- READ DATA ---
  // Returns tuple: [payout, fee, canClaim]
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

  // Destructure Data safely
  const [payoutBN, feeBN, canClaim] = (winningsData as [
    bigint,
    bigint,
    boolean,
  ]) || [0n, 0n, false];

  const winningsAmount = Number(formatUnits(payoutBN, tokenDecimals));
  const feeAmount = Number(formatUnits(feeBN, tokenDecimals));

  // --- WAIT FOR RECEIPT ---
  // Wagmi tracks the hash once we get it from Particle
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

      // 2. Encode Data
      const data = encodeFunctionData({
        abi: skyOddsAbi,
        functionName: "claimWinnings",
        args: [marketId],
      });

      // 3. Send Transaction
      toast.loading("Confirm claim in wallet...", { id: "claim" });

      const hash = await walletClient.sendTransaction({
        to: skyOddsAddress,
        data: data,
        account: account as `0x${string}`,
        chain: undefined,
        value: 0n,
      });

      // 4. Update State
      toast.dismiss("claim");
      setTxHash(hash);

      toast.info("Claim Submitted", {
        description: "Waiting for blockchain confirmation...",
      });
    } catch (err: any) {
      console.error(err);
      toast.dismiss("switch");
      toast.dismiss("claim");
      toast.error("Claim Failed", {
        description: err.message?.split("\n")[0] || "Transaction failed",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- SUCCESS NOTIFICATION ---
  useEffect(() => {
    if (isSuccess) {
      toast.success("Winnings Claimed!", {
        description: `Successfully claimed ${winningsAmount.toFixed(2)} USDC.`,
      });
    }
  }, [isSuccess, winningsAmount]);

  // --- RENDER CONDITIONS ---
  if (isLoadingData) return null;
  if (!isResolved) return null;

  // Show if: (User CAN claim AND has > 0 winnings) OR (User JUST succeeded)
  const shouldShow = (canClaim && winningsAmount > 0) || isSuccess;

  if (!shouldShow) return null;

  const isWorking = isSubmitting || isConfirming;

  return (
    <Card className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 border-green-500/30 overflow-hidden relative mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Trophy className="w-24 h-24 text-green-400" />
      </div>

      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-green-400 flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              {isSuccess ? "Payout Complete" : "You Won!"}
            </h3>
            <p className="text-sm text-green-200/70">
              {isSuccess
                ? "Funds have been transferred to your wallet."
                : "Your prediction was correct. Claim your earnings now."}
            </p>

            <div className="flex items-baseline gap-2 mt-2">
              <p className="text-3xl font-bold text-white">
                {winningsAmount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
                <span className="text-sm font-normal text-white/50 ml-1">
                  USDC
                </span>
              </p>

              {feeAmount > 0 && (
                <span className="text-xs text-green-500/50">
                  (after {feeAmount.toFixed(2)} fee)
                </span>
              )}
            </div>
          </div>

          <Button
            onClick={handleClaim}
            disabled={!canClaim || isWorking || isSuccess}
            className={`w-full md:w-auto font-semibold h-12 px-6 transition-all shadow-lg ${
              isSuccess
                ? "bg-green-900/50 text-green-400 border border-green-500/50 cursor-default"
                : "bg-green-500 hover:bg-green-600 hover:scale-105 text-black shadow-green-900/20"
            }`}
          >
            {isWorking ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : isSuccess ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
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
      </CardContent>
    </Card>
  );
}
