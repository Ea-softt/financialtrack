/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";
import path from "path";
import { Transaction, WeeklySummary, MonthlySummary, YearlySummary } from "../src/types";

let dbInstance: Database | null = null;
const dbFile = path.resolve(process.cwd(), "fintrack.db");

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

export async function getDb(): Promise<Database> {
  if (!dbInstance) {
    dbInstance = await open({
      filename: dbFile,
      driver: sqlite3.Database,
    });
    
    // Create the SQLite database schema
    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT NOT NULL,
        payment_method TEXT NOT NULL,
        expense_amount REAL NOT NULL,
        income_amount REAL NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
    `);

    // Check if table contains rows; if empty, seed default illustrations
    const countResult = await dbInstance.get<{ "count(*)": number }>("SELECT count(*) FROM transactions");
    if (countResult && countResult["count(*)"] === 0) {
      console.log("[SQLite Database] DB is empty. Seeding foundational rows...");
      await seedDb(dbInstance);
    }
  }
  return dbInstance;
}

export async function seedDb(db: Database) {
  // Clear any existing values to ensure fresh state if requested
  await db.exec(`DELETE FROM transactions;`);
  
  const seeds = [
    {
      id: "seeded-income-may-2026",
      date: "2026-05-29",
      category: "Business",
      description: "Business Consulting Contract Payout",
      payment_method: "Bank Transfer",
      expense_amount: 0,
      income_amount: 3270.00
    },
    {
      id: "seeded-expense-may-2026",
      date: "2026-05-29",
      category: "Rent & Accommodation",
      description: "Co-working Space Monthly Rent",
      payment_method: "Mobile Money",
      expense_amount: 710.00,
      income_amount: 0
    },
    {
      id: "seeded-expense-jan-1",
      date: "2026-01-15",
      category: "Utilities",
      description: "Office Electricity & Internet Bill",
      payment_method: "Bank Card",
      expense_amount: 100.00,
      income_amount: 0
    },
    {
      id: "seeded-expense-jan-2",
      date: "2026-01-22",
      category: "Food & Groceries",
      description: "Weekly Grocery Restocking",
      payment_method: "Cash",
      expense_amount: 200.00,
      income_amount: 0
    }
  ];

  for (const s of seeds) {
    await db.run(
      `INSERT INTO transactions (id, date, category, description, payment_method, expense_amount, income_amount)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [s.id, s.date, s.category, s.description, s.payment_method, s.expense_amount, s.income_amount]
    );
  }
  console.log("[SQLite Database] Finished seeding core illustrative entries.");
}

// Database helper queries & dynamic business calculation layer
export class DbService {
  public static async getLedger(): Promise<Transaction[]> {
    const db = await getDb();
    return await db.all<Transaction[]>("SELECT * FROM transactions ORDER BY date DESC, id DESC");
  }

  public static async addTransaction(tx: Omit<Transaction, "id">): Promise<Transaction> {
    const db = await getDb();
    const id = `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await db.run(
      `INSERT INTO transactions (id, date, category, description, payment_method, expense_amount, income_amount)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, tx.date, tx.category, tx.description, tx.payment_method, tx.expense_amount, tx.income_amount]
    );
    return { ...tx, id };
  }

  public static async updateTransaction(tx: Transaction): Promise<Transaction> {
    const db = await getDb();
    await db.run(
      `UPDATE transactions 
       SET date = ?, category = ?, description = ?, payment_method = ?, expense_amount = ?, income_amount = ?
       WHERE id = ?`,
      [tx.date, tx.category, tx.description, tx.payment_method, tx.expense_amount, tx.income_amount, tx.id]
    );
    return tx;
  }

  public static async deleteTransaction(id: string): Promise<boolean> {
    const db = await getDb();
    const result = await db.run("DELETE FROM transactions WHERE id = ?", [id]);
    return (result.changes ?? 0) > 0;
  }

  public static async reset(): Promise<boolean> {
    const db = await getDb();
    await seedDb(db);
    return true;
  }

  // Aggregate operations fully integrated over real sqlite records
  public static async getWeeklySummaries(): Promise<WeeklySummary[]> {
    const txs = await this.getLedger();
    const groupKeyMap: Record<string, { totalExpenses: number; totalIncome: number }> = {};

    txs.forEach(tx => {
      const { weekNumber, year } = getISOWeekInfo(tx.date);
      const groupKey = `${year}-W${weekNumber}`;
      if (!groupKeyMap[groupKey]) {
        groupKeyMap[groupKey] = { totalExpenses: 0, totalIncome: 0 };
      }
      groupKeyMap[groupKey].totalExpenses += tx.expense_amount;
      groupKeyMap[groupKey].totalIncome += tx.income_amount;
    });

    const summaries: WeeklySummary[] = Object.keys(groupKeyMap).map(key => {
      const [yearStr, weekStr] = key.split("-W");
      const year = parseInt(yearStr);
      const weekNumber = parseInt(weekStr);
      const { startDate, endDate } = getISOWeekRange(weekNumber, year);
      const { totalExpenses, totalIncome } = groupKeyMap[key];
      
      return {
        weekNumber,
        year,
        totalExpenses: parseFloat(totalExpenses.toFixed(2)),
        totalIncome: parseFloat(totalIncome.toFixed(2)),
        netSaving: parseFloat((totalIncome - totalExpenses).toFixed(2)),
        startDate,
        endDate
      };
    });

    return summaries.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.weekNumber - b.weekNumber;
    });
  }

  public static async getMonthlySummaries(selectedYear?: number): Promise<MonthlySummary[]> {
    const txs = await this.getLedger();
    const monthsName = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    const currentYear = selectedYear || new Date().getFullYear();
    const monthlyData: Record<number, { totalExpenses: number; totalIncome: number }> = {};
    
    for (let m = 1; m <= 12; m++) {
      monthlyData[m] = { totalExpenses: 0, totalIncome: 0 };
    }

    txs.forEach(tx => {
      const dateObj = new Date(tx.date);
      if (isNaN(dateObj.getTime())) return;
      
      const year = dateObj.getFullYear();
      if (year !== currentYear) return;

      const month = dateObj.getMonth() + 1;
      monthlyData[month].totalExpenses += tx.expense_amount;
      monthlyData[month].totalIncome += tx.income_amount;
    });

    return Object.keys(monthlyData).map(mKey => {
      const mNum = parseInt(mKey);
      const { totalExpenses, totalIncome } = monthlyData[mNum];
      return {
        monthNumber: mNum,
        monthName: monthsName[mNum - 1],
        year: currentYear,
        totalExpenses: parseFloat(totalExpenses.toFixed(2)),
        totalIncome: parseFloat(totalIncome.toFixed(2)),
        netSaving: parseFloat((totalIncome - totalExpenses).toFixed(2))
      };
    });
  } 

  public static async getYearlySummaries(): Promise<YearlySummary[]> {
    const txs = await this.getLedger();
    const yearlyMap: Record<number, { totalExpenses: number; totalIncome: number }> = {};

    txs.forEach(tx => {
      const dt = new Date(tx.date);
      if (isNaN(dt.getTime())) return;
      const year = dt.getFullYear();
      if (!yearlyMap[year]) {
        yearlyMap[year] = { totalExpenses: 0, totalIncome: 0 };
      }
      yearlyMap[year].totalExpenses += tx.expense_amount;
      yearlyMap[year].totalIncome += tx.income_amount;
    });

    const summaries = Object.keys(yearlyMap).map(yKey => {
      const year = parseInt(yKey);
      const { totalExpenses, totalIncome } = yearlyMap[year];
      return {
        year,
        totalExpenses: parseFloat(totalExpenses.toFixed(2)),
        totalIncome: parseFloat(totalIncome.toFixed(2)),
        netSaving: parseFloat((totalIncome - totalExpenses).toFixed(2))
      };
    });

    return summaries.sort((a, b) => b.year - a.year);
  }
}
