import { Injectable } from "@nestjs/common";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/**
 * Hachage de mot de passe via scrypt (node:crypto, sans dépendance externe).
 * Format stocké : `scrypt$<saltHex>$<derivedHex>`.
 *
 * Suffisant pour le prototype. En production, envisager argon2 ou la
 * délégation à un fournisseur d'identité (Auth0 / WorkOS).
 */
@Injectable()
export class PasswordService {
  private readonly keyLength = 64;

  hash(password: string): string {
    const salt = randomBytes(16).toString("hex");
    const derived = scryptSync(password, salt, this.keyLength).toString("hex");
    return `scrypt$${salt}$${derived}`;
  }

  verify(password: string, stored: string): boolean {
    const parts = stored.split("$");
    const scheme = parts[0];
    const salt = parts[1];
    const derivedHex = parts[2];

    if (scheme !== "scrypt" || salt === undefined || derivedHex === undefined) {
      return false;
    }

    const derived = Buffer.from(derivedHex, "hex");
    const computed = scryptSync(password, salt, derived.length);

    return derived.length === computed.length && timingSafeEqual(derived, computed);
  }
}
