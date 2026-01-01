"use client";

import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ExternalLink, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// --- TYPES ---
// We import the SubMarket type to know what to put in the dropdown
import { SubMarket } from "./submarket-list";

// --- MOCK DATA GENERATOR ---
// In a real app, this would be a specialized hook: useTopHolders(subMarketId)
const getHoldersForMarket = (marketId: string) => {
  if (marketId === "cancelled") {
    return {
      YES: [
        { name: "RiskTaker99", shares: "25,000", color: "bg-red-600" },
        { name: "HedgeFundBot", shares: "12,400", color: "bg-zinc-800" },
      ],
      NO: [
        { name: "SafeFlyer", shares: "45,000", color: "bg-emerald-500" },
        { name: "InsuranceDAO", shares: "32,100", color: "bg-blue-500" },
        { name: "ConservativeWhale", shares: "15,000", color: "bg-purple-500" },
      ],
    };
  }
  // Default data for other markets
  return {
    YES: [
      { name: "ScottyNooo", shares: "14,985", color: "bg-emerald-500" },
      { name: "Emperorvikky", shares: "6,854", color: "bg-blue-500" },
      { name: "TheManInTheSky", shares: "5,819", color: "bg-indigo-500" },
    ],
    NO: [
      { name: "SmallFishInWhale", shares: "17,845", color: "bg-red-500" },
      { name: "arjenw", shares: "11,634", color: "bg-cyan-500" },
      { name: "fastviking", shares: "9,112", color: "bg-purple-500" },
    ],
  };
};

const ACTIVITY = [
  {
    user: "Eia",
    action: "bought",
    amount: 10,
    side: "NO",
    price: 54.0,
    total: 5,
    time: "1m ago",
    avatar: "E",
  },
  {
    user: "bringolo",
    action: "sold",
    amount: 10,
    side: "NO",
    price: 98.8,
    total: 10,
    time: "6m ago",
    avatar: "B",
  },
  {
    user: "shkimi",
    action: "bought",
    amount: 20,
    side: "YES",
    price: 51.0,
    total: 10,
    time: "38m ago",
    avatar: "S",
  },
];

interface MarketTabsProps {
  submarkets: SubMarket[];
}

export function MarketTabs({ submarkets }: MarketTabsProps) {
  // Default to the first submarket in the list
  const [selectedMarketId, setSelectedMarketId] = useState<string>(
    submarkets[0]?.id || ""
  );

  // Get data based on selection
  const currentHolders = getHoldersForMarket(selectedMarketId);

  return (
    <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
      <Tabs defaultValue="holders" className="w-full">
        {/* Tab Header */}
        <div className="border-b border-zinc-200 bg-zinc-50 px-6 pt-4">
          <TabsList className="bg-transparent p-0 h-auto gap-6">
            <TabsTrigger
              value="activity"
              className="rounded-none border-b-2 border-transparent px-0 pb-3 data-[state=active]:border-b-black data-[state=active]:bg-transparent data-[state=active]:shadow-none text-zinc-500 data-[state=active]:text-black font-bold"
            >
              Activity
            </TabsTrigger>
            <TabsTrigger
              value="holders"
              className="rounded-none border-b-2 border-transparent px-0 pb-3 data-[state=active]:border-b-black data-[state=active]:bg-transparent data-[state=active]:shadow-none text-zinc-500 data-[state=active]:text-black font-bold"
            >
              Top Holders
            </TabsTrigger>
          </TabsList>
        </div>

        {/* --- ACTIVITY TAB --- */}
        <TabsContent value="activity" className="p-0 m-0">
          <div className="flex items-center gap-2 p-3 border-b border-zinc-100">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs bg-zinc-50 border-zinc-200 text-zinc-700"
            >
              All
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs bg-white border-zinc-200 text-zinc-500 hover:text-black"
            >
              Min Amount <Filter className="w-3 h-3 ml-1" />
            </Button>
          </div>
          <div className="divide-y divide-zinc-100">
            {ACTIVITY.map((tx, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-6 py-4 hover:bg-zinc-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="w-8 h-8 border border-zinc-100">
                    <AvatarFallback className="bg-zinc-100 text-zinc-500 text-xs font-bold">
                      {tx.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-sm">
                    <span className="font-bold text-zinc-900">{tx.user}</span>
                    <span className="text-zinc-500 mx-1">{tx.action}</span>
                    <span
                      className={cn(
                        "font-bold",
                        tx.side === "YES" ? "text-emerald-600" : "text-red-600"
                      )}
                    >
                      {tx.amount} {tx.side}
                    </span>
                    <span className="text-zinc-500 mx-1">at</span>
                    <span className="font-mono text-zinc-700">{tx.price}¢</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-zinc-400 font-medium">
                    {tx.time}
                  </span>
                  <ExternalLink className="w-3 h-3 text-zinc-300 opacity-0 group-hover:opacity-100 cursor-pointer hover:text-black" />
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* --- TOP HOLDERS TAB --- */}
        <TabsContent value="holders" className="p-0 m-0">
          {/* DROPDOWN FILTER BAR */}
          <div className="p-4 border-b border-zinc-100 bg-white flex items-center gap-3">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Filter by Market:
            </span>
            <Select
              value={selectedMarketId}
              onValueChange={setSelectedMarketId}
            >
              <SelectTrigger className="w-[280px] h-9 text-xs font-medium bg-zinc-50 border-zinc-200 focus:ring-black">
                <SelectValue placeholder="Select market" />
              </SelectTrigger>
              <SelectContent>
                {submarkets.map((market) => (
                  <SelectItem key={market.id} value={market.id}>
                    {market.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-zinc-200">
            {/* YES Holders */}
            <div className="p-6">
              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4 flex justify-between">
                <span>Yes Holders (Long)</span>
                <span>Shares</span>
              </h4>
              <div className="space-y-4">
                {currentHolders.YES.map((h, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full ${h.color} flex items-center justify-center text-white text-xs font-bold border-2 border-white shadow-sm`}
                      >
                        {h.name[0]}
                      </div>
                      <span className="text-sm font-medium text-zinc-900">
                        {h.name}
                      </span>
                    </div>
                    <span className="text-sm font-mono font-bold text-emerald-600">
                      {h.shares}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* NO Holders */}
            <div className="p-6">
              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4 flex justify-between">
                <span>No Holders (Short)</span>
                <span>Shares</span>
              </h4>
              <div className="space-y-4">
                {currentHolders.NO.map((h, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full ${h.color} flex items-center justify-center text-white text-xs font-bold border-2 border-white shadow-sm`}
                      >
                        {h.name[0]}
                      </div>
                      <span className="text-sm font-medium text-zinc-900">
                        {h.name}
                      </span>
                    </div>
                    <span className="text-sm font-mono font-bold text-red-600">
                      {h.shares}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
