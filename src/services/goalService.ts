import { randomUUID } from "node:crypto";
import type { DashboardRepository } from "../db/repository.js";
import { formatGoalScope, formatGoalStatus, formatMetricKind, formatTestCategory } from "../domain/apiFormat.js";
import type { Goal, GoalScope, MetricKind, TestCategory } from "../domain/types.js";

const scopeMap: Record<string, GoalScope> = {
  team: "TEAM",
  individual: "INDIVIDUAL",
};

const metricKindMap: Record<string, MetricKind> = {
  "tests-passing": "TESTS_PASSING",
  "test-coverage": "TEST_COVERAGE",
};

const testCategoryMap: Record<string, TestCategory> = {
  unit: "UNIT",
  api: "API",
  ui: "UI",
};

export type GoalValidationResult =
  | { ok: true; goal: Goal }
  | { ok: false; status: number; body: { error: string; fields?: Record<string, string> } };

export async function validateAndBuildGoal(repository: DashboardRepository, teamId: string, body: unknown): Promise<GoalValidationResult> {
  const input = isRecord(body) ? body : {};
  const fields: Record<string, string> = {};
  const title = typeof input.title === "string" ? input.title.trim() : "";
  const description = typeof input.description === "string" && input.description.trim() ? input.description.trim() : null;
  const scope = typeof input.scope === "string" ? scopeMap[input.scope] : undefined;
  const ownerId = typeof input.ownerId === "string" ? input.ownerId : "";
  const parentGoalId = typeof input.parentGoalId === "string" && input.parentGoalId.trim() ? input.parentGoalId.trim() : null;
  const metricType = typeof input.metricType === "string" ? metricKindMap[input.metricType] : input.metricType == null ? null : undefined;
  const testCategory = typeof input.testCategory === "string" ? testCategoryMap[input.testCategory] : input.testCategory == null ? null : undefined;
  const currentValue = typeof input.currentValue === "number" ? input.currentValue : Number.NaN;
  const targetValue = typeof input.targetValue === "number" ? input.targetValue : Number.NaN;
  const unit = typeof input.unit === "string" && input.unit.trim() ? input.unit.trim() : null;
  const dueDate = typeof input.dueDate === "string" && input.dueDate.trim() ? input.dueDate.trim() : null;

  if (!title || title.length > 120) {
    fields.title = "Title is required and must be 120 characters or less";
  }
  if (!scope) {
    fields.scope = "Scope must be team or individual";
  }
  if (!ownerId || !(await repository.findMembership(ownerId, teamId))) {
    fields.ownerId = "Owner must be a team member";
  }
  if (metricType === undefined) {
    fields.metricType = "Metric type must be tests-passing or test-coverage";
  }
  if (testCategory === undefined) {
    fields.testCategory = "Test category must be unit, api, or ui";
  }
  if (!Number.isFinite(currentValue)) {
    fields.currentValue = "Current value is required";
  }
  if (!Number.isFinite(targetValue)) {
    fields.targetValue = "Target value is required";
  } else if (targetValue === 0) {
    fields.targetValue = "Target value must not be 0";
  }
  if (dueDate && Number.isNaN(Date.parse(dueDate))) {
    fields.dueDate = "Due date must be an ISO date string";
  }

  if (scope === "TEAM" && parentGoalId) {
    fields.parentGoalId = "Team goals must not include a parent goal";
  }

  if (scope === "INDIVIDUAL" && parentGoalId) {
    const parentGoal = await repository.findGoal(parentGoalId);
    if (!parentGoal || parentGoal.teamId !== teamId || parentGoal.scope !== "TEAM") {
      fields.parentGoalId = "Parent goal must be a team goal in the same team";
    }
  }

  if (Object.keys(fields).length > 0 || !scope || metricType === undefined || testCategory === undefined) {
    return { ok: false, status: 400, body: { error: "Validation failed", fields } };
  }

  const now = new Date().toISOString();
  return {
    ok: true,
    goal: {
      id: `goal-${randomUUID()}`,
      teamId,
      ownerId,
      scope,
      parentGoalId,
      title,
      description,
      metricType,
      testCategory,
      currentValue,
      targetValue,
      unit,
      dueDate,
      status: "ACTIVE",
      createdAt: now,
      updatedAt: now,
    },
  };
}

export function formatGoal(goal: Goal) {
  return {
    id: goal.id,
    teamId: goal.teamId,
    ownerId: goal.ownerId,
    scope: formatGoalScope(goal.scope),
    parentGoalId: goal.parentGoalId,
    title: goal.title,
    description: goal.description,
    metricType: goal.metricType ? formatMetricKind(goal.metricType) : null,
    testCategory: goal.testCategory ? formatTestCategory(goal.testCategory) : null,
    currentValue: goal.currentValue,
    targetValue: goal.targetValue,
    unit: goal.unit,
    dueDate: goal.dueDate,
    status: formatGoalStatus(goal.status),
    createdAt: goal.createdAt,
    updatedAt: goal.updatedAt,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
