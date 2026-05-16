import type { DatabaseSync } from "node:sqlite";
import type { Goal, GoalWithOwner, MetricSource, QaMetric, Team, TestSuite, User } from "../domain/types.js";

export type PublicTeam = Pick<Team, "id" | "name">;
export type PublicUser = Pick<User, "id" | "username" | "displayName">;
export type MetricSourceConfig = {
  id: string;
  teamId: string;
  source: MetricSource;
  settings: string;
  enabled: number;
  createdAt: string;
  updatedAt: string;
};

export type DashboardRepository = {
  findTeam(teamId: string): Team | undefined;
  findTeamByJoinCode(joinCode: string): Team | undefined;
  findUser(userId: string): User | undefined;
  findUserByUsername(username: string): User | undefined;
  findMembership(userId: string, teamId: string): { userId: string; teamId: string } | undefined;
  findTeamsByUser(userId: string): PublicTeam[];
  createUser(user: User): void;
  createMembership(userId: string, teamId: string): void;
  createGoal(goal: Goal): void;
  findGoal(goalId: string): Goal | undefined;
  findMetricSourceConfig(teamId: string, source: MetricSource): MetricSourceConfig | undefined;
  replaceMetricsBySource(teamId: string, source: MetricSource, metrics: QaMetric[]): void;
  findTestSuitesByTeam(teamId: string): TestSuite[];
  findMetricsByTeam(teamId: string): QaMetric[];
  findGoalsByTeam(teamId: string): GoalWithOwner[];
};

export function createSqliteRepository(db: DatabaseSync): DashboardRepository {
  return {
    findTeam(teamId) {
      return db.prepare("SELECT * FROM Team WHERE id = ?").get(teamId) as Team | undefined;
    },
    findTeamByJoinCode(joinCode) {
      return db.prepare("SELECT * FROM Team WHERE joinCode = ?").get(joinCode) as Team | undefined;
    },
    findUser(userId) {
      return db.prepare("SELECT * FROM User WHERE id = ?").get(userId) as User | undefined;
    },
    findUserByUsername(username) {
      return db.prepare("SELECT * FROM User WHERE lower(username) = lower(?)").get(username) as User | undefined;
    },
    findMembership(userId, teamId) {
      return db
        .prepare("SELECT userId, teamId FROM TeamMembership WHERE userId = ? AND teamId = ?")
        .get(userId, teamId) as { userId: string; teamId: string } | undefined;
    },
    findTeamsByUser(userId) {
      return db
        .prepare(
          `SELECT Team.id, Team.name
           FROM Team
           JOIN TeamMembership ON TeamMembership.teamId = Team.id
           WHERE TeamMembership.userId = ?
           ORDER BY Team.name ASC`,
        )
        .all(userId) as PublicTeam[];
    },
    createUser(user) {
      db.prepare(
        `INSERT INTO User (id, username, displayName, passwordHash, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?)`,
      ).run(user.id, user.username, user.displayName, user.passwordHash ?? null, user.createdAt, user.updatedAt);
    },
    createMembership(userId, teamId) {
      db.prepare(
        `INSERT INTO TeamMembership (userId, teamId)
         VALUES (?, ?)
         ON CONFLICT(userId, teamId) DO NOTHING`,
      ).run(userId, teamId);
    },
    createGoal(goal) {
      db.prepare(
        `INSERT INTO Goal (
          id, teamId, ownerId, scope, parentGoalId, title, description, metricType, testCategory,
          currentValue, targetValue, unit, dueDate, status, createdAt, updatedAt
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
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
      );
    },
    findGoal(goalId) {
      return db.prepare("SELECT * FROM Goal WHERE id = ?").get(goalId) as Goal | undefined;
    },
    findMetricSourceConfig(teamId, source) {
      return db
        .prepare("SELECT * FROM MetricSourceConfig WHERE teamId = ? AND source = ?")
        .get(teamId, source) as MetricSourceConfig | undefined;
    },
    replaceMetricsBySource(teamId, source, metrics) {
      db.exec("BEGIN");
      try {
        db.prepare("DELETE FROM QaMetric WHERE teamId = ? AND source = ?").run(teamId, source);
        const insert = db.prepare(
          `INSERT INTO QaMetric (
            id, teamId, testSuiteId, category, kind, status, value, unit, source, measuredAt, createdAt, updatedAt
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        );
        for (const metric of metrics) {
          insert.run(
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
          );
        }
        db.exec("COMMIT");
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    },
    findTestSuitesByTeam(teamId) {
      return db
        .prepare("SELECT * FROM TestSuite WHERE teamId = ? ORDER BY category ASC")
        .all(teamId) as TestSuite[];
    },
    findMetricsByTeam(teamId) {
      return db
        .prepare("SELECT * FROM QaMetric WHERE teamId = ? ORDER BY category ASC, kind ASC")
        .all(teamId) as QaMetric[];
    },
    findGoalsByTeam(teamId) {
      return db
        .prepare(
          `SELECT Goal.*, User.username AS ownerUsername, User.displayName AS ownerDisplayName
           FROM Goal
           JOIN User ON User.id = Goal.ownerId
           WHERE Goal.teamId = ?
           ORDER BY Goal.scope ASC, Goal.createdAt ASC`,
        )
        .all(teamId) as GoalWithOwner[];
    },
  };
}

export function toBoolean(value: number) {
  return value === 1;
}
