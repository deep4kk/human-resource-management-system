import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

export function hashPassword(password: string): string {
  return crypto
    .createHash("sha256")
    .update(password + "hrms_salt_toyo")
    .digest("hex");
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export function generateToken(userId: number, role: string): string {
  const payload = { userId, role, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 };
  const data = JSON.stringify(payload);
  const signature = crypto
    .createHmac("sha256", "hrms_jwt_secret_toyo_kambocha")
    .update(data)
    .digest("hex");
  return Buffer.from(data).toString("base64") + "." + signature;
}

export function verifyToken(
  token: string,
): { userId: number; role: string } | null {
  try {
    const [dataB64, signature] = token.split(".");
    if (!dataB64 || !signature) return null;
    const data = Buffer.from(dataB64, "base64").toString();
    const expectedSig = crypto
      .createHmac("sha256", "hrms_jwt_secret_toyo_kambocha")
      .update(data)
      .digest("hex");
    if (signature !== expectedSig) return null;
    const payload = JSON.parse(data);
    if (payload.exp < Date.now()) return null;
    return { userId: payload.userId, role: payload.role };
  } catch {
    return null;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized", message: "Missing token" });
    return;
  }
  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  if (!payload) {
    res
      .status(401)
      .json({ error: "Unauthorized", message: "Invalid or expired token" });
    return;
  }
  (req as any).user = payload;
  next();
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || !roles.includes(user.role)) {
      res
        .status(403)
        .json({ error: "Forbidden", message: "Insufficient permissions" });
      return;
    }
    next();
  };
}
