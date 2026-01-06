import { useState } from 'react';
import { keccak256, encodeAbiParameters, parseAbiParameters } from 'viem';

export function generateFlightId(
    flightNumber: string,
    departureCode: string,
    destinationCode: string,
    scheduledDeparture: number
): `0x${string}` {
    return keccak256(
        encodeAbiParameters(
            parseAbiParameters('string, string, string, uint256'),
            [flightNumber, departureCode, destinationCode, BigInt(scheduledDeparture)]
        )
    );
}

export interface FlightData {
    flightNumber: string;
    departureCode: string;
    destinationCode: string;
    airlineCode: string;
    scheduledDeparture: number; // timestamp in seconds
    status: string;
}

export function useFlightFetch() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchFlight = async (flightNumber: string) => {
        setIsLoading(true);
        setError(null);
        try {
            // In a real app, this would be an API call to our own backend or directly to AviationStack
            // For this demo, we'll simulate the AviationStack response structure
            // URL: http://api.aviationstack.com/v1/flights?access_key=YOUR_KEY&flight_iata=XX123

            const apiKey = process.env.NEXT_PUBLIC_AVIATION_STACK_KEY;
            if (!apiKey) {
                throw new Error("AviationStack API Key missing in environment");
            }

            const response = await fetch(
                `http://api.aviationstack.com/v1/flights?access_key=${apiKey}&flight_iata=${flightNumber}`
            );

            const data = await response.json();

            if (!data.data || data.data.length === 0) {
                throw new Error("Flight not found");
            }

            const flight = data.data[0];

            const flightData: FlightData = {
                flightNumber: flight.flight.iata || flight.flight.number,
                departureCode: flight.departure.iata,
                destinationCode: flight.arrival.iata,
                airlineCode: flight.airline.iata,
                scheduledDeparture: Math.floor(new Date(flight.departure.scheduled).getTime() / 1000),
                status: flight.flight_status,
            };

            return flightData;
        } catch (err: any) {
            setError(err.message || "Failed to fetch flight");
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    const fetchUpcoming = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const apiKey = process.env.NEXT_PUBLIC_AVIATION_STACK_KEY;
            if (!apiKey) {
                throw new Error("AviationStack API Key missing in environment");
            }

            const response = await fetch(
                `http://api.aviationstack.com/v1/flights?access_key=${apiKey}&flight_status=scheduled`
            );

            const data = await response.json();
            return data.data || [];
        } catch (err: any) {
            setError(err.message || "Failed to fetch upcoming flights");
            return [];
        } finally {
            setIsLoading(false);
        }
    };

    return { fetchFlight, fetchUpcoming, isLoading, error };
}
