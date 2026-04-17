"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";

export type ChartPoint = {
  ts: number;
  label: string;
  [siteKey: string]: number | string;
};

export type ChartSeries = {
  key: string;
  label: string;
  color: string;
};

export function ScoreHistoryChart({
  data,
  series,
}: {
  data: ChartPoint[];
  series: ChartSeries[];
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-text-subtle">
        Run a scan to start tracking scores over time.
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
          <CartesianGrid stroke="#262626" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            stroke="#737373"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: "#262626" }}
          />
          <YAxis
            domain={[0, 100]}
            stroke="#737373"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: "#262626" }}
            width={32}
          />
          <Tooltip
            contentStyle={{
              background: "#161616",
              border: "1px solid #262626",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: "#a3a3a3" }}
          />
          {series.length > 1 && (
            <Legend
              wrapperStyle={{ fontSize: 11, color: "#a3a3a3" }}
              iconType="plainline"
            />
          )}
          {series.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={2}
              dot={{ r: 3, fill: s.color, stroke: s.color }}
              activeDot={{ r: 5 }}
              connectNulls
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
