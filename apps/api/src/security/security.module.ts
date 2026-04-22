import { Module } from "@nestjs/common";
import { RateLimitMiddleware } from "./rate-limit.middleware";
import { RateLimitService } from "./rate-limit.service";

@Module({
  providers: [RateLimitService, RateLimitMiddleware],
  exports: [RateLimitService, RateLimitMiddleware]
})
export class SecurityModule {}
