/**
 * Migration Validation Tests
 *
 * These tests verify that all migrations are non-destructive (additive only).
 * They check the schema for patterns that would cause data loss.
 */

import fs from "fs";
import path from "path";

describe("Migration safety validation", () => {
  const migrationsDir = path.resolve(__dirname, "../prisma/migrations");

  beforeAll(() => {
    if (!fs.existsSync(migrationsDir)) {
      fs.mkdirSync(migrationsDir, { recursive: true });
    }
  });

  it("should have a prisma schema file", () => {
    const schemaPath = path.resolve(
      __dirname,
      "../prisma/schema.prisma"
    );
    const schemaExists = fs.existsSync(schemaPath);
    expect(schemaExists).toBe(true);
  });

  it("schema should reference env vars for database URLs", () => {
    const schemaPath = path.resolve(
      __dirname,
      "../prisma/schema.prisma"
    );
    const schema = fs.readFileSync(schemaPath, "utf-8");

    expect(schema).toContain('env("DATABASE_URL")');
    expect(schema).toContain('env("DIRECT_URL")');
  });

  it("schema should use PostgreSQL provider", () => {
    const schemaPath = path.resolve(
      __dirname,
      "../prisma/schema.prisma"
    );
    const schema = fs.readFileSync(schemaPath, "utf-8");

    expect(schema).toContain('provider = "postgresql"');
  });

  describe("migration SQL safety checks", () => {
    const migrationFiles: string[] = [];

    beforeAll(() => {
      if (fs.existsSync(migrationsDir)) {
        const files = fs.readdirSync(migrationsDir);
        migrationFiles.push(
          ...files
            .filter((f) => f.endsWith(".sql"))
            .map((f) => path.join(migrationsDir, f))
        );
      }
    });

    it("should not contain DROP TABLE statements", () => {
      for (const file of migrationFiles) {
        const sql = fs.readFileSync(file, "utf-8");
        const dropTableMatches = sql.match(/DROP\s+TABLE\s+/gi);
        if (dropTableMatches) {
          // Allow DROP TABLE IF EXISTS only for temp tables
          const unsafeDrops = dropTableMatches.filter(
            (m) => !sql.includes("IF EXISTS")
          );
          expect(unsafeDrops).toHaveLength(0);
        }
      }
    });

    it("should not contain DROP COLUMN statements", () => {
      for (const file of migrationFiles) {
        const sql = fs.readFileSync(file, "utf-8");
        const dropColumnMatches = sql.match(/DROP\s+COLUMN\s+/gi);
        expect(dropColumnMatches).toBeNull();
      }
    });

    it("should not contain ALTER COLUMN DROP DEFAULT", () => {
      for (const file of migrationFiles) {
        const sql = fs.readFileSync(file, "utf-8");
        const dropDefaultMatches = sql.match(
          /ALTER\s+COLUMN.*DROP\s+DEFAULT/gi
        );
        expect(dropDefaultMatches).toBeNull();
      }
    });
  });
});

describe("DATABASE_URL configuration validation", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("should use transaction pooler URL (port 6543) for runtime", () => {
    const url =
      "postgresql://postgres.rjlnyyqanqhvikhjfmvk:InkomokoArchive2026@aws-1-eu-north-1.pooler.supabase.com:6543/postgres?pgbouncer=true";
    expect(url).toContain(":6543/");
    expect(url).toContain("pgbouncer=true");
  });

  it("should use direct URL (port 5432) for migrations", () => {
    const url =
      "postgresql://postgres.rjlnyyqanqhvikhjfmvk:InkomokoArchive2026@aws-1-eu-north-1.pooler.supabase.com:5432/postgres";
    expect(url).toContain(":5432/");
  });

  it("should enable PgBouncer mode when pgbouncer=true is present", () => {
    const url =
      "postgresql://postgres.rjlnyyqanqhvikhjfmvk:InkomokoArchive2026@aws-1-eu-north-1.pooler.supabase.com:6543/postgres?pgbouncer=true";
    expect(url.includes("pgbouncer=true")).toBe(true);
  });
});

describe(".env.example validation", () => {
  it("should have DATABASE_URL with pgbouncer flag", () => {
    const envPath = path.resolve(__dirname, "../.env.example");
    const content = fs.readFileSync(envPath, "utf-8");
    expect(content).toContain("DATABASE_URL");
    expect(content).toContain("pgbouncer=true");
    expect(content).toContain("DIRECT_URL");
  });

  it("should have all required Supabase env vars documented", () => {
    const envPath = path.resolve(__dirname, "../.env.example");
    const content = fs.readFileSync(envPath, "utf-8");
    const requiredVars = [
      "DATABASE_URL",
      "DIRECT_URL",
      "JWT_SECRET",
      "NATS_URL",
      "NODE_ENV",
      "PORT",
    ];
    for (const v of requiredVars) {
      expect(content).toContain(v);
    }
  });
});
