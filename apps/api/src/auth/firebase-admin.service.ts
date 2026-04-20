import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { App, cert, getApps, initializeApp } from "firebase-admin/app";
import { Auth, DecodedIdToken, getAuth } from "firebase-admin/auth";

@Injectable()
export class FirebaseAdminService {
  private app: App | null = null;

  constructor(private readonly configService: ConfigService) {}

  async verifyIdToken(idToken: string): Promise<DecodedIdToken> {
    return this.getAuth().verifyIdToken(idToken);
  }

  private getAuth(): Auth {
    return getAuth(this.getApp());
  }

  private getApp(): App {
    if (this.app) {
      return this.app;
    }

    const projectId = this.getRequiredConfig("FIREBASE_PROJECT_ID");
    const clientEmail = this.getRequiredConfig("FIREBASE_CLIENT_EMAIL");
    const privateKey = normalizeFirebasePrivateKey(
      this.getRequiredConfig("FIREBASE_PRIVATE_KEY")
    );

    this.app =
      getApps()[0] ??
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey
        })
      });

    return this.app;
  }

  private getRequiredConfig(key: string): string {
    const value = this.configService.get<string>(key);

    if (!value) {
      throw new ServiceUnavailableException(
        `Missing Firebase Admin configuration: ${key}`
      );
    }

    return value;
  }
}

export function normalizeFirebasePrivateKey(privateKey: string) {
  return privateKey
    .replace(/^["']|["']$/g, "")
    .replace(/\\n/g, "\n")
    .replace(/\r\n/g, "\n");
}
