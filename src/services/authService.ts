import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import type { Request, Response } from "express";
import type { DashboardRepository, PublicUser } from "../db/repository.js";
import type { User } from "../domain/types.js";

const sessionCookieName = "qa_dashboard_session";
const sessionTtlMs = 1000 * 60 * 60 * 24 * 7;
const sessions = new Map<string, { userId: string; expiresAt: number }>();

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, passwordHash: string | null | undefined) {
  if (!passwordHash) {
    return false;
  }

  const [salt, storedHash] = passwordHash.split(":");
  if (!salt || !storedHash) {
    return false;
  }

  const candidate = Buffer.from(scryptSync(password, salt, 64).toString("hex"));
  const stored = Buffer.from(storedHash);
  return candidate.length === stored.length && timingSafeEqual(candidate, stored);
}

export function createUserRecord(username: string, password: string, displayName: string | null): User {
  const now = new Date().toISOString();

  return {
    id: `user-${randomUUID()}`,
    username,
    displayName,
    passwordHash: hashPassword(password),
    createdAt: now,
    updatedAt: now,
  };
}

export function publicUser(user: User): PublicUser {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
  };
}

export function startSession(res: Response, userId: string) {
  const sessionId = randomUUID();
  sessions.set(sessionId, { userId, expiresAt: Date.now() + sessionTtlMs });
  res.cookie(sessionCookieName, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionTtlMs,
  });
}

export function clearSession(req: Request, res: Response) {
  const sessionId = getSessionId(req);
  if (sessionId) {
    sessions.delete(sessionId);
  }

  res.clearCookie(sessionCookieName, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

export async function getCurrentUser(repository: DashboardRepository, req: Request) {
  const sessionId = getSessionId(req);
  if (!sessionId) {
    return undefined;
  }

  const session = sessions.get(sessionId);
  if (!session || session.expiresAt <= Date.now()) {
    sessions.delete(sessionId);
    return undefined;
  }

  const user = await repository.findUser(session.userId);
  if (!user) {
    sessions.delete(sessionId);
    return undefined;
  }

  return user;
}

function getSessionId(req: Request) {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) {
    return undefined;
  }

  const cookies = cookieHeader.split(";").map((part) => part.trim());
  const sessionCookie = cookies.find((cookie) => cookie.startsWith(`${sessionCookieName}=`));
  return sessionCookie ? decodeURIComponent(sessionCookie.slice(sessionCookieName.length + 1)) : undefined;
}
