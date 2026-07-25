import { pgTable, text, timestamp, boolean, unique } from "drizzle-orm/pg-core";

export const usersTable = pgTable(
  "auth_users",
  {
    id: text("id").primaryKey(),
    appId: text("app_id").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    name: text("name"),
    role: text("role").notNull().default("user"),
    emailVerified: boolean("email_verified").notNull().default(false),
    otp: text("otp"),
    otpExpires: timestamp("otp_expires"),
    operatorId: text("operator_id"),
    resetToken: text("reset_token"),
    resetTokenExpires: timestamp("reset_token_expires"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [unique("unique_email_per_app").on(t.appId, t.email)],
);

export type User = typeof usersTable.$inferSelect;
export type InsertUser = typeof usersTable.$inferInsert;
