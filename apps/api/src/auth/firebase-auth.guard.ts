import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import { Request } from "express";
import { DecodedIdToken } from "firebase-admin/auth";
import { FirebaseAdminService } from "./firebase-admin.service";

export type AuthenticatedRequest = Request & {
  user: DecodedIdToken;
};

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(private readonly firebaseAdminService: FirebaseAdminService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = extractBearerToken(request.headers.authorization);

    if (!token) {
      throw new UnauthorizedException("Missing bearer token.");
    }

    try {
      request.user = await this.firebaseAdminService.verifyIdToken(token);
      return true;
    } catch (error) {
      if (isServiceUnavailable(error)) {
        throw error;
      }

      throw new UnauthorizedException("Invalid bearer token.");
    }
  }
}

function extractBearerToken(authorization: string | undefined) {
  if (!authorization) {
    return null;
  }

  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
}

function isServiceUnavailable(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "getStatus" in error &&
    typeof error.getStatus === "function" &&
    error.getStatus() === 503
  );
}
