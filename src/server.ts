import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { closeDatabase, verifyDatabaseConnection } from "./db/index.js";

const app = createApp();

try {
  await verifyDatabaseConnection();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error("Unable to start the QA Dashboard API because the database connection failed.");
  console.error(`DATABASE_URL: ${process.env.DATABASE_URL ?? "(not set)"}`);
  console.error(`Database error: ${message}`);
  console.error("");
  console.error("Check that:");
  console.error("- DATABASE_URL is set correctly in your environment");
  console.error("- the Neon project is active and the connection string is up to date");
  await closeDatabase();
  process.exit(1);
}

const server = app.listen(env.port, () => {
  console.log(`QA Dashboard API listening on http://localhost:${env.port}`);
});

async function shutdown() {
  server.close(async () => {
    await closeDatabase();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
