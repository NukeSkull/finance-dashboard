import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const allowedOrigins = parseAllowedOrigins(
    configService.get<string>("FRONTEND_ORIGIN", "http://localhost:3000")
  );
  const httpAdapter = app.getHttpAdapter().getInstance();

  httpAdapter.set("trust proxy", 1);

  app.enableCors({
    origin(
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void
    ) {
      if (!origin) {
        callback(null, true);
        return;
      }

      callback(null, allowedOrigins.includes(origin));
    }
  });

  await app.listen(configService.get<number>("PORT", 4000));
}

void bootstrap();

function parseAllowedOrigins(rawOrigins: string) {
  return rawOrigins
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
    .filter((origin) => origin !== "*");
}
