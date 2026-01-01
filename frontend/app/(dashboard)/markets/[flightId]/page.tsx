"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Share2,
  Clock,
  AlertTriangle,
  Ban,
  Timer,
} from "lucide-react";
import Link from "next/link";
import { OrderForm } from "@/components/markets/order-form";
import { SubMarketsList, SubMarket } from "@/components/markets/submarket-list";
import { MarketTabs } from "@/components/markets/market-tabs";

// --- MOCK DATA ---
const SUBMARKETS: SubMarket[] = [
  {
    id: "delay-5",
    label: "Minor Delay (> 5 mins)",
    icon: Timer,
    probability: 82,
    price: 82,
    trend: "up",
    history: [
      { value: 40 },
      { value: 45 },
      { value: 60 },
      { value: 75 },
      { value: 82 },
    ],
  },
  {
    id: "delay-15",
    label: "Moderate Delay (> 15 mins)",
    icon: Clock,
    probability: 65,
    price: 65,
    trend: "up",
    history: [
      { value: 20 },
      { value: 25 },
      { value: 30 },
      { value: 55 },
      { value: 65 },
    ],
  },
  {
    id: "delay-30",
    label: "Severe Delay (> 30 mins)",
    icon: AlertTriangle,
    probability: 30,
    price: 30,
    trend: "flat",
    history: [
      { value: 10 },
      { value: 12 },
      { value: 11 },
      { value: 25 },
      { value: 30 },
    ],
  },
  {
    id: "cancelled",
    label: "Flight Cancelled",
    icon: Ban,
    probability: 5,
    price: 5,
    trend: "down",
    history: [
      { value: 2 },
      { value: 2 },
      { value: 3 },
      { value: 6 },
      { value: 5 },
    ],
  },
];

export default function MarketPage({
  params,
}: {
  params: { flightId: string };
}) {
  // State: Which submarket is currently active in the Order Form?
  const [activeMarketId, setActiveMarketId] = useState<string>(
    SUBMARKETS[0].id
  );
  const [activeSide, setActiveSide] = useState<"YES" | "NO">("YES");

  // Inside MarketPage component
  const activeMarket =
    SUBMARKETS.find((m) => m.id === activeMarketId) || SUBMARKETS[0];

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {/* Top Nav (unchanged) */}
      <div className="flex items-center gap-4">
        <Link href="/markets">
          <Button
            variant="ghost"
            size="sm"
            className="pl-0 text-zinc-500 hover:text-black"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Markets
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* --- LEFT COL: SUBMARKETS LIST (8/12) --- */}
        <div className="lg:col-span-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-zinc-200 pb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-extrabold text-zinc-900 tracking-tight">
                  UA 920
                </h1>
                <Badge
                  variant="outline"
                  className="text-zinc-600 bg-zinc-100 border-zinc-200 px-3 py-1"
                >
                  LHR — IAD
                </Badge>
              </div>
              <p className="text-zinc-500">
                Multi-outcome prediction markets for this flight.
              </p>
            </div>
          </div>
          {/* The Submarket Table */}
          <div>
            <h3 className="text-lg font-bold text-zinc-900 mb-4">
              Available Markets
            </h3>
            <SubMarketsList
              markets={SUBMARKETS}
              selectedId={activeMarketId}
              onSelect={(id, side) => {
                setActiveMarketId(id);
                setActiveSide(side);
              }}
            />
          </div>

          {/* AI Insights (Simplified for brevity) */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-6">
            <h4 className="font-bold text-zinc-900 mb-2">
              AI Analysis for: {activeMarket.label}
            </h4>
            <p className="text-zinc-500 text-sm">
              Based on current weather patterns, the probability of a{" "}
              {activeMarket.label} is
              <span className="font-bold text-black mx-1">
                higher than market consensus
              </span>
              .
            </p>
          </div>

          <div>
            <MarketTabs submarkets={SUBMARKETS} />
          </div>
        </div>

        {/* --- RIGHT COL: DYNAMIC ORDER FORM (4/12) --- */}
        <div className="lg:col-span-4">
          <div className=" space-y-4">
            {/* Optional: The "Black Box" Indicator to confirm selection */}
            <div className="p-4 bg-zinc-900 rounded-lg flex items-center gap-4 shadow-lg text-white">
              <div className="p-2 bg-zinc-800 rounded">
                <activeMarket.icon className="w-6 h-6 text-zinc-300" />
              </div>
              <div>
                <p className="text-[10px] uppercase text-zinc-400 font-bold tracking-wider">
                  Trading Contract
                </p>
                <p className="font-bold text-lg leading-none">
                  {activeMarket.label}
                </p>
              </div>
            </div>

            {/* --- THE COMPONENT CALL --- */}
            <OrderForm
              market={{
                id: activeMarket.id,
                label: activeMarket.label,
                price: activeMarket.price,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
