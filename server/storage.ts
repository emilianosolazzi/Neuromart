import { db, hasDatabase } from "./db";
import {
  users, aiModels, rentals,
  type User, type InsertUser,
  type AiModel, type InsertAiModel,
  type Rental, type InsertRental,
  type AiModelWithCreator,
  type RentalWithDetails,
  type UpdateAiModelInput
} from "@shared/schema";
import { and, eq, desc } from "drizzle-orm";

export type ModelListOptions = {
  category?: string;
  creatorId?: number;
  onboardingMode?: string;
  pricingModel?: string;
  provider?: string;
  modelStatus?: string;
  page?: number;
  pageSize?: number;
};

export type RentalListOptions = {
  renterId?: number;
  page?: number;
  pageSize?: number;
};

export interface IStorage {
  getUsers(): Promise<User[]>;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getAiModels(options?: ModelListOptions): Promise<AiModelWithCreator[]>;
  getAiModel(id: number): Promise<AiModelWithCreator | undefined>;
  createAiModel(model: InsertAiModel): Promise<AiModel>;
  updateAiModel(id: number, data: UpdateAiModelInput): Promise<AiModel | undefined>;
  deleteAiModel(id: number): Promise<boolean>;

  getRentals(options?: RentalListOptions): Promise<RentalWithDetails[]>;
  getRentalById(id: number): Promise<RentalWithDetails | undefined>;
  getRentalsByModelId(modelId: number): Promise<RentalWithDetails[]>;
  createRental(rental: InsertRental): Promise<Rental>;
  cancelRental(id: number): Promise<Rental | undefined>;
  hasActiveRental(renterId: number, modelId: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUsers(): Promise<User[]> {
    if (!db) {
      throw new Error("Database is not configured.");
    }
    return await db.select().from(users);
  }

  async getUser(id: number): Promise<User | undefined> {
    if (!db) {
      throw new Error("Database is not configured.");
    }
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    if (!db) {
      throw new Error("Database is not configured.");
    }
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    if (!db) {
      throw new Error("Database is not configured.");
    }
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getAiModels(options?: ModelListOptions): Promise<AiModelWithCreator[]> {
    if (!db) {
      throw new Error("Database is not configured.");
    }
    const page = options?.page ?? 1;
    const pageSize = options?.pageSize ?? 24;

    const filters = [
      options?.category ? eq(aiModels.category, options.category) : undefined,
      options?.creatorId ? eq(aiModels.creatorId, options.creatorId) : undefined,
      options?.onboardingMode ? eq(aiModels.onboardingMode, options.onboardingMode) : undefined,
      options?.pricingModel ? eq(aiModels.pricingModel, options.pricingModel) : undefined,
      options?.provider ? eq(aiModels.provider, options.provider) : undefined,
      options?.modelStatus ? eq(aiModels.modelStatus, options.modelStatus) : undefined,
    ].filter((v): v is Exclude<typeof v, undefined> => Boolean(v));

    const results = await db.query.aiModels.findMany({
      where: filters.length > 0 ? and(...filters) : undefined,
      with: {
        creator: true
      },
      orderBy: [desc(aiModels.createdAt)],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    return results as AiModelWithCreator[];
  }

  async getAiModel(id: number): Promise<AiModelWithCreator | undefined> {
    if (!db) {
      throw new Error("Database is not configured.");
    }
    return await db.query.aiModels.findFirst({
      where: eq(aiModels.id, id),
      with: {
        creator: true
      }
    }) as AiModelWithCreator | undefined;
  }

  async createAiModel(insertModel: InsertAiModel): Promise<AiModel> {
    if (!db) {
      throw new Error("Database is not configured.");
    }
    const [model] = await db.insert(aiModels).values(insertModel).returning();
    return model;
  }

  async updateAiModel(id: number, data: UpdateAiModelInput): Promise<AiModel | undefined> {
    if (!db) {
      throw new Error("Database is not configured.");
    }
    const [updated] = await db.update(aiModels).set({ ...data, updatedAt: new Date() }).where(eq(aiModels.id, id)).returning();
    return updated;
  }

  async deleteAiModel(id: number): Promise<boolean> {
    if (!db) {
      throw new Error("Database is not configured.");
    }
    const [deleted] = await db.delete(aiModels).where(eq(aiModels.id, id)).returning();
    return !!deleted;
  }

  async getRentals(options?: RentalListOptions): Promise<RentalWithDetails[]> {
    if (!db) {
      throw new Error("Database is not configured.");
    }
    const page = options?.page ?? 1;
    const pageSize = options?.pageSize ?? 24;

    const results = await db.query.rentals.findMany({
      where: options?.renterId ? eq(rentals.renterId, options.renterId) : undefined,
      with: {
        model: true,
        renter: true
      },
      orderBy: [desc(rentals.createdAt)],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });
    return results as unknown as RentalWithDetails[];
  }

  async getRentalById(id: number): Promise<RentalWithDetails | undefined> {
    if (!db) {
      throw new Error("Database is not configured.");
    }
    const rental = await db.query.rentals.findFirst({
      where: eq(rentals.id, id),
      with: { model: true, renter: true },
    });
    return rental as unknown as RentalWithDetails | undefined;
  }

  async getRentalsByModelId(modelId: number): Promise<RentalWithDetails[]> {
    if (!db) {
      throw new Error("Database is not configured.");
    }
    const results = await db.query.rentals.findMany({
      where: eq(rentals.modelId, modelId),
      with: { model: true, renter: true },
      orderBy: [desc(rentals.createdAt)],
    });
    return results as unknown as RentalWithDetails[];
  }

  async createRental(insertRental: InsertRental): Promise<Rental> {
    if (!db) {
      throw new Error("Database is not configured.");
    }
    const [rental] = await db.insert(rentals).values(insertRental).returning();
    return rental;
  }

  async cancelRental(id: number): Promise<Rental | undefined> {
    if (!db) {
      throw new Error("Database is not configured.");
    }
    const [updated] = await db.update(rentals).set({ status: "cancelled" }).where(eq(rentals.id, id)).returning();
    return updated;
  }

  async hasActiveRental(renterId: number, modelId: number): Promise<boolean> {
    if (!db) {
      throw new Error("Database is not configured.");
    }
    const existing = await db.select().from(rentals).where(
      and(eq(rentals.renterId, renterId), eq(rentals.modelId, modelId), eq(rentals.status, "active"))
    );
    return existing.length > 0;
  }
}

class MemoryStorage implements IStorage {
  private users: User[] = [];
  private aiModels: AiModel[] = [];
  private rentals: Rental[] = [];
  private userIdCounter = 1;
  private modelIdCounter = 1;
  private rentalIdCounter = 1;

  async getUsers(): Promise<User[]> {
    return [...this.users];
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.find((user) => user.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.users.find((user) => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      id: this.userIdCounter++,
      ...insertUser,
    };

    this.users.push(user);
    return user;
  }

  async getAiModels(options?: ModelListOptions): Promise<AiModelWithCreator[]> {
    const page = options?.page ?? 1;
    const pageSize = options?.pageSize ?? 24;

    const filtered = this.aiModels
      .filter((model) => !options?.category || model.category === options.category)
      .filter((model) => !options?.creatorId || model.creatorId === options.creatorId)
      .filter((model) => !options?.onboardingMode || model.onboardingMode === options.onboardingMode)
      .filter((model) => !options?.pricingModel || model.pricingModel === options.pricingModel)
      .filter((model) => !options?.provider || model.provider === options.provider)
      .filter((model) => !options?.modelStatus || model.modelStatus === options.modelStatus)
      .sort((left, right) => {
        const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
        const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
        return rightTime - leftTime;
      })
      .slice((page - 1) * pageSize, page * pageSize);

    return filtered
      .map((model) => {
        const creator = this.users.find((user) => user.id === model.creatorId);
        return creator ? { ...model, creator } : undefined;
      })
      .filter((model): model is AiModelWithCreator => Boolean(model));
  }

  async getAiModel(id: number): Promise<AiModelWithCreator | undefined> {
    const model = this.aiModels.find((entry) => entry.id === id);
    if (!model) {
      return undefined;
    }

    const creator = this.users.find((user) => user.id === model.creatorId);
    if (!creator) {
      return undefined;
    }

    return { ...model, creator };
  }

  async createAiModel(insertModel: InsertAiModel): Promise<AiModel> {
    const model: AiModel = {
      id: this.modelIdCounter++,
      name: insertModel.name,
      description: insertModel.description,
      systemPrompt: insertModel.systemPrompt ?? null,
      category: insertModel.category,
      onboardingMode: insertModel.onboardingMode ?? "prompt_only",
      pricingModel: insertModel.pricingModel ?? "per_request",
      pricingLabel: insertModel.pricingLabel ?? null,
      modelStatus: insertModel.modelStatus ?? "draft",
      provider: insertModel.provider ?? null,
      modelIdentifier: insertModel.modelIdentifier ?? null,
      baseModel: insertModel.baseModel ?? null,
      apiBaseUrl: insertModel.apiBaseUrl ?? null,
      apiDocsUrl: insertModel.apiDocsUrl ?? null,
      accessSummary: insertModel.accessSummary ?? null,
      tags: insertModel.tags ?? null,
      version: insertModel.version ?? null,
      pricePerQuery: insertModel.pricePerQuery ?? null,
      creatorId: insertModel.creatorId,
      imageUrl: insertModel.imageUrl ?? null,
      specialistNiche: insertModel.specialistNiche ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.aiModels.push(model);
    return model;
  }

  async updateAiModel(id: number, data: UpdateAiModelInput): Promise<AiModel | undefined> {
    const idx = this.aiModels.findIndex((m) => m.id === id);
    if (idx === -1) return undefined;
    this.aiModels[idx] = { ...this.aiModels[idx], ...data, updatedAt: new Date() };
    return this.aiModels[idx];
  }

  async deleteAiModel(id: number): Promise<boolean> {
    const idx = this.aiModels.findIndex((m) => m.id === id);
    if (idx === -1) return false;
    this.aiModels.splice(idx, 1);
    return true;
  }

  async getRentals(options?: RentalListOptions): Promise<RentalWithDetails[]> {
    const page = options?.page ?? 1;
    const pageSize = options?.pageSize ?? 24;

    const filtered = this.rentals
      .filter((rental) => !options?.renterId || rental.renterId === options.renterId)
      .sort((left, right) => {
        const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
        const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
        return rightTime - leftTime;
      })
      .slice((page - 1) * pageSize, page * pageSize);

    return filtered
      .map((rental) => {
        const renter = this.users.find((user) => user.id === rental.renterId);
        const model = this.aiModels.find((entry) => entry.id === rental.modelId);

        return renter && model ? { ...rental, renter, model } : undefined;
      })
      .filter((rental): rental is RentalWithDetails => Boolean(rental));
  }

  async getRentalById(id: number): Promise<RentalWithDetails | undefined> {
    const rental = this.rentals.find((r) => r.id === id);
    if (!rental) return undefined;
    const renter = this.users.find((u) => u.id === rental.renterId);
    const model = this.aiModels.find((m) => m.id === rental.modelId);
    return renter && model ? { ...rental, renter, model } : undefined;
  }

  async getRentalsByModelId(modelId: number): Promise<RentalWithDetails[]> {
    return this.rentals
      .filter((rental) => rental.modelId === modelId)
      .map((rental) => {
        const renter = this.users.find((u) => u.id === rental.renterId);
        const model = this.aiModels.find((m) => m.id === rental.modelId);
        return renter && model ? { ...rental, renter, model } : undefined;
      })
      .filter((r): r is RentalWithDetails => Boolean(r));
  }

  async createRental(insertRental: InsertRental): Promise<Rental> {
    const rental: Rental = {
      id: this.rentalIdCounter++,
      renterId: insertRental.renterId,
      modelId: insertRental.modelId,
      status: "active",
      createdAt: new Date(),
    };

    this.rentals.push(rental);
    return rental;
  }

  async cancelRental(id: number): Promise<Rental | undefined> {
    const rental = this.rentals.find((r) => r.id === id);
    if (!rental) return undefined;
    rental.status = "cancelled";
    return rental;
  }

  async hasActiveRental(renterId: number, modelId: number): Promise<boolean> {
    return this.rentals.some(
      (r) => r.renterId === renterId && r.modelId === modelId && r.status === "active"
    );
  }
}

export const storage = hasDatabase ? new DatabaseStorage() : new MemoryStorage();