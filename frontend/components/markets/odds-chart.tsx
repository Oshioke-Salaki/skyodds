"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const data = [
  { time: "10:00", prob: 30 },
  { time: "11:00", prob: 35 },
  { time: "12:00", prob: 32 },
  { time: "13:00", prob: 45 },
  { time: "14:00", prob: 55 },
  { time: "15:00", prob: 62 },
  { time: "16:00", prob: 82 },
];

export function OddsChart() {
  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorProb" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#dc2626" stopOpacity={0.1} />
              <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e4e4e7"
            vertical={false}
          />
          <XAxis
            dataKey="time"
            stroke="#a1a1aa"
            tick={{ fontSize: 11, fontFamily: "monospace" }}
            tickLine={false}
            axisLine={false}
            dy={10}
          />
          <YAxis
            stroke="#a1a1aa"
            tick={{ fontSize: 11, fontFamily: "monospace" }}
            tickFormatter={(value) => `${value}%`}
            tickLine={false}
            axisLine={false}
            dx={-10}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              borderColor: "#e4e4e7",
              color: "#000",
              borderRadius: "8px",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            }}
            itemStyle={{ color: "#dc2626", fontWeight: "bold" }}
            formatter={(value) => [`${value}%`, "Probability"]}
            labelStyle={{
              color: "#71717a",
              fontSize: "12px",
              marginBottom: "4px",
            }}
          />
          <Area
            type="monotone"
            dataKey="prob"
            stroke="#dc2626"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorProb)"
            activeDot={{ r: 4, strokeWidth: 0, fill: "#dc2626" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
