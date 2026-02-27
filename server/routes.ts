import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

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
    const category = req.query.category as string | undefined;
    const models = await storage.getAiModels(category);
    res.json(models);
  });

  app.get(api.models.get.path, async (req, res) => {
    const model = await storage.getAiModel(Number(req.params.id));
    if (!model) {
      return res.status(404).json({ message: 'Model not found' });
    }
    res.json(model);
  });

  app.post(api.models.create.path, async (req, res) => {
    try {
      const bodySchema = api.models.create.input.extend({
        pricePerQuery: z.string().or(z.number()).transform(v => String(v)),
        creatorId: z.coerce.number(),
      });
      const input = bodySchema.parse(req.body);
      const model = await storage.createAiModel(input);
      res.status(201).json(model);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal Error" });
    }
  });

  app.get(api.rentals.list.path, async (req, res) => {
    const renterId = req.query.renterId ? Number(req.query.renterId) : undefined;
    const rentals = await storage.getRentals(renterId);
    res.json(rentals);
  });

  app.post(api.rentals.create.path, async (req, res) => {
    try {
      const bodySchema = api.rentals.create.input.extend({
        renterId: z.coerce.number(),
        modelId: z.coerce.number(),
      });
      const input = bodySchema.parse(req.body);
      const rental = await storage.createRental(input);
      res.status(201).json(rental);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal Error" });
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
        name: "Grandma's Recipe Bot",
        description: "A fine-tuned model trained on 50 years of family recipes. Great at baking substitutions!",
        systemPrompt: "You are an expert grandmother baker...",
        category: "Cooking",
        pricePerQuery: "0.05",
        creatorId: user1.id,
      });

      const model2 = await storage.createAiModel({
        name: "Legal Assistant Beta",
        description: "Trained on open source legal docs. Can summarize contracts. NOT REAL LEGAL ADVICE.",
        systemPrompt: "You are a legal summarizer...",
        category: "Productivity",
        pricePerQuery: "0.15",
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