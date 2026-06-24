import { Injectable, UnauthorizedException } from "@nestjs/common";
import { asTenantId, type TenantContext } from "@bingoz/domain";

@Injectable()
export class TenantContextService {
  resolveFromDevHeader(headerValue: string | string[] | undefined): TenantContext {
    const tenantId = Array.isArray(headerValue) ? headerValue[0] : headerValue;

    if (!tenantId) {
      throw new UnauthorizedException("En développement, l'en-tête x-tenant-id est obligatoire.");
    }

    return {
      tenantId: asTenantId(tenantId),
      userId: "dev-user",
      roles: ["admin", "gestionnaire"],
    };
  }
}
