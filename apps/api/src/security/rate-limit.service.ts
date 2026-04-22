import { Injectable } from "@nestjs/common";

type RateLimitWindow = {
  count: number;
  resetAt: number;
};

type ConsumeRateLimitInput = {
  key: string;
  maxRequests: number;
  windowMs: number;
};

type ConsumeRateLimitResult =
  | {
      allowed: true;
      remaining: number;
      resetAt: number;
    }
  | {
      allowed: false;
      retryAfterMs: number;
      resetAt: number;
    };

@Injectable()
export class RateLimitService {
  private readonly windows = new Map<string, RateLimitWindow>();

  consume(input: ConsumeRateLimitInput): ConsumeRateLimitResult {
    const now = Date.now();
    const currentWindow = this.windows.get(input.key);

    if (!currentWindow || currentWindow.resetAt <= now) {
      const nextWindow = {
        count: 1,
        resetAt: now + input.windowMs
      };

      this.windows.set(input.key, nextWindow);

      return {
        allowed: true,
        remaining: Math.max(0, input.maxRequests - nextWindow.count),
        resetAt: nextWindow.resetAt
      };
    }

    if (currentWindow.count >= input.maxRequests) {
      return {
        allowed: false,
        retryAfterMs: Math.max(0, currentWindow.resetAt - now),
        resetAt: currentWindow.resetAt
      };
    }

    currentWindow.count += 1;

    return {
      allowed: true,
      remaining: Math.max(0, input.maxRequests - currentWindow.count),
      resetAt: currentWindow.resetAt
    };
  }
}
