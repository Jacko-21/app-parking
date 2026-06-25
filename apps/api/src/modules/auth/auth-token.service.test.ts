import { describe, expect, it } from "vitest";
import type { UserRole } from "@bingoz/domain";

import { AuthTokenService } from "./auth-token.service";

const roles: UserRole[] = ["admin", "gestionnaire"];

function makeService(ttlSeconds = "3600"): AuthTokenService {
  process.env["AUTH_TOKEN_SECRET"] = "test-secret";
  process.env["AUTH_TOKEN_TTL"] = ttlSeconds;
  return new AuthTokenService();
}

describe("AuthTokenService", () => {
  it("signe puis vérifie un jeton valide", () => {
    const service = makeService();
    const token = service.sign({ userId: "u1", tenantId: "t1", roles });

    const payload = service.verify(token);

    expect(payload).not.toBeNull();
    expect(payload?.userId).toBe("u1");
    expect(payload?.tenantId).toBe("t1");
    expect(payload?.roles).toEqual(roles);
  });

  it("rejette un jeton dont le corps a été altéré", () => {
    const service = makeService();
    const token = service.sign({ userId: "u1", tenantId: "t1", roles });
    const altered = `x${token.slice(1)}`;

    expect(service.verify(altered)).toBeNull();
  });

  it("rejette un jeton sans signature valide", () => {
    const service = makeService();
    const [body] = service.sign({ userId: "u1", tenantId: "t1", roles }).split(".");

    expect(service.verify(`${body}.signature-bidon`)).toBeNull();
  });

  it("rejette un jeton expiré", () => {
    const service = makeService("-10");
    const token = service.sign({ userId: "u1", tenantId: "t1", roles });

    expect(service.verify(token)).toBeNull();
  });
});
