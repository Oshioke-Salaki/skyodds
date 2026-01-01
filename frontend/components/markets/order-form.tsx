"use client";

import React, { useState, useEffect } from "react";
import { Loader2, Wallet, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface OrderFormProps {
  market: {
    id: string;
    label: string;
    price: number;
  };
}

export function OrderForm({ market }: OrderFormProps) {
  const [isBuy, setIsBuy] = useState(true);
  const [outcome, setOutcome] = useState<"YES" | "NO">("YES");
  const [amount, setAmount] = useState<string>("");
  const [shares, setShares] = useState<string>("0");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Logic
  const yesPrice = market.price;
  const noPrice = 100 - market.price;
  // If Buying YES: Price is yesPrice. If Selling YES: Price is roughly yesPrice (ignoring spread for UI demo)
  // For simplicity in this demo: Active Price tracks the Outcome Price
  const activePrice = outcome === "YES" ? yesPrice : noPrice;

  const potentialReturn = amount
    ? (parseFloat(amount) / (activePrice / 100)).toFixed(2)
    : "0.00";

  const profit = amount
    ? (parseFloat(potentialReturn) - parseFloat(amount)).toFixed(2)
    : "0.00";

  useEffect(() => {
    if (!amount || isNaN(Number(amount))) {
      setShares("0");
      return;
    }
    const shareCount = parseFloat(amount) / (activePrice / 100);
    setShares(shareCount.toFixed(2));
  }, [amount, activePrice]);

  return (
    <Card className="bg-white border border-zinc-200 shadow-sm overflow-hidden py-0 ring-1 ring-black/5">
      {/* --- HEADER: BUY / SELL TABS (Neutral) --- */}
      <div className="flex border-b border-zinc-100">
        <button
          onClick={() => setIsBuy(true)}
          className={cn(
            "flex-1 py-4 text-sm font-bold transition-all relative uppercase tracking-wider",
            isBuy
              ? "text-black "
              : "text-zinc-400 hover:text-black hover:bg-zinc-50/50"
          )}
        >
          Buy
          {isBuy && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-black" />
          )}
        </button>
        <button
          onClick={() => setIsBuy(false)}
          className={cn(
            "flex-1 py-4 text-sm font-bold transition-all relative uppercase tracking-wider",
            !isBuy
              ? "text-black "
              : "text-zinc-400 hover:text-black hover:bg-zinc-50/50"
          )}
        >
          Sell
          {!isBuy && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-black" />
          )}
        </button>
      </div>

      <div className="px-6 pb-6 space-y-8">
        {/* --- OUTCOME SELECTOR (YES=Green, NO=Red) --- */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setOutcome("YES")}
            className={cn(
              "py-2 px-4 border-2 transition-all flex items-center justify-center gap-1 group rounded-lg relative overflow-hidden",
              outcome === "YES"
                ? "bg-emerald-600 border-emerald-600 text-white shadow-md"
                : "bg-white border-zinc-200 text-zinc-500 hover:border-emerald-500 hover:text-emerald-600"
            )}
          >
            <span className="text-base font-bold uppercase opacity-90 z-10">
              Yes
            </span>
            <span className="text-2xl font-mono font-bold tracking-tighter z-10">
              {yesPrice}¢
            </span>
            {outcome === "YES" && (
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
            )}
          </button>

          <button
            onClick={() => setOutcome("NO")}
            className={cn(
              "py-2 px-4 border-2 transition-all flex justify-center items-center rounded-lg gap-1 group relative overflow-hidden",
              outcome === "NO"
                ? "bg-red-600 border-red-600 text-white shadow-md"
                : "bg-white border-zinc-200 text-zinc-500 hover:border-red-600 hover:text-red-600"
            )}
          >
            <span className="text-base font-bold uppercase opacity-90 z-10">
              No
            </span>
            <span className="text-2xl font-mono font-bold tracking-tighter z-10">
              {noPrice}¢
            </span>
            {outcome === "NO" && (
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
            )}
          </button>
        </div>

        {/* --- AMOUNT INPUT --- */}
        <div className="space-y-6">
          <div className="flex justify-between items-center text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
            <span>Enter Amount</span>
            <div className="flex items-center gap-1.5 text-black">
              <Wallet className="w-3 h-3" />
              <span className="font-mono">$2,450.00</span>
            </div>
          </div>

          <div className="relative flex items-center justify-center border-b border-zinc-200 pb-2">
            <span className="text-zinc-300 text-4xl font-light mr-2">$</span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
              }}
              className="w-full bg-transparent border-none text-right text-4xl font-extrabold text-black focus:ring-0 p-0 placeholder:text-zinc-100 font-mono tracking-tighter outline-0"
            />
          </div>

          {/* Presets */}
          <div className="flex justify-between gap-2">
            {["10", "50", "100", "Max"].map((val) => (
              <button
                key={val}
                onClick={() =>
                  val === "Max"
                    ? setAmount("2450")
                    : setAmount((prev) =>
                        (parseFloat(prev || "0") + parseFloat(val)).toString()
                      )
                }
                className="flex-1 py-2 text-[10px] font-bold text-zinc-600 border border-zinc-200 bg-white hover:bg-black hover:text-white hover:border-black transition-all uppercase tracking-wide"
              >
                {val === "Max" ? "Max" : `+$${val}`}
              </button>
            ))}
          </div>
        </div>

        {/* --- RECEIPT --- */}
        {amount && (
          <div className="bg-zinc-50 p-4 border border-zinc-100 space-y-3">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500 font-medium">Est. Shares</span>
              <span className="font-mono font-bold text-black">{shares}</span>
            </div>
            <div className="w-full h-px bg-zinc-200" />
            <div className="flex justify-between items-baseline">
              <span className="text-base font-bold text-black capitalize">
                To Win 💵
              </span>
              <div className="text-right">
                <span className="block text-3xl font-mono font-bold text-green-500">
                  ${potentialReturn}
                </span>
                {/* <span
                  className={cn(
                    "text-[10px] font-mono",
                    outcome === "YES" ? "text-emerald-600" : "text-rose-600"
                  )}
                >
                  ${profit} {outcome === "YES" ? "upside" : "hedged"}
                </span> */}
              </div>
            </div>
          </div>
        )}

        {/* --- EXECUTE BUTTON (Color matches OUTCOME) --- */}
        <Button
          disabled={!amount || isSubmitting}
          onClick={() => setIsSubmitting(true)}
          className={cn(
            "w-full h-14 rounded-none text-base font-bold shadow-none transition-all rounded-md active:scale-[0.99] text-white",
            outcome === "YES"
              ? "bg-emerald-600 hover:bg-emerald-700" // YES = GREEN
              : "bg-red-600 hover:bg-red-700" // NO = RED
          )}
        >
          {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {!isSubmitting &&
            (isBuy ? (
              <ArrowUpRight className="w-4 h-4 mr-2" />
            ) : (
              <ArrowDownLeft className="w-4 h-4 mr-2" />
            ))}
          {isBuy ? "BUY" : "SELL"} {outcome}
        </Button>
      </div>
    </Card>
  );
}
