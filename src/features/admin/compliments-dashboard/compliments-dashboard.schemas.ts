/**
 * @fileoverview JSON Schemas for Compliments Dashboard endpoints
 *
 * These schemas are used by Fastify for request/response validation
 */

/**
 * Period schema
 */
const periodSchema = {
  type: 'object',
  properties: {
    startDate: { type: 'string', format: 'date-time' },
    endDate: { type: 'string', format: 'date-time' },
    previousPeriod: {
      type: 'object',
      properties: {
        startDate: { type: 'string', format: 'date-time' },
        endDate: { type: 'string', format: 'date-time' }
      },
      required: ['startDate', 'endDate']
    }
  },
  required: ['startDate', 'endDate', 'previousPeriod']
}

/**
 * Overview metrics schema
 */
const overviewSchema = {
  type: 'object',
  properties: {
    totalCompliments: { type: 'number' },
    totalCoinsDistributed: { type: 'number' },
    activeUsers: {
      type: 'object',
      properties: {
        count: { type: 'number' },
        percentage: { type: 'number' },
        total: { type: 'number' }
      },
      required: ['count', 'percentage', 'total']
    },
    avgCoinsPerCompliment: { type: 'number' },
    engagementRate: { type: 'number' },
    comparison: {
      type: 'object',
      properties: {
        complimentsChange: { type: 'number' },
        complimentsChangeLabel: { type: 'string' },
        coinsChange: { type: 'number' },
        coinsChangeLabel: { type: 'string' },
        usersChange: { type: 'number' },
        usersChangeLabel: { type: 'string' }
      },
      required: ['complimentsChange', 'complimentsChangeLabel', 'coinsChange', 'coinsChangeLabel', 'usersChange', 'usersChangeLabel']
    }
  },
  required: ['totalCompliments', 'totalCoinsDistributed', 'activeUsers', 'avgCoinsPerCompliment', 'engagementRate', 'comparison']
}

/**
 * Value distribution schema
 */
const valueDistributionSchema = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      valueId: { type: 'number' },
      valueName: { type: 'string' },
      description: { type: ['string', 'null'] },
      iconName: { type: ['string', 'null'] },
      iconColor: { type: ['string', 'null'] },
      count: { type: 'number' },
      percentage: { type: 'number' },
      totalCoins: { type: 'number' },
      trend: { type: 'string', enum: ['up', 'down', 'stable'] },
      trendPercentage: { type: 'number' }
    },
    required: ['valueId', 'valueName', 'count', 'percentage', 'totalCoins', 'trend', 'trendPercentage']
  }
}

/**
 * Top users schema
 */
const topUsersSchema = {
  type: 'object',
  properties: {
    senders: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          userId: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string' },
          avatar: { type: ['string', 'null'] },
          department: { type: ['string', 'null'] },
          jobTitle: { type: ['string', 'null'] },
          sentCount: { type: 'number' },
          totalCoinsSent: { type: 'number' },
          avgCoinsPerCompliment: { type: 'number' }
        },
        required: ['userId', 'name', 'email', 'sentCount', 'totalCoinsSent', 'avgCoinsPerCompliment']
      }
    },
    receivers: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          userId: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string' },
          avatar: { type: ['string', 'null'] },
          department: { type: ['string', 'null'] },
          jobTitle: { type: ['string', 'null'] },
          receivedCount: { type: 'number' },
          totalCoinsReceived: { type: 'number' },
          avgCoinsPerCompliment: { type: 'number' }
        },
        required: ['userId', 'name', 'email', 'receivedCount', 'totalCoinsReceived', 'avgCoinsPerCompliment']
      }
    },
    balanced: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          userId: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string' },
          avatar: { type: ['string', 'null'] },
          department: { type: ['string', 'null'] },
          sentCount: { type: 'number' },
          receivedCount: { type: 'number' },
          balanceScore: { type: 'number' }
        },
        required: ['userId', 'name', 'email', 'sentCount', 'receivedCount', 'balanceScore']
      }
    }
  },
  required: ['senders', 'receivers', 'balanced']
}

/**
 * Department analytics schema
 */
const departmentAnalyticsSchema = {
  type: 'object',
  properties: {
    departments: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          departmentId: { type: 'string' },
          departmentName: { type: 'string' },
          totalUsers: { type: 'number' },
          activeUsers: { type: 'number' },
          totalCompliments: { type: 'number' },
          avgPerUser: { type: 'number' },
          engagementRate: { type: 'number' },
          topValue: {
            type: ['object', 'null'],
            properties: {
              valueName: { type: 'string' },
              count: { type: 'number' }
            }
          }
        },
        required: ['departmentId', 'departmentName', 'totalUsers', 'activeUsers', 'totalCompliments', 'avgPerUser', 'engagementRate']
      }
    },
    crossDepartmentFlow: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          fromDepartmentId: { type: ['string', 'null'] },
          fromDepartmentName: { type: ['string', 'null'] },
          toDepartmentId: { type: ['string', 'null'] },
          toDepartmentName: { type: ['string', 'null'] },
          complimentCount: { type: 'number' },
          coinAmount: { type: 'number' }
        },
        required: ['complimentCount', 'coinAmount']
      }
    }
  },
  required: ['departments', 'crossDepartmentFlow']
}

/**
 * Temporal patterns schema
 */
const temporalPatternsSchema = {
  type: 'object',
  properties: {
    weeklyTrend: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          weekStart: { type: 'string' },
          weekEnd: { type: 'string' },
          count: { type: 'number' },
          coins: { type: 'number' }
        },
        required: ['weekStart', 'weekEnd', 'count', 'coins']
      }
    },
    dayOfWeekDistribution: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          dayOfWeek: { type: 'number' },
          dayName: { type: 'string' },
          count: { type: 'number' },
          percentage: { type: 'number' }
        },
        required: ['dayOfWeek', 'dayName', 'count', 'percentage']
      }
    },
    hourlyDistribution: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          hour: { type: 'number' },
          count: { type: 'number' },
          percentage: { type: 'number' }
        },
        required: ['hour', 'count', 'percentage']
      }
    },
    monthlyGrowth: {
      type: 'object',
      properties: {
        currentMonth: {
          type: 'object',
          properties: {
            month: { type: 'string' },
            count: { type: 'number' },
            coins: { type: 'number' }
          },
          required: ['month', 'count', 'coins']
        },
        previousMonth: {
          type: 'object',
          properties: {
            month: { type: 'string' },
            count: { type: 'number' },
            coins: { type: 'number' }
          },
          required: ['month', 'count', 'coins']
        },
        growthRate: { type: 'number' }
      },
      required: ['currentMonth', 'previousMonth', 'growthRate']
    }
  },
  required: ['weeklyTrend', 'dayOfWeekDistribution', 'hourlyDistribution', 'monthlyGrowth']
}

/**
 * Insights schema
 */
const insightsSchema = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      type: { type: 'string', enum: ['warning', 'success', 'info'] },
      category: { type: 'string', enum: ['engagement', 'values', 'departments', 'users'] },
      title: { type: 'string' },
      description: { type: 'string' },
      metric: { type: ['number', 'null'] },
      actionable: { type: 'boolean' },
      priority: { type: 'string', enum: ['high', 'medium', 'low'] }
    },
    required: ['type', 'category', 'title', 'description', 'actionable', 'priority']
  }
}

/**
 * Recent activity schema
 */
const recentActivitySchema = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      sender: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          avatar: { type: ['string', 'null'] },
          department: { type: ['string', 'null'] }
        },
        required: ['id', 'name']
      },
      receiver: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          avatar: { type: ['string', 'null'] },
          department: { type: ['string', 'null'] }
        },
        required: ['id', 'name']
      },
      companyValue: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          title: { type: 'string' },
          iconName: { type: ['string', 'null'] },
          iconColor: { type: ['string', 'null'] }
        },
        required: ['id', 'title']
      },
      coins: { type: 'number' },
      message: { type: 'string' },
      createdAt: { type: 'string' },
      timeAgo: { type: 'string' }
    },
    required: ['id', 'sender', 'receiver', 'companyValue', 'coins', 'message', 'createdAt', 'timeAgo']
  }
}

/**
 * Engagement metrics schema
 */
const engagementMetricsSchema = {
  type: 'object',
  properties: {
    participationRate: { type: 'number' },
    averageComplimentsPerUser: { type: 'number' },
    medianCoinsPerCompliment: { type: 'number' },
    inactiveUsers: {
      type: 'object',
      properties: {
        count: { type: 'number' },
        percentage: { type: 'number' },
        list: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              userId: { type: 'string' },
              name: { type: 'string' },
              department: { type: ['string', 'null'] },
              lastActivity: { type: ['string', 'null'] }
            },
            required: ['userId', 'name']
          }
        }
      },
      required: ['count', 'percentage', 'list']
    }
  },
  required: ['participationRate', 'averageComplimentsPerUser', 'medianCoinsPerCompliment', 'inactiveUsers']
}

/**
 * Metadata schema
 */
const metadataSchema = {
  type: 'object',
  properties: {
    generatedAt: { type: 'string', format: 'date-time' },
    executionTime: { type: 'number' },
    filters: {
      type: 'object',
      properties: {
        departmentId: { type: ['string', 'null'] },
        jobTitleId: { type: ['string', 'null'] }
      },
      required: ['departmentId', 'jobTitleId']
    },
    companyInfo: {
      type: 'object',
      properties: {
        totalEmployees: { type: 'number' },
        activeEmployees: { type: 'number' },
        totalValues: { type: 'number' },
        activeValues: { type: 'number' }
      },
      required: ['totalEmployees', 'activeEmployees', 'totalValues', 'activeValues']
    }
  },
  required: ['generatedAt', 'executionTime', 'filters', 'companyInfo']
}

/**
 * Complete dashboard response schema
 */
const dashboardResponseSchema = {
  type: 'object',
  properties: {
    period: periodSchema,
    overview: overviewSchema,
    valuesDistribution: valueDistributionSchema,
    topUsers: topUsersSchema,
    departmentAnalytics: departmentAnalyticsSchema,
    temporalPatterns: temporalPatternsSchema,
    insights: insightsSchema,
    recentActivity: recentActivitySchema,
    engagementMetrics: engagementMetricsSchema,
    metadata: metadataSchema
  },
  required: [
    'period',
    'overview',
    'valuesDistribution',
    'topUsers',
    'departmentAnalytics',
    'temporalPatterns',
    'insights',
    'recentActivity',
    'engagementMetrics',
    'metadata'
  ]
}

/**
 * GET /admin/compliments-dashboard
 */
export const getComplimentsDashboardSchema = {
  tags: ['Admin - Compliments Dashboard'],
  description: 'Get complete compliments dashboard with all metrics',
  querystring: {
    type: 'object',
    properties: {
      startDate: {
        type: 'string',
        format: 'date',
        description: 'Start date (YYYY-MM-DD)'
      },
      endDate: {
        type: 'string',
        format: 'date',
        description: 'End date (YYYY-MM-DD)'
      },
      departmentId: {
        type: 'string',
        description: 'Filter by department ID'
      },
      jobTitleId: {
        type: 'string',
        description: 'Filter by job title ID'
      }
    },
    additionalProperties: false
  },
  response: {
    200: dashboardResponseSchema,
    400: {
      type: 'object',
      properties: {
        error: { type: 'string' },
        message: { type: 'string' }
      }
    },
    401: {
      type: 'object',
      properties: {
        error: { type: 'string' },
        message: { type: 'string' }
      }
    },
    403: {
      type: 'object',
      properties: {
        error: { type: 'string' },
        message: { type: 'string' }
      }
    },
    500: {
      type: 'object',
      properties: {
        error: { type: 'string' },
        message: { type: 'string' }
      }
    }
  }
}

/**
 * Network Graph Schemas
 */

// Node schema
const networkNodeSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    avatar: { type: ['string', 'null'] },
    role: { type: 'string' },
    department: { type: 'string' },
    complimentsGiven: { type: 'number' },
    complimentsReceived: { type: 'number' }
  },
  required: ['id', 'name', 'avatar', 'role', 'department', 'complimentsGiven', 'complimentsReceived']
}

// Link schema
const networkLinkSchema = {
  type: 'object',
  properties: {
    source: { type: 'string' },
    target: { type: 'string' },
    value: { type: 'number' },
    compliments: {
      type: 'array',
      items: { type: 'string' }
    }
  },
  required: ['source', 'target', 'value', 'compliments']
}

// Response schema
const networkGraphResponseSchema = {
  type: 'object',
  properties: {
    nodes: {
      type: 'array',
      items: networkNodeSchema
    },
    links: {
      type: 'array',
      items: networkLinkSchema
    }
  },
  required: ['nodes', 'links']
}

/**
 * GET /admin/compliments-dashboard/network
 */
export const getNetworkGraphSchema = {
  tags: ['Admin - Compliments Dashboard'],
  description: 'Get network graph visualization data for compliments relationships',
  querystring: {
    type: 'object',
    properties: {
      startDate: {
        type: 'string',
        format: 'date',
        description: 'Start date (YYYY-MM-DD)'
      },
      endDate: {
        type: 'string',
        format: 'date',
        description: 'End date (YYYY-MM-DD)'
      },
      department: {
        type: 'string',
        description: 'Filter by department name'
      },
      minConnections: {
        type: 'number',
        minimum: 1,
        description: 'Minimum total compliments (given + received) to include user'
      },
      limit: {
        type: 'number',
        minimum: 1,
        maximum: 100,
        description: 'Maximum number of nodes to return (default: 50, max: 100)'
      },
      userIds: {
        type: 'string',
        description: 'Comma-separated list of user IDs to filter by (e.g., "id1,id2,id3")'
      }
    },
    additionalProperties: false
  },
  response: {
    200: networkGraphResponseSchema,
    400: {
      type: 'object',
      properties: {
        error: { type: 'string' },
        message: { type: 'string' }
      }
    },
    401: {
      type: 'object',
      properties: {
        error: { type: 'string' },
        message: { type: 'string' }
      }
    },
    403: {
      type: 'object',
      properties: {
        error: { type: 'string' },
        message: { type: 'string' }
      }
    },
    500: {
      type: 'object',
      properties: {
        error: { type: 'string' },
        message: { type: 'string' }
      }
    }
  }
}