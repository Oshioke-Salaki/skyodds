"use client";

import React, { useState, useEffect, use } from "react"; // <--- 1. Import 'use'
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Clock,
  AlertTriangle,
  Ban,
  Timer,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { OrderForm } from "@/components/markets/order-form";
import { SubMarketsList, SubMarket } from "@/components/markets/submarket-list";
import { MarketTabs } from "@/components/markets/market-tabs";
import { useAllMarkets } from "@/hooks/useMarketData";
import { UserPositionsCard } from "@/components/markets/user-positions-card";
import { MarketGraph } from "@/components/market-graph";


export default function MarketPage({
  params,
}: {
  params: Promise<{ flightId: string }>; // <--- 2. Update Type to Promise
}) {
  // 3. Unwrap the params using React.use()
  const { flightId } = use(params);

  const { markets, isLoading } = useAllMarkets();

  // 4. Use 'flightId' directly instead of 'params.flightId'
  const marketData = markets.find((m) => m.id === flightId);

  // State for UI selection
  const [activeMarketId, setActiveMarketId] = useState<string>("");

  // Construct Submarkets dynamically from Contract Data
  const dynamicSubmarkets: SubMarket[] = marketData
    ? [
      {
        id: "ontime",
        label: "On Time",
        icon: Timer,
        probability: marketData.prices.onTime,
        price: marketData.prices.onTime,
        outcomeIndex: 1,
        trend: "up",
        history: [
          { value: 40 },
          { value: 60 },
          { value: marketData.prices.onTime },
        ],
      },
      {
        id: "delay-30",
        label: "Delayed > 30m",
        icon: Clock,
        probability: marketData.prices.delayed30,
        price: marketData.prices.delayed30,
        outcomeIndex: 2,
        trend: "flat",
        history: [
          { value: 20 },
          { value: 25 },
          { value: marketData.prices.delayed30 },
        ],
      },
      {
        id: "delay-120",
        label: "Delayed > 2h",
        icon: AlertTriangle,
        probability: marketData.prices.delayed120,
        price: marketData.prices.delayed120,
        outcomeIndex: 3,
        trend: "flat",
        history: [
          { value: 10 },
          { value: 10 },
          { value: marketData.prices.delayed120 },
        ],
      },
      {
        id: "cancelled",
        label: "Cancelled",
        icon: Ban,
        probability: marketData.prices.cancelled,
        price: marketData.prices.cancelled,
        outcomeIndex: 4,
        trend: "down",
        history: [
          { value: 5 },
          { value: 2 },
          { value: marketData.prices.cancelled },
        ],
      },
    ]
    : [];

  // Set default active market once data loads
  useEffect(() => {
    if (dynamicSubmarkets.length > 0 && !activeMarketId) {
      setActiveMarketId(dynamicSubmarkets[1].id);
    }
  }, [dynamicSubmarkets, activeMarketId]);

  const activeMarket =
    dynamicSubmarkets.find((m) => m.id === activeMarketId) ||
    dynamicSubmarkets[1];

  if (isLoading || !marketData || !activeMarket) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  const isMarketResolved = marketData
    ? marketData.status !== "Unresolved"
    : false;

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {/* Top Nav */}
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
        {/* --- LEFT COL: SUBMARKETS LIST --- */}
        <div className="lg:col-span-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-zinc-200 pb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-extrabold text-zinc-900 tracking-tight">
                  {marketData.flightNumber}
                </h1>
                <Badge
                  variant="outline"
                  className="text-zinc-600 bg-zinc-100 border-zinc-200 px-3 py-1"
                >
                  {marketData.route}
                </Badge>
              </div>
              <p className="text-zinc-500">
                Departure: {marketData.departureTime} • Status:{" "}
                {marketData.status}
              </p>
            </div>
          </div>

          {/* Graph Section */}
          <div className="mb-8">
            <MarketGraph flightId={marketData.id} />
          </div>

          {/* The Submarket Table */}
          <div>
            <h3 className="text-lg font-bold text-zinc-900 mb-4">
              Available Markets
            </h3>
            <SubMarketsList
              markets={dynamicSubmarkets}
              selectedId={activeMarketId}
              onSelect={(id) => setActiveMarketId(id)}
            />
          </div>

          {/* AI Insights */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-6">
            <h4 className="font-bold text-zinc-900 mb-2">
              AI Analysis for: {activeMarket.label}
            </h4>
            <p className="text-zinc-500 text-sm">
              Based on current weather patterns, the probability of{" "}
              {activeMarket.label} is
              <span className="font-bold text-black mx-1">
                higher than market consensus
              </span>
              .
            </p>
          </div>

          <div>
            <MarketTabs
              flightId={marketData.id}
              submarkets={dynamicSubmarkets}
            />
          </div>
        </div>

        {/* --- RIGHT COL: ORDER FORM --- */}
        <div className="lg:col-span-4">
          <div className="space-y-4">
            {/* 1. NEW: User Positions Card */}
            <UserPositionsCard
              flightId={marketData.id}
              isResolved={isMarketResolved}
            />
            {/* Visual Indicator */}
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

            {/* Order Form */}
            <OrderForm
              market={{
                id: marketData.id,
                label: activeMarket.label,
                price: activeMarket.price,
                outcomeIndex: activeMarket.outcomeIndex,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
