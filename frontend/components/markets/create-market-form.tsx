"use client";

import React, { useState, useEffect } from "react";
import { useWallets } from "@particle-network/connectkit"; // 1. Particle Hook
import { parseUnits, encodeFunctionData } from "viem";
import { useWaitForTransactionReceipt } from "wagmi"; // We keep this for waiting
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Plane,
  Calendar,
  MapPin,
  Loader2,
  Plus,
  Settings2,
  Building2,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { skyOddsAddress } from "@/hooks/generated"; // Your contract address
import skyOddsAbi from "@/app/abis/SkyOdds.json"; // Your ABI

const MANTLE_SEPOLIA_ID = 5003;

export function CreateMarketForm() {
  // --- STATE ---
  const [formData, setFormData] = useState({
    flightNumber: "BA249",
    airline: "BA",
    origin: "LHR",
    destination: "JFK",
    departureTime: "",
    liquidity: "0",
  });

  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Default date setup (Tomorrow 2:30 PM)
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 30, 0, 0);
    const dateString = tomorrow.toISOString().slice(0, 16);
    setFormData((prev) => ({ ...prev, departureTime: dateString }));
  }, []);

  // --- PARTICLE WALLET HOOK ---
  // This bypasses the Wagmi connector issues
  const [primaryWallet] = useWallets();

  // --- WAIT FOR RECEIPT ---
  // Wagmi can still track the hash once we have it
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash: txHash });

  // --- SUCCESS EFFECT ---
  useEffect(() => {
    if (isConfirmed) {
      toast.success("Market Created Successfully!", {
        description: `Flight ${formData.flightNumber} is now live.`,
        icon: <CheckCircle2 className="w-5 h-5 text-green-600" />,
        duration: 5000,
      });
      // Clear hash to reset the "Confirming" state if needed
      setTxHash(undefined);
    }
  }, [isConfirmed, formData.flightNumber]);

  // --- HANDLER ---
  const handleCreate = async () => {
    if (!primaryWallet) {
      toast.error("Wallet Disconnected", {
        description: "Please connect your wallet first.",
      });
      return;
    }

    if (!formData.flightNumber || !formData.origin || !formData.destination) {
      toast.error("Missing Data", {
        description: "Please fill in all fields.",
      });
      return;
    }

    const unixTimestamp = Math.floor(
      new Date(formData.departureTime).getTime() / 1000
    );

    try {
      setIsSubmitting(true);
      const walletClient = primaryWallet.getWalletClient();
      const account = primaryWallet.accounts[0];

      // 2. Prepare Transaction Data Manually
      const liquidityWei = parseUnits(formData.liquidity, 6); // USDC 6 decimals

      const data = encodeFunctionData({
        abi: skyOddsAbi,
        functionName: "createFlightMarket",
        args: [
          formData.flightNumber.toUpperCase(),
          formData.origin.toUpperCase(),
          formData.destination.toUpperCase(),
          formData.airline.toUpperCase(),
          BigInt(unixTimestamp),
          liquidityWei,
        ],
      });

      // 3. Send Transaction via Wallet Client
      toast.loading("Please confirm in your wallet...", { id: "tx" });

      const hash = await walletClient.sendTransaction({
        to: skyOddsAddress,
        data: data,
        account: account as `0x${string}`,
        chain: undefined,
        value: 0n,
      });

      toast.dismiss("tx");

      // 4. Pass hash to Wagmi hook to track confirmation
      setTxHash(hash);

      toast.info("Transaction Submitted", {
        description: "Waiting for blockchain confirmation...",
      });
    } catch (err: any) {
      console.error(err);
      toast.dismiss("switch");
      toast.dismiss("tx");
      toast.error("Creation Failed", {
        description: err.message?.split("\n")[0] || "User rejected request",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const isLoading = isSubmitting || isConfirming;

  return (
    <Card className="border-zinc-200 shadow-sm bg-white">
      <CardHeader className="pb-4 border-b border-zinc-100">
        <CardTitle className="text-xl font-bold flex items-center gap-2 text-zinc-900">
          <Settings2 className="w-5 h-5 text-zinc-500" />
          Manual Market Configuration
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        {/* ROW 1: Flight ID & Airline */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold text-zinc-500 uppercase">
              Flight Number
            </Label>
            <div className="relative">
              <Plane className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
              <Input
                name="flightNumber"
                value={formData.flightNumber}
                onChange={handleChange}
                placeholder="e.g. BA249"
                className="pl-9 font-mono uppercase bg-zinc-50/50"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold text-zinc-500 uppercase">
              Airline Code
            </Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
              <Input
                name="airline"
                value={formData.airline}
                onChange={handleChange}
                placeholder="e.g. BA"
                maxLength={3}
                className="pl-9 font-mono uppercase bg-zinc-50/50"
              />
            </div>
          </div>
        </div>

        {/* ROW 2: Route */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold text-zinc-500 uppercase">
              Origin (IATA)
            </Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
              <Input
                name="origin"
                value={formData.origin}
                onChange={handleChange}
                placeholder="e.g. LHR"
                maxLength={3}
                className="pl-9 font-mono uppercase bg-zinc-50/50"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold text-zinc-500 uppercase">
              Destination (IATA)
            </Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
              <Input
                name="destination"
                value={formData.destination}
                onChange={handleChange}
                placeholder="e.g. JFK"
                maxLength={3}
                className="pl-9 font-mono uppercase bg-zinc-50/50"
              />
            </div>
          </div>
        </div>

        {/* ROW 3: Date & Liquidity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold text-zinc-500 uppercase">
              Departure Time (Local)
            </Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-zinc-400 z-10" />
              <Input
                type="datetime-local"
                name="departureTime"
                value={formData.departureTime}
                onChange={handleChange}
                className="pl-9 font-mono bg-zinc-50/50"
              />
            </div>
          </div>

          {/* <div className="space-y-2">
            <Label className="text-xs font-bold text-zinc-500 uppercase">
              Initial Liquidity (b)
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-zinc-400 font-bold text-sm">
                b =
              </span>
              <Input
                type="number"
                name="liquidity"
                value={formData.liquidity}
                onChange={handleChange}
                placeholder="1000"
                className="pl-10 font-mono bg-zinc-50/50"
              />
            </div>
          </div> */}
        </div>
      </CardContent>

      <CardFooter className="pt-2 pb-6">
        <Button
          className="w-full h-12 bg-zinc-900 text-white hover:bg-black font-bold text-sm rounded-lg shadow-lg shadow-zinc-200/50 transition-all active:scale-[0.98]"
          onClick={handleCreate}
          disabled={isLoading}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Check Wallet...
            </>
          ) : isConfirming ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Confirming Transaction...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Initialize Market
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
