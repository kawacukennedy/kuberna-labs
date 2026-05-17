"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
exports.connectDatabase = connectDatabase;
exports.disconnectDatabase = disconnectDatabase;
exports.testConnection = testConnection;
const client_1 = require("@prisma/client");
const globalForPrisma = globalThis;
const prismaOptions = {
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
};
exports.prisma = globalForPrisma.prisma ??
    new client_1.PrismaClient(prismaOptions);
if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = exports.prisma;
}
async function connectDatabase() {
    try {
        await exports.prisma.$connect();
        console.info('Database connected successfully to Supabase (transaction pooler)');
    }
    catch (error) {
        console.error('Failed to connect to Supabase database', error);
        throw error;
    }
}
async function disconnectDatabase() {
    try {
        await exports.prisma.$disconnect();
        console.info('Database disconnected successfully');
    }
    catch (error) {
        console.error('Failed to disconnect from database', error);
        throw error;
    }
}
async function testConnection() {
    try {
        await exports.prisma.$queryRaw `SELECT 1`;
        console.info('Supabase connection health check: OK');
        return true;
    }
    catch (error) {
        console.error('Supabase connection health check: FAILED', error);
        return false;
    }
}
exports.default = exports.prisma;
//# sourceMappingURL=prisma.js.map