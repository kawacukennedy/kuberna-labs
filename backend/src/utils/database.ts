import { prisma } from './prisma.js';
import { DEFAULT_PAGINATION } from '../constants/index.js';

export interface ListOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  where?: Record<string, unknown>;
  include?: Record<string, unknown>;
  select?: Record<string, unknown>;
}

export interface PaginationResult {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ListResult<T> {
  data: T[];
  pagination: PaginationResult;
}

export function buildPaginationResponse(
  data: unknown[],
  total: number,
  page: number,
  limit: number
): ListResult<unknown> {
  const totalPages = Math.ceil(total / limit);
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

export function parseListQuery(query: Record<string, unknown>): ListOptions {
  const page = Math.max(1, parseInt(String(query.page || DEFAULT_PAGINATION.PAGE), 10));
  const limit = Math.min(
    DEFAULT_PAGINATION.MAX_LIMIT,
    Math.max(1, parseInt(String(query.limit || DEFAULT_PAGINATION.LIMIT), 10))
  );

  return {
    page,
    limit,
    sortBy: query.sortBy as string | undefined,
    sortOrder: query.sortOrder === 'asc' ? 'asc' : 'desc',
  };
}

export async function findMany<T>(modelName: string, options: ListOptions): Promise<ListResult<T>> {
  const {
    page = DEFAULT_PAGINATION.PAGE,
    limit = DEFAULT_PAGINATION.LIMIT,
    where = {},
    include,
    select,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = options;

  const [data, total] = await Promise.all([
    (prisma as any)[modelName].findMany({
      where,
      include,
      select,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    }),
    (prisma as any)[modelName].count({ where }),
  ]);

  return buildPaginationResponse(data, total, page, limit) as ListResult<T>;
}

export async function findById<T>(
  modelName: string,
  id: string,
  options?: { include?: Record<string, unknown>; select?: Record<string, unknown> }
): Promise<T | null> {
  return (prisma as any)[modelName].findUnique({
    where: { id },
    include: options?.include,
    select: options?.select,
  });
}

export async function createRecord<T>(
  modelName: string,
  data: Record<string, unknown>
): Promise<T> {
  return (prisma as any)[modelName].create({ data });
}

export async function updateRecord<T>(
  modelName: string,
  id: string,
  data: Record<string, unknown>
): Promise<T> {
  return (prisma as any)[modelName].update({
    where: { id },
    data,
  });
}

export async function deleteRecord(modelName: string, id: string): Promise<void> {
  await (prisma as any)[modelName].delete({ where: { id } });
}

export async function countRecords(
  modelName: string,
  where: Record<string, unknown> = {}
): Promise<number> {
  return (prisma as any)[modelName].count({ where });
}

export async function transaction<T>(fn: (tx: any) => Promise<T>): Promise<T> {
  return prisma.$transaction(fn);
}

export const db = {
  findMany,
  findById,
  create: createRecord,
  update: updateRecord,
  delete: deleteRecord,
  count: countRecords,
  transaction,
  prisma,
};

export default db;
