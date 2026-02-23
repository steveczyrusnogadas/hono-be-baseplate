import { describe, expect, it } from "bun:test";
import { join } from "node:path";

type LocalEnv = {
  url: string;
  clientOrigin: string;
  authName: string;
  authPassword: string;
  authEmail: string;
  authEmailDomain: string;
};

type JsonResponse = {
  status: number;
  json: unknown;
};

class CookieJar {
  private readonly cookies = new Map<string, string>();

  ingest(setCookies: string[]) {
    for (const cookie of setCookies) {
      const [token] = cookie.split(";");
      if (!token) continue;
      const [name, ...valueParts] = token.split("=");
      if (!name || valueParts.length === 0) continue;
      this.cookies.set(name.trim(), valueParts.join("=").trim());
    }
  }

  toHeader() {
    return [...this.cookies.entries()].map(([name, value]) => `${name}=${value}`).join("; ");
  }

  hasCookies() {
    return this.cookies.size > 0;
  }
}

const parseLocalEnvYaml = (raw: string): Record<string, string> => {
  const result: Record<string, string> = {};
  const lines = raw.split(/\r?\n/);
  let currentName: string | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("- name:")) {
      currentName = trimmed.replace("- name:", "").trim();
      continue;
    }

    if (currentName && trimmed.startsWith("value:")) {
      const rawValue = trimmed.replace("value:", "").trim();
      const cleanValue = rawValue.replace(/^['"]|['"]$/g, "");
      result[currentName] = cleanValue;
      currentName = null;
    }
  }

  return result;
};

const loadLocalEnv = async (): Promise<LocalEnv> => {
  const localEnvPath = join(process.cwd(), "api-collection/environments/local.yml");
  const localEnvRaw = await Bun.file(localEnvPath).text();
  const values = parseLocalEnvYaml(localEnvRaw);

  return {
    url: values.url || "http://localhost:3001",
    clientOrigin: values.client_origin || "http://localhost:3001",
    authName: values.auth_name || "Steve",
    authPassword: values.auth_password || "password1234",
    authEmailDomain: values.auth_email_domain || "example.test",
    authEmail: values.auth_email || `e2e-auth@${values.auth_email_domain || "example.test"}`,
  };
};

const getSetCookieHeaders = (headers: Headers): string[] => {
  const maybeBunHeaders = headers as Headers & { getSetCookie?: () => string[] };
  if (typeof maybeBunHeaders.getSetCookie === "function") {
    return maybeBunHeaders.getSetCookie();
  }

  const single = headers.get("set-cookie");
  return single ? [single] : [];
};

const requestJson = async (
  jar: CookieJar,
  url: string,
  method: string,
  {
    body,
    headers,
  }: {
    body?: unknown;
    headers?: Record<string, string>;
  } = {},
): Promise<JsonResponse> => {
  const cookieHeader = jar.toHeader();
  const requestHeaders: Record<string, string> = {
    ...(headers || {}),
  };

  if (cookieHeader) {
    requestHeaders.cookie = cookieHeader;
  }

  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  jar.ingest(getSetCookieHeaders(response.headers));

  const textBody = await response.text();
  let json: unknown = null;
  if (textBody.length > 0) {
    try {
      json = JSON.parse(textBody);
    } catch {
      json = textBody;
    }
  }

  return { status: response.status, json };
};

const deleteTestUser = async (baseUrl: string, email: string) =>
  fetch(`${baseUrl}/testing/users/by-email/${encodeURIComponent(email)}`, {
    method: "DELETE",
  });

describe("API e2e auth flow", () => {
  it("runs root -> sign-up -> sign-in -> session and cleans up", async () => {
    const localEnv = await loadLocalEnv();
    const user = {
      name: localEnv.authName,
      email: localEnv.authEmail,
      password: localEnv.authPassword,
    };
    const jar = new CookieJar();

    const root = await requestJson(jar, `${localEnv.url}/`, "GET");
    expect(root.status).toBe(200);
    expect(root.json).toHaveProperty("message");

    const preCleanup = await deleteTestUser(localEnv.url, user.email);
    expect([200, 204, 404]).toContain(preCleanup.status);

    let signedUp = false;

    try {
      const signUp = await requestJson(jar, `${localEnv.url}/api/auth/sign-up/email`, "POST", {
        headers: {
          "content-type": "application/json",
          origin: localEnv.clientOrigin,
        },
        body: {
          name: user.name,
          email: user.email,
          password: user.password,
        },
      });
      expect([200, 201]).toContain(signUp.status);
      signedUp = true;

      const signIn = await requestJson(jar, `${localEnv.url}/api/auth/sign-in/email`, "POST", {
        headers: {
          "content-type": "application/json",
          origin: localEnv.clientOrigin,
        },
        body: {
          email: user.email,
          password: user.password,
          rememberMe: true,
        },
      });
      expect(signIn.status).toBe(200);
      expect(jar.hasCookies()).toBe(true);

      const session = await requestJson(jar, `${localEnv.url}/session`, "GET");
      expect(session.status).toBe(200);
      expect(session.json).toHaveProperty("user");
      expect((session.json as { user: { email: string } }).user.email).toBe(user.email);
    } finally {
      const cleanup = await deleteTestUser(localEnv.url, user.email);
      if (signedUp) {
        expect([200, 204]).toContain(cleanup.status);
      } else {
        expect([200, 204, 404]).toContain(cleanup.status);
      }
    }
  });
});
