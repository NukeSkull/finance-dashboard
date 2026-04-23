const assert = require("node:assert/strict");
const test = require("node:test");

const { RateLimitMiddleware } = require("../dist/security/rate-limit.middleware");
const { RateLimitService } = require("../dist/security/rate-limit.service");

test("allows requests under the read limit", () => {
  const middleware = createMiddleware();
  const request = createRequest({
    method: "GET",
    originalUrl: "/finance/monthly-summary?year=2026&month=4",
    ip: "203.0.113.5"
  });
  const response = createResponse();
  let nextCalled = false;

  middleware.use(request, response, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
});

test("returns 429 when the sensitive read limit is exceeded", () => {
  const middleware = createMiddleware({
    RATE_LIMIT_WINDOW_SECONDS: 60,
    RATE_LIMIT_MAX_SENSITIVE_READ_REQUESTS: 2
  });
  const request = createRequest({
    method: "GET",
    originalUrl: "/finance/monthly-summary?year=2026&month=4",
    ip: "203.0.113.5"
  });
  const response = createResponse();

  middleware.use(request, response, () => {});
  middleware.use(request, response, () => {});

  assert.throws(
    () => middleware.use(request, response, () => {}),
    /Too many requests/
  );
  assert.equal(response.headers["Retry-After"], "60");
});

test("applies stricter limits to quick add writes", () => {
  const middleware = createMiddleware({
    RATE_LIMIT_WINDOW_SECONDS: 60,
    RATE_LIMIT_MAX_WRITE_REQUESTS: 1
  });
  const request = createRequest({
    method: "POST",
    originalUrl: "/finance/quick-add-expense",
    ip: "203.0.113.10"
  });
  const response = createResponse();

  middleware.use(request, response, () => {});

  assert.throws(
    () => middleware.use(request, response, () => {}),
    /Too many requests/
  );
});

test("uses x-forwarded-for when present", () => {
  const middleware = createMiddleware({
    RATE_LIMIT_WINDOW_SECONDS: 60,
    RATE_LIMIT_MAX_READ_REQUESTS: 1
  });
  const response = createResponse();

  middleware.use(
    createRequest({
      method: "GET",
      originalUrl: "/finance/asset-purchases",
      ip: "10.0.0.1",
      headers: {
        "x-forwarded-for": "198.51.100.20, 10.0.0.1"
      }
    }),
    response,
    () => {}
  );

  assert.throws(
    () =>
      middleware.use(
        createRequest({
          method: "GET",
          originalUrl: "/finance/asset-purchases",
          ip: "10.0.0.2",
          headers: {
            "x-forwarded-for": "198.51.100.20, 10.0.0.2"
          }
        }),
        response,
        () => {}
      ),
    /Too many requests/
  );
});

test("bypasses rate limiting for localhost origins", () => {
  const middleware = createMiddleware({
    RATE_LIMIT_WINDOW_SECONDS: 60,
    RATE_LIMIT_MAX_READ_REQUESTS: 1,
    RATE_LIMIT_BYPASS_ORIGINS: "http://localhost:3000"
  });
  const response = createResponse();

  middleware.use(
    createRequest({
      method: "GET",
      originalUrl: "/finance/asset-purchases",
      ip: "203.0.113.20",
      headers: {
        origin: "http://localhost:3000"
      }
    }),
    response,
    () => {}
  );

  middleware.use(
    createRequest({
      method: "GET",
      originalUrl: "/finance/asset-purchases",
      ip: "203.0.113.20",
      headers: {
        origin: "http://localhost:3000"
      }
    }),
    response,
    () => {}
  );
});

function createMiddleware(overrides = {}) {
  return new RateLimitMiddleware(
    {
      get(key) {
        return overrides[key];
      }
    },
    new RateLimitService()
  );
}

function createRequest(input) {
  return {
    method: input.method,
    originalUrl: input.originalUrl,
    ip: input.ip,
    headers: input.headers ?? {}
  };
}

function createResponse() {
  return {
    headers: {},
    setHeader(key, value) {
      this.headers[key] = value;
    }
  };
}
