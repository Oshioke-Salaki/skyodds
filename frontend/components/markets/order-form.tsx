"use client";

import React, { useState } from "react";
import { Shield, ShieldCheck, Info, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator"; // shadcn component

export function OrderForm({ marketPrice }: { marketPrice: number }) {
  const [outcome, setOutcome] = useState<"DELAY" | "ONTIME">("DELAY");
  const [amount, setAmount] = useState<string>("");
  const [isShielded, setIsShielded] = useState(false);

  const potentialReturn = amount
    ? (parseFloat(amount) * (100 / marketPrice)).toFixed(2)
    : "0.00";
  const roi = amount ? ((100 / marketPrice - 1) * 100).toFixed(0) : "0";

  return (
    <Card className="bg-white border border-zinc-200 shadow-sm">
      <CardHeader className="pb-4 border-b border-zinc-100">
        <CardTitle className="flex items-center justify-between">
          <span className="text-lg font-bold text-zinc-900 tracking-tight">
            Trade Position
          </span>
          <span className="text-xs font-medium text-zinc-500 font-mono bg-zinc-50 px-2 py-1 rounded border border-zinc-100">
            BAL: 2,450 USDC
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* 1. OUTCOME SELECTOR */}
        <Tabs
          defaultValue="DELAY"
          onValueChange={(v) => setOutcome(v as any)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 bg-zinc-100 p-1 h-11">
            <TabsTrigger
              value="DELAY"
              className="data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm font-semibold"
            >
              DELAY (Yes)
            </TabsTrigger>
            <TabsTrigger
              value="ONTIME"
              className="data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm font-semibold"
            >
              ON TIME (No)
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* 2. PRICE INFO */}
        <div className="flex justify-between items-end">
          <span className="text-sm text-zinc-500 font-medium">
            Market Price
          </span>
          <div className="text-right">
            <span className="text-3xl font-bold text-zinc-900 tracking-tighter">
              {marketPrice}¢
            </span>
            <span className="block text-[10px] text-zinc-400 font-medium uppercase tracking-wide">
              Per Share
            </span>
          </div>
        </div>

        {/* 3. INPUT AMOUNT */}
        <div className="space-y-2">
          <div className="relative">
            <span className="absolute left-3 top-3 text-zinc-400 font-medium">
              $
            </span>
            <Input
              type="number"
              placeholder="0.00"
              className="pl-7 h-12 bg-white border-zinc-200 text-lg text-zinc-900 placeholder:text-zinc-300 focus-visible:ring-black rounded-md"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="flex justify-between text-[10px] text-zinc-400 uppercase font-medium tracking-wide">
            <span>Min: $5</span>
            <span>Max: $5,000</span>
          </div>
        </div>

        <Separator className="bg-zinc-100" />

        {/* 4. ZK PRIVACY TOGGLE (Clean Box) */}
        <div
          className={`p-4 rounded-lg border transition-all duration-200 ${
            isShielded ? "bg-zinc-50 border-black" : "bg-white border-zinc-200"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {isShielded ? (
                <ShieldCheck className="w-4 h-4 text-black" />
              ) : (
                <Shield className="w-4 h-4 text-zinc-400" />
              )}
              <span
                className={`text-sm font-bold ${
                  isShielded ? "text-black" : "text-zinc-500"
                }`}
              >
                Shielded Bet
              </span>
            </div>
            <Switch
              checked={isShielded}
              onCheckedChange={setIsShielded}
              className="data-[state=checked]:bg-black"
            />
          </div>
          <p className="text-xs text-zinc-500 leading-relaxed">
            {isShielded
              ? "Zero-Knowledge proofs enabled. Transaction is anonymous."
              : "Standard public transaction visible on block explorer."}
          </p>
        </div>

        {/* 5. SUMMARY & ACTION */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm bg-zinc-50 p-3 rounded border border-zinc-100">
            <span className="text-zinc-500">Est. Payout</span>
            <span className="text-emerald-600 font-mono font-bold">
              ${potentialReturn} (+{roi}%)
            </span>
          </div>
          <Button
            className={`w-full h-12 text-base font-bold shadow-lg transition-transform active:scale-[0.98] ${
              outcome === "DELAY"
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-emerald-600 hover:bg-emerald-700 text-white"
            }`}
          >
            {isShielded ? "Generate Proof & Confirm" : `Confirm ${outcome}`}
            <ArrowUpRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
