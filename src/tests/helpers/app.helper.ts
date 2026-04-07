import { FastifyInstance } from 'fastify'
import { buildApp } from '@/config/app'

export async function createTestApp(): Promise<FastifyInstance> {
  const app = await buildApp()
  await app.ready()
  return app
}

export async function closeTestApp(app: FastifyInstance): Promise<void> {
  await app.close()
}
