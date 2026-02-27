import { z } from 'zod';
import { insertAiModelSchema, insertRentalSchema, insertUserSchema } from './schema';

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  notFound: z.object({ message: z.string() }),
  internal: z.object({ message: z.string() }),
};

export const api = {
  users: {
    list: {
      method: 'GET' as const,
      path: '/api/users' as const,
      responses: {
        200: z.array(z.any()), // Array of User
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/users' as const,
      input: insertUserSchema,
      responses: {
        201: z.any(), // User
        400: errorSchemas.validation,
      },
    }
  },
  models: {
    list: {
      method: 'GET' as const,
      path: '/api/models' as const,
      input: z.object({ category: z.string().optional() }).optional(),
      responses: {
        200: z.array(z.any()), // Array of AiModelWithCreator
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/models/:id' as const,
      responses: {
        200: z.any(), // AiModelWithCreator
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/models' as const,
      input: insertAiModelSchema,
      responses: {
        201: z.any(), // AiModel
        400: errorSchemas.validation,
      },
    },
  },
  rentals: {
    list: {
      method: 'GET' as const,
      path: '/api/rentals' as const,
      input: z.object({ renterId: z.string().optional() }).optional(),
      responses: {
        200: z.array(z.any()), // Array of RentalWithDetails
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/rentals' as const,
      input: insertRentalSchema,
      responses: {
        201: z.any(), // Rental
        400: errorSchemas.validation,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
