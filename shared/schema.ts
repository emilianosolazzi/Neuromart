import { pgTable, text, serial, integer, timestamp, numeric } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  displayName: text("display_name").notNull(),
});

export const aiModels = pgTable("ai_models", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  systemPrompt: text("system_prompt").notNull(),
  category: text("category").notNull(),
  pricePerQuery: numeric("price_per_query").notNull(),
  creatorId: integer("creator_id").notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const rentals = pgTable("rentals", {
  id: serial("id").primaryKey(),
  renterId: integer("renter_id").notNull(),
  modelId: integer("model_id").notNull(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const aiModelsRelations = relations(aiModels, ({ one }) => ({
  creator: one(users, {
    fields: [aiModels.creatorId],
    references: [users.id],
  }),
}));

export const rentalsRelations = relations(rentals, ({ one }) => ({
  renter: one(users, {
    fields: [rentals.renterId],
    references: [users.id],
  }),
  model: one(aiModels, {
    fields: [rentals.modelId],
    references: [aiModels.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertAiModelSchema = createInsertSchema(aiModels).omit({ id: true, createdAt: true });
export const insertRentalSchema = createInsertSchema(rentals).omit({ id: true, createdAt: true, status: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type AiModel = typeof aiModels.$inferSelect;
export type InsertAiModel = z.infer<typeof insertAiModelSchema>;

export type Rental = typeof rentals.$inferSelect;
export type InsertRental = z.infer<typeof insertRentalSchema>;

export type AiModelWithCreator = AiModel & { creator: User };
export type RentalWithDetails = Rental & { model: AiModel, renter: User };