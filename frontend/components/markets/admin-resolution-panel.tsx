"use client";

import { useState, useEffect } from "react";
import { useAccount, useWallets } from "@particle-network/connectkit"; // 1. Use Particle Hook
import { useWaitForTransactionReceipt } from "wagmi";
import { encodeFunctionData } from "viem"; // 2. For manual encoding
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import skyOddsAbi from "../../app/abis/SkyOdds.json";
import { skyOddsAddress } from "@/hooks/generated";

const ADMIN_ADDRESS = "0xB2914810724FE2Fb871960eB200Dea427854b1C7";

interface AdminResolutionPanelProps {
  marketId: string;
  departureTimestamp: number | bigint;
  isResolved: boolean;
}

export function AdminResolutionPanel({
  marketId,
  departureTimestamp,
  isResolved,
}: AdminResolutionPanelProps) {
  // Use Wagmi's useAccount just for reading the address/display
  const { address } = useAccount();

  // Use Particle's useWallets for the actual transaction logic
  const [primaryWallet] = useWallets();

  const [canResolve, setCanResolve] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- WAIT FOR RECEIPT ---
  // Wagmi can track the hash once we get it from Particle
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  useEffect(() => {
    if (isSuccess) {
      toast.success("Market Resolved", {
        description: "Winnings are now claimable by users.",
      });
      setTimeout(() => window.location.reload(), 1500);
    }
  }, [isSuccess]);

  // --- TIME LOGIC ---
  useEffect(() => {
    const checkTime = () => {
      const now = Math.floor(Date.now() / 1000);
      const departureTimeSeconds = Number(departureTimestamp);
      const unlockTime = departureTimeSeconds + 1800;

      if (now >= unlockTime) {
        setCanResolve(true);
        setTimeRemaining("READY");
      } else {
        setCanResolve(false);
        const diff = unlockTime - now;
        const days = Math.floor(diff / 86400);
        const hours = Math.floor((diff % 86400) / 3600);
        const minutes = Math.floor((diff % 3600) / 60);
        const seconds = diff % 60;

        let timeString = "";
        if (days > 0) timeString += `${days}d `;
        if (hours > 0) timeString += `${hours}h `;
        timeString += `${minutes}m ${seconds}s`;

        setTimeRemaining(`UNLOCK IN ${timeString.trim()}`);
      }
    };

    checkTime();
    const timer = setInterval(checkTime, 1000);
    return () => clearInterval(timer);
  }, [departureTimestamp]);

  // --- ADMIN CHECK ---
  const currentAddr = address?.toLowerCase();
  const allowedAdmins = [
    ADMIN_ADDRESS.toLowerCase(),
    "0x08C0721aC862C243c8162C8EC1F39D1928baFc01".toLowerCase(),
    "0x9E1809ca97C5215298B7465d69b0A5C075F0d04C".toLowerCase(),
  ];

  if (!currentAddr || !allowedAdmins.includes(currentAddr) || isResolved) {
    return null;
  }

  // Optional: Hide if resolved (uncomment if desired)
  // if (isResolved) return null;

  // --- RESOLVE HANDLER (PARTICLE NATIVE) ---
  const handleResolve = async (outcomeIndex: number) => {
    if (!primaryWallet) {
      toast.error("Wallet Disconnected");
      return;
    }

    const toastId = toast.loading("Processing resolution...");

    try {
      setIsSubmitting(true);
      const walletClient = primaryWallet.getWalletClient();
      const account = primaryWallet.accounts[0];

      // 2. Encode Data Manually
      const data = encodeFunctionData({
        abi: skyOddsAbi,
        functionName: "resolveMarket",
        args: [marketId as `0x${string}`, outcomeIndex],
      });

      // 3. Send Transaction
      const hash = await walletClient.sendTransaction({
        to: skyOddsAddress,
        data: data,
        account: account as `0x${string}`,
        chain: undefined,
        value: 0n,
      });

      // 4. Track Hash
      setTxHash(hash);

      toast.dismiss(toastId);
      toast.info("Transaction Sent", {
        description: "Waiting for blockchain confirmation...",
      });
    } catch (err: any) {
      console.error(err);
      toast.dismiss(toastId);
      toast.dismiss("switch");
      toast.error("Error", {
        description: err.message?.split("\n")[0] || "Transaction failed",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isWorking = isSubmitting || isConfirming;

  return (
    <Card className="border-2 border-dashed border-zinc-200 bg-zinc-50/50 shadow-none mt-12 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <CardHeader className="pb-3 border-b border-zinc-200/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-black rounded-md text-white">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-zinc-900 uppercase tracking-widest">
                Admin Console
              </CardTitle>
              <p className="text-[10px] text-zinc-500 font-medium">
                Settlement Authority
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="bg-white border-zinc-300 text-zinc-900 font-mono text-[10px] tracking-wider py-1"
          >
            STATUS: {timeRemaining}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <div className="space-y-4">
          <p className="text-xs text-zinc-500 font-medium leading-relaxed">
            Select the final verified outcome from FlightAware. <br />
            <span className="text-zinc-900 font-bold">Warning:</span> This will
            trigger payouts and cannot be reversed.
          </p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Button
              variant="outline"
              className="h-12 border-zinc-200 hover:border-black hover:bg-zinc-50 text-zinc-700 hover:text-black font-bold transition-all"
              disabled={!canResolve || isWorking}
              onClick={() => handleResolve(1)}
            >
              On Time
            </Button>

            <Button
              variant="outline"
              className="h-12 border-zinc-200 hover:border-black hover:bg-zinc-50 text-zinc-700 hover:text-black font-bold transition-all"
              disabled={!canResolve || isWorking}
              onClick={() => handleResolve(2)}
            >
              Delay {">"} 30m
            </Button>

            <Button
              variant="outline"
              className="h-12 border-zinc-200 hover:border-black hover:bg-zinc-50 text-zinc-700 hover:text-black font-bold transition-all"
              disabled={!canResolve || isWorking}
              onClick={() => handleResolve(3)}
            >
              Delay {">"} 2h
            </Button>

            <Button
              variant="outline"
              className="h-12 border-zinc-200 hover:border-black hover:bg-zinc-50 text-zinc-700 hover:text-black font-bold transition-all"
              disabled={!canResolve || isWorking}
              onClick={() => handleResolve(4)}
            >
              Cancelled
            </Button>
          </div>

          {isWorking && (
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-zinc-900 bg-zinc-100 p-3 rounded border border-zinc-200 animate-pulse">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Finalizing Settlement on Blockchain...</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
