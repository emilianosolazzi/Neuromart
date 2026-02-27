import { db } from "./db";
import {
  users, aiModels, rentals,
  type User, type InsertUser,
  type AiModel, type InsertAiModel,
  type Rental, type InsertRental,
  type AiModelWithCreator,
  type RentalWithDetails
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getUsers(): Promise<User[]>;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getAiModels(category?: string): Promise<AiModelWithCreator[]>;
  getAiModel(id: number): Promise<AiModelWithCreator | undefined>;
  createAiModel(model: InsertAiModel): Promise<AiModel>;

  getRentals(renterId?: number): Promise<RentalWithDetails[]>;
  createRental(rental: InsertRental): Promise<Rental>;
}

export class DatabaseStorage implements IStorage {
  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getAiModels(category?: string): Promise<AiModelWithCreator[]> {
    const results = await db.query.aiModels.findMany({
      with: {
        creator: true
      },
      orderBy: [desc(aiModels.createdAt)]
    });
    
    if (category) {
       return results.filter(r => r.category.toLowerCase() === category.toLowerCase());
    }
    return results as AiModelWithCreator[];
  }

  async getAiModel(id: number): Promise<AiModelWithCreator | undefined> {
    return await db.query.aiModels.findFirst({
      where: eq(aiModels.id, id),
      with: {
        creator: true
      }
    }) as AiModelWithCreator | undefined;
  }

  async createAiModel(insertModel: InsertAiModel): Promise<AiModel> {
    const [model] = await db.insert(aiModels).values(insertModel).returning();
    return model;
  }

  async getRentals(renterId?: number): Promise<RentalWithDetails[]> {
    const results = await db.query.rentals.findMany({
      where: renterId ? eq(rentals.renterId, renterId) : undefined,
      with: {
        model: true,
        renter: true
      },
      orderBy: [desc(rentals.createdAt)]
    });
    return results as unknown as RentalWithDetails[];
  }

  async createRental(insertRental: InsertRental): Promise<Rental> {
    const [rental] = await db.insert(rentals).values(insertRental).returning();
    return rental;
  }
}

export const storage = new DatabaseStorage();