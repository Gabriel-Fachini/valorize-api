// JSON Schema for Fastify (for validation and Swagger docs)
export const dashboardStatsSchema = {
  querystring: {
    type: 'object',
    properties: {
      startDate: {
        type: 'string',
        format: 'date',
        description: 'Start date for statistics (ISO 8601 format: YYYY-MM-DD)',
      },
      endDate: {
        type: 'string',
        format: 'date',
        description: 'End date for statistics (ISO 8601 format: YYYY-MM-DD)',
      },
      departmentId: {
        type: 'string',
        description: 'Filter by department ID',
      },
      jobTitleId: {
        type: 'string',
        description: 'Filter by job title ID',
      },
    },
    additionalProperties: false,
  },
}

// TypeScript type for the querystring
export interface DashboardStatsQuery {
  startDate?: string
  endDate?: string
  departmentId?: string
  jobTitleId?: string
}
