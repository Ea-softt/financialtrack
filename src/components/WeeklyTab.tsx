/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from "react";
import { WeeklySummary, CurrencyConfig } from "../types";
import { getISOWeekInfo } from "../database/db";
import { 
  ResponsiveContainer, BarChart, Bar, LineChart, Line, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ComposedChart 
} from "recharts";
import { 
  TrendingUp, Calendar, ArrowUpRight, ArrowDownRight, 
  Percent, CircleAlert, Landmark, Sparkles
} from "lucide-react";

interface WeeklyTabProps {
  weeklySummaries: WeeklySummary[];
  currency: CurrencyConfig;
}

export default function WeeklyTab({ weeklySummaries, currency }: WeeklyTabProps) {
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [weeksDisplayLimit, setWeeksDisplayLimit] = useState<"12" | "all">("12");

  // Get list of unique years in dataset
  const yearsList = useMemo(() => {
    const years = new Set<number>([2026]);
    weeklySummaries.forEach(s => years.add(s.year));
    return Array.from(years).sort((a, b) => b - a);
  }, [weeklySummaries]);

  // Filter summaries by selected year
  const filteredSummaries = useMemo(() => {
    const data = weeklySummaries.filter(s => s.year === selectedYear);
    // Sort in ascending order of week number for chart chronological plotting
    return data.sort((a, b) => a.weekNumber - b.weekNumber);
  }, [weeklySummaries, selectedYear]);

  // Slice summaries for visualization to prevent visual crowding
  const chartData = useMemo(() => {
    if (weeksDisplayLimit === "12") {
      return filteredSummaries.slice(-12);
    }
    return filteredSummaries;
  }, [filteredSummaries, weeksDisplayLimit]);

  // Determine current active week based on either actual current ISO week, or latest week available
  const activeWeekSummary = useMemo(() => {
    if (filteredSummaries.length === 0) return null;
    
    // Attempt to match current date info
    const now = new Date();
    const currentWeekInfo = getISOWeekInfo(now.toISOString().split("T")[0]);
    
    const matched = filteredSummaries.find(
      s => s.weekNumber === currentWeekInfo.weekNumber && s.year === currentWeekInfo.year
    );

    // Default to the latest summary week available in year
    return matched || filteredSummaries[filteredSummaries.length - 1];
  }, [filteredSummaries]);

  // Aggregate stats across the chosen year
  const yearlyAverages = useMemo(() => {
    if (filteredSummaries.length === 0) return { avgInc: 0, avgExp: 0, totalWeeks: 0 };
    let totalIncome = 0;
    let totalExpenses = 0;
    filteredSummaries.forEach(s => {
      totalIncome += s.totalIncome;
      totalExpenses += s.totalExpenses;
    });
    return {
      avgInc: totalIncome / filteredSummaries.length,
      avgExp: totalExpenses / filteredSummaries.length,
      totalWeeks: filteredSummaries.length
    };
  }, [filteredSummaries]);

  // Helper currency formatter
  const formatVal = (amount: number) => {
    const isNegative = amount < 0;
    return `${isNegative ? "-" : ""}${currency.symbol}${Math.abs(amount).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div id="weekly-tab-container" className="flex flex-col gap-6">
      
      {/* Tab Control Header */}
      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-500" />
            Weekly Performance Dashboard
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Statistical multi-week groupings in compliance with ISO-8601 calendar standardizer
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 w-full sm:w-auto justify-end">
          <select
            id="weekly-year-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
          >
            {yearsList.map(y => (
              <option key={y} value={y}>Year {y}</option>
            ))}
          </select>

          <div className="bg-slate-100 p-1 rounded-lg flex">
            <button
              onClick={() => setWeeksDisplayLimit("12")}
              className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${
                weeksDisplayLimit === "12"
                  ? "bg-white text-slate-800 shadow-3xs"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Last 12 Wks
            </button>
            <button
              onClick={() => setWeeksDisplayLimit("all")}
              className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${
                weeksDisplayLimit === "all"
                  ? "bg-white text-slate-800 shadow-3xs"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              All Weeks
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards (Active Week Focus & Yearly Averages) */}
      <div id="weekly-kpi-grid" className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Active Selected Week Focus Card */}
        <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 text-white rounded-xl p-5 shadow-sm border border-indigo-950 relative overflow-hidden">
          {/* Decorative background circle */}
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
          
          <div className="flex justify-between items-start mb-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] uppercase font-extrabold bg-indigo-800 text-indigo-200 tracking-wider">
              <Calendar className="w-3.5 h-3.5" />
              Focus: Wk {activeWeekSummary?.weekNumber || 1} ({activeWeekSummary?.year || selectedYear})
            </span>
            <span className="text-slate-300 text-[10px] font-semibold">
              {activeWeekSummary ? `${activeWeekSummary.startDate} to ${activeWeekSummary.endDate}` : "No Active Entries"}
            </span>
          </div>

          <h3 className="text-[11px] font-bold text-indigo-300 uppercase tracking-widest mt-2">Active Week Net Surplus</h3>
          <p className="text-2xl font-black mt-1">
            {activeWeekSummary ? formatVal(activeWeekSummary.netSaving) : formatVal(0)}
          </p>

          <div className="grid grid-cols-2 gap-4 mt-4 pt-3 border-t border-indigo-800/60 text-xs">
            <div>
              <span className="block text-indigo-300 text-[9px] uppercase tracking-wider font-extrabold">Weekly Credits</span>
              <span className="font-bold text-emerald-400 mt-0.5 block">
                {activeWeekSummary ? formatVal(activeWeekSummary.totalIncome) : formatVal(0)}
              </span>
            </div>
            <div>
              <span className="block text-indigo-300 text-[9px] uppercase tracking-wider font-extrabold">Weekly Debits</span>
              <span className="font-bold text-rose-400 mt-0.5 block">
                {activeWeekSummary ? formatVal(activeWeekSummary.totalExpenses) : formatVal(0)}
              </span>
            </div>
          </div>
        </div>

        {/* Average Weekly Expenses KPI Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <span className="p-2 bg-rose-50 text-rose-500 rounded-lg">
              <ArrowDownRight className="w-5 h-5" />
            </span>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Yearly Avg Debits</span>
          </div>
          <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Average Weekly Expense</h3>
          <p className="text-2xl font-black text-slate-800 mt-1">
            {formatVal(yearlyAverages.avgExp)}
          </p>
          <div className="text-xs text-slate-400 mt-3 flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500" />
            Analyzed across {yearlyAverages.totalWeeks} active weeks
          </div>
        </div>

        {/* Average Weekly Savings KPI Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <span className="p-2 bg-emerald-50 text-emerald-500 rounded-lg">
              <Landmark className="w-5 h-5" />
            </span>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest font-mono">Net Flow Factor</span>
          </div>
          <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Average Weekly Saving</h3>
          <p className={`text-2xl font-black mt-1 ${yearlyAverages.avgInc - yearlyAverages.avgExp >= 0 ? "text-slate-800" : "text-rose-600"}`}>
            {formatVal(yearlyAverages.avgInc - yearlyAverages.avgExp)}
          </p>
          <div className="text-xs text-slate-400 mt-3 flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500" />
            Annual savings buffer = {yearlyAverages.avgInc > 0 ? ((yearlyAverages.avgInc - yearlyAverages.avgExp) / yearlyAverages.avgInc * 100).toFixed(1) : 0}% of earnings
          </div>
        </div>

      </div>

      {/* Main Graph Panel */}
      <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
          <div>
            <h3 className="text-md font-bold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              Multi-Series Income & Expenses Spread Trends
            </h3>
            <p className="text-xs text-slate-400">
              Double group visualization tracking core expenses against gross earnings and net margin thresholds.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 self-end sm:self-auto">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-emerald-500 rounded-xs" /> Income
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-rose-400 rounded-xs" /> Expense
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 border-t-2 border-indigo-500" /> Savings
            </span>
          </div>
        </div>

        {/* Recharts Container */}
        <div id="composed-weekly-chart" className="w-full h-[350px]">
          {chartData.length === 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-200 rounded-lg">
              <CircleAlert className="w-8 h-8 text-slate-300 mb-2" />
              <span className="text-xs font-medium">Log transactions in the ledger to populate line graphs.</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, bottom: 20, left: -5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="weekNumber" 
                  tickFormatter={(val) => `Wk ${val}`}
                  stroke="#94a3b8"
                  fontSize={10}
                  fontWeight={600}
                  tickLine={false}
                  dy={10}
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
                  formatter={(value: any, name: string) => {
                    const formattedValue = typeof value === 'number' ? formatVal(value) : value;
                    return [formattedValue, name === 'totalIncome' ? 'Weekly Income' : name === 'totalExpenses' ? 'Weekly Expenses' : 'Net Savings'];
                  }}
                  labelFormatter={(label) => `Calendar Week ${label}`}
                  contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", border: "none", color: "#fff" }}
                  itemStyle={{ fontSize: "11px", fontWeight: 600 }}
                  labelStyle={{ fontSize: "11px", fontWeight: "bold", color: "#94a3b8", marginBottom: "4px" }}
                />
                <Bar dataKey="totalIncome" fill="#10b981" radius={[4, 4, 0, 0]} barSize={18} name="totalIncome" />
                <Bar dataKey="totalExpenses" fill="#f87171" radius={[4, 4, 0, 0]} barSize={18} name="totalExpenses" />
                <Line 
                  type="monotone" 
                  dataKey="netSaving" 
                  stroke="#6366f1" 
                  strokeWidth={3} 
                  dot={{ r: 4, stroke: "#6366f1", strokeWidth: 1, fill: "#ffffff" }}
                  activeDot={{ r: 6 }}
                  name="netSaving"
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

    </div>
  );
}
