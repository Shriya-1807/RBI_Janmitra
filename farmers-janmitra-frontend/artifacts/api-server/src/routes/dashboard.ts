import { Router, type IRouter } from "express";
import { db, policiesTable } from "@workspace/db";
import { sql, count } from "drizzle-orm";
import {
  GetDashboardSummaryResponse,
  GetPoliciesByCategoryResponse,
  GetPoliciesTimelineResponse,
  GetSectorImpactResponse,
} from "@workspace/api-zod";
import { translateFromEnglish } from "../translate";
import { getRagStats } from "../lib/rag";

const router: IRouter = Router();

router.get("/dashboard/summary", async (req, res): Promise<void> => {
  const allPolicies = await db.select().from(policiesTable).orderBy(policiesTable.date);

  const now = new Date();
  const thisMonth = allPolicies.filter(p => {
    const d = new Date(p.date);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });

  const categories = new Set(allPolicies.map(p => p.category));
  const groups = new Set(allPolicies.map(p => p.affectedGroup));

  const recentPolicies = [...allPolicies].reverse().slice(0, 5).map(p => ({
    ...p,
    circularNumber: p.circularNumber ?? undefined,
    impactLevel: p.impactLevel as "low" | "medium" | "high",
  }));

  res.json(GetDashboardSummaryResponse.parse({
    totalPolicies: allPolicies.length,
    thisMonthPolicies: thisMonth.length,
    categoriesCount: categories.size,
    affectedGroupsCount: groups.size,
    recentPolicies,
  }));
});

router.get("/dashboard/policies-by-category", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      category: policiesTable.category,
      count: count(),
    })
    .from(policiesTable)
    .groupBy(policiesTable.category);

  res.json(GetPoliciesByCategoryResponse.parse(rows.map(r => ({
    category: r.category,
    count: Number(r.count),
  }))));
});

router.get("/dashboard/policies-timeline", async (_req, res): Promise<void> => {
  const policies = await db.select({ date: policiesTable.date }).from(policiesTable);

  const counts: Record<string, number> = {};
  for (const p of policies) {
    const d = new Date(p.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    counts[key] = (counts[key] || 0) + 1;
  }

  const timeline = Object.entries(counts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, count]) => ({ period, count }));

  res.json(GetPoliciesTimelineResponse.parse(timeline));
});

router.get("/dashboard/sector-impact", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      sector: policiesTable.affectedGroup,
      count: count(),
    })
    .from(policiesTable)
    .groupBy(policiesTable.affectedGroup);

  const total = rows.reduce((sum, r) => sum + Number(r.count), 0);

  const result = rows.map(r => ({
    sector: r.sector,
    count: Number(r.count),
    percentage: total > 0 ? Math.round((Number(r.count) / total) * 100 * 10) / 10 : 0,
  }));

  res.json(GetSectorImpactResponse.parse(result));
});

router.get("/dashboard/rag-stats", async (_req, res): Promise<void> => {
  res.json(getRagStats());
});

router.get("/dashboard/repo-rates", async (req, res): Promise<void> => {
  try {
    const lang = (req.query.lang as string) || "english";
    const fs = await import("fs");
    const path = await import("path");
    const repoRatesPath = path.resolve(import.meta.dirname, "../../../../repo_rates.json");
    if (fs.existsSync(repoRatesPath)) {
      const data = fs.readFileSync(repoRatesPath, "utf-8");
      const jsonData = JSON.parse(data);
      
      // If the target language is not already cached, translate it dynamically
      if (jsonData.insights && !jsonData.insights[lang]) {
        try {
          const translatedInsight = await translateFromEnglish(jsonData.insights.english, lang);
          jsonData.insights[lang] = translatedInsight;
          // Save back to file to cache the translation
          fs.writeFileSync(repoRatesPath, JSON.stringify(jsonData, null, 2), "utf-8");
        } catch (err) {
          console.error("Failed to dynamically translate repo rate insights:", err);
          jsonData.insights[lang] = jsonData.insights.english;
        }
      }
      
      res.json(jsonData);
    } else {
      res.status(404).json({ error: "Repo rates data not found" });
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to load repo rates data" });
  }
});

export default router;
