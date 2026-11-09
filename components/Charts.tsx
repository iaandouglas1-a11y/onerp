"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// ======================
// CONFIG
// ======================
const colors = ["#5DA832", "#8FCB5E", "#94A3B8", "#4A8828", "#B8E08F", "#64748B", "#F5A524", "#F87171", "#CBD5E1", "#3F6B26"];
const chartGridColor = "#2A2A2A";
const chartTextColor = "#94a3b8";

// ======================
// FORMATADOR
// ======================
const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

// ======================
// HOOK MOBILE
// ======================
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return isMobile;
}

// ======================
// TOOLTIP
// ======================
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface-2/95 border border-surface-border/60 rounded-xl p-3 shadow-xl">
        {label && <p className="text-xs text-slate-400 mb-1">{label}</p>}

        {payload.map((entry: any, i: number) => (
          <p key={i} style={{ color: entry.color }} className="text-sm font-medium">
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ======================
// CATEGORY PIE (CORRIGIDO)
// ======================
export function CategoryPie({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  const isMobile = useIsMobile();

  const sorted = [...data].sort((a, b) => b.value - a.value);
  const total = sorted.reduce((acc, item) => acc + item.value, 0);

  // MOBILE
  if (isMobile) {
    return (
      <div className="w-full flex flex-col gap-6">
        {/* CHART */}
        <div className="w-full h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={sorted}
                dataKey="value"
                nameKey="name"
                outerRadius={85}
                innerRadius={50}
                stroke="none"
              >
                {sorted.map((_, i) => (
                  <Cell key={i} fill={colors[i % colors.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* LEGENDA */}
        <div className="w-full flex flex-col gap-3">
          {sorted.map((item, index) => {
            const percent = total ? (item.value / total) * 100 : 0;

            return (
              <div key={index} className="flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: colors[index % colors.length] }}
                  />
                  <span className="text-slate-300 truncate" title={item.name}>{item.name}</span>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-white font-medium">
                    {formatCurrency(item.value)}
                  </div>
                  <div className="text-xs text-slate-400">
                    {percent.toFixed(1)}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // DESKTOP
  return (
    <div className="w-full min-w-0 flex flex-row items-center gap-4">
      {/* CHART */}
      <div className="w-[40%] min-w-0 h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={sorted}
              dataKey="value"
              nameKey="name"
                outerRadius="72%"
                innerRadius="42%"
              stroke="none"
            >
              {sorted.map((_, i) => (
                <Cell key={i} fill={colors[i % colors.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* LEGENDA */}
      <div className="w-[60%] min-w-0 flex flex-col gap-2">
        {sorted.map((item, index) => {
          const percent = total ? (item.value / total) * 100 : 0;

          return (
            <div key={index} className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: colors[index % colors.length] }}
                />
                <span className="text-slate-300 truncate" title={item.name}>{item.name}</span>
              </div>

              <div className="text-right shrink-0">
                <div className="text-white font-medium">
                  {formatCurrency(item.value)}
                </div>
                <div className="text-xs text-slate-400">
                  {percent.toFixed(1)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ======================
// LINE CHART
// ======================
export function EvolutionChart({ data }: any) {
  const isMobile = useIsMobile();

  return (
    <ResponsiveContainer width="100%" height={isMobile ? 280 : 320}>
      <LineChart data={data} margin={{ top: 8, right: 18, bottom: 8, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} opacity={0.5} />

        <XAxis
          dataKey="mes"
          interval="preserveStartEnd"
          tick={{ fill: chartTextColor, fontSize: isMobile ? 12 : 12 }}
          stroke={chartGridColor}
        />

        <YAxis
          tickFormatter={formatCurrency}
          tick={{ fill: chartTextColor, fontSize: isMobile ? 12 : 12 }}
          stroke={chartGridColor}
        />

        <Tooltip content={<CustomTooltip />} />

        <Legend wrapperStyle={{ color: chartTextColor }} />

        <Line type="monotone" dataKey="receitas" stroke="#5DA832" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="despesas" stroke="#F87171" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ======================
// LINE CHART — EVOLUÇÃO DE INVESTIMENTOS
// ======================
export function InvestimentoEvolutionChart({ data }: { data: { mes: string; saldo: number }[] }) {
  const isMobile = useIsMobile();

  return (
    <ResponsiveContainer width="100%" height={isMobile ? 260 : 300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} opacity={0.5} />

        <XAxis
          dataKey="mes"
          tick={{ fill: chartTextColor, fontSize: isMobile ? 11 : 13 }}
          stroke={chartGridColor}
        />

        <YAxis
          tickFormatter={formatCurrency}
          tick={{ fill: chartTextColor, fontSize: isMobile ? 11 : 13 }}
          stroke={chartGridColor}
          width={isMobile ? 60 : 80}
        />

        <Tooltip content={<CustomTooltip />} />

        <Line
          type="monotone"
          dataKey="saldo"
          name="Patrimônio"
          stroke="#5DA832"
          strokeWidth={2}
          dot={{ fill: "#5DA832", r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ======================
// BAR CHART
// ======================
export function DreChart({ data }: any) {
  const isMobile = useIsMobile();

  return (
    <ResponsiveContainer width="100%" height={isMobile ? 280 : 320}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} opacity={0.5} />

        <XAxis
          dataKey="mes"
          tick={{ fill: chartTextColor, fontSize: isMobile ? 12 : 14 }}
          stroke={chartGridColor}
        />

        <YAxis
          tickFormatter={formatCurrency}
          tick={{ fill: chartTextColor, fontSize: isMobile ? 12 : 14 }}
          stroke={chartGridColor}
        />

        <Tooltip content={<CustomTooltip />} />

        <Legend wrapperStyle={{ color: chartTextColor }} />

        <Bar dataKey="receitas" fill="#5DA832" radius={[6, 6, 0, 0]} />
        <Bar dataKey="despesas" fill="#F87171" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ======================
// WATERFALL — FLUXO DE CAIXA
// ======================
export function WaterfallChart({
  saldoInicial,
  entradas,
  saidas,
}: {
  saldoInicial: number;
  entradas: number;
  saidas: number;
}) {
  const saldoFinal = saldoInicial + entradas - saidas;

  const labels  = ["Saldo Inicial", "Entradas", "Saídas", "Saldo Final"];
  const offsets = [0, saldoInicial, saldoInicial + entradas - saidas, 0];
  const bars    = [saldoInicial, entradas, saidas, saldoFinal];
  // amarelo para saldo inicial/final, verde para entradas, vermelho para saídas
  const barColors = ["#94A3B8", "#5DA832", "#F87171", "#94A3B8"];

  const data = labels.map((label, i) => ({
    label,
    offset: offsets[i],
    bar: bars[i],
    color: barColors[i],
  }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} barCategoryGap="30%" margin={{ top: 8, right: 18, bottom: 12, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} opacity={0.5} vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: chartTextColor, fontSize: 12 }}
          stroke={chartGridColor}
        />
        <YAxis
          tickFormatter={formatCurrency}
          tick={{ fill: chartTextColor, fontSize: 12 }}
          stroke={chartGridColor}
          width={90}
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              const bar = payload.find((p: any) => p.dataKey === "bar");
              if (!bar) return null;
              return (
                <div className="bg-surface-2/95 border border-surface-border/60 rounded-xl p-3 shadow-xl">
                  <p className="text-xs text-slate-400 mb-1">{label}</p>
                  <p className="text-sm font-medium" style={{ color: bar.payload.color }}>
                    {formatCurrency(bar.value as number)}
                  </p>
                </div>
              );
            }
            return null;
          }}
        />
        {/* Barra invisível de offset */}
        <Bar dataKey="offset" stackId="wf" fill="transparent" />
        {/* Barra real com cor dinâmica */}
        <Bar dataKey="bar" stackId="wf" radius={[6, 6, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
          <LabelList
            dataKey="bar"
            content={(props: any) => {
              const { x, y, width, height, value } = props;
              if (value === undefined || value === null) return null;
              const isNeg = height < 0;
              const labelY = isNeg ? y + height - 8 : y + Math.abs(height) - 8;
              return (
                <text
                  x={x + width / 2}
                  y={labelY}
                  fill="#ffffff"
                  fontSize={11}
                  fontWeight={600}
                  textAnchor="middle"
                  dominantBaseline="auto"
                >
                  {data[props.index]?.label === "Saldo Inicial" || data[props.index]?.label === "Saldo Final"
                    ? formatCurrency(Number(value))
                    : formatCurrency(Math.abs(Number(value)))}
                </text>
              );
            }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
