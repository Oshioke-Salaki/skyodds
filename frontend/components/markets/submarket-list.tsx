"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkline } from "./sparkline";
import { cn } from "@/lib/utils";
import { AlertTriangle, Clock, XCircle } from "lucide-react";

// --- TYPES ---
export type SubMarket = {
  id: string;
  label: string;
  icon: any;
  probability: number;
  price: number;
  trend: "up" | "down" | "flat";
  history: { value: number }[]; // For the chart
};

interface SubMarketsListProps {
  markets: SubMarket[];
  selectedId: string;
  onSelect: (id: string, side: "YES" | "NO") => void;
}

export function SubMarketsList({
  markets,
  selectedId,
  onSelect,
}: SubMarketsListProps) {
  return (
    <div className="border border-zinc-200 rounded-xl bg-white overflow-hidden shadow-sm">
      {/* Header */}
      <div className="grid grid-cols-12 px-6 py-3 bg-zinc-50 border-b border-zinc-200 text-xs font-mono uppercase tracking-wider text-zinc-500">
        <div className="col-span-4">Outcome Condition</div>
        <div className="col-span-3 text-center">Trend (24h)</div>
        <div className="col-span-2 text-right">Prob</div>
        <div className="col-span-3 text-right">Quick Trade</div>
      </div>

      {/* Rows */}
      {markets.map((market) => {
        const isSelected = selectedId === market.id;

        return (
          <div
            key={market.id}
            className={cn(
              "grid grid-cols-12 items-center px-6 py-4 border-b border-zinc-100 transition-all cursor-pointer hover:bg-zinc-50",
              isSelected ? "bg-zinc-50 shadow-[inset_3px_0_0_0_#000]" : ""
            )}
            onClick={() => onSelect(market.id, "YES")} // Default select
          >
            {/* 1. Label & Icon */}
            <div className="col-span-4 flex items-center gap-3">
              <div
                className={cn(
                  "p-2 rounded-md",
                  isSelected
                    ? "bg-black text-white"
                    : "bg-zinc-100 text-zinc-500"
                )}
              >
                <market.icon className="w-4 h-4" />
              </div>
              <div>
                <p
                  className={cn(
                    "text-sm font-bold",
                    isSelected ? "text-black" : "text-zinc-700"
                  )}
                >
                  {market.label}
                </p>
                <p className="text-[10px] text-zinc-400">
                  Resolves via FlightAware
                </p>
              </div>
            </div>

            {/* 2. Sparkline Chart */}
            <div className="col-span-3 flex justify-center opacity-75 grayscale hover:grayscale-0 transition-all">
              <Sparkline
                data={market.history}
                color={
                  market.trend === "up"
                    ? "#10b981"
                    : market.trend === "down"
                    ? "#ef4444"
                    : "#71717a"
                }
              />
            </div>

            {/* 3. Probability */}
            <div className="col-span-2 text-right">
              <span className="text-lg font-bold text-zinc-900">
                {market.probability}%
              </span>
              <span
                className={cn(
                  "block text-[10px] font-medium",
                  market.trend === "up" ? "text-emerald-600" : "text-red-600"
                )}
              >
                {market.trend === "up" ? "▲" : "▼"}{" "}
                {Math.floor(Math.random() * 5)}%
              </span>
            </div>

            {/* 4. Action Buttons */}
            <div className="col-span-3 flex gap-2 justify-end">
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs font-bold text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(market.id, "YES");
                }}
              >
                YES {market.price}¢
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs font-bold text-red-700 bg-red-50 border-red-200 hover:bg-red-100 hover:border-red-300"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(market.id, "NO");
                }}
              >
                NO {100 - market.price}¢
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
