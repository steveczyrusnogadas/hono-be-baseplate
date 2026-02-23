import type { Context } from 'hono'
import { env as honoEnv } from 'hono/adapter'
import { z } from 'zod'

const appEnvSchema = z.enum([
  'local',
  'development',
  'staging',
  'production',
  'test',
])

const envSchema = z.object({
  APP_NAME: z.string().trim().min(1).default('be-baseplate'),
  APP_ENV: appEnvSchema.default('development'),
  APP_PORT: z.coerce.number().int().min(1).max(65535).default(3000),
})

type RawEnv = z.input<typeof envSchema>
type EnvInput = Record<string, unknown>

const formatIssues = (issues: z.core.$ZodIssue[]) =>
  issues
    .map((issue) => {
      const key = issue.path.join('.') || 'ENV'
      return `${key}: ${issue.message}`
    })
    .join('\n')

export const parseConfig = (rawEnv: EnvInput) => {
  const parsed = envSchema.safeParse(rawEnv)
  if (!parsed.success) {
    throw new Error(`Invalid environment configuration:\n${formatIssues(parsed.error.issues)}`)
  }

  const values = parsed.data

  return Object.freeze({
    app: Object.freeze({
      name: values.APP_NAME,
      env: values.APP_ENV,
    }),
    server: Object.freeze({
      port: values.APP_PORT,
    }),
  })
}

export type AppConfig = ReturnType<typeof parseConfig>

export const getConfigFromContext = (c: Context): AppConfig =>
  parseConfig(honoEnv<RawEnv>(c) as EnvInput)

export const config: AppConfig = parseConfig(process.env as EnvInput)
