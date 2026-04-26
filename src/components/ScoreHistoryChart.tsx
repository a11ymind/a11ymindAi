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
  ReferenceArea,
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
  const activeSeries = series.filter((item) =>
    data.some((point) => typeof point[item.key] === "number"),
  );

  if (data.length === 0) {
    return (
      <div className="flex min-h-80 items-center justify-center rounded-2xl border border-dashed border-border bg-bg/45 px-6 text-center text-sm text-text-subtle">
        Run two scans on a monitored page to unlock score history and regression trend lines.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="h-80 w-full rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(10,13,18,0.92),rgba(10,13,18,0.62))] p-3">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 14, right: 16, left: -8, bottom: 8 }}>
            <ReferenceArea y1={90} y2={100} fill="#22c55e" fillOpacity={0.05} />
            <ReferenceArea y1={70} y2={90} fill="#f59e0b" fillOpacity={0.045} />
            <ReferenceArea y1={0} y2={70} fill="#ef4444" fillOpacity={0.035} />
            <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="4 8" vertical={false} />
            <XAxis
              dataKey="label"
              stroke="#737373"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              minTickGap={22}
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 50, 70, 90, 100]}
              stroke="#737373"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={34}
            />
            <Tooltip
              cursor={{ stroke: "rgba(6,182,212,0.35)", strokeWidth: 1 }}
              contentStyle={{
                background: "rgba(10,13,18,0.96)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 14,
                boxShadow: "0 18px 50px -28px rgba(0,0,0,0.9)",
                fontSize: 12,
              }}
              labelStyle={{ color: "#fafafa", fontWeight: 600, marginBottom: 6 }}
              formatter={(value, name) => [`${value}/100`, name]}
            />
            {activeSeries.length > 1 && (
              <Legend
                wrapperStyle={{ fontSize: 11, color: "#a3a3a3", paddingTop: 8 }}
                iconType="plainline"
              />
            )}
            {activeSeries.map((s) => (
              <Line
                key={s.key}
                type="linear"
                dataKey={s.key}
                name={s.label}
                stroke={s.color}
                strokeWidth={2.5}
                dot={{ r: 3.5, fill: s.color, stroke: "#0a0d12", strokeWidth: 1.5 }}
                activeDot={{ r: 6, stroke: "#ffffff", strokeWidth: 1.5 }}
                connectNulls
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-2">
        {activeSeries.slice(0, 8).map((item) => {
          const latest = latestScoreFor(data, item.key);
          return (
            <span
              key={item.key}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-text-muted"
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="max-w-[10rem] truncate">{item.label}</span>
              <span className="font-mono text-text">{latest === null ? "—" : latest}</span>
            </span>
          );
        })}
        {activeSeries.length > 8 && (
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-text-subtle">
            +{activeSeries.length - 8} more
          </span>
        )}
      </div>
    </div>
  );
}

function latestScoreFor(data: ChartPoint[], key: string): number | null {
  for (let index = data.length - 1; index >= 0; index -= 1) {
    const value = data[index]?.[key];
    if (typeof value === "number") return value;
  }
  return null;
}
