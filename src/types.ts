/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Transaction {
  id: string;
  date: string; // "YYYY-MM-DD"
  category: string;
  description: string;
  payment_method: string;
  expense_amount: number;
  income_amount: number;
}

export interface WeeklySummary {
  weekNumber: number; // 1-53
  year: number;
  totalExpenses: number;
  totalIncome: number;
  netSaving: number;
  startDate: string;
  endDate: string;
}

export interface MonthlySummary {
  monthNumber: number; // 1-12
  monthName: string;
  year: number;
  totalExpenses: number;
  totalIncome: number;
  netSaving: number;
}

export interface YearlySummary {
  year: number;
  totalExpenses: number;
  totalIncome: number;
  netSaving: number;
}

export interface CurrencyConfig {
  code: string;
  symbol: string;
}

export const SUPPORTED_CURRENCIES: CurrencyConfig[] = [
  { code: "GHS", symbol: "₵" },
  { code: "USD", symbol: "$" },
  { code: "EUR", symbol: "€" },
  { code: "GBP", symbol: "£" },
  { code: "NGN", symbol: "₦" },
];

export const CATEGORIES = [
  "Salary",
  "Business",
  "Investments",
  "Food & Groceries",
  "Utilities",
  "Business Expense",
  "Transport",
  "Rent & Accommodation",
  "Entertainment",
  "Healthcare",
  "Education",
  "Other",
];

export const PAYMENT_METHODS = [
  "Cash",
  "Mobile Money",
  "Bank Card",
  "Bank Transfer",
  "Check",
];
