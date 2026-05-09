import type { DatabaseSync } from "node:sqlite";
import type { GoalWithOwner, QaMetric, Team, TestSuite } from "../domain/types.js";

export type DashboardRepository = {
  findTeam(teamId: string): Team | undefined;
  findTestSuitesByTeam(teamId: string): TestSuite[];
  findMetricsByTeam(teamId: string): QaMetric[];
  findGoalsByTeam(teamId: string): GoalWithOwner[];
};

export function createSqliteRepository(db: DatabaseSync): DashboardRepository {
  return {
    findTeam(teamId) {
      return db.prepare("SELECT * FROM Team WHERE id = ?").get(teamId) as Team | undefined;
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
