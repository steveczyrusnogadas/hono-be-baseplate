import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../database";
import * as authSchema from "../database/schema/auth";
import { config } from "../config";
import type { AppEnv } from "../types";

export const testingRoutes = new Hono<AppEnv>().delete("/testing/users/by-email/:email", async (c) => {
  if (!["local", "development", "test"].includes(config.app.env)) {
    return c.json({ error: "Cleanup endpoint disabled for this environment" }, 403);
  }

  const email = decodeURIComponent(c.req.param("email"));
  const deletedUsers = await db
    .delete(authSchema.user)
    .where(eq(authSchema.user.email, email))
    .returning({ id: authSchema.user.id });

  if (deletedUsers.length === 0) {
    return c.body(null, 404);
  }

  return c.body(null, 204);
});
