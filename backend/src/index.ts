import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";

import { errorHandler } from "./middleware/errorHandler.js";
import { authRouter } from "./routes/auth.js";
import { userRouter } from "./routes/users.js";
import { courseRouter } from "./routes/courses.js";
import { agentRouter } from "./routes/agents.js";
import { intentRouter } from "./routes/intents.js";
import { paymentRouter } from "./routes/payments.js";
import { workshopRouter } from "./routes/workshops.js";
import { forumRouter } from "./routes/forum.js";
import { notificationRouter } from "./routes/notifications.js";
import { analyticsRouter } from "./routes/analytics.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  }),
);
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/courses", courseRouter);
app.use("/api/agents", agentRouter);
app.use("/api/intents", intentRouter);
app.use("/api/payments", paymentRouter);
app.use("/api/workshops", workshopRouter);
app.use("/api/forum", forumRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/analytics", analyticsRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Kuberna Labs API running on port ${PORT}`);
});

export default app;
