import { Hono } from "hono";
import { auth } from "../lib/auth";
import type { AppEnv } from "../types";

export const authRoutes = new Hono<AppEnv>().on(["POST", "GET"], "/api/auth/*", (c) => {
  return auth.handler(c.req.raw);
});
