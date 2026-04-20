import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MongoClient } from "mongodb";

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private client: MongoClient | null = null;
  private configured = false;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const mongodbUri = this.configService.get<string>("MONGODB_URI");

    if (!mongodbUri) {
      this.logger.warn("MONGODB_URI is not configured. Skipping MongoDB connection.");
      return;
    }

    this.configured = true;
    this.client = new MongoClient(mongodbUri);
    await this.client.connect();
    this.logger.log("MongoDB connection established.");
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.close();
      this.logger.log("MongoDB connection closed.");
    }
  }

  isConfigured() {
    return this.configured;
  }

  getClient() {
    return this.client;
  }
}
