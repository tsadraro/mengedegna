import { pgTable, text, jsonb, timestamp } from "drizzle-orm/pg-core";

export const entitiesTable = pgTable("entities", {
  id: text("id").primaryKey(),
  appId: text("app_id").notNull(),
  entityName: text("entity_name").notNull(),
  data: jsonb("data").notNull().default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Entity = typeof entitiesTable.$inferSelect;
export type InsertEntity = typeof entitiesTable.$inferInsert;
