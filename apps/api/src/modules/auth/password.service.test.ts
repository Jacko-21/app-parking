import { describe, expect, it } from "vitest";

import { PasswordService } from "./password.service";

describe("PasswordService", () => {
  const service = new PasswordService();

  it("hache puis vérifie un mot de passe correct", () => {
    const stored = service.hash("s3cret!");

    expect(stored.startsWith("scrypt$")).toBe(true);
    expect(service.verify("s3cret!", stored)).toBe(true);
  });

  it("rejette un mot de passe incorrect", () => {
    const stored = service.hash("s3cret!");

    expect(service.verify("mauvais", stored)).toBe(false);
  });

  it("rejette un format stocké invalide", () => {
    expect(service.verify("peu importe", "format-invalide")).toBe(false);
  });
});
