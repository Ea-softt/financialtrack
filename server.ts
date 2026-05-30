/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import * as path from "node:path";
import { createServer as createViteServer } from "vite";
import { DbService } from "./server/db";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Parse JSON bodies safely
  app.use(express.json());

  // API Health Probe
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", engine: "sqlite", timestamp: new Date().toISOString() });
  });

  // Database APIs
  app.post("/api/init", async (req, res) => {
    try {
      await DbService.getWeeklySummaries(); // Triggers initialization
      res.json({ success: true, message: "SQLite Connection Initialized Successfully" });
    } catch (e: any) {
      console.error("[API Error] /api/init:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // READ ledger
  app.get("/api/transactions", async (req, res) => {
    try {
      const records = await DbService.getLedger();
      res.json(records);
    } catch (e: any) {
      console.error("[API Error] /api/transactions (GET):", e);
      res.status(500).json({ error: e.message });
    }
  });

  // CREATE transaction
  app.post("/api/transactions", async (req, res) => {
    try {
      const inserted = await DbService.addTransaction(req.body);
      res.json(inserted);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // UPDATE transaction
  app.put("/api/transactions/:id", async (req, res) => {
    try {
      const updated = await DbService.updateTransaction({ ...req.body, id: req.params.id });
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // DELETE transaction
  app.delete("/api/transactions/:id", async (req, res) => {
    try {
      const success = await DbService.deleteTransaction(req.params.id);
      res.json({ success });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Aggregation - Weekly list
  app.get("/api/summaries/weekly", async (req, res) => {
    try {
      const list = await DbService.getWeeklySummaries();
      res.json(list);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Aggregation - Monthly spread
  app.get("/api/summaries/monthly", async (req, res) => {
    try {
      const selectedYear = req.query.year ? parseInt(req.query.year as string) : undefined;
      const list = await DbService.getMonthlySummaries(selectedYear);
      res.json(list);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Aggregation - Yearly comparisons
  app.get("/api/summaries/yearly", async (req, res) => {
    try {
      const list = await DbService.getYearlySummaries();
      res.json(list);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });


  // Mounting corresponding Vite files for dynamic Hot Module static generation
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("[Server] Ready in Development mode with Vite Middleware.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("[Server] Ready in Production mode serving built assets.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Express SDK] Full-stack engine listening on http://localhost:${PORT}`);
  });
}

startServer();
