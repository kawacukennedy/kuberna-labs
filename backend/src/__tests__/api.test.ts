import request from "supertest";
import express from "express";
import { errorHandler } from "../middleware/errorHandler";

const app = express();
app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

describe("API Health Check", () => {
    it("should return ok status", async () => {
        const response = await request(app).get("/health");
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("status", "ok");
        expect(response.body).toHaveProperty("timestamp");
    });
});
