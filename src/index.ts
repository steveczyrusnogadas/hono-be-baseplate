import { Hono } from 'hono'
import { config } from './config'
import { auth } from './lib/auth'
import { cors } from 'hono/cors'
import { eq } from 'drizzle-orm'
import { db } from './database'
import * as authSchema from './database/schema/auth'

const app = new Hono<{
	Variables: {
		user: typeof auth.$Infer.Session.user | null;
		session: typeof auth.$Infer.Session.session | null
	}
}>();

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
		origin: "http://localhost:3001", // replace with your origin
		allowHeaders: ["Content-Type", "Authorization"],
		allowMethods: ["POST", "GET", "OPTIONS"],
		exposeHeaders: ["Content-Length"],
		maxAge: 600,
		credentials: true,
	}),
);

app.get('/', (c) => {
  return c.json({ message: 'Hello Hono!' })
})

app.on(["POST", "GET"], "/api/auth/*", (c) => {
	return auth.handler(c.req.raw);
});

app.get("/session", (c) => {
	const session = c.get("session")
	const user = c.get("user")
	
	if(!user) return c.body(null, 401);
  	return c.json({
	  session,
	  user
	});
});

app.delete('/testing/users/by-email/:email', async (c) => {
	if (!['local', 'development', 'test'].includes(config.app.env)) {
		return c.json({ error: 'Cleanup endpoint disabled for this environment' }, 403)
	}

	const email = decodeURIComponent(c.req.param('email'))
	const deletedUsers = await db
		.delete(authSchema.user)
		.where(eq(authSchema.user.email, email))
		.returning({ id: authSchema.user.id })

	if (deletedUsers.length === 0) {
		return c.body(null, 404)
	}

	return c.body(null, 204)
})


export default {
  port: config.server.port,
  fetch: app.fetch,
}
