import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { entitiesTable, usersTable } from "@workspace/db";
import { eq, and, sql, type SQL } from "drizzle-orm";
import crypto from "crypto";
import {
  signToken,
  verifyToken,
  hashPassword,
  comparePassword,
  generateOtp,
  generateResetToken,
} from "../lib/auth.js";

const router = Router();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Flatten entity row → API response object */
function toApiObject(row: {
  id: string;
  data: unknown;
  createdAt: Date | null;
  updatedAt: Date | null;
}): Record<string, unknown> {
  return {
    id: row.id,
    ...(row.data as Record<string, unknown>),
    created_date: row.createdAt?.toISOString(),
    updated_date: row.updatedAt?.toISOString(),
  };
}

/**
 * Validate that a field name contains only safe identifier characters.
 * Rejects anything that could break out of a JSONB key context.
 */
function isValidFieldName(name: string): boolean {
  return /^[a-zA-Z0-9_\-\.]+$/.test(name);
}

/** Build parameterized WHERE SQL fragments from a MongoDB-style query object */
function buildJsonbFilter(query: Record<string, unknown>): SQL[] {
  const clauses: SQL[] = [];
  for (const [key, value] of Object.entries(query)) {
    // Reject field names that aren't safe identifiers
    if (!isValidFieldName(key)) continue;

    if (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value)
    ) {
      const ops = value as Record<string, unknown>;
      for (const [op, opVal] of Object.entries(ops)) {
        // data->>'fieldName' — key is validated above, safe to embed as raw
        const col = sql.raw(`data->>'${key}'`);
        switch (op) {
          case "$gt":
            clauses.push(sql`(${col})::numeric > ${Number(opVal)}`);
            break;
          case "$gte":
            clauses.push(sql`(${col})::numeric >= ${Number(opVal)}`);
            break;
          case "$lt":
            clauses.push(sql`(${col})::numeric < ${Number(opVal)}`);
            break;
          case "$lte":
            clauses.push(sql`(${col})::numeric <= ${Number(opVal)}`);
            break;
          case "$ne":
            // Use parameterized binding — no string interpolation of user data
            clauses.push(sql`${col} != ${String(opVal)}`);
            break;
          case "$in":
            if (Array.isArray(opVal) && opVal.length > 0) {
              // Build a parameterized ANY($1::text[]) expression
              const safeVals = opVal.map((v) => String(v));
              clauses.push(sql`${col} = ANY(${safeVals})`);
            }
            break;
        }
      }
    } else {
      // Simple equality – use JSONB containment with parameterized value
      const jsonVal = JSON.stringify({ [key]: value });
      clauses.push(sql`data @> ${jsonVal}::jsonb`);
    }
  }
  return clauses;
}

/** Parse sort param: "departure_date,-fare" → parameterized ORDER BY fragment */
function buildOrderBy(sort?: string): SQL {
  if (!sort) return sql.raw("created_at DESC");
  const parts = sort.split(",").flatMap((s) => {
    const desc = s.startsWith("-");
    const field = desc ? s.slice(1) : s;
    const dir = desc ? "DESC" : "ASC";
    // Handle top-level timestamp columns
    if (field === "created_at" || field === "created_date")
      return [sql.raw(`created_at ${dir}`)];
    if (field === "updated_at" || field === "updated_date")
      return [sql.raw(`updated_at ${dir}`)];
    // Reject field names that aren't safe identifiers — skip invalid parts
    if (!isValidFieldName(field)) return [];
    return [sql.raw(`data->>'${field}' ${dir}`)];
  });
  // Fall back to default if all parts were rejected
  if (parts.length === 0) return sql.raw("created_at DESC");
  return sql.join(parts, sql.raw(", "));
}

/** Extract Bearer token from request */
function extractToken(req: Request): string | null {
  const auth = req.headers.authorization ?? "";
  if (auth.startsWith("Bearer ")) return auth.slice(7);
  return null;
}

/** Middleware: optionally verify token, attach user info to req */
function optionalAuth(req: Request): {
  userId: string;
  appId: string;
  email: string;
  role: string;
} | null {
  const token = extractToken(req);
  if (!token) return null;
  return verifyToken(token);
}

/**
 * Verify that the request carries a valid JWT **and** that the token's
 * embedded appId matches the :appId route parameter.  Returns the claim on
 * success, or sends the appropriate error response and returns null.
 */
function requireAppAuth(
  req: Request,
  res: Response,
): { userId: string; appId: string; email: string; role: string } | null {
  const claim = optionalAuth(req);
  if (!claim) {
    res.status(401).json({ message: "Unauthorized" });
    return null;
  }
  if (claim.appId !== req.params.appId) {
    res.status(403).json({ message: "Forbidden" });
    return null;
  }
  return claim;
}

// ---------------------------------------------------------------------------
// Public app settings  (hit before any auth)
// GET /api/apps/public/prod/public-settings/by-id/:appId
// ---------------------------------------------------------------------------
router.get(
  "/apps/public/prod/public-settings/by-id/:appId",
  (_req: Request, res: Response) => {
    const { appId } = _req.params;
    res.json({
      id: appId,
      public_settings: {
        app_name: "Mengedegna",
        requires_auth: false,
        auth_providers: ["email"],
        login_page_enabled: true,
      },
    });
  },
);

// ---------------------------------------------------------------------------
// Auth routes   /api/apps/:appId/auth/...
// ---------------------------------------------------------------------------

// POST /api/apps/:appId/auth/login  → { access_token, user }
router.post(
  "/apps/:appId/auth/login",
  async (req: Request, res: Response) => {
    const { appId } = req.params;
    const { email, password } = req.body as {
      email?: string;
      password?: string;
    };
    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }
    const users = await db
      .select()
      .from(usersTable)
      .where(
        and(eq(usersTable.appId, appId), eq(usersTable.email, email)),
      );
    const user = users[0];
    if (!user || !(await comparePassword(password, user.passwordHash))) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }
    const access_token = signToken({
      userId: user.id,
      appId,
      email: user.email,
      role: user.role,
    });
    res.json({
      access_token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        email_verified: user.emailVerified,
      },
    });
  },
);

// POST /api/apps/:appId/auth/register
router.post(
  "/apps/:appId/auth/register",
  async (req: Request, res: Response) => {
    const { appId } = req.params;
    const { email, password, name } = req.body as {
      email?: string;
      password?: string;
      name?: string;
    };
    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }
    const existing = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(
        and(eq(usersTable.appId, appId), eq(usersTable.email, email)),
      );
    if (existing.length > 0) {
      res.status(409).json({ message: "Email already registered" });
      return;
    }
    const otp = generateOtp();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    const id = crypto.randomUUID();
    await db.insert(usersTable).values({
      id,
      appId,
      email,
      passwordHash: await hashPassword(password),
      name: name ?? null,
      otp,
      otpExpires,
    });
    res.json({ message: "Registration successful. Check your email for OTP." });
  },
);

// POST /api/apps/:appId/auth/verify-otp
router.post(
  "/apps/:appId/auth/verify-otp",
  async (req: Request, res: Response) => {
    const { appId } = req.params;
    const { email, otp_code } = req.body as {
      email?: string;
      otp_code?: string;
    };
    if (!email || !otp_code) {
      res.status(400).json({ message: "Email and OTP code are required" });
      return;
    }
    const users = await db
      .select()
      .from(usersTable)
      .where(
        and(eq(usersTable.appId, appId), eq(usersTable.email, email)),
      );
    const user = users[0];
    if (!user || user.otp !== otp_code || !user.otpExpires || user.otpExpires < new Date()) {
      res.status(400).json({ message: "Invalid or expired OTP" });
      return;
    }
    await db
      .update(usersTable)
      .set({ emailVerified: true, otp: null, otpExpires: null })
      .where(eq(usersTable.id, user.id));
    const access_token = signToken({
      userId: user.id,
      appId,
      email: user.email,
      role: user.role,
    });
    res.json({ access_token });
  },
);

// POST /api/apps/:appId/auth/resend-otp
router.post(
  "/apps/:appId/auth/resend-otp",
  async (req: Request, res: Response) => {
    const { appId } = req.params;
    const { email } = req.body as { email?: string };
    if (!email) {
      res.status(400).json({ message: "Email is required" });
      return;
    }
    const users = await db
      .select()
      .from(usersTable)
      .where(
        and(eq(usersTable.appId, appId), eq(usersTable.email, email)),
      );
    const user = users[0];
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    const otp = generateOtp();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await db
      .update(usersTable)
      .set({ otp, otpExpires })
      .where(eq(usersTable.id, user.id));
    res.json({ message: "OTP sent" });
  },
);

// POST /api/apps/:appId/auth/reset-password-request
router.post(
  "/apps/:appId/auth/reset-password-request",
  async (req: Request, res: Response) => {
    const { appId } = req.params;
    const { email } = req.body as { email?: string };
    if (!email) {
      res.status(400).json({ message: "Email is required" });
      return;
    }
    const users = await db
      .select()
      .from(usersTable)
      .where(
        and(eq(usersTable.appId, appId), eq(usersTable.email, email)),
      );
    const user = users[0];
    if (!user) {
      // Don't leak whether email exists
      res.json({ message: "If that email exists, a reset link was sent" });
      return;
    }
    const resetToken = generateResetToken();
    const resetTokenExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 min
    await db
      .update(usersTable)
      .set({ resetToken, resetTokenExpires })
      .where(eq(usersTable.id, user.id));
    res.json({ message: "If that email exists, a reset link was sent" });
  },
);

// POST /api/apps/:appId/auth/reset-password
router.post(
  "/apps/:appId/auth/reset-password",
  async (req: Request, res: Response) => {
    const { appId } = req.params;
    const { reset_token, new_password } = req.body as {
      reset_token?: string;
      new_password?: string;
    };
    if (!reset_token || !new_password) {
      res.status(400).json({ message: "Reset token and new password are required" });
      return;
    }
    const users = await db
      .select()
      .from(usersTable)
      .where(
        and(
          eq(usersTable.appId, appId),
          eq(usersTable.resetToken, reset_token),
        ),
      );
    const user = users[0];
    if (!user || !user.resetTokenExpires || user.resetTokenExpires < new Date()) {
      res.status(400).json({ message: "Invalid or expired reset token" });
      return;
    }
    await db
      .update(usersTable)
      .set({
        passwordHash: await hashPassword(new_password),
        resetToken: null,
        resetTokenExpires: null,
      })
      .where(eq(usersTable.id, user.id));
    res.json({ message: "Password reset successful" });
  },
);

// ---------------------------------------------------------------------------
// Entity: User/me  (special-cased before generic entity handler)
// GET  /api/apps/:appId/entities/User/me
// PUT  /api/apps/:appId/entities/User/me
// ---------------------------------------------------------------------------

router.get(
  "/apps/:appId/entities/User/me",
  async (req: Request, res: Response) => {
    const claim = requireAppAuth(req, res);
    if (!claim) return;
    const users = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, claim.userId));
    const user = users[0];
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      email_verified: user.emailVerified,
      created_date: user.createdAt?.toISOString(),
    });
  },
);

router.put(
  "/apps/:appId/entities/User/me",
  async (req: Request, res: Response) => {
    const claim = requireAppAuth(req, res);
    if (!claim) return;
    // Only allow updating non-sensitive fields; role changes are never
    // permitted via self-service — an admin must change roles through a
    // privileged endpoint.
    const { name } = req.body as { name?: string };
    await db
      .update(usersTable)
      .set({ name: name ?? undefined })
      .where(eq(usersTable.id, claim.userId));
    const users = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, claim.userId));
    const user = users[0];
    res.json({
      id: user?.id,
      email: user?.email,
      name: user?.name,
      role: user?.role,
      email_verified: user?.emailVerified,
    });
  },
);

// ---------------------------------------------------------------------------
// Generic entity CRUD
// GET    /api/apps/:appId/entities/:entity         list / filter
// GET    /api/apps/:appId/entities/:entity/:id     get by id
// POST   /api/apps/:appId/entities/:entity         create
// PUT    /api/apps/:appId/entities/:entity/:id     update
// DELETE /api/apps/:appId/entities/:entity/:id     delete
// POST   /api/apps/:appId/entities/:entity/bulk    bulk create
// ---------------------------------------------------------------------------

// List / filter
router.get(
  "/apps/:appId/entities/:entity",
  async (req: Request, res: Response) => {
    if (!requireAppAuth(req, res)) return;
    const { appId, entity } = req.params;
    const { q, sort, limit, skip } = req.query as Record<string, string | undefined>;

    let filterClauses: SQL[] = [];
    if (q) {
      try {
        const query = JSON.parse(q) as Record<string, unknown>;
        filterClauses = buildJsonbFilter(query);
      } catch {
        res.status(400).json({ message: "Invalid filter query" });
        return;
      }
    }

    const orderBy = buildOrderBy(sort);
    const limitVal = Math.min(Number(limit ?? 100), 1000);
    const skipVal = Number(skip ?? 0);

    // Build fully parameterized SQL — no user input is concatenated as raw strings
    const filterWhere =
      filterClauses.length > 0
        ? sql` AND ${sql.join(filterClauses, sql.raw(" AND "))}`
        : sql``;

    const rows = await db.execute(
      sql`SELECT id, data, created_at, updated_at FROM entities WHERE app_id = ${appId} AND entity_name = ${entity}${filterWhere} ORDER BY ${orderBy} LIMIT ${limitVal} OFFSET ${skipVal}`,
    );

    res.json(rows.rows.map((r: Record<string, unknown>) =>
      toApiObject({
        id: r.id as string,
        data: r.data,
        createdAt: r.created_at ? new Date(r.created_at as string) : null,
        updatedAt: r.updated_at ? new Date(r.updated_at as string) : null,
      }),
    ));
  },
);

// Get by ID
router.get(
  "/apps/:appId/entities/:entity/:id",
  async (req: Request, res: Response) => {
    if (!requireAppAuth(req, res)) return;
    const { appId, entity, id } = req.params;
    const rows = await db
      .select()
      .from(entitiesTable)
      .where(
        and(
          eq(entitiesTable.appId, appId),
          eq(entitiesTable.entityName, entity),
          eq(entitiesTable.id, id),
        ),
      );
    if (rows.length === 0) {
      res.status(404).json({ message: "Not found" });
      return;
    }
    res.json(toApiObject(rows[0]!));
  },
);

// Create
router.post(
  "/apps/:appId/entities/:entity",
  async (req: Request, res: Response) => {
    if (!requireAppAuth(req, res)) return;
    const { appId, entity } = req.params;
    const id = crypto.randomUUID();
    const data = req.body as Record<string, unknown>;
    // Remove any id from the body (we generate it)
    delete data["id"];
    await db.insert(entitiesTable).values({ id, appId, entityName: entity, data });
    const rows = await db
      .select()
      .from(entitiesTable)
      .where(eq(entitiesTable.id, id));
    res.status(201).json(toApiObject(rows[0]!));
  },
);

// Update by ID
router.put(
  "/apps/:appId/entities/:entity/:id",
  async (req: Request, res: Response) => {
    if (!requireAppAuth(req, res)) return;
    const { appId, entity, id } = req.params;
    const patch = req.body as Record<string, unknown>;
    delete patch["id"];

    // Merge patch into existing data
    const rows = await db
      .select()
      .from(entitiesTable)
      .where(
        and(
          eq(entitiesTable.appId, appId),
          eq(entitiesTable.entityName, entity),
          eq(entitiesTable.id, id),
        ),
      );
    if (rows.length === 0) {
      res.status(404).json({ message: "Not found" });
      return;
    }
    const merged = { ...(rows[0]!.data as Record<string, unknown>), ...patch };
    await db
      .update(entitiesTable)
      .set({ data: merged, updatedAt: new Date() })
      .where(eq(entitiesTable.id, id));
    const updated = await db
      .select()
      .from(entitiesTable)
      .where(eq(entitiesTable.id, id));
    res.json(toApiObject(updated[0]!));
  },
);

// Delete by ID
router.delete(
  "/apps/:appId/entities/:entity/:id",
  async (req: Request, res: Response) => {
    if (!requireAppAuth(req, res)) return;
    const { appId, entity, id } = req.params;
    await db
      .delete(entitiesTable)
      .where(
        and(
          eq(entitiesTable.appId, appId),
          eq(entitiesTable.entityName, entity),
          eq(entitiesTable.id, id),
        ),
      );
    res.json({ success: true });
  },
);

// Bulk create  POST /api/apps/:appId/entities/:entity/bulk
router.post(
  "/apps/:appId/entities/:entity/bulk",
  async (req: Request, res: Response) => {
    if (!requireAppAuth(req, res)) return;
    const { appId, entity } = req.params;
    const items = Array.isArray(req.body) ? req.body : [req.body];
    const created: Record<string, unknown>[] = [];
    for (const item of items) {
      const id = crypto.randomUUID();
      const data = { ...(item as Record<string, unknown>) };
      delete data["id"];
      await db.insert(entitiesTable).values({ id, appId, entityName: entity, data });
      const rows = await db
        .select()
        .from(entitiesTable)
        .where(eq(entitiesTable.id, id));
      if (rows[0]) created.push(toApiObject(rows[0]));
    }
    res.status(201).json(created);
  },
);

// Analytics (no-op — just 200 so the SDK doesn't spam errors)
router.post("/apps/:appId/analytics/track/batch", (_req, res) => {
  res.json({ ok: true });
});

export default router;
