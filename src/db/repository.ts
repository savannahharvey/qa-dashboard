import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
import { getDatabaseUrl } from "./databaseUrl.js";
import { openPostgresPool } from "./postgres.js";
import type { Goal, GoalWithOwner, MetricSource, QaMetric, Team, TestSuite, User } from "../domain/types.js";

export type PublicTeam = Pick<Team, "id" | "name">;
export type PublicUser = Pick<User, "id" | "username" | "displayName">;
export type MetricSourceConfig = {
  id: string;
  teamId: string;
  source: MetricSource;
  settings: string;
  enabled: number | boolean;
  encryptedPat: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DashboardRepository = {
  findTeam(teamId: string): Promise<Team | undefined>;
  findTeamByJoinCode(joinCode: string): Promise<Team | undefined>;
  findUser(userId: string): Promise<User | undefined>;
  findUserByUsername(username: string): Promise<User | undefined>;
  findMembership(userId: string, teamId: string): Promise<{ userId: string; teamId: string } | undefined>;
  findTeamsByUser(userId: string): Promise<PublicTeam[]>;
  createUser(user: User): Promise<void>;
  createTeam(team: { id: string; name: string; joinCode: string | null; createdAt: string; updatedAt: string }): Promise<void>;
  createMembership(userId: string, teamId: string): Promise<void>;
  createGoal(goal: Goal): Promise<void>;
  updateGoal(goalId: string, teamId: string, fields: Partial<Goal>): Promise<Goal | undefined>;
  findGoal(goalId: string): Promise<Goal | undefined>;
  findMetricSourceConfig(teamId: string, source: MetricSource): Promise<MetricSourceConfig | undefined>;
  upsertMetricSourceConfig(teamId: string, source: MetricSource, settings: string, enabled: number | boolean): Promise<void>;
  updateMetricSourcePat(teamId: string, source: MetricSource, encryptedPat: string | null): Promise<void>;
  replaceMetricsBySource(teamId: string, source: MetricSource, metrics: QaMetric[]): Promise<void>;
  findTestSuitesByTeam(teamId: string): Promise<TestSuite[]>;
  findMetricsByTeam(teamId: string): Promise<QaMetric[]>;
  findGoalsByTeam(teamId: string): Promise<GoalWithOwner[]>;
  getTestsOverTime(repo?: string, branch?: string, from?: string, to?: string, granularity?: string): Promise<{ period: string; total: number; passed: number }[]>;
};



export function createPostgresRepository(pool: Pool): DashboardRepository {
  return {
    async findTeam(teamId) {
      return one<Team>(await pool.query(`SELECT * FROM "Team" WHERE "id" = $1`, [teamId]));
    },
    async findTeamByJoinCode(joinCode) {
      return one<Team>(await pool.query(`SELECT * FROM "Team" WHERE "joinCode" = $1`, [joinCode]));
    },
    async findUser(userId) {
      return one<User>(await pool.query(`SELECT * FROM "User" WHERE "id" = $1`, [userId]));
    },
    async findUserByUsername(username) {
      return one<User>(await pool.query(`SELECT * FROM "User" WHERE lower("username") = lower($1)`, [username]));
    },
    async findMembership(userId, teamId) {
      return one<{ userId: string; teamId: string }>(
        await pool.query(`SELECT "userId", "teamId" FROM "TeamMembership" WHERE "userId" = $1 AND "teamId" = $2`, [userId, teamId]),
      );
    },
    async findTeamsByUser(userId) {
      return many<PublicTeam>(
        await pool.query(
          `SELECT "Team"."id", "Team"."name"
           FROM "Team"
           JOIN "TeamMembership" ON "TeamMembership"."teamId" = "Team"."id"
           WHERE "TeamMembership"."userId" = $1
           ORDER BY "Team"."name" ASC`,
          [userId],
        ),
      );
    },
    async createUser(user) {
      await pool.query(
        `INSERT INTO "User" ("id", "username", "displayName", "passwordHash", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [user.id, user.username, user.displayName, user.passwordHash ?? null, user.createdAt, user.updatedAt],
      );
    },
    async createTeam(team) {
      await pool.query(
        `INSERT INTO "Team" ("id", "name", "joinCode", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5)`,
        [team.id, team.name, team.joinCode, team.createdAt, team.updatedAt],
      );
    },
    async createMembership(userId, teamId) {
      await pool.query(
        `INSERT INTO "TeamMembership" ("userId", "teamId")
         VALUES ($1, $2)
         ON CONFLICT ("userId", "teamId") DO NOTHING`,
        [userId, teamId],
      );
    },
    async createGoal(goal) {
      await pool.query(
        `INSERT INTO "Goal" (
          "id", "teamId", "ownerId", "scope", "parentGoalId", "title", "description", "metricType", "testCategory",
          "currentValue", "targetValue", "unit", "dueDate", "status", "createdAt", "updatedAt"
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
        [
          goal.id,
          goal.teamId,
          goal.ownerId,
          goal.scope,
          goal.parentGoalId,
          goal.title,
          goal.description,
          goal.metricType,
          goal.testCategory,
          goal.currentValue,
          goal.targetValue,
          goal.unit,
          goal.dueDate,
          goal.status,
          goal.createdAt,
          goal.updatedAt,
        ],
      );
    },
    async updateGoal(goalId, teamId, fields) {
      const now = new Date().toISOString();
      const result = await pool.query(
        `UPDATE "Goal"
         SET "ownerId" = $3, "scope" = $4, "parentGoalId" = $5, "title" = $6, "description" = $7,
             "metricType" = $8, "testCategory" = $9, "currentValue" = $10, "targetValue" = $11,
             "unit" = $12, "dueDate" = $13, "updatedAt" = $14
         WHERE "id" = $1 AND "teamId" = $2
         RETURNING *`,
        [
          goalId,
          teamId,
          fields.ownerId,
          fields.scope,
          fields.parentGoalId ?? null,
          fields.title,
          fields.description ?? null,
          fields.metricType ?? null,
          fields.testCategory ?? null,
          fields.currentValue,
          fields.targetValue,
          fields.unit ?? null,
          fields.dueDate ?? null,
          now,
        ],
      );
      return one<Goal>(result);
    },
    async findGoal(goalId) {
      return one<Goal>(await pool.query(`SELECT * FROM "Goal" WHERE "id" = $1`, [goalId]));
    },
    async findMetricSourceConfig(teamId, source) {
      return one<MetricSourceConfig>(
        await pool.query(`SELECT * FROM "MetricSourceConfig" WHERE "teamId" = $1 AND "source" = $2`, [teamId, source]),
      );
    },
    async upsertMetricSourceConfig(teamId, source, settings, enabled) {
      const config =
        typeof source === "object" && source !== null && settings === undefined
          ? source
          : { source, enabled, settings };

      await persistMetricSourceConfig(pool, teamId, config.source, config.settings, config.enabled);
    },
    async updateMetricSourcePat(teamId, source, encryptedPat) {
      await pool.query(
        `UPDATE "MetricSourceConfig" SET "encryptedPat" = $3, "updatedAt" = now() WHERE "teamId" = $1 AND "source" = $2`,
        [teamId, source, encryptedPat],
      );
    },
    async replaceMetricsBySource(teamId, source, metrics) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query(`DELETE FROM "QaMetric" WHERE "teamId" = $1 AND "source" = $2`, [teamId, source]);
        for (const metric of metrics) {
          await client.query(
            `INSERT INTO "QaMetric" (
              "id", "teamId", "testSuiteId", "category", "kind", "status", "value", "unit", "source", "measuredAt", "passedTests", "failedTests", "totalTests", "createdAt", "updatedAt"
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
            [
              metric.id,
              metric.teamId,
              metric.testSuiteId,
              metric.category,
              metric.kind,
              metric.status,
              metric.value,
              metric.unit,
              metric.source,
              metric.measuredAt,
              metric.passedTests,
              metric.failedTests,
              metric.totalTests,
              metric.createdAt,
              metric.updatedAt,
            ],
          );
        }
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },
    async findTestSuitesByTeam(teamId) {
      return many<TestSuite>(await pool.query(`SELECT * FROM "TestSuite" WHERE "teamId" = $1 ORDER BY "category" ASC`, [teamId]));
    },
    async findMetricsByTeam(teamId) {
      return many<QaMetric>(
        await pool.query(`SELECT * FROM "QaMetric" WHERE "teamId" = $1 ORDER BY "category" ASC, "kind" ASC`, [teamId]),
      );
    },
    async findGoalsByTeam(teamId) {
      return many<GoalWithOwner>(
        await pool.query(
          `SELECT "Goal".*, "User"."username" AS "ownerUsername", "User"."displayName" AS "ownerDisplayName"
           FROM "Goal"
           JOIN "User" ON "User"."id" = "Goal"."ownerId"
           WHERE "Goal"."teamId" = $1
           ORDER BY "Goal"."scope" ASC, "Goal"."createdAt" ASC`,
          [teamId],
        ),
      );
    },
    async getTestsOverTime(repo, branch, from, to, granularity) {
      const params: any[] = [];
      const where: string[] = [];
      let idx = 1;

      if (repo) {
        where.push(`"repo" = $${idx++}`);
        params.push(repo);
      }
      if (branch) {
        where.push(`"branch" = $${idx++}`);
        params.push(branch);
      }
      if (from) {
        where.push(`"period" >= $${idx++}`);
        params.push(from);
      }
      if (to) {
        where.push(`"period" <= $${idx++}`);
        params.push(to);
      }
      if (granularity) {
        where.push(`"granularity" = $${idx++}`);
        params.push(granularity);
      }

      const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";
      const q = `SELECT "period", "total", "passed" FROM "TestMetric" ${whereClause} ORDER BY "period" ASC`;
      const result = await pool.query(q, params);

      return (result.rows || []).map((r: any) => ({ period: r.period instanceof Date ? r.period.toISOString() : r.period, total: Number(r.total), passed: Number(r.passed) }));
    },
  };
}

export function toBoolean(value: number | boolean) {
  return value === true || value === 1;
}

function one<T>(result: { rows: unknown[] }) {
  return result.rows[0] ? normalizeRow(result.rows[0]) as T : undefined;
}

function many<T>(result: { rows: unknown[] }) {
  return result.rows.map((row) => normalizeRow(row) as T);
}

function normalizeRow(row: unknown) {
  if (!row || typeof row !== "object") {
    return row;
  }

  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [key, value instanceof Date ? value.toISOString() : value]),
  );
}

export async function upsertMetricSourceConfig(
  teamId: string,
  config: {
    source: string;
    enabled: boolean;
    settings: {
      organization: string;
      project: string;
      categoryMap: {
        unit: { runTitleIncludes: string };
        api: { runTitleIncludes: string };
        ui: { runTitleIncludes: string };
      };
    };
  },
) {
  const pool = openPostgresPool(getDatabaseUrl());
  try {
    await persistMetricSourceConfig(pool, teamId, config.source, JSON.stringify(config.settings), config.enabled);
  } finally {
    await pool.end();
  }
}

async function persistMetricSourceConfig(
  pool: Pool,
  teamId: string,
  source: string,
  settings: string | { organization: string; project: string; categoryMap: { unit: { runTitleIncludes: string }; api: { runTitleIncludes: string }; ui: { runTitleIncludes: string } } },
  enabled: number | boolean | undefined,
) {
  await pool.query(
    `INSERT INTO "MetricSourceConfig" ("id", "teamId", "source", "settings", "enabled", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, now(), now())
     ON CONFLICT ("teamId", "source") DO UPDATE SET "settings" = excluded."settings", "enabled" = excluded."enabled", "updatedAt" = now()`,
    [randomUUID(), teamId, source, typeof settings === "string" ? settings : JSON.stringify(settings), enabled ?? false],
  );
}
