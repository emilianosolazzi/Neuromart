import { pgTable, text, serial, integer, timestamp, numeric, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const MODEL_CATEGORIES = [
  "DeFi & Web3",
  "Industrial",
  "Bio-Tech",
  "Creative & Media",
  "Legal & Security",
  "Engineering & DevOps",
  "Logistics",
  "Academic & Research",
  "Urban & Civic",
  "Strategy",
  "Custom",
] as const;

export const MODEL_ONBOARDING_MODES = [
  "external_api",
  "provider_backed",
  "self_hosted",
  "prompt_only",
] as const;

export const MODEL_PRICING_MODES = [
  "per_request",
  "custom_quote",
] as const;

export const MODEL_STATUSES = [
  "draft",
  "published",
  "beta",
  "paused",
  "deprecated",
  "archived",
] as const;

export const MODEL_PROVIDERS = [
  "openai",
  "anthropic",
  "google",
  "azure",
  "huggingface",
  "custom",
] as const;

export const modelCategorySchema = z.enum(MODEL_CATEGORIES);
export const modelOnboardingModeSchema = z.enum(MODEL_ONBOARDING_MODES);
export const modelPricingModeSchema = z.enum(MODEL_PRICING_MODES);
export const modelStatusSchema = z.enum(MODEL_STATUSES);
export const modelProviderSchema = z.enum(MODEL_PROVIDERS);

const optionalTextSchema = z.preprocess(
  (value) => typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().trim().optional(),
);

const optionalUrlSchema = z.preprocess(
  (value) => typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().trim().url().optional(),
);

const optionalPriceSchema = z.preprocess(
  (value) => value === "" || value == null ? undefined : value,
  z.union([z.string(), z.number()]).transform((value) => String(value)).optional(),
);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  displayName: text("display_name").notNull(),
});

export const aiModels = pgTable("ai_models", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  systemPrompt: text("system_prompt"),
  category: text("category").notNull(),
  onboardingMode: text("onboarding_mode").notNull().default("prompt_only"),
  pricingModel: text("pricing_model").notNull().default("per_request"),
  pricingLabel: text("pricing_label"),
  modelStatus: text("model_status").notNull().default("draft"),
  provider: text("provider"),
  modelIdentifier: text("model_identifier"),
  baseModel: text("base_model"),
  apiBaseUrl: text("api_base_url"),
  apiDocsUrl: text("api_docs_url"),
  accessSummary: text("access_summary"),
  tags: text("tags"),
  version: text("version"),
  pricePerQuery: numeric("price_per_query"),
  creatorId: integer("creator_id").notNull(),
  imageUrl: text("image_url"),
  specialistNiche: text("specialist_niche"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  creatorIdx: index("ai_models_creator_idx").on(table.creatorId),
  statusIdx: index("ai_models_status_idx").on(table.modelStatus),
  categoryIdx: index("ai_models_category_idx").on(table.category),
}));

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
export const insertAiModelSchema = createInsertSchema(aiModels).omit({ id: true, createdAt: true, updatedAt: true });
export const insertRentalSchema = createInsertSchema(rentals).omit({ id: true, createdAt: true, status: true });

export const createAiModelInputSchema = insertAiModelSchema.extend({
  category: modelCategorySchema,
  onboardingMode: modelOnboardingModeSchema,
  pricingModel: modelPricingModeSchema,
  modelStatus: modelStatusSchema.default("draft"),
  provider: z.preprocess(
    (value) => typeof value === "string" && value.trim() === "" ? undefined : value,
    modelProviderSchema.optional(),
  ),
  modelIdentifier: optionalTextSchema,
  baseModel: optionalTextSchema,
  apiBaseUrl: optionalUrlSchema,
  apiDocsUrl: optionalUrlSchema,
  accessSummary: optionalTextSchema,
  tags: optionalTextSchema,
  version: optionalTextSchema,
  imageUrl: optionalUrlSchema,
  systemPrompt: optionalTextSchema,
  pricePerQuery: optionalPriceSchema,
  specialistNiche: optionalTextSchema,
}).superRefine((value, ctx) => {
  if (value.pricingModel === "per_request" && !value.pricePerQuery) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["pricePerQuery"],
      message: "Price per request is required for per-request listings.",
    });
  }

  if (value.pricingModel === "custom_quote" && !value.pricingLabel) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["pricingLabel"],
      message: "Pricing label is required for custom-quote listings.",
    });
  }

  if ((value.onboardingMode === "external_api" || value.onboardingMode === "self_hosted") && !value.apiBaseUrl) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["apiBaseUrl"],
      message: "An endpoint URL is required for external API and self-hosted listings.",
    });
  }

  if (value.onboardingMode === "provider_backed") {
    if (!value.provider) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["provider"],
        message: "Provider is required for provider-backed listings.",
      });
    }

    if (!value.modelIdentifier) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["modelIdentifier"],
        message: "Model identifier is required for provider-backed listings.",
      });
    }
  }

  if (value.onboardingMode === "prompt_only" && !value.systemPrompt) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["systemPrompt"],
      message: "System prompt is required for prompt-only listings.",
    });
  }
});

export const updateAiModelInputSchema = insertAiModelSchema
  .omit({ creatorId: true })
  .extend({
    category: modelCategorySchema.optional(),
    onboardingMode: modelOnboardingModeSchema.optional(),
    pricingModel: modelPricingModeSchema.optional(),
    modelStatus: modelStatusSchema.optional(),
    provider: modelProviderSchema.optional(),
    name: z.string().optional(),
    description: z.string().optional(),
    modelIdentifier: optionalTextSchema,
    baseModel: optionalTextSchema,
    apiBaseUrl: optionalUrlSchema,
    apiDocsUrl: optionalUrlSchema,
    accessSummary: optionalTextSchema,
    tags: optionalTextSchema,
    version: optionalTextSchema,
    imageUrl: optionalUrlSchema,
    systemPrompt: optionalTextSchema,
    pricePerQuery: optionalPriceSchema,
    pricingLabel: optionalTextSchema,
    specialistNiche: optionalTextSchema,
  })
  .partial();

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type AiModel = typeof aiModels.$inferSelect;
export type InsertAiModel = z.infer<typeof insertAiModelSchema>;
export type CreateAiModelInput = z.infer<typeof createAiModelInputSchema>;
export type UpdateAiModelInput = z.infer<typeof updateAiModelInputSchema>;

export type Rental = typeof rentals.$inferSelect;
export type InsertRental = z.infer<typeof insertRentalSchema>;

export type AiModelWithCreator = AiModel & { creator: User };
export type RentalWithDetails = Rental & { model: AiModel, renter: User };

export type ModelCategory = z.infer<typeof modelCategorySchema>;
export type ModelOnboardingMode = z.infer<typeof modelOnboardingModeSchema>;
export type ModelPricingMode = z.infer<typeof modelPricingModeSchema>;
export type ModelStatus = z.infer<typeof modelStatusSchema>;
export type ModelProvider = z.infer<typeof modelProviderSchema>;