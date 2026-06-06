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
  console.error("- the local SSM tunnel to the RDS instance is running");
  console.error("- DATABASE_URL uses the current username and password from Terraform or Secrets Manager");
  console.error("- the local tunnel URL does not force SSL if the forwarded connection rejects it");
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
