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

export function buildPaginationResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): ListResult<T> {
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

const ALLOWED_SORT_COLUMNS = new Set([
  'createdAt',
  'updatedAt',
  'name',
  'title',
  'status',
  'amount',
  'price',
]);

export function parseListQuery(query: Record<string, unknown>): ListOptions {
  const page = Math.max(1, parseInt(String(query.page || DEFAULT_PAGINATION.PAGE), 10));
  const limit = Math.min(
    DEFAULT_PAGINATION.MAX_LIMIT,
    Math.max(1, parseInt(String(query.limit || DEFAULT_PAGINATION.LIMIT), 10))
  );
  const sortBy = query.sortBy as string | undefined;

  return {
    page,
    limit,
    sortBy: sortBy && ALLOWED_SORT_COLUMNS.has(sortBy) ? sortBy : undefined,
    sortOrder: query.sortOrder === 'asc' ? 'asc' : 'desc',
  };
}

function getModel(modelName: string): unknown {
  const model = (prisma as unknown as Record<string, unknown>)[modelName];
  if (!model || typeof model !== 'object') {
    throw new Error(`Prisma model '${modelName}' not found`);
  }
  return model;
}

function safeSortColumn(sortBy: string): string {
  return ALLOWED_SORT_COLUMNS.has(sortBy) ? sortBy : 'createdAt';
}

export async function findMany<T>(
  modelName: string,
  options: ListOptions = {}
): Promise<ListResult<T>> {
  const page = Math.max(1, options.page || DEFAULT_PAGINATION.PAGE);
  const limit = Math.min(
    DEFAULT_PAGINATION.MAX_LIMIT,
    Math.max(1, options.limit || DEFAULT_PAGINATION.LIMIT)
  );
  const sortBy = safeSortColumn(options.sortBy || 'createdAt');
  const sortOrder = options.sortOrder === 'asc' ? 'asc' : ('desc' as const);

  const delegate = getModel(modelName) as {
    findMany: (args: {
      where?: Record<string, unknown>;
      include?: Record<string, unknown>;
      select?: Record<string, unknown>;
      skip: number;
      take: number;
      orderBy: Record<string, 'asc' | 'desc'>;
    }) => Promise<T[]>;
    count: (args: { where?: Record<string, unknown> }) => Promise<number>;
  };

  const [data, total] = await Promise.all([
    delegate.findMany({
      where: options.where || {},
      include: options.include,
      select: options.select,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    }),
    delegate.count({ where: options.where || {} }),
  ]);

  return buildPaginationResponse(data, total, page, limit);
}

export async function findById<T>(
  modelName: string,
  id: string,
  options?: { include?: Record<string, unknown>; select?: Record<string, unknown> }
): Promise<T | null> {
  const delegate = getModel(modelName) as {
    findUnique: (args: {
      where: { id: string };
      include?: Record<string, unknown>;
      select?: Record<string, unknown>;
    }) => Promise<T | null>;
  };
  return delegate.findUnique({
    where: { id },
    include: options?.include,
    select: options?.select,
  });
}

export async function createRecord<T>(
  modelName: string,
  data: Record<string, unknown>
): Promise<T> {
  const delegate = getModel(modelName) as {
    create: (args: { data: Record<string, unknown> }) => Promise<T>;
  };
  return delegate.create({ data });
}

export async function updateRecord<T>(
  modelName: string,
  id: string,
  data: Record<string, unknown>
): Promise<T> {
  const delegate = getModel(modelName) as {
    update: (args: { where: { id: string }; data: Record<string, unknown> }) => Promise<T>;
  };
  return delegate.update({ where: { id }, data });
}

export async function deleteRecord(modelName: string, id: string): Promise<void> {
  const delegate = getModel(modelName) as {
    delete: (args: { where: { id: string } }) => Promise<unknown>;
  };
  await delegate.delete({ where: { id } });
}

export async function countRecords(
  modelName: string,
  where: Record<string, unknown> = {}
): Promise<number> {
  const delegate = getModel(modelName) as {
    count: (args: { where?: Record<string, unknown> }) => Promise<number>;
  };
  return delegate.count({ where });
}

export async function transaction<T>(fn: (tx: typeof prisma) => Promise<T>): Promise<T> {
  return prisma.$transaction(fn as any) as Promise<T>;
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