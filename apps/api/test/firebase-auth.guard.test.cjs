const assert = require("node:assert/strict");
const test = require("node:test");
const {
  ServiceUnavailableException,
  UnauthorizedException
} = require("@nestjs/common");

const { FirebaseAuthGuard } = require("../dist/auth/firebase-auth.guard");

test("rejects missing bearer token", async () => {
  const guard = new FirebaseAuthGuard({
    verifyIdToken: async () => ({ uid: "user-1" })
  });
  const request = { headers: {} };

  await assert.rejects(
    () => guard.canActivate(createExecutionContext(request)),
    (error) => {
      assert.ok(error instanceof UnauthorizedException);
      assert.equal(error.message, "Missing bearer token.");
      return true;
    }
  );
});

test("rejects malformed authorization header", async () => {
  const guard = new FirebaseAuthGuard({
    verifyIdToken: async () => ({ uid: "user-1" })
  });
  const request = {
    headers: {
      authorization: "Token abc"
    }
  };

  await assert.rejects(
    () => guard.canActivate(createExecutionContext(request)),
    (error) => {
      assert.ok(error instanceof UnauthorizedException);
      assert.equal(error.message, "Missing bearer token.");
      return true;
    }
  );
});

test("rejects invalid bearer token", async () => {
  const guard = new FirebaseAuthGuard({
    verifyIdToken: async () => {
      throw new Error("invalid token");
    }
  });
  const request = {
    headers: {
      authorization: "Bearer bad-token"
    }
  };

  await assert.rejects(
    () => guard.canActivate(createExecutionContext(request)),
    (error) => {
      assert.ok(error instanceof UnauthorizedException);
      assert.equal(error.message, "Invalid bearer token.");
      return true;
    }
  );
});

test("propagates service unavailable errors from Firebase Admin", async () => {
  const guard = new FirebaseAuthGuard({
    verifyIdToken: async () => {
      throw new ServiceUnavailableException("Firebase unavailable");
    }
  });
  const request = {
    headers: {
      authorization: "Bearer valid-looking-token"
    }
  };

  await assert.rejects(
    () => guard.canActivate(createExecutionContext(request)),
    (error) => {
      assert.ok(error instanceof ServiceUnavailableException);
      assert.equal(error.message, "Firebase unavailable");
      return true;
    }
  );
});

test("stores decoded user on request when token is valid", async () => {
  const decodedToken = { uid: "user-1", email: "demo@example.com" };
  const guard = new FirebaseAuthGuard({
    verifyIdToken: async (token) => {
      assert.equal(token, "good-token");
      return decodedToken;
    }
  });
  const request = {
    headers: {
      authorization: "Bearer good-token"
    }
  };

  const allowed = await guard.canActivate(createExecutionContext(request));

  assert.equal(allowed, true);
  assert.equal(request.user, decodedToken);
});

function createExecutionContext(request) {
  return {
    switchToHttp() {
      return {
        getRequest() {
          return request;
        }
      };
    }
  };
}
