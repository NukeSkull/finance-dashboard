import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NestMiddleware
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NextFunction, Request, Response } from "express";
import { RateLimitService } from "./rate-limit.service";

type RateLimitRule = {
  bucket: string;
  maxRequests: number;
  windowMs: number;
  reason: string;
};

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RateLimitMiddleware.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly rateLimitService: RateLimitService
  ) {}

  use(request: Request, response: Response, next: NextFunction) {
    if (this.shouldBypassRateLimit(request)) {
      next();
      return;
    }

    const rule = this.resolveRule(request);

    if (!rule) {
      next();
      return;
    }

    const clientIp = this.getClientIp(request);
    const result = this.rateLimitService.consume({
      key: `${rule.bucket}:${clientIp}`,
      maxRequests: rule.maxRequests,
      windowMs: rule.windowMs
    });

    if (result.allowed) {
      next();
      return;
    }

    const retryAfterSeconds = Math.max(1, Math.ceil(result.retryAfterMs / 1000));

    response.setHeader("Retry-After", String(retryAfterSeconds));

    this.logger.warn(
      JSON.stringify({
        route: this.getPathname(request),
        timestamp: new Date().toISOString(),
        reason: rule.reason,
        ip: clientIp
      })
    );

    throw new HttpException(
      "Too many requests. Please try again later.",
      HttpStatus.TOO_MANY_REQUESTS
    );
  }

  private resolveRule(request: Request): RateLimitRule | null {
    const pathname = this.getPathname(request);
    const method = request.method.toUpperCase();
    const windowMs = this.getWindowMs();

    if (method === "POST" && pathname === "/finance/quick-add-expense") {
      return {
        bucket: "finance-write",
        maxRequests: this.getPositiveNumber("RATE_LIMIT_MAX_WRITE_REQUESTS", 10),
        windowMs,
        reason: "write_rate_limit"
      };
    }

    if (
      method === "GET" &&
      (pathname === "/finance/expense-categories" ||
        pathname === "/finance/monthly-summary")
    ) {
      return {
        bucket: "finance-sensitive-read",
        maxRequests: this.getPositiveNumber(
          "RATE_LIMIT_MAX_SENSITIVE_READ_REQUESTS",
          30
        ),
        windowMs,
        reason: "sensitive_read_rate_limit"
      };
    }

    if (pathname.startsWith("/finance/")) {
      return {
        bucket: "finance-read",
        maxRequests: this.getPositiveNumber("RATE_LIMIT_MAX_READ_REQUESTS", 60),
        windowMs,
        reason: "read_rate_limit"
      };
    }

    return null;
  }

  private getWindowMs() {
    return (
      this.getPositiveNumber("RATE_LIMIT_WINDOW_SECONDS", 60) * 1000
    );
  }

  private getPositiveNumber(key: string, fallback: number) {
    const value = this.configService.get<number>(key);

    if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
      return fallback;
    }

    return value;
  }

  private shouldBypassRateLimit(request: Request) {
    const originHeader = request.headers.origin;
    const origin = typeof originHeader === "string" ? originHeader.trim() : "";
    const bypassOrigins = this.configService
      .get<string>("RATE_LIMIT_BYPASS_ORIGINS", "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    const clientIp = this.getClientIp(request);

    if (
      clientIp === "127.0.0.1" ||
      clientIp === "::1" ||
      clientIp === "::ffff:127.0.0.1"
    ) {
      return true;
    }

    return origin.length > 0 && bypassOrigins.includes(origin);
  }

  private getClientIp(request: Request) {
    const forwardedFor = request.headers["x-forwarded-for"];

    if (typeof forwardedFor === "string" && forwardedFor.trim().length > 0) {
      return forwardedFor.split(",")[0].trim();
    }

    return request.ip || "unknown";
  }

  private getPathname(request: Request) {
    return request.originalUrl.split("?")[0];
  }
}
