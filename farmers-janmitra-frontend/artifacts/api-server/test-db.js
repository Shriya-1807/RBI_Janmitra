import { db, policiesTable } from "@workspace/db";

async function run() {
  try {
    const rows = await db.select().from(policiesTable);
    console.log("DB POLICIES COUNT:", rows.length);
    console.log("POLICIES:", rows);
  } catch (err) {
    console.error("DB QUERY ERROR:", err);
  }
}

run();
