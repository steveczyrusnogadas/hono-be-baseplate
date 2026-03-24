import { Hono } from "hono";
import { config } from "./config";
import { auth } from "./lib/auth";
import { cors } from "hono/cors";
import type { AppEnv } from "./types";
import { healthRoutes } from "./routes/health";
import { authRoutes } from "./routes/auth";
import { sessionRoutes } from "./routes/session";
import { testingRoutes } from "./routes/testing";

const app = new Hono<AppEnv>();

app.use("*", async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    c.set("user", null);
    c.set("session", null);
    await next();
    return;
  }
  c.set("user", session.user);
  c.set("session", session.session);
  await next();
});

app.use(
  "/api/auth/*", // or replace with "*" to enable cors for all routes
  cors({
    origin: config.cors.origins,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["POST", "GET", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  }),
);

app.route("/", healthRoutes);
app.route("/", authRoutes);
app.route("/", sessionRoutes);
app.route("/", testingRoutes);

export default {
  port: config.server.port,
  fetch: app.fetch,
};
