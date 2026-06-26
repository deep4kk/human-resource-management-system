import { Request, Response, NextFunction } from "express";

declare global {
  namespace Express {
    interface Request {
      companyId?: string;
    }
  }
}

export function injectCompanyId(req: Request, _res: Response, next: NextFunction) {
  if (req.user?.companyId) {
    req.companyId = req.user.companyId;
  }
  next();
}

export function requireCompanyId(req: Request, res: Response, next: NextFunction) {
  if (!req.companyId) {
    res.status(400).json({ error: "Bad Request", message: "Company context required" });
    return;
  }
  next();
}
