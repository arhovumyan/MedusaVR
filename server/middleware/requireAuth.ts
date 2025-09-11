import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization?.split(" ");
  
  if (auth?.[0] !== "Bearer" || !auth[1]) {
    return res.sendStatus(401);
  }
  
  try {
    const payload = jwt.verify(auth[1], process.env.JWT_SECRET || "your-secret-key-change-this-in-production");
    const userId = (payload as any).userId;
    // Normalize: expose both id and uid so all routes work consistently
    // @ts-ignore
    req.user = { id: userId, uid: userId };
    next();
  } catch (error) {
    console.log("[requireAuth] JWT verification failed:", error instanceof Error ? error.message : 'Unknown error');
    res.sendStatus(401);
  }
}
