/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from "react";
import { MonthlySummary, CurrencyConfig } from "../types";
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend 
} from "recharts";
import { 
  LayoutGrid, CalendarDays, CheckCircle2, AlertTriangle, 
  ArrowUpRight, ArrowDownRight, Sparkles
} from "lucide-react";

interface MonthlyTabProps {
  monthlySummaries: MonthlySummary[];
  currency: CurrencyConfig;
  allTransactionsYears: number[];
}

export default function MonthlyTab({ 
  monthlySummaries, 
  currency,
  allTransactionsYears
}: MonthlyTabProps) {
  const [selectedYear, setSelectedYear] = useState<number>(2026);

  const yearsList = useMemo(() => {
    const years = new Set<number>([2026, ...allTransactionsYears]);
    return Array.from(years).sort((a, b) => b - a);
  }, [allTransactionsYears]);

  // Filter summaries for selected year (insulates calculations)
  const filteredMonthlySummaries = useMemo(() => {
    const data = monthlySummaries.filter(s => s.year === selectedYear);
    // Sort chronological 1 to 12
    return data.sort((a, b) => a.monthNumber - b.monthNumber);
  }, [monthlySummaries, selectedYear]);

  // Aggregate stats of yearly averages
  const monthlyAverages = useMemo(() => {
    if (filteredMonthlySummaries.length === 0) return { income: 0, expense: 0, savings: 0 };
    let totalIncome = 0;
    let totalExpense = 0;
    let totalSavings = 0;
    let activeMonthsCount = 0;

    filteredMonthlySummaries.forEach(m => {
      totalIncome += m.totalIncome;
      totalExpense += m.totalExpenses;
      totalSavings += m.netSaving;
      if (m.totalIncome > 0 || m.totalExpenses > 0) {
        activeMonthsCount++;
      }
    });

    return {
      income: totalIncome,
      expense: totalExpense,
      savings: totalSavings,
      avgIncome: totalIncome / 12,
      avgExpense: totalExpense / 12,
      avgSavings: totalSavings / 12,
      activeMonthsCount
    };
  }, [filteredMonthlySummaries]);

  // Helper currency formatter handles negative numbers elegantly
  const formatVal = (amount: number) => {
    const isNegative = amount < 0;
    return `${isNegative ? "-" : ""}${currency.symbol}${Math.abs(amount).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div id="monthly-tab-container" className="grid grid-cols-1 xl:grid-cols-12 gap-6">

      {/* LEFT PORTION: 12-Month Comparative Grid (Excel Spreadsheet View) */}
      <div className="xl:col-span-6 bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
          <div>
            <h2 className="text-md font-bold text-slate-800 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-indigo-500" />
              12-Month Comparative Sheet
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Comparative cash flow balances for the calendar year {selectedYear}
            </p>
          </div>
          
          <select
            id="monthly-year-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none self-end sm:self-auto"
          >
            {yearsList.map(y => (
              <option key={y} value={y}>Year {y}</option>
            ))}
          </select>
        </div>

        {/* SpreadSheet Grid */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed min-w-[500px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 border-t border-slate-100 divide-x divide-slate-100 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                <th className="px-3 py-2 w-28">Month</th>
                <th className="px-3 py-2 text-right">Income</th>
                <th className="px-3 py-2 text-right">Expenses</th>
                <th className="px-3 py-2 text-right">Savings</th>
                <th className="px-3 py-2 text-center w-20 font-mono">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredMonthlySummaries.map((m) => {
                const savingPercentVal = m.totalIncome > 0 ? (m.netSaving / m.totalIncome) * 100 : 0;
                const isHealthy = m.netSaving >= 0;
                
                return (
                  <tr key={m.monthNumber} className="hover:bg-slate-50/50 transition-colors divide-x divide-slate-100">
                    <td className="px-3 py-2.5 font-semibold text-slate-700">
                      {m.monthName}
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium text-emerald-600">
                      {m.totalIncome > 0 ? formatVal(m.totalIncome) : <span className="text-slate-300">-</span>}
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium text-rose-500">
                      {m.totalExpenses > 0 ? formatVal(m.totalExpenses) : <span className="text-slate-300">-</span>}
                    </td>
                    <td className={`px-3 py-2.5 text-right font-bold ${isHealthy ? "text-slate-800" : "text-rose-600"}`}>
                      {m.netSaving !== 0 ? formatVal(m.netSaving) : <span className="text-slate-300">-</span>}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {m.totalIncome === 0 && m.totalExpenses === 0 ? (
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-200" title="No entries this month" />
                      ) : isHealthy ? (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-widest leading-none">
                          SURPLUS
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-rose-50 text-rose-700 border border-rose-100 uppercase tracking-widest leading-none">
                          DEFICIT
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* General Spreadsheet summary bottom line */}
            <tfoot>
              <tr className="bg-slate-100 font-extrabold text-slate-700 text-xs border-y-2 border-slate-300 divide-x divide-slate-200">
                <td className="px-3 py-2.5 uppercase text-slate-500 font-bold">Annual Accum.</td>
                <td className="px-3 py-2.5 text-right text-emerald-600">{formatVal(monthlyAverages.income)}</td>
                <td className="px-3 py-2.5 text-right text-rose-500">{formatVal(monthlyAverages.expense)}</td>
                <td className={`px-3 py-2.5 text-right ${monthlyAverages.savings >= 0 ? "text-slate-800" : "text-rose-600"}`}>
                  {formatVal(monthlyAverages.savings)}
                </td>
                <td className="px-3 py-2.5 text-center text-[10px] tracking-wider uppercase font-mono bg-slate-100">
                  {monthlyAverages.savings >= 0 ? "Surplus Year" : "Deficit Year"}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* RIGHT PORTION: Beautiful Performance Column Bar Chart */}
      <div className="xl:col-span-6 flex flex-col gap-6">
        
        {/* Metric widgets inside sidebar */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-3xs">
            <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">Avg Earnings</span>
            <span className="text-sm font-bold text-emerald-600 mt-1 block">{formatVal(monthlyAverages.avgIncome)}</span>
            <span className="text-[10px] text-slate-400">/ Monthly Average</span>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-3xs">
            <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider font-mono">Avg Expends</span>
            <span className="text-sm font-bold text-rose-500 mt-1 block">{formatVal(monthlyAverages.avgExpense)}</span>
            <span className="text-[10px] text-slate-400">/ Monthly Average</span>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-3xs">
            <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">Net Agg Buffer</span>
            <span className={`text-sm font-bold mt-1 block ${monthlyAverages.avgSavings >= 0 ? "text-slate-800" : "text-rose-600"}`}>
              {formatVal(monthlyAverages.avgSavings)}
            </span>
            <span className="text-[10px] text-slate-400">/ Monthly Net Buffer</span>
          </div>
        </div>

        {/* Grouped Column Chart panel */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex-1 flex flex-col">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              Expenditure vs Savings Performance
            </h3>
            <p className="text-xs text-slate-400">
              Excel-style comparative column analysis plotting gross outflow limits (debits) alongside leftover savings buffer.
            </p>
          </div>

          <div id="monthly-performance-chart" className="w-full h-[280px] mt-auto">
            {monthlyAverages.activeMonthsCount === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-200 rounded-lg">
                <AlertTriangle className="w-8 h-8 text-slate-300 mb-2" />
                <span className="text-xs font-semibold">No active entries loaded for Year {selectedYear}.</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredMonthlySummaries} margin={{ top: 10, right: 5, bottom: 5, left: -5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="monthName" 
                    stroke="#94a3b8"
                    fontSize={10}
                    fontWeight={600}
                    tickFormatter={(val) => val.substring(0, 3)}
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
                    formatter={(value: any, name: string) => {
                      const formattedValue = typeof value === 'number' ? formatVal(value) : value;
                      return [formattedValue, name === 'totalExpenses' ? 'Expenses' : 'Net Savings'];
                    }}
                    contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", border: "none", color: "#fff" }}
                    itemStyle={{ fontSize: "11px", fontWeight: 600 }}
                    labelStyle={{ fontSize: "11px", fontWeight: "bold", color: "#94a3b8" }}
                  />
                  <Legend 
                    verticalAlign="top"
                    height={36}
                    iconSize={10}
                    iconType="rect"
                    formatter={(value) => {
                      return <span className="text-xs font-semibold text-slate-600">{value === "totalExpenses" ? "Expenses Out" : "Savings Buffer"}</span>;
                    }}
                  />
                  {/* Monthly Expenses (Debits Column) vs Net Savings */}
                  <Bar dataKey="totalExpenses" fill="#f87171" radius={[3, 3, 0, 0]} name="totalExpenses" />
                  <Bar dataKey="netSaving" fill="#6366f1" radius={[3, 3, 0, 0]} name="netSaving" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
