/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { Transaction, CATEGORIES, PAYMENT_METHODS, CurrencyConfig } from "../types";
import { 
  Plus, Search, SlidersHorizontal, Trash2, Edit2, Check, X, 
  ArrowUpRight, ArrowDownRight, CircleDollarSign, CalendarDays, RefreshCw
} from "lucide-react";

interface DailyLedgerTabProps {
  transactions: Transaction[];
  onAddTransaction: (tx: Omit<Transaction, "id">) => Promise<void>;
  onUpdateTransaction: (tx: Transaction) => Promise<void>;
  onDeleteTransaction: (id: string) => Promise<void>;
  currency: CurrencyConfig;
}

export default function DailyLedgerTab({
  transactions,
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  currency,
}: DailyLedgerTabProps) {
  // Form state
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [category, setCategory] = useState<string>(CATEGORIES[3]); // Default Food & Groceries
  const [description, setDescription] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>(PAYMENT_METHODS[0]);
  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedPayment, setSelectedPayment] = useState("All");
  const [sortBy, setSortBy] = useState<"date-desc" | "date-asc" | "amount-desc" | "amount-asc">("date-desc");
  const [showFilters, setShowFilters] = useState(false);

  // Inline Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Transaction | null>(null);

  // Form submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert("Please enter a valid amount greater than 0");
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddTransaction({
        date,
        category,
        description: description.trim() || `${category} ${type === "expense" ? "Expense" : "Income"}`,
        payment_method: paymentMethod,
        expense_amount: type === "expense" ? numAmount : 0,
        income_amount: type === "income" ? numAmount : 0,
      });

      // Reset amount and description
      setAmount("");
      setDescription("");
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Inline edit handlers
  const handleStartEdit = (tx: Transaction) => {
    setEditingId(tx.id);
    setEditForm({ ...tx });
  };

  const handleSaveEdit = async () => {
    if (!editForm) return;
    try {
      await onUpdateTransaction(editForm);
      setEditingId(null);
      setEditForm(null);
    } catch (err) {
      console.error(err);
      alert("Error saving transaction edit");
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  // Filter and sort computation
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((tx) => {
        const matchesSearch =
          tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tx.category.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory =
          selectedCategory === "All" || tx.category === selectedCategory;
        const matchesPayment =
          selectedPayment === "All" || tx.payment_method === selectedPayment;

        return matchesSearch && matchesCategory && matchesPayment;
      })
      .sort((a, b) => {
        if (sortBy === "date-desc") {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        }
        if (sortBy === "date-asc") {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        }
        if (sortBy === "amount-desc") {
          const maxA = Math.max(a.expense_amount, a.income_amount);
          const maxB = Math.max(b.expense_amount, b.income_amount);
          return maxB - maxA;
        }
        if (sortBy === "amount-asc") {
          const maxA = Math.max(a.expense_amount, a.income_amount);
          const maxB = Math.max(b.expense_amount, b.income_amount);
          return maxA - maxB;
        }
        return 0;
      });
  }, [transactions, searchTerm, selectedCategory, selectedPayment, sortBy]);

  // Aggregate stats of only filtered rows (Spreadsheet Aggregator row flow)
  const totals = useMemo(() => {
    let totalIncome = 0;
    let totalExpenses = 0;
    filteredTransactions.forEach((tx) => {
      totalIncome += tx.income_amount;
      totalExpenses += tx.expense_amount;
    });
    return {
      income: totalIncome,
      expenses: totalExpenses,
      savings: totalIncome - totalExpenses,
    };
  }, [filteredTransactions]);

  // Format currency with signs safely
  const formatValue = (amount: number) => {
    const isNegative = amount < 0;
    const absValue = Math.abs(amount).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${isNegative ? "-" : ""}${currency.symbol}${absValue}`;
  };

  return (
    <div id="ledger-tab-container" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* LEFT COLUMN: Transaction Log Entry Form (Excel Data Input Panel) */}
      <div id="ledger-form-panel" className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 shadow-sm h-fit">
        <h2 id="ledger-form-title" className="text-lg font-semibold text-slate-800 tracking-tight flex items-center gap-2 mb-4">
          <SlidersHorizontal className="w-5 h-5 text-indigo-500" />
          Log Transaction
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Transaction Type (Excel Expends vs Income picker) */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Transaction Type
            </label>
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-lg">
              <button
                type="button"
                id="btn-select-expense"
                onClick={() => setType("expense")}
                className={`flex items-center justify-center gap-1.5 py-1.5 text-sm font-medium rounded-md transition-all ${
                  type === "expense"
                    ? "bg-rose-500 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-200"
                }`}
              >
                <ArrowDownRight className="w-4 h-4" />
                Expense (Debit)
              </button>
              <button
                type="button"
                id="btn-select-income"
                onClick={() => setType("income")}
                className={`flex items-center justify-center gap-1.5 py-1.5 text-sm font-medium rounded-md transition-all ${
                  type === "income"
                    ? "bg-emerald-500 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-200"
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                Income (Credit)
              </button>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Value Amount ({currency.code})
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-slate-400 font-medium text-sm">{currency.symbol}</span>
              </div>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                id="field-amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="block w-full pl-9 pr-3 py-2 text-slate-800 placeholder-slate-400 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-medium"
              />
            </div>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Transaction Date
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <CalendarDays className="w-4 h-4 text-slate-400" />
              </div>
              <input
                type="date"
                required
                id="field-date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="block w-full pl-9 pr-3 py-2 text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-medium"
              />
            </div>
          </div>

          {/* Category Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Category Group
            </label>
            <select
              id="field-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="block w-full px-3 py-2 text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-medium"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Payment Standard
            </label>
            <select
              id="field-payment-method"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="block w-full px-3 py-2 text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-medium"
            >
              {PAYMENT_METHODS.map((pm) => (
                <option key={pm} value={pm}>
                  {pm}
                </option>
              ))}
            </select>
          </div>

          {/* Description Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Description Note
            </label>
            <input
              type="text"
              id="field-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Electricity, Contract salary, Grocery shop..."
              className="block w-full px-3 py-2 text-slate-800 placeholder-slate-400 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
            />
          </div>

          <button
            type="submit"
            id="btn-submit-transaction"
            disabled={isSubmitting}
            className={`w-full flex items-center justify-center gap-2 text-sm font-medium py-2.5 px-4 rounded-lg text-white transition-all shadow-sm ${
              type === "expense" 
                ? "bg-rose-500 hover:bg-rose-600 active:bg-rose-700" 
                : "bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700"
            }`}
          >
            <Plus className="w-5 h-5" />
            {isSubmitting ? "Logging Row..." : "Add to Daily Ledger"}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-slate-100 text-[11px] text-slate-400 text-center leading-relaxed">
          Matches standard financial accounting format (Credit vs. Debit indexes). Auto-calculated offsets are immediately available across tracking panels.
        </div>
      </div>

      {/* RIGHT COLUMN: Ledger Grid Excel View */}
      <div id="ledger-grid-panel" className="lg:col-span-8 flex flex-col gap-4">
        
        {/* Row Filters and Quick Stats */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          
          {/* Live Search and filters */}
          <div className="w-full md:w-auto flex flex-wrap gap-2 items-center flex-1">
            <div className="relative flex-1 max-w-xs">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-slate-400" />
              </span>
              <input
                type="text"
                id="ledger-search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search ledger description..."
                className="w-full pl-9 pr-3 py-2 text-slate-800 placeholder-slate-400 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/20 focus:outline-none focus:border-indigo-500 font-medium"
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              id="btn-toggle-filters"
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-all ${
                showFilters 
                  ? "bg-slate-100 text-slate-800 border-slate-300" 
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Format
            </button>

            {/* Quick Sort dropdown */}
            <select
              id="sort-ledger-select"
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="px-2.5 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg focus:outline-none"
            >
              <option value="date-desc">Latest first</option>
              <option value="date-asc">Chronological</option>
              <option value="amount-desc">Highest Amount</option>
              <option value="amount-asc">Lowest Amount</option>
            </select>
          </div>

          {/* Quick Balanced Counter of currently shown rows */}
          <div className="flex gap-4 md:gap-6 self-stretch justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
            <div className="text-right">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">CREDITS (INCOME)</span>
              <span className="text-sm font-semibold text-emerald-600">{formatValue(totals.income)}</span>
            </div>
            <div className="text-right">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">DEBITS (EXPENSE)</span>
              <span className="text-sm font-semibold text-rose-600">{formatValue(totals.expenses)}</span>
            </div>
            <div className="text-right">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">NET LEDGER BAL</span>
              <span className={`text-sm font-bold ${totals.savings >= 0 ? "text-slate-800" : "text-rose-600"}`}>
                {formatValue(totals.savings)}
              </span>
            </div>
          </div>
        </div>

        {/* Formatted Advanced Filters Panel */}
        {showFilters && (
          <div id="extended-filters-panel" className="bg-slate-50 border border-slate-200 p-3 rounded-lg grid grid-cols-2 gap-3 mb-1 animate-fadeIn">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Filter Category</label>
              <select
                id="filter-category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-1.5 text-xs bg-white border border-slate-200 rounded focus:outline-none"
              >
                <option value="All">All Categories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Filter Payment Method</label>
              <select
                id="filter-payment"
                value={selectedPayment}
                onChange={(e) => setSelectedPayment(e.target.value)}
                className="w-full p-1.5 text-xs bg-white border border-slate-200 rounded focus:outline-none"
              >
                <option value="All">All Payment Systems</option>
                {PAYMENT_METHODS.map((pm) => (
                  <option key={pm} value={pm}>
                    {pm}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Excel Standard Spreadsheet Data Table Grid */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-fixed min-w-[700px]">
              
              {/* Table Headers styled as premium spreadsheet grid */}
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 divide-x divide-slate-100 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <th className="w-28 px-3 py-2.5">Date</th>
                  <th className="w-36 px-3 py-2.5">Category</th>
                  <th className="px-3 py-2.5">Description</th>
                  <th className="w-32 px-3 py-2.5">Payment Method</th>
                  <th className="w-28 px-3 py-2.5 text-right bg-rose-50/40 text-rose-700">Expends (Debit)</th>
                  <th className="w-28 px-3 py-2.5 text-right bg-emerald-50/40 text-emerald-700">Income (Credit)</th>
                  <th className="w-20 px-3 py-2.5 text-center">Action</th>
                </tr>
              </thead>

              {/* Table Rows */}
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-400 font-medium">
                      No transaction records found matching active filters.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => {
                    const isEditing = editingId === tx.id;
                    return (
                      <tr 
                        key={tx.id} 
                        className={`hover:bg-slate-50/50 divide-x divide-slate-100 transition-colors ${
                          isEditing ? "bg-indigo-50/30" : ""
                        }`}
                      >
                        {/* 1. Date */}
                        <td className="px-3 py-2.5 font-medium text-slate-600">
                          {isEditing ? (
                            <input
                              type="date"
                              value={editForm?.date || ""}
                              onChange={(e) => setEditForm(prev => prev ? { ...prev, date: e.target.value } : null)}
                              className="w-full px-1.5 py-0.5 bg-white border border-slate-300 rounded font-normal text-xs"
                            />
                          ) : (
                            tx.date
                          )}
                        </td>

                        {/* 2. Category */}
                        <td className="px-3 py-2.5">
                          {isEditing ? (
                            <select
                              value={editForm?.category || ""}
                              onChange={(e) => setEditForm(prev => prev ? { ...prev, category: e.target.value } : null)}
                              className="w-full px-1.5 py-0.5 bg-white border border-slate-300 rounded text-xs"
                            >
                              {CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>
                                  {cat}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 shadow-3xs">
                              {tx.category}
                            </span>
                          )}
                        </td>

                        {/* 3. Description */}
                        <td className="px-3 py-2.5 font-medium text-slate-700 truncate">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm?.description || ""}
                              onChange={(e) => setEditForm(prev => prev ? { ...prev, description: e.target.value } : null)}
                              className="w-full px-1.5 py-0.5 bg-white border border-slate-300 rounded text-xs"
                            />
                          ) : (
                            tx.description
                          )}
                        </td>

                        {/* 4. Payment Method */}
                        <td className="px-3 py-2.5 text-slate-500 font-medium">
                          {isEditing ? (
                            <select
                              value={editForm?.payment_method || ""}
                              onChange={(e) => setEditForm(prev => prev ? { ...prev, payment_method: e.target.value } : null)}
                              className="w-full px-1.5 py-0.5 bg-white border border-slate-300 rounded text-xs"
                            >
                              {PAYMENT_METHODS.map((pm) => (
                                <option key={pm} value={pm}>
                                  {pm}
                                </option>
                              ))}
                            </select>
                          ) : (
                            tx.payment_method
                          )}
                        </td>

                        {/* 5. Expense (Debit) */}
                        <td className="px-3 py-2.5 text-right font-medium text-rose-600 bg-rose-50/10">
                          {isEditing ? (
                            <input
                              type="number"
                              step="0.01"
                              value={editForm?.expense_amount ?? 0}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setEditForm(prev => prev ? { ...prev, expense_amount: val, income_amount: val > 0 ? 0 : prev.income_amount } : null);
                              }}
                              className="w-full px-1.5 py-0.5 bg-white border border-slate-300 rounded text-right text-xs text-rose-600"
                            />
                          ) : tx.expense_amount > 0 ? (
                            formatValue(tx.expense_amount)
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>

                        {/* 6. Income (Credit) */}
                        <td className="px-3 py-2.5 text-right font-medium text-emerald-600 bg-emerald-50/10">
                          {isEditing ? (
                            <input
                              type="number"
                              step="0.01"
                              value={editForm?.income_amount ?? 0}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setEditForm(prev => prev ? { ...prev, income_amount: val, expense_amount: val > 0 ? 0 : prev.expense_amount } : null);
                              }}
                              className="w-full px-1.5 py-0.5 bg-white border border-slate-300 rounded text-right text-xs text-emerald-600"
                            />
                          ) : tx.income_amount > 0 ? (
                            formatValue(tx.income_amount)
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>

                        {/* 7. Action controls */}
                        <td className="px-3 py-2.5 text-center">
                          {isEditing ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={handleSaveEdit}
                                title="Save Row"
                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                title="Cancel Edit"
                                className="p-1 text-slate-400 hover:bg-slate-100 rounded transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleStartEdit(tx)}
                                title="Edit Edit"
                                className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm("Delete this transaction entry physically from local database?")) {
                                    onDeleteTransaction(tx.id);
                                  }
                                }}
                                title="Delete Record"
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              {/* Spreadsheet Excel Aggregator Totals rows */}
              <tfoot>
                <tr className="bg-slate-100 font-extrabold text-slate-700 text-xs border-t-2 border-slate-300 divide-x divide-slate-200">
                  <td colSpan={4} className="px-3 py-3 text-right text-slate-500 font-bold uppercase tracking-wider">
                    Total Sheets (Current Filters Index)
                  </td>
                  <td className="px-3 py-3 text-right text-rose-600 bg-rose-100/30">
                    {formatValue(totals.expenses)}
                  </td>
                  <td className="px-3 py-3 text-right text-emerald-600 bg-emerald-100/30">
                    {formatValue(totals.income)}
                  </td>
                  <td className="px-3 py-3 text-center bg-slate-100 font-bold">
                    <span className={totals.savings >= 0 ? "text-slate-800" : "text-rose-600"}>
                      {totals.savings >= 0 ? "SURPLUS" : "DEFICIT"}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
