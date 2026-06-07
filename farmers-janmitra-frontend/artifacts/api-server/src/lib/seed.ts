import { db, policiesTable } from "@workspace/db";
import { logger } from "./logger";
import fs from "fs";
import path from "path";

export async function autoSeed() {
  try {
    // Try loading scraped data first
    const scrapedFilePath = path.resolve(import.meta.dirname, "../../../../scraped_policies.json");
    
    if (fs.existsSync(scrapedFilePath)) {
      logger.info(`Found scraped policies file at: ${scrapedFilePath}. Updating live data in DB...`);
      const fileContent = fs.readFileSync(scrapedFilePath, "utf-8");
      const scrapedPolicies = JSON.parse(fileContent);
      
      if (Array.isArray(scrapedPolicies) && scrapedPolicies.length > 0) {
        // Clear old records to avoid duplication and allow updates to take effect
        await db.delete(policiesTable);
        await db.insert(policiesTable).values(scrapedPolicies);
        logger.info(`Successfully imported ${scrapedPolicies.length} live scraped RBI policies into the database.`);
        return;
      }
    }

    logger.info("scraped_policies.json not found or empty. Database remains empty.");
  } catch (err) {
    logger.error({ err }, "Failed to seed policies database");
  }
}
