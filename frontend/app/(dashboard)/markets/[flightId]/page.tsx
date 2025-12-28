"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Share2,
  CloudRain,
  Wind,
  History,
  BrainCircuit,
} from "lucide-react";
import Link from "next/link";
import { OrderForm } from "@/components/markets/order-form";
import { OddsChart } from "@/components/markets/odds-chart";

// Mock Data
const MARKET_DATA = {
  id: "UA920",
  pair: "UA920 / DELAY",
  price: 62,
  aiPrediction: 82,
};

export default function MarketPage({
  params,
}: {
  params: { flightId: string };
}) {
  return (
    <div className="max-w-[1600px] mx-auto space-y-8">
      {/* --- TOP NAV --- */}
      <div className="flex items-center gap-4">
        <Link href="/markets">
          <Button
            variant="ghost"
            size="sm"
            className="pl-0 text-zinc-500 hover:text-black hover:bg-transparent"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Markets
          </Button>
        </Link>
      </div>

      {/* --- TITLE HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-zinc-200 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-extrabold text-zinc-900 tracking-tight">
              UA 920
            </h1>
            <Badge
              variant="outline"
              className="text-red-600 bg-red-50 border-red-200 px-3 py-1 font-semibold"
            >
              DELAY LIKELY
            </Badge>
          </div>
          <p className="text-zinc-500 text-lg">
            London Heathrow (LHR) — Washington Dulles (IAD)
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="border-zinc-300 text-zinc-700 hover:bg-zinc-50 hover:text-black"
          >
            <Share2 className="w-4 h-4 mr-2" /> Share Frame
          </Button>
          <Button className="bg-black text-white hover:bg-zinc-800 shadow-md">
            Download AI Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* --- LEFT COL: CHART & ANALYSIS (8/12 width) --- */}
        <div className="lg:col-span-8 space-y-8">
          {/* Chart Card */}
          <div className="bg-white border border-zinc-200 rounded-xl p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-xs text-zinc-500 font-mono uppercase tracking-wider mb-1">
                  Market Price (Delay)
                </p>
                <div className="flex items-baseline gap-3">
                  <p className="text-4xl font-bold text-zinc-900">$0.62</p>
                  <span className="text-sm text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                    +12% Today
                  </span>
                </div>
              </div>
              <div className="flex bg-zinc-100 rounded-lg p-1">
                {["1H", "1D", "1W", "ALL"].map((t, i) => (
                  <button
                    key={t}
                    className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
                      i === 1
                        ? "bg-white text-black shadow-sm"
                        : "text-zinc-500 hover:text-black"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <OddsChart />
          </div>

          {/* AI Insights "Bento Grid" */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
              <BrainCircuit className="w-5 h-5" />
              AI Model Analysis
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Insight 1 */}
              <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm hover:border-black/20 transition-colors">
                <div className="w-10 h-10 bg-zinc-50 rounded-lg flex items-center justify-center mb-4 text-black border border-zinc-100">
                  <CloudRain className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-zinc-900 mb-2">Severe Weather</h4>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  Thunderstorms detected in the North Atlantic corridor.
                  Historical impact:{" "}
                  <span className="text-red-600 font-bold">
                    +15% delay risk
                  </span>
                  .
                </p>
              </div>

              {/* Insight 2 */}
              <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm hover:border-black/20 transition-colors">
                <div className="w-10 h-10 bg-zinc-50 rounded-lg flex items-center justify-center mb-4 text-black border border-zinc-100">
                  <Wind className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-zinc-900 mb-2">Runway Traffic</h4>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  LHR departing runway 27R is experiencing heavy congestion.
                  Average taxi time increased by 20 mins.
                </p>
              </div>

              {/* Insight 3 */}
              <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm hover:border-black/20 transition-colors">
                <div className="w-10 h-10 bg-zinc-50 rounded-lg flex items-center justify-center mb-4 text-black border border-zinc-100">
                  <History className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-zinc-900 mb-2">
                  Airline Pattern
                </h4>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  Flight UA920 has arrived late 4 out of the last 5 days.
                  Chronically delayed route.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* --- RIGHT COL: ORDER FORM (4/12 width) --- */}
        <div className="lg:col-span-4">
          <OrderForm marketPrice={MARKET_DATA.price} />

          {/* Oracle Status - Clean Footer */}
          <div className="mt-8 pt-6 border-t border-zinc-200 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 border border-zinc-200 text-xs font-medium text-zinc-600">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Oasis Oracle: Online & Verifying
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
