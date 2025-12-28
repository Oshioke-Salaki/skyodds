"use client";

import React, { useState } from "react";
import { Search, Filter, ArrowUpDown, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { FlightMarketCard } from "@/components/markets/flight-market-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// --- MOCK DATA ---
const MOCK_FLIGHTS = [
  {
    id: "UA920",
    airline: "UA",
    flightNumber: "UA 920",
    origin: "LHR",
    destination: "IAD",
    departureTime: "12:45 PM",
    marketProbability: 45,
    aiProbability: 82, // Big Edge
    volume: "$142,050",
    status: "Delayed" as const,
  },
  {
    id: "BA117",
    airline: "BA",
    flightNumber: "BA 117",
    origin: "JFK",
    destination: "LHR",
    departureTime: "06:30 PM",
    marketProbability: 10,
    aiProbability: 12,
    volume: "$54,200",
    status: "Scheduled" as const,
  },
  {
    id: "AF006",
    airline: "AF",
    flightNumber: "AF 006",
    origin: "CDG",
    destination: "JFK",
    departureTime: "02:15 PM",
    marketProbability: 30,
    aiProbability: 55,
    volume: "$89,100",
    status: "Boarding" as const,
  },
  {
    id: "EK203",
    airline: "EK",
    flightNumber: "EK 203",
    origin: "DXB",
    destination: "JFK",
    departureTime: "08:00 AM",
    marketProbability: 5,
    aiProbability: 4,
    volume: "$210,500",
    status: "En Route" as const,
  },
  {
    id: "LH400",
    airline: "LH",
    flightNumber: "LH 400",
    origin: "FRA",
    destination: "JFK",
    departureTime: "10:50 AM",
    marketProbability: 60,
    aiProbability: 75,
    volume: "$32,000",
    status: "Delayed" as const,
  },
];

export default function MarketsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFlights = MOCK_FLIGHTS.filter(
    (flight) =>
      flight.flightNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flight.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flight.destination.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* --- PAGE HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">
            Global Aviation Markets
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <p className="text-zinc-500 text-sm font-medium">
              <span className="text-zinc-900 font-mono font-bold mr-1">
                {MOCK_FLIGHTS.length}
              </span>
              active markets trading live.
            </p>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="Search by Flight, Origin, or Dest..."
              className="pl-9 bg-white border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus-visible:ring-black focus-visible:ring-offset-0 rounded-md shadow-sm h-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Sort Select */}
          <Select defaultValue="vol-desc">
            <SelectTrigger className="w-[160px] bg-white border-zinc-200 text-zinc-700 font-medium h-10 shadow-sm focus:ring-black">
              <ArrowUpDown className="w-3.5 h-3.5 mr-2 text-zinc-400" />
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent className="bg-white border-zinc-200 text-zinc-700 font-medium">
              <SelectItem value="vol-desc">Volume (High)</SelectItem>
              <SelectItem value="edge-desc">AI Edge (High)</SelectItem>
              <SelectItem value="time-asc">Time (Soonest)</SelectItem>
            </SelectContent>
          </Select>

          {/* Refresh/Filter Buttons */}
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 border-zinc-200 text-zinc-500 hover:text-black hover:border-zinc-300 bg-white shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* --- MARKETS GRID --- */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        {filteredFlights.map((flight) => (
          <FlightMarketCard key={flight.id} {...flight} />
        ))}

        {/* Empty State */}
        {filteredFlights.length === 0 && (
          <div className="col-span-full py-24 text-center border-2 border-dashed border-zinc-200 rounded-xl bg-zinc-50/50">
            <div className="mx-auto w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center mb-4 text-zinc-400">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900">
              No markets found
            </h3>
            <p className="text-zinc-500 mt-1">
              Try adjusting your search query.
            </p>
            <Button
              variant="link"
              className="mt-2 text-black font-semibold"
              onClick={() => setSearchQuery("")}
            >
              Clear filters
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
