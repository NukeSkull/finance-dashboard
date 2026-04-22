import type { NextConfig } from "next";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const firebaseAuthDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const apiOrigin = getOrigin(apiUrl);
const connectSources = [
  "'self'",
  apiOrigin,
  "https://identitytoolkit.googleapis.com",
  "https://securetoken.googleapis.com",
  "https://firebaseinstallations.googleapis.com",
  "https://www.googleapis.com",
  "https://www.gstatic.com"
];

if (firebaseAuthDomain) {
  connectSources.push(`https://${firebaseAuthDomain}`);
}

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.gstatic.com https://www.googleapis.com https://www.google.com https://www.recaptcha.net",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src ${dedupeSources(connectSources).join(" ")}`,
  "frame-src 'self' https://www.google.com https://www.recaptcha.net",
  "upgrade-insecure-requests"
].join("; ");

const securityHeaders = [
  {
    key: "X-Frame-Options",
    value: "DENY"
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff"
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin"
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()"
  },
  {
    key: "Content-Security-Policy",
    value: contentSecurityPolicy
  }
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders
      }
    ];
  }
};

export default nextConfig;

function getOrigin(url: string) {
  try {
    return new URL(url).origin;
  } catch {
    return "http://localhost:4000";
  }
}

function dedupeSources(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}
