// JSON Schema for Fastify (for validation and Swagger docs)
export const dashboardStatsSchema = {
  querystring: {
    type: 'object',
    properties: {
      days: {
        type: 'integer',
        minimum: 1,
        maximum: 365,
        default: 30,
        description: 'Number of days to include in statistics (default: 30)',
      },
    },
    additionalProperties: false,
  },
}

// TypeScript type for the querystring
export interface DashboardStatsQuery {
  days?: number
}
