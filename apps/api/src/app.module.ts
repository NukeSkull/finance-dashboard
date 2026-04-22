import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
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
import { FinanceController } from "./finance/finance.controller";
import { SecurityModule } from "./security/security.module";
import { RateLimitMiddleware } from "./security/rate-limit.middleware";

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
    FinanceModule,
    SecurityModule
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RateLimitMiddleware).forRoutes(FinanceController);
  }
}
