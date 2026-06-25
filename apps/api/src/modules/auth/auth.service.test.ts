import { UnauthorizedException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";

import { type PrismaService } from "../database/prisma.service";
import { AuthService } from "./auth.service";
import { type AuthTokenService } from "./auth-token.service";
import { type PasswordService } from "./password.service";

const validInput = { tenantSlug: "demo", email: "admin@demo.test", password: "s3cret!" };

function makeService(overrides?: {
  tenant?: unknown;
  user?: unknown;
  passwordValid?: boolean;
}) {
  const prisma = {
    tenant: {
      findUnique: vi.fn().mockResolvedValue(
        overrides?.tenant === undefined ? { id: "tenant_1", slug: "demo" } : overrides.tenant,
      ),
    },
    user: {
      findUnique: vi.fn().mockResolvedValue(
        overrides?.user === undefined
          ? { id: "user_1", email: "admin@demo.test", role: "admin", passwordHash: "scrypt$x$y" }
          : overrides.user,
      ),
    },
  } as unknown as PrismaService;

  const passwordService = {
    verify: vi.fn().mockReturnValue(overrides?.passwordValid ?? true),
  } as unknown as PasswordService;

  const authTokenService = {
    sign: vi.fn().mockReturnValue("signed-token"),
  } as unknown as AuthTokenService;

  return new AuthService(prisma, passwordService, authTokenService);
}

describe("AuthService", () => {
  it("authentifie un utilisateur valide et renvoie un jeton", async () => {
    const service = makeService();

    const result = await service.login(validInput);

    expect(result.token).toBe("signed-token");
    expect(result.user).toEqual({
      id: "user_1",
      email: "admin@demo.test",
      role: "admin",
      tenantId: "tenant_1",
      tenantSlug: "demo",
    });
  });

  it("refuse un tenant inconnu", async () => {
    const service = makeService({ tenant: null });

    await expect(service.login(validInput)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("refuse un mot de passe incorrect", async () => {
    const service = makeService({ passwordValid: false });

    await expect(service.login(validInput)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("refuse un utilisateur sans mot de passe défini", async () => {
    const service = makeService({
      user: { id: "user_1", email: "admin@demo.test", role: "admin", passwordHash: null },
    });

    await expect(service.login(validInput)).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
