/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react";
import { YearlySummary, CurrencyConfig } from "../types";
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Cell 
} from "recharts";
import { 
  BarChart3, Sparkles, Building2, TrendingUp, DollarSign, Wallet2
} from "lucide-react";

interface YearlyTabProps {
  yearlySummaries: YearlySummary[];
  currency: CurrencyConfig;
}

export default function YearlyTab({ yearlySummaries, currency }: YearlyTabProps) {
  
  // Historical Calculations
  const historicalTotals = useMemo(() => {
    let grossIncome = 0;
    let grossExpense = 0;
    let accumulatedSavings = 0;

    yearlySummaries.forEach(y => {
      grossIncome += y.totalIncome;
      grossExpense += y.totalExpenses;
      accumulatedSavings += y.netSaving;
    });

    return {
      grossIncome,
      grossExpense,
      accumulatedSavings,
      count: yearlySummaries.length
    };
  }, [yearlySummaries]);

  // Sort chronologically (ascending years) for chart trend rendering
  const chartData = useMemo(() => {
    return [...yearlySummaries].sort((a, b) => a.year - b.year);
  }, [yearlySummaries]);

  // Calculate Year-over-Year (YoY) Net Savings delta if multiple years exist
  const yoyMetric = useMemo(() => {
    if (chartData.length < 2) return null;
    const latest = chartData[chartData.length - 1];
    const previous = chartData[chartData.length - 2];
    
    if (previous.netSaving === 0) return null;
    const delta = latest.netSaving - previous.netSaving;
    const percentChange = (delta / Math.abs(previous.netSaving)) * 100;
    
    return {
      delta,
      percentChange,
      latestYear: latest.year,
      prevYear: previous.year,
      improved: delta >= 0
    };
  }, [chartData]);

  // Helper currency formatter handles negative numbers elegantly
  const formatVal = (amount: number) => {
    const isNegative = amount < 0;
    return `${isNegative ? "-" : ""}${currency.symbol}${Math.abs(amount).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div id="yearly-tab-container" className="flex flex-col gap-6">

      {/* Tab Control Header */}
      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-500" />
            Macro Yearly Summaries
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Year-over-year multi-annual balance sheet consolidation ledger
          </p>
        </div>
        <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 flex items-center gap-1.5">
          <Building2 className="w-4 h-4 text-slate-400" />
          Status: Verified Audit Mode
        </div>
      </div>

      {/* Historical KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Total Earnings */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="p-2 bg-emerald-50 text-emerald-500 rounded-lg">
              <DollarSign className="w-5 h-5" />
            </span>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">Gross historical</span>
          </div>
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Gross Historical Earnings</h3>
          <p className="text-2xl font-black text-slate-800 mt-1">
            {formatVal(historicalTotals.grossIncome)}
          </p>
          <p className="text-[10px] text-slate-400 mt-2.5">
            Sum of all registered income flows across {historicalTotals.count} years
          </p>
        </div>

        {/* Total Outflows */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="p-2 bg-rose-50 text-rose-500 rounded-lg">
              <Wallet2 className="w-5 h-5" />
            </span>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">Total debited</span>
          </div>
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Aggregate Outflow expenses</h3>
          <p className="text-2xl font-black text-slate-800 mt-1">
            {formatVal(historicalTotals.grossExpense)}
          </p>
          <p className="text-[10px] text-slate-400 mt-2.5">
            Historical expenditure of all debited items across spreadsheet rows
          </p>
        </div>

        {/* Accumulated Savings */}
        <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 text-white border border-indigo-950 rounded-xl p-5 shadow-sm relative overflow-hidden">
          {/* subtle background effect */}
          <div className="absolute -right-8 -bottom-8 w-28 h-28 bg-indigo-500/15 rounded-full blur-xl pointer-events-none" />
          
          <div className="flex justify-between items-start mb-2">
            <span className="px-2 py-0.5 rounded text-[9px] uppercase font-bold bg-indigo-800 text-indigo-200 tracking-wider">
              Asset Buffer
            </span>
            <span className="text-indigo-300 text-[10px] uppercase font-bold tracking-widest font-mono">ALL-TIME BANKED</span>
          </div>
          <h3 className="text-[11px] font-bold text-indigo-200 uppercase tracking-wider">Net Accumulated Savings</h3>
          <p className="text-2xl font-black mt-1 text-emerald-300">
            {formatVal(historicalTotals.accumulatedSavings)}
          </p>
          <p className="text-[10px] text-indigo-200 mt-2.5">
            Net net liquid buffer (Earns - Spent) successfully recorded
          </p>
        </div>

      </div>

      {/* YoY Metric Insight Statement card */}
      {yoyMetric && (
        <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className={`p-2 rounded-lg ${yoyMetric.improved ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"}`}>
              <TrendingUp className="w-5 h-5" />
            </span>
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Year-Over-Year Macro Growth Indicator (YoY)</h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Annual net savings buffer changed from {yoyMetric.prevYear} to {yoyMetric.latestYear} by{" "}
                <span className={`font-bold ${yoyMetric.improved ? "text-emerald-600" : "text-rose-600"}`}>
                  {formatVal(yoyMetric.delta)}
                </span>
              </p>
            </div>
          </div>
          <span className={`text-sm font-black px-3 py-1.5 rounded-lg font-mono ${
            yoyMetric.improved 
              ? "bg-emerald-100 text-emerald-800 border border-emerald-200" 
              : "bg-rose-100 text-rose-800 border border-rose-200"
          }`}>
            {yoyMetric.improved ? "+" : ""}{yoyMetric.percentChange.toFixed(1)}% YoY
          </span>
        </div>
      )}

      {/* Historical Annual Table & Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Column 1: Historical Table */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex flex-col gap-3">
          <div>
            <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">Consolidated Macro Ledger</h3>
            <p className="text-[11px] text-slate-400">Chronological annual net margins structured spreadsheet format</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  <th className="px-3 py-2 w-20">Year</th>
                  <th className="px-3 py-2 text-right">Incomes</th>
                  <th className="px-3 py-2 text-right">Expenses</th>
                  <th className="px-3 py-2 text-right">Banked Net</th>
                  <th className="px-3 py-2 text-center w-24">Savings Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {yearlySummaries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-slate-400">Zero entries logged</td>
                  </tr>
                ) : (
                  [...yearlySummaries].sort((a,b) => b.year - a.year).map(y => {
                    const saveRate = y.totalIncome > 0 ? (y.netSaving / y.totalIncome) * 100 : 0;
                    return (
                      <tr key={y.year} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-3 py-2.5 font-bold text-slate-700">{y.year}</td>
                        <td className="px-3 py-2.5 text-right font-medium text-emerald-600">{formatVal(y.totalIncome)}</td>
                        <td className="px-3 py-2.5 text-right font-medium text-rose-500">{formatVal(y.totalExpenses)}</td>
                        <td className={`px-3 py-2.5 text-right font-bold ${y.netSaving >= 0 ? "text-slate-800" : "text-rose-600"}`}>
                          {formatVal(y.netSaving)}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            saveRate >= 20 ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                            saveRate >= 5 ? "bg-slate-50 text-slate-700 border border-slate-200" : 
                            "bg-rose-50 text-rose-700 border border-rose-100"
                          }`}>
                            {saveRate.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Column 2: Annual Wealth Accumulation Bar Chart */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex flex-col">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              Annual Savings Growth Engine
            </h3>
            <p className="text-xs text-slate-400">Consolidated graphical overview of net assets banked year over year.</p>
          </div>

          <div id="annual-savings-chart" className="w-full h-[220px] mt-auto">
            {chartData.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-slate-400 border border-dashed border-slate-200 rounded-lg text-xs">
                Log entries to draw the bar charts.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, bottom: 5, left: -5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="year" 
                    stroke="#94a3b8"
                    fontSize={11}
                    fontWeight={"bold"}
                    tickLine={false}
                    dy={5}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={10}
                    fontWeight={600}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `${currency.symbol}${val}`}
                  />
                  <Tooltip 
                    formatter={(value: any) => [formatVal(value), 'Annual Savings']}
                    contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", border: "none", color: "#fff" }}
                    itemStyle={{ fontSize: "11px", fontWeight: 600 }}
                    labelStyle={{ fontSize: "11px", fontWeight: "bold", color: "#94a3b8" }}
                  />
                  <Bar dataKey="netSaving" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={45}>
                    {chartData.map((entry, index) => {
                      const color = entry.netSaving >= 0 ? "#6366f1" : "#f87171";
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
