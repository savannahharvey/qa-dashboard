import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { closeDatabase } from "./db/index.js";

const app = createApp();

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
