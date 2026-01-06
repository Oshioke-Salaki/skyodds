"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Search, Plane, Calendar, MapPin, Loader2, Plus, ChevronDown, AlertCircle, ExternalLink } from "lucide-react";
import { useFlightFetch, FlightData, generateFlightId } from "@/hooks/useFlightFetch";
import { useWriteSkyOddsCreateFlightMarket, useReadSkyOddsAdminRole, useReadSkyOddsHasRole } from "@/hooks/generated";
import { useAllMarkets } from "@/hooks/useMarketData";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAccount, useBalance } from "wagmi";
import { formatUnits } from "viem";

export function CreateMarketForm() {
    const [upcomingFlights, setUpcomingFlights] = useState<FlightData[]>([]);
    const [selectedFlight, setSelectedFlight] = useState<FlightData | null>(null);
    const [liquidity, setLiquidity] = useState("100");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const { address } = useAccount();
    const { data: mntBalance } = useBalance({ address });
    const { data: adminRole } = useReadSkyOddsAdminRole();
    const { data: hasAdminRole, isLoading: isRoleLoading } = useReadSkyOddsHasRole({
        args: [adminRole!, address!],
        query: { enabled: !!adminRole && !!address }
    });

    const { markets, isLoading: isMarketsLoading } = useAllMarkets();
    const { fetchUpcoming, isLoading: isFetching, error } = useFlightFetch();
    const { writeContractAsync, isPending: isCreating } = useWriteSkyOddsCreateFlightMarket();

    // Load upcoming flights and filter out those that already have markets
    useEffect(() => {
        const loadFlights = async () => {
            console.log("Loading upcoming flights for dropdown...");
            const rawFlights = await fetchUpcoming();
            if (!rawFlights) return;

            const transformed: FlightData[] = rawFlights.map((f: any) => ({
                flightNumber: f.flight.iata || f.flight.number,
                departureCode: f.departure.iata,
                destinationCode: f.arrival.iata,
                airlineCode: f.airline.iata,
                scheduledDeparture: Math.floor(new Date(f.departure.scheduled).getTime() / 1000),
                status: f.flight_status,
            }));

            // Filter out flights that already have markets
            const filtered = transformed.filter(f => {
                const id = generateFlightId(f.flightNumber, f.departureCode, f.destinationCode, f.scheduledDeparture);
                return !markets.some(m => m.id.toLowerCase() === id.toLowerCase());
            });

            setUpcomingFlights(filtered);
            console.log("Filtered Upcoming Flights:", filtered);
        };

        if (!isMarketsLoading) {
            loadFlights();
        }
    }, [isMarketsLoading, markets.length]);

    const handleCreate = async () => {
        if (!selectedFlight) return;

        try {
            await writeContractAsync({
                args: [
                    selectedFlight.flightNumber,
                    selectedFlight.departureCode,
                    selectedFlight.destinationCode,
                    selectedFlight.airlineCode,
                    BigInt(selectedFlight.scheduledDeparture),
                    BigInt(liquidity) * (10n ** 18n), // Scale liquidity
                ],
            });
            toast.success("Market creation transaction submitted!");
            setSelectedFlight(null);
            // Remove from list after creation
            setUpcomingFlights(prev => prev.filter(f => f !== selectedFlight));
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || "Failed to create market");
        }
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <Card className="border-zinc-200">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold flex items-center gap-2 text-zinc-900">
                        <Plane className="w-6 h-6" /> Create New Market
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* PERMISSION & GAS CHECKS */}
                    {!isRoleLoading && !hasAdminRole && address && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex gap-3 text-red-700">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <div className="text-sm">
                                <p className="font-bold">Missing Permissions</p>
                                <p className="opacity-90">Only authorized admins can initialize new markets. Your wallet (`{address.slice(0, 6)}...{address.slice(-4)}`) does not have the `ADMIN_ROLE`.</p>
                            </div>
                        </div>
                    )}

                    {mntBalance && parseFloat(formatUnits(mntBalance.value, mntBalance.decimals)) < 0.01 && (
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3 text-amber-700">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <div className="text-sm">
                                <p className="font-bold">Low MNT Balance</p>
                                <p className="opacity-90 mb-2">You need Mantle Sepolia (MNT) tokens to pay for gas when creating markets.</p>
                                <a
                                    href="https://faucet.mantle.xyz/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 font-bold underline hover:opacity-80"
                                >
                                    Get MNT from Faucet <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>
                        </div>
                    )}

                    {/* FLIGHT SELECTION DROPDOWN */}
                    <div className="relative">
                        <label className="text-sm font-semibold text-zinc-700 block mb-2">
                            Select Upcoming Flight
                        </label>
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            disabled={isFetching || upcomingFlights.length === 0}
                            className={cn(
                                "w-full flex items-center justify-between p-4 bg-white border border-zinc-200 rounded-xl transition-all hover:border-zinc-400 text-left",
                                upcomingFlights.length === 0 && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                {isFetching ? (
                                    <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
                                ) : (
                                    <Plane className="w-5 h-5 text-zinc-400" />
                                )}
                                <span className={cn("font-medium", !selectedFlight ? "text-zinc-400" : "text-zinc-900")}>
                                    {isFetching
                                        ? "Fetching flights..."
                                        : selectedFlight
                                            ? `${selectedFlight.flightNumber} (${selectedFlight.departureCode} → ${selectedFlight.destinationCode})`
                                            : upcomingFlights.length === 0
                                                ? "No new flights available"
                                                : "Choose a flight..."
                                    }
                                </span>
                            </div>
                            <ChevronDown className={cn("w-5 h-5 text-zinc-400 transition-transform", isDropdownOpen && "rotate-180")} />
                        </button>

                        {isDropdownOpen && upcomingFlights.length > 0 && (
                            <div className="absolute z-50 w-full mt-2 bg-white border border-zinc-200 rounded-xl shadow-xl max-h-[300px] overflow-y-auto overflow-x-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                {upcomingFlights.map((flight, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            setSelectedFlight(flight);
                                            setIsDropdownOpen(false);
                                        }}
                                        className="w-full flex items-center justify-between p-4 hover:bg-zinc-50 transition-colors border-b border-zinc-100 last:border-0"
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-bold text-zinc-900">{flight.flightNumber}</span>
                                            <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">
                                                {flight.departureCode} → {flight.destinationCode}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs font-mono font-bold text-zinc-400">
                                                {new Date(flight.scheduledDeparture * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

                    {/* SELECTED FLIGHT DETAILS */}
                    {selectedFlight && (
                        <div className="p-6 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-2xl font-black text-zinc-900 tracking-tighter">{selectedFlight.flightNumber}</h3>
                                    <p className="text-zinc-500 text-sm font-semibold uppercase tracking-widest">{selectedFlight.airlineCode} Airways</p>
                                </div>
                                <Badge variant="outline" className="bg-white text-zinc-600 border-zinc-200 py-1 px-3">
                                    {selectedFlight.status}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Route</span>
                                    <div className="flex items-center gap-2 text-zinc-900 font-bold">
                                        <MapPin className="w-4 h-4 text-zinc-300" />
                                        {selectedFlight.departureCode} → {selectedFlight.destinationCode}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Scheduled</span>
                                    <div className="flex items-center gap-2 text-zinc-900 font-bold">
                                        <Calendar className="w-4 h-4 text-zinc-300" />
                                        {new Date(selectedFlight.scheduledDeparture * 1000).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 pt-4 border-t border-zinc-200">
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-tighter">Market Liquidity (b)</label>
                                    <span className="text-[10px] font-bold text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded italic">Higher b = Stable Price</span>
                                </div>
                                <Input
                                    type="number"
                                    value={liquidity}
                                    onChange={(e) => setLiquidity(e.target.value)}
                                    placeholder="100"
                                    className="max-w-[140px] font-mono h-12 bg-white"
                                />
                            </div>
                        </div>
                    )}
                </CardContent>
                {selectedFlight && (
                    <CardFooter className="pt-2">
                        <Button
                            className="w-full bg-zinc-900 text-white hover:bg-black h-14 shadow-xl active:scale-[0.98] transition-all font-bold text-lg rounded-xl flex items-center justify-center gap-2"
                            onClick={handleCreate}
                            disabled={isCreating || !hasAdminRole}
                        >
                            {isCreating ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Plus className="w-5 h-5" />
                            )}
                            {hasAdminRole ? "Initialize SkyOdds Market" : "Admin ONLY"}
                        </Button>
                    </CardFooter>
                )}
            </Card>
        </div>
    );
}
