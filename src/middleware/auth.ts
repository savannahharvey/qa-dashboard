import type { NextFunction, Request, Response } from "express";
import type { DashboardRepository } from "../db/repository.js";
import type { User } from "../domain/types.js";
import { getCurrentUser } from "../services/authService.js";

declare module "express-serve-static-core" {
  interface Request {
    currentUser?: User;
  }
}

export function requireAuth(repository: DashboardRepository) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = getCurrentUser(repository, req);

    if (!user) {
      res.status(401).json({ error: "Not signed in" });
      return;
    }

    req.currentUser = user;
    next();
  };
}

export function requireTeamMembership(repository: DashboardRepository) {
  const auth = requireAuth(repository);

  return (req: Request, res: Response, next: NextFunction) => {
    auth(req, res, () => {
      const user = req.currentUser;
      const teamId = String(req.params.teamId);

      if (!user) {
        res.status(401).json({ error: "Not signed in" });
        return;
      }

      if (!repository.findTeam(teamId)) {
        res.status(404).json({ error: "Team not found" });
        return;
      }

      if (!repository.findMembership(user.id, teamId)) {
        res.status(403).json({ error: "Forbidden" });
        return;
      }

      next();
    });
  };
}
