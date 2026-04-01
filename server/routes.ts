import type { Express, Request } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import {
  modelOnboardingModeSchema,
  modelPricingModeSchema,
  modelProviderSchema,
  modelStatusSchema,
  updateAiModelInputSchema,
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const idParamSchema = z.object({ id: z.coerce.number().int().positive() });
  const MAX_QUALITY_SORT_SCAN = 1000;
  const actorHeaderSchema = z.coerce.number().int().positive();

  const getActorId = (req: Request): number | null => {
    const rawHeader = req.headers["x-user-id"];
    const value = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;
    if (!value) {
      return null;
    }

    const parsed = actorHeaderSchema.safeParse(value);
    return parsed.success ? parsed.data : null;
  };

  const requireActorId = (req: Request, res: any): number | null => {
    const actorId = getActorId(req);
    if (!actorId) {
      res.status(401).json({ message: "Authentication required", field: "x-user-id" });
      return null;
    }
    return actorId;
  };

  const qualityScoreOf = (m: {
    name?: string | null;
    description?: string | null;
    specialistNiche?: string | null;
    apiDocsUrl?: string | null;
    accessSummary?: string | null;
    tags?: string | null;
  }) => {
    let s = 0;
    if (m.name && m.name.length >= 4) s++;
    if (m.description && m.description.length >= 80) s++;
    if (m.specialistNiche) s++;
    if (m.apiDocsUrl) s++;
    if (m.accessSummary) s++;
    if (m.tags) s++;
    return s;
  };

  // Never expose the provider API key to any client.
  const omitApiKey = <T extends { providerApiKey?: string | null }>(m: T): Omit<T, "providerApiKey"> => {
    const { providerApiKey: _k, ...rest } = m;
    return rest;
  };

  app.get(api.users.list.path, async (req, res) => {
    const users = await storage.getUsers();
    res.json(users);
  });

  app.post(api.users.create.path, async (req, res) => {
    try {
      const input = api.users.create.input.parse(req.body);
      const user = await storage.createUser(input);
      res.status(201).json(user);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal Error" });
    }
  });

  app.get(api.models.list.path, async (req, res) => {
    try {
      const query = z.object({
        category: z.string().optional(),
        creatorId: z.coerce.number().int().positive().optional(),
        onboardingMode: modelOnboardingModeSchema.optional(),
        pricingModel: modelPricingModeSchema.optional(),
        provider: modelProviderSchema.optional(),
        modelStatus: modelStatusSchema.optional(),
        page: z.coerce.number().int().positive().default(1),
        pageSize: z.coerce.number().int().min(1).max(100).default(24),
        qualitySort: z.enum(["true", "false"]).optional(),
      }).parse(req.query);

      if (query.qualitySort === "true") {
        // Quality ordering needs to happen before pagination for consistent global ranking.
        const allModels = await storage.getAiModels({
          ...query,
          page: 1,
          pageSize: MAX_QUALITY_SORT_SCAN,
        });
        allModels.sort((a, b) => qualityScoreOf(b) - qualityScoreOf(a));
        const start = (query.page - 1) * query.pageSize;
        const end = start + query.pageSize;
        return res.json(allModels.slice(start, end).map(omitApiKey));
      }

      const models = await storage.getAiModels(query);
      res.json(models.map(omitApiKey));
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal Error" });
    }
  });

  app.get(api.models.get.path, async (req, res) => {
    try {
      const { id } = idParamSchema.parse(req.params);
      const model = await storage.getAiModel(id);
      if (!model) {
        return res.status(404).json({ message: 'Model not found' });
      }
      res.json(omitApiKey(model));
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal Error" });
    }
  });

  app.post(api.models.create.path, async (req, res) => {
    try {
      const actorId = requireActorId(req, res);
      if (!actorId) return;

      const parsedBody = z.object({
        creatorId: z.coerce.number().int().positive(),
      }).passthrough().parse(req.body);

      if (parsedBody.creatorId !== actorId) {
        return res.status(403).json({ message: "Creator does not match authenticated user", field: "creatorId" });
      }

      const input = api.models.create.input.parse({
        ...parsedBody,
        creatorId: parsedBody.creatorId,
      });

      const creator = await storage.getUser(input.creatorId);
      if (!creator) {
        return res.status(400).json({ message: "Creator not found", field: "creatorId" });
      }

      const model = await storage.createAiModel(input);
      res.status(201).json(omitApiKey(model));
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal Error" });
    }
  });

  app.patch(api.models.update.path, async (req, res) => {
    try {
      const actorId = requireActorId(req, res);
      if (!actorId) return;

      const { id } = idParamSchema.parse(req.params);
      const existing = await storage.getAiModel(id);
      if (!existing) return res.status(404).json({ message: "Model not found" });
      if (existing.creatorId !== actorId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const data = updateAiModelInputSchema.parse(req.body);
      const updated = await storage.updateAiModel(id, data);
      if (!updated) return res.status(404).json({ message: "Model not found" });
      res.json(omitApiKey(updated));
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal Error" });
    }
  });

  app.delete(api.models.delete.path, async (req, res) => {
    try {
      const actorId = requireActorId(req, res);
      if (!actorId) return;

      const { id } = idParamSchema.parse(req.params);
      const existing = await storage.getAiModel(id);
      if (!existing) return res.status(404).json({ message: "Model not found" });
      if (existing.creatorId !== actorId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const deleted = await storage.deleteAiModel(id);
      if (!deleted) return res.status(404).json({ message: "Model not found" });
      res.status(204).end();
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal Error" });
    }
  });

  app.get(api.rentals.list.path, async (req, res) => {
    try {
      const query = z.object({
        renterId: z.coerce.number().int().positive().optional(),
        page: z.coerce.number().int().positive().default(1),
        pageSize: z.coerce.number().int().min(1).max(100).default(24),
      }).parse(req.query);

      const rentals = await storage.getRentals(query);
      res.json(rentals);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal Error" });
    }
  });

  app.post(api.rentals.create.path, async (req, res) => {
    try {
      const actorId = requireActorId(req, res);
      if (!actorId) return;

      const bodySchema = api.rentals.create.input.extend({
        renterId: z.coerce.number().int().positive(),
        modelId: z.coerce.number().int().positive(),
      });
      const input = bodySchema.parse(req.body);

      if (input.renterId !== actorId) {
        return res.status(403).json({ message: "Renter does not match authenticated user", field: "renterId" });
      }

      const renter = await storage.getUser(input.renterId);
      if (!renter) {
        return res.status(404).json({ message: "Renter not found" });
      }

      const model = await storage.getAiModel(input.modelId);
      if (!model) {
        return res.status(404).json({ message: "Model not found" });
      }

      if (model.modelStatus !== "published" && model.modelStatus !== "beta") {
        return res.status(400).json({
          message: "Model must be published or beta to be rented.",
          field: "modelId",
        });
      }

      const alreadyRented = await storage.hasActiveRental(input.renterId, input.modelId);
      if (alreadyRented) {
        return res.status(400).json({ message: "You already have an active rental for this model." });
      }

      const rental = await storage.createRental(input);
      res.status(201).json(rental);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal Error" });
    }
  });

  app.patch(api.rentals.cancel.path, async (req, res) => {
    try {
      const actorId = requireActorId(req, res);
      if (!actorId) return;

      const { id } = idParamSchema.parse(req.params);
      const existing = await storage.getRentalById(id);
      if (!existing) return res.status(404).json({ message: "Rental not found" });
      if (existing.renterId !== actorId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const rental = await storage.cancelRental(id);
      if (!rental) return res.status(404).json({ message: "Rental not found" });
      res.json(rental);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal Error" });
    }
  });

  // Publisher analytics — rental counts for a specific listing
  app.get("/api/models/:id/stats", async (req, res) => {
    try {
      const actorId = requireActorId(req, res);
      if (!actorId) return;

      const { id: modelId } = idParamSchema.parse(req.params);
      const model = await storage.getAiModel(modelId);
      if (!model) return res.status(404).json({ message: "Model not found" });
      if (model.creatorId !== actorId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const rentalList = await storage.getRentalsByModelId(modelId);
      res.json({
        modelId,
        totalRentals: rentalList.length,
        activeRentals: rentalList.filter((r) => r.status === "active").length,
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal Error" });
    }
  });

  // Token validation — publishers call this to verify renter access
  app.post("/api/validate-token", async (req, res) => {
    try {
      const tokenSchema = z.object({ token: z.string() });
      const parsed = tokenSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ valid: false, error: "Invalid token format" });
      }

      const token = parsed.data.token.trim();
      // Expected format: nm_{rentalId}_auth_token
      const match = /^nm_(\d+)_auth_token$/.exec(token);
      if (!match) {
        return res.status(400).json({ valid: false, error: "Invalid token format" });
      }

      const rentalId = Number(match[1]);
      const rental = await storage.getRentalById(rentalId);

      if (!rental || rental.status !== "active") {
        return res.status(401).json({ valid: false, error: "Token not found or rental is not active" });
      }

      res.json({
        valid: true,
        rentalId: rental.id,
        modelId: rental.modelId,
        renterId: rental.renterId,
        status: rental.status,
      });
    } catch (_err) {
      return res.status(500).json({ valid: false, error: "Internal Error" });
    }
  });

  // ─── Neuromart Relay ──────────────────────────────────────────────────────
  // Renters call this endpoint; Neuromart proxies to the provider on their behalf.
  // Authorization: Bearer nm_{rentalId}_auth_token
  app.post("/api/inference/:modelId", async (req, res) => {
    try {
      const { id: modelId } = idParamSchema.parse(req.params);

      // Validate Bearer token
      const authHeader = req.headers["authorization"];
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Missing or invalid Authorization header" });
      }
      const token = authHeader.slice(7).trim();
      const tokenMatch = /^nm_(\d+)_auth_token$/.exec(token);
      if (!tokenMatch) {
        return res.status(401).json({ error: "Invalid token format" });
      }

      const rentalId = Number(tokenMatch[1]);
      const rental = await storage.getRentalById(rentalId);
      if (!rental || rental.status !== "active") {
        return res.status(401).json({ error: "Token not found or rental is not active" });
      }
      if (rental.modelId !== modelId) {
        return res.status(403).json({ error: "Token is not authorised for this model" });
      }

      const model = await storage.getAiModel(modelId);
      if (!model) return res.status(404).json({ error: "Model not found" });

      // Parse request body — accept { prompt } or { messages }
      const bodySchema = z.object({
        prompt: z.string().optional(),
        messages: z.array(z.object({
          role: z.enum(["user", "assistant", "system"]),
          content: z.string(),
        })).optional(),
      }).refine((b) => Boolean(b.prompt || (b.messages && b.messages.length > 0)), {
        message: "Either prompt or messages is required",
      });
      const body = bodySchema.parse(req.body);
      const userMessages: { role: "user" | "assistant" | "system"; content: string }[] =
        body.messages ?? [{ role: "user" as const, content: body.prompt! }];

      const { onboardingMode, provider, providerApiKey } = model;
      const apiKey = providerApiKey ?? undefined;

      // Self-hosted models manage their own servers — no relay available
      if (onboardingMode === "self_hosted") {
        return res.status(501).json({ error: "Self-hosted models route traffic to the provider's own servers. Contact the publisher for access." });
      }

      // External API — transparent proxy to apiBaseUrl
      if (onboardingMode === "external_api") {
        if (!model.apiBaseUrl) {
          return res.status(502).json({ error: "Model has no endpoint URL configured" });
        }
        const proxyRes = await fetch(model.apiBaseUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
          },
          body: JSON.stringify({ messages: userMessages }),
          signal: AbortSignal.timeout(30_000),
        });
        const proxyData = await proxyRes.json();
        return res.status(proxyRes.status).json(proxyData);
      }

      // prompt_only / provider_backed — Neuromart calls the underlying provider
      const systemPrompt = model.systemPrompt ?? undefined;
      const messages: { role: string; content: string }[] = [
        ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
        ...userMessages,
      ];
      const resolvedProvider = provider ?? "openai";

      if (resolvedProvider === "anthropic") {
        const effectiveKey = apiKey ?? process.env.ANTHROPIC_API_KEY;
        if (!effectiveKey) {
          return res.status(503).json({ error: "No API key configured for Anthropic provider" });
        }
        const aSystem = messages.find((m) => m.role === "system")?.content;
        const aMessages = messages.filter((m) => m.role !== "system");
        const aRes = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": effectiveKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: model.modelIdentifier ?? "claude-3-5-haiku-20241022",
            max_tokens: 4096,
            ...(aSystem ? { system: aSystem } : {}),
            messages: aMessages,
          }),
          signal: AbortSignal.timeout(60_000),
        });
        const aData = await aRes.json();
        return res.status(aRes.status).json(aData);
      }

      // OpenAI-compatible path: openai, google, azure, huggingface, custom
      let baseUrl = "https://api.openai.com/v1";
      if (resolvedProvider === "azure" || resolvedProvider === "custom") {
        baseUrl = model.apiBaseUrl ?? baseUrl;
      } else if (resolvedProvider === "google") {
        baseUrl = "https://generativelanguage.googleapis.com/v1beta/openai";
      } else if (resolvedProvider === "huggingface") {
        baseUrl = "https://api-inference.huggingface.co/v1";
      }

      const effectiveKey = apiKey ?? process.env.OPENAI_API_KEY;
      if (!effectiveKey) {
        return res.status(503).json({ error: `No API key configured for ${resolvedProvider} provider` });
      }
      const oaiRes = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${effectiveKey}`,
        },
        body: JSON.stringify({
          model: model.modelIdentifier ?? "gpt-4o-mini",
          messages,
        }),
        signal: AbortSignal.timeout(60_000),
      });
      const oaiData = await oaiRes.json();
      return res.status(oaiRes.status).json(oaiData);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: err.errors[0].message });
      }
      return res.status(500).json({ error: "Internal Error" });
    }
  });

  // Seed database
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  try {
    const existingUsers = await storage.getUsers();
    if (existingUsers.length === 0) {
      const user1 = await storage.createUser({ username: "alice_ai", displayName: "Alice Smith" });
      const user2 = await storage.createUser({ username: "bob_hacker", displayName: "Bob Jones" });

      const model1 = await storage.createAiModel({
        name: "Cortisol-Sleep Mapper",
        description: "A bio-tech API that correlates wearable HRV and cortisol proxy signals with sleep architecture patterns to generate personalized recovery protocols.",
        systemPrompt: "You are a clinical sleep scientist who analyzes biometric time-series data and produces actionable sleep optimization plans...",
        category: "Bio-Tech",
        specialistNiche: "Cortisol-Sleep Mapper",
        onboardingMode: "prompt_only",
        pricingModel: "per_request",
        modelStatus: "published",
        pricingLabel: "$0.08 per request",
        tags: "sleep,biometrics,HRV,cortisol",
        version: "1.2",
        pricePerQuery: "0.08",
        creatorId: user1.id,
      });

      const model2 = await storage.createAiModel({
        name: "Contract Small Print Scanner",
        description: "A legal & security workflow API that surfaces hidden clauses, renewal traps, and negotiation pressure points in commercial contracts using multi-pass analysis.",
        systemPrompt: null,
        category: "Legal & Security",
        specialistNiche: "Contract Small Print Scanner",
        onboardingMode: "provider_backed",
        pricingModel: "per_request",
        modelStatus: "published",
        provider: "openai",
        modelIdentifier: "gpt-4.1",
        baseModel: "GPT-4.1",
        pricingLabel: "$0.15 per request",
        tags: "contracts,compliance,legal-review",
        version: "2026-03",
        pricePerQuery: "0.15",
        creatorId: user2.id,
        apiDocsUrl: "https://docs.example.com/contract-scanner",
        accessSummary: "Instant API key provisioning after purchase. Supports batch and single-document analysis.",
      });

      await storage.createAiModel({
        name: "Multi-Paper Synthesizer",
        description: "A self-hosted academic research endpoint that clusters papers, filings, and analyst reports into structured literature reviews with citation graphs.",
        systemPrompt: null,
        category: "Academic & Research",
        specialistNiche: "Multi-Paper Synthesizer",
        onboardingMode: "self_hosted",
        pricingModel: "custom_quote",
        pricingLabel: "Custom team pricing",
        modelStatus: "beta",
        provider: "custom",
        apiBaseUrl: "https://research-api.example.com/v1",
        apiDocsUrl: "https://research-api.example.com/docs",
        accessSummary: "Private deployment with onboarding support and rate limits based on contract.",
        tags: "research,literature-review,citations,synthesis",
        version: "0.9-beta",
        pricePerQuery: null,
        creatorId: user1.id,
      });

      await storage.createAiModel({
        name: "K8s Cost Shrinker",
        description: "An engineering & DevOps external API that continuously analyzes Kubernetes cluster resource allocation and recommends right-sizing changes that cut cloud spend by 20-40%.",
        systemPrompt: null,
        category: "Engineering & DevOps",
        specialistNiche: "K8s Cost Shrinker",
        onboardingMode: "external_api",
        pricingModel: "custom_quote",
        pricingLabel: "Quoted by cluster size",
        modelStatus: "published",
        provider: "custom",
        apiBaseUrl: "https://k8s-optimizer.example.com/api",
        apiDocsUrl: "https://k8s-optimizer.example.com/docs",
        accessSummary: "Managed API with enterprise onboarding, Prometheus integration, and implementation support.",
        tags: "kubernetes,cost-optimization,cloud,devops",
        version: "2.0",
        pricePerQuery: null,
        creatorId: user2.id,
      });

      await storage.createAiModel({
        name: "MEV Arbitrage Predictor",
        description: "A DeFi specialist that scans pending mempool transactions and predicts profitable MEV extraction opportunities across Ethereum and L2 chains in real-time.",
        systemPrompt: "You are a quantitative DeFi analyst who identifies MEV opportunities from mempool transaction data...",
        category: "DeFi & Web3",
        specialistNiche: "MEV Arbitrage Predictor",
        onboardingMode: "prompt_only",
        pricingModel: "per_request",
        modelStatus: "published",
        pricingLabel: "$0.25 per request",
        tags: "MEV,arbitrage,DeFi,ethereum",
        version: "1.0",
        pricePerQuery: "0.25",
        creatorId: user1.id,
      });

      await storage.createAiModel({
        name: "Drone Battery Path Planner",
        description: "A logistics API that computes energy-optimal flight paths for delivery drones considering wind, payload, battery degradation curves, and no-fly zones.",
        systemPrompt: null,
        category: "Logistics",
        specialistNiche: "Drone Battery Path Planner",
        onboardingMode: "external_api",
        pricingModel: "per_request",
        modelStatus: "published",
        provider: "custom",
        apiBaseUrl: "https://drone-path.example.com/v1",
        apiDocsUrl: "https://drone-path.example.com/docs",
        accessSummary: "REST API with GeoJSON input/output. API key issued immediately after purchase.",
        tags: "drones,logistics,path-planning,energy",
        version: "1.5",
        pricePerQuery: "0.12",
        creatorId: user2.id,
      });

      await storage.createRental({
        renterId: user1.id,
        modelId: model2.id,
      });
    }
  } catch (err) {
    console.error("Seed error:", err);
  }
}