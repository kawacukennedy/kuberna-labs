"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const errorHandler_js_1 = require("./middleware/errorHandler.js");
const timeout_js_1 = require("./middleware/timeout.js");
const prisma_js_1 = require("./utils/prisma.js");
const logger_js_1 = __importDefault(require("./utils/logger.js"));
const auth_js_1 = require("./routes/auth.js");
const users_js_1 = require("./routes/users.js");
const courses_js_1 = require("./routes/courses.js");
const agents_js_1 = require("./routes/agents.js");
const intents_js_1 = require("./routes/intents.js");
const payments_js_1 = require("./routes/payments.js");
const workshops_js_1 = require("./routes/workshops.js");
const forum_js_1 = require("./routes/forum.js");
const notifications_js_1 = require("./routes/notifications.js");
const analytics_js_1 = require("./routes/analytics.js");
const apiKeys_js_1 = require("./routes/apiKeys.js");
const disputes_js_1 = require("./routes/disputes.js");
const compliance_js_1 = require("./routes/compliance.js");
const featureFlags_js_1 = require("./routes/featureFlags.js");
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'http://localhost:3001',
];
const isProduction = process.env.NODE_ENV === 'production';
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin) {
            return callback(null, true);
        }
        if (isProduction && !allowedOrigins.includes(origin)) {
            const error = new Error('CORS policy violation: Origin not allowed');
            return callback(error);
        }
        if (!isProduction) {
            return callback(null, true);
        }
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-KEY'],
};
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.use((0, helmet_1.default)());
app.use(timeout_js_1.defaultTimeout);
app.use((0, cors_1.default)(corsOptions));
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.get('/health', async (req, res) => {
    const dbOk = await (0, prisma_js_1.testConnection)();
    res.json({
        status: dbOk ? 'ok' : 'degraded',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        database: dbOk ? 'connected' : 'disconnected',
        provider: 'supabase',
        uptime: process.uptime(),
    });
});
app.use('/api/auth', auth_js_1.authRouter);
app.use('/api/users', users_js_1.userRouter);
app.use('/api/courses', courses_js_1.courseRouter);
app.use('/api/agents', agents_js_1.agentRouter);
app.use('/api/intents', intents_js_1.intentRouter);
app.use('/api/payments', payments_js_1.paymentRouter);
app.use('/api/workshops', workshops_js_1.workshopRouter);
app.use('/api/forum', forum_js_1.forumRouter);
app.use('/api/notifications', notifications_js_1.notificationRouter);
app.use('/api/analytics', analytics_js_1.analyticsRouter);
app.use('/api/api-keys', apiKeys_js_1.apiKeyRouter);
app.use('/api/disputes', disputes_js_1.disputeRouter);
app.use('/api/compliance', compliance_js_1.complianceRouter);
app.use('/api/feature-flags', featureFlags_js_1.featureFlagRouter);
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: {
            message: 'Route not found',
            code: 'NOT_FOUND',
        },
    });
});
app.use(errorHandler_js_1.errorHandler);
async function startServer() {
    try {
        await (0, prisma_js_1.connectDatabase)();
        app.listen(PORT, () => {
            logger_js_1.default.info(`🚀 Kuberna Labs API running on port ${PORT}`);
            logger_js_1.default.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    }
    catch (error) {
        logger_js_1.default.error('Failed to start server', { error });
        process.exit(1);
    }
}
// Validate critical environment variables at startup
const { validateEnvironment } = require('./middleware/envValidation.js');
try {
    validateEnvironment();
}
catch (error) {
    console.error('Environment validation failed', error);
    process.exit(1);
}
if (process.env.NODE_ENV !== 'test') {
    startServer();
}
exports.default = app;
//# sourceMappingURL=index.js.map