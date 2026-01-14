"use client";

import { useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { skyOddsAbi, skyOddsAddress } from "./generated";

export function useMarketVolume(flightId: string) {
  const { data: volume, isLoading } = useReadContract({
    address: skyOddsAddress,
    abi: skyOddsAbi,
    functionName: "totalPoolAmount",
    args: [flightId as `0x${string}`],
    query: {
      enabled: !!flightId,
      refetchInterval: 10_000, // Refresh every 10s
    },
  });

  // Format: 1000000 -> "1.00"
  // We divide by 10^6 because USDC has 6 decimals
  const formattedVolume = volume
    ? parseFloat(formatUnits(volume as bigint, 6)).toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
      })
    : "$0.00";

  return { volume: formattedVolume, isLoading };
}
