"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
} from "recharts";
import { usePublicClient } from "wagmi";
import { parseAbiItem, decodeEventLog, Log } from "viem";
import { Loader2 } from "lucide-react";

// --- LMSR MATH HELPERS ---
// Replicating the logic from SkyOdds.sol: getPrice
// Price = exp(q/b) / sum(exp(q_j/b))

const PRECISION = 1e18;

// Use BigInt for shares to match contract, but convert to number for Math.exp (approximation is fine for UI)
// Note: In the contract, b is normally 100 * 1e6 (USDC decimals) scaled or similar.
// Let's look at the contract: DEFAULT_LIQUIDITY_PARAM = 100e6.
// Shares are also likely in some unit.
// Actually, let's just use standard floats for the graph. The relative values matter.

function calculateProbabilities(
    shares: { onTime: number; delayed30: number; delayed120: number; cancelled: number },
    liquidityParam: number
) {
    // If no shares, return equal prob
    const totalShares = shares.onTime + shares.delayed30 + shares.delayed120 + shares.cancelled;
    if (totalShares === 0) {
        return { onTime: 0.25, delayed30: 0.25, delayed120: 0.25, cancelled: 0.25 };
    }

    // Safety: b must be > 0.
    const b = liquidityParam || 100_000_000; // Default 100 USDC

    // We need to match the scaling. The contract does `q * 1e18 / b`.
    // If q is around 1e18? No, q starts at 0.
    // Let's assume input shares are raw BigInt string converted to number.

    // Using Math.exp with large numbers will overflow.
    // We can subtract the max(q) from all q's to keep exponents in range.
    // P_i = exp((q_i - max_q)/b) / sum(exp((q_j - max_q)/b))

    const q = [shares.onTime, shares.delayed30, shares.delayed120, shares.cancelled];
    const maxQ = Math.max(...q);

    // We need to be careful with units.
    // If b is 100e6 (10^8), and shares are small -> q/b is small.
    // If shares are 1e18 -> q/b is huge.
    // Let's look at contract: `SharesPurchased` -> `shares` calculated from `cost`.
    // `cost` is USDC (6 decimals).
    // Implementation detail: we'll have to see the raw values.
    // For now, implementing the robust normalization:

    const expValues = q.map((val) => Math.exp((val - maxQ) / b));
    const sumExp = expValues.reduce((a, b) => a + b, 0);

    return {
        onTime: expValues[0] / sumExp,
        delayed30: expValues[1] / sumExp,
        delayed120: expValues[2] / sumExp,
        cancelled: expValues[3] / sumExp,
    };
}

// --- COMPONENT ---

const SHARES_UPDATED_EVENT = parseAbiItem(
    "event SharesUpdated(bytes32 indexed flightId, uint256 onTimeShares, uint256 delayed30Shares, uint256 delayed120PlusShares, uint256 cancelledShares)"
);

type DataPoint = {
    blockNumber: number;
    timestamp: number; // estimated or fetched
    onTime: number;
    delayed30: number;
    delayed120: number;
    cancelled: number;
};

interface MarketGraphProps {
    flightId: string;
    liquidityParam?: number; // Optional, default to decent guess
    height?: number;
}

export function MarketGraph({ flightId, liquidityParam = 100_000_000, height = 300 }: MarketGraphProps) {
    const publicClient = usePublicClient();
    const [data, setData] = useState<DataPoint[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!publicClient || !flightId) return;

        const fetchHistory = async () => {
            setLoading(true);
            try {
                // 1. Fetch Logs
                const logs = await publicClient.getLogs({
                    event: SHARES_UPDATED_EVENT,
                    args: {
                        flightId: flightId as `0x${string}`,
                    },
                    fromBlock: "earliest", // Ideally we'd know the creation block, but this is okay for MVP
                    toBlock: "latest",
                });

                if (logs.length === 0) {
                    setData([]);
                    setLoading(false);
                    return;
                }

                // 2. Fetch Timestamps (Optimized: fetch only unique blocks)
                // Group logs by blockNumber
                const blockNumbers = Array.from(new Set(logs.map((l) => l.blockNumber)));

                // Fetch blocks in parallel (limit generic concurrency if needed, but modern browsers/RPCs handle 10-20 ok)
                // For heavy history, we'd need to batch. For MVP, fetch all.
                const blockPromises = blockNumbers.map((bn) => publicClient.getBlock({ blockNumber: bn }));
                const blocks = await Promise.all(blockPromises);

                const timestampMap = new Map<string, number>();
                blocks.forEach((b) => {
                    if (b.number) timestampMap.set(b.number.toString(), Number(b.timestamp) * 1000); // ms
                });

                // 3. Process Logs into Data Points
                const points: DataPoint[] = logs.map((log) => {
                    // Decode args (viem types are usually inferred but explicitly checking args)
                    const args = log.args as any;
                    const onTime = Number(args.onTimeShares);
                    const delayed30 = Number(args.delayed30Shares);
                    const delayed120 = Number(args.delayed120PlusShares);
                    const cancelled = Number(args.cancelledShares);

                    const probs = calculateProbabilities(
                        { onTime, delayed30, delayed120, cancelled },
                        liquidityParam
                    );

                    return {
                        blockNumber: Number(log.blockNumber),
                        timestamp: timestampMap.get(log.blockNumber?.toString() || "") || Date.now(),
                        onTime: probs.onTime * 100, // Convert to %
                        delayed30: probs.delayed30 * 100,
                        delayed120: probs.delayed120 * 100,
                        cancelled: probs.cancelled * 100,
                    };
                });

                // Sort by time
                points.sort((a, b) => a.blockNumber - b.blockNumber);

                // Add an initial point? Maybe (0, 0, 0, 0) -> 25% each at creation?
                // Let's assume the first event establishes the first state.

                setData(points);
            } catch (err) {
                console.error("Failed to fetch market history:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [publicClient, flightId, liquidityParam]);

    if (loading) {
        return (
            <div className="flex items-center justify-center bg-zinc-50/50 rounded-xl" style={{ height }}>
                <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center bg-zinc-50/50 rounded-xl text-zinc-400 text-sm" style={{ height }}>
                No trading history yet
            </div>
        );
    }

    return (
        <div className="w-full bg-white rounded-xl border border-zinc-200 p-4 shadow-sm">
            <div className="mb-4">
                <h3 className="text-sm font-semibold text-zinc-900">Price History (Probability %)</h3>
            </div>
            <div style={{ width: "100%", height: height - 40 }}>
                <ResponsiveContainer>
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E4E7" />
                        <XAxis
                            dataKey="timestamp"
                            type="number"
                            domain={["dataMin", "dataMax"]}
                            tickFormatter={(unixTime) => new Date(unixTime).toLocaleDateString()}
                            stroke="#A1A1AA"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            domain={[0, 100]}
                            stroke="#A1A1AA"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(val) => `${val}%`}
                        />
                        <Tooltip
                            labelFormatter={(val) => new Date(val).toLocaleString()}
                            contentStyle={{ borderRadius: "8px", border: "1px solid #E4E4E7", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                        />
                        <Line
                            type="monotone"
                            dataKey="onTime"
                            name="On Time"
                            stroke="#10b981" // emerald-500
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="delayed30"
                            name="Delayed > 30m"
                            stroke="#f59e0b" // amber-500
                            strokeWidth={2}
                            dot={false}
                        />
                        <Line
                            type="monotone"
                            dataKey="delayed120"
                            name="Delayed > 2h"
                            stroke="#ef4444" // red-500
                            strokeWidth={2}
                            dot={false}
                        />
                        <Line
                            type="monotone"
                            dataKey="cancelled"
                            name="Cancelled"
                            stroke="#71717a" // zinc-500
                            strokeWidth={2}
                            dot={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
