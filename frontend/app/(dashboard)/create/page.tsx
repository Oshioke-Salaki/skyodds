"use client";

import { useEffect } from "react";
import { CreateMarketForm } from "@/components/markets/create-market-form";
import { useFlightFetch } from "@/hooks/useFlightFetch";

export default function CreateMarketPage() {
    const { fetchUpcoming } = useFlightFetch();

    useEffect(() => {
        const fetchAndLog = async () => {
            console.log("Fetching upcoming flights...");
            const flights = await fetchUpcoming();
            console.log("Upcoming Flights:", flights);
        };
        fetchAndLog();
    }, []);

    return (
        <div className="container py-10 space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                <p className="text-zinc-500">
                    Source real-time flight data from AviationStack to initialize high-fidelity prediction markets.
                </p>
            </div>

            <div className="grid gap-8">
                <CreateMarketForm />
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-white relative overflow-hidden group">
                <div className="relative z-10">
                    <h3 className="text-xl font-bold mb-2">Automated Data Integrity</h3>
                    <p className="text-zinc-400 max-w-lg mb-6 text-sm">
                        SkyOdds uses verified flight data for market settlement. Every market created here is backed by real-time aviation telemetry, ensuring fair outcomes for all traders.
                    </p>
                    <div className="flex gap-4">
                        <div className="flex flex-col">
                            <span className="text-2xl font-mono font-bold">10,000+</span>
                            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">Airports Tracked</span>
                        </div>
                        <div className="w-px h-10 bg-zinc-800" />
                        <div className="flex flex-col">
                            <span className="text-2xl font-mono font-bold">30s</span>
                            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">Update Latency</span>
                        </div>
                    </div>
                </div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-zinc-100/10 blur-[100px] -mr-48 -mt-48 rounded-full pointer-events-none group-hover:bg-zinc-100/20 transition-all duration-700" />
            </div>
        </div>
    );
}
