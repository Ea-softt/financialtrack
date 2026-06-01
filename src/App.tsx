/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useMemo } from "react";
import { Transaction, WeeklySummary, MonthlySummary, YearlySummary, CurrencyConfig, SUPPORTED_CURRENCIES } from "./types";
import { LocalSqliteDb } from "./database/db";
import DailyLedgerTab from "./components/DailyLedgerTab";
import WeeklyTab from "./components/WeeklyTab";
import MonthlyTab from "./components/MonthlyTab";
import YearlyTab from "./components/YearlyTab";
import { 
  FileSpreadsheet, CalendarRange, Landmark, RefreshCw, BarChart2, 
  Coins, Database, Sparkles, TrendingUp, HelpCircle, Laptop,
  CheckCircle, DatabaseZap, Trash2, ArrowRightLeft, Menu, X
} from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<"daily" | "weekly" | "monthly" | "yearly">("daily");
  const [currency, setCurrency] = useState<CurrencyConfig>(SUPPORTED_CURRENCIES[0]); // Default to GHS (₵)
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  
  // States representing tables in SQLite
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [weeklySummaries, setWeeklySummaries] = useState<WeeklySummary[]>([]);
  const [monthlySummaries, setMonthlySummaries] = useState<MonthlySummary[]>([]);
  const [yearlySummaries, setYearlySummaries] = useState<YearlySummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusMessage, setStatusMessage] = useState<string>("Initializing SQLite connection...");

  // Synchronize and query data from the SQLite emulator
  const reloadDbData = async () => {
    try {
      const ledger = await LocalSqliteDb.getLedger();
      const weekly = await LocalSqliteDb.getWeeklySummaries();
      const monthly = await LocalSqliteDb.getMonthlySummaries();
      const yearly = await LocalSqliteDb.getYearlySummaries();

      setTransactions(ledger);
      setWeeklySummaries(weekly);
      setMonthlySummaries(monthly);
      setYearlySummaries(yearly);
    } catch (err) {
      console.error("Failed querying SQLite aggregates:", err);
    }
  };

  // Initialize SQLite schema & load seeds
  useEffect(() => {
    const bootstrap = async () => {
      setIsLoading(true);
      try {
        await LocalSqliteDb.initialize();
        setStatusMessage("DB connection active. Syncing aggregates...");
        await reloadDbData();
        setStatusMessage("Ready");
      } catch (err) {
        console.error(err);
        setStatusMessage("SQLite Database Error");
      } finally {
        setIsLoading(false);
      }
    };
    bootstrap();
  }, []);

  // CRUD DB Triggers
  const handleAddTransaction = async (tx: Omit<Transaction, "id">) => {
    await LocalSqliteDb.addTransaction(tx);
    await reloadDbData();
  };

  const handleUpdateTransaction = async (tx: Transaction) => {
    await LocalSqliteDb.updateTransaction(tx);
    await reloadDbData();
  };

  const handleDeleteTransaction = async (id: string) => {
    await LocalSqliteDb.deleteTransaction(id);
    await reloadDbData();
  };

  // Extract list of all years dynamically for component filters
  const allTransactionsYears = useMemo(() => {
    const list = new Set<number>();
    transactions.forEach(tx => {
      const dt = new Date(tx.date);
      if (!isNaN(dt.getTime())) list.add(dt.getFullYear());
    });
    return Array.from(list);
  }, [transactions]);

  // Overall statistics for Top Summary metrics strip
  const macroSummaryStats = useMemo(() => {
    let income = 0;
    let spent = 0;
    transactions.forEach(tx => {
      income += tx.income_amount;
      spent += tx.expense_amount;
    });
    return {
      income,
      spent,
      savings: income - spent,
      savingsRate: income > 0 ? ((income - spent) / income) * 100 : 0,
    };
  }, [transactions]);

  // Format macro counters with currency symbol
  const formatMacroVal = (amount: number) => {
    const isNegative = amount < 0;
    return `${isNegative ? "-" : ""}${currency.symbol}${Math.abs(amount).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Helper description of current view
  const tabDescription = useMemo(() => {
    switch (activeTab) {
      case "daily": return { title: "Daily Ledger Dashboard", period: "Double-Entry Record-Keeping Ledger" };
      case "weekly": return { title: "Weekly Aggregated Trends", period: "Multi-Week Cache Performance Analytics" };
      case "monthly": return { title: "Monthly Comparative Performance", period: "Fiscal Monthly Performance Spread Matrix" };
      case "yearly": return { title: "Yearly Macro Consolidated Macros", period: "Year-Over-Year Consolidated Cashflows" };
    }
  }, [activeTab]);

  return (
    <div id="fintrack-app-wrapper" className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans">
      
      {/* SIDEBAR NAVIGATION (Large Screen Responsive Feature from the design HTML) */}
      <aside id="sidebar-panel" className="hidden lg:flex w-64 bg-slate-900 flex-col shrink-0">
        
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-600 text-white rounded-lg shadow-sm">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h1 className="text-white text-lg font-bold tracking-tight">
              FinTrack <span className="text-blue-400"></span>
            </h1>
          </div>
          <p className="text-slate-400 text-[10px] mt-1.5 uppercase tracking-widest font-semibold">
            Architecture Ledger v2.1
          </p>
        </div>

        {/* Dynamic Nav link Items */}
        <nav className="flex-1 mt-6 px-3 space-y-1">
          <button
            onClick={() => setActiveTab("daily")}
            id="tab-btn-daily"
            className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all ${
              activeTab === "daily"
                ? "bg-blue-600/10 text-blue-400 border-l-4 border-blue-500 font-semibold"
                : "text-slate-350 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 mr-3 shrink-0" />
            1. Daily Ledger
          </button>

          <button
            onClick={() => setActiveTab("weekly")}
            id="tab-btn-weekly"
            className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all ${
              activeTab === "weekly"
                ? "bg-blue-600/10 text-blue-400 border-l-4 border-blue-500 font-semibold"
                : "text-slate-350 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <CalendarRange className="w-4 h-4 mr-3 shrink-0" />
            2. Weekly Summary
          </button>

          <button
            onClick={() => setActiveTab("monthly")}
            id="tab-btn-monthly"
            className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all ${
              activeTab === "monthly"
                ? "bg-blue-600/10 text-blue-400 border-l-4 border-blue-500 font-semibold"
                : "text-slate-350 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <RefreshCw className="w-4 h-4 mr-3 shrink-0" />
            3. Monthly Performance
          </button>

          <button
            onClick={() => setActiveTab("yearly")}
            id="tab-btn-yearly"
            className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all ${
              activeTab === "yearly"
                ? "bg-blue-600/10 text-blue-400 border-l-4 border-blue-500 font-semibold"
                : "text-slate-350 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <BarChart2 className="w-4 h-4 mr-3 shrink-0" />
            4. Yearly Macros
          </button>
        </nav>

        {/* SQLite Database controls inside sidebar corner */}
        <div className="p-4 mx-4 mb-4 bg-slate-850/60 rounded-xl border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              SQLite Status
            </span>
            <span className="text-emerald-400 font-bold uppercase tracking-wider text-[10px]">Online</span>
          </div>
          <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-400 h-full w-full shadow-[0_0_8px_rgba(52,211,153,0.5)]"></div>
          </div>
          
        </div>
      </aside>

      {/* MOBILE COMPACT TOP BAR HEADER (Allows fluid responsiveness) */}
      <div id="mobile-navigation-host" className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-slate-900 border-b border-indigo-950 flex items-center justify-between px-4 z-50 shadow-md">
        <div className="flex items-center gap-2">
          <div className="p-1 text-blue-400">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <span className="text-white font-extrabold text-sm tracking-tight">FinTrack Portfolio</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            id="mobile-hamburger-btn"
            className="p-1 px-2.5 bg-slate-800 text-slate-300 rounded"
          >
            {mobileMenuOpen ? <X className="w-5 h-5"/> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* MOBILE MOBILE MENU OVERLAY */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed top-14 left-0 right-0 bg-slate-900 border-b border-slate-800 p-4 z-45 flex flex-col gap-2 shadow-2xl">
          <button
            onClick={() => { setActiveTab("daily"); setMobileMenuOpen(false); }}
            className={`w-full text-left py-2.5 px-4 text-xs uppercase font-extrabold rounded-md ${
              activeTab === "daily" ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            1. Daily Ledger
          </button>
          <button
            onClick={() => { setActiveTab("weekly"); setMobileMenuOpen(false); }}
            className={`w-full text-left py-2.5 px-4 text-xs uppercase font-extrabold rounded-md ${
              activeTab === "weekly" ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            2. Weekly Summary
          </button>
          <button
            onClick={() => { setActiveTab("monthly"); setMobileMenuOpen(false); }}
            className={`w-full text-left py-2.5 px-4 text-xs uppercase font-extrabold rounded-md ${
              activeTab === "monthly" ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            3. Monthly Performance
          </button>
          <button
            onClick={() => { setActiveTab("yearly"); setMobileMenuOpen(false); }}
            className={`w-full text-left py-2.5 px-4 text-xs uppercase font-extrabold rounded-md ${
              activeTab === "yearly" ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            4. Yearly Macros
          </button>
        </div>
      )}

      {/* MAIN VIEWPORT FRAME */}
      <main id="fintrack-main-container" className="flex-1 flex flex-col pt-14 lg:pt-0 overflow-hidden">
        
        {/* EXECUTIVE SUMMARY HEADER BANNER STRIP FROM DESIGN HTML */}
        <header id="executive-summary-header" className="p-5 lg:p-7 bg-white border-b border-slate-200 shadow-xs shrink-0">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
            
            {/* View description parameters */}
            <div className="space-y-1">
              <h2 id="view-title" className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight transition-all">
                {tabDescription?.title}
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200 font-mono">
                  {tabDescription?.period}
                </span>

                {/* Currency Selector option Inline in main view */}
                <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase border-l pl-2 border-slate-200">
                  <Coins className="w-3.5 h-3.5 text-indigo-500" />
                  Unit:
                  <select
                    id="currency-select-inline"
                    value={currency.code}
                    onChange={(e) => {
                      const match = SUPPORTED_CURRENCIES.find(c => c.code === e.target.value);
                      if (match) setCurrency(match);
                    }}
                    className="text-[10px] font-bold text-indigo-600 bg-transparent focus:outline-none focus:ring-0 select-none border-none py-0 px-1 cursor-pointer"
                  >
                    {SUPPORTED_CURRENCIES.map(c => (
                      <option key={c.code} value={c.code}>{c.code}</option>
                    ))}
                  </select>
                </span>
              </div>
            </div>

            {/* HIGH-CONTRAST BALANCED KPI CARDS FROM DESIGN HTML RULES */}
            <div id="compact-executive-kpi" className="flex flex-wrap sm:flex-nowrap gap-3">
              
              {/* Gross Credit (Income) */}
              <div className="flex-1 sm:flex-initial bg-emerald-500 text-emerald-50 px-5 py-2.5 rounded-xl shadow-xs min-w-[130px] border border-emerald-600/20">
                <p className="text-[9px] text-emerald-100 uppercase font-black tracking-widest">Total Income</p>
                <p id="kpi-macro-income" className="text-md lg:text-lg font-black text-white mt-0.5 whitespace-nowrap">
                  {formatMacroVal(macroSummaryStats.income)}
                </p>
              </div>

              {/* Gross Debit (Expenses) */}
              <div className="flex-1 sm:flex-initial bg-rose-500 text-rose-50 px-5 py-2.5 rounded-xl shadow-xs min-w-[130px] border border-rose-600/20">
                <p className="text-[9px] text-rose-100 uppercase font-black tracking-widest">Total Expenses</p>
                <p id="kpi-macro-expenses" className="text-md lg:text-lg font-black text-white mt-0.5 whitespace-nowrap">
                  {formatMacroVal(macroSummaryStats.spent)}
                </p>
              </div>

              {/* Net Balance (Savings) */}
              <div className="flex-grow sm:flex-initial bg-white px-5 py-2.5 rounded-xl shadow-xs border border-slate-200 min-w-[140px] relative overflow-hidden">
                <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest">Net Savings Margin</p>
                <p id="kpi-macro-savings" className={`text-md lg:text-lg font-black mt-0.5 whitespace-nowrap ${macroSummaryStats.savings >= 0 ? "text-slate-900" : "text-rose-600"}`}>
                  {formatMacroVal(macroSummaryStats.savings)}
                </p>
                <span className="absolute right-2 top-2 text-[9px] font-black text-indigo-400 bg-indigo-50 px-1 py-0.5 rounded scale-90 border border-indigo-150">
                  {macroSummaryStats.savingsRate.toFixed(0)}%
                </span>
              </div>

            </div>

          </div>
        </header>

        {/* COMPONENT CONTENT DYNAMIC CONTAINER */}
        <div id="fintrack-tab-scroller" className="flex-1 overflow-y-auto p-4 lg:p-6 min-h-0">
          
          {isLoading ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-20 text-center shadow-sm flex flex-col items-center justify-center h-full">
              <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
              <span className="text-sm font-bold text-slate-700">{statusMessage}</span>
              <span className="text-xs text-slate-400 mt-1">Simulating fast SQLite database indexing and aggregates grouping...</span>
            </div>
          ) : (
            <div id="tab-animate-container" className="animate-fadeIn h-full">
              
              {activeTab === "daily" && (
                <DailyLedgerTab
                  transactions={transactions}
                  onAddTransaction={handleAddTransaction}
                  onUpdateTransaction={handleUpdateTransaction}
                  onDeleteTransaction={handleDeleteTransaction}
                  currency={currency}
                />
              )}

              {activeTab === "weekly" && (
                <WeeklyTab
                  weeklySummaries={weeklySummaries}
                  currency={currency}
                />
              )}

              {activeTab === "monthly" && (
                <MonthlyTab
                  monthlySummaries={monthlySummaries}
                  currency={currency}
                  allTransactionsYears={allTransactionsYears}
                />
              )}

              {activeTab === "yearly" && (
                <YearlyTab
                  yearlySummaries={yearlySummaries}
                  currency={currency}
                />
              )}

            </div>
          )}

        </div>

        {/* BOTTOM INTEGRATION BAR (Status of SQLite & System Specs) */}
        <footer className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-800">FinTrack Database Engine</span>
            <span className="text-slate-200">|</span>
            <span className="text-slate-600 font-mono font-semibold bg-slate-100 px-2 py-0.5 rounded">{new Date().toISOString().split('T')[0]} UTC</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Rows Indexed: <strong className="text-slate-800">{transactions.length}</strong></span>
           
            <span>Designed By: <strong className="text-slate-800">EA-Soft</strong></span>
           
            <span className="text-slate-350">|</span>
            <span className="text-indigo-600 font-bold uppercase tracking-wider text-[10px]">Professional Polish Compliant</span>
          </div>
        </footer>

      </main>

    </div>
  );
}
