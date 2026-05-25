import type { Pool } from "pg";
import type { Goal, GoalWithOwner, MetricSource, QaMetric, Team, TestSuite, User } from "../domain/types.js";

export type PublicTeam = Pick<Team, "id" | "name">;
export type PublicUser = Pick<User, "id" | "username" | "displayName">;
export type MetricSourceConfig = {
  id: string;
  teamId: string;
  source: MetricSource;
  settings: string;
  enabled: number | boolean;
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
  createMembership(userId: string, teamId: string): Promise<void>;
  createGoal(goal: Goal): Promise<void>;
  findGoal(goalId: string): Promise<Goal | undefined>;
  findMetricSourceConfig(teamId: string, source: MetricSource): Promise<MetricSourceConfig | undefined>;
  replaceMetricsBySource(teamId: string, source: MetricSource, metrics: QaMetric[]): Promise<void>;
  findTestSuitesByTeam(teamId: string): Promise<TestSuite[]>;
  findMetricsByTeam(teamId: string): Promise<QaMetric[]>;
  findGoalsByTeam(teamId: string): Promise<GoalWithOwner[]>;
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
    async findGoal(goalId) {
      return one<Goal>(await pool.query(`SELECT * FROM "Goal" WHERE "id" = $1`, [goalId]));
    },
    async findMetricSourceConfig(teamId, source) {
      return one<MetricSourceConfig>(
        await pool.query(`SELECT * FROM "MetricSourceConfig" WHERE "teamId" = $1 AND "source" = $2`, [teamId, source]),
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
              "id", "teamId", "testSuiteId", "category", "kind", "status", "value", "unit", "source", "measuredAt", "createdAt", "updatedAt"
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
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
