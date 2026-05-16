import { Router } from "express";
import { db } from "../db/sqlite.js";
import { createSqliteRepository } from "../db/repository.js";
import { clearSession, createUserRecord, getCurrentUser, publicUser, startSession, verifyPassword } from "../services/authService.js";

export const authRoutes = Router();
const repository = createSqliteRepository(db);

authRoutes.post("/sign-up", (req, res) => {
  const username = typeof req.body?.username === "string" ? req.body.username.trim() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  const displayName =
    typeof req.body?.displayName === "string" && req.body.displayName.trim().length > 0 ? req.body.displayName.trim() : null;
  const fields: Record<string, string> = {};

  if (username.length < 3 || username.length > 32) {
    fields.username = "Username must be 3 to 32 characters";
  }
  if (password.length < 8) {
    fields.password = "Password must be at least 8 characters";
  }

  if (Object.keys(fields).length > 0) {
    res.status(400).json({ error: "Validation failed", fields });
    return;
  }

  if (repository.findUserByUsername(username)) {
    res.status(409).json({ error: "Username already exists" });
    return;
  }

  const user = createUserRecord(username, password, displayName);
  repository.createUser(user);
  startSession(res, user.id);
  res.status(201).json({ user: publicUser(user) });
});

authRoutes.post("/sign-in", (req, res) => {
  const username = typeof req.body?.username === "string" ? req.body.username.trim() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  const user = username ? repository.findUserByUsername(username) : undefined;

  if (!user || !verifyPassword(password, user.passwordHash)) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }

  startSession(res, user.id);
  res.json({ user: publicUser(user), teams: repository.findTeamsByUser(user.id) });
});

authRoutes.post("/sign-out", (req, res) => {
  clearSession(req, res);
  res.status(204).send();
});

authRoutes.get("/me", (req, res) => {
  const user = getCurrentUser(repository, req);

  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }

  res.json({ user: publicUser(user), teams: repository.findTeamsByUser(user.id) });
});
