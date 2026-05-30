/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Transaction, WeeklySummary, MonthlySummary, YearlySummary } from "../types";

// Helper to calculate correct ISO Week and Year representation (same as original emulator)
export function getISOWeekInfo(dateStr: string): { weekNumber: number; year: number } {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return { weekNumber: 1, year: new Date().getFullYear() };
  }
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { weekNumber: weekNo, year: d.getUTCFullYear() };
}

// Helper to get date boundaries of an ISO week number
export function getISOWeekRange(weekNo: number, year: number): { startDate: string; endDate: string } {
  const jan4 = new Date(year, 0, 4);
  const dayNum = jan4.getDay() || 7;
  const thurs1 = new Date(jan4);
  thurs1.setDate(jan4.getDate() + 4 - dayNum);
  
  const targetThurs = new Date(thurs1);
  targetThurs.setDate(thurs1.getDate() + (weekNo - 1) * 7);
  
  const mon = new Date(targetThurs);
  mon.setDate(targetThurs.getDate() - 3);
  
  const sun = new Date(targetThurs);
  sun.setDate(targetThurs.getDate() + 3);
  
  return {
    startDate: mon.toISOString().split("T")[0],
    endDate: sun.toISOString().split("T")[0]
  };
}

export class LocalSqliteDb {
  /**
   * Initialize connection with the real server-side SQLite backend.
   */
  public static async initialize(): Promise<boolean> {
    try {
      const res = await fetch("/api/init", {
        method: "POST"
      });
      if (!res.ok) {
        throw new Error("HTTP connection failed during database initialization");
      }
      const data = await res.json();
      return !!data.success;
    } catch (e) {
      console.error("[SQLite DB Client] Initialization exception:", e);
      return false;
    }
  }

  /**
   * CREATE: Send raw transaction objects to the backend SQLite processor.
   */
  public static async addTransaction(tx: Omit<Transaction, "id">): Promise<Transaction> {
    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(tx)
    });
    if (!res.ok) {
      throw new Error(`Failed to insert transaction details: ${res.statusText}`);
    }
    return await res.json();
  }

  /**
   * UPDATE: Updates existing transactions inside the persistent real SQLite table.
   */
  public static async updateTransaction(tx: Transaction): Promise<Transaction> {
    const res = await fetch(`/api/transactions/${tx.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(tx)
    });
    if (!res.ok) {
      throw new Error(`Failed to update transaction with ID ${tx.id}: ${res.statusText}`);
    }
    return await res.json();
  }

  /**
   * DELETE: Delete specific rows of standard records.
   */
  public static async deleteTransaction(id: string): Promise<boolean> {
    const res = await fetch(`/api/transactions/${id}`, {
      method: "DELETE"
    });
    if (!res.ok) {
      return false;
    }
    const data = await res.json();
    return !!data.success;
  }

  /**
   * READ: Returns sorted transactional ledger. Latest entries first.
   */
  public static async getLedger(): Promise<Transaction[]> {
    const res = await fetch("/api/transactions");
    if (!res.ok) {
      throw new Error("Could not pull transactions from the active SQLite database");
    }
    return await res.json();
  }

  /**
   * Query database statistics natively (equivalent to SQLite native aggregated views)
   */
  public static async getWeeklySummaries(): Promise<WeeklySummary[]> {
    const res = await fetch("/api/summaries/weekly");
    if (!res.ok) {
      throw new Error("Could not load weekly summaries from server aggregates");
    }
    return await res.json();
  }

  /**
   * Query monthly statistics natively
   */
  public static async getMonthlySummaries(selectedYear?: number): Promise<MonthlySummary[]> {
    const url = selectedYear ? `/api/summaries/monthly?year=${selectedYear}` : "/api/summaries/monthly";
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error("Could not load monthly comparative matrix from server aggregates");
    }
    return await res.json();
  }

  /**
   * Query yearly statistics natively
   */
  public static async getYearlySummaries(): Promise<YearlySummary[]> {
    const res = await fetch("/api/summaries/yearly");
    if (!res.ok) {
      throw new Error("Could not compile consolidated yearly summaries");
    }
    return await res.json();
  }

  /**
   * ADMIN RESET: Deletes and resets database rows on the real backend SQLite.
   */
  public static async resetDb(): Promise<boolean> {
    const res = await fetch("/api/reset", {
      method: "POST"
    });
    if (!res.ok) {
      return false;
    }
    const data = await res.json();
    return !!data.success;
  }
}
