// JSON Schema for Fastify (for validation and Swagger docs)
export const getJobTitlesByDepartmentSchema = {
  querystring: {
    type: 'object',
    properties: {
      departmentId: {
        type: 'string',
        description: 'Department ID to filter job titles',
      },
    },
    required: ['departmentId'],
    additionalProperties: false,
  },
  tags: ['Job Titles'],
  response: {
    200: {
      description: 'List of job titles for the department',
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Job title ID',
          },
          name: {
            type: 'string',
            description: 'Job title name',
          },
          userCount: {
            type: 'number',
            description: 'Number of active users with this job title in the department',
          },
        },
      },
    },
  },
}

// TypeScript type for the querystring
export interface GetJobTitlesByDepartmentQuery {
  departmentId: string
}
