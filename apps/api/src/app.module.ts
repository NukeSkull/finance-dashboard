import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import configuration from "./config/configuration";
import { validateEnv } from "./config/env.schema";
import { AuthModule } from "./auth/auth.module";
import { DatabaseModule } from "./database/database.module";
import { FinanceModule } from "./finance/finance.module";
import { HealthModule } from "./health/health.module";
import { SheetsModule } from "./sheets/sheets.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [".env", "../../.env"],
      isGlobal: true,
      load: [configuration],
      validate: validateEnv
    }),
    HealthModule,
    DatabaseModule,
    AuthModule,
    SheetsModule,
    FinanceModule
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
