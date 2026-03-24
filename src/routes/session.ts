import { Hono } from "hono";
import type { AppEnv } from "../types";

export const sessionRoutes = new Hono<AppEnv>().get("/session", (c) => {
  const session = c.get("session");
  const user = c.get("user");

  if (!user) return c.body(null, 401);
  return c.json({
    session,
    user,
  });
});
