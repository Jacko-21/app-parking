import { Injectable } from "@nestjs/common";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { UserRole } from "@bingoz/domain";

export type AuthTokenPayload = {
  userId: string;
  tenantId: string;
  roles: UserRole[];
  /** Expiration en secondes epoch. */
  exp: number;
};

export type AuthTokenInput = {
  userId: string;
  tenantId: string;
  roles: UserRole[];
};

const VALID_ROLES: ReadonlyArray<UserRole> = ["admin", "gestionnaire", "agent"];

/**
 * Jeton applicatif signé (HMAC-SHA256, sans dépendance externe) au format
 * `base64url(payload).base64url(signature)`. Conçu pour le prototype : il
 * pourra être remplacé par un JWT issu d'Auth0 / WorkOS sans toucher au reste.
 */
@Injectable()
export class AuthTokenService {
  private readonly secret = process.env["AUTH_TOKEN_SECRET"] ?? "dev-insecure-secret-change-me";
  private readonly ttlSeconds = Number(process.env["AUTH_TOKEN_TTL"] ?? 60 * 60 * 8);

  sign(input: AuthTokenInput): string {
    const payload: AuthTokenPayload = {
      userId: input.userId,
      tenantId: input.tenantId,
      roles: input.roles,
      exp: this.nowInSeconds() + this.ttlSeconds,
    };

    const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
    return `${body}.${this.signature(body)}`;
  }

  verify(token: string): AuthTokenPayload | null {
    const separator = token.indexOf(".");
    if (separator <= 0) {
      return null;
    }

    const body = token.slice(0, separator);
    const providedSignature = token.slice(separator + 1);

    if (!this.signaturesMatch(providedSignature, this.signature(body))) {
      return null;
    }

    const payload = this.decodePayload(body);
    if (!payload || payload.exp < this.nowInSeconds()) {
      return null;
    }

    return payload;
  }

  private signature(body: string): string {
    return createHmac("sha256", this.secret).update(body).digest("base64url");
  }

  private signaturesMatch(a: string, b: string): boolean {
    const bufferA = Buffer.from(a);
    const bufferB = Buffer.from(b);
    return bufferA.length === bufferB.length && timingSafeEqual(bufferA, bufferB);
  }

  private decodePayload(body: string): AuthTokenPayload | null {
    try {
      const json: unknown = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
      return this.isPayload(json) ? json : null;
    } catch {
      return null;
    }
  }

  private isPayload(value: unknown): value is AuthTokenPayload {
    if (typeof value !== "object" || value === null) {
      return false;
    }

    const candidate = value as Record<string, unknown>;
    return (
      typeof candidate["userId"] === "string" &&
      typeof candidate["tenantId"] === "string" &&
      typeof candidate["exp"] === "number" &&
      Array.isArray(candidate["roles"]) &&
      candidate["roles"].every((role) => VALID_ROLES.includes(role as UserRole))
    );
  }

  private nowInSeconds(): number {
    return Math.floor(Date.now() / 1000);
  }
}
